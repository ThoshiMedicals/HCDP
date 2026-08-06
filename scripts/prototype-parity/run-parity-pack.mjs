#!/usr/bin/env node
/**
 * Deterministic Programme Gate P0 pack runner.
 * Runs extract → build → validate twice; second run must produce zero diff
 * on generated control-pack outputs (and Decision A manifest).
 */
import { execSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const SCRIPT = join(ROOT, "scripts/prototype-parity");

function run(cmd) {
  console.log("\n>>", cmd);
  execSync(cmd, { cwd: ROOT, stdio: "inherit" });
}

function gitDiffGenerated() {
  const paths = [
    "docs/architecture/prototype-parity",
    "docs/design-references/final/DESIGN_REFERENCE_MANIFEST.json",
    "docs/design-references/final/README.md",
  ];
  // Exclude Python cache if any
  const out = execSync(`git status --porcelain -- ${paths.join(" ")}`, {
    cwd: ROOT,
    encoding: "utf8",
  });
  const diff = execSync(`git diff -- ${paths.join(" ")}`, {
    cwd: ROOT,
    encoding: "utf8",
  });
  const untracked = execSync(
    `git ls-files --others --exclude-standard -- ${paths.join(" ")}`,
    { cwd: ROOT, encoding: "utf8" }
  );
  return { porcelain: out, diff, untracked };
}

function once(label) {
  console.log(`\n=== Generation ${label} ===`);
  run(`node ${join(SCRIPT, "extract-prototype.mjs")}`);
  run(`python3 ${join(SCRIPT, "build-parity-registers.py")}`);
  run(`node ${join(SCRIPT, "validate-registers.mjs")}`);
}

once("1");
// Stage generated outputs so second run can detect mutation via git diff
run(
  "git add docs/architecture/prototype-parity docs/design-references/final/DESIGN_REFERENCE_MANIFEST.json docs/design-references/final/README.md"
);
const afterFirst = gitDiffGenerated();
if (afterFirst.porcelain || afterFirst.diff || afterFirst.untracked) {
  // After add, porcelain may show staged changes from first run vs HEAD — that's expected.
  // For zero-diff proof we compare working tree after second run against the index.
}

once("2");
const afterSecond = execSync(
  "git diff -- docs/architecture/prototype-parity docs/design-references/final/DESIGN_REFERENCE_MANIFEST.json docs/design-references/final/README.md",
  { cwd: ROOT, encoding: "utf8" }
);
const untrackedSecond = execSync(
  "git ls-files --others --exclude-standard -- docs/architecture/prototype-parity docs/design-references/final",
  { cwd: ROOT, encoding: "utf8" }
).trim();

if (afterSecond.trim() || untrackedSecond) {
  console.error("FATAL: second generation produced a diff (non-deterministic)");
  if (afterSecond.trim()) console.error(afterSecond.slice(0, 4000));
  if (untrackedSecond) console.error("untracked:\n" + untrackedSecond);
  process.exit(4);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      secondRunZeroDiff: true,
      note: "extract → build → validate twice; working tree matches index after second run",
    },
    null,
    2
  )
);
