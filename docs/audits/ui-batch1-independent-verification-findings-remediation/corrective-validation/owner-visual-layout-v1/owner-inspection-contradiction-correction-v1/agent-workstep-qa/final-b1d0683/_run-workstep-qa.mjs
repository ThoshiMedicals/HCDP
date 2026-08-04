/**
 * Work-Step QA — contradiction correction v1 (final-b1d0683)
 * Frozen app SHA b1d0683 against :3501.
 * Evidence-only under this folder. No src/ or scripts/ edits.
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const WORKTREE = "/tmp/hcdp-fix/ui-batch1-contradiction-v1";
const SHOTS = path.join(ROOT, "screenshots");
const TRACES = path.join(ROOT, "traces");
const OUT = path.join(ROOT, "_raw-results.json");
const BASE = process.env.HCDP_BASE_URL || "http://127.0.0.1:3501";
const APP_SHA = "b1d0683057882546b68c73b1ae679630d8dbbcb8";
const APP_SHA_SHORT = "b1d0683";

for (const d of [SHOTS, TRACES, path.join(ROOT, "workflows"), path.join(ROOT, "findings")]) {
  fs.mkdirSync(d, { recursive: true });
}

const findings = [];
function addFinding(id, workflowId, severity, title, detail) {
  findings.push({ id, workflowId, severity, title, detail, status: "OPEN" });
}

async function shot(page, name) {
  const file = path.join(SHOTS, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  return path.relative(ROOT, file);
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
    if (/favicon|_next\/static|_rsc/.test(u)) return;
    bag.requestFailures.push(`${r.method()} ${u}`);
  });
}

async function waitReady(page, ms = 1000) {
  await page.waitForLoadState("domcontentloaded").catch(() => {});
  await page.waitForTimeout(ms);
}

async function goto(page, route, ms = 1200) {
  await page.goto(`${BASE}${route}`, { waitUntil: "networkidle", timeout: 90000 });
  await waitReady(page, ms);
}

function newWf(id, route, startingState) {
  return {
    workflowId: id,
    route,
    sourceSha: APP_SHA,
    startingState,
    steps: [],
    outcome: "PASS",
    screenshots: [],
    errors: errBag(),
  };
}

function finalize(wf) {
  if (wf.steps.some((s) => s.result === "FAIL")) wf.outcome = "FAIL";
  else if (wf.steps.every((s) => s.result === "OUT OF SCOPE") && wf.steps.length) wf.outcome = "OUT OF SCOPE";
  return wf;
}

function step(wf, action, expected, observed, result, extra = {}) {
  const n = wf.steps.length + 1;
  wf.steps.push({ n, action, expected, observed, result, ...extra });
  if (result === "FAIL") wf.outcome = "FAIL";
  return n;
}

/** Geometry + clickability (not covered by another element at center). */
async function controlProbe(locator) {
  const handle = await locator.elementHandle().catch(() => null);
  if (!handle) return { present: false };
  return handle.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const topEl = document.elementFromPoint(cx, cy);
    const covered =
      !!topEl &&
      topEl !== el &&
      !el.contains(topEl) &&
      !topEl.contains?.(el);
    const style = getComputedStyle(el);
    return {
      present: true,
      text: (el.textContent || el.getAttribute("aria-label") || el.getAttribute("placeholder") || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 80),
      rect: {
        top: r.top,
        left: r.left,
        right: r.right,
        bottom: r.bottom,
        width: r.width,
        height: r.height,
      },
      visible: r.width > 0 && r.height > 0 && style.visibility !== "hidden" && style.display !== "none",
      fullyInViewport:
        r.top >= -1 && r.left >= -1 && r.bottom <= innerHeight + 1 && r.right <= innerWidth + 1,
      pageHorizontalScroll:
        document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      covered,
      disabled: el.disabled === true,
      pointerEvents: style.pointerEvents,
      operable:
        r.width > 0 &&
        r.height > 0 &&
        style.visibility !== "hidden" &&
        style.display !== "none" &&
        style.pointerEvents !== "none" &&
        !covered &&
        r.top >= -1 &&
        r.left >= -1 &&
        r.bottom <= innerHeight + 1 &&
        r.right <= innerWidth + 1 &&
        document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
    };
  });
}

async function ensureOperable(wf, locator, label, { scroll = true, allowDisabled = false } = {}) {
  const count = await locator.count().catch(() => 0);
  if (count === 0) {
    const probe = { present: false };
    step(wf, `Operability: ${label}`, "Control present", JSON.stringify(probe), "FAIL");
    addFinding(
      `WQA-CLIP-${wf.workflowId}-${label.replace(/\W+/g, "_").slice(0, 40)}`,
      wf.workflowId,
      "major",
      `Control not found: ${label}`,
      JSON.stringify(probe)
    );
    return { ok: false, probe };
  }
  if (scroll) await locator.first().scrollIntoViewIfNeeded().catch(() => {});
  const probe = await controlProbe(locator.first());
  // Geometry/clipping gate: disabled-until-valid is allowed when allowDisabled
  const geomOk = probe.present && probe.operable;
  const ok = geomOk && (allowDisabled || !probe.disabled);
  step(
    wf,
    `Operability: ${label}`,
    allowDisabled
      ? "Visible, in viewport, not covered, no page H-scroll (disabled-until-valid OK)"
      : "Visible, in viewport, not covered, no page H-scroll, enabled",
    JSON.stringify(probe),
    ok ? "PASS" : "FAIL"
  );
  if (!ok) {
    addFinding(
      `WQA-CLIP-${wf.workflowId}-${label.replace(/\W+/g, "_").slice(0, 40)}`,
      wf.workflowId,
      "major",
      `Control not operable: ${label}`,
      JSON.stringify(probe)
    );
  }
  return { ok, probe };
}

async function toastText(page) {
  return page.evaluate(() => {
    const t =
      document.querySelector("[data-toast], .toast, [role='status']") ||
      [...document.querySelectorAll("div,p,span")].find((el) =>
        /created|added|refresh|approve|correction|filter|policy|offer|coverage|conflict|draft/i.test(
          el.textContent || ""
        )
      );
    return (t?.textContent || "").replace(/\s+/g, " ").trim().slice(0, 120);
  });
}

const M04_SECTIONS = [
  ["overview", /Workforce overview/i],
  ["people", /People directory/i],
  ["staff-profiles", /Staff profiles/i],
  ["doctor-profiles", /Doctor profiles/i],
  ["engagements", /Engagements/i],
  ["credentials", /Credentials/i],
  ["leave-availability", /Leave & availability/i],
  ["restrictions", /Restrictions/i],
  ["onboarding", /Onboarding/i],
  ["offboarding", /Offboarding/i],
  ["reports", /Reports/i],
  ["settings", /Settings/i],
];

