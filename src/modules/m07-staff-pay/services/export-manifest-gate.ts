/**
 * Batch 6 — authoritative Batch 5 approved-manifest consumption (fail-closed).
 * Never reconstructs a weaker substitute; never bypasses verifyManifestAgainstCurrent.
 */

import { M07ValidationError, type M07Actor } from "../permissions";
import {
  getApproval,
  getCurrentApprovalForPeriod,
  getPeriod,
} from "../repository/local-store";
import type { PayPeriodApproval, PayPeriodRecord } from "../types/domain";
import { verifyManifestAgainstCurrent } from "./source-manifest-service";

export type ApprovedManifestGateResult =
  | {
      ok: true;
      period: PayPeriodRecord;
      approval: PayPeriodApproval;
      verifyMessage?: string;
    }
  | {
      ok: false;
      reason: string;
      message: string;
      period?: PayPeriodRecord;
      approval?: PayPeriodApproval;
    };

/**
 * Load approved package and verify against current authoritative sources.
 * Required before create/finalize/lock/download paths that depend on live validity.
 */
export function requireApprovedManifestForExport(
  actor: M07Actor,
  input: { periodId: string; approvalId?: string; allowLockedPeriod?: boolean }
): ApprovedManifestGateResult {
  const period = getPeriod(input.periodId);
  if (!period) {
    return { ok: false, reason: "period-not-found", message: "Period not found" };
  }

  if (period.state === "locked" && !input.allowLockedPeriod) {
    return {
      ok: false,
      reason: "period-locked",
      message: "Period is locked — ordinary export preparation is prohibited",
      period,
    };
  }

  const approval = input.approvalId
    ? getApproval(input.approvalId)
    : getCurrentApprovalForPeriod(period.id);

  if (!approval) {
    return {
      ok: false,
      reason: "approval-missing",
      message: "No management approval package found for period",
      period,
    };
  }

  if (approval.periodId !== period.id || approval.legalEntityId !== period.legalEntityId) {
    return {
      ok: false,
      reason: "approval-scope-mismatch",
      message: "Approval does not match period legal entity / period identity",
      period,
      approval,
    };
  }

  if (approval.status !== "approved") {
    return {
      ok: false,
      reason: "approval-not-approved",
      message: `Approval status is ${approval.status}; approved required`,
      period,
      approval,
    };
  }

  if (period.state !== "export-ready" && period.state !== "exported" && period.state !== "reconciled") {
    if (!(period.state === "locked" && input.allowLockedPeriod)) {
      return {
        ok: false,
        reason: "period-state",
        message: `Period state ${period.state} is not eligible for export preparation`,
        period,
        approval,
      };
    }
  }

  const verify = verifyManifestAgainstCurrent(actor, approval.manifest);
  if (!verify.ok) {
    return {
      ok: false,
      reason: verify.reason ?? "manifest-verify-failed",
      message: `Approved source manifest failed verification: ${verify.reason}`,
      period,
      approval,
    };
  }

  return { ok: true, period, approval };
}

export function assertApprovedManifestForExport(
  actor: M07Actor,
  input: { periodId: string; approvalId?: string; allowLockedPeriod?: boolean }
): { period: PayPeriodRecord; approval: PayPeriodApproval } {
  const gate = requireApprovedManifestForExport(actor, input);
  if (!gate.ok) {
    throw new M07ValidationError(gate.reason, gate.message);
  }
  return { period: gate.period, approval: gate.approval };
}
