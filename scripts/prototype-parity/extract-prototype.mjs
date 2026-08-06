#!/usr/bin/env node
/**
 * Deterministic prototype extractor for Doctors Pulse / HCDP.
 * Reads ONLY the committed public/pulse-html-prototype.html.
 * Never uses machine-specific paths.
 *
 * Usage (from repo root):
 *   node scripts/prototype-parity/extract-prototype.mjs
 *
 * Outputs under docs/architecture/prototype-parity/
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");
const PROTO = join(ROOT, "public", "pulse-html-prototype.html");
const OUT = join(ROOT, "docs", "architecture", "prototype-parity");
const EXPECTED_SHA256 =
  "8843dbb315a6e82b5df628c51f68e3eb904b794aca928823bab99bfa57758760";

mkdirSync(OUT, { recursive: true });

if (!existsSync(PROTO)) {
  console.error("FATAL: missing", PROTO);
  process.exit(2);
}

const html = readFileSync(PROTO, "utf8");
const sha256 = createHash("sha256").update(html).digest("hex");
if (sha256 !== EXPECTED_SHA256) {
  console.error("FATAL: prototype hash mismatch");
  console.error(" expected", EXPECTED_SHA256);
  console.error(" got     ", sha256);
  process.exit(3);
}

function writeJson(name, data) {
  const p = join(OUT, name);
  writeFileSync(p, JSON.stringify(data, null, 2) + "\n");
  return p;
}

function sliceAssign(name) {
  const re = new RegExp(`(?:const|let|var)\\s+${name}\\s*=`);
  const m = html.match(re);
  if (!m) throw new Error("not found " + name);
  const start = m.index;
  const eq = html.indexOf("=", start);
  let i = eq + 1;
  while (/\s/.test(html[i])) i++;
  const open = html[i];
  if (open !== "[" && open !== "{") throw new Error(name + " not object/array");
  const close = open === "[" ? "]" : "}";
  let depth = 0;
  let inStr = false;
  let strCh = "";
  let escape = false;
  for (let j = i; j < html.length; j++) {
    const ch = html[j];
    if (inStr) {
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\") {
        escape = true;
        continue;
      }
      if (ch === strCh) inStr = false;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === "`") {
      inStr = true;
      strCh = ch;
      continue;
    }
    if (ch === open) depth++;
    if (ch === close) {
      depth--;
      if (depth === 0) {
        return {
          expr: html.slice(i, j + 1),
          startOffset: i,
          endOffset: j + 1,
          declOffset: start,
        };
      }
    }
  }
  throw new Error("unbalanced " + name);
}

function evalExpr(expr, prelude = "") {
  return Function(`"use strict"; ${prelude}; return (${expr});`)();
}

function extractNamed(name) {
  const sliced = sliceAssign(name);
  const data = evalExpr(sliced.expr);
  return { name, ...sliced, data };
}

function sid(prefix, ...parts) {
  const raw = [prefix, ...parts].join(":");
  return (
    prefix +
    "_" +
    createHash("sha1").update(raw).digest("hex").slice(0, 12)
  );
}

function lineAt(offset) {
  return html.slice(0, offset).split(/\n/).length;
}

function loc(offset, end) {
  return {
    file: "public/pulse-html-prototype.html",
    startOffset: offset,
    endOffset: end,
    startLine: lineAt(offset),
    endLine: lineAt(Math.max(offset, (end || offset) - 1)),
  };
}

// ── Core named extracts ─────────────────────────────────────────
const named = {};
for (const name of [
  "BRD_V2_MODULES",
  "MODULE_BLUEPRINTS",
  "WORKFLOWS",
  "FIELD_SCHEMAS",
  "GROUPS",
  "NAV",
  "NAV_GROUPS",
  "MODULES",
  "THEMES",
  "THEME_LABELS",
  "V29_THEMES",
  "V29_THEME_LABELS",
  "FAMILY_STYLES",
  "EXEC_ROLES",
]) {
  try {
    named[name] = extractNamed(name);
    console.log("OK", name);
  } catch (e) {
    console.warn("SKIP", name, e.message);
  }
}

// Patch FIELD_SCHEMAS later assignments / addFieldsOnce (same as legacy extractor)
let fieldSchemas = named.FIELD_SCHEMAS?.data ? { ...named.FIELD_SCHEMAS.data } : {};
{
  const assignRe = /FIELD_SCHEMAS\.([A-Za-z0-9_]+)\s*=\s*/g;
  let am;
  while ((am = assignRe.exec(html))) {
    const key = am[1];
    let i = am.index + am[0].length;
    while (/\s/.test(html[i])) i++;
    if (html[i] !== "[") continue;
    try {
      let depth = 0,
        inStr = false,
        strCh = "",
        escape = false,
        end = -1;
      for (let j = i; j < html.length; j++) {
        const ch = html[j];
        if (inStr) {
          if (escape) {
            escape = false;
            continue;
          }
          if (ch === "\\") {
            escape = true;
            continue;
          }
          if (ch === strCh) inStr = false;
          continue;
        }
        if (ch === "'" || ch === '"' || ch === "`") {
          inStr = true;
          strCh = ch;
          continue;
        }
        if (ch === "[") depth++;
        if (ch === "]") {
          depth--;
          if (depth === 0) {
            end = j;
            break;
          }
        }
      }
      if (end < 0) continue;
      fieldSchemas[key] = evalExpr(html.slice(i, end + 1));
    } catch {
      /* ignore patch failures */
    }
  }
  const addOnceRe = /addFieldsOnce\s*\(\s*['"]([A-Za-z0-9_]+)['"]\s*,\s*/g;
  let om;
  while ((om = addOnceRe.exec(html))) {
    const key = om[1];
    let i = om.index + om[0].length;
    while (/\s/.test(html[i])) i++;
    if (html[i] !== "[") continue;
    try {
      let depth = 0,
        inStr = false,
        strCh = "",
        escape = false,
        end = -1;
      for (let j = i; j < html.length; j++) {
        const ch = html[j];
        if (inStr) {
          if (escape) {
            escape = false;
            continue;
          }
          if (ch === "\\") {
            escape = true;
            continue;
          }
          if (ch === strCh) inStr = false;
          continue;
        }
        if (ch === "'" || ch === '"' || ch === "`") {
          inStr = true;
          strCh = ch;
          continue;
        }
        if (ch === "[") depth++;
        if (ch === "]") {
          depth--;
          if (depth === 0) {
            end = j;
            break;
          }
        }
      }
      if (end < 0) continue;
      const extras = evalExpr(html.slice(i, end + 1));
      const base = Array.isArray(fieldSchemas[key]) ? fieldSchemas[key] : [];
      const names = new Set(base.map((f) => f.name));
      const merged = [...base];
      for (const f of extras) {
        if (!names.has(f.name)) {
          merged.push(f);
          names.add(f.name);
        }
      }
      fieldSchemas[key] = merged;
    } catch {
      /* ignore */
    }
  }
}

// ── Modals from showModal / showDrawer template literals ─────────
const modals = [];
const modalRe =
  /show(?:Modal|Drawer)\(\s*['"]([^'"]+)['"]\s*,\s*`([\s\S]*?)`/g;
let mm;
while ((mm = modalRe.exec(html))) {
  const title = mm[1];
  const body = mm[2];
  const fields = [
    ...body.matchAll(
      /<(?:input|select|textarea)[^>]*?(?:name|id|placeholder)=['"]([^'"]+)['"][^>]*>/gi
    ),
  ].map((x) => x[1]);
  modals.push({
    id: sid("modal", title, String(mm.index)),
    title,
    kind: mm[0].startsWith("showDrawer") ? "drawer" : "modal",
    fieldHints: [...new Set(fields)],
    htmlLength: body.length,
    source: loc(mm.index, mm.index + mm[0].length),
    sourceType: "prototype-runtime",
  });
}

// ── Raw control scan (with stable source locations) ─────────────
function scanTag(tag) {
  const re = new RegExp(`<${tag}\\b([^>]*)>`, "gi");
  const out = [];
  let m;
  while ((m = re.exec(html))) {
    const attrs = m[1] || "";
    const attr = (name) => {
      const am = attrs.match(new RegExp(`${name}\\s*=\\s*['"]([^'"]*)['"]`, "i"));
      return am ? am[1] : null;
    };
    const onclick = attr("onclick") || "";
    const textNearby = html
      .slice(m.index, Math.min(html.length, m.index + 180))
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80);
    out.push({
      id: sid(tag, String(m.index)),
      tag,
      type: attr("type"),
      name: attr("name"),
      idAttr: attr("id"),
      className: attr("class"),
      ariaLabel: attr("aria-label"),
      onclick: onclick.slice(0, 160),
      textNearby,
      demoTechnique: /alert\s*\(|toast\(|showToast|localStorage/.test(onclick)
        ? "demo-handler"
        : null,
      source: loc(m.index, m.index + m[0].length),
      sourceType: "prototype-runtime-raw",
      duplicatedTemplateRisk: /\$\{|\{\{/.test(m[0]),
    });
  }
  return out;
}

const rawButtons = scanTag("button");
const rawInputs = scanTag("input");
const rawSelects = scanTag("select");
const rawTextareas = scanTag("textarea");

// ── Sensitive seed heuristics (do not copy values) ──────────────
const sensitivePatterns = [
  /bsb/i,
  /account\s*(number|no)/i,
  /tfn/i,
  /medicare/i,
  /password/i,
  /\bemail\b/i,
  /\bmobile\b|\bphone\b/i,
  /date of birth|\bdob\b/i,
];
const sensitiveSeedHits = [];
for (const re of sensitivePatterns) {
  const matches = html.match(new RegExp(re.source, "gi")) || [];
  if (matches.length) {
    sensitiveSeedHits.push({
      id: sid("sensitive", re.source),
      pattern: re.source,
      matchCount: matches.length,
      note: "Pattern presence only — values not copied into reports",
    });
  }
}

function redactExcerpt(text) {
  return text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[REDACTED-EMAIL]")
    .replace(/\b\d{2}\s?\d{3}\s?\d{3}\b/g, "[REDACTED-PHONE]")
    .replace(/\b\d{6}\b/g, "[REDACTED-NUM]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
}

// ── Scope conflict heuristics (precise; semantic class applied in builder) ──
const conflictPatterns = [
  {
    id: "patient-record",
    re: /patient\s+(record|demograph(?:ic|ics)?|chart|history)|clinical\s+notes?|prescription\s+(record|write|manage|pad)|best\s*practice\s+patient|appointment\s+(booking|record|workflow)/i,
    boundary: "patient-clinical",
  },
  {
    id: "patient-billing",
    re: /medicare\s+claim|patient\s+invoice|patient\s+billing|MBS\s+item|clinical\s+billing/i,
    boundary: "financial-patient",
  },
  {
    id: "payment-execution",
    re: /generate\s+bank\s+file|ABA\s+file|STP\s+submit|mark\s+as\s+paid|disburse(?:ment)?|execute\s+payment/i,
    boundary: "financial-execution",
  },
];
const scopeConflicts = [];
for (const c of conflictPatterns) {
  let m;
  const gre = new RegExp(c.re.source, "gi");
  while ((m = gre.exec(html))) {
    const raw = html.slice(
      Math.max(0, m.index - 40),
      Math.min(html.length, m.index + 80)
    );
    scopeConflicts.push({
      id: sid("conflict", c.id, String(m.index)),
      conflictClass: c.id,
      boundary: c.boundary,
      matchedTerm: m[0],
      excerptRedacted: redactExcerpt(raw),
      excerptSha256: createHash("sha256").update(raw).digest("hex"),
      source: loc(m.index, m.index + m[0].length),
      dispositionDefault: "NEEDS-SEMANTIC-CLASSIFICATION",
    });
    if (scopeConflicts.length > 400) break;
  }
}

// ── Normalize BRD / blueprints / workflows with stable IDs ──────
const brdModules = (named.BRD_V2_MODULES?.data || []).map((m, mi) => {
  const moduleKey = `M${String(m.number || mi + 1).padStart(2, "0")}`;
  const baseLoc = named.BRD_V2_MODULES
    ? loc(named.BRD_V2_MODULES.startOffset, named.BRD_V2_MODULES.endOffset)
    : null;
  return {
    id: sid("brdmod", moduleKey, m.title || m.key || String(mi)),
    moduleKey,
    number: m.number,
    title: m.title,
    key: m.key,
    objective: m.objective,
    primaryUsers: m.primaryUsers,
    icon: m.icon,
    sourceType: "brd",
    source: baseLoc,
    tabs: (m.tabs || []).map((t, ti) => ({
      id: sid("brdtab", moduleKey, t.name || t.title || t.id || String(ti)),
      label: t.name || t.title || t.label || t,
      raw: typeof t === "string" ? { label: t } : t,
    })),
    buttons: (m.buttons || []).map((b, bi) => ({
      id: sid("brdbtn", moduleKey, b.name || b.label || b.title || String(bi)),
      label: b.name || b.label || b.title || b,
      raw: typeof b === "string" ? { label: b } : b,
    })),
    visuals: (m.visuals || []).map((v, vi) => ({
      id: sid("brdvis", moduleKey, String(vi)),
      text: typeof v === "string" ? v : v.text || v.title || JSON.stringify(v),
      raw: v,
    })),
    rules: (m.rules || []).map((r, ri) => ({
      id: sid("brdrule", moduleKey, String(ri)),
      text: typeof r === "string" ? r : r.text || r.title || JSON.stringify(r),
      raw: r,
    })),
    flows: (m.flows || []).map((f, fi) => ({
      id: sid("brdflow", moduleKey, f.title || String(fi)),
      title: f.title,
      kind: f.kind,
      steps: (f.steps || []).map((s, si) => ({
        id: sid("brdstep", moduleKey, f.title || String(fi), String(si)),
        text: typeof s === "string" ? s : s.text || JSON.stringify(s),
      })),
    })),
    outputs: (m.outputs || []).map((o, oi) => ({
      id: sid("brdout", moduleKey, String(oi)),
      text: typeof o === "string" ? o : o.text || o.title || JSON.stringify(o),
      raw: o,
    })),
  };
});

const blueprints = Object.entries(named.MODULE_BLUEPRINTS?.data || {}).map(
  ([key, m]) => {
    const moduleKey = `M${String(key).padStart(2, "0")}`;
    return {
      id: sid("bp", moduleKey),
      moduleKey,
      number: Number(key),
      name: m.name,
      family: m.family,
      routes: m.routes,
      accent: m.accent,
      icon: m.icon,
      summary: m.summary,
      sourceType: "blueprint",
      source: named.MODULE_BLUEPRINTS
        ? loc(
            named.MODULE_BLUEPRINTS.startOffset,
            named.MODULE_BLUEPRINTS.endOffset
          )
        : null,
      metrics: (m.metrics || []).map((x, i) => ({
        id: sid("bpmetric", moduleKey, String(i)),
        raw: x,
      })),
      patterns: (m.patterns || []).map((x, i) => ({
        id: sid("bppattern", moduleKey, String(i)),
        raw: x,
      })),
      flows: (m.flows || []).map((f, fi) => ({
        id: sid("bpflow", moduleKey, f.id || f.title || String(fi)),
        flowId: f.id,
        title: f.title,
        purpose: f.purpose,
        steps: (f.steps || []).map((s, si) => ({
          id: sid("bpstep", moduleKey, f.id || String(fi), String(si)),
          text: typeof s === "string" ? s : JSON.stringify(s),
        })),
      })),
    };
  }
);

const legacyWorkflows = Object.entries(named.WORKFLOWS?.data || {}).map(
  ([group, steps]) => ({
    id: sid("legwf", group),
    group,
    sourceType: "legacy-workflow",
    source: named.WORKFLOWS
      ? loc(named.WORKFLOWS.startOffset, named.WORKFLOWS.endOffset)
      : null,
    steps: (Array.isArray(steps) ? steps : []).map((s, si) => ({
      id: sid("legstep", group, String(si)),
      text: typeof s === "string" ? s : JSON.stringify(s),
    })),
  })
);

const fieldGroups = Object.entries(fieldSchemas).map(([group, fields]) => ({
  id: sid("fgrp", group),
  group,
  sourceType: "field-schema",
  fields: (Array.isArray(fields) ? fields : []).map((f, fi) => ({
    id: sid("field", group, f.name || String(fi)),
    name: f.name,
    label: f.label,
    type: f.type,
    required: !!f.required,
    options: f.options || f.choices || undefined,
    validation: f.validation || f.pattern || undefined,
    roleHints: f.roles || f.role || undefined,
    clinicScoped: f.clinicScoped ?? f.clinic ?? undefined,
  })),
}));

// Cross-links: BRD module key ↔ blueprint ↔ modules-dict / nav labels
const modulesDict = named.MODULES?.data || {};
const crossLinks = [];
for (const b of blueprints) {
  crossLinks.push({
    id: sid("xlink", b.moduleKey, "blueprint-brd"),
    moduleKey: b.moduleKey,
    blueprintId: b.id,
    brdId: brdModules.find((m) => m.moduleKey === b.moduleKey)?.id || null,
    routes: b.routes,
    name: b.name,
    family: b.family,
  });
}

// ── Totals ──────────────────────────────────────────────────────
const totals = {
  platformModuleBlueprints: blueprints.length,
  detailedBrdModules: brdModules.length,
  brdTabs: brdModules.reduce((n, m) => n + m.tabs.length, 0),
  brdButtons: brdModules.reduce((n, m) => n + m.buttons.length, 0),
  brdVisualRequirements: brdModules.reduce((n, m) => n + m.visuals.length, 0),
  brdBusinessRules: brdModules.reduce((n, m) => n + m.rules.length, 0),
  brdWorkflows: brdModules.reduce((n, m) => n + m.flows.length, 0),
  brdWorkflowSteps: brdModules.reduce(
    (n, m) => n + m.flows.reduce((a, f) => a + f.steps.length, 0),
    0
  ),
  brdOutputs: brdModules.reduce((n, m) => n + m.outputs.length, 0),
  blueprintMetrics: blueprints.reduce((n, m) => n + m.metrics.length, 0),
  blueprintPatterns: blueprints.reduce((n, m) => n + m.patterns.length, 0),
  blueprintWorkflows: blueprints.reduce((n, m) => n + m.flows.length, 0),
  blueprintWorkflowSteps: blueprints.reduce(
    (n, m) => n + m.flows.reduce((a, f) => a + f.steps.length, 0),
    0
  ),
  formSchemaGroups: fieldGroups.length,
  fieldDefinitions: fieldGroups.reduce((n, g) => n + g.fields.length, 0),
  extractedModals: modals.length,
  legacyWorkflowGroups: legacyWorkflows.length,
  legacyWorkflowSteps: legacyWorkflows.reduce((n, g) => n + g.steps.length, 0),
  legacyModuleKeys: Object.keys(modulesDict).length,
  rawButtons: rawButtons.length,
  rawInputs: rawInputs.length,
  rawSelects: rawSelects.length,
  rawTextareas: rawTextareas.length,
  scopeConflictHits: scopeConflicts.length,
  sensitivePatternClasses: sensitiveSeedHits.length,
};

const minimumBaseline = {
  platformModuleBlueprints: 24,
  detailedBrdModules: 20,
  brdTabs: 182,
  brdButtons: 323,
  brdVisualRequirements: 100,
  brdBusinessRules: 109,
  brdWorkflows: 107,
  brdWorkflowSteps: 629,
  brdOutputs: 155,
  blueprintMetrics: 96,
  blueprintPatterns: 96,
  blueprintWorkflows: 72,
  blueprintWorkflowSteps: 434,
  formSchemaGroups: 41,
  fieldDefinitions: 398,
  extractedModals: 56,
  legacyWorkflowGroups: 28,
  legacyWorkflowSteps: 137,
  legacyModuleKeys: 35,
};

const baselineDelta = {};
for (const [k, min] of Object.entries(minimumBaseline)) {
  baselineDelta[k] = {
    minimum: min,
    observed: totals[k],
    meetsOrExceeds: (totals[k] ?? 0) >= min,
  };
}

const themes = {
  themes: named.THEMES?.data || named.V29_THEMES?.data || null,
  themeLabels: named.THEME_LABELS?.data || named.V29_THEME_LABELS?.data || null,
  familyStyles: named.FAMILY_STYLES?.data || null,
};

// Screens: derive from BRD tabs + blueprint routes (canonical candidates)
const screens = [];
for (const b of blueprints) {
  const brd = brdModules.find((m) => m.moduleKey === b.moduleKey);
  const routes = Array.isArray(b.routes) ? b.routes : b.routes ? [b.routes] : [];
  const primaryRoute = routes[0] || null;
  if (brd?.tabs?.length) {
    for (const tab of brd.tabs) {
      screens.push({
        id: sid("screen", b.moduleKey, tab.label),
        moduleKey: b.moduleKey,
        moduleName: b.name || brd.title,
        family: b.family,
        route: primaryRoute,
        section: tab.label,
        sourceType: "brd-tab",
        purpose: brd.objective || b.summary,
        blueprintId: b.id,
        brdModuleId: brd.id,
        tabId: tab.id,
      });
    }
  } else {
    screens.push({
      id: sid("screen", b.moduleKey, "default"),
      moduleKey: b.moduleKey,
      moduleName: b.name,
      family: b.family,
      route: primaryRoute,
      section: "Overview",
      sourceType: "blueprint-default",
      purpose: b.summary,
      blueprintId: b.id,
      brdModuleId: brd?.id || null,
    });
  }
}

const tabsActions = brdModules.flatMap((m) => [
  ...m.tabs.map((t) => ({
    kind: "tab",
    moduleKey: m.moduleKey,
    id: t.id,
    label: t.label,
  })),
  ...m.buttons.map((b) => ({
    kind: "button",
    moduleKey: m.moduleKey,
    id: b.id,
    label: b.label,
  })),
]);

const workflowsOut = {
  brdWorkflows: brdModules.flatMap((m) =>
    m.flows.map((f) => ({ moduleKey: m.moduleKey, ...f }))
  ),
  blueprintWorkflows: blueprints.flatMap((m) =>
    m.flows.map((f) => ({ moduleKey: m.moduleKey, ...f }))
  ),
  legacyWorkflows,
};

const fieldsModals = {
  fieldGroups,
  modals,
  formGroups: named.GROUPS?.data || null,
};

const manifest = {
  extractor: "scripts/prototype-parity/extract-prototype.mjs",
  extractedAt: `deterministic:proto-${sha256.slice(0, 16)}`,
  prototypePath: "public/pulse-html-prototype.html",
  prototypeSha256: sha256,
  prototypeBytes: Buffer.byteLength(html),
  prototypeLines: html.split(/\n/).length,
  supersedes: {
    historicalRegister:
      "docs/architecture/hcdp-prototype-parity-register.json (11 rows; stale M07 wording; not SoT)",
    historicalMarkdown: "docs/architecture/HCDP_PROTOTYPE_PARITY_REGISTER.md",
    legacyExtractors:
      "scripts/extract-everything.js / extract-forms.js / extract-html-data.js (repaired to committed prototype path; outputs under src/lib/extracted remain historical runtime seeds)",
    reason:
      "New canonical extract uses hash-pinned committed prototype, stable IDs, source locations, raw-control reconciliation, and scope/privacy conflict detection.",
  },
  totals,
  minimumBaseline,
  baselineDelta,
  baselineAllMet: Object.values(baselineDelta).every((x) => x.meetsOrExceeds),
  namedExtractsPresent: Object.keys(named),
  outputFiles: [
    "PROTOTYPE_EXTRACTION_MANIFEST.json",
    "prototype-modules.json",
    "prototype-screens.json",
    "prototype-tabs-actions.json",
    "prototype-workflows.json",
    "prototype-fields-modals.json",
    "prototype-cross-links.json",
    "prototype-scope-conflicts.json",
    "prototype-raw-controls.json",
    "prototype-themes.json",
  ],
};

writeJson("PROTOTYPE_EXTRACTION_MANIFEST.json", manifest);
writeJson("prototype-modules.json", {
  brdModules,
  blueprints,
  modulesDictKeys: Object.keys(modulesDict),
  nav: named.NAV?.data || null,
  navGroups: named.NAV_GROUPS?.data || null,
});
writeJson("prototype-screens.json", { count: screens.length, screens });
writeJson("prototype-tabs-actions.json", {
  count: tabsActions.length,
  items: tabsActions,
});
writeJson("prototype-workflows.json", workflowsOut);
writeJson("prototype-fields-modals.json", fieldsModals);
writeJson("prototype-cross-links.json", { count: crossLinks.length, crossLinks });
writeJson("prototype-scope-conflicts.json", {
  conflicts: scopeConflicts,
  sensitiveSeedPatternHits: sensitiveSeedHits,
  note: "Sensitive seed values are not copied; only pattern presence is recorded.",
});
writeJson("prototype-raw-controls.json", {
  note: "Raw tag scans include dynamic-template repetitions; reconcile by stable source-location IDs, not raw counts alone.",
  buttons: rawButtons,
  inputs: rawInputs,
  selects: rawSelects,
  textareas: rawTextareas,
});
writeJson("prototype-themes.json", themes);

console.log(
  JSON.stringify(
    {
      sha256,
      baselineAllMet: manifest.baselineAllMet,
      totals,
      screens: screens.length,
      scopeConflicts: scopeConflicts.length,
    },
    null,
    2
  )
);

if (!manifest.baselineAllMet) {
  console.warn(
    "WARNING: one or more minimum baseline counts not met — review baselineDelta"
  );
  process.exitCode = 4;
}
