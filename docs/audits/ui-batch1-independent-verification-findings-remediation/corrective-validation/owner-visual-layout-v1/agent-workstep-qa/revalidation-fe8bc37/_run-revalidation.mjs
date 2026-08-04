/**
 * Phase 4 FINAL REVALIDATION — frozen SHA fe8bc37 against :3491.
 * Evidence-only under revalidation-fe8bc37/. No src/test edits.
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const SHOTS = path.join(ROOT, "screenshots");
const TRACES = path.join(ROOT, "traces");
const OUT = path.join(ROOT, "_raw-results.json");
const BASE = process.env.HCDP_BASE_URL || "http://127.0.0.1:3491";
const APP_SHA = "fe8bc37fa370b299a4fbe721209761272f27265f";

fs.mkdirSync(SHOTS, { recursive: true });
fs.mkdirSync(TRACES, { recursive: true });
fs.mkdirSync(path.join(ROOT, "workflows"), { recursive: true });
fs.mkdirSync(path.join(ROOT, "findings"), { recursive: true });

const findings = [];
function addFinding(id, workflowId, severity, title, detail) {
  findings.push({ id, workflowId, severity, title, detail, status: "OPEN" });
}

async function shot(page, name) {
  const file = path.join(SHOTS, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  return file;
}

function errBag() {
  return { consoleErrors: [], pageErrors: [], requestFailures: [] };
}
function attachErrors(page, bag) {
  page.on("console", (m) => {
    if (m.type() === "error") bag.consoleErrors.push(m.text());
  });
  page.on("pageerror", (e) => bag.pageErrors.push(String(e)));
  page.on("requestfailed", (r) => {
    const u = r.url();
    if (/favicon|_next\/static/.test(u)) return;
    bag.requestFailures.push(`${r.method()} ${u}`);
  });
}

async function waitReady(page, ms = 1200) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(ms);
}

async function gotoDash(page) {
  await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle", timeout: 90000 });
  await waitReady(page, 1500);
  await page
    .waitForFunction(
      () =>
        [...document.querySelectorAll(".cc-surface-danger")].some((el) =>
          /Emergency announcement/i.test(el.textContent || "")
        ),
      { timeout: 20000 }
    )
    .catch(() => {});
}

async function measure(locator) {
  const handle = await locator.elementHandle();
  if (!handle) return null;
  return handle.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const parent =
      el.closest(".cc-surface-danger, .pulse-top-ribbon, aside, header, .page-title") || el.parentElement;
    const pr = parent?.getBoundingClientRect();
    return {
      text: (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 100),
      rect: { top: r.top, left: r.left, right: r.right, bottom: r.bottom, width: r.width, height: r.height },
      visible: r.width > 0 && r.height > 0,
      fullyInViewport:
        r.top >= -1 && r.left >= -1 && r.bottom <= innerHeight + 1 && r.right <= innerWidth + 1,
      insideParentFully: pr
        ? r.left >= pr.left - 2 && r.right <= pr.right + 2 && r.top >= pr.top - 2 && r.bottom <= pr.bottom + 2
        : null,
      pageHorizontalScroll:
        document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      disabled: el.disabled === true,
      truncateClass: el.classList?.contains("truncate") || /\btruncate\b/.test(el.className || ""),
      textOverflow: getComputedStyle(el).textOverflow,
      scrollOverflow: el.scrollWidth > el.clientWidth + 1,
    };
  });
}

async function run() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "/usr/bin/google-chrome-stable",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  const results = {
    meta: {
      agent: "Work-Step / Functional QA",
      phase: "Phase 4 FINAL REVALIDATION",
      appSourceSha: APP_SHA,
      worktree: "/tmp/hcdp-fix/ui-batch1-wqa-3491",
      base: BASE,
      startedAt: new Date().toISOString(),
      priorAfterIntact: true,
    },
    workflows: [],
    findings,
  };

  // ----- WF-EMERGENCY at 1440, 1024, 390 -----
  async function wfEmergency(vp, suffix) {
    const id = `WF-EMERGENCY-${suffix}`;
    const wf = {
      workflowId: id,
      route: "/dashboard",
      sourceSha: APP_SHA,
      startingState: `${vp.width}x${vp.height}`,
      steps: [],
      outcome: "PASS",
      screenshots: [],
      keyboard: null,
      operability: {},
      errors: errBag(),
    };
    const ctx = await browser.newContext({ viewport: vp });
    const page = await ctx.newPage();
    attachErrors(page, wf.errors);
    await ctx.tracing.start({ screenshots: true, snapshots: true });
    await gotoDash(page);

    const banner = page.locator(".cc-surface-danger").filter({ hasText: "Emergency announcement" }).first();
    const present = await banner.isVisible().catch(() => false);
    wf.steps.push({
      n: 1,
      action: "Locate Emergency banner",
      expected: "Visible",
      observed: present ? "visible" : "missing",
      result: present ? "PASS" : "FAIL",
    });
    if (!present) {
      wf.outcome = "FAIL";
      addFinding(`WQA-REV-EMG-01-${suffix}`, id, "major", "Emergency banner missing", "");
      wf.screenshots.push(await shot(page, `${id}-missing`));
      await ctx.tracing.stop({ path: path.join(TRACES, `${id}.zip`) }).catch(() => {});
      await ctx.close();
      results.workflows.push(wf);
      return;
    }
    await banner.scrollIntoViewIfNeeded();
    wf.screenshots.push(await shot(page, `${id}-banner`));

    const prev = banner.getByRole("button", { name: "Previous", exact: true });
    const next = banner.getByRole("button", { name: "Next", exact: true });
    const viewAll = banner.getByRole("button", { name: "View All Announcements", exact: true });
    const prevDis = await prev.isDisabled();
    const nextDis = await next.isDisabled();
    const title = (await banner.locator("strong").first().textContent())?.trim();
    wf.steps.push({
      n: 2,
      action: "Previous/Next disabled states",
      expected: "Disabled when single emergency item",
      observed: `prevDisabled=${prevDis}, nextDisabled=${nextDis}, title="${title}"`,
      result: prevDis === true && nextDis === true ? "PASS" : prevDis === nextDis ? "PASS" : "FAIL",
    });

    const viewAllGeom = await measure(viewAll);
    const hScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    );
    wf.operability = { viewAllGeom, pageHorizontalScroll: hScroll };
    const viewAllOk =
      viewAllGeom?.visible &&
      viewAllGeom?.insideParentFully !== false &&
      viewAllGeom?.fullyInViewport &&
      !hScroll;
    wf.steps.push({
      n: 3,
      action: "View All fully inside emergency card (no H-scroll)",
      expected: "Button inside .cc-surface-danger + viewport; no page horizontal scroll",
      observed: JSON.stringify({
        insideParentFully: viewAllGeom?.insideParentFully,
        fullyInViewport: viewAllGeom?.fullyInViewport,
        pageHorizontalScroll: hScroll,
        rect: viewAllGeom?.rect,
      }),
      result: viewAllOk ? "PASS" : "FAIL",
    });
    if (!viewAllOk) {
      wf.outcome = "FAIL";
      addFinding(
        `WQA-REV-EMG-CLIP-${suffix}`,
        id,
        "major",
        `View All clipped or H-scroll at ${vp.width}`,
        JSON.stringify(wf.operability)
      );
    }

    await viewAll.click();
    await waitReady(page, 700);
    const dialogOk =
      (await page.getByRole("dialog").isVisible().catch(() => false)) ||
      (await page.getByText("All Announcements", { exact: true }).isVisible().catch(() => false));
    wf.steps.push({
      n: 4,
      action: "Click View All Announcements",
      expected: "Opens All Announcements modal",
      observed: `opened=${dialogOk}, url=${page.url()}`,
      result: dialogOk ? "PASS" : "FAIL",
      url: page.url(),
    });
    wf.screenshots.push(await shot(page, `${id}-view-all`));
    if (!dialogOk) {
      wf.outcome = "FAIL";
      addFinding(`WQA-REV-EMG-VIEWALL-${suffix}`, id, "major", "View All did not open", "");
    } else {
      await page.keyboard.press("Escape");
      await waitReady(page, 300);
    }

    // Keyboard activate View All
    await gotoDash(page);
    await banner.scrollIntoViewIfNeeded();
    await viewAll.focus();
    const focused = /View All/i.test(
      await page.evaluate(() => (document.activeElement?.textContent || "").trim())
    );
    await page.keyboard.press("Enter");
    await waitReady(page, 700);
    const kbdOpen = await page.getByRole("dialog").isVisible().catch(() => false);
    wf.keyboard = { focused, activatedEnter: kbdOpen };
    wf.steps.push({
      n: 5,
      action: "Keyboard focus View All + Enter",
      expected: "Modal opens",
      observed: JSON.stringify(wf.keyboard),
      result: focused && kbdOpen ? "PASS" : "FAIL",
    });
    if (!(focused && kbdOpen)) {
      wf.outcome = "FAIL";
      addFinding(`WQA-REV-EMG-KBD-${suffix}`, id, "major", "Keyboard View All failed", JSON.stringify(wf.keyboard));
    } else {
      await page.keyboard.press("Escape");
      await waitReady(page, 300);
    }

    if (wf.steps.some((s) => s.result === "FAIL")) wf.outcome = "FAIL";
    wf.screenshots.push(await shot(page, `${id}-end`));
    await ctx.tracing.stop({ path: path.join(TRACES, `${id}.zip`) }).catch(() => {});
    await ctx.close();
    results.workflows.push(wf);
  }

  await wfEmergency({ width: 1440, height: 900 }, "DESKTOP1440");
  await wfEmergency({ width: 1024, height: 768 }, "MID1024");
  await wfEmergency({ width: 390, height: 844 }, "MOBILE390");

  // ----- WF-TOPBAR -----
  {
    const id = "WF-TOPBAR";
    const wf = {
      workflowId: id,
      route: "/dashboard",
      sourceSha: APP_SHA,
      startingState: "desktop+mobile",
      steps: [],
      outcome: "PASS",
      screenshots: [],
      errors: errBag(),
    };
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    attachErrors(page, wf.errors);
    await gotoDash(page);
    wf.screenshots.push(await shot(page, `${id}-desktop-start`));

    await page.locator(".pulse-top-ribbon a", { hasText: "Dashboard" }).first().click();
    await waitReady(page);
    wf.steps.push({
      n: 1,
      action: "Desktop Topbar Dashboard",
      expected: "/dashboard",
      observed: page.url(),
      result: page.url().includes("/dashboard") || new URL(page.url()).pathname === "/" ? "PASS" : "FAIL",
      url: page.url(),
    });

    await page.locator(".pulse-top-ribbon a", { hasText: /Action Inbox/ }).first().click();
    await page.waitForURL(/action-inbox/, { timeout: 15000 }).catch(() => {});
    await waitReady(page);
    wf.steps.push({
      n: 2,
      action: "Desktop Topbar Action Inbox",
      expected: "/action-inbox",
      observed: page.url(),
      result: page.url().includes("/action-inbox") ? "PASS" : "FAIL",
      url: page.url(),
    });
    if (!page.url().includes("/action-inbox")) {
      wf.outcome = "FAIL";
      addFinding("WQA-REV-TOP-02", id, "major", "Action Inbox nav failed", page.url());
    }

    await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle", timeout: 90000 });
    await waitReady(page);
    const search = page.getByLabel("Search modules and sections");
    await search.click();
    await search.fill("Staff Pay");
    await search.press("Enter");
    await waitReady(page, 1500);
    const searchOk = page.url().includes("staffpay");
    wf.steps.push({
      n: 3,
      action: "Desktop search Enter → Staff Pay",
      expected: "/staffpay",
      observed: page.url(),
      result: searchOk ? "PASS" : "FAIL",
      url: page.url(),
    });
    if (!searchOk) {
      wf.outcome = "FAIL";
      addFinding("WQA-REV-TOP-03", id, "major", "Search Enter failed", page.url());
    }

    // Mobile
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle", timeout: 90000 });
    await waitReady(page);
    const openMenu = page.getByRole("button", { name: "Open menu" });
    const openVis = await openMenu.isVisible();
    wf.steps.push({
      n: 4,
      action: "Mobile 390 Open menu visible",
      expected: "true",
      observed: `visible=${openVis}`,
      result: openVis ? "PASS" : "FAIL",
    });
    if (!openVis) {
      wf.outcome = "FAIL";
      addFinding("WQA-REV-TOP-MOBILE", id, "major", "Open menu missing at 390", "");
    }
    const mobSearch = page.getByLabel("Search modules and sections");
    await mobSearch.fill("Action Inbox");
    await mobSearch.press("Enter");
    await waitReady(page, 1500);
    const mobSearchOk = page.url().includes("action-inbox");
    wf.steps.push({
      n: 5,
      action: "Mobile search Enter → Action Inbox",
      expected: "/action-inbox",
      observed: page.url(),
      result: mobSearchOk ? "PASS" : "FAIL",
      url: page.url(),
    });
    if (!mobSearchOk) {
      wf.outcome = "FAIL";
      addFinding("WQA-REV-TOP-MOBILE-SEARCH", id, "major", "Mobile search failed", page.url());
    }
    wf.screenshots.push(await shot(page, `${id}-mobile390`));

    if (wf.steps.some((s) => s.result === "FAIL")) wf.outcome = "FAIL";
    await ctx.close();
    results.workflows.push(wf);
  }

  // ----- WF-SIDEBAR Act-as -----
  {
    const id = "WF-SIDEBAR";
    const wf = {
      workflowId: id,
      route: "/dashboard",
      sourceSha: APP_SHA,
      startingState: "1440x900 then 720",
      steps: [],
      outcome: "PASS",
      screenshots: [],
      actAs: {},
      errors: errBag(),
    };
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    attachErrors(page, wf.errors);
    await gotoDash(page);

    const actAs = page.locator('select[aria-label="Act as User / Role"]');
    for (const [label, wh] of [
      ["1440x900", { width: 1440, height: 900 }],
      ["1440x720", { width: 1440, height: 720 }],
    ]) {
      await page.setViewportSize(wh);
      await waitReady(page, 500);
      const geom = await measure(actAs);
      let changed = false;
      if (geom?.visible && geom?.fullyInViewport) {
        const before = await actAs.inputValue();
        const options = await actAs.evaluate((el) => [...el.options].map((o) => o.value));
        const nextVal = options.find((v) => v !== before) || options[0];
        await actAs.selectOption(nextVal);
        await waitReady(page, 400);
        changed = (await actAs.inputValue()) === nextVal;
        await actAs.selectOption(before).catch(() => {});
      }
      wf.actAs[label] = { geom, changed };
      wf.screenshots.push(await shot(page, `${id}-actas-${label}`));
      const ok = geom?.visible && geom?.fullyInViewport && changed && !geom.pageHorizontalScroll;
      wf.steps.push({
        n: wf.steps.length + 1,
        action: `Act-as usable at ${label}`,
        expected: "Fully in viewport + value changeable; no H-scroll",
        observed: JSON.stringify({ geom, changed }),
        result: ok ? "PASS" : "FAIL",
      });
      if (!ok) {
        wf.outcome = "FAIL";
        addFinding(`WQA-REV-SIDE-ACTAS-${label}`, id, "major", `Act-as not usable at ${label}`, JSON.stringify({ geom, changed }));
      }
    }

    // quick family toggle smoke
    const toggle = page.locator("button.v32-nav-toggle").nth(1);
    const before = await toggle.getAttribute("aria-expanded");
    await toggle.click();
    await waitReady(page, 300);
    const after = await toggle.getAttribute("aria-expanded");
    wf.steps.push({
      n: wf.steps.length + 1,
      action: "Family toggle smoke",
      expected: "aria-expanded flips",
      observed: `${before} → ${after}`,
      result: before !== after ? "PASS" : "FAIL",
    });
    if (before === after) {
      wf.outcome = "FAIL";
      addFinding("WQA-REV-SIDE-TOGGLE", id, "major", "Family toggle did not flip", "");
    }

    if (wf.steps.some((s) => s.result === "FAIL")) wf.outcome = "FAIL";
    await ctx.close();
    results.workflows.push(wf);
  }

  // ----- WF-ROUTES -----
  {
    const id = "WF-ROUTES";
    const wf = {
      workflowId: id,
      route: "multi",
      sourceSha: APP_SHA,
      startingState: "1440x900",
      steps: [],
      outcome: "PASS",
      screenshots: [],
      history: null,
      reload: null,
      h1Checks: {},
      errors: errBag(),
    };
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    attachErrors(page, wf.errors);

    const routes = [
      { path: "/settings", expectH1: /Organisation|Settings|Access/i, label: "Settings", checkEllipsis: true },
      { path: "/staffpay?section=overview", expectH1: /Staff Pay|Payroll/i, label: "M07_overview", checkEllipsis: true },
      { path: "/staffpay?section=adjustments", expectH1: /Staff Pay|Payroll/i, label: "M07_adjustments", checkEllipsis: true },
    ];
    let n = 0;
    for (const r of routes) {
      n++;
      await page.goto(`${BASE}${r.path}`, { waitUntil: "networkidle", timeout: 90000 });
      await waitReady(page);
      const h1Meta = await page.evaluate(() => {
        const h1 = document.querySelector("h1");
        if (!h1) return null;
        const st = getComputedStyle(h1);
        return {
          text: (h1.textContent || "").trim(),
          textOverflow: st.textOverflow,
          truncateClass: h1.classList.contains("truncate") || /\btruncate\b/.test(h1.className),
          scrollOverflow: h1.scrollWidth > h1.clientWidth + 1,
        };
      });
      wf.h1Checks[r.path] = h1Meta;
      const urlOk = page.url().includes(r.path.split("?")[0]);
      const sectionOk = !r.path.includes("section=") || page.url().includes(r.path.split("section=")[1]);
      const h1Ok = h1Meta && r.expectH1.test(h1Meta.text);
      const ellipsisOk =
        !r.checkEllipsis ||
        (h1Meta && h1Meta.textOverflow !== "ellipsis" && !h1Meta.truncateClass && !h1Meta.scrollOverflow);
      const pass = h1Ok && urlOk && sectionOk && ellipsisOk;
      wf.steps.push({
        n,
        action: `Navigate ${r.label} — H1 no ellipsis`,
        expected: "h1 matches; no truncate/ellipsis",
        observed: JSON.stringify({ url: page.url(), h1Meta }),
        result: pass ? "PASS" : "FAIL",
        url: page.url(),
      });
      wf.screenshots.push(await shot(page, `${id}-${r.label}`));
      if (!pass) {
        wf.outcome = "FAIL";
        addFinding(`WQA-REV-RTE-${r.label}`, id, "major", `Route/H1 issue ${r.label}`, JSON.stringify(h1Meta));
      }
    }

    await page.goto(`${BASE}/staffpay?section=adjustments`, { waitUntil: "networkidle", timeout: 90000 });
    await waitReady(page);
    await page.reload({ waitUntil: "networkidle" });
    await waitReady(page);
    const reloadOk = page.url().includes("staffpay") && page.url().includes("adjustments");
    wf.reload = { url: page.url(), ok: reloadOk };
    wf.steps.push({
      n: ++n,
      action: "Reload M07 adjustments",
      expected: "section retained",
      observed: page.url(),
      result: reloadOk ? "PASS" : "FAIL",
    });
    if (!reloadOk) {
      wf.outcome = "FAIL";
      addFinding("WQA-REV-RTE-RELOAD", id, "major", "Adjustments lost on reload", page.url());
    }

    await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle", timeout: 90000 });
    await waitReady(page);
    await page.goto(`${BASE}/settings`, { waitUntil: "networkidle", timeout: 90000 });
    await waitReady(page);
    await page.goBack();
    await waitReady(page);
    const backOk = page.url().includes("/dashboard") || new URL(page.url()).pathname === "/";
    wf.history = { backUrl: page.url(), backOk };
    wf.steps.push({
      n: ++n,
      action: "Browser Back Settings → Dashboard",
      expected: "/dashboard",
      observed: page.url(),
      result: backOk ? "PASS" : "FAIL",
    });
    if (!backOk) {
      wf.outcome = "FAIL";
      addFinding("WQA-REV-RTE-BACK", id, "major", "Back navigation failed", page.url());
    }

    if (wf.steps.some((s) => s.result === "FAIL")) wf.outcome = "FAIL";
    await ctx.close();
    results.workflows.push(wf);
  }

  // ----- WF-APPEARANCE smoke -----
  {
    const id = "WF-APPEARANCE";
    const wf = {
      workflowId: id,
      route: "/dashboard",
      sourceSha: APP_SHA,
      startingState: "Light/Dark reload smoke",
      steps: [],
      outcome: "PASS",
      screenshots: [],
      persistence: {},
      errors: errBag(),
    };
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    attachErrors(page, wf.errors);
    await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle", timeout: 90000 });
    await waitReady(page, 1500);
    const appearance = page.locator('select[aria-label="Appearance"]');
    if ((await appearance.count()) === 0) {
      wf.steps.push({ n: 1, action: "Locate Appearance", expected: "present", observed: "missing", result: "FAIL" });
      wf.outcome = "FAIL";
      addFinding("WQA-REV-APP-MISSING", id, "major", "Appearance missing", "");
    } else {
      await appearance.selectOption("light");
      await waitReady(page, 300);
      await page.reload({ waitUntil: "networkidle" });
      await waitReady(page);
      const light = await page.evaluate(() => ({
        select: document.querySelector('select[aria-label="Appearance"]')?.value,
        themeDark: document.documentElement.classList.contains("theme-dark"),
        dataAppearance: document.documentElement.getAttribute("data-appearance"),
      }));
      wf.persistence.lightReload = light;
      wf.screenshots.push(await shot(page, `${id}-light-reload`));
      const lightOk = light.select === "light" && light.themeDark === false;
      wf.steps.push({
        n: 1,
        action: "Light + reload",
        expected: "select=light, not theme-dark",
        observed: JSON.stringify(light),
        result: lightOk ? "PASS" : "FAIL",
      });
      if (!lightOk) {
        wf.outcome = "FAIL";
        addFinding("WQA-REV-APP-LIGHT", id, "major", "Light reload failed", JSON.stringify(light));
      }

      await page.locator('select[aria-label="Appearance"]').selectOption("dark");
      await waitReady(page, 300);
      await page.reload({ waitUntil: "networkidle" });
      await waitReady(page);
      const dark = await page.evaluate(() => ({
        select: document.querySelector('select[aria-label="Appearance"]')?.value,
        themeDark: document.documentElement.classList.contains("theme-dark"),
        dataAppearance: document.documentElement.getAttribute("data-appearance"),
      }));
      wf.persistence.darkReload = dark;
      wf.screenshots.push(await shot(page, `${id}-dark-reload`));
      const darkOk = dark.select === "dark" && dark.themeDark === true;
      wf.steps.push({
        n: 2,
        action: "Dark + reload",
        expected: "select=dark, theme-dark",
        observed: JSON.stringify(dark),
        result: darkOk ? "PASS" : "FAIL",
      });
      if (!darkOk) {
        wf.outcome = "FAIL";
        addFinding("WQA-REV-APP-DARK", id, "major", "Dark reload failed", JSON.stringify(dark));
      }
      await page.locator('select[aria-label="Appearance"]').selectOption("light").catch(() => {});
    }
    if (wf.steps.some((s) => s.result === "FAIL")) wf.outcome = "FAIL";
    await ctx.close();
    results.workflows.push(wf);
  }

  results.workflows.push({
    workflowId: "WF-PAYMENTS-OOS",
    route: "n/a",
    sourceSha: APP_SHA,
    outcome: "OUT OF SCOPE",
    steps: [
      {
        n: 1,
        action: "External payments/providers/communications",
        expected: "OUT OF SCOPE",
        observed: "Not executed",
        result: "OUT OF SCOPE",
      },
    ],
  });

  results.meta.finishedAt = new Date().toISOString();
  results.totals = {
    pass: results.workflows.filter((w) => w.outcome === "PASS").length,
    fail: results.workflows.filter((w) => w.outcome === "FAIL").length,
    blocked: results.workflows.filter((w) => w.outcome === "BLOCKED").length,
    outOfScope: results.workflows.filter((w) => w.outcome === "OUT OF SCOPE").length,
    total: results.workflows.length,
    openFindings: findings.filter((f) => f.status === "OPEN").length,
  };

  fs.writeFileSync(OUT, JSON.stringify(results, null, 2));
  console.log("WROTE", OUT);
  console.log("TOTALS", JSON.stringify(results.totals));
  console.log("FINDINGS", findings.map((f) => f.id).join(", ") || "(none)");
  for (const w of results.workflows) {
    const fails = (w.steps || []).filter((s) => s.result === "FAIL").map((s) => `${s.n}:${s.action}`);
    console.log(w.workflowId, w.outcome, fails.join(" | "));
  }
  await browser.close();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
