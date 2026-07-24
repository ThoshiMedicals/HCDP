const fs = require("fs");
const path = require("path");
const root = path.join("src", "modules");

const modules = [
  {
    folder: "m01-command-centre",
    num: 1,
    id: "executive-command-centre",
    component: "CommandCentreModule",
    route: "/dashboard",
    retain: true,
    entry: "DashboardWorkspace",
    importPath: "@/components/workspaces/DashboardWorkspace",
  },
  {
    folder: "m02-action-inbox",
    num: 2,
    id: "action-inbox",
    component: "ActionInboxModule",
    route: "/action-inbox",
    retain: true,
    entry: "ActionInboxWorkspace",
    importPath: "@/components/workspaces/ActionInboxWorkspace",
  },
  {
    folder: "m03-organisation-access",
    num: 3,
    id: "organisation-access",
    component: "OrganisationAccessModule",
    route: "/settings",
    retain: true,
    entry: "OrganisationWorkspace",
    importPath: "@/components/workspaces/OrganisationWorkspace",
  },
  { folder: "m04-staff-doctors", num: 4, id: "staff-doctors", component: "StaffDoctorsModule", route: "/staff-doctors" },
  { folder: "m05-roster", num: 5, id: "roster", component: "RosterModule", route: "/roster" },
  { folder: "m06-time-attendance", num: 6, id: "time-attendance", component: "TimeAttendanceModule", route: "/time-attendance" },
  { folder: "m07-staff-pay", num: 7, id: "staff-pay", component: "StaffPayModule", route: "/staffpay" },
  { folder: "m08-doctor-pay", num: 8, id: "doctor-pay", component: "DoctorPayModule", route: "/doctorpay" },
  { folder: "m09-bbpip", num: 9, id: "bbpip", component: "BbpipModule", route: "/bbpip" },
  { folder: "m10-tasks-actions", num: 10, id: "tasks-actions", component: "TasksActionsModule", route: "/tasks-actions" },
  { folder: "m11-training", num: 11, id: "training", component: "TrainingModule", route: "/training" },
  { folder: "m12-compliance-quality", num: 12, id: "compliance-quality", component: "ComplianceQualityModule", route: "/compliance-quality" },
  { folder: "m13-documents", num: 13, id: "documents-policies", component: "DocumentsModule", route: "/documents-policies" },
  { folder: "m14-ticketing", num: 14, id: "ticketing", component: "TicketingModule", route: "/ticket-desk" },
  { folder: "m15-inventory-assets", num: 15, id: "inventory-assets", component: "InventoryAssetsModule", route: "/inventory-assets" },
  { folder: "m16-incidents-risk", num: 16, id: "incidents-risk", component: "IncidentsRiskModule", route: "/incidents-risk" },
  { folder: "m17-communications", num: 17, id: "communications", component: "CommunicationsModule", route: "/communications" },
  { folder: "m18-digital-operations", num: 18, id: "digital-ops", component: "DigitalOperationsModule", route: "/digital-ops" },
  { folder: "m19-analytics-change", num: 19, id: "analytics", component: "AnalyticsChangeModule", route: "/analytics" },
  { folder: "m20-commercial-workspaces", num: 20, id: "saas", component: "CommercialWorkspacesModule", route: "/saas" },
  { folder: "m21-vendor-operations", num: 21, id: "vendor-console", component: "VendorOperationsModule", route: "/vendor-console" },
  { folder: "m22-recruitment", num: 22, id: "recruitment", component: "RecruitmentModule", route: "/recruitment" },
  { folder: "m23-website-seo", num: 23, id: "website-studio", component: "WebsiteSeoModule", route: "/website-studio" },
  { folder: "m24-financial-forecast", num: 24, id: "financial-forecast", component: "FinancialForecastModule", route: "/financial-forecast" },
];

function write(p, content) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, { encoding: "utf8" });
}

for (const m of modules) {
  const dir = path.join(root, m.folder);
  const prefix = `pulse.m${String(m.num).padStart(2, "0")}.`;
  const config = `import { getPlatformModule } from "@/platform/module-registry";

/** Module ${m.num} configuration — sourced from the authoritative platform register. */
export const MODULE_ID = "${m.id}" as const;
export const MODULE_NUMBER = ${m.num} as const;
export const MODULE_ROUTE = "${m.route}" as const;
export const STORAGE_PREFIX = "${prefix}" as const;

export function getModuleDefinition() {
  const mod = getPlatformModule(MODULE_ID);
  if (!mod) throw new Error("Missing platform register entry for " + MODULE_ID);
  return mod;
}
`;
  write(path.join(dir, "module.config.ts"), config);

  let tsx;
  if (m.retain) {
    tsx = `"use client";

/**
 * Module ${m.num} entry — temporary adapter over the existing workspace.
 * Full migration into src/modules/${m.folder} is deferred to preserve behaviour.
 */
export { ${m.entry} as ${m.component} } from "${m.importPath}";
`;
  } else {
    tsx = `"use client";

import { ModuleLanding } from "@/components/workspaces/ModuleLanding";
import { getModule } from "@/lib/modules";
import { MODULE_ROUTE } from "./module.config";

/**
 * Module ${m.num} entry — Next landing until detailed rebuild.
 * Does not use HTML iframe as the main experience.
 */
export function ${m.component}() {
  const slug = MODULE_ROUTE.replace(/^\\//, "");
  const mod = getModule(slug);
  if (!mod) {
    return (
      <div className="rounded-2xl border border-[var(--v34-card-line)] bg-[var(--card)] p-6">
        <h1 className="text-xl font-bold">Module ${m.num}</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Register entry missing for {MODULE_ROUTE}.</p>
      </div>
    );
  }
  return <ModuleLanding module={mod} />;
}
`;
  }
  write(path.join(dir, `${m.component}.tsx`), tsx);

  const idx = `export { ${m.component} } from "./${m.component}";
export * from "./module.config";
`;
  write(path.join(dir, "index.ts"), idx);
}

const barrel =
  modules.map((m) => `export * as m${String(m.num).padStart(2, "0")} from "./${m.folder}";`).join("\n") +
  "\n";
write(path.join(root, "index.ts"), barrel);
console.log("rewrote", modules.length, "modules as utf8");
