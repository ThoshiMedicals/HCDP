import { NextResponse } from "next/server";
import { requestPasswordReset } from "@/platform/auth/services/password-reset-service";

export const runtime = "nodejs";

/** POST /api/auth/password-reset/request — body: { email } */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    if (!body.email) {
      return NextResponse.json({ error: "email required" }, { status: 400 });
    }
    await requestPasswordReset(body.email);
    return NextResponse.json({
      ok: true,
      message: "If an account exists, a reset link has been sent.",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Request failed" },
      { status: 400 }
    );
  }
}
