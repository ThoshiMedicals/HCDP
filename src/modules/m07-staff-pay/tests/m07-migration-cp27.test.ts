/**
 * Checkpoint 2.7A — supported M07 schema migration matrix through v5.
 * Evidence only; does not change production migration behaviour.
 */

import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import {
  clearMigrationFlag,
  hasMigration,
  readJsonSafe,
  writeJsonSafe,
} from "@/platform/storage/storage";
import {
  M07_MIGRATION_ID,
  M07_MIGRATION_V2_ID,
  M07_MIGRATION_V3_ID,
  M07_MIGRATION_V4_ID,
  M07_MIGRATION_V5_ID,
  M07_MIGRATION_V6_ID,
  M07_MIGRATION_V7_ID,
  M07_SCHEMA_VERSION,
  M07_STORAGE_KEYS,
  M07_STORAGE_VERSION,
  ensureM07Bootstrapped,
  resetM07BootstrapCacheForTests,
  runM07SchemaV2Migration,
  runM07SchemaV3Migration,
  runM07SchemaV4Migration,
  runM07SchemaV5Migration,
  runM07SchemaV6Migration,
  runM07SchemaV7Migration,
  runM07StorageMigrations,
} from "../storage";
import { clearM07LocalStoreCacheForTests } from "../repository/local-store";
import { installMemoryLocalStorage } from "./_helpers";

function assertNoForeignKeys() {
  assert.equal(localStorage.getItem("pulse.m04.staff.people"), null);
  assert.equal(localStorage.getItem("pulse.m05.roster.shifts"), null);
  assert.equal(localStorage.getItem("pulse.m06.attendance.timesheets"), null);
  assert.equal(
    localStorage.getItem("pulse.platform.workforce.publishedTimesheets.versions"),
    null
  );
}

