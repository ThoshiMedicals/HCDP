"use client";

import type { Announcement, PriorityLevel } from "@/lib/command-centre/types";
import { Button } from "@/components/ui/Button";
import { CcCard, PriorityBadge } from "./cc-ui";
import { cn } from "@/lib/cn";
import { formatClock } from "@/lib/command-centre/utils";

export function EmergencyBanner({
  items,
  index,
  onPrev,
  onNext,
  onAcknowledge,
  onViewAll,
  onOpenFull,
  onWithdraw,
  locationNames,
}: {
  items: Announcement[];
  index: number;
  onPrev: () => void;
  onNext: () => void;
  onAcknowledge: (id: string) => void;
  onViewAll: () => void;
  onOpenFull: (id: string) => void;
  onWithdraw?: (id: string, reason?: string) => void;
  locationNames: (ids: string[]) => string;
}) {
  if (!items.length) return null;
  const a = items[((index % items.length) + items.length) % items.length];
  return (
    <div className="cc-pulse cc-surface-danger rounded-2xl border px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[length:var(--type-control)] font-extrabold uppercase tracking-wide">Emergency announcement</div>
          <strong className="mt-0.5 block text-base leading-snug">{a.title}</strong>
          <p className="m-0 mt-1 text-sm leading-snug">{a.message}</p>
          <div className="mt-2 grid gap-0.5 text-[length:var(--type-control)] opacity-90 sm:grid-cols-2">
            <span>Clinics: {locationNames(a.clinics)}</span>
            <span>Required action: {a.requireAck ? "Acknowledgement required" : "Read and note"}</span>
            <span>Published: {new Date(a.publishAt).toLocaleString("en-AU")}</span>
            <span>
              Delivery {a.delivery.delivered}/{a.delivery.total} · Read {a.readership.read}/{a.readership.total} · Ack{" "}
              {a.acknowledgements.acked}/{a.acknowledgements.total}
            </span>
            <span>Attachments: {a.attachments}</span>
            <span>Channels: {a.channels.join(", ")} (dashboard live · email/SMS demo only)</span>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-1.5 self-center">
          <Button small variant="line" onClick={onPrev} disabled={items.length < 2}>
            Previous
          </Button>
          <Button small variant="line" onClick={onNext} disabled={items.length < 2}>
            Next
          </Button>
          <Button small variant="soft" onClick={onViewAll}>
            View All Announcements
          </Button>
          <Button small variant="line" onClick={() => onOpenFull(a.id)}>
            Open Full Notice
          </Button>
          <Button variant="danger" small onClick={() => onAcknowledge(a.id)}>
            Acknowledge
          </Button>
          {onWithdraw ? (
            <Button
              small
              variant="line"
              onClick={() => {
                const reason = window.prompt("Reason for withdrawing this emergency notice (optional)", "") ?? undefined;
                onWithdraw(a.id, reason?.trim() || undefined);
              }}
            >
              Withdraw notice
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function AnnouncementCarousel({
  items,
  index,
  onPrev,
  onNext,
  onViewAll,
}: {
  items: Announcement[];
  index: number;
  onPrev: () => void;
  onNext: () => void;
  onViewAll: () => void;
}) {
  const current = items[index];
  if (!current) return null;
  return (
    <CcCard accent="#1e40af" className="overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="text-[length:var(--type-control)] font-extrabold uppercase tracking-wide cc-text-info">Announcement</div>
          <strong className="mt-0.5 block text-[15px]">{current.title}</strong>
          <p className="m-0 mt-1 text-sm text-[var(--cc-muted)]">{current.message}</p>
          <p className="m-0 mt-1 text-[length:var(--type-control)] text-[var(--cc-muted)]">
            Channels: {current.channels.join(", ")} · Read {current.readership.read}/{current.readership.total}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button small variant="line" onClick={onPrev} disabled={items.length < 2}>
            Previous
          </Button>
          <Button small variant="line" onClick={onNext} disabled={items.length < 2}>
            Next
          </Button>
          <Button small variant="soft" onClick={onViewAll}>
            View All Announcements
          </Button>
        </div>
      </div>
      <div className="flex gap-1 border-t border-[var(--cc-card-line)] px-4 py-2">
        {items.map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              i === index ? "bg-[var(--cc-exec,#1e40af)]" : "bg-[var(--cc-card-line)]"
            )}
          />
        ))}
      </div>
    </CcCard>
  );
}

