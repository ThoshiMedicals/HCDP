/**
 * Additive M07 schema v3 — Checkpoint 2.4 immutable published-timesheet snapshots.
 * Insert-if-absent; non-destructive; never touches m04/m05/m06 or platform registry keys.
 */

import { readJsonSafe, runMigrationOnce, writeJsonSafe } from "@/platform/storage/storage";
import {
  M07_MIGRATION_V3_ID,
  M07_STORAGE_KEYS,
} from "./keys";
import type { M07StorageMeta } from "./migrations";

const V3_ARRAY_KEYS = [
  M07_STORAGE_KEYS.publishedTimesheetSnapshots,
  M07_STORAGE_KEYS.publishedTimesheetSnapshotIndex,
] as const;

export function runM07SchemaV3Migration(): boolean {
  return runMigrationOnce(M07_MIGRATION_V3_ID, 1, () => {
    for (const key of V3_ARRAY_KEYS) {
      const cur = readJsonSafe<unknown[] | null>(key, null);
      if (cur == null) writeJsonSafe(key, []);
    }
    const current = readJsonSafe<Record<string, unknown> | null>(
      M07_STORAGE_KEYS.publishedTimesheetCurrentIntake,
      null
    );
    if (current == null || typeof current !== "object" || Array.isArray(current)) {
      writeJsonSafe(M07_STORAGE_KEYS.publishedTimesheetCurrentIntake, {});
    }
    // Legacy Batch 1 `intake` placeholder remains non-authoritative; do not convert to snapshots.
    const legacyIntake = readJsonSafe<unknown[] | null>(M07_STORAGE_KEYS.intake, null);
    if (legacyIntake == null) writeJsonSafe(M07_STORAGE_KEYS.intake, []);

    const meta = readJsonSafe<M07StorageMeta | null>(M07_STORAGE_KEYS.meta, null);
    writeJsonSafe(M07_STORAGE_KEYS.meta, {
      version: 3,
      initializedAt: meta?.initializedAt ?? new Date().toISOString(),
    } satisfies M07StorageMeta);
  });
}
