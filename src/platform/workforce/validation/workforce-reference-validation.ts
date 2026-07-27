import type { SourceRecordRef } from "@/platform/contracts/source-record";
import { isValidSourceRecordRef } from "@/platform/validation";
import {
  WORKFORCE_CONTRACT_VERSION,
  type WorkforceRefBase,
  type WorkforceOwningModuleId,
} from "../contracts/common";
import type { WorkforcePersonRef } from "../contracts/workforce-person-ref";
import type { EngagementRef } from "../contracts/engagement-ref";
import type { ReadinessRef } from "../contracts/readiness-ref";
import type { CredentialRef } from "../contracts/credential-ref";
import type { TrainingStatusRef } from "../contracts/training-status-ref";
import type { ShiftRef } from "../contracts/shift-ref";
import type { AttendanceRef } from "../contracts/attendance-ref";
import type { TimesheetRef } from "../contracts/timesheet-ref";
import type { PayPeriodRef } from "../contracts/pay-period-ref";
import type { CandidateRef } from "../contracts/candidate-ref";
import type { WorkforceEventEnvelope, WorkforceEventType } from "../contracts/workforce-events";
import { WORKFORCE_EVENT_TYPES } from "../contracts/workforce-events";

export type WorkforceValidationIssue = {
  field: string;
  message: string;
};

export type WorkforceValidationResult =
  | { ok: true }
  | { ok: false; issues: WorkforceValidationIssue[] };

function fail(issues: WorkforceValidationIssue[]): WorkforceValidationResult {
  return { ok: false, issues };
}

function requireString(
  value: unknown,
  field: string,
  issues: WorkforceValidationIssue[]
): void {
  if (typeof value !== "string" || !value.trim()) {
    issues.push({ field, message: `${field} is required` });
  }
}

const OWNERS: readonly WorkforceOwningModuleId[] = [
  "staff-doctors",
  "roster",
  "time-attendance",
  "staff-pay",
  "training",
  "recruitment",
];

export function validateWorkforceRefBase(
  ref: Partial<WorkforceRefBase> | null | undefined,
  expectedOwner?: WorkforceOwningModuleId
): WorkforceValidationResult {
  if (!ref) return fail([{ field: "ref", message: "Reference is missing" }]);
  const issues: WorkforceValidationIssue[] = [];

  if (ref.contractVersion !== WORKFORCE_CONTRACT_VERSION) {
    issues.push({
      field: "contractVersion",
      message: `Expected contractVersion ${WORKFORCE_CONTRACT_VERSION}`,
    });
  }
  requireString(ref.owningModuleId, "owningModuleId", issues);
  requireString(ref.recordId, "recordId", issues);
  requireString(ref.status, "status", issues);
  requireString(ref.route, "route", issues);
  requireString(ref.displayLabel, "displayLabel", issues);

  if (ref.owningModuleId && !OWNERS.includes(ref.owningModuleId as WorkforceOwningModuleId)) {
    issues.push({ field: "owningModuleId", message: "Unknown owning module" });
  }
  if (expectedOwner && ref.owningModuleId && ref.owningModuleId !== expectedOwner) {
    issues.push({
      field: "owningModuleId",
      message: `Expected owning module ${expectedOwner}`,
    });
  }

  return issues.length ? fail(issues) : { ok: true };
}

export function validateWorkforcePersonRef(
  ref: Partial<WorkforcePersonRef> | null | undefined
): WorkforceValidationResult {
  const base = validateWorkforceRefBase(ref, "staff-doctors");
  if (!base.ok) return base;
  const issues: WorkforceValidationIssue[] = [];
  requireString(ref?.preferredName, "preferredName", issues);
  requireString(ref?.personKind, "personKind", issues);
  return issues.length ? fail(issues) : { ok: true };
}

export function validateEngagementRef(
  ref: Partial<EngagementRef> | null | undefined
): WorkforceValidationResult {
  const base = validateWorkforceRefBase(ref, "staff-doctors");
  if (!base.ok) return base;
  const issues: WorkforceValidationIssue[] = [];
  requireString(ref?.personId, "personId", issues);
  requireString(ref?.roleLabel, "roleLabel", issues);
  requireString(ref?.effectiveFrom, "effectiveFrom", issues);
  return issues.length ? fail(issues) : { ok: true };
}

export function validateReadinessRef(
  ref: Partial<ReadinessRef> | null | undefined
): WorkforceValidationResult {
  const base = validateWorkforceRefBase(ref, "staff-doctors");
  if (!base.ok) return base;
  const issues: WorkforceValidationIssue[] = [];
  requireString(ref?.personId, "personId", issues);
  requireString(ref?.readiness, "readiness", issues);
  requireString(ref?.asOf, "asOf", issues);
  if (!Array.isArray(ref?.blockers)) {
    issues.push({ field: "blockers", message: "blockers must be an array" });
  }
  return issues.length ? fail(issues) : { ok: true };
}

export function validateCredentialRef(
  ref: Partial<CredentialRef> | null | undefined
): WorkforceValidationResult {
  const base = validateWorkforceRefBase(ref, "staff-doctors");
  if (!base.ok) return base;
  const issues: WorkforceValidationIssue[] = [];
  requireString(ref?.personId, "personId", issues);
  requireString(ref?.credentialType, "credentialType", issues);
  if (typeof ref?.verified !== "boolean") {
    issues.push({ field: "verified", message: "verified must be boolean" });
  }
  return issues.length ? fail(issues) : { ok: true };
}

