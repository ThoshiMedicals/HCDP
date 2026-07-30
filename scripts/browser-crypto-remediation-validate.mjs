/**
 * Browser validation for browser-crypto remediation (port 3461).
 * Captures route health, console errors, overflow, and screenshots.
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const BASE = "http://localhost:3461";
const OUT = join(process.cwd(), "docs/audits/browser-crypto-remediation");
mkdirSync(OUT, { recursive: true });

const ROUTES = [
  "/dashboard",
  "/action-inbox",
  "/settings", // M03 organisation-access main route
  "/staff-doctors",
  "/roster",
  "/time-attendance",
  "/staffpay",
  "/staffpay?section=adjustments",
  "/staffpay?section=overview",
];

const WIDTHS = [1440, 1280, 1024, 768, 430, 390];

const ERROR_PATTERNS = [
  /node:crypto/i,
  /UnhandledSchemeError/i,
  /Module not found.*crypto/i,
  /Can't resolve 'node:crypto'/i,
  /hydration/i,
  /Text content does not match/i,
  /did not match\. Server/i,
  /client-server boundary/i,
  /server\/client/i,
];

function isRemediationNoise(text) {
  // Ignore Next.js HMR / React DevTools noise
  if (/Download the React DevTools/i.test(text)) return true;
  if (/\[HMR\]/i.test(text)) return true;
  if (/Fast Refresh/i.test(text)) return true;
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
    ).slice(0, 40);
    const withLabels = focusables.filter((el) => {
      const aria = el.getAttribute("aria-label");
      const labelled = el.getAttribute("aria-labelledby");
      const text = (el.textContent || "").trim();
      const title = el.getAttribute("title");
      return Boolean(aria || labelled || text || title || el.tagName === "INPUT");
    });
    const statusEls = Array.from(
      document.querySelectorAll('[role="status"], [aria-live], .status, [data-status]')
    ).length;
    const tabs = document.querySelectorAll('[role="tab"]').length;
    const tables = document.querySelectorAll("table, [role='table']").length;
    return {
      focusableCount: focusables.length,
      labelledFocusableCount: withLabels.length,
      statusSurfaceCount: statusEls,
      tabCount: tabs,
      tableCount: tables,
      hasMain: Boolean(document.querySelector("main, [role='main']")),
      hasNav: Boolean(document.querySelector("nav, [role='navigation'], aside")),
    };
  });
}

const results = {
  startedAt: new Date().toISOString(),
  base: BASE,
  routes: [],
  widths: [],
  screenshots: [],
  consoleErrors: [],
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
  if (isRemediationNoise(text)) return;
  const hit = ERROR_PATTERNS.some((re) => re.test(text));
  results.consoleErrors.push({ type: msg.type(), text, remediationHit: hit });
  if (hit) results.pass = false;
});

page.on("pageerror", (err) => {
  const text = String(err);
  const hit = ERROR_PATTERNS.some((re) => re.test(text));
  results.consoleErrors.push({ type: "pageerror", text, remediationHit: hit });
  if (hit) results.pass = false;
});

for (const route of ROUTES) {
  const url = `${BASE}${route}`;
  const entry = { route, url, ok: false, status: null, title: null, bodySnippet: null, errors: [] };
  try {
    const resp = await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    entry.status = resp ? resp.status() : null;
    entry.ok = Boolean(resp && resp.ok());
    await page.waitForTimeout(800);
    entry.title = await page.title();
    const bodyText = await page.locator("body").innerText().catch(() => "");
    entry.bodySnippet = bodyText.slice(0, 240).replace(/\s+/g, " ");
    const hasCryptoCrash =
      /UnhandledSchemeError|node:crypto|Can't resolve 'node:crypto'/i.test(bodyText) ||
      (await page.locator("text=UnhandledSchemeError").count()) > 0 ||
      (await page.locator("text=node:crypto").count()) > 0;
    if (hasCryptoCrash) {
      entry.ok = false;
      entry.errors.push("node:crypto / UnhandledSchemeError visible in page");
      results.pass = false;
    }
    if (!entry.ok) results.pass = false;
  } catch (e) {
    entry.ok = false;
    entry.errors.push(String(e));
    results.pass = false;
  }
  results.routes.push(entry);
  console.log(`${entry.ok ? "OK" : "FAIL"} ${route} status=${entry.status}`);
}

// Width matrix on key surfaces
const WIDTH_ROUTES = [
  { route: "/dashboard", name: "dashboard" },
  { route: "/staffpay", name: "staffpay-overview" },
  { route: "/staffpay?section=adjustments", name: "staffpay-adjustments" },
  { route: "/time-attendance", name: "time-attendance" },
  { route: "/roster", name: "roster" },
];

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
    };
    try {
      await page.goto(`${BASE}${route}`, { waitUntil: "networkidle", timeout: 60000 });
      await page.waitForTimeout(500);
      const overflow = await checkOverflow(page);
      row.overflowX = overflow.overflowX;
      row.a11y = await collectA11yBasics(page);
      if (overflow.overflowX) {
        row.ok = false;
        results.pass = false;
      }
      // Required screenshots
      const needShot =
        (name === "dashboard" && (width === 1440 || width === 390)) ||
        (name === "staffpay-overview" && width === 1440) ||
        (name === "staffpay-adjustments" && width === 1440) ||
        ((name === "dashboard" || name === "staffpay-overview") && width === 390);
      if (
        (name === "dashboard" && (width === 1440 || width === 390)) ||
        (name === "staffpay-overview" && (width === 1440 || width === 390)) ||
        (name === "staffpay-adjustments" && (width === 1440 || width === 390))
      ) {
        const file = `${name}-${width}.png`;
        const path = join(OUT, file);
        await page.screenshot({ path, fullPage: true });
        row.screenshot = path;
        results.screenshots.push(path);
      }
      // Shell/nav shots: crop dashboard which shows shell
      if (name === "dashboard" && (width === 1440 || width === 390)) {
        const shellFile = `shell-nav-${width}.png`;
        const shellPath = join(OUT, shellFile);
        await page.screenshot({ path: shellPath, fullPage: false });
        results.screenshots.push(shellPath);
      }
    } catch (e) {
      row.ok = false;
      row.error = String(e);
      results.pass = false;
    }
    results.widths.push(row);
    console.log(
      `${row.ok ? "OK" : "FAIL"} width=${width} ${name} overflowX=${row.overflowX}`
    );
  }
}

// Dark mode spot check on dashboard + staffpay
await page.emulateMedia({ colorScheme: "dark" });
await page.setViewportSize({ width: 1440, height: 900 });
for (const route of ["/dashboard", "/staffpay", "/staffpay?section=adjustments"]) {
  await page.goto(`${BASE}${route}`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(400);
  const file = `dark-${route.replace(/[/?=]/g, "_")}-1440.png`;
  const path = join(OUT, file);
  await page.screenshot({ path, fullPage: false });
  results.screenshots.push(path);
}
await page.emulateMedia({ colorScheme: "light" });

// Keyboard focus smoke on /staffpay
await page.goto(`${BASE}/staffpay`, { waitUntil: "networkidle", timeout: 60000 });
await page.keyboard.press("Tab");
await page.keyboard.press("Tab");
await page.keyboard.press("Tab");
const focused = await page.evaluate(() => {
  const el = document.activeElement;
  if (!el) return null;
  return {
    tag: el.tagName,
    role: el.getAttribute("role"),
    text: (el.textContent || "").trim().slice(0, 80),
  };
});
results.keyboardFocus = focused;

const remediationHits = results.consoleErrors.filter((e) => e.remediationHit);
results.remediationConsoleHits = remediationHits.length;
if (remediationHits.length) results.pass = false;

const reportPath = join(OUT, "browser-validation-report.json");
writeFileSync(reportPath, JSON.stringify(results, null, 2));
console.log("\nREPORT", reportPath);
console.log("PASS", results.pass);
console.log("screenshots", results.screenshots.length);
console.log("remediationConsoleHits", remediationHits.length);

await browser.close();
process.exit(results.pass ? 0 : 1);
