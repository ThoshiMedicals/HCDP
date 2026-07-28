import { readJsonSafe, runMigrationOnce, writeJsonSafe } from "@/platform/storage/storage";
import { M07_MIGRATION_ID, M07_STORAGE_KEYS, M07_STORAGE_VERSION } from "./keys";

export type M07StorageMeta = {
  version: number;
  initializedAt: string;
};

const EMPTY: unknown[] = [];

/** v1 skeleton — insert-if-absent only. */
export function seedM07StorageSkeleton(): void {
  const existing = readJsonSafe<M07StorageMeta | null>(M07_STORAGE_KEYS.meta, null);
  if (!existing) {
    writeJsonSafe(M07_STORAGE_KEYS.meta, {
      version: M07_STORAGE_VERSION,
      initializedAt: new Date().toISOString(),
    } satisfies M07StorageMeta);
  }
  for (const key of [
    M07_STORAGE_KEYS.periods,
    M07_STORAGE_KEYS.calculations,
    M07_STORAGE_KEYS.adjustments,
    M07_STORAGE_KEYS.exports,
    M07_STORAGE_KEYS.reconciliations,
  ] as const) {
    const cur = readJsonSafe<unknown[] | null>(key, null);
    if (cur == null) writeJsonSafe(key, EMPTY);
  }
}

export function runM07StorageMigrations(): boolean {
  return runMigrationOnce(M07_MIGRATION_ID, M07_STORAGE_VERSION, seedM07StorageSkeleton);
}
