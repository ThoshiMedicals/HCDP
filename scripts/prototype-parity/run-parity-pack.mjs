#!/usr/bin/env node
/**
 * Deterministic Programme Gate P0 pack runner.
 *
 * Requires a clean committed working tree for the FULL repository.
 * Runs extract → build → validate twice.
 * Never runs git add.
 * After both generations, requires whole-repository:
 *   git diff --exit-code
 *   git diff --cached --exit-code
 *   git ls-files --others --exclude-standard
 * (no path restrictions)
 */
import { execSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const SCRIPT = join(ROOT, "scripts/prototype-parity");

const RUN_ENV = {
  ...process.env,
  PYTHONDONTWRITEBYTECODE: "1",
};

function run(cmd) {
  console.log("\n>>", cmd);
  execSync(cmd, { cwd: ROOT, stdio: "inherit", env: RUN_ENV });
}

function checkDiff(label) {
  // Full-repository determinism — never path-scope these checks.
  let diffExit = 0;
  try {
    execSync("git diff --exit-code", { cwd: ROOT, stdio: "pipe" });
  } catch (e) {
    diffExit = e.status ?? 1;
    console.error(`FATAL: ${label}: git diff --exit-code failed (working tree dirty vs HEAD)`);
    try {
      console.error(execSync("git diff --stat", { cwd: ROOT, encoding: "utf8" }));
    } catch {
      /* ignore */
    }
    process.exit(4);
  }
  let cachedExit = 0;
  try {
    execSync("git diff --cached --exit-code", { cwd: ROOT, stdio: "pipe" });
  } catch (e) {
    cachedExit = e.status ?? 1;
    console.error(
      `FATAL: ${label}: git diff --cached --exit-code failed (index dirty)`
    );
    process.exit(5);
  }
  const untracked = execSync("git ls-files --others --exclude-standard", {
    cwd: ROOT,
    encoding: "utf8",
  }).trim();
  if (untracked) {
    console.error(`FATAL: ${label}: untracked files:\n${untracked}`);
    process.exit(6);
  }
  console.log(
    JSON.stringify({
      label,
      gitDiffExitCode: diffExit,
      gitDiffCachedExitCode: cachedExit,
      untrackedEmpty: true,
      scope: "full-repository",
    })
  );
}

function once(label) {
  console.log(`\n=== Generation ${label} ===`);
  const node = process.execPath;
  run(`"${node}" "${join(SCRIPT, "extract-prototype.mjs")}"`);
  run(`python3 "${join(SCRIPT, "build-parity-registers.py")}"`);
  run(`"${node}" "${join(SCRIPT, "validate-registers.mjs")}"`);
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
      fullRepositoryDeterminism: true,
      noPathScopedDiffChecks: true,
      noGitAdd: true,
      note: "Both generations left full working tree and index identical to committed HEAD",
    },
    null,
    2
  )
);
