import type {
  Announcement,
  CommandAction,
  ComplianceItem,
  FinanceSnapshot,
  IncidentRecord,
  SearchResult,
  StaffingSnapshot,
  ActivityItem,
  AssetFacilitiesSnapshot,
  ClinicHealthProfile,
} from "./types";
import type { Location } from "@/lib/types";
import { locationShort } from "@/lib/mock/data";

export type SearchNavigate =
  | { kind: "action"; actionId: string }
  | { kind: "panel"; panel: string; locationId?: string }
  | { kind: "health"; locationId: string }
  | { kind: "announcement"; id: string }
  | { kind: "eod" }
  | { kind: "reports" };

export interface EnrichSearchResult extends SearchResult {
  navigate?: SearchNavigate;
}

function qIncludes(hay: string, q: string) {
  return hay.toLowerCase().includes(q);
}

const QUESTIONS: Array<{
  match: (q: string) => boolean;
  build: (ctx: SearchContext) => EnrichSearchResult[];
}> = [
  {
    match: (q) => /urgent issues|which clinics have urgent/i.test(q),
    build: (ctx) =>
      ctx.health
        .filter((h) => h.urgentIssues > 0 || h.band === "Urgent Review")
        .map((h) => ({
          id: `q-urgent-${h.locationId}`,
          type: "Clinic",
          title: `${locationShort(h.locationId, ctx.locations)} — ${h.urgentIssues} urgent`,
          snippet: `Health ${h.overallScore ?? "—"}% · ${h.band}`,
          locationId: h.locationId,
          navigate: { kind: "health", locationId: h.locationId },
        })),
  },
  {
    match: (q) => /approvals? (waiting|for me)|waiting for me/i.test(q),
    build: (ctx) =>
      ctx.actions
        .filter((a) => a.stage === "Awaiting Approval" || /approval/i.test(a.title))
        .slice(0, 8)
        .map((a) => ({
          id: `q-appr-${a.id}`,
          type: "Action",
          title: a.title,
          snippet: `${a.reference} · ${a.stage}`,
          actionId: a.id,
          navigate: { kind: "action", actionId: a.id },
        })),
  },
  {
    match: (q) => /compliance.*(expire|this month)|expire this month/i.test(q),
    build: (ctx) =>
      ctx.compliance
        .filter((c) => c.group.includes("30") || c.group.includes("7") || c.group === "Expired")
        .map((c) => ({
          id: `q-comp-${c.id}`,
          type: "Compliance",
          title: c.title,
          snippet: `${c.subject} · ${c.group} · Due ${c.due}`,
          locationId: c.locationId,
          navigate: { kind: "panel", panel: "compliance" },
        })),
  },
  {
    match: (q) => /staffing gaps? for tomorrow|gaps for tomorrow/i.test(q),
    build: (ctx) =>
      ctx.staffing
        .filter((s) => s.unfilled > 0 || s.gapsByRole.some((g) => g.gaps > 0))
        .map((s) => ({
          id: `q-staff-${s.locationId}`,
          type: "Staffing",
          title: `${locationShort(s.locationId, ctx.locations)} staffing gaps`,
          snippet: `Unfilled ${s.unfilled} · ${s.nextSevenDayRisks[0] ?? "Review roster"}`,
          locationId: s.locationId,
          navigate: { kind: "panel", panel: "staffing" },
        })),
  },
  {
    match: (q) => /largest financial decline|financial decline/i.test(q),
    build: (ctx) => {
      const clinics = ctx.finance.filter((f) => f.locationId !== "all");
      const worst = [...clinics].sort((a, b) => a.variancePercent - b.variancePercent)[0];
      if (!worst) return [];
      return [
        {
          id: `q-fin-decline`,
          type: "Finance",
          title: `${locationShort(worst.locationId, ctx.locations)} — largest variance`,
          snippet: `P/L ${worst.profitLoss} · Variance ${worst.variancePercent}%`,
          locationId: worst.locationId,
          navigate: { kind: "panel", panel: "finance" },
        },
      ];
    },
  },
  {
    match: (q) => /more than seven days overdue|7 days overdue|seven days overdue/i.test(q),
    build: (ctx) =>
      ctx.actions
        .filter((a) => a.priority === "Overdue" || (a.overdueAge && parseInt(a.overdueAge, 10) >= 7))
        .map((a) => ({
          id: `q-od-${a.id}`,
          type: "Action",
          title: a.title,
          snippet: `${a.reference} · ${a.overdueAge ?? "Overdue"}`,
          actionId: a.id,
          navigate: { kind: "action", actionId: a.id },
        })),
  },
  {
    match: (q) => /all emergency|show.*emergency/i.test(q),
    build: (ctx) =>
      ctx.actions
        .filter((a) => a.priority === "Emergency")
        .map((a) => ({
          id: `q-em-${a.id}`,
          type: "Action",
          title: a.title,
          snippet: `${a.reference} · Emergency`,
          actionId: a.id,
          navigate: { kind: "action", actionId: a.id },
        })),
  },
  {
    match: (q) => /completed today|what was completed/i.test(q),
    build: (ctx) =>
      ctx.actions
        .filter((a) => a.priority === "Completed Today" || a.stage === "Completed")
        .map((a) => ({
          id: `q-done-${a.id}`,
          type: "Completed",
          title: a.title,
          snippet: `${a.reference} · Completed Today`,
          actionId: a.id,
          navigate: { kind: "action", actionId: a.id },
        })),
  },
];

