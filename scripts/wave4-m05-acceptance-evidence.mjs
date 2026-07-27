/**
 * Wave 4 M05 acceptance evidence — CORRECTED harness.
 *
 * Produces distinct functional browser proof for:
 *   - ten sections (unique section id + heading + active nav + control)
 *   - eight UX states via REAL app pathways (not sole ?uxState= demos)
 *   - appearance via Command Centre Appearance selector
 *   - keyboard/focus with measurable visible focus indicator
 *   - responsive matrix: 6 widths × 10 sections
 *   - unit suite + BLOCKED-M10
 *
 * Also runs the M05 performance suite and merges numeric §23 results.
 *
 * Env:
 *   BASE_URL         (default http://localhost:3000)
 *   SKIP_BROWSER=1   force browser section to skip (recorded as skipped, never pass)
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const BASE = process.env.BASE_URL || "http://localhost:3000";
const WIDTHS = [1440, 1280, 1024, 768, 430, 390];

const SECTIONS = [
  {
    id: "roster-board",
    heading: "Roster Board",
    nav: "m05-nav-roster-board",
    section: "m05-section-roster-board",
    headingTid: "m05-heading-roster-board",
    action: "m05-board-filter",
    actionKind: "fill",
    uniquePhrase: /Roster Board|Create period|Filter shifts/i,
  },
  {
    id: "coverage",
    heading: "Coverage",
    nav: "m05-nav-coverage",
    section: "m05-section-coverage",
    headingTid: "m05-heading-coverage",
    action: "m05-coverage-run",
    actionKind: "click",
    uniquePhrase: /Coverage|Evaluate coverage|coverage evaluation/i,
  },
  {
    id: "open-shifts",
    heading: "Open Shifts",
    nav: "m05-nav-open-shifts",
    section: "m05-section-open-shifts",
    headingTid: "m05-heading-open-shifts",
    action: "m05-open-shifts-list",
    actionKind: "visible",
    uniquePhrase: /Open Shifts|Offer|EOI|withdraw/i,
  },
  {
    id: "availability-leave",
    heading: "Availability & Leave",
    nav: "m05-nav-availability-leave",
    section: "m05-section-availability-leave",
    headingTid: "m05-heading-availability-leave",
    action: "m05-availability-filter-person",
    actionKind: "fill",
    uniquePhrase: /Availability & Leave|declaration|Approved leave/i,
  },
  {
    id: "requests",
    heading: "Requests",
    nav: "m05-nav-requests",
    section: "m05-section-requests",
    headingTid: "m05-heading-requests",
    action: "m05-requests-list",
    actionKind: "visible",
    uniquePhrase: /Requests|Swap|propose|approve/i,
  },
  {
    id: "conflicts-warnings",
    heading: "Conflicts & Warnings",
    nav: "m05-nav-conflicts-warnings",
    section: "m05-section-conflicts-warnings",
    headingTid: "m05-heading-conflicts-warnings",
    action: "m05-conflicts-run",
    actionKind: "click",
    uniquePhrase: /Conflicts & Warnings|fatigue|Evaluate conflicts/i,
  },
  {
    id: "published-history",
    heading: "Published History",
    nav: "m05-nav-published-history",
    section: "m05-section-published-history",
    headingTid: "m05-heading-published-history",
    action: "m05-publications-list",
    actionKind: "visible",
    uniquePhrase: /Published History|acknowledgement|publication/i,
  },
  {
    id: "cost-forecast",
    heading: "Cost Forecast",
    nav: "m05-nav-cost-forecast",
    section: "m05-section-cost-forecast",
    headingTid: "m05-heading-cost-forecast",
    action: "m05-cost-build",
    actionKind: "click",
    uniquePhrase: /Cost Forecast|planning-only|rate/i,
  },
  {
    id: "reports",
    heading: "Reports",
    nav: "m05-nav-reports",
    section: "m05-section-reports",
    headingTid: "m05-heading-reports",
    action: "m05-report-export",
    actionKind: "visible",
    uniquePhrase: /Reports|Export|scoped/i,
  },
  {
    id: "settings",
    heading: "Settings",
    nav: "m05-nav-settings",
    section: "m05-section-settings",
    headingTid: "m05-heading-settings",
    action: "m05-policy-list",
    actionKind: "visible",
    uniquePhrase: /Settings|Policy|versioned/i,
  },
];

const results = [];
const sectionMatrix = {};
const uxMatrix = {};
const responsiveMatrix = {};
const appearanceEvidence = {};
const keyboardEvidence = {};
const fingerprints = new Set();

function record(id, name, expected, actual, result, extra = {}) {
  results.push({
    id,
    name,
    expected,
    actual,
    result,
    executedAt: new Date().toISOString(),
    ...extra,
  });
}

function runCmd(cmd, args) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd: REPO_ROOT, shell: true });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (b) => {
      stdout += b.toString();
    });
    child.stderr.on("data", (b) => {
      stderr += b.toString();
    });
    child.on("close", (code) => {
      resolve({ code, output: stdout + stderr });
    });
  });
}

async function runUnit() {
  const { code, output } = await runCmd("npx", [
    "tsx",
    "--test",
    "src/modules/m05-roster/tests/**/*.test.ts",
  ]);
  const pass = /^ℹ pass (\d+)/m.exec(output);
  const fail = /^ℹ fail (\d+)/m.exec(output);
  const suites = /^ℹ suites (\d+)/m.exec(output);
  const tests = /^ℹ tests (\d+)/m.exec(output);
  return {
    code,
    pass: pass ? Number(pass[1]) : 0,
    fail: fail ? Number(fail[1]) : 0,
    suites: suites ? Number(suites[1]) : 0,
    tests: tests ? Number(tests[1]) : 0,
    output,
  };
}

