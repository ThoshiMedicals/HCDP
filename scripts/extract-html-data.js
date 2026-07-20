const fs = require("fs");
const path = require("path");
const htmlPath = path.join("c:/Users/ETB Sri Lanka/Desktop/HCDP","Healthcare_Doctors_Pulse_Executive_Healthcare_Operations_Platform_v34_Stronger_Navigation_Palette.html");
const outDir = path.join(process.cwd(), "src", "lib", "extracted");
fs.mkdirSync(outDir, { recursive: true });
const html = fs.readFileSync(htmlPath, "utf8");

function writeJson(name, data) {
  fs.writeFileSync(path.join(outDir, name + ".json"), JSON.stringify(data, null, 2));
  console.log("wrote", name, Array.isArray(data) ? ("n="+data.length) : ("keys="+Object.keys(data).length));
}

function sliceAssign(name) {
  const start = html.search(new RegExp(`(?:const|let|var)\\s+${name}\\s*=`));
  if (start < 0) throw new Error("not found "+name);
  const eq = html.indexOf("=", start);
  let i = eq + 1;
  while (/\s/.test(html[i])) i++;
  const open = html[i];
  if (open !== "[" && open !== "{") throw new Error(name+" not object/array at "+i);
  const close = open === "[" ? "]" : "}";
  let depth = 0, inStr = false, strCh = "", escape = false;
  for (let j = i; j < html.length; j++) {
    const ch = html[j];
    if (inStr) {
      if (escape) { escape = false; continue; }
      if (ch === "\\") { escape = true; continue; }
      if (ch === strCh) inStr = false;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === "`") { inStr = true; strCh = ch; continue; }
    if (ch === open) depth++;
    if (ch === close) {
      depth--;
      if (depth === 0) return html.slice(i, j + 1);
    }
  }
  throw new Error("unbalanced "+name);
}

function evalExpr(expr, prelude = "") {
  return Function(`"use strict"; ${prelude}; return (${expr});`)();
}

const checklistItemsExpr = sliceAssign("CHECKLIST_TEMPLATE_ITEMS");
const checklistItems = evalExpr(checklistItemsExpr);
writeJson("checklist-template-items", checklistItems);

const checklistsExpr = sliceAssign("SEED_CHECKLISTS");
const checklists = evalExpr(checklistsExpr, `const CHECKLIST_TEMPLATE_ITEMS = ${JSON.stringify(checklistItems)}`);
writeJson("checklists", checklists);

const accreditation = evalExpr(sliceAssign("SEED_ACCREDITATION_RECORDS"));
writeJson("accreditation", accreditation);

// BRD modules
try {
  const brdExpr = sliceAssign("BRD_V2_MODULES");
  const brd = evalExpr(brdExpr);
  writeJson("brd-modules", brd);
} catch (e) {
  console.warn("BRD fail", e.message);
}

// RISK / COMPLIANCE seeds
for (const name of ["RISK_SEED", "COMPLIANCE_SEED", "FAMILY_STYLES"]) {
  try {
    const data = evalExpr(sliceAssign(name));
    writeJson(name.toLowerCase().replace(/_/g, "-"), data);
  } catch (e) {
    console.warn(name, e.message);
  }
}

// NAV — try several patterns
for (const name of ["NAV", "NAV_GROUPS"]) {
  try {
    const data = evalExpr(sliceAssign(name));
    writeJson(name.toLowerCase(), data);
  } catch (e) {
    console.warn(name, e.message);
  }
}

// MODULE_BLUEPRINTS
try {
  writeJson("module-blueprints", evalExpr(sliceAssign("MODULE_BLUEPRINTS")));
} catch (e) {
  console.warn("MODULE_BLUEPRINTS", e.message);
}

