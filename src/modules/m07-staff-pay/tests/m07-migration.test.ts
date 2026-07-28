import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { readJsonSafe, writeJsonSafe, hasMigration } from "@/platform/storage/storage";
import {
  M07_MIGRATION_ID,
  M07_MIGRATION_V2_ID,
  M07_STORAGE_KEYS,
  M07_STORAGE_VERSION,
  M07_SCHEMA_VERSION,
  runM07StorageMigrations,
  runM07SchemaV2Migration,
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