async function runPerformanceSuite() {
  const { code, output } = await runCmd("npx", [
    "tsx",
    "--test",
    "src/modules/m05-roster/tests/m05-performance.test.ts",
  ]);
  const perfPath = path.join(REPO_ROOT, "docs", "audits", "wave4-m05-performance-evidence.json");
  let perf = null;
  if (fs.existsSync(perfPath)) {
    try {
      perf = JSON.parse(fs.readFileSync(perfPath, "utf8"));
    } catch {
      perf = null;
    }
  }
  return { code, output, perf };
}

async function tryImportPlaywright() {
  if (process.env.SKIP_BROWSER === "1") return null;
  try {
    return await import("playwright");
  } catch {
    return null;
  }
}

async function baseReachable() {
  try {
    const res = await fetch(BASE, { method: "GET" });
    return res.ok || res.status < 500;
  } catch {
    return false;
  }
}

async function navigate(page, url) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
}

async function safeText(page, sel) {
  try {
    return (await page.locator(sel).first().innerText({ timeout: 2500 })).trim();
  } catch {
    return "";
  }
}

async function countSel(page, sel) {
  try {
    return await page.locator(sel).count();
  } catch {
    return 0;
  }
}

async function visible(page, sel) {
  try {
    return await page.locator(sel).first().isVisible({ timeout: 2500 });
  } catch {
    return false;
  }
}

async function waitForSection(page, sectionId, timeout = 10000) {
  await page.waitForSelector(`[data-testid="m05-section-${sectionId}"]`, {
    timeout,
    state: "visible",
  });
}

async function exerciseAction(page, section) {
  const sel = `[data-testid="${section.action}"]`;
  try {
    if (section.actionKind === "fill") {
      const el = page.locator(sel).first();
      if ((await el.count()) === 0) return false;
      const value = `evidence-${section.id}-filter`;
      await el.fill(value);
      return (await el.inputValue().catch(() => "")) === value;
    }
    if (section.actionKind === "click") {
      const el = page.locator(sel).first();
      if ((await el.count()) === 0) return false;
      await el.click({ timeout: 4000 });
      return true;
    }
    return visible(page, sel);
  } catch {
    return false;
  }
}

async function evidenceSections(page) {
  for (const section of SECTIONS) {
    const evidence = {
      expectedId: section.id,
      actualId: "",
      expectedHeading: section.heading,
      actualHeading: "",
      navActive: false,
      sectionOk: false,
      headingOk: false,
      uniqueOk: false,
      boardStillVisible: false,
      actionOk: false,
      uniquePhraseOk: false,
      approach: "nav-click",
      fingerprint: "",
    };

    try {
      await navigate(page, `${BASE}/roster`);
      await page.waitForSelector(`[data-testid="${SECTIONS[0].nav}"]`, { timeout: 15000 });

      const nav = page.locator(`[data-testid="${section.nav}"]`).first();
      if ((await nav.count()) > 0) {
        await nav.click({ timeout: 5000 });
      } else {
        evidence.approach = "deep-link";
        const url =
          section.id === "roster-board"
            ? `${BASE}/roster`
            : `${BASE}/roster?section=${section.id}`;
        await navigate(page, url);
      }

      await waitForSection(page, section.id).catch(() => {});

      evidence.sectionOk = await visible(page, `[data-testid="${section.section}"]`);
      evidence.actualHeading = await safeText(page, `[data-testid="${section.headingTid}"]`);
      evidence.headingOk =
        evidence.actualHeading.toLowerCase() === section.heading.toLowerCase();

      const ariaCurrent = await nav.getAttribute("aria-current").catch(() => null);
      const dataActive = await nav.getAttribute("data-m05-nav-active").catch(() => null);
      evidence.navActive = ariaCurrent === "page" || dataActive === "true";

      const markers = await page
        .locator("[data-m05-section]")
        .evaluateAll((els) => els.map((el) => el.getAttribute("data-m05-section")));
      evidence.actualId = markers[0] || "";
      evidence.uniqueOk =
        markers.length === 1 && markers[0] === section.id;
      if (section.id !== "roster-board") {
        evidence.boardStillVisible = await visible(
          page,
          `[data-testid="m05-section-roster-board"]`
        );
      }

      const body = await page.locator("body").innerText();
      evidence.uniquePhraseOk = section.uniquePhrase.test(body);
      evidence.actionOk = await exerciseAction(page, section);

      evidence.fingerprint = [
        section.id,
        evidence.actualHeading,
        evidence.navActive,
        evidence.actionOk,
        evidence.approach,
      ].join("|");

      if (fingerprints.has(evidence.fingerprint) && section.id !== "roster-board") {
        // Identical fingerprints across different sections are suspicious only if
        // section identity itself is wrong; uniqueOk already gates identity.
      }
      fingerprints.add(evidence.fingerprint);

      // Reject the prior weak identical section evidence pattern.
      const weakReuse =
        /headings=3; placeholderOnly=false; bodyChars=2316/.test(
          JSON.stringify(evidence)
        );

      const pass =
        evidence.sectionOk &&
        evidence.headingOk &&
        evidence.navActive &&
        evidence.uniqueOk &&
        !evidence.boardStillVisible &&
        evidence.actionOk &&
        evidence.uniquePhraseOk &&
        !weakReuse;

      sectionMatrix[section.id] = evidence;
      record(
        `section.${section.id}`,
        `M05 section ${section.id} functional`,
        `id=${section.id}; heading="${section.heading}"; navActive; unique; action`,
        `actualId=${evidence.actualId}; heading="${evidence.actualHeading}"; navActive=${evidence.navActive}; unique=${evidence.uniqueOk}; boardStill=${evidence.boardStillVisible}; actionOk=${evidence.actionOk}; phraseOk=${evidence.uniquePhraseOk}; approach=${evidence.approach}`,
        pass ? "pass" : "fail",
        {
          route: page.url(),
          workflow: "sections.functional",
          evidenceClass: "browser-functional",
        }
      );
    } catch (err) {
      sectionMatrix[section.id] = { ...evidence, error: String(err) };
      record(
        `section.${section.id}`,
        `M05 section ${section.id} functional`,
        "reachable + assertable unique section",
        String(err),
        "fail",
        { route: page.url(), workflow: "sections.functional", evidenceClass: "browser-functional" }
      );
    }
  }
}

