/**
 * M05 migration + seed safety (§24 of the plan).
 *
 * Evidence IDs:
 *   MIG-01 repeat-run verification (idempotent seed)
 *   MIG-02 interrupted-run recovery (stub — clear flag, re-run continues)
 *   MIG-03 no M06 / M07 / M22 record generation (never writes those keys)
 *
 * Also verifies:
 *   - seed never overwrites existing non-seed rows (insert-if-absent)
 *   - seed-only rollback removes only seed-tagged rows
 *   - preserves Wave 2 (m04.*) and Wave 3 (m11.*) stores (no touch)
 */

import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";

import {
  clearMigrationFlag,
  PLATFORM_KEYS,
  readJsonSafe,
  writeJsonSafe,
} from "@/platform/storage/storage";

import { runM05StorageMigrations } from "../storage/migrations";
import { runM05SchemaV2Migration } from "../storage/migrate-v2";
import {
  M05_SEED_BATCH_ID,
  runM05PolicySeed,
  runM05PortalSeed,
} from "../storage/seed-safe";
import { rollbackSeedOwnedM05 } from "../storage/rollback-seed";
import {
  M05_POLICY_MIGRATION_ID,
  M05_SCHEMA_V2_MIGRATION_ID,
  M05_SEED_MIGRATION_ID,
  M05_STORAGE_KEYS,
  M05_MIGRATION_ID,
} from "../storage/keys";
import { resetM05BootstrapCacheForTests } from "../storage/bootstrap";
import type { RosterPeriod, Shift } from "../types/domain";
import type { ConflictPolicy } from "../types/policy";

function installMemoryLocalStorage(): Map<string, string> {
  const map = new Map<string, string>();
  (globalThis as { window?: { localStorage: Storage } }).window = {
    localStorage: {
      getItem: (k) => (map.has(k) ? map.get(k)! : null),
      setItem: (k, v) => {
        map.set(k, String(v));
      },
      removeItem: (k) => {
        map.delete(k);
      },
      clear: () => map.clear(),
      key: () => null,
      length: 0,
    } as Storage,
  };
  return map;
}

