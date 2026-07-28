/**
 * Classification → preparation-rule resolution (Batch 3 CP 3.1).
 * Fail-closed: missing inputs become exception kinds, never silent calc.
 */

import {
  assertM07LegalEntityScope,
  assertM07Permission,
  type M07Actor,
} from "../permissions";
import { listProfiles } from "../repository/local-store";
import { getRule, listClassificationMaps } from "../repository/local-store";
import { resolvePersonIdentity } from "../adapters/m04-person-read";
import { readM04PersonKind } from "../adapters/m04-leave-read";
import type { ClassificationResolveResult, PayProfile } from "../types/domain";

function activeProfileForPerson(
  legalEntityId: string,
  personId: string
): PayProfile | null {
  return (
    listProfiles(legalEntityId).find(
      (p) => p.personId === personId && p.status === "active"
    ) ?? null
  );
}

export function isDoctorPayExcluded(personId: string): boolean {
  const identity = resolvePersonIdentity(personId);
  const kind =
    identity?.personKind ?? readM04PersonKind(personId)?.personKind ?? undefined;
  if (!kind) return false;
  const normalised = kind.toLowerCase();
  return (
    normalised === "doctor" ||
    normalised === "m08" ||
    normalised.includes("doctor-pay") ||
    normalised === "practitioner"
  );
}

/**
 * Resolve classification → active rule mapping and rate readiness for a person.
 * Does not open exceptions (caller / calculate / leave services do).
 */
export function resolvePersonPreparationInputs(
  actor: M07Actor,
  input: { legalEntityId: string; personId: string }
): ClassificationResolveResult {
  assertM07Permission(actor, "payroll.view");
  assertM07LegalEntityScope(actor, input.legalEntityId);

  if (isDoctorPayExcluded(input.personId)) {
    return {
      status: "doctor-pay-excluded",
      personId: input.personId,
      legalEntityId: input.legalEntityId,
      exceptionKind: "doctor-pay-excluded",
      message: "Doctors and M08 doctor-pay records are excluded from staff-pay preparation",
    };
  }

  const person = resolvePersonIdentity(input.personId);
  if (!person) {
    return {
      status: "missing-person",
      personId: input.personId,
      legalEntityId: input.legalEntityId,
      exceptionKind: "missing-person",
      message: `M04 person not found: ${input.personId}`,
    };
  }

  if (person.organisationId && person.organisationId !== input.legalEntityId) {
    return {
      status: "legal-entity-boundary-mismatch",
      personId: input.personId,
      legalEntityId: input.legalEntityId,
      exceptionKind: "legal-entity-boundary-mismatch",
      message: "Person organisation does not match pay-period legal entity",
    };
  }

  const profile = activeProfileForPerson(input.legalEntityId, input.personId);
  if (!profile) {
    return {
      status: "missing-profile",
      personId: input.personId,
      legalEntityId: input.legalEntityId,
      exceptionKind: "missing-profile",
      message: "No active M07 pay profile for person in legal entity",
    };
  }

  const classificationRef =
    profile.m04ClassificationRef ?? person.classificationRef ?? null;
  if (!classificationRef) {
    return {
      status: "missing-classification",
      personId: input.personId,
      legalEntityId: input.legalEntityId,
      exceptionKind: "missing-classification",
      message: "Classification is required for preparation",
    };
  }

  const maps = listClassificationMaps(input.legalEntityId).filter(
    (m) => m.status === "active" && m.m04ClassificationRef === classificationRef
  );
  if (!maps.length) {
    return {
      status: "missing-classification-rule-map",
      personId: input.personId,
      legalEntityId: input.legalEntityId,
      classificationRef,
      exceptionKind: "missing-classification-rule-map",
      message: `No active classification→rule mapping for ${classificationRef}`,
    };
  }
  if (maps.length > 1) {
    return {
      status: "missing-classification-rule-map",
      personId: input.personId,
      legalEntityId: input.legalEntityId,
      classificationRef,
      exceptionKind: "missing-classification-rule-map",
      message: `Ambiguous classification→rule mapping for ${classificationRef}`,
    };
  }

  const mapping = maps[0]!;
  const rule = getRule(mapping.preparationRuleId);
  if (!rule || rule.status !== "active" || rule.legalEntityId !== input.legalEntityId) {
    return {
      status: "missing-classification-rule-map",
      personId: input.personId,
      legalEntityId: input.legalEntityId,
      classificationRef,
      mappingId: mapping.id,
      exceptionKind: "missing-classification-rule-map",
      message: "Mapped preparation rule is missing or inactive",
    };
  }

  if (profile.ordinaryHourlyRate == null || Number.isNaN(profile.ordinaryHourlyRate)) {
    return {
      status: "missing-rate",
      personId: input.personId,
      legalEntityId: input.legalEntityId,
      classificationRef,
      mappingId: mapping.id,
      ruleId: rule.id,
      ruleVersion: rule.version,
      ordinaryHourlyRate: null,
      exceptionKind: "missing-rate",
      message: "Ordinary hourly rate is required for preparation",
    };
  }

  return {
    status: "resolved",
    personId: input.personId,
    legalEntityId: input.legalEntityId,
    classificationRef,
    mappingId: mapping.id,
    ruleId: rule.id,
    ruleVersion: rule.version,
    ordinaryHourlyRate: profile.ordinaryHourlyRate,
  };
}
