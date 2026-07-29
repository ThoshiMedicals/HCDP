/**
 * Batch 6 — controlled unlock request / approval (not silent admin override).
 * Does not implement prior-period adjustments.
 */

import {
  assertM07LegalEntityScope,
  assertM07Permission,
  M07ValidationError,
  type M07Actor,
} from "../permissions";
import {
  getActivePeriodLockForPeriod,
  getCurrentApprovalForPeriod,
  getCurrentExportBatchForPeriod,
  getOpenUnlockRequestForPeriod,
  getPeriod,
  getUnlockRequest,
  listUnlockRequests,
  newUnlockRequestId,
  unlockRequestLogicalKey,
  upsertApproval,
  upsertExportBatch,
  upsertPeriod,
  upsertPeriodLock,
  upsertUnlockRequest,
} from "../repository/local-store";
import type { PeriodUnlockRequest } from "../types/domain";
import { recordM07Audit } from "./audit-service";
import { assertUnlockApprovalSeparation } from "./sod-policy";
import { assertNoProhibitedFields } from "./sensitive-fields";
import { syncUnlockRequestToInbox } from "../adapters/m02-inbox-publish";
import { assertExportBatchTransition, isFinalizedExportStatus } from "./export-lifecycle";

export function requestPeriodUnlock(
  actor: M07Actor,
  input: { periodId: string; reason: string; supportingNote?: string }
): PeriodUnlockRequest {
  assertM07Permission(actor, "payroll.period.unlock.request");
  assertNoProhibitedFields(input);
  if (!input.reason?.trim()) {
    throw new M07ValidationError("reason-required", "Unlock reason is required");
  }

  const period = getPeriod(input.periodId);
  if (!period) throw new M07ValidationError("not-found", "Period not found");
  assertM07LegalEntityScope(actor, period.legalEntityId);

  const lock = getActivePeriodLockForPeriod(period.id);
  if (!lock) {
    throw new M07ValidationError("not-locked", "Period has no active lock to unlock");
  }

  const open = getOpenUnlockRequestForPeriod(period.id);
  if (open) return open; // idempotent replay

  const now = new Date().toISOString();
  const logicalKey = unlockRequestLogicalKey(period.id, lock.id);
  const req: PeriodUnlockRequest = {
    id: newUnlockRequestId(),
    logicalKey,
    legalEntityId: period.legalEntityId,
    organisationId: lock.organisationId,
    periodId: period.id,
    lockId: lock.id,
    status: "requested",
    reason: input.reason,
    supportingNote: input.supportingNote,
    requestedAt: now,
    requestedBy: actor.userId,
    projectionKey: `m07::period-unlock::${logicalKey}`,
    version: 1,
  };
  upsertUnlockRequest(req);

  const projected = syncUnlockRequestToInbox(actor, req, "requested");
  if (!projected.projected) {
    throw new M07ValidationError(
      "m02-projection-failed",
      "Unlock request requires M02 review action projection"
    );
  }

  recordM07Audit({
    actor,
    action: "period.unlock-requested",
    entityType: "period-unlock-request",
    entityId: req.id,
    legalEntityId: req.legalEntityId,
    reason: input.reason,
    meta: {
      periodId: period.id,
      lockId: lock.id,
      correlationKey: logicalKey,
      sourceManifestChecksum: lock.sourceManifestChecksum,
    },
  });

  return req;
}