export function validateTrainingStatusRef(
  ref: Partial<TrainingStatusRef> | null | undefined
): WorkforceValidationResult {
  const base = validateWorkforceRefBase(ref, "training");
  if (!base.ok) return base;
  const issues: WorkforceValidationIssue[] = [];
  requireString(ref?.personId, "personId", issues);
  requireString(ref?.requirementId, "requirementId", issues);
  requireString(ref?.requirementLabel, "requirementLabel", issues);
  if (typeof ref?.competencyMet !== "boolean") {
    issues.push({ field: "competencyMet", message: "competencyMet must be boolean" });
  }
  return issues.length ? fail(issues) : { ok: true };
}

export function validateShiftRef(
  ref: Partial<ShiftRef> | null | undefined
): WorkforceValidationResult {
  const base = validateWorkforceRefBase(ref, "roster");
  if (!base.ok) return base;
  const issues: WorkforceValidationIssue[] = [];
  requireString(ref?.rosterPeriodId, "rosterPeriodId", issues);
  requireString(ref?.startsAt, "startsAt", issues);
  requireString(ref?.endsAt, "endsAt", issues);
  if (typeof ref?.published !== "boolean") {
    issues.push({ field: "published", message: "published must be boolean" });
  }
  return issues.length ? fail(issues) : { ok: true };
}

export function validateAttendanceRef(
  ref: Partial<AttendanceRef> | null | undefined
): WorkforceValidationResult {
  const base = validateWorkforceRefBase(ref, "time-attendance");
  if (!base.ok) return base;
  const issues: WorkforceValidationIssue[] = [];
  requireString(ref?.personId, "personId", issues);
  requireString(ref?.eventType, "eventType", issues);
  requireString(ref?.occurredAt, "occurredAt", issues);
  return issues.length ? fail(issues) : { ok: true };
}

export function validateTimesheetRef(
  ref: Partial<TimesheetRef> | null | undefined
): WorkforceValidationResult {
  const base = validateWorkforceRefBase(ref, "time-attendance");
  if (!base.ok) return base;
  const issues: WorkforceValidationIssue[] = [];
  requireString(ref?.personId, "personId", issues);
  requireString(ref?.periodStart, "periodStart", issues);
  requireString(ref?.periodEnd, "periodEnd", issues);
  if (typeof ref?.approved !== "boolean") {
    issues.push({ field: "approved", message: "approved must be boolean" });
  }
  return issues.length ? fail(issues) : { ok: true };
}

export function validatePayPeriodRef(
  ref: Partial<PayPeriodRef> | null | undefined
): WorkforceValidationResult {
  const base = validateWorkforceRefBase(ref, "staff-pay");
  if (!base.ok) return base;
  const issues: WorkforceValidationIssue[] = [];
  requireString(ref?.periodStart, "periodStart", issues);
  requireString(ref?.periodEnd, "periodEnd", issues);
  if (typeof ref?.exportCreated !== "boolean") {
    issues.push({ field: "exportCreated", message: "exportCreated must be boolean" });
  }
  if (typeof ref?.locked !== "boolean") {
    issues.push({ field: "locked", message: "locked must be boolean" });
  }
  return issues.length ? fail(issues) : { ok: true };
}

export function validateCandidateRef(
  ref: Partial<CandidateRef> | null | undefined
): WorkforceValidationResult {
  const base = validateWorkforceRefBase(ref, "recruitment");
  if (!base.ok) return base;
  const issues: WorkforceValidationIssue[] = [];
  requireString(ref?.preferredName, "preferredName", issues);
  requireString(ref?.stage, "stage", issues);
  return issues.length ? fail(issues) : { ok: true };
}

export function validateWorkforceEvent(
  event: Partial<WorkforceEventEnvelope> | null | undefined
): WorkforceValidationResult {
  if (!event) return fail([{ field: "event", message: "Event is missing" }]);
  const issues: WorkforceValidationIssue[] = [];

  if (event.contractVersion !== WORKFORCE_CONTRACT_VERSION) {
    issues.push({
      field: "contractVersion",
      message: `Expected contractVersion ${WORKFORCE_CONTRACT_VERSION}`,
    });
  }
  requireString(event.eventId, "eventId", issues);
  requireString(event.eventType, "eventType", issues);
  requireString(event.occurredAt, "occurredAt", issues);
  requireString(event.activeIdentityId, "activeIdentityId", issues);

  if (typeof event.sourceVersion !== "number" || Number.isNaN(event.sourceVersion)) {
    issues.push({ field: "sourceVersion", message: "sourceVersion must be a number" });
  }
  if (
    event.eventType &&
    !WORKFORCE_EVENT_TYPES.includes(event.eventType as WorkforceEventType)
  ) {
    issues.push({ field: "eventType", message: "Unknown workforce event type" });
  }
  if (!isValidSourceRecordRef(event.source as SourceRecordRef | undefined)) {
    issues.push({ field: "source", message: "source must be a valid SourceRecordRef" });
  }

  return issues.length ? fail(issues) : { ok: true };
}
