/**
 * Batch 5 — period review submission and management approval.
 * Management approval of a non-certified payroll-preparation dataset only —
 * not payroll certification, payment approval, or payment authority.
 */

import {
  assertM07ClinicScope,
  assertM07LegalEntityScope,
  assertM07Permission,
  hasM07Permission,
  M07SeparationOfDutiesError,
  M07ValidationError,
  type M07Actor,
} from "../permissions";
import {
  approvalLogicalKey,
  getCurrentApprovalForPeriod,
  getPeriod,
  listApprovalsForPeriod,
  newApprovalId,
  upsertApproval,
  upsertPeriod,
} from "../repository/local-store";
import {
  M07_NON_CERTIFIED_DISCLAIMER,
  type PayPeriodApproval,
  type PayPeriodApprovalStatus,
  type PayPeriodRecord,
} from "../types/domain";
import { recordM07Audit } from "./audit-service";
import { assessPeriodReadiness } from "./readiness-service";
import {
  buildSourceManifest,
  verifyManifestAgainstCurrent,
} from "./source-manifest-service";
import { assertManagementApproveSeparation } from "./sod-policy";
import {
  invalidateApprovalIfSourcesChanged,
  markPeriodApprovalStale,
} from "./approval-invalidation";
import { syncPeriodApprovalToInbox } from "../adapters/m02-inbox-publish";
import { assertNoProhibitedFields } from "./sensitive-fields";
import { assertPeriodNotLockedForOrdinaryMutation } from "./period-lock-guard";

export { invalidateApprovalIfSourcesChanged, markPeriodApprovalStale } from "./approval-invalidation";

function touchPeriod(
  period: PayPeriodRecord,
  state: PayPeriodRecord["state"],
  actor: M07Actor
): PayPeriodRecord {
  const next: PayPeriodRecord = {
    ...period,
    state,
    version: period.version + 1,
    updatedAt: new Date().toISOString(),
    updatedBy: actor.userId,
  };
  upsertPeriod(next);
  return next;
}

function nextApprovalVersion(periodId: string): number {
  const all = listApprovalsForPeriod(periodId);
  if (!all.length) return 1;
  return Math.max(...all.map((a) => a.approvalVersion)) + 1;
}

function isTerminalHistorical(status: PayPeriodApprovalStatus): boolean {
  return ["rejected", "withdrawn", "stale", "superseded"].includes(status);
}

/**
 * Submit period for management review. Idempotent when checksum unchanged.
 */
export function submitPeriodForReview(
  actor: M07Actor,
  input: { periodId: string; reason?: string }
): PayPeriodApproval {
  assertM07Permission(actor, "payroll.review.submit");
  assertNoProhibitedFields(input);

  const period = getPeriod(input.periodId);
  if (!period) throw new M07ValidationError("not-found", "Period not found");
  assertM07LegalEntityScope(actor, period.legalEntityId);
  assertM07ClinicScope(actor, period.clinicIds);
  assertPeriodNotLockedForOrdinaryMutation(period.id);

  if (period.state === "locked" || period.state === "exported" || period.state === "reconciled") {
    throw new M07ValidationError(
      "lifecycle",
      `Period state ${period.state} cannot be submitted for review`
    );
  }

  const current = getCurrentApprovalForPeriod(period.id);
  if (current?.status === "approved") {
    throw new M07ValidationError(
      "lifecycle",
      "Period already has an approved management approval — invalidate or wait for stale before resubmit"
    );
  }
  if (current?.status === "submitted") {
    // Will supersede if manifest changed; same checksum → idempotent return
  }

  const readiness = assessPeriodReadiness(actor, {
    legalEntityId: period.legalEntityId,
    periodId: period.id,
  });
  if (readiness.status !== "ready") {
    throw new M07ValidationError(
      "readiness-incomplete",
      `Period readiness is ${readiness.status}; submission blocked`
    );
  }

  const now = new Date().toISOString();

  // Idempotent replay: rebuild with pinned submitter metadata + current period version
  if (current?.status === "submitted") {
    const replay = buildSourceManifest(actor, {
      legalEntityId: period.legalEntityId,
      periodId: period.id,
      submittedBy: current.submittedBy,
      submittedAt: current.submittedAt,
      readiness,
      periodVersionOverride: current.manifest.periodVersion,
    });
    if (replay.checksum === current.manifest.checksum) {
      return current;
    }
    upsertApproval({
      ...current,
      status: "superseded",
      updatedAt: now,
      updatedBy: actor.userId,
    });
  }

  const needsPeriodBump = period.state !== "in-review";
  const pinnedPeriodVersion = needsPeriodBump ? period.version + 1 : period.version;
  const manifest = buildSourceManifest(actor, {
    legalEntityId: period.legalEntityId,
    periodId: period.id,
    submittedBy: actor.userId,
    submittedAt: now,
    readiness,
    periodVersionOverride: pinnedPeriodVersion,
  });

  if (needsPeriodBump) {
    touchPeriod(period, "in-review", actor);
  } else if (period.state !== "in-review") {
    touchPeriod(period, "in-review", actor);
  } else {
    // already in-review (resubmit after supersession of prior submitted)
    const p = getPeriod(period.id)!;
    if (p.state !== "in-review") touchPeriod(p, "in-review", actor);
  }

  const version = nextApprovalVersion(period.id);
  const approval: PayPeriodApproval = {
    id: newApprovalId(period.id, version),
    logicalKey: approvalLogicalKey(period.legalEntityId, period.id),
    approvalVersion: version,
    status: "submitted",
    legalEntityId: period.legalEntityId,
    organisationId: period.legalEntityId,
    periodId: period.id,
    manifest,
    submittedBy: actor.userId,
    submittedAt: now,
    supersedesApprovalId: current?.id ?? null,
    createdAt: now,
    createdBy: actor.userId,
    updatedAt: now,
    updatedBy: actor.userId,
    managementApprovalOnly: true,
    certified: false,
    paymentReady: false,
    disclaimer: M07_NON_CERTIFIED_DISCLAIMER,
  };
  upsertApproval(approval);

  recordM07Audit({
    actor,
    action: "approval.submit",
    entityType: "pay-period-approval",
    entityId: approval.id,
    legalEntityId: approval.legalEntityId,
    meta: {
      periodId: period.id,
      approvalVersion: version,
      checksum: manifest.checksum,
      reason: input.reason,
      managementApprovalOnly: true,
    },
  });

  syncPeriodApprovalToInbox(actor, approval, "submitted");
  return approval;
}

