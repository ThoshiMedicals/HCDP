"use client";

import { useMemo, useState } from "react";
import { useStaffPay } from "../context";
import { listPayPeriods } from "../services/period-service";
import { getCurrentExportBatchForPeriod } from "../repository/local-store";
import { reconcileExportBatchAgainstApproval } from "../services/reconciliation-service";
import { getReconciliation } from "../repository/local-store";
import {
  hasM07Permission,
  M07PermissionError,
  M07ValidationError,
} from "../permissions";
import { M07_NON_CERTIFIED_DISCLAIMER } from "../types/domain";

export function ReconciliationSection() {
  const { actor, legalEntityId, refresh, tick } = useStaffPay();
  const canView = hasM07Permission(actor, "payroll.view");
  const canReconcile = hasM07Permission(actor, "payroll.export.reconcile");

  const periods = useMemo(() => {
    try {
      return listPayPeriods(actor, legalEntityId);
    } catch {
      return [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actor, legalEntityId, tick]);

  const [periodId, setPeriodId] = useState("");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedPeriodId = periodId || periods[0]?.id || "";

  const batch = useMemo(() => {
    if (!selectedPeriodId) return null;
    return getCurrentExportBatchForPeriod(selectedPeriodId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriodId, tick]);

  const recon = useMemo(() => {
    if (!batch?.reconciliationId) return null;
    return getReconciliation(batch.reconciliationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batch?.reconciliationId, tick]);

  function run(action: () => void) {
    setError(null);
    setStatusMsg(null);
    try {
      action();
      refresh();
    } catch (e) {
      if (e instanceof M07PermissionError || e instanceof M07ValidationError) {
        setError(e.message);
      } else {
        setError(e instanceof Error ? e.message : "Action failed");
      }
    }
  }

  if (!canView) {
    return (
      <section className="space-y-3 rounded-2xl border border-[var(--v34-card-line)] bg-[var(--card)] p-6" data-m07-shell="batch6-recon">
        <h2 className="text-lg font-bold">Reconciliation</h2>
        <p className="text-sm text-amber-800">Permission denied — payroll.view is required.</p>
      </section>
    );
  }

  return (
    <section
      className="space-y-4 rounded-2xl border border-[var(--v34-card-line)] bg-[var(--card)] p-6"
      aria-labelledby="m07-recon-heading"
      data-m07-shell="batch6-recon"
    >
      <h2 id="m07-recon-heading" className="text-lg font-bold">
        Package reconciliation
      </h2>
      <p className="text-sm text-[var(--muted)]">
        Compares the Batch 5 approved package to the Batch 6 canonical export. Provider return-file
        parsing is deferred.
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

      <div className="text-sm">
        <p>
          Export batch: <strong>{batch?.status ?? "none"}</strong>
        </p>
        <p>
          Reconciliation: <strong>{recon?.status ?? batch?.reconciliationStatus ?? "—"}</strong>
        </p>
      </div>

      {recon ? (
        <div className="space-y-2 text-sm">
          <p>
            Expected lines {recon.expectedTotals.lineCount} / actual {recon.actualTotals.lineCount}
          </p>
          <p>
            Ordinary {recon.expectedTotals.ordinaryHours} → {recon.actualTotals.ordinaryHours}; OT{" "}
            {recon.expectedTotals.overtimeHours} → {recon.actualTotals.overtimeHours}
          </p>
          {recon.mismatches.length > 0 ? (
            <ul className="list-disc pl-5">
              {recon.mismatches.map((m, i) => (
                <li key={`${m.code}-${i}`}>
                  [{m.severity}] {m.code}: {m.message}
                  {m.sourceLineId ? ` (line ${m.sourceLineId})` : ""}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-emerald-700 dark:text-emerald-300">No mismatches</p>
          )}
        </div>
      ) : null}

      <button
        type="button"
        disabled={!canReconcile || !batch || !["finalized", "downloadable", "ready"].includes(batch.status)}
        title={!canReconcile ? "Requires payroll.export.reconcile" : undefined}
        className="rounded-lg border border-[var(--v34-card-line)] px-3 py-2 text-sm disabled:opacity-50"
        onClick={() =>
          run(() => {
            const row = reconcileExportBatchAgainstApproval(actor, {
              exportBatchId: batch!.id,
            });
            setStatusMsg(`Reconciliation ${row.status}`);
          })
        }
      >
        Run package reconciliation
      </button>

      {statusMsg ? <p className="text-sm text-emerald-700 dark:text-emerald-300">{statusMsg}</p> : null}
      {error ? (
        <p className="text-sm text-red-700 dark:text-red-300" role="alert">
          {error}
        </p>
      ) : null}
      <p className="text-xs text-[var(--muted)]">{M07_NON_CERTIFIED_DISCLAIMER}</p>
    </section>
  );
}
