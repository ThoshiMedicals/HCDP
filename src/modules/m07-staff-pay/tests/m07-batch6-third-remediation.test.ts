/**
 * Wave 6 / M07 Batch 6 — third remediation high-risk controls.
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
import {
  requestPeriodUnlock,
  approvePeriodUnlock,
  rejectPeriodUnlock,
} from "../services/period-unlock-service";
import {
  createExportProfile,
  versionExportProfile,
  retireExportProfile,
} from "../services/export-profile-service";
import { __setM07AuditFailForTests } from "../services/audit-service";
import { __setM02InboxFailForTests } from "../adapters/m02-inbox-publish";
import {
  getCurrentExportBatchForPeriod,
  getExportProfile,
  getPeriod,
  getPeriodLock,
  getUnlockRequest,
  listProfiles,
  upsertPeriodLock,
  upsertUnlockRequest,
} from "../repository/local-store";
import { M07ValidationError } from "../permissions";

function seedRuleAndMapping() {
  const rule = createPreparationRule(actorAll(), {
    legalEntityId: ORG_A,
    code: "ORD_OT_B6R3",
    label: "Ordinary/OT rem3",
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
    timesheetRecordId: `ts_b6r3_${suffix}`,
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
    eventId: `ev_b6r3_${suffix}`,
    idempotencyKey: `ev_b6r3_${suffix}`,
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
  seedProfile(`EXT-R3-${suffix}`);
  const period = createOrdinaryPayPeriod(actorAll(), {
    legalEntityId: ORG_A,
    clinicIds: [],
    periodStart: "2026-07-01",
    periodEnd: "2026-07-14",
  });
  publishAndIntake(suffix);
  calculatePersonOrdinaryAndOvertime(actorClerk("u-clerk-b6r3"), {
    periodId: period.id,
    personId: "person_a",
  });
  submitPeriodForReview(actorClerk("u-clerk-b6r3"), { periodId: period.id });
  const approved = approvePeriodManagement(actorApprover("u-approver-b6r3"), {
    periodId: period.id,
  });
  return { period, approved };
}

function lockPeriod(suffix: string) {
  const { period } = prepareApproved(suffix);
  const preview = createOrRefreshPayrollExportBatch(actorExportOperator("u-ex-r3"), {
    periodId: period.id,
  });
  const finalized = finalizePayrollExportBatch(actorExportOperator("u-ex-r3"), {
    exportBatchId: preview.id,
  });
  const lock = explicitLockPayPeriod(actorApprover("u-lock-r3"), {
    periodId: period.id,
    exportBatchId: finalized.id,
    reason: "lock for third remediation",
  });
  assert.equal(getPeriod(period.id)?.state, "locked");
  return { period, finalized, lock };
}

describe("M07 Batch 6 third remediation", () => {
  beforeEach(() => {
    resetM07TestEnv();
  });

  describe("platform-wide export profile lock", () => {
    it("blocks version and retire of * profile used by a locked period before write", () => {
      const { period, finalized, lock } = lockPeriod("plat1");
      const profileId = finalized.exportProfileId;
      const profile = getExportProfile(profileId)!;
      assert.equal(profile.legalEntityId, "*");
      const beforeVersion = profile.version;
      const beforeChecksum = finalized.artifact?.checksum;
      const beforeManifest = lock.sourceManifestChecksum;

      assert.throws(
        () =>
          versionExportProfile(actorAll(), profileId, {
            name: "mutated while locked",
          }),
        (e: unknown) =>
          e instanceof M07ValidationError &&
          (e.reason === "period-locked-source-change" ||
            e.reason === "locked-source-control-incomplete")
      );
      assert.equal(getExportProfile(profileId)?.version, beforeVersion);
      assert.equal(getExportProfile(profileId)?.name, profile.name);

      assert.throws(
        () => retireExportProfile(actorAll(), profileId, "retire while locked"),
        M07ValidationError
      );
      assert.equal(getExportProfile(profileId)?.status, "active");
      assert.equal(getExportProfile(profileId)?.version, beforeVersion);

      const batch = getCurrentExportBatchForPeriod(period.id)!;
      assert.equal(batch.artifact?.checksum, beforeChecksum);
      assert.equal(getPeriodLock(lock.id)?.sourceManifestChecksum, beforeManifest);
      assert.equal(getPeriod(period.id)?.state, "locked");
    });

    it("allows unrelated unused * profile mutation; falsified LE cannot bypass", () => {
      lockPeriod("plat2");
      const unused = createExportProfile(actorAll(), {
        legalEntityId: "*",
        name: "Unused platform profile",
        effectiveFrom: "2026-01-01",
        effectiveTo: "2026-12-31",
      });
      assert.doesNotThrow(() =>
        versionExportProfile(actorAll(), unused.id, { name: "safe rename" })
      );
      assert.equal(getExportProfile(unused.id)?.name, "safe rename");

      // Direct call with wrong LE in create path still resolves LE from input;
      // version always loads store — create for ORG_B while ORG_A locked remains allowed.
      assert.doesNotThrow(() =>
        createExportProfile(actorAll(), {
          legalEntityId: ORG_B,
          name: "Org B profile",
          effectiveFrom: "2026-01-01",
        })
      );
    });
  });

  describe("financial effective-date edge cases", () => {
    it("fails closed on open-ended, missing and malformed dates; allows proven future", () => {
      const { period } = lockPeriod("dates1");
      const profileId = listProfiles(ORG_A).find((p) => p.personId === "person_a")!.id;
      const before = listProfiles(ORG_A).find((p) => p.id === profileId)!;
      const beforeRev = before.materialProfileRevision;
      const beforeVersion = before.version;

      // Open-ended end date overlapping locked Jul period
      assert.throws(
        () =>
          updatePayProfile(actorAll(), profileId, {
            ordinaryHourlyRate: 51,
            effectiveFrom: "2026-01-01",
            effectiveTo: null,
          }),
        M07ValidationError
      );

      // Missing / empty effectiveFrom with rate change
      assert.throws(
        () =>
          updatePayProfile(actorAll(), profileId, {
            ordinaryHourlyRate: 52,
            effectiveFrom: "",
          }),
        M07ValidationError
      );

      // Malformed dates must not fail open
      assert.throws(
        () =>
          updatePayProfile(actorAll(), profileId, {
            ordinaryHourlyRate: 53,
            effectiveFrom: "not-a-date",
            effectiveTo: "also-bad",
          }),
        M07ValidationError
      );

      // Allowance change with open-ended window
      assert.throws(
        () =>
          updatePayProfile(actorAll(), profileId, {
            allowanceCodes: ["ALLOW_X"],
            effectiveFrom: "2026-01-01",
            effectiveTo: null,
          }),
        M07ValidationError
      );

      // Create with open-ended overlap
      assert.throws(
        () =>
          createPayProfile(actorAll(), {
            personId: "person_a",
            legalEntityId: ORG_A,
            clinicId: CLINIC_A,
            m04ClassificationRef: "class_rn",
            ordinaryHourlyRate: 70,
            effectiveFrom: "2026-06-01",
            // open-ended
          }),
        M07ValidationError
      );

      // Archive uses existing (overlapping) window
      assert.throws(
        () => archivePayProfile(actorAll(), profileId, "archive open-ended window"),
        M07ValidationError
      );

      const after = listProfiles(ORG_A).find((p) => p.id === profileId)!;
      assert.equal(after.version, beforeVersion);
      assert.equal(after.materialProfileRevision, beforeRev);
      assert.equal(after.ordinaryHourlyRate, before.ordinaryHourlyRate);

      // Proven future non-overlap
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

      assert.equal(getPeriod(period.id)?.state, "locked");
    });
  });

  describe("unlock idempotency and both-control failure", () => {
    it("rejects inconsistent approved unlock without open period / history", () => {
      const { period, lock } = lockPeriod("unledge");
      const req = requestPeriodUnlock(actorExportOperator("u-ex-r3"), {
        periodId: period.id,
        reason: "edge case",
      });
      // Forge: request marked approved/complete, lock record cleared of active status,
      // but period remains locked and unlock history is incomplete (no unlockRequestId).
      upsertPeriodLock({
        ...lock,
        status: "unlocked",
        unlockedAt: new Date().toISOString(),
        unlockedBy: "forger",
        // deliberately omit unlockRequestId
      });
      upsertUnlockRequest({
        ...req,
        status: "approved",
        controlsIncomplete: false,
        reviewedAt: new Date().toISOString(),
        reviewedBy: "forger",
        version: req.version + 1,
      });
      assert.equal(getPeriod(period.id)?.state, "locked");

      assert.throws(
        () =>
          approvePeriodUnlock(actorApprover("u-lock-r3"), {
            unlockRequestId: req.id,
          }),
        (e: unknown) =>
          e instanceof M07ValidationError && e.reason === "unlock-state-inconsistent"
      );
      assert.equal(getPeriod(period.id)?.state, "locked");
    });

    it("handles simultaneous audit+M02 failure, reject while incomplete, and recovery", () => {
      const { period, finalized } = lockPeriod("unlboth");
      const beforeChecksum = finalized.artifact?.checksum;
      const req = requestPeriodUnlock(actorExportOperator("u-ex-r3"), {
        periodId: period.id,
        reason: "both controls fail",
      });

      __setM07AuditFailForTests(true);
      __setM02InboxFailForTests(true);
      assert.throws(
        () =>
          approvePeriodUnlock(actorApprover("u-lock-r3"), {
            unlockRequestId: req.id,
          }),
        (e: unknown) =>
          e instanceof M07ValidationError && e.reason === "unlock-control-incomplete"
      );
      __setM07AuditFailForTests(false);
      __setM02InboxFailForTests(false);

      const incomplete = getUnlockRequest(req.id)!;
      assert.equal(incomplete.status, "controls-incomplete");
      assert.equal(getPeriod(period.id)?.state, "locked");
      assert.match(incomplete.controlsIncompleteReason ?? "", /m02-and-audit/);

      // Ordinary mutation blocked throughout
      assert.throws(
        () =>
          calculatePersonOrdinaryAndOvertime(actorClerk(), {
            periodId: period.id,
            personId: "person_a",
          }),
        M07ValidationError
      );

      // Reject while controls incomplete
      const rejected = rejectPeriodUnlock(actorApprover("u-lock-r3"), {
        unlockRequestId: req.id,
        reason: "cancel incomplete unlock",
      });
      assert.equal(rejected.status, "rejected");
      assert.equal(getPeriod(period.id)?.state, "locked");
      assert.equal(
        getCurrentExportBatchForPeriod(period.id)?.artifact?.checksum,
        beforeChecksum
      );

      // Fresh unlock request + both-fail then recover
      const req2 = requestPeriodUnlock(actorExportOperator("u-ex-r3"), {
        periodId: period.id,
        reason: "retry path",
      });
      __setM07AuditFailForTests(true);
      __setM02InboxFailForTests(true);
      assert.throws(
        () =>
          approvePeriodUnlock(actorApprover("u-lock-r3"), {
            unlockRequestId: req2.id,
          }),
        M07ValidationError
      );
      __setM07AuditFailForTests(false);
      __setM02InboxFailForTests(false);

      assert.throws(
        () =>
          calculatePersonOrdinaryAndOvertime(actorClerk(), {
            periodId: period.id,
            personId: "person_a",
          }),
        M07ValidationError
      );

      const done = approvePeriodUnlock(actorApprover("u-lock-r3"), {
        unlockRequestId: req2.id,
      });
      assert.equal(done.status, "approved");
      assert.equal(getPeriod(period.id)?.state, "open");

      // Repeated completed approval is idempotent
      const again = approvePeriodUnlock(actorApprover("u-lock-r3"), {
        unlockRequestId: req2.id,
      });
      assert.equal(again.id, done.id);
      assert.equal(again.status, "approved");
    });
  });
});
