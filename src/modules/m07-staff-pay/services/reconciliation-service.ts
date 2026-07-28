/**
 * Batch 6 — package-level reconciliation (Batch 5 approved package ↔ Batch 6 export).
 * Does NOT parse payroll-provider return files (deferred).
 */

import {
  assertM07LegalEntityScope,
  assertM07Permission,
  M07ValidationError,
  type M07Actor,
} from "../permissions";
import {
  getApproval,
  getExportBatch,
  getReconciliation,
  listReconciliations,
  newReconciliationId,
  upsertExportBatch,
  upsertPeriod,
  upsertReconciliation,
} from "../repository/local-store";
import {
  M07_NON_CERTIFIED_DISCLAIMER,
  type CanonicalExportPackage,
  type ExportBatchTotals,
  type PackageReconciliation,
  type ReconciliationMismatch,
} from "../types/domain";
import { recordM07Audit } from "./audit-service";
import {
  buildCanonicalExportPackage,
  checksumCanonicalExport,
  computeTotalsFromLines,
  emptyTotals,
} from "./export-canonical-service";
import { diffUnits, unitsEqual } from "./export-decimal";
import { getExportProfile } from "../repository/local-store";
import { getPeriod } from "../repository/local-store";
import { assertNoProhibitedFields } from "./sensitive-fields";

function expectedTotalsFromApprovalCanonical(canonical: CanonicalExportPackage): ExportBatchTotals {
  return computeTotalsFromLines(canonical.lines, canonical.totals.grossAmount != null);
}

