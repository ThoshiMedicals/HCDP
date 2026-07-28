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
  /**
   * General record revision — increments on every successful mutation (including rate /
   * external-ID). Used for audit history; not pinned in Batch 5 approval manifests.
   */
  version: number;
  /**
   * Manifest-material revision — increments only when Batch 5 approval-integrity fields
   * change. Pinned in PayPeriodSourceManifest; rate/external-ID alone must not bump this.
   */
  materialProfileRevision: number;
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
  v6Ran?: boolean;
  v7Ran?: boolean;
  v8Ran?: boolean;
  v9Ran?: boolean;
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

// ---------------------------------------------------------------------------
// Batch 3 — non-certified preparation calculation, exceptions, leave prep
// ---------------------------------------------------------------------------

export type PayPrepExceptionKind =
  | "missing-rate"
  | "missing-classification"
  | "missing-classification-rule-map"
  | "ineligible-intake"
  | "doctor-pay-excluded"
  | "tenant-boundary-mismatch"
  | "clinic-boundary-mismatch"
  | "legal-entity-boundary-mismatch"
  | "missing-snapshot"
  | "unsupported-input"
  | "unsupported-penalty-input"
  | "leave-mapping-missing"
  | "unapproved-leave"
  | "unsupported-leave"
  | "missing-person"
  | "missing-profile"
  | "unknown-allowance-code"
  | "inactive-allowance-code"
  | "unsupported-allowance-input"
  | "unknown-deduction-code"
  | "inactive-deduction-code"
  | "unsupported-deduction-input"
  | "malformed-deduction-quantity";

/** Boundary / safety kinds — never waivable (Batch 4 OD-5). */
export const NON_WAIVABLE_EXCEPTION_KINDS: readonly PayPrepExceptionKind[] = [
  "doctor-pay-excluded",
  "tenant-boundary-mismatch",
  "clinic-boundary-mismatch",
  "legal-entity-boundary-mismatch",
  "ineligible-intake",
  "missing-snapshot",
  "unsupported-penalty-input",
  "unsupported-input",
] as const;

/** Explicitly waivable preparation kinds (Batch 4 OD-5). */
export const WAIVABLE_EXCEPTION_KINDS: readonly PayPrepExceptionKind[] = [
  "missing-rate",
  "missing-classification",
  "missing-classification-rule-map",
  "leave-mapping-missing",
  "unapproved-leave",
  "unsupported-leave",
  "missing-person",
  "missing-profile",
  "unknown-allowance-code",
  "inactive-allowance-code",
  "unsupported-allowance-input",
  "unknown-deduction-code",
  "inactive-deduction-code",
  "unsupported-deduction-input",
  "malformed-deduction-quantity",
] as const;

export type PayPrepExceptionStatus = "open" | "resolved" | "waived" | "cancelled";

export type PayPrepException = {
  id: string;
  legalEntityId: string;
  organisationId: string;
  clinicId?: string;
  periodId?: string;
  personId: string;
  kind: PayPrepExceptionKind;
  status: PayPrepExceptionStatus;
  message: string;
  snapshotId?: string;
  timesheetRecordId?: string;
  m04LeaveRecordId?: string;
  calculationBatchId?: string;
  version: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionReason?: string;
  waivedAt?: string;
  waivedBy?: string;
  waiverReason?: string;
  /** M02 projection key — stable for dedupe. */
  projectionKey: string;
};

export type PayPrepLineType = "ordinary" | "overtime" | "allowance" | "deduction";

/** Non-certified preparation line — not payable truth. */
export type PayPrepLine = {
  id: string;
  lineType: PayPrepLineType;
  /** Ordinary/OT hours; unused (0) for allowance/deduction quantity lines. */
  hours: number;
  /** Allowance/deduction quantity or units. */
  quantity?: number;
  unitDescription?: string;
  code?: string;
  codeId?: string;
  codeVersion?: number;
  localDate?: string;
  notes?: string;
  ruleId: string;
  ruleVersion: number;
  snapshotId?: string;
  contentHash?: string;
  timesheetRecordId?: string;
  /** Source snapshot version when known. */
  sourceVersion?: number;
  deductionInputId?: string;
  deductionInputVersion?: number;
  certified: false;
  disclaimer: typeof M07_NON_CERTIFIED_DISCLAIMER;
};