export function approvePeriodManagement(
  actor: M07Actor,
  input: { periodId: string; approvalId?: string }
): PayPeriodApproval {
  assertM07Permission(actor, "payroll.approve");
  assertNoProhibitedFields(input);

  const period = getPeriod(input.periodId);
  if (!period) throw new M07ValidationError("not-found", "Period not found");
  assertM07LegalEntityScope(actor, period.legalEntityId);
  assertM07ClinicScope(actor, period.clinicIds);
  assertPeriodNotLockedForOrdinaryMutation(period.id);

  const current = getCurrentApprovalForPeriod(period.id);
  if (current?.status === "approved") {
    if (!input.approvalId || input.approvalId === current.id) {
      return current; // idempotent
    }
    throw new M07ValidationError("conflict", "Approval id does not match current approved record");
  }
  if (!current || current.status !== "submitted") {
    throw new M07ValidationError("lifecycle", "No submitted approval awaiting management approval");
  }
  if (input.approvalId && input.approvalId !== current.id) {
    throw new M07ValidationError("conflict", "Approval id does not match current submitted record");
  }

  // Idempotent re-approve of already approved same id — handled below if status flips
  assertManagementApproveSeparation({
    actor,
    legalEntityId: period.legalEntityId,
    approval: current,
  });

  const verify = verifyManifestAgainstCurrent(actor, current.manifest);
  if (!verify.ok) {
    throw new M07ValidationError(
      "manifest-stale",
      `Pinned source manifest no longer matches authoritative sources (${verify.reason})`
    );
  }

  const readiness = assessPeriodReadiness(actor, {
    legalEntityId: period.legalEntityId,
    periodId: period.id,
  });
  if (readiness.status !== "ready") {
    throw new M07ValidationError(
      "readiness-incomplete",
      "Period is no longer ready for management approval"
    );
  }

  const now = new Date().toISOString();
  // Anticipate export-ready period version bump so the approved pin remains reproducible
  // (same pattern as submit → in-review). Do not leave approved/export-ready with a
  // period-version mismatch against the live period record.
  const needsPeriodBump = period.state !== "export-ready";
  const pinnedPeriodVersion = needsPeriodBump ? period.version + 1 : period.version;
  const approvalManifest = buildSourceManifest(actor, {
    legalEntityId: period.legalEntityId,
    periodId: period.id,
    submittedBy: current.submittedBy,
    submittedAt: current.submittedAt,
    readiness,
    periodVersionOverride: pinnedPeriodVersion,
  });

  if (needsPeriodBump) {
    touchPeriod(period, "export-ready", actor);
  }

  const approved: PayPeriodApproval = {
    ...current,
    status: "approved",
    manifest: approvalManifest,
    approvedBy: actor.userId,
    approvedAt: now,
    updatedAt: now,
    updatedBy: actor.userId,
  };
  upsertApproval(approved);

  recordM07Audit({
    actor,
    action: "approval.approve",
    entityType: "pay-period-approval",
    entityId: approved.id,
    legalEntityId: approved.legalEntityId,
    meta: {
      periodId: period.id,
      checksum: approved.manifest.checksum,
      note: "Management approval of non-certified payroll-preparation dataset — not certified or payment-ready",
    },
  });

  syncPeriodApprovalToInbox(actor, approved, "approved");
  return approved;
}

