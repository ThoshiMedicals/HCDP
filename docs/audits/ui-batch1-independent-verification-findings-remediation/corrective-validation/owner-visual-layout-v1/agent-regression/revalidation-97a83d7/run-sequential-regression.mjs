#!/usr/bin/env node
/**
 * Revalidation sequential suite runner for frozen SHA 97a83d7.
 * Evidence-only; does not modify app source.
 */
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  copyFileSync,
} from "node:fs";
import { join } from "node:path";

const WT = process.env.HCDP_WT || "/tmp/hcdp-fix/ui-batch1-reg-3493";
const EV =
  process.env.HCDP_EV ||
  "/tmp/hcdp-fix/ui-batch1-vf-fixes/docs/audits/ui-batch1-independent-verification-findings-remediation/corrective-validation/owner-visual-layout-v1/agent-regression/revalidation-97a83d7";
const LOGS = join(EV, "logs");
mkdirSync(LOGS, { recursive: true });

const FROZEN = "97a83d7beb219ce01a7b12c6f70a975a44614d59";
const EXPECTED_HASH =
  "7c14854a626ff6fa8c042174ef933e59ccb90bff104631011e2f003d29f6ee83";

function utcNow() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

function revParse() {
  const r = spawnSync("git", ["rev-parse", "HEAD"], { cwd: WT, encoding: "utf8" });
  return (r.stdout || "").trim();
}

function parseTapTotals(text) {
  const grab = (label) => {
    const m = text.match(new RegExp(`# ${label}\\s+(\\d+)`, "i"));
    return m ? Number(m[1]) : null;
  };
  return {
    tests: grab("tests"),
    pass: grab("pass"),
    fail: grab("fail"),
    skipped: grab("skipped"),
    todo: grab("todo"),
    cancelled: grab("cancelled"),
  };
}

function parseTscErrors(text) {
  return text.split(/\r?\n/).filter((l) => /error TS\d+/.test(l)).length;
}

function parseLintTotals(text) {
  const m = text.match(/(\d+)\s+errors?,\s+(\d+)\s+warnings?/i);
  if (m) return { errors: Number(m[1]), warnings: Number(m[2]), summaryLine: m[0] };
  // also capture full ✖ line if present
  const m2 = text.match(/✖\s+(\d+)\s+problems?\s+\((\d+)\s+errors?,\s+(\d+)\s+warnings?\)/i);
  if (m2)
    return {
      errors: Number(m2[2]),
      warnings: Number(m2[3]),
      summaryLine: m2[0],
      problems: Number(m2[1]),
    };
  return { errors: null, warnings: null, summaryLine: null };
}

const PERF_FILES = [
  "docs/audits/wave4-m05-performance-evidence.json",
  "docs/audits/wave5-m06-performance-evidence.json",
];

function snapshotPerf() {
  const snaps = {};
  for (const rel of PERF_FILES) {
    const p = join(WT, rel);
    if (existsSync(p)) {
      const bak = join(EV, `perf-snapshot-${rel.replace(/\//g, "__")}`);
      copyFileSync(p, bak);
      snaps[rel] = bak;
    } else {
      snaps[rel] = null;
    }
  }
  writeFileSync(join(EV, "perf-snapshots.json"), JSON.stringify(snaps, null, 2));
  return snaps;
}

function restorePerf(snaps) {
  for (const [rel, bak] of Object.entries(snaps || {})) {
    if (!bak) continue;
    copyFileSync(bak, join(WT, rel));
  }
  spawnSync(
    "git",
    [
      "checkout",
      "--",
      "docs/audits/wave4-m05-performance-evidence.json",
      "docs/audits/wave5-m06-performance-evidence.json",
      "docs/audits/wave5-m06-workflow-evidence.json",
      "docs/audits/ui-batch1-independent-verification-findings-remediation/hash-vector-result.json",
    ],
    { cwd: WT, encoding: "utf8" }
  );
}

