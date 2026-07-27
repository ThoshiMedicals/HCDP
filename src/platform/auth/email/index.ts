import { getConsoleEmailProvider } from "./console-provider";
import { ResendEmailProvider } from "./resend-provider";
import type { EmailProvider } from "./types";

export function getEmailProvider(): EmailProvider {
  const mode = (process.env.AUTH_EMAIL_PROVIDER ?? "console").toLowerCase();
  if (mode === "resend") {
    return new ResendEmailProvider(
      process.env.RESEND_API_KEY ?? "",
      process.env.AUTH_EMAIL_FROM ?? "Healthcare Doctors Pulse <noreply@example.com>"
    );
  }
  return getConsoleEmailProvider();
}

export * from "./types";
export * from "./console-provider";
export * from "./resend-provider";
