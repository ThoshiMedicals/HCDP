/**
 * Phase 4 FINAL short spot-check — frozen SHA 97a83d7 against :3491.
 * Covers: emergency View All @390+1024, topbar Dashboard/Inbox, Act-as, Settings H1 wrap.
 * Evidence-only. No src/test edits.
 */
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("/tmp/hcdp-fix/ui-batch1-wqa-3491/node_modules/playwright");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const SHOTS = path.join(ROOT, "screenshots");
const TRACES = path.join(ROOT, "traces");
const OUT = path.join(ROOT, "_raw-results.json");
const BASE = process.env.HCDP_BASE_URL || "http://127.0.0.1:3491";
const APP_SHA = "97a83d7beb219ce01a7b12c6f70a975a44614d59";
const LIVE_MIRROR =
  "/tmp/hcdp-fix/ui-batch1-wqa-3491/docs/audits/ui-batch1-independent-verification-findings-remediation/corrective-validation/owner-visual-layout-v1/agent-workstep-qa/revalidation-97a83d7";

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

function writeWorkflowDoc(docId, wf) {
  const lines = [
    `# ${docId} — ${wf.workflowId} (spot-check revalidation 97a83d7)`,
    "",
    "| Field | Value |",
    "|---|---|",
    `| Source SHA | ${APP_SHA} |`,
    `| Port | ${BASE} |`,
    `| Outcome | **${wf.outcome}** |`,
    "",
    "## Steps",
    "",
  ];
  for (const s of wf.steps || []) {
    lines.push(`### Step ${s.n}: ${s.action}`);
    lines.push(`- **Expected:** ${s.expected}`);
    lines.push(`- **Observed:** ${s.observed}`);
    lines.push(`- **Result:** ${s.result}`);
    lines.push("");
  }
  lines.push("## Screenshots");
  for (const p of wf.screenshots || []) {
    lines.push(`- \`${p}\``);
  }
  lines.push("");
  lines.push("## Outcome");
  lines.push(`**${wf.outcome}**`);
  lines.push("");
  fs.writeFileSync(path.join(ROOT, "workflows", `${docId}.md`), lines.join("\n"));
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
      phase: "Phase 4 FINAL spot-check REVALIDATION",
      appSourceSha: APP_SHA,
      worktree: "/tmp/hcdp-fix/ui-batch1-wqa-3491",
      base: BASE,
      startedAt: new Date().toISOString(),
      scope: "short spot-check: emergency 390+1024, topbar Dashboard/Inbox, Act-as, Settings H1",
    },
    workflows: [],
    findings,
  };

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
      addFinding(`WQA-SPOT-EMG-01-${suffix}`, id, "major", "Emergency banner missing", "");
      wf.screenshots.push(await shot(page, `${id}-missing`));
      await ctx.tracing.stop({ path: path.join(TRACES, `${id}.zip`) }).catch(() => {});
      await ctx.close();
      results.workflows.push(wf);
      return;
    }
    await banner.scrollIntoViewIfNeeded();
    wf.screenshots.push(await shot(page, `${id}-banner`));

    const viewAll = banner.getByRole("button", { name: "View All Announcements", exact: true });
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
      n: 2,
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
        `WQA-SPOT-EMG-CLIP-${suffix}`,
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
      n: 3,
      action: "Click View All Announcements",
      expected: "Opens All Announcements modal",
      observed: `opened=${dialogOk}, url=${page.url()}`,
      result: dialogOk ? "PASS" : "FAIL",
      url: page.url(),
    });
    wf.screenshots.push(await shot(page, `${id}-view-all`));
    if (!dialogOk) {
      wf.outcome = "FAIL";
      addFinding(`WQA-SPOT-EMG-VIEWALL-${suffix}`, id, "major", "View All did not open", "");
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

  await wfEmergency({ width: 390, height: 844 }, "MOBILE390");
  await wfEmergency({ width: 1024, height: 768 }, "MID1024");

  // ----- WF-TOPBAR (Dashboard + Inbox) -----
  {
    const id = "WF-TOPBAR";
    const wf = {
      workflowId: id,
      route: "/dashboard",
      sourceSha: APP_SHA,
      startingState: "desktop spot-check Dashboard/Inbox",
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
      addFinding("WQA-SPOT-TOP-02", id, "major", "Action Inbox nav failed", page.url());
    }
    wf.screenshots.push(await shot(page, `${id}-inbox`));

    if (wf.steps.some((s) => s.result === "FAIL")) wf.outcome = "FAIL";
    await ctx.close();
    results.workflows.push(wf);
  }

  // ----- WF-SIDEBAR Act-as visible -----
  {
    const id = "WF-SIDEBAR";
    const wf = {
      workflowId: id,
      route: "/dashboard",
      sourceSha: APP_SHA,
      startingState: "1440x900 Act-as spot-check",
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
    await page.evaluate(() => {
      const sidebar = document.querySelector("aside.pulse-sidebar");
      const footer = sidebar?.querySelector(".sidebar-user");
      if (footer) footer.scrollIntoView({ block: "end", inline: "nearest" });
      if (sidebar) sidebar.scrollTop = sidebar.scrollHeight;
    });
    await waitReady(page, 400);
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
    wf.actAs["1440x900"] = { geom, changed };
    wf.screenshots.push(await shot(page, `${id}-actas-1440x900`));
    const ok = geom?.visible && geom?.fullyInViewport && changed && !geom.pageHorizontalScroll;
    wf.steps.push({
      n: 1,
      action: "Act-as visible and usable at 1440x900",
      expected: "Fully in viewport + value changeable; no H-scroll",
      observed: JSON.stringify({ geom, changed }),
      result: ok ? "PASS" : "FAIL",
    });
    if (!ok) {
      wf.outcome = "FAIL";
      addFinding("WQA-SPOT-SIDE-ACTAS", id, "major", "Act-as not usable at 1440x900", JSON.stringify({ geom, changed }));
    }

    if (wf.steps.some((s) => s.result === "FAIL")) wf.outcome = "FAIL";
    await ctx.close();
    results.workflows.push(wf);
  }

  // ----- WF-ROUTES Settings H1 wrap -----
  {
    const id = "WF-ROUTES";
    const wf = {
      workflowId: id,
      route: "/settings",
      sourceSha: APP_SHA,
      startingState: "390 Settings H1 wrap spot-check",
      steps: [],
      outcome: "PASS",
      screenshots: [],
      h1Checks: {},
      errors: errBag(),
    };
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    attachErrors(page, wf.errors);
    await page.goto(`${BASE}/settings`, { waitUntil: "networkidle", timeout: 90000 });
    await waitReady(page);
    const h1Meta = await page.evaluate(() => {
      const h1 = document.querySelector("h1");
      if (!h1) return null;
      const st = getComputedStyle(h1);
      return {
        text: (h1.textContent || "").trim(),
        textOverflow: st.textOverflow,
        whiteSpace: st.whiteSpace,
        truncateClass: h1.classList.contains("truncate") || /\btruncate\b/.test(h1.className),
        scrollOverflow: h1.scrollWidth > h1.clientWidth + 1,
        clientHeight: h1.clientHeight,
        scrollHeight: h1.scrollHeight,
      };
    });
    wf.h1Checks["/settings"] = h1Meta;
    const h1Ok = h1Meta && /Organisation|Settings|Access/i.test(h1Meta.text);
    const wrapOk =
      h1Meta &&
      h1Meta.textOverflow !== "ellipsis" &&
      !h1Meta.truncateClass &&
      !h1Meta.scrollOverflow;
    const pass = Boolean(h1Ok && wrapOk);
    wf.steps.push({
      n: 1,
      action: "Settings H1 wraps (no ellipsis/truncate) at 390",
      expected: "h1 matches; no truncate/ellipsis; wraps",
      observed: JSON.stringify({ url: page.url(), h1Meta }),
      result: pass ? "PASS" : "FAIL",
      url: page.url(),
    });
    wf.screenshots.push(await shot(page, `${id}-Settings`));
    if (!pass) {
      wf.outcome = "FAIL";
      addFinding("WQA-SPOT-RTE-Settings", id, "major", "Settings H1 wrap issue at 390", JSON.stringify(h1Meta));
    }
    if (wf.steps.some((s) => s.result === "FAIL")) wf.outcome = "FAIL";
    await ctx.close();
    results.workflows.push(wf);
  }

  results.meta.finishedAt = new Date().toISOString();
  results.totals = {
    pass: results.workflows.filter((w) => w.outcome === "PASS").length,
    fail: results.workflows.filter((w) => w.outcome === "FAIL").length,
    blocked: results.workflows.filter((w) => w.outcome === "BLOCKED").length,
    outOfScope: results.workflows.filter((w) => w.outcome === "OUT OF SCOPE").length,
    total: results.workflows.length,
    openFindings: findings.filter((f) => f.status === "OPEN").length,
  };

  const docMap = {
    "WF-EMERGENCY-MOBILE390": "WQA-001",
    "WF-EMERGENCY-MID1024": "WQA-002",
    "WF-TOPBAR": "WQA-003",
    "WF-SIDEBAR": "WQA-004",
    "WF-ROUTES": "WQA-005",
  };
  for (const wf of results.workflows) {
    writeWorkflowDoc(docMap[wf.workflowId] || wf.workflowId, wf);
  }

  fs.writeFileSync(OUT, JSON.stringify(results, null, 2));
  fs.writeFileSync(
    path.join(ROOT, "findings", "OPEN_FINDINGS.md"),
    findings.length
      ? findings.map((f) => `- ${f.id}: ${f.title} (${f.severity})`).join("\n") + "\n"
      : "No open findings.\n"
  );

  // mirror to live wqa worktree evidence path
  fs.mkdirSync(LIVE_MIRROR, { recursive: true });
  fs.cpSync(ROOT, LIVE_MIRROR, { recursive: true });

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
