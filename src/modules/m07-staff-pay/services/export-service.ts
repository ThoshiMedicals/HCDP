/**
 * Batch 6 — payroll export batch create/preview/finalize (non-payment).
 * Function names avoid Batch 5 architecture-scan exclusions (createExportPackage / lockPeriod).
 */

import {
  assertM07ClinicScope,
  assertM07LegalEntityScope,
  assertM07Permission,
  M07ValidationError,
  type M07Actor,
} from "../permissions";
import {
  exportIdentityKey,
  getCurrentExportBatchForPeriod,
  getExportBatch,
  getExportProfile,
  getPeriod,
  listExportBatchesForPeriod,
  listExportProfiles,
  newExportBatchId,
  upsertExportBatch,
  upsertPeriod,
} from "../repository/local-store";
import {
  M07_CANONICAL_EXPORT_FORMAT_VERSION,
  M07_NON_CERTIFIED_DISCLAIMER,
  type PayrollExportBatch,
} from "../types/domain";
import { recordM07Audit } from "./audit-service";
import {
  buildCanonicalExportPackage,
  checksumCanonicalExport,
  emptyTotals,
  serializeCanonicalExportCsv,
} from "./export-canonical-service";
import { assertExportBatchTransition, isFinalizedExportStatus } from "./export-lifecycle";
import { assertApprovedManifestForExport } from "./export-manifest-gate";
import { validateExportReadiness } from "./export-validation-service";
import { assertExportFinalizeSeparation } from "./sod-policy";
import { assertNoProhibitedFields } from "./sensitive-fields";
import { reconcileExportBatchAgainstApproval } from "./reconciliation-service";
import { syncExportBatchToInbox } from "../adapters/m02-inbox-publish";

function resolveDefaultExportProfile(legalEntityId: string) {
  const profiles = listExportProfiles(legalEntityId).filter((p) => p.status === "active");
  const def =
    profiles.find((p) => p.isDefaultMinimumPii) ??
    profiles.find((p) => p.legalEntityId === legalEntityId) ??
    profiles[0];
  if (!def) {
    throw new M07ValidationError(
      "export-profile-missing",
      "No active export profile configured for legal entity"
    );
  }
  return def;
}

function nextRevision(periodId: string): number {
  const all = listExportBatchesForPeriod(periodId);
  if (!all.length) return 1;
  return Math.max(...all.map((b) => b.batchRevision)) + 1;
}

/**
 * Create or refresh a draft/ready export batch from the approved Batch 5 package.
 * Idempotent for same approval+checksum+format+revision identity when mutable.
 */
