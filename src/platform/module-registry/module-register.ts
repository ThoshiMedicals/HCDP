/**
 * Authoritative 24-module register — single source for sidebar, routes,
 * titles, search, favourites, access checks, and status labels.
 */

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
  | "globe"
  | "search";

export type ImplementationCondition =
  | "complete-interactive-rebuild"
  | "strong-existing"
  | "partially-implemented"
  | "placeholder"
  | "legacy-html-fallback"
  | "missing";

export type AccessClassification =
  | "executive"
  | "manager"
  | "operational"
  | "finance"
  | "hr"
  | "compliance"
  | "enterprise-vendor"
  | "read-only";

export type NavigationFamily =
  | "Executive"
  | "Organisation"
  | "People"
  | "Roster"
  | "Operations"
  | "Governance"
  | "Assets"
  | "Communications"
  | "Digital"
  | "Analytics"
  | "Commercial"
  | "Enterprise";

export interface ModuleSection {
  id: string;
  label: string;
  legacyTerms?: string[];
}

export interface PlatformModule {
  number: number;
  id: string;
  displayName: string;
  shortName: string;
  purpose: string;
  mainRoute: string;
  legacyRoutes: string[];
  sections: ModuleSection[];
  icon: IconName;
  navigationFamily: NavigationFamily;
  accessClassification: AccessClassification;
  tier: "core" | "enterprise";
  condition: ImplementationCondition;
  forceNext: boolean;
  /** Roles that can see this module; empty = all authenticated demo users */
  visibleForRoles: string[] | "all";
  canCreateInboxEvents: boolean;
  contributesExecutiveSummary: boolean;
  relatedModuleIds: string[];
  legacyFeatures: string[];
  familyAccent: string;
  familySoft: string;
  /** Legacy htmlId used by HTML prototype / older prefs */
  primaryHtmlId?: string;
  htmlIds?: string[];
}

const ALL = "all" as const;

const ENTERPRISE_ROLES = [
  "Director",
  "Senior Administrator",
  "SaaS Vendor Administrator",
];

