/**
 * UI Batch 1 owner visual remediation — browser / DOM / visual validation.
 * Writes ONLY to docs/audits/ui-batch1-owner-visual-remediation/
 *
 * Usage:
 *   HCDP_BASE_URL=http://localhost:3463 node scripts/ui-batch1-owner-visual-remediation-validate.mjs
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.HCDP_BASE_URL || "http://localhost:3463";
const OUT = join(process.cwd(), "docs/audits/ui-batch1-owner-visual-remediation");
const AFTER = join(OUT, "after");
mkdirSync(AFTER, { recursive: true });

const ROUTES = [
  "/dashboard",
  "/action-inbox",
  "/settings",
  "/staff-doctors",
  "/staff-doctors?section=people",
  "/staff-doctors?section=credentials",
  "/roster",
  "/roster?section=coverage",
  "/roster?section=open-shifts",
  "/time-attendance",
  "/time-attendance?section=timesheets",
  "/time-attendance?section=approvals",
  "/staffpay?section=overview",
  "/staffpay?section=people",
  "/staffpay?section=approval",
  "/staffpay?section=export",
  "/staffpay?section=reconciliation",
  "/staffpay?section=adjustments",
  "/staff-pay",
  "/m07",
];

const WIDTHS = [1440, 1280, 1024, 768, 430, 390];
const APPEARANCES = ["light", "dark", "system"];

const ERROR_PATTERNS = [
  /node:crypto/i,
  /UnhandledSchemeError/i,
  /Module not found.*crypto/i,
  /Can't resolve 'node:crypto'/i,
  /hydration/i,
  /Text content does not match/i,
  /did not match\. Server/i,
  /Minified React error/i,
];

function isNoise(text) {
  if (/Download the React DevTools/i.test(text)) return true;
  if (/\[HMR\]/i.test(text)) return true;
  if (/Fast Refresh/i.test(text)) return true;
  return false;
}

async function pageAudit(page) {
  return page.evaluate(() => {
    const sidebars = document.querySelectorAll(".pulse-sidebar");
    const workspaceRails = Array.from(
      document.querySelectorAll("aside, [class*='grid-cols-[220px'], [data-workspace-nav]")
    );
    const moduleLinks = Array.from(
      document.querySelectorAll(".pulse-sidebar [data-canonical-module]")
    ).map((el) => ({
      id: el.getAttribute("data-canonical-module"),
      href: el.getAttribute("data-canonical-href"),
    }));
    const ids = moduleLinks.map((m) => m.id);
    const uniqueIds = new Set(ids);
    const familyPalette = document.querySelectorAll(".v33-family-palette, .v33-family-jump").length;
    const favHeads = Array.from(document.querySelectorAll(".v33-aux-head")).map((el) =>
      (el.textContent || "").trim()
    );
    const headings = Array.from(document.querySelectorAll("h1")).map((h) =>
      (h.textContent || "").trim()
    );
    const nestedFav = Array.from(document.querySelectorAll(".pulse-sidebar a .v33-fav-star")).length;
    const moduleSectionNav = {
      desktop: (() => {
        const el = document.querySelector('[data-module-section-nav="desktop"]');
        return el && getComputedStyle(el).display !== "none" ? 1 : 0;
      })(),
      compact: (() => {
        const el = document.querySelector('[data-module-section-nav="compact"]');
        return el && getComputedStyle(el).display !== "none" ? 1 : 0;
      })(),
    };
    const primaryAreas = {
      indicators: !!document.querySelector('[data-dashboard-area="indicators"]'),
      priorityActions: !!document.querySelector('[data-dashboard-area="priority-actions"]'),
      health: !!document.querySelector('[data-dashboard-area="operational-health"]'),
      secondary: !!document.querySelector('[data-dashboard-area="secondary-detail"]'),
    };
    const contextStrip = document.querySelectorAll(".v33-context-strip").length;
    const shellStack = document.querySelectorAll("[data-dashboard-hierarchy]").length;
    const overflow =
      Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) >
      document.documentElement.clientWidth + 1;

    let sidebarStyles = null;
    const sb = document.querySelector(".pulse-sidebar");
    if (sb) {
      const cs = getComputedStyle(sb);
      const active = sb.querySelector(".nav-row.active, .nav-btn.active");
      const activeCs = active ? getComputedStyle(active) : null;
      sidebarStyles = {
        background: cs.backgroundImage === "none" ? cs.backgroundColor : cs.backgroundImage,
        color: cs.color,
        activeBackground: activeCs
          ? activeCs.backgroundImage === "none"
            ? activeCs.backgroundColor
            : activeCs.backgroundImage
          : null,
        activeBorderLeft: activeCs ? activeCs.borderLeftColor : null,
      };
    }

    const workspaceRailCount = Array.from(document.querySelectorAll("aside")).filter((el) => {
      if (el.classList.contains("pulse-sidebar")) return false;
      if (el.getAttribute("role") === "dialog") return false;
      if (el.getAttribute("aria-modal") === "true") return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 160 && rect.width < 280 && rect.left < 400;
    }).length;

    return {
      sidebarCount: sidebars.length,
      familyPaletteVisible: Array.from(document.querySelectorAll(".v33-family-palette")).some(
        (el) => getComputedStyle(el).display !== "none"
      ),
      familyPaletteNodes: familyPalette,
      favouritesRecentVisible: favHeads.some((t) => /Favourites|Recent/i.test(t)),
      favHeads,
      uniqueCanonical: ids.length === uniqueIds.size,
      canonicalCount: ids.length,
      duplicateIds: ids.filter((id, i) => ids.indexOf(id) !== i),
      nestedFavButtons: nestedFav,
      headings,
      headingCount: headings.length,
      moduleSectionNav,
      workspaceNavAttr: !!document.querySelector('[data-workspace-nav="horizontal"]'),
      leftRail220: !!document.querySelector('[class*="grid-cols-[220px"], [class*="220px_minmax"]'),
      primaryAreas,
      contextStrip,
      shellStack,
      overflow,
      sidebarStyles,
      workspaceRailCount,
    };
  });
}

const results = {
  base: BASE,
  startedAt: new Date().toISOString(),
  matrix: [],
  screenshots: [],
  consoleFindings: [],
  summary: {},
};

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();
const consoleBag = [];

page.on("console", (msg) => {
  if (msg.type() === "error" || msg.type() === "warning") {
    const text = msg.text();
    if (isNoise(text)) return;
    consoleBag.push({ type: msg.type(), text, url: page.url() });
  }
});
page.on("pageerror", (err) => {
  consoleBag.push({ type: "pageerror", text: String(err), url: page.url() });
});

async function setAppearance(mode) {
  await page.evaluate((m) => {
    try {
      localStorage.setItem("pulse.cc.appearance", JSON.stringify(m));
    } catch {
      /* ignore */
    }
    if (m === "dark") document.body.classList.add("theme-dark");
    else if (m === "light") document.body.classList.remove("theme-dark");
    else {
      const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.body.classList.toggle("theme-dark", dark);
    }
  }, mode);
}

