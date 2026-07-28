/**
 * Timesheet service — generate/submit/approve/reject/reopen + WF-19A publish.
 */

import { createTimesheetRef } from "@/platform/workforce/contracts/timesheet-ref";
import { assertM06ClinicScope, assertM06Permission, type M06Actor } from "../permissions";
import {
  getTimesheet,
  listSessions,
  listTimesheets,
  newApprovalId,
  newTimesheetId,
  upsertApproval,
  upsertTimesheet,
} from "../repository/local-store";
import type { TimesheetRecord } from "../types";
import { closeTimesheetInbox, syncTimesheetAwaitingApproval } from "../adapters/m06-inbox-sync";
import { acknowledgeApprovedTimesheetIntake } from "../adapters/m07-timesheet-bridge";
import { writeAudit } from "./audit-helpers";
import { publishM06AttendanceEvent } from "./events";
import {
  ConcurrentConflictError,
  InvalidLifecycleTransitionError,
  ValidationError,
} from "./errors";

function minutesBetween(a: string, b: string): number {
  return Math.max(0, Math.round((Date.parse(b) - Date.parse(a)) / 60000));
}

export function generateTimesheet(input: {
  actor: M06Actor;
  personId: string;
  clinicId: string;
  periodStart: string;
  periodEnd: string;
}): TimesheetRecord {
  assertM06Permission(input.actor, "attendance.timesheet.generate");
  assertM06ClinicScope(input.actor, [input.clinicId]);
  const sessions = listSessions(input.clinicId).filter(
    (s) =>
      s.personId === input.personId &&
      (s.state === "closed" || s.state === "corrected") &&
      s.openedAt.localCivil.slice(0, 10) >= input.periodStart &&
      s.openedAt.localCivil.slice(0, 10) <= input.periodEnd
  );
  const totalMinutes = sessions.reduce((sum, s) => {
    if (!s.closedAt) return sum;
    return sum + minutesBetween(s.openedAt.occurredAtUtc, s.closedAt.occurredAtUtc);
  }, 0);
  const existing = listTimesheets(input.clinicId).find(
    (t) =>
      t.personId === input.personId &&
      t.periodStart === input.periodStart &&
      t.periodEnd === input.periodEnd &&
      t.state === "draft"
  );
  const now = new Date().toISOString();
  if (existing) {
    const next = {
      ...existing,
      sessionIds: sessions.map((s) => s.id),
      totalMinutes,
      version: existing.version + 1,
      updatedAt: now,
    };
    return upsertTimesheet(next);
  }
  const row: TimesheetRecord = {
    id: newTimesheetId(),
    personId: input.personId,
    clinicId: input.clinicId,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    state: "draft",
    version: 1,
    sessionIds: sessions.map((s) => s.id),
    totalMinutes,
    createdAt: now,
    updatedAt: now,
  };
  return upsertTimesheet(row);
}

