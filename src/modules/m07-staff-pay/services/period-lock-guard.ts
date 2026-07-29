/**
 * Authoritative Batch 6 period-lock guard for ordinary mutations.
 * Service-layer only — UI is not a control.
 *
 * Missing / empty / ambiguous period context fails closed for period-scoped mutations.
 */

import { M07ValidationError, type M07Actor } from "../permissions";
import {
  getActivePeriodLockForPeriod,
  getCurrentApprovalForPeriod,
  getCurrentExportBatchForPeriod,
  getPeriod,
  getUnlockRequest,
  listPeriods,
  listUnlockRequests,
} from "../repository/local-store";
import type { PayPeriodRecord } from "../types/domain";
import { recordM07Audit } from "./audit-service";
import {
  syncExportBatchToInbox,
  syncLockedPeriodSourceChangeToInbox,
} from "../adapters/m02-inbox-publish";

export function isPayrollPeriodLocked(periodId: string): boolean {
  if (!periodId?.trim()) return false;
  const period = getPeriod(periodId);
  if (period?.state === "locked") return true;
  if (Boolean(getActivePeriodLockForPeriod(periodId))) return true;
  // Unlock controls-incomplete keeps period operationally locked
  const incomplete = listUnlockRequests().find(
    (r) =>
      r.periodId === periodId &&
      (r.status === "controls-incomplete" || r.controlsIncomplete === true)
  );
  return Boolean(incomplete);
}

/**
 * Reject ordinary mutations when the payroll period is locked.
 * Empty / missing periodId fails closed — never silently allows period-scoped work.
 */
export function assertPeriodNotLockedForOrdinaryMutation(periodId: string): void {
  if (!periodId?.trim()) {
    throw new M07ValidationError(
      "missing-period-context",
      "Period identity is required for this mutation; lock context cannot be resolved"
    );
  }
  const period = getPeriod(periodId);
  if (!period) {
    throw new M07ValidationError(
      "period-not-found",
      `Pay period ${periodId} not found — lock context cannot be resolved`
    );
  }
  if (!isPayrollPeriodLocked(period.id)) return;
  throw new M07ValidationError(
    "period-locked",
    "Period is locked — ordinary mutations are prohibited; use controlled unlock remediation"
  );
}

/** Assert period belongs to expected legal entity before mutation. */
export function assertPeriodLegalEntityConsistency(
  periodId: string,
  legalEntityId: string
): void {
  if (!periodId?.trim() || !legalEntityId?.trim()) {
    throw new M07ValidationError(
      "missing-period-context",
      "Period and legal entity identity are required"
    );
  }
  const period = getPeriod(periodId);
  if (!period) {
    throw new M07ValidationError("period-not-found", `Pay period ${periodId} not found`);
  }
  if (period.legalEntityId !== legalEntityId) {
    throw new M07ValidationError(
      "period-legal-entity-mismatch",
      "Period does not belong to the stated legal entity"
    );
  }
}

/** Locked periods for a legal entity (state, active lock, or incomplete unlock controls). */
export function listLockedPeriodsForLegalEntity(legalEntityId: string): PayPeriodRecord[] {
  return listPeriods(legalEntityId).filter((p) => isPayrollPeriodLocked(p.id));
}

/**
 * Effective-date overlap with a period.
 * Missing / empty bounds fail closed as full-range (cannot safely prove non-overlap).
 */
