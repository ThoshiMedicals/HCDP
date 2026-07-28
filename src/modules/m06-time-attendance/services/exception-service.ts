import { assertM06ClinicScope, assertM06Permission, type M06Actor } from "../permissions";
import {
  getException,
  listExceptions,
  newDeclarationId,
  newExceptionId,
  upsertDeclaration,
  upsertException,
} from "../repository/local-store";
import type { AttendanceException } from "../types";
import { closeExceptionInbox, syncExceptionToInbox } from "../adapters/m06-inbox-sync";
import { writeAudit } from "./audit-helpers";
import { publishM06AttendanceEvent } from "./events";
import {
  ConcurrentConflictError,
  InvalidLifecycleTransitionError,
  OverrideReasonRequiredError,
  ValidationError,
} from "./errors";

export function raiseException(input: {
  actor?: M06Actor;
  personId: string;
  clinicId: string;
  kind: AttendanceException["kind"];
  message: string;
  sessionId?: string;
  system?: boolean;
}): AttendanceException {
  if (!input.system) {
    if (!input.actor) throw new ValidationError("Actor required");
    assertM06Permission(input.actor, "attendance.exception.raise");
    assertM06ClinicScope(input.actor, [input.clinicId]);
  }
  const now = new Date().toISOString();
  const ex: AttendanceException = {
    id: newExceptionId(),
    sessionId: input.sessionId,
    personId: input.personId,
    clinicId: input.clinicId,
    state: "open",
    version: 1,
    kind: input.kind,
    message: input.message,
    createdAt: now,
    updatedAt: now,
  };
  upsertException(ex);
  publishM06AttendanceEvent({
    eventType: "attendance.exception.created",
    sourceRecordId: ex.id,
    sourceRecordVersion: 1,
    sourceRecordType: "attendance-exception",
    sourceRecordTitle: ex.message,
    clinicId: input.clinicId,
    actor: input.actor?.userId ?? "system",
    idempotencyKey: `ex::${ex.kind}::${ex.sessionId ?? ex.personId}::${ex.id}`,
    section: "exceptions",
  });
  syncExceptionToInbox(ex);
  return ex;
}

export function raiseMissedClockIn(input: {
  personId: string;
  clinicId: string;
  shiftId: string;
}): AttendanceException {
  const key = `m06::missed-in::${input.shiftId}::${input.personId}`;
  const existing = listExceptions(input.clinicId).find(
    (e) => e.kind === "missed-in" && e.message.includes(input.shiftId) && e.personId === input.personId
  );
  if (existing) return existing;
  return raiseException({
    system: true,
    personId: input.personId,
    clinicId: input.clinicId,
    kind: "missed-in",
    message: `Missed clock-in for shift ${input.shiftId} (${key})`,
  });
}

export function raiseMissedClockOut(input: {
  sessionId: string;
  personId: string;
  clinicId: string;
}): AttendanceException {
  const existing = listExceptions(input.clinicId).find(
    (e) => e.kind === "missed-out" && e.sessionId === input.sessionId
  );
  if (existing) return existing;
  return raiseException({
    system: true,
    personId: input.personId,
    clinicId: input.clinicId,
    sessionId: input.sessionId,
    kind: "missed-out",
    message: `Missed clock-out for session ${input.sessionId}`,
  });
}

export function declareException(input: {
  actor: M06Actor;
  exceptionId: string;
  text: string;
  expectedVersion: number;
}): AttendanceException {
  assertM06Permission(input.actor, "attendance.declare");
  const ex = getException(input.exceptionId);
  if (!ex) throw new ValidationError("Exception not found");
  assertM06ClinicScope(input.actor, [ex.clinicId]);
  const pid = input.actor.personId ?? input.actor.userId;
  if (ex.personId !== pid && !input.actor.permissions.includes("*")) {
    throw new ValidationError("Can only declare on own exceptions");
  }
  if (ex.state !== "open") {
    throw new InvalidLifecycleTransitionError({ from: ex.state, to: "explained", targetType: "exception" });
  }
  if (ex.version !== input.expectedVersion) {
    throw new ConcurrentConflictError({
      targetType: "exception",
      targetId: ex.id,
      expectedVersion: input.expectedVersion,
      actualVersion: ex.version,
    });
  }
  upsertDeclaration({
    id: newDeclarationId(),
    exceptionId: ex.id,
    personId: pid,
    clinicId: ex.clinicId,
    text: input.text,
    createdAt: new Date().toISOString(),
  });
  const next = {
    ...ex,
    state: "explained" as const,
    version: ex.version + 1,
    explanation: input.text,
    updatedAt: new Date().toISOString(),
  };
  upsertException(next);
  syncExceptionToInbox(next);
  return next;
}

