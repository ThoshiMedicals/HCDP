import { assertM06ClinicScope, assertM06Permission, type M06Actor } from "../permissions";
import {
  appendEvent,
  getCorrection,
  getEvent,
  getSession,
  listCorrections,
  newApprovalId,
  newCorrectionId,
  newEventId,
  upsertApproval,
  upsertCorrection,
  upsertEvent,
} from "../repository/local-store";
import type { CorrectionRequest, FoldFlag } from "../types";
import { closeCorrectionInbox, syncCorrectionAwaitingApproval } from "../adapters/m06-inbox-sync";
import { markSessionCorrected } from "./session-service";
import { writeAudit } from "./audit-helpers";
import { resolveLocalInstant, toAttendanceTimeStamp } from "./clinic-time-service";
import {
  ConcurrentConflictError,
  InvalidLifecycleTransitionError,
  UnresolvedTimezoneError,
  ValidationError,
} from "./errors";

export function requestCorrection(input: {
  actor: M06Actor;
  sessionId: string;
  reason: string;
  proposedLocalCivil?: string;
  targetEventId?: string;
}): CorrectionRequest {
  assertM06Permission(input.actor, "attendance.correction.request");
  const session = getSession(input.sessionId);
  if (!session) throw new ValidationError("Session not found");
  assertM06ClinicScope(input.actor, [session.clinicId]);
  const pid = input.actor.personId ?? input.actor.userId;
  if (session.personId !== pid && !input.actor.permissions.includes("*")) {
    throw new ValidationError("Can only request corrections on own sessions");
  }
  const now = new Date().toISOString();
  const c: CorrectionRequest = {
    id: newCorrectionId(),
    sessionId: session.id,
    personId: session.personId,
    clinicId: session.clinicId,
    state: "requested",
    version: 1,
    reason: input.reason,
    proposedLocalCivil: input.proposedLocalCivil,
    targetEventId: input.targetEventId,
    createdAt: now,
    updatedAt: now,
  };
  upsertCorrection(c);
  upsertApproval({
    id: newApprovalId(),
    kind: "correction",
    targetId: c.id,
    personId: c.personId,
    clinicId: c.clinicId,
    state: "pending",
    version: 1,
    createdAt: now,
    updatedAt: now,
  });
  syncCorrectionAwaitingApproval(c);
  writeAudit({
    actorId: input.actor.userId,
    action: "correction.requested",
    targetType: "correction",
    targetId: c.id,
    clinicId: c.clinicId,
    detail: input.reason,
  });
  return c;
}

export function withdrawCorrection(input: {
  actor: M06Actor;
  correctionId: string;
  expectedVersion: number;
}): CorrectionRequest {
  assertM06Permission(input.actor, "attendance.correction.request");
  const c = getCorrection(input.correctionId);
  if (!c) throw new ValidationError("Correction not found");
  if (c.state !== "requested") {
    throw new InvalidLifecycleTransitionError({ from: c.state, to: "withdrawn", targetType: "correction" });
  }
  if (c.version !== input.expectedVersion) {
    throw new ConcurrentConflictError({
      targetType: "correction",
      targetId: c.id,
      expectedVersion: input.expectedVersion,
      actualVersion: c.version,
    });
  }
  const next = { ...c, state: "withdrawn" as const, version: c.version + 1, updatedAt: new Date().toISOString() };
  upsertCorrection(next);
  closeCorrectionInbox(next);
  return next;
}

export function approveCorrection(input: {
  actor: M06Actor;
  correctionId: string;
  expectedVersion: number;
}): CorrectionRequest {
  assertM06Permission(input.actor, "attendance.approve");
  const c = getCorrection(input.correctionId);
  if (!c) throw new ValidationError("Correction not found");
  assertM06ClinicScope(input.actor, [c.clinicId]);
  if (c.state !== "requested") {
    throw new InvalidLifecycleTransitionError({ from: c.state, to: "approved", targetType: "correction" });
  }
  if (c.version !== input.expectedVersion) {
    throw new ConcurrentConflictError({
      targetType: "correction",
      targetId: c.id,
      expectedVersion: input.expectedVersion,
      actualVersion: c.version,
    });
  }
  const approved = { ...c, state: "approved" as const, version: c.version + 1, updatedAt: new Date().toISOString() };
  upsertCorrection(approved);
  return applyApprovedCorrection({ actor: input.actor, correction: approved });
}

