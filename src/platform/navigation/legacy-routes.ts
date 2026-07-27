/**
 * Legacy route → approved module + section redirects.
 * Preserve bookmarked URLs without exposing fragmented top-level nav.
 */

export interface LegacyRedirect {
  /** Incoming path slug without leading slash */
  from: string;
  /** Target path including leading slash */
  to: string;
  section?: string;
  /** Extra query defaults (e.g. category=Approval) */
  query?: Record<string, string>;
}

export const LEGACY_REDIRECTS: LegacyRedirect[] = [
  { from: "approvals", to: "/action-inbox", query: { category: "Approval" } },
  { from: "organisation", to: "/settings" },

  { from: "staff", to: "/staff-doctors", section: "people" },
  { from: "doctors", to: "/staff-doctors", section: "doctor-profiles" },
  { from: "hr-docs", to: "/staff-doctors", section: "credentials" },

  { from: "timeclock", to: "/time-attendance", section: "attendance" },
  { from: "sync-centre", to: "/time-attendance", section: "offline-reconciliation" },

  { from: "tasks", to: "/tasks-actions", section: "tasks" },
  { from: "checklists", to: "/tasks-actions", section: "checklists" },
  { from: "frontdesk", to: "/tasks-actions", section: "opening-closing" },
  { from: "meetings", to: "/tasks-actions", section: "meetings" },

  { from: "compliance-centre", to: "/compliance-quality", section: "compliance-centre" },
  { from: "accreditation", to: "/compliance-quality", section: "accreditation" },
  { from: "qi", to: "/compliance-quality", section: "quality-improvement" },
  { from: "audit", to: "/compliance-quality", section: "audit-log" },
  { from: "expiry", to: "/compliance-quality", section: "expiry-centre" },

  { from: "documents", to: "/documents-policies", section: "documents" },
  { from: "policies", to: "/documents-policies", section: "policies" },

  { from: "inventory", to: "/inventory-assets", section: "inventory" },
  { from: "stock", to: "/inventory-assets", section: "stock" },
  { from: "equipment", to: "/inventory-assets", section: "equipment" },
  { from: "rooms", to: "/inventory-assets", section: "rooms" },

  { from: "incidents", to: "/incidents-risk", section: "incidents" },
  { from: "risk-centre", to: "/incidents-risk", section: "risk-centre" },
  { from: "emergency-centre", to: "/incidents-risk", section: "emergency-control" },

  { from: "email", to: "/communications", section: "email" },
  { from: "sms", to: "/communications", section: "sms" },
  { from: "memos", to: "/communications", section: "memos-news" },
  { from: "commbook", to: "/communications", section: "communication-book" },
  { from: "noticeboards", to: "/communications", section: "noticeboards" },

  { from: "website", to: "/digital-ops", section: "website-monitoring" },
  { from: "remote", to: "/digital-ops", section: "remote-access" },
  { from: "vault", to: "/digital-ops", section: "password-vault" },
  { from: "cameras", to: "/digital-ops", section: "security-cameras" },

  { from: "ticket-desk", to: "/ticket-desk" },
  { from: "product-assurance", to: "/settings", section: "overview" },
];

const BY_FROM = Object.fromEntries(LEGACY_REDIRECTS.map((r) => [r.from, r]));

export function getLegacyRedirect(slug: string): LegacyRedirect | undefined {
  return BY_FROM[slug];
}

/** Build redirect URL preserving useful query params and record id. */
export function buildLegacyRedirectHref(
  slug: string,
  incomingSearch?: string | URLSearchParams
): string | null {
  const rule = getLegacyRedirect(slug);
  if (!rule) return null;

  const incoming =
    typeof incomingSearch === "string"
      ? new URLSearchParams(incomingSearch.startsWith("?") ? incomingSearch.slice(1) : incomingSearch)
      : incomingSearch
        ? new URLSearchParams(incomingSearch)
        : new URLSearchParams();

  const out = new URLSearchParams();
  if (rule.section) out.set("section", rule.section);
  if (rule.query) {
    for (const [k, v] of Object.entries(rule.query)) out.set(k, v);
  }

  // Preserve useful params (do not overwrite section/category defaults unless provided)
  const preserve = ["recordId", "recordType", "id", "tab", "category", "clinicId", "q", "view"];
  for (const key of preserve) {
    const val = incoming.get(key);
    if (val && !out.has(key)) out.set(key, val);
  }
  // Allow explicit section override from bookmark
  const sectionOverride = incoming.get("section");
  if (sectionOverride) out.set("section", sectionOverride);

  const qs = out.toString();
  return qs ? `${rule.to}?${qs}` : rule.to;
}

/** Main-route slugs that are approved destinations (not redirect sources). */
export const APPROVED_MAIN_SLUGS = new Set([
  "dashboard",
  "action-inbox",
  "settings",
  "staff-doctors",
  "roster",
  "time-attendance",
  "staffpay",
  "doctorpay",
  "bbpip",
  "tasks-actions",
  "training",
  "compliance-quality",
  "documents-policies",
  "ticket-desk",
  "inventory-assets",
  "incidents-risk",
  "communications",
  "digital-ops",
  "analytics",
  "saas",
  "vendor-console",
  "recruitment",
  "website-studio",
  "financial-forecast",
]);
