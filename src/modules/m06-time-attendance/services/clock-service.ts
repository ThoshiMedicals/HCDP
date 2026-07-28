/**
 * Clock in/out service — WF-01…04, 09, 10, 12.
 */

import {
  assertM06ClinicScope,
  assertM06Permission,
  type M06Actor,
} from "../permissions";
import {
  appendEvent,
  findOpenSessionForPerson,
  getPublishedPolicyForClinic,
  getSession,
  listEvents,
  newEventId,
  newExceptionId,
  newEvidenceId,
  newSessionId,
  upsertEvidence,
  upsertException,
  upsertSession,
} from "../repository/local-store";
import type { AttendanceSession, ClockEvent, FoldFlag } from "../types";
import { DEFAULT_POLICY } from "../types/policy";
import { listPublishedAssignmentsForPerson } from "../adapters/m05-shift-read";
import { listApprovedLeaveConflicts } from "../adapters/m04-person-read";
import { syncExceptionToInbox } from "../adapters/m06-inbox-sync";
import { writeAudit } from "./audit-helpers";
import { resolveLocalInstant, toAttendanceTimeStamp } from "./clinic-time-service";
import { publishM06AttendanceEvent } from "./events";
import {
  ConcurrentConflictError,
  InvalidLifecycleTransitionError,
  OverrideReasonRequiredError,
  UnresolvedTimezoneError,
  ValidationError,
} from "./errors";

function policyFor(clinicId: string) {
  return getPublishedPolicyForClinic(clinicId) ?? { ...DEFAULT_POLICY, id: "default", clinicId, createdAt: "", updatedAt: "" };
}

function personIdOf(actor: M06Actor, override?: string): string {
  return override ?? actor.personId ?? actor.userId;
}

export function clockIn(input: {
  actor: M06Actor;
  clinicId: string;
  localCivil: string;
  fold?: FoldFlag;
  clientEventId?: string;
  idempotencyKey?: string;
  shiftId?: string;
  assignmentId?: string;
  unrostered?: boolean;
  overrideReason?: string;
  method?: "web" | "kiosk" | "device" | "offline";
}): { session: AttendanceSession; event: ClockEvent } {
  assertM06Permission(input.actor, "attendance.clock.self");
  assertM06ClinicScope(input.actor, [input.clinicId]);
  const personId = personIdOf(input.actor);

  const existing = findOpenSessionForPerson(personId);
  if (existing) throw new ValidationError("Person already has an open attendance session");

  const resolved = resolveLocalInstant(input.clinicId, input.localCivil, input.fold ?? 0);
  if (!resolved.ok) throw new UnresolvedTimezoneError(resolved.reason, resolved.message);

  const policy = policyFor(input.clinicId);
  const assignments = listPublishedAssignmentsForPerson(personId).filter((a) => a.clinicId === input.clinicId && a.published);
  const matched =
    assignments.find((a) => a.shiftId === input.shiftId || a.assignmentId === input.assignmentId) ??
    assignments[0];

  let rostered = Boolean(matched) && !input.unrostered;
  if (!matched || input.unrostered) {
    if (!policy.allowUnrostered && !input.overrideReason) {
      throw new ValidationError("Unrostered clock-in is not allowed by policy");
    }
    if (!policy.allowUnrostered && input.overrideReason) {
      assertM06Permission(input.actor, "attendance.override");
    }
    rostered = false;
  }

  const leave = listApprovedLeaveConflicts(personId, input.localCivil);
  if (leave.length && !input.overrideReason) {
    throw new ValidationError("Approved leave conflict — clock-in blocked without override");
  }

  const now = new Date().toISOString();
  const session: AttendanceSession = {
    id: newSessionId(),
    personId,
    clinicId: input.clinicId,
    state: "open",
    version: 1,
    rostered,
    shiftId: matched?.shiftId ?? input.shiftId,
    assignmentId: matched?.assignmentId ?? input.assignmentId,
    openedAt: toAttendanceTimeStamp(resolved.instant),
    createdAt: now,
    updatedAt: now,
  };
  upsertSession(session);

  const event: ClockEvent = {
    id: newEventId(),
    sessionId: session.id,
    personId,
    clinicId: input.clinicId,
    eventType: "clock-in",
    state: "recorded",
    time: session.openedAt,
    clientEventId: input.clientEventId,
    idempotencyKey: input.idempotencyKey ?? input.clientEventId,
    createdAt: now,
  };
  appendEvent(event);

  upsertEvidence({
    id: newEvidenceId(),
    sessionId: session.id,
    eventId: event.id,
    clinicId: input.clinicId,
    personId,
    method: input.method ?? "web",
    summary: "Identity-authenticated clock-in context evidence (not proof of work performed)",
    createdAt: now,
  });

  publishM06AttendanceEvent({
    eventType: "attendance.event.recorded",
    sourceRecordId: event.id,
    sourceRecordVersion: 1,
    sourceRecordType: "clock-event",
    sourceRecordTitle: "Clock in",
    clinicId: input.clinicId,
    actor: input.actor.userId,
    idempotencyKey: event.idempotencyKey ?? `clock-in::${event.id}`,
    section: "clock",
    payload: { sessionId: session.id, eventType: "clock-in" },
  });

  writeAudit({
    actorId: input.actor.userId,
    action: "session.opened",
    targetType: "session",
    targetId: session.id,
    clinicId: input.clinicId,
  });

  // Early / late / unrostered exceptions
  if (!rostered) {
    const ex = {
      id: newExceptionId(),
      sessionId: session.id,
      personId,
      clinicId: input.clinicId,
      state: "open" as const,
      version: 1,
      kind: "unrostered" as const,
      message: "Unrostered clock-in",
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
      actor: input.actor.userId,
      idempotencyKey: `ex::${ex.id}`,
      section: "exceptions",
    });
    syncExceptionToInbox(ex);
  } else if (matched?.localStart) {
    const startMs = Date.parse(matched.localStart.includes("T") && matched.localStart.endsWith("Z")
      ? matched.localStart
      : resolved.instant.occurredAtUtc);
    // Compare using resolved instant vs assignment wall if ISO; otherwise advisory only
    void startMs;
    const opened = new Date(resolved.instant.occurredAtUtc).getTime();
    if (matched.localStart.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
      const shiftStart = resolveLocalInstant(input.clinicId, matched.localStart);
      if (shiftStart.ok) {
        const deltaMin = Math.round((opened - new Date(shiftStart.instant.occurredAtUtc).getTime()) / 60000);
        if (deltaMin < -policy.earlyInMinutes) {
          const ex = {
            id: newExceptionId(),
            sessionId: session.id,
            personId,
            clinicId: input.clinicId,
            state: "open" as const,
            version: 1,
            kind: "early-in" as const,
            message: `Early clock-in by ${Math.abs(deltaMin)} minutes`,
            createdAt: now,
            updatedAt: now,
          };
          upsertException(ex);
          syncExceptionToInbox(ex);
        } else if (deltaMin > policy.lateInGraceMinutes) {
          const ex = {
            id: newExceptionId(),
            sessionId: session.id,
            personId,
            clinicId: input.clinicId,
            state: "open" as const,
            version: 1,
            kind: "late-in" as const,
            message: `Late arrival by ${deltaMin} minutes`,
            createdAt: now,
            updatedAt: now,
          };
          upsertException(ex);
          syncExceptionToInbox(ex);
        }
      }
    }
  }

  return { session, event };
}

