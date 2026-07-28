/**
 * M07 Staff Pay domain types — Batch 1 foundation.
 * Preparation inputs only. Not award/tax/super/banking truth.
 */

export const M07_NON_CERTIFIED_DISCLAIMER =
  "Prototype payroll-preparation rules — not award-certified; not legal, tax, superannuation or payroll advice." as const;

export const M07_PROHIBITED_FIELD_KEYS = [
  "tfn",
  "taxFileNumber",
  "bsb",
  "bankAccount",
  "bankAccountNumber",
  "accountNumber",
  "superMemberNumber",
  "superannuationMemberNumber",
  "bankingCredentials",
  "bankPassword",
  "paymentInstructions",
  "paymentInstruction",
] as const;

export type M07ProhibitedFieldKey = (typeof M07_PROHIBITED_FIELD_KEYS)[number];

export type PayPeriodLifecycleState =
  | "draft"
  | "open"
  | "calculating"
  | "in-review"
  | "export-ready"
  | "exported"
  | "reconciled"
  | "locked"
  | "archived";

export type PayPeriodKind = "ordinary" | "adjustment";

export type CadenceKind = "weekly" | "fortnightly" | "monthly";

export type VersionedRecordStatus = "draft" | "active" | "retired";

export type ExternalIdHistoryEntry = {
  previousId: string | null;
  nextId: string | null;
  actorUserId: string;
  reason: string;
  at: string;
};

export type M07AuditEvent = {
  id: string;
  at: string;
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  legalEntityId: string;
  clinicId?: string;
  before?: unknown;
  after?: unknown;
  reason?: string;
  meta?: Record<string, unknown>;
};

export type LegalEntityPaySettings = {
  id: string;
  legalEntityId: string;
  cadenceDefault: CadenceKind;
  separationOfDuties: boolean;
  updatedAt: string;
  updatedBy: string;
  version: number;
};

export type PayProfile = {
  id: string;
  personId: string;
  legalEntityId: string;
  clinicId?: string;
  /** Sensitive — permission-gated; never TFN/bank/super. */
  externalPayrollEmployeeId?: string | null;
  externalPayrollEmployeeIdHistory: ExternalIdHistoryEntry[];
  m04ClassificationRef?: string | null;
  preparationRuleId?: string | null;
  preparationRuleVersion?: number | null;
  ordinaryHourlyRate?: number | null;
  overtimeRulesRef?: string | null;
  allowanceCodes: string[];
  deductionCodes: string[];
  leavePayMapping?: string | null;
  effectiveFrom: string;
  effectiveTo?: string | null;
  status: "active" | "archived";
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
};

export type PreparationRule = {
  id: string;
  legalEntityId: string;
  code: string;
  label: string;
  /** Always non-certified preparation. */
  certified: false;
  disclaimer: typeof M07_NON_CERTIFIED_DISCLAIMER;
  ordinaryMultiplier: number;
  overtimeMultiplier: number;
  effectiveFrom: string;
  effectiveTo?: string | null;
  status: VersionedRecordStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
};

export type ClassificationRuleMapping = {
  id: string;
  legalEntityId: string;
  m04ClassificationRef: string;
  preparationRuleId: string;
  preparationRuleVersion: number;
  status: VersionedRecordStatus;
  effectiveFrom: string;
  effectiveTo?: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
};

export type GenericCodeLineType = "allowance" | "deduction" | "other";

export type GenericCode = {
  id: string;
  legalEntityId: string;
  code: string;
  label: string;
  lineType: GenericCodeLineType;
  externalMappingField?: string | null;
  permittedOrigin: "manual" | "system" | "either";
  certified: false;
  effectiveFrom: string;
  effectiveTo?: string | null;
  status: VersionedRecordStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
};

export type ExportProfile = {
  id: string;
  legalEntityId: string;
  name: string;
  schemaVersion: string;
  includeNames: boolean;
  includeRatesOrMoney: boolean;
  piiClassification: "minimum" | "standard" | "sensitive";
  includedFields: string[];
  requiredPermissions: string[];
  externalFieldMappings: Record<string, string>;
  validationRules: string[];
  effectiveFrom: string;
  effectiveTo?: string | null;
  status: VersionedRecordStatus;
  version: number;
  isDefaultMinimumPii: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
};

