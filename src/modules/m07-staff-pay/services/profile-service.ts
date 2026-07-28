/**
 * Pay profile + external payroll employee ID services (Batch 1).
 */

import {
  assertM07ClinicScope,
  assertM07LegalEntityScope,
  assertM07Permission,
  hasM07Permission,
  M07ValidationError,
  type M07Actor,
} from "../permissions";
import {
  getProfile,
  listProfiles,
  newProfileId,
  upsertProfile,
} from "../repository/local-store";
import type { ExternalIdHistoryEntry, PayProfile } from "../types/domain";
import { recordM07Audit } from "./audit-service";
import { assertNoProhibitedFields } from "./sensitive-fields";
import { resolvePersonIdentity } from "../adapters/m04-person-read";
import {
  invalidateApprovalsForProfileMutation,
  isMaterialPayProfileChange,
} from "./approval-invalidation";

function redactProfile(actor: M07Actor, profile: PayProfile): PayProfile {
  const copy: PayProfile = { ...profile, externalPayrollEmployeeIdHistory: [...profile.externalPayrollEmployeeIdHistory] };
  if (!hasM07Permission(actor, "payroll.rate.view")) {
    copy.ordinaryHourlyRate = null;
  }
  if (!hasM07Permission(actor, "payroll.externalId.view")) {
    copy.externalPayrollEmployeeId = undefined;
    copy.externalPayrollEmployeeIdHistory = [];
  }
  return copy;
}

export function listPayProfiles(
  actor: M07Actor,
  legalEntityId: string
): PayProfile[] {
  assertM07Permission(actor, "payroll.view");
  assertM07LegalEntityScope(actor, legalEntityId);
  return listProfiles(legalEntityId).map((p) => redactProfile(actor, p));
}

export function getPayProfile(actor: M07Actor, profileId: string): PayProfile | null {
  assertM07Permission(actor, "payroll.view");
  const profile = getProfile(profileId);
  if (!profile) return null;
  assertM07LegalEntityScope(actor, profile.legalEntityId);
  assertM07ClinicScope(actor, [profile.clinicId]);
  return redactProfile(actor, profile);
}

export function createPayProfile(
  actor: M07Actor,
  input: {
    personId: string;
    legalEntityId: string;
    clinicId?: string;
    m04ClassificationRef?: string | null;
    preparationRuleId?: string | null;
    preparationRuleVersion?: number | null;
    ordinaryHourlyRate?: number | null;
    allowanceCodes?: string[];
    deductionCodes?: string[];
    effectiveFrom: string;
    effectiveTo?: string | null;
  }
): PayProfile {
  assertM07Permission(actor, "payroll.profile.edit");
  assertM07LegalEntityScope(actor, input.legalEntityId);
  assertM07ClinicScope(actor, [input.clinicId]);
  assertNoProhibitedFields(input);

  const person = resolvePersonIdentity(input.personId);
  if (!person) {
    throw new M07ValidationError("missing-person", `M04 person not found: ${input.personId}`);
  }

  const now = new Date().toISOString();
  const profile: PayProfile = {
    id: newProfileId(),
    personId: input.personId,
    legalEntityId: input.legalEntityId,
    clinicId: input.clinicId,
    externalPayrollEmployeeId: null,
    externalPayrollEmployeeIdHistory: [],
    m04ClassificationRef: input.m04ClassificationRef ?? person.classificationRef ?? null,
    preparationRuleId: input.preparationRuleId ?? null,
    preparationRuleVersion: input.preparationRuleVersion ?? null,
    ordinaryHourlyRate: input.ordinaryHourlyRate ?? null,
    overtimeRulesRef: null,
    allowanceCodes: input.allowanceCodes ?? [],
    deductionCodes: input.deductionCodes ?? [],
    leavePayMapping: null,
    effectiveFrom: input.effectiveFrom,
    effectiveTo: input.effectiveTo ?? null,
    status: "active",
    version: 1,
    materialProfileRevision: 1,
    createdAt: now,
    updatedAt: now,
    createdBy: actor.userId,
    updatedBy: actor.userId,
  };

  upsertProfile(profile);
  recordM07Audit({
    actor,
    action: "profile.create",
    entityType: "pay-profile",
    entityId: profile.id,
    legalEntityId: profile.legalEntityId,
    clinicId: profile.clinicId,
    after: redactProfile(actor, profile),
  });
  invalidateApprovalsForProfileMutation(actor, {
    legalEntityId: profile.legalEntityId,
    personId: profile.personId,
    reason: "profile-create",
    populationChanging: true,
  });
  return redactProfile(actor, profile);
}

