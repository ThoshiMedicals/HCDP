"use client";

import { useMemo, useState } from "react";
import { useStaffPay } from "../context";
import { listPayPeriods } from "../services/period-service";
import { getPeriodApprovalView } from "../services/approval-service";
import {
  submitPeriodForReview,
  approvePeriodManagement,
  rejectPeriodManagement,
  withdrawPeriodSubmission,
} from "../services/approval-service";
import {
  hasM07Permission,
  M07PermissionError,
  M07SeparationOfDutiesError,
  M07ValidationError,
} from "../permissions";
import { M07_NON_CERTIFIED_DISCLAIMER } from "../types/domain";

const EXPORT_READY_LABEL =
  "Ready for non-certified export preparation — not certified or payment-ready.";

export function ApprovalSection() {
  const { actor, legalEntityId, refresh, tick } = useStaffPay();
  const canView = hasM07Permission(actor, "payroll.view");
  const canSubmit = hasM07Permission(actor, "payroll.review.submit");
  const canApprove = hasM07Permission(actor, "payroll.approve");
  const denied = !canView;

  const periods = useMemo(() => {
    try {
      return listPayPeriods(actor, legalEntityId);
    } catch {
      return [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actor, legalEntityId, tick]);

  const [periodId, setPeriodId] = useState("");
  const [reason, setReason] = useState("");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedPeriodId = periodId || periods[0]?.id || "";

  const view = useMemo(() => {
    if (!selectedPeriodId || denied) return null;
    try {
      return getPeriodApprovalView(actor, {
        legalEntityId,
        periodId: selectedPeriodId,
      });
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actor, legalEntityId, selectedPeriodId, tick, denied]);

  function run(action: () => void) {
    setError(null);
    setStatusMsg(null);
    try {
      action();
      refresh();
    } catch (e) {
      if (
        e instanceof M07PermissionError ||
        e instanceof M07ValidationError ||
        e instanceof M07SeparationOfDutiesError
      ) {
        setError(e.message);
      } else {
        setError(e instanceof Error ? e.message : "Action failed");
      }
    }
  }

  if (denied) {
    return (
      <section
        className="space-y-3 rounded-2xl border border-[var(--v34-card-line)] bg-[var(--card)] p-6"
        aria-labelledby="m07-approval-denied"
        data-m07-shell="batch5-approval"
      >
        <h2 id="m07-approval-denied" className="text-lg font-bold">
          Approval
        </h2>
        <p className="text-sm text-amber-800" role="status">
          Permission denied — payroll.view is required.
        </p>
      </section>
    );
  }

  const readiness = view?.readiness;
  const current = view?.current;
  const period = view?.period;

  return (
    <section
      className="space-y-4 min-w-0"
      aria-labelledby="m07-approval-heading"
      data-m07-shell="batch5-approval"
    >
      <div className="rounded-2xl border border-[var(--v34-card-line)] bg-[var(--card)] p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800" role="status">
          Batch 5 — management approval · available
        </p>
        <h2 id="m07-approval-heading" className="mt-1 text-lg font-bold">
          Approval
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Management approval of a non-certified payroll-preparation dataset. Not payroll
          certification, payment approval, payment authority, or statutory approval.
        </p>
        <p className="mt-2 text-xs text-[var(--muted)]">{M07_NON_CERTIFIED_DISCLAIMER}</p>
        {period?.state === "export-ready" ? (
          <p className="mt-2 text-sm text-emerald-900" role="status">
            {EXPORT_READY_LABEL}
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-[var(--v34-card-line)] bg-[var(--card)] p-6 space-y-3">
        <label className="block text-sm" htmlFor="m07-apr-period">
          Pay period
          <select
            id="m07-apr-period"
            className="mt-1 w-full max-w-full rounded-lg border border-[var(--v34-card-line)] bg-transparent px-3 py-2"
            value={selectedPeriodId}
            onChange={(e) => setPeriodId(e.target.value)}
          >
            {!periods.length ? <option value="">No periods</option> : null}
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.periodStart} → {p.periodEnd} ({p.state})
              </option>
            ))}
          </select>
        </label>

        {!periods.length ? (
          <p className="text-sm text-[var(--muted)]" role="status">
            Empty — create a pay period in Overview first.
          </p>
        ) : null}

        {readiness ? (
          <div className="space-y-2 text-sm" aria-live="polite">
            <p>
              <span className="font-semibold">Legal entity:</span> {legalEntityId}
            </p>
            <p>
              <span className="font-semibold">Period state:</span> {period?.state ?? "—"}
            </p>
            <p>
              <span className="font-semibold">Readiness:</span> {readiness.status}
            </p>
            <p>
              Clinics: {readiness.includedClinicIds.join(", ") || "—"} · Eligible{" "}
              {readiness.eligiblePersonCount} · Ready {readiness.readyPersonCount} · Blocked{" "}
              {readiness.blockedPersonCount} · Excluded {readiness.excludedPersonCount}
            </p>
            {readiness.blockingReasons.length ? (
              <div>
                <p className="font-semibold text-amber-900">Blocking reasons</p>
                <ul className="list-disc pl-5 text-amber-900">
                  {readiness.blockingReasons.slice(0, 12).map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {readiness.exclusions.length ? (
              <div>
                <p className="font-semibold">Authorised exclusions</p>
                <ul className="list-disc pl-5">
                  {readiness.exclusions.map((ex) => (
                    <li key={`${ex.personId}-${ex.reason}`}>
                      {ex.personId}: {ex.reason} — {ex.message}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-[var(--muted)]" role="status">
            Loading readiness…
          </p>
        )}

        {current ? (
          <div className="rounded-lg border border-[var(--v34-card-line)] p-3 text-sm space-y-1">
            <p>
              <span className="font-semibold">Approval status:</span> {current.status} · v
              {current.approvalVersion}
            </p>
            <p>
              Submitted: {current.submittedBy ?? "—"} @ {current.submittedAt ?? "—"}
            </p>
            <p>
              Approved: {current.approvedBy ?? "—"} @ {current.approvedAt ?? "—"}
            </p>
            <p className="break-all text-xs text-[var(--muted)]">
              Manifest checksum: {current.manifest.checksum}
            </p>
            <p className="text-xs text-[var(--muted)]">
              Eligible people pinned: {current.manifest.eligiblePersonIds.join(", ") || "—"}
            </p>
          </div>
        ) : (
          <p className="text-sm text-[var(--muted)]" role="status">
            No approval record yet.
          </p>
        )}

        <label className="block text-sm" htmlFor="m07-apr-reason">
          Reason (required for reject / withdraw)
          <input
            id="m07-apr-reason"
            className="mt-1 w-full rounded-lg border border-[var(--v34-card-line)] bg-transparent px-3 py-2"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            autoComplete="off"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg border border-[var(--v34-card-line)] px-3 py-2 text-sm disabled:opacity-50"
            disabled={!canSubmit || readiness?.status !== "ready"}
            aria-disabled={!canSubmit || readiness?.status !== "ready"}
            title={
              !canSubmit
                ? "Requires payroll.review.submit"
                : readiness?.status !== "ready"
                  ? "Period readiness incomplete or blocked"
                  : "Submit for management review"
            }
            onClick={() =>
              run(() => {
                const a = submitPeriodForReview(actor, { periodId: selectedPeriodId });
                setStatusMsg(`Submitted v${a.approvalVersion}`);
              })
            }
          >
            Submit for review
          </button>
          <button
            type="button"
            className="rounded-lg border border-[var(--v34-card-line)] px-3 py-2 text-sm disabled:opacity-50"
            disabled={!canApprove || current?.status !== "submitted"}
            aria-disabled={!canApprove || current?.status !== "submitted"}
            title={
              !canApprove
                ? "Requires payroll.approve"
                : current?.status !== "submitted"
                  ? "No submitted package awaiting approval"
                  : "Management approve (non-certified)"
            }
            onClick={() =>
              run(() => {
                const a = approvePeriodManagement(actor, { periodId: selectedPeriodId });
                setStatusMsg(`Management approved v${a.approvalVersion} — ${EXPORT_READY_LABEL}`);
              })
            }
          >
            Management approve
          </button>
          <button
            type="button"
            className="rounded-lg border border-[var(--v34-card-line)] px-3 py-2 text-sm disabled:opacity-50"
            disabled={!canApprove || current?.status !== "submitted" || !reason.trim()}
            aria-disabled={!canApprove || current?.status !== "submitted" || !reason.trim()}
            title={!reason.trim() ? "Rejection reason required" : "Reject submission"}
            onClick={() =>
              run(() => {
                const a = rejectPeriodManagement(actor, {
                  periodId: selectedPeriodId,
                  reason,
                });
                setStatusMsg(`Rejected v${a.approvalVersion}`);
              })
            }
          >
            Reject
          </button>
          <button
            type="button"
            className="rounded-lg border border-[var(--v34-card-line)] px-3 py-2 text-sm disabled:opacity-50"
            disabled={!canSubmit || current?.status !== "submitted" || !reason.trim()}
            aria-disabled={!canSubmit || current?.status !== "submitted" || !reason.trim()}
            title={!reason.trim() ? "Withdrawal reason required" : "Withdraw before approval"}
            onClick={() =>
              run(() => {
                const a = withdrawPeriodSubmission(actor, {
                  periodId: selectedPeriodId,
                  reason,
                });
                setStatusMsg(`Withdrawn v${a.approvalVersion}`);
              })
            }
          >
            Withdraw
          </button>
        </div>

        {statusMsg ? (
          <p className="text-sm text-emerald-900" role="status">
            {statusMsg}
          </p>
        ) : null}
        {error ? (
          <p className="text-sm text-red-800" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </section>
  );
}
