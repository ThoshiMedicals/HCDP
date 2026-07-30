"use client";

/**
 * PPA-1 Foundation UI — create prior-period adjustment form (isolated; pending integration).
 * Unlock/reopen is NOT a prior-period adjustment.
 */

import { useId, useState, type FormEvent } from "react";

export type PpaUiLockedSourceOption = {
  periodId: string;
  label: string;
  periodStart: string;
  periodEnd: string;
  legalEntityId: string;
  lockedAt?: string | null;
};

export type CreatePpaUiPayload = {
  sourcePeriodId: string;
  reasonCode: string;
  reasonText: string;
  /** Optional evidence references — empty/omitted when none provided. */
  evidenceRefs?: string[];
};

export type CreateAdjustmentFormProps = {
  lockedSources: PpaUiLockedSourceOption[];
  submitting?: boolean;
  error?: string | null;
  onSubmit: (payload: CreatePpaUiPayload) => void;
  onCancel: () => void;
  canCreate?: boolean;
  createDeniedReason?: string;
};

export type CreateAdjustmentValidation = {
  ok: boolean;
  sourcePeriodId?: string;
  reasonCode?: string;
  reasonText?: string;
  evidenceRefs?: string[];
  fieldErrors: {
    sourcePeriodId?: string;
    reasonCode?: string;
    reasonText?: string;
  };
};

/** Pure validation — exported for focused UI tests without a browser DOM. */
export function validateCreateAdjustmentInput(input: {
  sourcePeriodId: string;
  reasonCode: string;
  reasonText: string;
  evidenceText?: string;
}): CreateAdjustmentValidation {
  const fieldErrors: CreateAdjustmentValidation["fieldErrors"] = {};
  const sourcePeriodId = input.sourcePeriodId.trim();
  const reasonCode = input.reasonCode.trim();
  const reasonText = input.reasonText.trim();

  if (!sourcePeriodId) {
    fieldErrors.sourcePeriodId = "Select a locked ordinary source period.";
  }
  if (!reasonCode) {
    fieldErrors.reasonCode = "Reason code is required.";
  }
  if (!reasonText) {
    fieldErrors.reasonText = "Reason text is required.";
  }

  const evidenceRefs = (input.evidenceText || "")
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  return {
    ok: true,
    sourcePeriodId,
    reasonCode,
    reasonText,
    evidenceRefs: evidenceRefs.length > 0 ? evidenceRefs : undefined,
    fieldErrors: {},
  };
}

export function buildCreateAdjustmentPayload(
  validated: CreateAdjustmentValidation
): CreatePpaUiPayload | null {
  if (!validated.ok || !validated.sourcePeriodId || !validated.reasonCode || !validated.reasonText) {
    return null;
  }
  const payload: CreatePpaUiPayload = {
    sourcePeriodId: validated.sourcePeriodId,
    reasonCode: validated.reasonCode,
    reasonText: validated.reasonText,
  };
  if (validated.evidenceRefs && validated.evidenceRefs.length > 0) {
    payload.evidenceRefs = validated.evidenceRefs;
  }
  return payload;
}

