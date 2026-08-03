import { createHash } from "node:crypto";
import { writeFileSync, mkdirSync } from "node:fs";
import {
  calculatePayrollContentHash,
  canonicalPayrollJson,
  sha256HexUtf8,
} from "../../../src/platform/workforce/contracts/published-timesheet-hash.ts";
import type { PublishedTimesheetPayrollContent } from "../../../src/platform/workforce/contracts/published-timesheet-contract.ts";

const EXPECTED =
  "7c14854a626ff6fa8c042174ef933e59ccb90bff104631011e2f003d29f6ee83";

const content: PublishedTimesheetPayrollContent = {
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

const canonical = canonicalPayrollJson(content);
const calc = calculatePayrollContentHash(content);
const pure = sha256HexUtf8(canonical);
const node = createHash("sha256").update(canonical, "utf8").digest("hex");

const out = {
  expected: EXPECTED,
  calc,
  pure,
  node,
  canonical,
  exact: calc === EXPECTED && pure === EXPECTED && node === EXPECTED,
  verifiedAt: new Date().toISOString(),
  branch: "cursor/ui-batch1-controlled-integration-independent-verification",
  tip: "e5e41a0d79c8b84d3380c4c85372dcc95b0a78b8",
};

mkdirSync(
  "docs/audits/ui-batch1-controlled-integration-independent-verification",
  { recursive: true }
);
writeFileSync(
  "docs/audits/ui-batch1-controlled-integration-independent-verification/hash-vector-result.json",
  JSON.stringify(out, null, 2)
);
console.log(JSON.stringify(out, null, 2));
process.exit(out.exact ? 0 : 1);
