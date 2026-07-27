/** M11 client bootstrap — run migrations once; readable without setState-in-effect. */

import { readJsonSafe } from "@/platform/storage/storage";
import type { MigrationReport } from "../types/domain";
import { M11_STORAGE_KEYS } from "./keys";
import { runM11StorageMigrations } from "./migrations";

let bootstrapped = false;
let cachedReport: MigrationReport | null = null;
const listeners = new Set<() => void>();

function notify() {
  for (const l of listeners) l();
}

/** Idempotent: skeleton init. Safe to call from render snapshot readers. */
export function ensureM11Bootstrapped(): MigrationReport | null {
  if (typeof window === "undefined") return null;
  if (bootstrapped) return cachedReport;
  runM11StorageMigrations();
  cachedReport = readJsonSafe<MigrationReport | null>(
    `${M11_STORAGE_KEYS.meta}.seedReport`,
    null
  );
  bootstrapped = true;
  // Do not notify listeners here — may run inside useSyncExternalStore getSnapshot.
  return cachedReport;
}

export function getM11BootstrapReport(): MigrationReport | null {
  return ensureM11Bootstrapped();
}

export function subscribeM11Bootstrap(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Trigger listeners after seed completes. */
export function notifyM11BootstrapListeners(): void {
  notify();
}

/** Test helper — clears bootstrap cache (does not clear storage). */
export function resetM11BootstrapCacheForTests(): void {
  bootstrapped = false;
  cachedReport = null;
}