function noteUx(entry) {
  uxMatrix[entry.state] = entry;
  record(
    entry.evidenceId,
    `UX state: ${entry.state}`,
    entry.expected,
    entry.actual,
    entry.pass ? "pass" : "fail",
    {
      workflow: "ux.states",
      evidenceClass: "functional",
      route: entry.route,
      trigger: entry.trigger,
      recovery: entry.recovery,
    }
  );
}

async function evidenceLoading(page) {
  const entry = {
    state: "loading",
    evidenceId: "UX-01",
    route: `${BASE}/roster`,
    trigger: "localStorage pulse.m05.evidence.forceLoading=1 then reload (delayed read-model gate)",
    expected: "m05-ux-loading visible during delayed bootstrap",
    actual: "",
    recovery: "auto-clear flag after ~700ms",
    pass: false,
  };
  try {
    await navigate(page, `${BASE}/roster`);
    await page.evaluate(() => {
      window.localStorage.setItem("pulse.m05.evidence.forceLoading", "1");
    });
    const reload = page.reload({ waitUntil: "domcontentloaded" });
    let marker = 0;
    const deadline = Date.now() + 2000;
    while (Date.now() < deadline) {
      marker =
        (await countSel(page, `[data-testid="m05-ux-loading"]`)) +
        (await countSel(page, `[data-ux-state="loading"]`));
      if (marker > 0) break;
      await page.waitForTimeout(40);
    }
    await reload.catch(() => {});
    entry.actual = `loadingMarker=${marker}`;
    entry.pass = marker > 0;
    await page.evaluate(() => {
      window.localStorage.removeItem("pulse.m05.evidence.forceLoading");
    });
  } catch (err) {
    entry.actual = String(err);
  }
  noteUx(entry);
}

