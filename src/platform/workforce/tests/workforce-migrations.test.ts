/**
 * Storage migration repeated-run tests (Wave 1).
 */

import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";

import { hasMigration, readJsonSafe, readMigrationFlags, writeJsonSafe } from "@/platform/storage/storage";
import {
  M04_MIGRATION_ID,
  M04_STORAGE_KEYS,
  M04_STORAGE_VERSION,
  runM04StorageMigrations,
} from "@/modules/m04-staff-doctors/storage";
import {
  M05_MIGRATION_ID,
  M05_STORAGE_VERSION,
  runM05StorageMigrations,
} from "@/modules/m05-roster/storage";
import {
  M06_MIGRATION_ID,
  M06_STORAGE_VERSION,
  runM06StorageMigrations,
} from "@/modules/m06-time-attendance/storage";
import {
  M07_MIGRATION_ID,
  M07_STORAGE_VERSION,
  runM07StorageMigrations,
} from "@/modules/m07-staff-pay/storage";
import {
  M11_MIGRATION_ID,
  M11_STORAGE_VERSION,
  runM11StorageMigrations,
} from "@/modules/m11-training/storage";
import {
  M22_MIGRATION_ID,
  M22_STORAGE_VERSION,
  runM22StorageMigrations,
} from "@/modules/m22-recruitment/storage";

function installMemoryLocalStorage() {
  const store = new Map<string, string>();
  const localStorage = {
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
    removeItem(key: string) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
  (globalThis as { window?: { localStorage: typeof localStorage } }).window = { localStorage };
  return store;
}

describe("workforce storage migrations", () => {
  beforeEach(() => {
    installMemoryLocalStorage();
  });

  it("runs M04 skeleton once and is idempotent on repeat", () => {
    assert.equal(runM04StorageMigrations(), true);
    assert.equal(hasMigration(M04_MIGRATION_ID, M04_STORAGE_VERSION), true);
    assert.equal(runM04StorageMigrations(), false);

    const people = readJsonSafe<unknown[]>(M04_STORAGE_KEYS.people, ["sentinel"]);
    assert.deepEqual(people, []);
    const meta = readJsonSafe<{ version: number } | null>(M04_STORAGE_KEYS.meta, null);
    assert.equal(meta?.version, M04_STORAGE_VERSION);
  });

  it("runs all six module migrations once each", () => {
    assert.equal(runM04StorageMigrations(), true);
    assert.equal(runM05StorageMigrations(), true);
    assert.equal(runM06StorageMigrations(), true);
    assert.equal(runM07StorageMigrations(), true);
    assert.equal(runM11StorageMigrations(), true);
    assert.equal(runM22StorageMigrations(), true);

    assert.equal(runM04StorageMigrations(), false);
    assert.equal(runM05StorageMigrations(), false);
    assert.equal(runM06StorageMigrations(), false);
    assert.equal(runM07StorageMigrations(), false);
    assert.equal(runM11StorageMigrations(), false);
    assert.equal(runM22StorageMigrations(), false);

    const flags = readMigrationFlags();
    assert.equal(flags[M04_MIGRATION_ID], M04_STORAGE_VERSION);
    assert.equal(flags[M05_MIGRATION_ID], M05_STORAGE_VERSION);
    assert.equal(flags[M06_MIGRATION_ID], M06_STORAGE_VERSION);
    assert.equal(flags[M07_MIGRATION_ID], M07_STORAGE_VERSION);
    assert.equal(flags[M11_MIGRATION_ID], M11_STORAGE_VERSION);
    assert.equal(flags[M22_MIGRATION_ID], M22_STORAGE_VERSION);
  });

  it("does not wipe existing collection on re-seed path", () => {
    assert.equal(runM04StorageMigrations(), true);
    const existing = [{ id: "keep-me" }];
    writeJsonSafe(M04_STORAGE_KEYS.people, existing);
    assert.equal(runM04StorageMigrations(), false);
    assert.deepEqual(readJsonSafe(M04_STORAGE_KEYS.people, []), existing);
  });
});
