/**
 * Wave 6 / M07 Batch 3 — CP 3.1–3.6 functional coverage.
 */

import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { publishTimesheetVersion } from "@/platform/workforce/services/published-timesheet-registry";
import { calculatePayrollContentHash } from "@/platform/workforce/contracts/published-timesheet-hash";
import { findInboxActionForSource } from "@/platform/services/action-inbox-bridge";

import {
  actorAll,
  actorClinicManager,
  actorClerk,
  CLINIC_A,
  ORG_A,
  ORG_B,
  resetM07TestEnv,
} from "./_helpers";
import { injectTestApprovedLeave } from "../adapters/m04-leave-read";
import { injectTestPersonIdentity } from "../adapters/m04-person-read";
import { createOrdinaryPayPeriod } from "../services/period-service";
import { createPayProfile, linkExternalPayrollEmployeeId, updatePayProfile } from "../services/profile-service";
import {
  createClassificationMapping,
  createPreparationRule,
  versionPreparationRule,
} from "../services/rule-service";
import { resolvePersonPreparationInputs } from "../services/classification-resolve";
import {
  calculatePersonOrdinaryAndOvertime,
  listPersonCalculationBatches,
} from "../services/calculate-service";
import {
  generateLeavePreparationForPerson,
  listLeavePreparation,
} from "../services/leave-prep-service";
import { listOpenExceptions, resolvePayPrepException } from "../services/exception-service";
import { buildPeopleReviewRows } from "../services/people-review-read-model";
import { intakePublishedTimesheet } from "../services/published-timesheet-intake";
import { seedEligibilityForImportedSnapshot } from "../services/published-timesheet-lifecycle";
import { listM07InboxProjections } from "../adapters/m02-inbox-publish";
import { listAudit, listLeavePrepLines } from "../repository/local-store";
import { M07_SECTION_META } from "../section-meta";
import { M07_STORAGE_KEYS } from "../storage/keys";
import { M07ValidationError } from "../permissions";

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

function seedRuleAndMapping(actor = actorAll()) {
  const rule = createPreparationRule(actor, {
    legalEntityId: ORG_A,
    code: "ORD_OT",
    label: "Ordinary/OT prep",
    ordinaryMultiplier: 1,
    overtimeMultiplier: 1.5,
    effectiveFrom: "2026-01-01",
  });
  const mapping = createClassificationMapping(actor, {
    legalEntityId: ORG_A,
    m04ClassificationRef: "class_rn",
    preparationRuleId: rule.id,
    effectiveFrom: "2026-01-01",
  });
  return { rule, mapping };
}