export const PLATFORM_MODULES: PlatformModule[] = [
  {
    number: 1,
    id: "executive-command-centre",
    displayName: "Executive Command Centre",
    shortName: "Command Centre",
    purpose: "Owner/Director command centre for urgent matters, clinic health and organisation performance.",
    mainRoute: "/dashboard",
    legacyRoutes: ["/dashboard", "/"],
    sections: [
      { id: "command-centre", label: "Command Centre" },
      { id: "my-day", label: "My Day" },
      { id: "kpi-scorecard", label: "KPI Scorecard" },
      { id: "reports", label: "Reports" },
    ],
    icon: "home",
    navigationFamily: "Executive",
    accessClassification: "executive",
    tier: "core",
    condition: "complete-interactive-rebuild",
    forceNext: true,
    visibleForRoles: ALL,
    canCreateInboxEvents: false,
    contributesExecutiveSummary: true,
    relatedModuleIds: ["action-inbox", "analytics"],
    legacyFeatures: ["Priority summary", "Clinic comparison", "Executive actions"],
    familyAccent: "#2563eb",
    familySoft: "#eff6ff",
    primaryHtmlId: "dashboard",
    htmlIds: ["dashboard"],
  },
  {
    number: 2,
    id: "action-inbox",
    displayName: "Action Inbox & Notifications",
    shortName: "Action Inbox",
    purpose: "Review, decide and complete work requiring attention across clinics.",
    mainRoute: "/action-inbox",
    legacyRoutes: ["/action-inbox", "/approvals"],
    sections: [
      { id: "my-actions", label: "My Actions" },
      { id: "approvals", label: "Approvals", legacyTerms: ["Approvals"] },
      { id: "notifications", label: "Notifications" },
      { id: "archive", label: "Archive" },
    ],
    icon: "bell",
    navigationFamily: "Executive",
    accessClassification: "operational",
    tier: "core",
    condition: "complete-interactive-rebuild",
    forceNext: true,
    visibleForRoles: ALL,
    canCreateInboxEvents: true,
    contributesExecutiveSummary: true,
    relatedModuleIds: ["executive-command-centre", "organisation-access"],
    legacyFeatures: ["Approvals queue", "Notification centre", "Delegations"],
    familyAccent: "#2563eb",
    familySoft: "#eff6ff",
    primaryHtmlId: "actionInbox",
    htmlIds: ["actionInbox", "approvals"],
  },
  {
    number: 3,
    id: "organisation-access",
    displayName: "Organisation, Locations, Users & Permissions",
    shortName: "Organisation & Access",
    purpose: "Organisation structure, locations, users, roles, access requests and security monitoring.",
    mainRoute: "/settings",
    legacyRoutes: ["/settings", "/organisation"],
    sections: [
      { id: "overview", label: "Overview" },
      { id: "structure", label: "Organisation Structure" },
      { id: "locations", label: "Locations" },
      { id: "departments", label: "Departments & Rooms" },
      { id: "users", label: "Users" },
      { id: "roles", label: "Roles & Permissions" },
      { id: "access-requests", label: "Access Requests" },
      { id: "access-reviews", label: "Access Reviews" },
      { id: "security", label: "Security Monitoring" },
      { id: "audit", label: "Audit History" },
      { id: "reports", label: "Reports" },
      { id: "settings", label: "Settings" },
    ],
    icon: "building",
    navigationFamily: "Organisation",
    accessClassification: "manager",
    tier: "core",
    condition: "complete-interactive-rebuild",
    forceNext: true,
    visibleForRoles: ALL,
    canCreateInboxEvents: true,
    contributesExecutiveSummary: true,
    relatedModuleIds: ["action-inbox", "staff-doctors", "digital-ops"],
    legacyFeatures: ["Access requests", "Access reviews", "Security alerts", "Dual approval demo"],
    familyAccent: "#475569",
    familySoft: "#f8fafc",
    primaryHtmlId: "settings",
    htmlIds: ["settings"],
  },
  {
    number: 4,
    id: "staff-doctors",
    displayName: "Staff & Doctor Management",
    shortName: "Staff & Doctors",
    purpose: "Authoritative workforce people, engagements, credentials, leave, restrictions and readiness.",
    mainRoute: "/staff-doctors",
    legacyRoutes: ["/staff", "/doctors", "/hr-docs"],
    sections: [
      { id: "overview", label: "Overview" },
      { id: "people", label: "People Directory", legacyTerms: ["Staff", "staff"] },
      { id: "staff-profiles", label: "Staff Profiles", legacyTerms: ["Staff Profiles"] },
      { id: "doctor-profiles", label: "Doctor Profiles", legacyTerms: ["Doctors", "doctors"] },
      { id: "engagements", label: "Engagements", legacyTerms: ["Employment", "employment"] },
      { id: "credentials", label: "Credentials", legacyTerms: ["HR Documents", "HR Docs", "hr-documents"] },
      { id: "leave-availability", label: "Leave & Availability", legacyTerms: ["Availability", "availability"] },
      { id: "restrictions", label: "Restrictions" },
      { id: "onboarding", label: "Onboarding" },
      { id: "offboarding", label: "Offboarding" },
      { id: "reports", label: "Reports" },
      { id: "settings", label: "Settings" },
    ],
    icon: "users",
    navigationFamily: "People",
    accessClassification: "hr",
    tier: "core",
    condition: "complete-interactive-rebuild",
    forceNext: true,
    visibleForRoles: ALL,
    canCreateInboxEvents: true,
    contributesExecutiveSummary: true,
    relatedModuleIds: ["roster", "training", "recruitment", "action-inbox", "executive-command-centre"],
    legacyFeatures: ["Staff directory", "Doctors directory", "HR Documents HTML"],
    familyAccent: "#7c3aed",
    familySoft: "#f5f3ff",
    primaryHtmlId: "staff",
    htmlIds: ["staff", "doctors", "hrDocs"],
  },
  {
    number: 5,
    id: "roster",
    displayName: "Roster & Shift Management",
    shortName: "Roster & Shifts",
    purpose: "Build and publish weekly rosters and manage shift swaps across locations.",
    mainRoute: "/roster",
    legacyRoutes: ["/roster"],
    sections: [
      { id: "roster-board", label: "Roster Board", legacyTerms: ["roster-grid", "Roster Grid"] },
      { id: "coverage", label: "Coverage" },
      { id: "open-shifts", label: "Open Shifts" },
      { id: "availability-leave", label: "Availability & Leave", legacyTerms: ["leave"] },
      { id: "requests", label: "Requests", legacyTerms: ["shift-swaps", "Shift Swaps", "swaps"] },
      { id: "conflicts-warnings", label: "Conflicts & Warnings" },
      { id: "published-history", label: "Published & History", legacyTerms: ["publish", "Publish & Notify", "history"] },
      { id: "cost-forecast", label: "Cost Forecast" },
      { id: "reports", label: "Reports" },
      { id: "settings", label: "Policy & Settings", legacyTerms: ["policy", "policies"] },
    ],
    icon: "calendar",
    navigationFamily: "Roster",
    accessClassification: "operational",
    tier: "core",
    condition: "complete-interactive-rebuild",
    forceNext: true,
    visibleForRoles: ALL,
    canCreateInboxEvents: true,
    contributesExecutiveSummary: true,
    relatedModuleIds: ["staff-doctors", "time-attendance"],
    legacyFeatures: ["HTML roster grid", "Shift swap schema"],
    familyAccent: "#0891b2",
    familySoft: "#ecfeff",
    primaryHtmlId: "roster",
    htmlIds: ["roster"],
  },
  {
    number: 6,
    id: "time-attendance",
    displayName: "Time & Attendance",
    shortName: "Time & Attendance",
    purpose: "Clock events, timesheets, exceptions and offline reconciliation.",
    mainRoute: "/time-attendance",
    legacyRoutes: ["/timeclock", "/sync-centre"],
    sections: [
      { id: "live", label: "Live Attendance", legacyTerms: ["Attendance", "Time & Attendance", "Timeclock"] },
      { id: "clock", label: "Clock In/Out", legacyTerms: ["Clock Events"] },
      { id: "timesheets", label: "Timesheets" },
      { id: "exceptions", label: "Exceptions" },
      { id: "corrections", label: "Corrections" },
      { id: "approvals", label: "Approvals" },
      { id: "breaks", label: "Breaks" },
      { id: "history", label: "Attendance History" },
      { id: "reports", label: "Reports" },
      { id: "settings", label: "Settings & Policies", legacyTerms: ["Offline Reconciliation", "Sync Centre"] },
    ],
    icon: "calendar",
    navigationFamily: "Roster",
    accessClassification: "operational",
    tier: "core",
    condition: "complete-interactive-rebuild",
    forceNext: true,
    visibleForRoles: ALL,
    canCreateInboxEvents: true,
    contributesExecutiveSummary: true,
    relatedModuleIds: ["roster", "staff-pay"],
    legacyFeatures: ["Timeclock HTML", "Sync Centre HTML"],
    familyAccent: "#0891b2",
    familySoft: "#ecfeff",
    primaryHtmlId: "timeclock",
    htmlIds: ["timeclock", "syncCentre"],
  },
  {
    number: 7,
    id: "staff-pay",
    displayName: "Staff Pay & Payroll Preparation",
    shortName: "Staff Pay",
    purpose: "Prepare approved time for payroll export and exception handling.",
    mainRoute: "/staffpay",
    legacyRoutes: ["/staffpay"],
    sections: [
      { id: "overview", label: "Pay Run Overview" },
      { id: "people", label: "People Review" },
      { id: "leave", label: "Leave & Allowances" },
      { id: "adjustments", label: "Adjustments" },
      { id: "exceptions", label: "Exceptions" },
      { id: "variances", label: "Variances" },
      { id: "approval", label: "Approval" },
      { id: "export", label: "Export" },
      { id: "reconciliation", label: "Reconciliation" },
      { id: "history", label: "History / Reports" },
      { id: "settings", label: "Settings" },
    ],
    icon: "pay",
    navigationFamily: "Commercial",
    accessClassification: "finance",
    tier: "core",
    condition: "partially-implemented",
    forceNext: true,
    visibleForRoles: ALL,
    canCreateInboxEvents: false,
    contributesExecutiveSummary: false,
    relatedModuleIds: ["time-attendance", "doctor-pay", "financial-forecast"],
    legacyFeatures: ["Staff pay HTML"],
    familyAccent: "#b45309",
    familySoft: "#fffbeb",
    primaryHtmlId: "staffpay",
    htmlIds: ["staffpay"],
  },
  {
    number: 8,
    id: "doctor-pay",
    displayName: "Doctor Pay Command Centre",
    shortName: "Doctor Pay",
    purpose: "Best Practice-derived doctor pay runs, splits and payslips.",
    mainRoute: "/doctorpay",
    legacyRoutes: ["/doctorpay"],
    sections: [
      { id: "pay-runs", label: "Pay Runs" },
      { id: "splits", label: "Splits" },
      { id: "payslips", label: "Payslips" },
    ],
    icon: "pay",
    navigationFamily: "Commercial",
    accessClassification: "finance",
    tier: "core",
    condition: "legacy-html-fallback",
    forceNext: true,
    visibleForRoles: ALL,
    canCreateInboxEvents: false,
    contributesExecutiveSummary: false,
    relatedModuleIds: ["bbpip", "staff-pay", "financial-forecast"],
    legacyFeatures: ["Doctor pay HTML"],
    familyAccent: "#b45309",
    familySoft: "#fffbeb",
    primaryHtmlId: "doctorpay",
    htmlIds: ["doctorpay"],
  },
  {
    number: 9,
    id: "bbpip",
    displayName: "BBPIP Forecast & Reconciliation",
    shortName: "BBPIP",
    purpose: "Estimate, split and reconcile BBPIP payments.",
    mainRoute: "/bbpip",
    legacyRoutes: ["/bbpip"],
    sections: [
      { id: "forecast", label: "Forecast" },
      { id: "reconciliation", label: "Reconciliation" },
      { id: "splits", label: "Splits" },
    ],
    icon: "pay",
    navigationFamily: "Commercial",
    accessClassification: "finance",
    tier: "core",
    condition: "legacy-html-fallback",
    forceNext: true,
    visibleForRoles: ALL,
    canCreateInboxEvents: false,
    contributesExecutiveSummary: false,
    relatedModuleIds: ["doctor-pay", "financial-forecast"],
    legacyFeatures: ["BBPIP HTML"],
    familyAccent: "#b45309",
    familySoft: "#fffbeb",
    primaryHtmlId: "bbpip",
    htmlIds: ["bbpip"],
  },
  {
    number: 10,
    id: "tasks-actions",
    displayName: "Tasks, Checklists, Meetings & Actions",
    shortName: "Tasks & Actions",
    purpose: "Operational tasks, checklists, opening/closing, handovers, meetings and meeting actions.",
    mainRoute: "/tasks-actions",
    legacyRoutes: ["/tasks", "/checklists", "/frontdesk", "/meetings"],
    sections: [
      { id: "tasks", label: "Tasks", legacyTerms: ["Tasks"] },
      { id: "checklists", label: "Checklists", legacyTerms: ["Checklists"] },
      { id: "opening-closing", label: "Opening & Closing", legacyTerms: ["Opening", "Closing", "Opening / Closing", "Front Desk", "Frontdesk"] },
      { id: "handovers", label: "Handovers", legacyTerms: ["Handover"] },
      { id: "meetings", label: "Meetings", legacyTerms: ["Meetings"] },
      { id: "meeting-actions", label: "Meeting Actions", legacyTerms: ["Meeting Actions"] },
    ],
    icon: "task",
    navigationFamily: "Operations",
    accessClassification: "operational",
    tier: "core",
    condition: "partially-implemented",
    forceNext: true,
    visibleForRoles: ALL,
    canCreateInboxEvents: false,
    contributesExecutiveSummary: false,
    relatedModuleIds: ["action-inbox", "ticketing"],
    legacyFeatures: ["Tasks Next", "Checklists Next", "Meetings HTML", "Opening/Closing HTML"],
    familyAccent: "#0f766e",
    familySoft: "#ecfdf5",
    primaryHtmlId: "tasks",
    htmlIds: ["tasks", "checklists", "frontdesk", "meetings"],
  },
  {
    number: 11,
    id: "training",
    displayName: "Training & Learning Management",
    shortName: "Training",
    purpose: "Training records, expiry tracking and permission gates.",
    mainRoute: "/training",
    legacyRoutes: ["/training"],
    sections: [
      { id: "records", label: "Training Records" },
      { id: "expiry", label: "Expiry & Gates" },
      { id: "catalogue", label: "Learning Catalogue" },
    ],
    icon: "checklist",
    navigationFamily: "People",
    accessClassification: "hr",
    tier: "core",
    condition: "legacy-html-fallback",
    forceNext: true,
    visibleForRoles: ALL,
    canCreateInboxEvents: false,
    contributesExecutiveSummary: false,
    relatedModuleIds: ["staff-doctors", "compliance-quality"],
    legacyFeatures: ["Training HTML"],
    familyAccent: "#7c3aed",
    familySoft: "#f5f3ff",
    primaryHtmlId: "training",
    htmlIds: ["training"],
  },
  {
    number: 12,
    id: "compliance-quality",
    displayName: "Accreditation, Quality & Regulatory Compliance",
    shortName: "Compliance & Quality",
    purpose: "Compliance centre, accreditation evidence, QI/PDSA, audit log and expiry centre.",
    mainRoute: "/compliance-quality",
    legacyRoutes: ["/compliance-centre", "/accreditation", "/qi", "/audit", "/expiry"],
    sections: [
      { id: "compliance-centre", label: "Compliance Centre", legacyTerms: ["Compliance Centre", "Compliance"] },
      { id: "accreditation", label: "Accreditation", legacyTerms: ["Accreditation"] },
      { id: "quality-improvement", label: "Quality Improvement", legacyTerms: ["QI", "Quality"] },
      { id: "pdsa", label: "PDSA", legacyTerms: ["PDSA"] },
      { id: "audit-log", label: "Audit Log", legacyTerms: ["Audit Log", "Audit"] },
      { id: "expiry-centre", label: "Expiry Centre", legacyTerms: ["Expiry Centre", "Expiry"] },
    ],
    icon: "shield",
    navigationFamily: "Governance",
    accessClassification: "compliance",
    tier: "core",
    condition: "partially-implemented",
    forceNext: true,
    visibleForRoles: ALL,
    canCreateInboxEvents: false,
    contributesExecutiveSummary: false,
    relatedModuleIds: ["incidents-risk", "documents-policies", "training"],
    legacyFeatures: ["Accreditation Next", "Compliance/Risk HTML", "QI/Audit/Expiry HTML"],
    familyAccent: "#16a34a",
    familySoft: "#f0fdf4",
    primaryHtmlId: "complianceCentre",
    htmlIds: ["complianceCentre", "accreditation", "qi", "audit", "expiry"],
  },
  {
    number: 13,
    id: "documents-policies",
    displayName: "Documents, Policies, SOPs & Intake",
    shortName: "Documents & Policies",
    purpose: "Document control, policies, SOPs, intake queue, reviews and version history.",
    mainRoute: "/documents-policies",
    legacyRoutes: ["/documents", "/policies"],
    sections: [
      { id: "documents", label: "Documents", legacyTerms: ["Documents", "Documents & Intake"] },
      { id: "policies", label: "Policies", legacyTerms: ["Policies"] },
      { id: "sops", label: "SOPs", legacyTerms: ["SOP", "SOPs"] },
      { id: "intake-queue", label: "Intake Queue", legacyTerms: ["Intake"] },
      { id: "reviews", label: "Reviews" },
      { id: "version-history", label: "Version History" },
    ],
    icon: "file",
    navigationFamily: "Governance",
    accessClassification: "compliance",
    tier: "core",
    condition: "legacy-html-fallback",
    forceNext: true,
    visibleForRoles: ALL,
    canCreateInboxEvents: false,
    contributesExecutiveSummary: false,
    relatedModuleIds: ["compliance-quality", "action-inbox"],
    legacyFeatures: ["Documents HTML", "Policies HTML"],
    familyAccent: "#16a34a",
    familySoft: "#f0fdf4",
    primaryHtmlId: "documents",
    htmlIds: ["documents", "policies"],
  },
  {
    number: 14,
    id: "ticketing",
    displayName: "Ticketing Desk & Work Orders",
    shortName: "Ticketing Desk",
    purpose: "Operational tickets and work orders across clinics and facilities.",
    mainRoute: "/ticket-desk",
    legacyRoutes: ["/ticket-desk"],
    sections: [
      { id: "open-tickets", label: "Open Tickets" },
      { id: "work-orders", label: "Work Orders" },
      { id: "my-queue", label: "My Queue" },
    ],
    icon: "task",
    navigationFamily: "Operations",
    accessClassification: "operational",
    tier: "core",
    condition: "legacy-html-fallback",
    forceNext: true,
    visibleForRoles: ALL,
    canCreateInboxEvents: false,
    contributesExecutiveSummary: false,
    relatedModuleIds: ["inventory-assets", "tasks-actions"],
    legacyFeatures: ["Ticketing Desk HTML"],
    familyAccent: "#0f766e",
    familySoft: "#ecfdf5",
    primaryHtmlId: "ticketDesk",
    htmlIds: ["ticketDesk"],
  },
  {
    number: 15,
    id: "inventory-assets",
    displayName: "Inventory, Suppliers, Finance & Assets",
    shortName: "Inventory & Assets",
    purpose: "Inventory, stock, transfers, suppliers, purchases, invoices, equipment, rooms, printers and asset register.",
    mainRoute: "/inventory-assets",
    legacyRoutes: ["/inventory", "/stock", "/equipment", "/rooms"],
    sections: [
      { id: "inventory", label: "Inventory", legacyTerms: ["Inventory"] },
      { id: "stock", label: "Stock", legacyTerms: ["Stock"] },
      { id: "stock-transfers", label: "Stock Transfers" },
      { id: "suppliers", label: "Suppliers" },
      { id: "purchases", label: "Purchases" },
      { id: "invoices", label: "Invoices" },
      { id: "equipment", label: "Equipment", legacyTerms: ["Equipment"] },
      { id: "rooms", label: "Rooms", legacyTerms: ["Rooms"] },
      { id: "printers", label: "Printers", legacyTerms: ["Printers"] },
      { id: "asset-register", label: "Asset Register" },
    ],
    icon: "box",
    navigationFamily: "Assets",
    accessClassification: "operational",
    tier: "core",
    condition: "legacy-html-fallback",
    forceNext: true,
    visibleForRoles: ALL,
    canCreateInboxEvents: false,
    contributesExecutiveSummary: false,
    relatedModuleIds: ["ticketing", "compliance-quality"],
    legacyFeatures: ["Inventory/Stock/Equipment/Rooms HTML"],
    familyAccent: "#d97706",
    familySoft: "#fff7ed",
    primaryHtmlId: "inventory",
    htmlIds: ["inventory", "stock", "equipment", "rooms"],
  },
  {
    number: 16,
    id: "incidents-risk",
    displayName: "Incidents, Complaints, Risk & Continuity",
    shortName: "Incidents & Risk",
    purpose: "Incidents, complaints, risk centre, corrective actions, continuity and emergency control.",
    mainRoute: "/incidents-risk",
    legacyRoutes: ["/incidents", "/risk-centre", "/emergency-centre"],
    sections: [
      { id: "incidents", label: "Incidents", legacyTerms: ["Incidents"] },
      { id: "complaints", label: "Complaints", legacyTerms: ["Complaints"] },
      { id: "risk-centre", label: "Risk Centre", legacyTerms: ["Risk Centre", "Risk"] },
      { id: "corrective-actions", label: "Corrective Actions" },
      { id: "continuity", label: "Continuity" },
      { id: "emergency-control", label: "Emergency Control", legacyTerms: ["Emergency Control", "Emergency"] },
    ],
    icon: "alert",
    navigationFamily: "Governance",
    accessClassification: "compliance",
    tier: "core",
    condition: "partially-implemented",
    forceNext: true,
    visibleForRoles: ALL,
    canCreateInboxEvents: false,
    contributesExecutiveSummary: false,
    relatedModuleIds: ["compliance-quality", "action-inbox", "executive-command-centre"],
    legacyFeatures: ["Risk Centre Next/HTML", "Incidents HTML", "Emergency Control HTML"],
    familyAccent: "#16a34a",
    familySoft: "#f0fdf4",
    primaryHtmlId: "incidents",
    htmlIds: ["incidents", "riskCentre", "emergencyCentre"],
  },
  {
    number: 17,
    id: "communications",
    displayName: "Email & SMS Communications",
    shortName: "Communications",
    purpose: "Email/SMS campaigns, memos, communication book, noticeboards, templates and consent.",
    mainRoute: "/communications",
    legacyRoutes: ["/email", "/sms", "/memos", "/commbook", "/noticeboards"],
    sections: [
      { id: "email", label: "Email Campaigns", legacyTerms: ["Email", "Email Campaigns"] },
      { id: "sms", label: "SMS Campaigns", legacyTerms: ["SMS", "SMS Campaigns"] },
      { id: "memos-news", label: "Memos & News", legacyTerms: ["Memos", "News"] },
      { id: "communication-book", label: "Communication Book", legacyTerms: ["Communication Book", "CommBook", "Comm Book"] },
      { id: "noticeboards", label: "Noticeboards", legacyTerms: ["Noticeboards", "Noticeboard"] },
      { id: "templates", label: "Templates" },
      { id: "consent-preferences", label: "Consent and Preferences" },
    ],
    icon: "chat",
    navigationFamily: "Communications",
    accessClassification: "operational",
    tier: "core",
    condition: "legacy-html-fallback",
    forceNext: true,
    visibleForRoles: ALL,
    canCreateInboxEvents: false,
    contributesExecutiveSummary: false,
    relatedModuleIds: ["action-inbox", "digital-ops"],
    legacyFeatures: ["Email/SMS/Memos/CommBook/Noticeboards HTML"],
    familyAccent: "#db2777",
    familySoft: "#fdf2f8",
    primaryHtmlId: "email",
    htmlIds: ["email", "sms", "memos", "commbook", "noticeboards"],
  },
  {
    number: 18,
    id: "digital-ops",
    displayName: "Digital Operations & Security",
    shortName: "Digital Operations",
    purpose: "Systems and website monitoring, remote access, password vault, cameras and security alerts.",
    mainRoute: "/digital-ops",
    legacyRoutes: ["/website", "/remote", "/vault", "/cameras"],
    sections: [
      { id: "systems-monitoring", label: "Systems Monitoring" },
      { id: "website-monitoring", label: "Website Monitoring", legacyTerms: ["Website Monitoring", "Website"] },
      { id: "remote-access", label: "Remote Access", legacyTerms: ["Remote", "Remote Access"] },
      { id: "password-vault", label: "Password Vault", legacyTerms: ["Vault", "Password Vault"] },
      { id: "security-cameras", label: "Security Cameras", legacyTerms: ["Cameras"] },
      { id: "security-alerts", label: "Security Alerts" },
    ],
    icon: "lock",
    navigationFamily: "Digital",
    accessClassification: "manager",
    tier: "core",
    condition: "legacy-html-fallback",
    forceNext: true,
    visibleForRoles: ALL,
    canCreateInboxEvents: false,
    contributesExecutiveSummary: false,
    relatedModuleIds: ["organisation-access", "website-studio"],
    legacyFeatures: ["Website/Remote/Vault/Cameras HTML"],
    familyAccent: "#dc2626",
    familySoft: "#fef2f2",
    primaryHtmlId: "website",
    htmlIds: ["website", "remote", "vault", "cameras"],
  },
  {
    number: 19,
    id: "analytics",
    displayName: "Clinic Analytics, Data Quality & Change",
    shortName: "Clinic Analytics",
    purpose: "Capacity, trends, data quality and management packs.",
    mainRoute: "/analytics",
    legacyRoutes: ["/analytics"],
    sections: [
      { id: "overview", label: "Analytics Overview" },
      { id: "data-quality", label: "Data Quality" },
      { id: "change", label: "Change Tracking" },
    ],
    icon: "chart",
    navigationFamily: "Analytics",
    accessClassification: "executive",
    tier: "core",
    condition: "legacy-html-fallback",
    forceNext: true,
    visibleForRoles: ALL,
    canCreateInboxEvents: false,
    contributesExecutiveSummary: false,
    relatedModuleIds: ["executive-command-centre"],
    legacyFeatures: ["Executive Analytics HTML"],
    familyAccent: "#2563eb",
    familySoft: "#eff6ff",
    primaryHtmlId: "analytics",
    htmlIds: ["analytics"],
  },
  {
    number: 20,
    id: "saas",
    displayName: "Commercial SaaS & Organisation Workspaces",
    shortName: "Commercial SaaS",
    purpose: "Tenant administration, workspaces, departments, plans, billing and entitlements.",
    mainRoute: "/saas",
    legacyRoutes: ["/saas"],
    sections: [
      { id: "tenant-administration", label: "Tenant Administration" },
      { id: "workspace-configuration", label: "Workspace Configuration" },
      { id: "departments", label: "Departments" },
      { id: "commercial-plans", label: "Commercial Plans" },
      { id: "billing-settings", label: "Billing Settings" },
      { id: "feature-entitlements", label: "Feature Entitlements" },
    ],
    icon: "globe",
    navigationFamily: "Commercial",
    accessClassification: "executive",
    tier: "core",
    condition: "legacy-html-fallback",
    forceNext: true,
    visibleForRoles: ALL,
    canCreateInboxEvents: false,
    contributesExecutiveSummary: false,
    relatedModuleIds: ["organisation-access", "vendor-console"],
    legacyFeatures: ["Tenant Administration HTML"],
    familyAccent: "#475569",
    familySoft: "#f8fafc",
    primaryHtmlId: "saas",
    htmlIds: ["saas"],
  },
  {
    number: 21,
    id: "vendor-console",
    displayName: "SaaS Vendor Operations & Tenant Provisioning",
    shortName: "Vendor Console",
    purpose: "SaaS vendor command console for tenant provisioning and platform operations.",
    mainRoute: "/vendor-console",
    legacyRoutes: ["/vendor-console"],
    sections: [
      { id: "tenants", label: "Tenants" },
      { id: "provisioning", label: "Provisioning" },
      { id: "platform-health", label: "Platform Health" },
    ],
    icon: "globe",
    navigationFamily: "Enterprise",
    accessClassification: "enterprise-vendor",
    tier: "enterprise",
    condition: "legacy-html-fallback",
    forceNext: true,
    visibleForRoles: ENTERPRISE_ROLES,
    canCreateInboxEvents: false,
    contributesExecutiveSummary: false,
    relatedModuleIds: ["saas"],
    legacyFeatures: ["Vendor console HTML"],
    familyAccent: "#4338ca",
    familySoft: "#eef2ff",
    primaryHtmlId: "vendorConsole",
    htmlIds: ["vendorConsole"],
  },
  {
    number: 22,
    id: "recruitment",
    displayName: "Recruitment & Talent Acquisition",
    shortName: "Recruitment",
    purpose: "Vacancies, candidates and onboarding pipeline.",
    mainRoute: "/recruitment",
    legacyRoutes: ["/recruitment"],
    sections: [
      { id: "vacancies", label: "Vacancies" },
      { id: "candidates", label: "Candidates" },
      { id: "onboarding", label: "Onboarding Pipeline" },
    ],
    icon: "users",
    navigationFamily: "Enterprise",
    accessClassification: "hr",
    tier: "enterprise",
    condition: "legacy-html-fallback",
    forceNext: true,
    visibleForRoles: [...ENTERPRISE_ROLES, "HR Manager", "Clinic Manager", "Practice Manager"],
    canCreateInboxEvents: false,
    contributesExecutiveSummary: false,
    relatedModuleIds: ["staff-doctors"],
    legacyFeatures: ["Recruitment HTML"],
    familyAccent: "#4338ca",
    familySoft: "#eef2ff",
    primaryHtmlId: "recruitment",
    htmlIds: ["recruitment"],
  },
  {
    number: 23,
    id: "website-studio",
    displayName: "Tenant Website Infrastructure & SEO Engine",
    shortName: "Website Studio",
    purpose: "Website builder, SEO and digital experience for tenant clinics.",
    mainRoute: "/website-studio",
    legacyRoutes: ["/website-studio"],
    sections: [
      { id: "sites", label: "Sites" },
      { id: "seo", label: "SEO Engine" },
      { id: "publishing", label: "Publishing" },
    ],
    icon: "globe",
    navigationFamily: "Enterprise",
    accessClassification: "enterprise-vendor",
    tier: "enterprise",
    condition: "legacy-html-fallback",
    forceNext: true,
    visibleForRoles: ENTERPRISE_ROLES,
    canCreateInboxEvents: false,
    contributesExecutiveSummary: false,
    relatedModuleIds: ["digital-ops", "saas"],
    legacyFeatures: ["Website Studio HTML"],
    familyAccent: "#4338ca",
    familySoft: "#eef2ff",
    primaryHtmlId: "websiteStudio",
    htmlIds: ["websiteStudio"],
  },
  {
    number: 24,
    id: "financial-forecast",
    displayName: "Practice Financial Forecast & Ledger Control",
    shortName: "Financial Forecast",
    purpose: "Clinic financial forecast, variance and ledger control.",
    mainRoute: "/financial-forecast",
    legacyRoutes: ["/financial-forecast"],
    sections: [
      { id: "forecast", label: "Forecast" },
      { id: "ledger", label: "Ledger Control" },
      { id: "variance", label: "Variance" },
    ],
    icon: "pay",
    navigationFamily: "Enterprise",
    accessClassification: "finance",
    tier: "enterprise",
    condition: "legacy-html-fallback",
    forceNext: true,
    visibleForRoles: [...ENTERPRISE_ROLES, "Finance Manager", "Practice Manager"],
    canCreateInboxEvents: false,
    contributesExecutiveSummary: false,
    relatedModuleIds: ["staff-pay", "doctor-pay", "bbpip"],
    legacyFeatures: ["Financial Forecast HTML"],
    familyAccent: "#4338ca",
    familySoft: "#eef2ff",
    primaryHtmlId: "financialForecast",
    htmlIds: ["financialForecast"],
  },
];

