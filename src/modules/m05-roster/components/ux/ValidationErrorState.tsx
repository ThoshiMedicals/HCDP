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
      className="rounded-lg border border-[#fca5a5] bg-[#fef2f2] px-4 py-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold text-[#b91c1c] text-sm">
            Please fix the following:
          </div>
          <ul className="mt-1 list-disc pl-4 text-sm text-[#991b1b]">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="mt-0.5 text-[#b91c1c] hover:opacity-70"
            aria-label="Dismiss errors"
          >
            ✕
          </button>
        ) : null}
      </div>
    </div>
  );
}