/** Manual M07 deduction source input — distinct from calculation outputs (OD-3). */
export type DeductionPrepInputStatus = "active" | "superseded" | "cancelled";

export type DeductionPrepInput = {
  id: string;
  legalEntityId: string;
  organisationId: string;
  clinicId?: string;
  personId: string;
  periodId: string;
  codeId: string;
  codeVersion: number;
  code: string;
  quantity: number;
  unitDescription?: string;
  effectiveDate?: string;
  reason: string;
  status: DeductionPrepInputStatus;
  version: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  supersedesInputId?: string | null;
  cancelledAt?: string;
  cancelledBy?: string;
  cancelReason?: string;
  certified: false;
  disclaimer: typeof M07_NON_CERTIFIED_DISCLAIMER;
};

/** Informational M05 vs M06 variance view — not blocking (OD-4). */
export type VarianceComparisonStatus =
  | "compared"
  | "unavailable"
  | "incomplete"
  | "excluded";

export type VariancePersonView = {
  personId: string;
  legalEntityId: string;
  clinicId?: string;
  periodId: string;
  status: VarianceComparisonStatus;
  message?: string;
  rosterOrdinaryHours: number | null;
  rosterOvertimeHours: number | null;
  workedOrdinaryHours: number | null;
  workedOvertimeHours: number | null;
  ordinaryDelta: number | null;
  overtimeDelta: number | null;
  disclaimer: typeof M07_NON_CERTIFIED_DISCLAIMER;
  informationalOnly: true;
};

export type PayCalculationBatchStatus =
  | "completed"
  | "blocked"
  | "partial"
  | "superseded";

export type PayCalculationBatch = {
  id: string;
  legalEntityId: string;
  organisationId: string;
  periodId: string;
  personId: string;
  clinicId?: string;
  profileId: string;
  batchVersion: number;
  status: PayCalculationBatchStatus;
  ruleId: string;
  ruleVersion: number;
  snapshotId: string;
  contentHash: string;
  lines: PayPrepLine[];
  exceptionIds: string[];
  certified: false;
  disclaimer: typeof M07_NON_CERTIFIED_DISCLAIMER;
  calculatedAt: string;
  calculatedBy: string;
  /** Prior batch id this recalculation supersedes (if any). */
  supersedesBatchId?: string | null;
};

export type LeavePrepLineStatus = "prepared" | "blocked";

/** Separate non-certified leave preparation line — M04 leave SoT only. */
export type LeavePrepLine = {
  id: string;
  legalEntityId: string;
  organisationId: string;
  clinicId?: string;
  periodId: string;
  personId: string;
  m04LeaveRecordId: string;
  m04LeaveVersion: number;
  leaveType: string;
  startDate: string;
  endDate: string;
  /** Inclusive calendar days from M04 dates — not award hours. */
  leaveDays: number;
  leavePayMapping?: string | null;
  status: LeavePrepLineStatus;
  exceptionId?: string;
  certified: false;
  disclaimer: typeof M07_NON_CERTIFIED_DISCLAIMER;
  createdAt: string;
  createdBy: string;
  version: number;
};

export type ClassificationResolveStatus =
  | "resolved"
  | "missing-classification"
  | "missing-classification-rule-map"
  | "missing-rate"
  | "doctor-pay-excluded"
  | "missing-person"
  | "missing-profile"
  | "legal-entity-boundary-mismatch";

export type ClassificationResolveResult = {
  status: ClassificationResolveStatus;
  personId: string;
  legalEntityId: string;
  classificationRef?: string | null;
  mappingId?: string;
  ruleId?: string;
  ruleVersion?: number;
  ordinaryHourlyRate?: number | null;
  exceptionKind?: PayPrepExceptionKind;
  message?: string;
};

// ---------------------------------------------------------------------------
// Batch 5 — preparation readiness + management approval (non-certified)
// ---------------------------------------------------------------------------

/** Management approval of a non-certified payroll-preparation dataset — not certification or payment. */
export type PayPeriodApprovalStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "rejected"
  | "withdrawn"
  | "stale"
  | "superseded";

