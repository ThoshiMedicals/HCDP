#!/usr/bin/env node
/**
 * Programme Gate P0 semantic control-pack validator.
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
  ["m01-command-centre-final.png", "f600b734705bcc203a25cfbd1002f117b3949b3f78ddc84915e5d1497d6cd236"],
  ["m02-action-inbox-final.png", "9557ea9a432fd665a086e9a8d0621b8949a8c572dbbb3a811ce89ef03d74327f"],
  ["m04-staff-doctors-final.png", "146bd7c08d3fbc0f118c828d6dbd8a2b44e4ac0c4633f65af578b6a8cf492bc8"],
  ["m05-weekly-roster-final.png", "121786a1a07fd08d9a5e9e46e7652d50085a8e378c4650785af4debe81654d06"],
  ["m06-time-attendance-final.png", "86518204545f3e10a2ad37f5ca5bb4c7110d4632d3552d7ef6a9232ddd4f3a16"],
  ["m10-checklists-final.png", "1c2507878f42cfdc9792d85c93f2d185031ca55d7531fb83bd84eac095dc9ab4"],
  ["m11-training-final.png", "cf380fe1c7221275b8c9de158a8e6a9108ea2b54b649ac9c520b605eac2a349e"],
  ["m12-compliance-quality-final.png", "4ecb8eef079d30c796e5cb1b53b8b01595788e6f48fa81bb708a451b38e7c2a8"],
  ["m15-inventory-assets-final.png", "0ec5fbceac81554ef3edc38a92b4d29f7356b5c5ce4e91948e2faf863c3a61c6"],
];

const BANNED_EXACT = new Set([
  "required for final claim",
  "required",
  "where applicable",
  "reload proof required",
  "validation/permission/isolation",
  "work-step + service assert",
  "work-step + state transition assert",
  "module role gate + service enforcement",
  "runtime invoker + service gate",
  "module accessClassification",
  "per module accessClassification",
  "shared final-design contract viewports; detail panel → drawer on tablet/mobile",
]);

const WF_FIELDS = [
  "sourceLocation",
  "screenRoute",
  "permission",
  "serviceDomainTransition",
  "auditResult",
  "m01m02Projection",
  "persistenceProof",
  "errorState",
  "acceptanceTest",
];

const PROMPT_SECTIONS = [
  "predecessor acceptance gate",
  "Branch / start-ref",
  "Exact in-scope screens",
  "Exact actions and workflows",
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

const proto = readFileSync(PROTO);
const sha = createHash("sha256").update(proto).digest("hex");
if (sha !== EXPECTED_PROTO) fail(`prototype hash ${sha} != ${EXPECTED_PROTO}`);

const manifest = load("PROTOTYPE_EXTRACTION_MANIFEST.json");
if (manifest && !manifest.baselineAllMet) fail("extraction baseline not met");

for (const [name, expected] of CANONICAL_PNGS) {
  const p = join(FINAL, name);
  if (!existsSync(p)) {
    fail(`missing canonical PNG ${name}`);
    continue;
  }
  const buf = readFileSync(p);
  const h = createHash("sha256").update(buf).digest("hex");
  if (h !== expected) fail(`PNG hash drift ${name}`);
  if (buf.readUInt32BE(16) !== 1672 || buf.readUInt32BE(20) !== 941)
    fail(`PNG dims ${name}`);
}

const master = load("master-brd-prototype-production-traceability.json");
const accounting = load("ACCOUNTING_SUMMARY.json");
const csvRows = Math.max(
  0,
  readFileSync(join(OUT, "master-brd-prototype-production-traceability.csv"), "utf8")
    .trim()
    .split("\n").length - 1
);
if (master && accounting) {
  if (master.rows.length !== accounting.totalRows) fail("JSON rows != accounting.totalRows");
  if (csvRows !== accounting.totalRows) fail(`CSV rows ${csvRows} != ${accounting.totalRows}`);
  if (accounting.unclassifiedCount !== 0) fail("unclassified dispositions");
  if (accounting.designReferencesInstalled !== true) fail("design refs not installed");
  if (accounting.openOwnerDecisions !== 0)
    fail(`openOwnerDecisions=${accounting.openOwnerDecisions} expected 0`);
}

const actions = load("workflow-action-register.json");
const actionIds = new Set();
if (actions) {
  const wat = accounting?.workflowActionTotals || {};
  for (const k of [
    "brdButtons",
    "brdWorkflows",
    "blueprintWorkflows",
    "legacyWorkflowGroups",
    "modalsDrawers",
  ]) {
    if (typeof wat[k] !== "number") fail(`missing workflow total ${k}`);
  }
  if ((wat.brdButtons || 0) < 323) fail("brd buttons < 323");
  if ((wat.brdWorkflows || 0) < 107) fail("brd workflows < 107");
  if ((wat.blueprintWorkflows || 0) < 72) fail("blueprint workflows < 72");
  if ((wat.legacyWorkflowGroups || 0) < 28) fail("legacy groups < 28");
  if ((wat.modalsDrawers || 0) < 63) fail("modals < 63");
  for (const a of actions.items || []) {
    actionIds.add(a.id);
    for (const f of WF_FIELDS) {
      const v = (a[f] || "").toString().trim();
      if (!v) fail(`workflow ${a.id} blank ${f}`);
      if (BANNED_EXACT.has(v.toLowerCase()))
        fail(`workflow ${a.id} banned generic ${f}=${v}`);
    }
    if (
      a.kind?.includes("workflow") &&
      !(a.stepTexts || []).length &&
      !String(a.stateTransitions || "").includes("NONE — STEPS")
    )
      fail(`workflow ${a.id} missing steps/stateTransitions`);
  }
  const fc = wat.fieldCompleteness || {};
  if (fc.withSourceLocation !== (actions.items || []).length)
    fail("fieldCompleteness.sourceLocation mismatch");
  if (fc.withoutGenericPhrases !== (actions.items || []).length)
    fail(
      `fieldCompleteness.withoutGenericPhrases ${fc.withoutGenericPhrases} != ${actions.items.length}`
    );
}

const screens = load("canonical-screen-register.json");
if (screens && accounting) {
  if (screens.count !== accounting.canonicalScreenCount) fail("screen count mismatch");
  for (const s of screens.screens || []) {
    if (!String(s.route || "").startsWith("/")) fail(`bad route ${s.screenId}`);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s.sectionId || ""))
      fail(`bad sectionId ${s.screenId}`);
    if (BANNED_EXACT.has((s.roles || "").toLowerCase()) || /per module accessClassification/i.test(s.roles || ""))
      fail(`generic roles on ${s.screenId}`);
    if (/shared final-design contract viewports/i.test(s.responsiveBehaviour || ""))
      fail(`generic responsive on ${s.screenId}`);
    if (/\*/.test(s.acceptanceEvidencePath || ""))
      fail(`glob evidence on ${s.screenId}`);
    const aids = s.visibleActionIds || [];
    if (!aids.length) fail(`no visibleActionIds on ${s.screenId}`);
    for (const aid of aids) {
      if (/NONE — NO BRD BUTTONS/i.test(aid))
        fail(`NONE BRD placeholder on ${s.screenId}`);
      if (!actionIds.has(aid)) fail(`unmatched action ${aid} on ${s.screenId}`);
    }
  }
}

