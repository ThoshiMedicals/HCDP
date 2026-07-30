/**
 * Wave 6 / M07 PPA-1 Foundation — core domain & service production tests.
 * Prior-Period Adjustment only (not unlock, not ordinary prep, not PPA-2).
 */

import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";

import { publishTimesheetVersion } from "@/platform/workforce/services/published-timesheet-registry";

import {
  actorAll,
  actorApprover,
  actorClerk,
  actorExportOperator,
  actorOrgB,
  CLINIC_A,
  ORG_A,
  ORG_B,
  resetM07TestEnv,
} from "./_helpers";
import { createOrdinaryPayPeriod } from "../services/period-service";
import {
  createPayProfile,
  linkExternalPayrollEmployeeId,
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
} from "../services/period-unlock-service";
import {
  cancelPriorPeriodAdjustmentDraft,
  countPriorPeriodAdjustmentsForSource,
  createPriorPeriodAdjustment,
  getPriorPeriodAdjustmentForActor,
  listAdjustmentPeriodsForSource,
  listPriorPeriodAdjustmentsForEntity,
} from "../services/ppa-service";
import {
  getPeriod,
  listAudit,
  upsertPeriod,
} from "../repository/local-store";
import {
  upsertPriorPeriodAdjustment,
} from "../storage/ppa-repository";
import { M07PermissionError, M07ValidationError } from "../permissions";
import { M07_PROHIBITED_FIELD_KEYS } from "../types/domain";
import type { PriorPeriodAdjustment } from "../types/domain";

