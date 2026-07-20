import {
  extractedFamilyStyles,
  extractedNav,
  htmlIdToSlug,
  type FamilyStyle,
  type HtmlNavGroup,
} from "./extracted";

export type IconName =
  | "home"
  | "bell"
  | "building"
  | "users"
  | "calendar"
  | "task"
  | "pay"
  | "chart"
  | "checklist"
  | "shield"
  | "file"
  | "box"
  | "alert"
  | "chat"
  | "lock"
  | "globe";

export interface ModuleDef {
  id: string;
  htmlId: string;
  label: string;
  title: string;
  subtitle: string;
  icon: IconName;
  group: string;
  groupId: string;
  polished?: boolean;
}

const ICON_FALLBACK: Record<string, IconName> = {
  home: "home",
  bell: "bell",
  building: "building",
  users: "users",
  calendar: "calendar",
  task: "task",
  pay: "pay",
  chart: "chart",
  checklist: "checklist",
  shield: "shield",
  file: "file",
  box: "box",
  alert: "alert",
  chat: "chat",
  lock: "lock",
  globe: "globe",
};

function resolveIcon(name: string | undefined): IconName {
  if (!name) return "file";
  return ICON_FALLBACK[name] ?? "file";
}

const SUBTITLES: Record<string, string> = {
  dashboard: "Owner/Director Command Centre — urgent matters, finance, clinic health and organisation performance",
  actionInbox: "Review, decide and complete work requiring your attention",
  riskCentre: "Cross-module red/amber items ranked by severity and due date",
  complianceCentre: "Standards coverage, evidence gaps and readiness",
  analytics: "Capacity, trends, data quality and management packs",
  emergencyCentre: "Emergency communications, downtime and continuity",
  tasks: "Create, assign and track operational tasks",
  checklists: "Front desk, nursing, accreditation and manager review checklists",
  frontdesk: "Roster-linked opening and closing duties",
  incidents: "Report, investigate and close operational risks",
  expiry: "Inventory, stock, rooms, staff documents and compliance expiries",
  syncCentre: "Offline capture reconciliation and sync exceptions",
  staff: "Create, manage and track staff members",
  doctors: "Contractor profile, pay settings and readiness",
  recruitment: "Vacancies, candidates and onboarding pipeline",
  training: "Training records, expiry and permission gates",
  hrDocs: "Registrations, certificates and employment documents",
  roster: "Build weekly rosters across locations",
  timeclock: "Clock events, breaks and exceptions",
  inventory: "Track asset inventory and expiry items",
  stock: "Consumables, vaccines and stock levels",
  equipment: "Calibration, tagging and equipment lifecycle",
  rooms: "Rooms and equipment readiness",
  website: "Uptime, SSL expiry and recovery tracking",
  websiteStudio: "Website builder, SEO and digital experience",
  accreditation: "AGPAL/RACGP evidence, checklists and readiness",
  policies: "Document control, versions and review dates",
  qi: "Plan, Do, Study, Act improvement activities",
  audit: "Sensitive actions and export history",
  approvals: "Review workflow exceptions and approvals",
  staffpay: "Prepare approved time for Xero payroll",
  doctorpay: "Best Practice-derived pay runs and payslips",
  bbpip: "Estimate, split and reconcile BBPIP payments",
  financialForecast: "Clinic financial forecast and variance",
  memos: "Publish announcements and staff acknowledgements",
  commbook: "Team notes with read visibility",
  email: "Approved non-clinical email campaigns",
  sms: "Approved non-clinical SMS campaigns",
  noticeboards: "Waiting room and team screen content",
  remote: "Approved remote support and access sessions",
  vault: "Controlled secret access with reveal logging",
  cameras: "Camera register, access approval and export governance",
  settings: "Locations, roles and rules engine",
  saas: "Tenant lifecycle, plans, billing and support",
  vendorConsole: "SaaS vendor command console",
};

const POLISHED = new Set([
  "dashboard",
  "actionInbox",
  "settings",
  "staff",
  "doctors",
  "tasks",
  "checklists",
  "accreditation",
  "riskCentre",
]);

export const NAV_GROUPS: {
  id: string;
  title: string;
  icon: IconName;
  accent: string;
  soft: string;
  items: string[];
}[] = extractedNav.map((group: HtmlNavGroup) => {
  const family: FamilyStyle | undefined = extractedFamilyStyles[group.label];
  return {
    id: group.id,
    title: group.label,
    icon: resolveIcon(group.icon || family?.icon),
    accent: family?.accent ?? "#2563eb",
    soft: family?.soft ?? "#eff6ff",
    // Approvals live only inside Action Inbox — hide the duplicate Governance nav item.
    items: group.items
      .map(([htmlId]) => htmlIdToSlug(htmlId))
      .filter((slug) => slug !== "approvals"),
  };
});

const TITLE_OVERRIDES: Record<string, string> = {
  dashboard: "Owner/Director Command Centre",
  actionInbox: "Action Inbox & Notifications",
};

export const MODULES: ModuleDef[] = extractedNav.flatMap((group) => {
  const family = extractedFamilyStyles[group.label];
  return group.items.map(([htmlId, label]) => ({
    id: htmlIdToSlug(htmlId),
    htmlId,
    label: htmlId === "dashboard" ? "Owner/Director CC" : label,
    title: TITLE_OVERRIDES[htmlId] ?? label,
    subtitle: SUBTITLES[htmlId] ?? `${label} workspace from the HTML prototype`,
    icon: resolveIcon(family?.icon || group.icon),
    group: group.label,
    groupId: group.id,
    polished: POLISHED.has(htmlId),
  }));
});

const MODULE_MAP = Object.fromEntries(MODULES.map((m) => [m.id, m]));

export function getModule(id: string): ModuleDef | undefined {
  return MODULE_MAP[id];
}

export function isModuleId(id: string): boolean {
  return id in MODULE_MAP;
}

export const GROUP_ACCENT = Object.fromEntries(
  NAV_GROUPS.map((g) => [g.title, g.accent])
) as Record<string, string>;

export const GROUP_SOFT = Object.fromEntries(
  NAV_GROUPS.map((g) => [g.title, g.soft])
) as Record<string, string>;
