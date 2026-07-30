"use client";

/**
 * PPA-1 Foundation UI — adjustment register (isolated; pending integration).
 * Unlock/reopen is NOT a prior-period adjustment.
 */

export type PpaUiCaseStatus = "draft" | "cancelled";

/** UI-facing prior-period adjustment case — local types only (not domain/service). */
export type PpaUiCase = {
  id: string;
  status: PpaUiCaseStatus;
  sourcePeriodId: string;
  /** Optional display label for the locked ordinary source period. */
  sourcePeriodLabel?: string;
  adjustmentPeriodId: string;
  legalEntityId: string;
  reasonCode: string;
  reasonText: string;
  evidenceRefs?: string[];
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
  sourcePeriodVersion: number;
  sourceLockedAt?: string | null;
  sourceLockedBy?: string | null;
  sourceLockId?: string | null;
  sourceExportBatchId?: string | null;
  sourceExportChecksum?: string | null;
  sourceManifestChecksum?: string | null;
  sourceReconciliationId?: string | null;
  sourceApprovalId?: string | null;
  cancelledAt?: string | null;
  cancelledBy?: string | null;
  cancelReason?: string | null;
};

export type AdjustmentRegisterProps = {
  cases: PpaUiCase[];
  loading?: boolean;
  onOpenCase: (caseId: string) => void;
  onCreate: () => void;
  canCreate?: boolean;
  createDeniedReason?: string;
};

function statusLabel(status: PpaUiCaseStatus): string {
  return status === "draft" ? "Draft" : "Cancelled";
}

export function AdjustmentRegister({
  cases,
  loading = false,
  onOpenCase,
  onCreate,
  canCreate = true,
  createDeniedReason,
}: AdjustmentRegisterProps) {
  const createDisabled = !canCreate || loading;
  const createTitle = !canCreate
    ? createDeniedReason || "Create adjustment is not permitted"
    : loading
      ? "Loading adjustment register"
      : undefined;

  return (
    <div className="space-y-4 min-w-0" data-m07-ppa-register="true">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 id="m07-ppa-register-heading" className="text-base font-semibold text-[var(--ink)]">
            Prior-period adjustment register
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Controlled corrections against locked ordinary periods. Unlock or reopen is not a PPA.
          </p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          disabled={createDisabled}
          aria-disabled={createDisabled}
          aria-describedby={!canCreate ? "m07-ppa-create-denied" : undefined}
          title={createTitle}
          className="rounded-lg border border-[var(--v34-card-line)] bg-[var(--card)] px-3 py-2 text-sm font-medium text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Create adjustment
        </button>
      </div>

      {!canCreate && createDeniedReason ? (
        <p id="m07-ppa-create-denied" className="text-xs text-[var(--muted)]" role="status">
          Create unavailable: {createDeniedReason}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-[var(--muted)]" role="status" aria-live="polite">
          Loading prior-period adjustments…
        </p>
      ) : null}

      {!loading && cases.length === 0 ? (
        <div
          className="rounded-2xl border border-dashed border-[var(--v34-card-line)] bg-[var(--card)] p-6 text-sm"
          role="status"
          data-m07-ppa-empty="true"
        >
          <p className="font-medium text-[var(--ink)]">No prior-period adjustments yet</p>
          <p className="mt-1 text-[var(--muted)]">
            Create a PPA against a locked ordinary source period. This is not unlock or reopen.
          </p>
          <button
            type="button"
            className="mt-3 rounded-lg border border-[var(--v34-card-line)] px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onCreate}
            disabled={createDisabled}
            aria-disabled={createDisabled}
            title={createTitle}
          >
            Create first adjustment
          </button>
        </div>
      ) : null}

      {!loading && cases.length > 0 ? (
        <div className="min-w-0 overflow-x-auto">
          <table
            className="w-full min-w-[36rem] border-collapse text-left text-sm"
            aria-labelledby="m07-ppa-register-heading"
          >
            <thead>
              <tr className="border-b border-[var(--v34-card-line)] text-[var(--muted)]">
                <th scope="col" className="py-2 pr-3 font-medium">
                  Status
                </th>
                <th scope="col" className="py-2 pr-3 font-medium">
                  Source period
                </th>
                <th scope="col" className="py-2 pr-3 font-medium">
                  Adjustment period
                </th>
                <th scope="col" className="py-2 pr-3 font-medium">
                  Legal entity
                </th>
                <th scope="col" className="py-2 pr-3 font-medium">
                  Reason
                </th>
                <th scope="col" className="py-2 pr-3 font-medium">
                  Created
                </th>
                <th scope="col" className="py-2 font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {cases.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[var(--v34-card-line)] align-top"
                  data-m07-ppa-row={row.id}
                >
                  <td className="py-2 pr-3">
                    <span
                      className={
                        row.status === "draft"
                          ? "font-medium text-amber-900 dark:text-amber-200"
                          : "font-medium text-[var(--muted)]"
                      }
                      data-status={row.status}
                    >
                      {statusLabel(row.status)}
                      <span className="sr-only"> ({row.status})</span>
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-[var(--ink)]">
                    {row.sourcePeriodLabel || row.sourcePeriodId}
                  </td>
                  <td className="py-2 pr-3 font-mono text-xs text-[var(--ink)]">
                    {row.adjustmentPeriodId}
                  </td>
                  <td className="py-2 pr-3 font-mono text-xs text-[var(--ink)]">
                    {row.legalEntityId}
                  </td>
                  <td className="py-2 pr-3 text-[var(--ink)]">
                    <span className="font-medium">{row.reasonCode}</span>
                    <span className="mt-0.5 block text-xs text-[var(--muted)] line-clamp-2">
                      {row.reasonText}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-[var(--muted)]">
                    <time dateTime={row.createdAt}>{row.createdAt}</time>
                    <span className="mt-0.5 block text-xs">by {row.createdBy}</span>
                  </td>
                  <td className="py-2">
                    <button
                      type="button"
                      className="rounded-lg border border-[var(--v34-card-line)] px-2 py-1 text-xs font-medium"
                      onClick={() => onOpenCase(row.id)}
                      aria-label={`Open adjustment ${row.id}`}
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
