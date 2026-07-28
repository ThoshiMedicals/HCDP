/**
 * Non-certified preparation rules + classification mappings (Batch 1).
 */

import {
  assertM07LegalEntityScope,
  assertM07Permission,
  M07ValidationError,
  type M07Actor,
} from "../permissions";
import {
  getClassificationMap,
  getRule,
  listClassificationMaps,
  listRules,
  newMappingId,
  newRuleId,
  upsertClassificationMap,
  upsertRule,
} from "../repository/local-store";
import {
  M07_NON_CERTIFIED_DISCLAIMER,
  type ClassificationRuleMapping,
  type PreparationRule,
} from "../types/domain";
import { recordM07Audit } from "./audit-service";
import { assertNoProhibitedFields } from "./sensitive-fields";

export function listPreparationRules(actor: M07Actor, legalEntityId: string): PreparationRule[] {
  assertM07Permission(actor, "payroll.view");
  assertM07LegalEntityScope(actor, legalEntityId);
  return listRules(legalEntityId);
}

export function createPreparationRule(
  actor: M07Actor,
  input: {
    legalEntityId: string;
    code: string;
    label: string;
    ordinaryMultiplier?: number;
    overtimeMultiplier?: number;
    effectiveFrom: string;
    effectiveTo?: string | null;
  }
): PreparationRule {
  assertM07Permission(actor, "payroll.rules.edit");
  assertM07LegalEntityScope(actor, input.legalEntityId);
  assertNoProhibitedFields(input);
  const now = new Date().toISOString();
  const rule: PreparationRule = {
    id: newRuleId(),
    legalEntityId: input.legalEntityId,
    code: input.code,
    label: input.label,
    certified: false,
    disclaimer: M07_NON_CERTIFIED_DISCLAIMER,
    ordinaryMultiplier: input.ordinaryMultiplier ?? 1,
    overtimeMultiplier: input.overtimeMultiplier ?? 1.5,
    effectiveFrom: input.effectiveFrom,
    effectiveTo: input.effectiveTo ?? null,
    status: "active",
    version: 1,
    createdAt: now,
    updatedAt: now,
    createdBy: actor.userId,
    updatedBy: actor.userId,
  };
  upsertRule(rule);
  recordM07Audit({
    actor,
    action: "rule.create",
    entityType: "preparation-rule",
    entityId: rule.id,
    legalEntityId: rule.legalEntityId,
    after: rule,
  });
  return rule;
}

export function versionPreparationRule(
  actor: M07Actor,
  ruleId: string,
  patch: Partial<Pick<PreparationRule, "label" | "ordinaryMultiplier" | "overtimeMultiplier" | "effectiveFrom" | "effectiveTo" | "status">>
): PreparationRule {
  assertM07Permission(actor, "payroll.rules.edit");
  assertNoProhibitedFields(patch);
  const existing = getRule(ruleId);
  if (!existing) throw new M07ValidationError("not-found", `Rule ${ruleId} not found`);
  assertM07LegalEntityScope(actor, existing.legalEntityId);
  const updated: PreparationRule = {
    ...existing,
    ...patch,
    certified: false,
    disclaimer: M07_NON_CERTIFIED_DISCLAIMER,
    version: existing.version + 1,
    updatedAt: new Date().toISOString(),
    updatedBy: actor.userId,
  };
  upsertRule(updated);
  recordM07Audit({
    actor,
    action: "rule.version",
    entityType: "preparation-rule",
    entityId: updated.id,
    legalEntityId: updated.legalEntityId,
    before: existing,
    after: updated,
  });
  return updated;
}

export function retirePreparationRule(actor: M07Actor, ruleId: string, reason: string): PreparationRule {
  return versionPreparationRule(actor, ruleId, { status: "retired" });
}

export function createClassificationMapping(
  actor: M07Actor,
  input: {
    legalEntityId: string;
    m04ClassificationRef: string;
    preparationRuleId: string;
    effectiveFrom: string;
    effectiveTo?: string | null;
  }
): ClassificationRuleMapping {
  assertM07Permission(actor, "payroll.rules.edit");
  assertM07LegalEntityScope(actor, input.legalEntityId);
  assertNoProhibitedFields(input);
  const rule = getRule(input.preparationRuleId);
  if (!rule || rule.legalEntityId !== input.legalEntityId) {
    throw new M07ValidationError("rule-missing", "Preparation rule not found for legal entity");
  }
  if (rule.status !== "active") {
    throw new M07ValidationError("rule-inactive", "Cannot map to inactive/retired rule");
  }

  const ambiguous = listClassificationMaps(input.legalEntityId).find(
    (m) =>
      m.status === "active" &&
      m.m04ClassificationRef === input.m04ClassificationRef
  );
  if (ambiguous) {
    throw new M07ValidationError(
      "classification-mapping-ambiguous",
      `Active mapping already exists for classification ${input.m04ClassificationRef}`
    );
  }

  const now = new Date().toISOString();
  const mapping: ClassificationRuleMapping = {
    id: newMappingId(),
    legalEntityId: input.legalEntityId,
    m04ClassificationRef: input.m04ClassificationRef,
    preparationRuleId: rule.id,
    preparationRuleVersion: rule.version,
    status: "active",
    effectiveFrom: input.effectiveFrom,
    effectiveTo: input.effectiveTo ?? null,
    version: 1,
    createdAt: now,
    updatedAt: now,
    createdBy: actor.userId,
    updatedBy: actor.userId,
  };
  upsertClassificationMap(mapping);
  recordM07Audit({
    actor,
    action: "classification-map.create",
    entityType: "classification-map",
    entityId: mapping.id,
    legalEntityId: mapping.legalEntityId,
    after: mapping,
  });
  return mapping;
}

export function resolveClassificationMapping(
  actor: M07Actor,
  legalEntityId: string,
  m04ClassificationRef: string
): ClassificationRuleMapping {
  assertM07Permission(actor, "payroll.view");
  assertM07LegalEntityScope(actor, legalEntityId);
  const maps = listClassificationMaps(legalEntityId).filter(
    (m) => m.status === "active" && m.m04ClassificationRef === m04ClassificationRef
  );
  if (!maps.length) {
    throw new M07ValidationError(
      "classification-mapping-missing",
      `No active mapping for classification ${m04ClassificationRef}`
    );
  }
  if (maps.length > 1) {
    throw new M07ValidationError(
      "classification-mapping-ambiguous",
      `Ambiguous mappings for classification ${m04ClassificationRef}`
    );
  }
  return maps[0]!;
}

export function retireClassificationMapping(
  actor: M07Actor,
  mappingId: string,
  reason: string
): ClassificationRuleMapping {
  assertM07Permission(actor, "payroll.rules.edit");
  const existing = getClassificationMap(mappingId);
  if (!existing) throw new M07ValidationError("not-found", `Mapping ${mappingId} not found`);
  assertM07LegalEntityScope(actor, existing.legalEntityId);
  const updated: ClassificationRuleMapping = {
    ...existing,
    status: "retired",
    version: existing.version + 1,
    updatedAt: new Date().toISOString(),
    updatedBy: actor.userId,
  };
  upsertClassificationMap(updated);
  recordM07Audit({
    actor,
    action: "classification-map.retire",
    entityType: "classification-map",
    entityId: updated.id,
    legalEntityId: updated.legalEntityId,
    reason,
    before: existing,
    after: updated,
  });
  return updated;
}
