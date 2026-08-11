/**
 * P1-B1 SHARED Decision A shell harness smoke.
 * Captures /dashboard + /action-inbox shell regions at contract widths.
 *
 * Usage:
 *   HCDP_BASE_URL=http://localhost:3000 node scripts/p1-b1-shell-harness-smoke.mjs
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.HCDP_BASE_URL || "http://localhost:3000";
if (/127\.0\.0\.1/.test(BASE)) {
  console.error("Use localhost (not 127.0.0.1) for owner-visible harness.");
  process.exit(2);
}

const OUT = join(process.cwd(), "docs/audits/p1/b1-shell");
const SHOTS = join(OUT, "shots");
mkdirSync(SHOTS, { recursive: true });

const ROUTES = [
  { path: "/dashboard", id: "dashboard" },
  { path: "/action-inbox", id: "action-inbox" },
];

const WIDTHS = [
  { name: "1440", w: 1440, h: 900 },
  { name: "1280", w: 1280, h: 900 },
  { name: "1024", w: 1024, h: 768 },
  { name: "768", w: 768, h: 1024 },
  { name: "430", w: 430, h: 932 },
  { name: "390", w: 390, h: 844 },
];

const APPEARANCES = ["light", "dark", "system"];

const REGIONS = [
  "shell-nav",
  "topbar",
  "module-title-tabs",
  "kpi-strip",
  "toolbar",
  "main-pane",
  "detail-pane",
];

function expectSidebarWidth(width) {
  if (width < 768) return 240;
  if (width < 1280) return 72;
  return 240;
}

async function auditShell(page, width) {
  return page.evaluate((expectedWidth) => {
    const sidebar = document.querySelector('[data-testid="shell-sidebar"], .pulse-sidebar');
    const topbar = document.querySelector('[data-testid="shell-topbar"], .pulse-top-ribbon');
    const sb = sidebar ? sidebar.getBoundingClientRect() : null;
    const tb = topbar ? topbar.getBoundingClientRect() : null;
    const cs = getComputedStyle(document.documentElement);
    const regions = {};
    for (const r of [
      "shell-nav",
      "topbar",
      "module-title-tabs",
      "kpi-strip",
      "toolbar",
      "main-pane",
      "detail-pane",
    ]) {
      regions[r] = document.querySelectorAll(`[data-shell-region="${r}"]`).length;
    }
    const overflowX = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
    return {
      sidebarWidth: sb ? Math.round(sb.width) : null,
      topbarHeight: tb ? Math.round(tb.height) : null,
      cssSidebarCurrent: cs.getPropertyValue("--sidebar-current").trim(),
      cssTopbar: cs.getPropertyValue("--topbar-height").trim(),
      dataCollapsed: sidebar?.getAttribute("data-collapsed") ?? null,
      appearance: document.documentElement.getAttribute("data-appearance"),
      themeDark: document.documentElement.classList.contains("theme-dark"),
      regions,
      overflowX,
      expectedWidth,
    };
  }, expectSidebarWidth(width));
}

async function setAppearance(page, appearance) {
  await page.evaluate((value) => {
    localStorage.setItem("pulse.cc.appearance", JSON.stringify(value));
    const dark =
      value === "dark" ||
      (value === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    const root = document.documentElement;
    root.classList.toggle("theme-dark", !!dark);
    root.setAttribute("data-appearance", value);
    root.style.colorScheme = dark ? "dark" : "light";
    document.body?.classList.toggle("theme-dark", !!dark);
  }, appearance);
}

const findings = [];
const shots = [];
let failures = 0;

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ reducedMotion: "reduce" });
const page = await context.newPage();

try {
  for (const route of ROUTES) {
    for (const vp of WIDTHS) {
      for (const appearance of APPEARANCES) {
        await page.setViewportSize({ width: vp.w, height: vp.h });
        await page.goto(`${BASE}${route.path}`, { waitUntil: "domcontentloaded", timeout: 60000 });
        await page.waitForSelector('[data-testid="shell-sidebar"], .pulse-sidebar', { timeout: 30000 });
        await page.waitForSelector('[data-testid="shell-topbar"], .pulse-top-ribbon', { timeout: 30000 });
        await setAppearance(page, appearance);
        // Re-assert viewport after paint so portal resize sync runs against the intended width.
        await page.setViewportSize({ width: vp.w, height: vp.h });
        await page.waitForFunction((w) => window.innerWidth === w, vp.w, { timeout: 10000 });
        await page.evaluate(() => window.dispatchEvent(new Event("resize")));
        const expectedCss = `${expectSidebarWidth(vp.w)}px`;
        await page.waitForFunction(
          (expected) =>
            getComputedStyle(document.documentElement).getPropertyValue("--sidebar-current").trim() ===
            expected,
          expectedCss,
          { timeout: 10000 }
        );
        const audit = await auditShell(page, vp.w);
        const expected = expectSidebarWidth(vp.w);
        const sidebarOk =
          vp.w < 768
            ? audit.cssSidebarCurrent === `${expected}px`
            : audit.sidebarWidth != null && Math.abs(audit.sidebarWidth - expected) <= 2;
        const topbarOk =
          audit.topbarHeight != null &&
          audit.topbarHeight >= 48 &&
          audit.topbarHeight <= 52 &&
          audit.cssTopbar === "48px";
        const cssVarOk = audit.cssSidebarCurrent === `${expected}px`;
        const regionOk = audit.regions["shell-nav"] >= 1 && audit.regions.topbar >= 1 && audit.regions["main-pane"] >= 1;

        const ok = sidebarOk && topbarOk && cssVarOk && regionOk && !audit.overflowX;
        if (!ok) failures += 1;

        const file = `${route.id}-${vp.name}-${appearance}.png`;
        const path = join(SHOTS, file);
        await page.screenshot({ path, fullPage: false });
        shots.push(file);

        findings.push({
          route: route.path,
          viewport: vp.name,
          appearance,
          ok,
          sidebarOk,
          topbarOk,
          cssVarOk,
          regionOk,
          overflowX: audit.overflowX,
          audit,
        });
      }
    }
  }
} finally {
  await browser.close();
}

const report = {
  batch: "P1-B1",
  base: BASE,
  generatedAt: new Date().toISOString(),
  ownerAcceptance: "pending",
  engineeringComplete: failures === 0,
  failures,
  regionsExpected: REGIONS,
  widths: WIDTHS.map((w) => w.w),
  appearances: APPEARANCES,
  shots,
  findings,
  note: "Visual QA vs Decision A PNGs remains owner/separate-agent; this harness is engineering smoke only.",
};

writeFileSync(join(OUT, "harness-smoke-report.json"), JSON.stringify(report, null, 2));
writeFileSync(
  join(OUT, "harness-smoke-summary.md"),
  `# P1-B1 shell harness smoke\n\n- Base: ${BASE}\n- Failures: ${failures}\n- Shots: ${shots.length}\n- Owner acceptance: pending\n`
);

console.log(JSON.stringify({ ok: failures === 0, failures, shots: shots.length, out: OUT }, null, 2));
process.exit(failures ? 1 : 0);
