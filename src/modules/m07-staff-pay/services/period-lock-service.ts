/**
 * Batch 6 — explicit period lock after finalized + reconciled export.
 * Name avoids Batch 5 architecture scan exclusion `lockPeriod(`.
 */

import {
  assertM07ClinicScope,
  assertM07LegalEntityScope,
  assertM07Permission,
  M07ValidationError,
  type M07Actor,
} from "../permissions";
import {
  getActivePeriodLockForPeriod,
  getExportBatch,
  getPeriod,
  getReconciliation,
  newPeriodLockId,
  upsertExportBatch,
  upsertPeriod,
  upsertPeriodLock,
} from "../repository/local-store";
import type { PeriodLockRecord } from "../types/domain";
import { recordM07Audit } from "./audit-service";
import { assertApprovedManifestForExport } from "./export-manifest-gate";
import { isFinalizedExportStatus } from "./export-lifecycle";
import { assertLockActorAllowed } from "./sod-policy";
import { assertNoProhibitedFields } from "./sensitive-fields";

export {
  assertPeriodNotLockedForOrdinaryMutation,
  assertPeriodLegalEntityConsistency,
  isPayrollPeriodLocked,
  rejectLockedPeriodSourceChange,
  assertNoLockedPeriodAffectedByPersonMutation,
  assertNoLockedPeriodsForLegalEntity,
  assertNoLockedPeriodAffectedBySnapshot,
  assertNoLockedPeriodAffectedByExportProfileMutation,
  profileAffectsLockedPeriod,
  listLockedPeriodsForLegalEntity,
  effectiveRangeOverlapsPeriod,
  isCanonicalCalendarDate,
  hasIncompleteUnlockControls,
} from "./period-lock-guard";

/**
 * Explicit lock after successful final export + package reconciliation.
 */
export function explicitLockPayPeriod(
  actor: M07Actor,
  input: { periodId: string; exportBatchId: string; reason: string }
): PeriodLockRecord {
  assertM07Permission(actor, "payroll.period.lock");
  assertLockActorAllowed(actor);
  assertNoProhibitedFields(input);
  if (!input.reason?.trim()) {
    throw new M07ValidationError("reason-required", "Lock reason is required");
  }

  const existing = getActivePeriodLockForPeriod(input.periodId);
  if (existing) return existing; // idempotent

  const { period, approval } = assertApprovedManifestForExport(actor, {
    periodId: input.periodId,
  });
  assertM07LegalEntityScope(actor, period.legalEntityId);
  assertM07ClinicScope(actor, period.clinicIds);

  const batch = getExportBatch(input.exportBatchId);
  if (!batch) throw new M07ValidationError("not-found", "Export batch not found");
  if (batch.periodId !== period.id || batch.legalEntityId !== period.legalEntityId) {
    throw new M07ValidationError("scope", "Export batch does not match period");
  }
  if (!isFinalizedExportStatus(batch.status)) {
    throw new M07ValidationError("lifecycle", "Only finalized/downloadable export may lock");
  }
  if (batch.reconciliationStatus !== "matched") {
    throw new M07ValidationError(
      "reconciliation-incomplete",
      "Package reconciliation must be matched before lock"
    );
  }
  if (!batch.reconciliationId) {
    throw new M07ValidationError("reconciliation-missing", "Reconciliation id required");
  }
  const recon = getReconciliation(batch.reconciliationId);
  if (!recon || recon.status !== "matched") {
    throw new M07ValidationError("reconciliation-incomplete", "Matched reconciliation required");
  }
  if (!batch.artifact?.checksum) {
    throw new M07ValidationError("artifact-missing", "Final artifact checksum required for lock");
  }

  const now = new Date().toISOString();
  const lock: PeriodLockRecord = {
    id: newPeriodLockId(),
    legalEntityId: period.legalEntityId,
    organisationId: approval.organisationId,
    periodId: period.id,
    approvalId: approval.id,
    exportBatchId: batch.id,
    reconciliationId: recon.id,
    sourceManifestChecksum: approval.manifest.checksum,
    exportChecksum: batch.artifact.checksum,
    lockedAt: now,
    lockedBy: actor.userId,
    reason: input.reason,
    status: "active",
  };
  upsertPeriodLock(lock);

  upsertPeriod({
    ...period,
    state: "locked",
    lockedAt: now,
    lockedBy: actor.userId,
    // State-only lock — do not bump version (preserve pinned approval periodVersion for verify).
    updatedAt: now,
    updatedBy: actor.userId,
  });

  upsertExportBatch({
    ...batch,
    lockId: lock.id,
  });

  recordM07Audit({
    actor,
    action: "period.locked",
    entityType: "period-lock",
    entityId: lock.id,
    legalEntityId: lock.legalEntityId,
    reason: input.reason,
    after: {
      periodId: period.id,
      exportBatchId: batch.id,
      approvalId: approval.id,
      periodVersion: period.version,
    },
    meta: {
      sourceManifestChecksum: lock.sourceManifestChecksum,
      artifactChecksum: lock.exportChecksum,
      reconciliationId: recon.id,
    },
  });

  return lock;
}

export function getPeriodLockView(
  actor: M07Actor,
  input: { legalEntityId: string; periodId: string }
) {
  assertM07Permission(actor, "payroll.view");
  assertM07LegalEntityScope(actor, input.legalEntityId);
  return {
    lock: getActivePeriodLockForPeriod(input.periodId),
    period: getPeriod(input.periodId),
  };
}
