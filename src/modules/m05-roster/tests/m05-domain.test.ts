/**
 * M05 domain — period/shift/assignment state transitions;
 * publication immutability; acknowledgement derived status;
 * NO `partially_acknowledged` period lifecycle state (§11 rule).
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
  registerWorkforceReadinessRecalculate,
  type WorkforceReadinessOutcome,
} from "@/platform/workforce/services/workforce-eligibility";

import { resetM05BootstrapCacheForTests } from "../storage/bootstrap";
import { runM05StorageMigrations } from "../storage/migrations";
import { runM05SchemaV2Migration } from "../storage/migrate-v2";
import * as store from "../repository/local-store";
import {
  createPeriod,
  transitionPeriod,
  isValidPeriodTransition,
} from "../services/period-service";
import {
  createShift,
  updateShift,
  cancelShift,
  isValidShiftTransition,
} from "../services/shift-service";
import {
  assignPerson,
  cancelAssignment,
  invalidateAssignment,
  listAssignmentHistoryForShift,
} from "../services/assignment-service";
import {
  previewPublication,
  publishPeriod,
  recomputePublicationAckStatus,
  supersedePublication,
} from "../services/publication-service";
import { acknowledgePublication } from "../services/acknowledgement-service";
import {
  ConcurrentConflictError,
  InvalidLifecycleTransitionError,
} from "../services/errors";
import type { PeriodLifecycleState } from "../types/domain";
import { M05_PERMISSION_CODES, type M05Actor } from "../permissions";

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
const CLINIC = "clinic_a";
const ORG = "org_parent";

function registerReadyLookup(readiness: WorkforceReadinessOutcome["readiness"] = "ready", stale = false) {
  registerWorkforceReadinessLookup((personId, asOf) => ({
    personId,
    readiness,
    blockers: [],
    asOf: asOf ?? new Date().toISOString(),
    stale,
    trainingDetailRefs: [],
  }));
}

function baseShiftInput(periodId: string) {
  return {
    rosterPeriodId: periodId,
    clinicId: CLINIC,
    organisationId: ORG,
    localStartYmd: "2026-08-03",
    localStartHm: "08:00",
    localEndYmd: "2026-08-03",
    localEndHm: "16:00",
  };
}

describe("m05 domain", () => {
  beforeEach(() => {
    installMemoryLocalStorage();
    resetWorkforceEventBusForTests();
    resetM05BootstrapCacheForTests();
    clearClinicTimezoneOverridesForTests();
    registerWorkforceReadinessLookup(null);
    registerWorkforceReadinessRecalculate(null);
    runM05StorageMigrations();
    runM05SchemaV2Migration();
    // clinic_a → Australia/Brisbane by default in the platform registry
    registerClinicTimezone(CLINIC, "Australia/Brisbane");
    registerReadyLookup();
  });

  it("period lifecycle: draft→under_review→ready_to_publish→published (no partially_acknowledged period state)", () => {
    const period = createPeriod(admin, {
      label: "Wk1",
      startsOn: "2026-08-03",
      endsOn: "2026-08-09",
      clinicId: CLINIC,
    });
    assert.equal(period.lifecycleState, "draft");

    const p2 = transitionPeriod(admin, {
      periodId: period.id,
      to: "under_review",
      expectedVersion: period.version,
    });
    assert.equal(p2.lifecycleState, "under_review");

    const p3 = transitionPeriod(admin, {
      periodId: period.id,
      to: "ready_to_publish",
      expectedVersion: p2.version,
    });
    assert.equal(p3.lifecycleState, "ready_to_publish");

    // Ensure no `partially_acknowledged` / `fully_acknowledged` in the allowed
    // lifecycle transitions (§11 hard rule).
    const bogus: PeriodLifecycleState = "partially_acknowledged" as unknown as PeriodLifecycleState;
    assert.equal(isValidPeriodTransition("published", bogus), false);
    assert.equal(isValidPeriodTransition("draft", bogus), false);
  });

  it("period version mismatch throws ConcurrentConflictError", () => {
    const period = createPeriod(admin, {
      label: "Wk1",
      startsOn: "2026-08-03",
      endsOn: "2026-08-09",
      clinicId: CLINIC,
    });
    assert.throws(
      () =>
        transitionPeriod(admin, {
          periodId: period.id,
          to: "under_review",
          expectedVersion: 42,
        }),
      ConcurrentConflictError
    );
  });

  it("period cancel requires reason", () => {
    const period = createPeriod(admin, {
      label: "Wk1",
      startsOn: "2026-08-03",
      endsOn: "2026-08-09",
      clinicId: CLINIC,
    });
    assert.throws(() =>
      transitionPeriod(admin, {
        periodId: period.id,
        to: "cancelled",
        expectedVersion: period.version,
      })
    );
    const cancelled = transitionPeriod(admin, {
      periodId: period.id,
      to: "cancelled",
      expectedVersion: period.version,
      reason: "conflict",
    });
    assert.equal(cancelled.lifecycleState, "cancelled");
    assert.equal(cancelled.cancelReason, "conflict");
  });

  it("shift lifecycle valid + invalid transitions", () => {
    assert.equal(isValidShiftTransition("draft", "unassigned"), true);
    assert.equal(isValidShiftTransition("unassigned", "assigned"), true);
    assert.equal(isValidShiftTransition("assigned", "open"), true);
    assert.equal(isValidShiftTransition("cancelled", "assigned"), false);
    assert.equal(isValidShiftTransition("superseded", "assigned"), false);

    const period = createPeriod(admin, {
      label: "Wk1",
      startsOn: "2026-08-03",
      endsOn: "2026-08-09",
      clinicId: CLINIC,
    });
    const shift = createShift(admin, baseShiftInput(period.id));
    assert.equal(shift.status, "unassigned");
    assert.equal(shift.timeZoneId, "Australia/Brisbane");
    assert.equal(shift.startOffsetMinutes, 600);

    assert.throws(() =>
      updateShift(admin, {
        shiftId: shift.id,
        expectedVersion: 999,
        roleLabel: "New",
      })
    , ConcurrentConflictError);

    const cancelled = cancelShift(admin, {
      shiftId: shift.id,
      expectedVersion: shift.version,
      reason: "duplicate",
    });
    assert.equal(cancelled.status, "cancelled");
    assert.equal(cancelled.cancelReason, "duplicate");
  });

  it("assignment history is append-only; replacing a worker preserves prior state as replaced", () => {
    const period = createPeriod(admin, {
      label: "Wk1",
      startsOn: "2026-08-03",
      endsOn: "2026-08-09",
      clinicId: CLINIC,
    });
    const shift = createShift(admin, baseShiftInput(period.id));

    const a1 = assignPerson(admin, {
      shiftId: shift.id,
      personId: "person_1",
      expectedShiftVersion: shift.version,
    });
    assert.equal(a1.state, "assigned");

    const shift2 = store.getShift(shift.id)!;
    const a2 = assignPerson(admin, {
      shiftId: shift.id,
      personId: "person_2",
      expectedShiftVersion: shift2.version,
    });
    assert.equal(a2.state, "assigned");
    assert.equal(a2.replacesId, a1.id);

    const priorFromStore = store.getAssignment(a1.id);
    assert.equal(priorFromStore?.state, "replaced");
    assert.equal(priorFromStore?.replacedById, a2.id);

    const history = listAssignmentHistoryForShift(shift.id);
    assert.equal(history.length, 2);
  });

  it("assignment cancel + invalidate append audit and do not rewrite prior append-only rows", () => {
    const period = createPeriod(admin, {
      label: "Wk1",
      startsOn: "2026-08-03",
      endsOn: "2026-08-09",
      clinicId: CLINIC,
    });
    const shift = createShift(admin, baseShiftInput(period.id));
    const a = assignPerson(admin, {
      shiftId: shift.id,
      personId: "person_x",
      expectedShiftVersion: shift.version,
    });
    const s2 = store.getShift(shift.id)!;
    const cancelled = cancelAssignment(admin, {
      assignmentId: a.id,
      expectedShiftVersion: s2.version,
      reason: "no-show",
    });
    assert.equal(cancelled.state, "cancelled");
    const invalidated = invalidateAssignment(admin, {
      assignmentId: a.id,
      reason: "leave granted",
    });
    assert.equal(invalidated.state, "invalidated");
    // Assignments remain append-only rows — no duplicate ids
    assert.equal(store.listAssignmentsForPerson("person_x").length, 1);
  });

  it("publication body is immutable; supersede requires a new publication", () => {
    const period = createPeriod(admin, {
      label: "Wk1",
      startsOn: "2026-08-03",
      endsOn: "2026-08-09",
      clinicId: CLINIC,
    });
    const shift = createShift(admin, baseShiftInput(period.id));
    assignPerson(admin, {
      shiftId: shift.id,
      personId: "person_1",
      expectedShiftVersion: shift.version,
    });

    const readyPeriod = transitionPeriod(admin, {
      periodId: period.id,
      to: "ready_to_publish",
      expectedVersion: period.version,
    });

    const preview = previewPublication(admin, { rosterPeriodId: period.id });
    assert.equal(preview.blockers.length, 0);

    const pub = publishPeriod(admin, {
      rosterPeriodId: period.id,
      expectedPeriodVersion: readyPeriod.version,
    });
    assert.equal(pub.publicationVersion, 1);
    assert.equal(pub.acknowledgementStatus, "none");
    assert.equal(pub.version, 1);

    // Second write of the same id must throw (append-only)
    assert.throws(() => store.appendPublication(pub));

    // Period stays `published` regardless of ack progress
    const persistedPeriod = store.getPeriod(period.id)!;
    assert.equal(persistedPeriod.lifecycleState, "published");

    // Supersede must create a new publication and mark prior superseded
    const pubAfter = supersedePublication(admin, {
      rosterPeriodId: period.id,
      expectedPeriodVersion: persistedPeriod.version,
      priorPublicationId: pub.id,
    });
    assert.equal(pubAfter.publicationVersion, 2);
    assert.equal(pubAfter.supersedesId, pub.id);
    const priorPub = store.getPublication(pub.id)!;
    assert.equal(priorPub.supersededById, pubAfter.id);
    // Original snapshot body remains identical after the supersede link (immutable body)
    assert.equal(priorPub.assignments.length, pub.assignments.length);
    assert.equal(priorPub.assignments[0]!.shiftId, pub.assignments[0]!.shiftId);
    assert.equal(priorPub.assignments[0]!.personId, pub.assignments[0]!.personId);
    assert.equal(priorPub.assignments[0]!.utcStart, pub.assignments[0]!.utcStart);
    assert.equal(priorPub.warnings.length, pub.warnings.length);
  });

  it("acknowledgement is a DERIVED publication status (none|partial|full); period stays `published`", () => {
    const period = createPeriod(admin, {
      label: "Wk1",
      startsOn: "2026-08-03",
      endsOn: "2026-08-09",
      clinicId: CLINIC,
    });

    // Two shifts, two workers
    const shiftA = createShift(admin, {
      ...baseShiftInput(period.id),
      localStartHm: "08:00",
      localEndHm: "12:00",
    });
    assignPerson(admin, {
      shiftId: shiftA.id,
      personId: "person_a",
      expectedShiftVersion: shiftA.version,
    });

    const shiftB = createShift(admin, {
      ...baseShiftInput(period.id),
      localStartYmd: "2026-08-04",
      localEndYmd: "2026-08-04",
      localStartHm: "08:00",
      localEndHm: "12:00",
    });
    assignPerson(admin, {
      shiftId: shiftB.id,
      personId: "person_b",
      expectedShiftVersion: shiftB.version,
    });

    const ready = transitionPeriod(admin, {
      periodId: period.id,
      to: "ready_to_publish",
      expectedVersion: period.version,
    });
    const pub = publishPeriod(admin, {
      rosterPeriodId: period.id,
      expectedPeriodVersion: ready.version,
    });
    assert.deepEqual([...pub.requiredAcknowledgerPersonIds].sort(), ["person_a", "person_b"]);
    assert.equal(pub.acknowledgementStatus, "none");

    // First worker acknowledges → derived status becomes `partial`
    acknowledgePublication(admin, {
      publicationId: pub.id,
      publicationVersion: pub.publicationVersion,
      outcome: "acknowledged",
      actAsPersonId: "person_a",
    });
    const partial = store.getPublication(pub.id)!;
    assert.equal(partial.acknowledgementStatus, "partial");
    // Period lifecycle MUST remain `published` (no invented state)
    assert.equal(store.getPeriod(period.id)!.lifecycleState, "published");

    // Second worker acknowledges → derived status becomes `full`
    acknowledgePublication(admin, {
      publicationId: pub.id,
      publicationVersion: pub.publicationVersion,
      outcome: "acknowledged",
      actAsPersonId: "person_b",
    });
    const full = store.getPublication(pub.id)!;
    assert.equal(full.acknowledgementStatus, "full");
    assert.equal(store.getPeriod(period.id)!.lifecycleState, "published");
  });

  it("ack on superseded publication is rejected", () => {
    const period = createPeriod(admin, {
      label: "Wk1",
      startsOn: "2026-08-03",
      endsOn: "2026-08-09",
      clinicId: CLINIC,
    });
    const shift = createShift(admin, baseShiftInput(period.id));
    assignPerson(admin, {
      shiftId: shift.id,
      personId: "person_a",
      expectedShiftVersion: shift.version,
    });
    const ready = transitionPeriod(admin, {
      periodId: period.id,
      to: "ready_to_publish",
      expectedVersion: period.version,
    });
    const first = publishPeriod(admin, {
      rosterPeriodId: period.id,
      expectedPeriodVersion: ready.version,
    });
    const afterFirstPeriod = store.getPeriod(period.id)!;
    supersedePublication(admin, {
      rosterPeriodId: period.id,
      expectedPeriodVersion: afterFirstPeriod.version,
      priorPublicationId: first.id,
    });
    // Acking the now-superseded first publication must throw
    assert.throws(
      () =>
        acknowledgePublication(admin, {
          publicationId: first.id,
          publicationVersion: first.publicationVersion,
          outcome: "acknowledged",
          actAsPersonId: "person_a",
        }),
      /superseded/
    );
  });

  it("publish denied when period lifecycle is `superseded`/`cancelled`/`archived`", () => {
    const period = createPeriod(admin, {
      label: "Wk1",
      startsOn: "2026-08-03",
      endsOn: "2026-08-09",
      clinicId: CLINIC,
    });
    const cancelled = transitionPeriod(admin, {
      periodId: period.id,
      to: "cancelled",
      expectedVersion: period.version,
      reason: "duplicate",
    });
    assert.throws(
      () =>
        publishPeriod(admin, {
          rosterPeriodId: period.id,
          expectedPeriodVersion: cancelled.version,
        }),
      InvalidLifecycleTransitionError
    );
  });

  it("recomputePublicationAckStatus is a no-op on missing publication", () => {
    assert.equal(recomputePublicationAckStatus("does-not-exist"), "none");
  });

  it("permission code inventory covers §17 codes", () => {
    for (const code of [
      "roster.view",
      "roster.publish",
      "roster.assign",
      "roster.acknowledge",
      "roster.override",
      "roster.cost.view",
      "roster.bulk",
      "roster.export",
    ] as const) {
      assert.ok(M05_PERMISSION_CODES.includes(code), `missing permission ${code}`);
    }
  });
});
