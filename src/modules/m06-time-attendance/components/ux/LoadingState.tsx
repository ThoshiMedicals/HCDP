"use client";

export function LoadingState({ label = "Loading attendance…" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      data-ux-state="loading"
      data-testid="m06-ux-loading"
      className="p-6 text-sm text-[var(--ink)]"
    >
      {label}
    </div>
  );
}
