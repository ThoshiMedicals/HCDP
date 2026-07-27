/**
 * Shared Action Inbox event contract.
 * Source modules own business records; Module 2 owns actionable projections.
 * Implementations live in platform/services — modules must not edit M2 repositories directly.
 */

import type { SourceRecordRef } from "./source-record";
import type { PlatformPriority, PlatformSensitivity, PlatformInboxStatus } from "@/platform/status";

export type InboxEventKind =
  | "create"
  | "update"
  | "change-owner"
  | "change-due-date"
  | "change-priority"
  | "mark-source-resolved"
  | "close"
  | "create-follow-up"
  | "archive";

export type ActionCategory = "Approval" | "Exception" | "Escalation" | "Reminder";

export interface ActionInboxEventInput {
  kind: InboxEventKind;
  source: SourceRecordRef;
  actionTitle: string;
  actionSummary: string;
  category: ActionCategory;
  actionType?: string;
  clinicId?: string;
  owner: string;
  requester: string;
  priority: PlatformPriority;
  dueAt: string;
  requiredOutcome: string;
  approvalPathway?: string;
  sensitivity?: PlatformSensitivity;
  watchers?: string[];
  notificationRules?: string[];
  escalationRules?: string[];
  completionRequirements?: string[];
  sourceStatus?: string;
  inboxStatus?: PlatformInboxStatus;
  projectionKey?: string;
  /** Monotonic source version for stale create/update replay protection. */
  sourceRecordVersion?: number;
}

export interface SourceLinkRecord {
  projectionKey: string;
  inboxActionId: string;
  sourceKey: string;
  source: SourceRecordRef;
  updatedAt: string;
  /** Last source record version applied to this projection (stale-replay guard). */
  sourceRecordVersion?: number;
  /** Source version at which the projection was closed/resolved. */
  closedAtSourceVersion?: number;
}

export interface ActionInboxBridgeResult {
  inboxActionId: string;
  number?: string;
  created: boolean;
}
