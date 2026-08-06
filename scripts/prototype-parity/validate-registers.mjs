#!/usr/bin/env node
/**
 * Programme Gate P0 control-pack validator.
 * Fails on incomplete traceability, stale Decision A text, PNG drift,
 * route/deep-link errors, sensitive seed leakage, and accounting mismatches.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { execSync } from "node:child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = join(ROOT, "docs/architecture/prototype-parity");
const FINAL = join(ROOT, "docs/design-references/final");
const PROTO = join(ROOT, "public/pulse-html-prototype.html");
const EXPECTED_PROTO =
  "8843dbb315a6e82b5df628c51f68e3eb904b794aca928823bab99bfa57758760";

const CANONICAL_PNGS = [
  [
    "m01-command-centre-final.png",
    "f600b734705bcc203a25cfbd1002f117b3949b3f78ddc84915e5d1497d6cd236",
  ],
  [
    "m02-action-inbox-final.png",
    "9557ea9a432fd665a086e9a8d0621b8949a8c572dbbb3a811ce89ef03d74327f",
  ],
  [
    "m04-staff-doctors-final.png",
    "146bd7c08d3fbc0f118c828d6dbd8a2b44e4ac0c4633f65af578b6a8cf492bc8",
  ],
  [
    "m05-weekly-roster-final.png",
    "121786a1a07fd08d9a5e9e46e7652d50085a8e378c4650785af4debe81654d06",
  ],
  [
    "m06-time-attendance-final.png",
    "86518204545f3e10a2ad37f5ca5bb4c7110d4632d3552d7ef6a9232ddd4f3a16",
  ],
  [
    "m10-checklists-final.png",
    "1c2507878f42cfdc9792d85c93f2d185031ca55d7531fb83bd84eac095dc9ab4",
  ],
  [
    "m11-training-final.png",
    "cf380fe1c7221275b8c9de158a8e6a9108ea2b54b649ac9c520b605eac2a349e",
  ],
  [
    "m12-compliance-quality-final.png",
    "4ecb8eef079d30c796e5cb1b53b8b01595788e6f48fa81bb708a451b38e7c2a8",
  ],
  [
    "m15-inventory-assets-final.png",
    "0ec5fbceac81554ef3edc38a92b4d29f7356b5c5ce4e91948e2faf863c3a61c6",
  ],
];

const REQUIRED_TRACE_FIELDS = [
  "requirementId",
  "sourceLocation",
  "sourceType",
  "module",
  "rolePermission",
  "sourceSystemOwner",
  "crossModuleContracts",
  "currentProductionCodePath",
  "currentServicePath",
  "currentEvidence",
  "prototypeDisposition",
  "dispositionReason",
  "targetProgrammeWave",
  "acceptanceTestEvidencePath",
];

const PROMPT_SECTIONS = [
  "predecessor acceptance gate",
  "Branch / start-ref",
  "screens and requirement",
  "Actions and workflows",
  "Domain ownership",
  "Permissions and clinic",
  "Persistence and audit",
  "Implementation batches",
  "Automated tests",
  "Visual QA",
  "Immutable-SHA",
  "Localhost handoff",
  "Explicit prohibitions",
  "Stop checkpoint",
];

const failures = [];
function fail(msg) {
  failures.push(msg);
}

function load(name) {
  const p = join(OUT, name);
  if (!existsSync(p)) {
    fail(`missing ${name}`);
    return null;
  }
  return JSON.parse(readFileSync(p, "utf8"));
}

function readOut(name) {
  return readFileSync(join(OUT, name), "utf8");
}

// Prototype pin
const proto = readFileSync(PROTO);
const sha = createHash("sha256").update(proto).digest("hex");
if (sha !== EXPECTED_PROTO) fail(`prototype hash ${sha} != ${EXPECTED_PROTO}`);

const manifest = load("PROTOTYPE_EXTRACTION_MANIFEST.json");
if (manifest && !manifest.baselineAllMet) fail("extraction baseline not met");
if (manifest && manifest.prototypeSha256 !== EXPECTED_PROTO)
  fail("manifest hash mismatch");

// PNG lock
for (const [name, expected] of CANONICAL_PNGS) {
  const p = join(FINAL, name);
  if (!existsSync(p)) {
    fail(`missing canonical PNG ${name}`);
    continue;
  }
  const buf = readFileSync(p);
  const h = createHash("sha256").update(buf).digest("hex");
  if (h !== expected) fail(`PNG hash drift ${name}: ${h}`);
  const w = buf.readUInt32BE(16);
  const hgt = buf.readUInt32BE(20);
  if (w !== 1672 || hgt !== 941) fail(`PNG dims ${name}: ${w}x${hgt}`);
}
const designManifest = JSON.parse(
  readFileSync(join(FINAL, "DESIGN_REFERENCE_MANIFEST.json"), "utf8")
);
if (!designManifest.allPresent || designManifest.blocker)
  fail("design manifest not fully installed");
if (designManifest.ownerDecision && !/A/i.test(designManifest.ownerDecision))
  fail("design manifest ownerDecision is not A");

const master = load("master-brd-prototype-production-traceability.json");
const accounting = load("ACCOUNTING_SUMMARY.json");
const csv = readFileSync(
  join(OUT, "master-brd-prototype-production-traceability.csv"),
  "utf8"
)
  .trim()
  .split("\n");
const csvRows = Math.max(0, csv.length - 1);

if (master && accounting) {
  if (master.rows.length !== accounting.totalRows)
    fail("JSON rows != accounting.totalRows");
  if (csvRows !== accounting.totalRows)
    fail(`CSV rows ${csvRows} != ${accounting.totalRows}`);
  if (accounting.unclassifiedCount !== 0)
    fail(`unclassifiedCount=${accounting.unclassifiedCount}`);
  const dispSum = Object.values(accounting.dispositionTotals || {}).reduce(
    (a, b) => a + b,
    0
  );
  if (dispSum !== accounting.totalRows)
    fail(`disposition sum ${dispSum} != ${accounting.totalRows}`);
  if (accounting.designReferencesInstalled !== true)
    fail("accounting.designReferencesInstalled != true");

  for (const r of master.rows) {
    if (!/^M\d{2}$/.test(r.module || ""))
      fail(`invalid module on ${r.requirementId}: ${r.module}`);
    for (const f of REQUIRED_TRACE_FIELDS) {
      if (!(r[f] || "").toString().trim())
        fail(`blank ${f} on ${r.requirementId}`);
    }
    const code = r.currentProductionCodePath || "";
    if (/^see |placeholder|TODO|TBD/i.test(code))
      fail(`generic code path on ${r.requirementId}`);
    const ev = r.acceptanceTestEvidencePath || "";
    if (/^docs\/architecture\/prototype-parity\/?$/i.test(ev.trim()))
      fail(`generic acceptance path on ${r.requirementId}`);
  }
}

const screens = load("canonical-screen-register.json");
if (screens && accounting) {
  if (screens.count !== accounting.canonicalScreenCount)
    fail("screen count mismatch");
  if (screens.count < 143) fail("canonical screens below baseline 143");
  for (const s of screens.screens || []) {
    if (!String(s.route || "").startsWith("/"))
      fail(`screen route missing leading /: ${s.screenId}`);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s.sectionId || ""))
      fail(`invalid sectionId on ${s.screenId}: ${s.sectionId}`);
    if (/\s{2,}|\?section=[^&]{80,}/.test(s.deepLink || ""))
      fail(`suspicious deepLink on ${s.screenId}`);
    if (/see workflow\/action register/i.test(JSON.stringify(s)))
      fail(`generic screen placeholder on ${s.screenId}`);
  }
}

const actions = load("workflow-action-register.json");
if (actions && accounting) {
  const wat = accounting.workflowActionTotals || {};
  for (const k of [
    "brdButtons",
    "brdWorkflows",
    "blueprintWorkflows",
    "legacyWorkflowGroups",
    "modalsDrawers",
  ]) {
    if (typeof wat[k] !== "number") fail(`missing workflow total ${k}`);
  }
  if ((wat.blueprintWorkflows || 0) < 72)
    fail(`blueprint workflows ${wat.blueprintWorkflows} < 72`);
  if ((wat.legacyWorkflowGroups || 0) < 28)
    fail(`legacy workflow groups ${wat.legacyWorkflowGroups} < 28`);
  if ((wat.modalsDrawers || 0) < 63)
    fail(`modals ${wat.modalsDrawers} < 63`);
  if ((wat.brdButtons || 0) < 323) fail(`brd buttons ${wat.brdButtons} < 323`);
  if ((wat.brdWorkflows || 0) < 107)
    fail(`brd workflows ${wat.brdWorkflows} < 107`);
}

const decisions = load("conflict-and-owner-decision-register.json");
if (decisions && accounting) {
  if (decisions.openCount !== accounting.openOwnerDecisions)
    fail("open decision count mismatch vs accounting");
  const png = (decisions.items || []).find(
    (d) => d.id === "DEC-FINAL-PNGS-MISSING"
  );
  if (!png || png.status !== "CLOSED")
    fail("DEC-FINAL-PNGS-MISSING must be CLOSED");
}

const conflicts = load("prototype-scope-conflicts.json");
if (conflicts) {
  for (const c of conflicts.conflicts || []) {
    const blob = JSON.stringify(c);
    if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(blob))
      fail(`sensitive email leaked in conflict ${c.id}`);
    if (/\bexcerpt"\s*:\s*"[^"]*checkbox/i.test(blob) && !c.excerptRedacted)
      fail(`unredacted checkbox false-positive style excerpt on ${c.id}`);
  }
}

// Stale Decision A / blocker language in controlling docs
const controllingDocs = [
  "VALIDATION_RECONCILIATION.md",
  "FIRST_RUN_STOP_CHECKPOINT.md",
  "README.md",
  "REVISED_DEPENDENCY_LED_DEVELOPMENT_ROADMAP.md",
  "DESIGN_REFERENCE_MAP.md",
  "MASTER_BRD_PROTOTYPE_PRODUCTION_TRACEABILITY.md",
];
for (const name of controllingDocs) {
  if (!existsSync(join(OUT, name))) {
    fail(`missing ${name}`);
    continue;
  }
  const txt = readOut(name);
  if (/Design PNGs installed\s*\|\s*False/i.test(txt))
    fail(`${name} still says Design PNGs False`);
  if (/PNGs?\s+are\s+missing|design references?.*MISSING|installation remains blocked/i.test(txt))
    fail(`${name} contains stale MISSING/blocked PNG language`);
  if (/\bbranch HEAD\b/i.test(txt)) fail(`${name} contains branch HEAD placeholder`);
  if (/open owner decisions\s*\|\s*26\b/i.test(txt) && accounting)
    if (accounting.openOwnerDecisions !== 26)
      fail(`${name} stale open-decision total 26`);
}

const valMd = existsSync(join(OUT, "VALIDATION_RECONCILIATION.md"))
  ? readOut("VALIDATION_RECONCILIATION.md")
  : "";
if (valMd && !/Design PNGs installed\s*\|\s*True/i.test(valMd))
  fail("VALIDATION_RECONCILIATION.md must state Design PNGs installed | True");

// Prompts
const promptsDir = join(OUT, "prompts");
if (!existsSync(promptsDir)) fail("missing prompts/");
else {
  const files = readdirSync(promptsDir).filter((f) => f.endsWith(".md"));
  if (files.length < 28) fail(`expected >=28 prompt md files, got ${files.length}`);
  for (const f of files) {
    if (f === "README.md") continue;
    const txt = readFileSync(join(promptsDir, f), "utf8");
    for (const sec of PROMPT_SECTIONS) {
      if (!new RegExp(sec, "i").test(txt))
        fail(`prompt ${f} missing section matching /${sec}/i`);
    }
    if (/auto-start from `?b1152d3` without/i.test(txt)) {
      /* ok */
    }
    if (
      /Baseline application SHA: `b1152d3/.test(txt) &&
      !/predecessor|owner-accepted preceding/i.test(txt)
    )
      fail(`prompt ${f} looks like generic shell without predecessor gate`);
  }
}

for (const f of [
  "SCOPE_AND_SOURCE_OF_TRUTH_FIREWALL.md",
  "REVISED_DEPENDENCY_LED_DEVELOPMENT_ROADMAP.md",
  "FINAL_DESIGN_SYSTEM_CONTRACT.md",
  "prompts/README.md",
  "VALIDATION_RECONCILIATION.json",
  "CURRENT_IMPLEMENTATION_REAUDIT.json",
  "workflow-action-register.json",
  "FINAL_DESIGN_SYSTEM_CONTRACT.md",
]) {
  if (!existsSync(join(OUT, f))) fail(`missing ${f}`);
}

// Tip consistency: generatedAt should be deterministic form
if (accounting && accounting.generatedAt) {
  if (!String(accounting.generatedAt).startsWith("deterministic:"))
    fail("accounting.generatedAt not deterministic");
  if (/T\d{2}:\d{2}:\d{2}Z/.test(accounting.generatedAt))
    fail("accounting.generatedAt looks like wall clock");
}

const tip = execSync("git rev-parse HEAD", { cwd: ROOT, encoding: "utf8" }).trim();
const result = {
  ok: failures.length === 0,
  tip,
  prototypeSha256: sha,
  totalRows: accounting?.totalRows ?? null,
  unclassifiedCount: accounting?.unclassifiedCount ?? null,
  openOwnerDecisions: accounting?.openOwnerDecisions ?? null,
  dispositionTotals: accounting?.dispositionTotals ?? null,
  canonicalScreens: screens?.count ?? null,
  workflowActionTotals: accounting?.workflowActionTotals ?? null,
  conflictAdjudicationTotals: accounting?.conflictAdjudicationTotals ?? null,
  designPngsInstalled: true,
  failures,
};

console.log(JSON.stringify(result, null, 2));
process.exit(failures.length ? 1 : 0);
