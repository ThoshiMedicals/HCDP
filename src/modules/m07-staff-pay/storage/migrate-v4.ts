/**
 * Additive M07 schema v4 — Checkpoint 2.5 published-timesheet replay cursors.
 * Insert-if-absent; non-destructive; never touches m04/m05/m06 or platform registry keys.
 */

import { readJsonSafe, runMigrationOnce, writeJsonSafe } from "@/platform/storage/storage";
import {
  M07_MIGRATION_V4_ID,
  M07_STORAGE_KEYS,
} from "./keys";
import type { M07StorageMeta } from "./migrations";

export function runM07SchemaV4Migration(): boolean {
  return runMigrationOnce(M07_MIGRATION_V4_ID, 1, () => {
    for (const key of [
      M07_STORAGE_KEYS.publishedTimesheetReplayCheckpoints,
      M07_STORAGE_KEYS.publishedTimesheetReplayOutcomes,
    ] as const) {
      const cur = readJsonSafe<unknown[] | null>(key, null);
      if (cur == null) writeJsonSafe(key, []);
    }
    const meta = readJsonSafe<M07StorageMeta | null>(M07_STORAGE_KEYS.meta, null);
    writeJsonSafe(M07_STORAGE_KEYS.meta, {
      version: 4,
      initializedAt: meta?.initializedAt ?? new Date().toISOString(),
    } satisfies M07StorageMeta);
  });
}
