/**
 * Wave 5 M06 acceptance evidence harness.
 *
 * Accounting (§17.1):
 *   - 21 M06 workflows must pass (WF-01…18, WF-19A, WF-20, WF-21)
 *   - 1 blocked: BLOCKED-M07 (WF-19B only)
 *   - BLOCKED-M10 is informational and OUTSIDE Wave 5 totals
 *
 * Env: BASE_URL (default http://localhost:3000), SKIP_BROWSER=1
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const BASE = process.env.BASE_URL || "http://localhost:3000";
const WIDTHS = [1440, 1280, 1024, 768, 430, 390];
const OUT = path.join(REPO_ROOT, "docs", "audits", "wave5-m06-acceptance-evidence.json");
const PERF_OUT = path.join(REPO_ROOT, "docs", "audits", "wave5-m06-performance-evidence.json");

const SECTIONS = [
  { id: "live", nav: "m06-nav-live", section: "m06-section-live", heading: "m06-heading-live", action: "m06-live-refresh", kind: "click" },
  { id: "clock", nav: "m06-nav-clock", section: "m06-section-clock", heading: "m06-heading-clock", action: "m06-clock-local", kind: "fill" },
  { id: "timesheets", nav: "m06-nav-timesheets", section: "m06-section-timesheets", heading: "m06-heading-timesheets", action: "m06-timesheet-generate", kind: "click" },
  { id: "exceptions", nav: "m06-nav-exceptions", section: "m06-section-exceptions", heading: "m06-heading-exceptions", action: "m06-exception-list", kind: "visible" },
  { id: "corrections", nav: "m06-nav-corrections", section: "m06-section-corrections", heading: "m06-heading-corrections", action: "m06-correction-request", kind: "click" },
  { id: "approvals", nav: "m06-nav-approvals", section: "m06-section-approvals", heading: "m06-heading-approvals", action: "m06-approval-list", kind: "visible" },
  { id: "breaks", nav: "m06-nav-breaks", section: "m06-section-breaks", heading: "m06-heading-breaks", action: "m06-break-start", kind: "click" },
  { id: "history", nav: "m06-nav-history", section: "m06-section-history", heading: "m06-heading-history", action: "m06-history-filter", kind: "fill" },
  { id: "reports", nav: "m06-nav-reports", section: "m06-section-reports", heading: "m06-heading-reports", action: "m06-report-build", kind: "click" },
  { id: "settings", nav: "m06-nav-settings", section: "m06-section-settings", heading: "m06-heading-settings", action: "m06-policy-publish", kind: "click" },
];

const results = [];

function record(id, name, expected, actual, result, extra = {}) {
  results.push({ id, name, expected, actual, result, ...extra });
}

function run(cmd, args, opts = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd: REPO_ROOT,
      shell: true,
      env: { ...process.env, ...opts.env },
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });
}

async function runUnitSuite() {
  const r = await run("npx", ["tsx", "--test", "src/modules/m06-time-attendance/tests/**/*.test.ts"]);
  const passMatch = r.stdout.match(/pass (\d+)/);
  const failMatch = r.stdout.match(/fail (\d+)/);
  const unitPass = passMatch ? Number(passMatch[1]) : 0;
  const unitFail = failMatch ? Number(failMatch[1]) : r.code === 0 ? 0 : 1;

  record("unit.suite", "M06 unit/integration suite", "fail=0", `pass=${unitPass} fail=${unitFail}`, unitFail === 0 && r.code === 0 ? "pass" : "fail", {
    unitPass,
    unitFail,
  });

  // Unique workflow evidence — never credit from suite-green alone
  const REQUIRED = [
    ...Array.from({ length: 18 }, (_, i) => `WF-${String(i + 1).padStart(2, "0")}`),
    "WF-19A",
    "WF-20",
    "WF-21",
  ];
  const wfPath = path.join(REPO_ROOT, "docs", "audits", "wave5-m06-workflow-evidence.json");
  let wfDoc = null;
  if (fs.existsSync(wfPath)) {
    try {
      wfDoc = JSON.parse(fs.readFileSync(wfPath, "utf8"));
    } catch {
      wfDoc = null;
    }
  }

  // Detect grouped/generic names in stdout (anti-pattern)
  const grouped = [...r.stdout.matchAll(/[✔✖]\s+(WF-\d+[A-Z]?(?:\/\d+|\/WF-)[^\n]*)/g)].map((m) => m[1]);
  if (grouped.length) {
    record(
      "workflow.grouping-guard",
      "Reject grouped workflow test names",
      "no multi-ID names",
      grouped.join(" | "),
      "fail"
    );
  } else {
    record("workflow.grouping-guard", "Reject grouped workflow test names", "no multi-ID names", "ok", "pass");
  }

  const byId = new Map();
  for (const row of wfDoc?.required || []) {
    if (byId.has(row.id)) {
      record(`workflow.dup.${row.id}`, `Duplicate evidence for ${row.id}`, "unique", "duplicate", "fail");
    }
    byId.set(row.id, row);
  }

  let requiredPassed = 0;
  for (const id of REQUIRED) {
    const row = byId.get(id);
    if (!row) {
      record(`workflow.${id}`, `${id} required M06 workflow`, "independent pass evidence", "missing", "fail");
      continue;
    }
    if (row.result !== "pass") {
      record(`workflow.${id}`, `${id} required M06 workflow`, "pass", `${row.result}: ${row.detail || ""}`, "fail");
      continue;
    }
    if (!row.detail || String(row.detail).trim().length < 3) {
      record(`workflow.${id}`, `${id} required M06 workflow`, "business outcome detail", "empty detail", "fail");
      continue;
    }
    record(`workflow.${id}`, `${id} ${row.name || "required M06 workflow"}`, "pass", row.detail, "pass");
    requiredPassed += 1;
  }

  const blocked = wfDoc?.blockedIntake;
  if (blocked?.result === "blocked" && blocked?.detail?.includes("BLOCKED-M07")) {
    record("workflow.WF-19B", "WF-19B M07 intake", "BLOCKED-M07", blocked.detail, "blocked", {
      workflowEvidenceCode: "BLOCKED-M07",
      note: "M06 publication (WF-19A) is separate and must pass; intake remains blocked.",
    });
  } else {
    record(
      "workflow.WF-19B",
      "WF-19B M07 intake",
      "BLOCKED-M07",
      blocked ? JSON.stringify(blocked) : "missing blocked evidence",
      "fail"
    );
  }

  record(
    "workflow.accounting",
    "21 required workflows independently passed",
    "21",
    String(requiredPassed),
    requiredPassed === 21 ? "pass" : "fail"
  );

  return { unitPass, unitFail, code: r.code, requiredPassed };
}

