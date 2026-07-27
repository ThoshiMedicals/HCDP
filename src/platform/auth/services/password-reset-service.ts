import type { ApplicationProfile } from "../contracts/identity-separation";
import { getEmailProvider } from "../email";
import {
  getAuthMemoryState,
  hashToken,
  newId,
  newRawToken,
  type AuthMemoryState,
} from "../repository/memory-store";
import {
  assertPermission,
  assertSameOrganisation,
  profileCanAccessPlatform,
} from "./authorization-service";
import { recordAccessChange } from "./access-audit-service";

const RESET_TTL_MS = 60 * 60 * 1000;

/** Separate from first-time invitation password setup. */
export async function requestPasswordReset(
  email: string,
  state: AuthMemoryState = getAuthMemoryState()
): Promise<{ sent: boolean; rawToken?: string }> {
  const normalized = email.trim().toLowerCase();
  const profile = state.profiles.find((p) => p.email === normalized);
  state.passwordResets.push({
    id: newId("pre"),
    organisationId: profile?.organisationId ?? null,
    profileId: profile?.id ?? null,
    email: normalized,
    eventType: "requested",
    createdAt: new Date().toISOString(),
  });

  if (!profile || !profile.authIdentityId) return { sent: true };

  const rawToken = newRawToken();
  state.passwordResetTokens.push({
    email: normalized,
    tokenHash: hashToken(rawToken),
    expiresAt: new Date(Date.now() + RESET_TTL_MS).toISOString(),
    profileId: profile.id,
    organisationId: profile.organisationId,
  });

  const result = await getEmailProvider().send({
    to: normalized,
    subject: "Reset your Healthcare Doctors Pulse password",
    text: `Use this one-time password recovery token: ${rawToken}\nExpires in 1 hour.\nThis is not a first-time invitation.\n`,
    purpose: "password_reset",
  });

  state.passwordResets.push({
    id: newId("pre"),
    organisationId: profile.organisationId,
    profileId: profile.id,
    email: normalized,
    eventType: result.ok ? "email_sent" : "failed",
    createdAt: new Date().toISOString(),
  });

  return { sent: true, rawToken };
}

export function confirmPasswordReset(
  input: { rawToken: string; newPassword: string },
  state: AuthMemoryState = getAuthMemoryState()
): { profile: ApplicationProfile } {
  if (!input.newPassword || input.newPassword.length < 10) {
    throw new Error("Password must be at least 10 characters");
  }
  const tokenHash = hashToken(input.rawToken);
  const token = state.passwordResetTokens.find((t) => t.tokenHash === tokenHash);
  if (!token) throw new Error("Invalid reset token");
  if (new Date(token.expiresAt).getTime() <= Date.now()) {
    state.passwordResets.push({
      id: newId("pre"),
      organisationId: token.organisationId,
      profileId: token.profileId,
      email: token.email,
      eventType: "expired",
      createdAt: new Date().toISOString(),
    });
    throw new Error("Reset token expired");
  }
  const profile = state.profiles.find((p) => p.id === token.profileId);
  if (!profile) throw new Error("Profile not found");

  state.passwordResetTokens = state.passwordResetTokens.filter((t) => t.tokenHash !== tokenHash);
  if (profile.authIdentityId) {
    const identity = state.identities.find((i) => i.id === profile.authIdentityId);
    if (identity) identity.passwordEstablished = true;
  }

  state.passwordResets.push({
    id: newId("pre"),
    organisationId: profile.organisationId,
    profileId: profile.id,
    email: profile.email,
    eventType: "completed",
    createdAt: new Date().toISOString(),
  });

  return { profile };
}

export function suspendProfileLogin(
  actor: ApplicationProfile,
  subjectProfileId: string,
  state: AuthMemoryState = getAuthMemoryState()
): ApplicationProfile {
  assertPermission(actor, "users.manage");
  const subject = state.profiles.find((p) => p.id === subjectProfileId);
  if (!subject) throw new Error("Subject not found");
  assertSameOrganisation(actor.organisationId, subject.organisationId);
  const before = subject.status;
  subject.status = "Suspended";
  subject.updatedAt = new Date().toISOString();
  if (subject.authIdentityId) {
    const identity = state.identities.find((i) => i.id === subject.authIdentityId);
    if (identity) identity.status = "suspended";
  }
  recordAccessChange(
    {
      organisationId: subject.organisationId,
      actorProfileId: actor.id,
      subjectProfileId: subject.id,
      changeType: "profile.suspended",
      entityType: "profile",
      entityId: subject.id,
      beforeState: { status: before },
      afterState: { status: "Suspended", workforcePersonId: subject.workforcePersonId },
      reason: "Administrator suspended login",
    },
    state
  );
  return subject;
}

export function restoreProfileLogin(
  actor: ApplicationProfile,
  subjectProfileId: string,
  state: AuthMemoryState = getAuthMemoryState()
): ApplicationProfile {
  assertPermission(actor, "users.manage");
  const subject = state.profiles.find((p) => p.id === subjectProfileId);
  if (!subject) throw new Error("Subject not found");
  assertSameOrganisation(actor.organisationId, subject.organisationId);
  const before = subject.status;
  subject.status = "Active";
  subject.updatedAt = new Date().toISOString();
  if (subject.authIdentityId) {
    const identity = state.identities.find((i) => i.id === subject.authIdentityId);
    if (identity) identity.status = "active";
  }
  recordAccessChange(
    {
      organisationId: subject.organisationId,
      actorProfileId: actor.id,
      subjectProfileId: subject.id,
      changeType: "profile.restored",
      entityType: "profile",
      entityId: subject.id,
      beforeState: { status: before },
      afterState: { status: "Active" },
      reason: "Administrator restored login",
    },
    state
  );
  return subject;
}

export function removeLoginAccessPreservingWorkforce(
  actor: ApplicationProfile,
  subjectProfileId: string,
  state: AuthMemoryState = getAuthMemoryState()
): ApplicationProfile {
  assertPermission(actor, "users.manage");
  const subject = state.profiles.find((p) => p.id === subjectProfileId);
  if (!subject) throw new Error("Subject not found");
  assertSameOrganisation(actor.organisationId, subject.organisationId);
  const workforceId = subject.workforcePersonId;
  if (subject.authIdentityId) {
    const identity = state.identities.find((i) => i.id === subject.authIdentityId);
    if (identity) identity.status = "revoked";
  }
  subject.authIdentityId = null;
  subject.status = "Archived";
  subject.updatedAt = new Date().toISOString();
  subject.workforcePersonId = workforceId;
  const access = profileCanAccessPlatform(subject);
  if (access.allowed) throw new Error("Archived profile must not access platform");
  recordAccessChange(
    {
      organisationId: subject.organisationId,
      actorProfileId: actor.id,
      subjectProfileId: subject.id,
      changeType: "profile.login_removed",
      entityType: "profile",
      entityId: subject.id,
      beforeState: null,
      afterState: { status: "Archived", workforcePersonId: workforceId },
      reason: "Login removed; workforce history retained",
    },
    state
  );
  return subject;
}
