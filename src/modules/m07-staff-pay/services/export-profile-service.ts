/**
 * Versioned export-profile configuration (Batch 1).
 * Pay admin owns create/version/activate/retire. Operator select-only comes in later export batch.
 */

import {
  assertM07LegalEntityScope,
  assertM07Permission,
  hasM07Permission,
  M07ValidationError,
  type M07Actor,
} from "../permissions";
import {
  getExportProfile,
  listExportProfiles,
  newExportProfileId,
  upsertExportProfile,
} from "../repository/local-store";
import type { ExportProfile } from "../types/domain";
import { recordM07Audit } from "./audit-service";
import { assertNoLockedPeriodsForLegalEntity } from "./period-lock-guard";
import { assertNoProhibitedFields } from "./sensitive-fields";

export function listExportProfilesForEntity(
  actor: M07Actor,
  legalEntityId: string
): ExportProfile[] {
  assertM07Permission(actor, "payroll.view");
  assertM07LegalEntityScope(actor, legalEntityId);
  return listExportProfiles(legalEntityId);
}

export function createExportProfile(
  actor: M07Actor,
  input: {
    legalEntityId: string;
    name: string;
    schemaVersion?: string;
    includeNames?: boolean;
    includeRatesOrMoney?: boolean;
    piiClassification?: ExportProfile["piiClassification"];
    includedFields?: string[];
    requiredPermissions?: string[];
    externalFieldMappings?: Record<string, string>;
    validationRules?: string[];
    effectiveFrom: string;
    effectiveTo?: string | null;
    isDefaultMinimumPii?: boolean;
  }
): ExportProfile {
  assertM07Permission(actor, "payroll.export.profile.edit");
  assertM07LegalEntityScope(actor, input.legalEntityId);
  assertNoProhibitedFields(input);

  if (input.includeRatesOrMoney) {
    if (!hasM07Permission(actor, "payroll.rate.view")) {
      throw new M07ValidationError(
        "permission-denied",
        "Rate/money export profiles require payroll.rate.view on the configuring actor"
      );
    }
  }

  assertNoLockedPeriodsForLegalEntity(
    actor,
    input.legalEntityId,
    "export-profile-create",
    input.effectiveFrom,
    input.effectiveTo ?? null
  );

  const now = new Date().toISOString();
  const profile: ExportProfile = {
    id: newExportProfileId(),
    legalEntityId: input.legalEntityId,
    name: input.name,
    schemaVersion: input.schemaVersion ?? "csv-json-v1",
    includeNames: input.includeNames ?? false,
    includeRatesOrMoney: input.includeRatesOrMoney ?? false,
    piiClassification: input.piiClassification ?? (input.isDefaultMinimumPii ? "minimum" : "standard"),
    includedFields: input.includedFields ?? [
      "externalPayrollEmployeeId",
      "periodRef",
      "approvedHours",
      "lineClassification",
      "externalCode",
      "sourceRef",
      "reconRef",
    ],
    requiredPermissions: input.requiredPermissions ?? ["payroll.export.create"],
    externalFieldMappings: input.externalFieldMappings ?? {},
    validationRules: input.validationRules ?? ["reject-prohibited-identifiers"],
    effectiveFrom: input.effectiveFrom,
    effectiveTo: input.effectiveTo ?? null,
    status: "active",
    version: 1,
    isDefaultMinimumPii: input.isDefaultMinimumPii ?? false,
    createdAt: now,
    updatedAt: now,
    createdBy: actor.userId,
    updatedBy: actor.userId,
  };
  upsertExportProfile(profile);
  recordM07Audit({
    actor,
    action: "export-profile.create",
    entityType: "export-profile",
    entityId: profile.id,
    legalEntityId: profile.legalEntityId,
    after: profile,
  });
  return profile;
}

export function versionExportProfile(
  actor: M07Actor,
  profileId: string,
  patch: Partial<
    Pick<
      ExportProfile,
      | "name"
      | "schemaVersion"
      | "includeNames"
      | "includeRatesOrMoney"
      | "piiClassification"
      | "includedFields"
      | "requiredPermissions"
      | "externalFieldMappings"
      | "validationRules"
      | "effectiveFrom"
      | "effectiveTo"
      | "status"
    >
  >
): ExportProfile {
  assertM07Permission(actor, "payroll.export.profile.edit");
  assertNoProhibitedFields(patch);
  const existing = getExportProfile(profileId);
  if (!existing) throw new M07ValidationError("not-found", `Export profile ${profileId} not found`);
  if (existing.legalEntityId !== "*") {
    assertM07LegalEntityScope(actor, existing.legalEntityId);
  }
  const updated: ExportProfile = {
    ...existing,
    ...patch,
    version: existing.version + 1,
    updatedAt: new Date().toISOString(),
    updatedBy: actor.userId,
  };
  if (existing.legalEntityId !== "*") {
    assertNoLockedPeriodsForLegalEntity(
      actor,
      existing.legalEntityId,
      "export-profile-version",
      patch.effectiveFrom ?? existing.effectiveFrom,
      patch.effectiveTo !== undefined ? patch.effectiveTo : existing.effectiveTo
    );
  }
  upsertExportProfile(updated);
  recordM07Audit({
    actor,
    action: "export-profile.version",
    entityType: "export-profile",
    entityId: updated.id,
    legalEntityId: updated.legalEntityId === "*" ? "platform" : updated.legalEntityId,
    before: existing,
    after: updated,
  });
  return updated;
}

export function activateExportProfile(actor: M07Actor, profileId: string): ExportProfile {
  return versionExportProfile(actor, profileId, { status: "active" });
}

export function retireExportProfile(actor: M07Actor, profileId: string, reason: string): ExportProfile {
  const updated = versionExportProfile(actor, profileId, { status: "retired" });
  recordM07Audit({
    actor,
    action: "export-profile.retire",
    entityType: "export-profile",
    entityId: updated.id,
    legalEntityId: updated.legalEntityId === "*" ? "platform" : updated.legalEntityId,
    reason,
  });
  return updated;
}

/** Select-only helper — does not mutate profile (operator path foundation). */
export function selectActiveExportProfile(
  actor: M07Actor,
  legalEntityId: string,
  profileId: string
): ExportProfile {
  assertM07Permission(actor, "payroll.view");
  assertM07LegalEntityScope(actor, legalEntityId);
  const profile = getExportProfile(profileId);
  if (!profile) throw new M07ValidationError("not-found", `Export profile ${profileId} not found`);
  if (profile.status !== "active") {
    throw new M07ValidationError("export-profile-inactive", "Profile is not active");
  }
  if (profile.legalEntityId !== "*" && profile.legalEntityId !== legalEntityId) {
    throw new M07ValidationError("legal-entity-denied", "Profile not applicable to legal entity");
  }
  // Operator must not alter — return frozen snapshot copy
  return { ...profile, externalFieldMappings: { ...profile.externalFieldMappings } };
}
