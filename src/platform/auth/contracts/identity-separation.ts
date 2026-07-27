/**
 * Identity separation contracts — do not collapse these into one table/column.
 */

import type { BaseAccountRole } from "./base-role";
import type { InvitationStatus, UserProvisioningStatus } from "./statuses";

export interface AuthAccountRef {
  /** External/demo auth subject — current stack has no local auth.users table. */
  authIdentityId: string;
  email: string;
}

export interface ApplicationProfile {
  id: string;
  organisationId: string;
  /** Unique external/demo identity subject (not a false FK). */
  authIdentityId: string | null;
  email: string;
  displayName: string;
  /** Validated base account role only — not the full access model. */
  role: BaseAccountRole;
  status: UserProvisioningStatus;
  /** Optional link to M04 workforce person — never the login row itself. */
  workforcePersonId: string | null;
  managerProfileId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrganisationMembership {
  id: string;
  organisationId: string;
  profileId: string;
  membershipStatus: "active" | "suspended" | "ended";
  effectiveFrom: string;
  effectiveTo: string | null;
}

export interface RoleRecord {
  id: string;
  organisationId: string;
  code: string;
  name: string;
  permissionCodes: string[];
}

export interface UserRoleAssignment {
  id: string;
  profileId: string;
  roleId: string;
  organisationId: string;
  clinicId: string | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  assignedBy: string | null;
  reason: string | null;
}

export interface UserClinicAccess {
  id: string;
  profileId: string;
  clinicId: string;
  organisationId: string;
  accessLevel: "read" | "standard" | "manager" | "admin";
  effectiveFrom: string;
  effectiveTo: string | null;
  assignedBy: string | null;
  reason: string | null;
}

export interface UserInvitation {
  id: string;
  organisationId: string;
  email: string;
  displayName: string;
  baseRole: BaseAccountRole;
  status: InvitationStatus;
  invitedBy: string;
  profileId: string | null;
  tokenHash: string;
  expiresAt: string;
  acceptedAt: string | null;
  cancelledAt: string | null;
  lastSentAt: string | null;
  sendAttempts: number;
  intendedRoleIds: string[];
  intendedClinicIds: string[];
  requiresApproval: boolean;
  workforcePersonId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AccessChangeHistoryEntry {
  id: string;
  organisationId: string;
  actorProfileId: string | null;
  subjectProfileId: string | null;
  changeType: string;
  entityType: string;
  entityId: string | null;
  beforeState: unknown;
  afterState: unknown;
  reason: string | null;
  createdAt: string;
}

export interface AccessReviewRecord {
  id: string;
  organisationId: string;
  subjectProfileId: string;
  reviewerProfileId: string | null;
  status: "Open" | "In Progress" | "Overdue" | "Completed" | "Cancelled";
  dueAt: string | null;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
}

export interface DelegationRecord {
  id: string;
  organisationId: string;
  fromProfileId: string;
  toProfileId: string;
  permissionCodes: string[];
  effectiveFrom: string;
  effectiveTo: string | null;
  reason: string | null;
  createdAt: string;
}

export interface PasswordResetEvent {
  id: string;
  organisationId: string | null;
  profileId: string | null;
  email: string;
  eventType: "requested" | "email_sent" | "completed" | "failed" | "expired";
  createdAt: string;
}

export type IdentityConcern =
  | "authentication_account"
  | "application_profile"
  | "workforce_person"
  | "employment_engagement"
  | "role_assignment"
  | "clinic_access";