export function clockOut(input: {
  actor: M06Actor;
  sessionId: string;
  localCivil: string;
  fold?: FoldFlag;
  clientEventId?: string;
  idempotencyKey?: string;
  expectedVersion: number;
  overrideReason?: string;
}): { session: AttendanceSession; event: ClockEvent } {
  assertM06Permission(input.actor, "attendance.clock.self");
  const session = getSession(input.sessionId);
  if (!session) throw new ValidationError("Session not found");
  assertM06ClinicScope(input.actor, [session.clinicId]);
  if (session.state !== "open") {
    throw new InvalidLifecycleTransitionError({ from: session.state, to: "closed", targetType: "session" });
  }
  if (session.version !== input.expectedVersion) {
    throw new ConcurrentConflictError({
      targetType: "session",
      targetId: session.id,
      expectedVersion: input.expectedVersion,
      actualVersion: session.version,
    });
  }

  const resolved = resolveLocalInstant(session.clinicId, input.localCivil, input.fold ?? 0);
  if (!resolved.ok) throw new UnresolvedTimezoneError(resolved.reason, resolved.message);

  const outMs = new Date(resolved.instant.occurredAtUtc).getTime();
  const inMs = new Date(session.openedAt.occurredAtUtc).getTime();
  if (outMs <= inMs) throw new ValidationError("Clock-out must be after clock-in");

  const now = new Date().toISOString();
  const closed: AttendanceSession = {
    ...session,
    state: "closed",
    version: session.version + 1,
    closedAt: toAttendanceTimeStamp(resolved.instant),
    updatedAt: now,
  };
  upsertSession(closed);

  const event: ClockEvent = {
    id: newEventId(),
    sessionId: session.id,
    personId: session.personId,
    clinicId: session.clinicId,
    eventType: "clock-out",
    state: "recorded",
    time: closed.closedAt!,
    clientEventId: input.clientEventId,
    idempotencyKey: input.idempotencyKey ?? input.clientEventId,
    createdAt: now,
  };
  appendEvent(event);

  publishM06AttendanceEvent({
    eventType: "attendance.event.recorded",
    sourceRecordId: event.id,
    sourceRecordVersion: 1,
    sourceRecordType: "clock-event",
    sourceRecordTitle: "Clock out",
    clinicId: session.clinicId,
    actor: input.actor.userId,
    idempotencyKey: event.idempotencyKey ?? `clock-out::${event.id}`,
    section: "clock",
  });
  writeAudit({
    actorId: input.actor.userId,
    action: "session.closed",
    targetType: "session",
    targetId: session.id,
    clinicId: session.clinicId,
  });

  const policy = policyFor(session.clinicId);
  if (session.shiftId) {
    const assignments = listPublishedAssignmentsForPerson(session.personId);
    const matched = assignments.find((a) => a.shiftId === session.shiftId);
    if (matched?.localEnd?.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
      const end = resolveLocalInstant(session.clinicId, matched.localEnd);
      if (end.ok) {
        const deltaMin = Math.round((outMs - new Date(end.instant.occurredAtUtc).getTime()) / 60000);
        if (deltaMin < -policy.earlyOutMinutes) {
          const ex = {
            id: newExceptionId(),
            sessionId: session.id,
            personId: session.personId,
            clinicId: session.clinicId,
            state: "open" as const,
            version: 1,
            kind: "early-out" as const,
            message: `Early departure by ${Math.abs(deltaMin)} minutes`,
            createdAt: now,
            updatedAt: now,
          };
          upsertException(ex);
          syncExceptionToInbox(ex);
        }
      }
    }
  }

  return { session: closed, event };
}

export function requireOverrideReason(reason?: string): void {
  if (!reason?.trim()) throw new OverrideReasonRequiredError();
}

export function listClockEventsForSession(sessionId: string): ClockEvent[] {
  return listEvents(sessionId);
}
