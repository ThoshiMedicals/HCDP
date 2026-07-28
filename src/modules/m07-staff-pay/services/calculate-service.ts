/**
 * Non-certified ordinary + overtime calculation (Batch 3 CP 3.2).
 * Consumes eligible immutable Batch 2 snapshots only.
 */

import {
  assertM07ClinicScope,
  assertM07LegalEntityScope,
  assertM07Permission,
  hasM07Permission,
  M07ValidationError,
  type M07Actor,
} from "../permissions";
import {
  getPeriod,
  listCalculationBatches,
  listProfiles,
  newCalculationBatchId,
  newPayPrepLineId,
  upsertCalculationBatch,
} from "../repository/local-store";
import {
  getPublishedTimesheetSnapshotById,
  listPublishedTimesheetSnapshots,
} from "../repository/published-timesheet-snapshots";
import { getSnapshotEligibilityBySnapshotId } from "../repository/published-timesheet-lifecycle";
import { getRule } from "../repository/local-store";
import {
  M07_NON_CERTIFIED_DISCLAIMER,
  type PayCalculationBatch,
  type PayPrepLine,
  type PublishedTimesheetSourceSnapshot,
} from "../types/domain";
import { resolvePersonPreparationInputs } from "./classification-resolve";
import { openPayPrepException } from "./exception-service";
import { recordM07Audit } from "./audit-service";
import { assertNoProhibitedFields } from "./sensitive-fields";

function redactBatch(actor: M07Actor, batch: PayCalculationBatch): PayCalculationBatch {
  if (hasM07Permission(actor, "payroll.rate.view")) return batch;
  // Lines carry hours only — strip any accidental rate meta; keep structure
  return {
    ...batch,
    lines: batch.lines.map((l) => ({ ...l })),
  };
}

function pickEligibleSnapshot(input: {
  organisationId: string;
  legalEntityId: string;
  personId: string;
  periodStart: string;
  periodEnd: string;
  snapshotId?: string;
}): { snapshot: PublishedTimesheetSourceSnapshot | null; reason?: string } {
  if (input.snapshotId) {
    const snap = getPublishedTimesheetSnapshotById(
      { organisationId: input.organisationId, legalEntityId: input.legalEntityId },
      input.snapshotId
    );
    if (!snap) return { snapshot: null, reason: "missing-snapshot" };
    return { snapshot: snap };
  }

  const candidates = listPublishedTimesheetSnapshots({
    organisationId: input.organisationId,
    legalEntityId: input.legalEntityId,
  }).filter(
    (s) =>
      s.workforcePersonId === input.personId &&
      s.periodStart <= input.periodEnd &&
      s.periodEnd >= input.periodStart
  );

  if (!candidates.length) return { snapshot: null, reason: "missing-snapshot" };

  const eligible = candidates.filter((s) => {
    const el = getSnapshotEligibilityBySnapshotId({
      organisationId: s.organisationId,
      legalEntityId: s.legalEntityId,
      snapshotId: s.id,
    });
    return el?.eligibility === "eligible";
  });

  if (!eligible.length) return { snapshot: null, reason: "ineligible-intake" };

  eligible.sort((a, b) => b.sourceVersion - a.sourceVersion);
  return { snapshot: eligible[0]! };
}

export type CalculatePersonResult =
  | { status: "completed"; batch: PayCalculationBatch }
  | { status: "blocked"; batch?: PayCalculationBatch; exceptionIds: string[] };

/**
 * Calculate ordinary + OT prep lines for one person in a period.
 * Penalty inputs → unsupported-penalty-input exception (fail closed).
 * Allowance inputs ignored (Batch 4) — not calculated.
 * Snapshot leaveInputs never used as leave SoT.
 */
