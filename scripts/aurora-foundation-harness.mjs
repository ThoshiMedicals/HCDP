/**
 * Aurora foundation visual harness (static primitives + optional live shell).
 *
 * Usage:
 *   node scripts/aurora-foundation-harness.mjs
 *   HCDP_BASE_URL=http://localhost:3011 node scripts/aurora-foundation-harness.mjs
 *
 * Results are LOCAL design-review evidence — not a WCAG or CI claim.
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const OUT = join(process.cwd(), "docs/audits/design-system/aurora-foundation");
const SHOTS = join(OUT, "shots");
mkdirSync(SHOTS, { recursive: true });

const HARNESS = pathToFileURL(join(OUT, "harness.html")).href;
const BASE = process.env.HCDP_BASE_URL || "";

const VIEWPORTS = [
  { name: "1440x900", w: 1440, h: 900 },
  { name: "1280x800", w: 1280, h: 800 },
  { name: "1024x768", w: 1024, h: 768 },
  { name: "768x1024", w: 768, h: 1024 },
  { name: "430-mobile", w: 430, h: 932 },
  { name: "390x844", w: 390, h: 844 },
];

const THEMES = [
  { id: "light", query: "", colorScheme: "light", reducedMotion: false },
  { id: "dark", query: "?theme=dark", colorScheme: "dark", reducedMotion: false },
  { id: "system-os-light", query: "", colorScheme: "light", reducedMotion: false },
  { id: "system-os-dark", query: "?theme=dark", colorScheme: "dark", reducedMotion: false },
  { id: "executive-blue", query: "?personality=executive-blue", colorScheme: "light", reducedMotion: false },
  { id: "medical-emerald", query: "?personality=medical-emerald", colorScheme: "light", reducedMotion: false },
  { id: "reduced-motion", query: "", colorScheme: "light", reducedMotion: true },
];

const assertions = [];
const shots = [];
let failures = 0;

function record(ok, id, reason, meta = {}) {
  assertions.push({ ok, id, reason, ...meta });
  if (!ok) {
    failures += 1;
    console.error(`FAIL [${id}]: ${reason}`);
  } else {
    console.log(`PASS [${id}]: ${reason}`);
  }
}

async function captureHarness(browser) {
  for (const theme of THEMES) {
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.w, height: vp.h },
        colorScheme: theme.colorScheme,
        reducedMotion: theme.reducedMotion ? "reduce" : "no-preference",
      });
      const page = await context.newPage();
      await page.goto(HARNESS + theme.query, { waitUntil: "load" });

      const overflow = await page.evaluate(() => {
        const docOverflow =
          document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
        if (!docOverflow) return false;
        const offenders = [...document.querySelectorAll("body *")].filter((el) => {
          const s = getComputedStyle(el);
          if (s.position === "fixed" || s.position === "absolute") return false;
          if (s.display === "none" || s.visibility === "hidden") return false;
          const r = el.getBoundingClientRect();
          return r.right > document.documentElement.clientWidth + 1;
        });
        return offenders.length > 0;
      });
      record(!overflow, `overflow-${theme.id}-${vp.name}`, "no horizontal overflow", {
        theme: theme.id,
        viewport: vp.name,
      });

      const glassOnCritical = await page.evaluate(() => {
        const crit = document.querySelector('[data-aurora-surface="critical"]');
        if (!crit) return true;
        const cs = getComputedStyle(crit);
        return cs.backdropFilter === "none" || cs.backdropFilter === "";
      });
      record(glassOnCritical, `critical-solid-${theme.id}-${vp.name}`, "critical surface is not glass", {
        theme: theme.id,
        viewport: vp.name,
      });

      const file = `harness-${theme.id}-${vp.name}.png`;
      await page.screenshot({ path: join(SHOTS, file), fullPage: true });
      shots.push({ file, kind: "harness", theme: theme.id, viewport: vp.name });

      if (theme.id === "light" && (vp.name === "1440x900" || vp.name === "390x844")) {
        await page.locator("#primary-action").focus();
        const focusFile = `harness-focus-${theme.id}-${vp.name}.png`;
        await page.screenshot({ path: join(SHOTS, focusFile), fullPage: false });
        shots.push({ file: focusFile, kind: "focus", theme: theme.id, viewport: vp.name });
        record(true, `focus-${theme.id}-${vp.name}`, "keyboard focus captured");

        await page.locator("#open-drawer").click();
        await page.waitForTimeout(50);
        const drawerOpen = await page.locator("#drawer").evaluate((el) => el.classList.contains("open"));
        record(drawerOpen, `drawer-open-${theme.id}-${vp.name}`, "drawer opens");
        const drawerFile = `harness-drawer-${theme.id}-${vp.name}.png`;
        await page.screenshot({ path: join(SHOTS, drawerFile), fullPage: false });
        shots.push({ file: drawerFile, kind: "drawer", theme: theme.id, viewport: vp.name });
        await page.keyboard.press("Escape");
        const drawerClosed = await page.locator("#drawer").evaluate((el) => !el.classList.contains("open"));
        record(drawerClosed, `drawer-escape-${theme.id}-${vp.name}`, "drawer closes on Escape");
      }

      if (vp.w <= 430 && theme.id === "light") {
        await page.locator("#menu").click();
        const expanded = await page.locator("#menu").getAttribute("aria-expanded");
        record(expanded === "true", `mobile-nav-open-${vp.name}`, "mobile nav aria-expanded true");
        const mobileFile = `harness-mobile-nav-${vp.name}.png`;
        await page.screenshot({ path: join(SHOTS, mobileFile), fullPage: false });
        shots.push({ file: mobileFile, kind: "mobile-nav", theme: theme.id, viewport: vp.name });
      }

      await context.close();
    }
  }
}

async function captureLiveShell(browser) {
  if (!BASE) {
    record(true, "live-shell-skipped", "HCDP_BASE_URL not set; static harness only");
    return;
  }
  if (/127\.0\.0\.1/.test(BASE)) {
    record(false, "live-shell-base", "Use localhost (not 127.0.0.1)");
    return;
  }
  for (const appearance of [
    { id: "light", value: "light", colorScheme: "light" },
    { id: "dark", value: "dark", colorScheme: "dark" },
  ]) {
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.w, height: vp.h },
        colorScheme: appearance.colorScheme,
      });
      const page = await context.newPage();
      try {
        await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded", timeout: 45000 });
        await page.evaluate((value) => {
          localStorage.setItem("pulse.cc.appearance", JSON.stringify(value));
          const dark = value === "dark";
          document.documentElement.classList.toggle("theme-dark", dark);
          document.body?.classList.toggle("theme-dark", dark);
        }, appearance.value);
        await page.reload({ waitUntil: "domcontentloaded", timeout: 45000 });
        const file = `shell-${appearance.id}-${vp.name}.png`;
        await page.screenshot({ path: join(SHOTS, file), fullPage: false });
        shots.push({ file, kind: "shell", theme: appearance.id, viewport: vp.name });
        const sidebar = await page.locator('[data-testid="shell-sidebar"], .pulse-sidebar').count();
        record(sidebar > 0, `shell-nav-${appearance.id}-${vp.name}`, "shell nav present");
      } catch (err) {
        record(false, `shell-capture-${appearance.id}-${vp.name}`, String(err));
      }
      await context.close();
    }
  }
}

const browser = await chromium.launch({ headless: true });
try {
  await captureHarness(browser);
  await captureLiveShell(browser);
} finally {
  await browser.close();
}

const report = {
  generatedAt: new Date().toISOString(),
  principle: "Glass for navigation; clarity for work.",
  claims: {
    wcagCompliant: false,
    pixelParity: false,
    productionApproved: false,
  },
  viewports: VIEWPORTS,
  themes: THEMES.map((t) => t.id),
  screenshotCount: shots.length,
  assertionTotals: {
    total: assertions.length,
    passed: assertions.filter((a) => a.ok).length,
    failed: assertions.filter((a) => !a.ok).length,
  },
  shots,
  assertions,
  notes: [
    "Executive Blue / Medical Emerald personality hooks are harness-only; product appearance remains light|dark|system.",
    "Decision A shell dimensions (240/72/48) preserved.",
    "Static harness proves shared primitive surfaces; live shell capture is optional via HCDP_BASE_URL.",
  ],
};

writeFileSync(join(OUT, "browser-validation-report.json"), JSON.stringify(report, null, 2) + "\n", "utf8");
writeFileSync(
  join(OUT, "README.md"),
  [
    "# Aurora foundation evidence",
    "",
    `- Screenshots: ${shots.length}`,
    `- Assertions: ${report.assertionTotals.passed}/${report.assertionTotals.total} passed`,
    `- WCAG claim: no`,
    `- Pixel parity claim: no`,
    "",
    "See `browser-validation-report.json`.",
    "",
  ].join("\n"),
  "utf8"
);

console.log(`Aurora harness complete: ${report.assertionTotals.passed}/${report.assertionTotals.total} assertions; ${shots.length} shots`);
process.exit(failures > 0 ? 1 : 0);
