/**
 * M05 swap workflow service (§12 of the plan).
 *
 * States (see `SwapLifecycleStatus`): requested → proposed → recipient_accepted
 * → approved / rejected / withdrawn / expired.
 *
 * Eligibility for BOTH parties is revalidated at approval time via
 * `evaluateEligibility` (authority m04-platform).
 */

import { assertM05ClinicScope, assertM05Permission, type M05Actor } from "../permissions";
import type { SwapLifecycleStatus, SwapRequest } from "../types/domain";
import * as store from "../repository/local-store";
import { appendRosterAudit } from "./audit-helpers";
import {
  ConcurrentConflictError,
  InvalidLifecycleTransitionError,
} from "./errors";
import { evaluateEligibility, isEligibilityAllowedWithOverride } from "./eligibility-service";
import { assignPerson } from "./assignment-service";

const ALLOWED: Record<SwapLifecycleStatus, SwapLifecycleStatus[]> = {
  requested: ["proposed", "rejected", "withdrawn", "expired"],
  proposed: ["recipient_accepted", "rejected", "withdrawn", "expired"],
  recipient_accepted: ["approved", "rejected", "withdrawn", "expired"],
  approved: [],
  rejected: [],
  withdrawn: [],
  expired: [],
};

function assertTransition(from: SwapLifecycleStatus, to: SwapLifecycleStatus): void {
  if (!ALLOWED[from]?.includes(to)) {
    throw new InvalidLifecycleTransitionError({ from, to, targetType: "swap" });
  }
}

export function requestSwap(
  actor: M05Actor,
  input: {
    shiftId: string;
    requesterPersonId: string;
    recipientPersonId?: string | null;
  }
): SwapRequest {
  assertM05Permission(actor, "roster.swap.request");
  const shift = store.getShift(input.shiftId);
  if (!shift) throw new Error(`Shift not found: ${input.shiftId}`);
  assertM05ClinicScope(actor, [shift.clinicId]);

  if (!shift.currentAssignmentId) throw new Error("Cannot swap an unassigned shift");
  const currentAssignment = store.getAssignment(shift.currentAssignmentId);
  if (currentAssignment?.personId !== input.requesterPersonId) {
    throw new Error("Requester is not currently assigned to this shift");
  }

  const now = new Date().toISOString();
  const swap: SwapRequest = {
    id: store.newSwapRequestId(),
    shiftId: shift.id,
    rosterPeriodId: shift.rosterPeriodId,
    clinicId: shift.clinicId,
    organisationId: shift.organisationId,
    requesterPersonId: input.requesterPersonId,
    recipientPersonId: input.recipientPersonId ?? null,
    status: input.recipientPersonId ? "proposed" : "requested",
    requestedAt: now,
    respondedAt: null,
    approvedAt: null,
    approvedBy: null,
    rejectedReason: null,
    resultingAssignmentId: null,
    createdAt: now,
    updatedAt: now,
    version: 1,
  };
  store.upsertSwap(swap);
  appendRosterAudit({
    actorId: actor.userId,
    organisationId: swap.organisationId,
    clinicId: swap.clinicId,
    action: "swap.requested",
    targetType: "swap",
    targetId: swap.id,
    detail: { shiftId: swap.shiftId, recipient: swap.recipientPersonId ?? null },
  });
  return swap;
}

export function proposeReplacement(
  actor: M05Actor,
  input: { swapId: string; recipientPersonId: string; expectedVersion: number }
): SwapRequest {
  assertM05Permission(actor, "roster.swap.request");
  const swap = store.getSwap(input.swapId);
  if (!swap) throw new Error(`Swap not found: ${input.swapId}`);
  assertM05ClinicScope(actor, [swap.clinicId]);
  if (swap.version !== input.expectedVersion) {
    throw new ConcurrentConflictError({
      targetType: "swap",
      targetId: swap.id,
      expectedVersion: input.expectedVersion,
      actualVersion: swap.version,
    });
  }
  assertTransition(swap.status, "proposed");
  const now = new Date().toISOString();
  const next: SwapRequest = {
    ...swap,
    recipientPersonId: input.recipientPersonId,
    status: "proposed",
    updatedAt: now,
    version: swap.version + 1,
  };
  store.upsertSwap(next);
  appendRosterAudit({
    actorId: actor.userId,
    organisationId: swap.organisationId,
    clinicId: swap.clinicId,
    action: "swap.proposed",
    targetType: "swap",
    targetId: swap.id,
    detail: { recipientPersonId: input.recipientPersonId },
  });
  return next;
}

export function recipientAcceptSwap(
  actor: M05Actor,
  input: { swapId: string; expectedVersion: number; actAsPersonId: string }
): SwapRequest {
  assertM05Permission(actor, "roster.swap.request");
  const swap = store.getSwap(input.swapId);
  if (!swap) throw new Error(`Swap not found: ${input.swapId}`);
  assertM05ClinicScope(actor, [swap.clinicId]);
  if (swap.version !== input.expectedVersion) {
    throw new ConcurrentConflictError({
      targetType: "swap",
      targetId: swap.id,
      expectedVersion: input.expectedVersion,
      actualVersion: swap.version,
    });
  }
  if (!swap.recipientPersonId) throw new Error("Swap has no recipient — propose replacement first");
  if (swap.recipientPersonId !== input.actAsPersonId) {
    throw new Error("Only the proposed recipient may accept this swap");
  }
  assertTransition(swap.status, "recipient_accepted");
  const now = new Date().toISOString();
  const next: SwapRequest = {
    ...swap,
    status: "recipient_accepted",
    respondedAt: now,
    updatedAt: now,
    version: swap.version + 1,
  };
  store.upsertSwap(next);
  appendRosterAudit({
    actorId: actor.userId,
    organisationId: swap.organisationId,
    clinicId: swap.clinicId,
    action: "swap.recipient_accepted",
    targetType: "swap",
    targetId: swap.id,
  });
  return next;
}

