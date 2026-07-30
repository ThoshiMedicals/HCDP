"use client";

/**
 * PPA-1 Foundation UI — adjustment case detail (isolated; pending integration).
 * No calculation, approval, export, or payment controls in PPA-1.
 */

import type { PpaUiCase } from "./AdjustmentRegister";

export type AdjustmentCaseDetailProps = {
  caseRow: PpaUiCase | null;
  loading?: boolean;
  error?: string | null;
  cancelling?: boolean;
  onBack: () => void;
  onCancelDraft?: (caseId: string) => void;
  canCancel?: boolean;
  cancelDeniedReason?: string;
};

function PinRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  const display = value === null || value === undefined || value === "" ? "—" : String(value);
  return (
    <div className="grid gap-1 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)] text-sm min-w-0">
      <dt className="font-medium text-[var(--muted)]">{label}</dt>
      <dd className="break-words font-mono text-xs text-[var(--ink)]">{display}</dd>
    </div>
  );
}

export function AdjustmentCaseDetail({
  caseRow,
  loading = false,
  error = null,
  cancelling = false,
  onBack,
  onCancelDraft,
  canCancel = true,
  cancelDeniedReason,
}: AdjustmentCaseDetailProps) {
  if (loading) {
    return (
      <div className="space-y-3 min-w-0" data-m07-ppa-detail="loading">
        <p className="text-sm text-[var(--muted)]" role="status" aria-live="polite">
          Loading adjustment case…
        </p>
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-[var(--v34-card-line)] px-3 py-2 text-sm"
        >
          Back to register
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3 min-w-0" data-m07-ppa-detail="error">
        <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
          {error}
        </p>
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-[var(--v34-card-line)] px-3 py-2 text-sm"
        >
          Back to register
        </button>
      </div>
    );
  }

  if (!caseRow) {
    return (
      <div className="space-y-3 min-w-0" data-m07-ppa-detail="missing">
        <p className="text-sm text-[var(--muted)]" role="status">
          Adjustment case not found.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-[var(--v34-card-line)] px-3 py-2 text-sm"
        >
          Back to register
        </button>
      </div>
    );
  }

  const isDraft = caseRow.status === "draft";
  const cancelEnabled = isDraft && canCancel && Boolean(onCancelDraft) && !cancelling;
  const cancelTitle = !isDraft
    ? "Cancel is only available for draft adjustments"
    : !canCancel
      ? cancelDeniedReason || "Cancel is not permitted"
      : !onCancelDraft
        ? "Cancel handler not wired"
        : cancelling
          ? "Cancel in progress"
          : undefined;

  return (
    <div className="space-y-4 min-w-0" data-m07-ppa-detail={caseRow.id}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 id="m07-ppa-detail-heading" className="text-base font-semibold text-[var(--ink)]">
            Adjustment case detail
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Immutable source pins for case{" "}
            <span className="font-mono text-xs text-[var(--ink)]">{caseRow.id}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-[var(--v34-card-line)] px-3 py-2 text-sm"
        >
          Back to register
        </button>
      </div>

      <p className="text-sm" role="status">
        Status:{" "}
        <span className="font-semibold" data-status={caseRow.status}>
          {caseRow.status === "draft" ? "Draft" : "Cancelled"}
        </span>
        <span className="sr-only"> ({caseRow.status})</span>
      </p>

      <section
        className="rounded-2xl border border-[var(--v34-card-line)] bg-[var(--card)] p-4 space-y-3 min-w-0"
        aria-labelledby="m07-ppa-periods-heading"
      >
        <h4 id="m07-ppa-periods-heading" className="text-sm font-semibold text-[var(--ink)]">
          Periods
        </h4>
        <dl className="space-y-2">
          <PinRow
            label="Source period"
            value={caseRow.sourcePeriodLabel || caseRow.sourcePeriodId}
          />
          <PinRow label="Source period id" value={caseRow.sourcePeriodId} />
          <PinRow label="Adjustment period id" value={caseRow.adjustmentPeriodId} />
          <PinRow label="Legal entity" value={caseRow.legalEntityId} />
        </dl>
      </section>

      <section
        className="rounded-2xl border border-[var(--v34-card-line)] bg-[var(--card)] p-4 space-y-3 min-w-0"
        aria-labelledby="m07-ppa-pins-heading"
      >
        <h4 id="m07-ppa-pins-heading" className="text-sm font-semibold text-[var(--ink)]">
          Immutable source pins
        </h4>
        <p className="text-xs text-[var(--muted)]">
          Captured at create time. Source ordinary period remains historically immutable.
        </p>
        <dl className="space-y-2">
          <PinRow label="Source period version" value={caseRow.sourcePeriodVersion} />
          <PinRow label="Source locked at" value={caseRow.sourceLockedAt} />
          <PinRow label="Source locked by" value={caseRow.sourceLockedBy} />
          <PinRow label="Source lock id" value={caseRow.sourceLockId} />
          <PinRow label="Source export batch" value={caseRow.sourceExportBatchId} />
          <PinRow label="Source export checksum" value={caseRow.sourceExportChecksum} />
          <PinRow label="Source manifest checksum" value={caseRow.sourceManifestChecksum} />
          <PinRow label="Source reconciliation id" value={caseRow.sourceReconciliationId} />
          <PinRow label="Source approval id" value={caseRow.sourceApprovalId} />
        </dl>
      </section>

      <section
        className="rounded-2xl border border-[var(--v34-card-line)] bg-[var(--card)] p-4 space-y-3 min-w-0"
        aria-labelledby="m07-ppa-reason-heading"
      >
        <h4 id="m07-ppa-reason-heading" className="text-sm font-semibold text-[var(--ink)]">
          Reason and evidence
        </h4>
        <dl className="space-y-2">
          <PinRow label="Reason code" value={caseRow.reasonCode} />
          <div className="grid gap-1 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)] text-sm min-w-0">
            <dt className="font-medium text-[var(--muted)]">Reason text</dt>
            <dd className="break-words text-[var(--ink)]">{caseRow.reasonText}</dd>
          </div>
          <div className="grid gap-1 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)] text-sm min-w-0">
            <dt className="font-medium text-[var(--muted)]">Evidence</dt>
            <dd className="break-words text-[var(--ink)]">
              {caseRow.evidenceRefs && caseRow.evidenceRefs.length > 0
                ? caseRow.evidenceRefs.join(", ")
                : "None provided"}
            </dd>
          </div>
        </dl>
      </section>

      <section
        className="rounded-2xl border border-[var(--v34-card-line)] bg-[var(--card)] p-4 space-y-3 min-w-0"
        aria-labelledby="m07-ppa-audit-heading"
      >
        <h4 id="m07-ppa-audit-heading" className="text-sm font-semibold text-[var(--ink)]">
          Status and audit summary
        </h4>
        <dl className="space-y-2">
          <PinRow label="Created at" value={caseRow.createdAt} />
          <PinRow label="Created by" value={caseRow.createdBy} />
          <PinRow label="Updated at" value={caseRow.updatedAt} />
          <PinRow label="Updated by" value={caseRow.updatedBy} />
          {caseRow.status === "cancelled" ? (
            <>
              <PinRow label="Cancelled at" value={caseRow.cancelledAt} />
              <PinRow label="Cancelled by" value={caseRow.cancelledBy} />
              <PinRow label="Cancel reason" value={caseRow.cancelReason} />
            </>
          ) : null}
        </dl>
      </section>

      <div className="flex flex-wrap gap-2">
        {isDraft ? (
          <button
            type="button"
            onClick={() => {
              if (cancelEnabled && onCancelDraft) onCancelDraft(caseRow.id);
            }}
            disabled={!cancelEnabled}
            aria-disabled={!cancelEnabled}
            aria-describedby={!cancelEnabled ? "m07-ppa-cancel-why" : undefined}
            title={cancelTitle}
            className="rounded-lg border border-[var(--v34-card-line)] px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            data-m07-ppa-cancel="true"
          >
            {cancelling ? "Cancelling…" : "Cancel draft"}
          </button>
        ) : null}
        {!isDraft ? (
          <p id="m07-ppa-cancel-why" className="text-xs text-[var(--muted)]" role="status">
            Cancel is only available while the adjustment is in draft status.
          </p>
        ) : !canCancel ? (
          <p id="m07-ppa-cancel-why" className="text-xs text-[var(--muted)]" role="status">
            Cancel unavailable: {cancelDeniedReason || "permission denied"}
          </p>
        ) : null}
      </div>

      <p className="text-xs text-[var(--muted)]" data-m07-ppa-no-downstream="true">
        PPA-1 foundation UI only — no calculation, approval, export, payment, bank, STP,
        superannuation, or provider controls on this screen.
      </p>
    </div>
  );
}
