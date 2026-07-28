/**
 * Versioned workforce domain events.
 * Events are idempotent by eventId; producers must include source version,
 * time, active identity, clinic scope and source-record reference.
 */

import type { SourceRecordRef } from "@/platform/contracts/source-record";
import { WORKFORCE_CONTRACT_VERSION } from "./common";

export const WORKFORCE_EVENT_CONTRACT_VERSION = WORKFORCE_CONTRACT_VERSION;

export type WorkforceEventType =
  | "candidate.promoted"
  | "engagement.created"
  | "engagement.changed"
  | "worker.status.changed"
  | "credential.status.changed"
  | "training.assignment.created"
  | "training.status.changed"
  | "competency.status.changed"
  | "leave.approved"
  | "availability.changed"
  | "restriction.changed"
  | "roster.published"
  | "shift.created"
  | "shift.changed"
  | "shift.cancelled"
  | "attendance.event.recorded"
  | "attendance.exception.created"
  | "attendance.exception.resolved"
  | "timesheet.approved"
  /** Additive lifecycle events (Wave 6 / M07 CP 2.1) — do not replace timesheet.approved. */
  | "timesheet.approval.granted"
  | "timesheet.approval.revised"
  | "timesheet.approval.revoked"
  | "timesheet.approval.restored"
  | "timesheet.record.withdrawn"
  | "timesheet.record.invalidated"
  | "payperiod.status.changed"
  | "payroll.export.created"
  | "payroll.reconciliation.completed"
  | "worker.offboarding.started"
  | "worker.offboarding.completed";

export interface WorkforceEventEnvelope {
  contractVersion: typeof WORKFORCE_EVENT_CONTRACT_VERSION;
  eventId: string;
  eventType: WorkforceEventType;
  /** Monotonic source-record version used for conflict detection. */
  sourceVersion: number;
  occurredAt: string;
  activeIdentityId: string;
  clinicId?: string;
  organisationId?: string;
  source: SourceRecordRef;
  /**
   * Stable producer key for idempotent delivery.
   * Prefer setting eventId === idempotencyKey for bus-level dedupe.
   */
  idempotencyKey?: string;
  payload?: Record<string, unknown>;
}

export function createWorkforceEvent(
  input: Omit<WorkforceEventEnvelope, "contractVersion">
): WorkforceEventEnvelope {
  return {
    contractVersion: WORKFORCE_EVENT_CONTRACT_VERSION,
    ...input,
  };
}

export const WORKFORCE_EVENT_TYPES: readonly WorkforceEventType[] = [
  "candidate.promoted",
  "engagement.created",
  "engagement.changed",
  "worker.status.changed",
  "credential.status.changed",
  "training.assignment.created",
  "training.status.changed",
  "competency.status.changed",
  "leave.approved",
  "availability.changed",
  "restriction.changed",
  "roster.published",
  "shift.created",
  "shift.changed",
  "shift.cancelled",
  "attendance.event.recorded",
  "attendance.exception.created",
  "attendance.exception.resolved",
  "timesheet.approved",
  "timesheet.approval.granted",
  "timesheet.approval.revised",
  "timesheet.approval.revoked",
  "timesheet.approval.restored",
  "timesheet.record.withdrawn",
  "timesheet.record.invalidated",
  "payperiod.status.changed",
  "payroll.export.created",
  "payroll.reconciliation.completed",
  "worker.offboarding.started",
  "worker.offboarding.completed",
] as const;
