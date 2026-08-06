#!/usr/bin/env node
/**
 * Non-production scaffolding: reconcile prototype-parity register totals.
 * Fails if unclassified dispositions exist or JSON/CSV row counts diverge.
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = join(ROOT, "docs/architecture/prototype-parity");
const PROTO = join(ROOT, "public/pulse-html-prototype.html");
const EXPECTED =
  "8843dbb315a6e82b5df628c51f68e3eb904b794aca928823bab99bfa57758760";

function load(name) {
  return JSON.parse(readFileSync(join(OUT, name), "utf8"));
}

const failures = [];
const proto = readFileSync(PROTO);
const sha = createHash("sha256").update(proto).digest("hex");
if (sha !== EXPECTED) failures.push(`prototype hash ${sha} != ${EXPECTED}`);

const manifest = load("PROTOTYPE_EXTRACTION_MANIFEST.json");
if (!manifest.baselineAllMet) failures.push("extraction baseline not met");
if (manifest.prototypeSha256 !== EXPECTED) failures.push("manifest hash mismatch");

const master = load("master-brd-prototype-production-traceability.json");
const accounting = load("ACCOUNTING_SUMMARY.json");
const csv = readFileSync(
  join(OUT, "master-brd-prototype-production-traceability.csv"),
  "utf8",
)
  .trim()
  .split("\n");
const csvRows = Math.max(0, csv.length - 1);

if (master.rows.length !== accounting.totalRows) {
  failures.push("JSON rows != accounting.totalRows");
}
if (csvRows !== accounting.totalRows) {
  failures.push(`CSV rows ${csvRows} != ${accounting.totalRows}`);
}
if (accounting.unclassifiedCount !== 0) {
  failures.push(`unclassifiedCount=${accounting.unclassifiedCount}`);
}
const dispSum = Object.values(accounting.dispositionTotals).reduce(
  (a, b) => a + b,
  0,
);
if (dispSum !== accounting.totalRows) {
  failures.push(`disposition sum ${dispSum} != ${accounting.totalRows}`);
}

const screens = load("canonical-screen-register.json");
if (screens.count !== accounting.canonicalScreenCount) {
  failures.push("screen count mismatch");
}
if (screens.count < 143) {
  failures.push("canonical screens below historical minimum baseline 143");
}

for (const f of [
  "SCOPE_AND_SOURCE_OF_TRUTH_FIREWALL.md",
  "REVISED_DEPENDENCY_LED_DEVELOPMENT_ROADMAP.md",
  "FINAL_DESIGN_SYSTEM_CONTRACT.md",
  "prompts/README.md",
  "VALIDATION_RECONCILIATION.json",
]) {
  if (!existsSync(join(OUT, f))) failures.push(`missing ${f}`);
}

const result = {
  ok: failures.length === 0,
  prototypeSha256: sha,
  totalRows: accounting.totalRows,
  unclassifiedCount: accounting.unclassifiedCount,
  dispositionTotals: accounting.dispositionTotals,
  canonicalScreens: screens.count,
  failures,
};

console.log(JSON.stringify(result, null, 2));
process.exit(failures.length ? 1 : 0);
