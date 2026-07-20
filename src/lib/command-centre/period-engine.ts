import type {
  ActionCategory,
  AssetFacilitiesSnapshot,
  ClinicHealthProfile,
  CommandAction,
  ComplianceItem,
  DigitalSecuritySnapshot,
  FinanceSnapshot,
  IncidentRecord,
  LayoutPeriod,
  StaffingSnapshot,
  TaskDeliverySummary,
  TrendCard,
} from "./types";
import {
  ASSETS,
  CLINIC_HEALTH,
  COMMAND_ACTIONS,
  COMPLIANCE_ITEMS as COMPLIANCE,
  DIGITAL,
  FINANCE,
  INCIDENTS,
  STAFFING,
  TASK_DELIVERY,
  TRENDS,
} from "./mock-data";

/** Period multipliers produce distinct demonstration totals without a live warehouse. */
const PERIOD_FACTOR: Record<Exclude<LayoutPeriod, "Custom Range">, number> = {
  Today: 1,
  Yesterday: 0.94,
  "This Week": 1.08,
  "Last 7 Days": 1.05,
  "This Month": 1.18,
  "Last Month": 1.12,
  "Current Quarter": 1.32,
};

export interface CustomRange {
  start: string;
  end: string;
}

export interface PeriodContext {
  period: LayoutPeriod;
  customRange?: CustomRange | null;
  /** Local calendar day used for Completed Today and Simulate Next Day */
  demoDayIso: string;
}

function factorFor(period: LayoutPeriod, custom?: CustomRange | null): number {
  if (period === "Custom Range" && custom?.start && custom?.end) {
    const days =
      Math.max(
        1,
        Math.round(
          (new Date(custom.end).getTime() - new Date(custom.start).getTime()) / 86400000
        )
      ) + 1;
    return Math.min(1.45, 0.9 + days * 0.02);
  }
  if (period === "Custom Range") return 1;
  return PERIOD_FACTOR[period] ?? 1;
}

function scale(n: number, f: number, jitter = 0): number {
  return Math.round(n * f * (1 + jitter));
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h % 1000) / 1000;
}

export function periodLabel(period: LayoutPeriod, custom?: CustomRange | null): string {
  if (period === "Custom Range" && custom?.start && custom?.end) {
    return `${custom.start} → ${custom.end}`;
  }
  return period;
}

export function comparePeriodLabel(period: LayoutPeriod): string {
  switch (period) {
    case "Today":
      return "Yesterday";
    case "Yesterday":
      return "Day before";
    case "This Week":
      return "Previous week";
    case "Last 7 Days":
      return "Prior 7 days";
    case "This Month":
      return "Last month";
    case "Last Month":
      return "Month before last";
    case "Current Quarter":
      return "Previous quarter";
    case "Custom Range":
      return "Prior equivalent range";
    default:
      return "Previous period";
  }
}

export function getPeriodActions(ctx: PeriodContext): CommandAction[] {
  const f = factorFor(ctx.period, ctx.customRange);
  const day = ctx.demoDayIso.slice(0, 10);
  return COMMAND_ACTIONS.map((a, i) => {
    const j = hashStr(a.id + ctx.period) * 0.08 - 0.04;
    const overdueBump = ctx.period === "Last Month" || ctx.period === "Current Quarter" ? 1 : 0;
    let priority = a.priority;
    let completedAt = a.completedAt;
    let stage = a.stage;

    if (a.priority === "Completed Today") {
      const doneDay = (a.completedAt ?? "").slice(0, 10);
      if (doneDay === day) {
        priority = "Completed Today";
      } else if (ctx.period === "Today") {
        // Leave active queue after day rolls over — keep as Closed history
        priority = "Routine";
        stage = "Closed";
        completedAt = a.completedAt;
      } else {
        priority = "Routine";
        stage = stage === "Completed" || stage === "Closed" ? stage : "Closed";
      }
    }

    if (priority === "Urgent" && overdueBump && i % 3 === 0) {
      priority = "Overdue";
    }

    return {
      ...a,
      priority,
      stage,
      completedAt,
      overdueAge:
        priority === "Overdue"
          ? `${2 + Math.floor(f + j * 10)} days`
          : a.overdueAge,
      latestUpdate: `${a.latestUpdate} · ${ctx.period}`,
    };
  });
}

