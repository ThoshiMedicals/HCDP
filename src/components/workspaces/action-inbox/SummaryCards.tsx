"use client";

import type { ActionCategory, InboxAction } from "@/lib/action-inbox/types";
import { categoryColor, categoryIcon, categorySoft, summaryStats } from "@/lib/action-inbox/utils";
import { cn } from "@/lib/cn";

const CARDS: { id: ActionCategory; label: string }[] = [
  { id: "Approval", label: "Approvals" },
  { id: "Exception", label: "Exceptions" },
  { id: "Escalation", label: "Escalations" },
  { id: "Reminder", label: "Reminders" },
];

export function SummaryCards({
  actions,
  active,
  onSelect,
}: {
  actions: InboxAction[];
  active: ActionCategory | null;
  onSelect: (cat: ActionCategory) => void;
}) {
  return (
    <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
      {CARDS.map((card) => {
        const stats = summaryStats(actions, card.id);
        const color = categoryColor(card.id);
        const soft = categorySoft(card.id);
        const selected = active === card.id;
        const changeLabel =
          stats.change > 0
            ? `+${stats.change} vs prior period`
            : stats.change < 0
              ? `${stats.change} vs prior period`
              : "No change vs prior period";
        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelect(card.id)}
            aria-pressed={selected}
            className={cn(
              "rounded-[14px] border bg-[var(--card)] p-3.5 text-left shadow-[var(--v34-card-shadow)] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
              selected ? "ring-2" : "hover:border-[#cbd5e1]"
            )}
            style={{
              borderColor: selected ? color : "var(--v34-card-line)",
              boxShadow: selected ? `0 0 0 2px ${color}` : undefined,
              background: selected ? soft : "var(--card)",
            }}
          >
            <div className="mb-2 flex items-center gap-2">
              <span
                className="grid h-7 w-7 place-items-center rounded-lg text-[13px] font-black text-white"
                style={{ background: color }}
                aria-hidden
              >
                {categoryIcon(card.id)}
              </span>
              <span className="text-[13px] font-extrabold" style={{ color }}>
                {card.label}
              </span>
            </div>
            <div className="text-[28px] font-black leading-none text-[var(--ink)]">{stats.total}</div>
            <div className="mt-1 text-[length:var(--type-control)] font-semibold text-[var(--muted)]">Total open</div>
            <div className="mt-2.5 grid grid-cols-3 gap-1.5 text-[length:var(--type-control)]">
              <div>
                <div className="font-extrabold text-[#b45309]">{stats.overdue}</div>
                <div className="text-[#94a3b8]">Overdue</div>
              </div>
              <div>
                <div className="font-extrabold text-[#1d4ed8]">{stats.dueToday}</div>
                <div className="text-[#94a3b8]">Due today</div>
              </div>
              <div>
                <div className="font-extrabold text-[#dc2626]">{stats.urgent}</div>
                <div className="text-[#94a3b8]">Urgent</div>
              </div>
            </div>
            <div className="mt-2 text-[length:var(--type-control)] font-semibold text-[var(--muted)]">{changeLabel}</div>
          </button>
        );
      })}
    </div>
  );
}
