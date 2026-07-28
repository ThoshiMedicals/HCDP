import { assertM06ClinicScope, assertM06Permission, type M06Actor } from "../permissions";
import {
  getSession,
  listSessions,
  upsertSession,
} from "../repository/local-store";
import type { AttendanceSession } from "../types";
import { writeAudit } from "./audit-helpers";
import {
  ConcurrentConflictError,
  InvalidLifecycleTransitionError,
  OverrideReasonRequiredError,
  ValidationError,
} from "./errors";

export function listSessionsForActor(actor: M06Actor, clinicId?: string): AttendanceSession[] {
  const canTeam = actor.permissions.includes("*") || actor.permissions.includes("attendance.view.team");
  const canSelf = actor.permissions.includes("*") || actor.permissions.includes("attendance.view.self");
  if (!canTeam && !canSelf) assertM06Permission(actor, "attendance.view.self");

  let rows = clinicId ? listSessions(clinicId) : listSessions();
  if (actor.clinicIds) rows = rows.filter((s) => actor.clinicIds!.includes(s.clinicId));
  if (!canTeam) {
    const pid = actor.personId ?? actor.userId;
    rows = rows.filter((s) => s.personId === pid);
  }
  return rows;
}

export function cancelSession(input: {
  actor: M06Actor;
  sessionId: string;
  expectedVersion: number;
  reason: string;
}): AttendanceSession {
  assertM06Permission(input.actor, "attendance.override");
  if (!input.reason.trim()) throw new OverrideReasonRequiredError();
  const session = getSession(input.sessionId);
  if (!session) throw new ValidationError("Session not found");
  assertM06ClinicScope(input.actor, [session.clinicId]);
  if (session.state === "cancelled") {
    throw new InvalidLifecycleTransitionError({ from: "cancelled", to: "cancelled", targetType: "session" });
  }
  if (session.version !== input.expectedVersion) {
    throw new ConcurrentConflictError({
      targetType: "session",
      targetId: session.id,
      expectedVersion: input.expectedVersion,
      actualVersion: session.version,
    });
  }
  const next: AttendanceSession = {
    ...session,
    state: "cancelled",
    version: session.version + 1,
    cancelReason: input.reason,
    updatedAt: new Date().toISOString(),
  };
  upsertSession(next);
  writeAudit({
    actorId: input.actor.userId,
    action: "session.cancelled",
    targetType: "session",
    targetId: session.id,
    detail: input.reason,
    clinicId: session.clinicId,
  });
  return next;
}

export function markSessionCorrected(input: {
  actor: M06Actor;
  sessionId: string;
  expectedVersion: number;
  reason: string;
}): AttendanceSession {
  assertM06Permission(input.actor, "attendance.correction.apply");
  const session = getSession(input.sessionId);
  if (!session) throw new ValidationError("Session not found");
  assertM06ClinicScope(input.actor, [session.clinicId]);
  if (session.state !== "closed" && session.state !== "corrected") {
    throw new InvalidLifecycleTransitionError({ from: session.state, to: "corrected", targetType: "session" });
  }
  if (session.version !== input.expectedVersion) {
    throw new ConcurrentConflictError({
      targetType: "session",
      targetId: session.id,
      expectedVersion: input.expectedVersion,
      actualVersion: session.version,
    });
  }
  const next: AttendanceSession = {
    ...session,
    state: "corrected",
    version: session.version + 1,
    updatedAt: new Date().toISOString(),
  };
  upsertSession(next);
  writeAudit({
    actorId: input.actor.userId,
    action: "session.corrected",
    targetType: "session",
    targetId: session.id,
    detail: input.reason,
    clinicId: session.clinicId,
  });
  return next;
}
