/**
 * Prototype vs Dashboard parity evidence — audit-only.
 * Does not modify production source. Writes JSON + PNG under
 * docs/audits/evidence/prototype-parity-20260730/
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT_DIR = path.join(ROOT, "docs/audits/prototype-parity-20260730/screenshots/live-pass-20260730");
const JSON_OUT = path.join(ROOT, "docs/audits/prototype-parity-20260730/parity-evidence-live-pass.json");
const WIDTHS = [1440, 1280, 1024, 768, 430, 390];
const APPEARANCES = ["light", "dark", "system"];

const DASHBOARD_ROUTES = [
  "/dashboard",
  "/action-inbox",
  "/settings",
  "/staff-doctors",
  "/roster",
  "/time-attendance",
  "/staffpay",
  "/doctorpay",
  "/bbpip",
  "/tasks-actions",
  "/training",
  "/compliance-quality",
  "/documents-policies",
  "/ticket-desk",
  "/inventory-assets",
  "/incidents-risk",
  "/communications",
  "/digital-ops",
  "/analytics",
  "/saas",
  "/vendor-console",
  "/recruitment",
  "/website-studio",
  "/financial-forecast",
  "/prototype",
  "/prototype-reference",
];

fs.mkdirSync(OUT_DIR, { recursive: true });

const evidence = {
  auditId: "prototype-parity-20260730",
  startedAt: new Date().toISOString(),
  base: BASE,
  branchHint: "agent/prototype-parity-audit-20260730",
  methodology:
    "Independent live comparison of /prototype(-reference) HTML prototype vs Next dashboard routes. Architecture consolidations are classified intentional, not missing.",
  console: [],
  hydrationOk: true,
  prototype: {},
  dashboard: {},
  routes: [],
  widths: [],
  appearances: [],
  a11y: [],
  consolidationsVerified: [],
  screenshots: [],
  gapsObserved: [],
  finishedAt: null,
};

function shot(name) {
  return path.join(OUT_DIR, `${name}.png`);
}

function pushGap(id, payload) {
  evidence.gapsObserved.push({ id, ...payload });
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
const page = await context.newPage();
page.setDefaultTimeout(20000);

page.on("console", (msg) => {
  if (!["error", "warning"].includes(msg.type())) return;
  const t = msg.text();
  if (/Hydration|hydration/i.test(t)) evidence.hydrationOk = false;
  if (/Fast Refresh|React DevTools|Download the React|Turbopack/i.test(t)) return;
  evidence.console.push(`${msg.type()}: ${t.slice(0, 280)}`);
});
page.on("pageerror", (e) => {
  evidence.console.push(`pageerror: ${e.message.slice(0, 280)}`);
  if (/hydrat/i.test(e.message)) evidence.hydrationOk = false;
});

async function safeGoto(url) {
  try {
    const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(500);
    return res;
  } catch (e) {
    evidence.console.push(`goto-fail ${url}: ${String(e.message || e).slice(0, 200)}`);
    return null;
  }
}

// ── Prototype surface ──────────────────────────────────────────────
await safeGoto(`${BASE}/prototype`);
const afterProtoRedirect = page.url();
evidence.prototype.redirectFromPrototype = {
  requested: `${BASE}/prototype`,
  landed: afterProtoRedirect,
  redirectedToReference: /prototype-reference/.test(afterProtoRedirect),
};

await safeGoto(`${BASE}/prototype-reference`);
await page.waitForTimeout(1200);
const protoBanner = await page.locator("body").innerText();
evidence.prototype.referenceChrome = {
  hasQaBanner: /Development \/ QA Reference|HTML prototype/i.test(protoBanner),
  hasReturnLink: /Return to Next platform/i.test(protoBanner),
};
await page.screenshot({ path: shot("01-prototype-reference-1440"), fullPage: false });
evidence.screenshots.push("01-prototype-reference-1440.png");

// Prototype is iframe — evaluate inside frame if present
const frames = page.frames();
const protoFrame =
  frames.find((f) => /pulse-html-prototype|prototype/i.test(f.url())) ||
  frames.find((f) => f !== page.mainFrame());

if (protoFrame) {
  try {
    const navDump = await protoFrame.evaluate(() => {
      const groups = Array.from(document.querySelectorAll(".v27-nav-group")).map((g) => {
        const title = g.querySelector(".v27-nav-group-toggle")?.textContent?.trim() || "";
        const items = Array.from(g.querySelectorAll(".nav-btn")).map((b) =>
          (b.querySelector(".nav-label")?.textContent || b.textContent || "").trim()
        );
        return { title, items };
      });
      const active =
        document.querySelector(".nav-btn.active .nav-label")?.textContent?.trim() ||
        document.querySelector(".nav-btn.active")?.textContent?.trim() ||
        null;
      const role =
        document.querySelector(".v27-sidebar-role, [data-role], select")?.textContent ||
        document.body.innerText.match(/Owner\s*\/\s*Director|Practice Manager|Finance|Reception/)?.[0] ||
        null;
      return {
        groupCount: groups.length,
        groups,
        active,
        roleSnippet: role,
        hasApprovalsNav: groups.some((g) => g.items.some((i) => /^Approvals$/i.test(i))),
        hasSeparateTasksAndChecklists:
          groups.some((g) => g.items.some((i) => /^Tasks$/i.test(i))) &&
          groups.some((g) => g.items.some((i) => /^Checklists$/i.test(i))),
        hasHrDocs: groups.some((g) => g.items.some((i) => /HR Documents/i.test(i))),
        hasSeparateInventoryEquipmentStock:
          groups.some((g) => g.items.some((i) => /^Inventory$/i.test(i))) &&
          groups.some((g) => g.items.some((i) => /^Equipment$/i.test(i))) &&
          groups.some((g) => g.items.some((i) => /^Stock$/i.test(i))),
        bodySample: document.body?.innerText?.slice(0, 400) || "",
      };
    });
    evidence.prototype.nav = navDump;
  } catch (e) {
    evidence.prototype.navError = String(e.message || e).slice(0, 240);
  }
} else {
  evidence.prototype.navError = "No prototype iframe frame found";
}

// ── Dashboard shell ────────────────────────────────────────────────
await safeGoto(`${BASE}/dashboard`);
await page.waitForTimeout(1000);
const dashText = await page.locator("body").innerText();
const navButtons = await page.locator(".pulse-sidebar button, .pulse-sidebar a, nav a, nav button").allTextContents();
const sidebarText = await page.locator(".pulse-sidebar").innerText().catch(() => "");

evidence.dashboard.shell = {
  hasCommandCentre: /Owner\/Director Command Centre|Command Centre|Executive/i.test(dashText),
  sidebarSnippet: sidebarText.slice(0, 1200),
  navLabelSample: navButtons.map((t) => t.trim()).filter(Boolean).slice(0, 80),
  hasApprovalsTopLevel: /(^|\n)\s*Approvals\s*(\n|$)/.test(sidebarText),
  hasTasksActions: /Tasks\s*&\s*Actions|Tasks, Checklists/i.test(sidebarText + dashText),
  hasInventoryAssets: /Inventory\s*&\s*Assets|Inventory, Suppliers/i.test(sidebarText + dashText),
  hasStaffDoctors: /Staff\s*&\s*Doctors|Staff & Doctor/i.test(sidebarText + dashText),
  hasOrganisation: /Organisation|Organisation & Access/i.test(sidebarText),
  hasDepartmentsDailyNav: /(^|\n)\s*Departments\s*(\n|$)/.test(sidebarText),
  hasSeparateHrDocsNav: /(^|\n)\s*HR Documents\s*(\n|$)/.test(sidebarText),
};

await page.screenshot({ path: shot("02-dashboard-1440"), fullPage: false });
evidence.screenshots.push("02-dashboard-1440.png");

// Consolidations (architecture supersedes prototype layout)
evidence.consolidationsVerified.push(
  {
    id: "CONS-01",
    topic: "Tasks + Checklists combined",
    prototype: "Separate Tasks and Checklists nav items",
    dashboard: evidence.dashboard.shell.hasTasksActions
      ? "Single Tasks & Actions module"
      : "Not clearly labelled in sidebar sample",
    classification: "intentional",
  },
  {
    id: "CONS-02",
    topic: "Approvals removed as duplicate of Action Inbox",
    prototype: evidence.prototype.nav?.hasApprovalsNav ? "Top-level Approvals under Finance" : "Approvals present in NAV_GROUPS source",
    dashboard: evidence.dashboard.shell.hasApprovalsTopLevel
      ? "Still shows top-level Approvals (unexpected)"
      : "No top-level Approvals in sidebar; Action Inbox owns approvals category",
    classification: evidence.dashboard.shell.hasApprovalsTopLevel ? "duplicate" : "intentional",
  },
  {
    id: "CONS-03",
    topic: "Departments removed from daily navigation",
    prototype: "Not a dedicated daily nav item in v34 primary NAV_GROUPS (lives under Settings/SaaS elsewhere)",
    dashboard: evidence.dashboard.shell.hasDepartmentsDailyNav
      ? "Departments still daily nav"
      : "Departments not daily nav; Organisation & Access / SaaS sections own it",
    classification: "intentional",
  },
  {
    id: "CONS-04",
    topic: "HR Documents inside Staff Management",
    prototype: evidence.prototype.nav?.hasHrDocs ? "Separate HR Documents nav" : "HR Documents in People group",
    dashboard: evidence.dashboard.shell.hasSeparateHrDocsNav
      ? "Separate HR Docs nav still present"
      : "No separate HR Documents nav; Staff & Doctors Credentials section",
    classification: evidence.dashboard.shell.hasSeparateHrDocsNav ? "partial" : "intentional",
  },
  {
    id: "CONS-05",
    topic: "Inventory/Stock/Equipment/Printers → Inventory & Assets",
    prototype: evidence.prototype.nav?.hasSeparateInventoryEquipmentStock
      ? "Separate Inventory/Equipment/Stock"
      : "Assets group split items",
    dashboard: evidence.dashboard.shell.hasInventoryAssets
      ? "Consolidated Inventory & Assets route"
      : "Consolidation label unclear in sidebar sample",
    classification: "intentional",
  }
);

// ── Route crawl ────────────────────────────────────────────────────
for (const route of DASHBOARD_ROUTES) {
  const res = await safeGoto(`${BASE}${route}`);
  const status = res?.status() ?? null;
  const url = page.url();
  const text = await page.locator("body").innerText().catch(() => "");
  const crashed = /Application error|This page could not be found|404/i.test(text);
  const rebuildPending = /Rebuild pending/i.test(text);
  const interactive =
    /Interactive rebuild|Pay Run Overview|Roster Board|Live Attendance|Training Records|People Directory|My Actions|Command Centre/i.test(
      text
    );
  const restricted = /Restricted|permission denied|You do not have permission|Access denied/i.test(text);
  const emptyHint = /No (records|items|results|data)|Nothing here|Empty/i.test(text);
  const title =
    (await page.locator("h1").first().innerText().catch(() => "")) ||
    text.split("\n").find((l) => l.trim().length > 3)?.trim() ||
    "";

  const row = {
    route,
    status,
    finalUrl: url,
    title: title.slice(0, 120),
    crashed,
    rebuildPending,
    interactiveSignals: interactive,
    restrictedSignals: restricted,
    emptySignals: emptyHint,
    textSample: text.replace(/\s+/g, " ").slice(0, 280),
  };
  evidence.routes.push(row);

  if (crashed) {
    pushGap(`ROUTE-CRASH-${route.replace(/\W+/g, "_")}`, {
      moduleRoute: route,
      classification: "defect",
      severity: "high",
      note: "Route crashed or 404 during crawl",
      evidence: row,
    });
  }
}

const landingOnly = evidence.routes.filter(
  (r) =>
    r.rebuildPending &&
    !["/prototype", "/prototype-reference"].includes(r.route)
);
for (const r of landingOnly) {
  pushGap(`LANDING-${r.route.replace(/\W+/g, "_")}`, {
    moduleRoute: r.route,
    classification: "missing",
    severity: ["/doctorpay", "/bbpip", "/inventory-assets"].includes(r.route)
      ? "critical"
      : "high",
    note: "Dashboard shows ModuleLanding rebuild-pending; interactive depth lives in HTML prototype only",
    evidence: { title: r.title, sample: r.textSample },
  });
}

// Focused module screenshots
const focusRoutes = [
  ["/dashboard", "03-dash-command-centre"],
  ["/action-inbox", "04-dash-action-inbox"],
  ["/staff-doctors", "05-dash-staff-doctors"],
  ["/roster", "06-dash-roster"],
  ["/time-attendance", "07-dash-time-attendance"],
  ["/staffpay", "08-dash-staffpay"],
  ["/doctorpay", "09-dash-doctorpay-landing"],
  ["/bbpip", "10-dash-bbpip-landing"],
  ["/tasks-actions", "11-dash-tasks-actions"],
  ["/inventory-assets", "12-dash-inventory-landing"],
  ["/training", "13-dash-training"],
];
for (const [route, name] of focusRoutes) {
  await safeGoto(`${BASE}${route}`);
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: shot(name), fullPage: false });
  evidence.screenshots.push(`${name}.png`);
}

// Legacy redirects / consolidated aliases
const aliasChecks = [
  ["/approvals", "action-inbox"],
  ["/tasks", "tasks-actions"],
  ["/checklists", "tasks-actions"],
  ["/hr-docs", "staff-doctors"],
  ["/inventory", "inventory-assets"],
  ["/staff", "staff-doctors"],
  ["/doctors", "staff-doctors"],
];
evidence.dashboard.aliasRedirects = [];
for (const [from, expectSlug] of aliasChecks) {
  await safeGoto(`${BASE}${from}`);
  const landed = page.url();
  const ok = landed.includes(expectSlug) || landed.includes(from.replace(/^\//, ""));
  evidence.dashboard.aliasRedirects.push({ from, landed, expectSlug, ok });
  if (!ok) {
    pushGap(`ALIAS-${from.replace(/\W+/g, "_")}`, {
      moduleRoute: from,
      classification: "partial",
      severity: "medium",
      note: `Expected consolidation redirect toward ${expectSlug}`,
      evidence: { landed },
    });
  }
}

// Widths on dashboard + one landing module
for (const target of ["/dashboard", "/inventory-assets", "/prototype-reference"]) {
  for (const w of WIDTHS) {
    await page.setViewportSize({ width: w, height: 900 });
    await safeGoto(`${BASE}${target}`);
    await page.waitForTimeout(450);
    const crashed = (await page.locator("text=Application error").count()) > 0;
    const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
    const ok = !crashed && scrollW <= w + 40;
    const row = {
      target,
      width: w,
      ok,
      scrollWidth: scrollW,
      crashed,
    };
    evidence.widths.push(row);
    if (!ok) {
      pushGap(`WIDTH-${target.replace(/\W+/g, "_")}-${w}`, {
        moduleRoute: target,
        classification: "defect",
        severity: w <= 430 ? "medium" : "low",
        note: `Viewport ${w}: scrollWidth=${scrollW} crashed=${crashed}`,
        evidence: row,
      });
    }
    if ([1440, 768, 390].includes(w) && target === "/dashboard") {
      const name = `14-dashboard-w${w}`;
      await page.screenshot({ path: shot(name), fullPage: false });
      evidence.screenshots.push(`${name}.png`);
    }
  }
}

// Appearances (dashboard)
await page.setViewportSize({ width: 1440, height: 900 });
await safeGoto(`${BASE}/dashboard`);
for (const mode of APPEARANCES) {
  const sel = page.locator("select").filter({ has: page.locator(`option[value="${mode}"]`) }).first();
  let applied = false;
  if ((await sel.count()) > 0) {
    await sel.selectOption(mode).catch(() => {});
    applied = true;
    await page.waitForTimeout(400);
  } else {
    // Fallback: toggle via localStorage / data-theme if present
    await page.evaluate((m) => {
      document.documentElement.dataset.theme = m === "system" ? "" : m;
      document.documentElement.classList.toggle("dark", m === "dark");
      try {
        localStorage.setItem("pulse.appearance", m);
      } catch {
        /* ignore */
      }
    }, mode);
    await page.waitForTimeout(300);
  }
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const name = `15-appearance-${mode}`;
  await page.screenshot({ path: shot(name), fullPage: false });
  evidence.screenshots.push(`${name}.png`);
  evidence.appearances.push({ mode, appliedViaSelect: applied, bodyBg: bg });
}

