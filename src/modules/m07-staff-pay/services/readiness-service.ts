/**
 * Batch 5 — person / clinic / period preparation readiness (non-certified).
 */

import {
  assertM07LegalEntityScope,
  assertM07Permission,
  type M07Actor,
} from "../permissions";
import {
  getPeriod,
  listCalculationBatches,
  listExceptions,
  listLeavePrepLines,
} from "../repository/local-store";
import { getPublishedTimesheetSnapshotById } from "../repository/published-timesheet-snapshots";
import { getSnapshotEligibilityBySnapshotId } from "../repository/published-timesheet-lifecycle";
import {
  M07_NON_CERTIFIED_DISCLAIMER,
  NON_WAIVABLE_EXCEPTION_KINDS,
  WAIVABLE_EXCEPTION_KINDS,
  type ClinicReadiness,
  type PayPrepException,
  type PeriodReadiness,
  type PersonReadiness,
} from "../types/domain";
import { resolveEligiblePopulation } from "./eligible-population-service";
import { resolvePersonPreparationInputs } from "./classification-resolve";
import { listActiveDeductionPrepInputs } from "./deduction-prep-input-service";

const EXPORT_READY_WORDING =
  "Ready for non-certified export preparation — not certified or payment-ready." as const;

function isCurrentWaiverValid(ex: PayPrepException): boolean {
  if (ex.status !== "waived") return false;
  if (!(WAIVABLE_EXCEPTION_KINDS as readonly string[]).includes(ex.kind)) return false;
  if ((NON_WAIVABLE_EXCEPTION_KINDS as readonly string[]).includes(ex.kind)) return false;
  if (!ex.waivedBy || !ex.waiverReason || !ex.waivedAt) return false;
  return true;
}

function latestCompletedBatch(
  legalEntityId: string,
  periodId: string,
  personId: string
) {
  return listCalculationBatches(legalEntityId)
    .filter(
      (b) =>
        b.periodId === periodId &&
        b.personId === personId &&
        b.status === "completed"
    )
    .sort((a, b) => b.batchVersion - a.batchVersion)[0];
}

function assessPerson(
  actor: M07Actor,
  legalEntityId: string,
  periodId: string,
  personId: string,
  clinicId: string,
  snapshotIds: string[]
): PersonReadiness {
  const blockingReasons: string[] = [];

  const resolved = resolvePersonPreparationInputs(actor, { legalEntityId, personId });
  if (resolved.status !== "resolved") {
    blockingReasons.push(resolved.status);
  }

  const batch = latestCompletedBatch(legalEntityId, periodId, personId);
  if (!batch) {
    blockingReasons.push("missing-completed-calculation");
  } else {
    const snap = getPublishedTimesheetSnapshotById(
      { organisationId: legalEntityId, legalEntityId },
      batch.snapshotId
    );
    if (!snap) {
      blockingReasons.push("calculation-missing-snapshot");
    } else {
      const el = getSnapshotEligibilityBySnapshotId({
        organisationId: snap.organisationId,
        legalEntityId: snap.legalEntityId,
        snapshotId: snap.id,
      });
      if (el?.eligibility !== "eligible") {
        blockingReasons.push("calculation-snapshot-ineligible");
      }
      if (snapshotIds.length && !snapshotIds.includes(batch.snapshotId)) {
        blockingReasons.push("calculation-snapshot-not-in-eligible-set");
      }
    }
    if (batch.status !== "completed") {
      blockingReasons.push("calculation-not-completed");
    }
  }

  const openBlocking = listExceptions(legalEntityId).filter(
    (e) =>
      e.personId === personId &&
      (e.periodId === periodId || !e.periodId) &&
      e.status === "open"
  );
  for (const ex of openBlocking) {
    blockingReasons.push(`open-exception:${ex.kind}`);
  }

  // Stale waiver / non-waivable marked waived incorrectly
  const badWaivers = listExceptions(legalEntityId).filter(
    (e) =>
      e.personId === personId &&
      (e.periodId === periodId || !e.periodId) &&
      e.status === "waived" &&
      !isCurrentWaiverValid(e)
  );
  for (const ex of badWaivers) {
    blockingReasons.push(`stale-or-invalid-waiver:${ex.kind}`);
  }

  // Leave prep blocked lines
  const leaveBlocked = listLeavePrepLines(legalEntityId).filter(
    (l) =>
      l.personId === personId &&
      l.periodId === periodId &&
      l.status === "blocked"
  );
  if (leaveBlocked.length) {
    blockingReasons.push("leave-prep-blocked");
  }

  // Active deduction inputs are optional; malformed handled at create time.
  // If calc completed but active deduction inputs exist without matching lines → block
  const activeDeds = listActiveDeductionPrepInputs(actor, legalEntityId, {
    periodId,
    personId,
  });
  if (batch && activeDeds.length) {
    const dedLines = batch.lines.filter((l) => l.lineType === "deduction");
    for (const d of activeDeds) {
      const matched = dedLines.some(
        (l) => l.deductionInputId === d.id && l.deductionInputVersion === d.version
      );
      if (!matched) {
        blockingReasons.push(`deduction-input-not-in-calculation:${d.id}`);
      }
    }
  }

  // Informational variances never block (OD / Batch 4).

  const unique = [...new Set(blockingReasons)];
  return {
    personId,
    clinicId,
    status: unique.length ? "blocked" : "ready",
    blockingReasons: unique,
    calculationBatchId: batch?.id,
    calculationBatchVersion: batch?.batchVersion,
    snapshotId: batch?.snapshotId,
  };
}

