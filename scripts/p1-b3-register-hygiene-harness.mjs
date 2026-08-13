/**
 * P1-B3 register hygiene / payroll-history truthfulness visual harness.
 *
 * Usage:
 *   HCDP_BASE_URL=http://localhost:3000 node scripts/p1-b3-register-hygiene-harness.mjs
 *
 * LOCAL evidence only — do not claim GitHub CI from this script.
 * No product runtime acceptance hooks.
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.HCDP_BASE_URL || "http://localhost:3000";
if (/127\.0\.0\.1/.test(BASE)) {
  console.error("Use localhost (not 127.0.0.1) for owner-visible harness.");
  process.exit(2);
}

const OUT = join(process.cwd(), "docs/audits/p1/b3-register-hygiene");
const SHOTS = join(OUT, "shots");
mkdirSync(SHOTS, { recursive: true });

const failures = [];
function fail(msg) {
  failures.push(msg);
  console.error("FAIL:", msg);
}

async function shot(page, name) {
  const path = join(SHOTS, `${name}.png`);
  await page.screenshot({ path, fullPage: false });
  return path;
}

async function ensureReady(page) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.waitForSelector('[data-testid="shell-topbar"]', { timeout: 45000, state: "attached" });
      await page.waitForTimeout(500);
      return;
    } catch (err) {
      if (attempt === 2) throw err;
      await page.reload({ waitUntil: "domcontentloaded" });
    }
  }
}

async function gotoReady(page, path) {
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const response = await page.goto(`${BASE}${path}`, { waitUntil: "commit", timeout: 60000 });
      if (response && response.status() >= 500) {
        await page.waitForTimeout(1200);
        continue;
      }
      await ensureReady(page);
      return;
    } catch (err) {
      if (attempt === 5) throw err;
      await page.waitForTimeout(1500);
    }
  }
}

async function setAppearance(page, value) {
  await page.evaluate((v) => {
    localStorage.setItem("pulse.cc.appearance", JSON.stringify(v));
    window.dispatchEvent(new Event("storage"));
  }, value);
  await page.waitForTimeout(400);
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const results = { base: BASE, shots: [], checks: [], localOnly: true, githubCi: false };

  try {
    // Desktop light — Training nav (M11)
    {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await gotoReady(page, "/training");
      await setAppearance(page, "light");
      await gotoReady(page, "/training");
      const nav = page.locator('nav[aria-label="Training Management sections"]');
      await nav.waitFor({ state: "visible", timeout: 20000 });
      const labels = await nav.locator("button, a, [role='button']").allTextContents();
      const joined = labels.join(" | ");
      const expected = [
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
      for (const label of expected) {
        if (!joined.includes(label) && !(await page.getByText(label, { exact: true }).count())) {
          // Section buttons may use exact label text
          const hit = await page.getByRole("button", { name: label }).count();
          if (!hit) fail(`Training nav missing section label: ${label}`);
        }
      }
      results.shots.push(await shot(page, "01-training-nav-1440-light"));
      results.checks.push({ id: "m11-nav-light", ok: failures.length === 0 });
      await page.close();
    }

    // Desktop dark — Training
    {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await gotoReady(page, "/training");
      await setAppearance(page, "dark");
      await gotoReady(page, "/training");
      results.shots.push(await shot(page, "02-training-nav-1440-dark"));
      await page.close();
    }

    // History planned honesty
    {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await gotoReady(page, "/staffpay?section=history");
      await setAppearance(page, "light");
      await gotoReady(page, "/staffpay?section=history");
      const plannedRoot = page.locator("[data-m07-planned='true']");
      await plannedRoot.waitFor({ state: "visible", timeout: 20000 });
      const body = (await plannedRoot.textContent()) || "";
      if (!/Planned/i.test(body)) fail("History missing Planned status text");
      if (!/not (yet available|operational)/i.test(body)) {
        fail("History missing non-operational honesty copy");
      }
      const action = page.getByRole("button", { name: /Actions unavailable/i });
      await action.focus();
      const described = await action.getAttribute("aria-describedby");
      if (!described) fail("History unavailable control missing aria-describedby");
      results.shots.push(await shot(page, "03-history-planned-1440-light-focus"));
      await page.close();
    }

    // Adjustments honesty
    {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await gotoReady(page, "/staffpay?section=adjustments");
      await setAppearance(page, "light");
      await gotoReady(page, "/staffpay?section=adjustments");
      const heading = page.locator("#m07-adjustments-heading");
      await heading.waitFor({ state: "visible", timeout: 20000 });
      const hText = (await heading.textContent()) || "";
      if (/Prior-period adjustments/i.test(hText)) fail("Adjustments heading still says Prior-period adjustments");
      if (!/Adjustments/i.test(hText)) fail("Adjustments heading missing");
      const section = page.locator('[data-m07-section="adjustments"]');
      const sectionText = (await section.textContent()) || "";
      if (!/not authorised PPA product/i.test(sectionText)) {
        fail("Adjustments status missing not-authorised-PPA honesty");
      }
      if (/PPA-1 foundation · available/i.test(sectionText)) {
        fail("Adjustments still shows PPA-1 foundation · available");
      }
      results.shots.push(await shot(page, "04-adjustments-honesty-1440-light"));
      await page.close();
    }

    // Mobile History + Adjustments
    {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
      await gotoReady(page, "/staffpay?section=history");
      await setAppearance(page, "light");
      await gotoReady(page, "/staffpay?section=history");
      results.shots.push(await shot(page, "05-history-planned-390-light"));
      await gotoReady(page, "/staffpay?section=adjustments");
      results.shots.push(await shot(page, "06-adjustments-honesty-390-light"));
      await page.close();
    }

    // System appearance sample (History)
    {
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      await gotoReady(page, "/staffpay?section=history");
      await setAppearance(page, "system");
      await gotoReady(page, "/staffpay?section=history");
      results.shots.push(await shot(page, "07-history-planned-1280-system"));
      await page.close();
    }

    // Dark Adjustments
    {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await gotoReady(page, "/staffpay?section=adjustments");
      await setAppearance(page, "dark");
      await gotoReady(page, "/staffpay?section=adjustments");
      results.shots.push(await shot(page, "08-adjustments-honesty-1440-dark"));
      await page.close();
    }
  } finally {
    await browser.close();
  }

  results.ok = failures.length === 0;
  results.failures = failures;
  writeFileSync(join(OUT, "harness-report.json"), JSON.stringify(results, null, 2));
  writeFileSync(
    join(OUT, "HARVEST.md"),
    [
      "# P1-B3 harness harvest",
      "",
      `- Base: ${BASE}`,
      `- Local-only: yes`,
      `- GitHub CI: none claimed`,
      `- Failures: ${failures.length ? failures.join("; ") : "[]"}`,
      `- Shots: ${results.shots.length}`,
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
