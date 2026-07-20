import {
  extractedAccreditation,
  extractedChecklists,
  extractedDoctors,
  extractedLocations,
  extractedRisks,
  extractedStaff,
  extractedTheme,
} from "../extracted";
import type { ActionItem, Location, TaskItem } from "../types";
import { ALL_LOCATIONS_ID } from "../types";

function hashTone(id: string): Location["health"] {
  const n = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  if (n % 5 === 0) return "Red";
  if (n % 3 === 0) return "Amber";
  return "Green";
}

function scoreFor(health: Location["health"]): number {
  if (health === "Green") return 88 + (health.length % 8);
  if (health === "Amber") return 70 + (health.length % 10);
  return 55 + (health.length % 8);
}

/** Locations exactly as SEED_LOCATIONS, with UI enrichment fields. */
export const LOCATIONS: Location[] = extractedLocations.map((loc) => {
  const health = hashTone(loc.id);
  return {
    id: loc.id,
    name: loc.name,
    shortName: loc.shortName,
    code: loc.shortName.slice(0, 3).toUpperCase(),
    status: (loc.status as Location["status"]) || "Active",
    manager: loc.manager || "Unassigned",
    address: loc.address || "Address not set",
    phone: loc.phone || "",
    email: loc.email || "",
    users: extractedStaff.filter((s) => {
      const locs = (s.locations as string[] | undefined) || [];
      const single = String(s.location || "");
      return locs.includes(loc.id) || single === loc.id;
    }).length || 8,
    doctors: extractedDoctors.filter((d) => String(d.location || "") === loc.id).length,
    health,
    healthScore: scoreFor(health),
    healthReasons:
      health === "Green"
        ? ["Operationally stable", "No critical exceptions"]
        : health === "Amber"
          ? ["Pending reviews", "Watchlist items open"]
          : ["Coverage or incident pressure", "Needs owner attention"],
  };
});

export const SETTINGS_DEFAULTS = extractedTheme.settingsDefaults;

export const DASHBOARD_KPIS = {
  openActions: 14,
  rosteredSessions: 86,
  openTasks: 27,
  openTickets: 11,
  expiryRisks: extractedRisks.length,
  payExceptions: 5,
  activeStaff: extractedStaff.length,
  activeDoctors: extractedDoctors.length,
  clinics: LOCATIONS.length,
  modules: 20,
};

export const HTML_DOCTORS = extractedDoctors;
export const HTML_STAFF = extractedStaff;
export const HTML_CHECKLISTS = extractedChecklists;
export const HTML_ACCREDITATION = extractedAccreditation;
export const HTML_RISKS = extractedRisks;

function clinicToLocationId(clinic: string): string {
  const hit = LOCATIONS.find(
    (l) =>
      l.shortName.toLowerCase() === clinic.toLowerCase() ||
      l.name.toLowerCase().includes(clinic.toLowerCase())
  );
  return hit?.id || ALL_LOCATIONS_ID;
}

export const ACTION_ITEMS: ActionItem[] = [
  ...extractedRisks.slice(0, 8).map((r, i) => {
    const clinic = String((r as { clinic?: string }).clinic || "");
    return {
      id: `risk-act-${i}`,
      title: String((r as { title?: string }).title || "Risk item"),
      kind: "Exception" as const,
      module: String((r as { category?: string }).category || "Risk Centre"),
      locationId: clinic && clinic !== "All Sites" ? clinicToLocationId(clinic) : LOCATIONS[i % LOCATIONS.length].id,
      priority: (String((r as { severity?: string }).severity || "Medium") as ActionItem["priority"]),
      status: "Open" as const,
      owner: String((r as { owner?: string }).owner || "Group Operations"),
      due: String((r as { due?: string }).due || "2026-07-18"),
      summary: String(
        (r as { route?: string }).route ||
          (r as { category?: string }).category ||
          "Seeded from HTML RISK_SEED."
      ),
    };
  }),
  ...extractedChecklists
    .filter((c) => c.managerReviewRequired)
    .slice(0, 4)
    .map((c, i) => ({
      id: `chk-act-${i}`,
      title: String(c.name),
      kind: "Manager review" as const,
      module: "Checklists",
      locationId: LOCATIONS[i % LOCATIONS.length].id,
      priority: "Medium" as const,
      status: "Pending approval" as const,
      owner: String(c.assignedTo || c.responsibleRole || "Manager"),
      due: "2026-07-16",
      summary: `Source: ${String(c.sourceDocument || "checklist template")} · ${String(c.workflowScope || "")}`,
    })),
  {
    id: "act-pay-1",
    title: "Doctor pay variance — week ending 12 Jul",
    kind: "Exception",
    module: "Doctor Pay",
    locationId: "loc_indooroopilly",
    priority: "High",
    status: "In review",
    owner: "Finance Lead",
    due: "2026-07-15",
    summary: "Best Practice activity vs estimate mismatch on 2 sessions.",
  },
  {
    id: "act-ahpra-1",
    title: "Doctor credential expiry — AHPRA watch",
    kind: "Due soon",
    module: "Doctors",
    locationId: "loc_chapelhill",
    priority: "High",
    status: "Overdue",
    owner: "HR Admin",
    due: "2026-07-12",
    summary: "Registration renewal evidence missing in HR documents.",
  },
];

