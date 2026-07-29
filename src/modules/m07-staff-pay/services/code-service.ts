/**
 * Small versioned generic allowance/deduction code list (Batch 1).
 */

import {
  assertM07LegalEntityScope,
  assertM07Permission,
  M07ValidationError,
  type M07Actor,
} from "../permissions";
import { getCode, listCodes, newCodeId, upsertCode } from "../repository/local-store";
import type { GenericCode, GenericCodeLineType } from "../types/domain";
import { recordM07Audit } from "./audit-service";
import { assertNoLockedPeriodsForLegalEntity } from "./period-lock-guard";
import { assertNoProhibitedFields } from "./sensitive-fields";

export function listGenericCodes(actor: M07Actor, legalEntityId: string): GenericCode[] {
  assertM07Permission(actor, "payroll.view");
  assertM07LegalEntityScope(actor, legalEntityId);
  return listCodes(legalEntityId);
}

export function createGenericCode(
  actor: M07Actor,
  input: {
    legalEntityId: string;
    code: string;
    label: string;
    lineType: GenericCodeLineType;
    externalMappingField?: string | null;
    permittedOrigin?: GenericCode["permittedOrigin"];
    effectiveFrom: string;
    effectiveTo?: string | null;
  }
): GenericCode {
  assertM07Permission(actor, "payroll.codes.edit");
  assertM07LegalEntityScope(actor, input.legalEntityId);
  assertNoProhibitedFields(input);
  assertNoLockedPeriodsForLegalEntity(
    actor,
    input.legalEntityId,
    "generic-code-create",
    input.effectiveFrom,
    input.effectiveTo ?? null
  );
  const now = new Date().toISOString();
  const row: GenericCode = {
    id: newCodeId(),
    legalEntityId: input.legalEntityId,
    code: input.code,
    label: input.label,
    lineType: input.lineType,
    externalMappingField: input.externalMappingField ?? null,
    permittedOrigin: input.permittedOrigin ?? "either",
    certified: false,
    effectiveFrom: input.effectiveFrom,
    effectiveTo: input.effectiveTo ?? null,
    status: "active",
    version: 1,
    createdAt: now,
    updatedAt: now,
    createdBy: actor.userId,
    updatedBy: actor.userId,
  };
  upsertCode(row);
  recordM07Audit({
    actor,
    action: "code.create",
    entityType: "generic-code",
    entityId: row.id,
    legalEntityId: row.legalEntityId,
    after: row,
  });
  return row;
}

export function versionGenericCode(
  actor: M07Actor,
  codeId: string,
  patch: Partial<Pick<GenericCode, "label" | "lineType" | "externalMappingField" | "permittedOrigin" | "effectiveFrom" | "effectiveTo" | "status">>
): GenericCode {
  assertM07Permission(actor, "payroll.codes.edit");
  assertNoProhibitedFields(patch);
  const existing = getCode(codeId);
  if (!existing) throw new M07ValidationError("not-found", `Code ${codeId} not found`);
  assertM07LegalEntityScope(actor, existing.legalEntityId);
  const updated: GenericCode = {
    ...existing,
    ...patch,
    certified: false,
    version: existing.version + 1,
    updatedAt: new Date().toISOString(),
    updatedBy: actor.userId,
  };
  assertNoLockedPeriodsForLegalEntity(
    actor,
    existing.legalEntityId,
    "generic-code-version",
    patch.effectiveFrom ?? existing.effectiveFrom,
    patch.effectiveTo !== undefined ? patch.effectiveTo : existing.effectiveTo
  );
  upsertCode(updated);
  recordM07Audit({
    actor,
    action: "code.version",
    entityType: "generic-code",
    entityId: updated.id,
    legalEntityId: updated.legalEntityId,
    before: existing,
    after: updated,
  });
  return updated;
}

export function retireGenericCode(actor: M07Actor, codeId: string, reason: string): GenericCode {
  const updated = versionGenericCode(actor, codeId, { status: "retired" });
  recordM07Audit({
    actor,
    action: "code.retire",
    entityType: "generic-code",
    entityId: updated.id,
    legalEntityId: updated.legalEntityId,
    reason,
  });
  return updated;
}
