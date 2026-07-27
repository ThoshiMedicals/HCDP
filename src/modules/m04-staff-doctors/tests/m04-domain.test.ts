/**
 * M04 domain tests — Wave 2.
 */

import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";

import { PLATFORM_KEYS, readJsonSafe, writeJsonSafe, hasMigration } from "@/platform/storage/storage";
import { resetWorkforceEventBusForTests } from "@/platform/workforce/services/workforce-event-bus";
import { M04_STORAGE_KEYS, M04_PORTAL_SEED_MIGRATION_ID, M04_PORTAL_SEED_VERSION } from "../storage/keys";
import { buildPortalSeedPeople, migrateFromPortalOnce } from "../storage/migrate-from-portal";
import { runM04StorageMigrations } from "../storage/migrations";
import { resetM04BootstrapCacheForTests } from "../storage/bootstrap";
import * as store from "../repository/local-store";
import { createPerson, softArchivePerson, suspendPerson, reinstatePerson } from "../services/person-service";
import { createEngagement, findEngagementOverlap } from "../services/engagement-service";
import { createCredential, verifyCredential } from "../services/credential-service";
import {
  calculateReadiness,
  getEffectiveReadiness,
  invalidateReadinessForPerson,
} from "../services/readiness-service";
import { requestLeave, approveLeave, addAvailability } from "../services/leave-service";
import {
  createRestriction,
  listRestrictionsForActor,
  startOffboarding,
  markOffboardingIncomplete,
} from "../services/lifecycle-service";
import { syncExpiredCredentialToInbox } from "../adapters/m04-inbox-sync";
import { getWorkforceCounts } from "../adapters/m04-executive";
import { mapDemoIdentityPermissions, assertM04Permission } from "../permissions";
import type { M04Actor } from "../permissions";
import { M2_STORAGE } from "@/lib/action-inbox/storage";
import { loadActions } from "@/lib/action-inbox/repository";

function installMemoryLocalStorage() {
  const map = new Map<string, string>();
  const localStorage = {
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
    removeItem(key: string) {
      map.delete(key);
    },
    clear() {
      map.clear();
    },
  };
  (globalThis as { window?: { localStorage: typeof localStorage } }).window = { localStorage };
  return map;
}

const admin: M04Actor = { userId: "usr_admin", permissions: ["*"] };
const managerNoSensitive: M04Actor = {
  userId: "usr_mgr",
  permissions: mapDemoIdentityPermissions({
    permissions: [],
    managerControls: true,
    sensitivityClearance: "restricted",
  }),
};

