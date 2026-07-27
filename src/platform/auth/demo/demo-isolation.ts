/**
 * Demo Act-as isolation — must never become a production security bypass.
 */

export type AuthEnforcementMode = "demo" | "production";

export function getAuthEnforcementMode(): AuthEnforcementMode {
  const raw = (process.env.AUTH_ENFORCEMENT ?? process.env.NEXT_PUBLIC_AUTH_ENFORCEMENT ?? "demo").toLowerCase();
  return raw === "production" ? "production" : "demo";
}

export function isDemoIdentityMode(): boolean {
  return getAuthEnforcementMode() === "demo";
}

export function assertDemoActAsAllowed(): void {
  if (!isDemoIdentityMode()) {
    throw new Error(
      "Demo Act as User/Role is disabled when AUTH_ENFORCEMENT=production. Use real authentication sessions."
    );
  }
}

/** Banner / UI copy for shell — keep visible when demo mode is on. */
export const DEMO_ACT_AS_NOTICE =
  "Demonstration identity only — not production authentication. Do not treat Act as User/Role as a security control.";
