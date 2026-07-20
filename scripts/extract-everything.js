/**
 * Extract EVERYTHING usable from the HTML prototype into src/lib/extracted/.
 * Run: node scripts/extract-everything.js
 */
const fs = require("fs");
const path = require("path");

const htmlPath = path.join(
  "c:/Users/ETB Sri Lanka/Desktop/HCDP",
  "Healthcare_Doctors_Pulse_Executive_Healthcare_Operations_Platform_v34_Stronger_Navigation_Palette.html"
);
const outDir = path.join(process.cwd(), "src", "lib", "extracted");
const publicDir = path.join(process.cwd(), "public");
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(publicDir, { recursive: true });

const html = fs.readFileSync(htmlPath, "utf8");
console.log("HTML bytes:", html.length);

// Also ship the HTML as-is for full fidelity viewing
fs.copyFileSync(
  htmlPath,
  path.join(publicDir, "pulse-html-prototype.html")
);
console.log("copied HTML to public/pulse-html-prototype.html");

function writeJson(name, data) {
  fs.writeFileSync(path.join(outDir, name + ".json"), JSON.stringify(data, null, 2));
  const meta = Array.isArray(data)
    ? `n=${data.length}`
    : typeof data === "object" && data
      ? `keys=${Object.keys(data).length}`
      : typeof data;
  console.log("wrote", name, meta);
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
      if (depth === 0) return html.slice(i, j + 1);
    }
  }
  throw new Error("unbalanced " + name);
}

function evalExpr(expr, prelude = "") {
  return Function(`"use strict"; ${prelude}; return (${expr});`)();
}

function tryExtract(name, outName = name.toLowerCase().replace(/_/g, "-")) {
  try {
    const data = evalExpr(sliceAssign(name));
    writeJson(outName, data);
    return data;
  } catch (e) {
    console.warn("SKIP", name, e.message);
    return null;
  }
}

// ── Core seeds ──────────────────────────────────────────────
const checklistItems = tryExtract("CHECKLIST_TEMPLATE_ITEMS", "checklist-template-items");
try {
  const checklists = evalExpr(
    sliceAssign("SEED_CHECKLISTS"),
    `const CHECKLIST_TEMPLATE_ITEMS = ${JSON.stringify(checklistItems || {})}`
  );
  writeJson("checklists", checklists);
} catch (e) {
  console.warn("SEED_CHECKLISTS", e.message);
}

[
  ["SEED_LOCATIONS", "locations"],
  ["SEED_DOCTORS", "doctors"],
  ["SEED_STAFF", "staff"],
  ["SEED_ACCREDITATION_RECORDS", "accreditation"],
  ["RISK_SEED", "risk-seed"],
  ["COMPLIANCE_SEED", "compliance-seed"],
  ["FAMILY_STYLES", "family-styles"],
  ["WORKFLOWS", "workflows"],
  ["TASK_DEPARTMENTS", "task-departments"],
  ["DEPT_ROLE_MAP", "dept-role-map"],
  ["ACCESS", "access"],
  ["ROLE_ACCESS", "role-access"],
  ["SPECIAL_ROUTES", "special-routes"],
  ["RECORD_KEYS", "record-keys"],
  ["V29_BASE_CLINICS", "v29-clinics"],
  ["V29_BASE_RISKS", "v29-risks"],
  ["GROUPS", "form-groups"],
  ["GROUP_ORDER", "form-group-order"],
  ["EXEC_ROLES", "exec-roles"],
  ["THEMES", "themes"],
  ["THEME_LABELS", "theme-labels"],
  ["BRD_V2_MODULES", "brd-modules"],
  ["MODULE_BLUEPRINTS", "module-blueprints"],
  ["NAV", "nav"],
  ["NAV_GROUPS", "nav_groups"],
].forEach(([src, out]) => tryExtract(src, out));

