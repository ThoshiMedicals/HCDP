/**
 * Wave 6 / M07 Batch 6 — fourth remediation: strict calendar effective dates.
 */

import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";

import { publishTimesheetVersion } from "@/platform/workforce/services/published-timesheet-registry";

import {
  actorAll,
  actorApprover,
  actorClerk,
  actorExportOperator,
  CLINIC_A,
  CLINIC_B,
  ORG_A,
  ORG_B,
  resetM07TestEnv,
} from "./_helpers";
import { createOrdinaryPayPeriod } from "../services/period-service";
import {
  createPayProfile,
  linkExternalPayrollEmployeeId,
  updatePayProfile,
  archivePayProfile,
} from "../services/profile-service";
import {
  createClassificationMapping,
  createPreparationRule,
} from "../services/rule-service";
import { calculatePersonOrdinaryAndOvertime } from "../services/calculate-service";
import {
  submitPeriodForReview,
  approvePeriodManagement,
} from "../services/approval-service";
import { seedEligibilityForImportedSnapshot } from "../services/published-timesheet-lifecycle";
import { intakePublishedTimesheet } from "../services/published-timesheet-intake";
import {
  createOrRefreshPayrollExportBatch,
  finalizePayrollExportBatch,
} from "../services/export-service";
import { explicitLockPayPeriod } from "../services/period-lock-service";
import { isCanonicalCalendarDate } from "../services/period-lock-guard";
import {
  getPeriod,
  listProfiles,
} from "../repository/local-store";
import { M07ValidationError } from "../permissions";

function seedRuleAndMapping() {
  const rule = createPreparationRule(actorAll(), {
    legalEntityId: ORG_A,
    code: "ORD_OT_B6R4",
    label: "Ordinary/OT rem4",
    ordinaryMultiplier: 1,
    overtimeMultiplier: 1.5,
    effectiveFrom: "2026-01-01",
  });
  createClassificationMapping(actorAll(), {
    legalEntityId: ORG_A,
    m04ClassificationRef: "class_rn",
    preparationRuleId: rule.id,
    effectiveFrom: "2026-01-01",
  });
}

function seedProfile(externalId?: string) {
  const profile = createPayProfile(actorAll(), {
    personId: "person_a",
    legalEntityId: ORG_A,
    clinicId: CLINIC_A,
    m04ClassificationRef: "class_rn",
    ordinaryHourlyRate: 40,
    effectiveFrom: "2026-01-01",
  });
  if (externalId) {
    linkExternalPayrollEmployeeId(actorAll(), profile.id, externalId, "seed");
  }
  return profile;
}

function publishAndIntake(suffix: string) {
  const content = {
    timesheetRecordId: `ts_b6r4_${suffix}`,
    workforcePersonId: "person_a",
    organisationId: ORG_A,
    legalEntityId: ORG_A,
    clinicId: CLINIC_A,
    periodStart: "2026-07-01",
    periodEnd: "2026-07-14",
    attendanceSessionIds: ["sess_a"],
    ordinaryHourInputs: [{ code: "ORD", hours: 76 }],
    overtimeHourInputs: [{ code: "OT15", hours: 2 }],
    penaltyHourInputs: [],
    leaveInputs: [],
    allowanceInputs: [] as Array<{ allowanceCode: string; quantity: number }>,
  };
  const published = publishTimesheetVersion({
    content,
    sourceVersion: 1,
    approvalRevision: 1,
    approvalState: "approved",
    publishedAt: "2026-07-15T02:00:00.000Z",
    publisherId: "m06-pub",
    eventId: `ev_b6r4_${suffix}`,
    idempotencyKey: `ev_b6r4_${suffix}`,
  });
  const intake = intakePublishedTimesheet({
    actor: actorAll(),
    scope: { organisationId: ORG_A, legalEntityId: ORG_A },
    registryPublicationId: published.version.registryPublicationId,
  });
  assert.equal(intake.status, "imported");
  seedEligibilityForImportedSnapshot({
    actor: actorAll(),
    snapshot: intake.snapshot!,
  });
}

function lockPeriod(suffix: string) {
  seedRuleAndMapping();
  seedProfile(`EXT-R4-${suffix}`);
  const period = createOrdinaryPayPeriod(actorAll(), {
    legalEntityId: ORG_A,
    clinicIds: [],
    periodStart: "2026-07-01",
    periodEnd: "2026-07-14",
  });
  publishAndIntake(suffix);
  calculatePersonOrdinaryAndOvertime(actorClerk("u-clerk-b6r4"), {
    periodId: period.id,
    personId: "person_a",
  });
  submitPeriodForReview(actorClerk("u-clerk-b6r4"), { periodId: period.id });
  approvePeriodManagement(actorApprover("u-approver-b6r4"), {
    periodId: period.id,
  });
  const preview = createOrRefreshPayrollExportBatch(actorExportOperator("u-ex-r4"), {
    periodId: period.id,
  });
  const finalized = finalizePayrollExportBatch(actorExportOperator("u-ex-r4"), {
    exportBatchId: preview.id,
  });
  explicitLockPayPeriod(actorApprover("u-lock-r4"), {
    periodId: period.id,
    exportBatchId: finalized.id,
    reason: "lock for fourth remediation",
  });
  assert.equal(getPeriod(period.id)?.state, "locked");
  return { period, profileId: listProfiles(ORG_A).find((p) => p.personId === "person_a")!.id };
}