function seedRuleAndMapping() {
  const rule = createPreparationRule(actorAll(), {
    legalEntityId: ORG_A,
    code: "ORD_OT_PPA1",
    label: "Ordinary/OT PPA1",
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

function seedProfile(externalId: string) {
  const profile = createPayProfile(actorAll(), {
    personId: "person_a",
    legalEntityId: ORG_A,
    clinicId: CLINIC_A,
    m04ClassificationRef: "class_rn",
    ordinaryHourlyRate: 40,
    effectiveFrom: "2026-01-01",
  });
  linkExternalPayrollEmployeeId(actorAll(), profile.id, externalId, "seed");
  return profile;
}

function publishAndIntake(suffix: string) {
  const content = {
    timesheetRecordId: `ts_ppa1_${suffix}`,
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
    eventId: `ev_ppa1_${suffix}`,
    idempotencyKey: `ev_ppa1_${suffix}`,
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

function lockOrdinaryPeriod(suffix: string) {
  seedRuleAndMapping();
  seedProfile(`EXT-PPA1-${suffix}`);
  const period = createOrdinaryPayPeriod(actorAll(), {
    legalEntityId: ORG_A,
    clinicIds: [],
    periodStart: "2026-07-01",
    periodEnd: "2026-07-14",
  });
  publishAndIntake(suffix);
  calculatePersonOrdinaryAndOvertime(actorClerk("u-clerk-ppa1"), {
    periodId: period.id,
    personId: "person_a",
  });
  submitPeriodForReview(actorClerk("u-clerk-ppa1"), { periodId: period.id });
  approvePeriodManagement(actorApprover("u-approver-ppa1"), {
    periodId: period.id,
  });
  const preview = createOrRefreshPayrollExportBatch(actorExportOperator("u-ex-ppa1"), {
    periodId: period.id,
  });
  const finalized = finalizePayrollExportBatch(actorExportOperator("u-ex-ppa1"), {
    exportBatchId: preview.id,
  });
  explicitLockPayPeriod(actorApprover("u-lock-ppa1"), {
    periodId: period.id,
    exportBatchId: finalized.id,
    reason: "lock for PPA-1",
  });
  const locked = getPeriod(period.id)!;
  assert.equal(locked.state, "locked");
  return { period: locked, exportBatchId: finalized.id };
}

function assertNoProhibitedOrPaymentFields(row: PriorPeriodAdjustment) {
  const json = JSON.stringify(row);
  for (const key of M07_PROHIBITED_FIELD_KEYS) {
    assert.equal(json.toLowerCase().includes(`"${key.toLowerCase()}"`), false, key);
  }
  assert.equal("paymentReady" in row, false);
  assert.equal("paid" in row, false);
  assert.equal("bankFile" in row, false);
  assert.equal("stp" in row, false);
  assert.equal("superannuation" in row, false);
  assert.equal("calculated" in row, false);
  assert.equal("approved" in row, false);
  assert.equal("exported" in row, false);
  assert.equal("reconciled" in row, false);
  assert.equal("closed" in row, false);
  assert.equal("deltaLines" in row, false);
}

describe("M07 PPA-1 core — prior-period adjustment foundation", () => {
  beforeEach(() => {
    resetM07TestEnv();
  });

  it("creates PPA against locked ordinary source; source unchanged; adjustment period linked", () => {
    const { period: source } = lockOrdinaryPeriod("ok1");
    const sourceBefore = structuredClone(source);

    const ppa = createPriorPeriodAdjustment(actorClerk("u-clerk-ppa1"), {
      sourcePeriodId: source.id,
      reasonCode: "manual-correction",
      reasonText: "Late allowance correction authorised",
      idempotencyKey: "ppa1-ok1",
      evidenceRefs: ["note://ticket-1"],
    });

    assert.equal(ppa.status, "draft");
    assert.equal(ppa.legalEntityId, ORG_A);
    assert.equal(ppa.sourcePeriodId, source.id);
    assert.equal(ppa.reasonCode, "manual-correction");
    assert.equal(ppa.reasonText, "Late allowance correction authorised");
    assert.deepEqual(ppa.evidenceRefs, ["note://ticket-1"]);
    assert.equal(ppa.sourcePeriodVersion, sourceBefore.version);
    assert.ok(ppa.sourceLockId);
    assert.ok(ppa.sourceExportBatchId);
    assertNoProhibitedOrPaymentFields(ppa);

    const sourceAfter = getPeriod(source.id)!;
    assert.equal(sourceAfter.state, "locked");
    assert.equal(sourceAfter.kind, "ordinary");
    assert.equal(sourceAfter.version, sourceBefore.version);
    assert.equal(sourceAfter.periodStart, sourceBefore.periodStart);
    assert.equal(sourceAfter.periodEnd, sourceBefore.periodEnd);
    assert.equal(sourceAfter.updatedAt, sourceBefore.updatedAt);

    const adj = getPeriod(ppa.adjustmentPeriodId)!;
    assert.equal(adj.kind, "adjustment");
    assert.equal(adj.sourcePeriodId, source.id);
    assert.equal(adj.priorPeriodAdjustmentId, ppa.id);
    assert.equal(adj.legalEntityId, ORG_A);
    assert.equal(adj.state, "open");

    const audits = listAudit(ORG_A).filter((a) => a.action === "ppa.create" && a.entityId === ppa.id);
    assert.equal(audits.length, 1);
  });

  it("rejects unlocked ordinary source pre-write", () => {
    seedRuleAndMapping();
    seedProfile("EXT-PPA1-UNLOCKED");
    const open = createOrdinaryPayPeriod(actorAll(), {
      legalEntityId: ORG_A,
      clinicIds: [],
      periodStart: "2026-07-01",
      periodEnd: "2026-07-14",
    });
    assert.throws(
      () =>
        createPriorPeriodAdjustment(actorClerk(), {
          sourcePeriodId: open.id,
          reasonCode: "manual",
          reasonText: "should fail",
          idempotencyKey: "ppa1-unlocked",
        }),
      (err: unknown) =>
        err instanceof M07ValidationError && err.reason === "source-not-locked"
    );
    assert.equal(countPriorPeriodAdjustmentsForSource(open.id), 0);
    assert.equal(listAdjustmentPeriodsForSource(open.id).length, 0);
  });

  it("rejects missing / unknown source and adjustment-kind source", () => {
    assert.throws(
      () =>
        createPriorPeriodAdjustment(actorClerk(), {
          sourcePeriodId: "missing_period",
          reasonCode: "manual",
          reasonText: "x",
          idempotencyKey: "ppa1-missing",
        }),
      (err: unknown) =>
        err instanceof M07ValidationError && err.reason === "source-period-not-found"
    );

    const { period: source } = lockOrdinaryPeriod("adj-src");
    const first = createPriorPeriodAdjustment(actorClerk(), {
      sourcePeriodId: source.id,
      reasonCode: "manual",
      reasonText: "first",
      idempotencyKey: "ppa1-adj-src-1",
    });
    const adjPeriod = getPeriod(first.adjustmentPeriodId)!;
    // Force adj period into locked state so we can attempt PPA against it as "source"
    upsertPeriod({ ...adjPeriod, state: "locked", lockedAt: new Date().toISOString(), lockedBy: "t" });

    assert.throws(
      () =>
        createPriorPeriodAdjustment(actorClerk(), {
          sourcePeriodId: adjPeriod.id,
          reasonCode: "manual",
          reasonText: "nested",
          idempotencyKey: "ppa1-adj-src-2",
        }),
      (err: unknown) =>
        err instanceof M07ValidationError && err.reason === "source-not-ordinary"
    );
  });

  it("rejects cross-LE caller widening and Org B access", () => {
    const { period: source } = lockOrdinaryPeriod("xle");
    assert.throws(
      () =>
        createPriorPeriodAdjustment(actorClerk(), {
          sourcePeriodId: source.id,
          legalEntityId: ORG_B,
          reasonCode: "manual",
          reasonText: "widen",
          idempotencyKey: "ppa1-xle",
        }),
      (err: unknown) =>
        err instanceof M07ValidationError && err.reason === "legal-entity-mismatch"
    );
    assert.throws(
      () =>
        createPriorPeriodAdjustment(actorOrgB(), {
          sourcePeriodId: source.id,
          reasonCode: "manual",
          reasonText: "org-b",
          idempotencyKey: "ppa1-orgb",
        }),
      Error
    );
    assert.equal(countPriorPeriodAdjustmentsForSource(source.id), 0);
  });

  it("rejects missing reasonCode and blank reasonText pre-write", () => {
    const { period: source } = lockOrdinaryPeriod("reason");
    assert.throws(
      () =>
        createPriorPeriodAdjustment(actorClerk(), {
          sourcePeriodId: source.id,
          reasonCode: "",
          reasonText: "has text",
          idempotencyKey: "ppa1-rc",
        }),
      (err: unknown) =>
        err instanceof M07ValidationError && err.reason === "missing-ppa-reason"
    );
    assert.throws(
      () =>
        createPriorPeriodAdjustment(actorClerk(), {
          sourcePeriodId: source.id,
          reasonCode: "manual",
          reasonText: "   ",
          idempotencyKey: "ppa1-rt",
        }),
      (err: unknown) =>
        err instanceof M07ValidationError && err.reason === "missing-ppa-reason"
    );
    assert.equal(countPriorPeriodAdjustmentsForSource(source.id), 0);
  });

  it("enforces at most one open PPA per source; idempotent and conflicting replay", () => {
    const { period: source } = lockOrdinaryPeriod("card");
    const first = createPriorPeriodAdjustment(actorClerk(), {
      sourcePeriodId: source.id,
      reasonCode: "manual",
      reasonText: "first open",
      idempotencyKey: "ppa1-card-1",
    });

    const replay = createPriorPeriodAdjustment(actorClerk(), {
      sourcePeriodId: source.id,
      reasonCode: "manual",
      reasonText: "first open",
      idempotencyKey: "ppa1-card-1",
    });
    assert.equal(replay.id, first.id);
    assert.equal(countPriorPeriodAdjustmentsForSource(source.id), 1);

    assert.throws(
      () =>
        createPriorPeriodAdjustment(actorClerk(), {
          sourcePeriodId: source.id,
          reasonCode: "other",
          reasonText: "conflict payload",
          idempotencyKey: "ppa1-card-1",
        }),
      (err: unknown) =>
        err instanceof M07ValidationError && err.reason === "conflicting-idempotency-replay"
    );

    assert.throws(
      () =>
        createPriorPeriodAdjustment(actorClerk(), {
          sourcePeriodId: source.id,
          reasonCode: "manual",
          reasonText: "second open",
          idempotencyKey: "ppa1-card-2",
        }),
      (err: unknown) =>
        err instanceof M07ValidationError && err.reason === "duplicate-open-ppa"
    );
  });

  it("list/get are LE-scoped; missing adjust permission denied", () => {
    const { period: source } = lockOrdinaryPeriod("scope");
    const ppa = createPriorPeriodAdjustment(actorClerk(), {
      sourcePeriodId: source.id,
      reasonCode: "manual",
      reasonText: "scoped",
      idempotencyKey: "ppa1-scope",
    });

    const listed = listPriorPeriodAdjustmentsForEntity(actorClerk(), ORG_A);
    assert.equal(listed.some((r) => r.id === ppa.id), true);
    assert.throws(
      () => listPriorPeriodAdjustmentsForEntity(actorClerk(), ORG_B),
      Error
    );
    assert.deepEqual(listPriorPeriodAdjustmentsForEntity(actorOrgB(), ORG_B), []);

    const got = getPriorPeriodAdjustmentForActor(actorClerk(), ppa.id);
    assert.equal(got?.id, ppa.id);
    assert.equal(getPriorPeriodAdjustmentForActor(actorClerk(), "nope"), null);

    const noAdjust = {
      userId: "u-view",
      permissions: ["payroll.view"] as string[],
      legalEntityIds: [ORG_A],
    };
    assert.throws(
      () => listPriorPeriodAdjustmentsForEntity(noAdjust, ORG_A),
      M07PermissionError
    );
  });

  it("cancels draft idempotently; rejects invalid cancel state", () => {
    const { period: source } = lockOrdinaryPeriod("cancel");
    const ppa = createPriorPeriodAdjustment(actorClerk(), {
      sourcePeriodId: source.id,
      reasonCode: "manual",
      reasonText: "to cancel",
      idempotencyKey: "ppa1-cancel",
    });

    const cancelled = cancelPriorPeriodAdjustmentDraft(actorClerk(), {
      ppaId: ppa.id,
      reason: "not needed",
    });
    assert.equal(cancelled.status, "cancelled");
    assert.equal(getPeriod(ppa.adjustmentPeriodId)?.state, "archived");
    const audits = listAudit(ORG_A).filter((a) => a.action === "ppa.cancel" && a.entityId === ppa.id);
    assert.equal(audits.length, 1);

    const again = cancelPriorPeriodAdjustmentDraft(actorClerk(), { ppaId: ppa.id });
    assert.equal(again.id, cancelled.id);
    assert.equal(again.status, "cancelled");
    assert.equal(
      listAudit(ORG_A).filter((a) => a.action === "ppa.cancel" && a.entityId === ppa.id).length,
      1
    );

    // After cancel, a new open PPA may be created for the same source.
    const second = createPriorPeriodAdjustment(actorClerk(), {
      sourcePeriodId: source.id,
      reasonCode: "manual",
      reasonText: "replacement",
      idempotencyKey: "ppa1-cancel-2",
    });
    assert.equal(second.status, "draft");
    assert.notEqual(second.id, ppa.id);

    // Invalid-state cancel via forced non-draft status
    const forced = {
      ...second,
      status: "approved" as unknown as PriorPeriodAdjustment["status"],
    };
    upsertPriorPeriodAdjustment(forced as PriorPeriodAdjustment);
    assert.throws(
      () => cancelPriorPeriodAdjustmentDraft(actorClerk(), { ppaId: second.id }),
      (err: unknown) =>
        err instanceof M07ValidationError && err.reason === "ppa-invalid-cancel-state"
    );
  });

  it("controlled unlock does not create a PPA case", () => {
    const { period: source } = lockOrdinaryPeriod("unlock");
    const before = countPriorPeriodAdjustmentsForSource(source.id);

    const req = requestPeriodUnlock(actorExportOperator("u-ex-ppa1"), {
      periodId: source.id,
      reason: "controls remediation — not a PPA",
    });
    approvePeriodUnlock(actorApprover("u-lock-ppa1"), {
      unlockRequestId: req.id,
      reason: "approve unlock",
    });
    assert.equal(getPeriod(source.id)?.state, "open");
    assert.equal(countPriorPeriodAdjustmentsForSource(source.id), before);
    assert.equal(
      listAudit(ORG_A).some((a) => a.action === "ppa.create"),
      false
    );
  });

  it("rejects prohibited identifier fields on create input", () => {
    const { period: source } = lockOrdinaryPeriod("prohib");
    assert.throws(
      () =>
        createPriorPeriodAdjustment(actorClerk(), {
          sourcePeriodId: source.id,
          reasonCode: "manual",
          reasonText: "bad",
          idempotencyKey: "ppa1-prohib",
          tfn: "123",
        } as Parameters<typeof createPriorPeriodAdjustment>[1] & { tfn: string }),
      (err: unknown) =>
        err instanceof M07ValidationError && err.reason === "prohibited-identifier"
    );
  });
});