export function resolveException(input: {
  actor: M06Actor;
  exceptionId: string;
  note: string;
  expectedVersion: number;
}): AttendanceException {
  assertM06Permission(input.actor, "attendance.exception.resolve");
  const ex = getException(input.exceptionId);
  if (!ex) throw new ValidationError("Exception not found");
  assertM06ClinicScope(input.actor, [ex.clinicId]);
  if (!["open", "explained", "escalated"].includes(ex.state)) {
    throw new InvalidLifecycleTransitionError({ from: ex.state, to: "resolved", targetType: "exception" });
  }
  if (ex.version !== input.expectedVersion) {
    throw new ConcurrentConflictError({
      targetType: "exception",
      targetId: ex.id,
      expectedVersion: input.expectedVersion,
      actualVersion: ex.version,
    });
  }
  const next = {
    ...ex,
    state: "resolved" as const,
    version: ex.version + 1,
    resolutionNote: input.note,
    updatedAt: new Date().toISOString(),
  };
  upsertException(next);
  publishM06AttendanceEvent({
    eventType: "attendance.exception.resolved",
    sourceRecordId: ex.id,
    sourceRecordVersion: next.version,
    sourceRecordType: "attendance-exception",
    sourceRecordTitle: "Exception resolved",
    clinicId: ex.clinicId,
    actor: input.actor.userId,
    idempotencyKey: `ex-resolved::${ex.id}::${next.version}`,
    section: "exceptions",
  });
  closeExceptionInbox(next);
  writeAudit({
    actorId: input.actor.userId,
    action: "exception.resolved",
    targetType: "exception",
    targetId: ex.id,
    clinicId: ex.clinicId,
    detail: input.note,
  });
  return next;
}

export function escalateException(input: {
  actor: M06Actor;
  exceptionId: string;
  expectedVersion: number;
}): AttendanceException {
  assertM06Permission(input.actor, "attendance.exception.resolve");
  const ex = getException(input.exceptionId);
  if (!ex) throw new ValidationError("Exception not found");
  assertM06ClinicScope(input.actor, [ex.clinicId]);
  if (!["open", "explained"].includes(ex.state)) {
    throw new InvalidLifecycleTransitionError({ from: ex.state, to: "escalated", targetType: "exception" });
  }
  if (ex.version !== input.expectedVersion) {
    throw new ConcurrentConflictError({
      targetType: "exception",
      targetId: ex.id,
      expectedVersion: input.expectedVersion,
      actualVersion: ex.version,
    });
  }
  const next = { ...ex, state: "escalated" as const, version: ex.version + 1, updatedAt: new Date().toISOString() };
  upsertException(next);
  syncExceptionToInbox(next);
  return next;
}

export function overrideException(input: {
  actor: M06Actor;
  exceptionId: string;
  reason: string;
  expectedVersion: number;
}): AttendanceException {
  assertM06Permission(input.actor, "attendance.override");
  if (!input.reason.trim()) throw new OverrideReasonRequiredError();
  const ex = getException(input.exceptionId);
  if (!ex) throw new ValidationError("Exception not found");
  assertM06ClinicScope(input.actor, [ex.clinicId]);
  if (!["open", "explained", "escalated"].includes(ex.state)) {
    throw new InvalidLifecycleTransitionError({ from: ex.state, to: "overridden", targetType: "exception" });
  }
  if (ex.version !== input.expectedVersion) {
    throw new ConcurrentConflictError({
      targetType: "exception",
      targetId: ex.id,
      expectedVersion: input.expectedVersion,
      actualVersion: ex.version,
    });
  }
  const next = {
    ...ex,
    state: "overridden" as const,
    version: ex.version + 1,
    overrideReason: input.reason,
    updatedAt: new Date().toISOString(),
  };
  upsertException(next);
  closeExceptionInbox(next);
  writeAudit({
    actorId: input.actor.userId,
    action: "exception.overridden",
    targetType: "exception",
    targetId: ex.id,
    clinicId: ex.clinicId,
    detail: input.reason,
  });
  return next;
}

export function listExceptionsForActor(actor: M06Actor, clinicId?: string): AttendanceException[] {
  const canTeam =
    actor.permissions.includes("*") ||
    actor.permissions.includes("attendance.view.team") ||
    actor.permissions.includes("attendance.exception.view");
  if (!canTeam) assertM06Permission(actor, "attendance.view.self");
  let rows = clinicId ? listExceptions(clinicId) : listExceptions();
  if (!canTeam) {
    const pid = actor.personId ?? actor.userId;
    rows = rows.filter((e) => e.personId === pid);
  }
  if (actor.clinicIds) rows = rows.filter((e) => actor.clinicIds!.includes(e.clinicId));
  return rows;
}
