/**
 * M05 publication + acknowledgement (§11 of the plan).
 *
 * Covered:
 *  - preview computes required acknowledgers + eligibility blockers/warnings
 *  - hard-blocked publish requires emergency-override reason
 *  - immutable snapshot cannot be re-appended
 *  - supersede creates a new publication, prior linked via supersededById
 *  - stale expected period version → ConcurrentConflictError
 *  - acknowledge against superseded publication throws (stale-replay guard)
 *  - ack against wrong publicationVersion throws
 *  - period lifecycle stays `published` while ack rolls up (no fabricated
 *    partially_acknowledged / fully_acknowledged period state)
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
import { createPeriod, transitionPeriod } from "../services/period-service";
import { createShift } from "../services/shift-service";
import { assignPerson } from "../services/assignment-service";
import {
  previewPublication,
  publishPeriod,
  supersedePublication,
  recomputePublicationAckStatus,
} from "../services/publication-service";
import { acknowledgePublication } from "../services/acknowledgement-service";
import {
  ConcurrentConflictError,
  ImmutablePublicationError,
  OverrideReasonRequiredError,
} from "../services/errors";
import * as store from "../repository/local-store";
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
const CLINIC = "clinic_a";

function registerLookup(readiness: WorkforceReadinessOutcome["readiness"] = "ready", stale = false) {
  registerWorkforceReadinessLookup((personId, asOf) => ({
    personId,
    readiness,
    blockers:
      readiness === "blocked"
        ? [
            {
              code: "training.expired.cpr",
              label: "CPR expired",
              owningModuleId: "training",
              severity: "blocking",
            },
          ]
        : [],
    asOf: asOf ?? new Date().toISOString(),
    stale,
    trainingDetailRefs: [],
  }));
}

function buildPeriodWithAssignedShift() {
  const period = createPeriod(admin, {
    label: "PubTest",
    startsOn: "2026-08-03",
    endsOn: "2026-08-09",
    clinicId: CLINIC,
  });
  const shift = createShift(admin, {
    rosterPeriodId: period.id,
    clinicId: CLINIC,
    localStartYmd: "2026-08-03",
    localStartHm: "08:00",
    localEndYmd: "2026-08-03",
    localEndHm: "16:00",
  });
  assignPerson(admin, {
    shiftId: shift.id,
    personId: "person_p",
    expectedShiftVersion: shift.version,
  });
  return { period, shift };
}

describe("m05 publication + acknowledgement", () => {
  beforeEach(() => {
    installMemoryLocalStorage();
    resetWorkforceEventBusForTests();
    resetM05BootstrapCacheForTests();
    clearClinicTimezoneOverridesForTests();
    registerWorkforceReadinessLookup(null);
    runM05StorageMigrations();
    runM05SchemaV2Migration();
    registerClinicTimezone(CLINIC, "Australia/Brisbane");
    registerLookup("ready");
  });

  it("preview lists required acknowledgers + eligibility warnings vs blockers", () => {
    const { period } = buildPeriodWithAssignedShift();
    const preview = previewPublication(admin, { rosterPeriodId: period.id });
    assert.equal(preview.rosterPeriodId, period.id);
    assert.equal(preview.timeZoneId, "Australia/Brisbane");
    assert.deepEqual(preview.requiredAcknowledgerPersonIds, ["person_p"]);
    assert.equal(preview.blockers.length, 0);
    assert.equal(preview.eligibilityBlockedAssignmentIds.length, 0);
    assert.equal(preview.proposedPublicationVersion, 1);
    assert.equal(preview.supersedesId, null);
  });

  it("publish denied without emergency override when preview has blockers", () => {
    registerLookup("blocked");
    const period = createPeriod(admin, {
      label: "Blk",
      startsOn: "2026-08-03",
      endsOn: "2026-08-09",
      clinicId: CLINIC,
    });
    const shift = createShift(admin, {
      rosterPeriodId: period.id,
      clinicId: CLINIC,
      localStartYmd: "2026-08-03",
      localStartHm: "08:00",
      localEndYmd: "2026-08-03",
      localEndHm: "16:00",
    });
    // assign with override reason (so shift becomes assigned despite blocker)
    assignPerson(admin, {
      shiftId: shift.id,
      personId: "person_p",
      expectedShiftVersion: shift.version,
      overrideReason: "Coverage critical",
    });
    const preview = previewPublication(admin, { rosterPeriodId: period.id });
    assert.ok(preview.blockers.length > 0);
    assert.throws(
      () =>
        publishPeriod(admin, {
          rosterPeriodId: period.id,
          expectedPeriodVersion: period.version,
        }),
      OverrideReasonRequiredError
    );
    // With emergency override reason (+ wildcard permission) → allowed
    const pub = publishPeriod(admin, {
      rosterPeriodId: period.id,
      expectedPeriodVersion: period.version,
      emergencyOverrideReason: "Critical staffing shortage",
    });
    assert.equal(pub.publicationVersion, 1);
    assert.ok(pub.warnings.length >= 1);
  });

  it("immutable snapshot cannot be re-appended; supersede creates a new publication", () => {
    const { period } = buildPeriodWithAssignedShift();
    const pub = publishPeriod(admin, {
      rosterPeriodId: period.id,
      expectedPeriodVersion: period.version,
    });
    // Same id append must throw
    assert.throws(() => store.appendPublication(pub));

    const persistedPeriod = store.getPeriod(period.id)!;
    const pub2 = supersedePublication(admin, {
      rosterPeriodId: period.id,
      expectedPeriodVersion: persistedPeriod.version,
      priorPublicationId: pub.id,
    });
    assert.equal(pub2.publicationVersion, 2);
    assert.equal(pub2.supersedesId, pub.id);
    const priorNow = store.getPublication(pub.id)!;
    assert.equal(priorNow.supersededById, pub2.id);
    // Second supersede using the SAME prior id must throw ImmutablePublicationError
    assert.throws(
      () =>
        supersedePublication(admin, {
          rosterPeriodId: period.id,
          expectedPeriodVersion: store.getPeriod(period.id)!.version,
          priorPublicationId: pub.id,
        }),
      ImmutablePublicationError
    );
  });

  it("stale expected period version rejected with ConcurrentConflictError", () => {
    const { period } = buildPeriodWithAssignedShift();
    assert.throws(
      () =>
        publishPeriod(admin, {
          rosterPeriodId: period.id,
          expectedPeriodVersion: 999,
        }),
      ConcurrentConflictError
    );
  });

  it("acknowledge against a superseded publication is rejected (stale-replay guard)", () => {
    const { period } = buildPeriodWithAssignedShift();
    const first = publishPeriod(admin, {
      rosterPeriodId: period.id,
      expectedPeriodVersion: period.version,
    });
    const persistedPeriod = store.getPeriod(period.id)!;
    supersedePublication(admin, {
      rosterPeriodId: period.id,
      expectedPeriodVersion: persistedPeriod.version,
      priorPublicationId: first.id,
    });
    assert.throws(
      () =>
        acknowledgePublication(admin, {
          publicationId: first.id,
          publicationVersion: first.publicationVersion,
          outcome: "acknowledged",
          actAsPersonId: "person_p",
        }),
      /superseded/
    );
  });

  it("acknowledge with wrong publicationVersion is rejected", () => {
    const { period } = buildPeriodWithAssignedShift();
    const pub = publishPeriod(admin, {
      rosterPeriodId: period.id,
      expectedPeriodVersion: period.version,
    });
    assert.throws(
      () =>
        acknowledgePublication(admin, {
          publicationId: pub.id,
          publicationVersion: pub.publicationVersion + 5,
          outcome: "acknowledged",
          actAsPersonId: "person_p",
        }),
      /publication version/i
    );
  });

  it("acknowledge by person NOT in required set is rejected", () => {
    const { period } = buildPeriodWithAssignedShift();
    const pub = publishPeriod(admin, {
      rosterPeriodId: period.id,
      expectedPeriodVersion: period.version,
    });
    assert.throws(
      () =>
        acknowledgePublication(admin, {
          publicationId: pub.id,
          publicationVersion: pub.publicationVersion,
          outcome: "acknowledged",
          actAsPersonId: "person_uninvolved",
        }),
      /not in the required acknowledger set/i
    );
  });

  it("period lifecycle stays `published` through all ack states; ack status is derived", () => {
    const period = createPeriod(admin, {
      label: "PubDerived",
      startsOn: "2026-08-03",
      endsOn: "2026-08-09",
      clinicId: CLINIC,
    });
    const s1 = createShift(admin, {
      rosterPeriodId: period.id,
      clinicId: CLINIC,
      localStartYmd: "2026-08-03",
      localStartHm: "08:00",
      localEndYmd: "2026-08-03",
      localEndHm: "12:00",
    });
    assignPerson(admin, {
      shiftId: s1.id,
      personId: "worker_a",
      expectedShiftVersion: s1.version,
    });
    const s2 = createShift(admin, {
      rosterPeriodId: period.id,
      clinicId: CLINIC,
      localStartYmd: "2026-08-04",
      localStartHm: "08:00",
      localEndYmd: "2026-08-04",
      localEndHm: "12:00",
    });
    assignPerson(admin, {
      shiftId: s2.id,
      personId: "worker_b",
      expectedShiftVersion: s2.version,
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
    assert.equal(store.getPeriod(period.id)!.lifecycleState, "published");
    assert.equal(pub.acknowledgementStatus, "none");
    // First ack
    acknowledgePublication(admin, {
      publicationId: pub.id,
      publicationVersion: pub.publicationVersion,
      outcome: "acknowledged",
      actAsPersonId: "worker_a",
    });
    assert.equal(recomputePublicationAckStatus(pub.id), "partial");
    assert.equal(store.getPeriod(period.id)!.lifecycleState, "published");
    // Second ack completes the set
    acknowledgePublication(admin, {
      publicationId: pub.id,
      publicationVersion: pub.publicationVersion,
      outcome: "acknowledged",
      actAsPersonId: "worker_b",
    });
    assert.equal(recomputePublicationAckStatus(pub.id), "full");
    assert.equal(store.getPeriod(period.id)!.lifecycleState, "published");
  });

  it("preview eligibility recalculates each assigned shift with clinic timezone", () => {
    // Second person with blocked readiness — blocker should surface in preview
    const period = createPeriod(admin, {
      label: "PubBlkPreview",
      startsOn: "2026-08-03",
      endsOn: "2026-08-09",
      clinicId: CLINIC,
    });
    const shift = createShift(admin, {
      rosterPeriodId: period.id,
      clinicId: CLINIC,
      localStartYmd: "2026-08-03",
      localStartHm: "08:00",
      localEndYmd: "2026-08-03",
      localEndHm: "16:00",
    });
    // Ready when assigning
    registerLookup("ready");
    assignPerson(admin, {
      shiftId: shift.id,
      personId: "person_r",
      expectedShiftVersion: shift.version,
    });
    // Now flip to blocked before preview
    registerLookup("blocked");
    const preview = previewPublication(admin, { rosterPeriodId: period.id });
    assert.ok(preview.blockers.length >= 1);
    assert.equal(preview.eligibilityBlockedAssignmentIds.length, 1);
  });
});
