import { runM07StorageMigrations } from "./migrations";
import { runM07SchemaV2Migration } from "./migrate-v2";
import { runM07SchemaV3Migration } from "./migrate-v3";
import { runM07SchemaV4Migration } from "./migrate-v4";
import { runM07SchemaV5Migration } from "./migrate-v5";
import { runM07SchemaV6Migration } from "./migrate-v6";
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
  const v3Ran = runM07SchemaV3Migration();
  const v4Ran = runM07SchemaV4Migration();
  const v5Ran = runM07SchemaV5Migration();
  const v6Ran = runM07SchemaV6Migration();
  bootstrapDefaultEntityPaySettings([...M07_BOOTSTRAP_ENTITY_IDS]);
  lastReport = { v1Ran, v2Ran, v3Ran, v4Ran, v5Ran, v6Ran, at: new Date().toISOString() };
  bootstrapped = true;
  for (const cb of listeners) cb();
  return lastReport;
}
