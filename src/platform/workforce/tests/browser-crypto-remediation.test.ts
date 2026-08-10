/**
 * Browser-crypto remediation — known vector, Node parity, barrel boundary guards.
 */

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

import type { PublishedTimesheetPayrollContent } from "../contracts/published-timesheet-contract";
import {
  calculatePayrollContentHash,
  canonicalPayrollJson,
  sha256HexUtf8,
} from "../contracts/published-timesheet-hash";

const ROOT = process.cwd();
const HASH_SRC = join(ROOT, "src/platform/workforce/contracts/published-timesheet-hash.ts");
const SHA_HELPER_SRC = join(ROOT, "src/platform/workforce/contracts/sha256-hex-utf8.ts");
const M06_INDEX = join(ROOT, "src/modules/m06-time-attendance/index.ts");
const M07_INDEX = join(ROOT, "src/modules/m07-staff-pay/index.ts");
const MODULE_WORKSPACE = join(ROOT, "src/components/workspaces/ModuleWorkspace.tsx");

const KNOWN_VECTOR_CONTENT: PublishedTimesheetPayrollContent = {
  timesheetRecordId: "ts_vector_1",
  workforcePersonId: "person_a",
  organisationId: "org_demo_a",
  legalEntityId: "org_demo_a",
  periodStart: "2026-07-01",
  periodEnd: "2026-07-14",
  attendanceSessionIds: ["sess_a", "sess_b"],
  ordinaryHourInputs: [{ code: "ORD", hours: 8, localDate: "2026-07-02" }],
  overtimeHourInputs: [],
  penaltyHourInputs: [],
  leaveInputs: [],
  allowanceInputs: [],
};

const KNOWN_CANONICAL_JSON =
  '{"allowanceInputs":[],"attendanceSessionIds":["sess_a","sess_b"],"leaveInputs":[],"legalEntityId":"org_demo_a","ordinaryHourInputs":[{"code":"ORD","hours":8,"localDate":"2026-07-02"}],"organisationId":"org_demo_a","overtimeHourInputs":[],"penaltyHourInputs":[],"periodEnd":"2026-07-14","periodStart":"2026-07-01","timesheetRecordId":"ts_vector_1","workforcePersonId":"person_a"}';

const KNOWN_SHA256_HEX =
  "7c14854a626ff6fa8c042174ef933e59ccb90bff104631011e2f003d29f6ee83";

describe("browser-crypto remediation: known hash vector", () => {
  it("preserves pre-captured canonical JSON and SHA-256 hex", () => {
    const json = canonicalPayrollJson(KNOWN_VECTOR_CONTENT);
    assert.equal(json, KNOWN_CANONICAL_JSON);
    assert.equal(calculatePayrollContentHash(KNOWN_VECTOR_CONTENT), KNOWN_SHA256_HEX);
  });

  it("matches node:crypto createHash sha256 utf8 digest for known vector", () => {
    const json = canonicalPayrollJson(KNOWN_VECTOR_CONTENT);
    const nodeHex = createHash("sha256").update(json, "utf8").digest("hex");
    assert.equal(sha256HexUtf8(json), nodeHex);
    assert.equal(nodeHex, KNOWN_SHA256_HEX);
  });

  it("matches node:crypto for empty, ascii, and multi-byte UTF-8 strings", () => {
    const samples = ["", "a", "hello", "café", "日本語", "🙂", "a".repeat(1000)];
    for (const s of samples) {
      const nodeHex = createHash("sha256").update(s, "utf8").digest("hex");
      assert.equal(sha256HexUtf8(s), nodeHex, `mismatch for ${JSON.stringify(s)}`);
    }
  });
});

describe("browser-crypto remediation: source boundary", () => {
  it("published-timesheet-hash.ts does not import node:crypto", () => {
    const src = readFileSync(HASH_SRC, "utf8");
    assert.ok(!src.includes("node:crypto"));
    assert.ok(!src.includes('from "crypto"'));
    assert.ok(src.includes('from "./sha256-hex-utf8"'));
  });

  it("sha256-hex-utf8.ts is pure sync (no crypto module imports / Web Crypto)", () => {
    const src = readFileSync(SHA_HELPER_SRC, "utf8");
    assert.doesNotMatch(src, /from\s+["']node:crypto["']/);
    assert.doesNotMatch(src, /require\s*\(\s*["']node:crypto["']\s*\)/);
    assert.doesNotMatch(src, /crypto\.subtle/);
    assert.ok(!src.includes("import { createHash"));
    assert.ok(src.includes("export function sha256HexUtf8"));
  });

  it("m06 client barrel does not re-export adapters", () => {
    const src = readFileSync(M06_INDEX, "utf8");
    assert.ok(!/export\s+\*\s+from\s+["']\.\/adapters["']/.test(src));
    assert.ok(src.includes("TimeAttendanceModule"));
  });

  it("m07 client barrel does not re-export adapters or services", () => {
    const src = readFileSync(M07_INDEX, "utf8");
    assert.ok(!/export\s+\*\s+from\s+["']\.\/adapters["']/.test(src));
    assert.ok(!/export\s+\*\s+from\s+["']\.\/services["']/.test(src));
    assert.ok(src.includes("StaffPayModule"));
  });

  it("ModuleWorkspace imports UI modules from client barrels only", () => {
    const src = readFileSync(MODULE_WORKSPACE, "utf8");
    assert.ok(src.includes('from "@/modules/m06-time-attendance"'));
    assert.ok(src.includes('from "@/modules/m07-staff-pay"'));
    assert.ok(!src.includes("/adapters"));
    assert.ok(!src.includes("published-timesheet-hash"));
    assert.ok(!src.includes("node:crypto"));
  });
});
