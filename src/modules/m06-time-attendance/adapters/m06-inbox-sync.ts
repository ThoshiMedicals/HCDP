/**
 * M06 → M02 action-inbox projections.
 * Uses dispatchActionInboxEvent — never writes M02 repositories directly.
 */

import type { SourceRecordRef } from "@/platform/contracts/source-record";
import {
  dispatchActionInboxEvent,
  findInboxActionForSource,
} from "@/platform/services/action-inbox-bridge";
import type { AttendanceException, CorrectionRequest, OfflineQueueItem, TimesheetRecord } from "../types/domain";

const MODULE_ID = "time-attendance";

function dueInDays(days: number): string {
  return new Date(Date.now() + days * 86400000).toISOString();
}

function syncCondition(input: {
  sourceRecordType: string;
  sourceRecordId: string;
  title: string;
  summary: string;
  clinicId: string;
  actionType: string;
  projectionKey: string;
  version?: number;
  priority?: "Urgent" | "High" | "Medium" | "Low";
  kind?: "create" | "update" | "close";
}) {
  if (typeof window === "undefined") return null;
  const source: SourceRecordRef = {
    sourceModuleId: MODULE_ID,
    sourceRecordType: input.sourceRecordType,
    sourceRecordId: input.sourceRecordId,
    sourceRecordTitle: input.title,
    clinicId: input.clinicId,
    currentStatus: input.kind === "close" ? "Closed" : "Open",
    route: "/time-attendance",
    section: "exceptions",
  };
  const existing = findInboxActionForSource(MODULE_ID, input.sourceRecordType, input.sourceRecordId);
  const kind = input.kind ?? (existing ? "update" : "create");
  return dispatchActionInboxEvent({
    kind,
    projectionKey: input.projectionKey,
    source,
    sourceRecordVersion: input.version ?? 1,
    actionTitle: input.title,
    actionSummary: input.summary,
    category: "Exception",
    actionType: input.actionType,
    clinicId: input.clinicId,
    owner: "Attendance Coordinator",
    requester: "M06 Time & Attendance",
    priority: input.priority ?? "High",
    dueAt: dueInDays(1),
    requiredOutcome: "Review attendance condition",
    sensitivity: "Standard",
    inboxStatus: kind === "close" ? "Completed" : "Open",
    completionRequirements: ["Review", "Resolve or override with reason"],
  });
}

export function syncExceptionToInbox(ex: AttendanceException) {
  return syncCondition({
    sourceRecordType: `attendance-${ex.kind}`,
    sourceRecordId: ex.id,
    title: `Attendance exception: ${ex.kind}`,
    summary: ex.message,
    clinicId: ex.clinicId,
    actionType: "AttendanceException",
    projectionKey: `${MODULE_ID}::attendance-${ex.kind}::${ex.id}`,
    version: ex.version,
    priority: ex.kind.startsWith("missed") ? "Urgent" : "High",
  });
}

export function closeExceptionInbox(ex: AttendanceException) {
  return syncCondition({
    sourceRecordType: `attendance-${ex.kind}`,
    sourceRecordId: ex.id,
    title: `Attendance exception resolved: ${ex.kind}`,
    summary: ex.resolutionNote ?? ex.message,
    clinicId: ex.clinicId,
    actionType: "AttendanceException",
    projectionKey: `${MODULE_ID}::attendance-${ex.kind}::${ex.id}`,
    version: ex.version,
    kind: "close",
  });
}

export function syncCorrectionAwaitingApproval(c: CorrectionRequest) {
  return syncCondition({
    sourceRecordType: "correction-approval",
    sourceRecordId: c.id,
    title: "Correction awaiting approval",
    summary: c.reason,
    clinicId: c.clinicId,
    actionType: "AttendanceCorrection",
    projectionKey: `${MODULE_ID}::correction-approval::${c.id}`,
    version: c.version,
  });
}

export function closeCorrectionInbox(c: CorrectionRequest) {
  return syncCondition({
    sourceRecordType: "correction-approval",
    sourceRecordId: c.id,
    title: "Correction closed",
    summary: c.reason,
    clinicId: c.clinicId,
    actionType: "AttendanceCorrection",
    projectionKey: `${MODULE_ID}::correction-approval::${c.id}`,
    version: c.version,
    kind: "close",
  });
}

export function syncTimesheetAwaitingApproval(t: TimesheetRecord) {
  return syncCondition({
    sourceRecordType: "timesheet-approval",
    sourceRecordId: t.id,
    title: "Timesheet awaiting approval",
    summary: `${t.periodStart} → ${t.periodEnd}`,
    clinicId: t.clinicId,
    actionType: "AttendanceTimesheet",
    projectionKey: `${MODULE_ID}::timesheet-approval::${t.id}`,
    version: t.version,
  });
}

export function closeTimesheetInbox(t: TimesheetRecord) {
  return syncCondition({
    sourceRecordType: "timesheet-approval",
    sourceRecordId: t.id,
    title: "Timesheet approval closed",
    summary: t.state,
    clinicId: t.clinicId,
    actionType: "AttendanceTimesheet",
    projectionKey: `${MODULE_ID}::timesheet-approval::${t.id}`,
    version: t.version,
    kind: "close",
  });
}

export function syncOfflineConflict(item: OfflineQueueItem) {
  return syncCondition({
    sourceRecordType: "offline-sync-failure",
    sourceRecordId: item.id,
    title: "Offline synchronization conflict",
    summary: item.conflictReason ?? "Conflict",
    clinicId: item.clinicId,
    actionType: "AttendanceOfflineSync",
    projectionKey: `${MODULE_ID}::offline-sync-failure::${item.id}`,
    priority: "Urgent",
  });
}

export function closeOfflineConflict(item: OfflineQueueItem) {
  return syncCondition({
    sourceRecordType: "offline-sync-failure",
    sourceRecordId: item.id,
    title: "Offline conflict resolved",
    summary: item.state,
    clinicId: item.clinicId,
    actionType: "AttendanceOfflineSync",
    projectionKey: `${MODULE_ID}::offline-sync-failure::${item.id}`,
    kind: "close",
  });
}
