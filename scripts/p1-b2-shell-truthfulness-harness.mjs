/**
 * P1-B2 shell truthfulness / demo honesty visual harness (remediated).
 *
 * Proves real product paths — no Topbar DOM option fabrication.
 *
 * Usage:
 *   HCDP_BASE_URL=http://localhost:3000 node scripts/p1-b2-shell-truthfulness-harness.mjs
 *
 * Optional production-enforcement visual evidence:
 *   HCDP_PRODUCTION_BASE_URL=http://localhost:3012  (Next started with AUTH_ENFORCEMENT=production
 *   and NEXT_PUBLIC_AUTH_ENFORCEMENT=production)
 *
 * LOCAL evidence only — do not claim GitHub CI from this script.
 * No product runtime acceptance hooks.
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, renameSync, existsSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.HCDP_BASE_URL || "http://localhost:3000";
const PROD_BASE = process.env.HCDP_PRODUCTION_BASE_URL || "";
if (/127\.0\.0\.1/.test(BASE) || /127\.0\.0\.1/.test(PROD_BASE)) {
  console.error("Use localhost (not 127.0.0.1) for owner-visible harness.");
  process.exit(2);
}

const OUT = join(process.cwd(), "docs/audits/p1/b2-shell-truthfulness");
const SHOTS = join(OUT, "shots");
const SUPERSEDED = join(OUT, "historical-superseded-dom-fabricated");
mkdirSync(SHOTS, { recursive: true });
mkdirSync(join(SUPERSEDED, "shots"), { recursive: true });

// Archive prior fabricated multi-clinic shot if still in live shots folder.
const fabricated = join(SHOTS, "05-multi-clinic-guidance-toast-1440-light.png");
const fabricatedDest = join(SUPERSEDED, "shots", "05-multi-clinic-guidance-toast-1440-light.DOM-FABRICATED.png");
if (existsSync(fabricated) && !existsSync(fabricatedDest)) {
  try {
    renameSync(fabricated, fabricatedDest);
  } catch {
    /* ignore */
  }
}

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

