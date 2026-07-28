import { assertM06ClinicScope, assertM06Permission, type M06Actor } from "../permissions";
import {
  appendEvent,
  findOpenSessionForPerson,
  newEventId,
  newEvidenceId,
  newSessionId,
  upsertEvidence,
  upsertSession,
} from "../repository/local-store";
import type { AttendanceSession, FoldFlag } from "../types";
import { writeAudit } from "./audit-helpers";
import { resolveLocalInstant, toAttendanceTimeStamp } from "./clinic-time-service";
import { publishM06AttendanceEvent } from "./events";
import { UnresolvedTimezoneError, ValidationError } from "./errors";

export function managerEnterAttendance(input: {
  actor: M06Actor;
  personId: string;
  clinicId: string;
  localCivilIn: string;
  localCivilOut?: string;
  reason: string;
  fold?: FoldFlag;
  idempotencyKey?: string;
}): AttendanceSession {
  assertM06Permission(input.actor, "attendance.manager.enter");
  assertM06ClinicScope(input.actor, [input.clinicId]);
  if (!input.reason.trim()) throw new ValidationError("Manager-entered attendance requires a reason");
  if (findOpenSessionForPerson(input.personId)) {
    throw new ValidationError("Person already has an open session");
  }
  const resolvedIn = resolveLocalInstant(input.clinicId, input.localCivilIn, input.fold ?? 0);
  if (!resolvedIn.ok) throw new UnresolvedTimezoneError(resolvedIn.reason, resolvedIn.message);

  const now = new Date().toISOString();
  const session: AttendanceSession = {
    id: newSessionId(),
    personId: input.personId,
    clinicId: input.clinicId,
    state: input.localCivilOut ? "closed" : "open",
    version: 1,
    rostered: false,
    openedAt: toAttendanceTimeStamp(resolvedIn.instant),
    createdAt: now,
    updatedAt: now,
  };
  if (input.localCivilOut) {
    const resolvedOut = resolveLocalInstant(input.clinicId, input.localCivilOut, input.fold ?? 0);
    if (!resolvedOut.ok) throw new UnresolvedTimezoneError(resolvedOut.reason, resolvedOut.message);
    session.closedAt = toAttendanceTimeStamp(resolvedOut.instant);
  }
  upsertSession(session);
  appendEvent({
    id: newEventId(),
    sessionId: session.id,
    personId: input.personId,
    clinicId: input.clinicId,
    eventType: "clock-in",
    state: "recorded",
    time: session.openedAt,
    managerEntered: true,
    idempotencyKey: input.idempotencyKey ?? `mgr-enter::${session.id}`,
    createdAt: now,
  });
  upsertEvidence({
    id: newEvidenceId(),
    sessionId: session.id,
    clinicId: input.clinicId,
    personId: input.personId,
    method: "manager",
    summary: `Manager-entered attendance — reason: ${input.reason} (not biometric proof of work)`,
    createdAt: now,
  });
  publishM06AttendanceEvent({
    eventType: "attendance.event.recorded",
    sourceRecordId: session.id,
    sourceRecordVersion: 1,
    sourceRecordType: "session",
    sourceRecordTitle: "Manager-entered attendance",
    clinicId: input.clinicId,
    actor: input.actor.userId,
    idempotencyKey: input.idempotencyKey ?? `mgr-enter::${session.id}`,
    section: "clock",
    payload: { reason: input.reason },
  });
  writeAudit({
    actorId: input.actor.userId,
    action: "session.opened.manager",
    targetType: "session",
    targetId: session.id,
    clinicId: input.clinicId,
    detail: input.reason,
  });
  return session;
}