const audit = load("CURRENT_IMPLEMENTATION_REAUDIT.json");
if (audit) {
  for (const m of audit.modules || []) {
    if (["M01", "M02", "M03"].includes(m.module)) {
      if (m.revisedDomainStatus === "FUNCTIONALLY-COMPLETE")
        fail(`${m.module} domain FUNCTIONALLY-COMPLETE contradiction`);
      const noneSvc = (m.servicePaths || []).includes("NONE — NOT IMPLEMENTED");
      const noneRepo = (m.repositoryPaths || []).includes("NONE — NOT IMPLEMENTED");
      if (
        m.revisedDomainStatus === "FUNCTIONALLY-COMPLETE" &&
        (noneSvc || noneRepo)
      )
        fail(`${m.module} domain complete with NONE services/repos`);
      if (m.module !== "M03" && m.revisedIntegrationStatus !== "IN-DEVELOPMENT")
        fail(`${m.module} integration must be IN-DEVELOPMENT`);
    }
    if (
      m.revisedDomainStatus === "FUNCTIONALLY-COMPLETE" &&
      ((m.servicePaths || [])[0] === "NONE — NOT IMPLEMENTED" ||
        (m.repositoryPaths || [])[0] === "NONE — NOT IMPLEMENTED")
    )
      fail(`${m.module} contradictory FUNCTIONALLY-COMPLETE domain`);
  }
}

const decisions = load("conflict-and-owner-decision-register.json");
if (decisions) {
  if (decisions.openCount !== 0) fail(`open decisions ${decisions.openCount}`);
  if (accounting && decisions.openCount !== accounting.openOwnerDecisions)
    fail("open decision accounting mismatch");
  const branded = (decisions.items || []).find((d) => d.id === "DEC-BRANDED-THEMES");
  if (!branded || branded.status !== "CLOSED")
    fail("DEC-BRANDED-THEMES must be CLOSED");
  const png = (decisions.items || []).find((d) => d.id === "DEC-FINAL-PNGS-MISSING");
  if (!png || png.status !== "CLOSED") fail("DEC-FINAL-PNGS-MISSING must be CLOSED");
}

