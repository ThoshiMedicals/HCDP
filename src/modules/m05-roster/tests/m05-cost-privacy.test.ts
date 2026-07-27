/**
 * M05 cost + privacy safeguards (§14 / §17 of the plan).
 *
 * PRIV-01: masking of rate/cost numbers without `roster.cost.view`
 * PRIV-02: export bypass prevention (no unscoped CSV, no cost columns without
 *          `roster.cost.view`, empty-scope actor sees zero rows)
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
import {
  buildCostForecast,
  maskForecastForActor,
  listCostForecastsForActor,
} from "../services/cost-forecast-service";
import {
  exportShiftAssignmentsCsv,
  buildScopedReport,
} from "../services/reporting-service";
import type { M05Actor } from "../permissions";

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
const CLINIC_A = "clinic_a";
const CLINIC_B = "clinic_b";

const managerA: M05Actor = {
  userId: "usr_a",
  permissions: [
    "roster.view",
    "roster.assign",
    "roster.shift.edit",
    "roster.report",
    "roster.export",
    // NOTE: no roster.cost.view
  ],
  clinicIds: [CLINIC_A],
};
const financeA: M05Actor = {
  userId: "usr_finance_a",
  permissions: [
    "roster.view",
    "roster.report",
    "roster.export",
    "roster.cost.view",
  ],
  clinicIds: [CLINIC_A],
};

function setupPeriods() {
  const periodA = createPeriod(admin, {
    label: "A",
    startsOn: "2026-08-03",
    endsOn: "2026-08-09",
    clinicId: CLINIC_A,
  });
  const periodB = createPeriod(admin, {
    label: "B",
    startsOn: "2026-08-03",
    endsOn: "2026-08-09",
    clinicId: CLINIC_B,
  });
  const shiftA = createShift(admin, {
    rosterPeriodId: periodA.id,
    clinicId: CLINIC_A,
    localStartYmd: "2026-08-03",
    localStartHm: "08:00",
    localEndYmd: "2026-08-03",
    localEndHm: "16:00",
    roleLabel: "Nurse",
  });
  assignPerson(admin, {
    shiftId: shiftA.id,
    personId: "worker_a",
    expectedShiftVersion: shiftA.version,
  });
  const shiftB = createShift(admin, {
    rosterPeriodId: periodB.id,
    clinicId: CLINIC_B,
    localStartYmd: "2026-08-03",
    localStartHm: "08:00",
    localEndYmd: "2026-08-03",
    localEndHm: "16:00",
    roleLabel: "Nurse",
  });
  assignPerson(admin, {
    shiftId: shiftB.id,
    personId: "worker_b",
    expectedShiftVersion: shiftB.version,
  });
  return { periodA, periodB, shiftA, shiftB };
}

describe("m05 cost + privacy", () => {
  beforeEach(() => {
    installMemoryLocalStorage();
    resetWorkforceEventBusForTests();
    resetM05BootstrapCacheForTests();
    clearClinicTimezoneOverridesForTests();
    registerWorkforceReadinessLookup((personId, asOf) => ({
      personId,
      readiness: "ready",
      blockers: [],
      asOf: asOf ?? new Date().toISOString(),
      stale: false,
      trainingDetailRefs: [],
    }));
    runM05StorageMigrations();
    runM05SchemaV2Migration();
    registerClinicTimezone(CLINIC_A, "Australia/Brisbane");
    registerClinicTimezone(CLINIC_B, "Pacific/Auckland");
  });

  it("PRIV-01: maskForecastForActor zeroes rate/cost totals without roster.cost.view", () => {
    const { periodA } = setupPeriods();
    const forecast = buildCostForecast(admin, {
      rosterPeriodId: periodA.id,
      ratesByRole: { Nurse: 50 },
      allowancesPerShift: 10,
      onCostsPercent: 20,
    });
    assert.ok(forecast.grandTotal > 0);
    assert.ok(forecast.ordinaryTotal > 0);

    const masked = maskForecastForActor(managerA, forecast);
    assert.equal(masked.ordinaryTotal, 0);
    assert.equal(masked.overtimeTotal, 0);
    assert.equal(masked.grandTotal, 0);
    assert.ok(masked.lineItems.every((li) => li.ratePerHour === null));
    assert.ok(masked.lineItems.every((li) => li.subtotal === null));
    // Line item structure (identity fields) preserved
    assert.equal(masked.lineItems.length, forecast.lineItems.length);

    const unmasked = maskForecastForActor(financeA, forecast);
    assert.equal(unmasked.grandTotal, forecast.grandTotal);
    assert.ok(unmasked.lineItems.some((li) => li.ratePerHour !== null));
  });

  it("PRIV-01: listCostForecastsForActor masks results at the service layer", () => {
    const { periodA } = setupPeriods();
    buildCostForecast(admin, {
      rosterPeriodId: periodA.id,
      ratesByRole: { Nurse: 40 },
      allowancesPerShift: 5,
      onCostsPercent: 15,
    });
    const forActorNoCost = listCostForecastsForActor(managerA, periodA.id);
    assert.equal(forActorNoCost.length, 1);
    assert.equal(forActorNoCost[0]!.grandTotal, 0);
    const forActorCost = listCostForecastsForActor(financeA, periodA.id);
    assert.ok(forActorCost.length === 1 && forActorCost[0]!.grandTotal > 0);
  });

  it("PRIV-02: exportShiftAssignmentsCsv is clinic-scoped and does NOT include cost columns without roster.cost.view", () => {
    setupPeriods();
    const csv = exportShiftAssignmentsCsv(managerA, { includeCosts: true });
    const lines = csv.split("\n");
    assert.equal(lines.length, 2); // header + 1 row (only clinic_a)
    // Header should NOT include hours (cost view missing)
    assert.doesNotMatch(lines[0]!, /hours/);
    // Row must not reference clinic_b
    assert.doesNotMatch(csv, /clinic_b/);
    assert.match(lines[1]!, /clinic_a/);
  });

  it("PRIV-02: finance viewer WITH cost.view can request cost columns in export", () => {
    setupPeriods();
    const csv = exportShiftAssignmentsCsv(financeA, { includeCosts: true });
    const lines = csv.split("\n");
    assert.match(lines[0]!, /hours/);
    // Only clinic_a data (finance is scoped to clinic_a here)
    assert.doesNotMatch(csv, /clinic_b/);
  });

  it("PRIV-02: empty clinic-scope actor sees zero rows on export/report", () => {
    setupPeriods();
    const emptyScope: M05Actor = {
      userId: "u",
      permissions: ["roster.view", "roster.report", "roster.export"],
      clinicIds: [],
    };
    const csv = exportShiftAssignmentsCsv(emptyScope);
    assert.equal(csv.split("\n").length, 1); // header only
    const report = buildScopedReport(emptyScope);
    assert.equal(report.periods.length, 0);
    assert.equal(report.shifts.length, 0);
    assert.equal(report.assignments.length, 0);
  });

  it("buildScopedReport respects scope.clinicIds filter", () => {
    setupPeriods();
    const orgAdmin: M05Actor = {
      userId: "u_admin",
      permissions: ["*"],
    };
    const scopedToB = buildScopedReport(orgAdmin, { clinicIds: [CLINIC_B] });
    assert.ok(scopedToB.periods.every((p) => p.clinicId === CLINIC_B));
    assert.ok(scopedToB.shifts.every((s) => s.clinicId === CLINIC_B));
  });

  it("cost forecast body always carries planningOnly: true (never payroll truth)", () => {
    const { periodA } = setupPeriods();
    const forecast = buildCostForecast(admin, {
      rosterPeriodId: periodA.id,
      ratesByRole: { Nurse: 50 },
    });
    assert.equal(forecast.planningOnly, true);
    // Even after masking, planningOnly must still be preserved
    const masked = maskForecastForActor(managerA, forecast);
    assert.equal(masked.planningOnly, true);
  });
});
