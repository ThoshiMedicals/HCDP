import type { ApplicationProfile, UserInvitation } from "../contracts/identity-separation";
import type { BaseAccountRole } from "../contracts/base-role";
import { assertBaseAccountRole } from "../contracts/base-role";
import type { InvitationStatus } from "../contracts/statuses";
import { getEmailProvider } from "../email";
import {
  getAuthMemoryState,
  hashToken,
  newId,
  newRawToken,
  type AuthMemoryState,
} from "../repository/memory-store";
import { assertPermission, assertSameOrganisation } from "./authorization-service";
import { recordAccessChange } from "./access-audit-service";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function touchInvitation(inv: UserInvitation): UserInvitation {
  inv.updatedAt = new Date().toISOString();
  return inv;
}

function expireIfNeeded(inv: UserInvitation, now: Date): UserInvitation {
  if (
    ["Invited", "Delivered", "Ready to Send"].includes(inv.status) &&
    new Date(inv.expiresAt).getTime() <= now.getTime()
  ) {
    inv.status = "Expired";
    touchInvitation(inv);
  }
  return inv;
}

export function expireInvitations(state: AuthMemoryState = getAuthMemoryState()): UserInvitation[] {
  const now = new Date();
  for (const inv of state.invitations) expireIfNeeded(inv, now);
  return state.invitations.filter((i) => i.status === "Expired");
}

export type CreateInvitationInput = {
  actor: ApplicationProfile;
  email: string;
  displayName: string;
  organisationId: string;
  baseRole: BaseAccountRole;
  intendedRoleIds: string[];
  intendedClinicIds: string[];
  workforcePersonId?: string | null;
  managerProfileId?: string | null;
  requiresApproval?: boolean;
  initialStatus?: InvitationStatus;
};

