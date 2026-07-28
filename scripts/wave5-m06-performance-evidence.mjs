/**
 * Optional dedicated Wave 5 performance evidence runner.
 * Prefer `npm run test:m06` (includes m06-performance.test.ts) which writes the JSON.
 * This script re-runs the performance test file only.
 */

import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

const child = spawn(
  "npx",
  ["tsx", "--test", "src/modules/m06-time-attendance/tests/m06-performance.test.ts"],
  { cwd: REPO_ROOT, shell: true, stdio: "inherit" }
);
child.on("close", (code) => {
  process.exit(code ?? 1);
});
