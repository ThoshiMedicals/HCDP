import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import {
  calculatePayrollContentHash,
  sha256HexUtf8,
  canonicalPayrollJson,
} from "../../../src/platform/workforce/contracts/published-timesheet-hash.ts";

const content = {
  organisationId: "org_demo_a",
  legalEntityId: "org_demo_a",
  workforcePersonId: "person_a",
  periodStart: "2026-07-01",
  periodEnd: "2026-07-14",
  timesheetRecordId: "ts_vector_1",
  attendanceSessionIds: ["sess_a", "sess_b"],
  ordinaryHourInputs: [{ code: "ORD", hours: 8, localDate: "2026-07-02" }],
  overtimeHourInputs: [],
  penaltyHourInputs: [],
  leaveInputs: [],
  allowanceInputs: [],
};

const expected =
  "7c14854a626ff6fa8c042174ef933e59ccb90bff104631011e2f003d29f6ee83";

const calc = calculatePayrollContentHash(content);
const canonical = canonicalPayrollJson(content);
const pure = sha256HexUtf8(canonical);
const node = createHash("sha256").update(canonical, "utf8").digest("hex");
const result = {
  expected,
  calc,
  pure,
  node,
  exact: calc === expected && pure === expected && node === expected,
  canonical,
  verifiedAt: new Date().toISOString(),
};

writeFileSync(
  new URL("./hash-vector-result.json", import.meta.url),
  JSON.stringify(result, null, 2)
);
console.log(JSON.stringify(result, null, 2));
if (!result.exact) process.exit(2);
