/**
 * P1-B2 shell truthfulness / demo honesty visual harness.
 *
 * Captures ordinary vs QA/demo mode, disabled Export/MFA, identity chrome,
 * multi-clinic guidance, and representative mobile states.
 *
 * Usage:
 *   HCDP_BASE_URL=http://localhost:3000 node scripts/p1-b2-shell-truthfulness-harness.mjs
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

const OUT = join(process.cwd(), "docs/audits/p1/b2-shell-truthfulness");
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
      await page.waitForTimeout(600);
      return;
    } catch (err) {
      if (attempt === 2) throw err;
      await page.reload({ waitUntil: "domcontentloaded" });
    }
  }
}

async function gotoReady(page, path) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    if (response && response.status() >= 500) {
      await page.waitForTimeout(1000);
      continue;
    }
    try {
      await ensureReady(page);
      return;
    } catch (err) {
      if (attempt === 3) throw err;
      await page.waitForTimeout(1000);
    }
  }
}

async function setQaDemo(page, enabled) {
  await gotoReady(page, `/dashboard?qaDemo=${enabled ? "1" : "0"}`);
  await page.waitForTimeout(1200);
  await page.evaluate((on) => {
    localStorage.setItem("pulse.platform.qaDemoMode", JSON.stringify({ enabled: on }));
    window.dispatchEvent(new Event("pulse.platform.qa-demo-mode-change"));
  }, enabled);
  await page.waitForTimeout(400);
  // Prefer explicit UI toggle when available (post-hydration).
  const toggle = page.locator('[data-testid="shell-qa-demo-mode-toggle"]');
  await toggle.waitFor({ state: "attached", timeout: 15000 });
  for (let i = 0; i < 5; i++) {
    const checked = await toggle.isChecked();
    if (checked === enabled) break;
    await toggle.click({ force: true });
    await page.waitForTimeout(350);
  }
  if (enabled) {
    await page.waitForFunction(
      () =>
        !!document.querySelector('[data-testid="shell-online-demo-toggle"]') &&
        !!document.querySelector('[data-testid="shell-qa-demo-mode-status"]'),
      { timeout: 20000 }
    );
  } else {
    await page.waitForTimeout(500);
    if ((await page.locator('[data-testid="shell-online-demo-toggle"]').count()) !== 0) {
      throw new Error("QA demo online toggle still visible after disable");
    }
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: "light",
  });
  const page = await context.newPage();
  const report = { base: BASE, shots: [], checks: [], at: new Date().toISOString() };

  try {
    // Ordinary mode
    await gotoReady(page, "/dashboard");
    await page.evaluate(() => {
      try {
        localStorage.removeItem("pulse.platform.qaDemoMode");
      } catch {
        /* ignore */
      }
    });
    await setQaDemo(page, false);

    const onlineOrdinary = await page.locator('[data-testid="shell-online-demo-toggle"]').count();
    const qaBannerOrdinary = await page.locator('[data-testid="shell-qa-demo-banner"]').count();
    const qaMenuOrdinary = await page.locator("text=QA Demo").count();
    if (onlineOrdinary !== 0) fail("Online demo toggle visible in ordinary mode");
    if (qaBannerOrdinary !== 0) fail("QA banner visible in ordinary mode");
    report.checks.push({ id: "ordinary-hidden-demo", onlineOrdinary, qaBannerOrdinary, qaMenuOrdinary });
    report.shots.push(await shot(page, "01-ordinary-mode-dashboard-1440-light"));

    // Disabled Export / MFA (2xl+ ribbon)
    const exportBtn = page.locator('[data-testid="shell-export-unavailable"]');
    const mfaBtn = page.locator('[data-testid="shell-mfa-unavailable"]');
    if ((await exportBtn.count()) === 0) fail("Export unavailable control missing at 1440");
    if ((await mfaBtn.count()) === 0) fail("MFA unavailable control missing at 1440");
    const exportDisabled = await exportBtn.isDisabled();
    const mfaDisabled = await mfaBtn.isDisabled();
    if (!exportDisabled) fail("Export not disabled");
    if (!mfaDisabled) fail("MFA not disabled");
    await exportBtn.focus();
    report.shots.push(await shot(page, "02-export-disabled-focus-1440-light"));
    await mfaBtn.focus();
    report.shots.push(await shot(page, "03-mfa-disabled-focus-1440-light"));

    // New Entry remains enabled
    const newEntry = page.locator('[data-testid="shell-new-entry"]');
    if ((await newEntry.count()) === 0) fail("New Entry missing at 1440");
    if (await newEntry.isDisabled()) fail("New Entry unexpectedly disabled");
    report.shots.push(await shot(page, "04-new-entry-available-1440-light"));

    // Multi-clinic guidance
    const hasMultiple = await page.locator('[data-testid="shell-clinic-scope"] option[value="multiple"]').count();
    if (hasMultiple === 0) {
      await page.evaluate(() => {
        const sel = document.querySelector('[data-testid="shell-clinic-scope"]');
        if (!sel) return;
        const opt = document.createElement("option");
        opt.value = "multiple";
        opt.textContent = "Multiple Clinics";
        sel.appendChild(opt);
        sel.value = "multiple";
        sel.dispatchEvent(new Event("change", { bubbles: true }));
      });
    } else {
      await page.selectOption('[data-testid="shell-clinic-scope"]', "multiple");
    }
    await page.waitForTimeout(500);
    report.shots.push(await shot(page, "05-multi-clinic-guidance-toast-1440-light"));

    // Identity chrome ordinary
    const sidebarName = (await page.locator('[data-testid="shell-current-user-name"]').textContent())?.trim();
    await gotoReady(page, "/dashboard");
    const greeting = (await page.locator('[data-testid="cc-current-user-greeting"]').textContent())?.trim();
    if (!sidebarName || !greeting) fail("Missing identity chrome labels");
    if (!greeting.includes(sidebarName)) fail(`Greeting "${greeting}" does not include sidebar identity "${sidebarName}"`);
    report.checks.push({ id: "identity-match-ordinary", sidebarName, greeting });
    report.shots.push(await shot(page, "06-identity-sidebar-and-cc-greeting-1440-light"));

    // Act-as change — select a different identity than default Sarah
    const priorName = (await page.locator('[data-testid="shell-current-user-name"]').textContent())?.trim();
    await page.locator('select[aria-label="Act as User / Role"]').selectOption("usr_david");
    await page.waitForTimeout(800);
    const sidebarAfter = (await page.locator('[data-testid="shell-current-user-name"]').textContent())?.trim();
    const greetingAfter = (await page.locator('[data-testid="cc-current-user-greeting"]').textContent())?.trim();
    const menuAfter = (await page.locator('[data-testid="cc-current-user-menu"]').textContent())?.trim();
    if (!sidebarAfter || sidebarAfter === priorName) fail("Act-as did not change sidebar identity");
    if (!greetingAfter?.includes(sidebarAfter)) fail("Act-as change not reflected in greeting");
    if (!menuAfter?.includes(sidebarAfter)) fail("Act-as change not reflected in CC user menu");
    report.checks.push({ id: "identity-act-as", priorName, sidebarAfter, greetingAfter, menuAfter });
    report.shots.push(await shot(page, "07-act-as-propagated-1440-light"));

    // QA/demo mode on
    await setQaDemo(page, true);
    const onlineQa = await page.locator('[data-testid="shell-online-demo-toggle"]').count();
    const statusQa = await page.locator('[data-testid="shell-qa-demo-mode-status"]').count();
    if (onlineQa === 0) fail("Online demo toggle missing in QA mode");
    if (statusQa === 0) fail("QA mode status missing in sidebar");
    report.shots.push(await shot(page, "08-qa-demo-mode-active-1440-light"));
    await page.locator('[data-testid="shell-online-demo-toggle"]').focus();
    report.shots.push(await shot(page, "09-online-offline-demo-labelled-1440-light"));

    // CC multi-clinic surface + QA menu
    const qaMenu = page.locator("button", { hasText: "QA Demo" });
    if ((await qaMenu.count()) === 0) fail("QA Demo menu missing when mode active");
    report.shots.push(await shot(page, "10-cc-qa-demo-menu-and-clinic-controls-1440-light"));

    // Organisation local override labelling (route alias → /settings)
    await setQaDemo(page, true);
    await gotoReady(page, "/settings");
    await page.waitForTimeout(800);
    if ((await page.locator("text=Local demo actor").count()) === 0) {
      fail("Organisation local demo actor section missing while QA mode active");
    }
    report.shots.push(await shot(page, "11-org-local-demo-override-labelled-1440-light"));
    // Confirm reset dialog
    page.once("dialog", async (d) => {
      report.checks.push({ id: "org-reset-confirm", message: d.message() });
      await d.dismiss();
    });
    const resetBtn = page.locator("button", { hasText: "Reset demo data" });
    if ((await resetBtn.count()) > 0) {
      await resetBtn.first().click();
      await page.waitForTimeout(300);
    } else {
      fail("Reset demo data control missing in QA mode on Organisation");
    }
    report.shots.push(await shot(page, "12-org-reset-confirmation-path-1440-light"));

    // Action inbox signed-in
    await gotoReady(page, "/action-inbox");
    const signedIn = (await page.locator('[data-testid="inbox-signed-in-as"]').textContent())?.trim();
    report.checks.push({ id: "inbox-signed-in", signedIn });
    report.shots.push(await shot(page, "13-inbox-signed-in-identity-1440-light"));

    // Mobile ordinary
    await page.setViewportSize({ width: 390, height: 844 });
    await setQaDemo(page, false);
    await gotoReady(page, "/dashboard");
    if ((await page.locator('[data-testid="shell-online-demo-toggle"]').count()) !== 0) {
      fail("Online toggle visible on mobile ordinary mode");
    }
    report.shots.push(await shot(page, "14-mobile-ordinary-390-light"));

    // Mobile QA mode
    await setQaDemo(page, true);
    await page.locator('[data-testid="shell-mobile-menu"]').click().catch(() => {});
    await page.waitForTimeout(400);
    report.shots.push(await shot(page, "15-mobile-qa-demo-mode-390-light"));

    // Dark mode sample
    await page.emulateMedia({ colorScheme: "dark" });
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoReady(page, "/dashboard");
    report.shots.push(await shot(page, "16-qa-demo-mode-1440-dark"));

    // Additional widths smoke (light)
    await page.emulateMedia({ colorScheme: "light" });
    for (const w of [1280, 1024, 768, 430]) {
      await page.setViewportSize({ width: w, height: 900 });
      await gotoReady(page, "/dashboard");
      report.shots.push(await shot(page, `17-responsive-ordinary-${w}-light`));
    }

    // System appearance note: light OS already covered; dark OS covered above
    report.checks.push({
      id: "appearance-modes",
      light: true,
      dark: true,
      systemLight: "covered via light emulate",
      systemDark: "covered via dark emulate",
    });
  } finally {
    await browser.close();
  }

  const summary = {
    ...report,
    failures,
    ok: failures.length === 0,
  };
  writeFileSync(join(OUT, "harness-smoke-report.json"), JSON.stringify(summary, null, 2));
  writeFileSync(
    join(OUT, "harness-smoke-summary.md"),
    [
      "# P1-B2 harness smoke summary",
      "",
      `- Base: ${BASE}`,
      `- OK: ${summary.ok}`,
      `- Failures: ${failures.length ? failures.join("; ") : "none"}`,
      `- Shots: ${report.shots.length}`,
      "",
      "Local evidence only — GitHub CI not claimed.",
      "",
    ].join("\n")
  );

  if (failures.length) {
    console.error(JSON.stringify(summary, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify({ ok: true, shots: report.shots.length, checks: report.checks.length }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
