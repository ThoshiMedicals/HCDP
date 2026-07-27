/**
 * M05 assignment service.
 *
 * Rules:
 * - Assignment history is append-only (§6). Corrections create new rows via
 *   `replacesId` and mark the prior row's state.
 * - Every assign / replace call runs authoritative M04/platform eligibility
 *   through `evaluateEligibility`. Overrides require permission + reason + audit.
 * - Optimistic version protection on the shift version.
 */

import { assertM05ClinicScope, assertM05Permission, type M05Actor } from "../permissions";
import type { Assignment, Shift } from "../types/domain";
import type { ResolvedShiftWindow } from "../types/timezone";
import * as store from "../repository/local-store";
import { appendRosterAudit } from "./audit-helpers";
import {
  ConcurrentConflictError,
  OverrideReasonRequiredError,
} from "./errors";
import { evaluateEligibility, isEligibilityAllowedWithOverride } from "./eligibility-service";

export interface AssignInput {
  shiftId: string;
  personId: string;
  expectedShiftVersion: number;
  overrideReason?: string;
  asOf?: string;
}

function windowFromShift(shift: Shift): ResolvedShiftWindow {
  return {
    clinicId: shift.clinicId,
    timeZoneId: shift.timeZoneId,
    localStart: shift.localStart,
    localEnd: shift.localEnd,
    utcStart: shift.utcStart,
    utcEnd: shift.utcEnd,
    startOffsetMinutes: shift.startOffsetMinutes,
    endOffsetMinutes: shift.endOffsetMinutes,
    startFold: shift.startFold,
    endFold: shift.endFold,
    crossesLocalMidnight: shift.crossesLocalMidnight,
  };
}

export function assignPerson(actor: M05Actor, input: AssignInput): Assignment {
  assertM05Permission(actor, "roster.assign");
  const shift = store.getShift(input.shiftId);
  if (!shift) throw new Error(`Shift not found: ${input.shiftId}`);
  assertM05ClinicScope(actor, [shift.clinicId]);

  if (shift.version !== input.expectedShiftVersion) {
    throw new ConcurrentConflictError({
      targetType: "shift",
      targetId: shift.id,
      expectedVersion: input.expectedShiftVersion,
      actualVersion: shift.version,
    });
  }
  if (["cancelled", "superseded", "completed-reference"].includes(shift.status)) {
    throw new Error(`Cannot assign to shift in status ${shift.status}`);
  }

  const decision = evaluateEligibility({
    personId: input.personId,
    clinicId: shift.clinicId,
    asOf: input.asOf ?? new Date().toISOString(),
    shiftWindow: windowFromShift(shift),
  });

  const gate = isEligibilityAllowedWithOverride(decision, input.overrideReason);
  if (!gate.allowed) {
    if (gate.reason === "Override reason required") throw new OverrideReasonRequiredError();
    throw new Error(`Assignment denied — ${gate.reason ?? "eligibility failed"}`);
  }

  if (decision.blockers.length && input.overrideReason) {
    assertM05Permission(actor, "roster.override");
  }

  const now = new Date().toISOString();
  const prior = shift.currentAssignmentId ? store.getAssignment(shift.currentAssignmentId) : null;

  const assignment: Assignment = {
    id: store.newAssignmentId(),
    shiftId: shift.id,
    rosterPeriodId: shift.rosterPeriodId,
    clinicId: shift.clinicId,
    organisationId: shift.organisationId,
    personId: input.personId,
    state: "assigned",
    assignedAt: now,
    assignedBy: actor.userId,
    replacesId: prior?.id ?? null,
    replacedById: null,
    overrideReason: input.overrideReason ?? null,
    overrideBy: input.overrideReason ? actor.userId : null,
    invalidationReason: null,
    publicationId: null,
    seedBatchId: null,
    createdAt: now,
    updatedAt: now,
    version: 1,
  };
  store.appendAssignment(assignment);

  if (prior && prior.state === "assigned") {
    store.markAssignmentState(prior.id, "replaced", {
      replacedById: assignment.id,
      updatedAt: now,
    });
  }

  const nextShift: Shift = {
    ...shift,
    status: "assigned",
    currentAssignmentId: assignment.id,
    updatedAt: now,
    version: shift.version + 1,
  };
  store.upsertShift(nextShift);

  appendRosterAudit({
    actorId: actor.userId,
    organisationId: shift.organisationId,
    clinicId: shift.clinicId,
    action: "assignment.created",
    targetType: "assignment",
    targetId: assignment.id,
    detail: {
      shiftId: shift.id,
      personId: input.personId,
      eligibility: decision.decision,
      overrideReason: input.overrideReason ?? null,
      blockerCount: decision.blockers.length,
      warningCount: decision.warnings.length,
    },
  });

  return assignment;
}