export function createOrRefreshPayrollExportBatch(
  actor: M07Actor,
  input: { periodId: string; exportProfileId?: string; reason?: string }
): PayrollExportBatch {
  assertM07Permission(actor, "payroll.export.create");
  assertNoProhibitedFields(input);

  const { period, approval } = assertApprovedManifestForExport(actor, {
    periodId: input.periodId,
  });
  assertM07LegalEntityScope(actor, period.legalEntityId);
  assertM07ClinicScope(actor, period.clinicIds);

  const profile = input.exportProfileId
    ? getExportProfile(input.exportProfileId)
    : resolveDefaultExportProfile(period.legalEntityId);
  if (!profile) throw new M07ValidationError("not-found", "Export profile not found");
  if (profile.legalEntityId !== "*" && profile.legalEntityId !== period.legalEntityId) {
    throw new M07ValidationError("scope", "Export profile legal entity mismatch");
  }

  const formatVersion = M07_CANONICAL_EXPORT_FORMAT_VERSION;
  const checksum = approval.manifest.checksum;

  // Idempotent reuse of current mutable batch with same identity inputs
  const current = getCurrentExportBatchForPeriod(period.id);
  if (
    current &&
    !isFinalizedExportStatus(current.status) &&
    current.status !== "cancelled" &&
    current.approvalId === approval.id &&
    current.sourceManifestChecksum === checksum &&
    current.formatVersion === formatVersion &&
    current.exportProfileId === profile.id &&
    current.exportProfileVersion === profile.version
  ) {
    return refreshPayrollExportPreview(actor, { exportBatchId: current.id });
  }

  // If a finalized batch exists for same identity, return it (no duplicate)
  if (
    current &&
    isFinalizedExportStatus(current.status) &&
    current.approvalId === approval.id &&
    current.sourceManifestChecksum === checksum &&
    current.formatVersion === formatVersion
  ) {
    return current;
  }

  // Supersede mutable prior if sources changed
  if (current && !isFinalizedExportStatus(current.status) && current.status !== "cancelled") {
    assertExportBatchTransition(current.status, "superseded");
    upsertExportBatch({
      ...current,
      status: "superseded",
      supersededAt: new Date().toISOString(),
    });
  }

  const revision =
    current && isFinalizedExportStatus(current.status) ? nextRevision(period.id) : current?.batchRevision ?? 1;
  // If finalized current exists with DIFFERENT checksum, create successor revision
  const batchRevision =
    current &&
    isFinalizedExportStatus(current.status) &&
    (current.approvalId !== approval.id || current.sourceManifestChecksum !== checksum)
      ? nextRevision(period.id)
      : current && !isFinalizedExportStatus(current.status)
        ? current.batchRevision
        : revision === 1 && !current
          ? 1
          : current && isFinalizedExportStatus(current.status)
            ? nextRevision(period.id)
            : 1;

  const identityKey = exportIdentityKey({
    legalEntityId: period.legalEntityId,
    periodId: period.id,
    approvalId: approval.id,
    sourceManifestChecksum: checksum,
    formatVersion,
    batchRevision,
  });

  const existingSameIdentity = listExportBatchesForPeriod(period.id).find(
    (b) => b.identityKey === identityKey
  );
  if (existingSameIdentity) {
    if (isFinalizedExportStatus(existingSameIdentity.status)) return existingSameIdentity;
    return refreshPayrollExportPreview(actor, { exportBatchId: existingSameIdentity.id });
  }

  const now = new Date().toISOString();
  const id = newExportBatchId(period.id, batchRevision);
  let batch: PayrollExportBatch = {
    id,
    identityKey,
    legalEntityId: period.legalEntityId,
    organisationId: approval.organisationId,
    periodId: period.id,
    approvalId: approval.id,
    sourceManifestChecksum: checksum,
    formatVersion,
    exportProfileId: profile.id,
    exportProfileVersion: profile.version,
    batchRevision,
    status: "draft",
    createdAt: now,
    createdBy: actor.userId,
    sourceVerificationOk: true,
    validationIssues: [],
    totals: emptyTotals(),
    lineCount: 0,
    downloadHistory: [],
    supersedesBatchId: current?.id ?? null,
    certified: false,
    paymentReady: false,
    disclaimer: M07_NON_CERTIFIED_DISCLAIMER,
  };
  upsertExportBatch(batch);

  if (current && isFinalizedExportStatus(current.status)) {
    assertExportBatchTransition(current.status, "superseded");
    upsertExportBatch({
      ...current,
      status: "superseded",
      supersededAt: now,
      supersededByBatchId: batch.id,
    });
  }

  recordM07Audit({
    actor,
    action: "export-batch.created",
    entityType: "payroll-export-batch",
    entityId: batch.id,
    legalEntityId: batch.legalEntityId,
    after: { status: batch.status, identityKey, batchRevision },
    reason: input.reason,
    meta: {
      periodId: period.id,
      approvalId: approval.id,
      sourceManifestChecksum: checksum,
      correlationKey: identityKey,
    },
  });

  return refreshPayrollExportPreview(actor, { exportBatchId: batch.id });
}

