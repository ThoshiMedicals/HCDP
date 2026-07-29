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
  getExportProfile,
  getPeriod,
  getUnlockRequest,
  listExportBatches,
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

/** True Gregorian leap year (proleptic). */
function isGregorianLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Strict canonical calendar date: exact `YYYY-MM-DD`, real Gregorian day,
 * round-trip identical. Rejects datetime, whitespace, and impossible dates.
 * Does not trust JS Date normalization.
 */
export function isCanonicalCalendarDate(value: unknown): boolean {
  if (typeof value !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const y = Number(value.slice(0, 4));
  const m = Number(value.slice(5, 7));
  const d = Number(value.slice(8, 10));
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return false;
  if (y < 1 || m < 1 || m > 12 || d < 1) return false;
  const daysInMonth = [
    31,
    isGregorianLeapYear(y) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  if (d > daysInMonth[m - 1]!) return false;
  const rebuilt = `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return rebuilt === value;
}

/**
 * Classify a caller-supplied effective-date bound.
 * - missing: null / undefined / empty string → open end (fail-closed full-range sentinel)
 * - invalid: whitespace, datetime, non-canonical, impossible calendar → fail closed
 */
function classifyEffectiveDateBound(raw: unknown): "missing" | "invalid" | string {
  if (raw == null) return "missing";
  if (typeof raw !== "string") return "invalid";
  if (raw.length === 0) return "missing";
  // Leading/trailing whitespace or non-exact form — do not trim-to-accept
  if (raw.trim() !== raw) return "invalid";
  if (!isCanonicalCalendarDate(raw)) return "invalid";
  return raw;
}

/**
 * Effective-date overlap with a period.
 * Missing / empty open ends use full-range sentinels (fail closed when impact cannot be excluded).
 * Malformed / impossible / non-canonical bounds fail closed as overlap (never “future non-overlap”).
 */
export function effectiveRangeOverlapsPeriod(
  period: PayPeriodRecord,
  effectiveFrom?: string | null,
  effectiveTo?: string | null
): boolean {
  const fromClass = classifyEffectiveDateBound(effectiveFrom);
  const toClass = classifyEffectiveDateBound(effectiveTo);
  if (fromClass === "invalid" || toClass === "invalid") {
    return true;
  }

  // Internal sentinels only — never accepted as caller-supplied open markers
  const from = fromClass === "missing" ? "0001-01-01" : fromClass;
  const to = toClass === "missing" ? "9999-12-31" : toClass;

  if (from > to) {
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
  if (legalEntityId === "*") {
    throw new M07ValidationError(
      "ambiguous-platform-scope",
      "Platform-wide (*) mutations require export-profile impact resolution, not LE period listing"
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

/**
 * Lock guard for export-profile create/version/retire.
 * Platform (`*`) profiles are resolved from authoritative export-batch references —
 * never skipped merely because legalEntityId === "*".
 */
export function assertNoLockedPeriodAffectedByExportProfileMutation(
  actor: M07Actor,
  input: {
    /** Empty for create of a brand-new profile id (no references yet). */
    profileId: string | null | undefined;
    /** Caller-supplied LE — must match store when profileId is present. */
    legalEntityId: string;
    reason: string;
    effectiveFrom?: string | null;
    effectiveTo?: string | null;
  }
): void {
  if (!input.legalEntityId?.trim()) {
    throw new M07ValidationError(
      "missing-legal-entity-context",
      "Legal entity is required for export-profile lock impact checks"
    );
  }

  let legalEntityId = input.legalEntityId.trim();
  let profileId = input.profileId?.trim() ?? "";

  if (profileId) {
    const stored = getExportProfile(profileId);
    if (!stored) {
      throw new M07ValidationError(
        "export-profile-not-found",
        "Export profile not found — lock impact cannot be resolved"
      );
    }
    // Authoritative scope from store — ignore falsified caller LE
    legalEntityId = stored.legalEntityId;
    profileId = stored.id;
  }

  if (legalEntityId !== "*") {
    assertNoLockedPeriodsForLegalEntity(
      actor,
      legalEntityId,
      input.reason,
      input.effectiveFrom,
      input.effectiveTo
    );
    return;
  }

  // Platform-wide profile: new unused id cannot yet be referenced by locked batches
  if (!profileId) {
    return;
  }

  const referencing = listExportBatches().filter((b) => b.exportProfileId === profileId);
  const lockedPeriodIds = new Set<string>();
  for (const batch of referencing) {
    if (!batch.periodId?.trim() || !batch.legalEntityId?.trim()) {
      throw new M07ValidationError(
        "ambiguous-export-profile-impact",
        "Export batch referencing this platform profile lacks period/legal-entity context"
      );
    }
    if (isPayrollPeriodLocked(batch.periodId)) {
      lockedPeriodIds.add(batch.periodId);
    }
  }

  for (const periodId of lockedPeriodIds) {
    rejectLockedPeriodSourceChange(actor, {
      periodId,
      reason: input.reason,
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
