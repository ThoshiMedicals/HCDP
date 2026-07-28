/**
 * Additive M07 schema v2 — Batch 1 collections.
 * Insert-if-absent; never wipes existing M07 data; never touches m04/m05/m06 keys.
 */

import { readJsonSafe, runMigrationOnce, writeJsonSafe } from "@/platform/storage/storage";
import { M07_MIGRATION_V2_ID, M07_STORAGE_KEYS } from "./keys";
import type { M07StorageMeta } from "./migrations";
import type { ExportProfile } from "../types/domain";
import { M07_NON_CERTIFIED_DISCLAIMER } from "../types/domain";

const V2_KEYS = [
  M07_STORAGE_KEYS.legalEntities,
  M07_STORAGE_KEYS.profiles,
  M07_STORAGE_KEYS.rules,
  M07_STORAGE_KEYS.classificationMaps,
  M07_STORAGE_KEYS.codes,
  M07_STORAGE_KEYS.exportProfiles,
  M07_STORAGE_KEYS.intake,
  M07_STORAGE_KEYS.exceptions,
  M07_STORAGE_KEYS.approvals,
  M07_STORAGE_KEYS.audit,
] as const;

function seedDefaultMinimumPiiProfileIfAbsent(): void {
  const list = readJsonSafe<ExportProfile[]>(M07_STORAGE_KEYS.exportProfiles, []);
  if (list.some((p) => p.isDefaultMinimumPii)) return;
  const now = new Date().toISOString();
  const seed: ExportProfile = {
    id: "expprof_default_min_pii",
    legalEntityId: "*",
    name: "Minimum PII (default)",
    schemaVersion: "csv-json-v1",
    includeNames: false,
    includeRatesOrMoney: false,
    piiClassification: "minimum",
    includedFields: [
      "externalPayrollEmployeeId",
      "periodRef",
      "approvedHours",
      "lineClassification",
      "externalCode",
      "sourceRef",
      "reconRef",
    ],
    requiredPermissions: ["payroll.export.create"],
    externalFieldMappings: {},
    validationRules: ["reject-prohibited-identifiers"],
    effectiveFrom: now.slice(0, 10),
    effectiveTo: null,
    status: "active",
    version: 1,
    isDefaultMinimumPii: true,
    createdAt: now,
    updatedAt: now,
    createdBy: "system",
    updatedBy: "system",
  };
  // Only insert when collection empty or no default — insert-if-absent by id
  if (!list.some((p) => p.id === seed.id)) {
    writeJsonSafe(M07_STORAGE_KEYS.exportProfiles, [...list, seed]);
  }
}

export function runM07SchemaV2Migration(): boolean {
  return runMigrationOnce(M07_MIGRATION_V2_ID, 1, () => {
    for (const key of V2_KEYS) {
      const cur = readJsonSafe<unknown[] | null>(key, null);
      if (cur == null) writeJsonSafe(key, []);
    }
    seedDefaultMinimumPiiProfileIfAbsent();
    const meta = readJsonSafe<M07StorageMeta | null>(M07_STORAGE_KEYS.meta, null);
    writeJsonSafe(M07_STORAGE_KEYS.meta, {
      version: 2,
      initializedAt: meta?.initializedAt ?? new Date().toISOString(),
    } satisfies M07StorageMeta);
    // Disclaimer marker for operators (non-mutating documentation seed)
    void M07_NON_CERTIFIED_DISCLAIMER;
  });
}
