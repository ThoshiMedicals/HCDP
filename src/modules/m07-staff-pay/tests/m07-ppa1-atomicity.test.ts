/**
 * Wave 6 / M07 PPA-1 Foundation — atomicity / fail-closed compensation tests.
 * Platform localStorage is not multi-key transactional — these assert fail-closed behaviour
 * and qualify residual archive/cancel compensation (do not claim true atomicity).
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
  ORG_A,
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
  countPriorPeriodAdjustmentsForSource,
  createPriorPeriodAdjustment,
  cancelPriorPeriodAdjustmentDraft,
  listAdjustmentPeriodsForSource,
} from "../services/ppa-service";
import {
  findOpenPriorPeriodAdjustmentForSource,
  listPriorPeriodAdjustments,
  __setPpaCaseWriteFailForTests,
  __setPpaCorruptAfterWriteForTests,
  __setPpaCreateInterleaveHookForTests,
  __isOpenPpaCreateGateHeldForTests,
} from "../storage/ppa-repository";
import {
  getPeriod,
  listAudit,
  __setPeriodWriteFailForTests,
} from "../repository/local-store";
import { __setM07AuditFailActionsForTests } from "../services/audit-service";
import { M07ValidationError } from "../permissions";

function seedRuleAndMapping() {
  const rule = createPreparationRule(actorAll(), {
    legalEntityId: ORG_A,
    code: "ORD_OT_PPA1_ATOM",
    label: "Ordinary/OT PPA1 atom",
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
    timesheetRecordId: `ts_ppa1_atom_${suffix}`,
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
    eventId: `ev_ppa1_atom_${suffix}`,
    idempotencyKey: `ev_ppa1_atom_${suffix}`,
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
  seedProfile(`EXT-PPA1-ATOM-${suffix}`);
  const period = createOrdinaryPayPeriod(actorAll(), {
    legalEntityId: ORG_A,
    clinicIds: [],
    periodStart: "2026-07-01",
    periodEnd: "2026-07-14",
  });
  publishAndIntake(suffix);
  calculatePersonOrdinaryAndOvertime(actorClerk("u-clerk-atom"), {
    periodId: period.id,
    personId: "person_a",
  });
  submitPeriodForReview(actorClerk("u-clerk-atom"), { periodId: period.id });
  approvePeriodManagement(actorApprover("u-approver-atom"), {
    periodId: period.id,
  });
  const preview = createOrRefreshPayrollExportBatch(actorExportOperator("u-ex-atom"), {
    periodId: period.id,
  });
  const finalized = finalizePayrollExportBatch(actorExportOperator("u-ex-atom"), {
    exportBatchId: preview.id,
  });
  explicitLockPayPeriod(actorApprover("u-lock-atom"), {
    periodId: period.id,
    exportBatchId: finalized.id,
    reason: "lock for PPA-1 atomicity",
  });
  const locked = getPeriod(period.id)!;
  assert.equal(locked.state, "locked");
  return locked;
}

function assertNoOpenPpa(sourceId: string) {
  assert.equal(findOpenPriorPeriodAdjustmentForSource(sourceId), null);
}

function assertNoActiveAdjustmentPeriod(sourceId: string) {
  const active = listAdjustmentPeriodsForSource(sourceId).filter((p) => p.state !== "archived");
  assert.equal(active.length, 0);
}

function assertSourceUnchanged(sourceId: string, before: ReturnType<typeof getPeriod>) {
  const after = getPeriod(sourceId)!;
  assert.equal(after.state, "locked");
  assert.equal(after.kind, "ordinary");
  assert.equal(after.version, before!.version);
  assert.equal(after.updatedAt, before!.updatedAt);
}

describe("M07 PPA-1 atomicity / fail-closed compensation", () => {
  beforeEach(() => {
    resetM07TestEnv();
  });

  it("1. adjustment-period write fail — no success, source unchanged, no open PPA", () => {
    const source = lockOrdinaryPeriod("pwf");
    const before = structuredClone(source);
    __setPeriodWriteFailForTests(1);
    assert.throws(
      () =>
        createPriorPeriodAdjustment(actorClerk(), {
          sourcePeriodId: source.id,
          reasonCode: "manual",
          reasonText: "period write fail",
          idempotencyKey: "atom-pwf",
        }),
      /m07-period-write-fail-for-tests|adjustment-period-write-failed/
    );
    assertSourceUnchanged(source.id, before);
    assertNoOpenPpa(source.id);
    assert.equal(listAdjustmentPeriodsForSource(source.id).length, 0);
    assert.equal(
      listAudit(ORG_A).some((a) => a.action === "ppa.create"),
      false
    );
  });

  it("2. case write fail after period create — compensates; no open PPA; residual archived", () => {
    const source = lockOrdinaryPeriod("cwf");
    const before = structuredClone(source);
    __setPpaCaseWriteFailForTests(1);
    assert.throws(
      () =>
        createPriorPeriodAdjustment(actorClerk(), {
          sourcePeriodId: source.id,
          reasonCode: "manual",
          reasonText: "case write fail",
          idempotencyKey: "atom-cwf",
        }),
      /m07-ppa-case-write-fail-for-tests/
    );
    assertSourceUnchanged(source.id, before);
    assertNoOpenPpa(source.id);
    assertNoActiveAdjustmentPeriod(source.id);
    const residuals = listAdjustmentPeriodsForSource(source.id);
    assert.ok(residuals.every((p) => p.state === "archived"));
    assert.equal(
      listAudit(ORG_A).some((a) => a.action === "ppa.create"),
      false
    );
  });

  it("3. consistency verify fail after both writes — compensates; no open PPA", () => {
    const source = lockOrdinaryPeriod("cvf");
    const before = structuredClone(source);
    __setPpaCorruptAfterWriteForTests(true);
    assert.throws(
      () =>
        createPriorPeriodAdjustment(actorClerk(), {
          sourcePeriodId: source.id,
          reasonCode: "manual",
          reasonText: "consistency fail",
          idempotencyKey: "atom-cvf",
        }),
      (err: unknown) =>
        err instanceof M07ValidationError &&
        (err.reason === "ppa-orphan-period-missing" || err.reason.startsWith("ppa-orphan"))
    );
    assertSourceUnchanged(source.id, before);
    assertNoOpenPpa(source.id);
    assertNoActiveAdjustmentPeriod(source.id);
    assert.equal(
      listAudit(ORG_A).some((a) => a.action === "ppa.create"),
      false
    );
  });

  it("4. audit fail after business writes — no success response; no false-success audit; compensate", () => {
    const source = lockOrdinaryPeriod("af");
    const before = structuredClone(source);
    __setM07AuditFailActionsForTests(["ppa.create"]);
    assert.throws(
      () =>
        createPriorPeriodAdjustment(actorClerk(), {
          sourcePeriodId: source.id,
          reasonCode: "manual",
          reasonText: "audit fail",
          idempotencyKey: "atom-af",
        }),
      /m07-audit-fail-for-tests/
    );
    __setM07AuditFailActionsForTests(null);
    assertSourceUnchanged(source.id, before);
    assertNoOpenPpa(source.id);
    assertNoActiveAdjustmentPeriod(source.id);
    assert.equal(
      listAudit(ORG_A).some((a) => a.action === "ppa.create"),
      false
    );
    // Deterministic retry with same key after compensation succeeds.
    const retry = createPriorPeriodAdjustment(actorClerk(), {
      sourcePeriodId: source.id,
      reasonCode: "manual",
      reasonText: "audit fail",
      idempotencyKey: "atom-af",
    });
    assert.equal(retry.status, "draft");
    assert.equal(findOpenPriorPeriodAdjustmentForSource(source.id)?.id, retry.id);
  });

  it("5. duplicate create same source — rejected; source unchanged", () => {
    const source = lockOrdinaryPeriod("dup");
    const before = structuredClone(source);
    createPriorPeriodAdjustment(actorClerk(), {
      sourcePeriodId: source.id,
      reasonCode: "manual",
      reasonText: "first",
      idempotencyKey: "atom-dup-1",
    });
    assert.throws(
      () =>
        createPriorPeriodAdjustment(actorClerk(), {
          sourcePeriodId: source.id,
          reasonCode: "manual",
          reasonText: "second",
          idempotencyKey: "atom-dup-2",
        }),
      (err: unknown) =>
        err instanceof M07ValidationError && err.reason === "duplicate-open-ppa"
    );
    assertSourceUnchanged(source.id, before);
    assert.equal(countPriorPeriodAdjustmentsForSource(source.id), 1);
  });

  it("6. identical idempotency replay — returns same case; no second open PPA", () => {
    const source = lockOrdinaryPeriod("replay");
    const first = createPriorPeriodAdjustment(actorClerk(), {
      sourcePeriodId: source.id,
      reasonCode: "manual",
      reasonText: "same",
      idempotencyKey: "atom-replay",
    });
    const replay = createPriorPeriodAdjustment(actorClerk(), {
      sourcePeriodId: source.id,
      reasonCode: "manual",
      reasonText: "same",
      idempotencyKey: "atom-replay",
    });
    assert.equal(replay.id, first.id);
    assert.equal(countPriorPeriodAdjustmentsForSource(source.id), 1);
    assert.ok(listAudit(ORG_A).some((a) => a.action === "ppa.create.replay"));
  });

  it("7. conflicting idempotency replay — rejected; source unchanged", () => {
    const source = lockOrdinaryPeriod("conflict");
    const before = structuredClone(source);
    createPriorPeriodAdjustment(actorClerk(), {
      sourcePeriodId: source.id,
      reasonCode: "manual",
      reasonText: "original",
      idempotencyKey: "atom-conflict",
    });
    assert.throws(
      () =>
        createPriorPeriodAdjustment(actorClerk(), {
          sourcePeriodId: source.id,
          reasonCode: "other",
          reasonText: "different",
          idempotencyKey: "atom-conflict",
        }),
      (err: unknown) =>
        err instanceof M07ValidationError && err.reason === "conflicting-idempotency-replay"
    );
    assertSourceUnchanged(source.id, before);
    assert.equal(countPriorPeriodAdjustmentsForSource(source.id), 1);
  });

  it("8. genuinely overlapping nested create mid-gate — one open PPA; loser fail-closed", () => {
    const source = lockOrdinaryPeriod("race");
    const before = structuredClone(source);
    let nestedThrew = false;
    let gateHeldDuringNested = false;

    // Nested create runs while the outer create holds the open-PPA gate (not sequential awaits).
    __setPpaCreateInterleaveHookForTests(() => {
      gateHeldDuringNested = __isOpenPpaCreateGateHeldForTests(source.id);
      try {
        createPriorPeriodAdjustment(actorClerk("u-b"), {
          sourcePeriodId: source.id,
          reasonCode: "manual",
          reasonText: "racer-b-nested",
          idempotencyKey: "atom-race-b",
        });
      } catch (err) {
        nestedThrew = true;
        assert.ok(
          err instanceof M07ValidationError && err.reason === "duplicate-open-ppa",
          `nested must fail closed, got ${String(err)}`
        );
      }
    });

    const a = createPriorPeriodAdjustment(actorClerk("u-a"), {
      sourcePeriodId: source.id,
      reasonCode: "manual",
      reasonText: "racer-a-outer",
      idempotencyKey: "atom-race-a",
    });

    assert.equal(gateHeldDuringNested, true, "nested create must run while outer gate is held");
    assert.equal(nestedThrew, true, "nested overlapping create must fail");
    assert.equal(findOpenPriorPeriodAdjustmentForSource(source.id)?.id, a.id);
    assert.equal(
      listPriorPeriodAdjustments(ORG_A).filter(
        (r) => r.sourcePeriodId === source.id && r.status !== "cancelled"
      ).length,
      1
    );
    const activeAdj = listAdjustmentPeriodsForSource(source.id).filter((p) => p.state !== "archived");
    assert.equal(activeAdj.length, 1);
    assert.equal(activeAdj[0]?.priorPeriodAdjustmentId, a.id);
    assertSourceUnchanged(source.id, before);
  });

  it("9. cancel audit failure — cancel persists but no success return; source unchanged", () => {
    const source = lockOrdinaryPeriod("caf");
    const before = structuredClone(source);
    const created = createPriorPeriodAdjustment(actorClerk(), {
      sourcePeriodId: source.id,
      reasonCode: "manual",
      reasonText: "cancel audit",
      idempotencyKey: "atom-caf",
    });
    __setM07AuditFailActionsForTests(["ppa.cancel"]);
    assert.throws(
      () =>
        cancelPriorPeriodAdjustmentDraft(actorClerk(), {
          ppaId: created.id,
          reason: "cancel with audit fail",
        }),
      /m07-audit-fail-for-tests/
    );
    __setM07AuditFailActionsForTests(null);
    const after = findOpenPriorPeriodAdjustmentForSource(source.id);
    // Cancel wrote before audit — case must not remain open; no ppa.cancel success audit.
    assert.equal(after, null);
    const cancelled = listPriorPeriodAdjustments(ORG_A).find((r) => r.id === created.id);
    assert.equal(cancelled?.status, "cancelled");
    assert.equal(getPeriod(created.adjustmentPeriodId)?.state, "archived");
    assert.equal(listAudit(ORG_A).some((a) => a.action === "ppa.cancel"), false);
    assertSourceUnchanged(source.id, before);
    // Idempotent retry of cancel after audit recovered.
    const retry = cancelPriorPeriodAdjustmentDraft(actorClerk(), {
      ppaId: created.id,
      reason: "retry cancel",
    });
    assert.equal(retry.status, "cancelled");
  });
});
