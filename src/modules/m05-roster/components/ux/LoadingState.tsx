"use client";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      className="flex items-center gap-2 py-8 text-sm text-[var(--muted)]"
      role="status"
      aria-live="polite"
      data-ux-state="loading"
      data-testid="m05-ux-loading"
    >
      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[var(--teal-6)] border-t-transparent" />
      {label}
    </div>
  );
}
