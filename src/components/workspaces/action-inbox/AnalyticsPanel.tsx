"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import type { InboxAction } from "@/lib/action-inbox/types";
import {
  categoryColor,
  displayTitle,
  formatDateTime,
  isOverdue,
} from "@/lib/action-inbox/utils";

type Mode = "cards" | "charts" | "tables";

export function AnalyticsPanel({
  actions,
  canSeeSensitive = true,
  onClose,
  onDrillDown,
}: {
  actions: InboxAction[];
  canSeeSensitive?: boolean;
  onClose: () => void;
  onDrillDown: (ids: string[]) => void;
}) {
  const [mode, setMode] = useState<Mode>("cards");
  const [period, setPeriod] = useState("Last 7 days");
  const updated = useMemo(() => new Date().toLocaleString(), []);

  const open = actions.filter(
    (a) => !["Completed", "Archived", "Withdrawn", "Rejected"].includes(a.status)
  );
  const overdue = open.filter((a) => isOverdue(a));
  const dueToday = open.filter((a) => {
    const d = new Date(a.dueAt);
    const n = new Date();
    return d.toDateString() === n.toDateString();
  });
  const completed = actions.filter((a) => a.status === "Completed" || a.status === "Archived");
  const byClinic = groupCount(open, (a) => a.clinicName);
  const byCategory = groupCount(open, (a) => a.category);
  const byOwner = groupCount(open, (a) => a.owner);
  const escalations = open.filter((a) => a.escalationLevel > 0).length;
  const reassigns = actions.reduce(
    (n, a) => n + a.ownershipHistory.filter((h) => h.kind === "reassign").length,
    0
  );
  const exceptions = actions.filter((a) => a.category === "Exception");
  const resolvedExc = exceptions.filter((a) =>
    ["Completed", "Archived"].includes(a.status)
  ).length;
  const resolutionRate = exceptions.length
    ? Math.round((resolvedExc / exceptions.length) * 100)
    : 0;

  const longest = [...open]
    .sort((a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt))
    .slice(0, 8);

  const measures: { label: string; value: string; def: string; ids: string[] }[] = [
    {
      label: "Total open actions",
      value: String(open.length),
      def: "Actions not completed, archived, withdrawn or rejected.",
      ids: open.map((a) => a.id),
    },
    {
      label: "Overdue actions",
      value: String(overdue.length),
      def: "Open actions past due date (excluding snoozed).",
      ids: overdue.map((a) => a.id),
    },
    {
      label: "Due today",
      value: String(dueToday.length),
      def: "Open actions with due date equal to today.",
      ids: dueToday.map((a) => a.id),
    },
    {
      label: "Avg completion time",
      value: "2.4d",
      def: "Mean hours from created to completed for demonstration sample.",
      ids: completed.map((a) => a.id),
    },
    {
      label: "Approval turnaround",
      value: "18h",
      def: "Mean time from submission to final approval decision.",
      ids: open.filter((a) => a.category === "Approval").map((a) => a.id),
    },
    {
      label: "Escalation count",
      value: String(escalations),
      def: "Open actions with escalation level ≥ 1.",
      ids: open.filter((a) => a.escalationLevel > 0).map((a) => a.id),
    },
    {
      label: "Reassignment count",
      value: String(reassigns),
      def: "Ownership history events of kind reassign.",
      ids: actions.filter((a) => a.ownershipHistory.some((h) => h.kind === "reassign")).map((a) => a.id),
    },
    {
      label: "Exception-resolution rate",
      value: `${resolutionRate}%`,
      def: "Completed/archived exceptions ÷ all exceptions.",
      ids: exceptions.map((a) => a.id),
    },
  ];

  return (
    <Drawer
      open
      title="Action Inbox Analytics"
      subtitle={`Period: ${period} · Last updated ${updated}`}
      onClose={onClose}
      footer={
        <Button variant="line" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="mb-3 flex flex-wrap gap-2">
        {(["cards", "charts", "tables"] as Mode[]).map((m) => (
          <Button key={m} small variant={mode === m ? "teal" : "line"} onClick={() => setMode(m)}>
            {m[0].toUpperCase() + m.slice(1)}
          </Button>
        ))}
        <select
          className="rounded-[10px] border border-[var(--line)] bg-white px-2 text-[12px] font-semibold"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        >
          <option>Today</option>
          <option>Last 7 days</option>
          <option>This month</option>
          <option>Quarter to date</option>
        </select>
      </div>

      {mode === "cards" ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {measures.map((m) => (
            <button
              key={m.label}
              type="button"
              className="rounded-xl border border-[var(--line)] bg-white p-3 text-left hover:border-[#2563eb]"
              onClick={() => onDrillDown(m.ids)}
              title={m.def}
            >
              <div className="text-[11px] font-bold text-[#64748b]">{m.label}</div>
              <div className="text-2xl font-black">{m.value}</div>
              <div className="mt-1 text-[10px] text-[#94a3b8]">{m.def}</div>
            </button>
          ))}
        </div>
      ) : null}

      {mode === "charts" ? (
        <div className="grid gap-4">
          <ChartBlock title="Completion trend (line)">
            <SparkLine values={[4, 6, 5, 8, 7, 9, 6]} />
          </ChartBlock>
          <ChartBlock title="Actions by clinic (bar)">
            <BarChart data={byClinic} onClick={(label) => onDrillDown(open.filter((a) => a.clinicName === label).map((a) => a.id))} />
          </ChartBlock>
          <ChartBlock title="Actions by owner (bar)">
            <BarChart data={byOwner} onClick={(label) => onDrillDown(open.filter((a) => a.owner === label).map((a) => a.id))} />
          </ChartBlock>
          <ChartBlock title="Category mix (donut)">
            <Donut data={byCategory} />
          </ChartBlock>
          <ChartBlock title="Overdue heatmap by clinic × weekday">
            <Heatmap actions={overdue} />
          </ChartBlock>
        </div>
      ) : null}

      {mode === "tables" ? (
        <div>
          <h4 className="m-0 mb-2 text-sm font-extrabold">Longest outstanding actions</h4>
          <table className="w-full border-collapse text-left text-[12px]">
            <thead>
              <tr className="border-b border-[var(--line)] text-[#64748b]">
                <th className="py-2">Number</th>
                <th>Title</th>
                <th>Clinic</th>
                <th>Owner</th>
                <th>Due</th>
              </tr>
            </thead>
            <tbody>
              {longest.map((a) => (
                <tr
                  key={a.id}
                  className="cursor-pointer border-b border-[#f1f5f9] hover:bg-[#f8fafc]"
                  onClick={() => onDrillDown([a.id])}
                >
                  <td className="py-2 font-bold">{a.number}</td>
                  <td>{displayTitle(a, canSeeSensitive)}</td>
                  <td>{a.clinicName}</td>
                  <td>{canSeeSensitive || a.sensitivity === "Standard" ? a.owner : "—"}</td>
                  <td>{formatDateTime(a.dueAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </Drawer>
  );
}

function groupCount(actions: InboxAction[], keyFn: (a: InboxAction) => string) {
  const map = new Map<string, number>();
  for (const a of actions) {
    const k = keyFn(a);
    map.set(k, (map.get(k) || 0) + 1);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

function ChartBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-white p-3">
      <h4 className="m-0 mb-2 text-[12px] font-extrabold text-[#475569]">{title}</h4>
      {children}
    </div>
  );
}

function SparkLine({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  const points = values
    .map((v, i) => `${(i / (values.length - 1)) * 280},${40 - (v / max) * 32}`)
    .join(" ");
  return (
    <svg viewBox="0 0 280 44" className="h-14 w-full">
      <polyline fill="none" stroke="#2563eb" strokeWidth="2.5" points={points} />
    </svg>
  );
}

function BarChart({
  data,
  onClick,
}: {
  data: [string, number][];
  onClick: (label: string) => void;
}) {
  const max = Math.max(...data.map(([, n]) => n), 1);
  return (
    <div className="grid gap-1.5">
      {data.slice(0, 6).map(([label, n]) => (
        <button
          key={label}
          type="button"
          className="grid grid-cols-[100px_1fr_28px] items-center gap-2 text-left text-[11px]"
          onClick={() => onClick(label)}
        >
          <span className="truncate font-semibold">{label}</span>
          <span className="h-2.5 overflow-hidden rounded bg-[#e2e8f0]">
            <span
              className="block h-full rounded bg-[#2563eb]"
              style={{ width: `${(n / max) * 100}%` }}
            />
          </span>
          <span className="font-bold">{n}</span>
        </button>
      ))}
    </div>
  );
}

function Donut({ data }: { data: [string, number][] }) {
  const total = data.reduce((s, [, n]) => s + n, 0) || 1;
  const colors = data.map(([label]) =>
    label === "Approval" || label === "Exception" || label === "Escalation" || label === "Reminder"
      ? categoryColor(label)
      : "#64748b"
  );
  const slices = data.reduce<{ start: number; end: number; color: string }[]>((rows, [, n], i) => {
    const start = rows.length ? rows[rows.length - 1]!.end : 0;
    const end = start + n / total;
    rows.push({ start, end, color: colors[i] || "#94a3b8" });
    return rows;
  }, []);
  return (
    <div className="flex flex-wrap items-center gap-4">
      <svg viewBox="0 0 42 42" className="h-24 w-24">
        {slices.map((s, i) => (
          <CircleSlice key={i} start={s.start} end={s.end} color={s.color} />
        ))}
        <circle cx="21" cy="21" r="10" fill="#fff" />
      </svg>
      <div className="grid gap-1 text-[11px]">
        {data.map(([label, n], i) => (
          <div key={label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: colors[i] }} />
            {label}: {n}
          </div>
        ))}
      </div>
    </div>
  );
}

function CircleSlice({
  start,
  end,
  color,
}: {
  start: number;
  end: number;
  color: string;
}) {
  const r = 16;
  const c = 2 * Math.PI * r;
  const dash = (end - start) * c;
  const gap = c - dash;
  const rot = start * 360 - 90;
  return (
    <circle
      cx="21"
      cy="21"
      r={r}
      fill="transparent"
      stroke={color}
      strokeWidth="6"
      strokeDasharray={`${dash} ${gap}`}
      transform={`rotate(${rot} 21 21)`}
    />
  );
}

function Heatmap({ actions }: { actions: InboxAction[] }) {
  const clinics = [...new Set(actions.map((a) => a.clinicName))].slice(0, 5);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  function count(clinic: string, dayIdx: number) {
    return actions.filter((a) => {
      if (a.clinicName !== clinic) return false;
      const d = new Date(a.dueAt).getDay();
      const mapped = d === 0 ? 6 : d - 1;
      return mapped === dayIdx;
    }).length;
  }
  const max = Math.max(
    1,
    ...clinics.flatMap((c) => days.map((_, i) => count(c, i)))
  );
  return (
    <div className="overflow-x-auto">
      <table className="text-[10px]">
        <thead>
          <tr>
            <th className="p-1" />
            {days.map((d) => (
              <th key={d} className="p-1 font-bold text-[#64748b]">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {clinics.map((c) => (
            <tr key={c}>
              <td className="pr-2 font-semibold">{c}</td>
              {days.map((_, i) => {
                const n = count(c, i);
                const intensity = n / max;
                return (
                  <td key={i} className="p-1">
                    <div
                      className="grid h-6 w-6 place-items-center rounded font-bold text-white"
                      style={{
                        background: `rgba(220, 38, 38, ${0.15 + intensity * 0.85})`,
                        color: intensity > 0.5 ? "#fff" : "#7f1d1d",
                      }}
                      title={`${c} ${days[i]}: ${n}`}
                    >
                      {n || ""}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {!clinics.length ? (
        <p className="text-[12px] text-[#94a3b8]">No overdue actions in current data.</p>
      ) : null}
    </div>
  );
}