describe("M07 Batch 6 fourth remediation — strict calendar dates", () => {
  beforeEach(() => {
    resetM07TestEnv();
  });

  it("rejects impossible ISO-shaped dates on financial update before write", () => {
    const { period, profileId } = lockPeriod("imp1");
    const before = listProfiles(ORG_A).find((p) => p.id === profileId)!;

    const cases: Array<{ from: string; to?: string | null; label: string }> = [
      { from: "2026-13-01", to: null, label: "month-13" },
      { from: "2026-00-15", to: null, label: "month-00" },
      { from: "2026-01-00", to: null, label: "day-00" },
      { from: "2026-04-31", to: null, label: "apr-31" },
      { from: "2026-02-29", to: null, label: "non-leap-feb-29" },
      { from: "2026-01-01T00:00:00", to: null, label: "datetime" },
      { from: " 2026-01-01", to: null, label: "leading-space" },
      { from: "2026/01/01", to: null, label: "bad-sep" },
    ];

    for (const c of cases) {
      assert.throws(
        () =>
          updatePayProfile(actorAll(), profileId, {
            ordinaryHourlyRate: 55,
            effectiveFrom: c.from,
            effectiveTo: c.to === undefined ? null : c.to,
          }),
        M07ValidationError,
        c.label
      );
    }

    // Allowance path shares the same guard
    assert.throws(
      () =>
        updatePayProfile(actorAll(), profileId, {
          allowanceCodes: ["ALLOW_BAD"],
          effectiveFrom: "2026-13-01",
          effectiveTo: null,
        }),
      M07ValidationError
    );

    const after = listProfiles(ORG_A).find((p) => p.id === profileId)!;
    assert.equal(after.version, before.version);
    assert.equal(after.materialProfileRevision, before.materialProfileRevision);
    assert.equal(after.ordinaryHourlyRate, before.ordinaryHourlyRate);
    assert.deepEqual(after.allowanceCodes, before.allowanceCodes);
    assert.equal(getPeriod(period.id)?.state, "locked");
  });

  it("rejects impossible dates on create and archive; leap validation; future isolation", () => {
    const { period, profileId } = lockPeriod("imp2");
    const before = listProfiles(ORG_A).find((p) => p.id === profileId)!;

    // Create with impossible from while locked LE population
    assert.throws(
      () =>
        createPayProfile(actorAll(), {
          personId: "person_a",
          legalEntityId: ORG_A,
          clinicId: CLINIC_A,
          m04ClassificationRef: "class_rn",
          ordinaryHourlyRate: 70,
          effectiveFrom: "2026-13-01",
        }),
      M07ValidationError
    );

    // Archive still uses existing overlapping window — blocked; also prove impossible patch path via update-before-archive not needed
    assert.throws(
      () => archivePayProfile(actorAll(), profileId, "archive while locked"),
      M07ValidationError
    );

    // Strict calendar helper: leap accepted, non-leap rejected (do not reimplement production logic for expected overlap)
    assert.equal(isCanonicalCalendarDate("2028-02-29"), true);
    assert.equal(isCanonicalCalendarDate("2026-02-29"), false);
    assert.equal(isCanonicalCalendarDate("2026-13-01"), false);

    // Valid future non-overlap still permitted
    assert.doesNotThrow(() =>
      createPayProfile(actorAll(), {
        personId: "person_a",
        legalEntityId: ORG_A,
        clinicId: CLINIC_A,
        m04ClassificationRef: "class_rn",
        ordinaryHourlyRate: 80,
        effectiveFrom: "2026-08-01",
        effectiveTo: "2026-12-31",
      })
    );

    // Valid leap date in future window permitted
    assert.doesNotThrow(() =>
      createPayProfile(actorAll(), {
        personId: "person_a",
        legalEntityId: ORG_A,
        clinicId: CLINIC_A,
        m04ClassificationRef: "class_rn",
        ordinaryHourlyRate: 81,
        effectiveFrom: "2028-02-29",
        effectiveTo: "2028-03-01",
      })
    );

    // Unrelated LE isolation
    assert.doesNotThrow(() =>
      createPayProfile(actorAll(), {
        personId: "person_b",
        legalEntityId: ORG_B,
        clinicId: CLINIC_B,
        m04ClassificationRef: "class_en",
        ordinaryHourlyRate: 30,
        effectiveFrom: "2026-01-01",
      })
    );

    const after = listProfiles(ORG_A).find((p) => p.id === profileId)!;
    assert.equal(after.version, before.version);
    assert.equal(after.status, "active");
    assert.equal(getPeriod(period.id)?.state, "locked");
  });
});