export type EligiblePopulationExclusionReason =
  | "doctor-m08-excluded"
  | "inactive-outside-period"
  | "terminated-outside-period"
  | "future-starter"
  | "not-assigned-to-legal-entity"
  | "clinic-assignment-outside-period"
  | "authorised-period-exclusion";

/** Fail-closed population blockers — person remains visible, not silently omitted. */
export type EligiblePopulationBlocker = {
  personId: string;
  field:
    | "employmentStatus"
    | "employmentEffectiveFrom"
    | "employmentEffectiveTo"
    | "clinicId"
    | "clinicAssignmentEffectiveFrom"
    | "organisationId"
    | "ambiguous-employment-dates"
    | "ambiguous-clinic-assignment";
  message: string;
  legalEntityId: string;
  periodId: string;
  clinicId?: string;
};

export type EligiblePopulationMember = {
  personId: string;
  clinicId: string;
  organisationId: string;
  legalEntityId: string;
  displayLabel: string;
  source: "m06-snapshot" | "m07-profile" | "both";
  snapshotIds: string[];
  profileId?: string;
};

export type EligiblePopulationExclusion = {
  personId: string;
  reason: EligiblePopulationExclusionReason;
  rule: string;
  message: string;
  actor?: string;
  timestamp?: string;
  clinicId?: string;
};

export type EligiblePopulationResolveStatus =
  | "resolved"
  | "incomplete"
  | "blocked";

export type EligiblePopulationResult = {
  status: EligiblePopulationResolveStatus;
  legalEntityId: string;
  periodId: string;
  periodStart: string;
  periodEnd: string;
  /** Clinics in scope for this period (explicit tags or discovered eligible set). */
  includedClinicIds: string[];
  eligible: EligiblePopulationMember[];
  exclusions: EligiblePopulationExclusion[];
  /** Visible fail-closed blockers (missing/ambiguous employment or clinic context). */
  populationBlockers: EligiblePopulationBlocker[];
  blockingReasons: string[];
  version: number;
  resolvedAt: string;
};

export type PersonReadinessStatus = "ready" | "blocked" | "excluded" | "incomplete";

export type PersonReadiness = {
  personId: string;
  clinicId?: string;
  status: PersonReadinessStatus;
  blockingReasons: string[];
  calculationBatchId?: string;
  calculationBatchVersion?: number;
  snapshotId?: string;
  exclusionReason?: EligiblePopulationExclusionReason;
};

export type ClinicReadiness = {
  clinicId: string;
  status: "ready" | "incomplete" | "blocked";
  eligibleCount: number;
  readyCount: number;
  blockedCount: number;
  excludedCount: number;
  blockingReasons: string[];
};

export type PeriodReadinessStatus = "ready" | "incomplete" | "blocked";

export type PeriodReadiness = {
  legalEntityId: string;
  periodId: string;
  status: PeriodReadinessStatus;
  version: number;
  includedClinicIds: string[];
  eligiblePersonCount: number;
  readyPersonCount: number;
  blockedPersonCount: number;
  excludedPersonCount: number;
  clinics: ClinicReadiness[];
  people: PersonReadiness[];
  exclusions: EligiblePopulationExclusion[];
  /** Fail-closed population blockers — person remains visible. */
  populationBlockers: EligiblePopulationBlocker[];
  blockingReasons: string[];
  /** UI copy — never payment/certification. */
  exportReadyWording: "Ready for non-certified export preparation — not certified or payment-ready.";
  disclaimer: typeof M07_NON_CERTIFIED_DISCLAIMER;
  assessedAt: string;
};

export type PayPeriodSourceManifest = {
  tenantId: string;
  legalEntityId: string;
  periodId: string;
  periodVersion: number;
  includedClinicIds: string[];
  eligiblePersonIds: string[];
  calculations: Array<{
    personId: string;
    batchId: string;
    batchVersion: number;
    snapshotId: string;
    snapshotSourceVersion: number;
    contentHash: string;
  }>;
  profiles: Array<{
    personId: string;
    profileId: string;
    /**
     * Pinned Batch 5 material profile revision (not general `PayProfile.version`).
     * Rate-only / external-ID mutations must not change this value.
     */
    materialProfileRevision: number;
    classificationRef: string | null;
    mappingId?: string;
    mappingVersion?: number;
  }>;
  deductionInputs: Array<{
    personId: string;
    inputId: string;
    inputVersion: number;
  }>;
  leavePrep: Array<{
    personId: string;
    leavePrepLineId: string;
    m04LeaveRecordId: string;
    m04LeaveVersion?: number | string;
  }>;
  exceptions: Array<{
    id: string;
    personId: string;
    status: PayPrepExceptionStatus;
    version: number;
    kind: PayPrepExceptionKind;
    waivedBy?: string;
    waiverReason?: string;
  }>;
  exclusions: EligiblePopulationExclusion[];
  readinessStatus: PeriodReadinessStatus;
  readinessVersion: number;
  /** Canonical checksum over ordered manifest body (excluding this field). */
  checksum: string;
  submittedBy?: string;
  submittedAt?: string;
};