async function gotoReady(page, path, base = BASE) {
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const response = await page.goto(`${base}${path}`, { waitUntil: "commit", timeout: 60000 });
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

async function setQaDemo(page, enabled) {
  await gotoReady(page, `/dashboard?qaDemo=${enabled ? "1" : "0"}`);
  await page.waitForTimeout(1200);
  await page.evaluate((on) => {
    localStorage.setItem("pulse.platform.qaDemoMode", JSON.stringify({ enabled: on }));
    window.dispatchEvent(new Event("pulse.platform.qa-demo-mode-change"));
  }, enabled);
  await page.waitForTimeout(400);
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

/** Set application appearance via supported storage contract + UI select when present. */
async function setAppearancePreference(page, value) {
  await page.evaluate((v) => {
    localStorage.setItem("pulse.cc.appearance", JSON.stringify(v));
  }, value);
  await page.reload({ waitUntil: "domcontentloaded" });
  await ensureReady(page);
  const select = page.locator('select[aria-label="Appearance"]');
  if ((await select.count()) > 0) {
    await select.first().waitFor({ state: "attached", timeout: 15000 });
    const current = await select.first().inputValue().catch(() => "");
    if (current !== value) {
      await select.first().selectOption(value);
      await page.waitForTimeout(400);
    }
  }
  // Confirm storage stuck
  const stored = await page.evaluate(() => {
    try {
      return JSON.parse(localStorage.getItem("pulse.cc.appearance") || "null");
    } catch {
      return null;
    }
  });
  if (stored !== value) {
    await page.evaluate((v) => {
      localStorage.setItem("pulse.cc.appearance", JSON.stringify(v));
    }, value);
    await page.reload({ waitUntil: "domcontentloaded" });
    await ensureReady(page);
  }
}

async function assertAppearance(page, expectedPref, expectDark) {
  // Allow theme listeners a beat after emulateMedia
  await page.waitForTimeout(350);
  const state = await page.evaluate(() => {
    const pref = document.documentElement.dataset.appearance;
    const dark = document.documentElement.classList.contains("theme-dark");
    let stored = null;
    try {
      stored = JSON.parse(localStorage.getItem("pulse.cc.appearance") || "null");
    } catch {
      stored = localStorage.getItem("pulse.cc.appearance");
    }
    const mqDark =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
        : null;
    return { pref, dark, stored, mqDark };
  });
  if (state.stored !== expectedPref) fail(`appearance storage expected ${expectedPref}, got ${state.stored}`);
  if (state.pref !== expectedPref) fail(`appearance dataset expected ${expectedPref}, got ${state.pref}`);
  if (state.dark !== expectDark) {
    fail(`theme-dark expected ${expectDark}, got ${state.dark} (mqDark=${state.mqDark}, pref=${state.pref})`);
  }
  return state;
}

async function toastMessages(page) {
  return page.locator(".fixed.bottom-\\[18px\\]").locator("div").allTextContents().catch(async () => {
    // Fallback: any toast-looking text
    return page.evaluate(() =>
      Array.from(document.querySelectorAll("body *"))
        .filter((el) => {
          const s = getComputedStyle(el);
          return s.position === "fixed" && el.textContent && el.textContent.length < 240;
        })
        .map((el) => (el.textContent || "").trim())
        .filter(Boolean)
    );
  });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: "light",
  });
  const page = await context.newPage();
  const report = { base: BASE, productionBase: PROD_BASE || null, shots: [], checks: [], at: new Date().toISOString() };

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
    if (onlineOrdinary !== 0) fail("Online demo toggle visible in ordinary mode");
    if (qaBannerOrdinary !== 0) fail("QA banner visible in ordinary mode");
    report.checks.push({ id: "ordinary-hidden-demo", onlineOrdinary, qaBannerOrdinary });
    report.shots.push(await shot(page, "01-ordinary-mode-dashboard-1440-light"));

    // Keyboard-accessible Export / MFA (aria-disabled, not native disabled)
    const exportBtn = page.locator('[data-testid="shell-export-unavailable"]');
    const mfaBtn = page.locator('[data-testid="shell-mfa-unavailable"]');
    if ((await exportBtn.count()) === 0) fail("Export unavailable control missing at 1440");
    if ((await mfaBtn.count()) === 0) fail("MFA unavailable control missing at 1440");

    const exportNativeDisabled = await exportBtn.evaluate((el) => el.hasAttribute("disabled"));
    const mfaNativeDisabled = await mfaBtn.evaluate((el) => el.hasAttribute("disabled"));
    const exportAria = await exportBtn.getAttribute("aria-disabled");
    const mfaAria = await mfaBtn.getAttribute("aria-disabled");
    if (exportNativeDisabled) fail("Export uses native disabled (not keyboard-focusable)");
    if (mfaNativeDisabled) fail("MFA uses native disabled (not keyboard-focusable)");
    if (exportAria !== "true") fail("Export missing aria-disabled=true");
    if (mfaAria !== "true") fail("MFA missing aria-disabled=true");

    await exportBtn.focus();
    await page.waitForTimeout(200);
    const exportFocused = await exportBtn.evaluate((el) => document.activeElement === el);
    if (!exportFocused) fail("Export did not receive keyboard focus");
    const exportDescVisible = await page.locator('[data-testid="shell-export-unavailable-desc"]').isVisible();
    if (!exportDescVisible) fail("Export explanation not visible on focus");
    report.shots.push(await shot(page, "02-export-unavailable-keyboard-focus-1440-light"));

    await exportBtn.press("Enter");
    await exportBtn.click({ force: true });
    await page.waitForTimeout(400);
    const afterExport = (await toastMessages(page)).join(" | ");
    if (/export prepared|export complete|success/i.test(afterExport)) {
      fail(`Export activation produced success messaging: ${afterExport}`);
    }
    report.checks.push({ id: "export-no-op", afterExport });
    report.shots.push(await shot(page, "02b-export-activation-no-op-1440-light"));

    await mfaBtn.focus();
    await page.waitForTimeout(200);
    const mfaFocused = await mfaBtn.evaluate((el) => document.activeElement === el);
    if (!mfaFocused) fail("MFA did not receive keyboard focus");
    const mfaDescVisible = await page.locator('[data-testid="shell-mfa-unavailable-desc"]').isVisible();
    if (!mfaDescVisible) fail("MFA explanation not visible on focus");
    report.shots.push(await shot(page, "03-mfa-unavailable-keyboard-focus-1440-light"));

    await mfaBtn.press("Enter");
    await mfaBtn.click({ force: true });
    await page.waitForTimeout(400);
    const afterMfa = (await toastMessages(page)).join(" | ");
    if (/mfa verified|mfa enabled|enterprise sign-in ready|success/i.test(afterMfa)) {
      fail(`MFA activation produced success messaging: ${afterMfa}`);
    }
    report.checks.push({ id: "mfa-no-op", afterMfa });
    report.shots.push(await shot(page, "03b-mfa-activation-no-op-1440-light"));

    // New Entry remains enabled
    const newEntry = page.locator('[data-testid="shell-new-entry"]');
    if ((await newEntry.count()) === 0) fail("New Entry missing at 1440");
    if (await newEntry.isDisabled()) fail("New Entry unexpectedly disabled");
    report.shots.push(await shot(page, "04-new-entry-available-1440-light"));

    // Real Command Centre multi-clinic → Topbar truthful multiple state
    await gotoReady(page, "/dashboard");
    await setQaDemo(page, false);
    // Reset clinic selection to all first via CC if needed
    const selectClinics = page.locator("button", { hasText: "Select Clinics" });
    await selectClinics.first().click();
    await page.waitForTimeout(300);
    const north = page.locator("button", { hasText: "Saved group: North corridor" });
    if ((await north.count()) === 0) fail("North corridor multi-clinic control missing");
    await north.first().click();
    await page.waitForTimeout(800);
    // Close popover by clicking elsewhere
    await page.locator('[data-testid="shell-topbar"]').click({ position: { x: 20, y: 10 } }).catch(() => {});
    await page.waitForTimeout(400);

    const multipleOpt = page.locator('[data-testid="shell-clinic-scope"] option[value="multiple"]');
    if ((await multipleOpt.count()) === 0) {
      fail("Topbar did not show Multiple Clinics after Command Centre multi-clinic selection");
    } else {
      const label = (await multipleOpt.textContent()) || "";
      if (!/set in Command Centre/i.test(label)) fail(`Topbar multiple option not truthful: ${label}`);
      report.checks.push({ id: "cc-multi-clinic-topbar", label: label.trim() });
    }
    report.shots.push(await shot(page, "05-cc-multi-clinic-topbar-truthful-1440-light"));

    // Selecting multiple in Topbar must warn — not succeed as shell-wide multi-select
    await page.selectOption('[data-testid="shell-clinic-scope"]', "multiple");
    await page.waitForTimeout(600);
    const bodyText = await page.locator("body").innerText();
    if (!/Shell multi-clinic selection is not available/i.test(bodyText)) {
      fail("Multi-clinic guidance toast missing after Topbar multiple select");
    }
    if (/shell-wide multi-select applied|multi-clinic selected successfully/i.test(bodyText)) {
      fail("False success messaging for shell multi-clinic");
    }
    report.checks.push({ id: "topbar-multi-warn-not-success" });
    report.shots.push(await shot(page, "05b-topbar-multi-clinic-guidance-warn-1440-light"));

    // Identity chrome ordinary
    const sidebarName = (await page.locator('[data-testid="shell-current-user-name"]').textContent())?.trim();
    await gotoReady(page, "/dashboard");
    const greeting = (await page.locator('[data-testid="cc-current-user-greeting"]').textContent())?.trim();
    if (!sidebarName || !greeting) fail("Missing identity chrome labels");
    if (!greeting.includes(sidebarName)) fail(`Greeting "${greeting}" does not include sidebar identity "${sidebarName}"`);
    report.checks.push({ id: "identity-match-ordinary", sidebarName, greeting });
    report.shots.push(await shot(page, "06-identity-sidebar-and-cc-greeting-1440-light"));

    const priorName = (await page.locator('[data-testid="shell-current-user-name"]').textContent())?.trim();
    const actAs = page.locator('select[aria-label="Act as User / Role"]');
    await actAs.waitFor({ state: "visible", timeout: 15000 });
    await actAs.selectOption("usr_david");
    await page.waitForTimeout(1000);
    let sidebarAfter = (await page.locator('[data-testid="shell-current-user-name"]').textContent())?.trim();
    if (!sidebarAfter || sidebarAfter === priorName) {
      // Retry once after soft reload — Next hot-compile / JSON.parse 500s can drop the first change
      await gotoReady(page, "/dashboard");
      await actAs.selectOption({ label: /David King/i });
      await page.waitForTimeout(1200);
      sidebarAfter = (await page.locator('[data-testid="shell-current-user-name"]').textContent())?.trim();
    }
    const greetingAfter = (await page.locator('[data-testid="cc-current-user-greeting"]').textContent())?.trim();
    const menuAfter = (await page.locator('[data-testid="cc-current-user-menu"]').textContent())?.trim();
    if (!sidebarAfter || sidebarAfter === priorName) fail("Act-as did not change sidebar identity");
    if (!greetingAfter?.includes(sidebarAfter)) fail("Act-as change not reflected in greeting");
    if (!menuAfter?.includes(sidebarAfter)) fail("Act-as change not reflected in CC user menu");
    report.checks.push({ id: "identity-act-as", priorName, sidebarAfter, greetingAfter, menuAfter });
    report.shots.push(await shot(page, "07-act-as-propagated-1440-light"));

    // QA/demo mode on
    await setQaDemo(page, true);
    if ((await page.locator('[data-testid="shell-online-demo-toggle"]').count()) === 0) {
      fail("Online demo toggle missing in QA mode");
    }
    if ((await page.locator('[data-testid="shell-qa-demo-mode-status"]').count()) === 0) {
      fail("QA mode status missing in sidebar");
    }
    report.shots.push(await shot(page, "08-qa-demo-mode-active-1440-light"));
    await page.locator('[data-testid="shell-online-demo-toggle"]').focus();
    report.shots.push(await shot(page, "09-online-offline-demo-labelled-1440-light"));

    const qaMenu = page.locator("button", { hasText: "QA Demo" });
    if ((await qaMenu.count()) === 0) fail("QA Demo menu missing when mode active");
    report.shots.push(await shot(page, "10-cc-qa-demo-menu-and-clinic-controls-1440-light"));

    await setQaDemo(page, true);
    await gotoReady(page, "/settings?qaDemo=1");
    await page.waitForTimeout(1200);
    const localDemo = page.getByText(/Local demo actor/i);
    if ((await localDemo.count()) === 0) {
      // Ensure QA tools remount after route change
      await setQaDemo(page, true);
      await gotoReady(page, "/settings?qaDemo=1");
      await page.waitForTimeout(1200);
    }
    if ((await localDemo.count()) === 0) {
      fail("Organisation local demo actor section missing while QA mode active");
    }
    report.shots.push(await shot(page, "11-org-local-demo-override-labelled-1440-light"));
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

    await gotoReady(page, "/action-inbox");
    const signedIn = (await page.locator('[data-testid="inbox-signed-in-as"]').textContent())?.trim();
    report.checks.push({ id: "inbox-signed-in", signedIn });
    report.shots.push(await shot(page, "13-inbox-signed-in-identity-1440-light"));

    // Appearance evidence — reset ordinary mode / identity / clinics so shots are not polluted
    await setQaDemo(page, false);
    await page.locator('select[aria-label="Act as User / Role"]').selectOption("usr_sarah").catch(() => {});
    await page.evaluate(() => {
      try {
        localStorage.removeItem("pulse.platform.clinics");
      } catch {
        /* ignore */
      }
    });
    await gotoReady(page, "/dashboard");
    // Reset CC clinics to all via product control
    const selectClinicsReset = page.locator("button", { hasText: "Select Clinics" });
    if ((await selectClinicsReset.count()) > 0) {
      await selectClinicsReset.first().click();
      await page.waitForTimeout(200);
      const allBtn = page.locator("button", { hasText: "All clinics" });
      if ((await allBtn.count()) > 0) await allBtn.first().click();
      await page.locator('[data-testid="shell-topbar"]').click({ position: { x: 20, y: 10 } }).catch(() => {});
    }

    // Appearance: Light (application preference) — OS dark must not override
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ colorScheme: "dark" });
    await gotoReady(page, "/dashboard");
    await setAppearancePreference(page, "light");
    report.checks.push({ id: "appearance-light", ...(await assertAppearance(page, "light", false)) });
    report.shots.push(await shot(page, "16a-appearance-app-light-1440"));

    // Appearance: Dark — OS light must not override
    await page.emulateMedia({ colorScheme: "light" });
    await setAppearancePreference(page, "dark");
    report.checks.push({ id: "appearance-dark", ...(await assertAppearance(page, "dark", true)) });
    report.shots.push(await shot(page, "16b-appearance-app-dark-1440"));

    // Appearance: System + OS Light (application preference remains system)
    await page.emulateMedia({ colorScheme: "light" });
    await setAppearancePreference(page, "system");
    await page.emulateMedia({ colorScheme: "light" });
    report.checks.push({ id: "appearance-system-os-light", ...(await assertAppearance(page, "system", false)) });
    report.shots.push(await shot(page, "16c-appearance-system-os-light-1440"));

    // Appearance: System + OS Dark (same stored preference, resolved theme flips)
    await page.emulateMedia({ colorScheme: "dark" });
    await page.waitForTimeout(500);
    report.checks.push({ id: "appearance-system-os-dark", ...(await assertAppearance(page, "system", true)) });
    report.shots.push(await shot(page, "16d-appearance-system-os-dark-1440"));

    // Mobile ordinary / QA
    await page.emulateMedia({ colorScheme: "light" });
    await setAppearancePreference(page, "light");
    await page.setViewportSize({ width: 390, height: 844 });
    await setQaDemo(page, false);
    await gotoReady(page, "/dashboard");
    if ((await page.locator('[data-testid="shell-online-demo-toggle"]').count()) !== 0) {
      fail("Online toggle visible on mobile ordinary mode");
    }
    report.shots.push(await shot(page, "14-mobile-ordinary-390-light"));

    await setQaDemo(page, true);
    await page.locator('[data-testid="shell-mobile-menu"]').click().catch(() => {});
    await page.waitForTimeout(400);
    report.shots.push(await shot(page, "15-mobile-qa-demo-mode-390-light"));

    // Responsive ordinary samples
    await setQaDemo(page, false);
    for (const w of [1280, 1024, 768, 430]) {
      await page.setViewportSize({ width: w, height: 900 });
      await gotoReady(page, "/dashboard");
      report.shots.push(await shot(page, `17-responsive-ordinary-${w}-light`));
    }

    // Production-enforcement visual (requires exclusive Next process — same dir cannot run two next dev)
    if (PROD_BASE) {
      try {
        const prodPage = await context.newPage();
        await gotoReady(prodPage, "/dashboard?qaDemo=1", PROD_BASE);
        await prodPage.waitForTimeout(1500);
        await prodPage.evaluate(() => {
          try {
            localStorage.setItem("pulse.platform.qaDemoMode", JSON.stringify({ enabled: true }));
            window.dispatchEvent(new Event("pulse.platform.qa-demo-mode-change"));
          } catch {
            /* ignore */
          }
        });
        await prodPage.reload({ waitUntil: "domcontentloaded" });
        await ensureReady(prodPage);
        await prodPage.waitForTimeout(1000);
        const prodOnline = await prodPage.locator('[data-testid="shell-online-demo-toggle"]').count();
        const prodToggle = await prodPage.locator('[data-testid="shell-qa-demo-mode-toggle"]').count();
        const prodBanner = await prodPage.locator('[data-testid="shell-qa-demo-banner"]').count();
        if (prodOnline !== 0) fail("Production enforcement: online demo toggle still visible");
        if (prodBanner !== 0) fail("Production enforcement: QA banner still visible");
        // Toggle may be absent when canUseQaDemoMode is false
        report.checks.push({
          id: "production-enforcement-browser",
          prodOnline,
          prodToggle,
          prodBanner,
          note: "Visual against AUTH_ENFORCEMENT/NEXT_PUBLIC_AUTH_ENFORCEMENT=production server",
        });
        report.shots.push(await shot(prodPage, "18-production-enforcement-qa-refused-1440-light"));
        await prodPage.close();
      } catch (err) {
        fail(`Production enforcement browser evidence failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    } else {
      report.checks.push({
        id: "production-enforcement-browser",
        skipped: true,
        note: "Objective proof: unit test production enforcement. Browser shot via scripts/p1-b2-production-enforcement-shot.mjs with exclusive production Next process.",
      });
    }
  } finally {
    await browser.close();
  }

  const summary = {
    ...report,
    failures,
    ok: failures.length === 0,
    notes: [
      "No Topbar option DOM fabrication.",
      "System appearance evidence uses application preference=system with OS colorScheme emulation — not ordinary Light/Dark alone.",
      "GitHub CI not claimed.",
    ],
  };
  writeFileSync(join(OUT, "harness-smoke-report.json"), JSON.stringify(summary, null, 2));
  writeFileSync(
    join(OUT, "harness-smoke-summary.md"),
    [
      "# P1-B2 harness smoke summary (remediated)",
      "",
      `- Base: ${BASE}`,
      `- Production base: ${PROD_BASE || "(not set — unit test covers production enforcement)"}`,
      `- OK: ${summary.ok}`,
      `- Failures: ${failures.length ? failures.join("; ") : "none"}`,
      `- Shots: ${report.shots.length}`,
      "",
      "## Corrections vs prior harness",
      "",
      "- Removed DOM fabrication of Topbar `Multiple Clinics` option.",
      "- Multi-clinic evidence uses Command Centre Select Clinics → North corridor → Topbar truthful state.",
      "- Export/MFA use keyboard-focusable `aria-disabled` with visible focus explanation; activation is no-op.",
      "- Appearance covers app Light, app Dark, System+OS Light, System+OS Dark separately.",
      "",
      "Local evidence only — GitHub CI not claimed.",
      "P1-B2 owner acceptance remains pending.",
      "",
    ].join("\n")
  );

  writeFileSync(
    join(SUPERSEDED, "README.md"),
    [
      "# Superseded / historical P1-B2 evidence",
      "",
      "The prior `05-multi-clinic-guidance-toast-1440-light.png` was produced by harness DOM fabrication",
      "(injecting a temporary `<option value=\"multiple\">`). It is **not** product evidence.",
      "",
      "Live evidence is `shots/05-cc-multi-clinic-topbar-truthful-1440-light.png` and",
      "`shots/05b-topbar-multi-clinic-guidance-warn-1440-light.png`.",
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