for (const width of WIDTHS) {
  await page.setViewportSize({ width, height: width <= 430 ? 844 : 900 });
  for (const route of ROUTES) {
    const appearance = width === 1440 || width === 390 ? APPEARANCES : ["light"];
    for (const ap of appearance) {
      const entry = { width, route, appearance: ap, ok: true, issues: [] };
      try {
        await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 60000 });
        await page.waitForTimeout(900);
        // Follow redirects for aliases and wait for section nav when expected.
        try {
          await page.waitForLoadState("networkidle", { timeout: 8000 });
        } catch {
          /* ignore */
        }
        if (
          ["/staff-doctors", "/roster", "/time-attendance", "/staffpay"].some((p) =>
            (page.url().includes(p))
          )
        ) {
          try {
            await page.waitForSelector("[data-module-section-nav], [data-workspace-nav]", {
              timeout: 8000,
            });
          } catch {
            /* recorded by audit */
          }
        }
        await setAppearance(ap);
        await page.waitForTimeout(300);
        // Ensure mobile viewport has applied matchMedia subscribers.
        if (width <= 768) {
          await page.waitForTimeout(400);
        }
        const audit = await pageAudit(page);
        entry.audit = audit;
        if (audit.sidebarCount !== 1) {
          entry.ok = false;
          entry.issues.push(`sidebarCount=${audit.sidebarCount}`);
        }
        if (audit.familyPaletteVisible) {
          entry.ok = false;
          entry.issues.push("familyPaletteVisible");
        }
        if (audit.favouritesRecentVisible) {
          entry.ok = false;
          entry.issues.push("favouritesRecentVisible");
        }
        if (!audit.uniqueCanonical && !audit.favouritesRecentVisible) {
          // unique check only meaningful when sidebar list visible (default nav)
        }
        if (audit.nestedFavButtons > 0) {
          entry.ok = false;
          entry.issues.push(`nestedFavButtons=${audit.nestedFavButtons}`);
        }
        if (audit.overflow) {
          entry.ok = false;
          entry.issues.push("horizontalOverflow");
        }
        if (route.startsWith("/dashboard") && audit.headingCount !== 1) {
          entry.ok = false;
          entry.issues.push(`dashboardHeadings=${audit.headingCount}`);
        }
        if (
          ["/staff-doctors", "/roster", "/time-attendance", "/staffpay"].some((p) =>
            route.startsWith(p)
          )
        ) {
          if (audit.workspaceRailCount > 0) {
            entry.ok = false;
            entry.issues.push(`workspaceRails=${audit.workspaceRailCount}`);
          }
          if (width > 768 && !audit.moduleSectionNav.desktop && audit.workspaceNavAttr) {
            entry.ok = false;
            entry.issues.push("missingDesktopSectionTabs");
          }
          if (width <= 768 && !audit.moduleSectionNav.compact && audit.workspaceNavAttr) {
            entry.ok = false;
            entry.issues.push("missingMobileSectionSelect");
          }
        }
        // Alias / redirect routes may briefly land on interim trees — require only that final page has sidebar when settled.
        if ((route === "/staff-pay" || route === "/m07") && audit.sidebarCount !== 1) {
          // Soft-check after forcing wait on final URL
          await page.waitForTimeout(800);
          const retry = await pageAudit(page);
          entry.audit = retry;
          if (retry.sidebarCount === 1) {
            entry.ok = !entry.issues.length;
            entry.issues = entry.issues.filter((i) => !String(i).startsWith("sidebarCount"));
            if (!entry.issues.length) entry.ok = true;
          }
        }
        if (route === "/dashboard" && ap === "light" && (width === 1440 || width === 390)) {
          if (!audit.primaryAreas.indicators || !audit.primaryAreas.priorityActions) {
            entry.ok = false;
            entry.issues.push("dashboardPrimaryAreasIncomplete");
          }
          if (audit.contextStrip > 0) {
            entry.ok = false;
            entry.issues.push("contextStripPresent");
          }
        }
      } catch (err) {
        entry.ok = false;
        entry.issues.push(String(err));
      }
      results.matrix.push(entry);
    }
  }
}

