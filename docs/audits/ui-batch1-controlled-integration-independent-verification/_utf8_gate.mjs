import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const ev = "docs/audits/ui-batch1-controlled-integration-independent-verification";
mkdirSync(ev, { recursive: true });
const lines = [];

const nameStatus = execFileSync(
  "git",
  [
    "diff",
    "--name-status",
    "a15d325a5e6dd13a6da216e929aaef38440b8361",
    "e5e41a0d79c8b84d3380c4c85372dcc95b0a78b8",
  ],
  { encoding: "utf8" }
);
lines.push("=== a15d325...e5e41a0 name-status ===");
lines.push(nameStatus.trim() || "(empty)");

let checkOut = "";
try {
  checkOut = execFileSync(
    "git",
    [
      "diff",
      "--check",
      "a15d325a5e6dd13a6da216e929aaef38440b8361",
      "e5e41a0d79c8b84d3380c4c85372dcc95b0a78b8",
    ],
    { encoding: "utf8" }
  );
} catch (e) {
  checkOut = String(e.stdout || e.stderr || e);
}
lines.push("=== git diff --check ===");
lines.push(checkOut.trim() || "(clean)");

const path = "docs/audits/HCDP_UI_BATCH1_CONTROLLED_INTEGRATION_REPORT.md";
const raw = readFileSync(path);
const bom = raw[0] === 0xef && raw[1] === 0xbb && raw[2] === 0xbf;
const text = raw.toString("utf8").replace(/^\uFEFF/, "");
lines.push(`BOM=${bom}`);
lines.push(`starts_with_exact=${text.startsWith("# HCDP \u2014")}`);
lines.push(`first_20=${JSON.stringify(text.slice(0, 20))}`);

const corrupted = {
  emdash_mojibake: "â€”",
  arrow_mojibake: "â†’",
  ellipsis_mojibake: "â€¦",
  apos_mojibake: "â€™",
  bom_mojibake: "ï»¿",
};
for (const [label, seq] of Object.entries(corrupted)) {
  lines.push(`corrupted_${label}_present=${text.includes(seq)}`);
}
lines.push(`contains_real_emdash=${text.includes("\u2014")}`);
lines.push(`contains_real_arrow=${text.includes("\u2192")}`);

const prod = execFileSync(
  "git",
  [
    "diff",
    "--name-only",
    "a15d325a5e6dd13a6da216e929aaef38440b8361",
    "e5e41a0d79c8b84d3380c4c85372dcc95b0a78b8",
    "--",
    ".",
    ":(exclude)docs",
  ],
  { encoding: "utf8" }
);
lines.push(`non_docs_diff_empty=${prod.trim() === ""}`);

for (const m of [
  "25de6f1",
  "def2c69",
  "a15d325",
  "22348",
  "localhost:3000",
  "7c14854a",
  "PASS",
  "QUALIFIED",
  "FAIL",
  "residual",
]) {
  lines.push(`marker_${m}=${text.includes(m)}`);
}

const rows = text
  .split(/\r?\n/)
  .filter((ln) => /\|\s*(PASS|QUALIFIED|FAIL|BLOCKED)\s*\|/.test(ln));
lines.push(`verdict_table_rows=${rows.length}`);
for (const ln of rows) lines.push("VERDICT_ROW: " + ln.trim());

const out = join(ev, "utf8-correction-gate.txt");
writeFileSync(out, lines.join("\n"), "utf8");
console.log(lines.join("\n"));
