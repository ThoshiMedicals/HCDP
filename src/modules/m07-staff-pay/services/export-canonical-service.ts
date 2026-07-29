/**
 * Provider-neutral canonical export representation (Batch 6).
 * Provider adapters sit behind this contract — no Xero/bank/STP/super logic here.
 */

import {
  getCalculationBatch,
  getLeavePrepLine,
  getProfile,
  listDeductionPrepInputs,
} from "../repository/local-store";
import {
  M07_CANONICAL_EXPORT_FORMAT_VERSION,
  M07_NON_CERTIFIED_DISCLAIMER,
  type CanonicalExportLine,
  type CanonicalExportPackage,
  type ExportBatchTotals,
  type ExportProfile,
  type PayPeriodApproval,
  type PayPeriodRecord,
} from "../types/domain";
import { addUnits, multiplyUnitsRate, roundUnits } from "./export-decimal";
import { checksumCanonical } from "./canonical-checksum";

export function emptyTotals(): ExportBatchTotals {
  return {
    lineCount: 0,
    workerCount: 0,
    ordinaryHours: 0,
    overtimeHours: 0,
    leaveDays: 0,
    allowanceUnits: 0,
    deductionUnits: 0,
  };
}

export function computeTotalsFromLines(
  lines: CanonicalExportLine[],
  includeAmounts: boolean
): ExportBatchTotals {
  const totals = emptyTotals();
  const workers = new Set<string>();
  let grossScaled = 0;
  for (const line of lines) {
    workers.add(line.personId);
    totals.lineCount += 1;
    if (line.category === "ordinary") {
      totals.ordinaryHours = addUnits(totals.ordinaryHours, line.units);
    } else if (line.category === "overtime") {
      totals.overtimeHours = addUnits(totals.overtimeHours, line.units);
    } else if (line.category === "leave") {
      totals.leaveDays = addUnits(totals.leaveDays, line.units);
    } else if (line.category === "allowance") {
      totals.allowanceUnits = addUnits(totals.allowanceUnits, line.units);
    } else if (line.category === "deduction") {
      totals.deductionUnits = addUnits(totals.deductionUnits, line.units);
    }
    if (includeAmounts && typeof line.amount === "number") {
      grossScaled += Math.round(line.amount * 100);
    }
  }
  totals.workerCount = workers.size;
  if (includeAmounts) {
    totals.grossAmount = grossScaled / 100;
  }
  return totals;
}

function sortLines(lines: CanonicalExportLine[]): CanonicalExportLine[] {
  return [...lines].sort((a, b) => {
    const c1 = a.externalPayrollEmployeeId.localeCompare(b.externalPayrollEmployeeId);
    if (c1) return c1;
    const c2 = a.category.localeCompare(b.category);
    if (c2) return c2;
    const c3 = a.externalCode.localeCompare(b.externalCode);
    if (c3) return c3;
    return a.sourceLineId.localeCompare(b.sourceLineId);
  });
}

/**
 * Build deterministic canonical package from approved Batch 5 pins.
 * Caller must already have validated readiness / manifest gate.
 */
