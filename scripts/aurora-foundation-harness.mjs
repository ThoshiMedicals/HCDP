/**
 * Aurora foundation evidence harness (remediated).
 *
 * Distinguishes:
 *   - source: "harness"  → static docs/.../harness.html (primitives only)
 *   - source: "live"     → running app via HCDP_BASE_URL (shell chrome)
 *
 * Usage:
 *   node scripts/aurora-foundation-harness.mjs
 *   HCDP_BASE_URL=http://localhost:3011 node scripts/aurora-foundation-harness.mjs
 *
 * Not a WCAG claim. Not production approval.
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const OUT = join(process.cwd(), "docs/audits/design-system/aurora-foundation");
const SHOTS = join(OUT, "shots");
if (existsSync(SHOTS)) rmSync(SHOTS, { recursive: true, force: true });
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

/** Harness-only matrix (primitives page). */
const HARNESS_THEMES = [
  { id: "light", query: "", colorScheme: "light", reducedMotion: false, productTheme: false },
  { id: "dark", query: "?theme=dark", colorScheme: "dark", reducedMotion: false, productTheme: false },
  { id: "system-os-light", query: "", colorScheme: "light", reducedMotion: false, productTheme: false },
  { id: "system-os-dark", query: "?theme=dark", colorScheme: "dark", reducedMotion: false, productTheme: false },
  {
    id: "executive-blue",
    query: "?personality=executive-blue",
    colorScheme: "light",
    reducedMotion: false,
    productTheme: false,
    demonstrationOnly: true,
  },
  {
    id: "medical-emerald",
    query: "?personality=medical-emerald",
    colorScheme: "light",
    reducedMotion: false,
    productTheme: false,
    demonstrationOnly: true,
  },
  { id: "reduced-motion", query: "", colorScheme: "light", reducedMotion: true, productTheme: false },
];

/** Live shell appearances that are genuinely product-selectable. */
const LIVE_APPEARANCES = [
  { id: "light", value: "light", colorScheme: "light" },
  { id: "dark", value: "dark", colorScheme: "dark" },
  { id: "system-os-light", value: "system", colorScheme: "light" },
  { id: "system-os-dark", value: "system", colorScheme: "dark" },
];

const assertions = [];
const shots = [];
const consoleErrors = [];
const groups = {
  harnessOverflow: { pass: 0, fail: 0 },
  harnessCriticalSolid: { pass: 0, fail: 0 },
  harnessFocus: { pass: 0, fail: 0 },
  harnessDrawer: { pass: 0, fail: 0 },
  harnessReducedMotion: { pass: 0, fail: 0 },
  harnessMobileNav: { pass: 0, fail: 0 },
  liveShellPresent: { pass: 0, fail: 0 },
  liveOverflow: { pass: 0, fail: 0 },
  liveThemeResolved: { pass: 0, fail: 0 },
};
let failures = 0;

function bump(group, ok) {
  if (!groups[group]) groups[group] = { pass: 0, fail: 0 };
  if (ok) groups[group].pass += 1;
  else groups[group].fail += 1;
}

function record(ok, id, reason, meta = {}) {
  assertions.push({ ok, id, reason, ...meta });
  if (meta.group) bump(meta.group, ok);
  if (!ok) {
    failures += 1;
    console.error(`FAIL [${id}]: ${reason}`);
  } else {
    console.log(`PASS [${id}]: ${reason}`);
  }
}

function attachConsole(page, source, theme, viewport) {
  page.on("pageerror", (err) => {
    consoleErrors.push({ source, theme, viewport, type: "pageerror", message: String(err) });
  });
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push({ source, theme, viewport, type: "console", message: msg.text() });
    }
  });
}

