/**
 * M05 open-shift lifecycle (§13 / §19.4 of the plan).
 *
 * open → offered → eoi_received → selected → closed
 * open|offered → withdrawn / expired
 * open|offered → escalated (see coverage-service)
 */

import { assertM05ClinicScope, assertM05Permission, type M05Actor } from "../permissions";
import type {
  OpenShift,
  OpenShiftApplicant,
  OpenShiftLifecycleStatus,
} from "../types/domain";
import * as store from "../repository/local-store";
import { appendRosterAudit } from "./audit-helpers";
import { ConcurrentConflictError, InvalidLifecycleTransitionError } from "./errors";
import { assignPerson } from "./assignment-service";
import { evaluateEligibility } from "./eligibility-service";

const ALLOWED: Record<OpenShiftLifecycleStatus, OpenShiftLifecycleStatus[]> = {
  open: ["offered", "withdrawn", "expired", "escalated", "selected"],
  offered: ["eoi_received", "selected", "withdrawn", "expired", "escalated"],
  eoi_received: ["selected", "withdrawn", "expired", "escalated"],
  selected: ["closed"],
  closed: [],
  withdrawn: [],
  expired: [],
  escalated: ["selected", "withdrawn", "expired", "closed"],
};

function assertTransition(from: OpenShiftLifecycleStatus, to: OpenShiftLifecycleStatus): void {
  if (!ALLOWED[from]?.includes(to)) {
    throw new InvalidLifecycleTransitionError({ from, to, targetType: "open-shift" });
  }
}

export function offerOpenShift(
  actor: M05Actor,
  input: {
    shiftId: string;
    audiencePersonIds: string[];
  }
): OpenShift {
  assertM05Permission(actor, "roster.open_shift.manage");
  const shift = store.getShift(input.shiftId);
  if (!shift) throw new Error(`Shift not found: ${input.shiftId}`);
  assertM05ClinicScope(actor, [shift.clinicId]);
  if (shift.currentAssignmentId) throw new Error("Cannot open a shift that already has an active assignment");

  const now = new Date().toISOString();
  const openShift: OpenShift = {
    id: store.newOpenShiftId(),
    shiftId: shift.id,
    rosterPeriodId: shift.rosterPeriodId,
    clinicId: shift.clinicId,
    organisationId: shift.organisationId,
    status: "offered",
    audiencePersonIds: input.audiencePersonIds,
    applicants: [],
    selectedPersonId: null,
    closedAt: null,
    escalatedLevel: 0,
    createdAt: now,
    createdBy: actor.userId,
    updatedAt: now,
    version: 1,
  };
  store.upsertOpenShift(openShift);
  appendRosterAudit({
    actorId: actor.userId,
    organisationId: openShift.organisationId,
    clinicId: openShift.clinicId,
    action: "open-shift.offered",
    targetType: "open-shift",
    targetId: openShift.id,
    detail: { shiftId: shift.id, audienceSize: input.audiencePersonIds.length },
  });
  return openShift;
}

