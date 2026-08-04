#!/usr/bin/env node
/**
 * Wrapper: run IV findings remediation validator with OUT forced to
 * agent-regression/prod-matrix. Does not modify the repo script.
 *
 * Repo script already honors HCDP_OUT_DIR / HCDP_BASE_URL; this wrapper
 * pins those for the regression auditor evidence path.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const WT = process.env.HCDP_WT || "/tmp/hcdp-fix/ui-batch1-reg-3493";
const OUT_ABS = join(HERE, "prod-matrix");
// Repo script does join(cwd, HCDP_OUT_DIR). On this Node, an absolute second
// segment is treated as relative (leading "/" stripped). Pass cwd-relative OUT.
const OUT_REL = relative(WT, OUT_ABS);
const BASE = process.env.HCDP_BASE_URL || "http://127.0.0.1:3493";
const MODE = process.env.HCDP_MODE || "production";
const APP_SHA =
  process.env.HCDP_APP_SHA || "d68040688cbf76fb1f8715c27aa06ad6ff72242c";

mkdirSync(OUT_ABS, { recursive: true });
mkdirSync(join(HERE, "logs"), { recursive: true });

const script = join(WT, "scripts/ui-batch1-iv-findings-remediation-validate.mjs");
const logPath = join(HERE, "logs", "29-prod-matrix.log");

const env = {
  ...process.env,
  HCDP_BASE_URL: BASE,
  HCDP_OUT_DIR: OUT_REL,
  HCDP_MODE: MODE,
  HCDP_APP_SHA: APP_SHA,
  FORCE_COLOR: "0",
  CI: "1",
};

const started = new Date().toISOString();
writeFileSync(
  join(OUT_ABS, "run-meta.pre.json"),
  JSON.stringify(
    {
      startedUtc: started,
      base: BASE,
      outAbs: OUT_ABS,
      outRel: OUT_REL,
      mode: MODE,
      appSha: APP_SHA,
      script,
      cwd: WT,
      note: "Wrapper only; repo validate.mjs unmodified. Historical prod-matrix-v3 not touched. Uses cwd-relative HCDP_OUT_DIR.",
    },
    null,
    2
  )
);

const r = spawnSync("node", [script], {
  cwd: WT,
  encoding: "utf8",
  env,
  maxBuffer: 128 * 1024 * 1024,
});
const out = `${r.stdout || ""}${r.stderr || ""}`;
writeFileSync(logPath, out);
writeFileSync(
  join(OUT_ABS, "run-meta.post.json"),
  JSON.stringify(
    {
      finishedUtc: new Date().toISOString(),
      exitCode: r.status === null ? 124 : r.status,
      logPath: "logs/29-prod-matrix.log",
    },
    null,
    2
  )
);
console.log(out);
process.exit(r.status === null ? 124 : r.status);
