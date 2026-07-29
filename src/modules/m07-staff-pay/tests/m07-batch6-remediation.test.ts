/**
 * Wave 6 / M07 Batch 6 remediation — high-risk lock, source-change, recon,
 * download audit, unlock control, lifecycle matrix tests.
 */

import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";

import { publishTimesheetVersion } from "@/platform/workforce/services/published-timesheet-registry";
import { findInboxActionForSource } from "@/platform/services/action-inbox-bridge";

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
} from "../services/profile-service";
import {
  createClassificationMapping,
  createPreparationRule,
} from "../services/rule-service";
import { createGenericCode } from "../services/code-service";
import { calculatePersonOrdinaryAndOvertime } from "../services/calculate-service";
import {
  submitPeriodForReview,
  approvePeriodManagement,
} from "../services/approval-service";
import { generateLeavePreparationForPerson } from "../services/leave-prep-service";
import { createDeductionPrepInput } from "../services/deduction-prep-input-service";
import { openPayPrepException } from "../services/exception-service";
import { seedEligibilityForImportedSnapshot } from "../services/published-timesheet-lifecycle";
import { intakePublishedTimesheet } from "../services/published-timesheet-intake";
import { assertExportBatchTransition } from "../services/export-lifecycle";
import {
  createOrRefreshPayrollExportBatch,
  finalizePayrollExportBatch,
  cancelPayrollExportBatch,
} from "../services/export-service";
import { downloadPayrollExportArtifact } from "../services/export-download-service";
import { reconcileExportBatchAgainstApproval } from "../services/reconciliation-service";
import { explicitLockPayPeriod } from "../services/period-lock-service";
import {
  requestPeriodUnlock,
  approvePeriodUnlock,
} from "../services/period-unlock-service";
import { setM07AuditFailForTests } from "../services/audit-service";
import { multiplyUnitsRate, unitsEqual } from "../services/export-decimal";
import { rejectLockedPeriodSourceChange } from "../services/period-lock-guard";
import { notifyM04EmploymentContextChanged } from "../services/approval-invalidation";
import {
  getCurrentExportBatchForPeriod,
  getPeriod,
  listAudit,
  listProfiles,
  upsertExportBatch,
} from "../repository/local-store";
import { M07ValidationError } from "../permissions";
import type { PayrollExportBatchStatus } from "../types/domain";

function isLockedErr(e: unknown): boolean {
  return (
    e instanceof M07ValidationError &&
    (e.reason === "period-locked" ||
      e.reason === "period-locked-source-change" ||
      e.reason === "locked-source-control-incomplete")
  );
}

