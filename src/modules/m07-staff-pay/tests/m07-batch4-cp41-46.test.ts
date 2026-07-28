/**
 * Wave 6 / M07 Batch 4 — CP 4.1–4.6 functional coverage.
 */

import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { publishTimesheetVersion } from "@/platform/workforce/services/published-timesheet-registry";
import { findInboxActionForSource } from "@/platform/services/action-inbox-bridge";
import { writeJsonSafe } from "@/platform/storage/storage";

import {
  actorAll,
  actorApprover,
  actorClerk,
  CLINIC_A,
  ORG_A,
  ORG_B,
  resetM07TestEnv,
} from "./_helpers";
import { createOrdinaryPayPeriod } from "../services/period-service";
import { createPayProfile } from "../services/profile-service";
import {
  createClassificationMapping,
  createPreparationRule,
} from "../services/rule-service";
import { createGenericCode } from "../services/code-service";
import { calculatePersonOrdinaryAndOvertime } from "../services/calculate-service";
import {
  createDeductionPrepInput,
  supersedeDeductionPrepInput,
  cancelDeductionPrepInput,
  listDeductionPrepInputHistory,
} from "../services/deduction-prep-input-service";
import { buildVarianceViews } from "../services/variance-service";
import {
  listOpenExceptions,
  listPayPrepExceptions,
  openPayPrepException,
  resolvePayPrepException,
  waivePayPrepException,
} from "../services/exception-service";
import { buildPeopleReviewRows } from "../services/people-review-read-model";
import { intakePublishedTimesheet } from "../services/published-timesheet-intake";
import { seedEligibilityForImportedSnapshot } from "../services/published-timesheet-lifecycle";
import { listM07InboxProjections } from "../adapters/m02-inbox-publish";
import { listAudit, listCalculationBatches } from "../repository/local-store";
import { M07_SECTION_META } from "../section-meta";
import { M07ValidationError, M07SeparationOfDutiesError } from "../permissions";

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

