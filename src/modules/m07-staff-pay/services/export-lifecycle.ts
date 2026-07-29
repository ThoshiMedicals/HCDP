/**
 * Central PayrollExportBatch lifecycle transitions (Batch 6).
 */

import { M07ValidationError } from "../permissions";
import type { PayrollExportBatchStatus } from "../types/domain";

const ALLOWED: Record<PayrollExportBatchStatus, PayrollExportBatchStatus[]> = {
  draft: ["validating", "cancelled"],
  validating: ["blocked", "ready", "cancelled", "failed"],
  blocked: ["validating", "cancelled"],
  ready: ["validating", "finalized", "cancelled", "superseded", "failed"],
  finalized: ["downloadable", "superseded", "cancelled", "failed"],
  downloadable: ["superseded", "cancelled"],
  superseded: [],
  cancelled: [],
  failed: ["superseded"],
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

export function isTerminalExportStatus(status: PayrollExportBatchStatus): boolean {
  return status === "superseded" || status === "cancelled" || status === "failed";
}