const suites = [
  {
    id: "01",
    name: "colour+iv-findings-unit",
    cmd: [
      "npx",
      "tsx",
      "--test",
      "src/components/workspaces/tests/ui-batch1-owner-colour-readability.test.ts",
      "src/components/workspaces/tests/ui-batch1-iv-findings-remediation.test.ts",
    ],
  },
  {
    id: "02",
    name: "owner-visual-unit",
    cmd: [
      "npx",
      "tsx",
      "--test",
      "src/components/workspaces/tests/ui-batch1-owner-visual-remediation.test.ts",
    ],
  },
  {
    id: "03",
    name: "qualification-chrome",
    cmd: [
      "npx",
      "tsx",
      "--test",
      "src/components/workspaces/tests/ui-batch1-qualification-chrome.test.ts",
    ],
  },
  {
    id: "04",
    name: "m07-presentation",
    cmd: [
      "npx",
      "tsx",
      "--test",
      "src/modules/m07-staff-pay/tests/m07-ui-batch1-presentation.test.ts",
    ],
  },
  {
    id: "05",
    name: "m07-shell",
    cmd: ["npx", "tsx", "--test", "src/modules/m07-staff-pay/tests/m07-shell.test.ts"],
  },
  {
    id: "06",
    name: "m06-od-a2",
    cmd: [
      "npx",
      "tsx",
      "--test",
      "src/modules/m06-time-attendance/tests/m06-od-a2-outbox-narrowing.test.ts",
    ],
  },
  {
    id: "07",
    name: "browser-crypto",
    cmd: [
      "npx",
      "tsx",
      "--test",
      "src/platform/workforce/tests/browser-crypto-remediation.test.ts",
    ],
  },
  {
    id: "08",
    name: "m06-published",
    cmd: [
      "npx",
      "tsx",
      "--test",
      "src/modules/m06-time-attendance/tests/m06-published-timesheet.test.ts",
    ],
  },
  {
    id: "09",
    name: "published-timesheet-registry",
    cmd: [
      "npx",
      "tsx",
      "--test",
      "src/platform/workforce/tests/published-timesheet-registry.test.ts",
    ],
  },
  {
    id: "10",
    name: "m07-ppa1-ui",
    cmd: ["npx", "tsx", "--test", "src/modules/m07-staff-pay/tests/m07-ppa1-ui.test.tsx"],
  },
  {
    id: "11",
    name: "m07-ppa1-integration",
    cmd: [
      "npx",
      "tsx",
      "--test",
      "src/modules/m07-staff-pay/tests/m07-ppa1-integration.test.tsx",
    ],
  },
  {
    id: "12",
    name: "m07-ppa1-hook-security",
    cmd: [
      "npx",
      "tsx",
      "--test",
      "src/modules/m07-staff-pay/tests/m07-ppa1-hook-security.test.ts",
    ],
  },
  {
    id: "13",
    name: "m07-ppa1-core",
    cmd: ["npx", "tsx", "--test", "src/modules/m07-staff-pay/tests/m07-ppa1-core.test.ts"],
  },
  {
    id: "14",
    name: "m07-ppa1-atomicity",
    cmd: [
      "npx",
      "tsx",
      "--test",
      "src/modules/m07-staff-pay/tests/m07-ppa1-atomicity.test.ts",
    ],
  },
  { id: "15", name: "test-m04", cmd: ["npm", "run", "test:m04"] },
  { id: "16", name: "test-m05", cmd: ["npm", "run", "test:m05"], restorePerfAfter: true },
  { id: "17", name: "test-m06", cmd: ["npm", "run", "test:m06"], restorePerfAfter: true },
  { id: "18", name: "test-m07", cmd: ["npm", "run", "test:m07"] },
  { id: "19", name: "test-workforce", cmd: ["npm", "run", "test:workforce"] },
  {
    id: "20",
    name: "m07-architecture-boundary",
    cmd: [
      "npx",
      "tsx",
      "--test",
      "src/modules/m07-staff-pay/tests/m07-architecture-cp27.test.ts",
      "src/modules/m07-staff-pay/tests/m07-boundary-cp23.test.ts",
      "src/modules/m07-staff-pay/tests/m07-batch2-final-gate-cp27.test.ts",
    ],
  },
  {
    id: "21",
    name: "m07-authz",
    cmd: ["npx", "tsx", "--test", "src/modules/m07-staff-pay/tests/m07-authz.test.ts"],
  },
  {
    id: "22",
    name: "m07-batch5",
    cmd: [
      "npx",
      "tsx",
      "--test",
      "src/modules/m07-staff-pay/tests/m07-batch5-cp51-56.test.ts",
      "src/modules/m07-staff-pay/tests/m07-batch5-material-revision.test.ts",
      "src/modules/m07-staff-pay/tests/m07-batch5-remediation.test.ts",
    ],
  },
  {
    id: "23",
    name: "m07-batch6",
    cmd: [
      "npx",
      "tsx",
      "--test",
      "src/modules/m07-staff-pay/tests/m07-batch6-cp61-66.test.ts",
      "src/modules/m07-staff-pay/tests/m07-batch6-remediation.test.ts",
      "src/modules/m07-staff-pay/tests/m07-batch6-second-remediation.test.ts",
      "src/modules/m07-staff-pay/tests/m07-batch6-third-remediation.test.ts",
      "src/modules/m07-staff-pay/tests/m07-batch6-fourth-remediation.test.ts",
    ],
  },
  { id: "24", name: "tsc", cmd: ["npx", "tsc", "--noEmit"], kind: "tsc" },
  { id: "25", name: "lint", cmd: ["npm", "run", "lint"], kind: "lint" },
  {
    id: "26",
    name: "next-build-webpack",
    cmd: ["npx", "next", "build", "--webpack"],
    kind: "build",
  },
  { id: "27", name: "npm-build", cmd: ["npm", "run", "build"], kind: "build" },
  {
    id: "28",
    name: "hash-gate",
    // Use tsx loader — literal node fails on .ts import without modifying repo script
    cmd: ["node", "--import", "tsx", "scripts/ui-batch1-iv-findings-remediation-hash-gate.mjs"],
    kind: "hash",
    alsoLiteral: true,
  },
];