const theme = {
  root: {
    teal: "#0f3f7a", "teal-2": "#155ea8", "teal-3": "#e2eefb", ink: "#0b1720",
    text: "#31445a", muted: "#738196", line: "#e8edf2", soft: "#f7fafb", card: "#ffffff",
    warning: "#f59e0b", danger: "#ef4444", success: "#16a34a", info: "#0f3f7a", purple: "#7c3aed",
  },
  v34: { canvas: "#f1f5fa", "card-line": "#cfd9e6", "card-shadow": "0 5px 18px rgba(15,23,42,.055)" },
  v33: { bg: "#f5f8fc", surface: "#ffffff", "surface-2": "#f8fafc", line: "#dbe4ef", ink: "#14243a", muted: "#64758b", focus: "#2563eb" },
  themes: {
    light: { bg:"#f4f7fb", surface:"#ffffff", "surface-2":"#f8fafc", text:"#14243a", muted:"#687990", line:"#dfe7f1", primary:"#0f4c8a", "primary-2":"#1d64aa", accent:"#0ea5e9", success:"#15803d", warning:"#b45309", danger:"#b91c1c" },
    executive: { bg:"#f2f6fb", surface:"#ffffff", "surface-2":"#f7fafe", text:"#10233d", muted:"#64748b", line:"#dce6f2", primary:"#0b3b72", "primary-2":"#155ea8", accent:"#2563eb", success:"#047857", warning:"#b45309", danger:"#b42318" },
    emerald: { bg:"#f2f8f6", surface:"#ffffff", "surface-2":"#f4fbf8", text:"#12352c", muted:"#617a73", line:"#d9e9e3", primary:"#0f766e", "primary-2":"#0d9488", accent:"#10b981", success:"#15803d", warning:"#a16207", danger:"#b91c1c" },
    dark: { bg:"#07111f", surface:"#101d2d", "surface-2":"#0b1726", text:"#f1f5f9", muted:"#94a3b8", line:"#26384e", primary:"#3b82f6", "primary-2":"#60a5fa", accent:"#38bdf8", success:"#34d399", warning:"#fbbf24", danger:"#fb7185" },
  },
  settingsDefaults: {
    weeklyHourLimit: 40, breakAfterHours: 7, autoBreakMinutes: 30, doctorPayDays: "1,16",
    ticketP1Minutes: 15, payrollSource: "Xero", clinicalSource: "Best Practice",
    smsSenderId: "Not configured", dataRegion: "Australia",
  },
};
writeJson("theme", theme);

// Final v32-style NAV (as-is from HTML structure documented)
const navV32 = [
  { id: "executive", label: "Executive Command Centre", items: [
    { id: "dashboard", label: "Executive Command Centre" },
    { id: "action-inbox", label: "Action Inbox & Notifications" },
    { id: "analytics", label: "Analytics, Data & Change" },
  ]},
  { id: "operations", label: "Operations", items: [
    { id: "tasks", label: "Tasks, Checklists & Actions" },
    { id: "incidents", label: "Incidents, Risk & Continuity" },
    { id: "ticketing", label: "Ticketing & Work Orders" },
  ]},
  { id: "people", label: "People & Talent", items: [
    { id: "staff", label: "Staff & Doctor Management" },
    { id: "training", label: "Training & Learning" },
  ]},
  { id: "rostering", label: "Rostering & Attendance", items: [
    { id: "roster", label: "Roster & Shift Management" },
    { id: "timeclock", label: "Time & Attendance" },
  ]},
  { id: "assets", label: "Assets & Facilities", items: [
    { id: "inventory", label: "Inventory, Finance & Assets" },
  ]},
  { id: "governance", label: "Governance", items: [
    { id: "accreditation", label: "Accreditation & Quality" },
    { id: "documents", label: "Documents, Policies & SOPs" },
  ]},
  { id: "finance", label: "Finance & Forecasting", items: [
    { id: "staffpay", label: "Staff Pay & Payroll" },
    { id: "doctorpay", label: "Doctor Pay Command Centre" },
    { id: "bbpip", label: "BBPIP Forecast" },
  ]},
  { id: "communications", label: "Communications", items: [
    { id: "communications", label: "Email & SMS Communications" },
  ]},
  { id: "security", label: "Security & Access", items: [
    { id: "digital", label: "Digital Operations & Security" },
  ]},
  { id: "organisation", label: "Organisation & Tenant", items: [
    { id: "organisation", label: "Organisation & Access" },
    { id: "saas", label: "Commercial SaaS" },
  ]},
];
writeJson("nav-v32", navV32);

console.log("OK");
