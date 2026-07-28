/**
 * Independently evidenced M06 workflows WF-01…18, WF-19A, WF-20, WF-21.
 * WF-19B acknowledgement boundary cleared at CP 2.7B (still no pulse.m07 write from bridge).
 * One successful operation must not credit multiple workflow IDs.
 */

import assert from "node:assert/strict";
import { describe, it, beforeEach, after } from "node:test";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { findInboxActionForSource } from "@/platform/services/action-inbox-bridge";
import {
  getWorkforceEventHistory,
  hasProcessedWorkforceEvent,
} from "@/platform/workforce/services/workforce-event-bus";
import { clockIn, clockOut } from "../services/clock-service";
import { startBreak, endBreak, recordMissedBreak } from "../services/break-service";
import {
  raiseMissedClockIn,
  raiseMissedClockOut,
  escalateException,
} from "../services/exception-service";
import {
  requestCorrection,
  approveCorrection,
  rejectCorrection,
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
import { publishPolicy } from "../services/policy-service";
import { listPublishedAssignmentsForPerson } from "../adapters/m05-shift-read";
import {
  ConcurrentConflictError,
  InvalidLifecycleTransitionError,
} from "../services/errors";
import {
  listApprovals,
  listAudit,
  listExceptions,
  listOfflineQueue,
  listSessions,
  upsertDevice,
  getTimesheet,
  getCorrection,
  getApproval,
} from "../repository/local-store";
import {
  actorAll,
  actorWorker,
  CLINIC,
  CLINIC_B,
  resetM06TestEnv,
  seedPublishedAssignment,
} from "./_helpers";

const REQUIRED_WORKFLOWS = [
  "WF-01",
  "WF-02",
  "WF-03",
  "WF-04",
  "WF-05",
  "WF-06",
  "WF-07",
  "WF-08",
  "WF-09",
  "WF-10",
  "WF-11",
  "WF-12",
  "WF-13",
  "WF-14",
  "WF-15",
  "WF-16",
  "WF-17",
  "WF-18",
  "WF-19A",
  "WF-20",
  "WF-21",
] as const;

type WfId = (typeof REQUIRED_WORKFLOWS)[number] | "WF-19B";

const workflowEvidence: Record<
  string,
  { id: WfId; name: string; result: "pass" | "fail" | "blocked"; detail: string }
> = {};

function recordWf(id: WfId, name: string, result: "pass" | "fail" | "blocked", detail: string) {
  workflowEvidence[id] = { id, name, result, detail };
}

describe("m06 workflows independent evidence", () => {
  beforeEach(() => resetM06TestEnv());

  after(() => {
    const outDir = join(process.cwd(), "docs", "audits");
    mkdirSync(outDir, { recursive: true });
    const required = REQUIRED_WORKFLOWS.map((id) => {
      const row = workflowEvidence[id];
      return row ?? { id, name: id, result: "fail" as const, detail: "missing independent evidence" };
    });
    const blocked = workflowEvidence["WF-19B"] ?? {
      id: "WF-19B" as const,
      name: "WF-19B",
      result: "fail" as const,
      detail: "missing blocked-boundary evidence",
    };
    writeFileSync(
      join(outDir, "wave5-m06-workflow-evidence.json"),
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          required,
          blockedIntake: blocked,
          requiredPassed: required.every((r) => r.result === "pass"),
          note: "BLOCKED-M10 is outside Wave 5 totals and is not listed here",
        },
        null,
        2
      )
    );
  });

  it("WF-01 rostered employee clock-in", () => {
    const actor = actorWorker("wf01-worker");
    seedPublishedAssignment({
      personId: actor.personId!,
      shiftId: "shf-wf01",
      assignmentId: "asn-wf01",
      localStart: "2026-07-28T09:00",
      localEnd: "2026-07-28T17:00",
    });
    const published = listPublishedAssignmentsForPerson(actor.personId!);
    assert.equal(published.length, 1);
    assert.equal(published[0]!.published, true);
    const { session, event } = clockIn({
      actor,
      clinicId: CLINIC,
      localCivil: "2026-07-28T09:00",
      shiftId: "shf-wf01",
      assignmentId: "asn-wf01",
      clientEventId: "wf01-in",
    });
    assert.equal(session.state, "open");
    assert.equal(session.rostered, true);
    assert.equal(session.shiftId, "shf-wf01");
    assert.equal(session.assignmentId, "asn-wf01");
    assert.equal(event.state, "recorded");
    assert.ok(listAudit().some((a) => a.action === "session.opened" && a.targetId === session.id));
    assert.equal(listExceptions(CLINIC).filter((e) => e.sessionId === session.id).length, 0);
    recordWf("WF-01", "rostered employee clock-in", "pass", `session=${session.id}; rostered=true; shift=shf-wf01`);
  });

  it("WF-02 unrostered clock-in", () => {
    const actor = actorWorker("wf02-worker");
    publishPolicy({ actor: actorAll(), clinicId: CLINIC, patch: { allowUnrostered: true } });
    const { session } = clockIn({
      actor,
      clinicId: CLINIC,
      localCivil: "2026-07-28T09:00",
      unrostered: true,
      clientEventId: "wf02-in",
    });
    assert.equal(session.rostered, false);
    assert.equal(session.state, "open");
    const ex = listExceptions(CLINIC).find((e) => e.sessionId === session.id && e.kind === "unrostered");
    assert.ok(ex, "unrostered exception required");
    const inbox = findInboxActionForSource("time-attendance", "attendance-unrostered", ex!.id);
    assert.ok(inbox, "M02 unrostered projection required");
    recordWf("WF-02", "unrostered clock-in", "pass", `session=${session.id}; exception=${ex!.id}`);
  });

  it("WF-03 early clock-in", () => {
    const actor = actorWorker("wf03-worker");
    seedPublishedAssignment({
      personId: actor.personId!,
      shiftId: "shf-wf03",
      assignmentId: "asn-wf03",
      localStart: "2026-07-28T09:00",
      localEnd: "2026-07-28T17:00",
    });
    // Policy earlyInMinutes=15 → 08:30 is early by 30 minutes
    const { session } = clockIn({
      actor,
      clinicId: CLINIC,
      localCivil: "2026-07-28T08:30",
      shiftId: "shf-wf03",
      clientEventId: "wf03-in",
    });
    assert.equal(session.rostered, true);
    const ex = listExceptions(CLINIC).find((e) => e.sessionId === session.id && e.kind === "early-in");
    assert.ok(ex, "early-in exception required");
    assert.equal(ex!.state, "open");
    const inbox = findInboxActionForSource("time-attendance", "attendance-early-in", ex!.id);
    assert.ok(inbox, "M02 early-in projection required");
    recordWf("WF-03", "early clock-in", "pass", `exception=${ex!.id}`);
  });

  it("WF-04 late arrival", () => {
    const actor = actorWorker("wf04-worker");
    seedPublishedAssignment({
      personId: actor.personId!,
      shiftId: "shf-wf04",
      assignmentId: "asn-wf04",
      localStart: "2026-07-28T09:00",
      localEnd: "2026-07-28T17:00",
    });
    // Grace 5 minutes → 09:20 is late
    const { session } = clockIn({
      actor,
      clinicId: CLINIC,
      localCivil: "2026-07-28T09:20",
      shiftId: "shf-wf04",
      clientEventId: "wf04-in",
    });
    assert.equal(session.rostered, true);
    const ex = listExceptions(CLINIC).find((e) => e.sessionId === session.id && e.kind === "late-in");
    assert.ok(ex, "late-in exception required");
    const inbox = findInboxActionForSource("time-attendance", "attendance-late-in", ex!.id);
    assert.ok(inbox, "M02 late-in projection required");
    recordWf("WF-04", "late arrival", "pass", `exception=${ex!.id}; inbox=${inbox!.id}`);
  });

  it("WF-05 missed clock-in", () => {
    const ex = raiseMissedClockIn({ personId: "p-wf05", clinicId: CLINIC, shiftId: "shf-wf05" });
    assert.equal(ex.kind, "missed-in");
    assert.equal(ex.state, "open");
    const again = raiseMissedClockIn({ personId: "p-wf05", clinicId: CLINIC, shiftId: "shf-wf05" });
    assert.equal(again.id, ex.id, "idempotent missed-in identity");
    const inbox = findInboxActionForSource("time-attendance", "attendance-missed-in", ex.id);
    assert.ok(inbox);
    recordWf("WF-05", "missed clock-in", "pass", `exception=${ex.id}; idempotent`);
  });

  it("WF-06 break start", () => {
    const actor = actorWorker("wf06-worker");
    const { session } = clockIn({
      actor,
      clinicId: CLINIC,
      localCivil: "2026-07-28T09:00",
      unrostered: true,
      clientEventId: "wf06-in",
    });
    const brk = startBreak({
      actor,
      sessionId: session.id,
      localCivil: "2026-07-28T12:00",
      expectedSessionVersion: session.version,
      clientEventId: "wf06-brk",
    });
    assert.equal(brk.state, "in_progress");
    const open = listSessions(CLINIC).find((s) => s.id === session.id);
    assert.equal(open?.state, "on_break");
    assert.ok(listAudit().some((a) => a.targetId === brk.id || a.action.includes("break")));
    recordWf("WF-06", "break start", "pass", `break=${brk.id}; session=on_break`);
  });

  it("WF-07 break end", () => {
    const actor = actorWorker("wf07-worker");
    const { session } = clockIn({
      actor,
      clinicId: CLINIC,
      localCivil: "2026-07-28T09:00",
      unrostered: true,
      clientEventId: "wf07-in",
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
    const open = listSessions(CLINIC).find((s) => s.id === session.id);
    assert.equal(open?.state, "open");
    recordWf("WF-07", "break end", "pass", `break=${ended.id}; session=open`);
  });

  it("WF-08 missed break", () => {
    const actor = actorAll("wf08-mgr");
    const { session } = clockIn({
      actor,
      clinicId: CLINIC,
      localCivil: "2026-07-28T09:00",
      unrostered: true,
      clientEventId: "wf08-in",
    });
    const brk = recordMissedBreak({
      sessionId: session.id,
      personId: session.personId,
      clinicId: CLINIC,
      breakReqId: "req-wf08",
    });
    assert.equal(brk.state, "missed");
    const again = recordMissedBreak({
      sessionId: session.id,
      personId: session.personId,
      clinicId: CLINIC,
      breakReqId: "req-wf08",
    });
    assert.equal(again.id, brk.id, "missed break dedupe");
    recordWf("WF-08", "missed break", "pass", `break=${brk.id}`);
  });

  it("WF-09 normal clock-out", () => {
    const actor = actorWorker("wf09-worker");
    seedPublishedAssignment({
      personId: actor.personId!,
      shiftId: "shf-wf09",
      assignmentId: "asn-wf09",
      localStart: "2026-07-28T09:00",
      localEnd: "2026-07-28T17:00",
    });
    const { session } = clockIn({
      actor,
      clinicId: CLINIC,
      localCivil: "2026-07-28T09:00",
      shiftId: "shf-wf09",
      clientEventId: "wf09-in",
    });
    const { session: closed } = clockOut({
      actor,
      sessionId: session.id,
      localCivil: "2026-07-28T17:00",
      expectedVersion: session.version,
      clientEventId: "wf09-out",
    });
    assert.equal(closed.state, "closed");
    const early = listExceptions(CLINIC).find((e) => e.sessionId === session.id && e.kind === "early-out");
    assert.equal(early, undefined, "normal out must not create early-out exception");
    assert.ok(listAudit().some((a) => a.action === "session.closed" && a.targetId === session.id));
    recordWf("WF-09", "normal clock-out", "pass", `session=${closed.id}; no early-out`);
  });

  it("WF-10 early departure", () => {
    const actor = actorWorker("wf10-worker");
    seedPublishedAssignment({
      personId: actor.personId!,
      shiftId: "shf-wf10",
      assignmentId: "asn-wf10",
      localStart: "2026-07-28T09:00",
      localEnd: "2026-07-28T17:00",
    });
    const { session } = clockIn({
      actor,
      clinicId: CLINIC,
      localCivil: "2026-07-28T09:00",
      shiftId: "shf-wf10",
      clientEventId: "wf10-in",
    });
    // earlyOutMinutes=15 → 16:00 is early by 60 minutes
    const { session: closed } = clockOut({
      actor,
      sessionId: session.id,
      localCivil: "2026-07-28T16:00",
      expectedVersion: session.version,
      clientEventId: "wf10-out",
    });
    assert.equal(closed.state, "closed");
    const ex = listExceptions(CLINIC).find((e) => e.sessionId === session.id && e.kind === "early-out");
    assert.ok(ex, "early-out exception required");
    const inbox = findInboxActionForSource("time-attendance", "attendance-early-out", ex!.id);
    assert.ok(inbox, "M02 early-out projection required");
    recordWf("WF-10", "early departure", "pass", `exception=${ex!.id}`);
  });

  it("WF-11 missed clock-out", () => {
    const actor = actorAll("wf11");
    const { session } = clockIn({
      actor,
      clinicId: CLINIC,
      localCivil: "2026-07-28T09:00",
      unrostered: true,
      clientEventId: "wf11-in",
    });
    const ex = raiseMissedClockOut({
      sessionId: session.id,
      personId: session.personId,
      clinicId: CLINIC,
    });
    assert.equal(ex.kind, "missed-out");
    const again = raiseMissedClockOut({
      sessionId: session.id,
      personId: session.personId,
      clinicId: CLINIC,
    });
    assert.equal(again.id, ex.id);
    const inbox = findInboxActionForSource("time-attendance", "attendance-missed-out", ex.id);
    assert.ok(inbox);
    recordWf("WF-11", "missed clock-out", "pass", `exception=${ex.id}`);
  });

  it("WF-12 cross-midnight attendance", () => {
    const actor = actorWorker("wf12-worker");
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
      clientEventId: "wf12-out",
    });
    assert.ok(closed.closedAt);
    assert.notEqual(closed.openedAt.localCivil.slice(0, 10), closed.closedAt!.localCivil.slice(0, 10));
    assert.equal(closed.openedAt.timeZoneId, "Australia/Brisbane");
    assert.ok(closed.openedAt.occurredAtUtc);
    recordWf("WF-12", "cross-midnight attendance", "pass", `in=${closed.openedAt.localCivil}; out=${closed.closedAt!.localCivil}`);
  });

  it("WF-13 offline capture and synchronization", () => {
    const actor = actorWorker("wf13-worker");
    upsertDevice({
      id: "dev-wf13",
      clinicId: CLINIC,
      label: "Controlled demo device",
      revoked: false,
      createdAt: new Date().toISOString(),
    });
    const queued = enqueueOfflineEvent({
      actor,
      deviceId: "dev-wf13",
      clientEventId: "off-wf13-1",
      clientSequence: 1,
      clinicId: CLINIC,
      payload: { kind: "clock-in", localCivil: "2026-07-28T09:00" },
    });
    assert.equal(queued.state, "queued");
    const dup = enqueueOfflineEvent({
      actor,
      deviceId: "dev-wf13",
      clientEventId: "off-wf13-1",
      clientSequence: 1,
      clinicId: CLINIC,
      payload: { kind: "clock-in", localCivil: "2026-07-28T09:00" },
    });
    assert.equal(dup.id, queued.id, "idempotent offline enqueue");
    const result = syncOfflineQueue({ actor, deviceId: "dev-wf13" });
    assert.equal(result.applied.length, 1);
    assert.ok(listSessions(CLINIC).some((s) => s.personId === actor.personId && s.state === "open"));
    assert.ok(listOfflineQueue().some((o) => o.id === queued.id && o.state === "applied"));
    recordWf("WF-13", "offline capture and sync", "pass", `applied=${result.applied[0]}`);
  });

  it("WF-14 employee correction request", () => {
    const worker = actorWorker("wf14-worker");
    const { session } = clockIn({
      actor: worker,
      clinicId: CLINIC,
      localCivil: "2026-07-28T09:00",
      unrostered: true,
      clientEventId: "wf14-in",
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
    assert.ok(listAudit().some((a) => a.action === "correction.requested" && a.targetId === corr.id));
    const inbox = findInboxActionForSource("time-attendance", "correction-approval", corr.id);
    assert.ok(inbox, "M02 correction pending projection");
    // Must not auto-apply
    assert.notEqual(corr.state, "applied");
    recordWf("WF-14", "employee correction request", "pass", `correction=${corr.id}; state=requested`);
  });

  it("WF-15 manager correction", () => {
    const manager = actorAll("wf15-mgr");
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
    assert.ok(listAudit().some((a) => a.targetId === corr.id || a.detail?.includes("Manager")));
    recordWf("WF-15", "manager correction", "pass", `correction=${corr.id}`);
  });

  it("WF-16 correction approval rejection and approved application", async (t) => {
    const worker = actorWorker("wf16-worker");
    const manager = actorAll("wf16-mgr");

    await t.test("approve applies correction once", () => {
      const { session } = clockIn({
        actor: worker,
        clinicId: CLINIC,
        localCivil: "2026-07-28T09:00",
        unrostered: true,
        clientEventId: `wf16-approve-in-${Math.random()}`,
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
        reason: "Approve path",
        proposedLocalCivil: "2026-07-28T17:20",
      });
      const applied = approveCorrection({
        actor: manager,
        correctionId: corr.id,
        expectedVersion: corr.version,
      });
      assert.equal(applied.state, "applied");
      assert.throws(
        () =>
          approveCorrection({
            actor: manager,
            correctionId: corr.id,
            expectedVersion: corr.version,
          }),
        (e: unknown) => e instanceof InvalidLifecycleTransitionError || e instanceof ConcurrentConflictError
      );
    });

    await t.test("reject leaves correction rejected and not applied", () => {
      const { session } = clockIn({
        actor: worker,
        clinicId: CLINIC,
        localCivil: "2026-07-28T09:00",
        unrostered: true,
        clientEventId: `wf16-reject-in-${Math.random()}`,
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
        reason: "Reject path",
        proposedLocalCivil: "2026-07-28T17:25",
      });
      const rejected = rejectCorrection({
        actor: manager,
        correctionId: corr.id,
        expectedVersion: corr.version,
        reason: "Insufficient evidence",
      });
      assert.equal(rejected.state, "rejected");
      assert.equal(getCorrection(corr.id)?.state, "rejected");
    });

    await t.test("stale version is rejected", () => {
      const { session } = clockIn({
        actor: worker,
        clinicId: CLINIC,
        localCivil: "2026-07-28T09:00",
        unrostered: true,
        clientEventId: `wf16-stale-in-${Math.random()}`,
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
        reason: "Stale path",
        proposedLocalCivil: "2026-07-28T17:30",
      });
      assert.throws(
        () =>
          approveCorrection({
            actor: manager,
            correctionId: corr.id,
            expectedVersion: corr.version - 1,
          }),
        ConcurrentConflictError
      );
    });

    recordWf("WF-16", "correction approval/rejection/apply", "pass", "approve+reject+stale covered");
  });

  it("WF-17 reopened timesheet", () => {
    const actor = actorAll("wf17");
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
    ts = reopenTimesheet({
      actor,
      timesheetId: ts.id,
      expectedVersion: ts.version,
      reason: "Need edit",
    });
    assert.equal(ts.state, "reopened");
    assert.ok(listAudit().some((a) => a.action === "timesheet.reopened" && a.targetId === ts.id));
    recordWf("WF-17", "reopened timesheet", "pass", `timesheet=${ts.id}`);
  });

  it("WF-18 exception escalation", () => {
    const actor = actorAll("wf18");
    const ex = raiseMissedClockIn({ personId: "p-wf18", clinicId: CLINIC, shiftId: "shf-wf18" });
    const before = findInboxActionForSource("time-attendance", "attendance-missed-in", ex.id);
    assert.ok(before);
    const esc = escalateException({ actor, exceptionId: ex.id, expectedVersion: ex.version });
    assert.equal(esc.state, "escalated");
    const after = findInboxActionForSource("time-attendance", "attendance-missed-in", ex.id);
    assert.ok(after, "M02 lifecycle retained/updated on escalate");
    recordWf("WF-18", "exception escalation", "pass", `exception=${esc.id}`);
  });

  it("WF-19A approved TimesheetRef publication", () => {
    const actor = actorAll("wf19a");
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
    const ref = ts.timesheetRefSnapshot as {
      approved?: boolean;
      sourceVersion?: number;
      idempotencyKey?: string;
      owningModuleId?: string;
    };
    assert.equal(ref.approved, true);
    assert.equal(ref.owningModuleId, "time-attendance");
    assert.equal(ref.sourceVersion, ts.version);
    assert.equal(ref.idempotencyKey, ts.publishIdempotencyKey);
    const events = getWorkforceEventHistory().filter((e) => e.eventType === "timesheet.approved");
    assert.ok(events.length >= 1, "timesheet.approved must be emitted");
    const evt = events.find((e) => e.source.sourceRecordId === ts.id);
    assert.ok(evt);
    assert.equal(evt!.sourceVersion, ts.version);
    assert.equal(evt!.idempotencyKey, ts.publishIdempotencyKey);
    assert.ok(hasProcessedWorkforceEvent(ts.publishIdempotencyKey!));
    const historyBefore = getWorkforceEventHistory().length;
    const again = publishTimesheetApproved({ actor, timesheet: getTimesheet(ts.id)! });
    assert.equal(again.published, true);
    assert.equal(getWorkforceEventHistory().length, historyBefore, "idempotent republish must not duplicate side effect");
    recordWf("WF-19A", "TimesheetRef publication", "pass", `idempotency=${ts.publishIdempotencyKey}`);
  });

  it("WF-19B M07 acknowledgement boundary does not write pulse.m07", () => {
    const result = attemptM07Intake("ts-any");
    assert.equal(result.blocked, false);
    assert.equal(result.workflowEvidenceCode, "CLEARED-M07-BATCH2");
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      assert.ok(!k?.startsWith("pulse.m07."));
    }
    recordWf("WF-19B", "M07 acknowledgement cleared; no pulse.m07 write", "pass", "CLEARED-M07-BATCH2");
  });

  it("WF-20 roster-versus-attendance reconciliation", () => {
    const actor = actorAll("wf20");
    const personId = "p-wf20-missing";
    seedPublishedAssignment({
      personId,
      shiftId: "shf-wf20",
      assignmentId: "asn-wf20",
      localStart: "2026-07-28T09:00",
      localEnd: "2026-07-28T17:00",
    });
    // Seed an unrostered attendance for classification coverage
    const worker = actorWorker("wf20-unrostered");
    clockIn({
      actor: worker,
      clinicId: CLINIC,
      localCivil: "2026-07-28T09:00",
      unrostered: true,
      clientEventId: "wf20-unrostered-in",
    });
    // Force reconcile to see the published person without attendance
    const r = reconcileRosterAttendance({ actor, clinicId: CLINIC, personId });
    const missing = r.rows.find(
      (row) => row.personId === personId && row.shiftId === "shf-wf20" && row.variance === "missing-attendance"
    );
    assert.ok(missing, "must classify known missing-attendance mismatch");
    assert.equal(missing!.hasAttendance, false);
    const full = reconcileRosterAttendance({ actor, clinicId: CLINIC });
    assert.ok(full.rows.some((row) => row.variance === "unrostered-attendance"));
    assert.ok(r.exceptionIds.length >= 1 || listExceptions(CLINIC).some((e) => e.message.includes("shf-wf20")));
    recordWf("WF-20", "roster vs attendance reconcile", "pass", `missing=${missing!.assignmentId}`);
  });

  it("WF-21 bulk approval with partial success", () => {
    const workerA = actorWorker("wf21-worker-a");
    workerA.clinicIds = [CLINIC];
    const workerB = actorWorker("wf21-worker-b");
    workerB.clinicIds = [CLINIC_B];

    // A — authorized pending in CLINIC
    const { session: sessionA } = clockIn({
      actor: workerA,
      clinicId: CLINIC,
      localCivil: "2026-07-28T09:00",
      unrostered: true,
      clientEventId: "wf21-a-in",
    });
    clockOut({
      actor: workerA,
      sessionId: sessionA.id,
      localCivil: "2026-07-28T17:00",
      expectedVersion: sessionA.version,
    });
    let tsA = generateTimesheet({
      actor: workerA,
      personId: workerA.personId!,
      clinicId: CLINIC,
      periodStart: "2026-07-20",
      periodEnd: "2026-07-30",
    });
    tsA = submitTimesheet({ actor: workerA, timesheetId: tsA.id, expectedVersion: tsA.version });
    const itemA = listApprovals(CLINIC).find((a) => a.state === "pending" && a.targetId === tsA.id);
    assert.ok(itemA, "authorized CLINIC approval must exist");
    const authorizedId = itemA!.id;
    const versionABefore = itemA!.version;

    // B — existing pending in CLINIC_B (must exist before submission)
    const { session: sessionB } = clockIn({
      actor: workerB,
      clinicId: CLINIC_B,
      localCivil: "2026-07-28T09:00",
      unrostered: true,
      clientEventId: "wf21-b-in",
    });
    clockOut({
      actor: workerB,
      sessionId: sessionB.id,
      localCivil: "2026-07-28T17:00",
      expectedVersion: sessionB.version,
    });
    let tsB = generateTimesheet({
      actor: workerB,
      personId: workerB.personId!,
      clinicId: CLINIC_B,
      periodStart: "2026-07-20",
      periodEnd: "2026-07-30",
    });
    tsB = submitTimesheet({ actor: workerB, timesheetId: tsB.id, expectedVersion: tsB.version });
    const itemB = listApprovals(CLINIC_B).find((a) => a.state === "pending" && a.targetId === tsB.id);
    assert.ok(itemB, "cross-clinic CLINIC_B approval must exist before bulk submit");
    const crossClinicId = itemB!.id;
    const versionBBefore = itemB!.version;
    assert.equal(itemB!.clinicId, CLINIC_B);

    const missingId = "missing-approval-wf21";
    assert.ok(!getApproval(missingId));

    // Manager scoped ONLY to CLINIC (no * — wildcards bypass clinic scope)
    const scopedManager = {
      userId: "wf21-scoped-mgr",
      personId: "wf21-scoped-mgr",
      clinicIds: [CLINIC],
      permissions: [
        "attendance.bulk.approve",
        "attendance.approve",
        "attendance.correction.apply",
        "attendance.timesheet.view",
      ],
    };

    const result = submitBulkApprove({
      actor: scopedManager,
      approvalIds: [authorizedId, crossClinicId, missingId],
      rejectRest: true,
    });

    const rowA = result.results.find((r) => r.approvalId === authorizedId);
    const rowB = result.results.find((r) => r.approvalId === crossClinicId);
    const rowC = result.results.find((r) => r.approvalId === missingId);
    assert.ok(rowA?.ok === true, "A must succeed");
    assert.ok(rowB?.ok === false && rowB.error === "clinic-scope-denied", `B must be scope-denied, got ${rowB?.error}`);
    assert.ok(rowC?.ok === false && rowC.error === "not-found", `C must be not-found, got ${rowC?.error}`);

    const afterA = getApproval(authorizedId)!;
    assert.equal(afterA.state, "approved");
    assert.ok(afterA.version > versionABefore);

    const afterB = getApproval(crossClinicId)!;
    assert.equal(afterB.state, "pending", "rejectRest must not reject cross-clinic item");
    assert.equal(afterB.version, versionBBefore, "cross-clinic version must be unchanged");
    assert.equal(afterB.clinicId, CLINIC_B);

    assert.ok(!getApproval(missingId), "missing id must not create an approval");

    assert.ok(listAudit().some((a) => a.action === "bulk.approve.item.ok" && a.targetId === authorizedId));
    const skipB = listAudit().find((a) => a.action === "bulk.approve.item.skipped" && a.targetId === crossClinicId);
    assert.ok(skipB);
    assert.equal(skipB!.detail, "clinic-scope-denied");
    assert.ok(!/password|ssn|location|biometric|device/i.test(JSON.stringify(skipB)));
    assert.ok(
      listAudit().some((a) => a.action === "bulk.approve.item.skipped" && a.targetId === missingId && a.detail === "not-found")
    );
    assert.ok(
      listAudit().some((a) => a.action === "bulk.approve.item.rejectRest.blocked" && a.targetId === crossClinicId),
      "rejectRest blocked audit required for cross-clinic item"
    );

    assert.equal(getApproval(authorizedId)?.state, "approved");
    assert.equal(getApproval(crossClinicId)?.state, "pending");
    assert.ok(!getApproval(missingId));

    recordWf(
      "WF-21",
      "bulk approval partial success",
      "pass",
      `ok=${authorizedId}; scope-denied=${crossClinicId}; not-found=${missingId}; rejectRest-blocked`
    );
  });
});
