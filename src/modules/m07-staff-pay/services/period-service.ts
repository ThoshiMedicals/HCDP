/**
 * Pay-period domain lifecycle foundation (Batch 1).
 * Create/list/validate one-open-ordinary + overlap only. No lock/approve/export.
 */

import { createPayPeriodRef } from "@/platform/workforce/contracts/pay-period-ref";
import {
  assertM07ClinicScope,
  assertM07LegalEntityScope,
  assertM07Permission,
  M07ValidationError,
  type M07Actor,
} from "../permissions";
import {
  getEntitySettings,
  getPeriod,
  listPeriods,
  newPeriodId,
  upsertPeriod,
} from "../repository/local-store";
import type { CadenceKind, PayPeriodRecord } from "../types/domain";
import { recordM07Audit } from "./audit-service";
import { assertNoProhibitedFields } from "./sensitive-fields";
import { isSeparationOfDutiesEnabled } from "./sod-policy";
import { deriveEntityPaySettingsDefaults } from "./entity-settings-service";

function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

export function listPayPeriods(actor: M07Actor, legalEntityId: string): PayPeriodRecord[] {
  assertM07Permission(actor, "payroll.view");
  assertM07LegalEntityScope(actor, legalEntityId);
  return listPeriods(legalEntityId);
}

export function getPayPeriod(actor: M07Actor, periodId: string): PayPeriodRecord | null {
  assertM07Permission(actor, "payroll.view");
  const period = getPeriod(periodId);
  if (!period) return null;
  assertM07LegalEntityScope(actor, period.legalEntityId);
  assertM07ClinicScope(actor, period.clinicIds);
  return period;
}

export function createOrdinaryPayPeriod(
  actor: M07Actor,
  input: {
    legalEntityId: string;
    clinicIds?: string[];
    periodStart: string;
    periodEnd: string;
    cadence?: CadenceKind;
  }
): PayPeriodRecord {
  assertM07Permission(actor, "payroll.period.create");
  assertM07LegalEntityScope(actor, input.legalEntityId);
  assertM07ClinicScope(actor, input.clinicIds ?? []);
  assertNoProhibitedFields(input);

  if (!input.legalEntityId) {
    throw new M07ValidationError("legal-entity-required", "legalEntityId is required");
  }
  if (input.periodStart > input.periodEnd) {
    throw new M07ValidationError("validation", "periodStart must be <= periodEnd");
  }

  const existing = listPeriods(input.legalEntityId);
  const blockingOpen = existing.find(
    (p) => p.kind === "ordinary" && !["locked", "archived"].includes(p.state)
  );
  if (blockingOpen) {
    throw new M07ValidationError(
      "overlapping-open-period",
      `Legal entity already has an open ordinary period ${blockingOpen.id}`
    );
  }

  const overlap = existing.find(
    (p) =>
      p.kind === "ordinary" &&
      !["archived"].includes(p.state) &&
      rangesOverlap(input.periodStart, input.periodEnd, p.periodStart, p.periodEnd)
  );
  if (overlap) {
    throw new M07ValidationError(
      "period-overlap",
      `Period overlaps existing period ${overlap.id}`
    );
  }

  // Resolve cadence from stored settings or ephemeral defaults — never persist here.
  const settings =
    getEntitySettings(input.legalEntityId) ?? deriveEntityPaySettingsDefaults(input.legalEntityId);
  const now = new Date().toISOString();
  const period: PayPeriodRecord = {
    id: newPeriodId(),
    legalEntityId: input.legalEntityId,
    clinicIds: input.clinicIds ?? [],
    kind: "ordinary",
    cadence: input.cadence ?? settings.cadenceDefault,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    state: "open",
    separationOfDutiesSnapshot: isSeparationOfDutiesEnabled(input.legalEntityId),
    version: 1,
    createdAt: now,
    updatedAt: now,
    createdBy: actor.userId,
    updatedBy: actor.userId,
    lockedAt: null,
    lockedBy: null,
    exportCreated: false,
  };
  upsertPeriod(period);
  recordM07Audit({
    actor,
    action: "period.create",
    entityType: "pay-period",
    entityId: period.id,
    legalEntityId: period.legalEntityId,
    after: period,
  });
  return period;
}

export function toPublishedPayPeriodRef(period: PayPeriodRecord) {
  return createPayPeriodRef({
    recordId: period.id,
    organisationId: period.legalEntityId,
    clinicId: period.clinicIds[0],
    status: period.state,
    periodStart: period.periodStart,
    periodEnd: period.periodEnd,
    exportCreated: period.exportCreated,
    locked: period.state === "locked",
    section: "overview",
    displayLabel: `Pay period ${period.periodStart} → ${period.periodEnd}`,
  });
}

/** @deprecated Use readEntityPaySettings / upsertEntityPaySettings — kept for import discovery only. */
export {
  readEntityPaySettings,
  upsertEntityPaySettings,
  bootstrapDefaultEntityPaySettings,
  seedEntityPaySettingsIfAbsent,
  deriveEntityPaySettingsDefaults,
} from "./entity-settings-service";
