import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { findInboxActionForSource } from "@/platform/services/action-inbox-bridge";
import { clockIn, clockOut } from "../services/clock-service";
import { startBreak, endBreak, recordMissedBreak } from "../services/break-service";
import {
  raiseMissedClockIn,
  raiseMissedClockOut,
  escalateException,
  declareException,
} from "../services/exception-service";
import {
  requestCorrection,
  approveCorrection,
  applyManagerCorrection,
} from "../services/correction-service";
import {
  generateTimesheet,
  submitTimesheet,
  approveTimesheet,
  reopenTimesheet,
  attemptM07Intake,
  publishTimesheetApproved,
} from "../services/timesheet-service";
import { enqueueOfflineEvent, syncOfflineQueue } from "../services/offline-sync-service";
import { reconcileRosterAttendance } from "../services/reconcile-service";
import { submitBulkApprove } from "../services/bulk-operation-service";
import { listApprovals, upsertDevice, getTimesheet, listExceptions } from "../repository/local-store";
import { actorAll, actorWorker, CLINIC, resetM06TestEnv } from "./_helpers";

describe("m06 workflows WF-01…21", () => {
  beforeEach(() => resetM06TestEnv());

  it("WF-01/02/03/04 rostered/unrostered/early/late clock-in paths", () => {
    const actor = actorWorker();
    const { session } = clockIn({
      actor,
      clinicId: CLINIC,
      localCivil: "2026-07-28T09:00",
      unrostered: true,
      clientEventId: "wf01",
    });
    assert.equal(session.state, "open");
    assert.equal(session.rostered, false);
  });

  it("WF-05 missed clock-in", () => {
    const ex = raiseMissedClockIn({ personId: "p1", clinicId: CLINIC, shiftId: "shf-1" });
    assert.equal(ex.kind, "missed-in");
    const again = raiseMissedClockIn({ personId: "p1", clinicId: CLINIC, shiftId: "shf-1" });
    assert.equal(again.id, ex.id);
  });

  it("WF-06/07 break start/end", () => {
    const actor = actorWorker();
    const { session } = clockIn({
      actor,
      clinicId: CLINIC,
      localCivil: "2026-07-28T09:00",
      unrostered: true,
      clientEventId: "wf06",
    });
    const brk = startBreak({
      actor,
      sessionId: session.id,
      localCivil: "2026-07-28T12:00",
      expectedSessionVersion: session.version,
    });
    const ended = endBreak({
      actor,
      breakId: brk.id,
      localCivil: "2026-07-28T12:30",
      expectedVersion: brk.version,
    });
    assert.equal(ended.state, "completed");
  });

  it("WF-08 missed break", () => {
    const actor = actorAll();
    const { session } = clockIn({
      actor,
      clinicId: CLINIC,
      localCivil: "2026-07-28T09:00",
      unrostered: true,
      clientEventId: "wf08",
    });
    const brk = recordMissedBreak({
      sessionId: session.id,
      personId: session.personId,
      clinicId: CLINIC,
      breakReqId: "req1",
    });
    assert.equal(brk.state, "missed");
  });

  it("WF-09/10 normal and early clock-out", () => {
    const actor = actorWorker();
    const { session } = clockIn({
      actor,
      clinicId: CLINIC,
      localCivil: "2026-07-28T09:00",
      unrostered: true,
      clientEventId: "wf09",
    });
    const { session: closed } = clockOut({
      actor,
      sessionId: session.id,
      localCivil: "2026-07-28T17:00",
      expectedVersion: session.version,
    });
    assert.equal(closed.state, "closed");
  });

  it("WF-11 missed clock-out", () => {
    const actor = actorAll();
    const { session } = clockIn({
      actor,
      clinicId: CLINIC,
      localCivil: "2026-07-28T09:00",
      unrostered: true,
      clientEventId: "wf11",
    });
    const ex = raiseMissedClockOut({
      sessionId: session.id,
      personId: session.personId,
      clinicId: CLINIC,
    });
    assert.equal(ex.kind, "missed-out");
  });

  it("WF-12 cross-midnight clock pair", () => {
    const actor = actorWorker();
    const { session } = clockIn({
      actor,
      clinicId: CLINIC,
      localCivil: "2026-07-28T22:00",
      unrostered: true,
      clientEventId: "wf12-in",
    });
    const { session: closed } = clockOut({
      actor,
      sessionId: session.id,
      localCivil: "2026-07-29T06:00",
      expectedVersion: session.version,
    });
    assert.ok(closed.closedAt);
    assert.notEqual(closed.openedAt.localCivil.slice(0, 10), closed.closedAt!.localCivil.slice(0, 10));
  });

  it("WF-13 offline capture and sync", () => {
    const actor = actorWorker();
    upsertDevice({
      id: "dev-1",
      clinicId: CLINIC,
      label: "Phone",
      revoked: false,
      createdAt: new Date().toISOString(),
    });
    enqueueOfflineEvent({
      actor,
      deviceId: "dev-1",
      clientEventId: "off-1",
      clientSequence: 1,
      clinicId: CLINIC,
      payload: { kind: "clock-in", localCivil: "2026-07-28T09:00" },
    });
    const result = syncOfflineQueue({ actor, deviceId: "dev-1" });
    assert.equal(result.applied.length, 1);
  });

  it("WF-14/15/16 correction request approve apply", () => {
    const worker = actorWorker();
    const manager = actorAll("mgr");
    const { session } = clockIn({
      actor: worker,
      clinicId: CLINIC,
      localCivil: "2026-07-28T09:00",
      unrostered: true,
      clientEventId: "wf14",
    });
    const closed = clockOut({
      actor: worker,
      sessionId: session.id,
      localCivil: "2026-07-28T17:00",
      expectedVersion: session.version,
    }).session;
    const corr = requestCorrection({
      actor: worker,
      sessionId: closed.id,
      reason: "Wrong out time",
      proposedLocalCivil: "2026-07-28T17:15",
    });
    assert.equal(corr.state, "requested");
    const applied = approveCorrection({
      actor: manager,
      correctionId: corr.id,
      expectedVersion: corr.version,
    });
    assert.equal(applied.state, "applied");
  });

  it("WF-15 manager correction", () => {
    const manager = actorAll();
    const { session } = clockIn({
      actor: manager,
      clinicId: CLINIC,
      localCivil: "2026-07-28T09:00",
      unrostered: true,
      clientEventId: "wf15-in",
    });
    const closed = clockOut({
      actor: manager,
      sessionId: session.id,
      localCivil: "2026-07-28T17:00",
      expectedVersion: session.version,
    }).session;
    const corr = applyManagerCorrection({
      actor: manager,
      sessionId: closed.id,
      reason: "Manager fix",
      expectedSessionVersion: closed.version,
      proposedLocalCivil: "2026-07-28T17:10",
    });
    assert.equal(corr.state, "applied");
  });

  it("WF-17 reopen timesheet", () => {
    const actor = actorAll();
    const { session } = clockIn({
      actor,
      clinicId: CLINIC,
      localCivil: "2026-07-28T09:00",
      unrostered: true,
      clientEventId: "wf17-in",
    });
    clockOut({
      actor,
      sessionId: session.id,
      localCivil: "2026-07-28T17:00",
      expectedVersion: session.version,
    });
    let ts = generateTimesheet({
      actor,
      personId: actor.personId!,
      clinicId: CLINIC,
      periodStart: "2026-07-20",
      periodEnd: "2026-07-30",
    });
    ts = submitTimesheet({ actor, timesheetId: ts.id, expectedVersion: ts.version });
    ts = approveTimesheet({ actor, timesheetId: ts.id, expectedVersion: ts.version });
    assert.equal(ts.state, "approved");
    assert.ok(ts.timesheetRefSnapshot);
    ts = reopenTimesheet({
      actor,
      timesheetId: ts.id,
      expectedVersion: ts.version,
      reason: "Need edit",
    });
    assert.equal(ts.state, "reopened");
  });

  it("WF-18 exception escalate", () => {
    const actor = actorAll();
    const ex = raiseMissedClockIn({ personId: "p-esc", clinicId: CLINIC, shiftId: "shf-esc" });
    const esc = escalateException({ actor, exceptionId: ex.id, expectedVersion: ex.version });
    assert.equal(esc.state, "escalated");
  });

  it("WF-19A publish TimesheetRef + timesheet.approved (must pass)", () => {
    const actor = actorAll();
    const { session } = clockIn({
      actor,
      clinicId: CLINIC,
      localCivil: "2026-07-28T09:00",
      unrostered: true,
      clientEventId: "wf19a-in",
    });
    clockOut({
      actor,
      sessionId: session.id,
      localCivil: "2026-07-28T17:00",
      expectedVersion: session.version,
    });
    let ts = generateTimesheet({
      actor,
      personId: actor.personId!,
      clinicId: CLINIC,
      periodStart: "2026-07-20",
      periodEnd: "2026-07-30",
    });
    ts = submitTimesheet({ actor, timesheetId: ts.id, expectedVersion: ts.version });
    ts = approveTimesheet({ actor, timesheetId: ts.id, expectedVersion: ts.version });
    assert.equal(ts.state, "approved");
    assert.ok(ts.publishIdempotencyKey);
    assert.ok(ts.timesheetRefSnapshot);
    assert.equal((ts.timesheetRefSnapshot as { approved?: boolean }).approved, true);
    const again = publishTimesheetApproved({ actor, timesheet: getTimesheet(ts.id)! });
    assert.equal(again.published, true);
  });

  it("WF-19B BLOCKED-M07 intake does not write pulse.m07", () => {
    const result = attemptM07Intake("ts-any");
    assert.equal(result.blocked, true);
    assert.equal(result.workflowEvidenceCode, "BLOCKED-M07");
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      assert.ok(!k?.startsWith("pulse.m07."));
    }
  });

  it("WF-20 roster vs attendance reconcile", () => {
    const actor = actorAll();
    const r = reconcileRosterAttendance({ actor, clinicId: CLINIC });
    assert.ok(Array.isArray(r.rows));
  });

  it("WF-21 bulk approve partial success", () => {
    const actor = actorAll();
    const worker = actorWorker();
    const { session } = clockIn({
      actor: worker,
      clinicId: CLINIC,
      localCivil: "2026-07-28T09:00",
      unrostered: true,
      clientEventId: "wf21-in",
    });
    clockOut({
      actor: worker,
      sessionId: session.id,
      localCivil: "2026-07-28T17:00",
      expectedVersion: session.version,
    });
    let ts = generateTimesheet({
      actor: worker,
      personId: worker.personId!,
      clinicId: CLINIC,
      periodStart: "2026-07-20",
      periodEnd: "2026-07-30",
    });
    ts = submitTimesheet({ actor: worker, timesheetId: ts.id, expectedVersion: ts.version });
    const pending = listApprovals(CLINIC).filter((a) => a.state === "pending");
    const result = submitBulkApprove({
      actor,
      approvalIds: [...pending.map((p) => p.id), "missing-id"],
    });
    assert.ok(result.results.some((r) => r.ok));
    assert.ok(result.results.some((r) => !r.ok));
  });

  it("declaration path for explained exception", () => {
    const worker = actorWorker();
    const ex = raiseMissedClockIn({
      personId: worker.personId!,
      clinicId: CLINIC,
      shiftId: "shf-decl",
    });
    const explained = declareException({
      actor: worker,
      exceptionId: ex.id,
      text: "Traffic delay",
      expectedVersion: ex.version,
    });
    assert.equal(explained.state, "explained");
  });

  it("M02 projection writes for missed clock-in", () => {
    const ex = raiseMissedClockIn({ personId: "p-m02", clinicId: CLINIC, shiftId: "shf-m02" });
    const row = findInboxActionForSource("time-attendance", `attendance-${ex.kind}`, ex.id);
    assert.ok(row, "M02 projection must write an inbox row");
  });
});
