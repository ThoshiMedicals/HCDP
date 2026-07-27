import { readJsonSafe, runMigrationOnce, writeJsonSafe } from "@/platform/storage/storage";
import { M11_MIGRATION_ID, M11_STORAGE_KEYS, M11_STORAGE_VERSION } from "./keys";

export type M11StorageMeta = {
  version: number;
  initializedAt: string;
};

const EMPTY: unknown[] = [];

const COLLECTION_KEYS = [
  M11_STORAGE_KEYS.catalogue,
  M11_STORAGE_KEYS.assignments,
  M11_STORAGE_KEYS.assessments,
  M11_STORAGE_KEYS.competencies,
  M11_STORAGE_KEYS.certificates,
  M11_STORAGE_KEYS.exemptions,
  M11_STORAGE_KEYS.completions,
  M11_STORAGE_KEYS.evidence,
  M11_STORAGE_KEYS.policies,
  M11_STORAGE_KEYS.sessions,
  M11_STORAGE_KEYS.rules,
  M11_STORAGE_KEYS.audit,
] as const;

/** Idempotent skeleton seed — init empty arrays only; never wipe existing data. */
export function seedM11StorageSkeleton(): void {
  const existing = readJsonSafe<M11StorageMeta | null>(M11_STORAGE_KEYS.meta, null);
  if (!existing) {
    writeJsonSafe(M11_STORAGE_KEYS.meta, {
      version: M11_STORAGE_VERSION,
      initializedAt: new Date().toISOString(),
    } satisfies M11StorageMeta);
  }
  for (const key of COLLECTION_KEYS) {
    const cur = readJsonSafe<unknown[] | null>(key, null);
    if (cur == null) writeJsonSafe(key, EMPTY);
  }
  // ui key initialised as object, not array
  const uiCur = readJsonSafe<unknown>(M11_STORAGE_KEYS.ui, null);
  if (uiCur == null) writeJsonSafe(M11_STORAGE_KEYS.ui, {});
}

export function runM11StorageMigrations(): boolean {
  return runMigrationOnce(M11_MIGRATION_ID, M11_STORAGE_VERSION, seedM11StorageSkeleton);
}
