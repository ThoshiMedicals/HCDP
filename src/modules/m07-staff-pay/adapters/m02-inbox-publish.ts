/**
 * M07 → M02 action/notification publishing via platform inbox bridge only.
 * BOUNDARY: must NOT import M02 repositories.
 * Batch 3: projects pay-prep blockers with deterministic dedupe.
 */

import {
  dispatchActionInboxEvent,
  findInboxActionForSource,
} from "@/platform/services/action-inbox-bridge";
import type { SourceRecordRef } from "@/platform/contracts/source-record";
import type { M07Actor } from "../permissions";
import type { PayPrepException } from "../types/domain";
import { recordM07Audit } from "../services/audit-service";

const MODULE_ID = "staff-pay";

export type M02InboxProjection = {
  sourceModule: "staff-pay";
  kind: string;
  title: string;
  legalEntityId: string;
  entityId: string;
  severity: "info" | "warning" | "blocking";
  readOnlyProjection: true;
};

const projections: M02InboxProjection[] = [];

export function resetM02InboxPublishForTests(): void {
  projections.length = 0;
}

/** Legacy Batch 1 interface retained for existing tests. */
export function publishM07InboxProjection(
  input: Omit<M02InboxProjection, "sourceModule" | "readOnlyProjection">
): M02InboxProjection {
  const row: M02InboxProjection = {
    ...input,
    sourceModule: "staff-pay",
    readOnlyProjection: true,
  };
  projections.push(row);
  return row;
}

export function listM07InboxProjections(): M02InboxProjection[] {
  return [...projections];
}

export const M07_M02_INBOX_PUBLISH_MODE = "platform-bridge" as const;

function exceptionSource(ex: PayPrepException): SourceRecordRef {
  const section = ex.m04LeaveRecordId ? "leave" : "people";
  return {
    sourceModuleId: MODULE_ID,
    sourceRecordType: "pay-prep-exception",
    sourceRecordId: ex.id,
    sourceRecordTitle: `Pay prep blocker: ${ex.kind}`,
    clinicId: ex.clinicId,
    organisationId: ex.organisationId,
    currentStatus: ex.status,
    route: "/staffpay",
    section,
  };
}

/**
 * Create / update / close Action Inbox projection for a prep exception.
 * Uses projectionKey + sourceRecordVersion for replay-safe dedupe.
 */
export function syncPayPrepExceptionToInbox(
  actor: M07Actor,
  ex: PayPrepException,
  mode: "create" | "update" | "close"
): { inboxActionId?: string; projected: boolean } {
  if (typeof window === "undefined" && process.env.NODE_ENV === "test") {
    // Still exercise bridge when localStorage is installed in tests.
  }

  const source = exceptionSource(ex);
  const existing = findInboxActionForSource(
    MODULE_ID,
    "pay-prep-exception",
    ex.id
  );

  if (mode === "close") {
    if (!existing && ex.status !== "resolved" && ex.status !== "cancelled") {
      return { projected: false };
    }
    const closed = dispatchActionInboxEvent({
      kind: "close",
      source,
      actionTitle: `Resolved: ${ex.kind}`,
      actionSummary: ex.resolutionReason ?? ex.message,
      category: "Exception",
      clinicId: ex.clinicId,
      owner: actor.userId,
      requester: "staff-pay",
      priority: "Medium",
      dueAt: new Date().toISOString(),
      requiredOutcome: "Acknowledged",
      inboxStatus: "Completed",
      // Use sourceRefKey-compatible projection so findInboxActionForSource works
      projectionKey: `${MODULE_ID}::pay-prep-exception::${ex.id}`,
      sourceRecordVersion: ex.version,
      sourceStatus: ex.status,
    });
    publishM07InboxProjection({
      kind: "prep-blocker-closed",
      title: `Closed ${ex.kind}`,
      legalEntityId: ex.legalEntityId,
      entityId: ex.id,
      severity: "info",
    });
    recordM07Audit({
      actor,
      action: "m02.projection.close",
      entityType: "pay-prep-exception",
      entityId: ex.id,
      legalEntityId: ex.legalEntityId,
      clinicId: ex.clinicId,
      meta: {
        inboxActionId: closed?.id,
        projectionKey: ex.projectionKey,
        bridgeKey: `${MODULE_ID}::pay-prep-exception::${ex.id}`,
      },
    });
    return { inboxActionId: closed?.id, projected: true };
  }

  const kind = existing || mode === "update" ? "update" : "create";
  const bridgeKey = `${MODULE_ID}::pay-prep-exception::${ex.id}`;
  const action = dispatchActionInboxEvent({
    kind,
    source,
    actionTitle: `Staff pay prep blocker — ${ex.kind}`,
    actionSummary: ex.message,
    category: "Exception",
    clinicId: ex.clinicId,
    owner: actor.userId,
    requester: "staff-pay",
    priority: "High",
    dueAt: new Date(Date.now() + 2 * 86400000).toISOString(),
    requiredOutcome: "Resolve preparation blocker",
    sensitivity: "Standard",
    projectionKey: bridgeKey,
    sourceRecordVersion: ex.version,
    sourceStatus: ex.status,
    inboxStatus: "Open",
  });

  publishM07InboxProjection({
    kind: "prep-blocker",
    title: ex.kind,
    legalEntityId: ex.legalEntityId,
    entityId: ex.id,
    severity: "blocking",
  });

  recordM07Audit({
    actor,
    action: kind === "create" ? "m02.projection.create" : "m02.projection.update",
    entityType: "pay-prep-exception",
    entityId: ex.id,
    legalEntityId: ex.legalEntityId,
    clinicId: ex.clinicId,
    meta: { inboxActionId: action?.id, projectionKey: ex.projectionKey, mode },
  });

  return { inboxActionId: action?.id, projected: Boolean(action) };
}