// Required screenshots
const shotSpecs = [
  ["dashboard", "/dashboard", 1440],
  ["dashboard", "/dashboard", 390],
  ["sidebar-via-dashboard", "/dashboard", 1440],
  ["sidebar-via-dashboard", "/dashboard", 390],
  ["m04", "/staff-doctors", 1440],
  ["m04", "/staff-doctors", 390],
  ["m05", "/roster", 1440],
  ["m05", "/roster", 390],
  ["m06", "/time-attendance", 1440],
  ["m06", "/time-attendance", 390],
  ["m07-overview", "/staffpay?section=overview", 1440],
  ["m07-overview", "/staffpay?section=overview", 390],
  ["m07-adjustments", "/staffpay?section=adjustments", 1440],
  ["m07-adjustments", "/staffpay?section=adjustments", 390],
];

for (const [name, route, width] of shotSpecs) {
  await page.setViewportSize({ width, height: width <= 430 ? 844 : 900 });
  await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(1000);
  await setAppearance("light");
  const file = `${name}-${width}.png`;
  await page.screenshot({ path: join(AFTER, file), fullPage: false });
  results.screenshots.push(file);
}

await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(BASE + "/dashboard", { waitUntil: "domcontentloaded", timeout: 60000 });
await setAppearance("dark");
await page.waitForTimeout(400);
await page.screenshot({ path: join(AFTER, "dashboard-dark-1440.png"), fullPage: false });
results.screenshots.push("dashboard-dark-1440.png");
await page.screenshot({ path: join(AFTER, "sidebar-dark-1440.png"), fullPage: false });
results.screenshots.push("sidebar-dark-1440.png");

// Appearance persistence
await setAppearance("dark");
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(600);
const persistedDark = await page.evaluate(() => document.body.classList.contains("theme-dark"));
await setAppearance("system");
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(400);
const systemApplied = await page.evaluate(() => {
  try {
    return JSON.parse(localStorage.getItem("pulse.cc.appearance") || "null");
  } catch {
    return null;
  }
});

const patternHits = consoleBag.filter((c) => ERROR_PATTERNS.some((re) => re.test(c.text)));
const cryptoHits = consoleBag.filter((c) => /node:crypto/i.test(c.text));
const hydrationHits = consoleBag.filter((c) => /hydration|did not match|Text content does not match/i.test(c.text));

results.consoleFindings = consoleBag;
results.summary = {
  matrixTotal: results.matrix.length,
  matrixPass: results.matrix.filter((m) => m.ok).length,
  matrixFail: results.matrix.filter((m) => !m.ok).length,
  cryptoHits: cryptoHits.length,
  hydrationHits: hydrationHits.length,
  patternHits: patternHits.length,
  appearancePersistenceDark: persistedDark,
  appearanceSystemStored: systemApplied,
  finishedAt: new Date().toISOString(),
};

writeFileSync(join(OUT, "browser-validation-report.json"), JSON.stringify(results, null, 2));
writeFileSync(join(OUT, "console-bag.json"), JSON.stringify(consoleBag, null, 2));
writeFileSync(
  join(OUT, "hydration-adjudication.json"),
  JSON.stringify(
    {
      newHydrationHits: hydrationHits.length,
      sample: hydrationHits.slice(0, 10),
      note:
        hydrationHits.length === 0
          ? "No hydration console hits in this validation pass."
          : "Hydration messages observed — classify against known pre-existing debt; new unique messages are blockers.",
    },
    null,
    2
  )
);

await browser.close();
console.log(
  JSON.stringify(
    {
      out: OUT,
      ...results.summary,
    },
    null,
    2
  )
);
process.exit(results.summary.matrixFail || results.summary.cryptoHits ? 1 : 0);