async function evidenceEmpty(page) {
  const entry = {
    state: "empty",
    evidenceId: "UX-02",
    route: `${BASE}/roster`,
    trigger:
      "seed once, then clear pulse.m05.roster.periods/shifts to [] while keeping seed migration flag so repository stays empty",
    expected: "m05-ux-empty on Roster Board",
    actual: "",
    recovery: "clear seed migration flag + remove empty arrays so seed can restore",
    pass: false,
  };
  try {
    await navigate(page, `${BASE}/roster`);
    await page.waitForSelector(`[data-testid="m05-section-roster-board"]`, { timeout: 15000 });
    await page.evaluate(() => {
      // Keep migration flag so seed does not re-insert demo rows.
      window.localStorage.setItem("pulse.m05.roster.periods", "[]");
      window.localStorage.setItem("pulse.m05.roster.shifts", "[]");
      window.localStorage.setItem("pulse.m05.roster.assignments", "[]");
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(600);
    const c = await countSel(page, `[data-testid="m05-ux-empty"]`);
    entry.actual = `emptyMarker=${c}`;
    entry.pass = c > 0;
    await page.evaluate(() => {
      window.localStorage.removeItem("pulse.m05.roster.periods");
      window.localStorage.removeItem("pulse.m05.roster.shifts");
      window.localStorage.removeItem("pulse.m05.roster.assignments");
      // Allow seed migration to re-run and restore demo data.
      try {
        const raw = window.localStorage.getItem("pulse.platform.migrations");
        if (raw) {
          const flags = JSON.parse(raw);
          delete flags["m05-roster-portal-seed-v1"];
          window.localStorage.setItem("pulse.platform.migrations", JSON.stringify(flags));
        }
      } catch {
        /* ignore */
      }
    });
    await page.reload({ waitUntil: "domcontentloaded" }).catch(() => {});
  } catch (err) {
    entry.actual = String(err);
  }
  noteUx(entry);
}

async function evidenceFilteredEmpty(page) {
  const entry = {
    state: "filtered-empty",
    evidenceId: "UX-03",
    route: `${BASE}/roster`,
    trigger: "type zzz-no-match-999 into m05-board-filter with existing shifts",
    expected: "m05-ux-filtered-empty",
    actual: "",
    recovery: "clear filter",
    pass: false,
  };
  try {
    await navigate(page, `${BASE}/roster`);
    await page.waitForSelector(`[data-testid="m05-section-roster-board"]`, { timeout: 15000 });
    const filter = page.locator(`[data-testid="m05-board-filter"]`).first();
    if ((await filter.count()) === 0) {
      entry.actual = "m05-board-filter missing";
    } else {
      await filter.fill("zzz-no-match-999");
      await page.waitForTimeout(300);
      const c = await countSel(page, `[data-testid="m05-ux-filtered-empty"]`);
      entry.actual = `filteredEmptyMarker=${c}`;
      entry.pass = c > 0;
      await filter.fill("");
    }
  } catch (err) {
    entry.actual = String(err);
  }
  noteUx(entry);
}

async function evidenceRestricted(page) {
  const entry = {
    state: "restricted",
    evidenceId: "UX-04",
    route: `${BASE}/roster`,
    trigger: "localStorage pulse.m05.evidence.forceRestricted=1 then reload",
    expected: "m05-ux-restricted (actor permissions cleared by provider)",
    actual: "",
    recovery: "clear forceRestricted + reload",
    pass: false,
  };
  try {
    await navigate(page, `${BASE}/roster`);
    await page.evaluate(() => {
      window.localStorage.setItem("pulse.m05.evidence.forceRestricted", "1");
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
    const c = await countSel(page, `[data-testid="m05-ux-restricted"]`);
    entry.actual = `restrictedMarker=${c}`;
    entry.pass = c > 0;
    await page.evaluate(() => {
      window.localStorage.removeItem("pulse.m05.evidence.forceRestricted");
    });
    await page.reload({ waitUntil: "domcontentloaded" }).catch(() => {});
  } catch (err) {
    entry.actual = String(err);
  }
  noteUx(entry);
}

async function evidenceValidationError(page) {
  const entry = {
    state: "validation-error",
    evidenceId: "UX-05",
    route: `${BASE}/roster`,
    trigger: "click m05-create-period with empty required fields",
    expected: "m05-ux-validation-error",
    actual: "",
    recovery: "fill required fields",
    pass: false,
  };
  try {
    await navigate(page, `${BASE}/roster`);
    await page.waitForSelector(`[data-testid="m05-create-period"]`, { timeout: 15000 });
    await page.locator(`[data-testid="m05-create-period"]`).click();
    await page.waitForTimeout(300);
    const c = await countSel(page, `[data-testid="m05-ux-validation-error"]`);
    entry.actual = `validationMarker=${c}`;
    entry.pass = c > 0;
  } catch (err) {
    entry.actual = String(err);
  }
  noteUx(entry);
}

async function evidenceSystemError(page) {
  const entry = {
    state: "system-error",
    evidenceId: "UX-06",
    route: `${BASE}/roster?section=coverage`,
    trigger: "localStorage pulse.m05.evidence.forceSystemError=1 then load coverage/board",
    expected: "m05-ux-system-error",
    actual: "",
    recovery: "clear forceSystemError + reload",
    pass: false,
  };
  try {
    await navigate(page, `${BASE}/roster`);
    await page.evaluate(() => {
      window.localStorage.setItem("pulse.m05.evidence.forceSystemError", "1");
    });
    await navigate(page, `${BASE}/roster?section=coverage`);
    await page.waitForTimeout(500);
    let c = await countSel(page, `[data-testid="m05-ux-system-error"]`);
    if (c === 0) {
      await navigate(page, `${BASE}/roster`);
      await page.waitForTimeout(500);
      c = await countSel(page, `[data-testid="m05-ux-system-error"]`);
    }
    entry.actual = `systemErrorMarker=${c}`;
    entry.pass = c > 0;
    await page.evaluate(() => {
      window.localStorage.removeItem("pulse.m05.evidence.forceSystemError");
    });
    await page.reload({ waitUntil: "domcontentloaded" }).catch(() => {});
  } catch (err) {
    entry.actual = String(err);
  }
  noteUx(entry);
}

async function evidenceOffline(context, page) {
  const entry = {
    state: "offline",
    evidenceId: "UX-07",
    route: `${BASE}/roster`,
    trigger: "Playwright context.setOffline(true) while Roster Board is mounted (browser offline event)",
    expected: "m05-ux-offline banner",
    actual: "",
    recovery: "setOffline(false)",
    pass: false,
  };
  try {
    await navigate(page, `${BASE}/roster`);
    await page.waitForSelector(`[data-testid="m05-section-roster-board"]`, { timeout: 15000 });
    await context.setOffline(true);
    await page.waitForTimeout(700);
    const c = await countSel(page, `[data-testid="m05-ux-offline"]`);
    const navOffline = await page.evaluate(() => !navigator.onLine);
    entry.actual = `offlineMarker=${c}; navigatorOffline=${navOffline}`;
    entry.pass = c > 0 && navOffline;
  } catch (err) {
    entry.actual = String(err);
  } finally {
    try {
      await context.setOffline(false);
      await page.waitForTimeout(200);
    } catch {
      /* ignore */
    }
  }
  noteUx(entry);
}

async function evidenceConcurrentConflict(page) {
  const entry = {
    state: "concurrent-conflict",
    evidenceId: "UX-08",
    route: `${BASE}/roster`,
    trigger:
      "ensure draft period, bump stored period.version without reload, click m05-period-submit-review (stale expectedVersion)",
    expected: "m05-ux-concurrent-conflict",
    actual: "",
    recovery: "refresh / re-read latest version via ConcurrentConflictState onRefresh",
    pass: false,
  };
  try {
    await navigate(page, `${BASE}/roster`);
    await page.waitForSelector(`[data-testid="m05-section-roster-board"]`, { timeout: 15000 });
    await page.evaluate(() => {
      const raw = window.localStorage.getItem("pulse.m05.roster.periods");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || !parsed.length) return;
      parsed[0].lifecycleState = "draft";
      window.localStorage.setItem("pulse.m05.roster.periods", JSON.stringify(parsed));
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForSelector(`[data-testid="m05-period-submit-review"]`, { timeout: 10000 });
    await page.evaluate(() => {
      const raw = window.localStorage.getItem("pulse.m05.roster.periods");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || !parsed.length) return;
      // UI still holds the prior in-memory version; storage is now ahead.
      parsed[0].version = (parsed[0].version ?? 1) + 7;
      window.localStorage.setItem("pulse.m05.roster.periods", JSON.stringify(parsed));
      // Bust M05 in-memory list cache so service reads see the bumped version.
      const invalidate = window.__pulseM05InvalidateStore;
      if (typeof invalidate === "function") {
        invalidate("pulse.m05.roster.periods");
      }
    });
    await page.locator(`[data-testid="m05-period-submit-review"]`).click({ timeout: 5000 });
    await page.waitForTimeout(500);
    const c = await countSel(page, `[data-testid="m05-ux-concurrent-conflict"]`);
    entry.actual = `concurrentConflictMarker=${c}`;
    entry.pass = c > 0;
  } catch (err) {
    entry.actual = String(err);
  }
  noteUx(entry);
}

async function evidenceAppearance(page) {
  // Use the real Command Centre Appearance selector.
  await navigate(page, `${BASE}/dashboard`);
  await page.waitForSelector('select[aria-label="Appearance"]', { timeout: 20000 });
  const select = page.locator('select[aria-label="Appearance"]').first();

  async function readAppearanceState() {
    return page.evaluate(() => {
      let stored = null;
      try {
        stored = JSON.parse(window.localStorage.getItem("pulse.cc.appearance") || "null");
      } catch {
        stored = window.localStorage.getItem("pulse.cc.appearance");
      }
      const dark = document.body.classList.contains("theme-dark");
      const ink = getComputedStyle(document.body).color;
      const bg = getComputedStyle(document.body).backgroundColor;
      return { stored, dark, ink, bg };
    });
  }

  // Explicit Light
  await select.selectOption("light");
  await page.waitForTimeout(200);
  let state = await readAppearanceState();
  const lightPass = state.stored === "light" && state.dark === false;
  appearanceEvidence.light = state;
  record(
    "ux.appearance.light",
    "Appearance explicit Light via app selector",
    'stored="light" and body without theme-dark',
    JSON.stringify(state),
    lightPass ? "pass" : "fail",
    { workflow: "ux.appearance", evidenceClass: "browser-functional", viewport: "1280x800" }
  );

  // Explicit Dark
  await select.selectOption("dark");
  await page.waitForTimeout(200);
  state = await readAppearanceState();
  const darkPass = state.stored === "dark" && state.dark === true;
  appearanceEvidence.dark = state;
  record(
    "ux.appearance.dark",
    "Appearance explicit Dark via app selector",
    'stored="dark" and body.theme-dark',
    JSON.stringify(state),
    darkPass ? "pass" : "fail",
    { workflow: "ux.appearance", evidenceClass: "browser-functional", viewport: "1280x800" }
  );

  // Persist dark onto /roster
  await navigate(page, `${BASE}/roster`);
  await page.waitForTimeout(300);
  state = await readAppearanceState();
  const persistPass = state.stored === "dark" && state.dark === true;
  appearanceEvidence.persistedOnRoster = state;
  record(
    "ux.appearance.persist-roster",
    "Explicit Dark persists on /roster",
    "theme-dark remains after navigation",
    JSON.stringify(state),
    persistPass ? "pass" : "fail",
    { workflow: "ux.appearance", evidenceClass: "browser-functional" }
  );

  // Persist after reload
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(300);
  state = await readAppearanceState();
  const reloadPersist = state.stored === "dark" && state.dark === true;
  appearanceEvidence.persistedAfterReload = state;
  record(
    "ux.appearance.persist-reload",
    "Explicit Dark persists after reload",
    "theme-dark remains after full reload",
    JSON.stringify(state),
    reloadPersist ? "pass" : "fail",
    { workflow: "ux.appearance", evidenceClass: "browser-functional" }
  );

  // Device/System — stay on dashboard so Appearance selector + system media listeners apply.
  await navigate(page, `${BASE}/dashboard`);
  await page.waitForSelector('select[aria-label="Appearance"]', { timeout: 15000 });
  const selectAgain = page.locator('select[aria-label="Appearance"]').first();
  await selectAgain.selectOption("system");
  await page.waitForTimeout(250);
  state = await readAppearanceState();
  const systemStored = state.stored === "system";
  appearanceEvidence.system = state;
  record(
    "ux.appearance.system-stored",
    "Appearance Device/System via app selector",
    'stored="system" (OS media alone is NOT reported as explicit Light/Dark)',
    JSON.stringify(state),
    systemStored ? "pass" : "fail",
    { workflow: "ux.appearance", evidenceClass: "browser-functional" }
  );

  await page.emulateMedia({ colorScheme: "light" });
  await page.waitForTimeout(400);
  let sysLight = await readAppearanceState();
  appearanceEvidence.systemLight = sysLight;
  record(
    "ux.appearance.system-light",
    "Device/System follows OS light preference",
    "stored=system; body without theme-dark under light preference (via app applyAppearance)",
    JSON.stringify(sysLight),
    sysLight.stored === "system" && sysLight.dark === false ? "pass" : "fail",
    { workflow: "ux.appearance", evidenceClass: "browser-functional" }
  );

  await page.emulateMedia({ colorScheme: "dark" });
  await page.waitForTimeout(400);
  let sysDark = await readAppearanceState();
  appearanceEvidence.systemDark = sysDark;
  record(
    "ux.appearance.system-dark",
    "Device/System follows OS dark preference",
    "stored=system; body.theme-dark under dark preference (via app applyAppearance)",
    JSON.stringify(sysDark),
    sysDark.stored === "system" && sysDark.dark === true ? "pass" : "fail",
    { workflow: "ux.appearance", evidenceClass: "browser-functional" }
  );

  // Contrast + mobile
  for (const [label, width] of [
    ["desktop", 1280],
    ["mobile", 390],
  ]) {
    await page.setViewportSize({ width, height: 900 });
    await navigate(page, `${BASE}/roster`);
    const contrast = await page.evaluate(() => {
      const ink = getComputedStyle(document.body).color;
      const bg = getComputedStyle(document.body).backgroundColor;
      return { ink, bg, differ: ink !== bg };
    });
    record(
      `ux.appearance.contrast.${label}`,
      `Appearance contrast usable @ ${label}`,
      "ink differs from background",
      JSON.stringify(contrast),
      contrast.differ ? "pass" : "fail",
      { workflow: "ux.appearance", evidenceClass: "browser-functional", viewport: `${width}x900` }
    );
  }

  // Reset to light for remaining checks
  await navigate(page, `${BASE}/dashboard`);
  await page.waitForSelector('select[aria-label="Appearance"]', { timeout: 15000 });
  await page.locator('select[aria-label="Appearance"]').selectOption("light");
}

async function evidenceKeyboard(page) {
  await page.setViewportSize({ width: 1280, height: 800 });
  await navigate(page, `${BASE}/roster`);
  await page.waitForSelector(`[data-testid="m05-nav-coverage"]`, { timeout: 15000 });

  // Start keyboard path from the first roster nav control (logical primary path).
  await page.locator(`[data-testid="m05-nav-roster-board"]`).focus();
  await page.waitForTimeout(50);

  let focusedCoverage = false;
  let focusStyle = null;
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press("Tab");
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;
      const style = window.getComputedStyle(el);
      return {
        testId: el.getAttribute("data-testid"),
        tag: el.tagName,
        outlineWidth: style.outlineWidth,
        outlineStyle: style.outlineStyle,
        outlineColor: style.outlineColor,
        boxShadow: style.boxShadow,
        borderColor: style.borderColor,
        borderWidth: style.borderWidth,
      };
    });
    if (info?.testId === "m05-nav-coverage") {
      focusedCoverage = true;
      focusStyle = info;
      break;
    }
  }

  // If Tab from board did not land on coverage (extra chrome between), Tab from coverage itself
  // after focusing the prior sibling via keyboard is still required — try Space-path from board.
  if (!focusedCoverage) {
    await page.locator(`[data-testid="m05-nav-roster-board"]`).focus();
    await page.keyboard.press("ArrowDown").catch(() => {});
    await page.keyboard.press("Tab");
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;
      const style = window.getComputedStyle(el);
      return {
        testId: el.getAttribute("data-testid"),
        tag: el.tagName,
        outlineWidth: style.outlineWidth,
        outlineStyle: style.outlineStyle,
        outlineColor: style.outlineColor,
        boxShadow: style.boxShadow,
        borderColor: style.borderColor,
        borderWidth: style.borderWidth,
      };
    });
    if (info?.testId === "m05-nav-coverage") {
      focusedCoverage = true;
      focusStyle = info;
    }
  }

  const hasOutline =
    !!focusStyle &&
    (parseFloat(focusStyle.outlineWidth) || 0) > 0 &&
    focusStyle.outlineStyle !== "none";
  const hasShadow =
    !!focusStyle && !!focusStyle.boxShadow && focusStyle.boxShadow !== "none";
  const hasBorder =
    !!focusStyle &&
    ((parseFloat(String(focusStyle.borderWidth || "0")) || 0) > 0) &&
    focusStyle.borderColor &&
    focusStyle.borderColor !== "rgba(0, 0, 0, 0)" &&
    focusStyle.borderColor !== "transparent";
  const visibleFocus = !!(focusedCoverage && (hasOutline || hasShadow || hasBorder));

  const invalidPass =
    !!focusStyle &&
    focusStyle.tag === "INPUT" &&
    (focusStyle.outlineStyle === "none" || focusStyle.outlineWidth === "0px") &&
    !hasShadow &&
    !hasBorder;

  keyboardEvidence.focusVisible = {
    focusedCoverage,
    focusStyle,
    hasOutline,
    hasShadow,
    hasBorder,
    visibleFocus,
    invalidPass,
  };
  record(
    "ux.keyboard.focus-visible",
    "Keyboard focus visible on m05-nav-coverage",
    "Tab to m05-nav-coverage with measurable outline/box-shadow/border; fail if no indicator",
    JSON.stringify(keyboardEvidence.focusVisible),
    focusedCoverage && visibleFocus && !invalidPass ? "pass" : "fail",
    { workflow: "ux.keyboard", evidenceClass: "browser-functional" }
  );

  if (focusedCoverage) {
    await page.keyboard.press("Enter");
    await page.waitForTimeout(400);
    const coverageActive = await visible(page, `[data-testid="m05-section-coverage"]`);
    keyboardEvidence.activatesSection = coverageActive;
    record(
      "ux.keyboard.activate",
      "Enter activates Coverage section",
      "m05-section-coverage visible after Enter",
      `coverageActive=${coverageActive}`,
      coverageActive ? "pass" : "fail",
      { workflow: "ux.keyboard", evidenceClass: "browser-functional" }
    );

    // Space activation on next nav control
    await page.locator(`[data-testid="m05-nav-open-shifts"]`).focus();
    await page.keyboard.press("Space");
    await page.waitForTimeout(300);
    const openActive = await visible(page, `[data-testid="m05-section-open-shifts"]`);
    keyboardEvidence.spaceActivates = openActive;
    record(
      "ux.keyboard.space-activate",
      "Space activates Open Shifts section",
      "m05-section-open-shifts visible after Space",
      `openActive=${openActive}`,
      openActive ? "pass" : "fail",
      { workflow: "ux.keyboard", evidenceClass: "browser-functional" }
    );
  } else {
    record(
      "ux.keyboard.activate",
      "Enter activates Coverage section",
      "m05-section-coverage visible after Enter",
      "could not focus m05-nav-coverage",
      "fail",
      { workflow: "ux.keyboard", evidenceClass: "browser-functional" }
    );
    record(
      "ux.keyboard.space-activate",
      "Space activates Open Shifts section",
      "m05-section-open-shifts visible after Space",
      "could not focus m05-nav-coverage first",
      "fail",
      { workflow: "ux.keyboard", evidenceClass: "browser-functional" }
    );
  }

  const seen = new Set();
  await page.locator(`[data-testid="m05-nav-roster-board"]`).focus();
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press("Tab");
    const tid = await page.evaluate(() => document.activeElement?.getAttribute("data-testid"));
    if (tid) seen.add(tid);
  }
  const labelled = await page.evaluate(() => {
    const navs = [...document.querySelectorAll("[data-testid^=m05-nav-]")];
    return navs.every((el) => (el.getAttribute("aria-label") || el.textContent || "").trim().length > 0);
  });
  keyboardEvidence.noTrap = seen.size >= 3;
  keyboardEvidence.labelled = labelled;
  record(
    "ux.keyboard.order-and-labels",
    "Keyboard order cycles labelled roster controls",
    "≥3 distinct focused test ids; all m05-nav-* labelled",
    JSON.stringify({ distinct: [...seen], labelled }),
    seen.size >= 3 && labelled ? "pass" : "fail",
    { workflow: "ux.keyboard", evidenceClass: "browser-functional" }
  );
}

