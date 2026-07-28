/** M06 domain types — attendance SoT (not payroll). */

export type SessionState = "open" | "on_break" | "closed" | "corrected" | "cancelled";
export type ClockEventState = "recorded" | "corrected" | "voided";
export type ClockEventType = "clock-in" | "clock-out" | "break-start" | "break-end" | "correction";
export type BreakState = "in_progress" | "completed" | "missed" | "voided";
export type CorrectionState = "requested" | "approved" | "rejected" | "withdrawn" | "applied";
export type ExceptionState = "open" | "explained" | "escalated" | "resolved" | "overridden";
export type TimesheetState = "draft" | "submitted" | "approved" | "rejected" | "reopened";
export type ApprovalState = "pending" | "approved" | "rejected" | "reopened";
export type OfflineSyncState = "queued" | "syncing" | "applied" | "conflict" | "resolved" | "discarded";

export type FoldFlag = 0 | 1;

export interface AttendanceTimeStamp {
  timeZoneId: string;
  localCivil: string;
  occurredAtUtc: string;
  offsetMinutes: number;
  fold: FoldFlag;
}

export interface AttendanceSession {
  id: string;
  personId: string;
  clinicId: string;
  organisationId?: string;
  state: SessionState;
  version: number;
  shiftId?: string;
  assignmentId?: string;
  rostered: boolean;
  openedAt: AttendanceTimeStamp;
  closedAt?: AttendanceTimeStamp;
  seedBatchId?: string;
  createdAt: string;
  updatedAt: string;
  cancelReason?: string;
}

export interface ClockEvent {
  id: string;
  sessionId: string;
  personId: string;
  clinicId: string;
  eventType: ClockEventType;
  state: ClockEventState;
  time: AttendanceTimeStamp;
  clientEventId?: string;
  idempotencyKey?: string;
  supersedesEventId?: string;
  voidReason?: string;
  managerEntered?: boolean;
  seedBatchId?: string;
  createdAt: string;
}

export interface BreakRecord {
  id: string;
  sessionId: string;
  personId: string;
  clinicId: string;
  state: BreakState;
  version: number;
  startedAt?: AttendanceTimeStamp;
  endedAt?: AttendanceTimeStamp;
  breakReqId?: string;
  seedBatchId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceException {
  id: string;
  sessionId?: string;
  personId: string;
  clinicId: string;
  state: ExceptionState;
  version: number;
  kind:
    | "early-in"
    | "late-in"
    | "early-out"
    | "missed-in"
    | "missed-out"
    | "missed-break"
    | "unrostered"
    | "leave-conflict"
    | "clinic-mismatch"
    | "excessive-session"
    | "other";
  message: string;
  explanation?: string;
  resolutionNote?: string;
  overrideReason?: string;
  seedBatchId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CorrectionRequest {
  id: string;
  sessionId: string;
  personId: string;
  clinicId: string;
  state: CorrectionState;
  version: number;
  reason: string;
  proposedLocalCivil?: string;
  targetEventId?: string;
  rejectionReason?: string;
  seedBatchId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceDeclaration {
  id: string;
  exceptionId: string;
  personId: string;
  clinicId: string;
  text: string;
  createdAt: string;
  seedBatchId?: string;
}

export interface ApprovalQueueItem {
  id: string;
  kind: "correction" | "timesheet";
  targetId: string;
  personId: string;
  clinicId: string;
  state: ApprovalState;
  version: number;
  createdAt: string;
  updatedAt: string;
  seedBatchId?: string;
}

export interface TimesheetRecord {
  id: string;
  personId: string;
  clinicId: string;
  organisationId?: string;
  /** Employing/payroll entity — independent of organisationId; required for platform publication. */
  legalEntityId?: string;
  periodStart: string;
  periodEnd: string;
  state: TimesheetState;
  /** Optimistic concurrency version — not platform sourceVersion. */
  version: number;
  sessionIds: string[];
  totalMinutes: number;
  publishedAt?: string;
  publishIdempotencyKey?: string;
  timesheetRefSnapshot?: Record<string, unknown>;
  reopenReason?: string;
  /**
   * Platform publication content version (Checkpoint 2.2).
   * Advances only when published payroll-preparation content changes.
   */
  publicationSourceVersion?: number;
  /** Platform approval lifecycle revision — independent of concurrency version. */
  approvalRevision?: number;
  /** Last platform-confirmed publication acknowledgement (never invent success). */
  platformPublicationAck?: {
    registryPublicationId: string;
    contentHash: string;
    sourceVersion: number;
    approvalRevision: number;
    eventId: string;
    idempotencyKey: string;
    eventSequence: number;
    approvalState: string;
    acknowledgedAt: string;
  };
  seedBatchId?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Durable M06→platform publication obligation (Checkpoint 2.2 outbox).
 * Approval remains authoritative even when status is pending/failed.
 */
export type PlatformPublicationIntent =
  | "granted"
  | "revised"
  | "revoked"
  | "restored"
  | "withdrawn"
  | "invalidated";

export type PlatformPublicationOutboxStatus = "pending" | "published" | "failed";

export interface PlatformPublicationOutboxItem {
  id: string;
  timesheetId: string;
  organisationId: string;
  legalEntityId: string;
  clinicId: string;
  intent: PlatformPublicationIntent;
  sourceVersion: number;
  approvalRevision: number;
  eventId: string;
  idempotencyKey: string;
  eventSequence: number;
  status: PlatformPublicationOutboxStatus;
  attemptCount: number;
  maxAttempts: number;
  lastError?: string;
  reasonCode?: string;
  /** Snapshot fields needed to rebuild platform PublishTimesheetInput on retry. */
  contentSnapshot: {
    workforcePersonId: string;
    periodStart: string;
    periodEnd: string;
    attendanceSessionIds: string[];
    totalMinutes: number;
    publisherId: string;
    publishedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}


export interface VerificationEvidence {
  id: string;
  sessionId?: string;
  eventId?: string;
  clinicId: string;
  personId: string;
  method: "web" | "kiosk" | "device" | "ip" | "geofence" | "qr" | "pin" | "manager" | "offline";
  /** Context evidence only — never proof of work performed. */
  summary: string;
  sensitivePayload?: Record<string, unknown>;
  createdAt: string;
  seedBatchId?: string;
}

export interface OfflineQueueItem {
  id: string;
  clientEventId: string;
  clientSequence: number;
  deviceId: string;
  personId: string;
  clinicId: string;
  state: OfflineSyncState;
  payload: {
    kind: "clock-in" | "clock-out" | "break-start" | "break-end";
    localCivil: string;
    fold?: FoldFlag;
    sessionId?: string;
  };
  conflictReason?: string;
  createdAt: string;
  updatedAt: string;
  seedBatchId?: string;
}

export interface AttendanceAuditEntry {
  id: string;
  at: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  detail?: string;
  clinicId?: string;
  seedBatchId?: string;
}

export interface RegisteredDevice {
  id: string;
  clinicId: string;
  label: string;
  revoked: boolean;
  seedBatchId?: string;
  createdAt: string;
}

export interface MigrationReport {
  at: string;
  seedBatchId: string;
  inserted: Record<string, number>;
  skipped: Record<string, number>;
}
