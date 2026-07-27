/**
 * Cross-module adapter interfaces for workforce family modules.
 * Implementations live in each module's adapters/ — never edit another module's repository.
 */

import type { ActionInboxEventInput, ActionInboxBridgeResult } from "@/platform/contracts/action-inbox-events";
import type { PlatformNotificationInput } from "@/platform/contracts/notification-events";
import type { PlatformAuditEvent } from "@/platform/contracts/audit";
import type { ExecutiveInboxSummary } from "@/platform/contracts/executive-summary";
import type { WorkforceEventEnvelope } from "../contracts/workforce-events";
import type { ReadinessRef } from "../contracts/readiness-ref";

/** Publish actionable projections to Module 2 via platform services only. */
export interface WorkforceActionInboxAdapter {
  publishFromWorkforceEvent(
    event: WorkforceEventEnvelope,
    input: Omit<ActionInboxEventInput, "source"> & { source?: ActionInboxEventInput["source"] }
  ): Promise<ActionInboxBridgeResult> | ActionInboxBridgeResult;
}

/** Publish notifications via platform notification publisher. */
export interface WorkforceNotificationAdapter {
  notify(input: PlatformNotificationInput): void;
}

/** Emit platform audit events for workforce mutations. */
export interface WorkforceAuditAdapter {
  record(event: Omit<PlatformAuditEvent, "eventId" | "at"> & { eventId?: string; at?: string }): PlatformAuditEvent;
}

/** Contribute workforce counts / readiness samples to Module 1 executive summaries (later waves). */
export interface WorkforceExecutiveSummaryAdapter {
  getWorkforceSummarySlice(clinicIds?: string[]): {
    readyCount: number;
    blockedCount: number;
    readinessSamples: ReadinessRef[];
    asOf: string;
  };
  /** Optional bridge into shared executive inbox summary shape. */
  toExecutiveInboxHints?(): Pick<ExecutiveInboxSummary, "generatedAt"> & {
    workforceBlocked: number;
  };
}

export interface WorkforceModuleAdapters {
  actionInbox: WorkforceActionInboxAdapter;
  notification: WorkforceNotificationAdapter;
  audit: WorkforceAuditAdapter;
  executiveSummary: WorkforceExecutiveSummaryAdapter;
}
