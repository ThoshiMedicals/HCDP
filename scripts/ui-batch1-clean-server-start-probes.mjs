/**
 * Three clean next-dev starts + three warm first requests for M07 adjustments.
 * Does not touch port 3000. Uses HCDP_CLEAN_PORT (default 3482).
 */
import { spawn } from "node:child_process";
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, appendFileSync } from "node:fs";
import { join } from "node:path";

const PORT = Number(process.env.HCDP_CLEAN_PORT || 3482);
const BASE = `http://127.0.0.1:${PORT}`;
const CWD = process.env.HCDP_CLEAN_CWD || process.cwd();
const OUT = join(
  process.env.HCDP_EVIDENCE_ROOT ||
    join(process.cwd(), "docs/audits/ui-batch1-independent-verification-findings-remediation/corrective-validation/clean-server-starts")
);
mkdirSync(OUT, { recursive: true });

function nowIso() {
  return new Date().toISOString();
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitHealthy(timeoutMs = 180000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    try {
      const r = await fetch(`${BASE}/dashboard`, { redirect: "manual" });
      if (r.status === 200 || r.status === 307 || r.status === 308) return r.status;
    } catch {
      /* retry */
    }
    await sleep(500);
  }
  throw new Error(`Server on ${PORT} did not become healthy`);
}

function startDev() {
  const logPath = join(OUT, `next-dev-${PORT}-${Date.now()}.log`);
  const child = spawn(
    "npx",
    ["next", "dev", "--webpack", "-H", "127.0.0.1", "-p", String(PORT)],
    {
      cwd: CWD,
      env: { ...process.env, PORT: String(PORT) },
      stdio: ["ignore", "pipe", "pipe"],
    }
  );
  const log = (buf) => appendFileSync(logPath, buf.toString());
  child.stdout.on("data", log);
  child.stderr.on("data", log);
  return { child, logPath, pid: child.pid };
}

async function stopDev(child) {
  if (!child || child.killed) return;
  child.kill("SIGTERM");
  await sleep(1500);
  if (!child.killed) {
    try {
      child.kill("SIGKILL");
    } catch {
      /* */
    }
  }
  await sleep(500);
}

async function probeAdjustments(label, attempt) {
  const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--disable-dev-shm-usage"] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "dark" });
  const page = await ctx.newPage();
  const events = [];
  page.on("console", (m) => {
    if (m.type() === "error" || /500|403|JSON|hydrat/i.test(m.text())) {
      events.push({ kind: "console", type: m.type(), text: m.text(), url: m.location()?.url || "", at: nowIso() });
    }
  });
  page.on("pageerror", (e) => events.push({ kind: "pageerror", text: String(e?.message || e), stack: String(e?.stack || "").slice(0, 2000), at: nowIso() }));
  page.on("response", (res) => {
    if (res.status() >= 400) {
      events.push({
        kind: "response",
        status: res.status(),
        url: res.url(),
        resourceType: res.request().resourceType(),
        method: res.request().method(),
        at: nowIso(),
      });
    }
  });
  page.on("requestfailed", (req) => {
    events.push({
      kind: "requestfailed",
      url: req.url(),
      failureText: req.failure()?.errorText || "unknown",
      resourceType: req.resourceType(),
      at: nowIso(),
    });
  });

  const startedAt = nowIso();
  let navigationStatus = 0;
  let finalUrl = "";
  let navError = null;
  try {
    const res = await page.goto(`${BASE}/staffpay?section=adjustments`, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });
    navigationStatus = res?.status() ?? 0;
    finalUrl = page.url();
    try {
      await page.waitForLoadState("networkidle", { timeout: 15000 });
    } catch {
      /* */
    }
    await page.waitForTimeout(1500);
  } catch (err) {
    navError = String(err);
    finalUrl = page.url();
  }
  const endedAt = nowIso();
  const result = {
    label,
    attempt,
    route: "/staffpay?section=adjustments",
    finalUrl,
    navigationStatus,
    navError,
    startedAt,
    endedAt,
    events,
    http500: events.filter((e) => e.kind === "response" && e.status >= 500),
    http403: events.filter((e) => e.kind === "response" && e.status === 403),
    jsonParse: events.filter((e) => /Unexpected end of JSON input/i.test(e.text || "")),
  };
  await ctx.close();
  await browser.close();
  return result;
}

async function main() {
  const report = {
    port: PORT,
    cwd: CWD,
    startedAt: nowIso(),
    cleanStarts: [],
    warmFirstRequests: [],
  };

  // Three clean-server starts
  for (let i = 1; i <= 3; i++) {
    const { child, logPath, pid } = startDev();
    let healthyStatus = null;
    let error = null;
    let probe = null;
    try {
      healthyStatus = await waitHealthy();
      probe = await probeAdjustments("clean-server-start", i);
    } catch (err) {
      error = String(err);
    }
    await stopDev(child);
    report.cleanStarts.push({
      attempt: i,
      serverPid: pid,
      logPath,
      healthyStatus,
      error,
      probe,
    });
    writeFileSync(join(OUT, "partial.json"), JSON.stringify(report, null, 2));
    await sleep(2000);
  }

  // Warm server: one start, three first requests
  const warm = startDev();
  try {
    const healthyStatus = await waitHealthy();
    report.warmServer = { pid: warm.pid, logPath: warm.logPath, healthyStatus };
    for (let i = 1; i <= 3; i++) {
      const probe = await probeAdjustments("warm-server-first-request", i);
      report.warmFirstRequests.push(probe);
      writeFileSync(join(OUT, "partial.json"), JSON.stringify(report, null, 2));
    }
  } catch (err) {
    report.warmError = String(err);
  } finally {
    await stopDev(warm.child);
  }

  report.endedAt = nowIso();
  const flat = [
    ...report.cleanStarts.map((c) => c.probe).filter(Boolean),
    ...report.warmFirstRequests,
  ];
  report.adjudication = {
    anyHttp500: flat.flatMap((p) => p.http500 || []),
    anyHttp403: flat.flatMap((p) => p.http403 || []),
    anyJsonParse: flat.flatMap((p) => p.jsonParse || []),
    allNavStatuses: flat.map((p) => p.navigationStatus),
  };
  writeFileSync(join(OUT, "clean-warm-server-probes.json"), JSON.stringify(report, null, 2));
  writeFileSync(join(OUT, "summary.json"), JSON.stringify({
    port: PORT,
    cleanStarts: report.cleanStarts.map((c) => ({
      attempt: c.attempt,
      healthyStatus: c.healthyStatus,
      nav: c.probe?.navigationStatus,
      http500: c.probe?.http500?.length || 0,
      http403: c.probe?.http403?.length || 0,
      jsonParse: c.probe?.jsonParse?.length || 0,
      eventCount: c.probe?.events?.length || 0,
      error: c.error || null,
    })),
    warmFirstRequests: report.warmFirstRequests.map((p) => ({
      attempt: p.attempt,
      nav: p.navigationStatus,
      http500: p.http500.length,
      http403: p.http403.length,
      jsonParse: p.jsonParse.length,
      eventCount: p.events.length,
      sampleEvents: p.events.slice(0, 10),
    })),
    adjudication: report.adjudication,
  }, null, 2));
  console.log(JSON.stringify(report.adjudication, null, 2));
  console.log("Wrote", OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
