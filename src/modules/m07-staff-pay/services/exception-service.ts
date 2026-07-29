/**
 * Pay-prep blocking exceptions (Batch 3 CP 3.1).
 * Fail-closed: blocked records must not produce payable-looking output.
 */

import {
  assertM07ClinicScope,
  assertM07LegalEntityScope,
  assertM07Permission,
  M07ValidationError,
  type M07Actor,
} from "../permissions";
import {
  getException,
  listExceptions,
  newExceptionId,
  upsertException,
} from "../repository/local-store";
import type { PayPrepException, PayPrepExceptionKind } from "../types/domain";
import {
  NON_WAIVABLE_EXCEPTION_KINDS,
  WAIVABLE_EXCEPTION_KINDS,
} from "../types/domain";
import { recordM07Audit } from "./audit-service";
import { assertNoProhibitedFields } from "./sensitive-fields";
import { syncPayPrepExceptionToInbox } from "../adapters/m02-inbox-publish";
import { assertExceptionWaiverSeparation } from "./sod-policy";
import { invalidateApprovalIfSourcesChanged } from "./approval-invalidation";
import { assertPeriodNotLockedForOrdinaryMutation } from "./period-lock-guard";

export function isWaivableExceptionKind(kind: PayPrepExceptionKind): boolean {
  return (WAIVABLE_EXCEPTION_KINDS as readonly string[]).includes(kind);
}

export function isNonWaivableExceptionKind(kind: PayPrepExceptionKind): boolean {
  return (NON_WAIVABLE_EXCEPTION_KINDS as readonly string[]).includes(kind);
}

export function buildExceptionProjectionKey(input: {
  legalEntityId: string;
  personId: string;
  kind: PayPrepExceptionKind;
  periodId?: string;
  snapshotId?: string;
  m04LeaveRecordId?: string;
}): string {
  const period = input.periodId ?? "_";
  const snap = input.snapshotId ?? input.m04LeaveRecordId ?? "_";
  return `m07::prep-blocker::${input.legalEntityId}::${input.personId}::${input.kind}::${period}::${snap}`;
}

export function listOpenExceptions(
  actor: M07Actor,
  legalEntityId: string,
  filter?: { personId?: string; periodId?: string }
): PayPrepException[] {
  return listPayPrepExceptions(actor, legalEntityId, {
    ...filter,
    status: "open",
  });
}

export function listPayPrepExceptions(
  actor: M07Actor,
  legalEntityId: string,
  filter?: {
    personId?: string;
    periodId?: string;
    kind?: PayPrepExceptionKind;
    status?: PayPrepException["status"] | "all";
    clinicId?: string;
  }
): PayPrepException[] {
  assertM07Permission(actor, "payroll.exception.view");
  assertM07LegalEntityScope(actor, legalEntityId);
  return listExceptions(legalEntityId)
    .filter((e) =>
      filter?.status && filter.status !== "all" ? e.status === filter.status : true
    )
    .filter((e) => (filter?.personId ? e.personId === filter.personId : true))
    .filter((e) => (filter?.periodId ? e.periodId === filter.periodId : true))
    .filter((e) => (filter?.kind ? e.kind === filter.kind : true))
    .filter((e) => (filter?.clinicId ? e.clinicId === filter.clinicId : true))
    .filter((e) => {
      try {
        assertM07ClinicScope(actor, [e.clinicId]);
        return true;
      } catch {
        return false;
      }
    });
}

export function openPayPrepException(
  actor: M07Actor,
  input: {
    legalEntityId: string;
    organisationId: string;
    clinicId?: string;
    periodId?: string;
    personId: string;
    kind: PayPrepExceptionKind;
    message: string;
    snapshotId?: string;
    timesheetRecordId?: string;
    m04LeaveRecordId?: string;
    calculationBatchId?: string;
  }
): PayPrepException {
  assertM07Permission(actor, "payroll.calculate");
  assertM07LegalEntityScope(actor, input.legalEntityId);
  assertM07ClinicScope(actor, [input.clinicId]);
  assertNoProhibitedFields(input);
  if (input.periodId) assertPeriodNotLockedForOrdinaryMutation(input.periodId);

  if (input.organisationId !== input.legalEntityId) {
    // legalEntityId === organisation id (Q8); mismatch is itself a boundary error
    throw new M07ValidationError(
      "legal-entity-boundary-mismatch",
      "organisationId must equal legalEntityId for M07 prep"
    );
  }

  const projectionKey = buildExceptionProjectionKey(input);
  const existing = listExceptions(input.legalEntityId).find(
    (e) => e.projectionKey === projectionKey && e.status === "open"
  );
  if (existing) {
    const bumped: PayPrepException = {
      ...existing,
      message: input.message,
      version: existing.version + 1,
      updatedAt: new Date().toISOString(),
      updatedBy: actor.userId,
      calculationBatchId: input.calculationBatchId ?? existing.calculationBatchId,
    };
    upsertException(bumped);
    recordM07Audit({
      actor,
      action: "exception.updated",
      entityType: "pay-prep-exception",
      entityId: bumped.id,
      legalEntityId: bumped.legalEntityId,
      clinicId: bumped.clinicId,
      before: existing,
      after: bumped,
    });
    syncPayPrepExceptionToInbox(actor, bumped, "update");
    if (bumped.periodId) {
      invalidateApprovalIfSourcesChanged(actor, bumped.periodId, "exception-update");
    }
    return bumped;
  }

  const now = new Date().toISOString();
  const row: PayPrepException = {
    id: newExceptionId(),
    legalEntityId: input.legalEntityId,
    organisationId: input.organisationId,
    clinicId: input.clinicId,
    periodId: input.periodId,
    personId: input.personId,
    kind: input.kind,
    status: "open",
    message: input.message,
    snapshotId: input.snapshotId,
    timesheetRecordId: input.timesheetRecordId,
    m04LeaveRecordId: input.m04LeaveRecordId,
    calculationBatchId: input.calculationBatchId,
    version: 1,
    createdAt: now,
    createdBy: actor.userId,
    updatedAt: now,
    updatedBy: actor.userId,
    projectionKey,
  };
  upsertException(row);
  recordM07Audit({
    actor,
    action: "exception.opened",
    entityType: "pay-prep-exception",
    entityId: row.id,
    legalEntityId: row.legalEntityId,
    clinicId: row.clinicId,
    after: row,
  });
  syncPayPrepExceptionToInbox(actor, row, "create");
  if (row.periodId) {
    invalidateApprovalIfSourcesChanged(actor, row.periodId, "exception-opened");
  }
  return row;
}

