"use client";

import { useMemo, useState } from "react";
import { useStaffPay } from "../context";
import { listPayPeriods } from "../services/period-service";
import {
  generateLeavePreparationForPerson,
  listLeavePreparation,
} from "../services/leave-prep-service";
import { listOpenExceptions } from "../services/exception-service";
import { calculatePersonOrdinaryAndOvertime } from "../services/calculate-service";
import {
  createDeductionPrepInput,
  cancelDeductionPrepInput,
  listActiveDeductionPrepInputs,
} from "../services/deduction-prep-input-service";
import { listGenericCodes } from "../services/code-service";
import { listPersonCalculationBatches } from "../services/calculate-service";
import { listProfiles } from "../repository/local-store";
import { hasM07Permission, M07PermissionError, M07ValidationError } from "../permissions";
import { M07_NON_CERTIFIED_DISCLAIMER } from "../types/domain";

export function LeavePrepSection() {
  const { actor, legalEntityId, refresh, tick } = useStaffPay();
  const [periodId, setPeriodId] = useState("");
  const [personId, setPersonId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [dedCodeId, setDedCodeId] = useState("");
  const [dedQty, setDedQty] = useState("1");
  const [dedReason, setDedReason] = useState("");

  const canView = hasM07Permission(actor, "payroll.view");
  const canGenerate = hasM07Permission(actor, "payroll.calculate");
  const canAdjust = hasM07Permission(actor, "payroll.adjust");
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

  const people = useMemo(() => {
    return listProfiles(legalEntityId)
      .filter((p) => p.status === "active")
      .map((p) => p.personId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [legalEntityId, tick]);

  const leaveLines = useMemo(() => {
    if (!activePeriodId || !canView) return [];
    try {
      return listLeavePreparation(actor, legalEntityId, {
        periodId: activePeriodId,
        personId: personId || undefined,
      });
    } catch {
      return [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actor, legalEntityId, activePeriodId, personId, tick, canView]);

  const leaveExceptions = useMemo(() => {
    if (!activePeriodId || !canView) return [];
    try {
      return listOpenExceptions(actor, legalEntityId, { periodId: activePeriodId }).filter(
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
  }, [actor, legalEntityId, activePeriodId, tick, canView]);

  const allowanceLines = useMemo(() => {
    if (!activePeriodId || !personId || !canView) return [];
    try {
      const batches = listPersonCalculationBatches(actor, legalEntityId, personId, activePeriodId);
      const latest = batches.sort((a, b) => b.batchVersion - a.batchVersion)[0];
      return latest?.lines.filter((l) => l.lineType === "allowance") ?? [];
    } catch {
      return [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actor, legalEntityId, activePeriodId, personId, tick, canView]);

  const deductionInputs = useMemo(() => {
    if (!activePeriodId || !canView) return [];
    try {
      return listActiveDeductionPrepInputs(actor, legalEntityId, {
        periodId: activePeriodId,
        personId: personId || undefined,
      });
    } catch {
      return [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actor, legalEntityId, activePeriodId, personId, tick, canView]);

  const deductionCodes = useMemo(() => {
    if (!canView) return [];
    try {
      return listGenericCodes(actor, legalEntityId).filter(
        (c) => c.lineType === "deduction" && c.status === "active"
      );
    } catch {
      return [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actor, legalEntityId, tick, canView]);

  function onGenerateLeave() {
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
        `Leave prep: ${result.prepared.length} line(s), ${result.blockedExceptionIds.length} blocked`
      );
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Leave prep failed");
    }
  }

  function onCalcAllowances() {
    setError(null);
    setStatus(null);
    if (!activePeriodId || !personId) {
      setError("Select period and person");
      return;
    }
    try {
      const result = calculatePersonOrdinaryAndOvertime(actor, {
        periodId: activePeriodId,
        personId,
      });
      if (result.status === "blocked") {
        setStatus(`Blocked — ${result.exceptionIds.length} exception(s)`);
      } else {
        const n = result.batch.lines.filter((l) => l.lineType === "allowance").length;
        setStatus(`Calculated — ${n} allowance line(s) in batch v${result.batch.batchVersion}`);
      }
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Calculate failed");
    }
  }

  function onCreateDeduction() {
    setError(null);
    setStatus(null);
    if (!activePeriodId || !personId) {
      setError("Select period and person");
      return;
    }
    try {
      createDeductionPrepInput(actor, {
        periodId: activePeriodId,
        personId,
        codeId: dedCodeId,
        quantity: Number(dedQty),
        reason: dedReason,
      });
      setStatus("Deduction input created");
      setDedReason("");
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
    <section
      className="space-y-4 min-w-0"
      aria-labelledby="m07-leave-heading"
      data-m07-section="leave"
    >
      <div className="rounded-2xl border border-[var(--v34-card-line)] bg-[var(--card)] p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800" role="status">
          Batch 4 — Leave, Allowances &amp; Deductions · available
        </p>
        <h2 id="m07-leave-heading" className="mt-1 text-lg font-bold">
          Leave &amp; Allowances
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Leave from approved M04 only. Allowances from eligible M06 snapshot inputs + M07 codes.
          Deduction inputs are M07-manual only (quantity/units — not payable).
        </p>
        <p className="mt-2 text-xs text-[var(--muted)]">{M07_NON_CERTIFIED_DISCLAIMER}</p>
      </div>

      {!canView || denied ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
          Permission denied — payroll view is required.
        </div>
      ) : null}

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
            <option value="">Select person</option>
            {people.map((id) => (
              <option key={id} value={id}>
                {id}
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

      <div className="rounded-2xl border border-[var(--v34-card-line)] bg-[var(--card)] p-4 space-y-3">
        <h3 className="font-semibold">Leave preparation</h3>
        <button
          type="button"
          className="rounded-lg bg-[var(--ink)] px-3 py-2 text-sm text-[var(--card)] disabled:opacity-40"
          disabled={!canGenerate || !personId || !activePeriodId}
          onClick={onGenerateLeave}
        >
          Generate leave preparation
        </button>
        <p className="text-xs text-[var(--muted)]">{leaveLines.length} leave line(s)</p>
        {leaveExceptions.length ? (
          <ul className="text-xs text-red-700">
            {leaveExceptions.map((e) => (
              <li key={e.id}>{e.kind}: {e.message}</li>
            ))}
          </ul>
        ) : null}
      </div>

      <div
        className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 space-y-3"
        data-m07-allowances="available-batch4"
        aria-label="Allowance preparation"
      >
        <h3 className="font-semibold text-emerald-950">Allowances — preparation available</h3>
        <p className="text-xs text-emerald-900">
          Non-certified lines from eligible snapshot allowanceInputs mapped to active M07 codes.
          No invented rates or payable totals.
        </p>
        <button
          type="button"
          className="rounded-lg bg-emerald-900 px-3 py-2 text-sm text-white disabled:opacity-40"
          disabled={!canGenerate || !personId || !activePeriodId}
          onClick={onCalcAllowances}
        >
          Calculate (includes allowances)
        </button>
        <ul className="text-sm" aria-label="Allowance preparation lines">
          {!allowanceLines.length ? (
            <li className="text-[var(--muted)]">No allowance lines for selected person/period.</li>
          ) : (
            allowanceLines.map((l) => (
              <li key={l.id}>
                {l.code} · qty {l.quantity} · code v{l.codeVersion} · snapshot {l.snapshotId}
              </li>
            ))
          )}
        </ul>
      </div>

      <div
        className="rounded-2xl border border-[var(--v34-card-line)] bg-[var(--card)] p-4 space-y-3"
        data-m07-deductions="available-batch4"
        aria-label="Deduction preparation inputs"
      >
        <h3 className="font-semibold">Deductions — manual M07 inputs</h3>
        <p className="text-xs text-[var(--muted)]">
          Quantity/units only unless an approved non-certified monetary rule exists (none invented).
        </p>
        <label className="block text-sm" htmlFor="m07-ded-code">
          Deduction code
          <select
            id="m07-ded-code"
            className="mt-1 w-full max-w-md rounded-lg border border-[var(--v34-card-line)] bg-transparent px-3 py-2"
            value={dedCodeId}
            onChange={(e) => setDedCodeId(e.target.value)}
          >
            <option value="">Select code</option>
            {deductionCodes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm" htmlFor="m07-ded-qty">
          Quantity / units
          <input
            id="m07-ded-qty"
            className="mt-1 w-full max-w-xs rounded-lg border border-[var(--v34-card-line)] bg-transparent px-3 py-2"
            value={dedQty}
            onChange={(e) => setDedQty(e.target.value)}
          />
        </label>
        <label className="block text-sm" htmlFor="m07-ded-reason">
          Reason (required)
          <input
            id="m07-ded-reason"
            className="mt-1 w-full max-w-xl rounded-lg border border-[var(--v34-card-line)] bg-transparent px-3 py-2"
            value={dedReason}
            onChange={(e) => setDedReason(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="rounded-lg bg-[var(--ink)] px-3 py-2 text-sm text-[var(--card)] disabled:opacity-40"
          disabled={!canAdjust || !personId || !activePeriodId || !dedCodeId || !dedReason.trim()}
          onClick={onCreateDeduction}
        >
          Create deduction input
        </button>
        <ul className="text-sm" aria-label="Active deduction inputs">
          {deductionInputs.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center gap-2 py-1">
              <span>
                {d.code} · qty {d.quantity} · v{d.version} · {d.reason}
              </span>
              {canAdjust ? (
                <button
                  type="button"
                  className="text-xs underline"
                  onClick={() => {
                    try {
                      cancelDeductionPrepInput(actor, d.id, "cancelled from Leave UI");
                      refresh();
                    } catch (e) {
                      setError(e instanceof Error ? e.message : "Cancel failed");
                    }
                  }}
                >
                  Cancel
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
