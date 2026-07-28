/**
 * Batch 5 — lightweight approval invalidation hooks (no calculate import cycle).
 */

import type { M07Actor } from "../permissions";
import {
  getCurrentApprovalForPeriod,
  getPeriod,
  upsertApproval,
  upsertPeriod,
} from "../repository/local-store";
import type { PayPeriodApproval, PayPeriodRecord } from "../types/domain";
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
    recordM07Audit({
      actor,
      action: "approval.source-changed-while-submitted",
      entityType: "pay-period-approval",
      entityId: current.id,
      legalEntityId: current.legalEntityId,
      meta: { periodId: period.id, reason: input.reason },
    });
  }
  return current;
}

/** Call after material prep mutations. Always stales an approved package. */
export function invalidateApprovalIfSourcesChanged(
  actor: M07Actor,
  periodId: string,
  reason: string
): void {
  const current = getCurrentApprovalForPeriod(periodId);
  if (!current) return;
  if (current.status === "approved") {
    markPeriodApprovalStale(actor, { periodId, reason });
  } else if (current.status === "submitted") {
    markPeriodApprovalStale(actor, { periodId, reason });
  }
}
