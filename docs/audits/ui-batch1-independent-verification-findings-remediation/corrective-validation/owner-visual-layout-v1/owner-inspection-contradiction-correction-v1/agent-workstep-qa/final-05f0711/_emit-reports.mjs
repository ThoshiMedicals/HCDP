/**
 * Emit Work-Step QA markdown/json artefacts from _raw-results.json.
 * Evidence-only; does not touch src/ or scripts/.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const raw = JSON.parse(fs.readFileSync(path.join(ROOT, "_raw-results.json"), "utf8"));
const APP_SHA = raw.meta.appSourceSha;
const BASE = raw.meta.base;
const findings = raw.findings || [];
const openFindings = findings.filter((f) => f.status === "OPEN");

const totals = raw.totals;
const overall =
  totals.fail > 0 || totals.blocked > 0 || openFindings.length > 0 ? "FAIL" : "PASS";

// per-workflow detail files
const wfDir = path.join(ROOT, "workflows");
fs.mkdirSync(wfDir, { recursive: true });
for (const w of raw.workflows) {
  const lines = [
    `# ${w.workflowId}`,
    "",
    `- Outcome: **${w.outcome}**`,
    `- Route: \`${w.route}\``,
    `- Steps: ${w.steps.length}`,
    "",
    "| # | Action | Result |",
    "| --- | --- | --- |",
    ...w.steps.map((s) => `| ${s.n} | ${s.action} | ${s.result} |`),
    "",
    "See WORKSTEP_RESULTS.md for expected/observed detail.",
    "",
  ];
  fs.writeFileSync(path.join(wfDir, `${w.workflowId}.md`), lines.join("\n"));
}

// WORKSTEP_RESULTS.md
const resLines = [
  "# Work-Step QA — Results",
  "",
  "| Field | Value |",
  "| --- | --- |",
  "| Agent | Work-Step / Functional QA (READ-ONLY) |",
  `| Frozen app SHA | \`${APP_SHA}\` |`,
  `| Worktree | \`${raw.meta.worktree}\` |`,
  `| Server | \`${BASE}\` |`,
  `| Started | ${raw.meta.startedAt} |`,
  `| Finished | ${raw.meta.finishedAt} |`,
  `| Preflight empty src/scripts diff | ${raw.meta.preflight?.emptyDiff} |`,
  `| Overall verdict | **${overall}** |`,
  "",
  "## Totals",
  "",
  `- Workflows: **${totals.total}** (PASS ${totals.pass} / FAIL ${totals.fail} / OUT_OF_SCOPE ${totals.outOfScope} / BLOCKED ${totals.blocked})`,
  `- Steps: PASS ${totals.stepPass} / FAIL ${totals.stepFail} / OUT_OF_SCOPE ${totals.stepOos}`,
  `- Open WQA findings: **${openFindings.length}**`,
  "",
  "## Workflow outcomes",
  "",
  "| Workflow | Outcome | Steps |",
  "| --- | --- | ---: |",
  ...raw.workflows.map((w) => `| ${w.workflowId} | ${w.outcome} | ${w.steps.length} |`),
  "",
];

for (const w of raw.workflows) {
  resLines.push(`## ${w.workflowId}`, "");
  resLines.push(`- Route: \`${w.route}\``);
  resLines.push(`- Starting state: ${w.startingState}`);
  resLines.push(`- Outcome: **${w.outcome}**`);
  if (w.screenshots?.length) {
    resLines.push(`- Screenshots: ${w.screenshots.join(", ")}`);
  }
  resLines.push("");
  resLines.push("| # | Action | Expected | Observed | Result |");
  resLines.push("| --- | --- | --- | --- | --- |");
  for (const s of w.steps) {
    const obs = String(s.observed ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
    const exp = String(s.expected ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
    resLines.push(`| ${s.n} | ${s.action} | ${exp} | ${obs} | ${s.result} |`);
  }
  resLines.push("");
}
fs.writeFileSync(path.join(ROOT, "WORKSTEP_RESULTS.md"), resLines.join("\n"));

// WORKSTEP_SUMMARY.json
const summary = {
  agent: "Work-Step / Functional QA",
  phase: "owner-inspection-contradiction-correction-v1",
  frozenApplicationSourceSha: APP_SHA,
  worktree: raw.meta.worktree,
  portUsed: BASE,
  recordedAt: raw.meta.finishedAt,
  preflight: raw.meta.preflight,
  totals: {
    workflows: totals.total,
    pass: totals.pass,
    fail: totals.fail,
    blocked: totals.blocked,
    outOfScope: totals.outOfScope,
    stepsPass: totals.stepPass,
    stepsFail: totals.stepFail,
    stepsOutOfScope: totals.stepOos,
    openFindings: openFindings.length,
  },
  overallVerdict: overall,
  workflows: raw.workflows.map((w) => ({
    workflowId: w.workflowId,
    outcome: w.outcome,
    stepCount: w.steps.length,
    failSteps: w.steps.filter((s) => s.result === "FAIL").map((s) => `${s.n}:${s.action}`),
  })),
  openFindings: openFindings,
  wqaFindingIdsOpen: openFindings.map((f) => f.id),
  applicationSourceOrTestsEdited: false,
  claims: {
    independentVerification: false,
    mergeReadiness: false,
    productionApproval: false,
  },
  evidence: {
    inventory: "WORKFLOW_INVENTORY.md",
    results: "WORKSTEP_RESULTS.md",
    summary: "WORKSTEP_SUMMARY.json",
    raw: "_raw-results.json",
    openFindings: "findings/OPEN_FINDINGS.md",
  },
};
fs.writeFileSync(path.join(ROOT, "WORKSTEP_SUMMARY.json"), JSON.stringify(summary, null, 2) + "\n");

// OPEN_FINDINGS.md
const findLines = [
  "# Open WQA findings — contradiction correction v1 Work-Step QA (final-05f0711)",
  "",
  `| Frozen app SHA | \`${APP_SHA}\` |`,
  `| Server | \`${BASE}\` |`,
  `| Recorded | ${raw.meta.finishedAt} |`,
  "",
  "## Open findings",
  "",
];
if (!openFindings.length) {
  findLines.push("**None.**", "");
} else {
  findLines.push("| ID | Workflow | Severity | Title | Detail |");
  findLines.push("| --- | --- | --- | --- | --- |");
  for (const f of openFindings) {
    findLines.push(
      `| ${f.id} | ${f.workflowId} | ${f.severity} | ${f.title} | ${String(f.detail || "").replace(/\|/g, "\\|").slice(0, 200)} |`
    );
  }
  findLines.push("");
}
findLines.push(`Overall work-step verdict: **${overall}**`, "");
fs.mkdirSync(path.join(ROOT, "findings"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "findings/OPEN_FINDINGS.md"), findLines.join("\n"));

console.log("EMITTED reports; overall=", overall);
console.log(JSON.stringify(summary.totals));
console.log("open=", summary.wqaFindingIdsOpen.join(",") || "(none)");
