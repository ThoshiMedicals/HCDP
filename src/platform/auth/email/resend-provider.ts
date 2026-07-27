import type { EmailMessage, EmailProvider, EmailSendResult } from "./types";

/**
 * Production Resend provider — requires RESEND_API_KEY (server-only).
 * Not activated until AUTH_EMAIL_PROVIDER=resend.
 */
export class ResendEmailProvider implements EmailProvider {
  readonly name = "resend";

  constructor(
    private readonly apiKey: string,
    private readonly fromAddress: string
  ) {}

  async send(message: EmailMessage): Promise<EmailSendResult> {
    if (!this.apiKey) {
      return { ok: false, id: "resend_missing_key", error: "RESEND_API_KEY not configured" };
    }
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: this.fromAddress,
          to: [message.to],
          subject: message.subject,
          text: message.text,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
      if (!res.ok) {
        return { ok: false, id: "resend_error", error: body.message ?? res.statusText };
      }
      return { ok: true, id: body.id ?? "resend_ok" };
    } catch (e) {
      return {
        ok: false,
        id: "resend_exception",
        error: e instanceof Error ? e.message : "Resend failed",
      };
    }
  }
}
