import { runM07StorageMigrations } from "./migrations";
import { runM07SchemaV2Migration } from "./migrate-v2";
import type { MigrationReport } from "../types/domain";
import { bootstrapDefaultEntityPaySettings } from "../services/entity-settings-service";

let bootstrapped = false;
let lastReport: MigrationReport | null = null;
const listeners = new Set<() => void>();

export function resetM07BootstrapCacheForTests(): void {
  bootstrapped = false;
  lastReport = null;
}

export function subscribeM07Bootstrap(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getM07BootstrapReport(): MigrationReport | null {
  return lastReport;
}

/** Demo org ids seeded insert-if-absent only (never overwrite). */
export const M07_BOOTSTRAP_ENTITY_IDS = ["org_demo_a", "org_demo_b"] as const;

export function ensureM07Bootstrapped(): MigrationReport {
  if (bootstrapped && lastReport) return lastReport;
  const v1Ran = runM07StorageMigrations();
  const v2Ran = runM07SchemaV2Migration();
  // Authorised system bootstrap path — insert-if-absent entity settings only.
  bootstrapDefaultEntityPaySettings([...M07_BOOTSTRAP_ENTITY_IDS]);
  lastReport = { v1Ran, v2Ran, at: new Date().toISOString() };
  bootstrapped = true;
  for (const cb of listeners) cb();
  return lastReport;
}
