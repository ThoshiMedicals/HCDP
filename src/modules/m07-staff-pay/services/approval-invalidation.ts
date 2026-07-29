/**
 * Batch 5 — lightweight approval invalidation hooks (no calculate import cycle).
 *
 * Materiality (profile / classification):
 * - Material profile fields (bump `materialProfileRevision` + invalidate): personId,
 *   legalEntityId, clinicId, m04ClassificationRef, preparationRuleId/Version,
 *   allowanceCodes, deductionCodes, leavePayMapping, overtimeRulesRef,
 *   effectiveFrom/To, status.
 * - Immaterial (bump general `version` only; do NOT bump material revision /
 *   do NOT auto-stale): ordinaryHourlyRate, externalPayrollEmployeeId.
 * - Manifest pins `materialProfileRevision`, never general `version`, so
 *   immaterial updates cannot make an approved package unreproducible.
 * - Classification mapping create / retire / replace: always material for the LE
 *   (affects pinned mappingId/mappingVersion and eligible prep resolution).
 *
 * Invalidation compares presence of submitted/approved package and marks stale
 * immediately — does not wait for a future approval attempt.
 */

import type { M07Actor } from "../permissions";
import {
  getCurrentApprovalForPeriod,
  getPeriod,
  listApprovals,
  listPeriods,
  upsertApproval,
  upsertPeriod,
} from "../repository/local-store";
import type { PayPeriodApproval, PayPeriodRecord, PayProfile } from "../types/domain";
import { recordM07Audit } from "./audit-service";
import { syncPeriodApprovalToInbox } from "../adapters/m02-inbox-publish";
import {
  assertNoLockedPeriodAffectedByPersonMutation,
  assertNoLockedPeriodsForLegalEntity,
  effectiveRangeOverlapsPeriod,
  isPayrollPeriodLocked,
  rejectLockedPeriodSourceChange,
} from "./period-lock-guard";

function touchPeriodOpen(period: PayPeriodRecord, actor: M07Actor): void {
  if (period.state !== "export-ready") return;
  // Never silently reopen a locked period via invalidation
  if (isPayrollPeriodLocked(period.id)) return;
  const next: PayPeriodRecord = {
    ...period,
    state: "open",
    version: period.version + 1,
    updatedAt: new Date().toISOString(),
    updatedBy: actor.userId,
  };
  upsertPeriod(next);
}

export function markPeriodApprovalStale(
  actor: M07Actor,
  input: { periodId: string; reason: string }
): PayPeriodApproval | null {
  const period = getPeriod(input.periodId);
  if (!period) return null;
  const current = getCurrentApprovalForPeriod(period.id);
  if (!current) return null;
  if (current.status === "stale") return current;

  if (current.status === "approved") {
    const now = new Date().toISOString();
    const stale: PayPeriodApproval = {
      ...current,
      status: "stale",
      staleAt: now,
      staleReason: input.reason,
      updatedAt: now,
      updatedBy: actor.userId,
    };
    upsertApproval(stale);
    touchPeriodOpen(period, actor);
    recordM07Audit({
      actor,
      action: "approval.stale",
      entityType: "pay-period-approval",
      entityId: stale.id,
      legalEntityId: stale.legalEntityId,
      meta: { periodId: period.id, reason: input.reason },
    });
    syncPeriodApprovalToInbox(actor, stale, "stale");
    return stale;
  }

  if (current.status === "submitted") {
    const now = new Date().toISOString();
    const stale: PayPeriodApproval = {
      ...current,
      status: "stale",
      staleAt: now,
      staleReason: input.reason,
      updatedAt: now,
      updatedBy: actor.userId,
    };
    upsertApproval(stale);
    touchPeriodOpen(period, actor);
    recordM07Audit({
      actor,
      action: "approval.stale",
      entityType: "pay-period-approval",
      entityId: stale.id,
      legalEntityId: stale.legalEntityId,
      meta: { periodId: period.id, reason: input.reason, was: "submitted" },
    });
    syncPeriodApprovalToInbox(actor, stale, "stale");
    return stale;
  }
  return current;
}

/** Call after material prep mutations. Always stales an approved/submitted package. */
export function invalidateApprovalIfSourcesChanged(
  actor: M07Actor,
  periodId: string,
  reason: string
): void {
  if (isPayrollPeriodLocked(periodId)) {
    rejectLockedPeriodSourceChange(actor, { periodId, reason });
  }
  const current = getCurrentApprovalForPeriod(periodId);
  if (!current) return;
  if (current.status === "approved" || current.status === "submitted") {
    markPeriodApprovalStale(actor, { periodId, reason });
  }
}

