"use client";

import { useMemo, useState } from "react";
import { useStaffPay } from "../context";
import {
  listPayPrepExceptions,
  resolvePayPrepException,
  waivePayPrepException,
  isWaivableExceptionKind,
  isNonWaivableExceptionKind,
} from "../services/exception-service";
import {
  M07PermissionError,
  M07ValidationError,
  hasM07Permission,
} from "../permissions";
import { M07SeparationOfDutiesError } from "../permissions";
import { M07_NON_CERTIFIED_DISCLAIMER, type PayPrepExceptionKind } from "../types/domain";

export function ExceptionsSection() {
  const { actor, legalEntityId, refresh, tick, setSection } = useStaffPay();
  const [kind, setKind] = useState<string>("");
  const [status, setStatus] = useState<"open" | "resolved" | "waived" | "all">("open");
  const [personId, setPersonId] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const canView = hasM07Permission(actor, "payroll.exception.view");
  const canResolve = hasM07Permission(actor, "payroll.exception.resolve");
  const canWaive = hasM07Permission(actor, "payroll.exception.waive");
  const denied = !canView;

  const rows = useMemo(() => {
    if (!canView) return [];
    try {
      return listPayPrepExceptions(actor, legalEntityId, {
        status,
        personId: personId || undefined,
        kind: (kind || undefined) as PayPrepExceptionKind | undefined,
      });
    } catch {
      return [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actor, legalEntityId, status, personId, kind, tick, canView]);

  function onResolve(id: string) {
    setError(null);
    setOk(null);
    try {
      resolvePayPrepException(actor, id, reason);
      setOk("Exception resolved");
      setReason("");
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Resolve failed");
    }
  }

  function onWaive(id: string) {
    setError(null);
    setOk(null);
    try {
      waivePayPrepException(actor, id, reason);
      setOk("Exception waived (preparation only — not payroll approval)");
      setReason("");
      refresh();
    } catch (e) {
      if (
        e instanceof M07PermissionError ||
        e instanceof M07ValidationError ||
        e instanceof M07SeparationOfDutiesError
      ) {
        setError(e.message);
      } else {
        setError(e instanceof Error ? e.message : "Waive failed");
      }
    }
  }

  return (
    <section
      className="space-y-4 min-w-0"
      aria-labelledby="m07-exceptions-heading"
      data-m07-section="exceptions"
    >
      <div className="rounded-2xl border border-[var(--v34-card-line)] bg-[var(--card)] p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800" role="status">
          Batch 4 — Exceptions · available
        </p>
        <h2 id="m07-exceptions-heading" className="mt-1 text-lg font-bold">
          Exceptions
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Resolve or waive preparation blockers. Waiver is not payroll approval, certification or
          payment authority. History is retained.
        </p>
        <p className="mt-2 text-xs text-[var(--muted)]">{M07_NON_CERTIFIED_DISCLAIMER}</p>
      </div>

      {!canView || denied ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
          Permission denied — exception view is required.
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-sm" htmlFor="m07-ex-status">
          Status
          <select
            id="m07-ex-status"
            className="mt-1 w-full rounded-lg border border-[var(--v34-card-line)] bg-transparent px-3 py-2"
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
          >
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
            <option value="waived">Waived</option>
            <option value="all">All</option>
          </select>
        </label>
        <label className="block text-sm" htmlFor="m07-ex-person">
          Person id
          <input
            id="m07-ex-person"
            className="mt-1 w-full rounded-lg border border-[var(--v34-card-line)] bg-transparent px-3 py-2"
            value={personId}
            onChange={(e) => setPersonId(e.target.value)}
          />
        </label>
        <label className="block text-sm" htmlFor="m07-ex-kind">
          Kind
          <input
            id="m07-ex-kind"
            className="mt-1 w-full rounded-lg border border-[var(--v34-card-line)] bg-transparent px-3 py-2"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            placeholder="optional filter"
          />
        </label>
      </div>

      <label className="block text-sm" htmlFor="m07-ex-reason">
        Reason (required for resolve / waive)
        <input
          id="m07-ex-reason"
          className="mt-1 w-full max-w-xl rounded-lg border border-[var(--v34-card-line)] bg-transparent px-3 py-2"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </label>

      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {ok ? (
        <p className="text-sm text-emerald-800" role="status">
          {ok}
        </p>
      ) : null}

      {!rows.length && canView ? (
        <div
          className="rounded-2xl border border-dashed border-[var(--v34-card-line)] p-6 text-sm text-[var(--muted)]"
          role="status"
        >
          No exceptions match the current filters.
        </div>
      ) : null}

      {rows.length ? (
        <ul className="space-y-3" aria-label="Pay preparation exceptions">
          {rows.map((ex) => {
            const waivable = isWaivableExceptionKind(ex.kind);
            const nonWaivable = isNonWaivableExceptionKind(ex.kind);
            return (
              <li
                key={ex.id}
                className="rounded-2xl border border-[var(--v34-card-line)] bg-[var(--card)] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">
                      {ex.kind}{" "}
                      <span className="text-xs font-normal text-[var(--muted)]">({ex.status})</span>
                    </p>
                    <p className="mt-1 text-sm">{ex.message}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      Person {ex.personId}
                      {ex.clinicId ? ` · Clinic ${ex.clinicId}` : ""}
                      {ex.periodId ? ` · Period ${ex.periodId}` : ""}
                    </p>
                    {nonWaivable ? (
                      <p className="mt-1 text-xs font-semibold text-amber-900">Non-waivable</p>
                    ) : waivable ? (
                      <p className="mt-1 text-xs text-emerald-800">Waivable (SoD enforced)</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-lg border border-[var(--v34-card-line)] px-3 py-1 text-xs"
                      onClick={() => setSection("people")}
                    >
                      People Review
                    </button>
                    {ex.status === "open" && canResolve ? (
                      <button
                        type="button"
                        className="rounded-lg bg-[var(--ink)] px-3 py-1 text-xs text-[var(--card)] disabled:opacity-40"
                        disabled={!reason.trim()}
                        onClick={() => onResolve(ex.id)}
                      >
                        Resolve
                      </button>
                    ) : null}
                    {ex.status === "open" && canWaive && waivable ? (
                      <button
                        type="button"
                        className="rounded-lg border border-amber-500 px-3 py-1 text-xs text-amber-900 disabled:opacity-40"
                        disabled={!reason.trim()}
                        onClick={() => onWaive(ex.id)}
                      >
                        Waive
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