export type PayPeriodApproval = {
  id: string;
  /** Stable logical identity: approval::{legalEntityId}::{periodId} */
  logicalKey: string;
  approvalVersion: number;
  status: PayPeriodApprovalStatus;
  legalEntityId: string;
  organisationId: string;
  periodId: string;
  manifest: PayPeriodSourceManifest;
  submittedBy?: string;
  submittedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  withdrawnBy?: string;
  withdrawnAt?: string;
  withdrawalReason?: string;
  staleAt?: string;
  staleReason?: string;
  supersedesApprovalId?: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  /** Always management approval of non-certified prep — never certification/payment. */
  managementApprovalOnly: true;
  certified: false;
  paymentReady: false;
  disclaimer: typeof M07_NON_CERTIFIED_DISCLAIMER;
};

// ---------------------------------------------------------------------------
// Batch 6 — payroll export preparation, reconciliation, period lock (non-payment)
// ---------------------------------------------------------------------------

export const M07_CANONICAL_EXPORT_FORMAT_VERSION = "canonical-export-v1" as const;

export type PayrollExportBatchStatus =
  | "draft"
  | "validating"
  | "blocked"
  | "ready"
  | "finalized"
  | "downloadable"
  | "superseded"
  | "cancelled";

export type ExportValidationSeverity = "blocking" | "warning";

export type ExportValidationIssue = {
  code: string;
  severity: ExportValidationSeverity;
  message: string;
  personId?: string;
  profileId?: string;
  sourceLineId?: string;
  field?: string;
  mapping?: string;
  legalEntityId: string;
  periodId: string;
  batchId?: string;
  remediation?: string;
};

export type CanonicalExportLineCategory =
  | "ordinary"
  | "overtime"
  | "leave"
  | "allowance"
  | "deduction";

/** Provider-neutral canonical export line — not a payroll-provider payload. */
export type CanonicalExportLine = {
  lineId: string;
  externalPayrollEmployeeId: string;
  personId: string;
  legalEntityId: string;
  periodId: string;
  periodRef: string;
  clinicId?: string;
  category: CanonicalExportLineCategory;
  lineClassification: string;
  externalCode: string;
  units: number;
  unitKind: "hours" | "days" | "quantity";
  /** Amount only when export profile allows rates/money; otherwise omitted. */
  amount?: number;
  rate?: number;
  sourceLineId: string;
  sourceBatchId?: string;
  sourceRef: string;
  reconRef: string;
  ruleId?: string;
  ruleVersion?: number;
  exceptionIds?: string[];
};

export type CanonicalExportPackage = {
  formatVersion: typeof M07_CANONICAL_EXPORT_FORMAT_VERSION;
  legalEntityId: string;
  organisationId: string;
  periodId: string;
  periodRef: string;
  approvalId: string;
  sourceManifestChecksum: string;
  exportBatchId: string;
  batchRevision: number;
  lines: CanonicalExportLine[];
  totals: ExportBatchTotals;
  generatedAt: string;
  previewOnly: boolean;
  certified: false;
  paymentReady: false;
  disclaimer: typeof M07_NON_CERTIFIED_DISCLAIMER;
};

export type ExportBatchTotals = {
  lineCount: number;
  workerCount: number;
  ordinaryHours: number;
  overtimeHours: number;
  leaveDays: number;
  allowanceUnits: number;
  deductionUnits: number;
  /** Present only when amounts included. */
  grossAmount?: number;
};

export type ExportArtifactMeta = {
  contentType: "text/csv" | "application/json";
  filename: string;
  checksum: string;
  byteLength: number;
  formatVersion: string;
  createdAt: string;
};

