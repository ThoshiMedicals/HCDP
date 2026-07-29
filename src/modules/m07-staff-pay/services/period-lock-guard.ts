/**
 * Authoritative Batch 6 period-lock guard for ordinary mutations.
 * Service-layer only — UI is not a control.
 */

import { M07ValidationError, type M07Actor } from "../permissions";
import {
  getActivePeriodLockForPeriod,
  getCurrentApprovalForPeriod,
  getCurrentExportBatchForPeriod,
  getPeriod,
  listPeriods,
} from "../repository/local-store";
import type { PayPeriodRecord } from "../types/domain";
import { recordM07Audit } from "./audit-service";
import {
  syncExportBatchToInbox,
  syncLockedPeriodSourceChangeToInbox,
} from "../adapters/m02-inbox-publish";

export function isPayrollPeriodLocked(periodId: string): boolean {
  const period = getPeriod(periodId);
  if (period?.state === "locked") return true;
  return Boolean(getActivePeriodLockForPeriod(periodId));
}

/**
 * Reject ordinary mutations when the payroll period is locked.
 * Does not mutate history — fail closed.
 */
export function assertPeriodNotLockedForOrdinaryMutation(periodId: string): void {
  if (!periodId) return;
  if (!isPayrollPeriodLocked(periodId)) return;
  throw new M07ValidationError(
    "period-locked",
    "Period is locked — ordinary mutations are prohibited; use controlled unlock remediation"
  );
}

/** Locked periods for a legal entity (state or active lock record). */
export function listLockedPeriodsForLegalEntity(legalEntityId: string): PayPeriodRecord[] {
  return listPeriods(legalEntityId).filter(
    (p) => p.state === "locked" || Boolean(getActivePeriodLockForPeriod(p.id))
  );
}

export function profileAffectsLockedPeriod(
  period: PayPeriodRecord,
  personId: string,
  effectiveFrom?: string | null,
  effectiveTo?: string | null
): boolean {
  if (!isPayrollPeriodLocked(period.id)) return false;

  const approval = getCurrentApprovalForPeriod(period.id);
  const inManifest =
    Boolean(approval?.manifest.eligiblePersonIds.includes(personId)) ||
    Boolean(approval?.manifest.profiles.some((p) => p.personId === personId));
  if (!inManifest) return false;
  const from = effectiveFrom ?? "0000-01-01";
  const to = effectiveTo ?? "9999-12-31";
  return from <= period.periodEnd && to >= period.periodStart;
}

/**
 * Snapshot / intake / replay that overlaps a locked payroll period for the same LE.
 */
export function assertNoLockedPeriodAffectedBySnapshot(
  actor: M07Actor,
  input: {
    legalEntityId: string;
    periodStart: string;
    periodEnd: string;
    reason: string;
    personId?: string;
  }
): void {
  for (const period of listLockedPeriodsForLegalEntity(input.legalEntityId)) {
    const overlaps =
      input.periodStart <= period.periodEnd && input.periodEnd >= period.periodStart;
    if (overlaps) {
      rejectLockedPeriodSourceChange(actor, {
        periodId: period.id,
        reason: input.reason,
        personId: input.personId,
      });
    }
  }
}

/**
 * Fail-closed when an authoritative source change targets a locked period.
 * Preserves lock/approval/export history; projects deterministic M02; audits; throws.
 * Does not implement PPA.
 */
export function rejectLockedPeriodSourceChange(
  actor: M07Actor,
  input: { periodId: string; reason: string; personId?: string }
): never {
  const period = getPeriod(input.periodId);
  if (!period || !isPayrollPeriodLocked(period.id)) {
    throw new M07ValidationError(
      "period-locked",
      "Locked-period source change rejected"
    );
  }

  const lock = getActivePeriodLockForPeriod(period.id);
  const exportBatch = getCurrentExportBatchForPeriod(period.id);

  let auditOk = false;
  try {
    recordM07Audit({
      actor,
      action: "export-batch.stale-source-detected",
      entityType: "period-lock",
      entityId: lock?.id ?? period.id,
      legalEntityId: period.legalEntityId,
      reason: input.reason,
      meta: {
        periodId: period.id,
        personId: input.personId,
        lockId: lock?.id,
        exportBatchId: exportBatch?.id,
        sourceManifestChecksum: lock?.sourceManifestChecksum,
        artifactChecksum: lock?.exportChecksum,
        remediation: "controlled-unlock-required",
        correlationKey: `locked-source::${period.id}::${lock?.id ?? "none"}`,
      },
    });
    auditOk = true;
  } catch {
    auditOk = false;
  }

  let m02Ok = false;
  try {
    if (exportBatch) {
      m02Ok = syncExportBatchToInbox(actor, exportBatch, "stale-source").projected;
    } else {
      m02Ok = syncLockedPeriodSourceChangeToInbox(actor, {
        periodId: period.id,
        legalEntityId: period.legalEntityId,
        organisationId: lock?.organisationId ?? period.legalEntityId,
        lockId: lock?.id,
        reason: input.reason,
      }).projected;
    }
  } catch {
    m02Ok = false;
  }

  if (!auditOk || !m02Ok) {
    throw new M07ValidationError(
      "locked-source-control-incomplete",
      "Locked-period source change rejected and required audit/M02 control could not be completed"
    );
  }

  throw new M07ValidationError(
    "period-locked-source-change",
    `Authoritative source change rejected for locked period ${period.id}; controlled unlock required (${input.reason})`
  );
}

/**
 * Assert no locked period for this LE is materially affected by a person/profile change.
 */
export function assertNoLockedPeriodAffectedByPersonMutation(
  actor: M07Actor,
  input: {
    legalEntityId: string;
    personId: string;
    reason: string;
    effectiveFrom?: string | null;
    effectiveTo?: string | null;
    populationChanging?: boolean;
  }
): void {
  const locked = listLockedPeriodsForLegalEntity(input.legalEntityId);
  for (const period of locked) {
    if (
      input.populationChanging ||
      profileAffectsLockedPeriod(
        period,
        input.personId,
        input.effectiveFrom,
        input.effectiveTo
      )
    ) {
      rejectLockedPeriodSourceChange(actor, {
        periodId: period.id,
        reason: input.reason,
        personId: input.personId,
      });
    }
  }
}

/** Assert LE has no locked periods before LE-wide material mutations (rules/maps). */
export function assertNoLockedPeriodsForLegalEntity(
  actor: M07Actor,
  legalEntityId: string,
  reason: string
): void {
  const locked = listLockedPeriodsForLegalEntity(legalEntityId);
  if (locked[0]) {
    rejectLockedPeriodSourceChange(actor, {
      periodId: locked[0].id,
      reason,
    });
  }
}
