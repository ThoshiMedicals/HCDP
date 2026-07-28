import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { readJsonSafe } from "@/platform/storage/storage";
import {
  ORG_A,
  ORG_B,
  actorClinicManager,
  actorClerk,
  actorOrgB,
  actorPayAdmin,
  actorAll,
  resetM07TestEnv,
} from "./_helpers";
import { M07_STORAGE_KEYS } from "../storage/keys";
import { ensureM07Bootstrapped, resetM07BootstrapCacheForTests, M07_BOOTSTRAP_ENTITY_IDS } from "../storage/bootstrap";
import { clearM07LocalStoreCacheForTests, getEntitySettings, listAudit } from "../repository/local-store";
import { installMemoryLocalStorage } from "./_helpers";
import {
  readEntityPaySettings,
  upsertEntityPaySettings,
  bootstrapDefaultEntityPaySettings,
  seedEntityPaySettingsIfAbsent,
  isEphemeralEntitySettings,
  countStoredEntitySettings,
} from "../services/entity-settings-service";
import { createOrdinaryPayPeriod } from "../services/period-service";
import { M07PermissionError, M07LegalEntityScopeError } from "../permissions";

describe("M07 entity settings — no write under view (remediation)", () => {
  beforeEach(() => resetM07TestEnv());

  it("1. view-only actor cannot create or persist entity settings", () => {
    const viewer = actorClinicManager();
    assert.throws(
      () =>
        upsertEntityPaySettings(viewer, ORG_A, {
          cadenceDefault: "weekly",
        }),
      (e: unknown) => e instanceof M07PermissionError
    );
    assert.equal(getEntitySettings(ORG_A)?.cadenceDefault !== "weekly", true);
  });

  it("2. reading absent settings causes no storage mutation", () => {
    // Use an org that bootstrap did not seed
    const org = "org_unseeded_runtime";
    const before = readJsonSafe(M07_STORAGE_KEYS.legalEntities, []);
    const beforeLen = Array.isArray(before) ? before.length : 0;
    const viewer = actorAll();
    const read = readEntityPaySettings(viewer, org);
    assert.equal(isEphemeralEntitySettings(read), true);
    assert.equal(read.cadenceDefault, "fortnightly");
    assert.equal(getEntitySettings(org), null);
    const after = readJsonSafe(M07_STORAGE_KEYS.legalEntities, []);
    assert.equal(Array.isArray(after) ? after.length : 0, beforeLen);
  });

  it("3. authorised bootstrap/admin path can create defaults", () => {
    const admin = actorPayAdmin();
    // ORG_A may already be seeded by bootstrap — update is still an authorised write path.
    const created = upsertEntityPaySettings(admin, ORG_A, {
      cadenceDefault: "monthly",
      separationOfDuties: true,
    });
    assert.ok(created.version >= 1);
    assert.equal(getEntitySettings(ORG_A)?.cadenceDefault, "monthly");

    const seeded = seedEntityPaySettingsIfAbsent("org_seed_path_only", {
      cadenceDefault: "fortnightly",
    });
    assert.equal(seeded.created, true);
    assert.ok(getEntitySettings("org_seed_path_only"));

    // Re-bootstrap after clean storage proves system bootstrap creates defaults.
    installMemoryLocalStorage();
    clearM07LocalStoreCacheForTests();
    resetM07BootstrapCacheForTests();
    ensureM07Bootstrapped();
    for (const id of M07_BOOTSTRAP_ENTITY_IDS) {
      assert.ok(getEntitySettings(id), `expected bootstrap settings for ${id}`);
    }
  });

  it("4. re-running bootstrap is idempotent", () => {
    const first = bootstrapDefaultEntityPaySettings(["org_idem"]);
    assert.equal(first.createdIds.includes("org_idem"), true);
    const second = bootstrapDefaultEntityPaySettings(["org_idem"]);
    assert.equal(second.createdIds.length, 0);
    assert.equal(second.skippedIds.includes("org_idem"), true);
    assert.equal(getEntitySettings("org_idem")?.version, 1);
  });

  it("5. existing entity settings are not overwritten by seed", () => {
    const admin = actorPayAdmin();
    upsertEntityPaySettings(admin, ORG_A, { cadenceDefault: "weekly" });
    const before = getEntitySettings(ORG_A)!;
    const seed = seedEntityPaySettingsIfAbsent(ORG_A, { cadenceDefault: "monthly" });
    assert.equal(seed.created, false);
    assert.equal(getEntitySettings(ORG_A)?.cadenceDefault, "weekly");
    assert.equal(getEntitySettings(ORG_A)?.version, before.version);
  });

  it("6. period creation still requires period.create", () => {
    assert.throws(
      () =>
        createOrdinaryPayPeriod(actorClinicManager(), {
          legalEntityId: ORG_A,
          periodStart: "2026-09-01",
          periodEnd: "2026-09-14",
        }),
      (e: unknown) => e instanceof M07PermissionError
    );
  });

  it("7. period creation cannot bypass legal-entity isolation", () => {
    assert.throws(
      () =>
        createOrdinaryPayPeriod(actorOrgB(), {
          legalEntityId: ORG_A,
          periodStart: "2026-09-01",
          periodEnd: "2026-09-14",
        }),
      (e: unknown) => e instanceof M07LegalEntityScopeError
    );
  });

  it("8. authorised settings mutation produces an audit event", () => {
    const admin = actorPayAdmin();
    const updated = upsertEntityPaySettings(admin, ORG_A, { cadenceDefault: "weekly" });
    const audits = listAudit(ORG_A);
    assert.ok(
      audits.some(
        (a) =>
          a.entityId === updated.id &&
          (a.action === "entity-settings.create" || a.action === "entity-settings.update")
      )
    );
  });

  it("period create with clerk does not persist new settings when using ephemeral defaults", () => {
    const org = "org_period_only";
    const clerk: ReturnType<typeof actorClerk> = {
      ...actorClerk(),
      legalEntityIds: [org],
    };
    const beforeCount = countStoredEntitySettings();
    createOrdinaryPayPeriod(clerk, {
      legalEntityId: org,
      periodStart: "2026-10-01",
      periodEnd: "2026-10-14",
    });
    assert.equal(getEntitySettings(org), null);
    assert.equal(countStoredEntitySettings(), beforeCount);
  });
});