function seedRuleAndMapping() {
  const rule = createPreparationRule(actorAll(), {
    legalEntityId: ORG_A,
    code: "ORD_OT_B6R",
    label: "Ordinary/OT prep rem",
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
    timesheetRecordId: `ts_b6r_${suffix}`,
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
    eventId: `ev_b6r_${suffix}`,
    idempotencyKey: `ev_b6r_${suffix}`,
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
  return intake.snapshot!;
}

function prepareApproved(suffix: string) {
  seedRuleAndMapping();
  seedProfile(`EXT-R-${suffix}`);
  const period = createOrdinaryPayPeriod(actorAll(), {
    legalEntityId: ORG_A,
    clinicIds: [],
    periodStart: "2026-07-01",
    periodEnd: "2026-07-14",
  });
  publishAndIntake(suffix);
  calculatePersonOrdinaryAndOvertime(actorClerk("u-clerk-b6r"), {
    periodId: period.id,
    personId: "person_a",
  });
  submitPeriodForReview(actorClerk("u-clerk-b6r"), { periodId: period.id });
  const approved = approvePeriodManagement(actorApprover("u-approver-b6r"), {
    periodId: period.id,
  });
  return { period, approved };
}

function lockPeriod(suffix: string) {
  const { period } = prepareApproved(suffix);
  const preview = createOrRefreshPayrollExportBatch(actorExportOperator("u-ex-r"), {
    periodId: period.id,
  });
  const finalized = finalizePayrollExportBatch(actorExportOperator("u-ex-r"), {
    exportBatchId: preview.id,
  });
  const lock = explicitLockPayPeriod(actorApprover("u-lock-r"), {
    periodId: period.id,
    exportBatchId: finalized.id,
    reason: "lock for remediation tests",
  });
  assert.equal(getPeriod(period.id)?.state, "locked");
  return { period, finalized, lock };
}

describe("M07 Batch 6 remediation — high-risk controls", () => {
  beforeEach(() => {
    resetM07TestEnv();
  });

  describe("A. Lock enforcement", () => {
    it("rejects direct service mutations on a locked period; unrelated LE unaffected", () => {
      const dedCode = createGenericCode(actorAll(), {
        legalEntityId: ORG_A,
        code: "DED_R",
        label: "Deduction rem",
        lineType: "deduction",
        effectiveFrom: "2026-01-01",
      });
      const { period } = lockPeriod("lockmut");
      const profileId = listProfiles(ORG_A).find((p) => p.personId === "person_a")!.id;

      assert.throws(
        () =>
          createGenericCode(actorAll(), {
            legalEntityId: ORG_A,
            code: "DED_LOCKED",
            label: "blocked while locked",
            lineType: "deduction",
            effectiveFrom: "2026-01-01",
          }),
        isLockedErr
      );
      assert.throws(
        () =>
          calculatePersonOrdinaryAndOvertime(actorClerk(), {
            periodId: period.id,
            personId: "person_a",
          }),
        isLockedErr
      );
      assert.throws(
        () => submitPeriodForReview(actorClerk(), { periodId: period.id }),
        isLockedErr
      );
      assert.throws(
        () => approvePeriodManagement(actorApprover(), { periodId: period.id }),
        isLockedErr
      );
      assert.throws(
        () =>
          generateLeavePreparationForPerson(actorClerk(), {
            periodId: period.id,
            personId: "person_a",
          }),
        isLockedErr
      );
      assert.throws(
        () =>
          createDeductionPrepInput(actorClerk(), {
            periodId: period.id,
            personId: "person_a",
            codeId: dedCode.id,
            quantity: 1,
            reason: "test",
            clinicId: CLINIC_A,
          }),
        isLockedErr
      );
      assert.throws(
        () =>
          openPayPrepException(actorClerk(), {
            legalEntityId: ORG_A,
            organisationId: ORG_A,
            clinicId: CLINIC_A,
            personId: "person_a",
            periodId: period.id,
            kind: "missing-rate",
            message: "x",
          }),
        isLockedErr
      );
      assert.throws(
        () => updatePayProfile(actorAll(), profileId, { leavePayMapping: "annual" }),
        isLockedErr
      );
      assert.throws(
        () =>
          notifyM04EmploymentContextChanged(actorAll(), {
            legalEntityId: ORG_A,
            personId: "person_a",
            reason: "employment-change",
          }),
        isLockedErr
      );
      assert.throws(
        () =>
          cancelPayrollExportBatch(actorAll(), {
            exportBatchId: getCurrentExportBatchForPeriod(period.id)!.id,
            reason: "try cancel locked",
          }),
        isLockedErr
      );

      const other = createOrdinaryPayPeriod(actorAll(), {
        legalEntityId: ORG_B,
        clinicIds: [],
        periodStart: "2026-07-01",
        periodEnd: "2026-07-14",
      });
      assert.equal(getPeriod(other.id)?.state, "open");
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
    });
  });

  describe("B. Locked-source-change controls", () => {
    it("fails closed, projects deterministic M02, audits, preserves history; no silent mutate", () => {
      const { period, finalized, lock } = lockPeriod("srcchg");
      const beforeStatus = finalized.status;
      const beforeChecksum = finalized.artifact?.checksum;

      assert.throws(
        () =>
          rejectLockedPeriodSourceChange(actorAll(), {
            periodId: period.id,
            reason: "authoritative-source-change",
          }),
        (e: unknown) =>
          e instanceof M07ValidationError &&
          (e.reason === "period-locked-source-change" ||
            e.reason === "locked-source-control-incomplete")
      );

      const staleAudits = listAudit(ORG_A).filter(
        (a) => a.action === "export-batch.stale-source-detected"
      );
      assert.ok(staleAudits.length >= 1);

      const logicalKey = `locked-source::${period.id}::${lock.id}`;
      const inbox1 = findInboxActionForSource(
        "staff-pay",
        "period-lock-source-change",
        logicalKey
      );
      const exportInbox = findInboxActionForSource(
        "staff-pay",
        "payroll-export-batch",
        finalized.identityKey
      );
      assert.ok(inbox1 || exportInbox);

      assert.throws(
        () =>
          rejectLockedPeriodSourceChange(actorAll(), {
            periodId: period.id,
            reason: "authoritative-source-change-retry",
          }),
        M07ValidationError
      );

      const batch = getCurrentExportBatchForPeriod(period.id)!;
      assert.equal(batch.status, beforeStatus);
      assert.equal(batch.artifact?.checksum, beforeChecksum);
      assert.equal(getPeriod(period.id)?.state, "locked");
    });

    it("does not report success when audit control fails", () => {
      const { period } = lockPeriod("srcaud");
      setM07AuditFailForTests(true);
      assert.throws(
        () =>
          rejectLockedPeriodSourceChange(actorAll(), {
            periodId: period.id,
            reason: "audit-fail-path",
          }),
        (e: unknown) =>
          e instanceof M07ValidationError &&
          e.reason === "locked-source-control-incomplete"
      );
      setM07AuditFailForTests(false);
      assert.equal(getPeriod(period.id)?.state, "locked");
    });
  });

  describe("C. Reconciliation independence", () => {
    it("fails when totals match but population differs", () => {
      const { period } = prepareApproved("reconpop");
      const preview = createOrRefreshPayrollExportBatch(actorExportOperator("u-ex-r"), {
        periodId: period.id,
      });
      const finalized = finalizePayrollExportBatch(actorExportOperator("u-ex-r"), {
        exportBatchId: preview.id,
      });
      assert.equal(finalized.reconciliationStatus, "matched");

      const canon = finalized.finalizedCanonical!;
      const forgedLines = canon.lines.map((l, i) =>
        i === 0 ? { ...l, personId: "person_forged_other" } : l
      );
      upsertExportBatch({
        ...finalized,
        finalizedCanonical: { ...canon, lines: forgedLines, totals: { ...canon.totals } },
      });

      const recon = reconcileExportBatchAgainstApproval(actorExportOperator("u-ex-r"), {
        exportBatchId: finalized.id,
      });
      assert.notEqual(recon.status, "matched");
      assert.ok(recon.mismatches.some((m) => m.code === "population-mismatch"));

      assert.throws(
        () =>
          downloadPayrollExportArtifact(actorExportOperator("u-ex-r"), {
            exportBatchId: finalized.id,
          }),
        M07ValidationError
      );
      assert.throws(
        () =>
          explicitLockPayPeriod(actorApprover("u-lock-r"), {
            periodId: period.id,
            exportBatchId: finalized.id,
            reason: "should block",
          }),
        M07ValidationError
      );
    });

    it("fails when totals match but source-line references differ", () => {
      const { period } = prepareApproved("reconline");
      const preview = createOrRefreshPayrollExportBatch(actorExportOperator("u-ex-r"), {
        periodId: period.id,
      });
      const finalized = finalizePayrollExportBatch(actorExportOperator("u-ex-r"), {
        exportBatchId: preview.id,
      });
      const canon = finalized.finalizedCanonical!;
      const forgedLines = canon.lines.map((l, i) =>
        i === 0 ? { ...l, sourceLineId: `forged_${l.sourceLineId}` } : l
      );
      upsertExportBatch({
        ...finalized,
        finalizedCanonical: { ...canon, lines: forgedLines },
      });
      const recon = reconcileExportBatchAgainstApproval(actorExportOperator("u-ex-r"), {
        exportBatchId: finalized.id,
      });
      assert.notEqual(recon.status, "matched");
      assert.ok(
        recon.mismatches.some(
          (m) =>
            m.code === "line-reference-mismatch" || m.code === "source-line-coverage"
        )
      );
    });
  });

  describe("D. Download audit failure", () => {
    it("refuses download, records no success history, leaves artifact unchanged", () => {
      const { period } = prepareApproved("dlaud");
      const preview = createOrRefreshPayrollExportBatch(actorExportOperator("u-ex-r"), {
        periodId: period.id,
      });
      const finalized = finalizePayrollExportBatch(actorExportOperator("u-ex-r"), {
        exportBatchId: preview.id,
      });
      const beforeBody = finalized.artifactBody;
      const beforeHist = finalized.downloadHistory.length;
      const beforeChecksum = finalized.artifact?.checksum;

      setM07AuditFailForTests(true);
      assert.throws(
        () =>
          downloadPayrollExportArtifact(actorExportOperator("u-ex-r"), {
            exportBatchId: finalized.id,
          }),
        (e: unknown) => e instanceof M07ValidationError && e.reason === "audit-failed"
      );
      setM07AuditFailForTests(false);

      const after = getCurrentExportBatchForPeriod(period.id)!;
      assert.equal(after.downloadHistory.length, beforeHist);
      assert.equal(after.artifactBody, beforeBody);
      assert.equal(after.artifact?.checksum, beforeChecksum);
      assert.equal(
        listAudit(ORG_A).filter((a) => a.action === "export-batch.downloaded").length,
        0
      );
    });
  });

  describe("E. Unlock partial failure", () => {
    it("does not report complete success when audit fails during unlock approval", () => {
      const { period } = lockPeriod("unlfail");
      const req = requestPeriodUnlock(actorExportOperator("u-ex-r"), {
        periodId: period.id,
        reason: "Need remediation path",
      });
      setM07AuditFailForTests(true);
      assert.throws(
        () =>
          approvePeriodUnlock(actorApprover("u-lock-r"), {
            unlockRequestId: req.id,
          }),
        (e: unknown) =>
          e instanceof M07ValidationError && e.reason === "unlock-control-incomplete"
      );
      setM07AuditFailForTests(false);
      // Period remains operationally locked until controls complete
      assert.equal(getPeriod(period.id)?.state, "locked");
      assert.ok(req.id);
    });
  });

  describe("F. Lifecycle matrix", () => {
    it("covers legal and illegal Batch 6 transitions including failed", () => {
      const legal: Array<[PayrollExportBatchStatus, PayrollExportBatchStatus]> = [
        ["draft", "validating"],
        ["validating", "blocked"],
        ["validating", "ready"],
        ["blocked", "validating"],
        ["ready", "finalized"],
        ["ready", "failed"],
        ["finalized", "downloadable"],
        ["finalized", "failed"],
        ["finalized", "superseded"],
        ["finalized", "cancelled"],
        ["downloadable", "superseded"],
        ["downloadable", "cancelled"],
        ["failed", "superseded"],
        ["draft", "cancelled"],
      ];
      for (const [from, to] of legal) {
        assert.doesNotThrow(() => assertExportBatchTransition(from, to), `${from}->${to}`);
      }

      const illegal: Array<[PayrollExportBatchStatus, PayrollExportBatchStatus]> = [
        ["cancelled", "ready"],
        ["finalized", "draft"],
        ["downloadable", "ready"],
        ["superseded", "downloadable"],
        ["failed", "downloadable"],
        ["failed", "ready"],
        ["blocked", "finalized"],
      ];
      for (const [from, to] of illegal) {
        assert.throws(
          () => assertExportBatchTransition(from, to),
          M07ValidationError,
          `${from}->${to}`
        );
      }

      assert.doesNotThrow(() => assertExportBatchTransition("finalized", "finalized"));
    });
  });

  describe("J. Decimal arithmetic", () => {
    it("uses scaled multiply for overtime amount edge cases", () => {
      const amount = multiplyUnitsRate(0.1, 0.2, 1.5);
      assert.equal(amount, 0.03);
      assert.ok(unitsEqual(multiplyUnitsRate(76, 40, 1), 3040));
      assert.ok(unitsEqual(multiplyUnitsRate(2, 40, 1.5), 120));
    });
  });
});