const design = load("design-system-contract.json");
if (design) {
  for (const k of [
    "semanticColors",
    "typography",
    "spacingDensity",
    "shellDimensionsPx",
    "componentDimensionsPx",
    "collapseBehaviour",
    "a11y",
    "screenshotComparison",
  ]) {
    if (!design[k]) fail(`design contract missing ${k}`);
  }
  if (!design.semanticColors?.light?.["--dp-accent-primary"])
    fail("design missing light accent token");
  if (!design.typography?.scale?.body?.sizePx) fail("design missing body typography");
  if (!design.shellDimensionsPx?.sidebarExpanded) fail("design missing sidebar dim");
  if (!design.screenshotComparison?.tolerances?.edgeAntialiasPx)
    fail("design missing screenshot tolerances");
  if (design.brandedGlobalThemesAllowed !== false)
    fail("branded global themes must be false");
}
const designMd = existsSync(join(OUT, "FINAL_DESIGN_SYSTEM_CONTRACT.md"))
  ? readOut("FINAL_DESIGN_SYSTEM_CONTRACT.md")
  : "";
for (const needle of [
  "--dp-bg-canvas",
  "line height",
  "Sidebar expanded",
  "WCAG",
  "edge antialias",
  "Light, Dark, System",
]) {
  if (!new RegExp(needle, "i").test(designMd))
    fail(`FINAL_DESIGN_SYSTEM_CONTRACT.md missing ${needle}`);
}

const promptsDir = join(OUT, "prompts");
if (!existsSync(promptsDir)) fail("missing prompts/");
else {
  const files = readdirSync(promptsDir).filter((f) => f.endsWith(".md"));
  if (files.length < 28) fail(`prompt files ${files.length} < 28`);
  for (const f of files) {
    if (f === "README.md") continue;
    const txt = readFileSync(join(promptsDir, f), "utf8");
    for (const sec of PROMPT_SECTIONS) {
      if (!new RegExp(sec, "i").test(txt))
        fail(`prompt ${f} missing /${sec}/`);
    }
    if (
      /sample\/full list|non-exhaustive|see master register|see workflow-action-register|see canonical-screen-register/i.test(
        txt
      )
    )
      fail(`prompt ${f} has delegated/non-exhaustive scope language`);
    if (!/Screen IDs \(complete\)/i.test(txt) || !/Action IDs \(complete\)/i.test(txt))
      fail(`prompt ${f} missing complete ID sections`);
    // Must contain at least one concrete ID backtick for screens/actions unless explicit NONE
    if (
      !/`[a-z0-9][a-z0-9_-]{5,}`/i.test(txt) &&
      !/NONE — NO (SCREENS|ACTIONS)/i.test(txt)
    )
      fail(`prompt ${f} lacks exact IDs`);
  }
  const p1 = readFileSync(join(promptsDir, "p1.md"), "utf8");
  const p9 = readFileSync(join(promptsDir, "p9.md"), "utf8");
  if (!/Shared scope table/i.test(p1)) fail("p1 missing shared scope table");
  if (!/Cross-module verification table/i.test(p9))
    fail("p9 missing cross-module verification table");
}

for (const f of [
  "SCOPE_AND_SOURCE_OF_TRUTH_FIREWALL.md",
  "REVISED_DEPENDENCY_LED_DEVELOPMENT_ROADMAP.md",
  "FINAL_DESIGN_SYSTEM_CONTRACT.md",
  "design-system-contract.json",
  "prompts/README.md",
  "VALIDATION_RECONCILIATION.json",
  "CURRENT_IMPLEMENTATION_REAUDIT.json",
  "workflow-action-register.json",
]) {
  if (!existsSync(join(OUT, f))) fail(`missing ${f}`);
}

if (accounting && !String(accounting.generatedAt || "").startsWith("deterministic:"))
  fail("non-deterministic generatedAt");

const tip = execSync("git rev-parse HEAD", { cwd: ROOT, encoding: "utf8" }).trim();
const result = {
  ok: failures.length === 0,
  tip,
  prototypeSha256: sha,
  totalRows: accounting?.totalRows ?? null,
  openOwnerDecisions: accounting?.openOwnerDecisions ?? null,
  canonicalScreens: screens?.count ?? null,
  workflowActionTotals: accounting?.workflowActionTotals ?? null,
  conflictAdjudicationTotals: accounting?.conflictAdjudicationTotals ?? null,
  designPngsInstalled: true,
  failures,
};
console.log(JSON.stringify(result, null, 2));
process.exit(failures.length ? 1 : 0);
