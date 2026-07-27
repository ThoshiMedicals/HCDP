/**
 * Server-only AuthAdminAdapter — current stack foundation implementation.
 * Privileged operations must never run in browser code.
 */

import type { ApplicationProfile, UserInvitation } from "../contracts/identity-separation";
import type { BaseAccountRole } from "../contracts/base-role";
import { assertBaseAccountRole } from "../contracts/base-role";
import {
  getAuthMemoryState,
  newId,
  type AuthMemoryState,
} from "../repository/memory-store";
import {
  cancelInvitation,
  createAndSendInvitation,
  expireInvitations,
  resendInvitation,
} from "../services/invitation-service";
import {
  requestPasswordReset,
  restoreProfileLogin,
  suspendProfileLogin,
} from "../services/password-reset-service";
import { assertPermission, profileCanAccessPlatform } from "../services/authorization-service";

export type SafeAccountStatus = {
  profileId: string;
  email: string;
  baseRole: BaseAccountRole;
  status: ApplicationProfile["status"];
  authIdentityId: string | null;
  passwordEstablished: boolean;
  workforcePersonId: string | null;
  canAccessPlatform: boolean;
};

export type CreateInvitedIdentityInput = {
  actor: ApplicationProfile;
  email: string;
  displayName: string;
  organisationId: string;
  baseRole: BaseAccountRole;
  workforcePersonId?: string | null;
  managerProfileId?: string | null;
  intendedDetailedRoleIds?: string[];
  intendedClinicIds?: string[];
  requiresApproval?: boolean;
};

export interface AuthAdminAdapter {
  createInvitedIdentity(input: CreateInvitedIdentityInput): Promise<{
    invitation: UserInvitation;
    profile: ApplicationProfile;
    rawToken: string;
  }>;
  sendPasswordSetupInvitation(actor: ApplicationProfile, invitationId: string): Promise<UserInvitation>;
  resendInvitation(actor: ApplicationProfile, invitationId: string): Promise<{ invitation: UserInvitation; rawToken: string }>;
  cancelInvitation(actor: ApplicationProfile, invitationId: string): Promise<UserInvitation>;
  expireInvitation(invitationId: string): Promise<UserInvitation | null>;
  sendPasswordResetLink(email: string): Promise<{ sent: boolean }>;
  suspendAccount(actor: ApplicationProfile, profileId: string): Promise<ApplicationProfile>;
  restoreAccount(actor: ApplicationProfile, profileId: string): Promise<ApplicationProfile>;
  revokeActiveSessions(actor: ApplicationProfile, profileId: string): Promise<void>;
  readSafeAccountStatus(profileId: string): SafeAccountStatus | null;
}

export function createAuthAdminAdapter(
  state: AuthMemoryState = getAuthMemoryState()
): AuthAdminAdapter {
  if (typeof window !== "undefined") {
    throw new Error("AuthAdminAdapter is server-only");
  }

  return {
    async createInvitedIdentity(input) {
      assertBaseAccountRole(input.baseRole);
      const { invitation, rawToken } = await createAndSendInvitation(
        {
          actor: input.actor,
          email: input.email,
          displayName: input.displayName,
          organisationId: input.organisationId,
          baseRole: input.baseRole,
          intendedRoleIds: input.intendedDetailedRoleIds ?? [],
          intendedClinicIds: input.intendedClinicIds ?? [],
          workforcePersonId: input.workforcePersonId ?? null,
          managerProfileId: input.managerProfileId ?? null,
          requiresApproval: input.requiresApproval ?? false,
        },
        state
      );
      const profile = state.profiles.find((p) => p.id === invitation.profileId);
      if (!profile) throw new Error("Profile missing after invite");
      return { invitation, profile, rawToken };
    },

    async sendPasswordSetupInvitation(actor, invitationId) {
      const resent = await resendInvitation(actor, invitationId, state);
      return resent.invitation;
    },

    async resendInvitation(actor, invitationId) {
      return resendInvitation(actor, invitationId, state);
    },

    async cancelInvitation(actor, invitationId) {
      return cancelInvitation(actor, invitationId, state);
    },

    async expireInvitation(invitationId) {
      return expireInvitations(state).find((i) => i.id === invitationId) ?? null;
    },

    async sendPasswordResetLink(email) {
      const result = await requestPasswordReset(email, state);
      return { sent: result.sent };
    },

    async suspendAccount(actor, profileId) {
      return suspendProfileLogin(actor, profileId, state);
    },

    async restoreAccount(actor, profileId) {
      return restoreProfileLogin(actor, profileId, state);
    },

    async revokeActiveSessions(actor, profileId) {
      assertPermission(actor, "users.manage");
      const profile = state.profiles.find((p) => p.id === profileId);
      if (!profile) throw new Error("Profile not found");
      if (profile.authIdentityId) {
        state.revokedSessions.push(profile.authIdentityId);
        const identity = state.identities.find((i) => i.id === profile.authIdentityId);
        if (identity) identity.status = "revoked";
      }
    },

    readSafeAccountStatus(profileId) {
      const profile = state.profiles.find((p) => p.id === profileId);
      if (!profile) return null;
      const identity = profile.authIdentityId
        ? state.identities.find((i) => i.id === profile.authIdentityId)
        : null;
      const access = profileCanAccessPlatform(profile);
      return {
        profileId: profile.id,
        email: profile.email,
        baseRole: profile.role,
        status: profile.status,
        authIdentityId: profile.authIdentityId,
        passwordEstablished: Boolean(identity?.passwordEstablished),
        workforcePersonId: profile.workforcePersonId,
        canAccessPlatform: access.allowed,
      };
    },
  };
}

/** Convenience for tests — also exposes newId for session tagging. */
export function mintAuthIdentityId(): string {
  return newId("auth");
}
