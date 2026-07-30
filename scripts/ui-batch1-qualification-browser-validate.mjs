/**
 * QC-1 browser validation — UI Batch 1 qualification completion.
 * Exercises in-app Appearance selector (Light/Dark/Device setting), not OS colorScheme alone.
 * Port default 3463. Evidence under docs/audits/ui-batch1-qualification-completion/.
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.QA_BASE || "http://localhost:3463";
const OUT = join(process.cwd(), "docs/audits/ui-batch1-qualification-completion");
mkdirSync(OUT, { recursive: true });

const ROUTES = [
  "/dashboard",
  "/action-inbox",
  "/settings",
  "/staff-doctors",
  "/roster",
  "/time-attendance",
  "/staffpay",
  "/staffpay?section=overview",
  "/staffpay?section=adjustments",
];

const ALIAS_ROUTES = [
  "/approvals",
  "/tasks",
  "/checklists",
  "/hr-docs",
  "/inventory",
  "/prototype",
];

const WIDTHS = [1440, 1280, 1024, 768, 430, 390];

const ERROR_PATTERNS = [
  /node:crypto/i,
  /UnhandledSchemeError/i,
  /Module not found.*crypto/i,
  /Can't resolve 'node:crypto'/i,
];

function isNoise(text) {
  if (/Download the React DevTools/i.test(text)) return true;
  if (/\[HMR\]/i.test(text)) return true;
  if (/Fast Refresh/i.test(text)) return true;
  if (/favicon/i.test(text)) return true;
  return false;
}

async function checkOverflow(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const scrollW = Math.max(doc.scrollWidth, body.scrollWidth);
    const clientW = doc.clientWidth;
    return {
      overflowX: scrollW > clientW + 1,
      scrollWidth: scrollW,
      clientWidth: clientW,
    };
  });
}

async function collectA11yBasics(page) {
  return page.evaluate(() => {
    const focusables = Array.from(
      document.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).slice(0, 80);
    const withLabels = focusables.filter((el) => {
      const aria = el.getAttribute("aria-label");
      const labelled = el.getAttribute("aria-labelledby");
      const text = (el.textContent || "").trim();
      const title = el.getAttribute("title");
      const id = el.getAttribute("id");
      const labelFor = id ? document.querySelector(`label[for="${CSS.escape(id)}"]`) : null;
      return Boolean(aria || labelled || text || title || labelFor || el.tagName === "INPUT");
    });
    const statusEls = document.querySelectorAll('[role="status"], [role="alert"], [aria-live]').length;
    return {
      focusableCount: focusables.length,
      labelledFocusableCount: withLabels.length,
      statusSurfaceCount: statusEls,
      hasMain: Boolean(document.querySelector("main, [role='main']")),
      hasNav: Boolean(document.querySelector("nav, [role='navigation'], aside")),
    };
  });
}

async function readAppearanceState(page) {
  return page.evaluate(() => {
    let stored = null;
    try {
      stored = JSON.parse(window.localStorage.getItem("pulse.cc.appearance") || "null");
    } catch {
      stored = window.localStorage.getItem("pulse.cc.appearance");
    }
    return {
      stored,
      themeDark: document.body.classList.contains("theme-dark"),
      selectValue: document.querySelector('select[aria-label="Appearance"]')?.value ?? null,
      canvas: getComputedStyle(document.body).backgroundColor,
    };
  });
}

async function setInAppAppearance(page, value) {
  const sel = page.locator('select[aria-label="Appearance"]');
  await sel.first().waitFor({ state: "visible", timeout: 30000 });
  // Ensure onChange fires even when target equals current value.
  const current = await sel.first().inputValue();
  if (current === value) {
    const bounce = value === "dark" ? "light" : "dark";
    await sel.first().selectOption(bounce);
    await page.waitForTimeout(250);
  }
  await sel.first().selectOption(value);
  await page.waitForTimeout(600);
  await page.waitForFunction(
    (expected) => {
      const selEl = document.querySelector('select[aria-label="Appearance"]');
      const storedRaw = window.localStorage.getItem("pulse.cc.appearance");
      let stored = null;
      try {
        stored = storedRaw ? JSON.parse(storedRaw) : null;
      } catch {
        stored = storedRaw;
      }
      const dark = document.body.classList.contains("theme-dark");
      const expectDark =
        expected === "dark" ||
        (expected === "system" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);
      return selEl?.value === expected && stored === expected && dark === expectDark;
    },
    value,
    { timeout: 15000 }
  );
  return readAppearanceState(page);
}

const results = {
  startedAt: new Date().toISOString(),
  base: BASE,
  lane: "ui-batch1-qualification-completion",
  routes: [],
  coldWarm: [],
  aliases: [],
  widths: [],
  screenshots: [],
  consoleErrors: [],
  appearance: [],
  chromeTruthfulness: null,
  mobilePrimary: null,
  keyboardFocus: null,
  organisationAccess404: null,
  pass: true,
};

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  colorScheme: "light",
  reducedMotion: "reduce",
});
const page = await context.newPage();

page.on("console", (msg) => {
  if (msg.type() !== "error" && msg.type() !== "warning") return;
  const text = msg.text();
  if (isNoise(text)) return;
  const hit = ERROR_PATTERNS.some((re) => re.test(text));
  results.consoleErrors.push({ type: msg.type(), text, cryptoHit: hit });
  if (hit) results.pass = false;
});

page.on("pageerror", (err) => {
  const text = String(err);
  const hit = ERROR_PATTERNS.some((re) => re.test(text));
  results.consoleErrors.push({ type: "pageerror", text, cryptoHit: hit });
  if (hit) results.pass = false;
});

async function shot(pageRef, file) {
  const path = join(OUT, file);
  await pageRef.screenshot({ path, fullPage: false });
  results.screenshots.push(path.replace(/\\/g, "/"));
  return path;
}

async function visit(route, { waitUntil = "domcontentloaded", timeout = 90000, countTowardPass = true } = {}) {
  const url = `${BASE}${route}`;
  const entry = {
    route,
    url,
    ok: false,
    status: null,
    finalUrl: null,
    title: null,
    bodySnippet: null,
    cryptoCrash: false,
    errors: [],
  };
  try {
    const resp = await page.goto(url, { waitUntil, timeout });
    entry.status = resp ? resp.status() : null;
    entry.finalUrl = page.url();
    entry.ok = Boolean(resp && resp.ok());
    await page.waitForTimeout(700);
    entry.title = await page.title();
    const bodyText = await page.locator("body").innerText().catch(() => "");
    entry.bodySnippet = bodyText.slice(0, 280).replace(/\s+/g, " ");
    entry.cryptoCrash =
      /UnhandledSchemeError|node:crypto|Can't resolve 'node:crypto'/i.test(bodyText) ||
      (await page.locator("text=UnhandledSchemeError").count()) > 0 ||
      (await page.locator("text=node:crypto").count()) > 0;
    if (entry.cryptoCrash) {
      entry.ok = false;
      entry.errors.push("node:crypto / UnhandledSchemeError visible");
      if (countTowardPass) results.pass = false;
    }
    if (!entry.ok && countTowardPass) results.pass = false;
  } catch (e) {
    entry.ok = false;
    entry.errors.push(String(e));
    if (countTowardPass) results.pass = false;
  }
  return entry;
}

// Cold + warm dashboard (OD-MIN-01: report honestly; do not product-fix)
console.log("--- cold/warm dashboard ---");
const cold = await visit("/dashboard", {
  waitUntil: "domcontentloaded",
  countTowardPass: false,
});
results.coldWarm.push({ pass: "cold", ...cold });
console.log(`${cold.ok ? "OK" : "DEFER"} cold /dashboard status=${cold.status}`);
const warm = await visit("/dashboard", { waitUntil: "domcontentloaded" });
results.coldWarm.push({ pass: "warm", ...warm });
console.log(`${warm.ok ? "OK" : "FAIL"} warm /dashboard status=${warm.status}`);
results.deferredColdDashboardFlake = {
  deferred: !cold.ok && warm.ok,
  decision: "OD-MIN-01",
  coldOk: cold.ok,
  coldStatus: cold.status,
  warmOk: warm.ok,
  warmStatus: warm.status,
};

// OD-MIN-02: /organisation-access 404 accepted as non-defect
{
  const resp = await page.goto(`${BASE}/organisation-access`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  results.organisationAccess404 = {
    status: resp ? resp.status() : null,
    acceptedAsNonDefect: true,
  };
  console.log(`INFO /organisation-access status=${results.organisationAccess404.status} (accepted non-defect)`);
}

for (const route of ROUTES) {
  const entry = await visit(route, { waitUntil: "domcontentloaded" });
  results.routes.push(entry);
  console.log(`${entry.ok ? "OK" : "FAIL"} ${route} status=${entry.status}`);
}

for (const route of ALIAS_ROUTES) {
  const entry = {
    route,
    status: null,
    finalUrl: null,
    redirected: false,
    ok: false,
  };
  try {
    const resp = await page.goto(`${BASE}${route}`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    entry.status = resp ? resp.status() : null;
    entry.finalUrl = page.url();
    entry.redirected = !entry.finalUrl.endsWith(route) && entry.finalUrl !== `${BASE}${route}`;
    entry.ok = Boolean(resp && (resp.status() === 200 || resp.status() === 307 || resp.status() === 308 || entry.redirected));
    if (!entry.ok) results.pass = false;
  } catch (e) {
    entry.error = String(e);
    results.pass = false;
  }
  results.aliases.push(entry);
  console.log(`${entry.ok ? "OK" : "FAIL"} alias ${route} -> ${entry.finalUrl} status=${entry.status}`);
}

// Chrome truthfulness on dashboard
await page.setViewportSize({ width: 1440, height: 900 });
await visit("/dashboard", { waitUntil: "domcontentloaded" });
results.chromeTruthfulness = await page.evaluate(() => {
  const text = document.body.innerText || "";
  const buttons = Array.from(document.querySelectorAll("button")).map((b) =>
    (b.textContent || "").trim()
  );
  const hasSimulateOutage = buttons.some((t) => /simulate outage/i.test(t));
  const hasStartIntervention = buttons.some((t) => /^start intervention$/i.test(t));
  const hasReviewSignIn = buttons.some((t) => /review sign-in journey/i.test(t));
  const hasNonOperational = /non-operational/i.test(text);
  const hasAccessNav = Boolean(
    Array.from(document.querySelectorAll("a")).some((a) =>
      /review access controls/i.test(a.textContent || "")
    )
  );
  const hasEmergencyNav = Boolean(
    Array.from(document.querySelectorAll("a")).some((a) =>
      /open emergency control/i.test(a.textContent || "")
    )
  );
  return {
    hasSimulateOutage,
    hasStartIntervention,
    hasReviewSignIn,
    hasNonOperational,
    hasAccessNav,
    hasEmergencyNav,
    toastOnlyButtonsAbsent: !hasSimulateOutage && !hasStartIntervention && !hasReviewSignIn,
  };
});
if (!results.chromeTruthfulness.toastOnlyButtonsAbsent || !results.chromeTruthfulness.hasNonOperational) {
  results.pass = false;
}
console.log("chromeTruthfulness", JSON.stringify(results.chromeTruthfulness));

const WIDTH_ROUTES = [
  { route: "/dashboard", name: "dashboard" },
  { route: "/action-inbox", name: "action-inbox" },
  { route: "/settings", name: "organisation-access" },
  { route: "/staff-doctors", name: "staff-doctors" },
  { route: "/roster", name: "roster" },
  { route: "/time-attendance", name: "time-attendance" },
  { route: "/staffpay?section=overview", name: "staffpay-overview" },
  { route: "/staffpay?section=adjustments", name: "staffpay-adjustments" },
];

const REQUIRED_SHOTS = new Set([
  "dashboard-1440",
  "dashboard-390",
  "shell-nav-1440",
  "shell-nav-390",
  "action-inbox-1440",
  "action-inbox-390",
  "organisation-access-1440",
  "organisation-access-390",
  "staff-doctors-1440",
  "staff-doctors-390",
  "roster-1440",
  "roster-390",
  "time-attendance-1440",
  "time-attendance-390",
  "staffpay-overview-1440",
  "staffpay-overview-390",
  "staffpay-adjustments-1440",
  "staffpay-adjustments-390",
]);

for (const width of WIDTHS) {
  await page.setViewportSize({ width, height: 900 });
  for (const { route, name } of WIDTH_ROUTES) {
    const row = {
      width,
      route,
      name,
      overflowX: false,
      a11y: null,
      screenshot: null,
      ok: true,
      flake: false,
    };
    try {
      await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded", timeout: 90000 });
      await page.waitForTimeout(500);
      const overflow = await checkOverflow(page);
      row.overflowX = overflow.overflowX;
      row.a11y = await collectA11yBasics(page);
      if (overflow.overflowX) {
        row.ok = false;
        results.pass = false;
      }
      const key = `${name}-${width}`;
      if (REQUIRED_SHOTS.has(key)) {
        row.screenshot = await shot(page, `${key}.png`);
      }
      if (name === "dashboard" && (width === 1440 || width === 390)) {
        await shot(page, `shell-nav-${width}.png`);
      }
    } catch (e) {
      row.ok = false;
      row.error = String(e);
      if (name === "roster" && /Timeout|networkidle/i.test(String(e))) {
        row.flake = true;
        row.ok = true; // OD-MIN-03 harness flake deferral — still confirm render separately
      } else {
        results.pass = false;
      }
    }
    results.widths.push(row);
    console.log(
      `${row.ok ? "OK" : "FAIL"} width=${width} ${name} overflowX=${row.overflowX}${row.flake ? " (flake-deferred)" : ""}`
    );
  }
}

// OD-MIN-03: separately confirm roster renders without overflow
await page.setViewportSize({ width: 1024, height: 900 });
{
  const entry = await visit("/roster", { waitUntil: "domcontentloaded" });
  const overflow = await checkOverflow(page);
  results.rosterConfirm = { ...entry, overflowX: overflow.overflowX };
  if (!entry.ok || overflow.overflowX) results.pass = false;
  console.log(
    `${entry.ok && !overflow.overflowX ? "OK" : "FAIL"} roster confirm status=${entry.status} overflowX=${overflow.overflowX}`
  );
}

// Mobile primary-task reachability (F-MIN-05)
for (const width of [430, 390]) {
  await page.setViewportSize({ width, height: 900 });
  await visit("/dashboard", { waitUntil: "domcontentloaded" });
  const mobile = await page.evaluate(() => {
    const hamburger =
      document.querySelector('[aria-label*="menu" i], button[aria-expanded]') ||
      Array.from(document.querySelectorAll("button")).find((b) =>
        /menu|nav/i.test(b.getAttribute("aria-label") || b.textContent || "")
      );
    const primaryLinks = Array.from(document.querySelectorAll("a")).filter((a) => {
      const t = (a.textContent || "").trim();
      return /review access controls|open emergency control|open staging review|staff pay|action inbox/i.test(
        t
      );
    });
    const truncatedLabels = Array.from(document.querySelectorAll(".truncate")).slice(0, 8).map((el) => ({
      text: (el.textContent || "").trim().slice(0, 60),
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      clipped: el.scrollWidth > el.clientWidth + 1,
    }));
    return {
      hasHamburgerOrNav: Boolean(hamburger || document.querySelector("nav, aside")),
      primaryLinkCount: primaryLinks.length,
      primaryVisible: primaryLinks.some((a) => {
        const r = a.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      }),
      truncatedLabels,
    };
  });
  results.mobilePrimary = results.mobilePrimary || {};
  results.mobilePrimary[width] = mobile;
  if (!mobile.primaryVisible) results.pass = false;
  await shot(page, `dashboard-mobile-primary-${width}.png`);
  console.log(`mobile ${width}`, JSON.stringify(mobile));
}

try {
  // F-MIN-04: in-app appearance Light / Dark / System (dashboard selector)
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle", timeout: 120000 });
  await page.waitForTimeout(1500);

  for (const mode of [
    { value: "light", expectDark: false, label: "Light" },
    { value: "dark", expectDark: true, label: "Dark" },
    { value: "system", expectDark: null, label: "Device setting" },
  ]) {
    const state = await setInAppAppearance(page, mode.value);
    const expectDark =
      mode.expectDark === null
        ? state.themeDark ===
          (await page.evaluate(() => window.matchMedia("(prefers-color-scheme: dark)").matches))
        : state.themeDark === mode.expectDark;
    const ok =
      state.stored === mode.value && state.selectValue === mode.value && expectDark;
    const row = { mode: mode.label, value: mode.value, ...state, ok };
    results.appearance.push(row);
    if (!ok) results.pass = false;
    await shot(page, `inapp-${mode.value}-dashboard-1440.png`);
    console.log(`${ok ? "OK" : "FAIL"} appearance ${mode.label}`, JSON.stringify(state));
  }

  // Persist dark across navigation (staffpay) then reload — no selector on staffpay
  {
    await setInAppAppearance(page, "dark");
    await visit("/staffpay?section=overview", { waitUntil: "domcontentloaded" });
    await page.waitForFunction(
      () =>
        document.body.classList.contains("theme-dark") &&
        JSON.parse(localStorage.getItem("pulse.cc.appearance") || "null") === "dark",
      null,
      { timeout: 15000 }
    );
    const afterNav = await readAppearanceState(page);
    await shot(page, "inapp-dark-staffpay-overview-1440.png");
    await visit("/staffpay?section=adjustments", { waitUntil: "domcontentloaded" });
    await page.waitForFunction(
      () => document.body.classList.contains("theme-dark"),
      null,
      { timeout: 15000 }
    );
    const afterAdj = await readAppearanceState(page);
    await shot(page, "inapp-dark-staffpay-adjustments-1440.png");
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(
      () =>
        document.body.classList.contains("theme-dark") &&
        JSON.parse(localStorage.getItem("pulse.cc.appearance") || "null") === "dark",
      null,
      { timeout: 20000 }
    );
    const afterReload = await readAppearanceState(page);
    const persistOk =
      afterNav.themeDark &&
      afterNav.stored === "dark" &&
      afterAdj.themeDark &&
      afterAdj.stored === "dark" &&
      afterReload.themeDark &&
      afterReload.stored === "dark";
    results.appearance.push({
      mode: "persist-nav-reload",
      afterNav,
      afterAdj,
      afterReload,
      ok: persistOk,
    });
    if (!persistOk) results.pass = false;
    console.log(
      `${persistOk ? "OK" : "FAIL"} appearance persist`,
      JSON.stringify({ afterNav, afterAdj, afterReload })
    );
  }

  await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle", timeout: 120000 });
  await page.waitForTimeout(1000);
  await setInAppAppearance(page, "light");
  await visit("/staffpay?section=overview", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    () => !document.body.classList.contains("theme-dark"),
    null,
    { timeout: 15000 }
  );
  await shot(page, "inapp-light-staffpay-overview-1440.png");
  await visit("/staffpay?section=adjustments", { waitUntil: "domcontentloaded" });
  await shot(page, "inapp-light-staffpay-adjustments-1440.png");

  // Keyboard focus smoke on staffpay
  await visit("/staffpay", { waitUntil: "domcontentloaded" });
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  results.keyboardFocus = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return null;
    const cs = getComputedStyle(el);
    return {
      tag: el.tagName,
      role: el.getAttribute("role"),
      text: (el.textContent || "").trim().slice(0, 80),
      outline: cs.outlineStyle,
      outlineWidth: cs.outlineWidth,
    };
  });
  console.log("keyboardFocus", JSON.stringify(results.keyboardFocus));
} catch (e) {
  results.pass = false;
  results.appearanceError = String(e);
  console.log("FAIL appearance block", String(e));
} finally {
  const cryptoHits = results.consoleErrors.filter((e) => e.cryptoHit);
  results.cryptoConsoleHits = cryptoHits.length;
  if (cryptoHits.length) results.pass = false;
  results.finishedAt = new Date().toISOString();

  const reportPath = join(OUT, "browser-validation-report.json");
  writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log("\nREPORT", reportPath);
  console.log("PASS", results.pass);
  console.log("screenshots", results.screenshots.length);
  console.log("cryptoConsoleHits", cryptoHits.length);
  console.log("consoleErrors", results.consoleErrors.length);

  await browser.close();
  process.exit(results.pass ? 0 : 1);
}
