"use client";

import { useMemo, useState } from "react";
import { useStaffPay } from "../context";
import { listPayPeriods, createOrdinaryPayPeriod } from "../services/period-service";
import { M07PermissionError, M07ValidationError, hasM07Permission } from "../permissions";
import { M07_NON_CERTIFIED_DISCLAIMER } from "../types/domain";

export function OverviewSection() {
  const { actor, legalEntityId, setLegalEntityId, refresh, tick } = useStaffPay();
  const [error, setError] = useState<string | null>(null);
  const [start, setStart] = useState("2026-07-01");
  const [end, setEnd] = useState("2026-07-14");
  const canCreate = hasM07Permission(actor, "payroll.period.create");

  const periods = useMemo(() => {
    try {
      return listPayPeriods(actor, legalEntityId);
    } catch {
      return [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actor, legalEntityId, tick]);

  function onCreate() {
    setError(null);
    try {
      createOrdinaryPayPeriod(actor, {
        legalEntityId,
        periodStart: start,
        periodEnd: end,
      });
      refresh();
    } catch (e) {
      if (e instanceof M07PermissionError || e instanceof M07ValidationError) {
        setError(e.message);
      } else {
        setError(e instanceof Error ? e.message : "Create failed");
      }
    }
  }

  return (
    <section className="space-y-4 min-w-0" aria-labelledby="m07-overview-heading">
      <div className="rounded-2xl border border-[var(--v34-card-line)] bg-[var(--card)] p-6">
        <p className="hcdp-type-meta text-[var(--accent-positive)]" role="status">
          Batch 1 foundation — periods · available
        </p>
        <h2 id="m07-overview-heading" className="hcdp-type-heading mt-1">
          Pay Run Overview
        </h2>
        <p className="hcdp-type-body mt-2 text-[var(--muted)]">
          Create and list ordinary pay periods for one legal entity. Ordinary payroll preparation
          (including management approval, export preparation, package reconciliation, and period
          lock) remains available on the relevant sections according to your permissions and period
          state — non-certified; export is not payment. Prior-period adjustments currently support
          the adjustment register, creation against a locked ordinary source, immutable source pins,
          and draft cancellation. PPA calculation lines, approval, reconciliation, export, and
          payment are not available for adjustments.
        </p>
        <p className="mt-2 text-xs text-[var(--muted)]">{M07_NON_CERTIFIED_DISCLAIMER}</p>
      </div>

      <form
        className="rounded-2xl border border-[var(--v34-card-line)] bg-[var(--card)] p-6 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (canCreate) onCreate();
        }}
      >
        <label className="block text-sm" htmlFor="m07-legal-entity">
          Legal entity (organisation id)
          <input
            id="m07-legal-entity"
            name="legalEntityId"
            className="mt-1 w-full max-w-full rounded-lg border border-[var(--v34-card-line)] bg-transparent px-3 py-2"
            value={legalEntityId}
            onChange={(e) => setLegalEntityId(e.target.value)}
            autoComplete="organization"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm" htmlFor="m07-period-start">
            Period start
            <input
              id="m07-period-start"
              name="periodStart"
              type="date"
              className="mt-1 w-full max-w-full rounded-lg border border-[var(--v34-card-line)] bg-transparent px-3 py-2"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </label>
          <label className="block text-sm" htmlFor="m07-period-end">
            Period end
            <input
              id="m07-period-end"
              name="periodEnd"
              type="date"
              className="mt-1 w-full max-w-full rounded-lg border border-[var(--v34-card-line)] bg-transparent px-3 py-2"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={!canCreate}
          aria-disabled={!canCreate}
          aria-describedby={!canCreate ? "m07-create-period-denied" : undefined}
          className="rounded-lg bg-[var(--ink)] px-3 py-2 text-sm text-[var(--card)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Create ordinary pay period
        </button>
        {!canCreate ? (
          <p id="m07-create-period-denied" className="text-xs text-[var(--muted)]" role="status">
            Unavailable: requires payroll.period.create.
          </p>
        ) : null}
        {error ? (
          <p className="text-sm text-red-700" role="alert">
            Error: {error}
          </p>
        ) : null}
      </form>

      <div className="rounded-2xl border border-[var(--v34-card-line)] bg-[var(--card)] p-6">
        <h3 className="font-semibold">Periods ({periods.length})</h3>
        {periods.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--muted)]">No periods for this legal entity.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {periods.map((p) => (
              <li key={p.id} className="rounded-lg border border-[var(--v34-card-line)] px-3 py-2 break-words">
                <span className="font-medium">{p.id}</span> · {p.periodStart} → {p.periodEnd} ·{" "}
                {p.state} · v{p.version}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