export async function createAndSendInvitation(
  input: CreateInvitationInput,
  state: AuthMemoryState = getAuthMemoryState()
): Promise<{ invitation: UserInvitation; rawToken: string }> {
  assertPermission(input.actor, "users.invite");
  assertSameOrganisation(input.actor.organisationId, input.organisationId);
  const baseRole = assertBaseAccountRole(input.baseRole);

  const rawToken = newRawToken();
  const now = new Date();
  const invitation: UserInvitation = {
    id: newId("inv"),
    organisationId: input.organisationId,
    email: input.email.trim().toLowerCase(),
    displayName: input.displayName.trim(),
    baseRole,
    status: input.initialStatus ?? "Ready to Send",
    invitedBy: input.actor.id,
    profileId: null,
    tokenHash: hashToken(rawToken),
    expiresAt: new Date(now.getTime() + INVITE_TTL_MS).toISOString(),
    acceptedAt: null,
    cancelledAt: null,
    lastSentAt: null,
    sendAttempts: 0,
    intendedRoleIds: input.intendedRoleIds,
    intendedClinicIds: input.intendedClinicIds,
    requiresApproval: input.requiresApproval ?? false,
    workforcePersonId: input.workforcePersonId ?? null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  const profile: ApplicationProfile = {
    id: newId("profile"),
    organisationId: input.organisationId,
    authIdentityId: null,
    email: invitation.email,
    displayName: invitation.displayName,
    role: baseRole,
    status: "Invited",
    workforcePersonId: invitation.workforcePersonId,
    managerProfileId: input.managerProfileId ?? null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  invitation.profileId = profile.id;
  state.profiles.push(profile);
  state.memberships.push({
    id: newId("mem"),
    organisationId: input.organisationId,
    profileId: profile.id,
    membershipStatus: "active",
    effectiveFrom: now.toISOString().slice(0, 10),
    effectiveTo: null,
  });
  state.invitations.push(invitation);

  recordAccessChange(
    {
      organisationId: input.organisationId,
      actorProfileId: input.actor.id,
      subjectProfileId: profile.id,
      changeType: "invitation.created",
      entityType: "user_invitation",
      entityId: invitation.id,
      beforeState: null,
      afterState: {
        email: invitation.email,
        status: invitation.status,
        baseRole,
        workforcePersonId: invitation.workforcePersonId,
      },
      reason: "Administrator Add User invitation",
    },
    state
  );

  await sendInvitationEmail(invitation, rawToken, state);
  return { invitation, rawToken };
}

export async function sendInvitationEmail(
  invitation: UserInvitation,
  rawToken: string,
  state: AuthMemoryState = getAuthMemoryState()
): Promise<UserInvitation> {
  expireIfNeeded(invitation, new Date());
  if (["Cancelled", "Expired", "Accepted"].includes(invitation.status)) {
    throw new Error(`Cannot send invitation in status ${invitation.status}`);
  }

  const provider = getEmailProvider();
  const result = await provider.send({
    to: invitation.email,
    subject: "You're invited to Healthcare Doctors Pulse",
    text: `Hello ${invitation.displayName},\n\nAn administrator invited you to Healthcare Doctors Pulse.\nUse this one-time setup token to create your password: ${rawToken}\nExpires: ${invitation.expiresAt}\n\nThis is first-time password setup, not password recovery.\n`,
    purpose: "invitation",
  });

  invitation.sendAttempts += 1;
  invitation.lastSentAt = new Date().toISOString();
  invitation.status = result.ok
    ? invitation.status === "Ready to Send" || invitation.status === "Draft"
      ? "Invited"
      : "Delivered"
    : "Failed";
  touchInvitation(invitation);

  recordAccessChange(
    {
      organisationId: invitation.organisationId,
      actorProfileId: invitation.invitedBy,
      subjectProfileId: invitation.profileId,
      changeType: result.ok ? "invitation.sent" : "invitation.send_failed",
      entityType: "user_invitation",
      entityId: invitation.id,
      beforeState: null,
      afterState: { status: invitation.status, providerId: result.id },
      reason: result.error ?? null,
    },
    state
  );

  return invitation;
}

export async function resendInvitation(
  actor: ApplicationProfile,
  invitationId: string,
  state: AuthMemoryState = getAuthMemoryState()
): Promise<{ invitation: UserInvitation; rawToken: string }> {
  assertPermission(actor, "users.invite");
  const invitation = state.invitations.find((i) => i.id === invitationId);
  if (!invitation) throw new Error("Invitation not found");
  assertSameOrganisation(actor.organisationId, invitation.organisationId);
  expireIfNeeded(invitation, new Date());
  if (invitation.status === "Cancelled" || invitation.status === "Accepted") {
    throw new Error(`Cannot resend invitation in status ${invitation.status}`);
  }
  if (invitation.status === "Expired") {
    invitation.expiresAt = new Date(Date.now() + INVITE_TTL_MS).toISOString();
    invitation.status = "Ready to Send";
  }
  const rawToken = newRawToken();
  invitation.tokenHash = hashToken(rawToken);
  touchInvitation(invitation);
  await sendInvitationEmail(invitation, rawToken, state);
  return { invitation, rawToken };
}

export function cancelInvitation(
  actor: ApplicationProfile,
  invitationId: string,
  state: AuthMemoryState = getAuthMemoryState()
): UserInvitation {
  assertPermission(actor, "users.invite");
  const invitation = state.invitations.find((i) => i.id === invitationId);
  if (!invitation) throw new Error("Invitation not found");
  assertSameOrganisation(actor.organisationId, invitation.organisationId);
  if (invitation.status === "Accepted") throw new Error("Cannot cancel accepted invitation");
  const before = invitation.status;
  invitation.status = "Cancelled";
  invitation.cancelledAt = new Date().toISOString();
  touchInvitation(invitation);
  if (invitation.profileId) {
    const profile = state.profiles.find((p) => p.id === invitation.profileId);
    if (profile && profile.status === "Invited") {
      profile.status = "Archived";
      profile.updatedAt = new Date().toISOString();
    }
  }
  recordAccessChange(
    {
      organisationId: invitation.organisationId,
      actorProfileId: actor.id,
      subjectProfileId: invitation.profileId,
      changeType: "invitation.cancelled",
      entityType: "user_invitation",
      entityId: invitation.id,
      beforeState: { status: before },
      afterState: { status: "Cancelled" },
      reason: "Administrator cancelled invitation",
    },
    state
  );
  return invitation;
}

export type AcceptInvitationInput = {
  rawToken: string;
  password: string;
};

/**
 * First-time password setup from invitation.
 * Password is never stored in application tables or shown to administrators.
 */
export function acceptInvitation(
  input: AcceptInvitationInput,
  state: AuthMemoryState = getAuthMemoryState()
): { invitation: UserInvitation; profile: ApplicationProfile } {
  if (!input.password || input.password.length < 10) {
    throw new Error("Password must be at least 10 characters");
  }
  const tokenHash = hashToken(input.rawToken);
  const invitation = state.invitations.find((i) => i.tokenHash === tokenHash);
  if (!invitation) throw new Error("Invalid invitation token");
  expireIfNeeded(invitation, new Date());
  if (invitation.status === "Expired") throw new Error("Invitation expired");
  if (invitation.status === "Cancelled") throw new Error("Invitation cancelled");
  if (invitation.status === "Accepted") throw new Error("Invitation already accepted");
  if (!["Invited", "Delivered", "Ready to Send"].includes(invitation.status)) {
    throw new Error(`Invitation not acceptable in status ${invitation.status}`);
  }

  const profile = state.profiles.find((p) => p.id === invitation.profileId);
  if (!profile) throw new Error("Invitation profile missing");

  const authIdentityId = newId("auth");
  state.identities.push({
    id: authIdentityId,
    email: profile.email,
    passwordEstablished: true,
    status: "active",
    createdAt: new Date().toISOString(),
  });

  invitation.status = "Accepted";
  invitation.acceptedAt = new Date().toISOString();
  touchInvitation(invitation);

  profile.authIdentityId = authIdentityId;
  profile.status = invitation.requiresApproval ? "Pending Approval" : "Active";
  profile.updatedAt = new Date().toISOString();

  for (const roleId of invitation.intendedRoleIds) {
    state.roleAssignments.push({
      id: newId("ura"),
      profileId: profile.id,
      roleId,
      organisationId: invitation.organisationId,
      clinicId: invitation.intendedClinicIds[0] ?? null,
      effectiveFrom: new Date().toISOString(),
      effectiveTo: null,
      assignedBy: invitation.invitedBy,
      reason: "Invitation acceptance",
    });
  }
  for (const clinicId of invitation.intendedClinicIds) {
    state.clinicAccess.push({
      id: newId("uca"),
      profileId: profile.id,
      clinicId,
      organisationId: invitation.organisationId,
      accessLevel: "standard",
      effectiveFrom: new Date().toISOString(),
      effectiveTo: null,
      assignedBy: invitation.invitedBy,
      reason: "Invitation acceptance",
    });
  }

  recordAccessChange(
    {
      organisationId: invitation.organisationId,
      actorProfileId: profile.id,
      subjectProfileId: profile.id,
      changeType: "invitation.accepted",
      entityType: "user_invitation",
      entityId: invitation.id,
      beforeState: { status: "Invited" },
      afterState: {
        status: "Accepted",
        profileStatus: profile.status,
        authIdentityId,
        note: "Password established; not recorded",
      },
      reason: "User created password from invitation",
    },
    state
  );

  return { invitation, profile };
}