export type PayPeriodRecord = {
  id: string;
  legalEntityId: string;
  clinicIds: string[];
  kind: PayPeriodKind;
  cadence: CadenceKind;
  periodStart: string;
  periodEnd: string;
  state: PayPeriodLifecycleState;
  separationOfDutiesSnapshot: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  /** Batch 1 foundation — later workflows fill these. */
  lockedAt?: string | null;
  lockedBy?: string | null;
  exportCreated: boolean;
};

export type MigrationReport = {
  v1Ran: boolean;
  v2Ran: boolean;
  v3Ran?: boolean;
  v4Ran?: boolean;
  v5Ran?: boolean;
  at: string;
};

/** Checkpoint 2.4 — immutable M07 source snapshot of a platform publication. */
export type PublishedTimesheetIntakeStatus =
  | "imported"
  | "duplicate-idempotent"
  | "rejected"
  | "conflict"
  | "unavailable";

export type PublishedTimesheetSourceSnapshot = {
  id: string;
  registryPublicationId: string;
  organisationId: string;
  legalEntityId: string;
  clinicId?: string;
  timesheetRecordId: string;
  workforcePersonId: string;
  periodStart: string;
  periodEnd: string;
  attendanceSessionIds: string[];
  ordinaryHourInputs: Array<{ code: string; hours: number; localDate?: string; notes?: string }>;
  overtimeHourInputs: Array<{ code: string; hours: number; localDate?: string; notes?: string }>;
  penaltyHourInputs: Array<{ code: string; hours: number; localDate?: string; notes?: string }>;
  leaveInputs: Array<{
    leaveRecordId: string;
    leaveTypeCode: string;
    hours: number;
    localStart: string;
    localEnd: string;
    sourceVersion: number;
  }>;
  allowanceInputs: Array<{
    allowanceCode: string;
    quantity: number;
    unit?: string;
    localDate?: string;
  }>;
  sourceVersion: number;
  approvalRevision: number;
  /** Platform-verified hash — preserved, not regenerated by M07. */
  contentHash: string;
  contractVersion: string;
  sourceEventId: string;
  sourceIdempotencyKey: string;
  sourceEventSequence: number;
  sourcePublishedAt: string;
  publisherId: string;
  /** Publication lifecycle observed at intake — not payroll approval. */
  publicationApprovalState: string;
  intakeStatus: "imported";
  intakenAt: string;
  intakenBy: string;
  immutable: true;
};

export type PublishedTimesheetSnapshotIndexEntry = {
  organisationId: string;
  legalEntityId: string;
  timesheetRecordId: string;
  sourceVersion: number;
  snapshotId: string;
  contentHash: string;
  registryPublicationId: string;
};

export type PublishedTimesheetCurrentIntakeIndex = {
  organisationId: string;
  legalEntityId: string;
  timesheetRecordId: string;
  latestSourceVersion: number;
  latestSnapshotId: string;
  updatedAt: string;
};

/** Checkpoint 2.5 — durable ordered replay cursor. */
export const M07_PUBLISHED_TIMESHEET_REPLAY_STREAM =
  "published-timesheet.lifecycle" as const;

export type PublishedTimesheetReplayOutcomeKind =
  | "intaken"
  | "duplicate-idempotent"
  | "rejected-ineligible"
  | "unsupported"
  | "malformed"
  | "conflict"
  | "blocked-gap"
  | "unavailable"
  | "retryable-failure"
  | "terminal-failure"
  | "later-lifecycle-required"
  | "lifecycle-hold-applied"
  | "lifecycle-lineage-recorded"
  | "lifecycle-material-pending-review";

export type PublishedTimesheetReplayCheckpoint = {
  id: string;
  organisationId: string;
  legalEntityId: string;
  /** Only set when the stream is clinic-partitioned; otherwise omitted. */
  clinicId?: string;
  streamPurpose: typeof M07_PUBLISHED_TIMESHEET_REPLAY_STREAM;
  contractVersion: string;
  lastCompletedEventSequence: number;
  lastCompletedEventId: string | null;
  checkpointVersion: number;
  updatedAt: string;
  status: "active" | "blocked-gap" | "blocked-conflict" | "unavailable";
  blockedReason?: string;
};

