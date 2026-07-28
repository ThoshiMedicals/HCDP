/**
 * Additive M06 schema v2 — insert-if-absent for new attendance collections.
 * Preserves Wave 2–4 data; never touches pulse.m07.*.
 */

import { readJsonSafe, runMigrationOnce, writeJsonSafe } from "@/platform/storage/storage";
import { M06_MIGRATION_V2_ID, M06_SCHEMA_VERSION, M06_STORAGE_KEYS } from "./keys";
import type { M06StorageMeta } from "./migrations";

const V2_KEYS = [
  M06_STORAGE_KEYS.sessions,
  M06_STORAGE_KEYS.breaks,
  M06_STORAGE_KEYS.corrections,
  M06_STORAGE_KEYS.approvals,
  M06_STORAGE_KEYS.policies,
  M06_STORAGE_KEYS.audit,
  M06_STORAGE_KEYS.evidence,
  M06_STORAGE_KEYS.devices,
  M06_STORAGE_KEYS.declarations,
] as const;

export function runM06SchemaV2Migration(): boolean {
  return runMigrationOnce(M06_MIGRATION_V2_ID, 1, () => {
    for (const key of V2_KEYS) {
      const cur = readJsonSafe<unknown[] | null>(key, null);
      if (cur == null) writeJsonSafe(key, []);
    }
    const meta = readJsonSafe<M06StorageMeta | null>(M06_STORAGE_KEYS.meta, null);
    writeJsonSafe(M06_STORAGE_KEYS.meta, {
      version: M06_SCHEMA_VERSION,
      initializedAt: meta?.initializedAt ?? new Date().toISOString(),
    } satisfies M06StorageMeta);
  });
}
