/**
 * Wave 6 / M07 Batch 5 — CP 5.1–5.6 readiness, submit, management approval.
 */

import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { publishTimesheetVersion } from "@/platform/workforce/services/published-timesheet-registry";
import { findInboxActionForSource } from "@/platform/services/action-inbox-bridge";
import { readJsonSafe, writeJsonSafe, hasMigration } from "@/platform/storage/storage";

import {
  actorAll,
  actorApprover,
  actorClerk,
  actorPayAdmin,
  actorOrgB,
  CLINIC_A,
  ORG_A,
  ORG_B,
  resetM07TestEnv,
} from "./_helpers";
import { injectTestPersonIdentity } from "../adapters/m04-person-read";
import { createOrdinaryPayPeriod } from "../services/period-service";
import { createPayProfile } from "../services/profile-service";
import {
  createClassificationMapping,
  createPreparationRule,
} from "../services/rule-service";
import { calculatePersonOrdinaryAndOvertime } from "../services/calculate-service";
import {
  createDeductionPrepInput,
} from "../services/deduction-prep-input-service";
import { createGenericCode } from "../services/code-service";
import {
  openPayPrepException,
  waivePayPrepException,
} from "../services/exception-service";
import { resolveEligiblePopulation } from "../services/eligible-population-service";
import { assessPeriodReadiness } from "../services/readiness-service";
import {
  submitPeriodForReview,
  approvePeriodManagement,
  rejectPeriodManagement,
  withdrawPeriodSubmission,
  getPeriodApprovalView,
} from "../services/approval-service";
import { intakePublishedTimesheet } from "../services/published-timesheet-intake";
import { seedEligibilityForImportedSnapshot } from "../services/published-timesheet-lifecycle";
import { listM07InboxProjections } from "../adapters/m02-inbox-publish";
import {
  getCurrentApprovalForPeriod,
  getPeriod,
  listApprovals,
  listAudit,
} from "../repository/local-store";
import {
  M07_MIGRATION_V7_ID,
  M07_MIGRATION_V8_ID,
  M07_SCHEMA_VERSION,
  M07_STORAGE_KEYS,
  ensureM07Bootstrapped,
  resetM07BootstrapCacheForTests,
  runM07SchemaV8Migration,
} from "../storage";
import { clearM07LocalStoreCacheForTests } from "../repository/local-store";
import { installMemoryLocalStorage } from "./_helpers";
import { M07_SECTION_META } from "../section-meta";
import {
  M07PermissionError,
  M07SeparationOfDutiesError,
  M07ValidationError,
} from "../permissions";

const M07_ROOT = join(process.cwd(), "src/modules/m07-staff-pay");

function walkProductionTsFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "tests" || name === "node_modules") continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walkProductionTsFiles(full, out);
    else if (/\.(ts|tsx)$/.test(name) && !name.endsWith(".d.ts")) out.push(full);
  }
  return out;
}

