export type EmailPurpose = "invitation" | "password_reset" | "notification";

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  purpose: EmailPurpose;
};

export type EmailSendResult = {
  ok: boolean;
  id: string;
  error?: string;
};

export interface EmailProvider {
  readonly name: string;
  send(message: EmailMessage): Promise<EmailSendResult>;
}
