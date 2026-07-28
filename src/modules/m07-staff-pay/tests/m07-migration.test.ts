import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { readJsonSafe, writeJsonSafe, hasMigration } from "@/platform/storage/storage";
import {
  M07_MIGRATION_ID,
  M07_MIGRATION_V2_ID,
  M07_MIGRATION_V3_ID,
  M07_MIGRATION_V4_ID,
  M07_MIGRATION_V5_ID,
  M07_STORAGE_KEYS,
  M07_STORAGE_VERSION,
  M07_SCHEMA_VERSION,
  runM07StorageMigrations,
  runM07SchemaV2Migration,
  runM07SchemaV3Migration,
  runM07SchemaV4Migration,
  runM07SchemaV5Migration,
  ensureM07Bootstrapped,
  resetM07BootstrapCacheForTests,
} from "../storage";
import { clearM07LocalStoreCacheForTests } from "../repository/local-store";
import { installMemoryLocalStorage } from "./_helpers";

describe("M07 migrations (Batch 1)", () => {
  beforeEach(() => {
    installMemoryLocalStorage();
    clearM07LocalStoreCacheForTests();
    resetM07BootstrapCacheForTests();
  });

  it("runs v1 once and is idempotent", () => {
    assert.equal(runM07StorageMigrations(), true);
    assert.equal(hasMigration(M07_MIGRATION_ID, M07_STORAGE_VERSION), true);
    assert.equal(runM07StorageMigrations(), false);
    assert.deepEqual(readJsonSafe(M07_STORAGE_KEYS.periods, ["x"]), []);
  });

  it("runs v2 additively without wiping existing periods", () => {
    assert.equal(runM07StorageMigrations(), true);
    const existing = [{ id: "keep-period" }];
    writeJsonSafe(M07_STORAGE_KEYS.periods, existing);
    assert.equal(runM07SchemaV2Migration(), true);
    assert.equal(runM07SchemaV2Migration(), false);
    assert.deepEqual(readJsonSafe(M07_STORAGE_KEYS.periods, []), existing);
    assert.ok(Array.isArray(readJsonSafe(M07_STORAGE_KEYS.profiles, null)));
    assert.ok(Array.isArray(readJsonSafe(M07_STORAGE_KEYS.rules, null)));
    assert.ok(Array.isArray(readJsonSafe(M07_STORAGE_KEYS.codes, null)));
    assert.ok(Array.isArray(readJsonSafe(M07_STORAGE_KEYS.exportProfiles, null)));
    assert.ok(Array.isArray(readJsonSafe(M07_STORAGE_KEYS.audit, null)));
    assert.equal(hasMigration(M07_MIGRATION_V2_ID, 1), true);
  });

  it("runs v3 snapshot migration additively and idempotently", () => {
    assert.equal(runM07StorageMigrations(), true);
    assert.equal(runM07SchemaV2Migration(), true);
    writeJsonSafe(M07_STORAGE_KEYS.periods, [{ id: "keep-period-v3" }]);
    assert.equal(runM07SchemaV3Migration(), true);
    assert.equal(runM07SchemaV3Migration(), false);
    assert.deepEqual(readJsonSafe(M07_STORAGE_KEYS.periods, []), [{ id: "keep-period-v3" }]);
    assert.deepEqual(readJsonSafe(M07_STORAGE_KEYS.publishedTimesheetSnapshots, ["x"]), []);
    assert.deepEqual(readJsonSafe(M07_STORAGE_KEYS.publishedTimesheetSnapshotIndex, ["x"]), []);
    assert.deepEqual(readJsonSafe(M07_STORAGE_KEYS.publishedTimesheetCurrentIntake, null), {});
    assert.equal(hasMigration(M07_MIGRATION_V3_ID, 1), true);
    const meta = readJsonSafe<{ version: number } | null>(M07_STORAGE_KEYS.meta, null);
    assert.equal(meta?.version, 3);
  });

  it("runs v4 replay migration additively and idempotently", () => {
    assert.equal(runM07StorageMigrations(), true);
    assert.equal(runM07SchemaV2Migration(), true);
    assert.equal(runM07SchemaV3Migration(), true);
    writeJsonSafe(M07_STORAGE_KEYS.publishedTimesheetSnapshots, [{ id: "keep_snap" }]);
    assert.equal(runM07SchemaV4Migration(), true);
    assert.equal(runM07SchemaV4Migration(), false);
    assert.deepEqual(readJsonSafe(M07_STORAGE_KEYS.publishedTimesheetSnapshots, []), [
      { id: "keep_snap" },
    ]);
    assert.deepEqual(readJsonSafe(M07_STORAGE_KEYS.publishedTimesheetReplayCheckpoints, ["x"]), []);
    assert.deepEqual(readJsonSafe(M07_STORAGE_KEYS.publishedTimesheetReplayOutcomes, ["x"]), []);
    assert.equal(hasMigration(M07_MIGRATION_V4_ID, 1), true);
    const meta = readJsonSafe<{ version: number } | null>(M07_STORAGE_KEYS.meta, null);
    assert.equal(meta?.version, 4);
  });

  it("runs v5 lifecycle migration additively and idempotently", () => {
    assert.equal(runM07StorageMigrations(), true);
    assert.equal(runM07SchemaV2Migration(), true);
    assert.equal(runM07SchemaV3Migration(), true);
    assert.equal(runM07SchemaV4Migration(), true);
    writeJsonSafe(M07_STORAGE_KEYS.publishedTimesheetReplayCheckpoints, [{ id: "keep_cp" }]);
    assert.equal(runM07SchemaV5Migration(), true);
    assert.equal(runM07SchemaV5Migration(), false);
    assert.deepEqual(readJsonSafe(M07_STORAGE_KEYS.publishedTimesheetReplayCheckpoints, []), [
      { id: "keep_cp" },
    ]);
    assert.deepEqual(readJsonSafe(M07_STORAGE_KEYS.publishedTimesheetLifecycleProjections, ["x"]), []);
    assert.deepEqual(readJsonSafe(M07_STORAGE_KEYS.publishedTimesheetSnapshotEligibility, ["x"]), []);
    assert.deepEqual(readJsonSafe(M07_STORAGE_KEYS.publishedTimesheetLifecycleDecisions, ["x"]), []);
    assert.deepEqual(readJsonSafe(M07_STORAGE_KEYS.publishedTimesheetLifecycleExceptions, ["x"]), []);
    assert.deepEqual(
      readJsonSafe(M07_STORAGE_KEYS.publishedTimesheetLifecycleEventApplications, ["x"]),
      []
    );
    assert.equal(hasMigration(M07_MIGRATION_V5_ID, 1), true);
    const meta = readJsonSafe<{ version: number } | null>(M07_STORAGE_KEYS.meta, null);
    assert.equal(meta?.version, M07_SCHEMA_VERSION);
  });

  it("seeds default minimum-PII export profile insert-if-absent", () => {
    ensureM07Bootstrapped();
    const profiles = readJsonSafe<Array<{ isDefaultMinimumPii?: boolean }>>(
      M07_STORAGE_KEYS.exportProfiles,
      []
    );
    assert.ok(profiles.some((p) => p.isDefaultMinimumPii));
  });

  it("does not touch M04/M05/M06 keys", () => {
    ensureM07Bootstrapped();
    assert.equal(localStorage.getItem("pulse.m04.staff.people"), null);
    assert.equal(localStorage.getItem("pulse.m05.roster.shifts"), null);
    assert.equal(localStorage.getItem("pulse.m06.attendance.timesheets"), null);
  });
});