export function buildCanonicalExportPackage(input: {
  period: PayPeriodRecord;
  approval: PayPeriodApproval;
  exportBatchId: string;
  batchRevision: number;
  exportProfile: ExportProfile;
  previewOnly: boolean;
  generatedAt?: string;
}): CanonicalExportPackage {
  const { period, approval, exportProfile } = input;
  const includeAmounts = Boolean(exportProfile.includeRatesOrMoney);
  const periodRef = `${period.periodStart}_${period.periodEnd}`;
  const lines: CanonicalExportLine[] = [];
  const manifest = approval.manifest;

  for (const personId of [...manifest.eligiblePersonIds].sort()) {
    const profilePin = manifest.profiles.find((p) => p.personId === personId);
    const profile = profilePin ? getProfile(profilePin.profileId) : null;
    const externalId = profile?.externalPayrollEmployeeId?.trim() ?? "";
    const calcPin = manifest.calculations.find((c) => c.personId === personId);
    const batch = calcPin ? getCalculationBatch(calcPin.batchId) : null;

    if (batch) {
      for (const line of batch.lines) {
        const category =
          line.lineType === "ordinary"
            ? "ordinary"
            : line.lineType === "overtime"
              ? "overtime"
              : line.lineType === "allowance"
                ? "allowance"
                : "deduction";
        const units =
          category === "allowance" || category === "deduction"
            ? roundUnits(line.quantity ?? 0)
            : roundUnits(line.hours);
        const rate =
          includeAmounts && profile?.ordinaryHourlyRate != null
            ? roundUnits(profile.ordinaryHourlyRate)
            : undefined;
        let amount: number | undefined;
        if (includeAmounts && rate != null && (category === "ordinary" || category === "overtime")) {
          const mult = category === "overtime" ? 1.5 : 1;
          amount = multiplyUnitsRate(units, rate, mult);
        }
        lines.push({
          lineId: `cline_${batch.id}_${line.id}`,
          externalPayrollEmployeeId: externalId,
          personId,
          legalEntityId: period.legalEntityId,
          periodId: period.id,
          periodRef,
          clinicId: batch.clinicId ?? profile?.clinicId,
          category,
          lineClassification: line.lineType,
          externalCode: line.code ?? line.lineType.toUpperCase(),
          units,
          unitKind: category === "allowance" || category === "deduction" ? "quantity" : "hours",
          amount,
          rate,
          sourceLineId: line.id,
          sourceBatchId: batch.id,
          sourceRef: `calc:${batch.id}:${line.id}`,
          reconRef: `recon:${period.id}:${line.id}`,
          ruleId: line.ruleId,
          ruleVersion: line.ruleVersion,
          exceptionIds: batch.exceptionIds,
        });
      }
    }

    for (const leave of manifest.leavePrep.filter((l) => l.personId === personId)) {
      const row = getLeavePrepLine(leave.leavePrepLineId);
      if (!row) continue;
      lines.push({
        lineId: `cline_leave_${row.id}`,
        externalPayrollEmployeeId: externalId,
        personId,
        legalEntityId: period.legalEntityId,
        periodId: period.id,
        periodRef,
        clinicId: row.clinicId,
        category: "leave",
        lineClassification: "leave",
        externalCode: row.leavePayMapping ?? row.leaveType,
        units: roundUnits(row.leaveDays),
        unitKind: "days",
        sourceLineId: row.id,
        sourceRef: `leave:${row.id}`,
        reconRef: `recon:${period.id}:${row.id}`,
      });
    }

    // Deduction inputs pinned in manifest that may not yet be on calc lines
    for (const d of manifest.deductionInputs.filter((x) => x.personId === personId)) {
      const inputRow = listDeductionPrepInputs(period.legalEntityId).find((x) => x.id === d.inputId);
      if (!inputRow || inputRow.status !== "active") continue;
      const already = lines.some((l) => l.sourceLineId === inputRow.id || l.sourceRef.includes(inputRow.id));
      if (already) continue;
      // Prefer calc-derived deduction lines; skip raw input if calc already covered person deductions
      const hasDeductionLine = lines.some(
        (l) => l.personId === personId && l.category === "deduction"
      );
      if (hasDeductionLine) continue;
      lines.push({
        lineId: `cline_dedin_${inputRow.id}`,
        externalPayrollEmployeeId: externalId,
        personId,
        legalEntityId: period.legalEntityId,
        periodId: period.id,
        periodRef,
        clinicId: inputRow.clinicId,
        category: "deduction",
        lineClassification: "deduction",
        externalCode: inputRow.code,
        units: roundUnits(inputRow.quantity),
        unitKind: "quantity",
        sourceLineId: inputRow.id,
        sourceRef: `dedin:${inputRow.id}`,
        reconRef: `recon:${period.id}:${inputRow.id}`,
      });
    }
  }

  const ordered = sortLines(lines);
  const totals = computeTotalsFromLines(ordered, includeAmounts);

  return {
    formatVersion: M07_CANONICAL_EXPORT_FORMAT_VERSION,
    legalEntityId: period.legalEntityId,
    organisationId: approval.organisationId,
    periodId: period.id,
    periodRef,
    approvalId: approval.id,
    sourceManifestChecksum: manifest.checksum,
    exportBatchId: input.exportBatchId,
    batchRevision: input.batchRevision,
    lines: ordered,
    totals,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    previewOnly: input.previewOnly,
    certified: false,
    paymentReady: false,
    disclaimer: M07_NON_CERTIFIED_DISCLAIMER,
  };
}

export function checksumCanonicalExport(pkg: CanonicalExportPackage): string {
  const { previewOnly: _p, generatedAt: _g, ...stable } = pkg;
  return checksumCanonical(stable);
}

/** Generic CSV adapter — provider-neutral, locale-independent. */
export function serializeCanonicalExportCsv(pkg: CanonicalExportPackage): string {
  const header = [
    "externalPayrollEmployeeId",
    "periodRef",
    "legalEntityId",
    "clinicId",
    "lineClassification",
    "externalCode",
    "units",
    "unitKind",
    "sourceRef",
    "reconRef",
  ];
  const rows = pkg.lines.map((l) =>
    [
      l.externalPayrollEmployeeId,
      l.periodRef,
      l.legalEntityId,
      l.clinicId ?? "",
      l.lineClassification,
      l.externalCode,
      String(l.units),
      l.unitKind,
      l.sourceRef,
      l.reconRef,
    ]
      .map(csvEscape)
      .join(",")
  );
  return [header.join(","), ...rows].join("\n");
}

function csvEscape(v: string): string {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}
