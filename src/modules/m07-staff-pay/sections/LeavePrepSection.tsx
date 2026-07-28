"use client";

import { useMemo, useState } from "react";
import { useStaffPay } from "../context";
import { listPayPeriods } from "../services/period-service";
import {
  generateLeavePreparationForPerson,
  listLeavePreparation,
} from "../services/leave-prep-service";
import { listOpenExceptions } from "../services/exception-service";
import { listProfiles } from "../repository/local-store";
import { hasM07Permission } from "../permissions";
import { M07_NON_CERTIFIED_DISCLAIMER } from "../types/domain";

export function LeavePrepSection() {
  const { actor, legalEntityId, refresh, tick } = useStaffPay();
  const [periodId, setPeriodId] = useState("");
  const [personId, setPersonId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const periods = useMemo(() => {
    try {
      return listPayPeriods(actor, legalEntityId);
    } catch {
      return [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actor, legalEntityId, tick]);

  const activePeriodId = periodId || periods[0]?.id || "";

  const people = useMemo(() => {
    return listProfiles(legalEntityId)
      .filter((p) => p.status === "active")
      .map((p) => p.personId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [legalEntityId, tick]);

  const lines = useMemo(() => {
    if (!activePeriodId) return [];
    try {
      return listLeavePreparation(actor, legalEntityId, {
        periodId: activePeriodId,
        personId: personId || undefined,
      });
    } catch {
      return [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actor, legalEntityId, activePeriodId, personId, tick]);

  const leaveExceptions = useMemo(() => {
    try {
      return listOpenExceptions(actor, legalEntityId, {
        periodId: activePeriodId || undefined,
      }).filter(
        (e) =>
          e.kind === "leave-mapping-missing" ||
          e.kind === "unapproved-leave" ||
          e.kind === "unsupported-leave" ||
          e.kind === "doctor-pay-excluded"
      );
    } catch {
      return [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actor, legalEntityId, activePeriodId, tick]);

  const canGenerate = hasM07Permission(actor, "payroll.calculate");

  function onGenerate() {
    setError(null);
    setStatus(null);
    if (!activePeriodId || !personId) {
      setError("Select period and person");
      return;
    }
    try {
      const result = generateLeavePreparationForPerson(actor, {
        periodId: activePeriodId,
        personId,
      });
      setStatus(
        `Prepared ${result.prepared.length}; blocked ${result.blockedExceptionIds.length}`
      );
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Leave preparation failed");
    }
  }

  return (
    <section
      className="space-y-4 min-w-0"
      aria-labelledby="m07-leave-heading"
      data-m07-section="leave"
    >
      <div className="rounded-2xl border border-[var(--v34-card-line)] bg-[var(--card)] p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800" role="status">
          Batch 3 — Leave preparation · available
        </p>
        <h2 id="m07-leave-heading" className="mt-1 text-lg font-bold">
          Leave &amp; Allowances
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Detailed leave-preparation review from approved M04 leave only. Allowances are not
          operational in Batch 3.
        </p>
        <p className="mt-2 text-xs text-[var(--muted)]">{M07_NON_CERTIFIED_DISCLAIMER}</p>
      </div>

      <div
        className="rounded-2xl border border-amber-300 bg-amber-50 p-4"
        role="status"
        aria-label="Allowances planned for Batch 4"
        data-m07-allowances="planned-batch4"
      >
        <p className="text-sm font-semibold text-amber-900">Allowances — Planned for Batch 4</p>
        <p className="mt-1 text-xs text-amber-900">
          Allowance and deduction calculations and editable allowance transactions are unavailable.
          No allowance actions are enabled.
        </p>
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="mt-2 cursor-not-allowed rounded-lg border border-amber-400 px-3 py-2 text-sm opacity-50"
        >
          Allowance actions unavailable
        </button>
      </div>

      <div className="rounded-2xl border border-[var(--v34-card-line)] bg-[var(--card)] p-4 space-y-3">
        <label className="block text-sm" htmlFor="m07-leave-period">
          Pay period
          <select
            id="m07-leave-period"
            className="mt-1 w-full max-w-md rounded-lg border border-[var(--v34-card-line)] bg-transparent px-3 py-2"
            value={activePeriodId}
            onChange={(e) => setPeriodId(e.target.value)}
          >
            {!periods.length ? <option value="">No periods</option> : null}
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.periodStart} → {p.periodEnd}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm" htmlFor="m07-leave-person">
          Person
          <select
            id="m07-leave-person"
            className="mt-1 w-full max-w-md rounded-lg border border-[var(--v34-card-line)] bg-transparent px-3 py-2"
            value={personId}
            onChange={(e) => setPersonId(e.target.value)}
          >
            <option value="">All / select to generate</option>
            {people.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="rounded-lg bg-[var(--ink)] px-3 py-2 text-sm text-[var(--card)] disabled:opacity-40"
          disabled={!canGenerate || !personId || !activePeriodId}
          onClick={onGenerate}
        >
          Generate leave preparation
        </button>
        {error ? (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}
        {status ? (
          <p className="text-sm text-emerald-800" role="status">
            {status}
          </p>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[var(--v34-card-line)]">
        <table className="min-w-full text-left text-sm" aria-label="Leave preparation lines">
          <thead className="bg-[var(--v34-soft)] text-xs uppercase tracking-wide">
            <tr>
              <th className="px-3 py-2">Person</th>
              <th className="px-3 py-2">Leave</th>
              <th className="px-3 py-2">Dates</th>
              <th className="px-3 py-2">Days</th>
              <th className="px-3 py-2">Mapping</th>
              <th className="px-3 py-2">M04 ref</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {!lines.length ? (
              <tr>
                <td className="px-3 py-4 text-[var(--muted)]" colSpan={7}>
                  No leave preparation lines for this filter.
                </td>
              </tr>
            ) : (
              lines.map((l) => (
                <tr key={l.id} className="border-t border-[var(--v34-card-line)]">
                  <td className="px-3 py-2">{l.personId}</td>
                  <td className="px-3 py-2">{l.leaveType}</td>
                  <td className="px-3 py-2 text-xs">
                    {l.startDate} → {l.endDate}
                  </td>
                  <td className="px-3 py-2">{l.leaveDays}</td>
                  <td className="px-3 py-2 text-xs">{l.leavePayMapping || "—"}</td>
                  <td className="px-3 py-2 text-xs">
                    {l.m04LeaveRecordId}@v{l.m04LeaveVersion}
                  </td>
                  <td className="px-3 py-2">{l.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {leaveExceptions.length ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <h3 className="text-sm font-semibold text-red-900">Open leave-related exceptions</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-900">
            {leaveExceptions.map((e) => (
              <li key={e.id}>
                {e.kind}: {e.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
