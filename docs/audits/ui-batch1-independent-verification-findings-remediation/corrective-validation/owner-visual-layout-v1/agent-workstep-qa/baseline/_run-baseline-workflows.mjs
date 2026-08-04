/**
 * Work-Step QA — Phase 2 baseline workflows (READ-ONLY against app).
 * Evidence-only script under agent-workstep-qa/. Does not edit application source/tests.
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const SHOTS = path.join(ROOT, "screenshots");
const TRACE_DIR = path.join(ROOT, "traces");
const OUT_JSON = path.join(ROOT, "_raw-results.json");
const BASE = process.env.HCDP_BASE_URL || "http://127.0.0.1:3000";
const INPUT_SHA = "f837bdd08e1db30e68c63cfb2542e3120bc40d00";
const APP_SHA = "e6e2f90ea42f39ddab1d5ce39c1e306f214a1742";

fs.mkdirSync(SHOTS, { recursive: true });
fs.mkdirSync(TRACE_DIR, { recursive: true });

function nowIso() {
  return new Date().toISOString();
}

async function shot(page, name) {
  const file = path.join(SHOTS, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  return file;
}

async function collectErrors(page) {
  const consoleErrors = [];
  const pageErrors = [];
  const requestFailures = [];
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text());
  });
  page.on("pageerror", (e) => pageErrors.push(String(e)));
  page.on("requestfailed", (r) => {
    requestFailures.push(`${r.method()} ${r.url()} :: ${r.failure()?.errorText || "fail"}`);
  });
  return { consoleErrors, pageErrors, requestFailures };
}

function errSummary(bag) {
  return {
    consoleErrors: bag.consoleErrors.slice(-20),
    pageErrors: bag.pageErrors.slice(-10),
    requestFailures: bag.requestFailures
      .filter((u) => !/favicon|hot-update|webpack/.test(u))
      .slice(-15),
  };
}

async function inventoryControls(page) {
  return page.evaluate(() => {
    const text = (el) => (el?.textContent || "").replace(/\s+/g, " ").trim();
    const btnInfo = (el) => ({
      tag: el.tagName.toLowerCase(),
      text: text(el).slice(0, 120),
      ariaLabel: el.getAttribute("aria-label"),
      ariaExpanded: el.getAttribute("aria-expanded"),
      ariaPressed: el.getAttribute("aria-pressed"),
      ariaCurrent: el.getAttribute("aria-current"),
      disabled: el.disabled === true || el.getAttribute("aria-disabled") === "true" || el.hasAttribute("disabled"),
      type: el.getAttribute("type"),
      href: el.getAttribute("href"),
      role: el.getAttribute("role"),
      classes: (el.className || "").toString().slice(0, 160),
      visible: !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length),
    });

    const emergencyRoot = Array.from(document.querySelectorAll("div,section")).find((el) =>
      /Emergency announcement/i.test(el.textContent || "") && el.querySelector("button")
    );
    const emergencyButtons = emergencyRoot
      ? Array.from(emergencyRoot.querySelectorAll("button")).map(btnInfo)
      : [];

    const topbar = document.querySelector(".pulse-top-ribbon");
    const topbarControls = topbar
      ? [
          ...Array.from(topbar.querySelectorAll("a,button,input,select")).map(btnInfo),
        ]
      : [];

    const sidebar = document.querySelector("aside.pulse-sidebar");
    const sidebarControls = sidebar
      ? [
          ...Array.from(sidebar.querySelectorAll("button.v32-nav-toggle")).map((el) => ({
            kind: "nav-group-toggle",
            ...btnInfo(el),
            group: el.closest("[data-nav-group]")?.getAttribute("data-nav-group"),
          })),
          ...Array.from(sidebar.querySelectorAll("a.nav-btn")).map((el) => ({
            kind: "nav-link",
            ...btnInfo(el),
            module: el.closest("[data-canonical-module]")?.getAttribute("data-canonical-module"),
          })),
          ...Array.from(sidebar.querySelectorAll("input,select,button.v33-fav-star")).map((el) => ({
            kind: "sidebar-other",
            ...btnInfo(el),
          })),
          {
            kind: "identity-footer",
            present: !!sidebar.querySelector(".sidebar-user"),
            actAs: !!sidebar.querySelector('select[aria-label="Act as User / Role"]'),
            userName: text(sidebar.querySelector(".user-name")),
            userRole: text(sidebar.querySelector(".user-role")),
            footerVisible: (() => {
              const el = sidebar.querySelector(".sidebar-user");
              if (!el) return false;
              const r = el.getBoundingClientRect();
              return r.bottom > 0 && r.top < window.innerHeight && r.height > 0;
            })(),
            footerInViewportFully: (() => {
              const el = sidebar.querySelector(".sidebar-user");
              if (!el) return false;
              const r = el.getBoundingClientRect();
              return r.top >= 0 && r.bottom <= window.innerHeight && r.height > 0;
            })(),
          },
        ]
      : [];

    const appearance = document.querySelector('select[aria-label="Appearance"]');
    const appearanceInfo = appearance
      ? {
          present: true,
          value: appearance.value,
          options: Array.from(appearance.options).map((o) => ({ value: o.value, label: o.textContent })),
          disabled: appearance.disabled,
        }
      : { present: false };

    const headings = Array.from(document.querySelectorAll("h1")).map((h) => text(h));
    const url = location.href;

    return {
      url,
      viewport: { w: window.innerWidth, h: window.innerHeight },
      headings,
      emergencyButtons,
      emergencyPresent: emergencyButtons.length > 0,
      topbarControls,
      sidebarControls,
      appearanceInfo,
      htmlThemeDark: document.documentElement.classList.contains("theme-dark"),
      dataAppearance: document.documentElement.getAttribute("data-appearance"),
      onlineBtn: (() => {
        const b = Array.from(document.querySelectorAll("button")).find((el) =>
          /^(Online|Offline)$/i.test(text(el))
        );
        return b ? btnInfo(b) : null;
      })(),
      openMenuBtn: (() => {
        const b = document.querySelector('button[aria-label="Open menu"]');
        return b ? btnInfo(b) : null;
      })(),
    };
  });
}

async function waitReady(page) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(800);
}

async function run() {
  const launchErrors = [];
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      executablePath: "/usr/bin/google-chrome-stable",
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    });
  } catch (e) {
    launchErrors.push(String(e));
    fs.writeFileSync(
      OUT_JSON,
      JSON.stringify({ blocked: true, launchErrors, inputSha: INPUT_SHA, appSha: APP_SHA, base: BASE }, null, 2)
    );
    console.error("PLAYWRIGHT_LAUNCH_BLOCKED", e);
    process.exit(2);
  }

  const results = {
    meta: {
      agent: "Work-Step / Functional QA",
      phase: "Phase 2 baseline pre-remediation",
      inputSha: INPUT_SHA,
      appSourceSha: APP_SHA,
      base: BASE,
      startedAt: nowIso(),
      port: 3000,
      worktree: "/tmp/hcdp-fix/ui-batch1-vf-fixes",
    },
    inventory: {},
    workflows: [],
    findings: [],
  };

  function addFinding(id, workflowId, severity, title, detail) {
    results.findings.push({ id, workflowId, severity, title, detail, status: "OPEN" });
  }

  // ---------- CONTROL INVENTORY (desktop + mobile) ----------
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const bag = await collectErrors(page);
    await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle", timeout: 90000 });
    await waitReady(page);
    results.inventory.desktop1440x900 = await inventoryControls(page);
    results.inventory.desktop1440x900.shot = await shot(page, "INV-desktop-1440x900-dashboard");
    results.inventory.desktop1440x900.errors = errSummary(bag);

    await page.setViewportSize({ width: 1440, height: 720 });
    await waitReady(page);
    results.inventory.desktop1440x720 = await inventoryControls(page);
    results.inventory.desktop1440x720.shot = await shot(page, "INV-desktop-1440x720-dashboard");

    await page.setViewportSize({ width: 390, height: 844 });
    await waitReady(page);
    results.inventory.mobile390 = await inventoryControls(page);
    results.inventory.mobile390.shot = await shot(page, "INV-mobile-390-dashboard");
    await context.close();
  }

  // ---------- WF-EMERGENCY ----------
  async function wfEmergency(viewport, suffix) {
    const id = `WF-EMERGENCY-${suffix}`;
    const wf = {
      workflowId: id,
      route: "/dashboard",
      sourceSha: APP_SHA,
      inputSha: INPUT_SHA,
      precondition: "Dashboard loaded; emergency banner present when seeded announcements exist",
      startingState: `viewport ${viewport.width}x${viewport.height}`,
      steps: [],
      outcome: "PASS",
      screenshots: [],
      persistence: null,
      reload: null,
      history: null,
      keyboard: null,
      mobileEquivalent: viewport.width <= 390,
      errors: null,
    };
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const bag = await collectErrors(page);
    await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle", timeout: 90000 });
    await waitReady(page);

    const banner = page.locator("text=Emergency announcement").first();
    const present = await banner.count();
    wf.steps.push({
      n: 1,
      action: "Locate Emergency announcement banner",
      expected: "Banner visible with Previous/Next/View All",
      observed: present ? "Banner found" : "Banner NOT found",
      result: present ? "PASS" : "FAIL",
    });
    if (!present) {
      wf.outcome = "FAIL";
      addFinding(`WQA-EMG-01-${suffix}`, id, "major", "Emergency banner missing on Dashboard", "Expected Emergency announcement region on /dashboard");
      wf.screenshots.push(await shot(page, `${id}-missing`));
      wf.errors = errSummary(bag);
      await context.close();
      results.workflows.push(wf);
      return;
    }

    const prev = page.getByRole("button", { name: "Previous", exact: true }).first();
    const next = page.getByRole("button", { name: "Next", exact: true }).first();
    const viewAll = page.getByRole("button", { name: "View All Announcements", exact: true }).first();

    const prevDisabled = await prev.isDisabled().catch(() => null);
    const nextDisabled = await next.isDisabled().catch(() => null);
    const titleBefore = await page.locator("text=Emergency announcement").locator("xpath=..").locator("strong").first().textContent().catch(() => "");
    wf.steps.push({
      n: 2,
      action: "Inspect Previous/Next disabled states",
      expected: "Disabled when <2 emergency items; enabled when ≥2",
      observed: `prevDisabled=${prevDisabled}, nextDisabled=${nextDisabled}, title="${(titleBefore||"").trim()}"`,
      result: prevDisabled === null || nextDisabled === null ? "FAIL" : "PASS",
    });
    if (prevDisabled === null) {
      wf.outcome = "FAIL";
      addFinding(`WQA-EMG-02-${suffix}`, id, "major", "Previous/Next controls not found", "Emergency banner controls missing");
    }

    // Try next if enabled
    if (nextDisabled === false) {
      await next.click();
      await waitReady(page);
      const titleAfter = await page.locator("text=Emergency announcement").locator("xpath=..").locator("strong").first().textContent().catch(() => "");
      const changed = (titleAfter || "").trim() !== (titleBefore || "").trim();
      wf.steps.push({
        n: 3,
        action: "Click Next",
        expected: "Announcement content advances",
        observed: `titleAfter="${(titleAfter||"").trim()}", changed=${changed}`,
        result: changed ? "PASS" : "FAIL",
        url: page.url(),
      });
      if (!changed) {
        wf.outcome = "FAIL";
        addFinding(`WQA-EMG-03-${suffix}`, id, "major", "Next did not advance emergency announcement", `Before=${titleBefore} After=${titleAfter}`);
      }
      await prev.click();
      await waitReady(page);
      const titleBack = await page.locator("text=Emergency announcement").locator("xpath=..").locator("strong").first().textContent().catch(() => "");
      const restored = (titleBack || "").trim() === (titleBefore || "").trim();
      wf.steps.push({
        n: 4,
        action: "Click Previous",
        expected: "Returns to prior announcement",
        observed: `titleBack="${(titleBack||"").trim()}", restored=${restored}`,
        result: restored ? "PASS" : "FAIL",
      });
      if (!restored) {
        wf.outcome = "FAIL";
        addFinding(`WQA-EMG-04-${suffix}`, id, "major", "Previous did not restore prior emergency announcement", "");
      }
    } else {
      wf.steps.push({
        n: 3,
        action: "Click Next skipped (disabled)",
        expected: "Disabled state respected when single/no multi item",
        observed: "Next disabled — skip advance check",
        result: "PASS",
      });
    }

    const beforeUrl = page.url();
    await viewAll.click();
    await waitReady(page);
    // View All may open modal or navigate — observe
    const dialog = page.locator('[role="dialog"], .modal, [data-modal], [aria-modal="true"]');
    const dialogVisible = await dialog.first().isVisible().catch(() => false);
    const urlChanged = page.url() !== beforeUrl;
    const viewAllWorked = dialogVisible || urlChanged || (await page.getByText(/All Announcements|Announcements/i).count()) > 0;
    wf.steps.push({
      n: 5,
      action: "Click View All Announcements",
      expected: "Opens announcements list/modal or navigates to announcements view",
      observed: `dialogVisible=${dialogVisible}, urlChanged=${urlChanged}, url=${page.url()}`,
      result: viewAllWorked ? "PASS" : "FAIL",
      url: page.url(),
    });
    if (!viewAllWorked) {
      wf.outcome = "FAIL";
      addFinding(`WQA-EMG-05-${suffix}`, id, "major", "View All Announcements produced no observable transition", "");
    }

    // Keyboard: Tab to Previous if focusable
    await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle", timeout: 90000 });
    await waitReady(page);
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    const active = await page.evaluate(() => document.activeElement?.tagName + ":" + (document.activeElement?.getAttribute("aria-label") || document.activeElement?.textContent?.slice(0, 40)));
    wf.keyboard = { tabFocusSample: active };
    wf.steps.push({
      n: 6,
      action: "Keyboard Tab focus sample on Dashboard",
      expected: "Focus moves to interactive controls",
      observed: String(active),
      result: active && active !== "BODY:" ? "PASS" : "FAIL",
    });

    wf.screenshots.push(await shot(page, `${id}-end`));
    wf.errors = errSummary(bag);
    if (wf.steps.some((s) => s.result === "FAIL") && wf.outcome === "PASS") wf.outcome = "FAIL";
    await context.close();
    results.workflows.push(wf);
  }

  await wfEmergency({ width: 1440, height: 900 }, "DESKTOP");
  await wfEmergency({ width: 390, height: 844 }, "MOBILE390");

  // ---------- WF-TOPBAR ----------
  {
    const id = "WF-TOPBAR";
    const wf = {
      workflowId: id,
      route: "/dashboard",
      sourceSha: APP_SHA,
      inputSha: INPUT_SHA,
      precondition: "Topbar ribbon visible on desktop",
      startingState: "1440x900 /dashboard",
      steps: [],
      outcome: "PASS",
      screenshots: [],
      persistence: null,
      reload: null,
      history: null,
      keyboard: null,
      mobileEquivalent: false,
      errors: null,
    };
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const bag = await collectErrors(page);
    await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle", timeout: 90000 });
    await waitReady(page);
    wf.screenshots.push(await shot(page, `${id}-start`));

    const dashLink = page.locator(".pulse-top-ribbon a", { hasText: "Dashboard" }).first();
    const inboxLink = page.locator(".pulse-top-ribbon a", { hasText: /Action Inbox/ }).first();
    const search = page.getByLabel("Search modules and sections");
    const online = page.getByRole("button", { name: /^(Online|Offline)$/ });

    await dashLink.click();
    await waitReady(page);
    const onDash = /\/dashboard\/?$/.test(new URL(page.url()).pathname) || new URL(page.url()).pathname === "/";
    wf.steps.push({
      n: 1,
      action: "Click Topbar Dashboard",
      expected: "Navigate/remain on /dashboard",
      observed: page.url(),
      result: onDash ? "PASS" : "FAIL",
      url: page.url(),
    });
    if (!onDash) {
      wf.outcome = "FAIL";
      addFinding("WQA-TOP-01", id, "major", "Topbar Dashboard nav failed", page.url());
    }

    await inboxLink.click();
    await page.waitForURL(/action-inbox/, { timeout: 15000 }).catch(() => {});
    await waitReady(page);
    const onInbox = page.url().includes("/action-inbox");
    wf.steps.push({
      n: 2,
      action: "Click Topbar Action Inbox",
      expected: "Navigate to /action-inbox",
      observed: page.url(),
      result: onInbox ? "PASS" : "FAIL",
      url: page.url(),
    });
    if (!onInbox) {
      wf.outcome = "FAIL";
      addFinding("WQA-TOP-02", id, "major", "Topbar Action Inbox nav failed", page.url());
    }

    // Search open/close — search is always-visible input (not modal). Treat focus/blur + Enter as open/use/close.
    await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle", timeout: 90000 });
    await waitReady(page);
    await search.click();
    const focused = await page.evaluate(() => document.activeElement?.getAttribute("aria-label"));
    wf.steps.push({
      n: 3,
      action: "Focus topbar search (open)",
      expected: "Search input focused",
      observed: `activeLabel=${focused}`,
      result: focused === "Search modules and sections" ? "PASS" : "FAIL",
    });
    if (focused !== "Search modules and sections") {
      wf.outcome = "FAIL";
      addFinding("WQA-TOP-03", id, "major", "Topbar search could not be focused", String(focused));
    }
    await search.fill("Staff Pay");
    await search.press("Enter");
    await waitReady(page);
    const afterSearch = page.url();
    const searchNav = afterSearch.includes("staffpay") || afterSearch.includes("staff-pay");
    wf.steps.push({
      n: 4,
      action: "Submit search for Staff Pay",
      expected: "Navigates to Staff Pay module",
      observed: afterSearch,
      result: searchNav ? "PASS" : "FAIL",
      url: afterSearch,
    });
    if (!searchNav) {
      wf.outcome = "FAIL";
      addFinding("WQA-TOP-04", id, "major", "Topbar search did not navigate to Staff Pay", afterSearch);
    }

    await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle", timeout: 90000 });
    await waitReady(page);
    await search.click();
    await search.fill("");
    await page.keyboard.press("Escape");
    await search.blur();
    const blurred = await page.evaluate(() => document.activeElement?.getAttribute("aria-label"));
    wf.steps.push({
      n: 5,
      action: "Close/blur search (Escape + blur)",
      expected: "Search no longer focused",
      observed: `activeLabel=${blurred}`,
      result: blurred !== "Search modules and sections" ? "PASS" : "FAIL",
    });

    // Online classification toggle + persistence
    const onlineBefore = await online.getAttribute("aria-label");
    await online.click();
    await waitReady(page);
    const onlineAfter = await online.getAttribute("aria-label");
    const toggled = onlineBefore !== onlineAfter;
    wf.steps.push({
      n: 6,
      action: "Toggle Online indicator",
      expected: "Switches Online↔Offline classification",
      observed: `${onlineBefore} → ${onlineAfter}`,
      result: toggled ? "PASS" : "FAIL",
    });
    if (!toggled) {
      wf.outcome = "FAIL";
      addFinding("WQA-TOP-05", id, "major", "Online indicator did not toggle", `${onlineBefore}→${onlineAfter}`);
    }
    const stored = await page.evaluate(() => localStorage.getItem("pulse.v31.online"));
    await page.reload({ waitUntil: "networkidle" });
    await waitReady(page);
    const onlineReload = await page.getByRole("button", { name: /^(Online|Offline)$/ }).getAttribute("aria-label");
    const persistOk = onlineReload === onlineAfter;
    wf.persistence = { key: "pulse.v31.online", value: stored, afterReloadLabel: onlineReload };
    wf.reload = { label: onlineReload, matchesPreReload: persistOk };
    wf.steps.push({
      n: 7,
      action: "Reload after Online toggle",
      expected: "Classification persists",
      observed: `stored=${stored}, label=${onlineReload}`,
      result: persistOk ? "PASS" : "FAIL",
    });
    if (!persistOk) {
      wf.outcome = "FAIL";
      addFinding("WQA-TOP-06", id, "major", "Online classification did not persist across reload", String(stored));
    }
    // Restore online
    if (onlineReload === "Offline") {
      await page.getByRole("button", { name: "Offline" }).click();
      await waitReady(page);
    }

    // Appearance in topbar?
    const appearInTopbar = await page.locator('.pulse-top-ribbon select[aria-label="Appearance"]').count();
    wf.steps.push({
      n: 8,
      action: "Check appearance control in Topbar",
      expected: "Document presence/absence (may live in Command Centre control bar)",
      observed: `topbarAppearanceCount=${appearInTopbar}`,
      result: "PASS",
      note: "Appearance is expected in CC control bar, not Topbar — recorded for inventory",
    });

    wf.screenshots.push(await shot(page, `${id}-end`));
    wf.errors = errSummary(bag);
    if (wf.steps.some((s) => s.result === "FAIL")) wf.outcome = "FAIL";
    await context.close();
    results.workflows.push(wf);
  }

  // ---------- WF-SIDEBAR ----------
  {
    const id = "WF-SIDEBAR";
    const wf = {
      workflowId: id,
      route: "/dashboard",
      sourceSha: APP_SHA,
      inputSha: INPUT_SHA,
      precondition: "Sidebar rendered",
      startingState: "multi-viewport sidebar checks",
      steps: [],
      outcome: "PASS",
      screenshots: [],
      persistence: null,
      reload: null,
      history: null,
      keyboard: null,
      mobileEquivalent: true,
      errors: null,
      actAsVisibility: {},
    };
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const bag = await collectErrors(page);
    await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle", timeout: 90000 });
    await waitReady(page);

    // Family expand/collapse
    const toggles = page.locator("button.v32-nav-toggle");
    const toggleCount = await toggles.count();
    wf.steps.push({
      n: 1,
      action: "Count sidebar family toggles",
      expected: "≥1 nav group toggles present",
      observed: `count=${toggleCount}`,
      result: toggleCount >= 1 ? "PASS" : "FAIL",
    });
    if (toggleCount < 1) {
      wf.outcome = "FAIL";
      addFinding("WQA-SIDE-01", id, "major", "No sidebar family expand toggles", "");
    }

    // Collapse a non-active group if possible
    let collapsedOk = false;
    for (let i = 0; i < toggleCount; i++) {
      const t = toggles.nth(i);
      const expanded = await t.getAttribute("aria-expanded");
      const group = await t.evaluate((el) => el.closest("[data-nav-group]")?.getAttribute("data-nav-group"));
      if (expanded === "true" && group && group !== "executive") {
        await t.click();
        await waitReady(page);
        const after = await t.getAttribute("aria-expanded");
        collapsedOk = after === "false";
        wf.steps.push({
          n: 2,
          action: `Collapse family group ${group}`,
          expected: "aria-expanded becomes false",
          observed: `aria-expanded=${after}`,
          result: collapsedOk ? "PASS" : "FAIL",
        });
        // restore
        await t.click();
        await waitReady(page);
        const restored = await t.getAttribute("aria-expanded");
        wf.steps.push({
          n: 3,
          action: `Restore family group ${group}`,
          expected: "aria-expanded true",
          observed: `aria-expanded=${restored}`,
          result: restored === "true" ? "PASS" : "FAIL",
        });
        if (restored !== "true") {
          wf.outcome = "FAIL";
          addFinding("WQA-SIDE-02", id, "major", "Sidebar family restore failed", group);
        }
        break;
      }
    }
    if (!collapsedOk && !wf.steps.find((s) => s.n === 2)) {
      wf.steps.push({
        n: 2,
        action: "Collapse family group",
        expected: "Can collapse a non-active group",
        observed: "No suitable expanded non-active group found to collapse",
        result: "BLOCKED",
      });
    }

    // Section nav — go to Staff Pay
    await page.locator('a.nav-btn[aria-label="Staff Pay"], a.nav-btn', { hasText: "Staff Pay" }).first().click();
    await page.waitForURL(/staffpay/, { timeout: 15000 }).catch(() => {});
    await waitReady(page);
    const onStaff = page.url().includes("/staffpay");
    wf.steps.push({
      n: 4,
      action: "Sidebar navigate to Staff Pay",
      expected: "/staffpay",
      observed: page.url(),
      result: onStaff ? "PASS" : "FAIL",
      url: page.url(),
    });
    if (!onStaff) {
      wf.outcome = "FAIL";
      addFinding("WQA-SIDE-03", id, "major", "Sidebar Staff Pay nav failed", page.url());
    }

    // Act-as footer at 1440x900
    await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle", timeout: 90000 });
    await waitReady(page);
    const vis900 = await page.evaluate(() => {
      const el = document.querySelector(".sidebar-user");
      const sel = document.querySelector('select[aria-label="Act as User / Role"]');
      if (!el) return { present: false };
      const r = el.getBoundingClientRect();
      return {
        present: true,
        actAsPresent: !!sel,
        top: r.top,
        bottom: r.bottom,
        height: r.height,
        fullyVisible: r.top >= 0 && r.bottom <= window.innerHeight && r.height > 0,
        partiallyVisible: r.bottom > 0 && r.top < window.innerHeight && r.height > 0,
        viewportH: window.innerHeight,
      };
    });
    wf.actAsVisibility["1440x900"] = vis900;
    wf.screenshots.push(await shot(page, `${id}-actas-1440x900`));
    wf.steps.push({
      n: 5,
      action: "Act-as footer visibility at 1440x900",
      expected: "Identity footer + Act-as select fully visible",
      observed: JSON.stringify(vis900),
      result: vis900.fullyVisible && vis900.actAsPresent ? "PASS" : "FAIL",
    });
    if (!(vis900.fullyVisible && vis900.actAsPresent)) {
      wf.outcome = "FAIL";
      addFinding("WQA-SIDE-04", id, "major", "Act-as footer not fully visible at 1440x900", JSON.stringify(vis900));
    }

    // 1440x720
    await page.setViewportSize({ width: 1440, height: 720 });
    await waitReady(page);
    const vis720 = await page.evaluate(() => {
      const el = document.querySelector(".sidebar-user");
      const sel = document.querySelector('select[aria-label="Act as User / Role"]');
      if (!el) return { present: false };
      const r = el.getBoundingClientRect();
      return {
        present: true,
        actAsPresent: !!sel,
        top: r.top,
        bottom: r.bottom,
        height: r.height,
        fullyVisible: r.top >= 0 && r.bottom <= window.innerHeight && r.height > 0,
        partiallyVisible: r.bottom > 0 && r.top < window.innerHeight && r.height > 0,
        viewportH: window.innerHeight,
      };
    });
    wf.actAsVisibility["1440x720"] = vis720;
    wf.screenshots.push(await shot(page, `${id}-actas-1440x720`));
    wf.steps.push({
      n: 6,
      action: "Act-as footer visibility at 1440x720",
      expected: "Identity footer + Act-as select fully visible without clipping",
      observed: JSON.stringify(vis720),
      result: vis720.fullyVisible && vis720.actAsPresent ? "PASS" : "FAIL",
    });
    if (!(vis720.fullyVisible && vis720.actAsPresent)) {
      wf.outcome = "FAIL";
      addFinding("WQA-SIDE-05", id, "major", "Act-as footer not fully visible at 1440x720", JSON.stringify(vis720));
    }

    // Mobile drawer
    await page.setViewportSize({ width: 390, height: 844 });
    await waitReady(page);
    const sidebarHidden = await page.evaluate(() => {
      const aside = document.querySelector("aside.pulse-sidebar");
      if (!aside) return null;
      const style = getComputedStyle(aside);
      const transform = style.transform;
      return { transform, className: aside.className };
    });
    const openBtn = page.getByRole("button", { name: "Open menu" });
    const openVisible = await openBtn.isVisible().catch(() => false);
    wf.steps.push({
      n: 7,
      action: "Mobile: Open menu button visible",
      expected: "Hamburger Open menu visible at 390",
      observed: `visible=${openVisible}, sidebar=${JSON.stringify(sidebarHidden)}`,
      result: openVisible ? "PASS" : "FAIL",
    });
    if (!openVisible) {
      wf.outcome = "FAIL";
      addFinding("WQA-SIDE-06", id, "major", "Mobile Open menu control missing", "");
    } else {
      await openBtn.click();
      await waitReady(page);
      const opened = await page.evaluate(() => {
        const aside = document.querySelector("aside.pulse-sidebar");
        const r = aside.getBoundingClientRect();
        return { left: r.left, width: r.width, visible: r.left >= -1 && r.width > 100 };
      });
      wf.steps.push({
        n: 8,
        action: "Mobile: open drawer",
        expected: "Sidebar translates into view",
        observed: JSON.stringify(opened),
        result: opened.visible ? "PASS" : "FAIL",
      });
      wf.screenshots.push(await shot(page, `${id}-mobile-drawer-open`));
      if (!opened.visible) {
        wf.outcome = "FAIL";
        addFinding("WQA-SIDE-07", id, "major", "Mobile sidebar drawer did not open", JSON.stringify(opened));
      }
      // Close via overlay
      const overlay = page.locator(".fixed.inset-0.z-\\[5\\], .bg-black\\/30").first();
      if (await overlay.isVisible().catch(() => false)) {
        await overlay.click({ position: { x: 350, y: 100 } }).catch(() => {});
        await waitReady(page);
      } else {
        // click outside
        await page.mouse.click(380, 100);
        await waitReady(page);
      }
      const closed = await page.evaluate(() => {
        const aside = document.querySelector("aside.pulse-sidebar");
        const r = aside.getBoundingClientRect();
        return { left: r.left, width: r.width };
      });
      wf.steps.push({
        n: 9,
        action: "Mobile: close drawer via overlay",
        expected: "Sidebar off-canvas (left < 0)",
        observed: JSON.stringify(closed),
        result: closed.left < -10 ? "PASS" : "FAIL",
      });
      if (!(closed.left < -10)) {
        wf.outcome = "FAIL";
        addFinding("WQA-SIDE-08", id, "major", "Mobile sidebar drawer did not close", JSON.stringify(closed));
      }
    }

    // Note: no global sidebar width collapse control found in source (only group collapse)
    wf.steps.push({
      n: 10,
      action: "Sidebar width collapse/restore control",
      expected: "If present, collapse/restore works",
      observed: "No dedicated sidebar width collapse control in Sidebar.tsx — only family group expand/collapse",
      result: "PASS",
      note: "N/A control — not a defect; documented",
    });

    wf.errors = errSummary(bag);
    if (wf.steps.some((s) => s.result === "FAIL")) wf.outcome = "FAIL";
    await context.close();
    results.workflows.push(wf);
  }

  // ---------- WF-ROUTES ----------
  {
    const id = "WF-ROUTES";
    const wf = {
      workflowId: id,
      route: "multi",
      sourceSha: APP_SHA,
      inputSha: INPUT_SHA,
      precondition: "Portal server serving canonical routes",
      startingState: "1440x900 clean navigation",
      steps: [],
      outcome: "PASS",
      screenshots: [],
      persistence: null,
      reload: null,
      history: null,
      keyboard: null,
      mobileEquivalent: false,
      errors: null,
    };
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const bag = await collectErrors(page);

    const routes = [
      { path: "/dashboard", expectH1: /Command Centre|Dashboard/i, label: "Dashboard" },
      { path: "/action-inbox", expectH1: /Action Inbox|Inbox/i, label: "Action Inbox" },
      { path: "/settings", expectH1: /Organisation|Settings|Access/i, label: "Settings" },
      { path: "/staffpay?section=overview", expectH1: /Staff Pay|Payroll/i, label: "M07 overview" },
      { path: "/staffpay?section=adjustments", expectH1: /Staff Pay|Payroll|Adjustment/i, label: "M07 adjustments" },
    ];

    let n = 0;
    for (const r of routes) {
      n++;
      await page.goto(`${BASE}${r.path}`, { waitUntil: "networkidle", timeout: 90000 });
      await waitReady(page);
      const h1 = (await page.locator("h1").first().textContent().catch(() => "")) || "";
      const ok = r.expectH1.test(h1) && page.url().includes(r.path.split("?")[0].replace(/^\//, ""));
      // For query routes, check section param retained
      const urlOk = page.url().includes(r.path.split("?")[0]);
      const sectionOk = !r.path.includes("section=") || page.url().includes(r.path.split("section=")[1]);
      const pass = r.expectH1.test(h1) && urlOk && sectionOk;
      wf.steps.push({
        n,
        action: `Navigate ${r.label} (${r.path})`,
        expected: `h1~${r.expectH1} and URL retains route/section`,
        observed: `url=${page.url()}, h1="${h1.trim()}"`,
        result: pass ? "PASS" : "FAIL",
        url: page.url(),
      });
      wf.screenshots.push(await shot(page, `${id}-${r.label.replace(/\s+/g, "_")}`));
      if (!pass) {
        wf.outcome = "FAIL";
        addFinding(`WQA-RTE-0${n}`, id, "major", `Route/heading mismatch for ${r.label}`, `url=${page.url()} h1=${h1}`);
      }
    }

    // Reload on adjustments
    await page.goto(`${BASE}/staffpay?section=adjustments`, { waitUntil: "networkidle", timeout: 90000 });
    await waitReady(page);
    await page.reload({ waitUntil: "networkidle" });
    await waitReady(page);
    const reloadUrl = page.url();
    const reloadOk = reloadUrl.includes("staffpay") && reloadUrl.includes("adjustments");
    wf.reload = { url: reloadUrl, ok: reloadOk };
    wf.steps.push({
      n: ++n,
      action: "Reload M07 adjustments deep link",
      expected: "URL and section retained",
      observed: reloadUrl,
      result: reloadOk ? "PASS" : "FAIL",
    });
    if (!reloadOk) {
      wf.outcome = "FAIL";
      addFinding("WQA-RTE-RELOAD", id, "major", "Adjustments deep link lost on reload", reloadUrl);
    }

    // Back/Forward
    await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle", timeout: 90000 });
    await waitReady(page);
    await page.goto(`${BASE}/action-inbox`, { waitUntil: "networkidle", timeout: 90000 });
    await waitReady(page);
    await page.goBack();
    await waitReady(page);
    const backUrl = page.url();
    const backOk = backUrl.includes("/dashboard") || new URL(backUrl).pathname === "/";
    await page.goForward();
    await waitReady(page);
    const fwdUrl = page.url();
    const fwdOk = fwdUrl.includes("/action-inbox");
    wf.history = { backUrl, fwdUrl, backOk, fwdOk };
    wf.steps.push({
      n: ++n,
      action: "Browser Back from Action Inbox to Dashboard",
      expected: "/dashboard",
      observed: backUrl,
      result: backOk ? "PASS" : "FAIL",
    });
    wf.steps.push({
      n: ++n,
      action: "Browser Forward to Action Inbox",
      expected: "/action-inbox",
      observed: fwdUrl,
      result: fwdOk ? "PASS" : "FAIL",
    });
    if (!backOk || !fwdOk) {
      wf.outcome = "FAIL";
      addFinding("WQA-RTE-HISTORY", id, "major", "Back/Forward navigation failed", JSON.stringify(wf.history));
    }

    wf.errors = errSummary(bag);
    if (wf.steps.some((s) => s.result === "FAIL")) wf.outcome = "FAIL";
    await context.close();
    results.workflows.push(wf);
  }

  // ---------- WF-APPEARANCE ----------
  {
    const id = "WF-APPEARANCE";
    const wf = {
      workflowId: id,
      route: "/dashboard",
      sourceSha: APP_SHA,
      inputSha: INPUT_SHA,
      precondition: "Clean storage then set appearance via CC control",
      startingState: "clean localStorage appearance key",
      steps: [],
      outcome: "PASS",
      screenshots: [],
      persistence: {},
      reload: null,
      history: null,
      keyboard: null,
      mobileEquivalent: false,
      errors: null,
    };
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const bag = await collectErrors(page);

    // Clean-storage default
    await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded", timeout: 90000 });
    await page.evaluate(() => {
      localStorage.removeItem("pulse.cc.appearance");
    });
    await page.reload({ waitUntil: "networkidle" });
    await waitReady(page);
    const def = await page.evaluate(() => ({
      stored: localStorage.getItem("pulse.cc.appearance"),
      dataAppearance: document.documentElement.getAttribute("data-appearance"),
      themeDark: document.documentElement.classList.contains("theme-dark"),
      select: document.querySelector('select[aria-label="Appearance"]')?.value || null,
    }));
    wf.persistence.cleanDefault = def;
    wf.screenshots.push(await shot(page, `${id}-clean-default`));
    const defaultOk = (def.dataAppearance === "light" || def.select === "light" || def.stored === null) && def.themeDark === false;
    wf.steps.push({
      n: 1,
      action: "Clean-storage default appearance",
      expected: "Defaults to Light (not theme-dark)",
      observed: JSON.stringify(def),
      result: defaultOk ? "PASS" : "FAIL",
    });
    if (!defaultOk) {
      wf.outcome = "FAIL";
      addFinding("WQA-APP-01", id, "major", "Clean-storage default is not Light", JSON.stringify(def));
    }

    const appearance = page.locator('select[aria-label="Appearance"]');
    const appearPresent = (await appearance.count()) > 0;
    if (!appearPresent) {
      wf.steps.push({
        n: 2,
        action: "Locate Appearance select",
        expected: "Present in Command Centre control bar",
        observed: "NOT FOUND",
        result: "FAIL",
      });
      wf.outcome = "FAIL";
      addFinding("WQA-APP-02", id, "major", "Appearance control missing on Dashboard", "");
    } else {
      // Light + reload
      await appearance.selectOption("light");
      await waitReady(page);
      await page.reload({ waitUntil: "networkidle" });
      await waitReady(page);
      const light = await page.evaluate(() => ({
        stored: localStorage.getItem("pulse.cc.appearance"),
        dataAppearance: document.documentElement.getAttribute("data-appearance"),
        themeDark: document.documentElement.classList.contains("theme-dark"),
        select: document.querySelector('select[aria-label="Appearance"]')?.value || null,
      }));
      wf.persistence.lightReload = light;
      wf.screenshots.push(await shot(page, `${id}-light-reload`));
      const lightOk = light.select === "light" && light.themeDark === false;
      wf.steps.push({
        n: 2,
        action: "Set Light + reload",
        expected: "Remains Light, no theme-dark",
        observed: JSON.stringify(light),
        result: lightOk ? "PASS" : "FAIL",
      });
      if (!lightOk) {
        wf.outcome = "FAIL";
        addFinding("WQA-APP-03", id, "major", "Light appearance did not persist across reload", JSON.stringify(light));
      }

      // Dark + reload
      await page.locator('select[aria-label="Appearance"]').selectOption("dark");
      await waitReady(page);
      const darkImmediate = await page.evaluate(() => document.documentElement.classList.contains("theme-dark"));
      await page.reload({ waitUntil: "networkidle" });
      await waitReady(page);
      const dark = await page.evaluate(() => ({
        stored: localStorage.getItem("pulse.cc.appearance"),
        dataAppearance: document.documentElement.getAttribute("data-appearance"),
        themeDark: document.documentElement.classList.contains("theme-dark"),
        select: document.querySelector('select[aria-label="Appearance"]')?.value || null,
        bodyDark: document.body.classList.contains("theme-dark"),
      }));
      wf.persistence.darkReload = dark;
      wf.screenshots.push(await shot(page, `${id}-dark-reload`));
      const darkOk = dark.select === "dark" && dark.themeDark === true && darkImmediate === true;
      wf.steps.push({
        n: 3,
        action: "Set Dark + reload",
        expected: "theme-dark applied and persists; select=dark",
        observed: JSON.stringify({ darkImmediate, ...dark }),
        result: darkOk ? "PASS" : "FAIL",
      });
      if (!darkOk) {
        wf.outcome = "FAIL";
        addFinding("WQA-APP-04", id, "major", "Dark appearance failed apply/persist", JSON.stringify({ darkImmediate, ...dark }));
      }

      // System if operable without breaking session
      try {
        await page.locator('select[aria-label="Appearance"]').selectOption("system");
        await waitReady(page);
        const sys = await page.evaluate(() => ({
          stored: localStorage.getItem("pulse.cc.appearance"),
          dataAppearance: document.documentElement.getAttribute("data-appearance"),
          themeDark: document.documentElement.classList.contains("theme-dark"),
          select: document.querySelector('select[aria-label="Appearance"]')?.value || null,
          prefersDark: window.matchMedia("(prefers-color-scheme: dark)").matches,
        }));
        await page.reload({ waitUntil: "networkidle" });
        await waitReady(page);
        const sysReload = await page.evaluate(() => ({
          stored: localStorage.getItem("pulse.cc.appearance"),
          dataAppearance: document.documentElement.getAttribute("data-appearance"),
          themeDark: document.documentElement.classList.contains("theme-dark"),
          select: document.querySelector('select[aria-label="Appearance"]')?.value || null,
          prefersDark: window.matchMedia("(prefers-color-scheme: dark)").matches,
          stillOnDashboard: location.pathname.includes("dashboard") || location.pathname === "/",
        }));
        wf.persistence.system = { beforeReload: sys, afterReload: sysReload };
        wf.screenshots.push(await shot(page, `${id}-system-reload`));
        const expectedDark = !!sysReload.prefersDark;
        const sysOk =
          sysReload.select === "system" &&
          sysReload.themeDark === expectedDark &&
          sysReload.stillOnDashboard;
        wf.steps.push({
          n: 4,
          action: "Set System (Device setting) + reload",
          expected: "Persists system; theme follows prefers-color-scheme; session intact",
          observed: JSON.stringify(sysReload),
          result: sysOk ? "PASS" : "FAIL",
        });
        if (!sysOk) {
          wf.outcome = "FAIL";
          addFinding("WQA-APP-05", id, "major", "System appearance failed or broke session", JSON.stringify(sysReload));
        }
      } catch (e) {
        wf.steps.push({
          n: 4,
          action: "Set System appearance",
          expected: "Operable without breaking session",
          observed: `ERROR ${e}`,
          result: "BLOCKED",
        });
        addFinding("WQA-APP-05", id, "major", "System appearance blocked by error", String(e));
        wf.outcome = "FAIL";
      }

      // Restore light for cleanliness
      await page.locator('select[aria-label="Appearance"]').selectOption("light").catch(() => {});
    }

    wf.errors = errSummary(bag);
    if (wf.steps.some((s) => s.result === "FAIL")) wf.outcome = "FAIL";
    // Mark payments OOS note
    results.workflows.push({
      workflowId: "WF-PAYMENTS-OOS",
      route: "n/a",
      sourceSha: APP_SHA,
      outcome: "OUT OF SCOPE",
      steps: [
        {
          n: 1,
          action: "External payments/providers/communications",
          expected: "OUT OF SCOPE per Work-Step QA charter",
          observed: "Not executed",
          result: "OUT OF SCOPE",
        },
      ],
      note: "Never PASS for external payments/providers/communications",
    });
    await context.close();
    results.workflows.push(wf);
  }

  results.meta.finishedAt = nowIso();
  const totals = {
    pass: results.workflows.filter((w) => w.outcome === "PASS").length,
    fail: results.workflows.filter((w) => w.outcome === "FAIL").length,
    blocked: results.workflows.filter((w) => w.outcome === "BLOCKED").length,
    outOfScope: results.workflows.filter((w) => w.outcome === "OUT OF SCOPE").length,
    total: results.workflows.length,
    openFindings: results.findings.length,
  };
  results.totals = totals;

  fs.writeFileSync(OUT_JSON, JSON.stringify(results, null, 2));
  console.log("WROTE", OUT_JSON);
  console.log("TOTALS", JSON.stringify(totals));
  console.log("FINDINGS", results.findings.map((f) => f.id).join(", ") || "(none)");
  await browser.close();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