export function rejectPeriodManagement(
  actor: M07Actor,
  input: { periodId: string; reason: string; approvalId?: string }
): PayPeriodApproval {
  assertM07Permission(actor, "payroll.approve");
  if (!input.reason?.trim()) {
    throw new M07ValidationError("validation", "Rejection reason is mandatory");
  }
  assertNoProhibitedFields(input);

  const period = getPeriod(input.periodId);
  if (!period) throw new M07ValidationError("not-found", "Period not found");
  assertM07LegalEntityScope(actor, period.legalEntityId);
  assertPeriodNotLockedForOrdinaryMutation(period.id);

  const current = getCurrentApprovalForPeriod(period.id);
  if (!current || current.status !== "submitted") {
    throw new M07ValidationError("lifecycle", "No submitted approval to reject");
  }
  if (input.approvalId && input.approvalId !== current.id) {
    throw new M07ValidationError("conflict", "Approval id mismatch");
  }

  const now = new Date().toISOString();
  const rejected: PayPeriodApproval = {
    ...current,
    status: "rejected",
    rejectedBy: actor.userId,
    rejectedAt: now,
    rejectionReason: input.reason.trim(),
    updatedAt: now,
    updatedBy: actor.userId,
  };
  upsertApproval(rejected);
  touchPeriod(period, "open", actor);

  recordM07Audit({
    actor,
    action: "approval.reject",
    entityType: "pay-period-approval",
    entityId: rejected.id,
    legalEntityId: rejected.legalEntityId,
    meta: { periodId: period.id, reason: input.reason.trim() },
  });

  syncPeriodApprovalToInbox(actor, rejected, "rejected");
  return rejected;
}

/**
 * Withdraw a submitted approval before management approval (OD-2).
 * Original submitter or Pay Admin (`payroll.review.submit` + admin pack / submit perm).
 */
export function withdrawPeriodSubmission(
  actor: M07Actor,
  input: { periodId: string; reason: string; approvalId?: string }
): PayPeriodApproval {
  assertM07Permission(actor, "payroll.review.submit");
  if (!input.reason?.trim()) {
    throw new M07ValidationError("validation", "Withdrawal reason is mandatory");
  }
  assertNoProhibitedFields(input);

  const period = getPeriod(input.periodId);
  if (!period) throw new M07ValidationError("not-found", "Period not found");
  assertM07LegalEntityScope(actor, period.legalEntityId);
  assertPeriodNotLockedForOrdinaryMutation(period.id);

  const current = getCurrentApprovalForPeriod(period.id);
  if (!current || current.status !== "submitted") {
    throw new M07ValidationError("lifecycle", "Only submitted approvals may be withdrawn");
  }
  if (input.approvalId && input.approvalId !== current.id) {
    throw new M07ValidationError("conflict", "Approval id mismatch");
  }

  const isSubmitter = current.submittedBy === actor.userId;
  const isAdmin =
    hasM07Permission(actor, "payroll.settings.edit") ||
    hasM07Permission(actor, "payroll.entity.settings") ||
    hasM07Permission(actor, "payroll.bulk");
  if (!isSubmitter && !isAdmin) {
    throw new M07SeparationOfDutiesError(
      "Only the original submitter or an authorised Pay Admin may withdraw"
    );
  }

  const now = new Date().toISOString();
  const withdrawn: PayPeriodApproval = {
    ...current,
    status: "withdrawn",
    withdrawnBy: actor.userId,
    withdrawnAt: now,
    withdrawalReason: input.reason.trim(),
    updatedAt: now,
    updatedBy: actor.userId,
  };
  upsertApproval(withdrawn);
  touchPeriod(period, "open", actor);

  recordM07Audit({
    actor,
    action: "approval.withdraw",
    entityType: "pay-period-approval",
    entityId: withdrawn.id,
    legalEntityId: withdrawn.legalEntityId,
    meta: { periodId: period.id, reason: input.reason.trim() },
  });

  syncPeriodApprovalToInbox(actor, withdrawn, "withdrawn");
  return withdrawn;
}

export function getPeriodApprovalView(
  actor: M07Actor,
  input: { legalEntityId: string; periodId: string }
): {
  readiness: ReturnType<typeof assessPeriodReadiness>;
  current: PayPeriodApproval | null;
  history: PayPeriodApproval[];
  period: PayPeriodRecord | null;
} {
  assertM07Permission(actor, "payroll.view");
  assertM07LegalEntityScope(actor, input.legalEntityId);
  const period = getPeriod(input.periodId);
  if (period) assertM07ClinicScope(actor, period.clinicIds);
  const readiness = assessPeriodReadiness(actor, input);
  const history = listApprovalsForPeriod(input.periodId);
  const current = getCurrentApprovalForPeriod(input.periodId);
  return { readiness, current, history, period };
}

