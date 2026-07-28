import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { ensurePersonReadWarmed, M06_PERSON_READ_SOURCE } from "../adapters/m04-person-read";
import { ensureShiftReadWarmed, M06_SHIFT_READ_SOURCE, listPublishedAssignmentsForPerson } from "../adapters/m05-shift-read";
import { getAttendanceCounts } from "../adapters/m06-executive";
import { acknowledgeApprovedTimesheetIntake } from "../adapters/m07-timesheet-bridge";
import { raiseMissedClockIn } from "../services/exception-service";
import { findInboxActionForSource } from "@/platform/services/action-inbox-bridge";
import { assertNoM07KeysCreated } from "../repository/local-store";
import { CLINIC, resetM06TestEnv } from "./_helpers";

describe("m06 adapters", () => {
  beforeEach(() => resetM06TestEnv());

  it("m04 person read source is platform demo", async () => {
    await ensurePersonReadWarmed();
    assert.equal(M06_PERSON_READ_SOURCE, "platform-demo-refs");
  });

  it("m05 shift read does not import m05 repository", async () => {
    await ensureShiftReadWarmed();
    assert.equal(M06_SHIFT_READ_SOURCE, "platform-demo-and-m05-keys-readonly");
    const rows = listPublishedAssignmentsForPerson("person_demo_001");
    assert.ok(Array.isArray(rows));
  });

  it("m01 aggregates only", () => {
    const c = getAttendanceCounts(CLINIC);
    assert.equal(typeof c.openSessions, "number");
    assert.equal(typeof c.openExceptions, "number");
  });

  it("m02 lifecycle write", () => {
    const ex = raiseMissedClockIn({ personId: "p", clinicId: CLINIC, shiftId: "s" });
    assert.ok(findInboxActionForSource("time-attendance", `attendance-${ex.kind}`, ex.id));
  });

  it("m07 bridge cleared", () => {
    const r = acknowledgeApprovedTimesheetIntake("x");
    assert.equal(r.blocked, false);
    assert.equal(r.workflowEvidenceCode, "CLEARED-M07-BATCH2");
    assert.equal(assertNoM07KeysCreated(), true);
  });
});