// ── FIELD_SCHEMAS — evaluate AFTER all patches by sweeping addFieldsOnce ──
// Strategy: extract base FIELD_SCHEMAS, then also scrape every FIELD_SCHEMAS.xxx = / addFieldsOnce call
let fieldSchemas = null;
try {
  fieldSchemas = evalExpr(sliceAssign("FIELD_SCHEMAS"));
  console.log("base FIELD_SCHEMAS keys:", Object.keys(fieldSchemas).length);
} catch (e) {
  console.warn("FIELD_SCHEMAS base", e.message);
  fieldSchemas = {};
}

// Find later FIELD_SCHEMAS.xxx = [...] assignments
const assignRe = /FIELD_SCHEMAS\.([A-Za-z0-9_]+)\s*=\s*/g;
let am;
while ((am = assignRe.exec(html))) {
  const key = am[1];
  const start = am.index + am[0].length;
  let i = start;
  while (/\s/.test(html[i])) i++;
  if (html[i] !== "[") continue;
  try {
    let depth = 0;
    let inStr = false;
    let strCh = "";
    let escape = false;
    let end = -1;
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
    const expr = html.slice(i, end + 1);
    const val = evalExpr(expr);
    fieldSchemas[key] = val;
    console.log("patched FIELD_SCHEMAS." + key, "fields=", val.length);
  } catch (e) {
    console.warn("patch FIELD_SCHEMAS." + key, e.message);
  }
}

// addFieldsOnce('key', [...]) patterns
const addOnceRe = /addFieldsOnce\s*\(\s*['"]([A-Za-z0-9_]+)['"]\s*,\s*/g;
let om;
while ((om = addOnceRe.exec(html))) {
  const key = om[1];
  let i = om.index + om[0].length;
  while (/\s/.test(html[i])) i++;
  if (html[i] !== "[") continue;
  try {
    let depth = 0;
    let inStr = false;
    let strCh = "";
    let escape = false;
    let end = -1;
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
    console.log("addFieldsOnce", key, "→", merged.length, "fields");
  } catch (e) {
    console.warn("addFieldsOnce", key, e.message);
  }
}

writeJson("field-schemas", fieldSchemas);

// ── Task wizard from openTaskForm ──
function extractFunctionBody(fnName) {
  const re = new RegExp(
    `(?:window\\.)?${fnName}\\s*=\\s*function\\s*\\([^)]*\\)\\s*\\{`
  );
  const m = html.match(re);
  if (!m) return null;
  const start = m.index + m[0].length - 1;
  let depth = 0;
  for (let j = start; j < html.length; j++) {
    if (html[j] === "{") depth++;
    if (html[j] === "}") {
      depth--;
      if (depth === 0) return html.slice(start + 1, j);
    }
  }
  return null;
}

function extractTemplateLiteralForms(fnBody) {
  if (!fnBody) return [];
  const forms = [];
  // match showModal('Title', `html`, ...)
  const re = /showModal\(\s*['"]([^'"]+)['"]\s*,\s*`([\s\S]*?)`\s*,/g;
  let m;
  while ((m = re.exec(fnBody))) {
    forms.push({ title: m[1], html: m[2] });
  }
  // also showDrawer patterns
  const re2 = /showDrawer\(\s*['"]([^'"]+)['"]\s*,\s*`([\s\S]*?)`/g;
  while ((m = re2.exec(fnBody))) {
    forms.push({ title: m[1], html: m[2], kind: "drawer" });
  }
  return forms;
}

function parseFieldsFromFormHtml(formHtml) {
  const fields = [];
  // select fields
  const selectRe =
    /<div class="field([^"]*)">\s*<label>([^<]+)<\/label>\s*<select[^>]*name="([^"]+)"[^>]*>([\s\S]*?)<\/select>/g;
  let m;
  while ((m = selectRe.exec(formHtml))) {
    const options = [...m[4].matchAll(/<option[^>]*>([^<]*)<\/option>/g)].map(
      (x) => x[1].trim()
    );
    fields.push({
      name: m[3],
      label: m[2].replace(/\s*\*$/, "").trim(),
      type: "select",
      required: m[2].includes("*"),
      full: m[1].includes("full"),
      options: options.filter(Boolean),
    });
  }
  // inputs
  const inputRe =
    /<div class="field([^"]*)">\s*<label>([^<]+)<\/label>\s*<input([^>]*)>/g;
  while ((m = inputRe.exec(formHtml))) {
    const attrs = m[3];
    const name = (attrs.match(/name="([^"]+)"/) || [])[1];
    if (!name) continue;
    const type = (attrs.match(/type="([^"]+)"/) || [])[1] || "text";
    const placeholder = (attrs.match(/placeholder="([^"]*)"/) || [])[1] || "";
    const required = attrs.includes("required") || m[2].includes("*");
    fields.push({
      name,
      label: m[2].replace(/\s*\*$/, "").trim(),
      type: type === "email" || type === "date" || type === "number" ? type : "text",
      required,
      full: m[1].includes("full"),
      placeholder: placeholder.replace(/&#10;/g, "\n"),
    });
  }
  // textareas
  const taRe =
    /<div class="field([^"]*)">\s*<label>([^<]+)<\/label>\s*<textarea([^>]*)>([\s\S]*?)<\/textarea>/g;
  while ((m = taRe.exec(formHtml))) {
    const attrs = m[3];
    const name = (attrs.match(/name="([^"]+)"/) || [])[1];
    if (!name) continue;
    const placeholder = (attrs.match(/placeholder="([^"]*)"/) || [])[1] || "";
    fields.push({
      name,
      label: m[2].replace(/\s*\*$/, "").trim(),
      type: "textarea",
      required: attrs.includes("required") || m[2].includes("*"),
      full: true,
      placeholder: placeholder.replace(/&#10;/g, "\n"),
    });
  }
  // checkbox labels
  const cbRe =
    /<input type="checkbox" name="([^"]+)"([^>]*)>\s*([^<]+)/g;
  while ((m = cbRe.exec(formHtml))) {
    fields.push({
      name: m[1],
      label: m[3].trim(),
      type: "checkbox",
      default: m[2].includes("checked"),
    });
  }
  // dedupe by name keeping first
  const seen = new Set();
  return fields.filter((f) => {
    if (seen.has(f.name)) return false;
    seen.add(f.name);
    return true;
  });
}