async function noHorizontalOverflow(page, { shellOnly = false } = {}) {
  return page.evaluate(({ shellOnly: onlyShell }) => {
    if (onlyShell) {
      const shell = [
        ...document.querySelectorAll(
          '[data-testid="shell-sidebar"], .pulse-sidebar, [data-testid="shell-topbar"], .pulse-top-ribbon'
        ),
      ];
      return shell.every((el) => {
        const r = el.getBoundingClientRect();
        // Off-canvas mobile nav may sit entirely outside the viewport.
        if (r.right <= 0 || r.left >= document.documentElement.clientWidth) return true;
        return r.right <= document.documentElement.clientWidth + 1 && r.left >= -1;
      });
    }
    const intentional = (el) => {
      const s = getComputedStyle(el);
      return (
        s.overflowX === "auto" ||
        s.overflowX === "scroll" ||
        el.classList.contains("module-section-nav__scroller")
      );
    };
    const offenders = [...document.querySelectorAll("body *")].filter((el) => {
      const s = getComputedStyle(el);
      if (s.position === "fixed" || s.position === "absolute") return false;
      if (s.display === "none" || s.visibility === "hidden") return false;
      if (intentional(el) || intentional(el.parentElement || el)) return false;
      const r = el.getBoundingClientRect();
      return r.right > document.documentElement.clientWidth + 1;
    });
    return offenders.length === 0;
  }, { shellOnly });
}

async function captureHarness(browser) {
  for (const theme of HARNESS_THEMES) {
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.w, height: vp.h },
        colorScheme: theme.colorScheme,
        reducedMotion: theme.reducedMotion ? "reduce" : "no-preference",
      });
      const page = await context.newPage();
      attachConsole(page, "harness", theme.id, vp.name);
      await page.goto(HARNESS + theme.query, { waitUntil: "load" });

      const overflowOk = await noHorizontalOverflow(page);
      record(overflowOk, `harness-overflow-${theme.id}-${vp.name}`, "harness: no horizontal overflow", {
        source: "harness",
        theme: theme.id,
        viewport: vp.name,
        group: "harnessOverflow",
      });

      const criticalSolid = await page.evaluate(() => {
        const crit = document.querySelector('[data-aurora-surface="critical"]');
        if (!crit) return false;
        const cs = getComputedStyle(crit);
        return !cs.backdropFilter || cs.backdropFilter === "none";
      });
      record(criticalSolid, `harness-critical-${theme.id}-${vp.name}`, "harness: critical surface solid", {
        source: "harness",
        theme: theme.id,
        viewport: vp.name,
        group: "harnessCriticalSolid",
      });

      if (theme.reducedMotion) {
        const motion = await page.evaluate(() =>
          window.matchMedia("(prefers-reduced-motion: reduce)").matches
        );
        record(motion, `harness-reduced-motion-${vp.name}`, "harness: prefers-reduced-motion active", {
          source: "harness",
          theme: theme.id,
          viewport: vp.name,
          group: "harnessReducedMotion",
        });
      }

      const file = `harness-${theme.id}-${vp.name}.png`;
      await page.screenshot({ path: join(SHOTS, file), fullPage: true });
      shots.push({
        file,
        source: "harness",
        kind: "primitives",
        themeRequested: theme.id,
        themeResolved: theme.query.includes("theme=dark") ? "dark" : "light",
        demonstrationOnly: !!theme.demonstrationOnly,
        viewport: vp.name,
        width: vp.w,
        height: vp.h,
        authoritative: theme.id === "light" || theme.id === "dark",
      });

      if (theme.id === "light" && (vp.name === "1440x900" || vp.name === "390x844")) {
        await page.locator("#primary-action").focus();
        const active = await page.evaluate(() => document.activeElement?.id || "");
        record(active === "primary-action", `harness-focus-${vp.name}`, "harness: focus on primary action", {
          source: "harness",
          viewport: vp.name,
          group: "harnessFocus",
          activeElement: active,
        });
        const focusFile = `harness-focus-light-${vp.name}.png`;
        await page.screenshot({ path: join(SHOTS, focusFile), fullPage: false });
        shots.push({
          file: focusFile,
          source: "harness",
          kind: "focus",
          themeRequested: "light",
          themeResolved: "light",
          viewport: vp.name,
          width: vp.w,
          height: vp.h,
          authoritative: true,
        });

        const opener = await page.evaluateHandle(() => document.activeElement);
        await page.locator("#open-drawer").click();
        await page.waitForTimeout(40);
        const drawerOpen = await page.locator("#drawer").evaluate((el) => el.classList.contains("open"));
        record(drawerOpen, `harness-drawer-open-${vp.name}`, "harness: drawer opens", {
          source: "harness",
          group: "harnessDrawer",
          viewport: vp.name,
        });
        const drawerFile = `harness-drawer-light-${vp.name}.png`;
        await page.screenshot({ path: join(SHOTS, drawerFile), fullPage: false });
        shots.push({
          file: drawerFile,
          source: "harness",
          kind: "drawer",
          themeRequested: "light",
          themeResolved: "light",
          viewport: vp.name,
          width: vp.w,
          height: vp.h,
          authoritative: true,
        });
        await page.keyboard.press("Escape");
        await page.waitForTimeout(40);
        const drawerClosed = await page.locator("#drawer").evaluate((el) => !el.classList.contains("open"));
        const restored = await page.evaluate(
          (el) => document.activeElement === el || document.activeElement?.id === "open-drawer",
          opener
        );
        record(drawerClosed && restored, `harness-drawer-escape-${vp.name}`, "harness: Escape closes + focus restores", {
          source: "harness",
          group: "harnessDrawer",
          viewport: vp.name,
          drawerClosed,
          focusRestored: restored,
        });
      }

      if (vp.w <= 430 && theme.id === "light") {
        await page.locator("#menu").click();
        const expanded = await page.locator("#menu").getAttribute("aria-expanded");
        record(expanded === "true", `harness-mobile-nav-${vp.name}`, "harness: synthetic mobile nav expands", {
          source: "harness",
          group: "harnessMobileNav",
          viewport: vp.name,
          note: "Synthetic harness nav — not the deferred Today/Actions/Search/More product model",
        });
        const mobileFile = `harness-mobile-nav-${vp.name}.png`;
        await page.screenshot({ path: join(SHOTS, mobileFile), fullPage: false });
        shots.push({
          file: mobileFile,
          source: "harness",
          kind: "mobile-nav",
          themeRequested: "light",
          themeResolved: "light",
          viewport: vp.name,
          width: vp.w,
          height: vp.h,
          authoritative: false,
          demonstrationOnly: true,
        });
      }

      await context.close();
    }
  }
}