export const TASKS: TaskItem[] = extractedChecklists.slice(0, 8).map((c, i) => ({
  id: `task-from-chk-${i}`,
  title: String(c.name),
  assignee: String(c.assignedTo || c.responsibleRole || "Team"),
  locationId: LOCATIONS[i % LOCATIONS.length].id,
  status: i % 4 === 0 ? "Done" : i % 3 === 0 ? "In progress" : "Open",
  due: "2026-07-16",
  priority: c.managerReviewRequired ? "High" : "Medium",
  type: "Checklist",
}));

export const MY_DAY_BY_ROLE: Record<string, { time: string; title: string; meta: string }[]> = {
  "Practice Manager": [
    { time: "08:00", title: "Review opening checklist", meta: "Due now" },
    { time: "08:10", title: "Approve attendance exceptions", meta: "3 items" },
    { time: "09:00", title: "Review roster coverage", meta: "1 gap" },
    { time: "11:00", title: "Supplier invoice review", meta: "2 pending" },
  ],
  Reception: [
    { time: "07:45", title: "Clock in", meta: "Ready" },
    { time: "07:47", title: "Opening checklist", meta: "8 items" },
    { time: "10:00", title: "Complete front desk task", meta: "Due today" },
    { time: "16:55", title: "Create handover", meta: "Required" },
  ],
  Nurse: [
    { time: "08:00", title: "Clock in", meta: "Ready" },
    { time: "08:05", title: "Cold-chain AM reading", meta: "Required" },
    { time: "12:00", title: "Treatment-room restock", meta: "Due" },
    { time: "17:00", title: "Nursing handover", meta: "Required" },
  ],
  Finance: [
    { time: "08:30", title: "Doctor pay reconciliation", meta: "Blocked 1" },
    { time: "10:00", title: "Staff pay readiness", meta: "2 clinics" },
    { time: "13:00", title: "Supplier invoice approval", meta: "4 items" },
    { time: "15:30", title: "Manual payment register", meta: "Due today" },
  ],
  Doctor: [
    { time: "08:00", title: "View current clinic", meta: "Bald Hills" },
    { time: "12:30", title: "Review pay statement", meta: "Available" },
    { time: "15:00", title: "Credential renewal", meta: "Due in 21d" },
    { time: "17:00", title: "Raise pay query", meta: "Optional" },
  ],
};

export function locationName(id: string, locations: Location[] = LOCATIONS): string {
  if (!id || id === ALL_LOCATIONS_ID) return "All locations";
  return locations.find((l) => l.id === id)?.name ?? "Unknown clinic";
}

export function locationShort(id: string, locations: Location[] = LOCATIONS): string {
  if (!id || id === ALL_LOCATIONS_ID) return "All clinics";
  return locations.find((l) => l.id === id)?.shortName ?? id;
}

export function matchesLocation(recordLocationId: string, activeId: string): boolean {
  return activeId === ALL_LOCATIONS_ID || recordLocationId === activeId;
}
