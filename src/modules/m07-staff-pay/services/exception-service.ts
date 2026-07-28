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
import { recordM07Audit } from "./audit-service";
import { assertNoProhibitedFields } from "./sensitive-fields";
import { syncPayPrepExceptionToInbox } from "../adapters/m02-inbox-publish";

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
  assertM07Permission(actor, "payroll.exception.view");
  assertM07LegalEntityScope(actor, legalEntityId);
  return listExceptions(legalEntityId)
    .filter((e) => e.status === "open")
    .filter((e) => (filter?.personId ? e.personId === filter.personId : true))
    .filter((e) => (filter?.periodId ? e.periodId === filter.periodId : true))
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
  return updated;
}
