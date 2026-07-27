import { NextResponse } from "next/server";
import {
  authorizeApiAction,
  filterProfilesForOrganisation,
  getEffectivePermissionCodes,
  profileCanAccessPlatform,
} from "@/platform/auth/services/authorization-service";
import { getAuthMemoryState } from "@/platform/auth/repository/memory-store";
import type { PlatformPermissionCode } from "@/platform/auth/contracts/statuses";

export const runtime = "nodejs";

/**
 * POST /api/auth/authorize
 * Body: { actorProfileId, permission, targetOrganisationId? }
 * Proves UI hiding is not enough — API enforces permissions + org isolation.
 */
export async function POST(request: Request) {
  const body = (await request.json()) as {
    actorProfileId?: string;
    permission?: PlatformPermissionCode;
    targetOrganisationId?: string;
  };
  if (!body.actorProfileId || !body.permission) {
    return NextResponse.json({ error: "actorProfileId and permission required" }, { status: 400 });
  }
  const authz = authorizeApiAction({
    actorProfileId: body.actorProfileId,
    permission: body.permission,
    targetOrganisationId: body.targetOrganisationId,
  });
  if (!authz.ok) return NextResponse.json({ ok: false, error: authz.error }, { status: 403 });

  const state = getAuthMemoryState();
  const access = profileCanAccessPlatform(authz.actor);
  const visibleProfiles = filterProfilesForOrganisation(authz.actor, state).map((p) => ({
    id: p.id,
    email: p.email,
    organisationId: p.organisationId,
  }));

  return NextResponse.json({
    ok: true,
    access,
    permissions: getEffectivePermissionCodes(authz.actor.id),
    visibleProfiles,
  });
}