export type ExportDownloadRecord = {
  id: string;
  downloadedAt: string;
  downloadedBy: string;
  artifactChecksum: string;
  correlationKey: string;
};

export type PayrollExportBatch = {
  id: string;
  /** Deterministic identity key (logical). */
  identityKey: string;
  legalEntityId: string;
  organisationId: string;
  periodId: string;
  approvalId: string;
  sourceManifestChecksum: string;
  formatVersion: typeof M07_CANONICAL_EXPORT_FORMAT_VERSION;
  exportProfileId: string;
  exportProfileVersion: number;
  batchRevision: number;
  status: PayrollExportBatchStatus;
  createdAt: string;
  createdBy: string;
  preparedAt?: string;
  preparedBy?: string;
  finalizedAt?: string;
  finalizedBy?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancelReason?: string;
  supersededAt?: string;
  supersedesBatchId?: string | null;
  supersededByBatchId?: string | null;
  sourceVerificationOk: boolean;
  sourceVerificationMessage?: string;
  validationIssues: ExportValidationIssue[];
  reconciliationId?: string | null;
  reconciliationStatus?: ReconciliationStatus | null;
  totals: ExportBatchTotals;
  lineCount: number;
  canonicalPreview?: CanonicalExportPackage | null;
  /** Immutable finalized canonical snapshot (JSON). */
  finalizedCanonical?: CanonicalExportPackage | null;
  artifact?: ExportArtifactMeta | null;
  /** Stored CSV body for secure download (demo local storage). */
  artifactBody?: string | null;
  downloadHistory: ExportDownloadRecord[];
  lockId?: string | null;
  certified: false;
  paymentReady: false;
  disclaimer: typeof M07_NON_CERTIFIED_DISCLAIMER;
};

export type ReconciliationMismatchCode =
  | "population-mismatch"
  | "line-count-mismatch"
  | "source-line-coverage"
  | "ordinary-total-mismatch"
  | "overtime-total-mismatch"
  | "leave-total-mismatch"
  | "allowance-total-mismatch"
  | "deduction-total-mismatch"
  | "gross-total-mismatch"
  | "legal-entity-mismatch"
  | "period-mismatch"
  | "manifest-checksum-mismatch"
  | "zero-value-policy"
  | "negative-value-policy"
  | "line-reference-mismatch";

export type ReconciliationStatus = "matched" | "warning" | "blocked" | "failed";

export type ReconciliationMismatch = {
  code: ReconciliationMismatchCode;
  severity: ExportValidationSeverity;
  message: string;
  expected?: string | number;
  actual?: string | number;
  difference?: number;
  personId?: string;
  sourceLineId?: string;
  exportLineId?: string;
};

export type PackageReconciliation = {
  id: string;
  legalEntityId: string;
  organisationId: string;
  periodId: string;
  approvalId: string;
  exportBatchId: string;
  sourceManifestChecksum: string;
  exportChecksum: string;
  status: ReconciliationStatus;
  expectedTotals: ExportBatchTotals;
  actualTotals: ExportBatchTotals;
  mismatches: ReconciliationMismatch[];
  reconciledAt: string;
  reconciledBy: string;
  certified: false;
  disclaimer: typeof M07_NON_CERTIFIED_DISCLAIMER;
};

export type PeriodLockRecord = {
  id: string;
  legalEntityId: string;
  organisationId: string;
  periodId: string;
  approvalId: string;
  exportBatchId: string;
  reconciliationId: string;
  sourceManifestChecksum: string;
  exportChecksum: string;
  lockedAt: string;
  lockedBy: string;
  reason: string;
  status: "active" | "unlocked";
  unlockedAt?: string;
  unlockedBy?: string;
  unlockRequestId?: string;
};

export type PeriodUnlockRequestStatus =
  | "requested"
  | "approved"
  | "rejected"
  | "cancelled";

export type PeriodUnlockRequest = {
  id: string;
  logicalKey: string;
  legalEntityId: string;
  organisationId: string;
  periodId: string;
  lockId: string;
  status: PeriodUnlockRequestStatus;
  reason: string;
  supportingNote?: string;
  requestedAt: string;
  requestedBy: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewReason?: string;
  projectionKey: string;
  version: number;
};
