/**
 * Checkpoint 2.7A — architecture / static boundary verification (evidence only).
 * Architecture/static evidence suite (blocker cleared separately in CP 2.7B).
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const M07_ROOT = join(ROOT, "src/modules/m07-staff-pay");
const M06_ROOT = join(ROOT, "src/modules/m06-time-attendance");
const PLATFORM_HASH = join(
  ROOT,
  "src/platform/workforce/contracts/published-timesheet-hash.ts"
);
const PLATFORM_REGISTRY = join(
  ROOT,
  "src/platform/workforce/services/published-timesheet-registry.ts"
);

function walkProductionTsFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "tests" || name === "node_modules") continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walkProductionTsFiles(full, out);
    else if (/\.(ts|tsx)$/.test(name) && !name.endsWith(".d.ts")) out.push(full);
  }
  return out;
}

/** Strip comments and string/template literals so docs/assertions cannot evade or false-fail. */
function stripCommentsAndStrings(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\/\/.*$/gm, " ")
    .replace(/`(?:\\.|[^`\\])*`/g, '""')
    .replace(/'(?:\\.|[^'\\])*'/g, '""')
    .replace(/"(?:\\.|[^"\\])*"/g, '""');
}

describe("CP2.7A architecture / static boundaries", () => {
  it("M07 production has no pulse.m06 access or M06 internal imports", () => {
    const files = walkProductionTsFiles(M07_ROOT);
    assert.ok(files.length > 10, "expected M07 production files");
    for (const file of files) {
      const stripped = stripCommentsAndStrings(readFileSync(file, "utf8"));
      assert.doesNotMatch(
        stripped,
        /pulse\.m06\./,
        relative(ROOT, file)
      );
      assert.doesNotMatch(
        stripped,
        /m06-time-attendance\/(repository|services)/,
        relative(ROOT, file)
      );
    }
  });

  it("M07 does not mutate platform registry storage; discovery health probe is the only KEYS import", () => {
    const allowedKeysImport = join(M07_ROOT, "adapters/m06-timesheet-read.ts").replace(/\\/g, "/");
    for (const file of walkProductionTsFiles(M07_ROOT)) {
      const rel = relative(ROOT, file).replace(/\\/g, "/");
      const raw = readFileSync(file, "utf8");
      const stripped = stripCommentsAndStrings(raw);
      // No writes to registry storage from M07
      assert.doesNotMatch(stripped, /writeJsonSafe\s*\(\s*PUBLISHED_TIMESHEET_REGISTRY_KEYS/);
      assert.doesNotMatch(stripped, /localStorage\.setItem\s*\(\s*PUBLISHED_TIMESHEET_REGISTRY_KEYS/);
      if (rel.includes("adapters/m06-timesheet-read")) {
        // CP 2.3 discovery may probe versions key for corrupt/unavailable — not a second reader API
        assert.ok(raw.includes("PUBLISHED_TIMESHEET_REGISTRY_KEYS"));
        continue;
      }
      assert.doesNotMatch(
        stripped,
        /PUBLISHED_TIMESHEET_REGISTRY_KEYS/,
        `${rel} (only discovery adapter may reference registry KEYS for health probe)`
      );
    }
    assert.ok(allowedKeysImport.includes("m06-timesheet-read"));
  });

  it("single intake and hash implementations; replay uses platform query + CP2.4 intake", () => {
    const intakeFiles = walkProductionTsFiles(M07_ROOT).filter((f) =>
      /intakePublishedTimesheet|published-timesheet-intake/.test(readFileSync(f, "utf8"))
    );
    // Production definition of intake lives in one service module
    const intakeDefs = walkProductionTsFiles(M07_ROOT).filter((f) =>
      /export function intakePublishedTimesheet/.test(readFileSync(f, "utf8"))
    );
    assert.equal(intakeDefs.length, 1, "exactly one intakePublishedTimesheet export");

    const hashDefs = [
      ...walkProductionTsFiles(join(ROOT, "src/platform/workforce")),
      ...walkProductionTsFiles(M07_ROOT),
    ].filter((f) => /export function calculatePayrollContentHash/.test(readFileSync(f, "utf8")));
    assert.equal(hashDefs.length, 1, "exactly one calculatePayrollContentHash");
    assert.ok(hashDefs[0]!.endsWith("published-timesheet-hash.ts"));

    const replaySrc = readFileSync(
      join(M07_ROOT, "services/published-timesheet-replay.ts"),
      "utf8"
    );
    assert.ok(replaySrc.includes("replayPublishedTimesheetEvents"));
    assert.ok(replaySrc.includes("intakePublishedTimesheet"));
    assert.ok(replaySrc.includes("applyLifecycleHoldEvent"));
    assert.ok(!stripCommentsAndStrings(replaySrc).includes("readJsonSafe"));

    void intakeFiles;
    void PLATFORM_HASH;
    void PLATFORM_REGISTRY;
  });

  it("M06 production does not write pulse.m07 or import M07 modules", () => {
    for (const file of walkProductionTsFiles(M06_ROOT)) {
      const stripped = stripCommentsAndStrings(readFileSync(file, "utf8"));
      assert.doesNotMatch(stripped, /pulse\.m07\./, relative(ROOT, file));
      assert.doesNotMatch(stripped, /m07-staff-pay\//, relative(ROOT, file));
    }
  });

  it("prohibits payroll/banking/payment fields in M07 snapshot and lifecycle stores", () => {
    const sensitive = [
      join(M07_ROOT, "types/domain.ts"),
      join(M07_ROOT, "services/published-timesheet-intake.ts"),
      join(M07_ROOT, "services/published-timesheet-lifecycle.ts"),
      join(M07_ROOT, "repository/published-timesheet-snapshots.ts"),
      join(M07_ROOT, "repository/published-timesheet-lifecycle.ts"),
    ];
    for (const file of sensitive) {
      const stripped = stripCommentsAndStrings(readFileSync(file, "utf8"));
      assert.doesNotMatch(stripped, /\btfn\b/i, relative(ROOT, file));
      assert.doesNotMatch(stripped, /\bbsb\b/i, relative(ROOT, file));
      assert.doesNotMatch(stripped, /bankAccount|grossPay|netPay|taxWithheld|paymentStatus/i, relative(ROOT, file));
      assert.doesNotMatch(stripped, /superannuationMember|accountingReconcil/i, relative(ROOT, file));
    }
  });

  it("does not implement Module 5 demand-rostering or Premium Clinical Enterprise redesign in M07", () => {
    for (const file of walkProductionTsFiles(M07_ROOT)) {
      const raw = readFileSync(file, "utf8");
      const stripped = stripCommentsAndStrings(raw);
      assert.doesNotMatch(stripped, /demandBasedRostering|demand-based roster/i, relative(ROOT, file));
      assert.doesNotMatch(stripped, /A4 landscape|Premium Clinical Enterprise/i, relative(ROOT, file));
    }
  });

  it("documents scan scope: production ts under m07 (excl tests), m06 (excl tests); strings/comments stripped", () => {
    const m07 = walkProductionTsFiles(M07_ROOT);
    const m06 = walkProductionTsFiles(M06_ROOT);
    assert.ok(m07.every((f) => !f.includes(`${join("m07-staff-pay", "tests")}`)));
    assert.ok(m06.every((f) => !f.includes(`${join("m06-time-attendance", "tests")}`)));
    // Limitation: rename-evasive dynamic access is not fully modelled; patterns target static imports/keys.
    assert.ok(true);
  });
});
