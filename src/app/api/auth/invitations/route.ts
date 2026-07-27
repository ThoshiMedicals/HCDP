import { NextResponse } from "next/server";
import { authorizeApiAction } from "@/platform/auth/services/authorization-service";
import { createAuthAdminAdapter } from "@/platform/auth/services/auth-admin-adapter";
import { getAuthMemoryState } from "@/platform/auth/repository/memory-store";
import { assertBaseAccountRole } from "@/platform/auth/contracts/base-role";
import { isDemoIdentityMode } from "@/platform/auth/demo/demo-isolation";

export const runtime = "nodejs";

/**
 * POST /api/auth/invitations — administrator Add User / invite only.
 * Public self-registration is disabled.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      actorProfileId?: string;
      email?: string;
      displayName?: string;
      organisationId?: string;
      baseRole?: string;
      workforcePersonId?: string | null;
      managerProfileId?: string | null;
      intendedDetailedRoleIds?: string[];
      intendedClinicIds?: string[];
      requiresApproval?: boolean;
    };

    if (!body.actorProfileId || !body.email || !body.displayName || !body.organisationId || !body.baseRole) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const baseRole = assertBaseAccountRole(body.baseRole);
    const authz = authorizeApiAction({
      actorProfileId: body.actorProfileId,
      permission: "users.invite",
      targetOrganisationId: body.organisationId,
    });
    if (!authz.ok) {
      return NextResponse.json({ error: authz.error }, { status: 403 });
    }

    const admin = createAuthAdminAdapter();
    const { invitation, profile } = await admin.createInvitedIdentity({
      actor: authz.actor,
      email: body.email,
      displayName: body.displayName,
      organisationId: body.organisationId,
      baseRole,
      workforcePersonId: body.workforcePersonId,
      managerProfileId: body.managerProfileId,
      intendedDetailedRoleIds: body.intendedDetailedRoleIds,
      intendedClinicIds: body.intendedClinicIds,
      requiresApproval: body.requiresApproval,
    });

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        status: invitation.status,
        baseRole: invitation.baseRole,
        expiresAt: invitation.expiresAt,
        profileId: invitation.profileId,
      },
      profile: {
        id: profile.id,
        role: profile.role,
        status: profile.status,
        workforcePersonId: profile.workforcePersonId,
      },
      mode: isDemoIdentityMode() ? "foundation" : "production",
      note: "Password-setup token is emailed only; administrators never receive or store the user password.",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invitation failed" },
      { status: 400 }
    );
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const actorProfileId = url.searchParams.get("actorProfileId");
  const organisationId = url.searchParams.get("organisationId");
  if (!actorProfileId || !organisationId) {
    return NextResponse.json({ error: "actorProfileId and organisationId required" }, { status: 400 });
  }
  const authz = authorizeApiAction({
    actorProfileId,
    permission: "users.view",
    targetOrganisationId: organisationId,
  });
  if (!authz.ok) return NextResponse.json({ error: authz.error }, { status: 403 });

  const invitations = getAuthMemoryState()
    .invitations.filter((i) => i.organisationId === organisationId)
    .map((i) => ({
      id: i.id,
      email: i.email,
      status: i.status,
      baseRole: i.baseRole,
      expiresAt: i.expiresAt,
      profileId: i.profileId,
    }));
  return NextResponse.json({ invitations });
}
