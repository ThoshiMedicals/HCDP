/**
 * Fixed platform integration QA harness.
 */
import fs from "fs";
import path from "path";
import http from "http";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const REPO = path.resolve(ROOT, "..");
const BASE = process.env.QA_BASE || "http://localhost:3000";
const OUT_JSON = path.join(REPO, "docs", "audits", "platform-integration-evidence.json");
const OUT_MD = path.join(REPO, "docs", "audits", "PLATFORM_INTEGRATION_QA.md");

const LEGACY_REDIRECTS = [
  ["approvals", "/action-inbox", { category: "Approval" }],
  ["staff", "/staff-doctors", { section: "people" }],
  ["doctors", "/staff-doctors", { section: "doctor-profiles" }],
  ["hr-docs", "/staff-doctors", { section: "credentials" }],
  // Wave 5 M06: canonical section ids are clock (legacy attendance/offline-reconciliation aliases retired)
  ["timeclock", "/time-attendance", { section: "clock" }],
  ["sync-centre", "/time-attendance", { section: "clock" }],
  ["tasks", "/tasks-actions", { section: "tasks" }],
  ["checklists", "/tasks-actions", { section: "checklists" }],
  ["frontdesk", "/tasks-actions", { section: "opening-closing" }],
  ["meetings", "/tasks-actions", { section: "meetings" }],
  ["compliance-centre", "/compliance-quality", { section: "compliance-centre" }],
  ["accreditation", "/compliance-quality", { section: "accreditation" }],
  ["qi", "/compliance-quality", { section: "quality-improvement" }],
  ["audit", "/compliance-quality", { section: "audit-log" }],
  ["expiry", "/compliance-quality", { section: "expiry-centre" }],
  ["documents", "/documents-policies", { section: "documents" }],
  ["policies", "/documents-policies", { section: "policies" }],
  ["inventory", "/inventory-assets", { section: "inventory" }],
  ["stock", "/inventory-assets", { section: "stock" }],
  ["equipment", "/inventory-assets", { section: "equipment" }],
  ["rooms", "/inventory-assets", { section: "rooms" }],
  ["incidents", "/incidents-risk", { section: "incidents" }],
  ["risk-centre", "/incidents-risk", { section: "risk-centre" }],
  ["emergency-centre", "/incidents-risk", { section: "emergency-control" }],
  ["email", "/communications", { section: "email" }],
  ["sms", "/communications", { section: "sms" }],
  ["memos", "/communications", { section: "memos-news" }],
  ["commbook", "/communications", { section: "communication-book" }],
  ["noticeboards", "/communications", { section: "noticeboards" }],
  ["website", "/digital-ops", { section: "website-monitoring" }],
  ["remote", "/digital-ops", { section: "remote-access" }],
  ["vault", "/digital-ops", { section: "password-vault" }],
  ["cameras", "/digital-ops", { section: "security-cameras" }],
];

const MAIN_PAGES = [
  "/dashboard",
  "/action-inbox",
  "/settings",
  "/staff-doctors",
  "/roster",
  "/time-attendance",
  "/staffpay",
  "/doctorpay",
  "/bbpip",
  "/tasks-actions",
  "/training",
  "/compliance-quality",
  "/documents-policies",
  "/ticket-desk",
  "/inventory-assets",
  "/incidents-risk",
  "/communications",
  "/digital-ops",
  "/analytics",
  "/saas",
  "/vendor-console",
  "/recruitment",
  "/website-studio",
  "/financial-forecast",
  "/prototype-reference",
];

const COMPLETE = new Set(["/dashboard", "/action-inbox", "/settings"]);

function request(urlPath, { method = "GET", timeoutMs = 20000 } = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE);
    const req = http.request(url, { method, timeout: timeoutMs, headers: { Accept: "text/html" } }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () =>
        resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString("utf8") })
      );
    });
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("timeout"));
    });
    req.on("error", reject);
    req.end();
  });
}

