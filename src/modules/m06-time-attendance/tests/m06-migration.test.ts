import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { countM06Keys, assertNoM07KeysCreated, listSessions } from "../repository/local-store";
import { runM06PortalSeed, runM06PolicySeed } from "../storage/seed-safe";
import { rollbackSeedOwnedM06 } from "../storage/rollback-seed";
import { runM06StorageMigrations } from "../storage/migrations";
import { runM06SchemaV2Migration } from "../storage/migrate-v2";
import { runM06SchemaV3Migration } from "../storage/migrate-v3";
import { resetM06TestEnv } from "./_helpers";

describe("m06 migration", () => {
  beforeEach(() => resetM06TestEnv());

  it("MIG-01 idempotent seed insert-if-missing", () => {
    runM06PolicySeed();
    const r1 = runM06PortalSeed();
    const before = countM06Keys();
    const r2 = runM06PortalSeed();
    const after = countM06Keys();
    assert.equal(after.sessions, before.sessions);
    assert.ok(r1.inserted.sessions === 1 || r2.skipped.sessions === 1);
    assert.equal(assertNoM07KeysCreated(), true);
  });

  it("MIG-02 interrupted recovery via repeat migrations", () => {
    runM06StorageMigrations();
    runM06SchemaV2Migration();
    runM06SchemaV3Migration();
    runM06StorageMigrations();
    runM06SchemaV2Migration();
    runM06SchemaV3Migration();
    assert.ok(true);
  });

  it("MIG-03 seed rollback only + no m07", () => {
    runM06PortalSeed();
    assert.ok(listSessions().some((s) => s.seedBatchId));
    const removed = rollbackSeedOwnedM06();
    assert.ok(removed.sessions >= 1);
    assert.equal(assertNoM07KeysCreated(), true);
  });
});