export function cancelAssignment(
  actor: M05Actor,
  input: { assignmentId: string; expectedShiftVersion: number; reason: string }
): Assignment {
  assertM05Permission(actor, "roster.assign");
  if (!input.reason?.trim()) throw new OverrideReasonRequiredError("Cancel assignment reason required");

  const assignment = store.getAssignment(input.assignmentId);
  if (!assignment) throw new Error(`Assignment not found: ${input.assignmentId}`);
  const shift = store.getShift(assignment.shiftId);
  if (!shift) throw new Error(`Shift missing for assignment ${input.assignmentId}`);
  assertM05ClinicScope(actor, [shift.clinicId]);

  if (shift.version !== input.expectedShiftVersion) {
    throw new ConcurrentConflictError({
      targetType: "shift",
      targetId: shift.id,
      expectedVersion: input.expectedShiftVersion,
      actualVersion: shift.version,
    });
  }

  const now = new Date().toISOString();
  store.markAssignmentState(assignment.id, "cancelled", {
    invalidationReason: input.reason,
    updatedAt: now,
  });

  const nextShift: Shift = {
    ...shift,
    status: "unassigned",
    currentAssignmentId: null,
    updatedAt: now,
    version: shift.version + 1,
  };
  store.upsertShift(nextShift);

  appendRosterAudit({
    actorId: actor.userId,
    organisationId: shift.organisationId,
    clinicId: shift.clinicId,
    action: "assignment.cancelled",
    targetType: "assignment",
    targetId: assignment.id,
    detail: { reason: input.reason },
  });

  return { ...assignment, state: "cancelled", invalidationReason: input.reason, updatedAt: now };
}

/**
 * Mark an assignment as invalidated by post-publication leave / readiness
 * changes. Does NOT rewrite the immutable publication body — callers must
 * handle M02 lifecycle and reassignment or superseding publication.
 */
export function invalidateAssignment(
  actor: M05Actor,
  input: { assignmentId: string; reason: string }
): Assignment {
  assertM05Permission(actor, "roster.assign");
  const assignment = store.getAssignment(input.assignmentId);
  if (!assignment) throw new Error(`Assignment not found: ${input.assignmentId}`);
  assertM05ClinicScope(actor, [assignment.clinicId]);

  const now = new Date().toISOString();
  store.markAssignmentState(assignment.id, "invalidated", {
    invalidationReason: input.reason,
    updatedAt: now,
  });

  appendRosterAudit({
    actorId: actor.userId,
    organisationId: assignment.organisationId,
    clinicId: assignment.clinicId,
    action: "assignment.invalidated",
    targetType: "assignment",
    targetId: assignment.id,
    detail: { reason: input.reason },
  });

  return { ...assignment, state: "invalidated", invalidationReason: input.reason, updatedAt: now };
}

export function listAssignmentHistoryForShift(shiftId: string): Assignment[] {
  return store.listAssignments(shiftId).sort((a, b) => a.assignedAt.localeCompare(b.assignedAt));
}
