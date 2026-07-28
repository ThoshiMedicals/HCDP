"use client";

import { useMemo, useState } from "react";
import { useStaffPay } from "../context";
import { listPayPeriods } from "../services/period-service";
import { buildPeopleReviewRows } from "../services/people-review-read-model";
import { calculatePersonOrdinaryAndOvertime } from "../services/calculate-service";
import { generateLeavePreparationForPerson } from "../services/leave-prep-service";
import { linkExternalPayrollEmployeeId } from "../services/profile-service";
import {
  M07PermissionError,
  M07ValidationError,
  hasM07Permission,
} from "../permissions";
import { M07_NON_CERTIFIED_DISCLAIMER } from "../types/domain";

export function PeopleReviewSection() {
  const { actor, legalEntityId, refresh, tick, setSection } = useStaffPay();
  const [periodId, setPeriodId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [extId, setExtId] = useState("");
  const [extReason, setExtReason] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  const periods = useMemo(() => {
    try {
      return listPayPeriods(actor, legalEntityId);
    } catch {
      return [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actor, legalEntityId, tick]);

  const activePeriodId = periodId || periods[0]?.id || "";

  const rows = useMemo(() => {
    if (!activePeriodId) return [];
    try {
      return buildPeopleReviewRows(actor, {
        legalEntityId,
        periodId: activePeriodId,
      });
    } catch {
      return [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actor, legalEntityId, activePeriodId, tick]);

  const canCalculate = hasM07Permission(actor, "payroll.calculate");
  const canEditExt = hasM07Permission(actor, "payroll.externalId.edit");

  function runCalc(personId: string) {
    setError(null);
    setStatus(null);
    if (!activePeriodId) {
      setError("Select a pay period first");
      return;
    }
    try {
      const result = calculatePersonOrdinaryAndOvertime(actor, {
        periodId: activePeriodId,
        personId,
      });
      if (result.status === "blocked") {
        setStatus(`Blocked — ${result.exceptionIds.length} exception(s) opened`);
      } else {
        setStatus(
          `Calculated batch ${result.batch.batchVersion} · rule ${result.batch.ruleId}@v${result.batch.ruleVersion}`
        );
      }
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Calculate failed");
    }
  }

  function runLeave(personId: string) {
    setError(null);
    setStatus(null);
    if (!activePeriodId) {
      setError("Select a pay period first");
      return;
    }
    try {
      const result = generateLeavePreparationForPerson(actor, {
        periodId: activePeriodId,
        personId,
      });
      setStatus(
        `Leave prep: ${result.prepared.length} line(s), ${result.blockedExceptionIds.length} blocked`
      );
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Leave prep failed");
    }
  }

  function saveExternalId() {
    setError(null);
    if (!selectedProfileId) {
      setError("Select a profile row first");
      return;
    }
    try {
      linkExternalPayrollEmployeeId(actor, selectedProfileId, extId, extReason);
      setStatus("External payroll employee id updated");
      setExtId("");
      setExtReason("");
      refresh();
    } catch (e) {
      if (e instanceof M07PermissionError || e instanceof M07ValidationError) {
        setError(e.message);
      } else {
        setError(e instanceof Error ? e.message : "Update failed");
      }
    }
  }

  return (
    <section
      className="space-y-4 min-w-0"
      aria-labelledby="m07-people-heading"
      data-m07-section="people"
    >
      <div className="rounded-2xl border border-[var(--v34-card-line)] bg-[var(--card)] p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800" role="status">
          Batch 3 — People Review · available
        </p>
        <h2 id="m07-people-heading" className="mt-1 text-lg font-bold">
          People Review
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Non-certified ordinary/OT preparation readiness, classification mapping, leave summary and
          external payroll identifiers. Doctors are excluded.
        </p>
        <p className="mt-2 text-xs text-[var(--muted)]">{M07_NON_CERTIFIED_DISCLAIMER}</p>
      </div>

      <div className="rounded-2xl border border-[var(--v34-card-line)] bg-[var(--card)] p-4 space-y-3">
        <label className="block text-sm" htmlFor="m07-people-period">
          Pay period
          <select
            id="m07-people-period"
            className="mt-1 w-full max-w-md rounded-lg border border-[var(--v34-card-line)] bg-transparent px-3 py-2"
            value={activePeriodId}
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

      {!rows.length ? (
        <div
          className="rounded-2xl border border-dashed border-[var(--v34-card-line)] p-6 text-sm text-[var(--muted)]"
          role="status"
        >
          {activePeriodId
            ? "No staff pay profiles in scope for this legal entity."
            : "Create a pay period in Overview, then return here."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--v34-card-line)]">
          <table className="min-w-full text-left text-sm" aria-label="People review">
            <thead className="bg-[var(--v34-soft)] text-xs uppercase tracking-wide">
              <tr>
                <th className="px-3 py-2">Person</th>
                <th className="px-3 py-2">Mapping</th>
                <th className="px-3 py-2">Rate</th>
                <th className="px-3 py-2">External id</th>
                <th className="px-3 py-2">Calc</th>
                <th className="px-3 py-2">Leave</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.personId}
                  className="border-t border-[var(--v34-card-line)]"
                  data-readiness={row.readiness}
                  data-doctor-excluded={row.doctorExcluded ? "true" : "false"}
                >
                  <td className="px-3 py-2">
                    <div className="font-medium">{row.displayLabel}</div>
                    <div className="text-xs text-[var(--muted)]">{row.personId}</div>
                    {row.doctorExcluded ? (
                      <span className="text-xs text-amber-800">Doctor excluded</span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">
                    <div>{row.mappingStatus}</div>
                    {row.mappingMessage ? (
                      <div className="text-xs text-[var(--muted)]">{row.mappingMessage}</div>
                    ) : null}
                    {row.openExceptions.length ? (
                      <ul className="mt-1 text-xs text-red-700">
                        {row.openExceptions.map((e) => (
                          <li key={e.id}>{e.kind}</li>
                        ))}
                      </ul>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">
                    {row.ordinaryHourlyRate === "redacted" ? (
                      <span className="text-xs text-[var(--muted)]">Redacted</span>
                    ) : (
                      row.ordinaryHourlyRate ?? "—"
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {row.externalPayrollEmployeeId === "redacted" ? (
                      <span className="text-xs text-[var(--muted)]">Redacted</span>
                    ) : (
                      row.externalPayrollEmployeeId || "—"
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {row.latestCalculation ? (
                      <>
                        v{row.latestCalculation.batchVersion}
                        <br />
                        Ord {row.latestCalculation.ordinaryHours} / OT{" "}
                        {row.latestCalculation.overtimeHours}
                        <br />
                        rule@{row.latestCalculation.ruleVersion}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {row.leavePrepSummary.preparedCount} line(s) /{" "}
                    {row.leavePrepSummary.preparedDays} day(s)
                    {row.leavePrepSummary.blockedHint ? (
                      <div className="text-amber-800">Leave blockers</div>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        className="rounded border border-[var(--v34-card-line)] px-2 py-1 text-xs disabled:opacity-40"
                        disabled={!canCalculate || row.doctorExcluded}
                        onClick={() => runCalc(row.personId)}
                      >
                        Calculate OT/Ord
                      </button>
                      <button
                        type="button"
                        className="rounded border border-[var(--v34-card-line)] px-2 py-1 text-xs disabled:opacity-40"
                        disabled={!canCalculate || row.doctorExcluded}
                        onClick={() => runLeave(row.personId)}
                      >
                        Prep leave
                      </button>
                      <button
                        type="button"
                        className="rounded border border-[var(--v34-card-line)] px-2 py-1 text-xs"
                        onClick={() => {
                          setSelectedProfileId(row.profileId ?? null);
                          setSection("leave");
                        }}
                      >
                        Open leave
                      </button>
                      {canEditExt && row.profileId ? (
                        <button
                          type="button"
                          className="rounded border border-[var(--v34-card-line)] px-2 py-1 text-xs"
                          onClick={() => setSelectedProfileId(row.profileId!)}
                        >
                          Edit external id
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {canEditExt && selectedProfileId ? (
        <form
          className="rounded-2xl border border-[var(--v34-card-line)] bg-[var(--card)] p-4 space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            saveExternalId();
          }}
          aria-label="External payroll employee id"
        >
          <p className="text-sm font-medium">External payroll employee id</p>
          <p className="text-xs text-[var(--muted)]">Profile {selectedProfileId}</p>
          <label className="block text-sm" htmlFor="m07-ext-id">
            Identifier
            <input
              id="m07-ext-id"
              className="mt-1 w-full max-w-md rounded-lg border border-[var(--v34-card-line)] bg-transparent px-3 py-2"
              value={extId}
              onChange={(e) => setExtId(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm" htmlFor="m07-ext-reason">
            Reason (required)
            <input
              id="m07-ext-reason"
              className="mt-1 w-full max-w-md rounded-lg border border-[var(--v34-card-line)] bg-transparent px-3 py-2"
              value={extReason}
              onChange={(e) => setExtReason(e.target.value)}
              required
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-[var(--ink)] px-3 py-2 text-sm text-[var(--card)]"
          >
            Save external id
          </button>
        </form>
      ) : null}
    </section>
  );
}
