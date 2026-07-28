import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { writeJsonSafe } from "@/platform/storage/storage";
import { resetM07TestEnv, ORG_A } from "./_helpers";
import {
  listPublishedAssignmentsForPerson,
  getPublishedShift,
  M07_M05_ROSTER_READ_SOURCE,
} from "../adapters/m05-roster-read";
import {
  listApprovedTimesheetRefs,
  linkApprovedTimesheetToPeriod,
  M07_INTAKE_BATCH1_STATUS,
} from "../adapters/m06-timesheet-read";
import { resolvePersonIdentity, readM04ClassificationRef } from "../adapters/m04-person-read";
import { publishM07InboxProjection, listM07InboxProjections } from "../adapters/m02-inbox-publish";
import { publishM07ExecutiveSummary, getLastM07ExecutiveSummary } from "../adapters/m01-summary-publish";
import { createTimesheetRef } from "@/platform/workforce/contracts/timesheet-ref";
import { publishTimesheetVersion } from "@/platform/workforce/services/published-timesheet-registry";
import { acknowledgeApprovedTimesheetIntake } from "../../m06-time-attendance/adapters/m07-timesheet-bridge";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("M07 read-only boundaries (Batch 1)", () => {
  beforeEach(() => resetM07TestEnv());

  it("reads M04 identity as read-only", () => {
    const person = resolvePersonIdentity("person_a");
    assert.ok(person);
    assert.equal(person!.readOnly, true);
    assert.equal(readM04ClassificationRef("person_a"), "class_rn");
  });

  it("reads M05 published roster keys without writing", () => {
    writeJsonSafe("pulse.m05.roster.publications", [
      { id: "pub1", state: "published" },
    ]);
    writeJsonSafe("pulse.m05.roster.shifts", [
      { id: "sh1", clinicId: "loc_baldhills", localStart: "2026-07-01T09:00", localEnd: "2026-07-01T17:00" },
    ]);
    writeJsonSafe("pulse.m05.roster.assignments", [
      {
        id: "as1",
        shiftId: "sh1",
        personId: "person_a",
        clinicId: "loc_baldhills",
        state: "assigned",
        publicationId: "pub1",
      },
    ]);
    const assignments = listPublishedAssignmentsForPerson("person_a");
    assert.equal(assignments.length, 1);
    assert.equal(assignments[0]?.readOnly, true);
    assert.equal(getPublishedShift("sh1")?.readOnly, true);
    assert.equal(M07_M05_ROSTER_READ_SOURCE, "pulse.m05.roster.*");
  });

  it("discovers platform published timesheets but does not implement intake", () => {
    publishTimesheetVersion({
      content: {
        timesheetRecordId: "ts1",
        workforcePersonId: "person_a",
        organisationId: ORG_A,
        legalEntityId: "le_demo_a",
        clinicId: "loc_baldhills",
        periodStart: "2026-07-01",
        periodEnd: "2026-07-14",
        attendanceSessionIds: ["s1"],
        ordinaryHourInputs: [{ code: "ORD", hours: 38 }],
        overtimeHourInputs: [],
        penaltyHourInputs: [],
        leaveInputs: [],
        allowanceInputs: [],
      },
      sourceVersion: 1,
      approvalRevision: 1,
      approvalState: "approved",
      publishedAt: new Date().toISOString(),
      publisherId: "adapter-test",
      eventId: "adapter-evt-1",
      idempotencyKey: "adapter-evt-1",
    });
    const refs = listApprovedTimesheetRefs({
      organisationId: ORG_A,
      legalEntityId: "le_demo_a",
    });
    assert.equal(refs.length, 1);
    assert.equal(refs[0]?.readOnly, true);
    assert.equal(refs[0]?.intakeImplemented, false);
    const link = linkApprovedTimesheetToPeriod(
      "period_x",
      createTimesheetRef({
        recordId: "ts1",
        status: "approved",
        personId: "person_a",
        periodStart: "2026-07-01",
        periodEnd: "2026-07-14",
        approved: true,
      })
    );
    assert.equal(link.ok, false);
    assert.equal(link.blockedM07, false);
    assert.equal(M07_INTAKE_BATCH1_STATUS, "not-implemented");
  });

  it("publishes M02/M01 interface-only projections without rates", () => {
    publishM07InboxProjection({
      kind: "pay-period-open",
      title: "Period open",
      legalEntityId: ORG_A,
      entityId: "p1",
      severity: "info",
    });
    assert.equal(listM07InboxProjections().length, 1);
    const summary = publishM07ExecutiveSummary({
      legalEntityId: ORG_A,
      openPeriods: 1,
      profilesConfigured: 0,
      blockingExceptions: 0,
      exportReady: 0,
    });
    assert.equal(summary.containsRates, false);
    assert.equal(getLastM07ExecutiveSummary()?.sourceModule, "staff-pay");
  });

  it("keeps M06 bridge BLOCKED-M07 cleared", () => {
    const bridgePath = join(
      process.cwd(),
      "src/modules/m06-time-attendance/adapters/m07-timesheet-bridge.ts"
    );
    const src = readFileSync(bridgePath, "utf8");
    assert.match(src, /CLEARED-M07-BATCH2/);
    assert.equal(acknowledgeApprovedTimesheetIntake("x").blocked, false);
    assert.match(src, /blocked:\s*false/);
    assert.doesNotMatch(src, /writeJsonSafe/);
    assert.doesNotMatch(src, /pulse\.m07\.staffpay/);
  });
});
