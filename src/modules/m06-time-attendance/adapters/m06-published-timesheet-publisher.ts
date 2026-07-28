/**
 * M06 → platform published-timesheet publisher (Checkpoint 2.2).
 *
 * Dependency direction:
 *   M06 approved source state
 *   → this adapter (mapping only)
 *   → platform contract validation + hash verification
 *   → platform PublishedTimesheetRegistry
 *
 * Does not import M07. Does not write pulse.m07.*.
 * Does not duplicate hashing/validation — platform owns those.
 */

import {
  PUBLISHED_TIMESHEET_CONTRACT_VERSION,
  type PublishTimesheetInput,
  type PublishedTimesheetPayrollContent,
  type TimesheetApprovalState,
} from "@/platform/workforce/contracts/published-timesheet-contract";
import { calculatePayrollContentHash } from "@/platform/workforce/contracts/published-timesheet-hash";
import {
  publishTimesheetVersion,
  PublishedTimesheetRegistryError,
  type PublishTimesheetResult,
} from "@/platform/workforce/services/published-timesheet-registry";
import type { ClinicMembershipCheck } from "@/platform/workforce/validation/published-timesheet-validation";
import type {
  PlatformPublicationIntent,
  PlatformPublicationOutboxItem,
  TimesheetRecord,
  TimesheetState,
} from "../types/domain";

export type M06PublicationEligibilityFailure = {
  ok: false;
  code: string;
  message: string;
};

export type M06PublicationEligibilitySuccess = {
  ok: true;
  content: PublishedTimesheetPayrollContent;
  contentHash: string;
  approvalState: TimesheetApprovalState;
};

const NON_PUBLISHABLE_FOR_GRANT: TimesheetState[] = ["draft", "submitted", "rejected", "reopened"];

/**
 * Eligibility gate for M06 operational publication intents.
 * Draft/submitted/rejected/disputed-equivalent states must not publish as granted.
 */
export function assertTimesheetStateEligibleForIntent(
  state: TimesheetState,
  intent: PlatformPublicationIntent
): M06PublicationEligibilityFailure | null {
  if (intent === "granted" || intent === "revised" || intent === "restored") {
    if (NON_PUBLISHABLE_FOR_GRANT.includes(state) || state !== "approved") {
      return {
        ok: false,
        code: "STATE_NOT_ELIGIBLE",
        message: `Timesheet state ${state} is not eligible for ${intent} publication`,
      };
    }
  }
  if (intent === "revoked") {
    // Operational reopen leaves state=reopened; revoke may also run while still approved mid-transition.
    if (state !== "reopened" && state !== "approved") {
      return {
        ok: false,
        code: "STATE_NOT_ELIGIBLE",
        message: `Timesheet state ${state} is not eligible for revoked publication`,
      };
    }
  }
  return null;
}

const INTENT_TO_APPROVAL_STATE: Record<PlatformPublicationIntent, TimesheetApprovalState> = {
  granted: "approved",
  revised: "revised",
  revoked: "revoked",
  restored: "restored",
  withdrawn: "withdrawn",
  invalidated: "invalidated",
};

/** Map approved aggregated minutes to structured ordinary-hour input (M06 has no OT/penalty buckets). */
export function mapOrdinaryHoursFromTotalMinutes(totalMinutes: number): {
  code: string;
  hours: number;
}[] {
  const hours = Math.round((totalMinutes / 60) * 1000) / 1000;
  return [{ code: "ORD", hours }];
}

/**
 * Build platform payroll content from an outbox snapshot.
 * M06 SoT: sessions + totalMinutes. Leave/OT/penalty/allowance arrays empty unless
 * future M06 structured approved inputs exist (not invented here).
 */