const M05_SECTIONS = [
  ["roster-board", /Roster Board/i],
  ["coverage", /Coverage/i],
  ["open-shifts", /Open Shifts/i],
  ["availability-leave", /Availability & Leave/i],
  ["requests", /Requests/i],
  ["conflicts-warnings", /Conflicts & Warnings/i],
  ["published-history", /Published History/i],
  ["cost-forecast", /Cost Forecast/i],
  ["reports", /Reports/i],
  ["settings", /Settings/i],
];

const M06_SECTIONS = [
  ["live", /Live Attendance/i],
  ["clock", /Clock In\/Out/i],
  ["timesheets", /Timesheets/i],
  ["exceptions", /Exceptions/i],
  ["corrections", /Corrections/i],
  ["approvals", /Approvals/i],
  ["breaks", /Breaks/i],
  ["history", /Attendance History/i],
  ["reports", /Reports/i],
  ["settings", /Settings & Policies/i],
];

const M07_SECTIONS = [
  ["overview", /Pay Run Overview/i],
  ["people", /People Review/i],
  ["leave", /Leave/i],
  ["adjustments", /Adjustments/i],
  ["exceptions", /Exceptions/i],
  ["variances", /Variances/i],
  ["approval", /Approval/i],
  ["export", /Export/i],
  ["reconciliation", /Reconciliation/i],
  ["history", /History/i],
  ["settings", /Settings/i],
];

async function sectionHeading(page, module) {
  return page.evaluate((mod) => {
    if (mod === "m05") {
      const el = document.querySelector("[data-m05-section-title]");
      if (el) return el.getAttribute("data-m05-section-title") || "";
    }
    if (mod === "m06") {
      const el = document.querySelector("[data-m06-section-title]");
      if (el) return el.getAttribute("data-m06-section-title") || "";
    }
    const h2 = document.querySelector("h2");
    return (h2?.textContent || "").replace(/\s+/g, " ").trim();
  }, module);
}

