/**
 * M06 client bootstrap — additive migrations + optional portal seed.
 */

import { readJsonSafe } from "@/platform/storage/storage";
import type { MigrationReport } from "../types/domain";
import { clearM06LocalStoreCacheForTests } from "../repository/local-store";
import { M06_STORAGE_KEYS } from "./keys";
import { runM06StorageMigrations } from "./migrations";
import { runM06SchemaV2Migration } from "./migrate-v2";
import { runM06PolicySeed, runM06PortalSeed } from "./seed-safe";

let bootstrapped = false;
let cachedReport: MigrationReport | null = null;
const listeners = new Set<() => void>();

function notify() {
  for (const l of listeners) l();
}

export function ensureM06Bootstrapped(options?: { seed?: boolean }): MigrationReport | null {
  if (typeof window === "undefined") return null;
  if (bootstrapped) return cachedReport;
  runM06StorageMigrations();
  runM06SchemaV2Migration();
  if (options?.seed !== false) {
    runM06PolicySeed();
    cachedReport = runM06PortalSeed();
  } else {
    cachedReport = readJsonSafe<MigrationReport | null>(`${M06_STORAGE_KEYS.meta}.seedReport`, null);
  }
  bootstrapped = true;
  return cachedReport;
}

export function getM06BootstrapReport(): MigrationReport | null {
  return ensureM06Bootstrapped();
}

export function subscribeM06Bootstrap(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifyM06BootstrapListeners(): void {
  notify();
}

export function resetM06BootstrapCacheForTests(): void {
  bootstrapped = false;
  cachedReport = null;
  clearM06LocalStoreCacheForTests();
}
