import { assertM06ClinicScope, assertM06Permission, type M06Actor } from "../permissions";
import {
  appendEvent,
  getBreak,
  getSession,
  listBreaks,
  newBreakId,
  newEventId,
  newExceptionId,
  upsertBreak,
  upsertException,
  upsertSession,
} from "../repository/local-store";
import type { BreakRecord, FoldFlag } from "../types";
import { syncExceptionToInbox } from "../adapters/m06-inbox-sync";
import { writeAudit } from "./audit-helpers";
import { resolveLocalInstant, toAttendanceTimeStamp } from "./clinic-time-service";
import { publishM06AttendanceEvent } from "./events";
import {
  ConcurrentConflictError,
  InvalidLifecycleTransitionError,
  UnresolvedTimezoneError,
  ValidationError,
} from "./errors";

export function startBreak(input: {
  actor: M06Actor;
  sessionId: string;
  localCivil: string;
  fold?: FoldFlag;
  expectedSessionVersion: number;
  clientEventId?: string;
}): BreakRecord {
  assertM06Permission(input.actor, "attendance.break.self");
  const session = getSession(input.sessionId);
  if (!session) throw new ValidationError("Session not found");
  assertM06ClinicScope(input.actor, [session.clinicId]);
  if (session.state !== "open") {
    throw new InvalidLifecycleTransitionError({ from: session.state, to: "on_break", targetType: "session" });
  }
  if (session.version !== input.expectedSessionVersion) {
    throw new ConcurrentConflictError({
      targetType: "session",
      targetId: session.id,
      expectedVersion: input.expectedSessionVersion,
      actualVersion: session.version,
    });
  }
  if (listBreaks(session.id).some((b) => b.state === "in_progress")) {
    throw new ValidationError("Break already in progress");
  }
  const resolved = resolveLocalInstant(session.clinicId, input.localCivil, input.fold ?? 0);
  if (!resolved.ok) throw new UnresolvedTimezoneError(resolved.reason, resolved.message);

  const now = new Date().toISOString();
  const brk: BreakRecord = {
    id: newBreakId(),
    sessionId: session.id,
    personId: session.personId,
    clinicId: session.clinicId,
    state: "in_progress",
    version: 1,
    startedAt: toAttendanceTimeStamp(resolved.instant),
    createdAt: now,
    updatedAt: now,
  };
  upsertBreak(brk);
  upsertSession({ ...session, state: "on_break", version: session.version + 1, updatedAt: now });
  appendEvent({
    id: newEventId(),
    sessionId: session.id,
    personId: session.personId,
    clinicId: session.clinicId,
    eventType: "break-start",
    state: "recorded",
    time: brk.startedAt!,
    clientEventId: input.clientEventId,
    idempotencyKey: input.clientEventId,
    createdAt: now,
  });
  publishM06AttendanceEvent({
    eventType: "attendance.event.recorded",
    sourceRecordId: brk.id,
    sourceRecordVersion: 1,
    sourceRecordType: "break",
    sourceRecordTitle: "Break start",
    clinicId: session.clinicId,
    actor: input.actor.userId,
    idempotencyKey: input.clientEventId ?? `break-start::${brk.id}`,
    section: "breaks",
  });
  writeAudit({
    actorId: input.actor.userId,
    action: "break.started",
    targetType: "break",
    targetId: brk.id,
    clinicId: session.clinicId,
  });
  return brk;
}

export function endBreak(input: {
  actor: M06Actor;
  breakId: string;
  localCivil: string;
  fold?: FoldFlag;
  expectedVersion: number;
  clientEventId?: string;
}): BreakRecord {
  assertM06Permission(input.actor, "attendance.break.self");
  const brk = getBreak(input.breakId);
  if (!brk) throw new ValidationError("Break not found");
  assertM06ClinicScope(input.actor, [brk.clinicId]);
  if (brk.state !== "in_progress") {
    throw new InvalidLifecycleTransitionError({ from: brk.state, to: "completed", targetType: "break" });
  }
  if (brk.version !== input.expectedVersion) {
    throw new ConcurrentConflictError({
      targetType: "break",
      targetId: brk.id,
      expectedVersion: input.expectedVersion,
      actualVersion: brk.version,
    });
  }
  const resolved = resolveLocalInstant(brk.clinicId, input.localCivil, input.fold ?? 0);
  if (!resolved.ok) throw new UnresolvedTimezoneError(resolved.reason, resolved.message);
  const now = new Date().toISOString();
  const next: BreakRecord = {
    ...brk,
    state: "completed",
    version: brk.version + 1,
    endedAt: toAttendanceTimeStamp(resolved.instant),
    updatedAt: now,
  };
  upsertBreak(next);
  const session = getSession(brk.sessionId);
  if (session && session.state === "on_break") {
    upsertSession({ ...session, state: "open", version: session.version + 1, updatedAt: now });
  }
  appendEvent({
    id: newEventId(),
    sessionId: brk.sessionId,
    personId: brk.personId,
    clinicId: brk.clinicId,
    eventType: "break-end",
    state: "recorded",
    time: next.endedAt!,
    clientEventId: input.clientEventId,
    idempotencyKey: input.clientEventId,
    createdAt: now,
  });
  writeAudit({
    actorId: input.actor.userId,
    action: "break.ended",
    targetType: "break",
    targetId: brk.id,
    clinicId: brk.clinicId,
  });
  return next;
}

export function recordMissedBreak(input: {
  sessionId: string;
  personId: string;
  clinicId: string;
  breakReqId: string;
}): BreakRecord {
  const now = new Date().toISOString();
  const existing = listBreaks(input.sessionId).find(
    (b) => b.breakReqId === input.breakReqId && b.state === "missed"
  );
  if (existing) return existing;
  const brk: BreakRecord = {
    id: newBreakId(),
    sessionId: input.sessionId,
    personId: input.personId,
    clinicId: input.clinicId,
    state: "missed",
    version: 1,
    breakReqId: input.breakReqId,
    createdAt: now,
    updatedAt: now,
  };
  upsertBreak(brk);
  const ex = {
    id: newExceptionId(),
    sessionId: input.sessionId,
    personId: input.personId,
    clinicId: input.clinicId,
    state: "open" as const,
    version: 1,
    kind: "missed-break" as const,
    message: `Missed required break ${input.breakReqId}`,
    createdAt: now,
    updatedAt: now,
  };
  upsertException(ex);
  syncExceptionToInbox(ex);
  return brk;
}

export function listBreaksForSession(sessionId: string): BreakRecord[] {
  return listBreaks(sessionId);
}
