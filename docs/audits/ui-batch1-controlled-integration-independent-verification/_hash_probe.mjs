import { writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";

const ev = "docs/audits/ui-batch1-controlled-integration-independent-verification";
mkdirSync(ev, { recursive: true });
const require = createRequire(import.meta.url);
const EXPECTED =
  "7c14854a626ff6fa8c042174ef933e59ccb90bff104631011e2f003d29f6ee83";

// Use the same fixture approach as browser-crypto remediation tests if available
async function main() {
  const result = { expected: EXPECTED, implementations: {} };

  // Node createHash path
  // Prefer importing project helpers
  let fixtureBytes = null;
  let canonical = null;
  try {
    const { canonicalizePublishedTimesheetPayload } = await import(
      "../../../src/platform/workforce/published-timesheet.js"
    ).catch(() => ({ canonicalizePublishedTimesheetPayload: null }));
  } catch {}

  // Load vector from browser-crypto test / existing evidence
  const evidence = JSON.parse(
    await (
      await import("node:fs/promises")
    ).readFile(
      "docs/audits/ui-batch1-controlled-integration/hash-vector-result.json",
      "utf8"
    ).catch(async () =>
      (
        await import("node:fs/promises")
      ).readFile(
        "docs/audits/browser-crypto-remediation/hash-vector-result.json",
        "utf8"
      ).catch(() => "{}")
    )
  );

  // Compute using project pure hash if exportable
  const cryptoMod = await import(
    "../../../src/platform/workforce/browser-safe-crypto.js"
  ).catch(() => null);
  const hashMod = await import(
    "../../../src/platform/workforce/sha256.js"
  ).catch(() => null);

  // Discover helpers via dynamic try list
  const candidates = [
    "../src/platform/workforce/crypto/sha256-hex-utf8.ts",
    "../src/platform/workforce/sha256-hex-utf8.ts",
    "../src/platform/workforce/hash.ts",
  ];

  // Use tsx-compatible approach: spawn a tiny tsx eval?
  // Fall back: run the remediation unit which already asserts hash.
  // Independent: recreate using Node createHash on known canonical bytes from evidence.
  if (evidence?.canonicalUtf8 || evidence?.canonical) {
    canonical = evidence.canonicalUtf8 || evidence.canonical;
  }
  if (evidence?.digest) {
    result.evidenceDigest = evidence.digest;
  }

  // Minimal independent recompute if we find vector payload in report or test
  const { readFileSync } = await import("node:fs");
  const testSrc = readFileSync(
    "src/platform/workforce/tests/browser-crypto-remediation.test.ts",
    "utf8"
  );
  const m = testSrc.match(
    /7c14854a626ff6fa8c042174ef933e59ccb90bff104631011e2f003d29f6ee83/
  );
  result.testContainsExpected = Boolean(m);

  // Import via tsx register-less: use child process
  const { spawnSync } = await import("node:child_process");
  const script = `
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const EXPECTED = '${EXPECTED}';
async function load() {
  // Try common module paths used by remediation
  const tries = [
    './src/platform/workforce/sha256-hex-utf8.ts',
    './src/platform/workforce/crypto.ts',
    './src/platform/workforce/browser-crypto.ts',
  ];
  let sha256HexUtf8 = null;
  let modulePath = null;
  for (const p of tries) {
    try {
      const mod = await import(p);
      sha256HexUtf8 = mod.sha256HexUtf8 || mod.sha256Hex || mod.default;
      if (typeof sha256HexUtf8 === 'function') { modulePath = p; break; }
    } catch {}
  }
  // Also try published timesheet hash helpers
  let hashPublished = null;
  try {
    const mod = await import('./src/platform/workforce/published-timesheet-hash.ts');
    hashPublished = mod.hashPublishedTimesheetCanonical || mod.sha256HexUtf8 || null;
  } catch {}
  try {
    const mod = await import('./src/modules/m06-time-attendance/services/published-timesheet-hash.ts');
    hashPublished = hashPublished || mod.hashPublishedTimesheetCanonical || mod.sha256HexUtf8 || null;
  } catch {}

  // Read expected fixture from remediation test by executing hashing of its known payload if exported
  const rem = await import('./src/platform/workforce/tests/browser-crypto-remediation.test.ts').catch(()=>null);

  // Use createHash against empty as smoke; actual vector from suite
  const out = { modulePath, hasSha: typeof sha256HexUtf8 === 'function', hasPublished: typeof hashPublished === 'function', EXPECTED };
  // Re-run the focused browser-crypto hash assertions indirectly by importing implementation used in production
  const implPaths = [
    './src/platform/workforce/sha256-hex-utf8.ts',
  ];
  // Discover from source grep via dynamic import of the path referenced in remediation test
  const fs = await import('node:fs');
  const src = fs.readFileSync('./src/platform/workforce/tests/browser-crypto-remediation.test.ts','utf8');
  const imports = [...src.matchAll(/from ['\"](.+?)['\"]/g)].map(x=>x[1]);
  out.imports = imports;
  let digestPure = null;
  let digestNode = null;
  // Find fixture JSON/string nearby
  const vectorMatch = src.match(/KNOWN_[A-Z_]+|contentHash|canonical/);
  // Import the actual hash module paths from imports that look like local
  for (const rel of imports.filter(i => i.startsWith('.'))) {
    const base = './src/platform/workforce/tests/';
    try {
      const mod = await import(new URL(rel, 'file:///x/src/platform/workforce/tests/').pathname.replace(/^\\/x\\//,'./'));
    } catch {}
  }
  // Direct known path in codebase
  const pathCandidates = [
    '../sha256-hex-utf8.ts',
    '../../workforce/sha256-hex-utf8.ts',
  ];
  // Simpler: import using absolute-ish from CWD discovered via rg in runner parent
  const { execSync } = await import('node:child_process');
  const hits = execSync('rg -n "sha256HexUtf8|function sha256" src/platform/workforce --glob "*.ts" -g "!**/tests/**"', {encoding:'utf8'});
  out.hits = hits.trim().split(/\\r?\\n/).slice(0,20);
  console.log(JSON.stringify(out,null,2));
}
load();
`;
  // Too brittle. Use a focused approach:
  const find = spawnSync(
    "npx",
    [
      "tsx",
      "-e",
      `
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
const EXPECTED='${EXPECTED}';
const src=readFileSync('src/platform/workforce/tests/browser-crypto-remediation.test.ts','utf8');
// Find import of hash helper
const m=[...src.matchAll(/from ['\"](\\.\\.?\\/[^'\"]+)['\"]/g)].map(x=>x[1]);
let sha=null, path=null, calc=null;
for (const rel of m) {
  try {
    const url = new URL(rel, 'file:///./src/platform/workforce/tests/dummy.ts');
    // Resolve relative to tests dir
    let p = rel;
    if (rel.startsWith('.')) {
      // normalize
      const parts = ('src/platform/workforce/tests/' + rel).replace(/\\\\/g,'/').split('/');
      const stack=[];
      for (const part of parts) {
        if (part==='.'||part==='') continue;
        if (part==='..') stack.pop(); else stack.push(part);
      }
      p = stack.join('/');
    }
    const mod = await import('./' + p);
    for (const key of Object.keys(mod)) {
      if (/sha256|hash/i.test(key) && typeof mod[key]==='function') {
        // Try with known published timesheet fixture if present in module
      }
    }
    if (mod.sha256HexUtf8) { sha = mod.sha256HexUtf8; path=p; }
    if (mod.hashPublishedTimesheetContent) { calc = mod.hashPublishedTimesheetContent; path=p; }
  } catch (e) {}
}
// Also direct file search
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
function walk(d,acc=[]) {
  for (const ent of readdirSync(d,{withFileTypes:true})) {
    const p=join(d,ent.name);
    if (ent.isDirectory()) walk(p,acc); else if (p.endsWith('.ts')) acc.push(p);
  }
  return acc;
}
const files = walk('src/platform/workforce').filter(f=>!f.includes('tests'));
let impl=null, implPath=null;
for (const f of files) {
  const t=readFileSync(f,'utf8');
  if (t.includes('export function sha256HexUtf8') || t.includes('export async function sha256HexUtf8') || t.includes('export const sha256HexUtf8')) {
    const mod=await import('./'+f.replace(/\\\\/g,'/'));
    if (mod.sha256HexUtf8) { impl=mod.sha256HexUtf8; implPath=f; break; }
  }
}
// Load published timesheet calculator fixture from m06 or workforce
let payload=null;
for (const f of [...files, ...walk('src/modules/m06-time-attendance')]) {
  const t=readFileSync(f,'utf8');
  if (t.includes(EXPECTED.slice(0,16))) {
    // keep searching for fixture builder
  }
}
// Use remediation test's own expected via running hashing on EXAMPLE from registry tests
const reg=readFileSync('src/platform/workforce/tests/published-timesheet-registry.test.ts','utf8');
const remSrc=src;
// Extract a JSON fixture if present
const jsonMatch = remSrc.match(/const\\s+\\w+\\s*=\\s*(\\{[\\s\\S]*?\\})\\s*;/);
const out={implPath, hasImpl:!!impl, expected:EXPECTED};
if (impl) {
  // Prefer fixture from hash-vector existing if includes input
}
// Read committed evidence in this tip for input, if any
try {
  const hv=JSON.parse(readFileSync('docs/audits/ui-batch1-controlled-integration/hash-vector-result.json','utf8'));
  out.hv=hv;
  if (hv.input != null && impl) {
    const d=await Promise.resolve(impl(typeof hv.input==='string'?hv.input:JSON.stringify(hv.input)));
    out.pure=d;
    out.pureMatch=d===EXPECTED;
  }
  if (hv.canonicalUtf8) {
    const node=createHash('sha256').update(hv.canonicalUtf8,'utf8').digest('hex');
    out.nodeFromCanonical=node;
    out.nodeMatch=node===EXPECTED;
    if (impl) {
      const d=await Promise.resolve(impl(hv.canonicalUtf8));
      out.pureFromCanonical=d;
      out.pureFromCanonicalMatch=d===EXPECTED;
    }
  }
} catch(e){ out.hvErr=String(e); }
console.log(JSON.stringify(out,null,2));
`,
    ],
    { encoding: "utf8", shell: true, maxBuffer: 16 * 1024 * 1024 }
  );
  result.tsxOut = (find.stdout || "") + (find.stderr || "");
  result.exit = find.status;
  writeFileSync(`${ev}/hash-vector-result.json`, JSON.stringify(result, null, 2));
  console.log(result.tsxOut);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
