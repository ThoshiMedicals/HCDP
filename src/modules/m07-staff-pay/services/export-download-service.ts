/**
 * Batch 6 — secure, permission-controlled, audited export download.
 * Uses in-module artifact storage (no unapproved cloud integration).
 */

import {
  assertM07LegalEntityScope,
  assertM07Permission,
  M07ValidationError,
  type M07Actor,
} from "../permissions";
import {
  getActivePeriodLockForPeriod,
  getExportBatch,
  newDownloadRecordId,
  upsertExportBatch,
} from "../repository/local-store";
import type { PayrollExportBatch } from "../types/domain";
import { recordM07Audit } from "./audit-service";
import { checksumCanonicalExport } from "./export-canonical-service";
import { isFinalizedExportStatus } from "./export-lifecycle";
import { assertApprovedManifestForExport } from "./export-manifest-gate";
import { assertNoProhibitedFields } from "./sensitive-fields";

export type ExportDownloadResult = {
  filename: string;
  contentType: "text/csv";
  body: string;
  checksum: string;
  exportBatchId: string;
  downloadId: string;
};

/**
 * Download final artifact only. Preview cannot download as final.
 * Audit write failure fails closed.
 */
export function downloadPayrollExportArtifact(
  actor: M07Actor,
  input: { exportBatchId: string }
): ExportDownloadResult {
  assertM07Permission(actor, "payroll.export.download");
  assertNoProhibitedFields(input);

  const batch = getExportBatch(input.exportBatchId);
  if (!batch) throw new M07ValidationError("not-found", "Export batch not found");
  assertM07LegalEntityScope(actor, batch.legalEntityId);

  if (batch.status === "cancelled" || batch.status === "superseded") {
    throw new M07ValidationError(
      "not-authoritative",
      `Export batch is ${batch.status} and not available as current authoritative export`
    );
  }
  if (!isFinalizedExportStatus(batch.status) || batch.status !== "downloadable") {
    throw new M07ValidationError(
      "not-downloadable",
      "Only a downloadable finalized export may be downloaded"
    );
  }
  if (batch.reconciliationStatus !== "matched") {
    throw new M07ValidationError(
      "reconciliation-incomplete",
      "Download requires matched package reconciliation"
    );
  }
  if (!batch.artifact || !batch.artifactBody || !batch.finalizedCanonical) {
    throw new M07ValidationError("artifact-missing", "Final artifact missing");
  }
  if (batch.finalizedCanonical.previewOnly) {
    throw new M07ValidationError("preview-not-final", "Preview cannot download as final");
  }

  // Live source still must verify for non-locked; locked uses allowLockedPeriod
  const locked = Boolean(getActivePeriodLockForPeriod(batch.periodId));
  assertApprovedManifestForExport(actor, {
    periodId: batch.periodId,
    approvalId: batch.approvalId,
    allowLockedPeriod: locked,
  });

  const liveChecksum = checksumCanonicalExport(batch.finalizedCanonical);
  if (liveChecksum !== batch.artifact.checksum) {
    throw new M07ValidationError(
      "artifact-checksum-mismatch",
      "Retained artifact checksum does not match canonical snapshot"
    );
  }

  const downloadId = newDownloadRecordId();
  const correlationKey = `download::${batch.id}::${downloadId}`;
  const now = new Date().toISOString();

  let auditOk = false;
  try {
    recordM07Audit({
      actor,
      action: "export-batch.downloaded",
      entityType: "payroll-export-batch",
      entityId: batch.id,
      legalEntityId: batch.legalEntityId,
      meta: {
        downloadId,
        artifactChecksum: batch.artifact.checksum,
        filename: batch.artifact.filename,
        correlationKey,
        periodId: batch.periodId,
        sourceManifestChecksum: batch.sourceManifestChecksum,
      },
    });
    auditOk = true;
  } catch {
    auditOk = false;
  }
  if (!auditOk) {
    throw new M07ValidationError(
      "audit-failed",
      "Download refused because required audit event could not be written"
    );
  }

  const updated: PayrollExportBatch = {
    ...batch,
    downloadHistory: [
      ...batch.downloadHistory,
      {
        id: downloadId,
        downloadedAt: now,
        downloadedBy: actor.userId,
        artifactChecksum: batch.artifact.checksum,
        correlationKey,
      },
    ],
  };
  upsertExportBatch(updated);

  return {
    filename: batch.artifact.filename,
    contentType: "text/csv",
    body: batch.artifactBody,
    checksum: batch.artifact.checksum,
    exportBatchId: batch.id,
    downloadId,
  };
}
