/** Platform storage keys and versioned migration helpers. Components must not call localStorage directly. */

export const PLATFORM_PREFIX = "pulse.platform";

export const PLATFORM_KEYS = {
  clinics: `${PLATFORM_PREFIX}.context.clinics`,
  identity: `${PLATFORM_PREFIX}.context.identity`,
  migrations: `${PLATFORM_PREFIX}.migrations`,
  sourceLinks: `${PLATFORM_PREFIX}.sourceLinks`,
} as const;

/** Module storage prefix helpers — pulse.m04.* … pulse.m24.* */
export function moduleStoragePrefix(moduleNumber: number): string {
  const n = String(moduleNumber).padStart(2, "0");
  return `pulse.m${n}.`;
}

export type MigrationFlagMap = Record<string, number>;

export function readJsonSafe<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T;
    if (parsed == null) return fallback;
    if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback;
    return parsed;
  } catch {
    return fallback;
  }
}

export function writeJsonSafe(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
}

export function readMigrationFlags(): MigrationFlagMap {
  return readJsonSafe<MigrationFlagMap>(PLATFORM_KEYS.migrations, {});
}

export function markMigration(id: string, version = 1) {
  const flags = readMigrationFlags();
  if (flags[id] === version) return false;
  flags[id] = version;
  writeJsonSafe(PLATFORM_KEYS.migrations, flags);
  return true;
}

export function hasMigration(id: string, version = 1): boolean {
  return readMigrationFlags()[id] === version;
}

/** Test/seed rollback helper — removes a migration flag without wiping data. */
export function clearMigrationFlag(id: string): void {
  if (typeof window === "undefined") return;
  const flags = { ...readMigrationFlags() };
  delete flags[id];
  writeJsonSafe(PLATFORM_KEYS.migrations, flags);
}

export function runMigrationOnce(id: string, version: number, fn: () => void): boolean {
  if (typeof window === "undefined") return false;
  if (hasMigration(id, version)) return false;
  try {
    fn();
    markMigration(id, version);
    return true;
  } catch {
    return false;
  }
}

export function uid(prefix = "plt"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