const rows = [];
const inputSha = revParse();
const snaps = snapshotPerf();
writeFileSync(
  join(EV, "run-meta.json"),
  JSON.stringify(
    {
      startedUtc: utcNow(),
      worktree: WT,
      inputSha,
      frozenExpected: FROZEN,
      shaMatch: inputSha === FROZEN,
      evidenceRoot: EV,
    },
    null,
    2
  )
);

function writePartial() {
  writeFileSync(
    join(EV, "REGRESSION_SUMMARY.partial.json"),
    JSON.stringify({ updatedUtc: utcNow(), inputSha, rows }, null, 2)
  );
}

for (const suite of suites) {
  const logPath = join(LOGS, `${suite.id}-${suite.name}.log`);
  const startUtc = utcNow();
  console.log(`[${startUtc}] START ${suite.id} ${suite.name}`);

  // For hash: also record literal node failure for provenance
  if (suite.kind === "hash" && suite.alsoLiteral) {
    const lit = spawnSync(
      "node",
      ["scripts/ui-batch1-iv-findings-remediation-hash-gate.mjs"],
      {
        cwd: WT,
        encoding: "utf8",
        env: { ...process.env, FORCE_COLOR: "0", CI: "1" },
        maxBuffer: 16 * 1024 * 1024,
      }
    );
    writeFileSync(
      join(LOGS, "28-hash-gate-literal-node.log"),
      `${lit.stdout || ""}${lit.stderr || ""}`
    );
  }

  const r = spawnSync(suite.cmd[0], suite.cmd.slice(1), {
    cwd: WT,
    encoding: "utf8",
    env: { ...process.env, FORCE_COLOR: "0", CI: "1" },
    maxBuffer: 64 * 1024 * 1024,
  });
  const finishUtc = utcNow();
  const out = `${r.stdout || ""}${r.stderr || ""}`;
  writeFileSync(logPath, out);
  const exitCode = r.status === null ? 124 : r.status;
  const totals = parseTapTotals(out);
  let verdict = exitCode === 0 ? "PASS" : "FAIL";
  let notes = null;
  let extras = {};

  if (suite.kind === "tsc") {
    const errCount = parseTscErrors(out);
    extras = { tscErrorCount: errCount, expected: 21 };
    if (errCount === 21) {
      verdict = "PASS";
      notes = "Accepted TypeScript debt: exactly 21 errors.";
    } else {
      verdict = "FAIL";
      notes = `TypeScript error count ${errCount} != accepted baseline 21.`;
    }
  } else if (suite.kind === "lint") {
    const lint = parseLintTotals(out);
    extras = {
      ...lint,
      expectedErrors: 2,
      expectedWarnings: 24,
      expectedSummary: "✖ 26 problems (2 errors, 24 warnings)",
    };
    const exact =
      lint.errors === 2 &&
      lint.warnings === 24 &&
      /✖\s*26\s+problems\s+\(2\s+errors,\s+24\s+warnings\)/i.test(out);
    if (exact) {
      verdict = "PASS";
      notes = "Accepted lint debt exact: ✖ 26 problems (2 errors, 24 warnings).";
    } else {
      verdict = "FAIL";
      notes = `Lint totals ${lint.errors}/${lint.warnings} (summary=${lint.summaryLine}) != accepted 2/24 (✖ 26).`;
    }
  } else if (suite.kind === "hash") {
    let hashJson = null;
    try {
      const wtHashPath = join(
        WT,
        "docs/audits/ui-batch1-independent-verification-findings-remediation/hash-vector-result.json"
      );
      if (existsSync(wtHashPath)) {
        hashJson = JSON.parse(readFileSync(wtHashPath, "utf8"));
      }
    } catch {
      hashJson = null;
    }
    if (!hashJson) {
      try {
        hashJson = JSON.parse(out.trim().split(/\n/).filter(Boolean).pop() || "{}");
      } catch {
        const m = out.match(/\{[\s\S]*\}/);
        if (m) {
          try {
            hashJson = JSON.parse(m[0]);
          } catch {
            hashJson = null;
          }
        }
      }
    }
    const exact =
      hashJson?.exact === true &&
      hashJson?.calc === EXPECTED_HASH &&
      hashJson?.pure === EXPECTED_HASH &&
      hashJson?.node === EXPECTED_HASH &&
      exitCode === 0;
    const result = {
      exitCode,
      command: suite.cmd.join(" "),
      literalNodeCommand: "node scripts/ui-batch1-iv-findings-remediation-hash-gate.mjs",
      literalNodeLog: "logs/28-hash-gate-literal-node.log",
      expectedHash: EXPECTED_HASH,
      parsed: hashJson,
      exact: Boolean(exact),
      recordedUtc: finishUtc,
      ...(hashJson || {}),
    };
    writeFileSync(join(EV, "hash-vector-result.json"), JSON.stringify(result, null, 2));
    writeFileSync(join(EV, "hash-vector-stdout.log"), out);
    verdict = result.exact ? "PASS" : "FAIL";
    notes = result.exact
      ? `Hash vector exact match ${EXPECTED_HASH}`
      : "Hash gate failed exact match against accepted vector.";
    extras = { hashJson, expectedHash: EXPECTED_HASH, result };
  }

  if (suite.restorePerfAfter) {
    restorePerf(snaps);
    notes = (notes ? notes + " " : "") + "Performance JSON restored after suite.";
  }

  const row = {
    id: suite.id,
    name: suite.name,
    command: suite.cmd.join(" "),
    startUtc,
    finishUtc,
    inputSha,
    exitCode,
    verdict,
    totals,
    logPath: `logs/${suite.id}-${suite.name}.log`,
    notes,
    ...extras,
  };
  rows.push(row);
  writePartial();
  console.log(
    `[${finishUtc}] END ${suite.id} exit=${exitCode} verdict=${verdict} pass=${totals.pass} fail=${totals.fail}`
  );
}

restorePerf(snaps);

const finishedUtc = utcNow();
const summary = {
  frozenSha: FROZEN,
  inputSha,
  shaMatch: inputSha === FROZEN,
  worktree: WT,
  evidenceRoot: EV,
  startedUtc: JSON.parse(readFileSync(join(EV, "run-meta.json"), "utf8")).startedUtc,
  finishedUtc,
  rows,
  counts: {
    pass: rows.filter((r) => r.verdict === "PASS").length,
    fail: rows.filter((r) => r.verdict === "FAIL").length,
    blocked: rows.filter((r) => r.verdict === "BLOCKED").length,
    notRun: rows.filter((r) => r.verdict === "NOT RUN").length,
    outOfScope: rows.filter((r) => r.verdict === "OUT OF SCOPE").length,
  },
};
writeFileSync(join(EV, "REGRESSION_SUMMARY.json"), JSON.stringify(summary, null, 2));
console.log("WROTE REGRESSION_SUMMARY.json");
console.log(JSON.stringify(summary.counts, null, 2));
process.exit(summary.counts.fail > 0 ? 1 : 0);