// Extract known wizards
const wizardFns = [
  ["openChecklistWizard", "checklist-wizard", "Create Checklist", "Publish Checklist"],
  ["openStaffWizard", "staff-wizard", "Add Staff", "Add & Send Invite"],
  ["openTaskForm", "task-wizard", "Create Task", "Create Task"],
  ["openPrinterFleetModal", "printer-wizard", "Printer Fleet", "Save Printer"],
  ["openInventoryOCR", "inventory-ocr-wizard", "Inventory OCR", "Save"],
  ["openDepartmentModal", "department-wizard", "Department", "Save"],
];

for (const [fn, out, title, submit] of wizardFns) {
  const body = extractFunctionBody(fn);
  if (!body) {
    console.warn("no fn", fn);
    continue;
  }
  fs.writeFileSync(path.join(outDir, out + ".js.txt"), body);
  const forms = extractTemplateLiteralForms(body);
  if (!forms.length) {
    // try showModal with concatenated strings / different pattern
    console.warn("no template forms in", fn, "- saved js.txt only");
    continue;
  }
  const form = forms[0];
  const fields = parseFieldsFromFormHtml(form.html);
  // tabs from wizard-tabs
  const tabs = [...form.html.matchAll(/<span>([^<]+)<\/span>/g)].map((x) => x[1]);
  writeJson(out, {
    title: form.title || title,
    tabs,
    fields,
    submitLabel: submit,
    sourceHtml: form.html,
  });
}

