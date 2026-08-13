/**
 * P1-B3 register hygiene / payroll-history truthfulness visual harness (remediated).
 *
 * Usage:
 *   HCDP_BASE_URL=http://localhost:3000 node scripts/p1-b3-register-hygiene-harness.mjs
 *
 * LOCAL evidence only — do not claim GitHub CI from this script.
 * No product runtime acceptance hooks. No WCAG / pixel-parity claims.
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.HCDP_BASE_URL || "http://localhost:3000";
if (/127\.0\.0\.1/.test(BASE)) {
  console.error("Use localhost (not 127.0.0.1) for owner-visible harness.");
  process.exit(2);
}

const OUT = join(process.cwd(), "docs/audits/p1/b3-register-hygiene");
const SHOTS = join(OUT, "shots");
mkdirSync(SHOTS, { recursive: true });

const WIDTHS = [1440, 1280, 1024, 768, 430, 390];
const TRAINING_LABELS = [
  "Overview",
  "Course Catalogue",
  "Assignments",
  "Sessions",
  "Assessments",
  "Competencies",
  "Certificates",
  "Exemptions",
  "Evidence",
  "Reports",
  "Policy & Settings",
];

const failures = [];
function fail(msg) {
  failures.push(msg);
  console.error("FAIL:", msg);
}
function check(ok, msg) {
  if (!ok) fail(msg);
  return ok;
}

async function shot(page, name) {
  const path = join(SHOTS, `${name}.png`);
  await page.screenshot({ path, fullPage: false });
  if (!existsSync(path) || statSync(path).size < 2048) {
    fail(`Screenshot missing or too small: ${name}`);
  }
  return path;
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

async function prepare(page, path, { width, height, appearance, colorScheme, ready }) {
  await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
  await page.setViewportSize({ width, height });
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const response = await page.goto(`${BASE}${path}`, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });
      if (response && response.status() >= 500) {
        await page.waitForTimeout(1200);
        continue;
      }
      await page.waitForSelector('[data-testid="shell-topbar"]', {
        timeout: 45000,
        state: "attached",
      });
      await setAppearance(page, appearance);
      // Reload so theme-init + deep-link section sync settle after appearance write.
      const response2 = await page.goto(`${BASE}${path}`, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });
      if (response2 && response2.status() >= 500) {
        await page.waitForTimeout(1200);
        continue;
      }
      await page.waitForSelector('[data-testid="shell-topbar"]', {
        timeout: 45000,
        state: "attached",
      });
      if (ready) {
        await page.waitForSelector(ready, { timeout: 45000, state: "attached" });
        await page.locator(ready).first().scrollIntoViewIfNeeded().catch(() => {});
      }
      await page.waitForTimeout(300);
      return;
    } catch (err) {
      if (attempt === 5) throw err;
      await page.waitForTimeout(1500);
    }
  }
}

async function assertNotLoading(page, context) {
  const text = (await page.locator("body").innerText()) || "";
  if (/Loading Training Management|Loading your actions|Loading…/i.test(text)) {
    fail(`${context}: still showing loading placeholder`);
  }
}

async function assertNoDocOverflow(page, context) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const scrollW = Math.max(doc.scrollWidth, body?.scrollWidth || 0);
    const clientW = doc.clientWidth;
    return { overflow: scrollW > clientW + 1, scrollW, clientW };
  });
  check(!overflow.overflow, `${context}: horizontal overflow scrollW=${overflow.scrollW} clientW=${overflow.clientW}`);
}

async function assertAppearance(page, appearance, expectDark, context) {
  const audit = await page.evaluate(() => ({
    appearance: document.documentElement.getAttribute("data-appearance"),
    themeDark: document.documentElement.classList.contains("theme-dark"),
    osDark: window.matchMedia("(prefers-color-scheme: dark)").matches,
  }));
  check(audit.appearance === appearance, `${context}: data-appearance=${audit.appearance} expected ${appearance}`);
  check(audit.themeDark === expectDark, `${context}: themeDark=${audit.themeDark} expected ${expectDark}`);
  return audit;
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const results = {
    base: BASE,
    shots: [],
    checks: [],
    appearanceMatrix: [],
    responsiveMatrix: [],
    localOnly: true,
    githubCi: false,
    claims: {
      wcag: false,
      pixelParity: false,
      productionApproval: false,
    },
  };

  try {
    // --- Appearance matrix: Light / Dark / System+OS Light / System+OS Dark ---
    const appearanceCases = [
      { id: "light", appearance: "light", colorScheme: "light", expectDark: false, shot: "01-training-nav-1440-light" },
      { id: "dark", appearance: "dark", colorScheme: "dark", expectDark: true, shot: "02-training-nav-1440-dark" },
      { id: "system-os-light", appearance: "system", colorScheme: "light", expectDark: false, shot: "09-training-nav-1440-system-os-light" },
      { id: "system-os-dark", appearance: "system", colorScheme: "dark", expectDark: true, shot: "10-training-nav-1440-system-os-dark" },
    ];

    for (const spec of appearanceCases) {
      const page = await browser.newPage({
        viewport: { width: 1440, height: 900 },
        colorScheme: spec.colorScheme,
      });
      await prepare(page, "/training", {
        width: 1440,
        height: 900,
        appearance: spec.appearance,
        colorScheme: spec.colorScheme,
      });
      const nav = page.locator('nav[aria-label="Training Management sections"]');
      await nav.waitFor({ state: "visible", timeout: 20000 });
      await assertNotLoading(page, `appearance:${spec.id}`);
      for (const label of TRAINING_LABELS) {
        const hit = await nav.getByRole("button", { name: label, exact: true }).count();
        check(hit > 0, `appearance:${spec.id} missing Training nav label: ${label}`);
      }
      const audit = await assertAppearance(page, spec.appearance, spec.expectDark, `appearance:${spec.id}`);
      await assertNoDocOverflow(page, `appearance:${spec.id}`);
      results.shots.push(await shot(page, spec.shot));
      results.appearanceMatrix.push({ ...spec, ...audit, ok: true });
      results.checks.push({ id: `appearance-${spec.id}`, ok: failures.length === 0 });
      await page.close();
    }

    // Distinctness: System+OS Light must not equal Dark theme, System+OS Dark must be dark
    const sysLight = results.appearanceMatrix.find((r) => r.id === "system-os-light");
    const sysDark = results.appearanceMatrix.find((r) => r.id === "system-os-dark");
    const light = results.appearanceMatrix.find((r) => r.id === "light");
    const dark = results.appearanceMatrix.find((r) => r.id === "dark");
    check(sysLight && !sysLight.themeDark, "System+OS Light must resolve light");
    check(sysDark && sysDark.themeDark, "System+OS Dark must resolve dark");
    check(light && !light.themeDark && dark && dark.themeDark, "Light/Dark must be distinct theme states");

    // --- Alias / deep-link behaviour ---
    {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: "light" });
      await prepare(page, "/training?section=records", {
        width: 1440,
        height: 900,
        appearance: "light",
        colorScheme: "light",
      });
      const navRecords = page.locator('nav[aria-label="Training Management sections"]');
      await navRecords.waitFor({ state: "visible", timeout: 20000 });
      await page.waitForFunction(() => {
        const nav = document.querySelector('nav[aria-label="Training Management sections"]');
        if (!nav) return false;
        const btn = [...nav.querySelectorAll("button")].find(
          (b) => (b.textContent || "").trim() === "Assignments"
        );
        return btn?.getAttribute("aria-current") === "page";
      }, null, { timeout: 20000 });
      const assignments = navRecords.getByRole("button", { name: "Assignments", exact: true });
      check(
        (await assignments.getAttribute("aria-current")) === "page",
        "legacy alias records → assignments: Assignments not aria-current=page"
      );
      results.shots.push(await shot(page, "11-training-alias-records-assignments-1440-light"));

      await prepare(page, "/training?section=expiry", {
        width: 1440,
        height: 900,
        appearance: "light",
        colorScheme: "light",
      });
      const navExpiry = page.locator('nav[aria-label="Training Management sections"]');
      await navExpiry.waitFor({ state: "visible", timeout: 20000 });
      await page.waitForFunction(() => {
        const nav = document.querySelector('nav[aria-label="Training Management sections"]');
        if (!nav) return false;
        const btn = [...nav.querySelectorAll("button")].find(
          (b) => (b.textContent || "").trim() === "Certificates"
        );
        return btn?.getAttribute("aria-current") === "page";
      }, null, { timeout: 20000 });
      const certificates = navExpiry.getByRole("button", { name: "Certificates", exact: true });
      check(
        (await certificates.getAttribute("aria-current")) === "page",
        "legacy alias expiry → certificates: Certificates not aria-current=page"
      );
      results.shots.push(await shot(page, "12-training-alias-expiry-certificates-1440-light"));
      await page.close();
    }

    // --- History planned honesty + a11y activation block (desktop) ---
    {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: "light" });
      await prepare(page, "/staffpay?section=history", {
        width: 1440,
        height: 900,
        appearance: "light",
        colorScheme: "light",
      });
      const plannedRoot = page.locator("[data-m07-planned='true'][data-m07-section='history']");
      await plannedRoot.waitFor({ state: "visible", timeout: 20000 });
      await assertNotLoading(page, "history-desktop");
      const body = (await plannedRoot.textContent()) || "";
      check(/Planned — not yet available/i.test(body), "History missing Planned — not yet available");
      check(/not operational/i.test(body), "History missing not-operational copy");
      const action = page.getByRole("button", { name: /Actions unavailable/i });
      await action.waitFor({ state: "visible" });
      check((await action.getAttribute("aria-disabled")) === "true", "History action missing aria-disabled=true");
      const described = await action.getAttribute("aria-describedby");
      check(!!described, "History action missing aria-describedby");
      const name = (await action.getAttribute("aria-label")) || (await action.innerText());
      check(/not yet available/i.test(name), `History accessible name weak: ${name}`);
      await action.focus();
      const focused = await page.evaluate(() => document.activeElement?.textContent || "");
      check(/Actions unavailable/i.test(focused), "History action not keyboard-focusable");
      // Blocked activation — no toast / success
      await action.click({ force: true });
      await action.press("Enter");
      await action.press(" ");
      const after = (await page.locator("body").innerText()) || "";
      check(!/History ready|History complete|opened successfully/i.test(after), "History activation produced success feedback");
      check(!(await page.locator('[role="status"]').filter({ hasText: /success|ready|complete/i }).count()), "History toast/success status appeared");
      results.shots.push(await shot(page, "03-history-planned-1440-light-focus"));
      await page.close();
    }

    // --- Adjustments honesty (desktop light + dark) ---
    for (const [appearance, colorScheme, shotName] of [
      ["light", "light", "04-adjustments-honesty-1440-light"],
      ["dark", "dark", "08-adjustments-honesty-1440-dark"],
    ]) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, colorScheme });
      await prepare(page, "/staffpay?section=adjustments", {
        width: 1440,
        height: 900,
        appearance,
        colorScheme,
      });
      const section = page.locator('[data-m07-section="adjustments"]');
      await section.waitFor({ state: "visible", timeout: 45000 });
      await assertNotLoading(page, `adjustments-${appearance}`);
      const heading = page.locator("#m07-adjustments-heading");
      await heading.waitFor({ state: "visible", timeout: 20000 });
      const hText = (await heading.textContent()) || "";
      check(!/Prior-period adjustments/i.test(hText), "Adjustments heading still says Prior-period adjustments");
      check(/Adjustments/i.test(hText), "Adjustments heading missing");
      const sectionText = (await section.textContent()) || "";
      check(/not authorised PPA product/i.test(sectionText), "Adjustments missing not-authorised-PPA honesty");
      check(/Unlock\/reopen is not PPA/i.test(sectionText), "Adjustments missing unlock≠PPA distinction");
      check(!/PPA-1 foundation · available/i.test(sectionText), "Adjustments still shows PPA-1 foundation · available");
      results.shots.push(await shot(page, shotName));
      await page.close();
    }

    // --- Mobile History + Adjustments (distinct waits) ---
    {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, colorScheme: "light" });
      await prepare(page, "/staffpay?section=history", {
        width: 390,
        height: 844,
        appearance: "light",
        colorScheme: "light",
      });
      await page.locator("[data-m07-planned='true'][data-m07-section='history']").waitFor({
        state: "visible",
        timeout: 20000,
      });
      results.shots.push(await shot(page, "05-history-planned-390-light"));

      await prepare(page, "/staffpay?section=adjustments", {
        width: 390,
        height: 844,
        appearance: "light",
        colorScheme: "light",
      });
      await page.locator('[data-m07-section="adjustments"]').waitFor({ state: "visible", timeout: 20000 });
      await page.locator("#m07-adjustments-heading").waitFor({ state: "visible", timeout: 20000 });
      results.shots.push(await shot(page, "06-adjustments-honesty-390-light"));
      await page.close();
    }

    // Legacy system sample retained for continuity with prior pack
    {
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, colorScheme: "light" });
      await prepare(page, "/staffpay?section=history", {
        width: 1280,
        height: 800,
        appearance: "system",
        colorScheme: "light",
      });
      await page.locator("[data-m07-planned='true']").waitFor({ state: "visible", timeout: 20000 });
      results.shots.push(await shot(page, "07-history-planned-1280-system"));
      await page.close();
    }

    // --- Responsive overflow matrix ---
    for (const width of WIDTHS) {
      for (const route of [
        { path: "/training", key: "training", ready: 'nav[aria-label="Training Management sections"]' },
        { path: "/staffpay?section=history", key: "history", ready: "[data-m07-planned='true']" },
        { path: "/staffpay?section=adjustments", key: "adjustments", ready: '[data-m07-section="adjustments"]' },
      ]) {
        const page = await browser.newPage({
          viewport: { width, height: width <= 430 ? 844 : 900 },
          colorScheme: "light",
        });
        await prepare(page, route.path, {
          width,
          height: width <= 430 ? 844 : 900,
          appearance: "light",
          colorScheme: "light",
        });
        await page.locator(route.ready).waitFor({ state: "visible", timeout: 20000 });
        await assertNotLoading(page, `responsive:${route.key}@${width}`);
        const before = failures.length;
        await assertNoDocOverflow(page, `responsive:${route.key}@${width}`);
        results.responsiveMatrix.push({
          width,
          route: route.key,
          ok: failures.length === before,
        });
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }

  results.ok = failures.length === 0;
  results.failures = failures;
  results.shotCount = results.shots.length;
  writeFileSync(join(OUT, "harness-report.json"), JSON.stringify(results, null, 2));
  writeFileSync(
    join(OUT, "HARVEST.md"),
    [
      "# P1-B3 harness harvest (remediated)",
      "",
      `- Base: ${BASE}`,
      `- Local-only: yes`,
      `- GitHub CI: none claimed`,
      `- Failures: ${failures.length ? failures.join("; ") : "[]"}`,
      `- Shots: ${results.shots.length}`,
      `- Appearance cases: Light, Dark, System+OS Light, System+OS Dark`,
      `- Responsive widths: ${WIDTHS.join(", ")}`,
      `- Original a80405dd evidence archived under archive-a80405dd/`,
      `- No WCAG or pixel-parity claim`,
      "",
    ].join("\n")
  );

  if (failures.length) {
    console.error(JSON.stringify(results, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify(results, null, 2));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