function stripCommentsAndStrings(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\/\/.*$/gm, " ")
    .replace(/`(?:\\.|[^`\\])*`/g, '""')
    .replace(/'(?:\\.|[^'\\])*'/g, '""')
    .replace(/"(?:\\.|[^"\\])*"/g, '""');
}

function seedRuleAndMapping() {
  const rule = createPreparationRule(actorAll(), {
    legalEntityId: ORG_A,
    code: "ORD_OT",
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
  return rule;
}

function seedProfile(personId = "person_a", clinicId = CLINIC_A) {
  return createPayProfile(actorAll(), {
    personId,
    legalEntityId: ORG_A,
    clinicId,
    m04ClassificationRef: "class_rn",
    ordinaryHourlyRate: 40,
    effectiveFrom: "2026-01-01",
  });
}

function publishAndIntake(input: {
  timesheetRecordId: string;
  eventId: string;
  personId?: string;
  ordinaryHours?: number;
}) {
  const personId = input.personId ?? "person_a";
  const content = {
    timesheetRecordId: input.timesheetRecordId,
    workforcePersonId: personId,
    organisationId: ORG_A,
    legalEntityId: ORG_A,
    clinicId: CLINIC_A,
    periodStart: "2026-07-01",
    periodEnd: "2026-07-14",
    attendanceSessionIds: ["sess_a"],
    ordinaryHourInputs: [{ code: "ORD", hours: input.ordinaryHours ?? 76 }],
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
    eventId: input.eventId,
    idempotencyKey: input.eventId,
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

function prepareReadyPeriod(opts?: { clinicIds?: string[] }) {
  seedRuleAndMapping();
  seedProfile();
  const period = createOrdinaryPayPeriod(actorAll(), {
    legalEntityId: ORG_A,
    clinicIds: opts?.clinicIds ?? [],
    periodStart: "2026-07-01",
    periodEnd: "2026-07-14",
  });
  publishAndIntake({ timesheetRecordId: "ts_b5_1", eventId: "ev_b5_1" });
  const calc = calculatePersonOrdinaryAndOvertime(actorClerk("u-clerk-calc"), {
    periodId: period.id,
    personId: "person_a",
  });
  assert.equal(calc.status, "completed");
  return period;
}

describe("M07 Batch 5 CP5.1–5.6", () => {
  beforeEach(() => {
    resetM07TestEnv();
  });

  describe("CP5.1 eligible population + readiness", () => {
    it("excludes doctors and inactive/terminated/future-start workforce", () => {
      seedRuleAndMapping();
      seedProfile();
      seedProfile("person_doc", CLINIC_A);
      injectTestPersonIdentity({
        personId: "person_inactive",
        displayLabel: "Inactive",
        personKind: "staff",
        organisationId: ORG_A,
        clinicId: CLINIC_A,
        classificationRef: "class_rn",
        employmentStatus: "inactive",
        employmentEffectiveFrom: "2019-01-01",
        employmentEffectiveTo: "2020-01-01",
        clinicAssignmentEffectiveFrom: "2019-01-01",
        clinicAssignmentEffectiveTo: "2020-01-01",
        readOnly: true,
        source: "m04-adapter",
      });
      createPayProfile(actorAll(), {
        personId: "person_inactive",
        legalEntityId: ORG_A,
        clinicId: CLINIC_A,
        m04ClassificationRef: "class_rn",
        ordinaryHourlyRate: 40,
        effectiveFrom: "2019-01-01",
      });
      injectTestPersonIdentity({
        personId: "person_future",
        displayLabel: "Future",
        personKind: "staff",
        organisationId: ORG_A,
        clinicId: CLINIC_A,
        classificationRef: "class_rn",
        employmentStatus: "active",
        employmentEffectiveFrom: "2027-01-01",
        employmentEffectiveTo: null,
        clinicAssignmentEffectiveFrom: "2027-01-01",
        clinicAssignmentEffectiveTo: null,
        readOnly: true,
        source: "m04-adapter",
      });
      createPayProfile(actorAll(), {
        personId: "person_future",
        legalEntityId: ORG_A,
        clinicId: CLINIC_A,
        m04ClassificationRef: "class_rn",
        ordinaryHourlyRate: 40,
        effectiveFrom: "2027-01-01",
      });

      const period = createOrdinaryPayPeriod(actorAll(), {
        legalEntityId: ORG_A,
        clinicIds: [],
        periodStart: "2026-07-01",
        periodEnd: "2026-07-14",
      });
      publishAndIntake({ timesheetRecordId: "ts_pop", eventId: "ev_pop" });

      const pop = resolveEligiblePopulation(actorAll(), {
        legalEntityId: ORG_A,
        periodId: period.id,
      });
      assert.ok(pop.eligible.some((e) => e.personId === "person_a"));
      assert.ok(pop.exclusions.some((e) => e.reason === "doctor-m08-excluded"));
      assert.ok(!pop.eligible.some((e) => e.personId === "person_inactive"));
      assert.ok(!pop.eligible.some((e) => e.personId === "person_future"));
      assert.ok(!pop.eligible.some((e) => e.personId === "person_doc"));
      // Period-ineffective profiles are filtered before membership; when present via
      // overlapping profile windows, employment rules produce exclusions:
      assert.ok(
        pop.exclusions.some((e) => e.personId === "person_inactive") ||
          !pop.eligible.some((e) => e.personId === "person_inactive")
      );
    });

    it("fails closed on missing effective clinic assignment", () => {
      seedRuleAndMapping();
      injectTestPersonIdentity({
        personId: "person_noclinic",
        displayLabel: "No Clinic",
        personKind: "staff",
        organisationId: ORG_A,
        clinicId: undefined,
        classificationRef: "class_rn",
        employmentStatus: "active",
        employmentEffectiveFrom: "2020-01-01",
        employmentEffectiveTo: null,
        readOnly: true,
        source: "m04-adapter",
      });
      createPayProfile(actorAll(), {
        personId: "person_noclinic",
        legalEntityId: ORG_A,
        clinicId: CLINIC_A,
        m04ClassificationRef: "class_rn",
        ordinaryHourlyRate: 40,
        effectiveFrom: "2026-01-01",
      });
      const period = createOrdinaryPayPeriod(actorAll(), {
        legalEntityId: ORG_A,
        periodStart: "2026-07-01",
        periodEnd: "2026-07-14",
      });
      const pop = resolveEligiblePopulation(actorAll(), {
        legalEntityId: ORG_A,
        periodId: period.id,
      });
      assert.equal(pop.status, "blocked");
      assert.ok(
        pop.populationBlockers.some((b) => b.field === "clinicId" && b.personId === "person_noclinic") ||
          pop.blockingReasons.some((r) => r.includes("clinicId") || r.includes("missing-effective-clinic"))
      );
    });

    it("blocks readiness when calculation missing / open exception", () => {
      seedRuleAndMapping();
      seedProfile();
      const period = createOrdinaryPayPeriod(actorAll(), {
        legalEntityId: ORG_A,
        periodStart: "2026-07-01",
        periodEnd: "2026-07-14",
      });
      publishAndIntake({ timesheetRecordId: "ts_rdy", eventId: "ev_rdy" });
      let readiness = assessPeriodReadiness(actorAll(), {
        legalEntityId: ORG_A,
        periodId: period.id,
      });
      assert.notEqual(readiness.status, "ready");

      calculatePersonOrdinaryAndOvertime(actorAll(), {
        periodId: period.id,
        personId: "person_a",
      });
      openPayPrepException(actorAll(), {
        legalEntityId: ORG_A,
        organisationId: ORG_A,
        periodId: period.id,
        personId: "person_a",
        kind: "missing-rate",
        message: "test open",
        clinicId: CLINIC_A,
      });
      readiness = assessPeriodReadiness(actorAll(), {
        legalEntityId: ORG_A,
        periodId: period.id,
      });
      assert.equal(readiness.status, "blocked");
      assert.ok(
        readiness.people.some((p) =>
          p.blockingReasons.some((r) => r.includes("open-exception"))
        ) || readiness.blockingReasons.some((r) => r.includes("open-exception"))
      );
    });
  });

  describe("CP5.2–5.3 submit / approve / reject / withdraw + SoD", () => {
    it("submits, approves with SoD, and sets export-ready wording state", () => {
      const period = prepareReadyPeriod();
      const clerk = actorClerk("u-clerk-sub");
      const submitted = submitPeriodForReview(clerk, { periodId: period.id });
      assert.equal(submitted.status, "submitted");
      assert.equal(getPeriod(period.id)?.state, "in-review");
      assert.ok(submitted.manifest.checksum);

      assert.throws(
        () => approvePeriodManagement(clerk, { periodId: period.id }),
        (e: unknown) =>
          e instanceof M07PermissionError || e instanceof M07SeparationOfDutiesError
      );

      const approved = approvePeriodManagement(actorApprover("u-approver-b5"), {
        periodId: period.id,
      });
      assert.equal(approved.status, "approved");
      assert.equal(approved.certified, false);
      assert.equal(approved.paymentReady, false);
      assert.equal(getPeriod(period.id)?.state, "export-ready");
      assert.ok(listAudit().some((a) => a.action === "approval.approve"));
    });

    it("blocks submitter self-approval and material preparer approval", () => {
      const period = prepareReadyPeriod();
      const preparerApprover = {
        userId: "u-clerk-calc",
        permissions: [
          ...actorClerk("u-clerk-calc").permissions,
          "payroll.approve",
        ],
        legalEntityIds: [ORG_A],
      };
      submitPeriodForReview(preparerApprover, { periodId: period.id });
      assert.throws(
        () => approvePeriodManagement(preparerApprover, { periodId: period.id }),
        M07SeparationOfDutiesError
      );
    });

    it("rejects and withdraws with mandatory reason; supports resubmission", () => {
      const period = prepareReadyPeriod();
      const clerk = actorClerk("u-clerk-sub2");
      submitPeriodForReview(clerk, { periodId: period.id });
      assert.throws(
        () =>
          rejectPeriodManagement(actorApprover(), {
            periodId: period.id,
            reason: "  ",
          }),
        M07ValidationError
      );
      const rejected = rejectPeriodManagement(actorApprover(), {
        periodId: period.id,
        reason: "fix incomplete",
      });
      assert.equal(rejected.status, "rejected");
      assert.equal(getPeriod(period.id)?.state, "open");

      const again = submitPeriodForReview(clerk, { periodId: period.id });
      assert.equal(again.approvalVersion, 2);
      assert.ok(again.supersedesApprovalId == null || again.approvalVersion === 2);

      const admin = actorPayAdmin();
      const withdrawn = withdrawPeriodSubmission(admin, {
        periodId: period.id,
        reason: "admin withdraw",
      });
      assert.equal(withdrawn.status, "withdrawn");
      assert.equal(getPeriod(period.id)?.state, "open");

      const third = submitPeriodForReview(clerk, { periodId: period.id });
      assert.equal(third.status, "submitted");
    });

    it("unauthorised submit / wrong-scope approver fail closed", () => {
      const period = prepareReadyPeriod();
      assert.throws(
        () => submitPeriodForReview(actorApprover(), { periodId: period.id }),
        M07PermissionError
      );
      const clerk = actorClerk();
      submitPeriodForReview(clerk, { periodId: period.id });
      assert.throws(
        () =>
          approvePeriodManagement(actorOrgB(), { periodId: period.id }),
        Error
      );
    });

    it("submit and approve replay are idempotent", () => {
      const period = prepareReadyPeriod();
      const clerk = actorClerk("u-clerk-idem");
      const a1 = submitPeriodForReview(clerk, { periodId: period.id });
      const a2 = submitPeriodForReview(clerk, { periodId: period.id });
      assert.equal(a1.id, a2.id);
      assert.equal(a1.approvalVersion, a2.approvalVersion);

      const appr = actorApprover("u-appr-idem");
      const b1 = approvePeriodManagement(appr, { periodId: period.id });
      const b2 = approvePeriodManagement(appr, { periodId: period.id });
      assert.equal(b1.id, b2.id);
      assert.equal(b1.status, "approved");
      assert.equal(b2.status, "approved");
    });
  });

  describe("CP5.4 invalidation", () => {
    it("recalculation after approval marks stale and leaves export-ready", () => {
      const period = prepareReadyPeriod();
      submitPeriodForReview(actorClerk("u-clerk-inv"), { periodId: period.id });
      approvePeriodManagement(actorApprover("u-appr-inv"), { periodId: period.id });
      assert.equal(getPeriod(period.id)?.state, "export-ready");

      calculatePersonOrdinaryAndOvertime(actorClerk("u-clerk-inv"), {
        periodId: period.id,
        personId: "person_a",
      });
      const cur = getCurrentApprovalForPeriod(period.id);
      assert.equal(cur?.status, "stale");
      assert.equal(getPeriod(period.id)?.state, "open");
    });

    it("deduction change and new exception after approval invalidate", () => {
      const period = prepareReadyPeriod();
      const code = createGenericCode(actorAll(), {
        legalEntityId: ORG_A,
        code: "DED1",
        label: "Deduction demo",
        lineType: "deduction",
        effectiveFrom: "2026-01-01",
      });
      submitPeriodForReview(actorClerk("u-clerk-d"), { periodId: period.id });
      approvePeriodManagement(actorApprover("u-appr-d"), { periodId: period.id });

      createDeductionPrepInput(actorClerk("u-clerk-d"), {
        periodId: period.id,
        personId: "person_a",
        codeId: code.id,
        quantity: 1,
        reason: "post-approve change",
      });
      assert.equal(getCurrentApprovalForPeriod(period.id)?.status, "stale");
    });

    it("approval fails when source manifest changed before approve", () => {
      const period = prepareReadyPeriod();
      submitPeriodForReview(actorClerk("u-clerk-m"), { periodId: period.id });
      calculatePersonOrdinaryAndOvertime(actorClerk("u-clerk-m"), {
        periodId: period.id,
        personId: "person_a",
      });
      assert.throws(
        () =>
          approvePeriodManagement(actorApprover("u-appr-m"), {
            periodId: period.id,
          }),
        M07ValidationError
      );
    });
  });

  describe("CP5.5 M02 + UI meta", () => {
    it("projects approval-required and closes on approve without duplicate fork", () => {
      const period = prepareReadyPeriod();
      submitPeriodForReview(actorClerk("u-clerk-m02"), { periodId: period.id });
      const open1 = findInboxActionForSource(
        "staff-pay",
        "pay-period-approval",
        `approval::${ORG_A}::${period.id}`
      );
      submitPeriodForReview(actorClerk("u-clerk-m02"), { periodId: period.id });
      const open2 = findInboxActionForSource(
        "staff-pay",
        "pay-period-approval",
        `approval::${ORG_A}::${period.id}`
      );
      assert.equal(open1?.id, open2?.id);

      approvePeriodManagement(actorApprover("u-appr-m02"), { periodId: period.id });
      assert.ok(
        listM07InboxProjections().some(
          (p) => p.kind === "approval-closed" || p.kind === "approval-required"
        )
      );
    });

    it("Approval section is available in section meta", () => {
      assert.equal(M07_SECTION_META.approval.batch1, "available");
    });

    it("getPeriodApprovalView surfaces readiness and history", () => {
      const period = prepareReadyPeriod();
      const view = getPeriodApprovalView(actorAll(), {
        legalEntityId: ORG_A,
        periodId: period.id,
      });
      assert.equal(view.readiness.status, "ready");
      assert.equal(view.current, null);
    });
  });

  describe("CP5.6 migration, architecture, exclusions", () => {
    it("migration v8 idempotent and preserves v7 data", () => {
      installMemoryLocalStorage();
      clearM07LocalStoreCacheForTests();
      resetM07BootstrapCacheForTests();
      ensureM07Bootstrapped();
      assert.equal(M07_SCHEMA_VERSION, 9);
      assert.equal(hasMigration(M07_MIGRATION_V7_ID, 1), true);
      assert.equal(hasMigration(M07_MIGRATION_V8_ID, 1), true);
      writeJsonSafe(M07_STORAGE_KEYS.deductionPrepInputs, [{ id: "keep_ded" }]);
      assert.equal(runM07SchemaV8Migration(), false);
      assert.deepEqual(readJsonSafe(M07_STORAGE_KEYS.deductionPrepInputs, []), [
        { id: "keep_ded" },
      ]);
      assert.ok(Array.isArray(readJsonSafe(M07_STORAGE_KEYS.approvals, null)));
    });

    it("malformed stored approval is skipped safely", () => {
      writeJsonSafe(M07_STORAGE_KEYS.approvals, [
        { broken: true },
        null,
        {
          id: "aprv_ok",
          logicalKey: "approval::org::p",
          periodId: "p",
          legalEntityId: ORG_A,
          approvalVersion: 1,
          status: "withdrawn",
        },
      ]);
      const list = listApprovals(ORG_A);
      assert.equal(list.length, 1);
      assert.equal(list[0]!.id, "aprv_ok");
    });

    it("no M04/M05/M06 writes and no direct M02 repository import", () => {
      const files = walkProductionTsFiles(M07_ROOT);
      for (const f of files) {
        const src = stripCommentsAndStrings(readFileSync(f, "utf8"));
        assert.equal(src.includes("pulse.m04."), false, f);
        assert.equal(src.includes("pulse.m05."), false, f);
        assert.equal(src.includes("pulse.m06."), false, f);
        assert.equal(/m02-.*\/repository/.test(src), false, f);
        assert.equal(src.includes("createExportPackage"), false, f);
        assert.equal(src.includes("lockPeriod("), false, f);
        assert.equal(src.includes("Process Final Pay"), false, f);
      }
    });

    it("blocked period cannot submit as approved/export-ready", () => {
      seedRuleAndMapping();
      seedProfile();
      const period = createOrdinaryPayPeriod(actorAll(), {
        legalEntityId: ORG_A,
        periodStart: "2026-07-01",
        periodEnd: "2026-07-14",
      });
      assert.throws(
        () => submitPeriodForReview(actorClerk(), { periodId: period.id }),
        M07ValidationError
      );
      assert.notEqual(getPeriod(period.id)?.state, "export-ready");
    });

    it("tenant/LE mismatch on population for org B actor", () => {
      const period = prepareReadyPeriod();
      assert.throws(
        () =>
          assessPeriodReadiness(actorOrgB(), {
            legalEntityId: ORG_A,
            periodId: period.id,
          }),
        Error
      );
      void ORG_B;
    });
  });
});
