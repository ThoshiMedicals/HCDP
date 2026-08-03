/**
 * Independent verification browser matrix — writes ONLY under
 * docs/audits/ui-batch1-controlled-integration-independent-verification/
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.QA_BASE || "http://localhost:3461";
const OUT = join(
  process.cwd(),
  "docs/audits/ui-batch1-controlled-integration-independent-verification",
  "browser-matrix"
);
mkdirSync(OUT, { recursive: true });

const COMPLETED_SECTIONS = [
  "overview",
  "people",
  "leave",
  "adjustments",
  "exceptions",
  "variances",
  "approval",
  "export",
  "reconciliation",
  "settings",
];
const ALIASES = [
  "/approvals",
  "/tasks",
  "/checklists",
  "/hr-docs",
  "/inventory",
  "/prototype",
];
const WIDTHS = [1440, 1280, 1024, 768, 430, 390];

async function overflow(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const scrollW = Math.max(doc.scrollWidth, body.scrollWidth);
    return { overflowX: scrollW > doc.clientWidth + 1, scrollWidth: scrollW, clientWidth: doc.clientWidth };
  });
}

async function a11y(page) {
  return page.evaluate(() => {
    const focusables = Array.from(
      document.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
    const labelled = focusables.filter((el) => {
      const aria = el.getAttribute("aria-label");
      const labelledBy = el.getAttribute("aria-labelledby");
      const text = (el.textContent || "").trim();
      const title = el.getAttribute("title");
      const id = el.getAttribute("id");
      const labelFor = id ? document.querySelector(`label[for="${CSS.escape(id)}"]`) : null;
      return Boolean(aria || labelledBy || text || title || labelFor);
    });
    const touchOk = focusables.slice(0, 40).filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width >= 24 && r.height >= 24;
    }).length;
    const reducedMotion =
      getComputedStyle(document.documentElement).getPropertyValue("scroll-behavior") !== "" ||
      Boolean(document.querySelector("[data-reduced-motion], .motion-reduce"));
    return {
      focusableCount: focusables.length,
      labelledFocusableCount: labelled.length,
      touchSampleOk: touchOk,
      hasMain: Boolean(document.querySelector("main, [role='main']")),
      hasNav: Boolean(document.querySelector("nav, [role='navigation']")),
      statusSurfaces: document.querySelectorAll('[role="status"], [aria-live], [data-status]').length,
      reducedMotionHint: reducedMotion,
    };
  });
}

async function collectConsole(page, bag) {
  page.on("console", (msg) => {
    const type = msg.type();
    const text = msg.text();
    if (/Download the React DevTools|\[HMR\]|Fast Refresh|favicon/i.test(text)) return;
    bag.push({ type, text, location: msg.location() });
  });
  page.on("pageerror", (err) => {
    bag.push({ type: "pageerror", text: String(err), stack: err.stack });
  });
}

async function main() {
  const report = {
    startedAt: new Date().toISOString(),
    base: BASE,
    tip: "e5e41a0d79c8b84d3380c4c85372dcc95b0a78b8",
    routes: [],
    sections: [],
    aliases: [],
    appearance: {},
    hydrationAdjudication: { messages: [], classification: null },
    pass: true,
  };

  const browser = await chromium.launch({ headless: true });
  const consoleBag = [];

  // Completed M07 sections x widths
  for (const section of COMPLETED_SECTIONS) {
    for (const width of WIDTHS) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        colorScheme: "light",
      });
      const page = await context.newPage();
      const bag = [];
      await collectConsole(page, bag);
      const url = `${BASE}/staffpay?section=${section}`;
      const resp = await page.goto(url, { waitUntil: "networkidle", timeout: 120000 });
      await page.waitForTimeout(500);
      const ov = await overflow(page);
      const a = await a11y(page);
      const row = {
        section,
        width,
        status: resp?.status() ?? 0,
        overflowX: ov.overflowX,
        a11y: a,
        console: bag,
        ok: (resp?.status() ?? 0) === 200 && !ov.overflowX,
      };
      if (!row.ok) report.pass = false;
      report.sections.push(row);
      consoleBag.push(...bag.map((m) => ({ ...m, route: url, width })));
      await context.close();
    }
  }

  // Aliases
  for (const route of ALIASES) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const bag = [];
    await collectConsole(page, bag);
    const resp = await page.goto(`${BASE}${route}`, { waitUntil: "networkidle", timeout: 120000 });
    const finalUrl = page.url();
    const row = {
      route,
      status: resp?.status() ?? 0,
      finalUrl,
      console: bag,
      ok: (resp?.status() ?? 0) < 500,
    };
    if (!row.ok) report.pass = false;
    report.aliases.push(row);
    consoleBag.push(...bag.map((m) => ({ ...m, route })));
    await context.close();
  }

  // Appearance: Light / Dark / System + persist + OS dark
  async function setAppearance(page, label) {
    // Open settings appearance controls — try common selectors used by QC-1
    const candidates = [
      `button:has-text("${label}")`,
      `[role="radio"]:has-text("${label}")`,
      `label:has-text("${label}")`,
      `button[aria-label*="${label}" i]`,
    ];
    for (const sel of candidates) {
      const loc = page.locator(sel).first();
      if (await loc.count()) {
        try {
          await loc.click({ timeout: 3000 });
          return true;
        } catch {}
      }
    }
    // Device setting alias for System
    if (label === "System") {
      for (const alt of ["Device setting", "Device", "System"]) {
        const loc = page.locator(`button:has-text("${alt}"), label:has-text("${alt}")`).first();
        if (await loc.count()) {
          try {
            await loc.click({ timeout: 3000 });
            return true;
          } catch {}
        }
      }
    }
    return false;
  }

  async function readTheme(page) {
    return page.evaluate(() => {
      const root = document.documentElement;
      return {
        className: root.className,
        dataTheme: root.getAttribute("data-theme"),
        colorScheme: getComputedStyle(root).colorScheme,
        stored: localStorage.getItem("hcdp-appearance") || localStorage.getItem("appearance") || null,
      };
    });
  }

  // Light
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "light" });
    const page = await context.newPage();
    await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle", timeout: 120000 });
    const clicked = await setAppearance(page, "Light");
    await page.waitForTimeout(400);
    const before = await readTheme(page);
    await page.reload({ waitUntil: "networkidle" });
    const after = await readTheme(page);
    report.appearance.light = { clicked, before, after, persistOk: Boolean(after.stored || after.className || after.dataTheme) };
    await page.screenshot({ path: join(OUT, "inapp-light-dashboard-1440.png"), fullPage: false });
    await context.close();
  }
  // Dark
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "light" });
    const page = await context.newPage();
    await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle", timeout: 120000 });
    const clicked = await setAppearance(page, "Dark");
    await page.waitForTimeout(400);
    const before = await readTheme(page);
    await page.reload({ waitUntil: "networkidle" });
    const after = await readTheme(page);
    report.appearance.dark = { clicked, before, after, persistOk: Boolean(after.stored || after.className.includes("dark") || after.dataTheme === "dark" || after.colorScheme.includes("dark")) };
    await page.screenshot({ path: join(OUT, "inapp-dark-dashboard-1440.png"), fullPage: false });
    await context.close();
  }
  // System + OS dark
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "dark" });
    const page = await context.newPage();
    await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle", timeout: 120000 });
    const clicked = await setAppearance(page, "System");
    await page.waitForTimeout(500);
    const theme = await readTheme(page);
    report.appearance.systemOsDark = { clicked, theme, osColorScheme: "dark" };
    await page.screenshot({ path: join(OUT, "inapp-system-os-dark-dashboard-1440.png"), fullPage: false });
    await context.close();
  }

  // Hydration adjudication from collected console
  const hydrationLike = consoleBag.filter((m) =>
    /hydration|Text content does not match|did not match\. Server|client-server boundary|server\/client|M04|M05|M07/i.test(
      m.text || ""
    )
  );
  const genuineHydration = consoleBag.filter((m) =>
    /Hydration failed|Text content does not match server-rendered HTML|There was an error while hydrating|did not match\. Server/i.test(
      m.text || ""
    )
  );
  report.hydrationAdjudication = {
    totalConsoleMessages: consoleBag.length,
    broadPatternHits: hydrationLike.length,
    genuineHydrationMismatchHits: genuineHydration.length,
    sampleBroad: hydrationLike.slice(0, 20),
    sampleGenuine: genuineHydration.slice(0, 20),
    classification:
      genuineHydration.length > 0
        ? "GENUINE_HYDRATION_MISMATCH_PRESENT"
        : hydrationLike.length > 0
          ? "BROAD_PATTERN_OR_MODULE_NOISE_ONLY"
          : "NO_HYDRATION_LIKE_CONSOLE",
  };

  report.finishedAt = new Date().toISOString();
  const path = join(OUT, "m07-sections-aliases-appearance-report.json");
  writeFileSync(path, JSON.stringify(report, null, 2));
  writeFileSync(join(OUT, "console-bag.json"), JSON.stringify(consoleBag, null, 2));
  console.log("REPORT", path);
  console.log("PASS", report.pass);
  console.log("HYDRATION", report.hydrationAdjudication.classification);
  await browser.close();
  process.exit(report.pass ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
