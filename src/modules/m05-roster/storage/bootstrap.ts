/**
 * M05 client bootstrap — run additive migrations once.
 * Safe to call from render snapshot readers (no setState in effect).
 */

import { readJsonSafe } from "@/platform/storage/storage";
import type { MigrationReport } from "../types/domain";
import { clearM05LocalStoreCacheForTests } from "../repository/local-store";
import { M05_STORAGE_KEYS } from "./keys";
import { runM05StorageMigrations } from "./migrations";
import { runM05SchemaV2Migration } from "./migrate-v2";

let bootstrapped = false;
let cachedReport: MigrationReport | null = null;
const listeners = new Set<() => void>();

function notify() {
  for (const l of listeners) l();
}

/** Idempotent: skeleton init + additive v2 collections. */
export function ensureM05Bootstrapped(): MigrationReport | null {
  if (typeof window === "undefined") return null;
  if (bootstrapped) return cachedReport;
  runM05StorageMigrations();
  runM05SchemaV2Migration();
  cachedReport = readJsonSafe<MigrationReport | null>(
    `${M05_STORAGE_KEYS.meta}.seedReport`,
    null
  );
  bootstrapped = true;
  return cachedReport;
}

/** Pure snapshot read — must not bootstrap/side-effect (useSyncExternalStore). */
export function getM05BootstrapReport(): MigrationReport | null {
  return cachedReport;
}

export function subscribeM05Bootstrap(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifyM05BootstrapListeners(): void {
  notify();
}

/** Test helper — clears bootstrap cache (does not clear storage). */
export function resetM05BootstrapCacheForTests(): void {
  bootstrapped = false;
  cachedReport = null;
  clearM05LocalStoreCacheForTests();
}