export interface SearchContext {
  query: string;
  actions: CommandAction[];
  announcements: Announcement[];
  compliance: ComplianceItem[];
  finance: FinanceSnapshot[];
  incidents: IncidentRecord[];
  staffing: StaffingSnapshot[];
  assets: AssetFacilitiesSnapshot[];
  health: ClinicHealthProfile[];
  activity: ActivityItem[];
  locations: Location[];
  people?: string[];
}

export function runPlatformSearch(ctx: SearchContext): EnrichSearchResult[] {
  const q = ctx.query.trim();
  if (!q) return [];

  for (const rule of QUESTIONS) {
    if (rule.match(q)) {
      const rows = rule.build(ctx);
      if (rows.length) return rows;
    }
  }

  const results: EnrichSearchResult[] = [];
  const ql = q.toLowerCase();

  for (const a of ctx.actions) {
    if (
      qIncludes(a.title, ql) ||
      qIncludes(a.reference, ql) ||
      qIncludes(a.details, ql) ||
      qIncludes(a.owner, ql) ||
      qIncludes(a.stage, ql)
    ) {
      results.push({
        id: `act-${a.id}`,
        type: "Action",
        title: a.title,
        snippet: `${a.reference} · ${a.priority} · ${a.stage}`,
        actionId: a.id,
        locationId: a.locationId,
        navigate: { kind: "action", actionId: a.id },
      });
    }
  }

  for (const h of ctx.health) {
    const name = locationShort(h.locationId, ctx.locations);
    if (qIncludes(name, ql) || qIncludes(h.manager, ql) || qIncludes(h.band, ql)) {
      results.push({
        id: `cli-${h.locationId}`,
        type: "Clinic",
        title: name,
        snippet: `${h.band} · Score ${h.overallScore ?? "—"}% · Manager ${h.manager}`,
        locationId: h.locationId,
        navigate: { kind: "health", locationId: h.locationId },
      });
    }
  }

  const people = ctx.people ?? ["Neil", "Practice Manager", "Reception Lead", "Doctor roster"];
  for (const p of people) {
    if (qIncludes(p, ql)) {
      results.push({
        id: `ppl-${p}`,
        type: "People",
        title: p,
        snippet: "Person / role in demonstration data",
        navigate: { kind: "panel", panel: "staffing" },
      });
    }
  }

  for (const a of ctx.announcements) {
    if (qIncludes(a.title, ql) || qIncludes(a.message, ql)) {
      results.push({
        id: `ann-${a.id}`,
        type: "Announcement",
        title: a.title,
        snippet: a.message.slice(0, 120),
        navigate: { kind: "announcement", id: a.id },
      });
    }
  }

  for (const i of ctx.incidents) {
    if (qIncludes(i.title, ql) || qIncludes(i.investigator, ql)) {
      results.push({
        id: `inc-${i.id}`,
        type: "Incident",
        title: i.title,
        snippet: `${i.type} · ${i.stage}`,
        actionId: i.actionId,
        navigate: i.actionId
          ? { kind: "action", actionId: i.actionId }
          : { kind: "panel", panel: "incidents" },
      });
    }
  }

  for (const c of ctx.compliance) {
    if (qIncludes(c.title, ql) || qIncludes(c.subject, ql)) {
      results.push({
        id: `cmp-${c.id}`,
        type: "Compliance",
        title: c.title,
        snippet: `${c.group} · ${c.due}`,
        navigate: { kind: "panel", panel: "compliance" },
      });
    }
  }

  for (const f of ctx.finance) {
    const name = f.locationId === "all" ? "Organisation finance" : locationShort(f.locationId, ctx.locations);
    if (qIncludes(name, ql) || /finance|profit|pay|income/.test(ql)) {
      results.push({
        id: `fin-${f.locationId}`,
        type: "Finance",
        title: name,
        snippet: `Income · P/L demonstration for selected period`,
        navigate: { kind: "panel", panel: "finance" },
      });
    }
  }

  for (const a of ctx.assets) {
    if (/asset|equipment|stock|supplier|facility/.test(ql) || qIncludes(a.locationId, ql)) {
      results.push({
        id: `ast-${a.locationId}`,
        type: "Asset",
        title: `Assets — ${a.locationId === "all" ? "Organisation" : a.locationId}`,
        snippet: a.impactNotes[0] ?? "Facilities snapshot",
        navigate: { kind: "panel", panel: "assets" },
      });
    }
  }

  if (/document|policy|attachment/.test(ql)) {
    results.push({
      id: "doc-demo",
      type: "Document",
      title: "Demonstration document index",
      snippet: "Document search is local demonstration only — no document store connected.",
      navigate: { kind: "panel", panel: "activity" },
    });
  }

  for (const act of ctx.activity) {
    if (qIncludes(act.title, ql) || qIncludes(act.summary, ql)) {
      results.push({
        id: `acty-${act.id}`,
        type: "Activity",
        title: act.title,
        snippet: act.summary,
        actionId: act.actionId,
        navigate: act.actionId
          ? { kind: "action", actionId: act.actionId }
          : { kind: "panel", panel: "activity" },
      });
    }
  }

  return results.slice(0, 40);
}
