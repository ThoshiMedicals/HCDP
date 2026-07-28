import { assertM06ClinicScope, assertM06Permission, type M06Actor } from "../permissions";
import { getApproval, listApprovals, upsertApproval } from "../repository/local-store";
import type { ApprovalQueueItem } from "../types";
import { approveCorrection, rejectCorrection } from "./correction-service";
import { approveTimesheet, rejectTimesheet, reopenTimesheet } from "./timesheet-service";
import { getCorrection } from "../repository/local-store";
import { getTimesheet } from "../repository/local-store";
import {
  ConcurrentConflictError,
  InvalidLifecycleTransitionError,
  ValidationError,
} from "./errors";

export function listPendingApprovals(actor: M06Actor, clinicId?: string): ApprovalQueueItem[] {
  assertM06Permission(actor, "attendance.approve");
  let rows = (clinicId ? listApprovals(clinicId) : listApprovals()).filter((a) => a.state === "pending");
  if (actor.clinicIds) rows = rows.filter((a) => actor.clinicIds!.includes(a.clinicId));
  return rows;
}

export function approveQueueItem(input: {
  actor: M06Actor;
  approvalId: string;
  expectedVersion: number;
}): ApprovalQueueItem {
  assertM06Permission(input.actor, "attendance.approve");
  const item = getApproval(input.approvalId);
  if (!item) throw new ValidationError("Approval item not found");
  assertM06ClinicScope(input.actor, [item.clinicId]);
  if (item.state !== "pending") {
    throw new InvalidLifecycleTransitionError({ from: item.state, to: "approved", targetType: "approval" });
  }
  if (item.version !== input.expectedVersion) {
    throw new ConcurrentConflictError({
      targetType: "approval",
      targetId: item.id,
      expectedVersion: input.expectedVersion,
      actualVersion: item.version,
    });
  }
  if (item.kind === "correction") {
    const c = getCorrection(item.targetId);
    if (!c) throw new ValidationError("Correction missing");
    approveCorrection({ actor: input.actor, correctionId: c.id, expectedVersion: c.version });
  } else {
    const t = getTimesheet(item.targetId);
    if (!t) throw new ValidationError("Timesheet missing");
    approveTimesheet({ actor: input.actor, timesheetId: t.id, expectedVersion: t.version });
  }
  const next = { ...item, state: "approved" as const, version: item.version + 1, updatedAt: new Date().toISOString() };
  return upsertApproval(next);
}

export function rejectQueueItem(input: {
  actor: M06Actor;
  approvalId: string;
  expectedVersion: number;
  reason?: string;
}): ApprovalQueueItem {
  assertM06Permission(input.actor, "attendance.approve");
  const item = getApproval(input.approvalId);
  if (!item) throw new ValidationError("Approval item not found");
  assertM06ClinicScope(input.actor, [item.clinicId]);
  if (item.state !== "pending") {
    throw new InvalidLifecycleTransitionError({ from: item.state, to: "rejected", targetType: "approval" });
  }
  if (item.version !== input.expectedVersion) {
    throw new ConcurrentConflictError({
      targetType: "approval",
      targetId: item.id,
      expectedVersion: input.expectedVersion,
      actualVersion: item.version,
    });
  }
  if (item.kind === "correction") {
    const c = getCorrection(item.targetId);
    if (!c) throw new ValidationError("Correction missing");
    rejectCorrection({ actor: input.actor, correctionId: c.id, expectedVersion: c.version, reason: input.reason });
  } else {
    const t = getTimesheet(item.targetId);
    if (!t) throw new ValidationError("Timesheet missing");
    rejectTimesheet({ actor: input.actor, timesheetId: t.id, expectedVersion: t.version });
  }
  const next = { ...item, state: "rejected" as const, version: item.version + 1, updatedAt: new Date().toISOString() };
  return upsertApproval(next);
}

export function reopenApprovalItem(input: {
  actor: M06Actor;
  approvalId: string;
  expectedVersion: number;
  reason: string;
}): ApprovalQueueItem {
  assertM06Permission(input.actor, "attendance.reopen");
  const item = getApproval(input.approvalId);
  if (!item) throw new ValidationError("Approval item not found");
  if (item.state !== "approved") {
    throw new InvalidLifecycleTransitionError({ from: item.state, to: "reopened", targetType: "approval" });
  }
  if (item.version !== input.expectedVersion) {
    throw new ConcurrentConflictError({
      targetType: "approval",
      targetId: item.id,
      expectedVersion: input.expectedVersion,
      actualVersion: item.version,
    });
  }
  if (item.kind === "timesheet") {
    const t = getTimesheet(item.targetId);
    if (t) reopenTimesheet({ actor: input.actor, timesheetId: t.id, expectedVersion: t.version, reason: input.reason });
  }
  const next = { ...item, state: "reopened" as const, version: item.version + 1, updatedAt: new Date().toISOString() };
  return upsertApproval(next);
}
