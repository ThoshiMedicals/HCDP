"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { CcCard, Field, inputClass } from "./cc-ui";
import { formatMoneyExact } from "@/lib/command-centre/utils";
import type { CommandAction, LayoutPeriod, ReportSchedule } from "@/lib/command-centre/types";
import type { PeriodContext } from "@/lib/command-centre/period-engine";
import { comparePeriodLabel, kpiPeriodAdjust } from "@/lib/command-centre/period-engine";
import type { Location } from "@/lib/types";
import { readReportSchedules, writeReportSchedules } from "@/lib/command-centre/cc-extras";

export function MyDayOwnerView({
  onOpenAction,
  onOpenReports,
  onEndOfDay,
  onViewNotice,
}: {
  onOpenAction: (id: string) => void;
  onOpenReports: () => void;
  onEndOfDay: () => void;
  onViewNotice?: () => void;
}) {
  const blocks: Array<{
    title: string;
    rows: Array<{ title: string; meta: string; actionId?: string; kind?: "reports" | "eod" | "notice" }>;
  }> = [
    {
      title: "Decisions required today",
      rows: [
        { title: "Approve temporary continued use — Dr Patel", meta: "By 12:00", actionId: "ACT-2026-001292" },
        { title: "Doctor pay variance outcome", meta: "By 14:00", actionId: "ACT-2026-001295" },
        { title: "Serious complaint RCA decision", meta: "By 16:00", actionId: "ACT-2026-001296" },
      ],
    },
    {
      title: "Approvals waiting",
      rows: [
        { title: "Infection control policy v4.2", meta: "Tomorrow 16:00", actionId: "ACT-2026-001299" },
        { title: "Supplier contract final approval", meta: "Tomorrow 11:00" },
      ],
    },
    {
      title: "Delegated work awaiting final approval",
      rows: [
        { title: "Finance review of Indooroopilly variance", meta: "Retain final approval", actionId: "ACT-2026-001295" },
      ],
    },
    {
      title: "Urgent actions on me",
      rows: [
        { title: "Acknowledge Beachmere emergency", meta: "Now", actionId: "ACT-2026-001284" },
        { title: "Staffing cover decision — Indooroopilly RN", meta: "By 09:30", actionId: "ACT-2026-001288" },
      ],
    },
    {
      title: "Notices to read",
      rows: [
        { title: "July compliance pack due Friday", meta: "Mandatory", kind: "notice" },
        { title: "Doctor pay cut-off reminder", meta: "Information", kind: "notice" },
      ],
    },
    {
      title: "Scheduled reports",
      rows: [
        { title: "Weekly operations digest", meta: "Monday 07:00" },
        { title: "Monthly Management Pack — June", meta: "Saved under Reports", kind: "reports" },
      ],
    },
    {
      title: "Private reminders",
      rows: [{ title: "Call Energex account manager re Beachmere ETA", meta: "Personal" }],
    },
    {
      title: "End-of-day responsibilities",
      rows: [
        { title: "Review Completed Today before overnight clear", meta: "17:45" },
        { title: "Confirm emergency acknowledgements closed", meta: "17:50" },
        { title: "Optional End-of-Day Summary", meta: "18:00", kind: "eod" },
      ],
    },
  ];

  return (
    <CcCard>
      <div className="px-4 pt-4">
        <h2 className="m-0 text-[18px] font-extrabold">My Day — Owner/Director</h2>
        <p className="m-0 mt-1 text-[12px] text-[var(--cc-muted)]">
          Decisions, approvals, delegated work, urgent actions, notices, scheduled reports, private reminders and
          end-of-day responsibilities.
        </p>
      </div>
      <div className="grid gap-3 p-4 md:grid-cols-2">
        {blocks.map((b) => (
          <div key={b.title} className="rounded-xl border border-[var(--cc-card-line)] bg-[var(--cc-soft)] p-3">
            <h3 className="m-0 mb-2 text-[13px] font-extrabold">{b.title}</h3>
            <div className="grid gap-2">
              {b.rows.map((r) => (
                <div key={r.title} className="rounded-lg border border-[var(--cc-card-line)] bg-[var(--cc-card)] px-2.5 py-2">
                  <strong className="block text-[13px] leading-snug">{r.title}</strong>
                  <span className="text-[length:var(--type-control)] text-[var(--cc-muted)]">{r.meta}</span>
                  <div className="mt-1.5">
                    {r.actionId ? (
                      <Button small variant="teal" onClick={() => onOpenAction(r.actionId!)}>
                        Open
                      </Button>
                    ) : null}
                    {r.kind === "reports" ? (
                      <Button small variant="soft" onClick={onOpenReports}>
                        Open Reports
                      </Button>
                    ) : null}
                    {r.kind === "eod" ? (
                      <Button small variant="line" onClick={onEndOfDay}>
                        Open summary
                      </Button>
                    ) : null}
                    {r.kind === "notice" ? (
                      <Button small variant="line" onClick={onViewNotice}>
                        View notice
                      </Button>
                    ) : null}
                    {!r.actionId && !r.kind ? (
                      <span className="text-[length:var(--type-meta)] font-semibold text-[var(--cc-muted)]">
                        No linked action in this demonstration
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </CcCard>
  );
}

export function KpiScorecardView({
  period,
  periodCtx,
  overdueCount,
  onOpenAction,
}: {
  period: LayoutPeriod;
  periodCtx: PeriodContext;
  overdueCount: number;
  onOpenAction: (id: string) => void;
}) {
  const kpis = [
    {
      name: "Organisation health score",
      value: "82%",
      def: "Average of clinic health scores across eight equal operating areas.",
      owner: "Owner / Director",
      calc: "Mean of available area scores; incomplete areas excluded without lowering the score.",
      source: "Clinic ops, staffing, compliance, finance, incidents, tasks, assets, digital",
      warn: "Below 80%",
      serious: "Below 65%",
      period,
      refresh: "Every 5 minutes",
      explain: "Beachmere emergency and Indooroopilly urgents reduced the organisation mean.",
      records: ["ACT-2026-001284"],
    },
    {
      name: "Staffing fill rate",
      value: "91%",
      def: "Rostered shifts filled by confirmed staff, agency or approved locum.",
      owner: "Area Manager",
      calc: "(Filled ÷ Rostered) × 100",
      source: "Roster and timeclock",
      warn: "Below 95%",
      serious: "Below 90%",
      period,
      refresh: "Every 15 minutes",
      explain: "Three unfilled shifts today at Bald Hills and Indooroopilly.",
      records: ["ACT-2026-001288"],
    },
    {
      name: "Compliance readiness",
      value: "94%",
      def: "Share of tracked credentials and obligations that are current.",
      owner: "Quality Lead",
      calc: "Current ÷ (Current + Expired + due ≤30 days attention set)",
      source: "HR documents, doctors, accreditation",
      warn: "Below 96%",
      serious: "Any serious expired item",
      period,
      refresh: "Hourly",
      explain: "One serious AHPRA expiry remains with temporary continued use pending.",
      records: ["ACT-2026-001292"],
    },
    {
      name: "Net profit / loss",
      value: formatMoneyExact(115570.35),
      def: "Exact income less expenses for selected clinics and period.",
      owner: "Finance Lead",
      calc: "Income − Expenses (AUD exact)",
      source: "Finance, staff pay, doctor pay, suppliers",
      warn: ">5% adverse vs forecast",
      serious: ">8% adverse vs forecast",
      period,
      refresh: "Hourly",
      explain: "Organisation ahead of forecast; Indooroopilly doctor pay is a local adverse variance.",
      records: ["ACT-2026-001295"],
    },
    {
      name: "Opening checklist on-time rate",
      value: "86%",
      def: "Clinics completing opening checklist by the 08:00 SLA.",
      owner: "Practice Managers",
      calc: "On-time openings ÷ Scheduled openings",
      source: "Front desk / checklists",
      warn: "Below 95%",
      serious: "Repeated miss pattern (2× in 7 days)",
      period: "This Week",
      refresh: "Every 5 minutes",
      explain: "Cannon Hill late twice this week triggered Attention Required.",
      records: ["ACT-2026-001291"],
    },
    {
      name: "Serious incident cycle time",
      value: "6.2 days",
      def: "Average days from serious incident/complaint open to RCA complete.",
      owner: "Quality Lead",
      calc: "Mean calendar days for serious records in period",
      source: "Incidents module",
      warn: "Above 5 days",
      serious: "Above 7 days or overdue RCA",
      period: "This Month",
      refresh: "Daily",
      explain: "Cannon Hill complaint RCA is overdue pending clinician statement.",
      records: ["ACT-2026-001296"],
    },
    {
      name: "Digital availability",
      value: "97.2%",
      def: "Share of clinic operating time with critical systems available.",
      owner: "IT / Facilities",
      calc: "Available minutes ÷ Planned minutes",
      source: "Websites, internet, phones, practice systems, backup",
      warn: "Below 99%",
      serious: "Any full clinic outage",
      period,
      refresh: "Immediate for emergencies",
      explain: "Beachmere full outage reduces organisation availability.",
      records: ["ACT-2026-001284"],
    },
    {
      name: "Overdue action burden",
      value: String(overdueCount),
      def: "Active overdue actions excluding completed, closed, dismissed and archived.",
      owner: "Owner / Director",
      calc: "Count where overdue and stage not inactive",
      source: "Command Centre action register",
      warn: "Above 5",
      serious: "Above 10 or any Emergency overdue",
      period,
      refresh: "Every 5 minutes",
      explain: "Active queue excludes completed/closed/dismissed/archived by design.",
      records: [] as string[],
    },
  ];

  return (
    <CcCard>
      <div className="px-4 pt-4">
        <h2 className="m-0 text-[18px] font-extrabold">Controlled KPI Scorecard</h2>
        <p className="m-0 mt-1 text-[12px] text-[var(--cc-muted)]">
          Every KPI includes name, definition, owner, calculation, source, warning/serious thresholds, period (
          {period}) vs {comparePeriodLabel(period)}, refresh frequency and contributing records.
        </p>
      </div>
      <div className="overflow-auto p-4">
        <table className="w-full min-w-[1220px] border-collapse text-left text-[length:var(--type-control)]">
          <thead>
            <tr className="border-b border-[var(--cc-card-line)] text-[length:var(--type-meta)] uppercase text-[var(--cc-muted)]">
              <th className="py-2 pr-2">KPI</th>
              <th className="pr-2">Result</th>
              <th className="pr-2">Definition</th>
              <th className="pr-2">Owner</th>
              <th className="pr-2">Calculation</th>
              <th className="pr-2">Source</th>
              <th className="pr-2">Warning</th>
              <th className="pr-2">Serious</th>
              <th className="pr-2">Period</th>
              <th className="pr-2">Refresh</th>
              <th>Explanation & records</th>
            </tr>
          </thead>
          <tbody>
            {kpis.map((k) => (
              <tr key={k.name} className="border-b border-[var(--cc-card-line)] align-top">
                <td className="py-2.5 pr-2 font-bold">{k.name}</td>
                <td className="pr-2 text-[15px] font-black tabular-nums whitespace-nowrap">
                  {k.name === "Overdue action burden"
                    ? String(overdueCount)
                    : k.name === "Serious incident cycle time"
                      ? k.value
                      : kpiPeriodAdjust({ name: k.name, value: k.value }, periodCtx)}
                </td>
                <td className="pr-2 max-w-[180px] leading-snug text-[var(--cc-muted)]">{k.def}</td>
                <td className="pr-2 whitespace-nowrap">{k.owner}</td>
                <td className="pr-2 max-w-[160px] leading-snug">{k.calc}</td>
                <td className="pr-2 max-w-[140px] leading-snug text-[var(--cc-muted)]">{k.source}</td>
                <td className="pr-2 whitespace-nowrap cc-text-warn">{k.warn}</td>
                <td className="pr-2 whitespace-nowrap cc-text-danger">{k.serious}</td>
                <td className="pr-2 whitespace-nowrap">{k.period}</td>
                <td className="pr-2 whitespace-nowrap">{k.refresh}</td>
                <td className="max-w-[220px] leading-snug">
                  {k.explain}
                  <div className="mt-1 flex flex-wrap gap-1">
                    {k.records.map((r) => (
                      <Button key={r} small variant="line" onClick={() => onOpenAction(r)}>
                        {r}
                      </Button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CcCard>
  );
}

export function ReportsView({
  onOpenPack,
  onExport,
  onGoCommand,
  onEod,
  onSchedule,
  onEditSchedule,
  scheduleListKey = 0,
  period,
  locations,
  selectedClinicIds,
  pushToast,
}: {
  onOpenPack: () => void;
  onExport: (opts: { format: string; sensitive: boolean; report: string }) => void;
  onGoCommand: () => void;
  onEod: () => void;
  onSchedule: (reportName: string) => void;
  onEditSchedule?: (schedule: ReportSchedule) => void;
  scheduleListKey?: number;
  period: LayoutPeriod;
  locations: Location[];
  selectedClinicIds: string[];
  pushToast?: (msg: string, tone?: "success" | "warn" | "default") => void;
}) {
  const reports = [
    {
      title: "Executive Operations Summary",
      blurb: "Organisation priorities, decisions and clinic health",
      sections: ["Priorities", "Executive decisions", "Clinic health", "AI briefing"],
      charts: true,
    },
    {
      title: "Clinic Health and Benchmarking Report",
      blurb: "Actual + normalised clinic comparison",
      sections: ["Clinic scores", "Eight areas", "Benchmarks"],
      charts: true,
    },
    {
      title: "Top-Risk and Overdue-Action Report",
      blurb: "Serious and overdue items across selected clinics",
      sections: ["Overdue", "Emergency", "Escalations"],
      charts: false,
    },
    {
      title: "Monthly Management Pack",
      blurb: "Full monthly pack with finance and completed-work history",
      sections: ["Finance", "Staffing", "Completed work", "Trends"],
      charts: true,
      pack: true,
    },
    {
      title: "End-of-Day Summary",
      blurb: "Carry-forward decisions and overnight clear items",
      sections: ["Unresolved emergencies", "Completed today", "Decisions required"],
      charts: false,
      eod: true,
    },
  ] as const;

  return (
    <CcCard>
      <div className="px-4 pt-4">
        <h2 className="m-0 text-[18px] font-extrabold">Reports</h2>
        <p className="m-0 mt-1 text-[12px] text-[var(--cc-muted)]">
          Saved packs and exports for period <strong>{period}</strong>. Completed/closed history is retained for reports
          even when excluded from active queues.
        </p>
      </div>
      <div className="grid gap-3 p-4">
        <ReportSchedulesList onEdit={onEditSchedule} refreshKey={scheduleListKey} />
        {reports.map((r) => (
          <ReportConfigCard
            key={r.title}
            title={r.title}
            blurb={r.blurb}
            period={period}
            locations={locations}
            selectedClinicIds={selectedClinicIds}
            sections={r.sections}
            charts={r.charts}
            highlight={"pack" in r && r.pack}
            onOpenPack={onOpenPack}
            onGoCommand={onGoCommand}
            onEod={onEod}
            onExport={onExport}
            onSchedule={() => onSchedule(r.title)}
            isEod={"eod" in r && r.eod}
            isPack={"pack" in r && r.pack}
            pushToast={pushToast}
          />
        ))}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--cc-card-line)] bg-[var(--cc-soft)] p-3">
          <div className="min-w-0 text-xs">
            <strong className="block text-[13px]">Weekly operations digest</strong>
            <span className="text-[var(--cc-muted)]">Saved · Mondays 07:00</span>
          </div>
          <Button
            small
            variant="line"
            onClick={() => pushToast?.("Weekly digest opened (demo).", "success")}
          >
            Open
          </Button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--cc-card-line)] bg-[var(--cc-soft)] p-3">
          <div className="min-w-0 text-xs">
            <strong className="block text-[13px]">Clinic comparison — normalised rates</strong>
            <span className="text-[var(--cc-muted)]">Fair / FTE and / room alongside actuals</span>
          </div>
          <Button small variant="line" onClick={onGoCommand}>
            View on Command Centre
          </Button>
        </div>
      </div>
    </CcCard>
  );
}

export function ReportSchedulesList({
  onEdit,
  refreshKey = 0,
}: {
  onEdit?: (schedule: ReportSchedule) => void;
  refreshKey?: number;
}) {
  const [schedules, setSchedules] = useState<ReportSchedule[]>([]);

  function reload() {
    setSchedules(readReportSchedules());
  }

  useEffect(() => {
    queueMicrotask(() => setSchedules(readReportSchedules()));
  }, [refreshKey]);

  function persist(next: ReportSchedule[]) {
    writeReportSchedules(next);
    setSchedules(next);
  }

  if (!schedules.length) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--cc-card-line)] px-4 py-3 text-[12px] text-[var(--cc-muted)]">
        No saved report schedules yet. Use Schedule… on any report below.
      </div>
    );
  }

  return (
    <CcCard>
      <div className="px-4 pt-3">
        <h3 className="m-0 text-[14px] font-extrabold">Saved report schedules</h3>
        <p className="m-0 mt-0.5 text-[length:var(--type-control)] text-[var(--cc-muted)]">
          Stored locally — pause, resume, edit or delete. Live email delivery requires a future backend.
        </p>
      </div>
      <div className="grid gap-2 p-4">
        {schedules.map((s) => (
          <div
            key={s.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--cc-card-line)] bg-[var(--cc-soft)] p-3"
          >
            <div className="min-w-0 text-xs">
              <strong className="block text-[13px]">{s.report}</strong>
              <span className="text-[var(--cc-muted)]">
                {s.cadence} · {s.deliveryTime} · {s.recipient || "No recipient"}
                {s.paused ? " · Paused" : ""}
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {onEdit ? (
                <Button small variant="line" onClick={() => onEdit(s)}>
                  Edit
                </Button>
              ) : null}
              {s.paused ? (
                <Button
                  small
                  variant="teal"
                  onClick={() => {
                    persist(schedules.map((x) => (x.id === s.id ? { ...x, paused: false } : x)));
                  }}
                >
                  Resume
                </Button>
              ) : (
                <Button
                  small
                  variant="line"
                  onClick={() => {
                    persist(schedules.map((x) => (x.id === s.id ? { ...x, paused: true } : x)));
                  }}
                >
                  Pause
                </Button>
              )}
              <Button
                small
                variant="line"
                onClick={() => {
                  if (!window.confirm(`Delete schedule for “${s.report}”?`)) return;
                  persist(schedules.filter((x) => x.id !== s.id));
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </CcCard>
  );
}

function ReportConfigCard({
  title,
  blurb,
  period,
  locations,
  selectedClinicIds,
  sections,
  charts,
  highlight,
  onOpenPack,
  onGoCommand,
  onEod,
  onExport,
  onSchedule,
  isEod,
  isPack,
  pushToast,
}: {
  title: string;
  blurb: string;
  period: LayoutPeriod;
  locations: Location[];
  selectedClinicIds: string[];
  sections: readonly string[];
  charts: boolean;
  highlight?: boolean;
  onOpenPack: () => void;
  onGoCommand: () => void;
  onEod: () => void;
  onExport: (opts: { format: string; sensitive: boolean; report: string }) => void;
  onSchedule: () => void;
  isEod?: boolean;
  isPack?: boolean;
  pushToast?: (msg: string, tone?: "success" | "warn" | "default") => void;
}) {
  const [reportTitle, setReportTitle] = useState(title);
  const [reportPeriod, setReportPeriod] = useState<LayoutPeriod>(period);
  const [selectedSections, setSelectedSections] = useState<string[]>([...sections]);
  const [includeCharts, setIncludeCharts] = useState(charts);
  const [confidential, setConfidential] = useState(false);
  const [comments, setComments] = useState("");
  const [clinicMode, setClinicMode] = useState<"selected" | "all">(
    selectedClinicIds.length === locations.length ? "all" : "selected"
  );

  function toggleSection(s: string) {
    setSelectedSections((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  return (
    <div
      className={
        highlight
          ? "rounded-xl border border-[var(--cc-card-line)] cc-surface-info p-4"
          : "rounded-xl border border-[var(--cc-card-line)] p-4"
      }
    >
      <div className="text-[length:var(--type-meta)] font-extrabold uppercase tracking-wide text-[var(--cc-exec,#1e40af)]">Saved report</div>
      <h3 className="m-0 mt-1 text-[15px] font-extrabold">{title}</h3>
      <p className="m-0 mt-1 text-[12px] text-[var(--cc-muted)]">{blurb}</p>

      <div className="mt-3 grid gap-2 rounded-xl border border-[var(--cc-card-line)] bg-[var(--cc-soft)] p-3">
        <Field label="Report title">
          <input className={inputClass} value={reportTitle} onChange={(e) => setReportTitle(e.target.value)} />
        </Field>
        <div className="grid gap-2 sm:grid-cols-2">
          <Field label="Period">
            <select
              className={inputClass}
              value={reportPeriod}
              onChange={(e) => setReportPeriod(e.target.value as LayoutPeriod)}
            >
              {["Today", "Yesterday", "This Week", "Last 7 Days", "This Month", "Last Month", "Current Quarter", "Custom Range"].map(
                (p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                )
              )}
            </select>
          </Field>
          <Field label="Clinics">
            <select className={inputClass} value={clinicMode} onChange={(e) => setClinicMode(e.target.value as typeof clinicMode)}>
              <option value="all">All clinics</option>
              <option value="selected">Current Command Centre selection</option>
            </select>
          </Field>
        </div>
        <div className="text-[length:var(--type-control)] font-bold text-[var(--cc-muted)]">Sections</div>
        <div className="flex flex-wrap gap-2">
          {sections.map((s) => (
            <label key={s} className="flex items-center gap-1 text-xs font-semibold">
              <input type="checkbox" checked={selectedSections.includes(s)} onChange={() => toggleSection(s)} />
              {s}
            </label>
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs font-semibold">
          <input type="checkbox" checked={includeCharts} onChange={(e) => setIncludeCharts(e.target.checked)} />
          Include charts
        </label>
        <label className="flex items-center gap-2 text-xs font-semibold cc-text-warn">
          <input type="checkbox" checked={confidential} onChange={(e) => setConfidential(e.target.checked)} />
          Include confidential financial information
        </label>
        <Field label="Management comments">
          <textarea className={inputClass} rows={2} value={comments} onChange={(e) => setComments(e.target.value)} />
        </Field>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {isPack ? (
          <Button small variant="teal" onClick={onOpenPack}>
            Open pack
          </Button>
        ) : isEod ? (
          <Button small variant="teal" onClick={onEod}>
            Open End-of-Day summary
          </Button>
        ) : (
          <Button small variant="line" onClick={onGoCommand}>
            Use Command Centre filters
          </Button>
        )}
        <Button small variant="line" onClick={() => onExport({ format: "PDF", sensitive: confidential, report: reportTitle })}>
          Export PDF (local demo)
        </Button>
        <Button small variant="line" onClick={() => onExport({ format: "Spreadsheet", sensitive: confidential, report: reportTitle })}>
          Export Spreadsheet (local demo)
        </Button>
        <Button small variant="line" onClick={() => onExport({ format: "Print", sensitive: false, report: reportTitle })}>
          Print preview (local demo)
        </Button>
        <Button small variant="line" onClick={() => onExport({ format: "Email", sensitive: confidential, report: reportTitle })}>
          Email draft (not sent live)
        </Button>
        {isPack ? (
          <Button
            small
            variant="line"
            onClick={() => onExport({ format: "PDF", sensitive: true, report: reportTitle })}
          >
            Export with confidential finance
          </Button>
        ) : null}
        <Button small variant="soft" onClick={onSchedule}>
          Schedule…
        </Button>
        {isPack ? (
          <Button
            small
            variant="soft"
            onClick={() =>
              pushToast?.("Scheduled Monthly Management Pack retained for 1st of each month 07:00.", "success")
            }
          >
            Keep schedule
          </Button>
        ) : null}
      </div>
      <p className="m-0 mt-2 text-[length:var(--type-meta)] text-[var(--cc-muted)]">
        Local export demonstration only. Live email and scheduled delivery require a future backend.
      </p>
    </div>
  );
}

export function isInactiveAction(a: CommandAction) {
  return ["Completed", "Closed", "Dismissed", "Archived"].includes(a.stage) || a.priority === "Completed Today";
}
