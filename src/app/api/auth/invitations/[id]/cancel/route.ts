import { NextResponse } from "next/server";
import { authorizeApiAction } from "@/platform/auth/services/authorization-service";
import { cancelInvitation } from "@/platform/auth/services/invitation-service";
import { getAuthMemoryState } from "@/platform/auth/repository/memory-store";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = (await request.json()) as { actorProfileId?: string };
    if (!body.actorProfileId) {
      return NextResponse.json({ error: "actorProfileId required" }, { status: 400 });
    }
    const invitation = getAuthMemoryState().invitations.find((i) => i.id === id);
    if (!invitation) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const authz = authorizeApiAction({
      actorProfileId: body.actorProfileId,
      permission: "users.invite",
      targetOrganisationId: invitation.organisationId,
    });
    if (!authz.ok) return NextResponse.json({ error: authz.error }, { status: 403 });

    const cancelled = cancelInvitation(authz.actor, id);
    return NextResponse.json({
      invitation: { id: cancelled.id, status: cancelled.status },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Cancel failed" },
      { status: 400 }
    );
  }
}