export function acceptOpenShift(
  actor: M05Actor,
  input: {
    openShiftId: string;
    expectedVersion: number;
    actAsPersonId: string;
  }
): OpenShift {
  const openShift = store.getOpenShift(input.openShiftId);
  if (!openShift) throw new Error(`Open shift not found: ${input.openShiftId}`);
  if (openShift.version !== input.expectedVersion) {
    throw new ConcurrentConflictError({
      targetType: "open-shift",
      targetId: openShift.id,
      expectedVersion: input.expectedVersion,
      actualVersion: openShift.version,
    });
  }
  assertM05ClinicScope(actor, [openShift.clinicId]);
  if (!openShift.audiencePersonIds.includes(input.actAsPersonId)) {
    throw new Error(`Person ${input.actAsPersonId} is not in the audience for open shift ${openShift.id}`);
  }
  const shift = store.getShift(openShift.shiftId);
  if (!shift) throw new Error(`Shift missing for open shift ${openShift.id}`);
  if (shift.currentAssignmentId) throw new Error("Open shift already filled — refresh to latest state");

  const decision = evaluateEligibility({
    personId: input.actAsPersonId,
    clinicId: shift.clinicId,
    asOf: new Date().toISOString(),
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
  if (decision.decision === "hard_block" || decision.decision === "never_overridable" || decision.decision === "unknown_person") {
    throw new Error(`Open-shift acceptance denied — ${decision.decision}`);
  }

  const now = new Date().toISOString();
  const already = openShift.applicants.some((a) => a.personId === input.actAsPersonId);
  const applicant: OpenShiftApplicant = {
    personId: input.actAsPersonId,
    appliedAt: now,
    status: "applied",
  };
  const nextStatus: OpenShiftLifecycleStatus =
    openShift.status === "open" || openShift.status === "offered" ? "eoi_received" : openShift.status;
  assertTransition(openShift.status, nextStatus);

  const next: OpenShift = {
    ...openShift,
    status: nextStatus,
    applicants: already ? openShift.applicants : [...openShift.applicants, applicant],
    updatedAt: now,
    version: openShift.version + 1,
  };
  store.upsertOpenShift(next);
  appendRosterAudit({
    actorId: actor.userId,
    organisationId: openShift.organisationId,
    clinicId: openShift.clinicId,
    action: "open-shift.applied",
    targetType: "open-shift",
    targetId: openShift.id,
    detail: { personId: input.actAsPersonId },
  });
  return next;
}

export function selectOpenShiftApplicant(
  actor: M05Actor,
  input: {
    openShiftId: string;
    expectedVersion: number;
    expectedShiftVersion: number;
    personId: string;
    overrideReason?: string;
  }
): { openShift: OpenShift; assignmentId: string } {
  assertM05Permission(actor, "roster.open_shift.manage");
  assertM05Permission(actor, "roster.assign");
  const openShift = store.getOpenShift(input.openShiftId);
  if (!openShift) throw new Error(`Open shift not found: ${input.openShiftId}`);
  assertM05ClinicScope(actor, [openShift.clinicId]);
  if (openShift.version !== input.expectedVersion) {
    throw new ConcurrentConflictError({
      targetType: "open-shift",
      targetId: openShift.id,
      expectedVersion: input.expectedVersion,
      actualVersion: openShift.version,
    });
  }
  if (!openShift.applicants.some((a) => a.personId === input.personId)) {
    throw new Error(`Person ${input.personId} has not applied to this open shift`);
  }
  assertTransition(openShift.status, "selected");

  const assignment = assignPerson(actor, {
    shiftId: openShift.shiftId,
    personId: input.personId,
    expectedShiftVersion: input.expectedShiftVersion,
    overrideReason: input.overrideReason,
  });

  const now = new Date().toISOString();
  const applicants = openShift.applicants.map((a) =>
    a.personId === input.personId ? { ...a, status: "selected" as const } : a
  );
  const next: OpenShift = {
    ...openShift,
    status: "closed",
    selectedPersonId: input.personId,
    applicants,
    closedAt: now,
    updatedAt: now,
    version: openShift.version + 1,
  };
  store.upsertOpenShift(next);
  appendRosterAudit({
    actorId: actor.userId,
    organisationId: openShift.organisationId,
    clinicId: openShift.clinicId,
    action: "open-shift.selected",
    targetType: "open-shift",
    targetId: openShift.id,
    detail: { personId: input.personId, assignmentId: assignment.id },
  });
  return { openShift: next, assignmentId: assignment.id };
}

export function withdrawOpenShift(
  actor: M05Actor,
  input: { openShiftId: string; expectedVersion: number; reason: string }
): OpenShift {
  assertM05Permission(actor, "roster.open_shift.manage");
  const openShift = store.getOpenShift(input.openShiftId);
  if (!openShift) throw new Error(`Open shift not found: ${input.openShiftId}`);
  assertM05ClinicScope(actor, [openShift.clinicId]);
  if (openShift.version !== input.expectedVersion) {
    throw new ConcurrentConflictError({
      targetType: "open-shift",
      targetId: openShift.id,
      expectedVersion: input.expectedVersion,
      actualVersion: openShift.version,
    });
  }
  assertTransition(openShift.status, "withdrawn");
  const now = new Date().toISOString();
  const next: OpenShift = {
    ...openShift,
    status: "withdrawn",
    closedAt: now,
    updatedAt: now,
    version: openShift.version + 1,
  };
  store.upsertOpenShift(next);
  appendRosterAudit({
    actorId: actor.userId,
    organisationId: openShift.organisationId,
    clinicId: openShift.clinicId,
    action: "open-shift.withdrawn",
    targetType: "open-shift",
    targetId: openShift.id,
    detail: { reason: input.reason },
  });
  return next;
}
