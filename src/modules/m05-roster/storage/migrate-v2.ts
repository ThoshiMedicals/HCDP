/**
 * Wave 4 (M05) additive schema-v2 initialization.
 * Insert-if-absent only. Never overwrites Wave 2/3 or existing M05 data.
 *
 * The Wave 1 M05 migration (`M05_MIGRATION_ID`) initialised: periods, shifts,
 * publications, swaps, openShifts. This v2 migration adds the remaining
 * collections required by Wave 4: assignments, acknowledgements, coverage
 * requirements, policies, cost forecasts, audit, availability declarations,
 * and the M04-approved leave cache. `ui` is initialised as an object.
 */

import { readJsonSafe, runMigrationOnce, writeJsonSafe } from "@/platform/storage/storage";
import { M05_SCHEMA_V2_MIGRATION_ID, M05_STORAGE_KEYS } from "./keys";

const EMPTY: unknown[] = [];

const V2_ARRAY_KEYS = [
  M05_STORAGE_KEYS.assignments,
  M05_STORAGE_KEYS.acknowledgements,
  M05_STORAGE_KEYS.coverageRequirements,
  M05_STORAGE_KEYS.policies,
  M05_STORAGE_KEYS.costForecasts,
  M05_STORAGE_KEYS.audit,
  M05_STORAGE_KEYS.availabilityDeclarations,
  M05_STORAGE_KEYS.approvedLeaveCache,
] as const;

export function seedM05SchemaV2(): void {
  for (const key of V2_ARRAY_KEYS) {
    const cur = readJsonSafe<unknown[] | null>(key, null);
    if (cur == null) writeJsonSafe(key, EMPTY);
  }
  const uiCur = readJsonSafe<unknown>(M05_STORAGE_KEYS.ui, null);
  if (uiCur == null) writeJsonSafe(M05_STORAGE_KEYS.ui, {});
}

export function runM05SchemaV2Migration(): boolean {
  return runMigrationOnce(M05_SCHEMA_V2_MIGRATION_ID, 1, seedM05SchemaV2);
}