export function mapOutboxItemToPayrollContent(
  item: PlatformPublicationOutboxItem
): PublishedTimesheetPayrollContent {
  return {
    timesheetRecordId: item.timesheetId,
    workforcePersonId: item.contentSnapshot.workforcePersonId,
    organisationId: item.organisationId,
    legalEntityId: item.legalEntityId,
    clinicId: item.clinicId,
    periodStart: item.contentSnapshot.periodStart,
    periodEnd: item.contentSnapshot.periodEnd,
    attendanceSessionIds: [...item.contentSnapshot.attendanceSessionIds],
    ordinaryHourInputs: mapOrdinaryHoursFromTotalMinutes(item.contentSnapshot.totalMinutes),
    overtimeHourInputs: [],
    penaltyHourInputs: [],
    leaveInputs: [],
    allowanceInputs: [],
  };
}

export function evaluatePublicationEligibility(
  item: PlatformPublicationOutboxItem,
  options?: { clinicMembershipCheck?: ClinicMembershipCheck }
): M06PublicationEligibilitySuccess | M06PublicationEligibilityFailure {
  if (!item.organisationId?.trim()) {
    return { ok: false, code: "MISSING_ORGANISATION", message: "organisationId is required for publication" };
  }
  if (!item.legalEntityId?.trim()) {
    return { ok: false, code: "MISSING_LEGAL_ENTITY", message: "legalEntityId is required for publication" };
  }
  if (!item.timesheetId?.trim()) {
    return { ok: false, code: "MISSING_RECORD", message: "timesheetRecordId is required" };
  }
  if (!item.contentSnapshot.workforcePersonId?.trim()) {
    return { ok: false, code: "MISSING_PERSON", message: "workforcePersonId is required" };
  }
  if (!item.contentSnapshot.periodStart?.trim() || !item.contentSnapshot.periodEnd?.trim()) {
    return { ok: false, code: "MISSING_PERIOD", message: "periodStart and periodEnd are required" };
  }
  if (!Number.isInteger(item.sourceVersion) || item.sourceVersion < 1) {
    return { ok: false, code: "INVALID_SOURCE_VERSION", message: "sourceVersion must be a positive integer" };
  }
  if (!Number.isInteger(item.approvalRevision) || item.approvalRevision < 1) {
    return {
      ok: false,
      code: "INVALID_APPROVAL_REVISION",
      message: "approvalRevision must be a positive integer",
    };
  }
  if (!item.eventId?.trim() || !item.idempotencyKey?.trim()) {
    return { ok: false, code: "MISSING_EVENT_IDENTITY", message: "eventId and idempotencyKey are required" };
  }
  if (!Number.isInteger(item.eventSequence) || item.eventSequence < 1) {
    return { ok: false, code: "INVALID_EVENT_SEQUENCE", message: "eventSequence must be a positive integer" };
  }
  if (!item.clinicId?.trim()) {
    return { ok: false, code: "MISSING_CLINIC", message: "clinicId is required where clinic-scoped" };
  }
  if (options?.clinicMembershipCheck) {
    const ok = options.clinicMembershipCheck({
      organisationId: item.organisationId,
      legalEntityId: item.legalEntityId,
      clinicId: item.clinicId,
    });
    if (!ok) {
      return {
        ok: false,
        code: "CLINIC_MEMBERSHIP",
        message: "clinicId is not valid under the stated organisation and legal entity",
      };
    }
  }

  const content = mapOutboxItemToPayrollContent(item);
  let contentHash: string;
  try {
    contentHash = calculatePayrollContentHash(content);
  } catch (err) {
    return {
      ok: false,
      code: "CANONICALIZATION",
      message: err instanceof Error ? err.message : "canonicalization failed",
    };
  }

  return {
    ok: true,
    content,
    contentHash,
    approvalState: INTENT_TO_APPROVAL_STATE[item.intent],
  };
}