export function assessPeriodReadiness(
  actor: M07Actor,
  input: { legalEntityId: string; periodId: string }
): PeriodReadiness {
  assertM07Permission(actor, "payroll.view");
  assertM07LegalEntityScope(actor, input.legalEntityId);

  const period = getPeriod(input.periodId);
  if (!period || period.legalEntityId !== input.legalEntityId) {
    return {
      legalEntityId: input.legalEntityId,
      periodId: input.periodId,
      status: "blocked",
      version: 0,
      includedClinicIds: [],
      eligiblePersonCount: 0,
      readyPersonCount: 0,
      blockedPersonCount: 0,
      excludedPersonCount: 0,
      clinics: [],
      people: [],
      exclusions: [],
      populationBlockers: [],
      blockingReasons: ["period-not-found"],
      exportReadyWording: EXPORT_READY_WORDING,
      disclaimer: M07_NON_CERTIFIED_DISCLAIMER,
      assessedAt: new Date().toISOString(),
    };
  }

  const population = resolveEligiblePopulation(actor, input);
  const people: PersonReadiness[] = [];
  const blockingReasons = [...population.blockingReasons];

  if (population.status === "blocked") {
    blockingReasons.push("eligible-population-blocked");
  }

  for (const member of population.eligible) {
    people.push(
      assessPerson(
        actor,
        input.legalEntityId,
        input.periodId,
        member.personId,
        member.clinicId,
        member.snapshotIds
      )
    );
  }

  // Population blockers remain visible as blocked readiness people (not silently omitted).
  for (const b of population.populationBlockers) {
    people.push({
      personId: b.personId,
      clinicId: b.clinicId,
      status: "blocked",
      blockingReasons: [`population-blocker:${b.field}:${b.message}`],
    });
  }

  for (const ex of population.exclusions) {
    people.push({
      personId: ex.personId,
      clinicId: ex.clinicId,
      status: "excluded",
      blockingReasons: [],
      exclusionReason: ex.reason,
    });
  }

  const clinicIds = population.includedClinicIds;
  const clinics: ClinicReadiness[] = clinicIds.map((clinicId) => {
    const inClinic = people.filter((p) => p.clinicId === clinicId);
    const eligibleInClinic = inClinic.filter((p) => p.status !== "excluded");
    const ready = eligibleInClinic.filter((p) => p.status === "ready");
    const blocked = eligibleInClinic.filter((p) => p.status === "blocked" || p.status === "incomplete");
    const excluded = inClinic.filter((p) => p.status === "excluded");
    const reasons = blocked.flatMap((p) => p.blockingReasons);
    let status: ClinicReadiness["status"] = "ready";
    if (eligibleInClinic.length === 0) status = "incomplete";
    else if (blocked.length) status = "blocked";
    else if (ready.length !== eligibleInClinic.length) status = "incomplete";
    return {
      clinicId,
      status,
      eligibleCount: eligibleInClinic.length,
      readyCount: ready.length,
      blockedCount: blocked.length,
      excludedCount: excluded.length,
      blockingReasons: [...new Set(reasons)],
    };
  });

  const readyPeople = people.filter((p) => p.status === "ready");
  const blockedPeople = people.filter((p) => p.status === "blocked" || p.status === "incomplete");
  const excludedPeople = people.filter((p) => p.status === "excluded");

  for (const c of clinics) {
    if (c.status !== "ready") {
      blockingReasons.push(`clinic-not-ready:${c.clinicId}`);
    }
  }

  if (!population.eligible.length && population.status !== "blocked") {
    blockingReasons.push("no-eligible-people");
  }

  const uniqueBlock = [...new Set(blockingReasons)];
  let status: PeriodReadiness["status"] = "ready";
  if (population.status === "blocked" || blockedPeople.length || clinics.some((c) => c.status === "blocked")) {
    status = "blocked";
  } else if (
    clinics.some((c) => c.status === "incomplete") ||
    !population.eligible.length ||
    readyPeople.length !== population.eligible.length
  ) {
    status = "incomplete";
  }

  return {
    legalEntityId: input.legalEntityId,
    periodId: input.periodId,
    status,
    version: population.version,
    includedClinicIds: clinicIds,
    eligiblePersonCount: population.eligible.length,
    readyPersonCount: readyPeople.length,
    blockedPersonCount: blockedPeople.length,
    excludedPersonCount: excludedPeople.length,
    clinics,
    people: people.sort((a, b) => a.personId.localeCompare(b.personId)),
    exclusions: population.exclusions,
    populationBlockers: population.populationBlockers,
    blockingReasons: uniqueBlock,
    exportReadyWording: EXPORT_READY_WORDING,
    disclaimer: M07_NON_CERTIFIED_DISCLAIMER,
    assessedAt: new Date().toISOString(),
  };
}