describe("m05 migration + seed", () => {
  let storageMap: Map<string, string>;

  beforeEach(() => {
    storageMap = installMemoryLocalStorage();
    resetM05BootstrapCacheForTests();
    runM05StorageMigrations();
    runM05SchemaV2Migration();
    runM05PortalSeed();
    runM05PolicySeed();
  });

  it("initial migration + seed initialises all M05 collections and marks flags", () => {
    const meta = readJsonSafe<{ version: number } | null>(M05_STORAGE_KEYS.meta, null);
    assert.ok(meta && meta.version === 1);
    const flags = readJsonSafe<Record<string, number>>(PLATFORM_KEYS.migrations, {});
    assert.equal(flags[M05_MIGRATION_ID], 1);
    assert.equal(flags[M05_SCHEMA_V2_MIGRATION_ID], 1);
    assert.equal(flags[M05_SEED_MIGRATION_ID], 1);
    assert.equal(flags[M05_POLICY_MIGRATION_ID], 1);
    // Seed inserted at least one period + shifts + policy
    assert.ok(readJsonSafe<RosterPeriod[]>(M05_STORAGE_KEYS.periods, []).length >= 1);
    assert.ok(readJsonSafe<Shift[]>(M05_STORAGE_KEYS.shifts, []).length >= 1);
    assert.ok(readJsonSafe<ConflictPolicy[]>(M05_STORAGE_KEYS.policies, []).length >= 1);
  });

  it("MIG-01: repeat-run is idempotent — no duplicate seed rows on re-run", () => {
    const beforePeriods = readJsonSafe<RosterPeriod[]>(M05_STORAGE_KEYS.periods, []).length;
    const beforeShifts = readJsonSafe<Shift[]>(M05_STORAGE_KEYS.shifts, []).length;
    const beforePolicies = readJsonSafe<ConflictPolicy[]>(M05_STORAGE_KEYS.policies, []).length;
    for (let i = 0; i < 3; i++) {
      runM05StorageMigrations();
      runM05SchemaV2Migration();
      runM05PortalSeed();
      runM05PolicySeed();
    }
    assert.equal(
      readJsonSafe<RosterPeriod[]>(M05_STORAGE_KEYS.periods, []).length,
      beforePeriods
    );
    assert.equal(
      readJsonSafe<Shift[]>(M05_STORAGE_KEYS.shifts, []).length,
      beforeShifts
    );
    assert.equal(
      readJsonSafe<ConflictPolicy[]>(M05_STORAGE_KEYS.policies, []).length,
      beforePolicies
    );
  });

  it("seed never overwrites existing non-seed rows", () => {
    const periods = readJsonSafe<RosterPeriod[]>(M05_STORAGE_KEYS.periods, []);
    const customPeriod: RosterPeriod = {
      ...periods[0]!,
      id: "prd_custom",
      seedBatchId: null,
      label: "Manually created",
      createdBy: "usr_manual",
    };
    writeJsonSafe(M05_STORAGE_KEYS.periods, [...periods, customPeriod]);

    // Force re-seed by clearing the flag then re-running seed
    clearMigrationFlag(M05_SEED_MIGRATION_ID);
    runM05PortalSeed();
    const after = readJsonSafe<RosterPeriod[]>(M05_STORAGE_KEYS.periods, []);
    const custom = after.find((p) => p.id === "prd_custom");
    assert.ok(custom);
    assert.equal(custom!.label, "Manually created");
    assert.equal(custom!.createdBy, "usr_manual");
  });

  it("MIG-02: interrupted-run recovery — clearing the flag replays seed once", () => {
    const before = readJsonSafe<RosterPeriod[]>(M05_STORAGE_KEYS.periods, []).length;
    clearMigrationFlag(M05_SEED_MIGRATION_ID);
    const ran = runM05PortalSeed();
    assert.equal(ran, true);
    // But rows are unchanged because seed detects the existing seedBatchId row
    // and short-circuits before appending.
    assert.equal(
      readJsonSafe<RosterPeriod[]>(M05_STORAGE_KEYS.periods, []).length,
      before
    );
  });

  it("MIG-03: NO M06 / M07 / M22 record keys are ever created by M05 migrations/seed", () => {
    for (const key of storageMap.keys()) {
      assert.doesNotMatch(key, /^pulse\.m06\./);
      assert.doesNotMatch(key, /^pulse\.m07\./);
      assert.doesNotMatch(key, /^pulse\.m22\./);
    }
  });

  it("seed-only rollback removes only seed-tagged rows + clears seed flags", () => {
    const periods = readJsonSafe<RosterPeriod[]>(M05_STORAGE_KEYS.periods, []);
    const customPeriod: RosterPeriod = {
      ...periods[0]!,
      id: "prd_keep",
      seedBatchId: null,
      label: "Preserved after rollback",
    };
    writeJsonSafe(M05_STORAGE_KEYS.periods, [...periods, customPeriod]);

    rollbackSeedOwnedM05(clearMigrationFlag);
    const afterPeriods = readJsonSafe<RosterPeriod[]>(M05_STORAGE_KEYS.periods, []);
    assert.ok(afterPeriods.some((p) => p.id === "prd_keep"));
    assert.ok(!afterPeriods.some((p) => p.seedBatchId === M05_SEED_BATCH_ID));

    const flags = readJsonSafe<Record<string, number>>(PLATFORM_KEYS.migrations, {});
    assert.equal(flags[M05_SEED_MIGRATION_ID], undefined);
    assert.equal(flags[M05_POLICY_MIGRATION_ID], undefined);

    const afterShifts = readJsonSafe<Shift[]>(M05_STORAGE_KEYS.shifts, []);
    assert.ok(afterShifts.every((s) => s.seedBatchId !== M05_SEED_BATCH_ID));
  });

  it("preserves Wave 2 (m04.*) and Wave 3 (m11.*) stores — no writes into those keys", () => {
    // Simulate pre-existing frozen wave data
    writeJsonSafe("pulse.m04.staff-doctors.people", [{ id: "frozen-m04", version: 1 }]);
    writeJsonSafe("pulse.m11.training.courses", [{ id: "frozen-m11", version: 1 }]);
    // Re-run all M05 migrations/seed/rollback paths
    clearMigrationFlag(M05_SEED_MIGRATION_ID);
    clearMigrationFlag(M05_POLICY_MIGRATION_ID);
    runM05PortalSeed();
    runM05PolicySeed();
    rollbackSeedOwnedM05(clearMigrationFlag);
    runM05PortalSeed();
    runM05PolicySeed();
    const m04 = readJsonSafe<unknown[]>("pulse.m04.staff-doctors.people", []);
    const m11 = readJsonSafe<unknown[]>("pulse.m11.training.courses", []);
    assert.equal(m04.length, 1);
    assert.equal(m11.length, 1);
    assert.deepEqual(m04, [{ id: "frozen-m04", version: 1 }]);
    assert.deepEqual(m11, [{ id: "frozen-m11", version: 1 }]);
  });

  it("M05 storage key inventory matches the planned pulse.m05.roster.* register", () => {
    const expected = [
      "pulse.m05.roster.meta",
      "pulse.m05.roster.periods",
      "pulse.m05.roster.shifts",
      "pulse.m05.roster.assignments",
      "pulse.m05.roster.openShifts",
      "pulse.m05.roster.swaps",
      "pulse.m05.roster.publications",
      "pulse.m05.roster.acknowledgements",
      "pulse.m05.roster.coverageRequirements",
      "pulse.m05.roster.policies",
      "pulse.m05.roster.costForecasts",
      "pulse.m05.roster.audit",
      "pulse.m05.roster.ui",
      "pulse.m05.roster.availabilityDeclarations",
      "pulse.m05.roster.approvedLeaveCache",
    ];
    const declared = Object.values(M05_STORAGE_KEYS) as readonly string[];
    for (const key of expected) {
      assert.equal(declared.includes(key), true, `missing storage key ${key}`);
    }
  });
});
