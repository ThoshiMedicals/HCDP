/**
 * M05 eligibility orchestration (§7 of the plan).
 *
 * Rules covered:
 *  - authority is always "m04-platform"
 *  - hard-block on M04 blocking readiness
 *  - warning on advisory readiness
 *  - authorised override with reason permits despite hard-block
 *  - never overridable when person unknown, TZ unresolved, or stale readiness
 *  - approved leave clash blocks assignment (uses setApprovedLeaveForTests)
 */

import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";

import { resetWorkforceEventBusForTests } from "@/platform/workforce/services/workforce-event-bus";
import {
  clearClinicTimezoneOverridesForTests,
  registerClinicTimezone,
} from "@/platform/workforce/services/clinic-timezone";
import {
  registerWorkforceReadinessLookup,
  type WorkforceReadinessOutcome,
} from "@/platform/workforce/services/workforce-eligibility";

import { runM05StorageMigrations } from "../storage/migrations";
import { runM05SchemaV2Migration } from "../storage/migrate-v2";
import { resetM05BootstrapCacheForTests } from "../storage/bootstrap";
import {
  evaluateEligibility,
  isEligibilityAllowedWithOverride,
} from "../services/eligibility-service";
import { setApprovedLeaveForTests } from "../services/availability-read-service";
import { createPeriod } from "../services/period-service";
import { createShift } from "../services/shift-service";
import { assignPerson } from "../services/assignment-service";
import { OverrideReasonRequiredError } from "../services/errors";
import * as store from "../repository/local-store";
import { M05PermissionError, type M05Actor } from "../permissions";

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

function makeOutcome(
  personId: string,
  asOf: string | undefined,
  overrides: Partial<WorkforceReadinessOutcome> = {}
): WorkforceReadinessOutcome {
  return {
    personId,
    readiness: "ready",
    blockers: [],
    asOf: asOf ?? new Date().toISOString(),
    stale: false,
    trainingDetailRefs: [],
    ...overrides,
  };
}

const admin: M05Actor = { userId: "usr_admin", permissions: ["*"] };
const CLINIC = "clinic_a";

function baseShiftInput(periodId: string) {
  return {
    rosterPeriodId: periodId,
    clinicId: CLINIC,
    localStartYmd: "2026-08-03",
    localStartHm: "08:00",
    localEndYmd: "2026-08-03",
    localEndHm: "16:00",
  };
}

