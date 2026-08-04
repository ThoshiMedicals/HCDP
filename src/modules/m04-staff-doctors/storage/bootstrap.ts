/** M04 client bootstrap — run migrations once; readable without setState-in-effect. */

import { readJsonSafe } from "@/platform/storage/storage";
import type { MigrationReport } from "../types/domain";
import { M04_STORAGE_KEYS } from "./keys";
import { migrateFromPortalOnce } from "./migrate-from-portal";
import { runM04StorageMigrations } from "./migrations";

let bootstrapped = false;
let cachedReport: MigrationReport | null = null;
const listeners = new Set<() => void>();

function notify() {
  for (const l of listeners) l();
}

/** Idempotent: skeleton + portal seed. Safe to call from render snapshot readers. */
export function ensureM04Bootstrapped(): MigrationReport | null {
  if (typeof window === "undefined") return null;
  if (bootstrapped) return cachedReport;
  runM04StorageMigrations();
  const report = migrateFromPortalOnce();
  cachedReport =
    report ??
    readJsonSafe<MigrationReport | null>(`${M04_STORAGE_KEYS.meta}.portalSeedReport`, null);
  bootstrapped = true;
  // Do not notify listeners here — may run inside useSyncExternalStore getSnapshot.
  return cachedReport;
}

/** Pure snapshot read — must not bootstrap/side-effect (useSyncExternalStore). */
export function getM04BootstrapReport(): MigrationReport | null {
  return cachedReport;
}

export function subscribeM04Bootstrap(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifyM04BootstrapListeners(): void {
  notify();
}

/** Test helper — clears bootstrap cache (does not clear storage). */
export function resetM04BootstrapCacheForTests(): void {
  bootstrapped = false;
  cachedReport = null;
}
