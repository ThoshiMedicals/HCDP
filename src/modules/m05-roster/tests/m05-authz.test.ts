/**
 * M05 permissions + clinic-scope enforcement (§17 of the plan).
 *
 * Evidence IDs:
 *   PERM-POS-01  Coordinator creates shift in scoped clinic — allow
 *   PERM-NEG-01  Worker publish attempt — deny
 *   PERM-NEG-02  Cross-clinic assign — deny
 *   PERM-POS-02  Scoped bulk: in-scope succeed, out-of-scope skip (partial success)
 *   PERM-NEG-03  Finance viewer mutation — deny
 *   PRIV-01      Sensitive cost masked without roster.cost.view
 *   PRIV-02      Export bypass prevention (no unscoped CSV via service)
 *   PERM-OV-01   Override without reason — deny; with reason+audit — allow
 */

import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";

import { resetWorkforceEventBusForTests } from "@/platform/workforce/services/workforce-event-bus";
import {
  clearClinicTimezoneOverridesForTests,
  registerClinicTimezone,
} from "@/platform/workforce/services/clinic-timezone";
import { registerWorkforceReadinessLookup } from "@/platform/workforce/services/workforce-eligibility";

import { runM05StorageMigrations } from "../storage/migrations";
import { runM05SchemaV2Migration } from "../storage/migrate-v2";
import { resetM05BootstrapCacheForTests } from "../storage/bootstrap";
import { createPeriod } from "../services/period-service";
import { createShift } from "../services/shift-service";
import { assignPerson } from "../services/assignment-service";
import { publishPeriod } from "../services/publication-service";
import { submitBulk } from "../services/bulk-operation-service";
import { buildCostForecast, maskForecastForActor } from "../services/cost-forecast-service";
import { exportShiftAssignmentsCsv } from "../services/reporting-service";
import {
  M05ClinicScopeError,
  M05PermissionError,
  mapDemoIdentityPermissions,
  type M05Actor,
} from "../permissions";
import { OverrideReasonRequiredError } from "../services/errors";

function installMemoryLocalStorage() {
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
}

const admin: M05Actor = { userId: "usr_admin", permissions: ["*"] };
const coordinatorA: M05Actor = {
  userId: "usr_coord_a",
  permissions: [
    "roster.view",
    "roster.period.create",
    "roster.shift.edit",
    "roster.assign",
    "roster.review",
    "roster.bulk",
    "roster.report",
    "roster.export",
  ],
  clinicIds: ["clinic_a"],
};
const worker: M05Actor = {
  userId: "usr_worker",
  permissions: ["roster.view", "roster.acknowledge", "roster.swap.request"],
  clinicIds: ["clinic_a"],
};
const financeViewer: M05Actor = {
  userId: "usr_finance",
  permissions: ["roster.view", "roster.cost.view", "roster.report", "roster.export"],
  clinicIds: ["clinic_a", "clinic_b"],
};
const overrideMgr: M05Actor = {
  userId: "usr_ov_mgr",
  permissions: [
    "roster.view",
    "roster.assign",
    "roster.shift.edit",
    "roster.publish",
    "roster.override",
    "roster.review",
  ],
  clinicIds: ["clinic_a"],
};

function registerReadinessOutcome(readiness: "ready" | "advisory" | "blocked" | "unknown", stale = false) {
  registerWorkforceReadinessLookup((personId, asOf) => ({
    personId,
    readiness,
    blockers:
      readiness === "blocked"
        ? [
            {
              code: "test.blocker",
              label: "test blocker",
              owningModuleId: "staff-doctors",
              severity: "blocking",
            },
          ]
        : [],
    asOf: asOf ?? new Date().toISOString(),
    stale,
    trainingDetailRefs: [],
  }));
}