describe("m05 eligibility", () => {
  beforeEach(() => {
    installMemoryLocalStorage();
    resetWorkforceEventBusForTests();
    resetM05BootstrapCacheForTests();
    clearClinicTimezoneOverridesForTests();
    registerWorkforceReadinessLookup(null);
    runM05StorageMigrations();
    runM05SchemaV2Migration();
    registerClinicTimezone(CLINIC, "Australia/Brisbane");
  });

  it("authority is always `m04-platform`, and eligible when readiness=ready + no blockers", () => {
    registerWorkforceReadinessLookup((personId, asOf) => makeOutcome(personId, asOf));
    const decision = evaluateEligibility({
      personId: "person_x",
      clinicId: CLINIC,
      asOf: "2026-08-01T00:00:00.000Z",
    });
    assert.equal(decision.authority, "m04-platform");
    assert.equal(decision.decision, "eligible");
    assert.equal(decision.blockers.length, 0);
    assert.equal(decision.warnings.length, 0);
  });

  it("hard-block when M04 returns a blocking readiness blocker", () => {
    registerWorkforceReadinessLookup((personId, asOf) =>
      makeOutcome(personId, asOf, {
        blockers: [
          {
            code: "training.expired.cpr",
            label: "CPR training expired",
            owningModuleId: "training",
            severity: "blocking",
          },
        ],
      })
    );
    const decision = evaluateEligibility({
      personId: "person_x",
      clinicId: CLINIC,
    });
    assert.equal(decision.decision, "hard_block");
    assert.equal(decision.blockers.length, 1);
    assert.equal(decision.blockers[0]!.code, "readiness.blocker.training.expired.cpr");
    assert.equal(decision.overridable, true); // hard-block IS overridable with reason
  });

  it("warning when readiness=advisory (never blocking) — assignment permitted", () => {
    registerWorkforceReadinessLookup((personId, asOf) =>
      makeOutcome(personId, asOf, {
        readiness: "advisory",
        blockers: [
          {
            code: "training.expiring.soon",
            label: "CPR expiring in 14 days",
            owningModuleId: "training",
            severity: "advisory",
          },
        ],
      })
    );
    const decision = evaluateEligibility({
      personId: "person_x",
      clinicId: CLINIC,
    });
    assert.equal(decision.decision, "warning");
    assert.ok(decision.warnings.length >= 1);
    const gate = isEligibilityAllowedWithOverride(decision, undefined);
    assert.equal(gate.allowed, true);
  });

  it("stale readiness is NEVER overridable (§7 rule)", () => {
    registerWorkforceReadinessLookup((personId, asOf) =>
      makeOutcome(personId, asOf, { stale: true })
    );
    const decision = evaluateEligibility({
      personId: "person_x",
      clinicId: CLINIC,
    });
    assert.equal(decision.decision, "never_overridable");
    assert.equal(decision.overridable, false);
    assert.ok(decision.blockers.some((b) => b.code === "readiness.stale"));
    const gate = isEligibilityAllowedWithOverride(decision, "Please override");
    assert.equal(gate.allowed, false);
  });

  it("unresolved clinic timezone is NEVER overridable — no silent UTC (§4/§7)", () => {
    // Do NOT register a timezone for `clinic_nowhere` — resolveClinicTimezone
    // will fail for it. registerReadinessLookup so person is known.
    registerWorkforceReadinessLookup((personId, asOf) => makeOutcome(personId, asOf));
    const decision = evaluateEligibility({
      personId: "person_x",
      clinicId: "clinic_nowhere",
    });
    assert.equal(decision.decision, "never_overridable");
    assert.ok(
      decision.blockers.some((b) => b.code === "clinic.timezone.unresolved" && b.neverOverridable)
    );
    const gate = isEligibilityAllowedWithOverride(decision, "critical staffing");
    assert.equal(gate.allowed, false);
  });

  it("unknown_person (no readiness lookup available) is never overridable", () => {
    registerWorkforceReadinessLookup(() => null);
    const decision = evaluateEligibility({
      personId: "person_unknown",
      clinicId: CLINIC,
    });
    assert.equal(decision.decision, "unknown_person");
    assert.ok(decision.blockers.some((b) => b.code === "person.unknown"));
    const gate = isEligibilityAllowedWithOverride(decision, "please");
    assert.equal(gate.allowed, false);
  });

  it("approved-leave clash blocks assignment (populated via setApprovedLeaveForTests)", () => {
    registerWorkforceReadinessLookup((personId, asOf) => makeOutcome(personId, asOf));
    setApprovedLeaveForTests([
      {
        id: "leave-1",
        personId: "person_x",
        clinicId: CLINIC,
        organisationId: "org_parent",
        localFromDate: "2026-08-01",
        localToDate: "2026-08-10",
        reasonCategory: "annual",
        source: "m04-contract",
        loadedAt: new Date().toISOString(),
      },
    ]);
    const decision = evaluateEligibility({
      personId: "person_x",
      clinicId: CLINIC,
      shiftWindow: {
        clinicId: CLINIC,
        timeZoneId: "Australia/Brisbane",
        localStart: "2026-08-03T08:00",
        localEnd: "2026-08-03T16:00",
        utcStart: "2026-08-02T22:00:00.000Z",
        utcEnd: "2026-08-03T06:00:00.000Z",
        startOffsetMinutes: 600,
        endOffsetMinutes: 600,
        startFold: 0,
        endFold: 0,
        crossesLocalMidnight: false,
      },
    });
    assert.equal(decision.decision, "hard_block");
    assert.ok(decision.blockers.some((b) => b.code === "leave.approved.clash"));
  });

  it("authorised override with reason lets a hard-blocked assignment through (assignPerson requires roster.override)", () => {
    registerWorkforceReadinessLookup((personId, asOf) =>
      makeOutcome(personId, asOf, {
        blockers: [
          {
            code: "training.expired.cpr",
            label: "CPR expired",
            owningModuleId: "training",
            severity: "blocking",
          },
        ],
      })
    );
    const period = createPeriod(admin, {
      label: "OV",
      startsOn: "2026-08-03",
      endsOn: "2026-08-09",
      clinicId: CLINIC,
    });
    const shift = createShift(admin, baseShiftInput(period.id));
    // Missing override reason → OverrideReasonRequiredError
    assert.throws(
      () =>
        assignPerson(admin, {
          shiftId: shift.id,
          personId: "person_x",
          expectedShiftVersion: shift.version,
        }),
      OverrideReasonRequiredError
    );

    // With reason (admin wildcard permissions include roster.override) → OK
    const assigned = assignPerson(admin, {
      shiftId: shift.id,
      personId: "person_x",
      expectedShiftVersion: shift.version,
      overrideReason: "Clinic critical demand",
    });
    assert.equal(assigned.state, "assigned");
    assert.equal(assigned.overrideReason, "Clinic critical demand");
  });

  it("actor missing roster.override cannot override a hard-block even with reason", () => {
    registerWorkforceReadinessLookup((personId, asOf) =>
      makeOutcome(personId, asOf, {
        blockers: [
          {
            code: "training.expired.cpr",
            label: "CPR expired",
            owningModuleId: "training",
            severity: "blocking",
          },
        ],
      })
    );
    const noOverride: M05Actor = {
      userId: "usr_no_over",
      permissions: [
        "roster.view",
        "roster.assign",
        "roster.shift.edit",
        "roster.period.create",
        "roster.review",
      ],
      clinicIds: [CLINIC],
    };
    const period = createPeriod(admin, {
      label: "NoOv",
      startsOn: "2026-08-03",
      endsOn: "2026-08-09",
      clinicId: CLINIC,
    });
    const shift = createShift(admin, baseShiftInput(period.id));
    assert.throws(
      () =>
        assignPerson(noOverride, {
          shiftId: shift.id,
          personId: "person_x",
          expectedShiftVersion: shift.version,
          overrideReason: "Just do it",
        }),
      M05PermissionError
    );
  });

  it("stale readiness cannot be overridden by assignPerson", () => {
    registerWorkforceReadinessLookup((personId, asOf) =>
      makeOutcome(personId, asOf, { stale: true })
    );
    const period = createPeriod(admin, {
      label: "Stale",
      startsOn: "2026-08-03",
      endsOn: "2026-08-09",
      clinicId: CLINIC,
    });
    const shift = createShift(admin, baseShiftInput(period.id));
    assert.throws(
      () =>
        assignPerson(admin, {
          shiftId: shift.id,
          personId: "person_x",
          expectedShiftVersion: shift.version,
          overrideReason: "urgent",
        }),
      /never overridable|denied/i
    );
    // Nothing should have been appended to the assignment log for this shift
    assert.equal(store.listAssignments(shift.id).length, 0);
  });
});