const BY_ID = Object.fromEntries(PLATFORM_MODULES.map((m) => [m.id, m]));
const BY_NUMBER = Object.fromEntries(PLATFORM_MODULES.map((m) => [m.number, m]));
const BY_ROUTE_SLUG = Object.fromEntries(
  PLATFORM_MODULES.map((m) => [m.mainRoute.replace(/^\//, ""), m])
);

/** Map legacy URL slug (no leading slash) → approved module */
const LEGACY_SLUG_TO_MODULE: Record<string, PlatformModule> = {};
for (const mod of PLATFORM_MODULES) {
  LEGACY_SLUG_TO_MODULE[mod.mainRoute.replace(/^\//, "")] = mod;
  for (const legacy of mod.legacyRoutes) {
    const slug = legacy.replace(/^\//, "");
    if (slug && slug !== "") LEGACY_SLUG_TO_MODULE[slug] = mod;
  }
}

export function getPlatformModule(id: string): PlatformModule | undefined {
  return BY_ID[id];
}

export function getPlatformModuleByNumber(n: number): PlatformModule | undefined {
  return BY_NUMBER[n];
}

export function getPlatformModuleByRouteSlug(slug: string): PlatformModule | undefined {
  return BY_ROUTE_SLUG[slug] ?? LEGACY_SLUG_TO_MODULE[slug];
}

export function isApprovedModuleSlug(slug: string): boolean {
  return slug in BY_ROUTE_SLUG;
}

export function isKnownRouteSlug(slug: string): boolean {
  return slug in LEGACY_SLUG_TO_MODULE;
}

export function coreModules(): PlatformModule[] {
  return PLATFORM_MODULES.filter((m) => m.tier === "core");
}

export function enterpriseModules(): PlatformModule[] {
  return PLATFORM_MODULES.filter((m) => m.tier === "enterprise");
}

export function modulesVisibleForRole(role: string): PlatformModule[] {
  return PLATFORM_MODULES.filter((m) => {
    if (m.visibleForRoles === "all") return true;
    return m.visibleForRoles.includes(role);
  });
}

export function canSeeEnterpriseExtensions(role: string): boolean {
  return enterpriseModules().some((m) => {
    if (m.visibleForRoles === "all") return true;
    return m.visibleForRoles.includes(role);
  });
}

export function conditionLabel(condition: ImplementationCondition): string {
  switch (condition) {
    case "complete-interactive-rebuild":
      return "Complete interactive rebuild";
    case "strong-existing":
      return "Strong existing module";
    case "partially-implemented":
      return "Partially implemented";
    case "placeholder":
      return "Placeholder";
    case "legacy-html-fallback":
      return "Rebuild pending (legacy HTML reference only)";
    case "missing":
      return "Missing";
    default:
      return condition;
  }
}

/** htmlId → approved module id (for favourites/recents migration) */
export const HTML_ID_TO_MODULE_ID: Record<string, string> = {};
for (const mod of PLATFORM_MODULES) {
  for (const hid of mod.htmlIds ?? []) {
    HTML_ID_TO_MODULE_ID[hid] = mod.id;
  }
  if (mod.primaryHtmlId) HTML_ID_TO_MODULE_ID[mod.primaryHtmlId] = mod.id;
}

/** route slug → module id */
export const SLUG_TO_MODULE_ID: Record<string, string> = {};
for (const [slug, mod] of Object.entries(LEGACY_SLUG_TO_MODULE)) {
  SLUG_TO_MODULE_ID[slug] = mod.id;
}