describe("m04 domain", () => {
  beforeEach(() => {
    installMemoryLocalStorage();
    resetWorkforceEventBusForTests();
    resetM04BootstrapCacheForTests();
    runM04StorageMigrations();
  });

  it("prevents duplicate people by name+email", () => {
    createPerson(admin, {
      personKind: "staff",
      preferredName: "Alex Test",
      email: "alex@example.com",
    });
    assert.throws(
      () =>
        createPerson(admin, {
          personKind: "staff",
          preferredName: "Alex Test",
          email: "alex@example.com",
        }),
      /Duplicate person/
    );
  });

  it("rejects overlapping engagements at the same clinic", () => {
    const person = createPerson(admin, {
      personKind: "staff",
      preferredName: "Engager",
      email: "eng@example.com",
    });
    createEngagement(admin, {
      personId: person.id,
      clinicId: "loc_a",
      organisationId: "org_parent",
      roleLabel: "Nurse",
      employmentType: "Casual",
      effectiveFrom: "2026-01-01",
      effectiveTo: "2026-06-30",
    });
    assert.throws(
      () =>
        createEngagement(admin, {
          personId: person.id,
          clinicId: "loc_a",
          organisationId: "org_parent",
          roleLabel: "Reception",
          employmentType: "Casual",
          effectiveFrom: "2026-06-01",
          effectiveTo: "2026-12-31",
        }),
      /overlaps/
    );
    assert.ok(
      findEngagementOverlap(person.id, "loc_a", "2026-06-01", "2026-12-31")
    );
  });

  it("invalidates readiness when sources change; stale is not Ready", () => {
    const person = createPerson(admin, {
      personKind: "doctor",
      preferredName: "Dr Ready",
      email: "ready@example.com",
    });
    createCredential(admin, {
      personId: person.id,
      organisationId: "org_parent",
      credentialType: "AHPRA",
      expiresOn: "2099-01-01",
    });
    const refs = store.listCredentials(person.id);
    verifyCredential(admin, refs[0]!.id);
    const ready = calculateReadiness(person.id);
    assert.equal(ready.readiness, "ready");

    invalidateReadinessForPerson(person.id);
    const stale = getEffectiveReadiness(person.id);
    assert.equal(stale.stale, true);
    assert.notEqual(stale.readiness, "ready");

    createCredential(admin, {
      personId: person.id,
      organisationId: "org_parent",
      credentialType: "CPR",
      expiresOn: "2020-01-01",
    });
    const after = getEffectiveReadiness(person.id);
    assert.equal(after.stale, true);
    const recalculated = calculateReadiness(person.id);
    assert.equal(recalculated.readiness, "blocked");
  });

  it("masks sensitive restriction fields without view_sensitive", () => {
    const person = createPerson(admin, {
      personKind: "staff",
      preferredName: "Restricted Person",
      email: "rest@example.com",
    });
    createRestriction(admin, {
      personId: person.id,
      organisationId: "org_parent",
      sensitivity: "Confidential",
      title: "Adjustment",
      detail: "SECRET_DETAIL",
      reason: "SECRET_REASON",
      effectiveFrom: "2026-01-01",
    });
    const masked = listRestrictionsForActor(managerNoSensitive, person.id);
    assert.equal(masked.length, 1);
    assert.equal(masked[0]!.masked, true);
    assert.notEqual(masked[0]!.detail, "SECRET_DETAIL");
    assert.match(masked[0]!.detail, /restricted/);

    const full = listRestrictionsForActor(admin, person.id);
    assert.equal(full[0]!.masked, false);
    assert.equal(full[0]!.detail, "SECRET_DETAIL");
  });

  it("rejects leave self-approval", () => {
    const person = createPerson(admin, {
      personKind: "staff",
      preferredName: "Leavee",
      email: "leave@example.com",
    });
    const selfActor: M04Actor = { userId: "usr_self", permissions: ["*"] };
    const leave = requestLeave(selfActor, {
      personId: person.id,
      organisationId: "org_parent",
      startDate: "2026-08-01",
      endDate: "2026-08-05",
      leaveType: "Annual",
    });
    assert.throws(() => approveLeave(selfActor, leave.id, "Approved"), /Self-approval/);
  });

  it("portal seed migration is idempotent and does not wipe people", () => {
    const built = buildPortalSeedPeople();
    assert.ok(built.report.sourceCount > 0);
    assert.equal(built.report.migratedCount + built.report.duplicates + built.report.rejected, built.report.sourceCount);

    const first = migrateFromPortalOnce();
    assert.ok(first);
    assert.ok(first!.migratedCount > 0);
    const countAfterFirst = store.listPeople().length;
    assert.equal(countAfterFirst, first!.migratedCount);

    const second = migrateFromPortalOnce();
    assert.equal(second, null);
    assert.equal(store.listPeople().length, countAfterFirst);

    // Flag set
    const flags = readJsonSafe<Record<string, number>>(PLATFORM_KEYS.migrations, {});
    assert.equal(flags[M04_PORTAL_SEED_MIGRATION_ID], M04_PORTAL_SEED_VERSION);
  });

  it("inbox sync dedupes expired credential projections", () => {
    writeJsonSafe(M2_STORAGE.actions, []);
    writeJsonSafe(PLATFORM_KEYS.sourceLinks, {});

    const person = createPerson(admin, {
      personKind: "staff",
      preferredName: "Expired Cred",
      email: "exp@example.com",
    });
    const cred = createCredential(admin, {
      personId: person.id,
      organisationId: "org_parent",
      credentialType: "CPR",
      expiresOn: "2020-01-01",
    });
    assert.equal(cred.status, "expired");

    syncExpiredCredentialToInbox(cred);
    syncExpiredCredentialToInbox(cred);
    const actions = loadActions().filter((a) => a.title.includes("Credential expired"));
    assert.equal(actions.length, 1);
  });

  it("soft-archives people without hard delete", () => {
    const person = createPerson(admin, {
      personKind: "staff",
      preferredName: "Archive Me",
      email: "arch@example.com",
    });
    softArchivePerson(admin, person.id);
    const stillThere = store.getPerson(person.id);
    assert.ok(stillThere);
    assert.equal(stillThere!.status, "Archived");
    assert.equal(store.listPeople().filter((p) => p.id === person.id).length, 1);
  });

  it("suspends and reinstates", () => {
    const person = createPerson(admin, {
      personKind: "staff",
      preferredName: "Suspend Me",
      email: "sus@example.com",
    });
    suspendPerson(admin, person.id);
    assert.equal(store.getPerson(person.id)!.status, "Suspended");
    reinstatePerson(admin, person.id);
    assert.equal(store.getPerson(person.id)!.status, "Active");
  });

  it("maps demo identity permissions for managers without sensitive clearance", () => {
    const perms = mapDemoIdentityPermissions({
      permissions: [],
      managerControls: true,
      sensitivityClearance: "restricted",
    });
    assert.ok(perms.includes("workforce.view"));
    assert.ok(perms.includes("leave.approve"));
    assert.ok(!perms.includes("restriction.view_sensitive"));
    assert.throws(
      () => assertM04Permission({ userId: "x", permissions: perms }, "restriction.view_sensitive"),
      /Missing M04 permission/
    );
  });

  it("incomplete offboarding can sync without duplicating", () => {
    writeJsonSafe(M2_STORAGE.actions, []);
    writeJsonSafe(PLATFORM_KEYS.sourceLinks, {});
    const person = createPerson(admin, {
      personKind: "staff",
      preferredName: "Leaving",
      email: "off@example.com",
    });
    const record = startOffboarding(admin, {
      personId: person.id,
      organisationId: "org_parent",
      openResponsibilities: ["Keys"],
    });
    markOffboardingIncomplete(admin, record.id);
    markOffboardingIncomplete(admin, record.id);
    const actions = loadActions().filter((a) => a.title.includes("Incomplete offboarding"));
    assert.equal(actions.length, 1);
  });

  it("rejects unauthorized service calls without permission", () => {
    const viewer: M04Actor = { userId: "usr_view", permissions: ["workforce.view"] };
    assert.throws(
      () =>
        createPerson(viewer, {
          personKind: "staff",
          preferredName: "No Create",
          email: "nocreate@example.com",
        }),
      /Missing M04 permission/
    );
  });

  it("enforces clinic-scoped person mutations", () => {
    const scoped: M04Actor = {
      userId: "usr_clinic",
      permissions: ["workforce.create", "workforce.edit", "workforce.suspend"],
      clinicIds: ["clinic_a"],
    };
    const inScope = createPerson(scoped, {
      personKind: "staff",
      preferredName: "Clinic A Staff",
      email: "a@example.com",
      clinicIds: ["clinic_a"],
    });
    assert.equal(inScope.clinicIds[0], "clinic_a");
    assert.throws(
      () =>
        createPerson(scoped, {
          personKind: "staff",
          preferredName: "Clinic B Staff",
          email: "b@example.com",
          clinicIds: ["clinic_b"],
        }),
      /clinic scope/i
    );

    const other = createPerson(admin, {
      personKind: "staff",
      preferredName: "Other Clinic",
      email: "other@example.com",
      clinicIds: ["clinic_b"],
    });
    assert.throws(() => suspendPerson(scoped, other.id), /clinic scope/i);
  });

  it("M01 workforce counts respect clinic filter", () => {
    createPerson(admin, {
      personKind: "staff",
      preferredName: "Count Staff A",
      email: "csa@example.com",
      clinicIds: ["clinic_a"],
    });
    createPerson(admin, {
      personKind: "doctor",
      preferredName: "Count Doc B",
      email: "cdb@example.com",
      clinicIds: ["clinic_b"],
    });
    const all = getWorkforceCounts();
    assert.ok(all.activeStaff >= 1);
    assert.ok(all.activeDoctors >= 1);
    const aOnly = getWorkforceCounts("clinic_a");
    assert.equal(aOnly.activeDoctors, 0);
    assert.ok(aOnly.activeStaff >= 1);
    const bOnly = getWorkforceCounts("clinic_b");
    assert.equal(bOnly.activeStaff, 0);
    assert.ok(bOnly.activeDoctors >= 1);
  });

  it("availability changes invalidate readiness cache freshness", () => {
    const person = createPerson(admin, {
      personKind: "staff",
      preferredName: "Avail Person",
      email: "avail@example.com",
    });
    calculateReadiness(person.id);
    assert.equal(getEffectiveReadiness(person.id).stale, false);
    addAvailability(admin, {
      personId: person.id,
      organisationId: "org_parent",
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "17:00",
      effectiveFrom: "2026-01-01",
    });
    assert.equal(getEffectiveReadiness(person.id).stale, true);
    assert.notEqual(getEffectiveReadiness(person.id).readiness, "ready");
  });

  it("portal seed verifies uniqueness, classification, required fields, idempotency and rollback scope", () => {
    const built = buildPortalSeedPeople();
    assert.equal(built.report.sourceCount, 148);
    assert.equal(built.report.migratedCount, 148);
    assert.equal(built.people.filter((p) => p.personKind === "staff").length, 100);
    assert.equal(built.people.filter((p) => p.personKind === "doctor").length, 48);

    const ids = built.people.map((p) => p.id);
    const legacyIds = built.people.map((p) => p.legacyId).filter(Boolean) as string[];
    assert.equal(new Set(ids).size, ids.length, "canonical person ids must be unique");
    assert.equal(new Set(legacyIds).size, legacyIds.length, "legacy ids must be unique");
    assert.equal(legacyIds.length, 148);

    for (const p of built.people) {
      assert.ok(p.id, "id required");
      assert.ok(p.legacyId, "legacyId required");
      assert.ok(p.preferredName.trim(), "preferredName required");
      assert.ok(["staff", "doctor"].includes(p.personKind));
      assert.ok(p.organisationId, "organisationId required");
      assert.ok(p.status, "status required");
      assert.ok(Array.isArray(p.clinicIds));
    }

    // Capture a fake "portal" bag marker — must remain after seed + rollback.
    const portalBagKey = "pulse.portal.records.staff";
    writeJsonSafe(portalBagKey, [{ id: "legacy-should-survive", name: "Portal Only" }]);

    const first = migrateFromPortalOnce();
    assert.ok(first);
    assert.equal(store.listPeople().length, 148);
    assert.equal(migrateFromPortalOnce(), null);
    assert.equal(store.listPeople().length, 148);

    const portalBeforeRollback = readJsonSafe(portalBagKey, null);
    assert.ok(portalBeforeRollback);

    const flags = readJsonSafe<Record<string, number>>(PLATFORM_KEYS.migrations, {});
    delete flags[M04_PORTAL_SEED_MIGRATION_ID];
    writeJsonSafe(PLATFORM_KEYS.migrations, flags);
    for (const key of Object.values(M04_STORAGE_KEYS)) {
      writeJsonSafe(key, key === M04_STORAGE_KEYS.meta ? null : []);
    }
    resetM04BootstrapCacheForTests();

    assert.equal(store.listPeople().length, 0);
    assert.equal(hasMigration(M04_PORTAL_SEED_MIGRATION_ID, M04_PORTAL_SEED_VERSION), false);
    assert.deepEqual(readJsonSafe(portalBagKey, null), portalBeforeRollback);

    // Re-seed after rollback still works
    const again = migrateFromPortalOnce();
    assert.ok(again);
    assert.equal(store.listPeople().length, 148);
  });
});
