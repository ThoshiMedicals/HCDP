"use client";

import { useMemo, useState } from "react";
import { useStaffPay } from "../context";
import { listPayPeriods } from "../services/period-service";
import {
  cancelPayrollExportBatch,
  createOrRefreshPayrollExportBatch,
  finalizePayrollExportBatch,
  getPayrollExportBatchView,
} from "../services/export-service";
import { downloadPayrollExportArtifact } from "../services/export-download-service";
import {
  explicitLockPayPeriod,
  getPeriodLockView,
} from "../services/period-lock-service";
import {
  approvePeriodUnlock,
  listUnlockRequestsForPeriod,
  rejectPeriodUnlock,
  requestPeriodUnlock,
} from "../services/period-unlock-service";
import {
  hasM07Permission,
  M07PermissionError,
  M07SeparationOfDutiesError,
  M07ValidationError,
} from "../permissions";
import { M07_NON_CERTIFIED_DISCLAIMER } from "../types/domain";

export function ExportSection() {
  const { actor, legalEntityId, refresh, tick } = useStaffPay();
  const canView = hasM07Permission(actor, "payroll.view");
  const canCreate = hasM07Permission(actor, "payroll.export.create");
  const canDownload = hasM07Permission(actor, "payroll.export.download");
  const canLock = hasM07Permission(actor, "payroll.period.lock");
  const canUnlockReq = hasM07Permission(actor, "payroll.period.unlock.request");
  const canUnlockApprove = hasM07Permission(actor, "payroll.period.unlock.approve");
  const canCancel = hasM07Permission(actor, "payroll.export.cancel");

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
  const [confirmFinalize, setConfirmFinalize] = useState(false);
  const [confirmLock, setConfirmLock] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadPreview, setDownloadPreview] = useState<string | null>(null);

  const selectedPeriodId = periodId || periods[0]?.id || "";

  const view = useMemo(() => {
    if (!selectedPeriodId || !canView) return null;
    try {
      return getPayrollExportBatchView(actor, {
        legalEntityId,
        periodId: selectedPeriodId,
      });
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actor, legalEntityId, selectedPeriodId, tick, canView]);

  const lockView = useMemo(() => {
    if (!selectedPeriodId || !canView) return null;
    try {
      return getPeriodLockView(actor, { legalEntityId, periodId: selectedPeriodId });
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actor, legalEntityId, selectedPeriodId, tick, canView]);

  const unlockReqs = useMemo(() => {
    if (!selectedPeriodId || !canView) return [];
    try {
      return listUnlockRequestsForPeriod(actor, legalEntityId, selectedPeriodId);
    } catch {
      return [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actor, legalEntityId, selectedPeriodId, tick, canView]);

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

  if (!canView) {
    return (
      <section
        className="space-y-3 rounded-2xl border border-[var(--v34-card-line)] bg-[var(--card)] p-6"
        data-m07-shell="batch6-export"
      >
        <h2 className="text-lg font-bold">Export</h2>
        <p className="text-sm text-amber-800" role="status">
          Permission denied — payroll.view is required.
        </p>
      </section>
    );
  }

  const batch = view?.batch;
  const period = periods.find((p) => p.id === selectedPeriodId);
  const blockers = batch?.validationIssues.filter((i) => i.severity === "blocking") ?? [];
  const warnings = batch?.validationIssues.filter((i) => i.severity === "warning") ?? [];

  return (
    <section
      className="space-y-4 rounded-2xl border border-[var(--v34-card-line)] bg-[var(--card)] p-6"
      aria-labelledby="m07-export-heading"
      data-m07-shell="batch6-export"
    >
      <h2 id="m07-export-heading" className="text-lg font-bold text-[var(--ink)]">
        Payroll export preparation
      </h2>
      <p className="text-sm text-[var(--muted)]">
        Non-certified export preparation from an approved Batch 5 package. Not payment, bank,
        STP, superannuation, or Xero execution.
      </p>

      <label className="block text-sm">
        <span className="font-medium">Pay period</span>
        <select
          className="mt-1 w-full rounded-lg border border-[var(--v34-card-line)] bg-[var(--card)] px-3 py-2"
          value={selectedPeriodId}
          onChange={(e) => setPeriodId(e.target.value)}
        >
          {periods.map((p) => (
            <option key={p.id} value={p.id}>
              {p.periodStart} → {p.periodEnd} ({p.state})
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-2 text-sm sm:grid-cols-2">
        <p>
          Period state: <strong>{period?.state ?? "—"}</strong>
        </p>
        <p>
          Export batch: <strong>{batch?.status ?? "none"}</strong>
          {batch ? ` (r${batch.batchRevision})` : ""}
        </p>
        <p>
          Reconciliation: <strong>{batch?.reconciliationStatus ?? "—"}</strong>
        </p>
        <p>
          Lock:{" "}
          <strong>
            {lockView?.lock?.status === "active"
              ? "locked"
              : period?.state === "locked"
                ? "locked"
                : "unlocked"}
          </strong>
        </p>
      </div>
      <p className="text-xs text-slate-600 dark:text-slate-400">
        Operational sequence: finalize → download → optional lock. Download does not require
        lock. Lock rejects ordinary mutations; unlock is controlled remediation (not PPA).
      </p>

      {batch?.canonicalPreview?.previewOnly ? (
        <p className="rounded-lg border border-amber-700/40 bg-amber-500/10 px-3 py-2 text-sm" role="status">
          Showing preview — not a final export artifact.
        </p>
      ) : null}

      {blockers.length > 0 ? (
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-red-700 dark:text-red-300">Blockers</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {blockers.map((b, i) => (
              <li key={`${b.code}-${i}`}>
                {b.code}: {b.message}
                {b.personId ? ` (person ${b.personId})` : ""}
                {b.remediation ? ` — ${b.remediation}` : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {warnings.length > 0 ? (
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">Warnings</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--muted)]">
            {warnings.slice(0, 8).map((w, i) => (
              <li key={`${w.code}-${i}`}>
                {w.code}: {w.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {batch?.totals ? (
        <div className="text-sm text-[var(--muted)]">
          Totals — lines {batch.totals.lineCount}, workers {batch.totals.workerCount}, ordinary{" "}
          {batch.totals.ordinaryHours}, OT {batch.totals.overtimeHours}, leave{" "}
          {batch.totals.leaveDays}
        </div>
      ) : null}

      <label className="block text-sm">
        <span className="font-medium">Reason / note</span>
        <input
          className="mt-1 w-full rounded-lg border border-[var(--v34-card-line)] bg-[var(--card)] px-3 py-2"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Required for lock / unlock / cancel"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!canCreate || !selectedPeriodId}
          title={!canCreate ? "Requires payroll.export.create" : undefined}
          className="rounded-lg border border-[var(--v34-card-line)] px-3 py-2 text-sm disabled:opacity-50"
          onClick={() =>
            run(() => {
              createOrRefreshPayrollExportBatch(actor, { periodId: selectedPeriodId });
              setStatusMsg("Preview refreshed");
            })
          }
        >
          Create / refresh preview
        </button>

        <button
          type="button"
          disabled={!canCreate || batch?.status !== "ready"}
          title={
            !canCreate
              ? "Requires payroll.export.create"
              : batch?.status !== "ready"
                ? "Batch must be ready"
                : undefined
          }
          className="rounded-lg border border-[var(--v34-card-line)] px-3 py-2 text-sm disabled:opacity-50"
          onClick={() => setConfirmFinalize(true)}
        >
          Finalize export
        </button>

        <button
          type="button"
          disabled={!canDownload || batch?.status !== "downloadable"}
          title={
            !canDownload
              ? "Requires payroll.export.download"
              : batch?.status !== "downloadable"
                ? "Only downloadable final artifacts"
                : undefined
          }
          className="rounded-lg border border-[var(--v34-card-line)] px-3 py-2 text-sm disabled:opacity-50"
          onClick={() =>
            run(() => {
              const dl = downloadPayrollExportArtifact(actor, {
                exportBatchId: batch!.id,
              });
              setDownloadPreview(dl.body.slice(0, 400));
              setStatusMsg(`Downloaded ${dl.filename} (${dl.checksum})`);
            })
          }
        >
          Download final CSV
        </button>

        <button
          type="button"
          disabled={
            !canLock ||
            !batch ||
            batch.reconciliationStatus !== "matched" ||
            period?.state === "locked"
          }
          title={!canLock ? "Requires payroll.period.lock" : undefined}
          className="rounded-lg border border-[var(--v34-card-line)] px-3 py-2 text-sm disabled:opacity-50"
          onClick={() => setConfirmLock(true)}
        >
          Lock period
        </button>

        <button
          type="button"
          disabled={!canUnlockReq || period?.state !== "locked"}
          title={!canUnlockReq ? "Requires payroll.period.unlock.request" : undefined}
          className="rounded-lg border border-[var(--v34-card-line)] px-3 py-2 text-sm disabled:opacity-50"
          onClick={() =>
            run(() => {
              requestPeriodUnlock(actor, {
                periodId: selectedPeriodId,
                reason: reason || "Controlled unlock request",
              });
              setStatusMsg("Unlock requested");
            })
          }
        >
          Request unlock
        </button>

        <button
          type="button"
          disabled={!canCancel || !batch}
          title={!canCancel ? "Requires payroll.export.cancel" : undefined}
          className="rounded-lg border border-[var(--v34-card-line)] px-3 py-2 text-sm disabled:opacity-50"
          onClick={() =>
            run(() => {
              cancelPayrollExportBatch(actor, {
                exportBatchId: batch!.id,
                reason: reason || "Cancelled from UI",
              });
              setStatusMsg("Export cancelled");
            })
          }
        >
          Cancel batch
        </button>
      </div>

      {confirmFinalize ? (
        <div className="rounded-lg border border-[var(--v34-card-line)] p-3 text-sm" role="dialog">
          <p>Confirm finalization? This creates an immutable export snapshot (not payment).</p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              className="rounded-lg border px-3 py-1"
              onClick={() => {
                setConfirmFinalize(false);
                run(() => {
                  finalizePayrollExportBatch(actor, {
                    exportBatchId: batch!.id,
                    reason: reason || undefined,
                  });
                  setStatusMsg("Export finalized");
                });
              }}
            >
              Confirm finalize
            </button>
            <button type="button" className="rounded-lg border px-3 py-1" onClick={() => setConfirmFinalize(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {confirmLock ? (
        <div className="rounded-lg border border-[var(--v34-card-line)] p-3 text-sm" role="dialog">
          <p>
            Confirm lock? Locked periods reject ordinary recalculation, re-approval, and re-export.
            Prior-period adjustments are not implemented in Batch 6.
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              className="rounded-lg border px-3 py-1"
              onClick={() => {
                setConfirmLock(false);
                run(() => {
                  explicitLockPayPeriod(actor, {
                    periodId: selectedPeriodId,
                    exportBatchId: batch!.id,
                    reason: reason || "Explicit period lock",
                  });
                  setStatusMsg("Period locked");
                });
              }}
            >
              Confirm lock
            </button>
            <button type="button" className="rounded-lg border px-3 py-1" onClick={() => setConfirmLock(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {unlockReqs.filter((u) => u.status === "requested").length > 0 ? (
        <div className="space-y-2 rounded-lg border border-[var(--v34-card-line)] p-3 text-sm">
          <h3 className="font-semibold">Unlock review</h3>
          {unlockReqs
            .filter((u) => u.status === "requested")
            .map((u) => (
              <div key={u.id} className="flex flex-wrap items-center gap-2">
                <span>
                  {u.reason} (by {u.requestedBy})
                </span>
                <button
                  type="button"
                  disabled={!canUnlockApprove}
                  className="rounded border px-2 py-1 disabled:opacity-50"
                  onClick={() =>
                    run(() => {
                      approvePeriodUnlock(actor, { unlockRequestId: u.id, reason });
                      setStatusMsg("Unlock approved");
                    })
                  }
                >
                  Approve unlock
                </button>
                <button
                  type="button"
                  disabled={!canUnlockApprove}
                  className="rounded border px-2 py-1 disabled:opacity-50"
                  onClick={() =>
                    run(() => {
                      rejectPeriodUnlock(actor, {
                        unlockRequestId: u.id,
                        reason: reason || "Rejected",
                      });
                      setStatusMsg("Unlock rejected");
                    })
                  }
                >
                  Reject
                </button>
              </div>
            ))}
        </div>
      ) : null}

      {downloadPreview ? (
        <pre className="overflow-auto rounded-lg border border-[var(--v34-card-line)] p-2 text-xs">
          {downloadPreview}
        </pre>
      ) : null}

      {statusMsg ? (
        <p className="text-sm text-emerald-700 dark:text-emerald-300" role="status">
          {statusMsg}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-red-700 dark:text-red-300" role="alert">
          {error}
        </p>
      ) : null}

      <p className="text-xs text-[var(--muted)]">{M07_NON_CERTIFIED_DISCLAIMER}</p>
    </section>
  );
}
