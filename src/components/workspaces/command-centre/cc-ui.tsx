"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { HealthBand, PriorityLevel } from "@/lib/command-centre/types";
import { bandTone, priorityTone } from "@/lib/command-centre/utils";

export function CcCard({
  children,
  className,
  accent,
  collapsed,
}: {
  children: React.ReactNode;
  className?: string;
  accent?: string;
  collapsed?: boolean;
}) {
  return (
    <section
      className={cn(
        "min-w-0 max-w-full rounded-2xl border border-[var(--cc-card-line)] bg-[var(--cc-card)] text-[var(--cc-ink)] shadow-[var(--cc-shadow)]",
        collapsed && "opacity-80",
        className
      )}
      style={accent ? { borderTop: `3px solid ${accent}` } : undefined}
    >
      {children}
    </section>
  );
}

export function CcCardHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-start justify-between gap-2 px-4 pt-4">
      <div className="min-w-0 flex-1">
        <h3 className="m-0 text-[14px] font-extrabold tracking-tight text-[var(--cc-ink)]">{title}</h3>
        {subtitle ? <p className="m-0 mt-0.5 text-[length:var(--type-control)] leading-snug text-[var(--cc-muted)]">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap justify-end gap-1.5">{actions}</div> : null}
    </div>
  );
}

const SHORT_PRIORITY: Record<string, string> = {
  Emergency: "Emergency",
  Urgent: "Urgent",
  "Attention Required": "Attention",
  Routine: "Routine",
  Overdue: "Overdue",
  "Completed Today": "Completed",
};

export function PriorityBadge({
  priority,
  short,
}: {
  priority: PriorityLevel;
  short?: boolean;
}) {
  const tone = priorityTone(priority);
  const styles = {
    danger: "cc-badge-danger border",
    warn: "cc-badge-warn border",
    info: "cc-badge-info border",
    success: "cc-badge-success border",
    default: "cc-badge-default border",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center truncate rounded-md border px-1.5 py-0.5 text-[length:var(--type-control)] font-extrabold uppercase tracking-wide",
        styles[tone],
        priority === "Emergency" && "cc-pulse"
      )}
    >
      {short ? SHORT_PRIORITY[priority] ?? priority : priority}
    </span>
  );
}

export function HealthDot({ band, score }: { band: HealthBand; score?: number | null }) {
  const tone = bandTone(band);
  const colors = {
    success: "bg-[#16a34a]",
    info: "bg-[#2563eb]",
    warn: "bg-[#d97706]",
    danger: "bg-[#dc2626]",
    default: "bg-[#94a3b8]",
  } as const;
  const label =
    score === null || band === "Data incomplete"
      ? "—"
      : score !== undefined
        ? `${score}%`
        : band;
  return (
    <span className="inline-flex items-center gap-1 text-[length:var(--type-control)] font-bold text-[var(--cc-muted)]" title={band}>
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", colors[tone])} />
      {label}
    </span>
  );
}

export function HealthBadge({
  band,
  score,
  compact,
}: {
  band: HealthBand;
  score?: number | null;
  compact?: boolean;
}) {
  const tone = bandTone(band);
  const styles = {
    success: "cc-badge-success",
    info: "cc-badge-info",
    warn: "cc-badge-warn",
    danger: "cc-badge-danger",
    default: "cc-badge-default",
  } as const;
  if (compact) {
    return (
      <span className={cn("inline-flex items-center rounded-md px-1.5 py-0.5 text-[length:var(--type-control)] font-bold tabular-nums", styles[tone])}>
        {score === null || band === "Data incomplete" ? "—" : `${score}%`}
      </span>
    );
  }
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[length:var(--type-control)] font-bold", styles[tone])}>
      {score === null || band === "Data incomplete"
        ? "Data incomplete"
        : score !== undefined
          ? `${score}% · ${band}`
          : band}
    </span>
  );
}

export function StatBlock({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: "default" | "danger" | "warn" | "success" | "info";
}) {
  const valueColor =
    tone === "danger"
      ? "text-[color:var(--danger,#dc2626)]"
      : tone === "warn"
        ? "text-[color:var(--warning,#d97706)]"
        : tone === "success"
          ? "text-[color:var(--success,#16a34a)]"
          : tone === "info"
            ? "text-[color:var(--cc-exec,#1e40af)]"
            : "text-[var(--cc-ink)]";
  const asText = typeof value === "string" || typeof value === "number" ? String(value) : "";
  const long = asText.length > 9;
  return (
    <div className="flex min-h-[70px] min-w-0 max-w-full flex-col justify-center rounded-xl border border-[var(--cc-card-line)] bg-[var(--cc-soft)] px-2.5 py-2">
      <div
        className="line-clamp-2 text-[length:var(--type-control)] font-bold uppercase leading-tight tracking-wide text-[var(--cc-muted)]"
        title={label}
      >
        {label}
      </div>
      <div
        className={cn(
          "mt-1 min-w-0 break-words font-black tracking-tight tabular-nums leading-none",
          long ? "text-[14px] sm:text-[16px]" : "text-[20px] sm:text-[22px]",
          valueColor
        )}
      >
        {value}
      </div>
      {hint ? <div className="mt-1 line-clamp-2 text-[length:var(--type-control)] leading-snug text-[var(--cc-muted)]">{hint}</div> : null}
    </div>
  );
}

