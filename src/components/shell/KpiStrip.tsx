"use client";

import { cn } from "@/lib/cn";

export type KpiStripItem = {
  id: string;
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: "default" | "critical" | "urgent" | "ontrack" | "overdue";
};

/**
 * Shared Decision A KPI strip primitive (P1-GAP-003).
 * Presentation-only — callers supply values; no domain services.
 */
export function KpiStrip({
  items,
  className,
  "aria-label": ariaLabel = "Key performance indicators",
}: {
  items: KpiStripItem[];
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <section
      data-shell-region="kpi-strip"
      data-testid="shell-kpi-strip"
      aria-label={ariaLabel}
      className={cn(
        "shell-kpi-strip grid w-full min-w-0 gap-2 border-b border-[var(--dp-border-subtle)] bg-[var(--dp-bg-canvas)] px-3 py-2 sm:grid-cols-2 xl:grid-cols-4",
        className
      )}
    >
      {items.map((item) => (
        <article
          key={item.id}
          data-kpi-id={item.id}
          data-kpi-tone={item.tone ?? "default"}
          className="shell-kpi-card"
        >
          <div className="shell-kpi-label">{item.label}</div>
          <div className="shell-kpi-value">{item.value}</div>
          {item.hint ? <div className="shell-kpi-hint">{item.hint}</div> : null}
        </article>
      ))}
    </section>
  );
}
