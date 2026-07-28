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
  at: string;
};