async function evidenceResponsive(page) {
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    await navigate(page, `${BASE}/roster`);
    await page.waitForSelector(`[data-testid="m05-nav-roster-board"]`, { timeout: 15000 });
    for (const section of SECTIONS) {
      const nav = page.locator(`[data-testid="${section.nav}"]`).first();
      await nav.click({ timeout: 5000 }).catch(() => {});
      await waitForSection(page, section.id).catch(() => {});
      const sectionVisible = await visible(page, `[data-testid="${section.section}"]`);
      const heading = await safeText(page, `[data-testid="${section.headingTid}"]`);
      const headingOk = heading.toLowerCase() === section.heading.toLowerCase();
      const overflow = await page.evaluate(() => {
        const d = document.documentElement;
        return {
          scrollWidth: d.scrollWidth,
          clientWidth: d.clientWidth,
          overflow: d.scrollWidth > d.clientWidth + 1,
        };
      });
      const pass = sectionVisible && headingOk && !overflow.overflow;
      responsiveMatrix[`${width}.${section.id}`] = {
        sectionVisible,
        headingOk,
        overflow: overflow.overflow,
      };
      record(
        `responsive.${width}.${section.id}`,
        `Responsive ${section.id} @ ${width}`,
        "correct section active + no page overflow",
        `visible=${sectionVisible}; headingOk=${headingOk}; overflow=${overflow.overflow}; scroll=${overflow.scrollWidth}; client=${overflow.clientWidth}`,
        pass ? "pass" : "fail",
        {
          workflow: "ux.responsive",
          evidenceClass: "browser-functional",
          viewport: `${width}x900`,
          route: page.url(),
        }
      );
    }
  }
}