describe("CP2.7A M07 migration matrix through v5", () => {
  beforeEach(() => {
    installMemoryLocalStorage();
    clearM07LocalStoreCacheForTests();
    resetM07BootstrapCacheForTests();
  });

  it("empty bootstrap reaches schema v7 with lifecycle + leavePrep + deductionPrep collections", () => {
    ensureM07Bootstrapped();
    assert.equal(hasMigration(M07_MIGRATION_V5_ID, 1), true);
    assert.equal(hasMigration(M07_MIGRATION_V6_ID, 1), true);
    assert.equal(hasMigration(M07_MIGRATION_V7_ID, 1), true);
    const meta = readJsonSafe<{ version: number } | null>(M07_STORAGE_KEYS.meta, null);
    assert.equal(meta?.version, M07_SCHEMA_VERSION);
    assert.ok(Array.isArray(readJsonSafe(M07_STORAGE_KEYS.publishedTimesheetLifecycleProjections, null)));
    assert.ok(Array.isArray(readJsonSafe(M07_STORAGE_KEYS.publishedTimesheetSnapshotEligibility, null)));
    assert.ok(Array.isArray(readJsonSafe(M07_STORAGE_KEYS.leavePrepLines, null)));
    assert.ok(Array.isArray(readJsonSafe(M07_STORAGE_KEYS.deductionPrepInputs, null)));
    assertNoForeignKeys();
  });

  it("v1 → v5 preserves periods", () => {
    assert.equal(runM07StorageMigrations(), true);
    writeJsonSafe(M07_STORAGE_KEYS.periods, [{ id: "p_v1" }]);
    assert.equal(runM07SchemaV2Migration(), true);
    assert.equal(runM07SchemaV3Migration(), true);
    assert.equal(runM07SchemaV4Migration(), true);
    assert.equal(runM07SchemaV5Migration(), true);
    assert.deepEqual(readJsonSafe(M07_STORAGE_KEYS.periods, []), [{ id: "p_v1" }]);
    assert.equal(hasMigration(M07_MIGRATION_ID, M07_STORAGE_VERSION), true);
    assert.equal(hasMigration(M07_MIGRATION_V5_ID, 1), true);
  });

  it("v2 → v5 preserves Batch 1 profiles", () => {
    assert.equal(runM07StorageMigrations(), true);
    assert.equal(runM07SchemaV2Migration(), true);
    writeJsonSafe(M07_STORAGE_KEYS.profiles, [{ id: "prof_v2" }]);
    assert.equal(runM07SchemaV3Migration(), true);
    assert.equal(runM07SchemaV4Migration(), true);
    assert.equal(runM07SchemaV5Migration(), true);
    assert.deepEqual(readJsonSafe(M07_STORAGE_KEYS.profiles, []), [{ id: "prof_v2" }]);
    assert.equal(hasMigration(M07_MIGRATION_V2_ID, 1), true);
  });

  it("v3 → v5 preserves immutable snapshots", () => {
    assert.equal(runM07StorageMigrations(), true);
    assert.equal(runM07SchemaV2Migration(), true);
    assert.equal(runM07SchemaV3Migration(), true);
    writeJsonSafe(M07_STORAGE_KEYS.publishedTimesheetSnapshots, [{ id: "snap_v3", immutable: true }]);
    assert.equal(runM07SchemaV4Migration(), true);
    assert.equal(runM07SchemaV5Migration(), true);
    assert.deepEqual(readJsonSafe(M07_STORAGE_KEYS.publishedTimesheetSnapshots, []), [
      { id: "snap_v3", immutable: true },
    ]);
    assert.equal(hasMigration(M07_MIGRATION_V3_ID, 1), true);
  });

  it("v4 → v5 preserves replay cursors and inserts lifecycle arrays if absent", () => {
    assert.equal(runM07StorageMigrations(), true);
    assert.equal(runM07SchemaV2Migration(), true);
    assert.equal(runM07SchemaV3Migration(), true);
    assert.equal(runM07SchemaV4Migration(), true);
    writeJsonSafe(M07_STORAGE_KEYS.publishedTimesheetReplayCheckpoints, [
      { id: "cp_v4", lastCompletedEventSequence: 3 },
    ]);
    // Simulate absent lifecycle keys before v5
    localStorage.removeItem(M07_STORAGE_KEYS.publishedTimesheetLifecycleProjections);
    assert.equal(runM07SchemaV5Migration(), true);
    assert.deepEqual(readJsonSafe(M07_STORAGE_KEYS.publishedTimesheetReplayCheckpoints, []), [
      { id: "cp_v4", lastCompletedEventSequence: 3 },
    ]);
    assert.deepEqual(readJsonSafe(M07_STORAGE_KEYS.publishedTimesheetLifecycleProjections, ["x"]), []);
    assert.equal(hasMigration(M07_MIGRATION_V4_ID, 1), true);
    assert.equal(hasMigration(M07_MIGRATION_V5_ID, 1), true);
  });

  it("repeated v5 is idempotent; interrupted v5 resumes without wipe", () => {
    assert.equal(runM07StorageMigrations(), true);
    assert.equal(runM07SchemaV2Migration(), true);
    assert.equal(runM07SchemaV3Migration(), true);
    assert.equal(runM07SchemaV4Migration(), true);
    writeJsonSafe(M07_STORAGE_KEYS.publishedTimesheetSnapshots, [{ id: "keep" }]);
    assert.equal(runM07SchemaV5Migration(), true);
    assert.equal(runM07SchemaV5Migration(), false);

    clearMigrationFlag(M07_MIGRATION_V5_ID);
    writeJsonSafe(M07_STORAGE_KEYS.publishedTimesheetLifecycleDecisions, [{ id: "keep_dec" }]);
    assert.equal(runM07SchemaV5Migration(), true);
    assert.deepEqual(readJsonSafe(M07_STORAGE_KEYS.publishedTimesheetSnapshots, []), [{ id: "keep" }]);
    assert.deepEqual(readJsonSafe(M07_STORAGE_KEYS.publishedTimesheetLifecycleDecisions, []), [
      { id: "keep_dec" },
    ]);
    assertNoForeignKeys();
  });
});