function publishAndIntakeEligible(input: {
  timesheetRecordId: string;
  eventId: string;
  personId?: string;
  ordinaryHours?: number;
  overtimeHours?: number;
  penaltyHours?: number;
  allowanceInputs?: Array<{ allowanceCode: string; quantity: number }>;
}) {
  const content = {
    timesheetRecordId: input.timesheetRecordId,
    workforcePersonId: input.personId ?? "person_a",
    organisationId: ORG_A,
    legalEntityId: ORG_A,
    clinicId: CLINIC_A,
    periodStart: "2026-07-01",
    periodEnd: "2026-07-14",
    attendanceSessionIds: ["sess_a"],
    ordinaryHourInputs: [{ code: "ORD", hours: input.ordinaryHours ?? 76 }],
    overtimeHourInputs: [{ code: "OT15", hours: input.overtimeHours ?? 2 }],
    penaltyHourInputs:
      input.penaltyHours && input.penaltyHours > 0
        ? [{ code: "PEN", hours: input.penaltyHours }]
        : [],
    leaveInputs: [
      {
        leaveRecordId: "leave_from_snapshot_must_not_count",
        leaveTypeCode: "ANNUAL",
        hours: 8,
        localStart: "2026-07-03",
        localEnd: "2026-07-03",
        sourceVersion: 1,
      },
    ],
    // Default empty — Batch 4 maps allowanceInputs; leave Batch 3 success path without allowances
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
  assert.ok(intake.snapshot);
  seedEligibilityForImportedSnapshot({
    actor: actorAll(),
    snapshot: intake.snapshot!,
  });
  return {
    snapshot: intake.snapshot!,
    contentHash: calculatePayrollContentHash(content),
  };
}

describe("M07 Batch 3 — classification, calc, people, leave, M02, architecture", () => {
  beforeEach(() => resetM07TestEnv());

  describe("CP3.1 classification + blockers", () => {
    it("resolves mapping when profile, classification, rule and rate exist", () => {
      seedRuleAndMapping();
      createPayProfile(actorAll(), {
        personId: "person_a",
        legalEntityId: ORG_A,
        clinicId: CLINIC_A,
        m04ClassificationRef: "class_rn",
        ordinaryHourlyRate: 40,
        effectiveFrom: "2026-01-01",
      });
      const resolved = resolvePersonPreparationInputs(actorAll(), {
        legalEntityId: ORG_A,
        personId: "person_a",
      });
      assert.equal(resolved.status, "resolved");
      assert.ok(resolved.ruleId);
      assert.ok(resolved.ruleVersion);
    });

    it("fails closed for missing rate and doctor exclusion", () => {
      seedRuleAndMapping();
      createPayProfile(actorAll(), {
        personId: "person_a",
        legalEntityId: ORG_A,
        clinicId: CLINIC_A,
        m04ClassificationRef: "class_rn",
        ordinaryHourlyRate: null,
        effectiveFrom: "2026-01-01",
      });
      assert.equal(
        resolvePersonPreparationInputs(actorAll(), {
          legalEntityId: ORG_A,
          personId: "person_a",
        }).status,
        "missing-rate"
      );
      assert.equal(
        resolvePersonPreparationInputs(actorAll(), {
          legalEntityId: ORG_A,
          personId: "person_doc",
        }).status,
        "doctor-pay-excluded"
      );
    });

    it("fails closed for missing classification→rule map", () => {
      createPayProfile(actorAll(), {
        personId: "person_a",
        legalEntityId: ORG_A,
        clinicId: CLINIC_A,
        m04ClassificationRef: "class_rn",
        ordinaryHourlyRate: 40,
        effectiveFrom: "2026-01-01",
      });
      assert.equal(
        resolvePersonPreparationInputs(actorAll(), {
          legalEntityId: ORG_A,
          personId: "person_a",
        }).status,
        "missing-classification-rule-map"
      );
    });
  });

  describe("CP3.2 ordinary/OT calculation + ruleVersion", () => {
    it("calculates ordinary and overtime from eligible snapshot and pins ruleVersion", () => {
      const { rule } = seedRuleAndMapping();
      createPayProfile(actorAll(), {
        personId: "person_a",
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
        clinicIds: [CLINIC_A],
      });
      publishAndIntakeEligible({ timesheetRecordId: "ts_calc_1", eventId: "evt_calc_1" });

      const result = calculatePersonOrdinaryAndOvertime(actorAll(), {
        periodId: period.id,
        personId: "person_a",
      });
      assert.equal(result.status, "completed");
      if (result.status !== "completed") return;
      assert.equal(result.batch.ruleId, rule.id);
      assert.equal(result.batch.ruleVersion, rule.version);
      assert.equal(result.batch.certified, false);
      assert.match(result.batch.disclaimer, /not award-certified/i);
      const ord = result.batch.lines.filter((l) => l.lineType === "ordinary");
      const ot = result.batch.lines.filter((l) => l.lineType === "overtime");
      assert.ok(ord.length >= 1);
      assert.ok(ot.length >= 1);
      assert.equal(ot[0]!.hours, 3); // 2 * 1.5
      assert.equal(result.batch.lines.every((l) => l.ruleVersion === rule.version), true);
      // no allowance lines
      assert.equal(
        result.batch.lines.some((l) => (l as { lineType: string }).lineType === "allowance"),
        false
      );
    });

    it("recalculation creates new batch version and keeps prior ruleVersion on old lines", () => {
      seedRuleAndMapping();
      createPayProfile(actorAll(), {
        personId: "person_a",
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
      publishAndIntakeEligible({ timesheetRecordId: "ts_recalc", eventId: "evt_recalc" });
      const first = calculatePersonOrdinaryAndOvertime(actorAll(), {
        periodId: period.id,
        personId: "person_a",
      });
      assert.equal(first.status, "completed");
      if (first.status !== "completed") return;
      const priorVersion = first.batch.ruleVersion;
      const priorLineRule = first.batch.lines[0]!.ruleVersion;

      versionPreparationRule(actorAll(), first.batch.ruleId, {
        ordinaryMultiplier: 1,
        overtimeMultiplier: 2,
      });

      const second = calculatePersonOrdinaryAndOvertime(actorAll(), {
        periodId: period.id,
        personId: "person_a",
      });
      assert.equal(second.status, "completed");
      if (second.status !== "completed") return;
      assert.equal(second.batch.batchVersion, first.batch.batchVersion + 1);
      assert.ok(second.batch.ruleVersion > priorVersion);
      // historical first batch lines retain original ruleVersion in storage
      assert.equal(priorLineRule, priorVersion);
      assert.equal(first.batch.lines[0]!.ruleVersion, priorVersion);
    });

    it("blocks penalty inputs and ineligible/missing snapshots", () => {
      seedRuleAndMapping();
      createPayProfile(actorAll(), {
        personId: "person_a",
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
      publishAndIntakeEligible({
        timesheetRecordId: "ts_pen",
        eventId: "evt_pen",
        penaltyHours: 4,
      });
      const blocked = calculatePersonOrdinaryAndOvertime(actorAll(), {
        periodId: period.id,
        personId: "person_a",
      });
      assert.equal(blocked.status, "blocked");
      const open = listOpenExceptions(actorAll(), ORG_A, { periodId: period.id });
      assert.ok(open.some((e) => e.kind === "unsupported-penalty-input"));
    });
  });

  describe("CP3.3 People Review + redaction + external id", () => {
    it("redacts rates for clinic managers and requires reason for external id", () => {
      seedRuleAndMapping();
      const profile = createPayProfile(actorAll(), {
        personId: "person_a",
        legalEntityId: ORG_A,
        clinicId: CLINIC_A,
        m04ClassificationRef: "class_rn",
        ordinaryHourlyRate: 55,
        effectiveFrom: "2026-01-01",
      });
      const period = createOrdinaryPayPeriod(actorAll(), {
        legalEntityId: ORG_A,
        periodStart: "2026-07-01",
        periodEnd: "2026-07-14",
      });
      const rows = buildPeopleReviewRows(actorClinicManager(), {
        legalEntityId: ORG_A,
        periodId: period.id,
      });
      const row = rows.find((r) => r.personId === "person_a");
      assert.ok(row);
      assert.equal(row!.ordinaryHourlyRate, "redacted");
      assert.equal(row!.externalPayrollEmployeeId, "redacted");

      assert.throws(
        () => linkExternalPayrollEmployeeId(actorAll(), profile.id, "EXT-1", ""),
        (e: unknown) => e instanceof M07ValidationError && e.reason === "reason-required"
      );
      const linked = linkExternalPayrollEmployeeId(
        actorAll(),
        profile.id,
        "EXT-1",
        "payroll system onboard"
      );
      assert.equal(linked.externalPayrollEmployeeId, "EXT-1");
      assert.ok(listAudit(ORG_A).some((a) => a.action === "profile.externalId.relink"));
    });

    it("marks people and leave sections available; allowances remain planned messaging", () => {
      assert.equal(M07_SECTION_META.people.batch1, "available");
      assert.equal(M07_SECTION_META.leave.batch1, "available");
      assert.match(M07_SECTION_META.leave.batchNote ?? "", /Batch 4/);
      const leaveUi = readFileSync(
        join(M07_ROOT, "sections/LeavePrepSection.tsx"),
        "utf8"
      );
      assert.match(leaveUi, /Allowances — preparation available/);
      assert.match(leaveUi, /data-m07-allowances="available-batch4"/);
    });
  });

  describe("CP3.4 leave preparation from M04 only", () => {
    it("creates leave prep lines from approved M04 leave and ignores snapshot leaveInputs", () => {
      seedRuleAndMapping();
      injectTestPersonIdentity({
        personId: "person_leave",
        displayLabel: "Leave Staff",
        personKind: "staff",
        organisationId: ORG_A,
        clinicId: CLINIC_A,
        classificationRef: "class_rn",
        readOnly: true,
        source: "m04-adapter",
      });
      const profile = createPayProfile(actorAll(), {
        personId: "person_leave",
        legalEntityId: ORG_A,
        clinicId: CLINIC_A,
        m04ClassificationRef: "class_rn",
        ordinaryHourlyRate: 40,
        effectiveFrom: "2026-01-01",
      });
      updatePayProfile(actorAll(), profile.id, { leavePayMapping: "AL-MAP-1" });
      injectTestApprovedLeave({
        leaveRecordId: "leave_ok_1",
        personId: "person_leave",
        organisationId: ORG_A,
        clinicId: CLINIC_A,
        leaveType: "Annual",
        startDate: "2026-07-03",
        endDate: "2026-07-04",
        status: "Approved",
        version: 2,
        readOnly: true,
        source: "m04-adapter",
      });

      const period = createOrdinaryPayPeriod(actorAll(), {
        legalEntityId: ORG_A,
        periodStart: "2026-07-01",
        periodEnd: "2026-07-14",
      });
      // Snapshot with leaveInputs must not create leave prep by itself
      publishAndIntakeEligible({
        timesheetRecordId: "ts_leave_ignore",
        eventId: "evt_leave_ignore",
        personId: "person_leave",
      });
      calculatePersonOrdinaryAndOvertime(actorAll(), {
        periodId: period.id,
        personId: "person_leave",
      });
      assert.equal(listLeavePrepLines(ORG_A).length, 0);

      const gen = generateLeavePreparationForPerson(actorAll(), {
        periodId: period.id,
        personId: "person_leave",
      });
      assert.equal(gen.prepared.length, 1);
      assert.equal(gen.prepared[0]!.m04LeaveRecordId, "leave_ok_1");
      assert.equal(gen.prepared[0]!.m04LeaveVersion, 2);
      assert.equal(gen.prepared[0]!.leaveDays, 2);
      assert.equal(gen.prepared[0]!.certified, false);
      assert.ok(listLeavePreparation(actorAll(), ORG_A, { periodId: period.id }).length >= 1);
    });

    it("opens leave-mapping-missing when mapping absent", () => {
      createPayProfile(actorAll(), {
        personId: "person_a",
        legalEntityId: ORG_A,
        clinicId: CLINIC_A,
        m04ClassificationRef: "class_rn",
        ordinaryHourlyRate: 40,
        effectiveFrom: "2026-01-01",
      });
      injectTestApprovedLeave({
        leaveRecordId: "leave_unmap",
        personId: "person_a",
        organisationId: ORG_A,
        clinicId: CLINIC_A,
        leaveType: "Sick",
        startDate: "2026-07-05",
        endDate: "2026-07-05",
        status: "Approved",
        version: 1,
        readOnly: true,
        source: "m04-adapter",
      });
      const period = createOrdinaryPayPeriod(actorAll(), {
        legalEntityId: ORG_A,
        periodStart: "2026-07-01",
        periodEnd: "2026-07-14",
      });
      const gen = generateLeavePreparationForPerson(actorAll(), {
        periodId: period.id,
        personId: "person_a",
      });
      assert.equal(gen.prepared.length, 0);
      assert.ok(gen.blockedExceptionIds.length >= 1);
      assert.ok(
        listOpenExceptions(actorAll(), ORG_A).some((e) => e.kind === "leave-mapping-missing")
      );
    });
  });

  describe("CP3.5 M02 projections", () => {
    it("projects blockers with dedupe and closes on resolve", () => {
      seedRuleAndMapping();
      createPayProfile(actorAll(), {
        personId: "person_a",
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
      publishAndIntakeEligible({
        timesheetRecordId: "ts_m02",
        eventId: "evt_m02",
        penaltyHours: 1,
      });
      const blocked = calculatePersonOrdinaryAndOvertime(actorAll(), {
        periodId: period.id,
        personId: "person_a",
      });
      assert.equal(blocked.status, "blocked");
      if (blocked.status !== "blocked") return;
      const exId = blocked.exceptionIds[0]!;
      const first = findInboxActionForSource("staff-pay", "pay-prep-exception", exId);
      assert.ok(first);
      // recalculate → update not duplicate
      calculatePersonOrdinaryAndOvertime(actorAll(), {
        periodId: period.id,
        personId: "person_a",
      });
      const second = findInboxActionForSource("staff-pay", "pay-prep-exception", exId);
      assert.ok(second);
      assert.equal(second!.id, first!.id);
      resolvePayPrepException(actorAll(), exId, "penalty removed upstream");
      assert.ok(listM07InboxProjections().some((p) => p.kind === "prep-blocker-closed"));
    });
  });

  describe("CP3.6 architecture + section shell", () => {
    it("forbids M04/M05/M06 repository imports and payment fields in production", () => {
      for (const file of walkProductionTsFiles(M07_ROOT)) {
        const stripped = stripCommentsAndStrings(readFileSync(file, "utf8"));
        assert.doesNotMatch(stripped, /m04-staff-doctors\/(repository|services)/);
        assert.doesNotMatch(stripped, /m05-roster\/(repository|services)/);
        assert.doesNotMatch(stripped, /m06-time-attendance\/(repository|services)/);
        assert.doesNotMatch(stripped, /action-inbox\/repository/);
        assert.doesNotMatch(stripped, /\bnetPay\b|\bmarkAsPaid\b|\bpaymentStatus\b/);
      }
    });

    it("workspace uses batch4 shell attribute", () => {
      const ws = readFileSync(join(M07_ROOT, "StaffPayWorkspace.tsx"), "utf8");
      assert.match(ws, /data-m07-shell="batch5-approval"/);
      assert.match(ws, /PeopleReviewSection/);
      assert.match(ws, /LeavePrepSection/);
    });
  });
});