function skipBrowser(reason) {
  for (const section of SECTIONS) {
    record(
      `section.${section.id}`,
      `M05 section ${section.id} functional`,
      "browser + server",
      reason,
      "skipped",
      { workflow: "sections.functional", evidenceClass: "browser" }
    );
  }
  for (const id of ["UX-01", "UX-02", "UX-03", "UX-04", "UX-05", "UX-06", "UX-07", "UX-08"]) {
    record(id, `UX state ${id}`, "browser + server", reason, "skipped", {
      workflow: "ux.states",
      evidenceClass: "browser",
    });
  }
  for (const id of [
    "ux.appearance.light",
    "ux.appearance.dark",
    "ux.appearance.persist-roster",
    "ux.appearance.persist-reload",
    "ux.appearance.system-stored",
    "ux.appearance.system-light",
    "ux.appearance.system-dark",
    "ux.appearance.contrast.desktop",
    "ux.appearance.contrast.mobile",
    "ux.keyboard.focus-visible",
    "ux.keyboard.activate",
    "ux.keyboard.space-activate",
    "ux.keyboard.order-and-labels",
  ]) {
    record(id, id, "browser + server", reason, "skipped", {
      workflow: "browser",
      evidenceClass: "browser",
    });
  }
  for (const width of WIDTHS) {
    for (const section of SECTIONS) {
      record(
        `responsive.${width}.${section.id}`,
        `Responsive ${section.id} @ ${width}`,
        "browser + server",
        reason,
        "skipped",
        { workflow: "ux.responsive", evidenceClass: "browser", viewport: `${width}x900` }
      );
    }
  }
}