export function approvePeriodUnlock(
  actor: M07Actor,
  input: { unlockRequestId: string; reason?: string }
): PeriodUnlockRequest {
  assertM07Permission(actor, "payroll.period.unlock.approve");
  assertNoProhibitedFields(input);

  const req = getUnlockRequest(input.unlockRequestId);
  if (!req) throw new M07ValidationError("not-found", "Unlock request not found");
  assertM07LegalEntityScope(actor, req.legalEntityId);

  if (req.status === "approved") return req; // idempotent
  if (req.status !== "requested") {
    throw new M07ValidationError("lifecycle", `Cannot approve unlock in status ${req.status}`);
  }

  assertUnlockApprovalSeparation({
    actor,
    requestedByUserId: req.requestedBy,
  });

  const lock = getActivePeriodLockForPeriod(req.periodId);
  if (!lock || lock.id !== req.lockId) {
    throw new M07ValidationError("lock-mismatch", "Active lock does not match unlock request");
  }

  const period = getPeriod(req.periodId);
  if (!period) throw new M07ValidationError("not-found", "Period not found");

  const now = new Date().toISOString();
  const approved: PeriodUnlockRequest = {
    ...req,
    status: "approved",
    reviewedAt: now,
    reviewedBy: actor.userId,
    reviewReason: input.reason,
    version: req.version + 1,
  };
  upsertUnlockRequest(approved);

  // Unlock lock record — do not delete history
  upsertPeriodLock({
    ...lock,
    status: "unlocked",
    unlockedAt: now,
    unlockedBy: actor.userId,
    unlockRequestId: approved.id,
  });

  // Period returns to open (non-authoritative for export until new approval)
  upsertPeriod({
    ...period,
    state: "open",
    lockedAt: null,
    lockedBy: null,
    exportCreated: false,
    version: period.version + 1,
    updatedAt: now,
    updatedBy: actor.userId,
  });

  // Mark approval + export non-authoritative
  const approval = getCurrentApprovalForPeriod(period.id);
  if (approval && approval.status === "approved") {
    upsertApproval({
      ...approval,
      status: "stale",
      staleAt: now,
      staleReason: "period-unlocked",
      updatedAt: now,
      updatedBy: actor.userId,
    });
  }

  const exportBatch = getCurrentExportBatchForPeriod(period.id);
  if (exportBatch && isFinalizedExportStatus(exportBatch.status)) {
    assertExportBatchTransition(exportBatch.status, "superseded");
    upsertExportBatch({
      ...exportBatch,
      status: "superseded",
      supersededAt: now,
    });
  }

  const m02 = syncUnlockRequestToInbox(actor, approved, "approved");

  let auditOk = false;
  try {
    recordM07Audit({
      actor,
      action: "period.unlock-approved",
      entityType: "period-unlock-request",
      entityId: approved.id,
      legalEntityId: approved.legalEntityId,
      reason: input.reason,
      before: { status: "requested" },
      after: { status: "approved", periodState: "open" },
      meta: {
        periodId: period.id,
        lockId: lock.id,
        sourceManifestChecksum: lock.sourceManifestChecksum,
        artifactChecksum: lock.exportChecksum,
        controlsComplete: Boolean(m02.projected),
      },
    });
    auditOk = true;
  } catch {
    auditOk = false;
  }

  if (!m02.projected || !auditOk) {
    throw new M07ValidationError(
      "unlock-control-incomplete",
      "Unlock domain changes applied but required M02/audit controls did not complete — do not treat as fully controlled success"
    );
  }

  recordM07Audit({
    actor,
    action: "period.unlocked",
    entityType: "period-lock",
    entityId: lock.id,
    legalEntityId: lock.legalEntityId,
    after: { status: "unlocked" },
    meta: { unlockRequestId: approved.id, periodId: period.id },
  });

  return approved;
}

export function rejectPeriodUnlock(
  actor: M07Actor,
  input: { unlockRequestId: string; reason: string }
): PeriodUnlockRequest {
  assertM07Permission(actor, "payroll.period.unlock.approve");
  if (!input.reason?.trim()) {
    throw new M07ValidationError("reason-required", "Rejection reason is required");
  }
  const req = getUnlockRequest(input.unlockRequestId);
  if (!req) throw new M07ValidationError("not-found", "Unlock request not found");
  assertM07LegalEntityScope(actor, req.legalEntityId);
  if (req.status === "rejected") return req;
  if (req.status !== "requested") {
    throw new M07ValidationError("lifecycle", `Cannot reject unlock in status ${req.status}`);
  }
  assertUnlockApprovalSeparation({
    actor,
    requestedByUserId: req.requestedBy,
  });

  const now = new Date().toISOString();
  const rejected: PeriodUnlockRequest = {
    ...req,
    status: "rejected",
    reviewedAt: now,
    reviewedBy: actor.userId,
    reviewReason: input.reason,
    version: req.version + 1,
  };
  upsertUnlockRequest(rejected);
  syncUnlockRequestToInbox(actor, rejected, "rejected");
  recordM07Audit({
    actor,
    action: "period.unlock-rejected",
    entityType: "period-unlock-request",
    entityId: rejected.id,
    legalEntityId: rejected.legalEntityId,
    reason: input.reason,
    before: { status: "requested" },
    after: { status: "rejected" },
    meta: { periodId: req.periodId, lockId: req.lockId },
  });
  return rejected;
}

export function listUnlockRequestsForPeriod(
  actor: M07Actor,
  legalEntityId: string,
  periodId: string
): PeriodUnlockRequest[] {
  assertM07Permission(actor, "payroll.view");
  assertM07LegalEntityScope(actor, legalEntityId);
  return listUnlockRequests(legalEntityId).filter((r) => r.periodId === periodId);
}