// Keyboard / basic a11y spot checks
await safeGoto(`${BASE}/dashboard`);
await page.keyboard.press("Tab");
await page.keyboard.press("Tab");
const activeTag = await page.evaluate(() => {
  const el = document.activeElement;
  return el
    ? {
        tag: el.tagName,
        role: el.getAttribute("role"),
        name: (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 80),
      }
    : null;
});
evidence.a11y.push({ check: "tab-focus-after-2-tabs", activeTag });

const landmarkCount = await page.evaluate(() => ({
  nav: document.querySelectorAll("nav, [role='navigation']").length,
  main: document.querySelectorAll("main, [role='main']").length,
  buttonsWithoutName: Array.from(document.querySelectorAll("button")).filter(
    (b) => !(b.getAttribute("aria-label") || b.textContent || "").trim()
  ).length,
}));
evidence.a11y.push({ check: "landmarks-and-unnamed-buttons", ...landmarkCount });

// Staff Pay sections depth signal
await safeGoto(`${BASE}/staffpay`);
const staffPayText = await page.locator("body").innerText();
evidence.dashboard.staffPay = {
  hasOverview: /Pay Run Overview|Overview/i.test(staffPayText),
  hasPeople: /People Review|People/i.test(staffPayText),
  hasExport: /Export/i.test(staffPayText),
  hasPlannedStub: /mounted for navigation only|not available in this batch|Planned/i.test(staffPayText),
  rebuildPending: /Rebuild pending/i.test(staffPayText),
};