export function approveSwap(
  actor: M05Actor,
  input: {
    swapId: string;
    expectedVersion: number;
    expectedShiftVersion: number;
    asOf?: string;
    overrideReason?: string;
  }
): { swap: SwapRequest; assignmentId: string } {
  assertM05Permission(actor, "roster.swap.approve");
  const swap = store.getSwap(input.swapId);
  if (!swap) throw new Error(`Swap not found: ${input.swapId}`);
  assertM05ClinicScope(actor, [swap.clinicId]);
  if (swap.version !== input.expectedVersion) {
    throw new ConcurrentConflictError({
      targetType: "swap",
      targetId: swap.id,
      expectedVersion: input.expectedVersion,
      actualVersion: swap.version,
    });
  }
  if (!swap.recipientPersonId) throw new Error("Swap has no recipient — cannot approve");
  assertTransition(swap.status, "approved");

  if (actor.userId === swap.requesterPersonId || actor.userId === swap.recipientPersonId) {
    throw new Error("Self-approval is not permitted for a swap involving the actor");
  }

  const shift = store.getShift(swap.shiftId);
  if (!shift) throw new Error(`Shift missing for swap ${swap.id}`);

  const decision = evaluateEligibility({
    personId: swap.recipientPersonId,
    clinicId: shift.clinicId,
    asOf: input.asOf ?? new Date().toISOString(),
    shiftWindow: {
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
    },
  });
  const gate = isEligibilityAllowedWithOverride(decision, input.overrideReason);
  if (!gate.allowed) throw new Error(`Swap approval denied — ${gate.reason ?? "eligibility"}`);
  if (decision.blockers.length && input.overrideReason) assertM05Permission(actor, "roster.override");

  const assignment = assignPerson(actor, {
    shiftId: shift.id,
    personId: swap.recipientPersonId,
    expectedShiftVersion: input.expectedShiftVersion,
    overrideReason: input.overrideReason,
    asOf: input.asOf,
  });

  const now = new Date().toISOString();
  const next: SwapRequest = {
    ...swap,
    status: "approved",
    approvedAt: now,
    approvedBy: actor.userId,
    resultingAssignmentId: assignment.id,
    updatedAt: now,
    version: swap.version + 1,
  };
  store.upsertSwap(next);
  appendRosterAudit({
    actorId: actor.userId,
    organisationId: swap.organisationId,
    clinicId: swap.clinicId,
    action: "swap.approved",
    targetType: "swap",
    targetId: swap.id,
    detail: { assignmentId: assignment.id },
  });
  return { swap: next, assignmentId: assignment.id };
}

export function rejectSwap(
  actor: M05Actor,
  input: { swapId: string; expectedVersion: number; reason: string }
): SwapRequest {
  assertM05Permission(actor, "roster.swap.approve");
  const swap = store.getSwap(input.swapId);
  if (!swap) throw new Error(`Swap not found: ${input.swapId}`);
  assertM05ClinicScope(actor, [swap.clinicId]);
  if (swap.version !== input.expectedVersion) {
    throw new ConcurrentConflictError({
      targetType: "swap",
      targetId: swap.id,
      expectedVersion: input.expectedVersion,
      actualVersion: swap.version,
    });
  }
  assertTransition(swap.status, "rejected");
  const now = new Date().toISOString();
  const next: SwapRequest = {
    ...swap,
    status: "rejected",
    rejectedReason: input.reason,
    updatedAt: now,
    version: swap.version + 1,
  };
  store.upsertSwap(next);
  appendRosterAudit({
    actorId: actor.userId,
    organisationId: swap.organisationId,
    clinicId: swap.clinicId,
    action: "swap.rejected",
    targetType: "swap",
    targetId: swap.id,
    detail: { reason: input.reason },
  });
  return next;
}

export function withdrawSwap(
  actor: M05Actor,
  input: { swapId: string; expectedVersion: number }
): SwapRequest {
  assertM05Permission(actor, "roster.swap.request");
  const swap = store.getSwap(input.swapId);
  if (!swap) throw new Error(`Swap not found: ${input.swapId}`);
  assertM05ClinicScope(actor, [swap.clinicId]);
  if (swap.version !== input.expectedVersion) {
    throw new ConcurrentConflictError({
      targetType: "swap",
      targetId: swap.id,
      expectedVersion: input.expectedVersion,
      actualVersion: swap.version,
    });
  }
  assertTransition(swap.status, "withdrawn");
  const now = new Date().toISOString();
  const next: SwapRequest = {
    ...swap,
    status: "withdrawn",
    updatedAt: now,
    version: swap.version + 1,
  };
  store.upsertSwap(next);
  return next;
}
