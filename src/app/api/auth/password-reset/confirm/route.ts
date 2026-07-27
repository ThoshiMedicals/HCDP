import { NextResponse } from "next/server";
import { confirmPasswordReset } from "@/platform/auth/services/password-reset-service";

export const runtime = "nodejs";

/** POST /api/auth/password-reset/confirm — body: { token, newPassword } */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { token?: string; newPassword?: string };
    if (!body.token || !body.newPassword) {
      return NextResponse.json({ error: "token and newPassword required" }, { status: 400 });
    }
    const result = confirmPasswordReset({
      rawToken: body.token,
      newPassword: body.newPassword,
    });
    return NextResponse.json({
      ok: true,
      profileId: result.profile.id,
      note: "Password updated on auth account; administrators cannot view the password.",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Confirm failed" },
      { status: 400 }
    );
  }
}