export function resolvePayPrepException(
  actor: M07Actor,
  exceptionId: string,
  reason: string
): PayPrepException {
  assertM07Permission(actor, "payroll.exception.resolve");
  if (!reason.trim()) {
    throw new M07ValidationError("reason-required", "Resolution reason is required");
  }
  const existing = getException(exceptionId);
  if (!existing) throw new M07ValidationError("not-found", `Exception ${exceptionId} not found`);
  assertM07LegalEntityScope(actor, existing.legalEntityId);
  assertM07ClinicScope(actor, [existing.clinicId]);
  if (existing.periodId) assertPeriodNotLockedForOrdinaryMutation(existing.periodId);
  if (existing.status !== "open") {
    throw new M07ValidationError("not-open", `Exception is already ${existing.status}`);
  }

  const now = new Date().toISOString();
  const updated: PayPrepException = {
    ...existing,
    status: "resolved",
    version: existing.version + 1,
    updatedAt: now,
    updatedBy: actor.userId,
    resolvedAt: now,
    resolvedBy: actor.userId,
    resolutionReason: reason,
  };
  upsertException(updated);
  recordM07Audit({
    actor,
    action: "exception.resolved",
    entityType: "pay-prep-exception",
    entityId: updated.id,
    legalEntityId: updated.legalEntityId,
    clinicId: updated.clinicId,
    reason,
    before: existing,
    after: updated,
  });
  syncPayPrepExceptionToInbox(actor, updated, "close");
  if (updated.periodId) {
    invalidateApprovalIfSourcesChanged(actor, updated.periodId, "exception-resolved");
  }
  return updated;
}

export function waivePayPrepException(
  actor: M07Actor,
  exceptionId: string,
  reason: string
): PayPrepException {
  assertM07Permission(actor, "payroll.exception.waive");
  if (!reason.trim()) {
    throw new M07ValidationError("reason-required", "Waiver reason is required");
  }
  const existing = getException(exceptionId);
  if (!existing) throw new M07ValidationError("not-found", `Exception ${exceptionId} not found`);
  assertM07LegalEntityScope(actor, existing.legalEntityId);
  assertM07ClinicScope(actor, [existing.clinicId]);
  if (existing.periodId) assertPeriodNotLockedForOrdinaryMutation(existing.periodId);
  if (existing.status !== "open") {
    throw new M07ValidationError("not-open", `Exception is already ${existing.status}`);
  }
  if (isNonWaivableExceptionKind(existing.kind) || !isWaivableExceptionKind(existing.kind)) {
    throw new M07ValidationError(
      "non-waivable",
      `Exception kind ${existing.kind} cannot be waived`
    );
  }
  assertExceptionWaiverSeparation({
    actor,
    legalEntityId: existing.legalEntityId,
    exceptionCreatedByUserId: existing.createdBy,
  });

  const now = new Date().toISOString();
  const updated: PayPrepException = {
    ...existing,
    status: "waived",
    version: existing.version + 1,
    updatedAt: now,
    updatedBy: actor.userId,
    waivedAt: now,
    waivedBy: actor.userId,
    waiverReason: reason.trim(),
  };
  upsertException(updated);
  recordM07Audit({
    actor,
    action: "exception.waived",
    entityType: "pay-prep-exception",
    entityId: updated.id,
    legalEntityId: updated.legalEntityId,
    clinicId: updated.clinicId,
    reason: reason.trim(),
    before: existing,
    after: updated,
  });
  syncPayPrepExceptionToInbox(actor, updated, "close");
  if (updated.periodId) {
    invalidateApprovalIfSourcesChanged(actor, updated.periodId, "exception-waived");
  }
  return updated;
}
