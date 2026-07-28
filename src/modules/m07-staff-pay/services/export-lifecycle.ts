/**
 * Central PayrollExportBatch lifecycle transitions (Batch 6).
 */

import { M07ValidationError } from "../permissions";
import type { PayrollExportBatchStatus } from "../types/domain";

const ALLOWED: Record<PayrollExportBatchStatus, PayrollExportBatchStatus[]> = {
  draft: ["validating", "cancelled"],
  validating: ["blocked", "ready", "cancelled"],
  blocked: ["validating", "cancelled"],
  ready: ["validating", "finalized", "cancelled", "superseded"],
  finalized: ["downloadable", "superseded", "cancelled"],
  downloadable: ["superseded", "cancelled"],
  superseded: [],
  cancelled: [],
};

export function assertExportBatchTransition(
  from: PayrollExportBatchStatus,
  to: PayrollExportBatchStatus
): void {
  if (from === to) return;
  const next = ALLOWED[from] ?? [];
  if (!next.includes(to)) {
    throw new M07ValidationError(
      "illegal-export-lifecycle",
      `Illegal export-batch transition ${from} → ${to}`
    );
  }
}

export function isFinalizedExportStatus(status: PayrollExportBatchStatus): boolean {
  return status === "finalized" || status === "downloadable";
}

export function isMutableExportStatus(status: PayrollExportBatchStatus): boolean {
  return ["draft", "validating", "blocked", "ready"].includes(status);
}