// ── Extract all showModal create/edit templates globally ──
const allModals = [];
const modalRe = /showModal\(\s*['"]([^'"]+)['"]\s*,\s*`([\s\S]*?)`\s*,/g;
let mm;
while ((mm = modalRe.exec(html))) {
  allModals.push({
    title: mm[1],
    fields: parseFieldsFromFormHtml(mm[2]),
    htmlLength: mm[2].length,
  });
}
writeJson("all-modals-index", allModals);
console.log("modals indexed:", allModals.length);

// ── V32 / V33 seed blobs ──
function extractObjectAfter(pattern) {
  const idx = html.search(pattern);
  if (idx < 0) return null;
  const brace = html.indexOf("{", idx);
  if (brace < 0) return null;
  let depth = 0;
  let inStr = false;
  let strCh = "";
  let escape = false;
  for (let j = brace; j < html.length; j++) {
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
    if (ch === "{") depth++;
    if (ch === "}") {
      depth--;
      if (depth === 0) {
        try {
          return evalExpr(html.slice(brace, j + 1));
        } catch (e) {
          console.warn("eval fail", e.message);
          return null;
        }
      }
    }
  }
  return null;
}

const v32 = extractObjectAfter(/state\.v32\s*=\s*|v32:\s*|seed\s*=\s*\{[\s\S]{0,40}vacancies/);
// Try more targeted
try {
  // Find vacancies array seed
  const vacIdx = html.indexOf("vacancies:");
  if (vacIdx > 0) {
    // walk back to nearest { for object containing vacancies
    let start = vacIdx;
    while (start > 0 && html[start] !== "{") start--;
    // better: find "const seed = {" near vacancies
  }
} catch (_) {}

// Search for printers seed push
const printers = [];
const printerPushRe = /printers\.push\(\s*(\{[\s\S]*?\})\s*\)/g;
let pm;
while ((pm = printerPushRe.exec(html))) {
  try {
    printers.push(evalExpr(pm[1]));
  } catch (_) {}
}
if (printers.length) writeJson("printers", printers);

// Extract seeded sample records from initial state builders
const seedArrays = [
  "tasks",
  "incidents",
  "rooms",
  "inventory",
  "stock",
  "equipment",
  "roster",
  "timeclock",
  "policies",
  "hrDocs",
  "training",
  "website",
  "memos",
  "commbook",
  "email",
  "sms",
  "noticeboards",
  "remote",
  "vault",
  "cameras",
  "qi",
  "staffpay",
  "doctorpay",
  "bbpip",
  "ticketing",
  "finance",
  "leave",
  "users",
  "departments",
];

for (const key of seedArrays) {
  // Look for SEED_KEY or records.key = [...]
  const candidates = [
    `SEED_${key.toUpperCase()}`,
    `SEED_${key.charAt(0).toUpperCase() + key.slice(1)}`,
  ];
  let found = false;
  for (const c of candidates) {
    if (html.includes(`const ${c}`) || html.includes(`let ${c}`) || html.includes(`var ${c}`)) {
      tryExtract(c, key + "-seed");
      found = true;
      break;
    }
  }
  if (!found) {
    // try records.xxx = [ demo rows often appear as pushes in boot
  }
}

// Extract MODULES dictionary labels
tryExtract("MODULES", "modules-dict");

// CSS :root block
const rootMatch = html.match(/:root\s*\{([\s\S]*?)\}/);
if (rootMatch) {
  const vars = {};
  const varRe = /--([a-zA-Z0-9-]+)\s*:\s*([^;]+);/g;
  let vm;
  while ((vm = varRe.exec(rootMatch[1]))) {
    vars[vm[1]] = vm[2].trim();
  }
  writeJson("css-root-vars", vars);
}

writeJson("extract-manifest", {
  extractedAt: new Date().toISOString(),
  htmlBytes: html.length,
  fieldSchemaKeys: Object.keys(fieldSchemas || {}),
  modalCount: allModals.length,
  printerCount: printers.length,
});

console.log("\nDONE. FIELD_SCHEMAS keys:", Object.keys(fieldSchemas || {}).length);
console.log(Object.keys(fieldSchemas || {}).join(", "));