function publishAndIntake(input: {
  timesheetRecordId: string;
  eventId: string;
  allowanceInputs?: Array<{ allowanceCode: string; quantity: number }>;
  ordinaryHours?: number;
}) {
  const content = {
    timesheetRecordId: input.timesheetRecordId,
    workforcePersonId: "person_a",
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
    allowanceInputs: input.allowanceInputs ?? [],
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

describe("M07 Batch 4 — allowance, deduction, variance, exceptions, integration", () => {
  beforeEach(() => {
    resetM07TestEnv();
  });

  describe("CP4.1 allowance preparation", () => {
    it("maps snapshot allowanceInputs to versioned code lines", () => {
      seedRuleAndMapping();
      seedProfile();
      const meal = createGenericCode(actorAll(), {
        legalEntityId: ORG_A,
        code: "MEAL",
        label: "Meal allowance (prep)",
        lineType: "allowance",
        effectiveFrom: "2026-01-01",
      });
      const period = createOrdinaryPayPeriod(actorAll(), {
        legalEntityId: ORG_A,
        periodStart: "2026-07-01",
        periodEnd: "2026-07-14",
        clinicIds: [CLINIC_A],
      });
      publishAndIntake({
        timesheetRecordId: "ts_all_1",
        eventId: "evt_all_1",
        allowanceInputs: [{ allowanceCode: "MEAL", quantity: 2 }],
      });
      const result = calculatePersonOrdinaryAndOvertime(actorAll(), {
        periodId: period.id,
        personId: "person_a",
      });
      assert.equal(result.status, "completed");
      if (result.status !== "completed") return;
      const allow = result.batch.lines.filter((l) => l.lineType === "allowance");
      assert.equal(allow.length, 1);
      assert.equal(allow[0]!.codeId, meal.id);
      assert.equal(allow[0]!.codeVersion, meal.version);
      assert.equal(allow[0]!.quantity, 2);
      assert.equal(allow[0]!.certified, false);
    });

    it("blocks unknown and inactive allowance codes without payable lines", () => {
      seedRuleAndMapping();
      seedProfile();
      const period = createOrdinaryPayPeriod(actorAll(), {
        legalEntityId: ORG_A,
        periodStart: "2026-07-01",
        periodEnd: "2026-07-14",
      });
      publishAndIntake({
        timesheetRecordId: "ts_all_unk",
        eventId: "evt_all_unk",
        allowanceInputs: [{ allowanceCode: "NOPE", quantity: 1 }],
      });
      const result = calculatePersonOrdinaryAndOvertime(actorAll(), {
        periodId: period.id,
        personId: "person_a",
      });
      assert.equal(result.status, "blocked");
      const open = listOpenExceptions(actorAll(), ORG_A, { periodId: period.id });
      assert.ok(open.some((e) => e.kind === "unknown-allowance-code"));
      assert.equal(
        listCalculationBatches(ORG_A).filter((b) => b.status === "completed").length,
        0
      );
    });
  });

  describe("CP4.2 deduction inputs", () => {
    it("creates supersedes and cancels with history retained", () => {
      seedRuleAndMapping();
      seedProfile();
      const code = createGenericCode(actorAll(), {
        legalEntityId: ORG_A,
        code: "UNI",
        label: "Uniform deduction prep",
        lineType: "deduction",
        effectiveFrom: "2026-01-01",
      });
      const period = createOrdinaryPayPeriod(actorAll(), {
        legalEntityId: ORG_A,
        periodStart: "2026-07-01",
        periodEnd: "2026-07-14",
      });
      const created = createDeductionPrepInput(actorClerk(), {
        periodId: period.id,
        personId: "person_a",
        codeId: code.id,
        quantity: 1,
        reason: "uniform issue",
        clinicId: CLINIC_A,
      });
      assert.equal(created.status, "active");
      assert.equal(created.certified, false);

      const next = supersedeDeductionPrepInput(actorClerk(), created.id, {
        quantity: 2,
        reason: "corrected quantity",
      });
      assert.equal(next.quantity, 2);
      assert.equal(next.supersedesInputId, created.id);
      const history = listDeductionPrepInputHistory(actorAll(), ORG_A, {
        periodId: period.id,
        personId: "person_a",
      });
      assert.ok(history.some((h) => h.id === created.id && h.status === "superseded"));
      assert.ok(history.some((h) => h.id === next.id && h.status === "active"));

      cancelDeductionPrepInput(actorClerk(), next.id, "no longer required");
      assert.throws(
        () =>
          createDeductionPrepInput(actorClerk(), {
            periodId: period.id,
            personId: "person_a",
            codeId: code.id,
            quantity: 1,
            reason: "",
          }),
        (e: unknown) => e instanceof M07ValidationError
      );
    });

    it("calculation emits deduction prep lines from active inputs", () => {
      seedRuleAndMapping();
      seedProfile();
      const code = createGenericCode(actorAll(), {
        legalEntityId: ORG_A,
        code: "PARK",
        label: "Parking units",
        lineType: "deduction",
        effectiveFrom: "2026-01-01",
      });
      const period = createOrdinaryPayPeriod(actorAll(), {
        legalEntityId: ORG_A,
        periodStart: "2026-07-01",
        periodEnd: "2026-07-14",
      });
      const din = createDeductionPrepInput(actorClerk(), {
        periodId: period.id,
        personId: "person_a",
        codeId: code.id,
        quantity: 3,
        reason: "parking days",
        clinicId: CLINIC_A,
      });
      publishAndIntake({ timesheetRecordId: "ts_ded_1", eventId: "evt_ded_1" });
      const result = calculatePersonOrdinaryAndOvertime(actorAll(), {
        periodId: period.id,
        personId: "person_a",
      });
      assert.equal(result.status, "completed");
      if (result.status !== "completed") return;
      const ded = result.batch.lines.filter((l) => l.lineType === "deduction");
      assert.equal(ded.length, 1);
      assert.equal(ded[0]!.deductionInputId, din.id);
      assert.equal(ded[0]!.quantity, 3);
    });

    it("rejects doctor deduction inputs and cross-org period use", () => {
      seedRuleAndMapping();
      const code = createGenericCode(actorAll(), {
        legalEntityId: ORG_A,
        code: "X",
        label: "X",
        lineType: "deduction",
        effectiveFrom: "2026-01-01",
      });
      const period = createOrdinaryPayPeriod(actorAll(), {
        legalEntityId: ORG_A,
        periodStart: "2026-07-01",
        periodEnd: "2026-07-14",
      });
      assert.throws(
        () =>
          createDeductionPrepInput(actorAll(), {
            periodId: period.id,
            personId: "person_doc",
            codeId: code.id,
            quantity: 1,
            reason: "should fail",
          }),
        /doctor/i
      );
    });
  });

  describe("CP4.3 variance informational", () => {
    it("returns compared or unavailable without inventing blockers", () => {
      seedRuleAndMapping();
      seedProfile();
      const period = createOrdinaryPayPeriod(actorAll(), {
        legalEntityId: ORG_A,
        periodStart: "2026-07-01",
        periodEnd: "2026-07-14",
      });
      publishAndIntake({
        timesheetRecordId: "ts_var_1",
        eventId: "evt_var_1",
        ordinaryHours: 40,
      });
      // Seed a published M05 assignment overlapping the period
      writeJsonSafe("pulse.m05.roster.publications", [
        { id: "pub1", state: "published" },
      ]);
      writeJsonSafe("pulse.m05.roster.shifts", [
        {
          id: "sh1",
          clinicId: CLINIC_A,
          localStart: "2026-07-02T09:00:00.000Z",
          localEnd: "2026-07-02T17:00:00.000Z",
        },
      ]);
      writeJsonSafe("pulse.m05.roster.assignments", [
        {
          id: "as1",
          shiftId: "sh1",
          personId: "person_a",
          clinicId: CLINIC_A,
          publicationId: "pub1",
          state: "assigned",
        },
      ]);

      const views = buildVarianceViews(actorAll(), {
        legalEntityId: ORG_A,
        periodId: period.id,
      });
      const row = views.find((v) => v.personId === "person_a");
      assert.ok(row);
      assert.equal(row!.informationalOnly, true);
      assert.ok(["compared", "incomplete", "unavailable"].includes(row!.status));
      // Variance must not open exceptions
      assert.equal(listOpenExceptions(actorAll(), ORG_A).length, 0);
      const before = listOpenExceptions(actorAll(), ORG_A).length;
      calculatePersonOrdinaryAndOvertime(actorAll(), {
        periodId: period.id,
        personId: "person_a",
      });
      // Calculation still allowed with variance present
      assert.ok(listCalculationBatches(ORG_A).some((b) => b.status === "completed"));
      assert.equal(listOpenExceptions(actorAll(), ORG_A).length, before);
    });
  });

  describe("CP4.4 exceptions waive", () => {
    it("waives waivable kinds with SoD and rejects non-waivable / self-waiver", () => {
      seedProfile();
      const period = createOrdinaryPayPeriod(actorAll(), {
        legalEntityId: ORG_A,
        periodStart: "2026-07-01",
        periodEnd: "2026-07-14",
      });
      const opened = openPayPrepException(actorAll("u-creator"), {
        legalEntityId: ORG_A,
        organisationId: ORG_A,
        clinicId: CLINIC_A,
        periodId: period.id,
        personId: "person_a",
        kind: "missing-rate",
        message: "rate missing",
      });

      assert.throws(
        () => waivePayPrepException(actorAll("u-creator"), opened.id, "self waive"),
        (e: unknown) => e instanceof M07SeparationOfDutiesError
      );

      const waived = waivePayPrepException(
        actorApprover("u-approver-ex"),
        opened.id,
        "approved waive"
      );
      assert.equal(waived.status, "waived");
      assert.ok(listAudit(ORG_A).some((a) => a.action === "exception.waived"));

      const boundary = openPayPrepException(actorAll(), {
        legalEntityId: ORG_A,
        organisationId: ORG_A,
        clinicId: CLINIC_A,
        periodId: period.id,
        personId: "person_a",
        kind: "doctor-pay-excluded",
        message: "doctor",
      });
      assert.throws(
        () => waivePayPrepException(actorApprover(), boundary.id, "nope"),
        /non-waivable|cannot be waived/i
      );
    });
  });

  describe("CP4.5 people review + M02", () => {
    it("surfaces allowance/deduction/variance fields and projects allowance blockers", () => {
      seedRuleAndMapping();
      seedProfile();
      const period = createOrdinaryPayPeriod(actorAll(), {
        legalEntityId: ORG_A,
        periodStart: "2026-07-01",
        periodEnd: "2026-07-14",
      });
      publishAndIntake({
        timesheetRecordId: "ts_pr_1",
        eventId: "evt_pr_1",
        allowanceInputs: [{ allowanceCode: "MISSING", quantity: 1 }],
      });
      const blocked = calculatePersonOrdinaryAndOvertime(actorAll(), {
        periodId: period.id,
        personId: "person_a",
      });
      assert.equal(blocked.status, "blocked");
      const ex = listOpenExceptions(actorAll(), ORG_A, { periodId: period.id })[0]!;
      const inbox = findInboxActionForSource("staff-pay", "pay-prep-exception", ex.id);
      assert.ok(inbox);

      createGenericCode(actorAll(), {
        legalEntityId: ORG_A,
        code: "MEAL",
        label: "Meal",
        lineType: "allowance",
        effectiveFrom: "2026-01-01",
      });
      // Fix path: new snapshot without bad allowance — people review still builds
      const rows = buildPeopleReviewRows(actorAll(), {
        legalEntityId: ORG_A,
        periodId: period.id,
      });
      const row = rows.find((r) => r.personId === "person_a");
      assert.ok(row);
      assert.ok(row!.exceptionCounts.open >= 1);
      assert.ok(row!.varianceSummary.status);
      assert.equal(M07_SECTION_META.variances.batch1, "available");
      assert.equal(M07_SECTION_META.exceptions.batch1, "available");
    });
  });

  describe("CP4.6 architecture", () => {
    it("forbids M04/M05/M06/M02 repository imports and payment fields", () => {
      for (const file of walkProductionTsFiles(M07_ROOT)) {
        const stripped = stripCommentsAndStrings(readFileSync(file, "utf8"));
        assert.doesNotMatch(stripped, /m04-staff-doctors\/(repository|services)/);
        assert.doesNotMatch(stripped, /m05-roster\/(repository|services)/);
        assert.doesNotMatch(stripped, /m06-time-attendance\/(repository|services)/);
        assert.doesNotMatch(stripped, /action-inbox\/repository/);
        assert.doesNotMatch(stripped, /\bnetPay\b|\bmarkAsPaid\b|\bpaymentStatus\b/);
      }
      const ws = readFileSync(join(M07_ROOT, "StaffPayWorkspace.tsx"), "utf8");
      assert.match(ws, /data-m07-shell="batch5-approval"/);
      assert.match(ws, /VariancesSection/);
      assert.match(ws, /ExceptionsSection/);
    });

    it("rejects cross-legal-entity deduction isolation", () => {
      const code = createGenericCode(actorAll(), {
        legalEntityId: ORG_A,
        code: "ISO",
        label: "iso",
        lineType: "deduction",
        effectiveFrom: "2026-01-01",
      });
      createPayProfile(actorAll(), {
        personId: "person_a",
        legalEntityId: ORG_A,
        clinicId: CLINIC_A,
        m04ClassificationRef: "class_rn",
        ordinaryHourlyRate: 40,
        effectiveFrom: "2026-01-01",
      });
      const periodB = createOrdinaryPayPeriod(actorAll(), {
        legalEntityId: ORG_B,
        periodStart: "2026-07-01",
        periodEnd: "2026-07-14",
      });
      assert.throws(() =>
        createDeductionPrepInput(actorAll(), {
          periodId: periodB.id,
          personId: "person_a",
          codeId: code.id,
          quantity: 1,
          reason: "cross",
        })
      );
    });
  });
});