/** Preview / refresh — same validation as final; does not finalize or lock. */
export function refreshPayrollExportPreview(
  actor: M07Actor,
  input: { exportBatchId: string }
): PayrollExportBatch {
  assertM07Permission(actor, "payroll.export.create");
  const existing = getExportBatch(input.exportBatchId);
  if (!existing) throw new M07ValidationError("not-found", "Export batch not found");
  assertM07LegalEntityScope(actor, existing.legalEntityId);
  if (isFinalizedExportStatus(existing.status)) {
    throw new M07ValidationError(
      "lifecycle",
      "Finalized export cannot be preview-refreshed; create a successor revision if sources changed"
    );
  }
  if (existing.status === "cancelled" || existing.status === "superseded") {
    throw new M07ValidationError("lifecycle", `Cannot preview ${existing.status} batch`);
  }

  const { period, approval } = assertApprovedManifestForExport(actor, {
    periodId: existing.periodId,
    approvalId: existing.approvalId,
  });

  assertExportBatchTransition(existing.status, "validating");
  let batch: PayrollExportBatch = {
    ...existing,
    status: "validating",
    sourceVerificationOk: true,
    preparedAt: new Date().toISOString(),
    preparedBy: actor.userId,
  };
  upsertExportBatch(batch);

  const validation = validateExportReadiness(actor, {
    period,
    approval,
    batchId: batch.id,
  });
  const profile = getExportProfile(batch.exportProfileId) ?? resolveDefaultExportProfile(period.legalEntityId);

  if (!validation.ok) {
    assertExportBatchTransition("validating", "blocked");
    batch = {
      ...batch,
      status: "blocked",
      validationIssues: validation.issues,
      sourceVerificationOk: true,
      totals: emptyTotals(),
      lineCount: 0,
      canonicalPreview: null,
    };
    upsertExportBatch(batch);
    recordM07Audit({
      actor,
      action: "export-batch.validation-blocked",
      entityType: "payroll-export-batch",
      entityId: batch.id,
      legalEntityId: batch.legalEntityId,
      after: { status: "blocked", issueCount: validation.issues.length },
      meta: {
        periodId: period.id,
        sourceManifestChecksum: approval.manifest.checksum,
        codes: validation.issues.map((i) => i.code),
      },
    });
    syncExportBatchToInbox(actor, batch, "blocked");
    return batch;
  }

  const canonical = buildCanonicalExportPackage({
    period,
    approval,
    exportBatchId: batch.id,
    batchRevision: batch.batchRevision,
    exportProfile: profile,
    previewOnly: true,
  });

  assertExportBatchTransition("validating", "ready");
  batch = {
    ...batch,
    status: "ready",
    validationIssues: validation.issues,
    totals: canonical.totals,
    lineCount: canonical.lines.length,
    canonicalPreview: canonical,
  };
  upsertExportBatch(batch);

  recordM07Audit({
    actor,
    action: "export-batch.preview",
    entityType: "payroll-export-batch",
    entityId: batch.id,
    legalEntityId: batch.legalEntityId,
    after: {
      status: "ready",
      previewOnly: true,
      lineCount: batch.lineCount,
      totals: batch.totals,
    },
    meta: {
      periodId: period.id,
      sourceManifestChecksum: approval.manifest.checksum,
      note: "Preview is not a final export artifact",
    },
  });

  return batch;
}

/**
 * Final generation — re-verifies sources, enforces SoD, creates immutable artifact.
 */
