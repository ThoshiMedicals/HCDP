import { spawnSync } from "node:child_process";
import { writeFileSync, mkdirSync, appendFileSync } from "node:fs";
import { join } from "node:path";

const ev = "docs/audits/ui-batch1-controlled-integration-independent-verification";
mkdirSync(ev, { recursive: true });

function parseTotals(out) {
  // node:test summary: "# tests 8\n# pass 8\n# fail 0\n# skipped 0\n# todo 0"
  const num = (label) => {
    const m = out.match(new RegExp(`# ${label}\\s+(\\d+)`, "i"));
    return m ? Number(m[1]) : null;
  };
  // also tests N (pass N fail ...)
  let tests = num("tests");
  let pass = num("pass");
  let fail = num("fail");
  let skipped = num("skipped");
  if (tests == null) {
    const m = out.match(/tests\s+(\d+).*?pass\s+(\d+).*?fail\s+(\d+)/is);
    if (m) {
      tests = Number(m[1]);
      pass = Number(m[2]);
      fail = Number(m[3]);
    }
  }
  // TS errors
  const tsErrors = (out.match(/error TS\d+/g) || []).length;
  // ESLint
  const lintErr = out.match(/(\d+)\s+error/);
  const lintWarn = out.match(/(\d+)\s+warning/);
  return {
    tests,
    pass,
    fail,
    skipped,
    tsErrors,
    lintErrors: lintErr ? Number(lintErr[1]) : null,
    lintWarnings: lintWarn ? Number(lintWarn[1]) : null,
  };
}

function run(name, cmd, args, logFile) {
  const started = Date.now();
  console.log(`\n=== START ${name} ===`);
  console.log([cmd, ...args].join(" "));
  const r = spawnSync(cmd, args, {
    encoding: "utf8",
    shell: true,
    env: process.env,
    maxBuffer: 64 * 1024 * 1024,
  });
  const out = `${r.stdout || ""}\n${r.stderr || ""}`;
  writeFileSync(join(ev, logFile), out, "utf8");
  const totals = parseTotals(out);
  const row = {
    name,
    cmd: [cmd, ...args].join(" "),
    exit: r.status,
    ms: Date.now() - started,
    ...totals,
  };
  console.log(JSON.stringify(row));
  appendFileSync(join(ev, "suite-results.ndjson"), JSON.stringify(row) + "\n");
  return row;
}

const phase = process.argv[2] || "1";

const suites = {
  "1": [
    ["01-od-a2", "npx", ["tsx", "--test", "src/modules/m06-time-attendance/tests/m06-od-a2-outbox-narrowing.test.ts"], "01-od-a2.log"],
    ["02-ui-chrome", "npx", ["tsx", "--test", "src/components/workspaces/tests/ui-batch1-qualification-chrome.test.ts"], "02-ui-chrome.log"],
    ["03-m07-presentation", "npx", ["tsx", "--test", "src/modules/m07-staff-pay/tests/m07-ui-batch1-presentation.test.ts"], "03-m07-presentation.log"],
    ["04-m07-shell", "npx", ["tsx", "--test", "src/modules/m07-staff-pay/tests/m07-shell.test.ts"], "04-m07-shell.log"],
    ["05-browser-crypto", "npx", ["tsx", "--test", "src/platform/workforce/tests/browser-crypto-remediation.test.ts"], "05-browser-crypto.log"],
    ["06-m06-published", "npx", ["tsx", "--test", "src/modules/m06-time-attendance/tests/m06-published-timesheet.test.ts"], "06-m06-published.log"],
    ["07-registry", "npx", ["tsx", "--test", "src/platform/workforce/tests/published-timesheet-registry.test.ts"], "07-registry.log"],
  ],
  "2": [
    ["08-ppa1-ui", "npx", ["tsx", "--test", "src/modules/m07-staff-pay/tests/m07-ppa1-ui.test.tsx"], "08-ppa1-ui.log"],
    ["08-ppa1-integration", "npx", ["tsx", "--test", "src/modules/m07-staff-pay/tests/m07-ppa1-integration.test.tsx"], "08-ppa1-integration.log"],
    [
      "08-ppa1-security-core-atomicity",
      "npx",
      [
        "tsx",
        "--test",
        "src/modules/m07-staff-pay/tests/m07-ppa1-hook-security.test.ts",
        "src/modules/m07-staff-pay/tests/m07-ppa1-core.test.ts",
        "src/modules/m07-staff-pay/tests/m07-ppa1-atomicity.test.ts",
      ],
      "08-ppa1-security-core-atomicity.log",
    ],
    [
      "09-architecture-boundary",
      "npx",
      [
        "tsx",
        "--test",
        "src/modules/m07-staff-pay/tests/m07-architecture-cp27.test.ts",
        "src/modules/m07-staff-pay/tests/m07-boundary-cp23.test.ts",
      ],
      "09-architecture-boundary.log",
    ],
    ["09-authz", "npx", ["tsx", "--test", "src/modules/m07-staff-pay/tests/m07-authz.test.ts"], "09-authz.log"],
    [
      "10-batch5",
      "npx",
      [
        "tsx",
        "--test",
        "src/modules/m07-staff-pay/tests/m07-batch5-cp51-56.test.ts",
        "src/modules/m07-staff-pay/tests/m07-batch5-material-revision.test.ts",
        "src/modules/m07-staff-pay/tests/m07-batch5-remediation.test.ts",
      ],
      "10-batch5.log",
    ],
    [
      "11-batch6",
      "npx",
      [
        "tsx",
        "--test",
        "src/modules/m07-staff-pay/tests/m07-batch6-cp61-66.test.ts",
        "src/modules/m07-staff-pay/tests/m07-batch6-remediation.test.ts",
        "src/modules/m07-staff-pay/tests/m07-batch6-second-remediation.test.ts",
        "src/modules/m07-staff-pay/tests/m07-batch6-third-remediation.test.ts",
        "src/modules/m07-staff-pay/tests/m07-batch6-fourth-remediation.test.ts",
      ],
      "11-batch6.log",
    ],
  ],
  "3": [
    ["12-test-m05", "npm", ["run", "test:m05"], "12-test-m05.log"],
    ["13-test-m06", "npm", ["run", "test:m06"], "13-test-m06.log"],
    ["14-test-m07", "npm", ["run", "test:m07"], "14-test-m07.log"],
    ["15-test-workforce", "npm", ["run", "test:workforce"], "15-test-workforce.log"],
  ],
  "4": [
    ["16-lint", "npm", ["run", "lint"], "16-lint.log"],
    ["17-tsc", "npx", ["tsc", "--noEmit"], "17-tsc.log"],
  ],
};

const list = suites[phase] || [];
const results = [];
for (const [name, cmd, args, log] of list) {
  results.push(run(name, cmd, args, log));
}
writeFileSync(join(ev, `phase${phase}-results.json`), JSON.stringify(results, null, 2));
console.log("\nPHASE", phase, "DONE");
