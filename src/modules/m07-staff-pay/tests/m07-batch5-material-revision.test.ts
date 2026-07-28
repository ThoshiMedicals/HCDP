/**
 * Wave 6 / M07 Batch 5 final remediation — materialProfileRevision pin consistency.
 * Rate / external-ID must not leave approved/export-ready with unreproducible manifests.
 */

import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";

import { publishTimesheetVersion } from "@/platform/workforce/services/published-timesheet-registry";
import { findInboxActionForSource } from "@/platform/services/action-inbox-bridge";

import {
  actorAll,
  actorApprover,
  actorClerk,
  CLINIC_A,
  ORG_A,
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
import { calculatePersonOrdinaryAndOvertime } from "../services/calculate-service";
import {
  submitPeriodForReview,
  approvePeriodManagement,
} from "../services/approval-service";
import { verifyManifestAgainstCurrent } from "../services/source-manifest-service";
import { markPeriodApprovalStale } from "../services/approval-invalidation";
import { intakePublishedTimesheet } from "../services/published-timesheet-intake";
import { seedEligibilityForImportedSnapshot } from "../services/published-timesheet-lifecycle";
import {
  getCurrentApprovalForPeriod,
  getPeriod,
  listApprovals,
  listAudit,
  listProfiles,
} from "../repository/local-store";

function seedRuleAndMapping() {
  const rule = createPreparationRule(actorAll(), {
    legalEntityId: ORG_A,
    code: "ORD_OT_MV",
    label: "Ordinary/OT prep",
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

function seedProfile() {
  return createPayProfile(actorAll(), {
    personId: "person_a",
    legalEntityId: ORG_A,
    clinicId: CLINIC_A,
    m04ClassificationRef: "class_rn",
    ordinaryHourlyRate: 40,
    effectiveFrom: "2026-01-01",
  });
}

function publishAndIntake(suffix: string) {
  const content = {
    timesheetRecordId: `ts_mv_${suffix}`,
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
    eventId: `ev_mv_${suffix}`,
    idempotencyKey: `ev_mv_${suffix}`,
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
  const profile = seedProfile();
  const period = createOrdinaryPayPeriod(actorAll(), {
    legalEntityId: ORG_A,
    clinicIds: [],
    periodStart: "2026-07-01",
    periodEnd: "2026-07-14",
  });
  publishAndIntake(suffix);
  calculatePersonOrdinaryAndOvertime(actorClerk("u-clerk-calc"), {
    periodId: period.id,
    personId: "person_a",
  });
  submitPeriodForReview(actorClerk("u-clerk-sub"), { periodId: period.id });
  const approved = approvePeriodManagement(actorApprover("u-approver"), {
    periodId: period.id,
  });
  assert.equal(approved.status, "approved");
  assert.equal(getPeriod(period.id)?.state, "export-ready");
  return { period, profile, approved };
}

describe("M07 Batch 5 final — materialProfileRevision pin consistency", () => {
  beforeEach(() => {
    resetM07TestEnv();
  });

  it("approved manifest verifies before mutation", () => {
    const { approved } = prepareApproved("pre");
    const verify = verifyManifestAgainstCurrent(actorAll(), approved.manifest);
    assert.equal(verify.ok, true);
    assert.ok(
      approved.manifest.profiles.every(
        (p) => typeof p.materialProfileRevision === "number" && p.materialProfileRevision >= 1
      )
    );
  });

  it("rate-only update cannot leave approved/export-ready with checksum mismatch", () => {
    const { period, profile, approved } = prepareApproved("rate");
    const beforeMaterial = profile.materialProfileRevision;
    const beforeVersion = profile.version;

    const updated = updatePayProfile(actorAll(), profile.id, { ordinaryHourlyRate: 99 });
    assert.equal(updated.materialProfileRevision, beforeMaterial);
    assert.equal(updated.version, beforeVersion + 1);

    assert.equal(getCurrentApprovalForPeriod(period.id)?.status, "approved");
    assert.equal(getPeriod(period.id)?.state, "export-ready");

    const verify = verifyManifestAgainstCurrent(actorAll(), approved.manifest);
    assert.equal(verify.ok, true, "rate-only must keep pinned material revision reproducible");
  });

  it("external-ID update cannot leave approved/export-ready with checksum mismatch", () => {
    const { period, profile, approved } = prepareApproved("ext");
    const beforeMaterial = listProfiles(ORG_A).find((p) => p.id === profile.id)!
      .materialProfileRevision;

    const updated = linkExternalPayrollEmployeeId(
      actorAll(),
      profile.id,
      "EXT-FINAL-1",
      "batch5 final non-material"
    );
    assert.equal(updated.materialProfileRevision, beforeMaterial);
    assert.ok(updated.version > profile.version);

    assert.equal(getCurrentApprovalForPeriod(period.id)?.status, "approved");
    assert.equal(getPeriod(period.id)?.state, "export-ready");
    assert.equal(verifyManifestAgainstCurrent(actorAll(), approved.manifest).ok, true);
  });

  it("non-material update preserves approval only when manifest reconstruction still succeeds", () => {
    const { period, profile, approved } = prepareApproved("nm");
    updatePayProfile(actorAll(), profile.id, { ordinaryHourlyRate: 41 });
    linkExternalPayrollEmployeeId(actorAll(), profile.id, "EXT-NM", "non-material pair");
    assert.equal(getCurrentApprovalForPeriod(period.id)?.status, "approved");
    assert.equal(verifyManifestAgainstCurrent(actorAll(), approved.manifest).ok, true);
  });

  it("every material profile update immediately stales approval", () => {
    const { period, profile } = prepareApproved("mat");
    updatePayProfile(actorAll(), profile.id, { clinicId: "loc_eightmile" });
    assert.equal(getCurrentApprovalForPeriod(period.id)?.status, "stale");
    assert.equal(getPeriod(period.id)?.state, "open");
    assert.equal(
      listAudit().filter((a) => a.action === "approval.stale" && a.entityId).length >= 1,
      true
    );
  });

  it("material classification change bumps materialProfileRevision and stales", () => {
    const { period, profile } = prepareApproved("class");
    const before = listProfiles(ORG_A).find((p) => p.id === profile.id)!;
    updatePayProfile(actorAll(), profile.id, { m04ClassificationRef: "class_rn_x" });
    const after = listProfiles(ORG_A).find((p) => p.id === profile.id)!;
    assert.equal(after.materialProfileRevision, before.materialProfileRevision + 1);
    assert.equal(getCurrentApprovalForPeriod(period.id)?.status, "stale");
  });

  it("stale invalidation remains idempotent", () => {
    const { period, profile } = prepareApproved("idem");
    updatePayProfile(actorAll(), profile.id, { effectiveFrom: "2026-02-01" });
    const before = listAudit().filter((a) => a.action === "approval.stale").length;
    const key = `approval::${ORG_A}::${period.id}`;
    const inbox1 = findInboxActionForSource("staff-pay", "pay-period-approval", key);
    markPeriodApprovalStale(actorAll(), { periodId: period.id, reason: "replay" });
    assert.equal(listAudit().filter((a) => a.action === "approval.stale").length, before);
    const inbox2 = findInboxActionForSource("staff-pay", "pay-period-approval", key);
    assert.equal(inbox1?.id, inbox2?.id);
    assert.equal(
      listApprovals(ORG_A).filter((a) => a.periodId === period.id && a.status === "stale").length,
      1
    );
  });

  it("unrelated historical or audit-only record changes do not incorrectly invalidate", () => {
    const { period, profile, approved } = prepareApproved("hist");
    // General version bumps from rate are audit-visible but not material
    updatePayProfile(actorAll(), profile.id, { ordinaryHourlyRate: 42 });
    assert.equal(getCurrentApprovalForPeriod(period.id)?.status, "approved");
    assert.equal(verifyManifestAgainstCurrent(actorAll(), approved.manifest).ok, true);
  });

  it("direct approval verification never suppresses a genuine authoritative-source mismatch", () => {
    const { period, profile, approved } = prepareApproved("mismatch");
    // Material change without going through verify first — approval already stale
    updatePayProfile(actorAll(), profile.id, { m04ClassificationRef: "class_mismatch" });
    assert.equal(getCurrentApprovalForPeriod(period.id)?.status, "stale");
    // Reconstruct against original pin must fail (sources diverged)
    const verify = verifyManifestAgainstCurrent(actorAll(), approved.manifest);
    assert.equal(verify.ok, false);
    assert.ok(
      verify.ok === false &&
        (verify.reason === "manifest-checksum-mismatch" ||
          verify.reason === "readiness-incomplete" ||
          verify.reason === "manifest-incomplete" ||
          verify.reason === "manifest-reproduce-failed" ||
          typeof verify.reason === "string")
    );
  });
});
