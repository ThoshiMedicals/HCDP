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
  "sectionId",
  "permission",
  "servicePath",
  "serviceMethod",
  "componentHandler",
  "auditResult",
  "m01m02Projection",
  "persistenceProof",
  "errorState",
  "acceptanceTest",
  "automatedTest",
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


// Provenance / atomic mapping checks
if (screens && actions) {
  const sets = new Set(
    (screens.screens || []).map((s) => JSON.stringify(s.visibleActionIds || []))
  );
  if (sets.size < (screens.screens || []).length) {
    fail(
      `module-wide duplicated action sets: unique ${sets.size} < screens ${screens.screens.length}`
    );
  }
  for (const s of screens.screens || []) {
    if ((s.sourceLocation || "").includes(`screen-derived:${s.screenId}`))
      fail(`self-referential sourceLocation on ${s.screenId}`);
    if (!(s.sourceLocation || "").includes("public/") && !(s.sourceLocation || "").includes("src/"))
      fail(`weak sourceLocation on ${s.screenId}: ${s.sourceLocation}`);
  }
  let naSection = 0;
  let unresolvedSection = 0;
  let registryOnlyProd = 0;
  const svcCounts = {};
  for (const a of actions.items || []) {
    if (String(a.sectionId || "").startsWith("NOT APPLICABLE")) naSection++;
    if (String(a.sectionId || "").startsWith("UNRESOLVED")) unresolvedSection++;
    if (
      a.kind === "production-control" &&
      (a.sourceLocation || "").includes("module-register.ts")
    )
      registryOnlyProd++;
    if (a.kind === "brd-button" && (a.servicePath || "").startsWith("src/")) {
      const k = a.moduleKey + "::" + a.servicePath;
      svcCounts[k] = (svcCounts[k] || 0) + 1;
    }
    if (!(a.sourceLocation || "").trim()) fail(`blank sourceLocation ${a.id}`);
    // referenced file exists when path-like
    let file = (a.sourceLocation || "").split("#")[0];
    file = file.split(":line:")[0];
    file = file.split(":section:")[0];
    file = file.split(":module:")[0];
    file = file.split(":offset:")[0];
    if (file.startsWith("src/") || file.startsWith("public/") || file.startsWith("docs/")) {
      if (!existsSync(join(ROOT, file))) fail(`missing source file for ${a.id}: ${file}`);
    }
  }
  // NOT APPLICABLE sectionIds remain a hard fail; UNRESOLVED is an allowed explicit non-claim
  if (naSection > 0)
    fail(`actions with NOT APPLICABLE sectionId: ${naSection}`);
  if (registryOnlyProd > 0)
    fail(`production-controls still sourced only from module-register: ${registryOnlyProd}`);
  // surface unresolved count in validator output path via accounting cross-check when present
  if (
    accounting?.workflowActionTotals?.sectionMappingTotals &&
    accounting.workflowActionTotals.sectionMappingTotals.unresolved !== unresolvedSection
  ) {
    // planned + unresolved actions may differ if confidence field set without UNRESOLVED sectionId
    // only fail when accounting unresolved is zero but we observed UNRESOLVED sectionIds
    if (unresolvedSection > 0 && accounting.workflowActionTotals.sectionMappingTotals.unresolved === 0)
      fail("sectionMappingTotals.unresolved is 0 but UNRESOLVED sectionIds exist");
  }
  for (const [k, n] of Object.entries(svcCounts)) {
    if (n >= 15)
      fail(`possible first-service blanket mapping ${k} used ${n} times`);
  }
}

const audit2 = load("CURRENT_IMPLEMENTATION_REAUDIT.json");
if (audit2) {
  for (const m of audit2.modules || []) {
    if (["M01", "M02", "M03"].includes(m.module)) {
      const pages = m.pagePaths || [];
      if (!pages.length || pages[0] === "NONE — NOT IMPLEMENTED")
        fail(`${m.module} pagePaths still NONE`);
      if (!pages.some((p) => /Workspace|Module/.test(p)))
        fail(`${m.module} pagePaths missing workspace/module entry`);
    }
  }
}

// Prompt anti-delegation
if (existsSync(promptsDir)) {
  for (const f of readdirSync(promptsDir).filter((x) => x.endsWith(".md") && x !== "README.md")) {
    const txt = readFileSync(join(promptsDir, f), "utf8");
    if (/already recorded in workflow-action-register/i.test(txt))
      fail(`prompt ${f} delegates semantics to workflow-action-register`);
    if (!/Action execution dossiers/i.test(txt))
      fail(`prompt ${f} missing inline action execution dossiers`);
  }
}