export function effectiveRangeOverlapsPeriod(
  period: PayPeriodRecord,
  effectiveFrom?: string | null,
  effectiveTo?: string | null
): boolean {
  const from =
    effectiveFrom == null || String(effectiveFrom).trim() === ""
      ? "0000-01-01"
      : String(effectiveFrom).trim();
  const to =
    effectiveTo == null || String(effectiveTo).trim() === ""
      ? "9999-12-31"
      : String(effectiveTo).trim();
  if (from > to) {
    // Ambiguous inverted range — treat as overlap (fail closed)
    return true;
  }
  return from <= period.periodEnd && to >= period.periodStart;
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
  return effectiveRangeOverlapsPeriod(period, effectiveFrom, effectiveTo);
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
  if (!input.legalEntityId?.trim()) {
    throw new M07ValidationError(
      "missing-legal-entity-context",
      "Legal entity is required to resolve locked-period impact"
    );
  }
  if (!input.periodStart?.trim() || !input.periodEnd?.trim()) {
    throw new M07ValidationError(
      "ambiguous-period-coverage",
      "Snapshot period bounds are required; cannot safely prove non-overlap with locked periods"
    );
  }
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
 *
 * Atomicity note: audit and M02 are sequenced, not transactional — either may be written
 * while the overall control pair is reported incomplete.
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
 * Assert no locked period for this LE is materially / financially affected by a person change.
 * When `financiallyAuthoritative` is true (rates, external IDs), overlap alone with locked
 * period population (or population-changing) is enough — not only Batch 5 material keys.
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
    /** Rate / external-ID / monetary fields that affect locked export amounts or identity. */
    financiallyAuthoritative?: boolean;
  }
): void {
  if (!input.legalEntityId?.trim() || !input.personId?.trim()) {
    throw new M07ValidationError(
      "missing-person-context",
      "Legal entity and person identity are required for locked-period impact checks"
    );
  }
  const locked = listLockedPeriodsForLegalEntity(input.legalEntityId);
  for (const period of locked) {
    const overlaps = effectiveRangeOverlapsPeriod(
      period,
      input.effectiveFrom,
      input.effectiveTo
    );
    if (!overlaps) continue;

    if (input.populationChanging) {
      rejectLockedPeriodSourceChange(actor, {
        periodId: period.id,
        reason: input.reason,
        personId: input.personId,
      });
    }
    if (
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
    if (input.financiallyAuthoritative) {
      const approval = getCurrentApprovalForPeriod(period.id);
      const inPop =
        Boolean(approval?.manifest.eligiblePersonIds.includes(input.personId)) ||
        Boolean(approval?.manifest.profiles.some((p) => p.personId === input.personId));
      if (inPop) {
        rejectLockedPeriodSourceChange(actor, {
          periodId: period.id,
          reason: input.reason,
          personId: input.personId,
        });
      }
    }
  }
}

/** Assert LE has no locked periods before LE-wide material / financial mutations. */
export function assertNoLockedPeriodsForLegalEntity(
  actor: M07Actor,
  legalEntityId: string,
  reason: string,
  effectiveFrom?: string | null,
  effectiveTo?: string | null
): void {
  if (!legalEntityId?.trim()) {
    throw new M07ValidationError(
      "missing-legal-entity-context",
      "Legal entity is required for locked-period impact checks"
    );
  }
  const locked = listLockedPeriodsForLegalEntity(legalEntityId);
  for (const period of locked) {
    if (
      effectiveFrom !== undefined ||
      effectiveTo !== undefined
    ) {
      if (!effectiveRangeOverlapsPeriod(period, effectiveFrom, effectiveTo)) {
        continue;
      }
    }
    rejectLockedPeriodSourceChange(actor, {
      periodId: period.id,
      reason,
    });
  }
}

/** True when an incomplete unlock recovery is outstanding for the period. */
export function hasIncompleteUnlockControls(periodId: string): boolean {
  return listUnlockRequests().some(
    (r) =>
      r.periodId === periodId &&
      (r.status === "controls-incomplete" || r.controlsIncomplete === true)
  );
}

export function getIncompleteUnlockRequest(periodId: string) {
  return (
    listUnlockRequests().find(
      (r) =>
        r.periodId === periodId &&
        (r.status === "controls-incomplete" || r.controlsIncomplete === true)
    ) ?? null
  );
}

export function getUnlockRequestById(id: string) {
  return getUnlockRequest(id);
}
