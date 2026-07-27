import { readJsonSafe, runMigrationOnce, writeJsonSafe } from "@/platform/storage/storage";
import { M06_MIGRATION_ID, M06_STORAGE_KEYS, M06_STORAGE_VERSION } from "./keys";

export type M06StorageMeta = {
  version: number;
  initializedAt: string;
};

const EMPTY: unknown[] = [];

export function seedM06StorageSkeleton(): void {
  const existing = readJsonSafe<M06StorageMeta | null>(M06_STORAGE_KEYS.meta, null);
  if (!existing) {
    writeJsonSafe(M06_STORAGE_KEYS.meta, {
      version: M06_STORAGE_VERSION,
      initializedAt: new Date().toISOString(),
    } satisfies M06StorageMeta);
  }
  for (const key of [
    M06_STORAGE_KEYS.events,
    M06_STORAGE_KEYS.exceptions,
    M06_STORAGE_KEYS.timesheets,
    M06_STORAGE_KEYS.offlineQueue,
  ] as const) {
    const cur = readJsonSafe<unknown[] | null>(key, null);
    if (cur == null) writeJsonSafe(key, EMPTY);
  }
}

export function runM06StorageMigrations(): boolean {
  return runMigrationOnce(M06_MIGRATION_ID, M06_STORAGE_VERSION, seedM06StorageSkeleton);
}
