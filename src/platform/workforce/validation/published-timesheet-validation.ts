/**
 * Validation for published timesheet contract and lifecycle events — CP 2.1.
 */

import {
  PUBLISHED_TIMESHEET_CONTRACT_VERSION,
  SUPPORTED_PUBLISHED_TIMESHEET_CONTRACT_VERSIONS,
  type PublishTimesheetInput,
  type PublishedTimesheetContractVersion,
  type PublishedTimesheetPayrollContent,
  type TimesheetApprovalState,
} from "../contracts/published-timesheet-contract";
import {
  TIMESHEET_APPROVAL_LIFECYCLE_EVENT_TYPES,
  type TimesheetApprovalLifecycleEvent,
  type TimesheetApprovalLifecycleEventType,
} from "../contracts/timesheet-approval-events";

export type PublishedTimesheetValidationIssue = {
  field: string;
  message: string;
};

export type PublishedTimesheetValidationResult =
  | { ok: true }
  | { ok: false; issues: PublishedTimesheetValidationIssue[] };

const APPROVAL_STATES: readonly TimesheetApprovalState[] = [
  "approved",
  "revised",
  "revoked",
  "restored",
  "withdrawn",
  "invalidated",
] as const;

/** Prohibited payroll-identity / payment fields — never accepted on published contract. */
export const PROHIBITED_PUBLISHED_TIMESHEET_FIELDS = [
  "tfn",
  "taxFileNumber",
  "bsb",
  "bankAccount",
  "bankAccountNumber",
  "accountNumber",
  "superannuationMemberNumber",
  "superMemberNumber",
  "superFundMemberId",
  "paymentReference",
  "iban",
  "routingNumber",
] as const;

export type ClinicMembershipCheck = (input: {
  organisationId: string;
  legalEntityId: string;
  clinicId: string;
}) => boolean;

function fail(issues: PublishedTimesheetValidationIssue[]): PublishedTimesheetValidationResult {
  return { ok: false, issues };
}

function requireString(
  value: unknown,
  field: string,
  issues: PublishedTimesheetValidationIssue[]
): void {
  if (typeof value !== "string" || !value.trim()) {
    issues.push({ field, message: `${field} is required` });
  }
}

function requirePositiveInt(
  value: unknown,
  field: string,
  issues: PublishedTimesheetValidationIssue[]
): void {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    issues.push({ field, message: `${field} must be a positive integer` });
  }
}

function scanProhibitedFields(
  value: unknown,
  path: string,
  issues: PublishedTimesheetValidationIssue[]
): void {
  if (value == null || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((v, i) => scanProhibitedFields(v, `${path}[${i}]`, issues));
    return;
  }
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const lower = key.toLowerCase();
    for (const banned of PROHIBITED_PUBLISHED_TIMESHEET_FIELDS) {
      if (lower === banned.toLowerCase()) {
        issues.push({
          field: path ? `${path}.${key}` : key,
          message: `Prohibited field ${key} is not allowed on published timesheet contract`,
        });
      }
    }
    scanProhibitedFields(child, path ? `${path}.${key}` : key, issues);
  }
}

export function isSupportedPublishedTimesheetContractVersion(
  version: unknown
): version is PublishedTimesheetContractVersion {
  return (
    typeof version === "string" &&
    (SUPPORTED_PUBLISHED_TIMESHEET_CONTRACT_VERSIONS as readonly string[]).includes(version)
  );
}

export function validatePublishedTimesheetContractVersion(
  version: unknown
): PublishedTimesheetValidationResult {
  if (version === undefined || version === null || version === "") {
    return fail([{ field: "contractVersion", message: "contractVersion is required" }]);
  }
  if (typeof version !== "string") {
    return fail([{ field: "contractVersion", message: "contractVersion must be a string" }]);
  }
  if (version === PUBLISHED_TIMESHEET_CONTRACT_VERSION) {
    return { ok: true };
  }
  // Known older unsupported or unknown newer — explicit rejection, no coercion.
  if (version.startsWith("published-timesheet.")) {
    return fail([
      {
        field: "contractVersion",
        message: `Unsupported published-timesheet contract version ${version}`,
      },
    ]);
  }
  return fail([
    {
      field: "contractVersion",
      message: `Unknown published-timesheet contract version ${version}`,
    },
  ]);
}

export function validatePublishedTimesheetPayrollContent(
  content: Partial<PublishedTimesheetPayrollContent> | null | undefined,
  options?: { clinicMembershipCheck?: ClinicMembershipCheck }
): PublishedTimesheetValidationResult {
  if (!content) return fail([{ field: "content", message: "Payroll content is required" }]);
  const issues: PublishedTimesheetValidationIssue[] = [];

  requireString(content.timesheetRecordId, "timesheetRecordId", issues);
  requireString(content.workforcePersonId, "workforcePersonId", issues);
  requireString(content.organisationId, "organisationId", issues);
  requireString(content.legalEntityId, "legalEntityId", issues);
  requireString(content.periodStart, "periodStart", issues);
  requireString(content.periodEnd, "periodEnd", issues);

  if (
    typeof content.organisationId === "string" &&
    typeof content.legalEntityId === "string" &&
    content.organisationId.trim() &&
    content.legalEntityId.trim() &&
    content.organisationId.trim() === content.legalEntityId.trim()
  ) {
    // Same string value is not automatically invalid (data coincidence), but
    // callers must still supply both independently — already required above.
    // Do not treat equality as derivation success.
  }

  if (!Array.isArray(content.attendanceSessionIds)) {
    issues.push({ field: "attendanceSessionIds", message: "attendanceSessionIds must be an array" });
  }
  if (!Array.isArray(content.ordinaryHourInputs)) {
    issues.push({ field: "ordinaryHourInputs", message: "ordinaryHourInputs must be an array" });
  }
  if (!Array.isArray(content.overtimeHourInputs)) {
    issues.push({ field: "overtimeHourInputs", message: "overtimeHourInputs must be an array" });
  }
  if (!Array.isArray(content.penaltyHourInputs)) {
    issues.push({ field: "penaltyHourInputs", message: "penaltyHourInputs must be an array" });
  }
  if (!Array.isArray(content.leaveInputs)) {
    issues.push({ field: "leaveInputs", message: "leaveInputs must be an array" });
  }
  if (!Array.isArray(content.allowanceInputs)) {
    issues.push({ field: "allowanceInputs", message: "allowanceInputs must be an array" });
  }

  const clinicId =
    content.clinicId !== undefined && content.clinicId !== null && String(content.clinicId).trim()
      ? String(content.clinicId).trim()
      : undefined;

  if (clinicId && options?.clinicMembershipCheck) {
    const org = String(content.organisationId ?? "").trim();
    const le = String(content.legalEntityId ?? "").trim();
    if (org && le && !options.clinicMembershipCheck({ organisationId: org, legalEntityId: le, clinicId })) {
      issues.push({
        field: "clinicId",
        message: "clinicId is not a valid member of the stated organisation and legal entity",
      });
    }
  }

  scanProhibitedFields(content, "", issues);

  return issues.length ? fail(issues) : { ok: true };
}

