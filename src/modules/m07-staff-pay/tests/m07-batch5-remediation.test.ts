/**
 * Wave 6 / M07 Batch 5 remediation — fail-closed employment, demo isolation,
 * profile/mapping invalidation, dedicated SoD proofs.
 */

import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

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
import {
  M07_DEMO_PERSON_SEED_MARKER,
  injectTestPersonIdentity,
} from "../adapters/m04-person-read";
import { createOrdinaryPayPeriod } from "../services/period-service";
import { createPayProfile, updatePayProfile } from "../services/profile-service";
import {
  createClassificationMapping,
  createPreparationRule,
  replaceClassificationMapping,
  retireClassificationMapping,
} from "../services/rule-service";
import { calculatePersonOrdinaryAndOvertime } from "../services/calculate-service";
import { createDeductionPrepInput } from "../services/deduction-prep-input-service";
import { createGenericCode } from "../services/code-service";
import {
  openPayPrepException,
  resolvePayPrepException,
  waivePayPrepException,
} from "../services/exception-service";
import { resolveEligiblePopulation } from "../services/eligible-population-service";
import { assessPeriodReadiness } from "../services/readiness-service";
import {
  submitPeriodForReview,
  approvePeriodManagement,
} from "../services/approval-service";
import {
  invalidateApprovalIfSourcesChanged,
  markPeriodApprovalStale,
  notifyM04EmploymentContextChanged,
} from "../services/approval-invalidation";
import {
  assertMaterialActorProvenance,
  collectMaterialPreparerUserIds,
} from "../services/sod-policy";
import { intakePublishedTimesheet } from "../services/published-timesheet-intake";
import { seedEligibilityForImportedSnapshot } from "../services/published-timesheet-lifecycle";
import {
  getCurrentApprovalForPeriod,
  getPeriod,
  listApprovals,
  listAudit,
  listClassificationMaps,
  listExceptions,
  listProfiles,
  upsertProfile,
} from "../repository/local-store";
import {
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

function seedRuleAndMapping() {
  const rule = createPreparationRule(actorAll(), {
    legalEntityId: ORG_A,
    code: "ORD_OT_R",
    label: "Ordinary/OT prep",
    ordinaryMultiplier: 1,
    overtimeMultiplier: 1.5,
    effectiveFrom: "2026-01-01",
  });
  const mapping = createClassificationMapping(actorAll(), {
    legalEntityId: ORG_A,
    m04ClassificationRef: "class_rn",
    preparationRuleId: rule.id,
    effectiveFrom: "2026-01-01",
  });
  return { rule, mapping };
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

function prepareReadyPeriod(eventSuffix = "1") {
  seedRuleAndMapping();
  seedProfile();
  const period = createOrdinaryPayPeriod(actorAll(), {
    legalEntityId: ORG_A,
    clinicIds: [],
    periodStart: "2026-07-01",
    periodEnd: "2026-07-14",
  });
  publishAndIntake({
    timesheetRecordId: `ts_b5r_${eventSuffix}`,
    eventId: `ev_b5r_${eventSuffix}`,
  });
  const calc = calculatePersonOrdinaryAndOvertime(actorClerk("u-clerk-calc"), {
    periodId: period.id,
    personId: "person_a",
  });
  assert.equal(calc.status, "completed");
  return period;
}

function approveReady(periodId: string) {
  submitPeriodForReview(actorClerk("u-clerk-sub-r"), { periodId });
  return approvePeriodManagement(actorApprover("u-approver-r"), { periodId });
}

function activeProfileFor(personId: string) {
  const p = listProfiles(ORG_A).find((x) => x.personId === personId && x.status === "active");
  assert.ok(p);
  return p!;
}

describe("M07 Batch 5 remediation — fail-closed employment + invalidation + SoD", () => {
  beforeEach(() => {
    resetM07TestEnv();
  });

  describe("employment / clinic fail-closed", () => {
    it("missing employment status blocks and keeps person visible", () => {
      seedRuleAndMapping();
      injectTestPersonIdentity({
        personId: "person_nostatus",
        displayLabel: "No Status",
        personKind: "staff",
        organisationId: ORG_A,
        clinicId: CLINIC_A,
        classificationRef: "class_rn",
        employmentEffectiveFrom: "2020-01-01",
        employmentEffectiveTo: null,
        clinicAssignmentEffectiveFrom: "2020-01-01",
        clinicAssignmentEffectiveTo: null,
        readOnly: true,
        source: "m04-adapter",
      });
      createPayProfile(actorAll(), {
        personId: "person_nostatus",
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
      const blocker = pop.populationBlockers.find(
        (b) => b.personId === "person_nostatus" && b.field === "employmentStatus"
      );
      assert.ok(blocker);
      assert.equal(blocker!.legalEntityId, ORG_A);
      assert.equal(blocker!.periodId, period.id);
      assert.ok(!pop.eligible.some((e) => e.personId === "person_nostatus"));
      const readiness = assessPeriodReadiness(actorAll(), {
        legalEntityId: ORG_A,
        periodId: period.id,
      });
      assert.ok(
        readiness.people.some((p) => p.personId === "person_nostatus" && p.status === "blocked")
      );
      assert.throws(
        () => submitPeriodForReview(actorClerk(), { periodId: period.id }),
        M07ValidationError
      );
    });

    it("missing employment-effective start date blocks", () => {
      seedRuleAndMapping();
      injectTestPersonIdentity({
        personId: "person_nodate",
        displayLabel: "No Date",
        personKind: "staff",
        organisationId: ORG_A,
        clinicId: CLINIC_A,
        classificationRef: "class_rn",
        employmentStatus: "active",
        clinicAssignmentEffectiveFrom: "2020-01-01",
        clinicAssignmentEffectiveTo: null,
        readOnly: true,
        source: "m04-adapter",
      });
      createPayProfile(actorAll(), {
        personId: "person_nodate",
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
      assert.ok(
        pop.populationBlockers.some(
          (b) => b.personId === "person_nodate" && b.field === "employmentEffectiveFrom"
        )
      );
    });

    it("ambiguous employment dates block", () => {
      seedRuleAndMapping();
      injectTestPersonIdentity({
        personId: "person_ambig",
        displayLabel: "Ambig",
        personKind: "staff",
        organisationId: ORG_A,
        clinicId: CLINIC_A,
        classificationRef: "class_rn",
        employmentStatus: "active",
        employmentEffectiveFrom: "2025-06-01",
        employmentEffectiveTo: "2024-01-01",
        clinicAssignmentEffectiveFrom: "2020-01-01",
        clinicAssignmentEffectiveTo: null,
        readOnly: true,
        source: "m04-adapter",
      });
      createPayProfile(actorAll(), {
        personId: "person_ambig",
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
      assert.ok(
        pop.populationBlockers.some(
          (b) => b.personId === "person_ambig" && b.field === "ambiguous-employment-dates"
        )
      );
    });

    it("missing period-effective clinic assignment blocks", () => {
      seedRuleAndMapping();
      injectTestPersonIdentity({
        personId: "person_noclinic2",
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
        personId: "person_noclinic2",
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
      assert.ok(
        pop.populationBlockers.some(
          (b) => b.personId === "person_noclinic2" && b.field === "clinicId"
        )
      );
    });

    it("ambiguous clinic assignment blocks", () => {
      seedRuleAndMapping();
      injectTestPersonIdentity({
        personId: "person_ambigclinic",
        displayLabel: "Ambig Clinic",
        personKind: "staff",
        organisationId: ORG_A,
        clinicId: CLINIC_A,
        classificationRef: "class_rn",
        employmentStatus: "active",
        employmentEffectiveFrom: "2020-01-01",
        employmentEffectiveTo: null,
        clinicAssignmentEffectiveFrom: "2025-06-01",
        clinicAssignmentEffectiveTo: "2024-01-01",
        readOnly: true,
        source: "m04-adapter",
      });
      createPayProfile(actorAll(), {
        personId: "person_ambigclinic",
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
      assert.ok(
        pop.populationBlockers.some(
          (b) =>
            b.personId === "person_ambigclinic" && b.field === "ambiguous-clinic-assignment"
        )
      );
    });

    it("ordinary persisted record cannot use demo defaults", () => {
      seedRuleAndMapping();
      injectTestPersonIdentity({
        personId: "person_ops_missing",
        displayLabel: "Ops Missing",
        personKind: "staff",
        organisationId: ORG_A,
        clinicId: CLINIC_A,
        classificationRef: "class_rn",
        readOnly: true,
        source: "m04-adapter",
      });
      createPayProfile(actorAll(), {
        personId: "person_ops_missing",
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
      assert.ok(!pop.eligible.some((e) => e.personId === "person_ops_missing"));
      assert.ok(pop.populationBlockers.some((b) => b.personId === "person_ops_missing"));
    });

    it("explicitly marked demo seed follows only approved isolated demo behaviour", () => {
      seedRuleAndMapping();
      injectTestPersonIdentity({
        personId: "person_demo_seed",
        displayLabel: "Demo Seed",
        personKind: "staff",
        organisationId: ORG_A,
        clinicId: CLINIC_A,
        classificationRef: "class_rn",
        demoDataMarker: M07_DEMO_PERSON_SEED_MARKER,
        readOnly: true,
        source: "m04-adapter",
      });
      createPayProfile(actorAll(), {
        personId: "person_demo_seed",
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
      assert.ok(pop.eligible.some((e) => e.personId === "person_demo_seed"));
      assert.ok(!pop.populationBlockers.some((b) => b.personId === "person_demo_seed"));
    });
  });

  describe("profile / classification invalidation", () => {
    it("profile change after approval immediately produces stale", () => {
      const period = prepareReadyPeriod("prof");
      approveReady(period.id);
      const profile = activeProfileFor("person_a");
      updatePayProfile(actorAll(), profile.id, {
        m04ClassificationRef: "class_rn_changed",
      });
      assert.equal(getCurrentApprovalForPeriod(period.id)?.status, "stale");
      assert.equal(getPeriod(period.id)?.state, "open");
      assert.ok(listAudit().some((a) => a.action === "approval.stale"));
    });

    it("employment-date change after approval immediately produces stale", () => {
      const period = prepareReadyPeriod("emp");
      approveReady(period.id);
      const profile = activeProfileFor("person_a");
      updatePayProfile(actorAll(), profile.id, { effectiveFrom: "2026-02-01" });
      assert.equal(getCurrentApprovalForPeriod(period.id)?.status, "stale");
      // M04 employment bridge also invalidates when observed
      notifyM04EmploymentContextChanged(actorAll(), {
        legalEntityId: ORG_A,
        personId: "person_a",
        reason: "m04-employment-effective-from-changed",
      });
      assert.equal(getCurrentApprovalForPeriod(period.id)?.status, "stale");
    });

    it("clinic-assignment change after approval immediately produces stale where supported", () => {
      const period = prepareReadyPeriod("clinic");
      approveReady(period.id);
      const profile = activeProfileFor("person_a");
      updatePayProfile(actorAll(), profile.id, { clinicId: "loc_eightmile" });
      assert.equal(getCurrentApprovalForPeriod(period.id)?.status, "stale");
    });

    it("classification mapping replacement after approval immediately produces stale", () => {
      const period = prepareReadyPeriod("maprep");
      approveReady(period.id);
      const activeMap = mappingFromPerson();
      const rule2 = createPreparationRule(actorAll(), {
        legalEntityId: ORG_A,
        code: "ORD_OT_R2",
        label: "Replacement rule",
        ordinaryMultiplier: 1,
        overtimeMultiplier: 1.5,
        effectiveFrom: "2026-01-01",
      });
      replaceClassificationMapping(actorAll(), {
        mappingId: activeMap.id,
        preparationRuleId: rule2.id,
        effectiveFrom: "2026-01-01",
        reason: "remediation replace",
      });
      assert.equal(getCurrentApprovalForPeriod(period.id)?.status, "stale");
    });

    it("classification mapping deactivation after approval immediately produces stale", () => {
      const period = prepareReadyPeriod("mapret");
      approveReady(period.id);
      const activeMap = mappingFromPerson();
      retireClassificationMapping(actorAll(), activeMap.id, "deactivate after approve");
      assert.equal(getCurrentApprovalForPeriod(period.id)?.status, "stale");
    });

    it("irrelevant profile change does not incorrectly stale approval", () => {
      const period = prepareReadyPeriod("irr");
      approveReady(period.id);
      const profile = activeProfileFor("person_a");
      updatePayProfile(actorAll(), profile.id, { ordinaryHourlyRate: 55 });
      assert.equal(getCurrentApprovalForPeriod(period.id)?.status, "approved");
      assert.equal(getPeriod(period.id)?.state, "export-ready");
    });

    it("identical invalidation replay does not duplicate lifecycle, audit or M02 records", () => {
      const period = prepareReadyPeriod("idem");
      approveReady(period.id);
      const beforeAudit = listAudit().filter((a) => a.action === "approval.stale").length;
      const logicalKey = `approval::${ORG_A}::${period.id}`;
      markPeriodApprovalStale(actorAll(), { periodId: period.id, reason: "replay-a" });
      const inbox1 = findInboxActionForSource("staff-pay", "pay-period-approval", logicalKey);
      markPeriodApprovalStale(actorAll(), { periodId: period.id, reason: "replay-b" });
      invalidateApprovalIfSourcesChanged(actorAll(), period.id, "replay-c");
      const afterAudit = listAudit().filter((a) => a.action === "approval.stale").length;
      assert.equal(afterAudit - beforeAudit, 1);
      const inbox2 = findInboxActionForSource("staff-pay", "pay-period-approval", logicalKey);
      assert.equal(inbox1?.id, inbox2?.id);
      assert.equal(
        listApprovals(ORG_A).filter((a) => a.periodId === period.id && a.status === "stale").length,
        1
      );
    });

    it("alternate mutation paths cannot bypass invalidation", () => {
      const period = prepareReadyPeriod("bypass");
      approveReady(period.id);
      const profile = activeProfileFor("person_a");
      // Direct repository write must not be used by production services; prove services path required
      upsertProfile({
        ...profile,
        m04ClassificationRef: "class_bypass",
        version: profile.version + 1,
        updatedAt: new Date().toISOString(),
        updatedBy: "bypass",
      });
      // Without invalidation hook, status remains approved — services must be the mutation path
      assert.equal(getCurrentApprovalForPeriod(period.id)?.status, "approved");
      // Service path then invalidates
      updatePayProfile(actorAll(), profile.id, { m04ClassificationRef: "class_via_service" });
      assert.equal(getCurrentApprovalForPeriod(period.id)?.status, "stale");

      const files = walkProductionTsFiles(M07_ROOT);
      for (const f of files) {
        if (f.includes(`${join("m07-staff-pay", "repository")}`)) continue;
        if (f.includes(`${join("services", "profile-service")}`)) continue;
        if (f.includes(`${join("services", "rule-service")}`)) continue;
        if (f.includes(`${join("m07-staff-pay", "storage")}`)) continue;
        const src = readFileSync(f, "utf8");
        assert.equal(
          /upsertProfile\s*\(/.test(src),
          false,
          `unexpected upsertProfile outside profile-service: ${f}`
        );
        assert.equal(
          /upsertClassificationMap\s*\(/.test(src),
          false,
          `unexpected upsertClassificationMap outside rule-service: ${f}`
        );
      }
    });
  });

  describe("dedicated SoD proofs", () => {
    it("rejects approval when approver is material deduction creator", () => {
      const period = prepareReadyPeriod("sod-ded");
      const code = createGenericCode(actorAll(), {
        legalEntityId: ORG_A,
        code: "DED_SOD",
        label: "Deduction SoD",
        lineType: "deduction",
        effectiveFrom: "2026-01-01",
      });
      const dedCreator = actorClerk("u-ded-creator");
      createDeductionPrepInput(dedCreator, {
        periodId: period.id,
        personId: "person_a",
        codeId: code.id,
        quantity: 1,
        reason: "sod deduction",
      });
      // recalculate so readiness includes deduction lines
      calculatePersonOrdinaryAndOvertime(actorClerk("u-clerk-calc"), {
        periodId: period.id,
        personId: "person_a",
      });
      submitPeriodForReview(actorClerk("u-clerk-sub-sod"), { periodId: period.id });
      const approverAsCreator = {
        ...actorApprover("u-ded-creator"),
        userId: "u-ded-creator",
        permissions: [...actorApprover().permissions],
      };
      assert.throws(
        () => approvePeriodManagement(approverAsCreator, { periodId: period.id }),
        M07SeparationOfDutiesError
      );
      // Independent approver still succeeds — no dual approval introduced
      const ok = approvePeriodManagement(actorApprover("u-appr-independent"), {
        periodId: period.id,
      });
      assert.equal(ok.status, "approved");
      assert.equal(ok.approvedBy, "u-appr-independent");
    });

    it("rejects approval when approver is material exception resolver", () => {
      const period = prepareReadyPeriod("sod-res");
      const opener = actorClerk("u-ex-opener");
      const resolver = actorClerk("u-ex-resolver");
      openPayPrepException(opener, {
        legalEntityId: ORG_A,
        organisationId: ORG_A,
        periodId: period.id,
        personId: "person_a",
        kind: "missing-rate",
        message: "open for sod",
        clinicId: CLINIC_A,
      });
      const list = awaitableExceptions();
      resolvePayPrepException(resolver, list[0]!.id, "resolved for sod");
      calculatePersonOrdinaryAndOvertime(actorClerk("u-clerk-calc"), {
        periodId: period.id,
        personId: "person_a",
      });
      submitPeriodForReview(actorClerk("u-clerk-sub-res"), { periodId: period.id });
      assert.throws(
        () =>
          approvePeriodManagement(
            { ...actorApprover("u-ex-resolver"), userId: "u-ex-resolver" },
            { periodId: period.id }
          ),
        M07SeparationOfDutiesError
      );
    });

    it("rejects approval when approver is material exception waiver actor", () => {
      const period = prepareReadyPeriod("sod-wav");
      const opener = actorClerk("u-wav-opener");
      const waiverActor = {
        ...actorClerk("u-wav-actor"),
        permissions: [
          ...actorClerk("u-wav-actor").permissions,
          "payroll.exception.waive",
          "payroll.approve",
        ],
      };
      openPayPrepException(opener, {
        legalEntityId: ORG_A,
        organisationId: ORG_A,
        periodId: period.id,
        personId: "person_a",
        kind: "missing-rate",
        message: "waive sod",
        clinicId: CLINIC_A,
      });
      const ex = awaitableExceptions()[0]!;
      waivePayPrepException(waiverActor, ex.id, "waiver reason for sod");
      calculatePersonOrdinaryAndOvertime(actorClerk("u-clerk-calc"), {
        periodId: period.id,
        personId: "person_a",
      });
      submitPeriodForReview(actorClerk("u-clerk-sub-wav"), { periodId: period.id });
      assert.throws(
        () =>
          approvePeriodManagement(
            { ...actorApprover("u-wav-actor"), userId: "u-wav-actor" },
            { periodId: period.id }
          ),
        M07SeparationOfDutiesError
      );
    });

    it("incomplete or missing material-actor provenance fails closed", () => {
      const period = prepareReadyPeriod("prov");
      submitPeriodForReview(actorClerk("u-clerk-prov"), { periodId: period.id });
      const current = getCurrentApprovalForPeriod(period.id)!;
      const broken = {
        ...current,
        manifest: {
          ...current.manifest,
          calculations: current.manifest.calculations.map((c) => ({
            ...c,
            batchId: "missing_batch",
          })),
        },
      };
      assert.throws(() => assertMaterialActorProvenance(broken), M07ValidationError);
    });

    it("unrelated historical actors do not incorrectly block approval", () => {
      const period = prepareReadyPeriod("hist");
      // Prior calc by historical actor — superseded by later calc; not pinned
      calculatePersonOrdinaryAndOvertime(actorClerk("u-hist-calc"), {
        periodId: period.id,
        personId: "person_a",
      });
      calculatePersonOrdinaryAndOvertime(actorClerk("u-clerk-calc"), {
        periodId: period.id,
        personId: "person_a",
      });
      submitPeriodForReview(actorClerk("u-clerk-hist"), { periodId: period.id });
      const materialBefore = collectMaterialPreparerUserIds(
        getCurrentApprovalForPeriod(period.id)!
      );
      assert.ok(!materialBefore.includes("u-hist-calc"));
      const approved = approvePeriodManagement(
        { ...actorApprover("u-hist-calc"), userId: "u-hist-calc" },
        { periodId: period.id }
      );
      assert.equal(approved.status, "approved");
      assert.ok(approved.manifest.calculations.length >= 1);
    });

    it("material actors are derived from the pinned manifest; no dual approval", () => {
      const period = prepareReadyPeriod("pin");
      submitPeriodForReview(actorClerk("u-clerk-pin"), { periodId: period.id });
      const submitted = getCurrentApprovalForPeriod(period.id)!;
      const material = collectMaterialPreparerUserIds(submitted);
      assert.ok(material.includes("u-clerk-pin"));
      assert.ok(material.includes("u-clerk-calc"));
      const approved = approvePeriodManagement(actorApprover("u-appr-pin"), {
        periodId: period.id,
      });
      assert.equal(approved.approvedBy, "u-appr-pin");
      assert.notEqual(approved.approvedBy, approved.submittedBy);
      assert.equal(listApprovals(ORG_A).filter((a) => a.periodId === period.id && a.status === "approved").length, 1);
    });
  });
});

function mappingFromPerson() {
  const m = listClassificationMaps(ORG_A).find(
    (x) => x.status === "active" && x.m04ClassificationRef === "class_rn"
  );
  assert.ok(m);
  return m!;
}

function awaitableExceptions() {
  return listExceptions(ORG_A).filter((e) => e.personId === "person_a");
}
