import { createHash, randomBytes } from "node:crypto";
import type {
  AccessChangeHistoryEntry,
  ApplicationProfile,
  DelegationRecord,
  OrganisationMembership,
  PasswordResetEvent,
  RoleRecord,
  UserClinicAccess,
  UserInvitation,
  UserRoleAssignment,
  AccessReviewRecord,
} from "../contracts/identity-separation";

export type OrganisationRecord = {
  id: string;
  name: string;
  slug: string;
};

export type ClinicRecord = {
  id: string;
  organisationId: string;
  code: string;
  name: string;
};

export type AuthIdentityRecord = {
  id: string;
  email: string;
  /** Password hash never stored for demo foundation — presence means password established. */
  passwordEstablished: boolean;
  status: "invited" | "active" | "suspended" | "revoked";
  createdAt: string;
};

export type AuthMemoryState = {
  organisations: OrganisationRecord[];
  clinics: ClinicRecord[];
  identities: AuthIdentityRecord[];
  profiles: ApplicationProfile[];
  memberships: OrganisationMembership[];
  roles: RoleRecord[];
  roleAssignments: UserRoleAssignment[];
  clinicAccess: UserClinicAccess[];
  invitations: UserInvitation[];
  accessHistory: AccessChangeHistoryEntry[];
  accessReviews: AccessReviewRecord[];
  delegations: DelegationRecord[];
  passwordResets: PasswordResetEvent[];
  passwordResetTokens: Array<{
    email: string;
    tokenHash: string;
    expiresAt: string;
    profileId: string | null;
    organisationId: string | null;
  }>;
  revokedSessions: string[];
};

export function createEmptyAuthState(): AuthMemoryState {
  return {
    organisations: [],
    clinics: [],
    identities: [],
    profiles: [],
    memberships: [],
    roles: [],
    roleAssignments: [],
    clinicAccess: [],
    invitations: [],
    accessHistory: [],
    accessReviews: [],
    delegations: [],
    passwordResets: [],
    passwordResetTokens: [],
    revokedSessions: [],
  };
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function newRawToken(): string {
  return randomBytes(32).toString("hex");
}

export function newId(prefix: string): string {
  return `${prefix}_${randomBytes(8).toString("hex")}`;
}

let globalState = createEmptyAuthState();

export function getAuthMemoryState(): AuthMemoryState {
  return globalState;
}

export function resetAuthMemoryState(next?: AuthMemoryState) {
  globalState = next ?? createEmptyAuthState();
}

export function seedDemoAuthWorld(state: AuthMemoryState = createEmptyAuthState()): AuthMemoryState {
  const orgId = "org_hcdp";
  const clinicA = "clinic_chapel";
  const clinicB = "clinic_indooroopilly";
  const adminId = "profile_admin";
  const staffId = "profile_staff";
  const adminRoleId = "role_org_admin";
  const staffRoleId = "role_staff";
  const now = new Date().toISOString();

  state.organisations.push({ id: orgId, name: "Healthcare Doctors Group", slug: "hcdp" });
  state.organisations.push({ id: "org_other", name: "Other Org", slug: "other" });
  state.clinics.push(
    { id: clinicA, organisationId: orgId, code: "CH", name: "Chapel Hill" },
    { id: clinicB, organisationId: orgId, code: "IN", name: "Indooroopilly" },
    { id: "clinic_other", organisationId: "org_other", code: "XX", name: "Other Clinic" }
  );

  state.identities.push(
    {
      id: "auth_admin",
      email: "admin@hcdp.example",
      passwordEstablished: true,
      status: "active",
      createdAt: now,
    },
    {
      id: "auth_staff",
      email: "staff@hcdp.example",
      passwordEstablished: true,
      status: "active",
      createdAt: now,
    }
  );

  state.profiles.push(
    {
      id: adminId,
      organisationId: orgId,
      authIdentityId: "auth_admin",
      email: "admin@hcdp.example",
      displayName: "Org Admin",
      role: "admin",
      status: "Active",
      workforcePersonId: "person_admin",
      managerProfileId: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: staffId,
      organisationId: orgId,
      authIdentityId: "auth_staff",
      email: "staff@hcdp.example",
      displayName: "Ordinary Staff",
      role: "user",
      status: "Active",
      workforcePersonId: "person_staff",
      managerProfileId: adminId,
      createdAt: now,
      updatedAt: now,
    }
  );

  state.memberships.push(
    {
      id: "mem_admin",
      organisationId: orgId,
      profileId: adminId,
      membershipStatus: "active",
      effectiveFrom: "2020-01-01",
      effectiveTo: null,
    },
    {
      id: "mem_staff",
      organisationId: orgId,
      profileId: staffId,
      membershipStatus: "active",
      effectiveFrom: "2020-01-01",
      effectiveTo: null,
    }
  );

  state.roles.push(
    {
      id: adminRoleId,
      organisationId: orgId,
      code: "org_admin",
      name: "Organisation Administrator",
      permissionCodes: ["users.invite", "users.manage", "users.view", "roles.manage", "access.review", "org.admin"],
    },
    {
      id: staffRoleId,
      organisationId: orgId,
      code: "staff",
      name: "Staff Member",
      permissionCodes: ["users.view"],
    }
  );

  state.roleAssignments.push({
    id: "ura_admin",
    profileId: adminId,
    roleId: adminRoleId,
    organisationId: orgId,
    clinicId: null,
    effectiveFrom: "2020-01-01T00:00:00.000Z",
    effectiveTo: null,
    assignedBy: null,
    reason: "seed",
  });
  state.roleAssignments.push({
    id: "ura_staff",
    profileId: staffId,
    roleId: staffRoleId,
    organisationId: orgId,
    clinicId: clinicA,
    effectiveFrom: "2020-01-01T00:00:00.000Z",
    effectiveTo: null,
    assignedBy: adminId,
    reason: "seed clinic-scoped",
  });

  state.clinicAccess.push({
    id: "uca_staff",
    profileId: staffId,
    clinicId: clinicA,
    organisationId: orgId,
    accessLevel: "standard",
    effectiveFrom: "2020-01-01T00:00:00.000Z",
    effectiveTo: null,
    assignedBy: adminId,
    reason: "seed",
  });

  globalState = state;
  return state;
}
