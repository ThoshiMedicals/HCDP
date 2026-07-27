import type { ApplicationProfile, UserRoleAssignment } from "../contracts/identity-separation";
import {
  getAuthMemoryState,
  newId,
  type AuthMemoryState,
} from "../repository/memory-store";
import { assertPermission, assertSameOrganisation } from "./authorization-service";
import { recordAccessChange } from "./access-audit-service";

export function assignRole(
  actor: ApplicationProfile,
  input: {
    profileId: string;
    roleId: string;
    clinicId?: string | null;
    effectiveFrom: string;
    effectiveTo?: string | null;
    reason?: string;
  },
  state: AuthMemoryState = getAuthMemoryState()
): UserRoleAssignment {
  assertPermission(actor, "users.manage");
  const subject = state.profiles.find((p) => p.id === input.profileId);
  if (!subject) throw new Error("Subject not found");
  assertSameOrganisation(actor.organisationId, subject.organisationId);
  const role = state.roles.find((r) => r.id === input.roleId);
  if (!role || role.organisationId !== actor.organisationId) {
    throw new Error("Role not found in organisation");
  }

  const assignment: UserRoleAssignment = {
    id: newId("ura"),
    profileId: input.profileId,
    roleId: input.roleId,
    organisationId: actor.organisationId,
    clinicId: input.clinicId ?? null,
    effectiveFrom: input.effectiveFrom,
    effectiveTo: input.effectiveTo ?? null,
    assignedBy: actor.id,
    reason: input.reason ?? null,
  };
  state.roleAssignments.push(assignment);
  recordAccessChange(
    {
      organisationId: actor.organisationId,
      actorProfileId: actor.id,
      subjectProfileId: subject.id,
      changeType: "role.assigned",
      entityType: "user_role_assignment",
      entityId: assignment.id,
      beforeState: null,
      afterState: assignment,
      reason: input.reason ?? null,
    },
    state
  );
  return assignment;
}

export function assignClinicAccess(
  actor: ApplicationProfile,
  input: {
    profileId: string;
    clinicId: string;
    accessLevel: "read" | "standard" | "manager" | "admin";
    effectiveFrom: string;
    effectiveTo?: string | null;
    reason?: string;
  },
  state: AuthMemoryState = getAuthMemoryState()
) {
  assertPermission(actor, "users.manage");
  const subject = state.profiles.find((p) => p.id === input.profileId);
  if (!subject) throw new Error("Subject not found");
  assertSameOrganisation(actor.organisationId, subject.organisationId);
  const clinic = state.clinics.find((c) => c.id === input.clinicId);
  if (!clinic || clinic.organisationId !== actor.organisationId) {
    throw new Error("Clinic not found in organisation");
  }
  const row = {
    id: newId("uca"),
    profileId: input.profileId,
    clinicId: input.clinicId,
    organisationId: actor.organisationId,
    accessLevel: input.accessLevel,
    effectiveFrom: input.effectiveFrom,
    effectiveTo: input.effectiveTo ?? null,
    assignedBy: actor.id,
    reason: input.reason ?? null,
  };
  state.clinicAccess.push(row);
  recordAccessChange(
    {
      organisationId: actor.organisationId,
      actorProfileId: actor.id,
      subjectProfileId: subject.id,
      changeType: "clinic_access.assigned",
      entityType: "user_clinic_access",
      entityId: row.id,
      beforeState: null,
      afterState: row,
      reason: input.reason ?? null,
    },
    state
  );
  return row;
}
