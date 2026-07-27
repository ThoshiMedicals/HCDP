import { readJsonSafe, runMigrationOnce, writeJsonSafe } from "@/platform/storage/storage";
import { M22_MIGRATION_ID, M22_STORAGE_KEYS, M22_STORAGE_VERSION } from "./keys";

export type M22StorageMeta = {
  version: number;
  initializedAt: string;
};

const EMPTY: unknown[] = [];

export function seedM22StorageSkeleton(): void {
  const existing = readJsonSafe<M22StorageMeta | null>(M22_STORAGE_KEYS.meta, null);
  if (!existing) {
    writeJsonSafe(M22_STORAGE_KEYS.meta, {
      version: M22_STORAGE_VERSION,
      initializedAt: new Date().toISOString(),
    } satisfies M22StorageMeta);
  }
  for (const key of [
    M22_STORAGE_KEYS.requisitions,
    M22_STORAGE_KEYS.vacancies,
    M22_STORAGE_KEYS.candidates,
    M22_STORAGE_KEYS.offers,
    M22_STORAGE_KEYS.promotions,
  ] as const) {
    const cur = readJsonSafe<unknown[] | null>(key, null);
    if (cur == null) writeJsonSafe(key, EMPTY);
  }
}

export function runM22StorageMigrations(): boolean {
  return runMigrationOnce(M22_MIGRATION_ID, M22_STORAGE_VERSION, seedM22StorageSkeleton);
}
