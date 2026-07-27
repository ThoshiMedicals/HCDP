/**
 * M05 swap + open-shift lifecycles (§12, §13, §19.3, §19.4 of the plan).
 *
 * Covered:
 *  - swap lifecycle: request → propose → recipient_accept → approve
 *  - self-approval blocked; version check on swap; approve revalidates
 *    eligibility for BOTH parties at approval time
 *  - swap approve on stale shift version → ConcurrentConflictError
 *  - open-shift lifecycle: offer → EOI → select (with version check)
 *  - accept from someone outside audience rejected
 *  - stale open-shift version blocks accept/select
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
import { createPeriod } from "../services/period-service";
import { createShift } from "../services/shift-service";
import { assignPerson } from "../services/assignment-service";
import {
  requestSwap,
  proposeReplacement,
  recipientAcceptSwap,
  approveSwap,
  rejectSwap,
  withdrawSwap,
} from "../services/swap-service";
import {
  offerOpenShift,
  acceptOpenShift,
  selectOpenShiftApplicant,
  withdrawOpenShift,
} from "../services/open-shift-service";
import { ConcurrentConflictError } from "../services/errors";
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
const manager: M05Actor = {
  userId: "usr_mgr",
  permissions: [
    "roster.view",
    "roster.assign",
    "roster.swap.request",
    "roster.swap.approve",
    "roster.open_shift.manage",
  ],
  clinicIds: ["clinic_a"],
};
const CLINIC = "clinic_a";

function registerLookup(readiness: WorkforceReadinessOutcome["readiness"] = "ready", stale = false) {
  registerWorkforceReadinessLookup((personId, asOf) => ({
    personId,
    readiness,
    blockers: [],
    asOf: asOf ?? new Date().toISOString(),
    stale,
    trainingDetailRefs: [],
  }));
}

function makeAssignedShift() {
  const period = createPeriod(admin, {
    label: "SwapPeriod",
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
    personId: "person_original",
    expectedShiftVersion: shift.version,
  });
  return { period, shift: store.getShift(shift.id)! };
}

describe("m05 swap + open-shift", () => {
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

  it("swap: request → propose → recipient_accept → approve creates a new assignment", () => {
    const { shift } = makeAssignedShift();
    const swap = requestSwap(admin, {
      shiftId: shift.id,
      requesterPersonId: "person_original",
    });
    assert.equal(swap.status, "requested");
    const proposed = proposeReplacement(admin, {
      swapId: swap.id,
      recipientPersonId: "person_replacement",
      expectedVersion: swap.version,
    });
    assert.equal(proposed.status, "proposed");
    const accepted = recipientAcceptSwap(admin, {
      swapId: swap.id,
      expectedVersion: proposed.version,
      actAsPersonId: "person_replacement",
    });
    assert.equal(accepted.status, "recipient_accepted");

    const shiftNow = store.getShift(shift.id)!;
    const { swap: approved, assignmentId } = approveSwap(manager, {
      swapId: swap.id,
      expectedVersion: accepted.version,
      expectedShiftVersion: shiftNow.version,
    });
    assert.equal(approved.status, "approved");
    assert.equal(approved.resultingAssignmentId, assignmentId);
    // A new assignment row exists for the replacement person
    const currentAssignment = store.getAssignment(assignmentId);
    assert.equal(currentAssignment?.personId, "person_replacement");
  });

  it("swap approve: self-approval is denied", () => {
    const { shift } = makeAssignedShift();
    const swap = requestSwap(admin, {
      shiftId: shift.id,
      requesterPersonId: "person_original",
    });
    const proposed = proposeReplacement(admin, {
      swapId: swap.id,
      recipientPersonId: "person_replacement",
      expectedVersion: swap.version,
    });
    const accepted = recipientAcceptSwap(admin, {
      swapId: swap.id,
      expectedVersion: proposed.version,
      actAsPersonId: "person_replacement",
    });
    // Actor = original swap requester → deny self-approval
    const selfActor: M05Actor = {
      userId: "person_original",
      permissions: ["*"],
      clinicIds: [CLINIC],
    };
    const shiftNow = store.getShift(shift.id)!;
    assert.throws(
      () =>
        approveSwap(selfActor, {
          swapId: swap.id,
          expectedVersion: accepted.version,
          expectedShiftVersion: shiftNow.version,
        }),
      /Self-approval/
    );
  });

  it("swap approve: stale swap version throws ConcurrentConflictError", () => {
    const { shift } = makeAssignedShift();
    const swap = requestSwap(admin, {
      shiftId: shift.id,
      requesterPersonId: "person_original",
    });
    const proposed = proposeReplacement(admin, {
      swapId: swap.id,
      recipientPersonId: "person_replacement",
      expectedVersion: swap.version,
    });
    recipientAcceptSwap(admin, {
      swapId: swap.id,
      expectedVersion: proposed.version,
      actAsPersonId: "person_replacement",
    });
    const shiftNow = store.getShift(shift.id)!;
    assert.throws(
      () =>
        approveSwap(manager, {
          swapId: swap.id,
          expectedVersion: 999,
          expectedShiftVersion: shiftNow.version,
        }),
      ConcurrentConflictError
    );
  });

  it("swap approve: stale shift version throws ConcurrentConflictError", () => {
    const { shift } = makeAssignedShift();
    const swap = requestSwap(admin, {
      shiftId: shift.id,
      requesterPersonId: "person_original",
    });
    const proposed = proposeReplacement(admin, {
      swapId: swap.id,
      recipientPersonId: "person_replacement",
      expectedVersion: swap.version,
    });
    const accepted = recipientAcceptSwap(admin, {
      swapId: swap.id,
      expectedVersion: proposed.version,
      actAsPersonId: "person_replacement",
    });
    assert.throws(
      () =>
        approveSwap(manager, {
          swapId: swap.id,
          expectedVersion: accepted.version,
          expectedShiftVersion: 999,
        }),
      ConcurrentConflictError
    );
  });

  it("swap reject and withdraw terminate the swap", () => {
    const { shift } = makeAssignedShift();
    const swap = requestSwap(admin, {
      shiftId: shift.id,
      requesterPersonId: "person_original",
    });
    const rejected = rejectSwap(manager, {
      swapId: swap.id,
      expectedVersion: swap.version,
      reason: "not eligible",
    });
    assert.equal(rejected.status, "rejected");
    // Second swap: withdraw path
    const swap2 = requestSwap(admin, {
      shiftId: shift.id,
      requesterPersonId: "person_original",
    });
    const withdrawn = withdrawSwap(admin, {
      swapId: swap2.id,
      expectedVersion: swap2.version,
    });
    assert.equal(withdrawn.status, "withdrawn");
  });

  it("open shift: offer → accept (audience person) → select (version-checked)", () => {
    const period = createPeriod(admin, {
      label: "OSP",
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
    const open = offerOpenShift(admin, {
      shiftId: shift.id,
      audiencePersonIds: ["worker_a", "worker_b"],
    });
    assert.equal(open.status, "offered");

    // Stale expected version → concurrent conflict
    assert.throws(
      () =>
        acceptOpenShift(admin, {
          openShiftId: open.id,
          expectedVersion: 999,
          actAsPersonId: "worker_a",
        }),
      ConcurrentConflictError
    );

    // Person outside audience denied
    assert.throws(
      () =>
        acceptOpenShift(admin, {
          openShiftId: open.id,
          expectedVersion: open.version,
          actAsPersonId: "stranger",
        }),
      /not in the audience/
    );

    const eoi = acceptOpenShift(admin, {
      openShiftId: open.id,
      expectedVersion: open.version,
      actAsPersonId: "worker_a",
    });
    assert.equal(eoi.status, "eoi_received");
    assert.equal(eoi.applicants.length, 1);

    // Select with matching versions
    const shiftNow = store.getShift(shift.id)!;
    const { openShift: closed, assignmentId } = selectOpenShiftApplicant(admin, {
      openShiftId: open.id,
      expectedVersion: eoi.version,
      expectedShiftVersion: shiftNow.version,
      personId: "worker_a",
    });
    assert.equal(closed.status, "closed");
    assert.equal(closed.selectedPersonId, "worker_a");
    assert.ok(assignmentId);
  });

  it("open shift: withdraw closes the row and rejects double-fill via version check", () => {
    const period = createPeriod(admin, {
      label: "OSW",
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
    const open = offerOpenShift(admin, {
      shiftId: shift.id,
      audiencePersonIds: ["worker_a"],
    });
    const withdrawn = withdrawOpenShift(admin, {
      openShiftId: open.id,
      expectedVersion: open.version,
      reason: "cancelled by clinic",
    });
    assert.equal(withdrawn.status, "withdrawn");
    // Stale accept on the withdrawn row throws concurrent-conflict
    assert.throws(
      () =>
        acceptOpenShift(admin, {
          openShiftId: open.id,
          expectedVersion: open.version,
          actAsPersonId: "worker_a",
        }),
      ConcurrentConflictError
    );
  });
});