export function CreateAdjustmentForm({
  lockedSources,
  submitting = false,
  error = null,
  onSubmit,
  onCancel,
  canCreate = true,
  createDeniedReason,
}: CreateAdjustmentFormProps) {
  const baseId = useId();
  const sourceId = `${baseId}-source`;
  const reasonCodeId = `${baseId}-reason-code`;
  const reasonTextId = `${baseId}-reason-text`;
  const evidenceId = `${baseId}-evidence`;
  const warningId = `${baseId}-unlock-warning`;
  const errorId = `${baseId}-error`;

  const [sourcePeriodId, setSourcePeriodId] = useState(lockedSources[0]?.periodId ?? "");
  const [reasonCode, setReasonCode] = useState("");
  const [reasonText, setReasonText] = useState("");
  const [evidenceText, setEvidenceText] = useState("");
  const [fieldErrors, setFieldErrors] = useState<CreateAdjustmentValidation["fieldErrors"]>({});

  const denied = !canCreate;
  const formDisabled = denied || submitting;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (formDisabled) return;

    const validated = validateCreateAdjustmentInput({
      sourcePeriodId,
      reasonCode,
      reasonText,
      evidenceText,
    });
    setFieldErrors(validated.fieldErrors);
    if (!validated.ok) return;

    const payload = buildCreateAdjustmentPayload(validated);
    if (!payload) return;
    onSubmit(payload);
  }

  return (
    <form
      className="space-y-4 min-w-0"
      onSubmit={handleSubmit}
      data-m07-ppa-create="true"
      aria-labelledby="m07-ppa-create-heading"
      noValidate
    >
      <div>
        <h3 id="m07-ppa-create-heading" className="text-base font-semibold text-[var(--ink)]">
          Create prior-period adjustment
        </h3>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Bind a new adjustment period to a locked ordinary source. Original history stays immutable.
        </p>
      </div>

      <div
        id={warningId}
        className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100"
        role="status"
        data-m07-ppa-unlock-warning="true"
      >
        <p className="font-semibold">Unlock or reopen is not a prior-period adjustment</p>
        <p className="mt-1">
          Controlled unlock remediates an ordinary period. A PPA creates a separate adjustment
          context that pins the locked source without rewriting it.
        </p>
      </div>

      {denied ? (
        <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
          {createDeniedReason || "Permission denied — cannot create a prior-period adjustment."}
        </p>
      ) : null}

      {error ? (
        <p
          id={errorId}
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <label className="block text-sm text-[var(--ink)]" htmlFor={sourceId}>
        Locked ordinary source period
        <span className="ml-1 text-[var(--muted)]">(required)</span>
        <select
          id={sourceId}
          className="mt-1 w-full max-w-full rounded-lg border border-[var(--v34-card-line)] bg-[var(--card)] px-3 py-2"
          value={sourcePeriodId}
          onChange={(e) => setSourcePeriodId(e.target.value)}
          disabled={formDisabled || lockedSources.length === 0}
          aria-invalid={Boolean(fieldErrors.sourcePeriodId)}
          aria-describedby={
            fieldErrors.sourcePeriodId ? `${warningId} ${sourceId}-err` : warningId
          }
          required
        >
          {lockedSources.length === 0 ? (
            <option value="">No locked ordinary sources available</option>
          ) : (
            lockedSources.map((s) => (
              <option key={s.periodId} value={s.periodId}>
                {s.label} · {s.periodStart}–{s.periodEnd} · LE {s.legalEntityId}
              </option>
            ))
          )}
        </select>
      </label>
      {fieldErrors.sourcePeriodId ? (
        <p id={`${sourceId}-err`} className="text-xs text-red-800" role="alert">
          {fieldErrors.sourcePeriodId}
        </p>
      ) : null}

      <label className="block text-sm text-[var(--ink)]" htmlFor={reasonCodeId}>
        Reason code
        <span className="ml-1 text-[var(--muted)]">(required)</span>
        <input
          id={reasonCodeId}
          type="text"
          className="mt-1 w-full max-w-full rounded-lg border border-[var(--v34-card-line)] bg-[var(--card)] px-3 py-2"
          value={reasonCode}
          onChange={(e) => setReasonCode(e.target.value)}
          disabled={formDisabled}
          aria-invalid={Boolean(fieldErrors.reasonCode)}
          aria-describedby={fieldErrors.reasonCode ? `${reasonCodeId}-err` : undefined}
          autoComplete="off"
          required
        />
      </label>
      {fieldErrors.reasonCode ? (
        <p id={`${reasonCodeId}-err`} className="text-xs text-red-800" role="alert">
          {fieldErrors.reasonCode}
        </p>
      ) : null}

      <label className="block text-sm text-[var(--ink)]" htmlFor={reasonTextId}>
        Reason text
        <span className="ml-1 text-[var(--muted)]">(required)</span>
        <textarea
          id={reasonTextId}
          className="mt-1 w-full max-w-full rounded-lg border border-[var(--v34-card-line)] bg-[var(--card)] px-3 py-2"
          rows={3}
          value={reasonText}
          onChange={(e) => setReasonText(e.target.value)}
          disabled={formDisabled}
          aria-invalid={Boolean(fieldErrors.reasonText)}
          aria-describedby={fieldErrors.reasonText ? `${reasonTextId}-err` : undefined}
          required
        />
      </label>
      {fieldErrors.reasonText ? (
        <p id={`${reasonTextId}-err`} className="text-xs text-red-800" role="alert">
          {fieldErrors.reasonText}
        </p>
      ) : null}

      <label className="block text-sm text-[var(--ink)]" htmlFor={evidenceId}>
        Evidence references
        <span className="ml-1 text-[var(--muted)]">(optional)</span>
        <textarea
          id={evidenceId}
          className="mt-1 w-full max-w-full rounded-lg border border-[var(--v34-card-line)] bg-[var(--card)] px-3 py-2"
          rows={2}
          value={evidenceText}
          onChange={(e) => setEvidenceText(e.target.value)}
          disabled={formDisabled}
          placeholder="One reference per line or comma-separated"
          aria-describedby={`${evidenceId}-hint`}
        />
      </label>
      <p id={`${evidenceId}-hint`} className="text-xs text-[var(--muted)]">
        Optional. Evidence is recorded with the case; it is not payment or export authority.
      </p>

      {submitting ? (
        <p className="text-sm text-[var(--muted)]" role="status" aria-live="polite">
          Submitting prior-period adjustment…
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={formDisabled || lockedSources.length === 0}
          aria-disabled={formDisabled || lockedSources.length === 0}
          title={
            denied
              ? createDeniedReason || "Create not permitted"
              : submitting
                ? "Submit in progress"
                : lockedSources.length === 0
                  ? "No locked ordinary source periods available"
                  : undefined
          }
          className="rounded-lg border border-[var(--v34-card-line)] bg-[var(--card)] px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Creating…" : "Create adjustment"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          aria-disabled={submitting}
          title={submitting ? "Wait for create to finish" : undefined}
          className="rounded-lg border border-[var(--v34-card-line)] px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
        >
          Back to register
        </button>
      </div>
    </form>
  );
}