export function validatePublishTimesheetInput(
  input: Partial<PublishTimesheetInput> | null | undefined,
  options?: { clinicMembershipCheck?: ClinicMembershipCheck }
): PublishedTimesheetValidationResult {
  if (!input) return fail([{ field: "input", message: "Publish input is required" }]);
  const issues: PublishedTimesheetValidationIssue[] = [];

  const contentResult = validatePublishedTimesheetPayrollContent(input.content, options);
  if (!contentResult.ok) issues.push(...contentResult.issues);

  requirePositiveInt(input.sourceVersion, "sourceVersion", issues);
  requirePositiveInt(input.approvalRevision, "approvalRevision", issues);
  requireString(input.publishedAt, "publishedAt", issues);
  requireString(input.publisherId, "publisherId", issues);
  requireString(input.eventId, "eventId", issues);
  requireString(input.idempotencyKey, "idempotencyKey", issues);

  if (
    input.approvalState === undefined ||
    !APPROVAL_STATES.includes(input.approvalState as TimesheetApprovalState)
  ) {
    issues.push({ field: "approvalState", message: "approvalState is invalid" });
  }

  if (input.eventSequence !== undefined) {
    requirePositiveInt(input.eventSequence, "eventSequence", issues);
  }

  if (
    input.approvalState === "revoked" ||
    input.approvalState === "withdrawn" ||
    input.approvalState === "invalidated"
  ) {
    requireString(input.reasonCode, "reasonCode", issues);
  }

  scanProhibitedFields(input, "", issues);

  return issues.length ? fail(issues) : { ok: true };
}

export function validateTimesheetApprovalLifecycleEvent(
  event: Partial<TimesheetApprovalLifecycleEvent> | null | undefined
): PublishedTimesheetValidationResult {
  if (!event) return fail([{ field: "event", message: "Lifecycle event is required" }]);
  const issues: PublishedTimesheetValidationIssue[] = [];

  const versionResult = validatePublishedTimesheetContractVersion(event.contractVersion);
  if (!versionResult.ok) issues.push(...versionResult.issues);

  if (
    !event.eventType ||
    !(TIMESHEET_APPROVAL_LIFECYCLE_EVENT_TYPES as readonly string[]).includes(event.eventType)
  ) {
    issues.push({ field: "eventType", message: "Unknown timesheet approval lifecycle event type" });
  }

  requireString(event.eventId, "eventId", issues);
  requireString(event.idempotencyKey, "idempotencyKey", issues);
  requirePositiveInt(event.eventSequence, "eventSequence", issues);
  requireString(event.timesheetRecordId, "timesheetRecordId", issues);
  requirePositiveInt(event.affectedSourceVersion, "affectedSourceVersion", issues);
  requirePositiveInt(event.approvalRevision, "approvalRevision", issues);
  requireString(event.organisationId, "organisationId", issues);
  requireString(event.legalEntityId, "legalEntityId", issues);
  requireString(event.occurredAt, "occurredAt", issues);
  requireString(event.publisherId, "publisherId", issues);

  if (
    event.approvalState === undefined ||
    !APPROVAL_STATES.includes(event.approvalState as TimesheetApprovalState)
  ) {
    issues.push({ field: "approvalState", message: "approvalState is invalid" });
  }

  const needsReason =
    event.eventType === "timesheet.approval.revoked" ||
    event.eventType === "timesheet.record.withdrawn" ||
    event.eventType === "timesheet.record.invalidated";
  if (needsReason) requireString(event.reasonCode, "reasonCode", issues);

  const needsHash =
    event.eventType === "timesheet.approval.granted" ||
    event.eventType === "timesheet.approval.revised" ||
    event.eventType === "timesheet.approval.restored";
  if (needsHash) requireString(event.contentHash, "contentHash", issues);

  return issues.length ? fail(issues) : { ok: true };
}

export function eventTypeForApprovalState(
  state: TimesheetApprovalState
): TimesheetApprovalLifecycleEventType {
  switch (state) {
    case "approved":
      return "timesheet.approval.granted";
    case "revised":
      return "timesheet.approval.revised";
    case "revoked":
      return "timesheet.approval.revoked";
    case "restored":
      return "timesheet.approval.restored";
    case "withdrawn":
      return "timesheet.record.withdrawn";
    case "invalidated":
      return "timesheet.record.invalidated";
  }
}