export type PublishedTimesheetReplayEventOutcome = {
  id: string;
  organisationId: string;
  legalEntityId: string;
  clinicId?: string;
  streamPurpose: typeof M07_PUBLISHED_TIMESHEET_REPLAY_STREAM;
  eventId: string;
  eventSequence: number;
  eventType: string;
  timesheetRecordId: string;
  affectedSourceVersion: number;
  contentHash?: string;
  outcome: PublishedTimesheetReplayOutcomeKind;
  reason?: string;
  snapshotId?: string;
  intakeStatus?: string;
  recordedAt: string;
  recordedBy: string;
};

/** Checkpoint 2.6 — M07 lifecycle projections (separate from platform source lifecycle). */
export type SnapshotEligibilityState =
  | "eligible"
  | "pending-review"
  | "held"
  | "disqualified"
  | "superseded";

export type OperationalHoldKind =
  | "none"
  | "revocation-hold"
  | "withdrawal-hold"
  | "invalidation-hold"
  | "revision-review-hold";

export type SupersessionSelectionState =
  | "none"
  | "pending-authorised-selection"
  | "selected";

/** Observational prep progress for lifecycle gates — not payment/accounting. */
export type PreparationProgressKind =
  | "not-started"
  | "started-not-approved"
  | "approved"
  | "exported"
  | "external-status-unknown";

export type PublishedTimesheetLifecycleProjection = {
  id: string;
  organisationId: string;
  legalEntityId: string;
  timesheetRecordId: string;
  hold: OperationalHoldKind;
  holdAppliedEventId?: string;
  holdReason?: string;
  selectedSnapshotId: string | null;
  supersessionState: SupersessionSelectionState;
  preparationProgress: PreparationProgressKind;
  /** Deterministic optimistic concurrency / stale-decision token. */
  projectionVersion: number;
  updatedAt: string;
};

export type PublishedTimesheetSnapshotEligibility = {
  id: string;
  organisationId: string;
  legalEntityId: string;
  timesheetRecordId: string;
  sourceVersion: number;
  snapshotId: string;
  contentHash: string;
  eligibility: SnapshotEligibilityState;
  eligibilityVersion: number;
  updatedAt: string;
};

export type PublishedTimesheetLifecycleDecisionKind =
  | "hold-clear"
  | "supersession-select"
  | "material-review-accept"
  | "material-review-reject"
  | "requalify"
  | "exception-resolve";

export type PublishedTimesheetLifecycleDecision = {
  id: string;
  organisationId: string;
  legalEntityId: string;
  timesheetRecordId: string;
  decisionKind: PublishedTimesheetLifecycleDecisionKind;
  sourceVersion?: number;
  snapshotId?: string;
  previousSnapshotId?: string;
  lifecycleEventId?: string;
  priorHold: OperationalHoldKind;
  resultingHold: OperationalHoldKind;
  priorEligibility?: SnapshotEligibilityState;
  resultingEligibility?: SnapshotEligibilityState;
  expectedProjectionVersion: number;
  actorUserId: string;
  permissionUsed: string;
  reason: string;
  decidedAt: string;
  decisionVersion: number;
  status: "accepted" | "rejected";
  rejectionReason?: string;
};

export type PublishedTimesheetLifecycleException = {
  id: string;
  organisationId: string;
  legalEntityId: string;
  timesheetRecordId: string;
  kind:
    | "prep-frozen-held"
    | "approved-blocked"
    | "exported-terminal"
    | "external-status-unknown"
    | "lifecycle-investigation";
  status: "open" | "resolved" | "terminal";
  preparationProgressAtCreate: PreparationProgressKind;
  sourceEventId?: string;
  snapshotId?: string;
  reason: string;
  createdAt: string;
  createdBy: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionReason?: string;
};

/** Idempotent record of applied registry lifecycle eventIds. */
export type PublishedTimesheetLifecycleEventApplication = {
  id: string;
  organisationId: string;
  legalEntityId: string;
  timesheetRecordId: string;
  eventId: string;
  eventType: string;
  eventSequence: number;
  outcome: string;
  reason?: string;
  appliedAt: string;
};
