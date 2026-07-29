/**
 * Wave 6 / M07 Batch 6 — second remediation high-risk controls.
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
  versionPreparationRule,
} from "../services/rule-service";
import { calculatePersonOrdinaryAndOvertime } from "../services/calculate-service";
import {
  submitPeriodForReview,
  approvePeriodManagement,
} from "../services/approval-service";
import { openPayPrepException } from "../services/exception-service";
import { seedEligibilityForImportedSnapshot } from "../services/published-timesheet-lifecycle";
import { intakePublishedTimesheet } from "../services/published-timesheet-intake";
import {
  createOrRefreshPayrollExportBatch,
  finalizePayrollExportBatch,
} from "../services/export-service";
import { downloadPayrollExportArtifact } from "../services/export-download-service";
import { reconcileExportBatchAgainstApproval } from "../services/reconciliation-service";
import { explicitLockPayPeriod } from "../services/period-lock-service";
import {
  requestPeriodUnlock,
  approvePeriodUnlock,
} from "../services/period-unlock-service";
import { __setM07AuditFailForTests } from "../services/audit-service";
import { __setM02InboxFailForTests } from "../adapters/m02-inbox-publish";
import { rejectLockedPeriodSourceChange } from "../services/period-lock-guard";
import {
  getCurrentExportBatchForPeriod,
  getPeriod,
  getUnlockRequest,
  listProfiles,
  upsertExportBatch,
} from "../repository/local-store";
import { M07ValidationError } from "../permissions";

function seedRuleAndMapping() {
  const rule = createPreparationRule(actorAll(), {
    legalEntityId: ORG_A,
    code: "ORD_OT_B6R2",
    label: "Ordinary/OT rem2",
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
  return rule;
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
    timesheetRecordId: `ts_b6r2_${suffix}`,
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
    eventId: `ev_b6r2_${suffix}`,
    idempotencyKey: `ev_b6r2_${suffix}`,
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

function prepareApproved(suffix: string) {
  seedRuleAndMapping();
  seedProfile(`EXT-R2-${suffix}`);
  const period = createOrdinaryPayPeriod(actorAll(), {
    legalEntityId: ORG_A,
    clinicIds: [],
    periodStart: "2026-07-01",
    periodEnd: "2026-07-14",
  });
  publishAndIntake(suffix);
  calculatePersonOrdinaryAndOvertime(actorClerk("u-clerk-b6r2"), {
    periodId: period.id,
    personId: "person_a",
  });
  submitPeriodForReview(actorClerk("u-clerk-b6r2"), { periodId: period.id });
  approvePeriodManagement(actorApprover("u-approver-b6r2"), {
    periodId: period.id,
  });
  return { period };
}

function lockPeriod(suffix: string) {
  const { period } = prepareApproved(suffix);
  const preview = createOrRefreshPayrollExportBatch(actorExportOperator("u-ex-r2"), {
    periodId: period.id,
  });
  const finalized = finalizePayrollExportBatch(actorExportOperator("u-ex-r2"), {
    exportBatchId: preview.id,
  });
  explicitLockPayPeriod(actorApprover("u-lock-r2"), {
    periodId: period.id,
    exportBatchId: finalized.id,
    reason: "lock rem2",
  });
  assert.equal(getPeriod(period.id)?.state, "locked");
  return { period, finalized };
}

describe("M07 Batch 6 second remediation", () => {
  beforeEach(() => {
    resetM07TestEnv();
  });

  describe("omit-metadata and exceptions", () => {
    it("rejects period-scoped exception without periodId", () => {
      assert.throws(
        () =>
          openPayPrepException(actorClerk(), {
            legalEntityId: ORG_A,
            organisationId: ORG_A,
            clinicId: CLINIC_A,
            personId: "person_a",
            kind: "missing-rate",
            message: "no period",
          }),
        (e: unknown) =>
          e instanceof M07ValidationError && e.reason === "missing-period-context"
      );
    });

    it("allows non-period boundary exception without periodId", () => {
      assert.doesNotThrow(() =>
        openPayPrepException(actorClerk(), {
          legalEntityId: ORG_A,
          organisationId: ORG_A,
          clinicId: CLINIC_A,
          personId: "person_a",
          kind: "doctor-pay-excluded",
          message: "doctor",
        })
      );
    });
  });

  describe("rate / effective-date lock", () => {
    it("blocks rate overlapping locked period; allows future non-overlapping rate", () => {
      const { period } = lockPeriod("rate1");
      const profileId = listProfiles(ORG_A).find((p) => p.personId === "person_a")!.id;

      assert.throws(
        () => updatePayProfile(actorAll(), profileId, { ordinaryHourlyRate: 55 }),
        M07ValidationError
      );

      // Future-dated profile effective window that does not overlap locked Jul period
      assert.doesNotThrow(() =>
        createPayProfile(actorAll(), {
          personId: "person_a",
          legalEntityId: ORG_A,
          clinicId: CLINIC_A,
          m04ClassificationRef: "class_rn",
          ordinaryHourlyRate: 60,
          effectiveFrom: "2026-08-01",
          effectiveTo: "2026-12-31",
        })
      );

      // Unrelated LE remains writable
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

      assert.throws(
        () => archivePayProfile(actorAll(), profileId, "archive while locked"),
        M07ValidationError
      );
      assert.equal(getPeriod(period.id)?.state, "locked");
    });
  });

  describe("external payroll employee id", () => {
    it("rejects link/relink affecting locked period", () => {
      lockPeriod("extid");
      const profileId = listProfiles(ORG_A).find((p) => p.personId === "person_a")!.id;
      assert.throws(
        () =>
          linkExternalPayrollEmployeeId(actorAll(), profileId, "EXT-NEW-LOCKED", "relink"),
        M07ValidationError
      );
    });
  });

  describe("preparation rules", () => {
    it("rejects rule create for LE with locked overlapping period; allows other LE", () => {
      lockPeriod("rule1");
      assert.throws(
        () =>
          createPreparationRule(actorAll(), {
            legalEntityId: ORG_A,
            code: "BLOCKED",
            label: "blocked",
            overtimeMultiplier: 2,
            effectiveFrom: "2026-01-01",
          }),
        M07ValidationError
      );
      assert.doesNotThrow(() =>
        createPreparationRule(actorAll(), {
          legalEntityId: ORG_B,
          code: "OTHER",
          label: "other le",
          effectiveFrom: "2026-01-01",
        })
      );
      // Future-only rule on ORG_A that does not overlap Jul locked period
      assert.doesNotThrow(() =>
        createPreparationRule(actorAll(), {
          legalEntityId: ORG_A,
          code: "FUTURE",
          label: "future",
          effectiveFrom: "2026-08-01",
          effectiveTo: "2026-12-31",
        })
      );
    });
  });

  describe("unlock atomicity and recovery", () => {
    it("keeps period locked on control failure; retry completes after recovery", () => {
      const { period } = lockPeriod("unlatom");
      const req = requestPeriodUnlock(actorExportOperator("u-ex-r2"), {
        periodId: period.id,
        reason: "Need unlock recovery",
      });

      __setM07AuditFailForTests(true);
      assert.throws(
        () =>
          approvePeriodUnlock(actorApprover("u-lock-r2"), {
            unlockRequestId: req.id,
          }),
        (e: unknown) =>
          e instanceof M07ValidationError && e.reason === "unlock-control-incomplete"
      );
      __setM07AuditFailForTests(false);

      assert.equal(getPeriod(period.id)?.state, "locked");
      const incomplete = getUnlockRequest(req.id)!;
      assert.equal(incomplete.status, "controls-incomplete");

      // Ordinary mutation still blocked
      assert.throws(
        () =>
          calculatePersonOrdinaryAndOvertime(actorClerk(), {
            periodId: period.id,
            personId: "person_a",
          }),
        M07ValidationError
      );

      // Retry resumes and completes
      const done = approvePeriodUnlock(actorApprover("u-lock-r2"), {
        unlockRequestId: req.id,
      });
      assert.equal(done.status, "approved");
      assert.equal(getPeriod(period.id)?.state, "open");

      // Idempotent completed approve
      const again = approvePeriodUnlock(actorApprover("u-lock-r2"), {
        unlockRequestId: req.id,
      });
      assert.equal(again.id, done.id);
      assert.equal(again.status, "approved");
    });

    it("retries after M02-only failure without opening period early", () => {
      const { period } = lockPeriod("unlm02");
      const req = requestPeriodUnlock(actorExportOperator("u-ex-r2"), {
        periodId: period.id,
        reason: "m02 fail path",
      });
      __setM02InboxFailForTests(true);
      assert.throws(
        () =>
          approvePeriodUnlock(actorApprover("u-lock-r2"), {
            unlockRequestId: req.id,
          }),
        (e: unknown) =>
          e instanceof M07ValidationError && e.reason === "unlock-control-incomplete"
      );
      __setM02InboxFailForTests(false);
      assert.equal(getPeriod(period.id)?.state, "locked");
      const done = approvePeriodUnlock(actorApprover("u-lock-r2"), {
        unlockRequestId: req.id,
      });
      assert.equal(done.status, "approved");
      assert.equal(getPeriod(period.id)?.state, "open");
    });
  });

  describe("locked-source control pair", () => {
    it("reports incomplete on M02-only and audit-only failures; preserves lock", () => {
      const { period } = lockPeriod("srcpair");

      __setM07AuditFailForTests(true);
      assert.throws(
        () =>
          rejectLockedPeriodSourceChange(actorAll(), {
            periodId: period.id,
            reason: "audit-only",
          }),
        (e: unknown) =>
          e instanceof M07ValidationError &&
          e.reason === "locked-source-control-incomplete"
      );
      __setM07AuditFailForTests(false);

      __setM02InboxFailForTests(true);
      assert.throws(
        () =>
          rejectLockedPeriodSourceChange(actorAll(), {
            periodId: period.id,
            reason: "m02-only",
          }),
        (e: unknown) =>
          e instanceof M07ValidationError &&
          e.reason === "locked-source-control-incomplete"
      );
      __setM02InboxFailForTests(false);
      assert.equal(getPeriod(period.id)?.state, "locked");
    });
  });

  describe("reconciliation category independence", () => {
    it("fails when category composition differs but gross totals match", () => {
      const { period } = prepareApproved("reconcat");
      const preview = createOrRefreshPayrollExportBatch(actorExportOperator("u-ex-r2"), {
        periodId: period.id,
      });
      const finalized = finalizePayrollExportBatch(actorExportOperator("u-ex-r2"), {
        exportBatchId: preview.id,
      });
      const canon = finalized.finalizedCanonical!;
      // Independently forge: move ordinary units into overtime category (same unit totals)
      const forgedLines = canon.lines.map((l) => {
        if (l.category === "ordinary") {
          return {
            ...l,
            category: "overtime" as const,
            lineClassification: "overtime",
          };
        }
        return l;
      });
      upsertExportBatch({
        ...finalized,
        finalizedCanonical: {
          ...canon,
          lines: forgedLines,
          totals: { ...canon.totals },
        },
        reconciliationStatus: "matched",
      });

      const recon = reconcileExportBatchAgainstApproval(actorExportOperator("u-ex-r2"), {
        exportBatchId: finalized.id,
      });
      assert.notEqual(recon.status, "matched");

      assert.throws(
        () =>
          downloadPayrollExportArtifact(actorExportOperator("u-ex-r2"), {
            exportBatchId: finalized.id,
          }),
        M07ValidationError
      );
      assert.throws(
        () =>
          explicitLockPayPeriod(actorApprover("u-lock-r2"), {
            periodId: period.id,
            exportBatchId: finalized.id,
            reason: "should block",
          }),
        M07ValidationError
      );
      void getCurrentExportBatchForPeriod(period.id);
    });
  });
});
