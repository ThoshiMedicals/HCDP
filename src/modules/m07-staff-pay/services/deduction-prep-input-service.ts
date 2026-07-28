/**
 * Controlled M07 manual deduction source inputs (Batch 4 CP 4.2 / OD-2 / OD-3).
 * Distinct from calculation-batch output lines. Never writes M04/M05/M06.
 */

import {
  assertM07ClinicScope,
  assertM07LegalEntityScope,
  assertM07Permission,
  M07ValidationError,
  type M07Actor,
} from "../permissions";
import {
  getCode,
  getDeductionPrepInput,
  getPeriod,
  listDeductionPrepInputs,
  listProfiles,
  newDeductionPrepInputId,
  upsertDeductionPrepInput,
} from "../repository/local-store";
import {
  M07_NON_CERTIFIED_DISCLAIMER,
  type DeductionPrepInput,
} from "../types/domain";
import { isDoctorPayExcluded } from "./classification-resolve";
import { recordM07Audit } from "./audit-service";
import { assertNoProhibitedFields } from "./sensitive-fields";

function activeDeductionCode(codeId: string, legalEntityId: string) {
  const code = getCode(codeId);
  if (!code || code.legalEntityId !== legalEntityId) {
    throw new M07ValidationError("unknown-deduction-code", "Deduction code not found for legal entity");
  }
  if (code.lineType !== "deduction") {
    throw new M07ValidationError("unsupported-deduction-input", "Code is not a deduction preparation code");
  }
  if (code.status !== "active") {
    throw new M07ValidationError("inactive-deduction-code", "Deduction code is inactive");
  }
  return code;
}

export function listActiveDeductionPrepInputs(
  actor: M07Actor,
  legalEntityId: string,
  filter?: { periodId?: string; personId?: string }
): DeductionPrepInput[] {
  assertM07Permission(actor, "payroll.view");
  assertM07LegalEntityScope(actor, legalEntityId);
  return listDeductionPrepInputs(legalEntityId)
    .filter((d) => d.status === "active")
    .filter((d) => (filter?.periodId ? d.periodId === filter.periodId : true))
    .filter((d) => (filter?.personId ? d.personId === filter.personId : true))
    .filter((d) => {
      try {
        assertM07ClinicScope(actor, [d.clinicId]);
        return true;
      } catch {
        return false;
      }
    });
}

export function listDeductionPrepInputHistory(
  actor: M07Actor,
  legalEntityId: string,
  filter?: { periodId?: string; personId?: string }
): DeductionPrepInput[] {
  assertM07Permission(actor, "payroll.view");
  assertM07LegalEntityScope(actor, legalEntityId);
  return listDeductionPrepInputs(legalEntityId)
    .filter((d) => (filter?.periodId ? d.periodId === filter.periodId : true))
    .filter((d) => (filter?.personId ? d.personId === filter.personId : true))
    .filter((d) => {
      try {
        assertM07ClinicScope(actor, [d.clinicId]);
        return true;
      } catch {
        return false;
      }
    });
}

export function createDeductionPrepInput(
  actor: M07Actor,
  input: {
    periodId: string;
    personId: string;
    codeId: string;
    quantity: number;
    unitDescription?: string;
    effectiveDate?: string;
    reason: string;
    clinicId?: string;
  }
): DeductionPrepInput {
  assertM07Permission(actor, "payroll.adjust");
  assertNoProhibitedFields(input);
  if (!input.reason.trim()) {
    throw new M07ValidationError("reason-required", "Reason is required for deduction inputs");
  }
  if (!Number.isFinite(input.quantity) || input.quantity <= 0) {
    throw new M07ValidationError(
      "malformed-deduction-quantity",
      "Deduction quantity must be a positive finite number"
    );
  }
  if (isDoctorPayExcluded(input.personId)) {
    throw new M07ValidationError("doctor-pay-excluded", "Doctors are excluded from staff-pay deduction prep");
  }

  const period = getPeriod(input.periodId);
  if (!period) throw new M07ValidationError("not-found", `Period ${input.periodId} not found`);
  assertM07LegalEntityScope(actor, period.legalEntityId);
  assertM07ClinicScope(actor, [input.clinicId, ...(period.clinicIds ?? [])]);

  const profile = listProfiles(period.legalEntityId).find(
    (p) => p.personId === input.personId && p.status === "active"
  );
  const clinicId = input.clinicId ?? profile?.clinicId;
  assertM07ClinicScope(actor, [clinicId]);

  const code = activeDeductionCode(input.codeId, period.legalEntityId);
  const now = new Date().toISOString();
  const row: DeductionPrepInput = {
    id: newDeductionPrepInputId(),
    legalEntityId: period.legalEntityId,
    organisationId: period.legalEntityId,
    clinicId,
    personId: input.personId,
    periodId: period.id,
    codeId: code.id,
    codeVersion: code.version,
    code: code.code,
    quantity: input.quantity,
    unitDescription: input.unitDescription,
    effectiveDate: input.effectiveDate ?? period.periodStart,
    reason: input.reason.trim(),
    status: "active",
    version: 1,
    createdAt: now,
    createdBy: actor.userId,
    updatedAt: now,
    updatedBy: actor.userId,
    supersedesInputId: null,
    certified: false,
    disclaimer: M07_NON_CERTIFIED_DISCLAIMER,
  };
  upsertDeductionPrepInput(row);
  recordM07Audit({
    actor,
    action: "deductionInput.create",
    entityType: "deduction-prep-input",
    entityId: row.id,
    legalEntityId: row.legalEntityId,
    clinicId: row.clinicId,
    reason: row.reason,
    after: row,
  });
  return row;
}

