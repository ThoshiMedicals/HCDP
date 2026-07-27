/**
 * M05 shift service — create / update / cancel / supersede shifts.
 * Requires resolved clinic-local shift window (§4 of the plan).
 */

import { assertM05ClinicScope, assertM05Permission, type M05Actor } from "../permissions";
import type { Shift, ShiftLifecycleStatus } from "../types/domain";
import type { FoldFlag } from "../types/timezone";
import * as store from "../repository/local-store";
import { appendRosterAudit } from "./audit-helpers";
import { resolveLocalShiftWindow } from "./clinic-time-service";
import { publishM05RosterEvent } from "./events";
import { rosterEventIdempotencyKey } from "@/platform/workforce/events/roster-events";
import {
  ConcurrentConflictError,
  InvalidLifecycleTransitionError,
} from "./errors";

const DEFAULT_ORG = "org_parent";

const ALLOWED_STATUS_TRANSITIONS: Record<ShiftLifecycleStatus, ShiftLifecycleStatus[]> = {
  draft: ["unassigned", "cancelled", "superseded"],
  unassigned: ["assigned", "open", "cancelled", "superseded"],
  assigned: ["unassigned", "open", "cancelled", "completed-reference", "superseded"],
  open: ["offered", "assigned", "cancelled", "superseded"],
  offered: ["accepted", "declined", "cancelled", "superseded"],
  accepted: ["assigned", "cancelled", "superseded"],
  declined: ["open", "cancelled", "superseded"],
  cancelled: ["superseded"],
  "completed-reference": ["superseded"],
  superseded: [],
};

