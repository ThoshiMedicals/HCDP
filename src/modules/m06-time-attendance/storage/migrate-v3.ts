/**
 * Additive M06 schema v3 — Checkpoint 2.2 platform publication outbox.
 * Insert-if-absent; never touches pulse.m07.*; non-destructive.
 */

import { readJsonSafe, runMigrationOnce, writeJsonSafe } from "@/platform/storage/storage";
import {
  M06_MIGRATION_V3_ID,
  M06_SCHEMA_VERSION,
  M06_STORAGE_KEYS,
} from "./keys";
import type { M06StorageMeta } from "./migrations";

export type PublishedTimesheetOutboxMeta = {
  nextEventSequence: number;
};

export function runM06SchemaV3Migration(): boolean {
  return runMigrationOnce(M06_MIGRATION_V3_ID, 1, () => {
    const outbox = readJsonSafe<unknown[] | null>(M06_STORAGE_KEYS.publishedTimesheetOutbox, null);
    if (outbox == null) writeJsonSafe(M06_STORAGE_KEYS.publishedTimesheetOutbox, []);

    const outboxMeta = readJsonSafe<PublishedTimesheetOutboxMeta | null>(
      M06_STORAGE_KEYS.publishedTimesheetOutboxMeta,
      null
    );
    if (outboxMeta == null) {
      writeJsonSafe(M06_STORAGE_KEYS.publishedTimesheetOutboxMeta, {
        nextEventSequence: 1,
      } satisfies PublishedTimesheetOutboxMeta);
    }

    const meta = readJsonSafe<M06StorageMeta | null>(M06_STORAGE_KEYS.meta, null);
    writeJsonSafe(M06_STORAGE_KEYS.meta, {
      version: M06_SCHEMA_VERSION,
      initializedAt: meta?.initializedAt ?? new Date().toISOString(),
    } satisfies M06StorageMeta);
  });
}