describe("m05 authz", () => {
  beforeEach(() => {
    installMemoryLocalStorage();
    resetWorkforceEventBusForTests();
    resetM05BootstrapCacheForTests();
    clearClinicTimezoneOverridesForTests();
    registerWorkforceReadinessLookup(null);
    runM05StorageMigrations();
    runM05SchemaV2Migration();
    registerClinicTimezone("clinic_a", "Australia/Brisbane");
    registerClinicTimezone("clinic_b", "Pacific/Auckland");
    registerReadinessOutcome("ready");
  });

  it("PERM-POS-01: coordinator can create a shift in their own clinic", () => {
    const period = createPeriod(coordinatorA, {
      label: "PA-01",
      startsOn: "2026-08-03",
      endsOn: "2026-08-09",
      clinicId: "clinic_a",
    });
    const shift = createShift(coordinatorA, {
      rosterPeriodId: period.id,
      clinicId: "clinic_a",
      localStartYmd: "2026-08-03",
      localStartHm: "08:00",
      localEndYmd: "2026-08-03",
      localEndHm: "16:00",
    });
    assert.equal(shift.clinicId, "clinic_a");
  });

  it("PERM-NEG-01: worker cannot publish a period (missing roster.publish)", () => {
    const period = createPeriod(admin, {
      label: "PN-01",
      startsOn: "2026-08-03",
      endsOn: "2026-08-09",
      clinicId: "clinic_a",
    });
    assert.throws(
      () =>
        publishPeriod(worker, {
          rosterPeriodId: period.id,
          expectedPeriodVersion: period.version,
        }),
      M05PermissionError
    );
  });

  it("PERM-NEG-02: cross-clinic assign is denied (clinic scope)", () => {
    const period = createPeriod(admin, {
      label: "PN-02",
      startsOn: "2026-08-03",
      endsOn: "2026-08-09",
      clinicId: "clinic_b",
    });
    const shift = createShift(admin, {
      rosterPeriodId: period.id,
      clinicId: "clinic_b",
      localStartYmd: "2026-08-03",
      localStartHm: "08:00",
      localEndYmd: "2026-08-03",
      localEndHm: "16:00",
    });
    assert.throws(
      () =>
        assignPerson(coordinatorA, {
          shiftId: shift.id,
          personId: "person_x",
          expectedShiftVersion: shift.version,
        }),
      M05ClinicScopeError
    );
  });

  it("PERM-POS-02: bulk partial success — in-scope succeed, out-of-scope skip", () => {
    const periodA = createPeriod(admin, {
      label: "BulkA",
      startsOn: "2026-08-03",
      endsOn: "2026-08-09",
      clinicId: "clinic_a",
    });
    const periodB = createPeriod(admin, {
      label: "BulkB",
      startsOn: "2026-08-03",
      endsOn: "2026-08-09",
      clinicId: "clinic_b",
    });
    const result = submitBulk(coordinatorA, [
      {
        idempotencyKey: "op-in",
        kind: "create-shift",
        clinicId: "clinic_a",
        payload: {
          rosterPeriodId: periodA.id,
          localStartYmd: "2026-08-03",
          localStartHm: "08:00",
          localEndYmd: "2026-08-03",
          localEndHm: "16:00",
        },
      },
      {
        idempotencyKey: "op-out",
        kind: "create-shift",
        clinicId: "clinic_b",
        payload: {
          rosterPeriodId: periodB.id,
          localStartYmd: "2026-08-03",
          localStartHm: "08:00",
          localEndYmd: "2026-08-03",
          localEndHm: "16:00",
        },
      },
    ]);
    assert.equal(result.succeeded.length, 1);
    assert.equal(result.failed.length, 1);
    assert.equal(result.skippedOutOfScope.length, 1);
    assert.equal(result.skippedOutOfScope[0], "op-out");
  });

  it("PERM-NEG-03: finance viewer cannot mutate assignments", () => {
    const period = createPeriod(admin, {
      label: "FN-03",
      startsOn: "2026-08-03",
      endsOn: "2026-08-09",
      clinicId: "clinic_a",
    });
    const shift = createShift(admin, {
      rosterPeriodId: period.id,
      clinicId: "clinic_a",
      localStartYmd: "2026-08-03",
      localStartHm: "08:00",
      localEndYmd: "2026-08-03",
      localEndHm: "16:00",
    });
    assert.throws(
      () =>
        assignPerson(financeViewer, {
          shiftId: shift.id,
          personId: "person_x",
          expectedShiftVersion: shift.version,
        }),
      M05PermissionError
    );
  });

  it("PRIV-01: cost forecast rates masked without roster.cost.view", () => {
    const period = createPeriod(admin, {
      label: "PR-01",
      startsOn: "2026-08-03",
      endsOn: "2026-08-09",
      clinicId: "clinic_a",
    });
    createShift(admin, {
      rosterPeriodId: period.id,
      clinicId: "clinic_a",
      localStartYmd: "2026-08-03",
      localStartHm: "08:00",
      localEndYmd: "2026-08-03",
      localEndHm: "16:00",
      roleLabel: "Nurse",
    });
    const forecast = buildCostForecast(admin, {
      rosterPeriodId: period.id,
      ratesByRole: { Nurse: 50 },
      allowancesPerShift: 10,
      onCostsPercent: 20,
    });
    assert.ok(forecast.grandTotal > 0);
    const masked = maskForecastForActor(coordinatorA, forecast);
    assert.equal(masked.grandTotal, 0);
    assert.ok(masked.lineItems.every((li) => li.ratePerHour === null));
    // Finance viewer WITH cost.view sees the real numbers
    const unmasked = maskForecastForActor(financeViewer, forecast);
    assert.equal(unmasked.grandTotal, forecast.grandTotal);
    assert.ok(unmasked.lineItems.some((li) => li.ratePerHour !== null));
  });

  it("PRIV-02: export cannot bypass clinic scope, and empty-scope actor is denied", () => {
    const periodA = createPeriod(admin, {
      label: "EX-A",
      startsOn: "2026-08-03",
      endsOn: "2026-08-09",
      clinicId: "clinic_a",
    });
    const periodB = createPeriod(admin, {
      label: "EX-B",
      startsOn: "2026-08-03",
      endsOn: "2026-08-09",
      clinicId: "clinic_b",
    });
    createShift(admin, {
      rosterPeriodId: periodA.id,
      clinicId: "clinic_a",
      localStartYmd: "2026-08-03",
      localStartHm: "08:00",
      localEndYmd: "2026-08-03",
      localEndHm: "16:00",
      roleLabel: "Nurse",
    });
    createShift(admin, {
      rosterPeriodId: periodB.id,
      clinicId: "clinic_b",
      localStartYmd: "2026-08-03",
      localStartHm: "08:00",
      localEndYmd: "2026-08-03",
      localEndHm: "16:00",
      roleLabel: "Nurse",
    });

    const csv = exportShiftAssignmentsCsv(coordinatorA);
    // Header + one row (clinic_a only)
    const lines = csv.split("\n");
    assert.equal(lines.length, 2);
    assert.match(lines[1]!, /clinic_a/);
    assert.doesNotMatch(csv, /clinic_b/);

    // Actor with no clinic scope but export permission: still filtered to
    // zero rows in scope (no cross-clinic leak). We simulate empty-scope with
    // clinicIds: [] which forces isInActorClinicScope → false for any clinic.
    const emptyScope: M05Actor = {
      userId: "usr_none",
      permissions: ["roster.view", "roster.report", "roster.export"],
      clinicIds: [],
    };
    const csv2 = exportShiftAssignmentsCsv(emptyScope);
    assert.equal(csv2.split("\n").length, 1); // header only
  });

  it("PERM-OV-01: override without reason denied; with reason + roster.override allowed", () => {
    registerReadinessOutcome("blocked"); // force hard-block
    const period = createPeriod(admin, {
      label: "OV-01",
      startsOn: "2026-08-03",
      endsOn: "2026-08-09",
      clinicId: "clinic_a",
    });
    const shift = createShift(admin, {
      rosterPeriodId: period.id,
      clinicId: "clinic_a",
      localStartYmd: "2026-08-03",
      localStartHm: "08:00",
      localEndYmd: "2026-08-03",
      localEndHm: "16:00",
    });
    // Without override reason → denied
    assert.throws(() =>
      assignPerson(overrideMgr, {
        shiftId: shift.id,
        personId: "person_1",
        expectedShiftVersion: shift.version,
      })
    );
    // With override reason + roster.override permission → allowed
    const assigned = assignPerson(overrideMgr, {
      shiftId: shift.id,
      personId: "person_1",
      expectedShiftVersion: shift.version,
      overrideReason: "Clinic critical shortage",
    });
    assert.equal(assigned.state, "assigned");
    assert.equal(assigned.overrideReason, "Clinic critical shortage");
    assert.equal(assigned.overrideBy, overrideMgr.userId);
  });

  it("assign without any permission throws M05PermissionError", () => {
    const period = createPeriod(admin, {
      label: "NP",
      startsOn: "2026-08-03",
      endsOn: "2026-08-09",
      clinicId: "clinic_a",
    });
    const shift = createShift(admin, {
      rosterPeriodId: period.id,
      clinicId: "clinic_a",
      localStartYmd: "2026-08-03",
      localStartHm: "08:00",
      localEndYmd: "2026-08-03",
      localEndHm: "16:00",
    });
    const nobody: M05Actor = { userId: "u", permissions: [] };
    assert.throws(
      () =>
        assignPerson(nobody, {
          shiftId: shift.id,
          personId: "p",
          expectedShiftVersion: shift.version,
        }),
      M05PermissionError
    );
  });

  it("mapDemoIdentityPermissions honours workforce roles", () => {
    const wildcard = mapDemoIdentityPermissions({
      permissions: ["*"],
      managerControls: true,
      sensitivityClearance: "full",
    });
    assert.ok(wildcard.includes("*"));
    const workerLike = mapDemoIdentityPermissions({
      permissions: [],
      managerControls: false,
      sensitivityClearance: "restricted",
    });
    assert.deepEqual(workerLike, ["roster.view", "roster.acknowledge", "roster.swap.request"]);
    const restrictedMgr = mapDemoIdentityPermissions({
      permissions: [],
      managerControls: true,
      sensitivityClearance: "restricted",
    });
    assert.ok(!restrictedMgr.includes("roster.cost.view"));
    assert.ok(!restrictedMgr.includes("roster.override"));
    const fullMgr = mapDemoIdentityPermissions({
      permissions: [],
      managerControls: true,
      sensitivityClearance: "full",
    });
    assert.ok(fullMgr.includes("roster.cost.view"));
    assert.ok(fullMgr.includes("roster.override"));
  });

  // Silence unused import while retaining assertion vocabulary in this suite
  void OverrideReasonRequiredError;
});