export function getPeriodClinicHealth(ctx: PeriodContext): ClinicHealthProfile[] {
  const f = factorFor(ctx.period, ctx.customRange);
  return CLINIC_HEALTH.map((h) => {
    const j = hashStr(h.locationId + ctx.period) * 8 - 4;
    const score =
      h.overallScore === null ? null : Math.max(40, Math.min(99, Math.round((h.overallScore ?? 70) * (0.92 + (f - 1) * 0.3) + j)));
    const yesterday =
      score === null ? null : Math.max(40, Math.min(99, score - Math.round(j / 2) - 1));
    const areas = h.areas.map((a) => ({
      ...a,
      score:
        a.score === null
          ? null
          : Math.max(30, Math.min(100, Math.round(a.score * (0.94 + (f - 1) * 0.25) + j / 2))),
    }));
    return {
      ...h,
      overallScore: score,
      yesterdayScore: yesterday,
      urgentIssues: scale(h.urgentIssues, f, j / 40),
      overdueWork: scale(h.overdueWork, f, j / 50),
      areas,
      yesterdayAreas: areas.map((a) => ({
        area: a.area,
        score: a.score === null ? null : Math.max(30, (a.score ?? 0) - 2 - Math.round(j / 3)),
      })),
      lastUpdate: new Date(`${ctx.demoDayIso}T08:30:00`).toISOString(),
      trend: j >= 0 ? "Improved" : j < -2 ? "Declined" : "No change",
    };
  });
}

export function getPeriodFinance(ctx: PeriodContext): FinanceSnapshot[] {
  const f = factorFor(ctx.period, ctx.customRange);
  return FINANCE.map((row) => {
    const j = hashStr(row.locationId + ctx.period + "fin") * 0.06 - 0.03;
    const income = scale(row.income, f, j);
    const expenses = scale(row.expenses, f, -j / 2);
    const actual = scale(row.actual, f, j / 2);
    const forecast = scale(row.forecast, f, 0.01);
    return {
      ...row,
      income,
      expenses,
      profitLoss: income - expenses,
      staffPay: scale(row.staffPay, f, j / 3),
      doctorPay: scale(row.doctorPay, f, j / 4),
      supplierPayments: scale(row.supplierPayments, f, 0),
      pendingApprovals: scale(row.pendingApprovals, Math.max(0.7, f * 0.9), 0),
      forecast,
      actual,
      pendingAmounts: scale(row.pendingAmounts, f, 0),
      varianceDollar: actual - forecast,
      variancePercent: forecast ? Math.round(((actual - forecast) / forecast) * 1000) / 10 : 0,
      alerts: row.alerts.map((a) => ({
        ...a,
        expected: scale(a.expected, f, 0),
        actual: scale(a.actual, f, j),
        dollarDiff: scale(a.dollarDiff, f, j),
        percentDiff: Math.round(a.percentDiff * (0.9 + f * 0.1)),
      })),
    };
  });
}

export function getPeriodStaffing(ctx: PeriodContext): StaffingSnapshot[] {
  const f = factorFor(ctx.period, ctx.customRange);
  return STAFFING.map((s) => {
    const j = hashStr(s.locationId + ctx.period + "st") * 0.1 - 0.05;
    return {
      ...s,
      absent: scale(s.absent, f, j),
      unfilled: scale(s.unfilled, f, j / 2),
      overtimeRisk: scale(s.overtimeRisk, f, 0),
      estimatedOvertimeCost: scale(s.estimatedOvertimeCost, f, j),
      gapsByRole: s.gapsByRole.map((g) => ({
        ...g,
        gaps: scale(g.gaps, f, j / 3),
      })),
    };
  });
}

export function getPeriodCompliance(ctx: PeriodContext): ComplianceItem[] {
  const f = factorFor(ctx.period, ctx.customRange);
  // Longer periods surface more items due within window
  if (f <= 1.02) return COMPLIANCE;
  const extras = COMPLIANCE.filter((_: ComplianceItem, i: number) => i % 2 === 0).map((c: ComplianceItem, i: number) => ({
    ...c,
    id: `${c.id}-p${i}`,
    title: `${c.title} (${ctx.period})`,
    group:
      f > 1.2
        ? ("Due within 30 days" as const)
        : ("Due within 7 days" as const),
  }));
  return [...COMPLIANCE, ...extras];
}