function approvalSource(approval: import("../types/domain").PayPeriodApproval): SourceRecordRef {
  return {
    sourceModuleId: MODULE_ID,
    sourceRecordType: "pay-period-approval",
    sourceRecordId: approval.logicalKey,
    sourceRecordTitle: `Pay prep management approval v${approval.approvalVersion}`,
    organisationId: approval.organisationId,
    currentStatus: approval.status,
    route: "/staffpay",
    section: "approval",
  };
}

/**
 * Batch 5 — M02 lifecycle for period management approval (bridge only).
 * Does not create a standalone “approved” informational action unless closing/updating.
 */
export function syncPeriodApprovalToInbox(
  actor: M07Actor,
  approval: import("../types/domain").PayPeriodApproval,
  mode:
    | "submitted"
    | "approved"
    | "rejected"
    | "withdrawn"
    | "stale"
    | "review-required"
): { inboxActionId?: string; projected: boolean } {
  const source = approvalSource(approval);
  const bridgeKey = `${MODULE_ID}::pay-period-approval::${approval.logicalKey}`;
  const existing = findInboxActionForSource(MODULE_ID, "pay-period-approval", approval.logicalKey);

  if (mode === "approved" || mode === "withdrawn") {
    const closed = dispatchActionInboxEvent({
      kind: existing ? "close" : "update",
      source,
      actionTitle: "Pay preparation management approval closed",
      actionSummary:
        mode === "approved"
          ? "Management approval recorded for non-certified prep — not certified or payment-ready"
          : "Submission withdrawn",
      category: "Approval",
      owner: actor.userId,
      requester: "staff-pay",
      priority: "Medium",
      dueAt: new Date().toISOString(),
      requiredOutcome: "Acknowledged",
      inboxStatus: "Completed",
      projectionKey: bridgeKey,
      sourceRecordVersion: approval.approvalVersion,
      sourceStatus: approval.status,
    });
    publishM07InboxProjection({
      kind: mode === "approved" ? "approval-closed" : "approval-withdrawn",
      title: mode,
      legalEntityId: approval.legalEntityId,
      entityId: approval.id,
      severity: "info",
    });
    recordM07Audit({
      actor,
      action: "m02.projection.close",
      entityType: "pay-period-approval",
      entityId: approval.id,
      legalEntityId: approval.legalEntityId,
      meta: { mode, inboxActionId: closed?.id, bridgeKey },
    });
    return { inboxActionId: closed?.id, projected: true };
  }

  if (mode === "rejected" || mode === "stale" || mode === "review-required") {
    const kind = existing ? "update" : "create";
    const action = dispatchActionInboxEvent({
      kind,
      source,
      actionTitle:
        mode === "rejected"
          ? "Pay preparation remediation required"
          : "Pay preparation review required",
      actionSummary:
        mode === "rejected"
          ? approval.rejectionReason ?? "Management rejected preparation package"
          : approval.staleReason ?? "Pinned sources changed — resubmit for management approval",
      category: "Approval",
      owner: approval.submittedBy ?? actor.userId,
      requester: "staff-pay",
      priority: "High",
      dueAt: new Date(Date.now() + 2 * 86400000).toISOString(),
      requiredOutcome: "Remediate and resubmit",
      projectionKey: bridgeKey,
      sourceRecordVersion: approval.approvalVersion,
      sourceStatus: approval.status,
      inboxStatus: "Open",
    });
    publishM07InboxProjection({
      kind: mode === "rejected" ? "approval-rejected-remediation" : "review-required",
      title: mode,
      legalEntityId: approval.legalEntityId,
      entityId: approval.id,
      severity: "warning",
    });
    recordM07Audit({
      actor,
      action: kind === "create" ? "m02.projection.create" : "m02.projection.update",
      entityType: "pay-period-approval",
      entityId: approval.id,
      legalEntityId: approval.legalEntityId,
      meta: { mode, inboxActionId: action?.id, bridgeKey },
    });
    return { inboxActionId: action?.id, projected: Boolean(action) };
  }

  // submitted → approval-required
  const kind = existing ? "update" : "create";
  const action = dispatchActionInboxEvent({
    kind,
    source,
    actionTitle: "Pay preparation management approval required",
    actionSummary:
      "Non-certified payroll-preparation package submitted for management approval — not payment authority",
    category: "Approval",
    owner: actor.userId,
    requester: "staff-pay",
    priority: "High",
    dueAt: new Date(Date.now() + 2 * 86400000).toISOString(),
    requiredOutcome: "Approve or reject management approval",
    projectionKey: bridgeKey,
    sourceRecordVersion: approval.approvalVersion,
    sourceStatus: approval.status,
    inboxStatus: "Open",
  });
  publishM07InboxProjection({
    kind: "approval-required",
    title: "submitted",
    legalEntityId: approval.legalEntityId,
    entityId: approval.id,
    severity: "warning",
  });
  recordM07Audit({
    actor,
    action: kind === "create" ? "m02.projection.create" : "m02.projection.update",
    entityType: "pay-period-approval",
    entityId: approval.id,
    legalEntityId: approval.legalEntityId,
    meta: { mode: "submitted", inboxActionId: action?.id, bridgeKey },
  });
  return { inboxActionId: action?.id, projected: Boolean(action) };
}
