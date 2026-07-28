/**
 * Additive M07 schema v8 — Batch 5 approvals collection ensure.
 * Insert-if-absent; non-destructive; never rewrites historical approvals or
 * Batch 1–4 data; never touches m04/m05/m06 keys.
 */

import { readJsonSafe, runMigrationOnce, writeJsonSafe } from "@/platform/storage/storage";
import {
  M07_MIGRATION_V8_ID,
  M07_SCHEMA_VERSION,
  M07_STORAGE_KEYS,
} from "./keys";
import type { M07StorageMeta } from "./migrations";

export function runM07SchemaV8Migration(): boolean {
  return runMigrationOnce(M07_MIGRATION_V8_ID, 1, () => {
    const cur = readJsonSafe<unknown[] | null>(M07_STORAGE_KEYS.approvals, null);
    if (cur == null) writeJsonSafe(M07_STORAGE_KEYS.approvals, []);
    const meta = readJsonSafe<M07StorageMeta | null>(M07_STORAGE_KEYS.meta, null);
    writeJsonSafe(M07_STORAGE_KEYS.meta, {
      version: M07_SCHEMA_VERSION,
      initializedAt: meta?.initializedAt ?? new Date().toISOString(),
    } satisfies M07StorageMeta);
  });
}