const tip = execSync("git rev-parse HEAD", { cwd: ROOT, encoding: "utf8" }).trim();

// ── Correction 4 integrity gates ───────────────────────────────────────────
const runnerSrc = readFileSync(join(ROOT, "scripts/prototype-parity/run-parity-pack.mjs"), "utf8");
if (/git diff --exit-code -- /.test(runnerSrc) || /git diff --cached --exit-code -- /.test(runnerSrc))
  fail("path-scoped determinism checks presented as whole-repository proof in run-parity-pack.mjs");
if (!/git diff --exit-code/.test(runnerSrc) || !/git diff --cached --exit-code/.test(runnerSrc))
  fail("run-parity-pack.mjs missing full-repository git diff checks");
if (!/git ls-files --others --exclude-standard/.test(runnerSrc))
  fail("run-parity-pack.mjs missing full-repository untracked check");
if (/PATHS\s*=\s*\[/.test(runnerSrc) && /git diff --exit-code -- \$\{PATHS/.test(runnerSrc))
  fail("run-parity-pack.mjs still path-scopes determinism via PATHS");

if (actions) {
  const prod = (actions.items || []).filter((a) => a.kind === "production-control");
  for (const a of prod) {
    if (/^Module\s+\d+$/i.test(a.label || a.visibleLabel || ""))
      fail(`module heading counted as production control: ${a.id}`);
    if (
      a.placeholderShell === true ||
      /placeholder-shell/i.test(a.implementationStatus || "")
    )
      fail(`placeholder shell reported as implemented production control: ${a.id}`);
    const el = String(a.renderedElementType || "");
    if (!el || el === "jsx-text-control" || /static|heading|paragraph|badge|display-only/i.test(el))
      fail(`static/non-interactive element typed as production control: ${a.id} element=${el}`);
    if (
      !a.handlerOrNavigationTarget &&
      !/on[A-Z]|href=|navigate|setSection|Button|button|Link|input|select|handler/i.test(
        `${a.componentHandler || ""} ${a.renderedElementType || ""}`
      )
    )
      fail(`production control lacks interaction evidence: ${a.id}`);
    for (const f of [
      "sourceLocation",
      "renderedElementType",
      "visibleLabel",
      "handlerOrNavigationTarget",
      "resultingBehaviour",
      "implementationStatus",
    ]) {
      if (!(a[f] || "").toString().trim())
        fail(`production control ${a.id} missing ${f}`);
    }
  }
  const wat = accounting?.workflowActionTotals || {};
  if ((wat.productionControlsBeforeFalsePositiveRemoval || 0) !== 67)
    fail("accounting must record prior false-positive baseline of 67 production controls");
  if ((wat.productionControlsAfterFalsePositiveRemoval ?? wat.productionControls) !== prod.length)
    fail("productionControlsAfterFalsePositiveRemoval mismatch");
  if ((wat.productionControls || 0) >= 67)
    fail("false-positive production controls not removed (count still >= 67)");
  for (const a of actions.items || []) {
    const reason = String(a.sectionMappingReason || "");
    const conf = String(a.sectionMappingConfidence || "");
    if (/section inferred:\s*overview/i.test(reason))
      fail(`fallback overview section mapping still present: ${a.id}`);
    if (
      conf === "proven" &&
      (/INFERRED/i.test(reason) || /UNRESOLVED/i.test(reason) || /overview\/default/i.test(reason))
    )
      fail(`unresolved/inferred mapping described as exact/proven: ${a.id}`);
    if (
      a.sectionId === "overview" &&
      /no token overlap|fallback|default \(no/i.test(reason)
    )
      fail(`overview used as unproven fallback for ${a.id}`);
  }
  const smt = wat.sectionMappingTotals || {};
  for (const k of ["proven", "inferred", "unresolved"]) {
    if (typeof smt[k] !== "number") fail(`missing sectionMappingTotals.${k}`);
  }
  if (typeof wat.m08toM24GenuineProductionControls !== "number")
    fail("missing m08toM24GenuineProductionControls");
  if (typeof wat.m08toM24PlaceholderShellCount !== "number")
    fail("missing m08toM24PlaceholderShellCount");
}

// Prompt specificity: reject identical/token-substituted batches and generic test language
if (existsSync(promptsDir)) {
  const batchBodies = [];
  const genericBatch =
    /implement\/align each screen ID in §3|implement each screen from §3|wire each dossier|wire the named `handler`|Enforce each dossier permission|Land every named automatedTest|implement every named `automatedTest`|Regression for frozen accepted modules touched/i;
  for (const f of readdirSync(promptsDir).filter((x) => x.endsWith(".md") && x !== "README.md")) {
    const txt = readFileSync(join(promptsDir, f), "utf8");
    const batchSec = txt.match(/## 8\. Implementation batches[\s\S]*?(?=## 9\.|$)/i);
    const testSec = txt.match(/## 9\. Automated tests[\s\S]*?(?=## 10\.|$)/i);
    if (!batchSec) fail(`prompt ${f} missing implementation batches section`);
    else {
      if (genericBatch.test(batchSec[0]))
        fail(`prompt ${f} still has generic batch/test language`);
      batchBodies.push({ f, body: batchSec[0].replace(/M\d{2}/g, "MXX").replace(/P\d/g, "PX") });
    }
    if (testSec) {
      if (
        /Implement every named `automatedTest` from the action\/workflow dossiers in §4 for MXX/i.test(
          testSec[0].replace(/M\d{2}/g, "MXX")
        ) ||
        (/Implement every named `automatedTest`/i.test(testSec[0]) &&
          /Regression for frozen accepted modules/i.test(testSec[0]))
      )
        fail(`prompt ${f} has generic test instructions without named module behaviour`);
      if (
        !/(assert|expect|resulting-state|status|transition|permission|isolation|audit)/i.test(
          testSec[0]
        )
      )
        fail(`prompt ${f} tests lack named behaviour/expected state language`);
    }
    if (f === "p8-m21.md") {
      for (const needle of [
        "tenant portfolio",
        "tenant provisioning",
        "Commercial suspension",
        "Platform-health",
        "service-impact",
        "Vendor permissions",
        "Resulting-state",
      ]) {
        if (!new RegExp(needle, "i").test(txt))
          fail(`p8-m21.md missing required batch topic: ${needle}`);
      }
    }
  }
  for (let i = 0; i < batchBodies.length; i++) {
    for (let j = i + 1; j < batchBodies.length; j++) {
      if (batchBodies[i].body === batchBodies[j].body)
        fail(
          `identical/token-substituted implementation batches: ${batchBodies[i].f} == ${batchBodies[j].f}`
        );
    }
  }
}

// Section-contract integrity: prompts, screens, and actions must not activate undeclared sections
{
  const regTs = readFileSync(
    join(ROOT, "src/platform/module-registry/module-register.ts"),
    "utf8"
  ).replace(/\r\n/g, "\n");
  const registerSections = {};
  for (const block of regTs.split(/\n  \{\n/).slice(1)) {
    const num = block.match(/number:\s*(\d+)/);
    if (!num) continue;
    const mk = `M${String(Number(num[1])).padStart(2, "0")}`;
    registerSections[mk] = new Set(
      [...block.matchAll(/\{\s*id:\s*"([^"]+)"\s*,\s*label:\s*"([^"]+)"/g)].map((m) => m[1])
    );
  }
  const declared = {};
  for (const [mk, secs] of Object.entries(registerSections)) {
    declared[mk] = new Set(secs);
  }
  // Canonical screens with BRD-tab provenance expand the declared set (tab labels may differ from register ids)
  for (const s of screens?.screens || []) {
    if (!declared[s.moduleKey]) declared[s.moduleKey] = new Set();
    if (s.sourceType === "brd-tab" || s.sourceType === "module-register-section") {
      if (s.sectionId) declared[s.moduleKey].add(s.sectionId);
    }
  }
  const extractedScreens = load("prototype-screens.json");
  for (const s of extractedScreens?.screens || []) {
    if (s.sourceType === "blueprint-default") {
      fail(
        `extracted screen ${s.id || s.screenId} still uses banned blueprint-default (invented Overview path)`
      );
    }
    if (
      String(s.section || "").toLowerCase() === "overview" &&
      s.sourceType !== "brd-tab" &&
      s.sourceType !== "module-register-section"
    ) {
      fail(
        `invented Overview/section without canonical evidence: ${s.moduleKey} ${s.id || ""} sourceType=${s.sourceType}`
      );
    }
  }
  for (const s of screens?.screens || []) {
    const d = declared[s.moduleKey] || new Set();
    if (s.sourceType === "blueprint-default")
      fail(`canonical screen ${s.screenId} has banned sourceType blueprint-default`);
    if (!d.has(s.sectionId))
      fail(
        `canonical screen ${s.screenId} sectionId=${s.sectionId} not declared by module-register/BRD for ${s.moduleKey}`
      );
    // Generator input agreement: extracted screen with same id must agree on section when present
    const ex = (extractedScreens?.screens || []).find((x) => x.id === s.screenId);
    if (ex?.registerSectionId && ex.registerSectionId !== s.sectionId)
      fail(
        `sectionId disagreement for ${s.screenId}: generated=${s.sectionId} extract.registerSectionId=${ex.registerSectionId}`
      );
  }
  for (const a of actions?.items || []) {
    const sid = String(a.sectionId || "");
    if (!sid || sid.startsWith("UNRESOLVED") || sid.startsWith("NOT APPLICABLE")) continue;
    const d = declared[a.moduleKey] || new Set();
    if (!d.has(sid))
      fail(`action ${a.id} references undeclared sectionId=${sid} for ${a.moduleKey}`);
    const conf = String(a.sectionMappingConfidence || "");
    const reason = String(a.sectionMappingReason || "");
    if (
      conf === "proven" &&
      (/fallback/i.test(reason) || /invent/i.test(reason) || /default overview/i.test(reason))
    )
      fail(`fallback section presented as proven: ${a.id}`);
    if (
      a.moduleKey === "M21" &&
      sid === "overview" &&
      a.source !== "brd" &&
      !/brd-tab/i.test(String(a.sourceLocation || ""))
    )
      fail(`M21 active overview contract without canonical evidence: ${a.id}`);
  }
  // M21 must not activate overview at all unless register declares it (it does not)
  const m21Declared = declared.M21 || new Set();
  if (m21Declared.has("overview"))
    fail("M21 module-register unexpectedly declares overview — revisit adjudication");
  for (const s of (screens?.screens || []).filter((x) => x.moduleKey === "M21")) {
    if (s.sectionId === "overview")
      fail(`M21 canonical screen activates undeclared overview: ${s.screenId}`);
  }
  const promptsDir2 = join(OUT, "prompts");
  if (existsSync(promptsDir2)) {
    for (const f of readdirSync(promptsDir2).filter((x) => x.endsWith(".md") && x !== "README.md")) {
      const txt = readFileSync(join(promptsDir2, f), "utf8");
      const modMatch = txt.match(/\*\*Module:\*\*\s*(M\d{2}|SHARED|MULTI)/);
      const mk = modMatch?.[1];
      const validLine = txt.match(
        /\*\*Valid section IDs \(complete\):\*\*\s*(.+)/i
      );
      if (mk && /^M\d{2}$/.test(mk)) {
        if (!validLine)
          fail(`prompt ${f} missing Valid section IDs contract line`);
        else if (!/NOT APPLICABLE/i.test(validLine[1])) {
          const listed = [
            ...validLine[1].matchAll(/`([a-z0-9]+(?:-[a-z0-9]+)*)`/g),
          ].map((m) => m[1]);
          const d = declared[mk] || new Set();
          for (const id of listed) {
            if (!d.has(id))
              fail(`prompt ${f} lists undeclared valid section ${id}`);
          }
          for (const id of d) {
            if (!listed.includes(id) && registerSections[mk]?.has(id))
              fail(
                `prompt ${f} omits module-register section ${id} from Valid section IDs (generated vs register disagreement)`
              );
          }
        }
        // Active tests / dossiers must not target sections outside the valid list
        const allowed = new Set();
        if (validLine && !/NOT APPLICABLE|NONE — NO SECTIONS/i.test(validLine[1])) {
          for (const m of validLine[1].matchAll(/`([a-z0-9]+(?:-[a-z0-9]+)*)`/g))
            allowed.add(m[1]);
        } else {
          for (const id of declared[mk] || []) allowed.add(id);
        }
        const sectionRefs = [
          ...txt.matchAll(/\?section=([a-z0-9]+(?:-[a-z0-9]+)*)/gi),
          ...txt.matchAll(/section=`([a-z0-9]+(?:-[a-z0-9]+)*)`/gi),
          ...txt.matchAll(/section param `([a-z0-9]+(?:-[a-z0-9]+)*)`/gi),
        ].map((m) => m[1]);
        for (const sid of sectionRefs) {
          if (!allowed.has(sid))
            fail(
              `prompt ${f} references section=${sid} not in Valid section IDs for ${mk}`
            );
        }
        if (mk === "M21") {
          if (/\boverview\b/i.test(txt) && /\?section=overview|section=`overview`|Open screen section Overview/i.test(txt))
            fail(`prompt ${f} still activates M21 overview contract`);
        }
      }
    }
  }
}

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