export function updatePayProfile(
  actor: M07Actor,
  profileId: string,
  patch: Partial<Omit<PayProfile, "id" | "legalEntityId" | "createdAt" | "createdBy" | "externalPayrollEmployeeId" | "externalPayrollEmployeeIdHistory">>
): PayProfile {
  assertM07Permission(actor, "payroll.profile.edit");
  assertNoProhibitedFields(patch);
  const existing = getProfile(profileId);
  if (!existing) throw new M07ValidationError("not-found", `Profile ${profileId} not found`);
  assertM07LegalEntityScope(actor, existing.legalEntityId);
  assertM07ClinicScope(actor, [existing.clinicId, patch.clinicId]);

  const material = isMaterialPayProfileChange(existing, {
    ...existing,
    ...patch,
    id: existing.id,
    legalEntityId: existing.legalEntityId,
    externalPayrollEmployeeId: existing.externalPayrollEmployeeId,
    externalPayrollEmployeeIdHistory: existing.externalPayrollEmployeeIdHistory,
  });

  const updated: PayProfile = {
    ...existing,
    ...patch,
    id: existing.id,
    legalEntityId: existing.legalEntityId,
    externalPayrollEmployeeId: existing.externalPayrollEmployeeId,
    externalPayrollEmployeeIdHistory: existing.externalPayrollEmployeeIdHistory,
    version: existing.version + 1,
    materialProfileRevision: material
      ? existing.materialProfileRevision + 1
      : existing.materialProfileRevision,
    updatedAt: new Date().toISOString(),
    updatedBy: actor.userId,
  };
  upsertProfile(updated);
  recordM07Audit({
    actor,
    action: "profile.update",
    entityType: "pay-profile",
    entityId: updated.id,
    legalEntityId: updated.legalEntityId,
    before: redactProfile(actor, existing),
    after: redactProfile(actor, updated),
  });
  if (material) {
    invalidateApprovalsForProfileMutation(actor, {
      legalEntityId: updated.legalEntityId,
      personId: updated.personId,
      reason: "profile-update-material",
      populationChanging: existing.status !== updated.status,
    });
  }
  return redactProfile(actor, updated);
}

export function archivePayProfile(actor: M07Actor, profileId: string, reason: string): PayProfile {
  assertM07Permission(actor, "payroll.profile.edit");
  const existing = getProfile(profileId);
  if (!existing) throw new M07ValidationError("not-found", `Profile ${profileId} not found`);
  assertM07LegalEntityScope(actor, existing.legalEntityId);
  const updated: PayProfile = {
    ...existing,
    status: "archived",
    version: existing.version + 1,
    materialProfileRevision: existing.materialProfileRevision + 1,
    updatedAt: new Date().toISOString(),
    updatedBy: actor.userId,
  };
  upsertProfile(updated);
  recordM07Audit({
    actor,
    action: "profile.archive",
    entityType: "pay-profile",
    entityId: updated.id,
    legalEntityId: updated.legalEntityId,
    reason,
    before: existing,
    after: updated,
  });
  invalidateApprovalsForProfileMutation(actor, {
    legalEntityId: updated.legalEntityId,
    personId: updated.personId,
    reason: "profile-archive",
    populationChanging: true,
  });
  return redactProfile(actor, updated);
}

function assertExternalIdUnique(
  legalEntityId: string,
  externalId: string,
  excludingProfileId?: string
): void {
  const clash = listProfiles(legalEntityId).find(
    (p) =>
      p.status === "active" &&
      p.externalPayrollEmployeeId === externalId &&
      p.id !== excludingProfileId
  );
  if (clash) {
    throw new M07ValidationError(
      "external-id-not-unique",
      `External payroll employee id already used on profile ${clash.id}`
    );
  }
}

export function linkExternalPayrollEmployeeId(
  actor: M07Actor,
  profileId: string,
  externalPayrollEmployeeId: string,
  reason: string
): PayProfile {
  assertM07Permission(actor, "payroll.externalId.edit");
  if (!externalPayrollEmployeeId.trim()) {
    throw new M07ValidationError("validation", "externalPayrollEmployeeId required");
  }
  if (!reason.trim()) {
    throw new M07ValidationError("reason-required", "Reason is required for external payroll employee id changes");
  }
  assertNoProhibitedFields({ externalPayrollEmployeeId, reason });
  const existing = getProfile(profileId);
  if (!existing) throw new M07ValidationError("not-found", `Profile ${profileId} not found`);
  assertM07LegalEntityScope(actor, existing.legalEntityId);
  assertExternalIdUnique(existing.legalEntityId, externalPayrollEmployeeId, existing.id);

  const entry: ExternalIdHistoryEntry = {
    previousId: existing.externalPayrollEmployeeId ?? null,
    nextId: externalPayrollEmployeeId,
    actorUserId: actor.userId,
    reason,
    at: new Date().toISOString(),
  };
  const updated: PayProfile = {
    ...existing,
    externalPayrollEmployeeId,
    externalPayrollEmployeeIdHistory: [...existing.externalPayrollEmployeeIdHistory, entry],
    version: existing.version + 1,
    // External ID is not Batch 5 approval-authority — material revision unchanged.
    materialProfileRevision: existing.materialProfileRevision,
    updatedAt: entry.at,
    updatedBy: actor.userId,
  };
  upsertProfile(updated);
  recordM07Audit({
    actor,
    action: "profile.externalId.relink",
    entityType: "pay-profile",
    entityId: updated.id,
    legalEntityId: updated.legalEntityId,
    clinicId: updated.clinicId,
    reason,
    before: { externalPayrollEmployeeId: existing.externalPayrollEmployeeId },
    after: { externalPayrollEmployeeId, historyEntry: entry },
  });
  return redactProfile(actor, updated);
}

export function relinkExternalPayrollEmployeeId(
  actor: M07Actor,
  profileId: string,
  nextExternalId: string,
  reason: string
): PayProfile {
  return linkExternalPayrollEmployeeId(actor, profileId, nextExternalId, reason);
}
