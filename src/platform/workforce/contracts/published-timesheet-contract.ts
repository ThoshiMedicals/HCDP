/**
 * Published timesheet contract — Wave 6 / M07 Batch 2 Checkpoint 2.1.
 * Platform-owned publication payload for payroll-preparation intake.
 * organisationId and legalEntityId are separate authoritative identifiers.
 */

export const PUBLISHED_TIMESHEET_CONTRACT_VERSION = "published-timesheet.v1" as const;

export type PublishedTimesheetContractVersion =
  | typeof PUBLISHED_TIMESHEET_CONTRACT_VERSION;

export const SUPPORTED_PUBLISHED_TIMESHEET_CONTRACT_VERSIONS: readonly PublishedTimesheetContractVersion[] =
  [PUBLISHED_TIMESHEET_CONTRACT_VERSION] as const;

export type TimesheetApprovalState =
  | "approved"
  | "revised"
  | "revoked"
  | "restored"
  | "withdrawn"
  | "invalidated";

export type HourInputBucket = {
  code: string;
  hours: number;
  localDate?: string;
  notes?: string;
};

export type LeaveInputRef = {
  leaveRecordId: string;
  leaveTypeCode: string;
  hours: number;
  localStart: string;
  localEnd: string;
  sourceVersion: number;
};

export type AllowanceInputRef = {
  allowanceCode: string;
  quantity: number;
  unit?: string;
  localDate?: string;
};

/**
 * Immutable payroll-preparation source content (hash boundary).
 * Does NOT include approvalState, approvalRevision, publishedAt, publisherId,
 * eventId, idempotencyKey, or registryPublicationId.
 */
export type PublishedTimesheetPayrollContent = {
  timesheetRecordId: string;
  workforcePersonId: string;
  organisationId: string;
  legalEntityId: string;
  clinicId?: string;
  periodStart: string;
  periodEnd: string;
  attendanceSessionIds: string[];
  ordinaryHourInputs: HourInputBucket[];
  overtimeHourInputs: HourInputBucket[];
  penaltyHourInputs: HourInputBucket[];
  leaveInputs: LeaveInputRef[];
  allowanceInputs: AllowanceInputRef[];
};

/** Full published version record (content + lifecycle + transport). */
export type PublishedTimesheetVersion = PublishedTimesheetPayrollContent & {
  contractVersion: PublishedTimesheetContractVersion;
  sourceVersion: number;
  approvalRevision: number;
  approvalState: TimesheetApprovalState;
  contentHash: string;
  publishedAt: string;
  publisherId: string;
  eventId: string;
  idempotencyKey: string;
  eventSequence: number;
  registryPublicationId: string;
  reasonCode?: string;
};

/** Current-state projection derived from immutable history. */
export type PublishedTimesheetCurrentIndex = {
  organisationId: string;
  legalEntityId: string;
  timesheetRecordId: string;
  currentSourceVersion: number;
  currentApprovalRevision: number;
  currentApprovalState: TimesheetApprovalState;
  currentContentHash: string;
  currentRegistryPublicationId: string;
  latestEventSequence: number;
  updatedAt: string;
};

export type PublishTimesheetInput = {
  content: PublishedTimesheetPayrollContent;
  sourceVersion: number;
  approvalRevision: number;
  approvalState: TimesheetApprovalState;
  publishedAt: string;
  publisherId: string;
  eventId: string;
  idempotencyKey: string;
  /** Optional caller-supplied hash — platform verifies against canonical payload. */
  contentHash?: string;
  reasonCode?: string;
  /** Optional; if omitted, registry assigns next monotonic sequence. */
  eventSequence?: number;
};