export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("grid gap-1 text-xs font-bold text-[var(--cc-muted)]", className)}>
      {label}
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-[var(--cc-card-line)] bg-[var(--cc-card)] px-3 py-2 text-sm font-semibold text-[var(--cc-ink)] outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cc-exec,#1e40af)]";

export function MiniBars(props: { series: number[]; labels?: string[] }) {
  return <TrendChartBlock series={props.series} labels={props.labels} compact />;
}

export function TrendChartBlock({
  title,
  period,
  comparison,
  series,
  labels,
  summary,
  values,
  change,
  direction,
  tableRows,
  compact,
}: {
  title?: string;
  period?: string;
  comparison?: string;
  series: number[];
  labels?: string[];
  summary?: string;
  values?: string;
  change?: string;
  direction?: "up" | "down" | "flat";
  tableRows?: Array<{ label: string; value: string }>;
  compact?: boolean;
}) {
  const max = Math.max(...series, 1);
  const [showTable, setShowTable] = useState(false);
  const directionClass =
    direction === "up"
      ? "cc-text-success"
      : direction === "down"
        ? "cc-text-danger"
        : "text-[var(--cc-muted)]";

  return (
    <div>
      {!compact && title ? (
        <div className="mb-1.5">
          {title ? <strong className="block text-[13px]">{title}</strong> : null}
          {period ? (
            <span className="text-[length:var(--type-control)] font-bold text-[var(--cc-muted)]">
              {period}
              {comparison ? ` · vs ${comparison}` : ""}
            </span>
          ) : null}
        </div>
      ) : null}
      {(values || change) && !compact ? (
        <div className="mb-1 flex items-baseline justify-between gap-2">
          {values ? <span className="text-xl font-black tabular-nums">{values}</span> : null}
          {change ? <span className={cn("text-xs font-bold", directionClass)}>{change}</span> : null}
        </div>
      ) : null}
      <div
        className={cn("flex items-end gap-1", compact ? "h-10" : "h-14")}
        role="img"
        aria-label={`Trend chart${title ? `: ${title}` : ""}. Values: ${series.join(", ")}`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setShowTable((v) => !v);
          }
        }}
      >
        {series.map((v, i) => (
          <div
            key={i}
            className="min-w-[6px] flex-1 rounded-sm bg-[color-mix(in_srgb,var(--cc-exec,#1e40af)_70%,transparent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1"
            style={{ height: `${Math.max(12, (v / max) * 100)}%` }}
            title={`${labels?.[i] ?? `Point ${i + 1}`}: ${v}`}
          />
        ))}
      </div>
      {summary && !compact ? <p className="m-0 mt-1 text-[length:var(--type-control)] text-[var(--cc-muted)]">{summary}</p> : null}
      <button
        type="button"
        className="mt-1 text-[length:var(--type-control)] font-bold text-[var(--cc-exec,#1e40af)] underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        onClick={() => setShowTable((v) => !v)}
        aria-expanded={showTable}
      >
        {showTable ? "Hide table" : "View as Table"}
      </button>
      {showTable ? (
        <table className="mt-1 w-full text-left text-[length:var(--type-control)]">
          <thead>
            <tr className="text-[var(--cc-muted)]">
              <th className="pr-2">Point</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {(tableRows ??
              series.map((v, i) => ({
                label: labels?.[i] ?? `P${i + 1}`,
                value: String(v),
              }))).map((r) => (
              <tr key={r.label} className="border-t border-[var(--cc-card-line)]">
                <td className="py-0.5 pr-2">{r.label}</td>
                <td className="tabular-nums">{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}

export function ExpandableBlock({
  title,
  summary,
  children,
  defaultOpen = false,
  className,
}: {
  title: string;
  summary?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={cn("min-w-0 max-w-full overflow-hidden rounded-xl border border-[var(--cc-card-line)]", className)}>
      <button
        type="button"
        className="flex w-full min-w-0 max-w-full items-start justify-between gap-2 px-3 py-2.5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-accent,#2563eb)]"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <div className="min-w-0 flex-1 overflow-hidden">
          <strong className="block truncate text-[13px]">{title}</strong>
          {summary ? (
            <span className="block truncate text-[length:var(--type-control)] text-[var(--cc-muted)]">{summary}</span>
          ) : null}
        </div>
        <span className="shrink-0 text-[length:var(--type-control)] font-bold text-[var(--cc-muted)]">{open ? "Hide" : "Expand"}</span>
      </button>
      {open ? (
        <div className="min-w-0 max-w-full break-words border-t border-[var(--cc-card-line)] px-3 py-3">{children}</div>
      ) : null}
    </div>
  );
}
