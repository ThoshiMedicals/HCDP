"use client";

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--v34-card-line)] bg-[var(--soft)] px-4 py-8 text-center">
      <div className="text-sm font-extrabold text-[var(--ink)]">{title}</div>
      {description ? <p className="mt-1 text-sm text-[var(--muted)]">{description}</p> : null}
    </div>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="rounded-2xl border border-[var(--v34-card-line)] bg-[var(--card)] px-4 py-8 text-center text-sm font-semibold text-[var(--muted)]">
      {label}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="rounded-2xl border border-[color-mix(in_srgb,#b91c1c_30%,var(--line))] bg-[color-mix(in_srgb,#b91c1c_8%,var(--card))] px-4 py-6 text-center">
      <div className="text-sm font-extrabold text-[#991b1b]">{title}</div>
      {description ? <p className="mt-1 text-sm text-[#7f1d1d]">{description}</p> : null}
    </div>
  );
}