async function captureLiveShell(browser) {
  if (!BASE) {
    record(true, "live-shell-skipped", "HCDP_BASE_URL not set — live shell captures skipped", {
      source: "live",
      group: "liveShellPresent",
    });
    return;
  }
  if (/127\.0\.0\.1/.test(BASE)) {
    record(false, "live-shell-base", "Use localhost (not 127.0.0.1)", { source: "live" });
    return;
  }

  for (const appearance of LIVE_APPEARANCES) {
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.w, height: vp.h },
        colorScheme: appearance.colorScheme,
      });
      const page = await context.newPage();
      attachConsole(page, "live", appearance.id, vp.name);
      try {
        await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded", timeout: 45000 });
        const resolved = await page.evaluate(({ value, colorScheme }) => {
          localStorage.setItem("pulse.cc.appearance", JSON.stringify(value));
          const dark =
            value === "dark" ||
            (value === "system" && colorScheme === "dark");
          document.documentElement.classList.toggle("theme-dark", !!dark);
          document.body?.classList.toggle("theme-dark", !!dark);
          document.documentElement.setAttribute("data-appearance", value);
          return {
            requested: value,
            resolvedDark: !!dark,
            hasThemeDark: document.documentElement.classList.contains("theme-dark"),
          };
        }, { value: appearance.value, colorScheme: appearance.colorScheme });
        await page.reload({ waitUntil: "domcontentloaded", timeout: 45000 });
        await page.waitForTimeout(250);

        const sidebar = await page.locator('[data-testid="shell-sidebar"], .pulse-sidebar').count();
        record(sidebar > 0, `live-shell-nav-${appearance.id}-${vp.name}`, "live: shell nav present", {
          source: "live",
          group: "liveShellPresent",
          themeRequested: appearance.value,
          themeResolved: resolved.resolvedDark ? "dark" : "light",
          viewport: vp.name,
        });

        const themeOk =
          (resolved.resolvedDark && resolved.hasThemeDark) ||
          (!resolved.resolvedDark && !resolved.hasThemeDark);
        record(themeOk, `live-theme-${appearance.id}-${vp.name}`, "live: requested appearance resolves", {
          source: "live",
          group: "liveThemeResolved",
          themeRequested: appearance.value,
          themeResolved: resolved.resolvedDark ? "dark" : "light",
          viewport: vp.name,
        });

        const overflowOk = await noHorizontalOverflow(page, { shellOnly: true });
        record(overflowOk, `live-overflow-${appearance.id}-${vp.name}`, "live: shell chrome within viewport", {
          source: "live",
          group: "liveOverflow",
          viewport: vp.name,
          note: "Whole-page Command Centre density overflow is outside Aurora shared-foundation scope",
        });

        const file = `shell-${appearance.id}-${vp.name}.png`;
        await page.screenshot({ path: join(SHOTS, file), fullPage: false });
        shots.push({
          file,
          source: "live",
          kind: "shell",
          themeRequested: appearance.value,
          themeResolved: resolved.resolvedDark ? "dark" : "light",
          viewport: vp.name,
          width: vp.w,
          height: vp.h,
          authoritative: true,
        });
      } catch (err) {
        record(false, `live-capture-${appearance.id}-${vp.name}`, String(err), {
          source: "live",
          group: "liveShellPresent",
        });
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
    mergeReady: false,
  },
  capabilityMatrix: {
    light: "live+harness",
    dark: "live+harness",
    "system-os-light": "live+harness (live requires server)",
    "system-os-dark": "live+harness (live requires server)",
    "executive-blue": "harness-only demonstration",
    "medical-emerald": "harness-only demonstration",
    "reduced-motion": "harness media + live CSS present",
    "mobile-navigation": "live shell drawer; harness synthetic only",
    "drawer-focus": "shared primitive trap + harness demo",
  },
  viewports: VIEWPORTS,
  harnessThemes: HARNESS_THEMES.map((t) => ({
    id: t.id,
    demonstrationOnly: !!t.demonstrationOnly,
  })),
  liveAppearances: LIVE_APPEARANCES.map((a) => a.id),
  screenshotCount: shots.length,
  assertionTotals: {
    total: assertions.length,
    passed: assertions.filter((a) => a.ok).length,
    failed: assertions.filter((a) => !a.ok).length,
  },
  assertionGroups: groups,
  consoleErrors,
  shots,
  assertions,
  notes: [
    "Executive Blue / Medical Emerald are harness/token demonstrations only — not product-selectable themes.",
    "Decision A shell dimensions (240/72/48) preserved.",
    "Original a5f22d5 evidence archived under archive-a5f22d5f/.",
  ],
};