export function isValidShiftTransition(
  from: ShiftLifecycleStatus,
  to: ShiftLifecycleStatus
): boolean {
  return ALLOWED_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

// ——— Create ———

export interface CreateShiftInput {
  rosterPeriodId: string;
  clinicId: string;
  organisationId?: string;
  localStartYmd: string;
  localStartHm: string;
  localEndYmd: string;
  localEndHm: string;
  fold?: { start?: FoldFlag; end?: FoldFlag };
  roleLabel?: string;
  requiredCapability?: string | null;
  requiredCount?: number;
  breakPlannedMinutes?: number | null;
  splitGroupId?: string | null;
}

export function createShift(actor: M05Actor, input: CreateShiftInput): Shift {
  assertM05Permission(actor, "roster.shift.edit");
  assertM05ClinicScope(actor, [input.clinicId]);

  const period = store.getPeriod(input.rosterPeriodId);
  if (!period) throw new Error(`Period not found: ${input.rosterPeriodId}`);
  if (period.clinicId !== input.clinicId) {
    throw new Error("Shift clinicId must match its roster period clinicId");
  }
  if (period.lifecycleState === "published" || period.lifecycleState === "superseded" || period.lifecycleState === "cancelled" || period.lifecycleState === "archived") {
    throw new InvalidLifecycleTransitionError({
      from: period.lifecycleState,
      to: "shift.create",
      targetType: "shift",
      message: `Cannot create shifts in period with lifecycle ${period.lifecycleState} — create a superseding publication instead`,
    });
  }

  const resolution = resolveLocalShiftWindow(
    input.clinicId,
    input.localStartYmd,
    input.localStartHm,
    input.localEndYmd,
    input.localEndHm,
    input.fold
  );
  if (!resolution.ok) {
    throw new Error(`Shift timezone unresolved (${resolution.reason}): ${resolution.message}`);
  }
  const w = resolution.window;

  const now = new Date().toISOString();
  const shift: Shift = {
    id: store.newShiftId(),
    rosterPeriodId: input.rosterPeriodId,
    clinicId: input.clinicId,
    organisationId: input.organisationId ?? period.organisationId ?? DEFAULT_ORG,
    status: "unassigned",
    timeZoneId: w.timeZoneId,
    localStart: w.localStart,
    localEnd: w.localEnd,
    utcStart: w.utcStart,
    utcEnd: w.utcEnd,
    startOffsetMinutes: w.startOffsetMinutes,
    endOffsetMinutes: w.endOffsetMinutes,
    startFold: w.startFold,
    endFold: w.endFold,
    crossesLocalMidnight: w.crossesLocalMidnight,
    roleLabel: input.roleLabel,
    requiredCapability: input.requiredCapability ?? null,
    requiredCount: input.requiredCount ?? 1,
    breakPlannedMinutes: input.breakPlannedMinutes ?? null,
    splitGroupId: input.splitGroupId ?? null,
    supersedesId: null,
    supersededById: null,
    cancelReason: null,
    currentAssignmentId: null,
    seedBatchId: null,
    createdAt: now,
    createdBy: actor.userId,
    updatedAt: now,
    version: 1,
  };
  store.upsertShift(shift);
  appendRosterAudit({
    actorId: actor.userId,
    organisationId: shift.organisationId,
    clinicId: shift.clinicId,
    action: "shift.created",
    targetType: "shift",
    targetId: shift.id,
    detail: { localStart: shift.localStart, localEnd: shift.localEnd },
  });
  publishM05RosterEvent({
    eventType: "shift.created",
    sourceRecordId: shift.id,
    sourceRecordVersion: shift.version,
    sourceRecordType: "roster-shift",
    sourceRecordTitle: `Shift ${shift.id}`,
    organisationId: shift.organisationId,
    clinicId: shift.clinicId,
    actor: actor.userId,
    idempotencyKey: rosterEventIdempotencyKey({
      namespace: "roster.assignment",
      recordId: shift.id,
      version: shift.version,
      suffix: "created",
    }),
    section: "roster-board",
    currentStatus: shift.status,
    payload: { rosterPeriodId: shift.rosterPeriodId },
  });
  return shift;
}

// ——— Update times / role ———

export interface UpdateShiftTimesInput {
  shiftId: string;
  expectedVersion: number;
  localStartYmd?: string;
  localStartHm?: string;
  localEndYmd?: string;
  localEndHm?: string;
  fold?: { start?: FoldFlag; end?: FoldFlag };
  roleLabel?: string;
  requiredCapability?: string | null;
  requiredCount?: number;
  breakPlannedMinutes?: number | null;
}

export function updateShift(actor: M05Actor, input: UpdateShiftTimesInput): Shift {
  assertM05Permission(actor, "roster.shift.edit");

  const shift = store.getShift(input.shiftId);
  if (!shift) throw new Error(`Shift not found: ${input.shiftId}`);
  assertM05ClinicScope(actor, [shift.clinicId]);
  if (shift.version !== input.expectedVersion) {
    throw new ConcurrentConflictError({
      targetType: "shift",
      targetId: shift.id,
      expectedVersion: input.expectedVersion,
      actualVersion: shift.version,
    });
  }

  let localStartYmd = shift.localStart.slice(0, 10);
  let localStartHm = shift.localStart.slice(11, 16);
  let localEndYmd = shift.localEnd.slice(0, 10);
  let localEndHm = shift.localEnd.slice(11, 16);
  if (input.localStartYmd) localStartYmd = input.localStartYmd;
  if (input.localStartHm) localStartHm = input.localStartHm;
  if (input.localEndYmd) localEndYmd = input.localEndYmd;
  if (input.localEndHm) localEndHm = input.localEndHm;

  const resolution = resolveLocalShiftWindow(
    shift.clinicId,
    localStartYmd,
    localStartHm,
    localEndYmd,
    localEndHm,
    input.fold
  );
  if (!resolution.ok) {
    throw new Error(`Shift timezone unresolved (${resolution.reason}): ${resolution.message}`);
  }
  const w = resolution.window;

  const now = new Date().toISOString();
  const next: Shift = {
    ...shift,
    timeZoneId: w.timeZoneId,
    localStart: w.localStart,
    localEnd: w.localEnd,
    utcStart: w.utcStart,
    utcEnd: w.utcEnd,
    startOffsetMinutes: w.startOffsetMinutes,
    endOffsetMinutes: w.endOffsetMinutes,
    startFold: w.startFold,
    endFold: w.endFold,
    crossesLocalMidnight: w.crossesLocalMidnight,
    roleLabel: input.roleLabel ?? shift.roleLabel,
    requiredCapability: input.requiredCapability ?? shift.requiredCapability,
    requiredCount: input.requiredCount ?? shift.requiredCount,
    breakPlannedMinutes: input.breakPlannedMinutes ?? shift.breakPlannedMinutes,
    updatedAt: now,
    version: shift.version + 1,
  };
  store.upsertShift(next);
  appendRosterAudit({
    actorId: actor.userId,
    organisationId: next.organisationId,
    clinicId: next.clinicId,
    action: "shift.updated",
    targetType: "shift",
    targetId: next.id,
    detail: { fromVersion: shift.version, toVersion: next.version },
  });
  publishM05RosterEvent({
    eventType: "shift.changed",
    sourceRecordId: next.id,
    sourceRecordVersion: next.version,
    sourceRecordType: "roster-shift",
    sourceRecordTitle: `Shift ${next.id}`,
    organisationId: next.organisationId,
    clinicId: next.clinicId,
    actor: actor.userId,
    idempotencyKey: rosterEventIdempotencyKey({
      namespace: "roster.assignment",
      recordId: next.id,
      version: next.version,
      suffix: "changed",
    }),
    section: "roster-board",
    currentStatus: next.status,
    payload: { rosterPeriodId: next.rosterPeriodId },
  });
  return next;
}

// ——— Cancel ———

export function cancelShift(
  actor: M05Actor,
  input: { shiftId: string; expectedVersion: number; reason: string }
): Shift {
  assertM05Permission(actor, "roster.shift.edit");
  if (!input.reason?.trim()) throw new Error("Cancel reason required");
  const shift = store.getShift(input.shiftId);
  if (!shift) throw new Error(`Shift not found: ${input.shiftId}`);
  assertM05ClinicScope(actor, [shift.clinicId]);
  if (shift.version !== input.expectedVersion) {
    throw new ConcurrentConflictError({
      targetType: "shift",
      targetId: shift.id,
      expectedVersion: input.expectedVersion,
      actualVersion: shift.version,
    });
  }
  if (!isValidShiftTransition(shift.status, "cancelled")) {
    throw new InvalidLifecycleTransitionError({
      from: shift.status,
      to: "cancelled",
      targetType: "shift",
    });
  }
  const now = new Date().toISOString();
  const next: Shift = {
    ...shift,
    status: "cancelled",
    cancelReason: input.reason,
    updatedAt: now,
    version: shift.version + 1,
  };
  store.upsertShift(next);
  appendRosterAudit({
    actorId: actor.userId,
    organisationId: next.organisationId,
    clinicId: next.clinicId,
    action: "shift.cancelled",
    targetType: "shift",
    targetId: next.id,
    detail: { reason: input.reason },
  });
  publishM05RosterEvent({
    eventType: "shift.cancelled",
    sourceRecordId: next.id,
    sourceRecordVersion: next.version,
    sourceRecordType: "roster-shift",
    sourceRecordTitle: `Shift ${next.id}`,
    organisationId: next.organisationId,
    clinicId: next.clinicId,
    actor: actor.userId,
    idempotencyKey: rosterEventIdempotencyKey({
      namespace: "roster.assignment",
      recordId: next.id,
      version: next.version,
      suffix: "cancelled",
    }),
    section: "roster-board",
    currentStatus: next.status,
  });
  return next;
}

// ——— Internal transition helper (used by other services) ———

export function internalTransitionShiftStatus(
  shiftId: string,
  expectedVersion: number,
  to: ShiftLifecycleStatus,
  actor: string
): Shift {
  const shift = store.getShift(shiftId);
  if (!shift) throw new Error(`Shift not found: ${shiftId}`);
  if (shift.version !== expectedVersion) {
    throw new ConcurrentConflictError({
      targetType: "shift",
      targetId: shift.id,
      expectedVersion,
      actualVersion: shift.version,
    });
  }
  if (!isValidShiftTransition(shift.status, to)) {
    throw new InvalidLifecycleTransitionError({
      from: shift.status,
      to,
      targetType: "shift",
    });
  }
  const now = new Date().toISOString();
  const next: Shift = {
    ...shift,
    status: to,
    updatedAt: now,
    version: shift.version + 1,
  };
  store.upsertShift(next);
  appendRosterAudit({
    actorId: actor,
    organisationId: next.organisationId,
    clinicId: next.clinicId,
    action: `shift.transition.${to}`,
    targetType: "shift",
    targetId: next.id,
    detail: { fromVersion: shift.version, toVersion: next.version, from: shift.status, to },
  });
  return next;
}

// ——— Reads ———

export function listShiftsForActor(actor: M05Actor, periodId?: string): Shift[] {
  assertM05Permission(actor, "roster.view");
  return store.listShifts(periodId).filter((s) => {
    if (actor.permissions.includes("*")) return true;
    if (actor.clinicIds === undefined) return true;
    if (!actor.clinicIds.length) return false;
    return actor.clinicIds.includes(s.clinicId);
  });
}
