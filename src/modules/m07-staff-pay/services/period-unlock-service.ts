/**
 * Batch 6 — controlled unlock request / approval (not silent admin override).
 * Does not implement prior-period adjustments.
 *
 * Unlock approval order (approach A — controls before operational open):
 * 1. Validate SoD / lock match / permissions.
 * 2. Mark request `controls-incomplete` (period remains locked).
 * 3. Complete mandatory M02 + unlock-approved audit.
 * 4. Only then apply domain unlock (lock unlocked, period open, approval stale, export superseded).
 * 5. Record period.unlocked audit; mark request `approved`.
 * Retry of `controls-incomplete` resumes from step 3 without opening the period early.
 * Fully `approved` remains idempotent success.
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
  getExportBatch,
  getOpenUnlockRequestForPeriod,
  getPeriod,
  getPeriodLock,
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
import type { PeriodLockRecord, PeriodUnlockRequest } from "../types/domain";
import { recordM07Audit } from "./audit-service";
import { assertUnlockApprovalSeparation } from "./sod-policy";
import { assertNoProhibitedFields } from "./sensitive-fields";
import { syncUnlockRequestToInbox } from "../adapters/m02-inbox-publish";
import { assertExportBatchTransition, isFinalizedExportStatus } from "./export-lifecycle";
import { isPayrollPeriodLocked } from "./period-lock-guard";

/**
 * Idempotent success only when unlock is authoritatively complete:
 * approved + controls complete + period open + unlock history present + export transition consistent.
 */
function tryCompletedUnlockIdempotent(req: PeriodUnlockRequest): PeriodUnlockRequest | null {
  if (req.status !== "approved" || req.controlsIncomplete === true) {
    return null;
  }
  const period = getPeriod(req.periodId);
  if (!period || period.state !== "open") {
    return null;
  }
  if (isPayrollPeriodLocked(req.periodId)) {
    return null;
  }
  const lockHist = getPeriodLock(req.lockId);
  if (
    !lockHist ||
    lockHist.periodId !== req.periodId ||
    lockHist.status !== "unlocked" ||
    lockHist.unlockRequestId !== req.id
  ) {
    return null;
  }
  if (lockHist.exportBatchId) {
    const batch = getExportBatch(lockHist.exportBatchId);
    if (
      batch &&
      isFinalizedExportStatus(batch.status) &&
      batch.status !== "superseded"
    ) {
      return null;
    }
  }
  return req;
}

function markControlsIncomplete(
  req: PeriodUnlockRequest,
  actor: M07Actor,
  reason: string
): PeriodUnlockRequest {
  const now = new Date().toISOString();
  const next: PeriodUnlockRequest = {
    ...req,
    status: "controls-incomplete",
    controlsIncomplete: true,
    controlsIncompleteAt: now,
    controlsIncompleteReason: reason,
    reviewedAt: req.reviewedAt ?? now,
    reviewedBy: req.reviewedBy ?? actor.userId,
    version: req.version + 1,
  };
  return upsertUnlockRequest(next);
}

function runUnlockControlPair(
  actor: M07Actor,
  req: PeriodUnlockRequest,
  lock: PeriodLockRecord,
  reason?: string
): { m02Ok: boolean; auditOk: boolean } {
  let m02Ok = false;
  try {
    m02Ok = syncUnlockRequestToInbox(actor, req, "approved").projected;
  } catch {
    m02Ok = false;
  }

  let auditOk = false;
  try {
    recordM07Audit({
      actor,
      action: "period.unlock-approved",
      entityType: "period-unlock-request",
      entityId: req.id,
      legalEntityId: req.legalEntityId,
      reason,
      before: { status: req.status },
      after: { status: "controls-pending", periodStillLocked: true },
      meta: {
        periodId: req.periodId,
        lockId: lock.id,
        sourceManifestChecksum: lock.sourceManifestChecksum,
        artifactChecksum: lock.exportChecksum,
        controlsComplete: false,
        stage: "pre-domain-unlock",
      },
    });
    auditOk = true;
  } catch {
    auditOk = false;
  }
  return { m02Ok, auditOk };
}

function applyDomainUnlock(
  actor: M07Actor,
  req: PeriodUnlockRequest,
  lock: PeriodLockRecord,
  reason?: string
): PeriodUnlockRequest {
  const period = getPeriod(req.periodId);
  if (!period) throw new M07ValidationError("not-found", "Period not found");
  const now = new Date().toISOString();

  upsertPeriodLock({
    ...lock,
    status: "unlocked",
    unlockedAt: now,
    unlockedBy: actor.userId,
    unlockRequestId: req.id,
  });

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

  const approved: PeriodUnlockRequest = {
    ...req,
    status: "approved",
    controlsIncomplete: false,
    controlsIncompleteReason: undefined,
    reviewedAt: now,
    reviewedBy: actor.userId,
    reviewReason: reason ?? req.reviewReason,
    version: req.version + 1,
  };
  upsertUnlockRequest(approved);

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
  if (open) return open; // idempotent replay (requested or controls-incomplete)

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

  const completed = tryCompletedUnlockIdempotent(req);
  if (completed) {
    return completed;
  }

  if (req.status === "rejected" || req.status === "cancelled") {
    throw new M07ValidationError("lifecycle", `Cannot approve unlock in status ${req.status}`);
  }
  if (req.status !== "requested" && req.status !== "controls-incomplete" && req.status !== "approved") {
    throw new M07ValidationError("lifecycle", `Cannot approve unlock in status ${req.status}`);
  }

  assertUnlockApprovalSeparation({
    actor,
    requestedByUserId: req.requestedBy,
  });

  const lock = getActivePeriodLockForPeriod(req.periodId);
  if (!lock || lock.id !== req.lockId) {
    // Approved without proven open/unlocked history must not return success
    if (req.status === "approved" && !req.controlsIncomplete) {
      throw new M07ValidationError(
        "unlock-state-inconsistent",
        "Approved unlock lacks consistent open period and unlock history; cannot treat as complete"
      );
    }
    throw new M07ValidationError("lock-mismatch", "Active lock does not match unlock request");
  }

  const period = getPeriod(req.periodId);
  if (!period) throw new M07ValidationError("not-found", "Period not found");

  // Stage: period remains locked while controls run
  let staged = req;
  if (req.status === "requested" || (req.status === "approved" && req.controlsIncomplete)) {
    staged = markControlsIncomplete(
      {
        ...req,
        reviewedAt: new Date().toISOString(),
        reviewedBy: actor.userId,
        reviewReason: input.reason,
      },
      actor,
      "awaiting-m02-and-audit"
    );
  } else if (req.status === "controls-incomplete") {
    staged = req;
  }

  const { m02Ok, auditOk } = runUnlockControlPair(actor, staged, lock, input.reason);
  if (!m02Ok || !auditOk) {
    markControlsIncomplete(
      staged,
      actor,
      !m02Ok && !auditOk
        ? "m02-and-audit-incomplete"
        : !m02Ok
          ? "m02-incomplete"
          : "audit-incomplete"
    );
    // Period still locked — ordinary mutations remain blocked
    throw new M07ValidationError(
      "unlock-control-incomplete",
      "Unlock controls incomplete — period remains locked; retry approvePeriodUnlock to resume"
    );
  }

  return applyDomainUnlock(actor, staged, lock, input.reason);
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
  if (req.status !== "requested" && req.status !== "controls-incomplete") {
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
    controlsIncomplete: false,
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
    before: { status: req.status },
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
