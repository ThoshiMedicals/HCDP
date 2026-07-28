/**
 * Additive M07 schema v6 — Batch 3 leavePrepLines (+ ensure exceptions/calculations).
 * Insert-if-absent; non-destructive; never touches m04/m05/m06 or platform registry keys.
 */

import { readJsonSafe, runMigrationOnce, writeJsonSafe } from "@/platform/storage/storage";
import {
  M07_MIGRATION_V6_ID,
  M07_SCHEMA_VERSION,
  M07_STORAGE_KEYS,
} from "./keys";
import type { M07StorageMeta } from "./migrations";

export function runM07SchemaV6Migration(): boolean {
  return runMigrationOnce(M07_MIGRATION_V6_ID, 1, () => {
    for (const key of [
      M07_STORAGE_KEYS.leavePrepLines,
      M07_STORAGE_KEYS.exceptions,
      M07_STORAGE_KEYS.calculations,
    ] as const) {
      const cur = readJsonSafe<unknown[] | null>(key, null);
      if (cur == null) writeJsonSafe(key, []);
    }
    const meta = readJsonSafe<M07StorageMeta | null>(M07_STORAGE_KEYS.meta, null);
    writeJsonSafe(M07_STORAGE_KEYS.meta, {
      version: M07_SCHEMA_VERSION,
      initializedAt: meta?.initializedAt ?? new Date().toISOString(),
    } satisfies M07StorageMeta);
  });
}