export function evaluateTimesheetPublicationEligibility(
  timesheet: TimesheetRecord,
  intent: PlatformPublicationIntent,
  options?: { clinicMembershipCheck?: ClinicMembershipCheck }
): M06PublicationEligibilitySuccess | M06PublicationEligibilityFailure {
  const stateFail = assertTimesheetStateEligibleForIntent(timesheet.state, intent);
  if (stateFail) return stateFail;

  const synthetic: PlatformPublicationOutboxItem = {
    id: "eligibility",
    timesheetId: timesheet.id,
    organisationId: timesheet.organisationId ?? "",
    legalEntityId: timesheet.legalEntityId ?? "",
    clinicId: timesheet.clinicId,
    intent,
    sourceVersion: timesheet.publicationSourceVersion ?? 1,
    approvalRevision: timesheet.approvalRevision ?? 1,
    eventId: "eligibility",
    idempotencyKey: "eligibility",
    eventSequence: 1,
    status: "pending",
    attemptCount: 0,
    maxAttempts: 1,
    contentSnapshot: {
      workforcePersonId: timesheet.personId,
      periodStart: timesheet.periodStart,
      periodEnd: timesheet.periodEnd,
      attendanceSessionIds: timesheet.sessionIds,
      totalMinutes: timesheet.totalMinutes,
      publisherId: "eligibility",
      publishedAt: new Date().toISOString(),
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return evaluatePublicationEligibility(synthetic, options);
}

export function buildPublishTimesheetInput(
  item: PlatformPublicationOutboxItem,
  eligibility: M06PublicationEligibilitySuccess
): PublishTimesheetInput {
  return {
    content: eligibility.content,
    sourceVersion: item.sourceVersion,
    approvalRevision: item.approvalRevision,
    approvalState: eligibility.approvalState,
    publishedAt: item.contentSnapshot.publishedAt,
    publisherId: item.contentSnapshot.publisherId,
    eventId: item.eventId,
    idempotencyKey: item.idempotencyKey,
    eventSequence: item.eventSequence,
    contentHash: eligibility.contentHash,
    reasonCode: item.reasonCode,
  };
}

export type PublishFromOutboxResult =
  | { status: "published" | "idempotent"; result: PublishTimesheetResult; contentHash: string }
  | { status: "rejected"; code: string; message: string };

/**
 * Attempt one platform publication from a durable outbox item.
 * Platform validates + verifies hash. Never writes pulse.m07.*.
 */
export function publishOutboxItemToPlatform(
  item: PlatformPublicationOutboxItem,
  options?: { clinicMembershipCheck?: ClinicMembershipCheck }
): PublishFromOutboxResult {
  const eligibility = evaluatePublicationEligibility(item, options);
  if (!eligibility.ok) {
    return { status: "rejected", code: eligibility.code, message: eligibility.message };
  }
  try {
    const input = buildPublishTimesheetInput(item, eligibility);
    // Contract version is owned by platform layer inside publishTimesheetVersion.
    void PUBLISHED_TIMESHEET_CONTRACT_VERSION;
    const result = publishTimesheetVersion(input, {
      clinicMembershipCheck: options?.clinicMembershipCheck,
    });
    return {
      status: result.status === "idempotent" ? "idempotent" : "published",
      result,
      contentHash: eligibility.contentHash,
    };
  } catch (err) {
    if (err instanceof PublishedTimesheetRegistryError) {
      return { status: "rejected", code: err.code, message: err.message };
    }
    return {
      status: "rejected",
      code: "PLATFORM_ERROR",
      message: err instanceof Error ? err.message : "platform publication failed",
    };
  }
}

/** Stable identity for exact retry of one logical publication attempt. */
export function buildPublicationEventIdentity(input: {
  timesheetId: string;
  sourceVersion: number;
  approvalRevision: number;
  intent: PlatformPublicationIntent;
}): { eventId: string; idempotencyKey: string } {
  const key = `m06.pts::${input.timesheetId}::sv${input.sourceVersion}::ar${input.approvalRevision}::${input.intent}`;
  return { eventId: key, idempotencyKey: key };
}