export function getPeriodIncidents(ctx: PeriodContext): IncidentRecord[] {
  const f = factorFor(ctx.period, ctx.customRange);
  if (f <= 1) return INCIDENTS;
  return [
    ...INCIDENTS,
    ...INCIDENTS.slice(0, Math.min(2, Math.floor(f))).map((inc, i) => ({
      ...inc,
      id: `${inc.id}-hist-${i}`,
      title: `${inc.title} · ${ctx.period} follow-up`,
      serious: i === 0,
    })),
  ];
}

export function getPeriodTasks(ctx: PeriodContext): TaskDeliverySummary[] {
  const f = factorFor(ctx.period, ctx.customRange);
  return TASK_DELIVERY.map((t) => {
    const j = hashStr(t.locationId + ctx.period + "tk") * 6 - 3;
    return {
      ...t,
      completionPercent: Math.max(55, Math.min(99, Math.round(t.completionPercent * (1.02 - (f - 1) * 0.08) + j))),
      openTasks: scale(t.openTasks, f, j / 20),
      checklistsDue: scale(t.checklistsDue, f, 0),
      openingMissed: scale(t.openingMissed, f, 0),
      managerFollowUps: scale(t.managerFollowUps, f, 0),
    };
  });
}

export function getPeriodAssets(ctx: PeriodContext): AssetFacilitiesSnapshot[] {
  const f = factorFor(ctx.period, ctx.customRange);
  return ASSETS.map((a) => ({
    ...a,
    unavailableEquipment: scale(a.unavailableEquipment, f, 0),
    lowStock: scale(a.lowStock, f, 0.05),
    openWorkOrders: scale(a.openWorkOrders, f, 0),
    expectedCosts: scale(a.expectedCosts, f, 0.02),
  }));
}

export function getPeriodDigital(ctx: PeriodContext): DigitalSecuritySnapshot[] {
  const f = factorFor(ctx.period, ctx.customRange);
  return DIGITAL.map((d) => ({
    ...d,
    availabilityPercent: Math.max(92, Math.min(100, Math.round(d.availabilityPercent - (f - 1) * 2))),
    activeOutages: scale(d.activeOutages, Math.max(0.5, 2 - f), 0),
  }));
}

export function getPeriodTrends(ctx: PeriodContext): TrendCard[] {
  const f = factorFor(ctx.period, ctx.customRange);
  const compare = comparePeriodLabel(ctx.period);
  return TRENDS.map((t) => {
    const j = hashStr(t.id + ctx.period) * 0.1 - 0.05;
    const series = t.series.map((v, i) => Math.round(v * f * (1 + j * ((i % 3) - 1) * 0.05)));
    const current = series[series.length - 1] ?? 0;
    const previous = series[series.length - 2] ?? current;
    const pct = previous ? Math.round(((current - previous) / previous) * 1000) / 10 : 0;
    return {
      ...t,
      result: String(current),
      change: `${pct >= 0 ? "+" : ""}${pct}% vs ${compare}`,
      direction: pct > 0.5 ? "up" : pct < -0.5 ? "down" : "flat",
      series,
      explanation: `${t.explanation} Period: ${ctx.period}. Compared with ${compare}.`,
      tableRows: [
        { label: "Selected period", value: ctx.period },
        { label: "Comparison period", value: compare },
        { label: "Current", value: String(current) },
        { label: "Previous", value: String(previous) },
        { label: "Change", value: `${pct}%` },
        ...t.tableRows,
      ],
    };
  });
}

export function kpiPeriodAdjust(
  base: { name: string; value: string },
  ctx: PeriodContext
): string {
  const f = factorFor(ctx.period, ctx.customRange);
  const num = parseFloat(base.value.replace(/[^0-9.-]/g, ""));
  if (Number.isNaN(num)) return `${base.value} · ${ctx.period}`;
  if (base.value.includes("%")) return `${Math.round(num * (0.96 + (f - 1) * 0.2))}%`;
  if (base.value.includes("$")) return `$${scale(num, f, 0).toLocaleString("en-AU")}`;
  return String(scale(num, f, 0));
}

export const HEALTH_AREA_ORDER: ActionCategory[] = [
  "Clinic Operations",
  "Staffing",
  "Compliance",
  "Finance & Pay",
  "Incidents",
  "Tasks & Checklists",
  "Assets & Facilities",
  "Digital & Security",
];