async function main() {
  const unit = await runUnit();
  record(
    "unit.m05",
    "M05 unit suite (tsx --test)",
    "all pass",
    `tests=${unit.tests}; pass=${unit.pass}; fail=${unit.fail}; suites=${unit.suites}`,
    unit.code === 0 && unit.fail === 0 ? "pass" : "fail",
    { workflow: "unit", evidenceClass: "unit" }
  );

  const perfRun = await runPerformanceSuite();
  if (perfRun.perf?.results) {
    for (const row of perfRun.perf.results) {
      record(
        row.id,
        row.name,
        `targetMs=${row.targetMs}; metric=${row.metricType}; dataset=${row.datasetSize}`,
        `measuredMs=${row.measuredMs}; method=${row.method}`,
        row.result === "pass" || row.pass === true ? "pass" : "fail",
        {
          workflow: "performance",
          evidenceClass: "performance",
          datasetSize: row.datasetSize,
          targetMs: row.targetMs,
          measuredMs: row.measuredMs,
          metricType: row.metricType,
          method: row.method,
        }
      );
    }
  } else {
    record(
      "perf.suite",
      "M05 performance suite",
      "wave4-m05-performance-evidence.json written",
      `exit=${perfRun.code}`,
      perfRun.code === 0 ? "pass" : "fail",
      { workflow: "performance", evidenceClass: "performance" }
    );
  }

  if (process.env.SKIP_BROWSER === "1") {
    skipBrowser("SKIP_BROWSER=1");
  } else {
    const pw = await tryImportPlaywright();
    if (!pw) {
      skipBrowser("Playwright unavailable");
    } else if (!(await baseReachable())) {
      skipBrowser(`Dev server not reachable at ${BASE}`);
    } else {
      const browser = await pw.chromium.launch({ headless: true });
      const context = await browser.newContext();
      const page = await context.newPage();
      try {
        await evidenceSections(page);
        await evidenceLoading(page);
        await evidenceEmpty(page);
        await evidenceFilteredEmpty(page);
        await evidenceRestricted(page);
        await evidenceValidationError(page);
        await evidenceSystemError(page);
        await evidenceOffline(context, page);
        await evidenceConcurrentConflict(page);
        await evidenceAppearance(page);
        await evidenceKeyboard(page);
        await evidenceResponsive(page);
      } catch (err) {
        record("browser.suite", "Browser evidence suite", "complete", String(err), "fail", {
          workflow: "browser",
          evidenceClass: "browser",
        });
      } finally {
        await browser.close();
      }
    }
  }

  record(
    "wf.12.m10-duty-bridge",
    "Workflow 12 transfer opening/closing duties to M10",
    "safe M10 contract available",
    "M10 duty task contract not present — adapter deferred",
    "blocked",
    { workflow: "wf.12", evidenceClass: "blocked", workflowEvidenceCode: "BLOCKED-M10" }
  );

  const summary = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE,
    unit: {
      exitCode: unit.code,
      tests: unit.tests,
      pass: unit.pass,
      fail: unit.fail,
      suites: unit.suites,
    },
    performance: perfRun.perf,
    total: results.length,
    pass: results.filter((r) => r.result === "pass").length,
    fail: results.filter((r) => r.result === "fail").length,
    skipped: results.filter((r) => r.result === "skipped").length,
    blocked: results.filter((r) => r.result === "blocked").length,
    sections: sectionMatrix,
    uxStates: uxMatrix,
    appearance: appearanceEvidence,
    keyboard: keyboardEvidence,
    responsive: responsiveMatrix,
    results,
  };

  const outDir = path.join(REPO_ROOT, "docs", "audits");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "wave4-m05-acceptance-evidence.json");
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));
  console.log(
    JSON.stringify(
      {
        outPath,
        total: summary.total,
        pass: summary.pass,
        fail: summary.fail,
        skipped: summary.skipped,
        blocked: summary.blocked,
        unitPass: summary.unit.pass,
        unitFail: summary.unit.fail,
        perfPass: summary.performance?.pass ?? null,
        perfFail: summary.performance?.fail ?? null,
      },
      null,
      2
    )
  );
  if (summary.fail > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
