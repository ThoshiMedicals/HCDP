"use client";

import { useMemo, useState } from "react";
import { useStaffPay } from "../context";
import { listPayPeriods } from "../services/period-service";
import { buildVarianceViews } from "../services/variance-service";
import { hasM07Permission } from "../permissions";
import { M07_NON_CERTIFIED_DISCLAIMER } from "../types/domain";

export function VariancesSection() {
  const { actor, legalEntityId, tick } = useStaffPay();
  const [periodId, setPeriodId] = useState("");

  const canView = hasM07Permission(actor, "payroll.view");
  const denied = !canView;

  const periods = useMemo(() => {
    if (!canView) return [];
    try {
      return listPayPeriods(actor, legalEntityId);
    } catch {
      return [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actor, legalEntityId, tick, canView]);

  const activePeriodId = periodId || periods[0]?.id || "";

  const rows = useMemo(() => {
    if (!canView || !activePeriodId) return [];
    try {
      return buildVarianceViews(actor, {
        legalEntityId,
        periodId: activePeriodId,
      });
    } catch {
      return [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actor, legalEntityId, activePeriodId, tick, canView]);

  const loading = false;

  return (
    <section
      className="space-y-4 min-w-0"
      aria-labelledby="m07-variances-heading"
      data-m07-section="variances"
    >
      <div className="rounded-2xl border border-[var(--v34-card-line)] bg-[var(--card)] p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800" role="status">
          Batch 4 — Variances · informational
        </p>
        <h2 id="m07-variances-heading" className="mt-1 text-lg font-bold">
          Variances
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Published M05 roster context versus eligible M06 worked-time snapshots. Informational
          only — does not block calculation and invents no tolerance thresholds.
        </p>
        <p className="mt-2 text-xs text-[var(--muted)]">{M07_NON_CERTIFIED_DISCLAIMER}</p>
      </div>

      {!canView || denied ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
          Permission denied — payroll view is required for variances.
        </div>
      ) : null}

      <label className="block text-sm" htmlFor="m07-var-period">
        Pay period
        <select
          id="m07-var-period"
          className="mt-1 w-full max-w-md rounded-lg border border-[var(--v34-card-line)] bg-transparent px-3 py-2"
          value={activePeriodId}
          onChange={(e) => setPeriodId(e.target.value)}
          disabled={!canView}
        >
          {!periods.length ? <option value="">No periods</option> : null}
          {periods.map((p) => (
            <option key={p.id} value={p.id}>
              {p.periodStart} → {p.periodEnd}
            </option>
          ))}
        </select>
      </label>

      {loading ? (
        <p className="text-sm text-[var(--muted)]" role="status">
          Loading variance comparison…
        </p>
      ) : null}

      {!loading && canView && !rows.length ? (
        <div
          className="rounded-2xl border border-dashed border-[var(--v34-card-line)] p-6 text-sm text-[var(--muted)]"
          role="status"
        >
          No variance rows in scope. Create a period and ensure staff profiles exist.
        </div>
      ) : null}

      {rows.length ? (
        <div className="overflow-x-auto rounded-2xl border border-[var(--v34-card-line)]">
          <table className="min-w-full text-left text-sm" aria-label="Variance comparison">
            <thead className="bg-[var(--v34-soft)] text-xs uppercase tracking-wide">
              <tr>
                <th className="px-3 py-2">Person</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Roster ORD</th>
                <th className="px-3 py-2">Worked ORD</th>
                <th className="px-3 py-2">Δ ORD</th>
                <th className="px-3 py-2">Roster OT</th>
                <th className="px-3 py-2">Worked OT</th>
                <th className="px-3 py-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.personId} className="border-t border-[var(--v34-card-line)]">
                  <td className="px-3 py-2">{r.personId}</td>
                  <td className="px-3 py-2">{r.status}</td>
                  <td className="px-3 py-2">{r.rosterOrdinaryHours ?? "—"}</td>
                  <td className="px-3 py-2">{r.workedOrdinaryHours ?? "—"}</td>
                  <td className="px-3 py-2">{r.ordinaryDelta ?? "—"}</td>
                  <td className="px-3 py-2">{r.rosterOvertimeHours ?? "—"}</td>
                  <td className="px-3 py-2">{r.workedOvertimeHours ?? "—"}</td>
                  <td className="px-3 py-2 text-xs text-[var(--muted)]">{r.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