export function reconcileExportBatchAgainstApproval(
  actor: M07Actor,
  input: { exportBatchId: string }
): PackageReconciliation {
  assertM07Permission(actor, "payroll.export.reconcile");
  assertNoProhibitedFields(input);

  const batch = getExportBatch(input.exportBatchId);
  if (!batch) throw new M07ValidationError("not-found", "Export batch not found");
  assertM07LegalEntityScope(actor, batch.legalEntityId);

  const approval = getApproval(batch.approvalId);
  const period = getPeriod(batch.periodId);
  if (!approval || !period) {
    throw new M07ValidationError("not-found", "Approval or period missing for reconciliation");
  }

  const canonical =
    batch.finalizedCanonical ??
    batch.canonicalPreview ??
    null;
  if (!canonical) {
    throw new M07ValidationError("lifecycle", "No canonical export available to reconcile");
  }

  const profile = getExportProfile(batch.exportProfileId);
  // Rebuild expected from the same pins for population/line coverage checks
  const expectedPkg = profile
    ? buildCanonicalExportPackage({
        period,
        approval,
        exportBatchId: batch.id,
        batchRevision: batch.batchRevision,
        exportProfile: profile,
        previewOnly: canonical.previewOnly,
        generatedAt: canonical.generatedAt,
      })
    : canonical;

  const expectedTotals = expectedTotalsFromApprovalCanonical(expectedPkg);
  const actualTotals = canonical.totals;
  const mismatches: ReconciliationMismatch[] = [];

  if (expectedPkg.legalEntityId !== canonical.legalEntityId) {
    mismatches.push({
      code: "legal-entity-mismatch",
      severity: "blocking",
      message: "Legal entity mismatch between expected and export",
      expected: expectedPkg.legalEntityId,
      actual: canonical.legalEntityId,
    });
  }
  if (expectedPkg.periodId !== canonical.periodId) {
    mismatches.push({
      code: "period-mismatch",
      severity: "blocking",
      message: "Period mismatch between expected and export",
      expected: expectedPkg.periodId,
      actual: canonical.periodId,
    });
  }
  if (expectedPkg.sourceManifestChecksum !== canonical.sourceManifestChecksum) {
    mismatches.push({
      code: "manifest-checksum-mismatch",
      severity: "blocking",
      message: "Source manifest checksum mismatch",
      expected: expectedPkg.sourceManifestChecksum,
      actual: canonical.sourceManifestChecksum,
    });
  }

  const expectedPeople = new Set(approval.manifest.eligiblePersonIds);
  const actualPeople = new Set(canonical.lines.map((l) => l.personId));
  for (const p of expectedPeople) {
    if (!actualPeople.has(p)) {
      mismatches.push({
        code: "population-mismatch",
        severity: "blocking",
        message: `Eligible person ${p} missing from export`,
        personId: p,
      });
    }
  }
  for (const p of actualPeople) {
    if (!expectedPeople.has(p)) {
      mismatches.push({
        code: "population-mismatch",
        severity: "blocking",
        message: `Unexpected person ${p} in export`,
        personId: p,
      });
    }
  }

  if (expectedTotals.lineCount !== actualTotals.lineCount) {
    mismatches.push({
      code: "line-count-mismatch",
      severity: "blocking",
      message: "Line count mismatch",
      expected: expectedTotals.lineCount,
      actual: actualTotals.lineCount,
      difference: actualTotals.lineCount - expectedTotals.lineCount,
    });
  }

  const expectedLineIds = new Set(expectedPkg.lines.map((l) => l.sourceLineId));
  const actualLineIds = new Set(canonical.lines.map((l) => l.sourceLineId));
  for (const id of expectedLineIds) {
    if (!actualLineIds.has(id)) {
      mismatches.push({
        code: "source-line-coverage",
        severity: "blocking",
        message: `Missing source line ${id} in export`,
        sourceLineId: id,
      });
    }
  }
  for (const line of canonical.lines) {
    if (!expectedLineIds.has(line.sourceLineId)) {
      mismatches.push({
        code: "line-reference-mismatch",
        severity: "blocking",
        message: `Unexpected source-line reference ${line.sourceLineId}`,
        sourceLineId: line.sourceLineId,
        exportLineId: line.lineId,
        personId: line.personId,
      });
    }
  }

  const categoryChecks: Array<{
    code: ReconciliationMismatch["code"];
    exp: number;
    act: number;
    label: string;
  }> = [
    {
      code: "ordinary-total-mismatch",
      exp: expectedTotals.ordinaryHours,
      act: actualTotals.ordinaryHours,
      label: "ordinary hours",
    },
    {
      code: "overtime-total-mismatch",
      exp: expectedTotals.overtimeHours,
      act: actualTotals.overtimeHours,
      label: "overtime hours",
    },
    {
      code: "leave-total-mismatch",
      exp: expectedTotals.leaveDays,
      act: actualTotals.leaveDays,
      label: "leave days",
    },
    {
      code: "allowance-total-mismatch",
      exp: expectedTotals.allowanceUnits,
      act: actualTotals.allowanceUnits,
      label: "allowance units",
    },
    {
      code: "deduction-total-mismatch",
      exp: expectedTotals.deductionUnits,
      act: actualTotals.deductionUnits,
      label: "deduction units",
    },
  ];
  for (const c of categoryChecks) {
    if (!unitsEqual(c.exp, c.act)) {
      mismatches.push({
        code: c.code,
        severity: "blocking",
        message: `${c.label} total mismatch`,
        expected: c.exp,
        actual: c.act,
        difference: diffUnits(c.exp, c.act),
      });
    }
  }

  if (
    expectedTotals.grossAmount != null &&
    actualTotals.grossAmount != null &&
    !unitsEqual(expectedTotals.grossAmount, actualTotals.grossAmount)
  ) {
    mismatches.push({
      code: "gross-total-mismatch",
      severity: "blocking",
      message: "Gross amount mismatch",
      expected: expectedTotals.grossAmount,
      actual: actualTotals.grossAmount,
      difference: diffUnits(expectedTotals.grossAmount, actualTotals.grossAmount),
    });
  }

  const blocking = mismatches.filter((m) => m.severity === "blocking");
  const status =
    blocking.length > 0 ? "blocked" : mismatches.length > 0 ? "warning" : "matched";

  const now = new Date().toISOString();
  const exportChecksum = checksumCanonicalExport({ ...canonical, previewOnly: false });
  const row: PackageReconciliation = {
    id: newReconciliationId(),
    legalEntityId: batch.legalEntityId,
    organisationId: batch.organisationId,
    periodId: batch.periodId,
    approvalId: batch.approvalId,
    exportBatchId: batch.id,
    sourceManifestChecksum: batch.sourceManifestChecksum,
    exportChecksum,
    status,
    expectedTotals,
    actualTotals,
    mismatches,
    reconciledAt: now,
    reconciledBy: actor.userId,
    certified: false,
    disclaimer: M07_NON_CERTIFIED_DISCLAIMER,
  };
  upsertReconciliation(row);

  upsertExportBatch({
    ...batch,
    reconciliationId: row.id,
    reconciliationStatus: status,
  });

  if (status === "matched" && (period.state === "exported" || period.state === "export-ready")) {
    upsertPeriod({
      ...period,
      state: "reconciled",
      updatedAt: now,
      updatedBy: actor.userId,
    });
  }

  recordM07Audit({
    actor,
    action:
      status === "matched"
        ? "export-batch.reconciliation-completed"
        : "export-batch.reconciliation-failed",
    entityType: "package-reconciliation",
    entityId: row.id,
    legalEntityId: row.legalEntityId,
    after: { status, mismatchCount: mismatches.length },
    meta: {
      exportBatchId: batch.id,
      periodId: batch.periodId,
      sourceManifestChecksum: batch.sourceManifestChecksum,
      exportChecksum,
    },
  });

  return row;
}

export function getReconciliationView(
  actor: M07Actor,
  input: { legalEntityId: string; periodId: string }
) {
  assertM07Permission(actor, "payroll.view");
  assertM07LegalEntityScope(actor, input.legalEntityId);
  const batch = getExportBatch(
    listReconciliations(input.legalEntityId).find((r) => r.periodId === input.periodId)
      ?.exportBatchId ?? ""
  );
  const recon =
    listReconciliations(input.legalEntityId)
      .filter((r) => r.periodId === input.periodId)
      .sort((a, b) => b.reconciledAt.localeCompare(a.reconciledAt))[0] ?? null;
  return { reconciliation: recon, batch };
}

export function getReconciliationById(actor: M07Actor, id: string): PackageReconciliation | null {
  assertM07Permission(actor, "payroll.view");
  const row = getReconciliation(id);
  if (!row) return null;
  assertM07LegalEntityScope(actor, row.legalEntityId);
  return row;
}

export { emptyTotals };