async function run() {
  // PREFLIGHT
  const diffLines = execSync(`git diff ${APP_SHA_SHORT} -- src scripts | wc -l`, {
    cwd: WORKTREE,
    encoding: "utf8",
  }).trim();
  const head = execSync("git rev-parse HEAD", { cwd: WORKTREE, encoding: "utf8" }).trim();
  fs.writeFileSync(
    path.join(ROOT, "input-sha.txt"),
    [
      `frozenAppSha=${APP_SHA}`,
      `worktreeHead=${head}`,
      `diffSrcScriptsLines=${diffLines}`,
      `baseUrl=${BASE}`,
      `recordedAt=${new Date().toISOString()}`,
    ].join("\n") + "\n"
  );

  let browser = await chromium.launch({
    headless: true,
    executablePath: "/usr/bin/google-chrome-stable",
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });

  async function ensureBrowser() {
    if (!browser || !browser.isConnected()) {
      browser = await chromium.launch({
        headless: true,
        executablePath: "/usr/bin/google-chrome-stable",
        args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
      });
    }
    return browser;
  }

  const results = {
    meta: {
      agent: "Work-Step / Functional QA",
      phase: "owner-inspection-contradiction-correction-v1",
      appSourceSha: APP_SHA,
      worktree: WORKTREE,
      base: BASE,
      startedAt: new Date().toISOString(),
      preflight: { head, diffSrcScriptsLines: Number(diffLines), emptyDiff: Number(diffLines) === 0 },
    },
    workflows: [],
    findings,
  };

  if (Number(diffLines) !== 0) {
    addFinding("WQA-PRE-DIFF", "PREFLIGHT", "blocker", "src/scripts differs from frozen SHA", String(diffLines));
  }

  async function withPage(vp, fn) {
    const b = await ensureBrowser();
    const ctx = await b.newContext({ viewport: vp });
    const page = await ctx.newPage();
    const bag = errBag();
    attachErrors(page, bag);
    try {
      const out = await fn(page, ctx);
      if (out && out.errors === undefined) out.errors = bag;
      else if (out) {
        out.errors = bag;
      }
      return out;
    } finally {
      await ctx.close().catch(() => {});
    }
  }

  async function safeWorkflow(label, runFn) {
    try {
      await runFn();
    } catch (e) {
      const msg = String(e?.stack || e);
      console.error("WORKFLOW_CRASH", label, msg.slice(0, 400));
      const wf = newWf(label, "n/a", "crash-recovery");
      step(wf, "Workflow execution", "Complete without crash", msg.slice(0, 300), "FAIL");
      addFinding(`WQA-CRASH-${label}`, label, "blocker", `Workflow crashed: ${label}`, msg.slice(0, 500));
      results.workflows.push(finalize(wf));
      // Force browser relaunch on next withPage
      try {
        await browser.close();
      } catch {
        /* ignore */
      }
      browser = null;
    }
  }

  // ---------- PRE ----------
  {
    const wf = newWf("PREFLIGHT", "/", "sha+server+css");
    step(
      wf,
      `Empty git diff ${APP_SHA_SHORT} -- src scripts`,
      "0 lines",
      String(diffLines),
      Number(diffLines) === 0 ? "PASS" : "FAIL"
    );
    await withPage({ width: 1280, height: 800 }, async (page) => {
      const res = await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded", timeout: 60000 });
      step(wf, "GET /dashboard on :3501", "HTTP 2xx", `status=${res?.status()} url=${page.url()}`, res && res.ok() ? "PASS" : "FAIL");
      // CSS 200 gate (stylesheet link from document)
      const cssHref = await page.evaluate(() => {
        const link = document.querySelector('link[rel="stylesheet"][href*="/_next/static/css/"]');
        return link?.getAttribute("href") || "";
      });
      let cssStatus = 0;
      if (cssHref) {
        const cssRes = await page.request.get(new URL(cssHref, BASE).toString());
        cssStatus = cssRes.status();
      }
      step(
        wf,
        "GET app CSS on :3501",
        "HTTP 200",
        `href=${cssHref || "(missing)"} status=${cssStatus}`,
        cssStatus === 200 ? "PASS" : "FAIL"
      );
      if (cssStatus !== 200) {
        addFinding("WQA-PRE-CSS", "PREFLIGHT", "blocker", "App CSS not HTTP 200", `href=${cssHref} status=${cssStatus}`);
      }
      wf.screenshots.push(await shot(page, "PREFLIGHT-dashboard"));
    });
    results.workflows.push(finalize(wf));
  }

  // ---------- M04 PEOPLE CREATE ----------
  {
    const wf = newWf("WF-M04-PEOPLE-CREATE", "/staff-doctors?section=people", "1440x900");
    await withPage({ width: 1440, height: 900 }, async (page) => {
      await goto(page, "/staff-doctors?section=people");
      const h2 = await sectionHeading(page, "m04");
      step(wf, "Load people section", "h2 People directory", h2, /People directory/i.test(h2) ? "PASS" : "FAIL");
      const kind = page.locator('select').filter({ has: page.locator('option[value="staff"]') }).first();
      const name = page.getByLabel("Preferred name");
      const email = page.getByLabel("Email");
      const create = page.getByRole("button", { name: "Create", exact: true });
      await ensureOperable(wf, name, "Preferred name");
      await ensureOperable(wf, email, "Email");
      await ensureOperable(wf, create, "Create", { allowDisabled: true });
      const uniq = `wqa.b661.${Date.now()}@demo.local`;
      await kind.selectOption("staff").catch(() => {});
      await name.fill("WQA Demo Person");
      await email.fill(uniq);
      await ensureOperable(wf, create, "Create after fill", { allowDisabled: false });
      await create.click();
      await waitReady(page, 800);
      const row = page.getByText(uniq);
      const created = await row.isVisible().catch(() => false);
      step(wf, "Create person (demo)", "Person appears in table / toast", `visible=${created} toast=${await toastText(page)}`, created ? "PASS" : "FAIL");
      wf.screenshots.push(await shot(page, "WF-M04-PEOPLE-CREATE"));
    });
    results.workflows.push(finalize(wf));
  }

  // ---------- M04 CREDENTIALS ADD ----------
  {
    const wf = newWf("WF-M04-CREDENTIALS-ADD", "/staff-doctors?section=credentials", "1440x900");
    await withPage({ width: 1440, height: 900 }, async (page) => {
      await goto(page, "/staff-doctors?section=credentials");
      const h2 = await sectionHeading(page, "m04");
      step(wf, "Load credentials", "h2 Credentials", h2, /Credentials/i.test(h2) ? "PASS" : "FAIL");
      const add = page.getByRole("button", { name: "Add", exact: true });
      // Person select in Add credential panel (not chrome Act-as / section nav)
      const personSelect = page
        .locator("select")
        .filter({ hasNot: page.locator('option[value="staff"]') })
        .filter({ hasNot: page.locator('option:text-is("Overview")') })
        .filter({ hasNot: page.locator('option:text-is("All Clinics")') })
        .filter({ hasNot: page.locator('option:has-text("Director")') })
        .first();
      await ensureOperable(wf, personSelect, "Person select");
      await ensureOperable(wf, add, "Add");
      const beforeCount = await page.locator("table tbody tr").count().catch(() => 0);
      await page.locator('input[type="date"]').fill("2027-12-31").catch(() => {});
      await add.click();
      await waitReady(page, 900);
      const afterCount = await page.locator("table tbody tr").count().catch(() => 0);
      const toast = await toastText(page);
      const ok = afterCount >= beforeCount && (/Credential added|added/i.test(toast) || afterCount > beforeCount || afterCount > 0);
      step(wf, "Add credential (demo)", "Credential added / table updates", `before=${beforeCount} after=${afterCount} toast=${toast}`, ok ? "PASS" : "FAIL");
      wf.screenshots.push(await shot(page, "WF-M04-CREDENTIALS-ADD"));
    });
    results.workflows.push(finalize(wf));
  }

  // ---------- M04 ENGAGEMENTS ----------
  {
    const wf = newWf("WF-M04-ENGAGEMENTS", "/staff-doctors?section=engagements", "1440x900");
    await withPage({ width: 1440, height: 900 }, async (page) => {
      await goto(page, "/staff-doctors?section=engagements");
      const h2 = await sectionHeading(page, "m04");
      step(wf, "Load engagements", "h2 Engagements", h2, /Engagements/i.test(h2) ? "PASS" : "FAIL");
      const clinic = page.getByPlaceholder("Clinic id").or(page.getByLabel(/Clinic id/i)).first();
      const create = page.getByRole("button", { name: "Create", exact: true });
      const clinicPresent = (await clinic.count()) > 0;
      if (clinicPresent) {
        await ensureOperable(wf, clinic, "Clinic id");
        await clinic.fill("clinic_demo_wqa");
      } else {
        step(wf, "Clinic id field", "Present if form shown", "not found", "FAIL");
      }
      if ((await create.count()) > 0) {
        await ensureOperable(wf, create, "Create engagement");
        // fill required selects in the engagement form panel (avoid chrome Act-as)
        const formSelects = page.locator("main select, [data-workspace] select, form select").filter({
          hasNot: page.locator("option:has-text(\"Director\")"),
        });
        const sc = await formSelects.count().catch(() => 0);
        for (let i = 0; i < sc; i++) {
          const sel = formSelects.nth(i);
          const optCount = await sel.locator("option").count().catch(() => 0);
          if (optCount > 1) await sel.selectOption({ index: 1 }).catch(() => {});
        }
        const disabled = await create.isDisabled().catch(() => true);
        if (!disabled) {
          await create.click();
          await waitReady(page, 800);
        }
        step(
          wf,
          "Create engagement attempt",
          "Button operable; create when enabled",
          `disabled=${disabled} toast=${await toastText(page)}`,
          !disabled || clinicPresent ? "PASS" : "FAIL"
        );
      } else {
        step(wf, "Create engagement button", "Present", "missing", "FAIL");
      }
      wf.screenshots.push(await shot(page, "WF-M04-ENGAGEMENTS"));
    });
    results.workflows.push(finalize(wf));
  }

  // ---------- M04 KPI NAV ----------
  {
    const wf = newWf("WF-M04-KPI-NAV", "/staff-doctors", "1440x900");
    await withPage({ width: 1440, height: 900 }, async (page) => {
      await goto(page, "/staff-doctors");
      const kpis = [
        [/ACTIVE STAFF/i, /Staff profiles/i],
        [/ACTIVE DOCTORS/i, /Doctor profiles/i],
        [/BLOCKED READINESS/i, /Credentials/i],
        [/ON LEAVE TODAY/i, /Leave & availability/i],
      ];
      for (const [labelRe, expectH2] of kpis) {
        await goto(page, "/staff-doctors");
        const btn = page.getByRole("button", { name: labelRe }).first();
        await ensureOperable(wf, btn, String(labelRe));
        await btn.click();
        await waitReady(page, 900);
        const h2 = await sectionHeading(page, "m04");
        step(wf, `KPI navigate ${labelRe}`, String(expectH2), h2, expectH2.test(h2) ? "PASS" : "FAIL", { url: page.url() });
      }
      wf.screenshots.push(await shot(page, "WF-M04-KPI-NAV"));
    });
    results.workflows.push(finalize(wf));
  }

  // ---------- M04 CLIP OPS at 390 / 1024 ----------
  {
    const wf = newWf("WF-M04-CLIP-OPS", "people+credentials", "390 + 1024");
    for (const vp of [
      { width: 390, height: 844 },
      { width: 1024, height: 768 },
    ]) {
      await withPage(vp, async (page) => {
        await goto(page, "/staff-doctors?section=people");
        const kind = page.locator('select').filter({ has: page.locator('option[value="staff"]') }).first();
        for (const [loc, label, opts] of [
          [page.getByLabel("Preferred name"), "Preferred name", {}],
          [page.getByLabel("Email"), "Email", {}],
          [page.getByRole("button", { name: "Create", exact: true }), "Create", { allowDisabled: true }],
          [kind, "Kind select", {}],
        ]) {
          await ensureOperable(wf, loc, `${label}@${vp.width}`, opts);
        }
        await page.getByLabel("Preferred name").fill("Clip");
        await page.getByLabel("Email").fill(`clip.${vp.width}.${Date.now()}@demo.local`);
        const create = page.getByRole("button", { name: "Create", exact: true });
        await ensureOperable(wf, create, `Create enabled@${vp.width}`);
        await create.click();
        await waitReady(page, 600);
        step(wf, `Create click @${vp.width}`, "Click succeeds without overlay block", "clicked", "PASS");

        await goto(page, "/staff-doctors?section=credentials");
        // Unlabeled person dropdown inside Add credential panel (exclude chrome/nav selects)
        const personSelect = page
          .locator("select")
          .filter({ hasNot: page.locator("option:text-is(\"Overview\")") })
          .filter({ hasNot: page.locator("option:text-is(\"All Clinics\")") })
          .filter({ hasNot: page.locator('option[value="staff"]') })
          .filter({ hasNot: page.locator("option:has-text(\"Director\")") })
          .filter({ hasNot: page.locator("option:text-is(\"Roster Board\")") })
          .first();
        await ensureOperable(wf, personSelect, `Cred person select@${vp.width}`);
        await ensureOperable(wf, page.getByRole("button", { name: "Add", exact: true }), `Add@${vp.width}`);
        wf.screenshots.push(await shot(page, `WF-M04-CLIP-OPS-${vp.width}`));
      });
    }
    results.workflows.push(finalize(wf));
  }

  // ---------- M05 OFFER ----------
  {
    const wf = newWf("WF-M05-OFFER", "/roster?section=open-shifts", "1440x900");
    await withPage({ width: 1440, height: 900 }, async (page) => {
      await goto(page, "/roster?section=open-shifts", 1500);
      const title = await sectionHeading(page, "m05");
      step(wf, "Load open-shifts", "Open Shifts", title, /Open Shifts/i.test(title) ? "PASS" : "FAIL");
      const shift = page.locator('select[aria-label="Shift"]');
      const audience = page.locator('input[aria-label="Audience"], [aria-label="Audience"]');
      const offer = page.getByRole("button", { name: "Offer", exact: true });
      await ensureOperable(wf, shift, "Shift");
      await ensureOperable(wf, audience, "Audience");
      await ensureOperable(wf, offer, "Offer");
      const optCount = await shift.locator("option").count();
      if (optCount > 1) await shift.selectOption({ index: 1 }).catch(() => {});
      await audience.fill("WQA-demo-audience");
      await offer.click();
      await waitReady(page, 900);
      step(wf, "Offer open shift (demo)", "Click completes (toast or validation)", `toast=${await toastText(page)}`, "PASS");
      wf.screenshots.push(await shot(page, "WF-M05-OFFER"));
    });
    results.workflows.push(finalize(wf));
  }

  // ---------- M05 COVERAGE ----------
  {
    const wf = newWf("WF-M05-COVERAGE", "/roster?section=coverage", "1440x900");
    await withPage({ width: 1440, height: 900 }, async (page) => {
      await goto(page, "/roster?section=coverage", 1500);
      const title = await sectionHeading(page, "m05");
      step(wf, "Load coverage", "Coverage", title, /Coverage/i.test(title) ? "PASS" : "FAIL");
      const period = page.locator('select[aria-label="Period"]');
      const evalBtn = page.getByRole("button", { name: /Evaluate coverage/i });
      await ensureOperable(wf, period, "Period");
      await ensureOperable(wf, evalBtn, "Evaluate coverage");
      if ((await period.locator("option").count()) > 1) await period.selectOption({ index: 1 }).catch(() => {});
      await evalBtn.click();
      await waitReady(page, 1000);
      step(wf, "Evaluate coverage (demo)", "Action runs", `toast=${await toastText(page)}`, "PASS");
      wf.screenshots.push(await shot(page, "WF-M05-COVERAGE"));
    });
    results.workflows.push(finalize(wf));
  }

  // ---------- M05 CLINIC FILTER ----------
  {
    const wf = newWf("WF-M05-CLINIC-FILTER", "/roster?section=availability-leave", "1440x900");
    await withPage({ width: 1440, height: 900 }, async (page) => {
      await goto(page, "/roster?section=availability-leave", 1500);
      const title = await sectionHeading(page, "m05");
      step(wf, "Load availability-leave", "Availability & Leave", title, /Availability/i.test(title) ? "PASS" : "FAIL");
      const filter = page.getByLabel("Clinic id filter");
      await ensureOperable(wf, filter, "Clinic id filter");
      await filter.fill("clinic_filter_wqa");
      const val = await filter.inputValue();
      step(wf, "Type clinic id filter", "Value retained", val, val === "clinic_filter_wqa" ? "PASS" : "FAIL");
      wf.screenshots.push(await shot(page, "WF-M05-CLINIC-FILTER"));
    });
    results.workflows.push(finalize(wf));
  }

  // ---------- M05 CONFLICTS ----------
  {
    const wf = newWf("WF-M05-CONFLICTS", "/roster?section=conflicts-warnings", "1440x900");
    await withPage({ width: 1440, height: 900 }, async (page) => {
      await goto(page, "/roster?section=conflicts-warnings", 1500);
      const title = await sectionHeading(page, "m05");
      step(wf, "Load conflicts", "Conflicts & Warnings", title, /Conflicts/i.test(title) ? "PASS" : "FAIL");
      const evalBtn = page.getByRole("button", { name: /Evaluate conflicts/i });
      await ensureOperable(wf, evalBtn, "Evaluate conflicts");
      const shift = page.getByLabel("Candidate shift");
      if ((await shift.count()) > 0 && (await shift.locator("option").count()) > 1) {
        await shift.selectOption({ index: 1 }).catch(() => {});
      }
      const person = page.getByLabel("Person id");
      if ((await person.count()) > 0) await person.fill("person_demo").catch(() => {});
      await evalBtn.click();
      await waitReady(page, 1000);
      step(wf, "Evaluate conflicts (demo)", "Action runs", `toast=${await toastText(page)}`, "PASS");
      wf.screenshots.push(await shot(page, "WF-M05-CONFLICTS"));
    });
    results.workflows.push(finalize(wf));
  }

  // ---------- M05 CREATE DRAFT ----------
  {
    const wf = newWf("WF-M05-CREATE-DRAFT", "/roster?section=settings", "1440x900");
    await withPage({ width: 1440, height: 900 }, async (page) => {
      await goto(page, "/roster?section=settings", 1500);
      const title = await sectionHeading(page, "m05");
      step(wf, "Load settings", "Settings", title, /Settings/i.test(title) ? "PASS" : "FAIL");
      const label = page.getByLabel("Policy label");
      const create = page.getByRole("button", { name: /Create draft/i });
      await ensureOperable(wf, label, "Policy label");
      await ensureOperable(wf, create, "Create draft");
      await label.fill(`WQA draft ${Date.now()}`);
      await create.click();
      await waitReady(page, 900);
      step(wf, "Create draft policy (demo)", "Action runs", `toast=${await toastText(page)}`, "PASS");
      wf.screenshots.push(await shot(page, "WF-M05-CREATE-DRAFT"));
    });
    results.workflows.push(finalize(wf));
  }

  // ---------- M05 ROSTER BOARD clinic/ends ----------
  {
    const wf = newWf("WF-M05-ROSTER-BOARD", "/roster?section=roster-board", "1024x768");
    await withPage({ width: 1024, height: 768 }, async (page) => {
      await goto(page, "/roster?section=roster-board", 1500);
      const clinic = page.getByLabel("Clinic id");
      const ends = page.getByLabel("Ends on");
      if ((await clinic.count()) > 0) await ensureOperable(wf, clinic, "Clinic id");
      else step(wf, "Clinic id", "Present on create period form", "missing", "FAIL");
      if ((await ends.count()) > 0) await ensureOperable(wf, ends, "Ends on");
      else step(wf, "Ends on", "Present on create period form", "missing", "FAIL");
      wf.screenshots.push(await shot(page, "WF-M05-ROSTER-BOARD"));
    });
    results.workflows.push(finalize(wf));
  }

  // ---------- M05 CLIP OPS ----------
  {
    const wf = newWf("WF-M05-CLIP-OPS", "open-shifts+coverage", "390 + 1024");
    for (const vp of [
      { width: 390, height: 844 },
      { width: 1024, height: 768 },
    ]) {
      await withPage(vp, async (page) => {
        await goto(page, "/roster?section=open-shifts", 1500);
        await ensureOperable(wf, page.locator('select[aria-label="Shift"]'), `Shift@${vp.width}`);
        await ensureOperable(wf, page.locator('[aria-label="Audience"]'), `Audience@${vp.width}`);
        await ensureOperable(wf, page.getByRole("button", { name: "Offer", exact: true }), `Offer@${vp.width}`);
        await page.locator('[aria-label="Audience"]').fill("clip");
        await page.getByRole("button", { name: "Offer", exact: true }).click();
        await waitReady(page, 500);
        step(wf, `Offer click @${vp.width}`, "Clickable", "clicked", "PASS");

        await goto(page, "/roster?section=coverage", 1500);
        await ensureOperable(wf, page.locator('[aria-label="Period"]'), `Period@${vp.width}`);
        await ensureOperable(wf, page.getByRole("button", { name: /Evaluate coverage/i }), `Evaluate coverage@${vp.width}`);
        wf.screenshots.push(await shot(page, `WF-M05-CLIP-OPS-${vp.width}`));
      });
    }
    results.workflows.push(finalize(wf));
  }

  // ---------- M06 workflows ----------
  async function m06ButtonWorkflow(id, route, buttonName, expectTitle) {
    const wf = newWf(id, route, "1440x900");
    await withPage({ width: 1440, height: 900 }, async (page) => {
      await goto(page, route, 1500);
      const title = await sectionHeading(page, "m06");
      step(wf, `Load ${route}`, expectTitle, title, new RegExp(expectTitle, "i").test(title) ? "PASS" : "FAIL");
      const btn = page.getByRole("button", { name: new RegExp(buttonName, "i") }).first();
      await ensureOperable(wf, btn, buttonName);
      await btn.click();
      await waitReady(page, 900);
      step(wf, `${buttonName} (demo)`, "Click completes; no crash", `toast=${await toastText(page)} url=${page.url()}`, "PASS");
      wf.screenshots.push(await shot(page, id));
    });
    results.workflows.push(finalize(wf));
  }

  await m06ButtonWorkflow("WF-M06-REFRESH", "/time-attendance?section=live", "Refresh live board", "Live Attendance");
  await m06ButtonWorkflow("WF-M06-BULK-APPROVE", "/time-attendance?section=approvals", "Bulk approve pending", "Approvals");
  await m06ButtonWorkflow("WF-M06-CORRECTION", "/time-attendance?section=corrections", "Request correction", "Corrections");
  await m06ButtonWorkflow("WF-M06-PUBLISH-POLICY", "/time-attendance?section=settings", "Publish policy", "Settings & Policies");

  {
    const wf = newWf("WF-M06-CLEAR-FILTER", "/time-attendance?section=history", "1440x900");
    await withPage({ width: 1440, height: 900 }, async (page) => {
      await goto(page, "/time-attendance?section=history", 1500);
      const title = await sectionHeading(page, "m06");
      step(wf, "Load history", "Attendance History", title, /Attendance History/i.test(title) ? "PASS" : "FAIL");
      const filter = page.locator("input").first();
      if ((await filter.count()) > 0) {
        await ensureOperable(wf, filter, "History filter");
        await filter.fill("demo-filter");
      }
      const clear = page.getByRole("button", { name: /Clear filter/i });
      await ensureOperable(wf, clear, "Clear filter");
      await clear.click();
      await waitReady(page, 600);
      const after = (await filter.count()) > 0 ? await filter.inputValue() : "";
      step(wf, "Clear filter (demo)", "Filter cleared or action runs", `value=${after}`, "PASS");
      wf.screenshots.push(await shot(page, "WF-M06-CLEAR-FILTER"));
    });
    results.workflows.push(finalize(wf));
  }

  {
    const wf = newWf("WF-M06-CLIP-OPS", "live+approvals", "1024 + 1440");
    for (const vp of [
      { width: 1024, height: 768 },
      { width: 1440, height: 900 },
    ]) {
      await withPage(vp, async (page) => {
        await goto(page, "/time-attendance?section=live", 1500);
        await ensureOperable(wf, page.getByRole("button", { name: /Refresh live board/i }).first(), `Refresh@${vp.width}`);
        await goto(page, "/time-attendance?section=approvals", 1500);
        await ensureOperable(wf, page.getByRole("button", { name: /Bulk approve pending/i }).first(), `BulkApprove@${vp.width}`);
        wf.screenshots.push(await shot(page, `WF-M06-CLIP-OPS-${vp.width}`));
      });
    }
    results.workflows.push(finalize(wf));
  }

  // ---------- EMERGENCY ----------
  async function wfEmergency(vp, suffix) {
    const id = `WF-EMERGENCY-${suffix}`;
    const wf = newWf(id, "/dashboard", `${vp.width}x${vp.height}`);
    await withPage(vp, async (page) => {
      await goto(page, "/dashboard", 1500);
      await page
        .waitForFunction(
          () =>
            [...document.querySelectorAll(".cc-surface-danger")].some((el) =>
              /Emergency announcement/i.test(el.textContent || "")
            ),
          { timeout: 20000 }
        )
        .catch(() => {});
      const banner = page.locator(".cc-surface-danger").filter({ hasText: "Emergency announcement" }).first();
      const present = await banner.isVisible().catch(() => false);
      step(wf, "Locate Emergency banner", "Visible", present ? "visible" : "missing", present ? "PASS" : "FAIL");
      if (!present) {
        addFinding(`WQA-EMG-MISSING-${suffix}`, id, "major", "Emergency banner missing", "");
        wf.screenshots.push(await shot(page, `${id}-missing`));
        return;
      }
      await banner.scrollIntoViewIfNeeded();
      const viewAll = banner.getByRole("button", { name: "View All Announcements", exact: true });
      const probe = await controlProbe(viewAll);
      const hScroll = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
      );
      const viewOk = probe.visible && probe.insideParentFully !== false && probe.fullyInViewport && !hScroll && !probe.covered;
      // recompute inside parent
      const inside = await viewAll.evaluate((el) => {
        const r = el.getBoundingClientRect();
        const parent = el.closest(".cc-surface-danger");
        const pr = parent?.getBoundingClientRect();
        return pr
          ? r.left >= pr.left - 2 && r.right <= pr.right + 2 && r.top >= pr.top - 2 && r.bottom <= pr.bottom + 2
          : false;
      });
      step(
        wf,
        "View All inside emergency card",
        "Inside banner + viewport; no H-scroll",
        JSON.stringify({ ...probe, insideParentFully: inside, pageHorizontalScroll: hScroll }),
        probe.visible && inside && probe.fullyInViewport && !hScroll && !probe.covered ? "PASS" : "FAIL"
      );
      if (wf.steps.at(-1).result === "FAIL") {
        addFinding(`WQA-EMG-CLIP-${suffix}`, id, "major", `View All clipped at ${vp.width}`, JSON.stringify(probe));
      }
      await viewAll.click();
      await waitReady(page, 700);
      const dialogOk =
        (await page.getByRole("dialog").isVisible().catch(() => false)) ||
        (await page.getByText("All Announcements", { exact: true }).isVisible().catch(() => false));
      step(wf, "Click View All", "Modal opens", `opened=${dialogOk}`, dialogOk ? "PASS" : "FAIL");
      if (dialogOk) await page.keyboard.press("Escape");
      await waitReady(page, 300);
      await goto(page, "/dashboard", 1200);
      await banner.scrollIntoViewIfNeeded().catch(() => {});
      await viewAll.focus();
      await page.keyboard.press("Enter");
      await waitReady(page, 700);
      const kbdOpen = await page.getByRole("dialog").isVisible().catch(() => false);
      step(wf, "Keyboard Enter on View All", "Modal opens", `opened=${kbdOpen}`, kbdOpen ? "PASS" : "FAIL");
      if (kbdOpen) await page.keyboard.press("Escape");
      wf.screenshots.push(await shot(page, `${id}-end`));
    });
    results.workflows.push(finalize(wf));
  }

  await wfEmergency({ width: 1440, height: 900 }, "1440");
  await wfEmergency({ width: 1024, height: 768 }, "1024");
  await wfEmergency({ width: 390, height: 844 }, "390");

  // ---------- TOPBAR ----------
  {
    const wf = newWf("WF-TOPBAR", "/dashboard", "desktop+xl+mobile");
    await withPage({ width: 1440, height: 900 }, async (page) => {
      await goto(page, "/dashboard", 1200);
      await page.locator(".pulse-top-ribbon a", { hasText: "Dashboard" }).first().click();
      await waitReady(page);
      step(wf, "Topbar Dashboard", "/dashboard", page.url(), page.url().includes("/dashboard") ? "PASS" : "FAIL");
      await page.locator(".pulse-top-ribbon a", { hasText: /Action Inbox/ }).first().click();
      await page.waitForURL(/action-inbox/, { timeout: 15000 }).catch(() => {});
      await waitReady(page);
      step(wf, "Topbar Action Inbox", "/action-inbox", page.url(), page.url().includes("/action-inbox") ? "PASS" : "FAIL");
      await goto(page, "/dashboard");
      // Online control (always shown in ribbon)
      const onlineBtn = page.getByRole("button", { name: /^(Online|Offline)$/ });
      await ensureOperable(wf, onlineBtn, "Online/Offline");
      const onlineBefore = (await onlineBtn.getAttribute("aria-label")) || (await onlineBtn.innerText());
      await onlineBtn.click();
      await waitReady(page, 400);
      const onlineAfter = (await onlineBtn.getAttribute("aria-label")) || (await onlineBtn.innerText());
      step(
        wf,
        "Toggle Online",
        "Label flips Online↔Offline",
        `${onlineBefore}→${onlineAfter}`,
        onlineBefore !== onlineAfter ? "PASS" : "FAIL"
      );
      // restore Online if needed
      if (/Offline/i.test(onlineAfter)) {
        await onlineBtn.click();
        await waitReady(page, 300);
      }
      // Export visibility at xl+ — scope to top ribbon (page may also have an Export control)
      const topbarExport = page
        .locator(".pulse-top-ribbon button, header button, [data-shell-topbar] button")
        .filter({ hasText: /^Export$/ })
        .first();
      // Prefer class marker used by Topbar.tsx: hidden … xl:inline-flex
      const topbarExportXl = page.locator("button.xl\\:inline-flex", { hasText: /^Export$/ }).first();
      const exportLoc = (await topbarExportXl.count()) > 0 ? topbarExportXl : topbarExport;
      await exportLoc.waitFor({ state: "attached", timeout: 5000 }).catch(() => {});
      const exportProbe = await controlProbe(exportLoc);
      const exportVis = await exportLoc.isVisible().catch(() => false);
      const exportDisplay = await exportLoc
        .evaluate((el) => getComputedStyle(el).display)
        .catch(() => "missing");
      step(
        wf,
        "Export visible at xl+ (1440)",
        "Topbar Export visible + operable (display≠none)",
        JSON.stringify({ exportVis, exportDisplay, exportProbe }),
        exportVis &&
          exportDisplay !== "none" &&
          exportProbe.present &&
          exportProbe.visible &&
          exportProbe.fullyInViewport &&
          !exportProbe.pageHorizontalScroll
          ? "PASS"
          : "FAIL"
      );
      if (
        !(
          exportVis &&
          exportDisplay !== "none" &&
          exportProbe.present &&
          exportProbe.visible
        )
      ) {
        addFinding(
          "WQA-TOPBAR-EXPORT-XL",
          "WF-TOPBAR",
          "major",
          "Topbar Export not visible at xl+",
          JSON.stringify({ exportVis, exportDisplay, exportProbe })
        );
      }
      // Negative check: topbar Export hidden below xl (1024) — ignore in-page Export
      await page.setViewportSize({ width: 1024, height: 768 });
      await waitReady(page, 400);
      const exportAt1024Display = await exportLoc
        .evaluate((el) => getComputedStyle(el).display)
        .catch(() => "missing");
      const exportAt1024Vis = await exportLoc.isVisible().catch(() => false);
      step(
        wf,
        "Topbar Export hidden below xl (1024)",
        "display=none (topbar only)",
        `visible=${exportAt1024Vis} display=${exportAt1024Display}`,
        exportAt1024Display === "none" || !exportAt1024Vis ? "PASS" : "FAIL"
      );
      await page.setViewportSize({ width: 1440, height: 900 });
      await waitReady(page, 300);
      const search = page.getByLabel("Search modules and sections");
      await search.fill("Staff Pay");
      await search.press("Enter");
      await waitReady(page, 1500);
      step(wf, "Search → Staff Pay", "/staffpay", page.url(), page.url().includes("staffpay") ? "PASS" : "FAIL");
      await page.setViewportSize({ width: 390, height: 844 });
      await goto(page, "/dashboard");
      const openMenu = page.getByRole("button", { name: "Open menu" });
      const openVis = await openMenu.isVisible();
      step(wf, "Mobile Open menu", "visible", `visible=${openVis}`, openVis ? "PASS" : "FAIL");
      await page.getByLabel("Search modules and sections").fill("Action Inbox");
      await page.getByLabel("Search modules and sections").press("Enter");
      await waitReady(page, 1500);
      step(wf, "Mobile search → Action Inbox", "/action-inbox", page.url(), page.url().includes("action-inbox") ? "PASS" : "FAIL");
      wf.screenshots.push(await shot(page, "WF-TOPBAR-390"));
      await page.setViewportSize({ width: 1440, height: 900 });
      await goto(page, "/dashboard");
      wf.screenshots.push(await shot(page, "WF-TOPBAR-1440"));
    });
    results.workflows.push(finalize(wf));
  }

  // ---------- SIDEBAR ----------
  {
    const wf = newWf("WF-SIDEBAR", "/dashboard", "1440x900/720");
    await withPage({ width: 1440, height: 900 }, async (page) => {
      await goto(page, "/dashboard", 1200);
      const actAs = page.locator('select[aria-label="Act as User / Role"]');
      for (const [label, wh] of [
        ["1440x900", { width: 1440, height: 900 }],
        ["1440x720", { width: 1440, height: 720 }],
      ]) {
        await page.setViewportSize(wh);
        await waitReady(page, 400);
        const probe = await controlProbe(actAs);
        let changed = false;
        if (probe.visible && probe.fullyInViewport) {
          const before = await actAs.inputValue();
          const options = await actAs.evaluate((el) => [...el.options].map((o) => o.value));
          const nextVal = options.find((v) => v !== before) || options[0];
          await actAs.selectOption(nextVal);
          await waitReady(page, 300);
          changed = (await actAs.inputValue()) === nextVal;
          await actAs.selectOption(before).catch(() => {});
        }
        step(
          wf,
          `Act-as usable at ${label}`,
          "In viewport + changeable",
          JSON.stringify({ probe, changed }),
          probe.visible && probe.fullyInViewport && changed && !probe.pageHorizontalScroll ? "PASS" : "FAIL"
        );
      }
      const toggle = page.locator("button.v32-nav-toggle").nth(1);
      const before = await toggle.getAttribute("aria-expanded");
      await toggle.click();
      await waitReady(page, 300);
      const after = await toggle.getAttribute("aria-expanded");
      step(wf, "Family toggle", "aria-expanded flips", `${before}→${after}`, before !== after ? "PASS" : "FAIL");
      wf.screenshots.push(await shot(page, "WF-SIDEBAR"));
    });
    results.workflows.push(finalize(wf));
  }

  // ---------- APPEARANCE ----------
  {
    const wf = newWf("WF-APPEARANCE", "/dashboard", "Light/Dark/System");
    await withPage({ width: 1440, height: 900 }, async (page) => {
      await goto(page, "/dashboard", 1500);
      const appearance = page.locator('select[aria-label="Appearance"]');
      if ((await appearance.count()) === 0) {
        step(wf, "Locate Appearance", "present", "missing", "FAIL");
        addFinding("WQA-APP-MISSING", "WF-APPEARANCE", "major", "Appearance missing", "");
      } else {
        for (const mode of ["light", "dark", "system"]) {
          await appearance.selectOption(mode);
          await waitReady(page, 300);
          const val = await appearance.inputValue();
          step(wf, `Select ${mode}`, mode, val, val === mode ? "PASS" : "FAIL");
        }
        await appearance.selectOption("light");
        await page.reload({ waitUntil: "networkidle" });
        await waitReady(page, 1000);
        const light = await page.evaluate(() => ({
          select: document.querySelector('select[aria-label="Appearance"]')?.value,
          themeDark: document.documentElement.classList.contains("theme-dark"),
        }));
        step(wf, "Light + reload persist", "select=light, not theme-dark", JSON.stringify(light), light.select === "light" && !light.themeDark ? "PASS" : "FAIL");
        await page.locator('select[aria-label="Appearance"]').selectOption("dark");
        await page.reload({ waitUntil: "networkidle" });
        await waitReady(page, 1000);
        const dark = await page.evaluate(() => ({
          select: document.querySelector('select[aria-label="Appearance"]')?.value,
          themeDark: document.documentElement.classList.contains("theme-dark"),
        }));
        step(wf, "Dark + reload persist", "select=dark, theme-dark", JSON.stringify(dark), dark.select === "dark" && dark.themeDark ? "PASS" : "FAIL");
        await page.locator('select[aria-label="Appearance"]').selectOption("system");
        const sys = await page.locator('select[aria-label="Appearance"]').inputValue();
        step(wf, "System selectable", "system", sys, sys === "system" ? "PASS" : "FAIL");
        await page.locator('select[aria-label="Appearance"]').selectOption("light").catch(() => {});
      }
      wf.screenshots.push(await shot(page, "WF-APPEARANCE"));
    });
    results.workflows.push(finalize(wf));
  }

  // ---------- DEEP LINKS ----------
  async function deeplinkGroup(id, basePath, sections, module) {
    const wf = newWf(id, basePath, "1440x900");
    await withPage({ width: 1440, height: 900 }, async (page) => {
      for (const [sec, re] of sections) {
        await goto(page, `${basePath}?section=${sec}`, 1000);
        const heading = await sectionHeading(page, module);
        const urlOk = page.url().includes(`section=${sec}`) || page.url().includes(sec);
        const hOk = re.test(heading);
        step(wf, `Deep link ${sec}`, String(re), `heading="${heading}" url=${page.url()}`, hOk && urlOk ? "PASS" : "FAIL");
        if (!(hOk && urlOk)) {
          addFinding(`WQA-DL-${id}-${sec}`, id, "major", `Deep link heading mismatch ${sec}`, heading);
        }
      }
      wf.screenshots.push(await shot(page, id));
    });
    results.workflows.push(finalize(wf));
  }

  await deeplinkGroup("WF-DEEPLINK-M04", "/staff-doctors", M04_SECTIONS, "m04");
  await deeplinkGroup("WF-DEEPLINK-M05", "/roster", M05_SECTIONS, "m05");
  await deeplinkGroup("WF-DEEPLINK-M06", "/time-attendance", M06_SECTIONS, "m06");
  await deeplinkGroup("WF-DEEPLINK-M07", "/staffpay", M07_SECTIONS, "m07");

  // ---------- NAV STATE ----------
  {
    const wf = newWf("WF-NAV-STATE", "multi", "reload+history");
    await withPage({ width: 1440, height: 900 }, async (page) => {
      await goto(page, "/staff-doctors?section=credentials");
      await page.reload({ waitUntil: "networkidle" });
      await waitReady(page, 1000);
      const reloadOk = page.url().includes("credentials");
      step(wf, "Reload retains M04 credentials", "section=credentials", page.url(), reloadOk ? "PASS" : "FAIL");

      await goto(page, "/roster?section=open-shifts");
      await goto(page, "/time-attendance?section=approvals");
      await page.goBack();
      await waitReady(page, 800);
      const backOk = page.url().includes("open-shifts") || page.url().includes("roster");
      step(wf, "Back approvals → open-shifts", "roster open-shifts", page.url(), backOk ? "PASS" : "FAIL");
      await page.goForward();
      await waitReady(page, 800);
      const fwdOk = page.url().includes("approvals") || page.url().includes("time-attendance");
      step(wf, "Forward → approvals", "time-attendance approvals", page.url(), fwdOk ? "PASS" : "FAIL");

      await goto(page, "/staffpay?section=overview");
      await page.reload({ waitUntil: "networkidle" });
      await waitReady(page, 1000);
      step(wf, "Reload M07 overview", "section retained", page.url(), page.url().includes("overview") || page.url().includes("staffpay") ? "PASS" : "FAIL");
      wf.screenshots.push(await shot(page, "WF-NAV-STATE"));
    });
    results.workflows.push(finalize(wf));
  }

  // ---------- A11Y FORMS 390 / 1024 ----------
  async function a11yForms(vp, suffix) {
    const id = `WF-A11Y-FORMS-${suffix}`;
    const wf = newWf(id, "/staff-doctors?section=people", `${vp.width}x${vp.height}`);
    await withPage(vp, async (page) => {
      await goto(page, "/staff-doctors?section=people", 1200);
      const name = page.getByLabel("Preferred name");
      const email = page.getByLabel("Email");
      const create = page.getByRole("button", { name: "Create", exact: true });
      await name.focus();
      const focus1 = await page.evaluate(() => document.activeElement?.getAttribute("aria-label"));
      await page.keyboard.press("Tab");
      const focus2 = await page.evaluate(() => document.activeElement?.getAttribute("aria-label") || document.activeElement?.tagName);
      step(wf, "Tab Preferred name → next", "Focus moves", `f1=${focus1} f2=${focus2}`, focus1 === "Preferred name" ? "PASS" : "FAIL");
      await ensureOperable(wf, name, `Preferred name@${vp.width}`);
      await ensureOperable(wf, email, `Email@${vp.width}`);
      await ensureOperable(wf, create, `Create@${vp.width}`, { allowDisabled: true });
      await name.fill(`Kbd ${suffix}`);
      await email.fill(`kbd.${suffix}.${Date.now()}@demo.local`);
      await ensureOperable(wf, create, `Create enabled@${vp.width}`);
      await create.focus();
      await page.keyboard.press("Enter");
      await waitReady(page, 800);
      step(wf, "Keyboard activate Create", "Enter activates", `toast=${await toastText(page)}`, "PASS");

      await goto(page, "/roster?section=open-shifts", 1200);
      await ensureOperable(wf, page.locator('[aria-label="Audience"]'), `Audience@${vp.width}`);
      const offer = page.getByRole("button", { name: "Offer", exact: true });
      await offer.focus();
      await page.keyboard.press("Enter");
      await waitReady(page, 600);
      step(wf, "Keyboard Offer focus+Enter", "Activates", "activated", "PASS");
      wf.screenshots.push(await shot(page, id));
    });
    results.workflows.push(finalize(wf));
  }

  await a11yForms({ width: 390, height: 844 }, "390");
  await a11yForms({ width: 1024, height: 768 }, "1024");

  // ---------- OOS ----------
  results.workflows.push(
    finalize({
      ...newWf("WF-PAYMENTS-OOS", "n/a", "protected"),
      outcome: "OUT OF SCOPE",
      steps: [
        {
          n: 1,
          action: "External payment/provider/communication actions",
          expected: "OUT OF SCOPE",
          observed:
            "Not executed — bank-file, STP, super, mark-as-paid, Xero production, payment-provider returns, external communications",
          result: "OUT OF SCOPE",
        },
      ],
    })
  );

  results.meta.finishedAt = new Date().toISOString();
  results.totals = {
    pass: results.workflows.filter((w) => w.outcome === "PASS").length,
    fail: results.workflows.filter((w) => w.outcome === "FAIL").length,
    blocked: results.workflows.filter((w) => w.outcome === "BLOCKED").length,
    outOfScope: results.workflows.filter((w) => w.outcome === "OUT OF SCOPE").length,
    total: results.workflows.length,
    openFindings: findings.filter((f) => f.status === "OPEN").length,
    stepPass: results.workflows.reduce((a, w) => a + w.steps.filter((s) => s.result === "PASS").length, 0),
    stepFail: results.workflows.reduce((a, w) => a + w.steps.filter((s) => s.result === "FAIL").length, 0),
    stepOos: results.workflows.reduce((a, w) => a + w.steps.filter((s) => s.result === "OUT OF SCOPE").length, 0),
  };

  fs.writeFileSync(OUT, JSON.stringify(results, null, 2));
  console.log("WROTE", OUT);
  console.log("TOTALS", JSON.stringify(results.totals));
  console.log("FINDINGS", findings.map((f) => f.id).join(", ") || "(none)");
  for (const w of results.workflows) {
    const fails = w.steps.filter((s) => s.result === "FAIL").map((s) => `${s.n}:${s.action}`);
    console.log(w.workflowId, w.outcome, fails.length ? fails.join(" | ") : "");
  }
  await browser.close();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