const YDAY_DELTA: Record<string, number> = {
  Emergency: 0,
  Urgent: 1,
  "Attention Required": -1,
  Routine: 0,
  Overdue: 2,
  "Completed Today": 1,
};

export function PrioritySummary({
  counts,
  selected,
  onSelect,
  onClear,
  lastUpdated,
  clinicScopeLabel,
  keys: keysProp,
}: {
  counts: Record<string, number>;
  selected: string | null;
  onSelect: (key: string) => void;
  onClear: () => void;
  lastUpdated: Date;
  clinicScopeLabel: string;
  /** Limit indicators shown (owner remediation: ≤4 in first viewport). */
  keys?: readonly string[];
}) {
  const keys = keysProp ?? [
    "Emergency",
    "Urgent",
    "Attention Required",
    "Routine",
    "Overdue",
    "Completed Today",
  ];

  return (
    <CcCard data-priority-summary="true">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-3.5">
        <div>
          <h3 className="m-0 text-[14px] font-extrabold">Priority Summary</h3>
          <p className="m-0 mt-0.5 text-[length:var(--type-control)] text-[var(--cc-muted)]">
            {clinicScopeLabel} · Updated {formatClock(lastUpdated)}
          </p>
        </div>
        {selected ? (
          <Button small variant="line" onClick={onClear}>
            Clear Filter
          </Button>
        ) : null}
      </div>
      <div
        className="grid gap-2 p-3"
        style={{
          gridTemplateColumns: `repeat(${Math.min(keys.length, 4)}, minmax(0, 1fr))`,
        }}
      >
        {keys.map((key) => {
          const count = counts[key] ?? 0;
          const active = selected === key;
          const isEmergency = key === "Emergency";
          const zeroOk = count === 0 && (key === "Emergency" || key === "Urgent" || key === "Overdue");
          const delta = YDAY_DELTA[key] ?? 0;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              aria-label={`${key}: ${count}`}
              aria-pressed={active}
              className={cn(
                "flex min-h-[84px] flex-col justify-between rounded-xl border px-3 py-2.5 text-left transition",
                active
                  ? "border-[var(--cc-exec,#1e40af)] cc-surface-info ring-2 ring-[color-mix(in_srgb,var(--cc-exec,#1e40af)_35%,transparent)]"
                  : "border-[var(--cc-card-line)] bg-[var(--cc-soft)] hover:border-[color-mix(in_srgb,var(--cc-exec,#1e40af)_50%,var(--cc-card-line))]",
                isEmergency && count > 0 && "cc-pulse cc-surface-danger border"
              )}
            >
              <PriorityBadge priority={key as PriorityLevel} short />
              <div className="pt-2">
                {zeroOk ? (
                  <div className="text-[length:var(--type-control)] font-bold leading-snug cc-text-success">No urgent issues</div>
                ) : (
                  <div className="text-[26px] font-black leading-none tracking-tight tabular-nums">{count}</div>
                )}
                {delta !== 0 ? (
                  <div className="mt-1 text-[length:var(--type-control)] text-[var(--cc-muted)]">
                    {`${delta > 0 ? "+" : ""}${delta} vs yesterday`}
                  </div>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </CcCard>
  );
}

export function CategoryFilters({
  categories,
  selected,
  onToggle,
}: {
  categories: string[];
  selected: string[];
  onToggle: (c: string) => void;
}) {
  return (
    <CcCard accent="#334155">
      <div className="px-4 pt-3.5">
        <h3 className="m-0 text-[14px] font-extrabold">Category Filters</h3>
        <p className="m-0 mt-0.5 text-[length:var(--type-control)] text-[var(--cc-muted)]">
          Select several. Combined with priority, clinic, status and assignee on the Active Action List. Period labels the
          reporting window (demonstration data is seeded for Today).
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 lg:grid-cols-4">
        {categories.map((c) => {
          const active = selected.includes(c);
          return (
            <button
              key={c}
              type="button"
              onClick={() => onToggle(c)}
              aria-pressed={active}
              className={cn(
                "flex min-h-[44px] items-center rounded-xl border px-3 py-2 text-left text-[length:var(--type-control)] font-bold leading-snug transition",
                active
                  ? "cc-surface-info border border-[var(--cc-exec,#1e40af)]"
                  : "border-[var(--cc-card-line)] bg-[var(--cc-card)] text-[var(--cc-ink)] hover:border-[color-mix(in_srgb,var(--cc-exec,#1e40af)_45%,var(--cc-card-line))]"
              )}
            >
              {c}
            </button>
          );
        })}
      </div>
    </CcCard>
  );
}
