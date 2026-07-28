/**
 * Additive M07 schema v7 — Batch 4 deductionPrepInputs.
 * Insert-if-absent; non-destructive; never rewrites historical calculations,
 * leave lines, or Batch 2 snapshots; never touches m04/m05/m06 keys.
 */

import { readJsonSafe, runMigrationOnce, writeJsonSafe } from "@/platform/storage/storage";
import {
  M07_MIGRATION_V7_ID,
  M07_SCHEMA_VERSION,
  M07_STORAGE_KEYS,
} from "./keys";
import type { M07StorageMeta } from "./migrations";

export function runM07SchemaV7Migration(): boolean {
  return runMigrationOnce(M07_MIGRATION_V7_ID, 1, () => {
    const cur = readJsonSafe<unknown[] | null>(M07_STORAGE_KEYS.deductionPrepInputs, null);
    if (cur == null) writeJsonSafe(M07_STORAGE_KEYS.deductionPrepInputs, []);
    const meta = readJsonSafe<M07StorageMeta | null>(M07_STORAGE_KEYS.meta, null);
    writeJsonSafe(M07_STORAGE_KEYS.meta, {
      version: M07_SCHEMA_VERSION,
      initializedAt: meta?.initializedAt ?? new Date().toISOString(),
    } satisfies M07StorageMeta);
  });
}
