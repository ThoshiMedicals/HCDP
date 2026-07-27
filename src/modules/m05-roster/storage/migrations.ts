import { readJsonSafe, runMigrationOnce, writeJsonSafe } from "@/platform/storage/storage";
import { M05_MIGRATION_ID, M05_STORAGE_KEYS, M05_STORAGE_VERSION } from "./keys";

export type M05StorageMeta = {
  version: number;
  initializedAt: string;
};

const EMPTY: unknown[] = [];

export function seedM05StorageSkeleton(): void {
  const existing = readJsonSafe<M05StorageMeta | null>(M05_STORAGE_KEYS.meta, null);
  if (!existing) {
    writeJsonSafe(M05_STORAGE_KEYS.meta, {
      version: M05_STORAGE_VERSION,
      initializedAt: new Date().toISOString(),
    } satisfies M05StorageMeta);
  }
  for (const key of [
    M05_STORAGE_KEYS.periods,
    M05_STORAGE_KEYS.shifts,
    M05_STORAGE_KEYS.publications,
    M05_STORAGE_KEYS.swaps,
    M05_STORAGE_KEYS.openShifts,
  ] as const) {
    const cur = readJsonSafe<unknown[] | null>(key, null);
    if (cur == null) writeJsonSafe(key, EMPTY);
  }
}

export function runM05StorageMigrations(): boolean {
  return runMigrationOnce(M05_MIGRATION_ID, M05_STORAGE_VERSION, seedM05StorageSkeleton);
}