async function runBrowser() {
  if (process.env.SKIP_BROWSER === "1") {
    record("browser.suite", "Browser evidence", "run", "SKIP_BROWSER=1", "skipped");
    return;
  }

  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    record("browser.suite", "Browser evidence", "playwright available", "missing", "fail");
    return;
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  async function goAttendance() {
    await page.goto(`${BASE}/time-attendance`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(900);
  }

  async function clearM06State() {
    await page.evaluate(() => {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith("pulse.m06") || k.startsWith("pulse.m05.roster"))) keys.push(k);
      }
      for (const k of keys) localStorage.removeItem(k);
      localStorage.removeItem("pulse.m06.evidence.forceRestricted");
      localStorage.removeItem("pulse.m06.evidence.forceOffline");
      localStorage.removeItem("pulse.m06.evidence.forceSystemError");
    });
  }

  async function activateSection(id) {
    const meta = SECTIONS.find((s) => s.id === id);
    await page.locator(`[data-testid="${meta.nav}"]`).click();
    await page.waitForTimeout(350);
    const active = await page.locator(`[data-testid="${meta.nav}"][data-m06-nav-active="true"]`).count();
    const sectionEl = await page.locator(`[data-testid="${meta.section}"]`).count();
    const heading = await page.locator(`[data-testid="${meta.heading}"]`).count();
    if (!(active > 0 && sectionEl > 0 && heading > 0)) {
      throw new Error(`Section ${id} not active (active=${active} section=${sectionEl} heading=${heading})`);
    }
    return meta;
  }

  async function countSessionsInStore() {
    return page.evaluate(() => {
      try {
        const raw = localStorage.getItem("pulse.m06.attendance.sessions");
        const rows = raw ? JSON.parse(raw) : [];
        return Array.isArray(rows) ? rows.length : 0;
      } catch {
        return -1;
      }
    });
  }

  try {
    await goAttendance();
    await clearM06State();
    await goAttendance();

    // --- Live: refresh is functional and board/empty is service-backed ---
    {
      await activateSection("live");
      const before = await page.locator('[data-testid="m06-live-refresh"]').count();
      if (before < 1) throw new Error("live refresh control missing");
      await page.locator('[data-testid="m06-live-refresh"]').click();
      await page.waitForTimeout(200);
      const emptyOrBoard =
        (await page.locator('[data-testid="m06-live-board"]').count()) +
        (await page.getByText("No live sessions").count());
      record("section.live", "Section live functional proof", "refresh + service-backed board/empty", `hits=${emptyOrBoard}`, emptyOrBoard > 0 ? "pass" : "fail");
    }

    // --- Breaks (no session): disabled with reason, no mutation ---
    {
      await activateSection("breaks");
      const start = page.locator('[data-testid="m06-break-start"]');
      if ((await start.count()) < 1) throw new Error("break start missing");
      const disabled = await start.isDisabled();
      const reason = await page.locator('[data-testid="m06-break-disabled-reason"]').count();
      const sessionsBefore = await countSessionsInStore();
      if (!disabled) throw new Error("break start should be disabled without open session");
      if (reason < 1) throw new Error("disabled reason missing");
      await start.click({ force: true }).catch(() => {});
      await page.waitForTimeout(150);
      const sessionsAfter = await countSessionsInStore();
      record(
        "section.breaks",
        "Section breaks functional proof (disabled without session)",
        "disabled + reason + no mutation",
        `disabled=${disabled}; reason=${reason}; sessions=${sessionsBefore}->${sessionsAfter}`,
        disabled && reason > 0 && sessionsBefore === sessionsAfter ? "pass" : "fail"
      );
    }

    // --- Clock: clock-in creates open session ---
    {
      await activateSection("clock");
      const local = page.locator('[data-testid="m06-clock-local"]');
      const clockInBtn = page.locator('[data-testid="m06-clock-in"]');
      if ((await local.count()) < 1 || (await clockInBtn.count()) < 1) throw new Error("clock controls missing");
      await local.fill("2026-07-28T09:00");
      const sessionsBefore = await countSessionsInStore();
      await clockInBtn.click();
      await page.waitForTimeout(400);
      const openUi = await page.locator('[data-testid="m06-clock-open-session"]').count();
      const sessionsAfter = await countSessionsInStore();
      record(
        "section.clock",
        "Section clock functional proof",
        "clock-in creates open session",
        `openUi=${openUi}; sessions=${sessionsBefore}->${sessionsAfter}`,
        openUi > 0 && sessionsAfter > sessionsBefore ? "pass" : "fail"
      );
    }

    // --- Breaks (with session): start break mutates break list ---
    {
      await activateSection("breaks");
      const start = page.locator('[data-testid="m06-break-start"]');
      if (await start.isDisabled()) throw new Error("break start still disabled after clock-in");
      await start.click();
      await page.waitForTimeout(350);
      const listCount = await page.locator('[data-testid="m06-break-list"] li').count();
      record(
        "section.breaks.open",
        "Section breaks functional proof (start with open session)",
        "break list gains row",
        `rows=${listCount}`,
        listCount >= 1 ? "pass" : "fail"
      );
    }

    // --- Timesheets: generate creates draft ---
    {
      await activateSection("timesheets");
      const gen = page.locator('[data-testid="m06-timesheet-generate"]');
      if ((await gen.count()) < 1) throw new Error("timesheet generate missing");
      await gen.click();
      await page.waitForTimeout(350);
      const list = await page.locator('[data-testid="m06-timesheet-list"] li').count();
      record("section.timesheets", "Section timesheets functional proof", "generate creates draft row", `rows=${list}`, list >= 1 ? "pass" : "fail");
    }

    // --- Exceptions: unrostered clock should have produced exception(s) ---
    {
      await activateSection("exceptions");
      const listOrEmpty =
        (await page.locator('[data-testid="m06-exception-list"]').count()) +
        (await page.getByText("No exceptions").count());
      // Prefer list with rows after unrostered clock-in
      const rows = await page.locator('[data-testid="m06-exception-list"] li').count();
      record(
        "section.exceptions",
        "Section exceptions functional proof",
        "service-backed exception list after clock-in",
        `rows=${rows}; surface=${listOrEmpty}`,
        rows >= 1 ? "pass" : "fail"
      );
    }

    // --- Clock out then Corrections: request creates requested record ---
    {
      await activateSection("clock");
      const outBtn = page.locator('[data-testid="m06-clock-out"]');
      if (!(await outBtn.isDisabled())) {
        await page.locator('[data-testid="m06-clock-local"]').fill("2026-07-28T17:00");
        await outBtn.click();
        await page.waitForTimeout(350);
      }
      await activateSection("corrections");
      const before = Number(await page.locator('[data-testid="m06-correction-count"]').innerText().catch(() => "0"));
      const beforeN = Number(String(before).match(/\d+/)?.[0] ?? 0);
      await page.locator('[data-testid="m06-correction-request"]').click();
      await page.waitForTimeout(400);
      const afterText = await page.locator('[data-testid="m06-correction-count"]').innerText();
      const afterN = Number(String(afterText).match(/\d+/)?.[0] ?? 0);
      const requested = await page.locator('[data-m06-correction-state="requested"]').count();
      record(
        "section.corrections",
        "Section corrections functional proof",
        "request creates requested correction",
        `count ${beforeN}->${afterN}; requested=${requested}`,
        afterN > beforeN && requested >= 1 ? "pass" : "fail"
      );
    }

    // --- Approvals: approve changes pending count ---
    {
      await activateSection("approvals");
      let approveBtn = page.locator('[data-testid^="m06-approval-approve-"]').first();
      if ((await approveBtn.count()) < 1) {
        // Submit a timesheet first to create pending approval
        await activateSection("timesheets");
        const submit = page.locator('[data-testid^="m06-timesheet-submit-"]').first();
        if ((await submit.count()) > 0) {
          await submit.click();
          await page.waitForTimeout(350);
        }
        await activateSection("approvals");
        approveBtn = page.locator('[data-testid^="m06-approval-approve-"]').first();
      }
      if ((await approveBtn.count()) < 1) throw new Error("no pending approval control after timesheet submit");
      const pendingBefore = Number(
        String(await page.locator('[data-testid="m06-approval-count"]').innerText()).match(/\d+/)?.[0] ?? 0
      );
      if (!(pendingBefore > 0)) throw new Error("approvals evidence requires pendingBefore > 0");
      await approveBtn.click();
      await page.waitForTimeout(400);
      const pendingAfter = Number(
        String(await page.locator('[data-testid="m06-approval-count"]').innerText()).match(/\d+/)?.[0] ?? 0
      );
      record(
        "section.approvals",
        "Section approvals functional proof",
        "approve reduces pending queue",
        `pending ${pendingBefore}->${pendingAfter}`,
        pendingAfter < pendingBefore ? "pass" : "fail"
      );
      if (!(pendingAfter < pendingBefore)) {
        throw new Error(`pending did not decrease (${pendingBefore}->${pendingAfter})`);
      }
    }

    // --- History: filter requires rows, empties on no-match, restores on clear ---
    {
      await activateSection("history");
      let beforeRows = await page.locator('[data-testid="m06-history-list"] li').count();
      if (beforeRows < 1) {
        // Ensure at least one service-backed history row exists
        await activateSection("clock");
        const open = await page.locator('[data-testid="m06-clock-open-session"]').count();
        if (open < 1) {
          await page.locator('[data-testid="m06-clock-local"]').fill("2026-07-28T09:05");
          await page.locator('[data-testid="m06-clock-in"]').click();
          await page.waitForTimeout(300);
        }
        const outBtn = page.locator('[data-testid="m06-clock-out"]');
        if (!(await outBtn.isDisabled())) {
          await page.locator('[data-testid="m06-clock-local"]').fill("2026-07-28T17:05");
          await outBtn.click();
          await page.waitForTimeout(300);
        }
        await activateSection("history");
        beforeRows = await page.locator('[data-testid="m06-history-list"] li').count();
      }
      if (!(beforeRows > 0)) throw new Error("history evidence requires beforeRows > 0");
      const firstRowText = await page.locator('[data-testid="m06-history-list"] li').first().innerText();
      const filter = page.locator('[data-testid="m06-history-filter"]');
      if ((await filter.count()) < 1) throw new Error("history filter missing");
      await filter.fill("___no_match_filter___");
      await page.waitForTimeout(250);
      const afterRows = await page.locator('[data-testid="m06-history-list"] li').count();
      const filteredEmpty = await page.locator('[data-testid="m06-ux-filtered-empty"]').count();
      if (!(afterRows === 0 && filteredEmpty > 0)) {
        throw new Error(`filter did not empty list (afterRows=${afterRows}, filteredEmpty=${filteredEmpty})`);
      }
      await page.locator('[data-testid="m06-history-clear-filter"]').click();
      await page.waitForTimeout(250);
      const restoredRows = await page.locator('[data-testid="m06-history-list"] li').count();
      const restoredText = restoredRows > 0 ? await page.locator('[data-testid="m06-history-list"] li').first().innerText() : "";
      const ok = restoredRows >= beforeRows && restoredText.includes(firstRowText.slice(0, Math.min(12, firstRowText.length)));
      record(
        "section.history",
        "Section history functional proof",
        "beforeRows>0; filter empties; clear restores rows",
        `before=${beforeRows}; afterFilter=${afterRows}; filteredEmpty=${filteredEmpty}; restored=${restoredRows}`,
        ok ? "pass" : "fail"
      );
      if (!ok) throw new Error("history clear did not restore service-backed rows");
    }

    // --- Reports: seed mismatch; build + reconcile assert business classifications ---
    {
      const clinicId = await page.evaluate(() => {
        // Prefer clinic from open M06 session if present; else demo default used by workspace
        try {
          const sessions = JSON.parse(localStorage.getItem("pulse.m06.attendance.sessions") || "[]");
          if (Array.isArray(sessions) && sessions[0]?.clinicId) return sessions[0].clinicId;
        } catch {
          /* ignore */
        }
        return "loc_baldhills";
      });
      const mismatchPerson = "p-browser-reconcile-missing";
      const mismatchShift = "shf-browser-reconcile-01";
      await page.evaluate(
        ({ clinicId, mismatchPerson, mismatchShift }) => {
          const publicationId = "pub-browser-reconcile-01";
          localStorage.setItem(
            "pulse.m05.roster.publications",
            JSON.stringify([{ id: publicationId, publicationVersion: 1, state: "published" }])
          );
          localStorage.setItem(
            "pulse.m05.roster.shifts",
            JSON.stringify([
              {
                id: mismatchShift,
                clinicId,
                localStart: "2026-07-28T09:00",
                localEnd: "2026-07-28T17:00",
              },
            ])
          );
          localStorage.setItem(
            "pulse.m05.roster.assignments",
            JSON.stringify([
              {
                id: "asn-browser-reconcile-01",
                shiftId: mismatchShift,
                personId: mismatchPerson,
                clinicId,
                state: "assigned",
                publicationId,
              },
            ])
          );
        },
        { clinicId, mismatchPerson, mismatchShift }
      );

      await activateSection("reports");
      await page.locator('[data-testid="m06-report-build"]').click();
      await page.waitForTimeout(300);
      const out1 = await page.locator('[data-testid="m06-report-output"]').innerText();
      let report1;
      try {
        report1 = JSON.parse(out1);
      } catch {
        throw new Error("build report did not produce JSON");
      }
      if (typeof report1.sessions !== "number" || typeof report1.exceptionsOpen !== "number") {
        throw new Error("build report missing expected service-backed fields");
      }
      if (!("counts" in report1)) throw new Error("build report missing counts");
      if (!(report1.sessions >= 1)) throw new Error("build report must include service-backed session record(s)");

      await page.locator('[data-testid="m06-report-reconcile"]').click();
      await page.waitForTimeout(350);
      const reconcileList = page.locator('[data-testid="m06-reconcile-output"]');
      if ((await reconcileList.count()) < 1) throw new Error("reconcile output missing");
      const missingRow = page.locator(
        `[data-testid="m06-reconcile-row-missing-attendance"][data-m06-reconcile-shift="${mismatchShift}"][data-m06-reconcile-person="${mismatchPerson}"]`
      );
      const missingCount = await missingRow.count();
      const missingText = missingCount > 0 ? await missingRow.first().innerText() : "";
      if (!(missingCount >= 1 && missingText.includes("missing-attendance") && missingText.includes(mismatchShift))) {
        throw new Error(`exact missing-attendance classification not found for ${mismatchShift}/${mismatchPerson}`);
      }
      const out2 = await page.locator('[data-testid="m06-report-output"]').innerText();
      let report2;
      try {
        report2 = JSON.parse(out2);
      } catch {
        throw new Error("post-reconcile report did not produce JSON");
      }
      // Reconcile raises missed-in → open exceptions must increase vs pre-reconcile report
      const exceptionsIncreased = report2.exceptionsOpen > report1.exceptionsOpen;
      const ok = missingCount >= 1 && exceptionsIncreased;
      record(
        "section.reports",
        "Section reports functional proof",
        "build fields + exact missing-attendance reconcile classification",
        `sessions=${report1.sessions}; missingRow=${missingCount}; exceptions ${report1.exceptionsOpen}->${report2.exceptionsOpen}`,
        ok ? "pass" : "fail"
      );
      if (!ok) throw new Error("reports reconcile did not assert missing-attendance classification");
    }

    // --- Settings: publish increases version; restricted cannot mutate ---
    {
      await activateSection("settings");
      const before = Number(
        String(await page.locator('[data-testid="m06-policy-latest-version"]').innerText()).match(/\d+/)?.[0] ?? 0
      );
      await page.locator('[data-testid="m06-policy-publish"]').click();
      await page.waitForTimeout(350);
      const after = Number(
        String(await page.locator('[data-testid="m06-policy-latest-version"]').innerText()).match(/\d+/)?.[0] ?? 0
      );
      const publishPass = after > before;
      record(
        "section.settings",
        "Section settings functional proof",
        "authorized policy publish increases version",
        `version ${before}->${after}`,
        publishPass ? "pass" : "fail"
      );

      await page.evaluate(() => localStorage.setItem("pulse.m06.evidence.forceRestricted", "1"));
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForTimeout(700);
      await activateSection("settings");
      const restricted = await page.locator('[data-testid="m06-ux-restricted"]').count();
      const publishGone = (await page.locator('[data-testid="m06-policy-publish"]').count()) === 0;
      record(
        "section.settings.restricted",
        "Settings restricted actor cannot mutate",
        "restricted state; publish control hidden",
        `restricted=${restricted}; publishGone=${publishGone}`,
        restricted > 0 && publishGone ? "pass" : "fail"
      );
      await page.evaluate(() => localStorage.removeItem("pulse.m06.evidence.forceRestricted"));
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForTimeout(600);
    }

    // Responsive matrix
    for (const w of WIDTHS) {
      await page.setViewportSize({ width: w, height: 900 });
      for (const s of SECTIONS) {
        await page.locator(`[data-testid="${s.nav}"]`).click();
        await page.waitForTimeout(200);
        const overflow = await page.evaluate(() => {
          const doc = document.documentElement;
          return doc.scrollWidth > doc.clientWidth + 1;
        });
        const sectionEl = await page.locator(`[data-testid="${s.section}"]`).count();
        const active = await page.locator(`[data-testid="${s.nav}"][data-m06-nav-active="true"]`).count();
        const ok = sectionEl > 0 && active > 0 && !overflow;
        record(
          `responsive.${w}.${s.id}`,
          `Responsive ${w}px · ${s.id}`,
          "section active, no page overflow",
          ok ? "ok" : `overflow=${overflow} section=${sectionEl} active=${active}`,
          ok ? "pass" : "fail"
        );
      }
    }

    // Appearance via real Command Centre Appearance selector
    await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded", timeout: 60000 });
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
        return { stored, dark };
      });
    }

    await select.selectOption("light");
    await page.waitForTimeout(200);
    let state = await readAppearanceState();
    record(
      "appearance.light",
      "Appearance explicit Light via app selector",
      'stored="light" and body without theme-dark',
      JSON.stringify(state),
      state.stored === "light" && !state.dark ? "pass" : "fail"
    );

    await select.selectOption("dark");
    await page.waitForTimeout(200);
    state = await readAppearanceState();
    record(
      "appearance.dark",
      "Appearance explicit Dark via app selector",
      'stored="dark" and body.theme-dark',
      JSON.stringify(state),
      state.stored === "dark" && state.dark ? "pass" : "fail"
    );

    await page.goto(`${BASE}/time-attendance`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(600);
    state = await readAppearanceState();
    record(
      "appearance.persist-nav",
      "Dark persists after navigation to Time & Attendance",
      "theme-dark remains",
      JSON.stringify(state),
      state.stored === "dark" && state.dark ? "pass" : "fail"
    );

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(600);
    state = await readAppearanceState();
    record(
      "appearance.persist-reload",
      "Dark persists after reload",
      "theme-dark remains",
      JSON.stringify(state),
      state.stored === "dark" && state.dark ? "pass" : "fail"
    );

    await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('select[aria-label="Appearance"]', { timeout: 15000 });
    const selectAgain = page.locator('select[aria-label="Appearance"]').first();
    await selectAgain.selectOption("system");
    await page.waitForTimeout(200);
    state = await readAppearanceState();
    record(
      "appearance.device",
      "Appearance Device/System via app selector",
      'stored="system"',
      JSON.stringify(state),
      state.stored === "system" ? "pass" : "fail"
    );

    await page.emulateMedia({ colorScheme: "light" });
    await page.waitForTimeout(200);
    let sysLight = await readAppearanceState();
    record(
      "appearance.system-light",
      "OS light while Device/System selected",
      "stored=system; not theme-dark",
      JSON.stringify(sysLight),
      sysLight.stored === "system" && !sysLight.dark ? "pass" : "fail"
    );

    await page.emulateMedia({ colorScheme: "dark" });
    await page.waitForTimeout(200);
    let sysDark = await readAppearanceState();
    record(
      "appearance.system-dark",
      "OS dark while Device/System selected",
      "stored=system; theme-dark",
      JSON.stringify(sysDark),
      sysDark.stored === "system" && sysDark.dark ? "pass" : "fail"
    );

    await selectAgain.selectOption("light");
    await page.emulateMedia({ colorScheme: "light" });

    // Keyboard focus measurable
    await page.goto(`${BASE}/time-attendance`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(600);
    await page.locator("body").click({ position: { x: 5, y: 5 } });
    let focused = false;
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press("Tab");
      const info = await page.evaluate(() => {
        const el = document.activeElement;
        const cs = getComputedStyle(el);
        return {
          tid: el?.getAttribute("data-testid"),
          outlineWidth: cs.outlineWidth,
          boxShadow: cs.boxShadow,
        };
      });
      if (info.tid?.startsWith("m06-nav-") && (info.outlineWidth !== "0px" || info.boxShadow.includes("rgb"))) {
        focused = true;
        break;
      }
    }
    record("a11y.keyboard-focus", "Keyboard measurable focus on M06 nav", "visible focus", focused ? "ok" : "not measured", focused ? "pass" : "fail");

    await page.evaluate(() => localStorage.setItem("pulse.m06.evidence.forceRestricted", "1"));
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(700);
    await page.locator('[data-testid="m06-nav-live"]').click();
    await page.waitForTimeout(300);
    const restricted = await page.locator('[data-testid="m06-ux-restricted"]').count();
    record("ux.restricted", "Restricted UX via forceRestricted flag", "restricted state", String(restricted), restricted > 0 ? "pass" : "fail");
    await page.evaluate(() => localStorage.removeItem("pulse.m06.evidence.forceRestricted"));

    await page.evaluate(() => localStorage.setItem("pulse.m06.evidence.forceOffline", "1"));
    await page.locator('[data-testid="m06-nav-clock"]').click();
    await page.waitForTimeout(400);
    const offline = await page.locator('[data-testid="m06-ux-offline"]').count();
    record("ux.offline", "Offline UX via forceOffline flag", "offline state", String(offline), offline > 0 ? "pass" : "fail");
    await page.evaluate(() => localStorage.removeItem("pulse.m06.evidence.forceOffline"));

    record("browser.suite", "Browser evidence completed", "ok", "ok", "pass");
  } catch (e) {
    record("browser.suite", "Browser evidence", "ok", String(e), "fail");
  } finally {
    await browser.close();
  }
}