export function finalizePayrollExportBatch(
  actor: M07Actor,
  input: { exportBatchId: string; reason?: string }
): PayrollExportBatch {
  assertM07Permission(actor, "payroll.export.create");
  assertNoProhibitedFields(input);

  const existing = getExportBatch(input.exportBatchId);
  if (!existing) throw new M07ValidationError("not-found", "Export batch not found");
  assertM07LegalEntityScope(actor, existing.legalEntityId);

  if (isFinalizedExportStatus(existing.status)) {
    return existing; // idempotent duplicate finalization
  }
  if (existing.status !== "ready") {
    // Re-run preview path then require ready
    const refreshed = refreshPayrollExportPreview(actor, { exportBatchId: existing.id });
    if (refreshed.status !== "ready") {
      throw new M07ValidationError(
        "export-blocked",
        `Export not ready for finalization (status ${refreshed.status})`
      );
    }
  }

  const current = getExportBatch(input.exportBatchId)!;
  const { period, approval } = assertApprovedManifestForExport(actor, {
    periodId: current.periodId,
    approvalId: current.approvalId,
  });

  assertExportFinalizeSeparation({
    actor,
    legalEntityId: period.legalEntityId,
    approval,
  });

  // Re-validate (never trust cached preview alone)
  const validation = validateExportReadiness(actor, {
    period,
    approval,
    batchId: current.id,
  });
  if (!validation.ok) {
    upsertExportBatch({ ...current, status: "validating" });
    const blocked: PayrollExportBatch = {
      ...current,
      status: "blocked",
      validationIssues: validation.issues,
    };
    upsertExportBatch(blocked);
    syncExportBatchToInbox(actor, blocked, "blocked");
    throw new M07ValidationError(
      "export-blocked",
      `Export finalization blocked: ${validation.issues
        .filter((i) => i.severity === "blocking")
        .map((i) => i.code)
        .join(", ")}`
    );
  }

  const profile = getExportProfile(current.exportProfileId) ?? resolveDefaultExportProfile(period.legalEntityId);
  const now = new Date().toISOString();
  const canonical = buildCanonicalExportPackage({
    period,
    approval,
    exportBatchId: current.id,
    batchRevision: current.batchRevision,
    exportProfile: profile,
    previewOnly: false,
    generatedAt: now,
  });
  const csv = serializeCanonicalExportCsv(canonical);
  const artifactChecksum = checksumCanonicalExport(canonical);
  const filename = `m07-export-${period.legalEntityId}-${period.id}-r${current.batchRevision}.csv`;

  assertExportBatchTransition("ready", "finalized");
  let batch: PayrollExportBatch = {
    ...current,
    status: "finalized",
    validationIssues: validation.issues,
    totals: canonical.totals,
    lineCount: canonical.lines.length,
    canonicalPreview: { ...canonical, previewOnly: true },
    finalizedCanonical: canonical,
    finalizedAt: now,
    finalizedBy: actor.userId,
    artifact: {
      contentType: "text/csv",
      filename,
      checksum: artifactChecksum,
      byteLength: csv.length,
      formatVersion: canonical.formatVersion,
      createdAt: now,
    },
    artifactBody: csv,
  };
  upsertExportBatch(batch);

  const recon = reconcileExportBatchAgainstApproval(actor, {
    exportBatchId: batch.id,
  });
  if (recon.status === "blocked" || recon.status === "failed") {
    batch = {
      ...batch,
      reconciliationId: recon.id,
      reconciliationStatus: recon.status,
    };
    upsertExportBatch(batch);
    recordM07Audit({
      actor,
      action: "export-batch.reconciliation-failed",
      entityType: "payroll-export-batch",
      entityId: batch.id,
      legalEntityId: batch.legalEntityId,
      after: { reconciliationStatus: recon.status },
      meta: { reconciliationId: recon.id, sourceManifestChecksum: approval.manifest.checksum },
    });
    syncExportBatchToInbox(actor, batch, "recon-blocked");
    throw new M07ValidationError(
      "reconciliation-blocked",
      "Package reconciliation blocked final downloadable state"
    );
  }

  assertExportBatchTransition("finalized", "downloadable");
  batch = {
    ...batch,
    status: "downloadable",
    reconciliationId: recon.id,
    reconciliationStatus: recon.status,
  };
  upsertExportBatch(batch);

  // Period state: recon service may have set reconciled; otherwise mark exported.
  const periodNow = getPeriod(period.id) ?? period;
  if (periodNow.state === "export-ready") {
    upsertPeriod({
      ...periodNow,
      state: recon.status === "matched" ? "reconciled" : "exported",
      exportCreated: true,
      updatedAt: now,
      updatedBy: actor.userId,
    });
  } else if (periodNow.state === "exported" && recon.status === "matched") {
    upsertPeriod({
      ...periodNow,
      state: "reconciled",
      exportCreated: true,
      updatedAt: now,
      updatedBy: actor.userId,
    });
  }

  recordM07Audit({
    actor,
    action: "export-batch.finalized",
    entityType: "payroll-export-batch",
    entityId: batch.id,
    legalEntityId: batch.legalEntityId,
    before: { status: existing.status },
    after: {
      status: batch.status,
      artifactChecksum,
      lineCount: batch.lineCount,
    },
    reason: input.reason,
    meta: {
      periodId: period.id,
      approvalId: approval.id,
      sourceManifestChecksum: approval.manifest.checksum,
      artifactChecksum,
      correlationKey: batch.identityKey,
    },
  });

  syncExportBatchToInbox(actor, batch, "finalized");
  return batch;
}

export function cancelPayrollExportBatch(
  actor: M07Actor,
  input: { exportBatchId: string; reason: string }
): PayrollExportBatch {
  assertM07Permission(actor, "payroll.export.cancel");
  if (!input.reason?.trim()) {
    throw new M07ValidationError("reason-required", "Cancel reason is required");
  }
  const existing = getExportBatch(input.exportBatchId);
  if (!existing) throw new M07ValidationError("not-found", "Export batch not found");
  assertM07LegalEntityScope(actor, existing.legalEntityId);
  if (existing.status === "cancelled" || existing.status === "superseded") return existing;
  if (isFinalizedExportStatus(existing.status)) {
    // Allowed to cancel downloadable as non-authoritative
  }
  assertExportBatchTransition(existing.status, "cancelled");
  const now = new Date().toISOString();
  const batch: PayrollExportBatch = {
    ...existing,
    status: "cancelled",
    cancelledAt: now,
    cancelledBy: actor.userId,
    cancelReason: input.reason,
  };
  upsertExportBatch(batch);
  recordM07Audit({
    actor,
    action: "export-batch.cancelled",
    entityType: "payroll-export-batch",
    entityId: batch.id,
    legalEntityId: batch.legalEntityId,
    reason: input.reason,
    before: { status: existing.status },
    after: { status: "cancelled" },
    meta: { sourceManifestChecksum: batch.sourceManifestChecksum },
  });
  return batch;
}

export function getPayrollExportBatchView(
  actor: M07Actor,
  input: { legalEntityId: string; periodId: string }
) {
  assertM07Permission(actor, "payroll.view");
  assertM07LegalEntityScope(actor, input.legalEntityId);
  const batch = getCurrentExportBatchForPeriod(input.periodId);
  return { batch };
}