async function waitForServer() {
  for (let i = 0; i < 30; i++) {
    try {
      const r = await request("/dashboard", { timeoutMs: 4000 });
      if (r.status < 500) return true;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

const pass = (id, name, expected, actual, extra = {}) => ({
  id,
  name,
  expected,
  actual,
  result: "pass",
  defect: null,
  repair: null,
  retest: null,
  limitation: null,
  ...extra,
});
const fail = (id, name, expected, actual, defect, extra = {}) => ({
  id,
  name,
  expected,
  actual,
  result: "fail",
  defect,
  repair: null,
  retest: null,
  limitation: null,
  ...extra,
});

async function main() {
  if (!(await waitForServer())) {
    console.error("server down");
    process.exit(2);
  }

  let commit = "unknown";
  try {
    commit = execSync("git rev-parse --short HEAD", { cwd: ROOT }).toString().trim();
  } catch {
    try {
      commit = execSync("git rev-parse --short HEAD", { cwd: REPO }).toString().trim();
    } catch {
      /* ignore */
    }
  }

  const results = [];

  // Legacy redirects
  for (const [from, to, params] of LEGACY_REDIRECTS) {
    try {
      const res = await request(`/${from}`);
      const loc = res.headers.location || "";
      const okStatus = [301, 302, 303, 307, 308].includes(res.status);
      const url = loc ? new URL(loc, BASE) : null;
      const pathOk = url?.pathname === to;
      let paramsOk = true;
      for (const [k, v] of Object.entries(params)) {
        if (url?.searchParams.get(k) !== v) paramsOk = false;
      }
      if (okStatus && pathOk && paramsOk) {
        results.push(pass(`legacy.${from}`, `Legacy /${from}`, `${to} ${JSON.stringify(params)}`, `${res.status} → ${loc}`));
      } else {
        results.push(
          fail(
            `legacy.${from}`,
            `Legacy /${from}`,
            `${to} ${JSON.stringify(params)}`,
            `${res.status} → ${loc}`,
            "Redirect mismatch"
          )
        );
      }
    } catch (e) {
      results.push(fail(`legacy.${from}`, `Legacy /${from}`, "3xx", e.message, "Request failed"));
    }
  }

  // Main pages
  for (const p of MAIN_PAGES) {
    try {
      const res = await request(p);
      const html = res.body;
      const notFound = res.status === 404 || /<title>404|This page could not be found<\/h1>/i.test(html);
      const htmlToggle = /Exact HTML \(complete\)|View source:\s*<\/span>|Full HTML codebase/i.test(html);
      const rebuild = /Rebuild pending/i.test(html);
      const moduleNum = /Module\s+\d+/i.test(html);
      const protoLabel = /Development \/ QA Reference/i.test(html);

      if (notFound) {
        results.push(fail(`page${p.replace(/\W/g, "_")}`, `Load ${p}`, "200", `status ${res.status}`, "404/not found"));
        continue;
      }
      if (res.status !== 200) {
        results.push(fail(`page${p.replace(/\W/g, "_")}`, `Load ${p}`, "200", `status ${res.status}`, "Non-200"));
        continue;
      }
      if (p !== "/prototype-reference" && htmlToggle) {
        results.push(fail(`page${p.replace(/\W/g, "_")}`, `Load ${p}`, "No HTML mode toggle", "toggle present", "User-facing HTML mode"));
        continue;
      }
      if (!COMPLETE.has(p) && p !== "/prototype-reference" && !(rebuild || moduleNum)) {
        // Partial modules may still show landing markers client-side; SSR should include landing for unfinished
        results.push(
          fail(
            `page${p.replace(/\W/g, "_")}`,
            `Landing markers ${p}`,
            "Rebuild pending / Module N",
            "markers absent in HTML",
            "Landing markers missing in SSR",
            { limitation: "Client-rendered markers may still appear after hydrate" }
          )
        );
        continue;
      }
      if (p === "/prototype-reference" && !protoLabel) {
        results.push(fail("proto.label", "Prototype labelled", "Development / QA Reference", "missing", "Missing label"));
        continue;
      }
      results.push(pass(`page${p.replace(/\W/g, "_")}`, `Load ${p}`, "200 OK", `200; rebuild=${rebuild}; toggle=${htmlToggle}`));
    } catch (e) {
      results.push(fail(`page${p.replace(/\W/g, "_")}`, `Load ${p}`, "200", e.message, "Request failed"));
    }
  }

  // Prototype file
  const proto = path.join(ROOT, "public", "pulse-html-prototype.html");
  results.push(
    fs.existsSync(proto)
      ? pass("proto.file", "Prototype file retained", "exists", "exists")
      : fail("proto.file", "Prototype file retained", "exists", "missing", "Deleted")
  );

  // Query preserve
  try {
    const res = await request("/hr-docs?recordId=abc123&clinicId=loc_woolloongabba");
    const loc = res.headers.location || "";
    const url = new URL(loc, BASE);
    const ok =
      url.pathname === "/staff-doctors" &&
      url.searchParams.get("section") === "credentials" &&
      url.searchParams.get("recordId") === "abc123" &&
      url.searchParams.get("clinicId") === "loc_woolloongabba";
    results.push(
      ok
        ? pass("legacy.queryPreserve", "Preserve query params on legacy redirect", "section+recordId+clinicId", loc)
        : fail("legacy.queryPreserve", "Preserve query params on legacy redirect", "retained", loc, "Query loss")
    );
  } catch (e) {
    results.push(fail("legacy.queryPreserve", "Preserve query params", "retained", e.message, "Request failed"));
  }

  let interactive = { tests: [], build: "see final report" };
  const notesPath = path.join(REPO, "docs", "audits", "platform-integration-browser-notes.json");
  if (fs.existsSync(notesPath)) {
    interactive = JSON.parse(fs.readFileSync(notesPath, "utf8"));
  } else {
    results.push(
      fail("interactive.notes", "Browser interactive notes file", "present", "missing", "Run platform-integration-browser-qa.mjs first")
    );
  }
  for (const t of interactive.tests || []) results.push(t);

  const summary = {
    total: results.length,
    pass: results.filter((r) => r.result === "pass").length,
    fail: results.filter((r) => r.result === "fail").length,
    blocked: results.filter((r) => r.result === "blocked").length,
  };

  const evidence = {
    testedAt: new Date().toISOString(),
    method: "Node HTTP harness + Cursor browser MCP (interactive)",
    url: "http://localhost:3000",
    commit,
    build: interactive.build || "see final report",
    summary,
    tests: results,
  };

  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(evidence, null, 2));
  fs.mkdirSync(path.join(ROOT, "docs", "audits"), { recursive: true });
  fs.writeFileSync(path.join(ROOT, "docs", "audits", "platform-integration-evidence.json"), JSON.stringify(evidence, null, 2));

  const lines = [
    "# Platform Integration QA Report",
    "",
    `- **Test date and time:** ${evidence.testedAt}`,
    `- **Browser / testing method:** ${evidence.method}`,
    `- **Application URL:** ${evidence.url}`,
    `- **Commit:** ${evidence.commit}`,
    `- **Build:** ${evidence.build}`,
    "",
    "## Summary",
    "",
    `| Total | Pass | Fail | Blocked |`,
    `|---:|---:|---:|---:|`,
    `| ${summary.total} | ${summary.pass} | ${summary.fail} | ${summary.blocked} |`,
    "",
    "## Tests",
    "",
  ];
  for (const t of results) {
    lines.push(`### ${t.id} — ${t.name}`);
    lines.push("");
    lines.push(`- **Expected:** ${t.expected}`);
    lines.push(`- **Actual:** ${typeof t.actual === "string" ? t.actual : JSON.stringify(t.actual)}`);
    lines.push(`- **Result:** ${t.result}`);
    lines.push(`- **Defect:** ${t.defect ?? "—"}`);
    lines.push(`- **File changed to repair:** ${t.repair ?? "—"}`);
    lines.push(`- **Retest:** ${t.retest ?? "—"}`);
    lines.push(`- **Remaining limitation:** ${t.limitation ?? "—"}`);
    lines.push("");
  }
  lines.push("## Remaining limitations");
  lines.push("");
  lines.push("- Modules 4–24 remain Rebuild Pending by design (landing/partial only).");
  lines.push("- Modules 1–3 UI remain in `components/workspaces` pending gradual migration.");
  lines.push("- Some accessibility checks rely on visual browser inspection rather than axe-core automation.");
  lines.push("");

  const md = lines.join("\n");
  fs.writeFileSync(OUT_MD, md);
  fs.writeFileSync(path.join(ROOT, "docs", "audits", "PLATFORM_INTEGRATION_QA.md"), md);
  console.log(JSON.stringify(summary));
  process.exit(summary.fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