export function submitTimesheet(input: {
  actor: M06Actor;
  timesheetId: string;
  expectedVersion: number;
}): TimesheetRecord {
  assertM06Permission(input.actor, "attendance.timesheet.submit");
  const t = getTimesheet(input.timesheetId);
  if (!t) throw new ValidationError("Timesheet not found");
  assertM06ClinicScope(input.actor, [t.clinicId]);
  if (t.state !== "draft" && t.state !== "reopened") {
    throw new InvalidLifecycleTransitionError({ from: t.state, to: "submitted", targetType: "timesheet" });
  }
  if (t.version !== input.expectedVersion) {
    throw new ConcurrentConflictError({
      targetType: "timesheet",
      targetId: t.id,
      expectedVersion: input.expectedVersion,
      actualVersion: t.version,
    });
  }
  const next = { ...t, state: "submitted" as const, version: t.version + 1, updatedAt: new Date().toISOString() };
  upsertTimesheet(next);
  upsertApproval({
    id: newApprovalId(),
    kind: "timesheet",
    targetId: next.id,
    personId: next.personId,
    clinicId: next.clinicId,
    state: "pending",
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  syncTimesheetAwaitingApproval(next);
  return next;
}

/** WF-19A — publish TimesheetRef + timesheet.approved (M06-owned). */
export function publishTimesheetApproved(input: {
  actor: M06Actor;
  timesheet: TimesheetRecord;
}): { timesheet: TimesheetRecord; published: true; ref: ReturnType<typeof createTimesheetRef> } {
  if (input.timesheet.state !== "approved") {
    throw new ValidationError("Only approved timesheets can be published");
  }
  const idempotencyKey =
    input.timesheet.publishIdempotencyKey ??
    `publish::${input.timesheet.id}::${input.timesheet.version}`;

  if (input.timesheet.timesheetRefSnapshot && input.timesheet.publishIdempotencyKey === idempotencyKey) {
    return {
      timesheet: input.timesheet,
      published: true,
      ref: input.timesheet.timesheetRefSnapshot as unknown as ReturnType<typeof createTimesheetRef>,
    };
  }

  const ref = createTimesheetRef({
    recordId: input.timesheet.id,
    personId: input.timesheet.personId,
    periodStart: input.timesheet.periodStart,
    periodEnd: input.timesheet.periodEnd,
    approved: true,
    status: "approved",
    clinicId: input.timesheet.clinicId,
    organisationId: input.timesheet.organisationId,
    section: "timesheets",
    sourceVersion: input.timesheet.version,
    publishedAt: new Date().toISOString(),
    idempotencyKey,
    attendanceSessionIds: input.timesheet.sessionIds,
  });

  const result = publishM06AttendanceEvent({
    eventType: "timesheet.approved",
    sourceRecordId: input.timesheet.id,
    sourceRecordVersion: input.timesheet.version,
    sourceRecordType: "timesheet",
    sourceRecordTitle: `Timesheet ${input.timesheet.id} approved`,
    clinicId: input.timesheet.clinicId,
    organisationId: input.timesheet.organisationId,
    actor: input.actor.userId,
    idempotencyKey,
    section: "timesheets",
    currentStatus: "approved",
    payload: {
      timesheetRef: ref,
      published: true,
    },
  });

  if (!result.accepted) {
    throw new ValidationError("WF-19A publication failed — timesheet.approved was not accepted");
  }
  // duplicate accepted republish is idempotent success
  void result.duplicate;

  const next: TimesheetRecord = {
    ...input.timesheet,
    publishedAt: ref.publishedAt ?? new Date().toISOString(),
    publishIdempotencyKey: idempotencyKey,
    timesheetRefSnapshot: ref as unknown as Record<string, unknown>,
    updatedAt: new Date().toISOString(),
  };
  upsertTimesheet(next);
  writeAudit({
    actorId: input.actor.userId,
    action: "timesheet.published",
    targetType: "timesheet",
    targetId: next.id,
    clinicId: next.clinicId,
    detail: idempotencyKey,
  });
  return { timesheet: next, published: true, ref };
}

export function approveTimesheet(input: {
  actor: M06Actor;
  timesheetId: string;
  expectedVersion: number;
}): TimesheetRecord {
  assertM06Permission(input.actor, "attendance.approve");
  const t = getTimesheet(input.timesheetId);
  if (!t) throw new ValidationError("Timesheet not found");
  assertM06ClinicScope(input.actor, [t.clinicId]);
  if (t.state !== "submitted") {
    throw new InvalidLifecycleTransitionError({ from: t.state, to: "approved", targetType: "timesheet" });
  }
  if (t.version !== input.expectedVersion) {
    throw new ConcurrentConflictError({
      targetType: "timesheet",
      targetId: t.id,
      expectedVersion: input.expectedVersion,
      actualVersion: t.version,
    });
  }
  const approved = { ...t, state: "approved" as const, version: t.version + 1, updatedAt: new Date().toISOString() };
  upsertTimesheet(approved);
  closeTimesheetInbox(approved);
  const published = publishTimesheetApproved({ actor: input.actor, timesheet: approved });
  return published.timesheet;
}

export function rejectTimesheet(input: {
  actor: M06Actor;
  timesheetId: string;
  expectedVersion: number;
}): TimesheetRecord {
  assertM06Permission(input.actor, "attendance.approve");
  const t = getTimesheet(input.timesheetId);
  if (!t) throw new ValidationError("Timesheet not found");
  assertM06ClinicScope(input.actor, [t.clinicId]);
  if (t.state !== "submitted") {
    throw new InvalidLifecycleTransitionError({ from: t.state, to: "rejected", targetType: "timesheet" });
  }
  if (t.version !== input.expectedVersion) {
    throw new ConcurrentConflictError({
      targetType: "timesheet",
      targetId: t.id,
      expectedVersion: input.expectedVersion,
      actualVersion: t.version,
    });
  }
  const next = { ...t, state: "rejected" as const, version: t.version + 1, updatedAt: new Date().toISOString() };
  upsertTimesheet(next);
  closeTimesheetInbox(next);
  return next;
}

export function reopenTimesheet(input: {
  actor: M06Actor;
  timesheetId: string;
  expectedVersion: number;
  reason: string;
}): TimesheetRecord {
  assertM06Permission(input.actor, "attendance.reopen");
  const t = getTimesheet(input.timesheetId);
  if (!t) throw new ValidationError("Timesheet not found");
  assertM06ClinicScope(input.actor, [t.clinicId]);
  if (t.state !== "approved") {
    throw new InvalidLifecycleTransitionError({ from: t.state, to: "reopened", targetType: "timesheet" });
  }
  if (t.version !== input.expectedVersion) {
    throw new ConcurrentConflictError({
      targetType: "timesheet",
      targetId: t.id,
      expectedVersion: input.expectedVersion,
      actualVersion: t.version,
    });
  }
  const next = {
    ...t,
    state: "reopened" as const,
    version: t.version + 1,
    reopenReason: input.reason,
    updatedAt: new Date().toISOString(),
  };
  upsertTimesheet(next);
  writeAudit({
    actorId: input.actor.userId,
    action: "timesheet.reopened",
    targetType: "timesheet",
    targetId: t.id,
    clinicId: t.clinicId,
    detail: input.reason,
  });
  return next;
}

/** WF-19B boundary — never succeeds. */
export function attemptM07Intake(timesheetId: string) {
  return acknowledgeApprovedTimesheetIntake(timesheetId);
}

export function listTimesheetsForActor(actor: M06Actor, clinicId?: string): TimesheetRecord[] {
  assertM06Permission(actor, "attendance.timesheet.view");
  let rows = clinicId ? listTimesheets(clinicId) : listTimesheets();
  if (actor.clinicIds) rows = rows.filter((t) => actor.clinicIds!.includes(t.clinicId));
  if (!(actor.permissions.includes("*") || actor.permissions.includes("attendance.view.team"))) {
    const pid = actor.personId ?? actor.userId;
    rows = rows.filter((t) => t.personId === pid);
  }
  return rows;
}