async function mergePerf() {
  // Ensure perf file exists from unit suite; expand summary rows if present
  if (!fs.existsSync(PERF_OUT)) {
    fs.writeFileSync(
      PERF_OUT,
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          environment: "local prototype — not a production SLA",
          results: [],
          note: "Performance suite did not emit file; run m06-performance.test.ts",
        },
        null,
        2
      )
    );
  }
  const perf = JSON.parse(fs.readFileSync(PERF_OUT, "utf8"));
  for (const row of perf.results || []) {
    const id = row.id.startsWith("perf.") ? row.id : `perf.${row.id}`;
    record(id, row.name, `<=${row.targetMs}ms`, `${row.measuredMs}ms`, row.result, {
      datasetSize: row.datasetSize,
      metricType: row.metricType,
      method: row.method,
    });
  }
}

async function main() {
  const unit = await runUnitSuite();
  await mergePerf();
  await runBrowser();

  // Explicit note: BLOCKED-M10 outside totals
  const informational = {
    BLOCKED_M10: "Inherited from Wave 4 — informational only; not counted in Wave 5 pass/fail/skipped/blocked totals",
  };

  const pass = results.filter((r) => r.result === "pass").length;
  const fail = results.filter((r) => r.result === "fail").length;
  const skipped = results.filter((r) => r.result === "skipped").length;
  const blocked = results.filter((r) => r.result === "blocked").length;

  const payload = {
    generatedAt: new Date().toISOString(),
    module: "m06-time-attendance",
    wave: 5,
    planningCheckpoint: "309e36b0719229fbc618a05b7fdc046be3952e85",
    ownerAccepted: false,
    productionApproved: false,
    workflowAccounting: {
      requiredM06Workflows: 21,
      requiredWorkflowsPassed: unit.requiredPassed === 21,
      requiredWorkflowsPassedCount: unit.requiredPassed,
      blockedIntake: "BLOCKED-M07",
      blockedM10OutsideTotals: true,
      evidenceSource: "docs/audits/wave5-m06-workflow-evidence.json",
    },
    totals: { pass, fail, skipped, blocked },
    informational,
    unit: { pass: unit.unitPass, fail: unit.unitFail },
    results,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2));
  console.log(JSON.stringify({ outPath: OUT, ...payload.totals, unitPass: unit.unitPass, unitFail: unit.unitFail }, null, 2));
  process.exitCode = fail > 0 ? 1 : 0;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
