import type { EmailMessage, EmailProvider, EmailSendResult } from "./types";

/** Development / foundation provider — logs only; never a production substitute. */
export class ConsoleEmailProvider implements EmailProvider {
  readonly name = "console";
  readonly sent: EmailMessage[] = [];

  async send(message: EmailMessage): Promise<EmailSendResult> {
    this.sent.push(message);
    if (typeof console !== "undefined") {
      console.info(`[auth-email:${message.purpose}] to=${message.to} subject=${message.subject}`);
    }
    return { ok: true, id: `console_${this.sent.length}` };
  }
}

let shared: ConsoleEmailProvider | null = null;

export function getConsoleEmailProvider(): ConsoleEmailProvider {
  if (!shared) shared = new ConsoleEmailProvider();
  return shared;
}

export function resetConsoleEmailProvider() {
  shared = new ConsoleEmailProvider();
  return shared;
}