// Doctor Pay / Inventory / BBPIP landing depth
for (const route of ["/doctorpay", "/bbpip", "/inventory-assets"]) {
  await safeGoto(`${BASE}${route}`);
  const t = await page.locator("body").innerText();
  evidence.dashboard[route.slice(1)] = {
    rebuildPending: /Rebuild pending/i.test(t),
    hasOcr: /OCR|Scan Document/i.test(t),
    hasBpExtraction: /Best Practice|BP Sync|BP extraction/i.test(t),
    hasPrintersSection: /Printer/i.test(t),
    sectionChips: (t.match(/Internal sections[\s\S]{0,400}/) || [""])[0].slice(0, 400),
  };
}

// Role visibility quick probe (sidebar Act as / role control if present)
await safeGoto(`${BASE}/dashboard`);
const roleControl = page.getByRole("combobox").or(page.locator("select")).first();
evidence.dashboard.roleProbe = {
  hasSelect: (await page.locator("select").count()) > 0,
  hasActAs: /Act as|Role/i.test(await page.locator("body").innerText()),
};
if ((await roleControl.count()) > 0) {
  const options = await page.locator("select").first().locator("option").allTextContents().catch(() => []);
  evidence.dashboard.roleProbe.optionSample = options.slice(0, 20);
}

evidence.finishedAt = new Date().toISOString();
evidence.summary = {
  routesCrawled: evidence.routes.length,
  routesCrashed: evidence.routes.filter((r) => r.crashed).length,
  landingOnlyCount: landingOnly.length,
  widthFailures: evidence.widths.filter((w) => !w.ok).length,
  consolidations: evidence.consolidationsVerified.length,
  gapsObserved: evidence.gapsObserved.length,
  screenshots: evidence.screenshots.length,
  hydrationOk: evidence.hydrationOk,
  consoleNoise: evidence.console.length,
};

fs.mkdirSync(path.dirname(JSON_OUT), { recursive: true });
fs.writeFileSync(JSON_OUT, JSON.stringify(evidence, null, 2));
console.log(JSON.stringify(evidence.summary, null, 2));
console.log(`Wrote ${JSON_OUT}`);
console.log(`Screenshots → ${OUT_DIR}`);
await browser.close();
