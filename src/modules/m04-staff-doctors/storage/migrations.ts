import { readJsonSafe, runMigrationOnce, writeJsonSafe } from "@/platform/storage/storage";
import { M04_MIGRATION_ID, M04_STORAGE_KEYS, M04_STORAGE_VERSION } from "./keys";

export type M04StorageMeta = {
  version: number;
  initializedAt: string;
};

const EMPTY: unknown[] = [];

const COLLECTION_KEYS = [
  M04_STORAGE_KEYS.people,
  M04_STORAGE_KEYS.engagements,
  M04_STORAGE_KEYS.credentials,
  M04_STORAGE_KEYS.leave,
  M04_STORAGE_KEYS.availability,
  M04_STORAGE_KEYS.restrictions,
  M04_STORAGE_KEYS.onboarding,
  M04_STORAGE_KEYS.offboarding,
  M04_STORAGE_KEYS.readiness,
] as const;

/** Idempotent skeleton seed — empty collections only; portal seed is separate. */
export function seedM04StorageSkeleton(): void {
  const existing = readJsonSafe<M04StorageMeta | null>(M04_STORAGE_KEYS.meta, null);
  if (!existing) {
    writeJsonSafe(M04_STORAGE_KEYS.meta, {
      version: M04_STORAGE_VERSION,
      initializedAt: new Date().toISOString(),
    } satisfies M04StorageMeta);
  }
  for (const key of COLLECTION_KEYS) {
    const cur = readJsonSafe<unknown[] | null>(key, null);
    if (cur == null) writeJsonSafe(key, EMPTY);
  }
}

export function runM04StorageMigrations(): boolean {
  return runMigrationOnce(M04_MIGRATION_ID, M04_STORAGE_VERSION, seedM04StorageSkeleton);
}