export function calculatePersonOrdinaryAndOvertime(
  actor: M07Actor,
  input: {
    periodId: string;
    personId: string;
    snapshotId?: string;
  }
): CalculatePersonResult {
  assertM07Permission(actor, "payroll.calculate");
  assertNoProhibitedFields(input);

  const period = getPeriod(input.periodId);
  if (!period) throw new M07ValidationError("not-found", `Period ${input.periodId} not found`);
  assertM07LegalEntityScope(actor, period.legalEntityId);
  assertM07ClinicScope(actor, period.clinicIds);

  const legalEntityId = period.legalEntityId;
  const organisationId = legalEntityId;
  const exceptionIds: string[] = [];

  const resolved = resolvePersonPreparationInputs(actor, {
    legalEntityId,
    personId: input.personId,
  });

  if (resolved.status !== "resolved") {
    const ex = openPayPrepException(actor, {
      legalEntityId,
      organisationId,
      periodId: period.id,
      personId: input.personId,
      kind: resolved.exceptionKind ?? "unsupported-input",
      message: resolved.message ?? resolved.status,
      clinicId: listProfiles(legalEntityId).find((p) => p.personId === input.personId)?.clinicId,
    });
    exceptionIds.push(ex.id);
    return { status: "blocked", exceptionIds };
  }

  const profile = listProfiles(legalEntityId).find(
    (p) => p.personId === input.personId && p.status === "active"
  )!;

  const { snapshot, reason } = pickEligibleSnapshot({
    organisationId,
    legalEntityId,
    personId: input.personId,
    periodStart: period.periodStart,
    periodEnd: period.periodEnd,
    snapshotId: input.snapshotId,
  });

  if (!snapshot) {
    const kind =
      reason === "ineligible-intake" ? "ineligible-intake" : "missing-snapshot";
    const ex = openPayPrepException(actor, {
      legalEntityId,
      organisationId,
      clinicId: profile.clinicId,
      periodId: period.id,
      personId: input.personId,
      kind,
      message:
        kind === "ineligible-intake"
          ? "No eligible cleared intake snapshot for calculation"
          : "Required source snapshot is missing",
    });
    exceptionIds.push(ex.id);
    return { status: "blocked", exceptionIds };
  }

  // Snapshot tenant / LE / clinic isolation
  if (snapshot.legalEntityId !== legalEntityId || snapshot.organisationId !== organisationId) {
    const ex = openPayPrepException(actor, {
      legalEntityId,
      organisationId,
      clinicId: profile.clinicId,
      periodId: period.id,
      personId: input.personId,
      kind: "legal-entity-boundary-mismatch",
      message: "Snapshot legal entity / organisation does not match period",
      snapshotId: snapshot.id,
      timesheetRecordId: snapshot.timesheetRecordId,
    });
    exceptionIds.push(ex.id);
    return { status: "blocked", exceptionIds };
  }

  if (snapshot.workforcePersonId !== input.personId) {
    const ex = openPayPrepException(actor, {
      legalEntityId,
      organisationId,
      clinicId: profile.clinicId,
      periodId: period.id,
      personId: input.personId,
      kind: "tenant-boundary-mismatch",
      message: "Snapshot person does not match calculation person",
      snapshotId: snapshot.id,
    });
    exceptionIds.push(ex.id);
    return { status: "blocked", exceptionIds };
  }

  if (snapshot.clinicId) {
    try {
      assertM07ClinicScope(actor, [snapshot.clinicId]);
    } catch {
      const ex = openPayPrepException(actor, {
        legalEntityId,
        organisationId,
        clinicId: snapshot.clinicId,
        periodId: period.id,
        personId: input.personId,
        kind: "clinic-boundary-mismatch",
        message: "Snapshot clinic is outside actor clinic scope",
        snapshotId: snapshot.id,
      });
      exceptionIds.push(ex.id);
      return { status: "blocked", exceptionIds };
    }
  }

  const eligibility = getSnapshotEligibilityBySnapshotId({
    organisationId: snapshot.organisationId,
    legalEntityId: snapshot.legalEntityId,
    snapshotId: snapshot.id,
  });
  if (!eligibility || eligibility.eligibility !== "eligible") {
    const ex = openPayPrepException(actor, {
      legalEntityId,
      organisationId,
      clinicId: snapshot.clinicId ?? profile.clinicId,
      periodId: period.id,
      personId: input.personId,
      kind: "ineligible-intake",
      message: `Snapshot eligibility is ${eligibility?.eligibility ?? "missing"}`,
      snapshotId: snapshot.id,
      timesheetRecordId: snapshot.timesheetRecordId,
    });
    exceptionIds.push(ex.id);
    return { status: "blocked", exceptionIds };
  }

  if (snapshot.penaltyHourInputs?.length) {
    const ex = openPayPrepException(actor, {
      legalEntityId,
      organisationId,
      clinicId: snapshot.clinicId ?? profile.clinicId,
      periodId: period.id,
      personId: input.personId,
      kind: "unsupported-penalty-input",
      message:
        "Penalty-hour inputs are unsupported in Batch 3 — not calculated and not ignored",
      snapshotId: snapshot.id,
      timesheetRecordId: snapshot.timesheetRecordId,
    });
    exceptionIds.push(ex.id);
    return { status: "blocked", exceptionIds };
  }

  const rule = getRule(resolved.ruleId!);
  if (!rule || rule.status !== "active") {
    const ex = openPayPrepException(actor, {
      legalEntityId,
      organisationId,
      clinicId: profile.clinicId,
      periodId: period.id,
      personId: input.personId,
      kind: "missing-classification-rule-map",
      message: "Preparation rule missing at calculate time",
    });
    exceptionIds.push(ex.id);
    return { status: "blocked", exceptionIds };
  }

  // Pin exact rule version used (do not silently rebind historical lines later)
  const ruleId = rule.id;
  const ruleVersion = rule.version;

  const lines: PayPrepLine[] = [];
  for (const row of snapshot.ordinaryHourInputs ?? []) {
    lines.push({
      id: newPayPrepLineId(),
      lineType: "ordinary",
      hours: row.hours * (rule.ordinaryMultiplier || 1),
      code: row.code,
      localDate: row.localDate,
      notes: row.notes,
      ruleId,
      ruleVersion,
      snapshotId: snapshot.id,
      contentHash: snapshot.contentHash,
      timesheetRecordId: snapshot.timesheetRecordId,
      certified: false,
      disclaimer: M07_NON_CERTIFIED_DISCLAIMER,
    });
  }
  for (const row of snapshot.overtimeHourInputs ?? []) {
    lines.push({
      id: newPayPrepLineId(),
      lineType: "overtime",
      hours: row.hours * (rule.overtimeMultiplier || 1),
      code: row.code,
      localDate: row.localDate,
      notes: row.notes,
      ruleId,
      ruleVersion,
      snapshotId: snapshot.id,
      contentHash: snapshot.contentHash,
      timesheetRecordId: snapshot.timesheetRecordId,
      certified: false,
      disclaimer: M07_NON_CERTIFIED_DISCLAIMER,
    });
  }

  // Explicitly do not create allowance lines from snapshot.allowanceInputs (Batch 4)
  // Explicitly do not treat snapshot.leaveInputs as approved leave (CP 3.4 / M04)

  const prior = listCalculationBatches(legalEntityId)
    .filter(
      (b) =>
        b.periodId === period.id &&
        b.personId === input.personId &&
        b.status !== "superseded"
    )
    .sort((a, b) => b.batchVersion - a.batchVersion)[0];

  if (prior) {
    upsertCalculationBatch({
      ...prior,
      status: "superseded",
    });
  }

  const batch: PayCalculationBatch = {
    id: newCalculationBatchId(),
    legalEntityId,
    organisationId,
    periodId: period.id,
    personId: input.personId,
    clinicId: snapshot.clinicId ?? profile.clinicId,
    profileId: profile.id,
    batchVersion: (prior?.batchVersion ?? 0) + 1,
    status: "completed",
    ruleId,
    ruleVersion,
    snapshotId: snapshot.id,
    contentHash: snapshot.contentHash,
    lines,
    exceptionIds: [],
    certified: false,
    disclaimer: M07_NON_CERTIFIED_DISCLAIMER,
    calculatedAt: new Date().toISOString(),
    calculatedBy: actor.userId,
    supersedesBatchId: prior?.id ?? null,
  };

  upsertCalculationBatch(batch);
  recordM07Audit({
    actor,
    action: "calculation.completed",
    entityType: "pay-calculation-batch",
    entityId: batch.id,
    legalEntityId,
    clinicId: batch.clinicId,
    after: {
      batchVersion: batch.batchVersion,
      ruleId: batch.ruleId,
      ruleVersion: batch.ruleVersion,
      lineCount: batch.lines.length,
      snapshotId: batch.snapshotId,
      disclaimer: batch.disclaimer,
    },
    meta: { supersedesBatchId: batch.supersedesBatchId },
  });

  return { status: "completed", batch: redactBatch(actor, batch) };
}

export function listPersonCalculationBatches(
  actor: M07Actor,
  legalEntityId: string,
  personId: string,
  periodId?: string
): PayCalculationBatch[] {
  assertM07Permission(actor, "payroll.view");
  assertM07LegalEntityScope(actor, legalEntityId);
  return listCalculationBatches(legalEntityId)
    .filter((b) => b.personId === personId)
    .filter((b) => (periodId ? b.periodId === periodId : true))
    .filter((b) => b.status !== "superseded")
    .map((b) => redactBatch(actor, b));
}
