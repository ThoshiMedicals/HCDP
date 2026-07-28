/**
 * Additive M07 schema v9 — Batch 6 export/recon/lock collections.
 * Insert-if-absent; non-destructive; never rewrites Batch 1–5 history;
 * never fabricates ready/finalized/locked records; never touches m04/m05/m06 keys.
 */

import { readJsonSafe, runMigrationOnce, writeJsonSafe } from "@/platform/storage/storage";
import {
  M07_MIGRATION_V9_ID,
  M07_SCHEMA_VERSION,
  M07_STORAGE_KEYS,
} from "./keys";
import type { M07StorageMeta } from "./migrations";

export function runM07SchemaV9Migration(): boolean {
  return runMigrationOnce(M07_MIGRATION_V9_ID, 1, () => {
    for (const key of [
      M07_STORAGE_KEYS.exports,
      M07_STORAGE_KEYS.reconciliations,
      M07_STORAGE_KEYS.unlockRequests,
      M07_STORAGE_KEYS.periodLocks,
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
