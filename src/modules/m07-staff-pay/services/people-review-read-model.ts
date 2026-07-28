/**
 * People Review read model — Batch 3 + Batch 4 readiness fields.
 */

import {
  assertM07ClinicScope,
  assertM07LegalEntityScope,
  assertM07Permission,
  hasM07Permission,
  type M07Actor,
} from "../permissions";
import { getPeriod, listExceptions, listProfiles } from "../repository/local-store";
import { resolvePersonIdentity } from "../adapters/m04-person-read";
import { resolvePersonPreparationInputs, isDoctorPayExcluded } from "./classification-resolve";
import { listPersonCalculationBatches } from "./calculate-service";
import { listLeavePreparation } from "./leave-prep-service";
import { listActiveDeductionPrepInputs } from "./deduction-prep-input-service";
import { buildVarianceViews } from "./variance-service";
import { getCurrentApprovalForPeriod } from "../repository/local-store";
import { M07_NON_CERTIFIED_DISCLAIMER } from "../types/domain";
import type { PayCalculationBatch, PayPrepException } from "../types/domain";

export type PeopleReviewRow = {
  personId: string;
  displayLabel: string;
  personKind?: string;
  legalEntityId: string;
  clinicId?: string;
  profileId?: string;
  classificationRef?: string | null;
  mappingStatus: string;
  mappingMessage?: string;
  ordinaryHourlyRate: number | null | "redacted";
  externalPayrollEmployeeId: string | null | "redacted" | undefined;
  doctorExcluded: boolean;
  openExceptions: Array<Pick<PayPrepException, "id" | "kind" | "message" | "status">>;
  exceptionCounts: { open: number; resolved: number; waived: number };
  latestCalculation: null | {
    batchId: string;
    batchVersion: number;
    ruleId: string;
    ruleVersion: number;
    ordinaryHours: number;
    overtimeHours: number;
    allowanceCount: number;
    deductionCount: number;
    disclaimer: string;
  };
  leavePrepSummary: {
    preparedCount: number;
    preparedDays: number;
    blockedHint: boolean;
  };
  allowanceReadiness: "none" | "prepared" | "blocked";
  deductionReadiness: "none" | "inputs" | "prepared" | "blocked";
  varianceSummary: {
    status: string;
    ordinaryDelta: number | null;
    message?: string;
  };
  readiness: "ready" | "blocked" | "excluded";
  periodApprovalStatus?: string | null;
  disclaimer: typeof M07_NON_CERTIFIED_DISCLAIMER;
};

function sumHours(batch: PayCalculationBatch, lineType: "ordinary" | "overtime"): number {
  return batch.lines
    .filter((l) => l.lineType === lineType)
    .reduce((acc, l) => acc + (Number(l.hours) || 0), 0);
}

