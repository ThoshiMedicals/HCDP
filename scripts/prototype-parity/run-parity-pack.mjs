#!/usr/bin/env node
/**
 * Deterministic Programme Gate P0 pack runner.
 *
 * Requires a clean committed working tree for P0 paths.
 * Runs extract → build → validate twice.
 * Never runs git add.
 * After both generations, requires:
 *   git diff --exit-code
 *   git diff --cached --exit-code
 * (working tree and index unchanged vs committed HEAD)
 */
import { execSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const SCRIPT = join(ROOT, "scripts/prototype-parity");
const PATHS = [
  "docs/architecture/prototype-parity",
  "docs/design-references/final/DESIGN_REFERENCE_MANIFEST.json",
  "docs/design-references/final/README.md",
];

function run(cmd) {
  console.log("\n>>", cmd);
  execSync(cmd, { cwd: ROOT, stdio: "inherit" });
}

function checkDiff(label) {
  try {
    execSync(`git diff --exit-code -- ${PATHS.join(" ")}`, { cwd: ROOT });
  } catch {
    console.error(`FATAL: ${label}: git diff --exit-code failed (working tree dirty vs HEAD)`);
    try {
      console.error(
        execSync(`git diff --stat -- ${PATHS.join(" ")}`, {
          cwd: ROOT,
          encoding: "utf8",
        })
      );
    } catch {
      /* ignore */
    }
    process.exit(4);
  }
  try {
    execSync(`git diff --cached --exit-code -- ${PATHS.join(" ")}`, {
      cwd: ROOT,
    });
  } catch {
    console.error(
      `FATAL: ${label}: git diff --cached --exit-code failed (index dirty)`
    );
    process.exit(5);
  }
  const untracked = execSync(
    `git ls-files --others --exclude-standard -- ${PATHS.join(" ")}`,
    { cwd: ROOT, encoding: "utf8" }
  ).trim();
  if (untracked) {
    console.error(`FATAL: ${label}: untracked files:\n${untracked}`);
    process.exit(6);
  }
}

function once(label) {
  console.log(`\n=== Generation ${label} ===`);
  run(`node ${join(SCRIPT, "extract-prototype.mjs")}`);
  run(`python3 ${join(SCRIPT, "build-parity-registers.py")}`);
  run(`node ${join(SCRIPT, "validate-registers.mjs")}`);
}

const tip = execSync("git rev-parse HEAD", { cwd: ROOT, encoding: "utf8" }).trim();
console.log("Committed tip before Generation 1:", tip);
checkDiff("preflight (clean committed state)");

once("1");
checkDiff("after Generation 1");

once("2");
checkDiff("after Generation 2");

console.log(
  JSON.stringify(
    {
      ok: true,
      tip,
      secondRunZeroDiff: true,
      gitDiffExitCode: 0,
      gitDiffCachedExitCode: 0,
      noGitAdd: true,
      note: "Both generations left working tree and index identical to committed HEAD",
    },
    null,
    2
  )
);
