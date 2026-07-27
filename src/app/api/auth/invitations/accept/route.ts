import { NextResponse } from "next/server";
import { acceptInvitation } from "@/platform/auth/services/invitation-service";

export const runtime = "nodejs";

/**
 * POST /api/auth/invitations/accept
 * First-time password setup from invitation (not password recovery).
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      token?: string;
      password?: string;
    };
    if (!body.token || !body.password) {
      return NextResponse.json({ error: "token and password required" }, { status: 400 });
    }
    const result = acceptInvitation({
      rawToken: body.token,
      password: body.password,
    });
    return NextResponse.json({
      invitationId: result.invitation.id,
      invitationStatus: result.invitation.status,
      profileId: result.profile.id,
      profileStatus: result.profile.status,
      baseRole: result.profile.role,
      note: "Password established for auth identity; never stored in application tables or shown to administrators.",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Accept failed" },
      { status: 400 }
    );
  }
}