export function buildPeopleReviewRows(
  actor: M07Actor,
  input: { legalEntityId: string; periodId: string }
): PeopleReviewRow[] {
  assertM07Permission(actor, "payroll.view");
  assertM07LegalEntityScope(actor, input.legalEntityId);

  const period = getPeriod(input.periodId);
  if (!period || period.legalEntityId !== input.legalEntityId) return [];

  const periodApprovalStatus = getCurrentApprovalForPeriod(input.periodId)?.status ?? null;

  const profiles = listProfiles(input.legalEntityId).filter((p) => p.status === "active");
  const varianceByPerson = new Map(
    buildVarianceViews(actor, {
      legalEntityId: input.legalEntityId,
      periodId: input.periodId,
    }).map((v) => [v.personId, v])
  );
  const rows: PeopleReviewRow[] = [];

  for (const profile of profiles) {
    try {
      assertM07ClinicScope(actor, [profile.clinicId, ...(period.clinicIds ?? [])]);
    } catch {
      continue;
    }

    if (isDoctorPayExcluded(profile.personId)) {
      const identity = resolvePersonIdentity(profile.personId);
      rows.push({
        personId: profile.personId,
        displayLabel: identity?.displayLabel ?? profile.personId,
        personKind: identity?.personKind ?? "doctor",
        legalEntityId: input.legalEntityId,
        clinicId: profile.clinicId,
        profileId: profile.id,
        classificationRef: profile.m04ClassificationRef,
        mappingStatus: "doctor-pay-excluded",
        ordinaryHourlyRate: "redacted",
        externalPayrollEmployeeId: hasM07Permission(actor, "payroll.externalId.view")
          ? profile.externalPayrollEmployeeId ?? null
          : "redacted",
        doctorExcluded: true,
        openExceptions: [],
        exceptionCounts: { open: 0, resolved: 0, waived: 0 },
        latestCalculation: null,
        leavePrepSummary: { preparedCount: 0, preparedDays: 0, blockedHint: false },
        allowanceReadiness: "none",
        deductionReadiness: "none",
        varianceSummary: { status: "excluded", ordinaryDelta: null },
        readiness: "excluded",
        periodApprovalStatus,
        disclaimer: M07_NON_CERTIFIED_DISCLAIMER,
      });
      continue;
    }

    const identity = resolvePersonIdentity(profile.personId);
    const resolved = resolvePersonPreparationInputs(actor, {
      legalEntityId: input.legalEntityId,
      personId: profile.personId,
    });

    const personExceptions = listExceptions(input.legalEntityId).filter(
      (e) =>
        e.personId === profile.personId &&
        (e.periodId === input.periodId || !e.periodId)
    );
    const openExceptions = personExceptions.filter((e) => e.status === "open");

    const calcs = listPersonCalculationBatches(
      actor,
      input.legalEntityId,
      profile.personId,
      input.periodId
    );
    const latest = calcs.sort((a, b) => b.batchVersion - a.batchVersion)[0] ?? null;

    const leaveLines = listLeavePreparation(actor, input.legalEntityId, {
      periodId: input.periodId,
      personId: profile.personId,
    });
    const leaveBlocked = openExceptions.some(
      (e) =>
        e.kind === "leave-mapping-missing" ||
        e.kind === "unapproved-leave" ||
        e.kind === "unsupported-leave"
    );

    const allowanceBlocked = openExceptions.some((e) =>
      e.kind.startsWith("unknown-allowance") ||
      e.kind.startsWith("inactive-allowance") ||
      e.kind === "unsupported-allowance-input"
    );
    const deductionBlocked = openExceptions.some((e) =>
      e.kind.includes("deduction")
    );
    const allowanceLines = latest?.lines.filter((l) => l.lineType === "allowance") ?? [];
    const deductionLines = latest?.lines.filter((l) => l.lineType === "deduction") ?? [];
    const activeDeductionInputs = listActiveDeductionPrepInputs(actor, input.legalEntityId, {
      periodId: input.periodId,
      personId: profile.personId,
    });

    const variance = varianceByPerson.get(profile.personId);

    const rateVisible = hasM07Permission(actor, "payroll.rate.view");
    const extVisible = hasM07Permission(actor, "payroll.externalId.view");

    const readiness: PeopleReviewRow["readiness"] =
      resolved.status === "resolved" && openExceptions.length === 0 ? "ready" : "blocked";

    rows.push({
      personId: profile.personId,
      displayLabel: identity?.displayLabel ?? profile.personId,
      personKind: identity?.personKind,
      legalEntityId: input.legalEntityId,
      clinicId: profile.clinicId,
      profileId: profile.id,
      classificationRef: resolved.classificationRef ?? profile.m04ClassificationRef,
      mappingStatus: resolved.status,
      mappingMessage: resolved.message,
      ordinaryHourlyRate: rateVisible ? resolved.ordinaryHourlyRate ?? null : "redacted",
      externalPayrollEmployeeId: extVisible
        ? profile.externalPayrollEmployeeId ?? null
        : "redacted",
      doctorExcluded: false,
      openExceptions: openExceptions.map((e) => ({
        id: e.id,
        kind: e.kind,
        message: e.message,
        status: e.status,
      })),
      exceptionCounts: {
        open: personExceptions.filter((e) => e.status === "open").length,
        resolved: personExceptions.filter((e) => e.status === "resolved").length,
        waived: personExceptions.filter((e) => e.status === "waived").length,
      },
      latestCalculation: latest
        ? {
            batchId: latest.id,
            batchVersion: latest.batchVersion,
            ruleId: latest.ruleId,
            ruleVersion: latest.ruleVersion,
            ordinaryHours: sumHours(latest, "ordinary"),
            overtimeHours: sumHours(latest, "overtime"),
            allowanceCount: allowanceLines.length,
            deductionCount: deductionLines.length,
            disclaimer: latest.disclaimer,
          }
        : null,
      leavePrepSummary: {
        preparedCount: leaveLines.length,
        preparedDays: leaveLines.reduce((a, l) => a + l.leaveDays, 0),
        blockedHint: leaveBlocked,
      },
      allowanceReadiness: allowanceBlocked
        ? "blocked"
        : allowanceLines.length
          ? "prepared"
          : "none",
      deductionReadiness: deductionBlocked
        ? "blocked"
        : deductionLines.length
          ? "prepared"
          : activeDeductionInputs.length
            ? "inputs"
            : "none",
      varianceSummary: {
        status: variance?.status ?? "unavailable",
        ordinaryDelta: variance?.ordinaryDelta ?? null,
        message: variance?.message,
      },
      readiness,
      periodApprovalStatus,
      disclaimer: M07_NON_CERTIFIED_DISCLAIMER,
    });
  }

  return rows;
}
