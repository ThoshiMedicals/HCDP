/**
 * Batch 5 — lightweight approval invalidation hooks (no calculate import cycle).
 *
 * Materiality (profile / classification):
 * - Material profile fields: personId, clinicId, m04ClassificationRef,
 *   preparationRuleId/Version, effectiveFrom/To, status, allowanceCodes,
 *   deductionCodes, leavePayMapping, overtimeRulesRef.
 * - Immaterial (no auto-stale): ordinaryHourlyRate, externalPayrollEmployeeId
 *   (external-id mutations use dedicated path and do not stale).
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

function touchPeriodOpen(period: PayPeriodRecord, actor: M07Actor): void {
  if (period.state !== "export-ready") return;
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
  const current = getCurrentApprovalForPeriod(periodId);
  if (!current) return;
  if (current.status === "approved" || current.status === "submitted") {
    markPeriodApprovalStale(actor, { periodId, reason });
  }
}

const MATERIAL_PROFILE_KEYS: Array<keyof PayProfile> = [
  "personId",
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
  reason: string
): void {
  for (const periodId of periodsNeedingInvalidation(legalEntityId)) {
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
  }
): void {
  if (input.populationChanging) {
    invalidateApprovalsForLegalEntity(actor, input.legalEntityId, input.reason);
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