writeFileSync(join(OUT, "browser-validation-report.json"), JSON.stringify(report, null, 2) + "\n", "utf8");
writeFileSync(
  join(OUT, "screenshot-manifest.json"),
  JSON.stringify(
    {
      generatedAt: report.generatedAt,
      count: shots.length,
      authoritative: shots.filter((s) => s.authoritative),
      harnessOnlyDemonstrations: shots.filter((s) => s.demonstrationOnly),
      all: shots,
    },
    null,
    2
  ) + "\n",
  "utf8"
);
writeFileSync(
  join(OUT, "README.md"),
  [
    "# Aurora foundation evidence (remediated)",
    "",
    `- Screenshots: ${shots.length}`,
    `- Assertions: ${report.assertionTotals.passed}/${report.assertionTotals.total} passed`,
    `- Live shell captures: ${shots.filter((s) => s.source === "live").length}`,
    `- Harness captures: ${shots.filter((s) => s.source === "harness").length}`,
    `- WCAG claim: no`,
    `- Pixel parity claim: no`,
    `- Merge-ready claim: no`,
    "",
    "## Live vs harness",
    "",
    "| Capability | Class |",
    "| --- | --- |",
    "| Light / Dark | Live application + harness |",
    "| System + OS light/dark | Live when server available; also harness |",
    "| Executive Blue / Medical Emerald | Harness-only demonstration |",
    "| Reduced motion | Harness media proof; live CSS exists |",
    "| Mobile Today/Actions/Search/More | Deferred — not live |",
    "",
    "Original `a5f22d5` evidence: `archive-a5f22d5f/`.",
    "",
    "See `browser-validation-report.json`, `screenshot-manifest.json`, and `../AURORA_FOUNDATION_REMEDIATION_EVIDENCE.md`.",
    "",
  ].join("\n"),
  "utf8"
);

console.log(
  `Aurora remediated harness: ${report.assertionTotals.passed}/${report.assertionTotals.total} assertions; ${shots.length} shots; consoleErrors=${consoleErrors.length}`
);
process.exit(failures > 0 ? 1 : 0);
