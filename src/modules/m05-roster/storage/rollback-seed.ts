/**
 * M05 seed-only rollback.
 * Removes ONLY rows tagged with `seedBatchId === M05_SEED_BATCH_ID` and
 * clears the M05 seed migration flags. Never touches Wave 2 (M04) or
 * Wave 3 (M11) data.
 */

import { readJsonSafe, writeJsonSafe } from "@/platform/storage/storage";
import type { RosterPeriod, Shift } from "../types/domain";
import type { ConflictPolicy } from "../types/policy";
import {
  M05_POLICY_MIGRATION_ID,
  M05_SEED_MIGRATION_ID,
  M05_STORAGE_KEYS,
} from "./keys";
import { M05_SEED_BATCH_ID } from "./seed-safe";

/**
 * Remove only seed-tagged M05 rows and clear seed migration flags.
 * `clearFlag` is injected (typically the platform `clearMigrationFlag`) so
 * this file remains dependency-clean for tests.
 */
export function rollbackSeedOwnedM05(clearFlag: (id: string) => void): void {
  const periods = readJsonSafe<RosterPeriod[]>(M05_STORAGE_KEYS.periods, []);
  writeJsonSafe(
    M05_STORAGE_KEYS.periods,
    periods.filter((p) => p.seedBatchId !== M05_SEED_BATCH_ID)
  );

  const shifts = readJsonSafe<Shift[]>(M05_STORAGE_KEYS.shifts, []);
  writeJsonSafe(
    M05_STORAGE_KEYS.shifts,
    shifts.filter((s) => s.seedBatchId !== M05_SEED_BATCH_ID)
  );

  const policies = readJsonSafe<ConflictPolicy[]>(M05_STORAGE_KEYS.policies, []);
  writeJsonSafe(
    M05_STORAGE_KEYS.policies,
    policies.filter((p) => p.createdBy !== "seed")
  );

  clearFlag(M05_SEED_MIGRATION_ID);
  clearFlag(M05_POLICY_MIGRATION_ID);
}