export function rejectCorrection(input: {
  actor: M06Actor;
  correctionId: string;
  expectedVersion: number;
  reason?: string;
}): CorrectionRequest {
  assertM06Permission(input.actor, "attendance.approve");
  const c = getCorrection(input.correctionId);
  if (!c) throw new ValidationError("Correction not found");
  assertM06ClinicScope(input.actor, [c.clinicId]);
  if (c.state !== "requested") {
    throw new InvalidLifecycleTransitionError({ from: c.state, to: "rejected", targetType: "correction" });
  }
  if (c.version !== input.expectedVersion) {
    throw new ConcurrentConflictError({
      targetType: "correction",
      targetId: c.id,
      expectedVersion: input.expectedVersion,
      actualVersion: c.version,
    });
  }
  const next = {
    ...c,
    state: "rejected" as const,
    version: c.version + 1,
    rejectionReason: input.reason,
    updatedAt: new Date().toISOString(),
  };
  upsertCorrection(next);
  closeCorrectionInbox(next);
  return next;
}

function applyApprovedCorrection(input: {
  actor: M06Actor;
  correction: CorrectionRequest;
}): CorrectionRequest {
  assertM06Permission(input.actor, "attendance.correction.apply");
  const session = getSession(input.correction.sessionId);
  if (!session) throw new ValidationError("Session not found");
  if (input.correction.proposedLocalCivil && input.correction.targetEventId) {
    const prior = getEvent(input.correction.targetEventId);
    if (prior && prior.state === "recorded") {
      const resolved = resolveLocalInstant(session.clinicId, input.correction.proposedLocalCivil);
      if (!resolved.ok) throw new UnresolvedTimezoneError(resolved.reason, resolved.message);
      upsertEvent({ ...prior, state: "corrected" });
      appendEvent({
        id: newEventId(),
        sessionId: session.id,
        personId: session.personId,
        clinicId: session.clinicId,
        eventType: "correction",
        state: "recorded",
        time: toAttendanceTimeStamp(resolved.instant),
        supersedesEventId: prior.id,
        idempotencyKey: `corr-apply::${input.correction.id}`,
        createdAt: new Date().toISOString(),
      });
    }
  }
  markSessionCorrected({
    actor: input.actor,
    sessionId: session.id,
    expectedVersion: session.version,
    reason: input.correction.reason,
  });
  const applied = {
    ...input.correction,
    state: "applied" as const,
    version: input.correction.version + 1,
    updatedAt: new Date().toISOString(),
  };
  upsertCorrection(applied);
  closeCorrectionInbox(applied);
  writeAudit({
    actorId: input.actor.userId,
    action: "correction.applied",
    targetType: "correction",
    targetId: applied.id,
    clinicId: applied.clinicId,
  });
  return applied;
}

export function applyManagerCorrection(input: {
  actor: M06Actor;
  sessionId: string;
  reason: string;
  expectedSessionVersion: number;
  proposedLocalCivil: string;
  fold?: FoldFlag;
  targetEventId?: string;
}): CorrectionRequest {
  assertM06Permission(input.actor, "attendance.correction.apply");
  const session = getSession(input.sessionId);
  if (!session) throw new ValidationError("Session not found");
  assertM06ClinicScope(input.actor, [session.clinicId]);
  if (session.version !== input.expectedSessionVersion) {
    throw new ConcurrentConflictError({
      targetType: "session",
      targetId: session.id,
      expectedVersion: input.expectedSessionVersion,
      actualVersion: session.version,
    });
  }
  const now = new Date().toISOString();
  const c: CorrectionRequest = {
    id: newCorrectionId(),
    sessionId: session.id,
    personId: session.personId,
    clinicId: session.clinicId,
    state: "approved",
    version: 1,
    reason: input.reason,
    proposedLocalCivil: input.proposedLocalCivil,
    targetEventId: input.targetEventId,
    createdAt: now,
    updatedAt: now,
  };
  upsertCorrection(c);
  return applyApprovedCorrection({ actor: input.actor, correction: c });
}

export function listCorrectionsForActor(actor: M06Actor, clinicId?: string): CorrectionRequest[] {
  let rows = clinicId ? listCorrections(clinicId) : listCorrections();
  if (actor.clinicIds) rows = rows.filter((c) => actor.clinicIds!.includes(c.clinicId));
  if (!(actor.permissions.includes("*") || actor.permissions.includes("attendance.view.team"))) {
    const pid = actor.personId ?? actor.userId;
    rows = rows.filter((c) => c.personId === pid);
  }
  return rows;
}
