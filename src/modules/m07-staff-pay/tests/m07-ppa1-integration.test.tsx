/**
 * Wave 6 / M07 PPA-1 Foundation — integration lane tests.
 * Real ppa-service + mounted Adjustments section (wired props) + shell/section-meta wiring.
 */

import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { publishTimesheetVersion } from "@/platform/workforce/services/published-timesheet-registry";

import {
  actorAll,
  actorApprover,
  actorClerk,
  actorExportOperator,
  actorOrgB,
  CLINIC_A,
  CLINIC_B,
  ORG_A,
  ORG_B,
  resetM07TestEnv,
} from "./_helpers";
import { M07_SECTION_META } from "../section-meta";
import {
  AdjustmentsSection,
  listLockedOrdinarySourceOptionsForActor,
  mapPriorPeriodAdjustmentToUiCase,
} from "../sections/AdjustmentsSection";
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
  createPriorPeriodAdjustment,
  listPriorPeriodAdjustmentsForEntity,
} from "../services/ppa-service";
import { getPeriod, upsertPeriod } from "../repository/local-store";
import { M07PermissionError, M07ValidationError } from "../permissions";

const ROOT = process.cwd();

function html(node: ReactElement): string {
  return renderToStaticMarkup(node);
}

function seedRuleAndMapping() {
  const rule = createPreparationRule(actorAll(), {
    legalEntityId: ORG_A,
    code: "ORD_OT_PPA1_INT",
    label: "Ordinary/OT PPA1 int",
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
    timesheetRecordId: `ts_ppa1_int_${suffix}`,
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
    eventId: `ev_ppa1_int_${suffix}`,
    idempotencyKey: `ev_ppa1_int_${suffix}`,
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

function lockOrdinaryPeriod(suffix: string, clinicIds: string[] = []) {
  seedRuleAndMapping();
  seedProfile(`EXT-PPA1-INT-${suffix}`);
  const period = createOrdinaryPayPeriod(actorAll(), {
    legalEntityId: ORG_A,
    clinicIds,
    periodStart: "2026-07-01",
    periodEnd: "2026-07-14",
  });
  publishAndIntake(suffix);
  calculatePersonOrdinaryAndOvertime(actorClerk("u-clerk-int"), {
    periodId: period.id,
    personId: "person_a",
  });
  submitPeriodForReview(actorClerk("u-clerk-int"), { periodId: period.id });
  approvePeriodManagement(actorApprover("u-approver-int"), {
    periodId: period.id,
  });
  const preview = createOrRefreshPayrollExportBatch(actorExportOperator("u-ex-int"), {
    periodId: period.id,
  });
  const finalized = finalizePayrollExportBatch(actorExportOperator("u-ex-int"), {
    exportBatchId: preview.id,
  });
  explicitLockPayPeriod(actorApprover("u-lock-int"), {
    periodId: period.id,
    exportBatchId: finalized.id,
    reason: "lock for PPA-1 integration",
  });
  return getPeriod(period.id)!;
}

describe("M07 PPA-1 integration — shell + real service + mounted section", () => {
  beforeEach(() => {
    resetM07TestEnv();
  });

  it("section-meta marks adjustments available with PPA-1 foundation wording", () => {
    assert.equal(M07_SECTION_META.adjustments.batch1, "available");
    assert.match(
      M07_SECTION_META.adjustments.batchNote ?? "",
      /PPA-1 prior-period adjustment foundation: register, create and cancel draft only/
    );
  });

  it("StaffPayWorkspace mounts ConnectedAdjustmentsSection for adjustments", () => {
    const ws = readFileSync(join(ROOT, "src/modules/m07-staff-pay/StaffPayWorkspace.tsx"), "utf8");
    assert.match(ws, /ConnectedAdjustmentsSection/);
    assert.match(ws, /case "adjustments"/);
    assert.doesNotMatch(ws, /case "adjustments":\s*return <PlannedSection/);
  });

  it("empty repo mounts genuine empty wired register", () => {
    const markup = html(
      createElement(AdjustmentsSection, {
        integrationStatus: "wired",
        cases: [],
        lockedSources: [],
        loading: false,
        canView: true,
        canCreate: true,
      })
    );
    assert.match(markup, /data-m07-ppa-lane="ppa1-foundation-wired"/);
    assert.match(markup, /No prior-period adjustments/i);
    assert.doesNotMatch(markup, />Calculate</);
    assert.doesNotMatch(markup, /Approve for payment/i);
    assert.doesNotMatch(markup, /Download bank/i);
    assert.doesNotMatch(markup, /Mark as paid/i);
  });

  it("denied actor shows permission alert; no create affordance enabled path", () => {
    const markup = html(
      createElement(AdjustmentsSection, {
        integrationStatus: "wired",
        canView: false,
        viewDeniedReason: "Requires payroll.adjust",
      })
    );
    assert.match(markup, /data-m07-ppa-denied="true"/);
    assert.match(markup, /Requires payroll\.adjust/);
  });

  it("locked-source selector: ordinary+locked only; excludes adjustment; preserves IDs", () => {
    const source = lockOrdinaryPeriod("sel");
    const open = createOrdinaryPayPeriod(actorAll(), {
      legalEntityId: ORG_A,
      clinicIds: [],
      periodStart: "2026-08-01",
      periodEnd: "2026-08-14",
    });
    const ppa = createPriorPeriodAdjustment(actorClerk(), {
      sourcePeriodId: source.id,
      reasonCode: "manual",
      reasonText: "for selector",
      idempotencyKey: "int-sel",
    });
    const options = listLockedOrdinarySourceOptionsForActor({ legalEntityId: ORG_A });
    assert.ok(options.some((o) => o.periodId === source.id));
    assert.equal(options.some((o) => o.periodId === open.id), false);
    assert.equal(options.some((o) => o.periodId === ppa.adjustmentPeriodId), false);
    const srcOpt = options.find((o) => o.periodId === source.id)!;
    assert.equal(srcOpt.legalEntityId, ORG_A);
    assert.match(srcOpt.label, /2026-07-01/);
  });

  it("clinic-scoped selector excludes out-of-scope locked ordinary", () => {
    const source = lockOrdinaryPeriod("clinic");
    // Tag clinic after lock (readiness path is entity-wide); selector must honour clinic scope.
    upsertPeriod({
      ...getPeriod(source.id)!,
      clinicIds: [CLINIC_B],
    });
    const inScope = listLockedOrdinarySourceOptionsForActor({
      legalEntityId: ORG_A,
      clinicIds: [CLINIC_A],
    });
    assert.equal(inScope.some((o) => o.periodId === source.id), false);
    const allowed = listLockedOrdinarySourceOptionsForActor({
      legalEntityId: ORG_A,
      clinicIds: [CLINIC_B],
    });
    assert.ok(allowed.some((o) => o.periodId === source.id));
  });

  it("register/create/cancel via real service; mounts mapped cases; source unchanged; pins present", () => {
    const source = lockOrdinaryPeriod("crud");
    const sourceBefore = structuredClone(source);
    const sources = listLockedOrdinarySourceOptionsForActor({ legalEntityId: ORG_A });

    const created = createPriorPeriodAdjustment(actorClerk(), {
      sourcePeriodId: source.id,
      reasonCode: "manual-correction",
      reasonText: "Late allowance after lock",
      idempotencyKey: "int-crud-1",
      evidenceRefs: ["note://1"],
    });
    assert.equal(created.status, "draft");
    assert.equal(getPeriod(source.id)?.version, sourceBefore.version);
    assert.equal(getPeriod(created.adjustmentPeriodId)?.kind, "adjustment");

    const listed = listPriorPeriodAdjustmentsForEntity(actorClerk(), ORG_A);
    const uiCases = listed.map((r) => {
      const src = getPeriod(r.sourcePeriodId);
      return mapPriorPeriodAdjustmentToUiCase(
        r,
        src ? `${src.periodStart} → ${src.periodEnd}` : undefined
      );
    });

    const registerMarkup = html(
      createElement(AdjustmentsSection, {
        integrationStatus: "wired",
        cases: uiCases,
        lockedSources: sources,
        canView: true,
        canCreate: true,
        canCancel: true,
      })
    );
    assert.match(registerMarkup, /manual-correction/);
    assert.match(registerMarkup, new RegExp(created.id));
    assert.match(registerMarkup, /Create adjustment/);
    assert.doesNotMatch(registerMarkup, /Export package|Mark as paid|Bank file/i);

    const detailMarkup = html(
      createElement(AdjustmentsSection, {
        integrationStatus: "wired",
        cases: uiCases,
        lockedSources: sources,
        initialView: "detail",
        initialSelectedCaseId: created.id,
        canCancel: true,
      })
    );
    assert.match(detailMarkup, /Source period version/);
    assert.match(detailMarkup, /Late allowance after lock/);
    assert.match(detailMarkup, /Cancel draft/);

    const cancelled = cancelPriorPeriodAdjustmentDraft(actorClerk(), {
      ppaId: created.id,
      reason: "not needed",
    });
    assert.equal(cancelled.status, "cancelled");
    assert.equal(getPeriod(created.adjustmentPeriodId)?.state, "archived");
    assert.equal(getPeriod(source.id)?.state, "locked");
    assert.equal(getPeriod(source.id)?.version, sourceBefore.version);

    const afterCancel = listPriorPeriodAdjustmentsForEntity(actorClerk(), ORG_A).map((r) =>
      mapPriorPeriodAdjustmentToUiCase(r)
    );
    const cancelledMarkup = html(
      createElement(AdjustmentsSection, {
        integrationStatus: "wired",
        cases: afterCancel,
        initialView: "detail",
        initialSelectedCaseId: created.id,
        canCancel: true,
      })
    );
    assert.match(cancelledMarkup, /Cancelled/i);
    assert.match(cancelledMarkup, /Cancel is only available while the adjustment is in draft status/);
  });

  it("create validation and payload fields required; idempotency preserved at service", () => {
    const source = lockOrdinaryPeriod("val");
    assert.throws(
      () =>
        createPriorPeriodAdjustment(actorClerk(), {
          sourcePeriodId: source.id,
          reasonCode: "",
          reasonText: "x",
          idempotencyKey: "int-val-1",
        }),
      (err: unknown) =>
        err instanceof M07ValidationError && err.reason === "missing-ppa-reason"
    );
    const first = createPriorPeriodAdjustment(actorClerk(), {
      sourcePeriodId: source.id,
      reasonCode: "manual",
      reasonText: "payload",
      idempotencyKey: "int-val-key",
    });
    const replay = createPriorPeriodAdjustment(actorClerk(), {
      sourcePeriodId: source.id,
      reasonCode: "manual",
      reasonText: "payload",
      idempotencyKey: "int-val-key",
    });
    assert.equal(replay.id, first.id);
  });

  it("cross-LE create fail-closed; Org B list empty for Org A source", () => {
    const source = lockOrdinaryPeriod("xle");
    assert.throws(
      () =>
        createPriorPeriodAdjustment(actorOrgB(), {
          sourcePeriodId: source.id,
          reasonCode: "manual",
          reasonText: "cross",
          idempotencyKey: "int-xle",
        }),
      Error
    );
    assert.deepEqual(listPriorPeriodAdjustmentsForEntity(actorOrgB(), ORG_B), []);
  });

  it("missing adjust permission denied at service; error state mountable", () => {
    const noAdjust = {
      userId: "u-view",
      permissions: ["payroll.view"] as string[],
      legalEntityIds: [ORG_A],
    };
    assert.throws(
      () => listPriorPeriodAdjustmentsForEntity(noAdjust, ORG_A),
      M07PermissionError
    );
    const markup = html(
      createElement(AdjustmentsSection, {
        integrationStatus: "wired",
        error: "Permission denied — payroll.adjust is required.",
        canView: true,
      })
    );
    assert.match(markup, /data-m07-ppa-error="true"/);
    assert.match(markup, /payroll\.adjust/);
  });

  it("unlock ≠ PPA; loading/empty/error states covered; no decorative calc/export actions", () => {
    const source = lockOrdinaryPeriod("unlock");
    const beforeCount = listPriorPeriodAdjustmentsForEntity(actorClerk(), ORG_A).length;
    const req = requestPeriodUnlock(actorExportOperator("u-ex-int2"), {
      periodId: source.id,
      reason: "controls remediation — not a PPA",
    });
    approvePeriodUnlock(actorApprover("u-lock-int2"), {
      unlockRequestId: req.id,
      reason: "approve unlock",
    });
    assert.equal(getPeriod(source.id)?.state, "open");
    assert.equal(listPriorPeriodAdjustmentsForEntity(actorClerk(), ORG_A).length, beforeCount);

    const loading = html(
      createElement(AdjustmentsSection, {
        integrationStatus: "wired",
        loading: true,
        cases: [],
      })
    );
    assert.match(loading, /Loading prior-period adjustments/i);

    const sectionSrc = readFileSync(
      join(ROOT, "src/modules/m07-staff-pay/sections/AdjustmentsSection.tsx"),
      "utf8"
    );
    assert.match(sectionSrc, /createPriorPeriodAdjustment/);
    assert.match(sectionSrc, /cancelPriorPeriodAdjustmentDraft/);
    assert.match(sectionSrc, /listPriorPeriodAdjustmentsForEntity/);
    assert.doesNotMatch(sectionSrc, /createOrRefreshPayrollExportBatch|approvePeriodManagement|calculatePersonOrdinary/);
  });
});
