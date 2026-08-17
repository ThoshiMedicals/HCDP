"use client";

export function ValidationErrorState({
  errors,
  onDismiss,
}: {
  errors: string[];
  onDismiss?: () => void;
}) {
  if (!errors.length) return null;
  return (
    <div
      role="alert"
      data-ux-state="validation-error"
      data-testid="m05-ux-validation-error"
      className="rounded-lg border border-[var(--hcdp-status-critical-border)] bg-[var(--hcdp-status-critical-surface)] px-4 py-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold text-[var(--hcdp-status-critical-text)] text-sm">
            Please fix the following:
          </div>
          <ul className="mt-1 list-disc pl-4 text-sm text-[var(--hcdp-status-critical-text)]">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="mt-0.5 text-[var(--hcdp-status-critical-text)] hover:opacity-70"
            aria-label="Dismiss errors"
          >
            ✕
          </button>
        ) : null}
      </div>
    </div>
  );
}
