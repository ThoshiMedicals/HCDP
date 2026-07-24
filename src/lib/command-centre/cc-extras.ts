import type {
  ActionTemplate,
  ClinicGroup,
  DashboardSectionLayout,
  HolidayHandling,
  RecurringSchedule,
  ReportSchedule,
} from "./types";
import type { SavedLayout } from "./storage";
import { readJson, writeJson, CC_STORAGE } from "./storage";

export const CC_EXTRA_STORAGE = {
  demoDay: "pulse.cc.demoDay",
  sidebarCollapsed: "pulse.sidebarCollapsed",
  templates: "pulse.cc.templates",
  recurring: "pulse.cc.recurring",
  reportSchedules: "pulse.cc.reportSchedules",
  clinicGroups: "pulse.cc.clinicGroups",
  cardStateOverride: "pulse.cc.qa.cardState",
} as const;

export function readDemoDay(): string {
  const fallback = new Date().toISOString().slice(0, 10);
  return readJson<string>(CC_EXTRA_STORAGE.demoDay, fallback);
}

export function writeDemoDay(isoDate: string) {
  writeJson(CC_EXTRA_STORAGE.demoDay, isoDate);
}

export function advanceDemoDay(days = 1): string {
  const cur = readDemoDay();
  const d = new Date(`${cur}T12:00:00`);
  d.setDate(d.getDate() + days);
  const next = d.toISOString().slice(0, 10);
  writeDemoDay(next);
  return next;
}

export function readSidebarCollapsed(): boolean {
  return readJson<boolean>(CC_EXTRA_STORAGE.sidebarCollapsed, false);
}

export function writeSidebarCollapsed(v: boolean) {
  writeJson(CC_EXTRA_STORAGE.sidebarCollapsed, v);
}

export function readActiveLayoutId(): string | null {
  return readJson<string | null>(CC_STORAGE.activeLayout, null);
}

export function writeActiveLayoutId(id: string | null) {
  writeJson(CC_STORAGE.activeLayout, id);
}

export const SUGGESTED_LAYOUT_NAMES = [
  "Daily Operations",
  "Compliance Review",
  "Finance Review",
  "All Clinics Overview",
] as const;

export function ensureSuggestedLayouts(
  existing: SavedLayout[],
  defaultSections: DashboardSectionLayout[]
): SavedLayout[] {
  const names = new Set(existing.map((l) => l.name));
  const extras: SavedLayout[] = [];
  for (const name of SUGGESTED_LAYOUT_NAMES) {
    if (names.has(name)) continue;
    extras.push({
      id: `lay-sug-${name.replace(/\s+/g, "-").toLowerCase()}`,
      name,
      sections: defaultSections.map((s) => ({ ...s })),
      updatedAt: new Date().toISOString(),
      isDefault: false,
    });
  }
  return extras.length ? [...existing, ...extras] : existing;
}

const SEED_TEMPLATES: ActionTemplate[] = [
  {
    id: "tmpl-org-opening",
    scope: "Organisation",
    name: "Organisation · Opening follow-up",
    priority: "Attention Required",
    category: "Clinic Operations",
    details: "Confirm opening checklist completion and escalate gaps.",
    ownerType: "role",
    owner: "Practice Manager",
    reminder: "Attention Required — weekly",
    escalation: "Responsible User",
    finalApproval: false,
    archived: false,
  },
  {
    id: "tmpl-org-compliance",
    scope: "Organisation",
    name: "Organisation · Compliance expiry",
    priority: "Urgent",
    category: "Compliance",
    details: "Renew or record temporary continued use before expiry.",
    ownerType: "role",
    owner: "Compliance Lead",
    reminder: "Urgent — every two days",
    escalation: "Owner / Director",
    finalApproval: true,
    archived: false,
  },
  {
    id: "tmpl-pers-review",
    scope: "Personal",
    name: "Personal · Owner review",
    priority: "Routine",
    category: "Clinic Operations",
    details: "Owner weekly clinic health review.",
    ownerType: "person",
    owner: "Neil",
    reminder: "Routine — monthly",
    escalation: "None",
    finalApproval: false,
    archived: false,
  },
];

export function readTemplates(): ActionTemplate[] {
  return readJson<ActionTemplate[]>(CC_EXTRA_STORAGE.templates, SEED_TEMPLATES);
}

export function writeTemplates(t: ActionTemplate[]) {
  writeJson(CC_EXTRA_STORAGE.templates, t);
}

export function readRecurring(): RecurringSchedule[] {
  return readJson<RecurringSchedule[]>(CC_EXTRA_STORAGE.recurring, []);
}

export function writeRecurring(r: RecurringSchedule[]) {
  writeJson(CC_EXTRA_STORAGE.recurring, r);
}

export function readReportSchedules(): ReportSchedule[] {
  return readJson<ReportSchedule[]>(CC_EXTRA_STORAGE.reportSchedules, []);
}

export function writeReportSchedules(s: ReportSchedule[]) {
  writeJson(CC_EXTRA_STORAGE.reportSchedules, s);
}

export function readClinicGroups(fallback: ClinicGroup[]): ClinicGroup[] {
  const stored = readJson<ClinicGroup[]>(CC_EXTRA_STORAGE.clinicGroups, fallback);
  return stored.length ? stored : fallback;
}

export function writeClinicGroups(groups: ClinicGroup[]) {
  writeJson(CC_EXTRA_STORAGE.clinicGroups, groups);
}

export type QaCardState =
  | "ready"
  | "loading"
  | "empty"
  | "no-match"
  | "incomplete"
  | "stale"
  | "error"
  | "permission";

export function readQaCardState(): QaCardState | null {
  return readJson<QaCardState | null>(CC_EXTRA_STORAGE.cardStateOverride, null);
}

export function writeQaCardState(s: QaCardState | null) {
  writeJson(CC_EXTRA_STORAGE.cardStateOverride, s);
}

export function holidayRuleLabel(h: HolidayHandling): string {
  return h;
}
