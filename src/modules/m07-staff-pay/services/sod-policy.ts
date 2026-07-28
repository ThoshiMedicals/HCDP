/**
 * Separation-of-duties policy (Batch 1 foundation + Batch 4 waiver + Batch 5 approval).
 */

import {
  assertM07Permission,
  hasM07Permission,
  M07SeparationOfDutiesError,
  type M07Actor,
} from "../permissions";
import {
  getEntitySettings,
  listCalculationBatches,
  listDeductionPrepInputs,
  listExceptions,
} from "../repository/local-store";
import type { PayPeriodApproval } from "../types/domain";

export function isSeparationOfDutiesEnabled(legalEntityId: string): boolean {
  const settings = getEntitySettings(legalEntityId);
  // Q5 default on when unset
  return settings?.separationOfDuties ?? true;
}

/** Collect material preparer user ids from pinned manifest for SoD. */
export function collectMaterialPreparerUserIds(approval: PayPeriodApproval): string[] {
  const ids = new Set<string>();
  if (approval.submittedBy) ids.add(approval.submittedBy);
  for (const c of approval.manifest.calculations) {
    const batch = listCalculationBatches(approval.legalEntityId).find((b) => b.id === c.batchId);
    if (batch?.calculatedBy) ids.add(batch.calculatedBy);
  }
  for (const d of approval.manifest.deductionInputs) {
    const input = listDeductionPrepInputs(approval.legalEntityId).find((x) => x.id === d.inputId);
    if (input?.createdBy) ids.add(input.createdBy);
  }
  for (const ex of approval.manifest.exceptions) {
    if (ex.status === "waived" && ex.waivedBy) ids.add(ex.waivedBy);
    const full = listExceptions(approval.legalEntityId).find((e) => e.id === ex.id);
    if (full?.resolvedBy) ids.add(full.resolvedBy);
    if (full?.createdBy) ids.add(full.createdBy);
  }
  return [...ids];
}

/**
 * Final / management approve must not be performed by submitter or material preparers
 * when SoD is enabled.
 */
export function assertFinalApproveSeparation(input: {
  actor: M07Actor;
  legalEntityId: string;
  calculatedOrSubmittedByUserIds: string[];
}): void {
  assertM07Permission(input.actor, "payroll.approve");
  if (!isSeparationOfDutiesEnabled(input.legalEntityId)) return;
  if (input.calculatedOrSubmittedByUserIds.includes(input.actor.userId)) {
    throw new M07SeparationOfDutiesError(
      "Sole calculate/submit actor cannot be the sole management approver"
    );
  }
}

/** Batch 5 — extended SoD using pinned package material actors. */
export function assertManagementApproveSeparation(input: {
  actor: M07Actor;
  legalEntityId: string;
  approval: PayPeriodApproval;
}): void {
  assertM07Permission(input.actor, "payroll.approve");
  if (!isSeparationOfDutiesEnabled(input.legalEntityId)) return;
  const material = collectMaterialPreparerUserIds(input.approval);
  if (material.includes(input.actor.userId)) {
    throw new M07SeparationOfDutiesError(
      "Approver must not be the submitter, material calculator/preparer, deduction creator, or material exception resolver/waiver actor"
    );
  }
}

/** Export operator alone must not lock (Q20). */
export function assertLockActorAllowed(actor: M07Actor): void {
  const canLock = hasM07Permission(actor, "payroll.period.lock");
  if (!canLock) {
    throw new M07SeparationOfDutiesError("Lock requires Pay approver or Pay admin");
  }
  if (
    hasM07Permission(actor, "payroll.export.create") &&
    !hasM07Permission(actor, "payroll.period.lock") &&
    !hasM07Permission(actor, "payroll.approve")
  ) {
    throw new M07SeparationOfDutiesError("Export operator alone cannot lock");
  }
}

/** Export operator cannot self-approve. */
export function assertExportOperatorCannotApprove(actor: M07Actor): void {
  if (hasM07Permission(actor, "payroll.approve")) return;
  if (hasM07Permission(actor, "payroll.export.create")) {
    throw new M07SeparationOfDutiesError("Export operator cannot self-approve");
  }
}

/**
 * Waiver SoD (Batch 4 OD-5): actor who created the exception cannot waive it
 * when SoD is enabled.
 */
export function assertExceptionWaiverSeparation(input: {
  actor: M07Actor;
  legalEntityId: string;
  exceptionCreatedByUserId: string;
}): void {
  assertM07Permission(input.actor, "payroll.exception.waive");
  if (!isSeparationOfDutiesEnabled(input.legalEntityId)) return;
  if (input.exceptionCreatedByUserId === input.actor.userId) {
    throw new M07SeparationOfDutiesError(
      "Actor who created the exception cannot waive it under separation of duties"
    );
  }
}
