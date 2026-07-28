/**
 * Typed timesheet approval lifecycle events — Checkpoint 2.1.
 */

import type {
  PublishedTimesheetContractVersion,
  TimesheetApprovalState,
} from "./published-timesheet-contract";
import { PUBLISHED_TIMESHEET_CONTRACT_VERSION } from "./published-timesheet-contract";

export type TimesheetApprovalLifecycleEventType =
  | "timesheet.approval.granted"
  | "timesheet.approval.revised"
  | "timesheet.approval.revoked"
  | "timesheet.approval.restored"
  | "timesheet.record.withdrawn"
  | "timesheet.record.invalidated";

export const TIMESHEET_APPROVAL_LIFECYCLE_EVENT_TYPES: readonly TimesheetApprovalLifecycleEventType[] =
  [
    "timesheet.approval.granted",
    "timesheet.approval.revised",
    "timesheet.approval.revoked",
    "timesheet.approval.restored",
    "timesheet.record.withdrawn",
    "timesheet.record.invalidated",
  ] as const;

export type TimesheetApprovalLifecycleEvent = {
  contractVersion: PublishedTimesheetContractVersion;
  eventType: TimesheetApprovalLifecycleEventType;
  eventId: string;
  idempotencyKey: string;
  eventSequence: number;
  timesheetRecordId: string;
  affectedSourceVersion: number;
  approvalRevision: number;
  organisationId: string;
  legalEntityId: string;
  clinicId?: string;
  reasonCode?: string;
  occurredAt: string;
  publisherId: string;
  /** Required when event refers to payroll-preparation content. */
  contentHash?: string;
  approvalState: TimesheetApprovalState;
  previousSourceVersion?: number;
  previousApprovalRevision?: number;
};

export function createTimesheetApprovalLifecycleEvent(
  input: Omit<TimesheetApprovalLifecycleEvent, "contractVersion"> & {
    contractVersion?: PublishedTimesheetContractVersion;
  }
): TimesheetApprovalLifecycleEvent {
  return {
    contractVersion: input.contractVersion ?? PUBLISHED_TIMESHEET_CONTRACT_VERSION,
    eventType: input.eventType,
    eventId: input.eventId,
    idempotencyKey: input.idempotencyKey,
    eventSequence: input.eventSequence,
    timesheetRecordId: input.timesheetRecordId,
    affectedSourceVersion: input.affectedSourceVersion,
    approvalRevision: input.approvalRevision,
    organisationId: input.organisationId,
    legalEntityId: input.legalEntityId,
    clinicId: input.clinicId,
    reasonCode: input.reasonCode,
    occurredAt: input.occurredAt,
    publisherId: input.publisherId,
    contentHash: input.contentHash,
    approvalState: input.approvalState,
    previousSourceVersion: input.previousSourceVersion,
    previousApprovalRevision: input.previousApprovalRevision,
  };
}