/**
 * Amend via supersession — prior version retained historically (no silent overwrite).
 */
export function supersedeDeductionPrepInput(
  actor: M07Actor,
  inputId: string,
  patch: {
    codeId?: string;
    quantity?: number;
    unitDescription?: string;
    effectiveDate?: string;
    reason: string;
  }
): DeductionPrepInput {
  assertM07Permission(actor, "payroll.adjust");
  if (!patch.reason.trim()) {
    throw new M07ValidationError("reason-required", "Reason is required to amend deduction inputs");
  }
  const existing = getDeductionPrepInput(inputId);
  if (!existing) throw new M07ValidationError("not-found", `Deduction input ${inputId} not found`);
  if (existing.status !== "active") {
    throw new M07ValidationError("not-active", `Cannot amend input in status ${existing.status}`);
  }
  assertM07LegalEntityScope(actor, existing.legalEntityId);
  assertM07ClinicScope(actor, [existing.clinicId]);
  assertNoProhibitedFields(patch);

  const quantity = patch.quantity ?? existing.quantity;
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new M07ValidationError(
      "malformed-deduction-quantity",
      "Deduction quantity must be a positive finite number"
    );
  }

  const code = activeDeductionCode(patch.codeId ?? existing.codeId, existing.legalEntityId);
  const now = new Date().toISOString();

  const superseded: DeductionPrepInput = {
    ...existing,
    status: "superseded",
    version: existing.version + 1,
    updatedAt: now,
    updatedBy: actor.userId,
  };
  upsertDeductionPrepInput(superseded);

  const next: DeductionPrepInput = {
    id: newDeductionPrepInputId(),
    legalEntityId: existing.legalEntityId,
    organisationId: existing.organisationId,
    clinicId: existing.clinicId,
    personId: existing.personId,
    periodId: existing.periodId,
    codeId: code.id,
    codeVersion: code.version,
    code: code.code,
    quantity,
    unitDescription: patch.unitDescription ?? existing.unitDescription,
    effectiveDate: patch.effectiveDate ?? existing.effectiveDate,
    reason: patch.reason.trim(),
    status: "active",
    version: 1,
    createdAt: now,
    createdBy: actor.userId,
    updatedAt: now,
    updatedBy: actor.userId,
    supersedesInputId: existing.id,
    certified: false,
    disclaimer: M07_NON_CERTIFIED_DISCLAIMER,
  };
  upsertDeductionPrepInput(next);
  recordM07Audit({
    actor,
    action: "deductionInput.supersede",
    entityType: "deduction-prep-input",
    entityId: next.id,
    legalEntityId: next.legalEntityId,
    clinicId: next.clinicId,
    reason: next.reason,
    before: existing,
    after: next,
    meta: { supersededInputId: existing.id },
  });
  return next;
}

export function cancelDeductionPrepInput(
  actor: M07Actor,
  inputId: string,
  reason: string
): DeductionPrepInput {
  assertM07Permission(actor, "payroll.adjust");
  if (!reason.trim()) {
    throw new M07ValidationError("reason-required", "Cancel reason is required");
  }
  const existing = getDeductionPrepInput(inputId);
  if (!existing) throw new M07ValidationError("not-found", `Deduction input ${inputId} not found`);
  if (existing.status !== "active") {
    throw new M07ValidationError("not-active", `Cannot cancel input in status ${existing.status}`);
  }
  assertM07LegalEntityScope(actor, existing.legalEntityId);
  assertM07ClinicScope(actor, [existing.clinicId]);

  const now = new Date().toISOString();
  const updated: DeductionPrepInput = {
    ...existing,
    status: "cancelled",
    version: existing.version + 1,
    updatedAt: now,
    updatedBy: actor.userId,
    cancelledAt: now,
    cancelledBy: actor.userId,
    cancelReason: reason.trim(),
  };
  upsertDeductionPrepInput(updated);
  recordM07Audit({
    actor,
    action: "deductionInput.cancel",
    entityType: "deduction-prep-input",
    entityId: updated.id,
    legalEntityId: updated.legalEntityId,
    clinicId: updated.clinicId,
    reason: reason.trim(),
    before: existing,
    after: updated,
  });
  return updated;
}