const MATERIAL_PROFILE_KEYS: Array<keyof PayProfile> = [
  "personId",
  "legalEntityId",
  "clinicId",
  "m04ClassificationRef",
  "preparationRuleId",
  "preparationRuleVersion",
  "allowanceCodes",
  "deductionCodes",
  "leavePayMapping",
  "overtimeRulesRef",
  "effectiveFrom",
  "effectiveTo",
  "status",
];

export const M07_MATERIAL_PROFILE_KEYS = MATERIAL_PROFILE_KEYS;

function stableJson(v: unknown): string {
  return JSON.stringify(v ?? null);
}

/** True when the profile delta can affect pinned approval manifests / population. */
export function isMaterialPayProfileChange(
  before: PayProfile,
  after: PayProfile
): boolean {
  for (const key of MATERIAL_PROFILE_KEYS) {
    if (stableJson(before[key]) !== stableJson(after[key])) return true;
  }
  return false;
}

function periodsNeedingInvalidation(legalEntityId: string): string[] {
  const periodIds = new Set<string>();
  for (const a of listApprovals(legalEntityId)) {
    if (a.status === "approved" || a.status === "submitted") {
      periodIds.add(a.periodId);
    }
  }
  // Also cover export-ready periods that somehow lack a current approval row
  for (const p of listPeriods(legalEntityId)) {
    if (p.state === "export-ready") periodIds.add(p.id);
  }
  return [...periodIds];
}

/** Invalidate all submitted/approved packages for a legal entity (mapping / LE-wide). */
export function invalidateApprovalsForLegalEntity(
  actor: M07Actor,
  legalEntityId: string,
  reason: string,
  effectiveFrom?: string | null,
  effectiveTo?: string | null
): void {
  assertNoLockedPeriodsForLegalEntity(
    actor,
    legalEntityId,
    reason,
    effectiveFrom,
    effectiveTo
  );
  for (const periodId of periodsNeedingInvalidation(legalEntityId)) {
    const period = getPeriod(periodId);
    if (
      period &&
      (effectiveFrom !== undefined || effectiveTo !== undefined) &&
      !effectiveRangeOverlapsPeriod(period, effectiveFrom, effectiveTo)
    ) {
      continue;
    }
    // Never silently stale a locked period — locked impact already asserted above
    if (period && isPayrollPeriodLocked(period.id)) continue;
    invalidateApprovalIfSourcesChanged(actor, periodId, reason);
  }
}

/**
 * Invalidate packages where the person is in the pinned eligible set, or LE-wide
 * when creating/archiving profiles that change population.
 */
export function invalidateApprovalsForProfileMutation(
  actor: M07Actor,
  input: {
    legalEntityId: string;
    personId: string;
    reason: string;
    /** When true (create/archive), invalidate all LE packages — population may change. */
    populationChanging?: boolean;
    effectiveFrom?: string | null;
    effectiveTo?: string | null;
    financiallyAuthoritative?: boolean;
  }
): void {
  assertNoLockedPeriodAffectedByPersonMutation(actor, {
    legalEntityId: input.legalEntityId,
    personId: input.personId,
    reason: input.reason,
    populationChanging: input.populationChanging,
    effectiveFrom: input.effectiveFrom,
    effectiveTo: input.effectiveTo,
    financiallyAuthoritative: input.financiallyAuthoritative,
  });
  if (input.populationChanging) {
    invalidateApprovalsForLegalEntity(
      actor,
      input.legalEntityId,
      input.reason,
      input.effectiveFrom,
      input.effectiveTo
    );
    return;
  }
  for (const periodId of periodsNeedingInvalidation(input.legalEntityId)) {
    const current = getCurrentApprovalForPeriod(periodId);
    if (!current) continue;
    const pinned = current.manifest.eligiblePersonIds.includes(input.personId);
    const profilePinned = current.manifest.profiles.some((p) => p.personId === input.personId);
    if (pinned || profilePinned) {
      invalidateApprovalIfSourcesChanged(actor, periodId, input.reason);
    }
  }
}

/**
 * Bridge when authoritative M04 employment/clinic context for a person changes.
 * M07 does not write M04; callers (adapters/tests/integration) must invoke this
 * after a material employment-context mutation is observed.
 */
export function notifyM04EmploymentContextChanged(
  actor: M07Actor,
  input: { legalEntityId: string; personId: string; reason: string }
): void {
  invalidateApprovalsForProfileMutation(actor, {
    legalEntityId: input.legalEntityId,
    personId: input.personId,
    reason: input.reason,
    populationChanging: true,
  });
}
