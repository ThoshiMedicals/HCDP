/**
 * M05 cost forecast service (§14 of the plan).
 *
 * PLANNING ONLY. M05 cost forecasts are NOT payroll truth. Rate data / cost
 * numbers are masked unless the actor holds `roster.cost.view`.
 */

import { assertM05ClinicScope, assertM05Permission, hasM05Permission, type M05Actor } from "../permissions";
import type {
  CostForecast,
  CostForecastLineItem,
  Shift,
} from "../types/domain";
import * as store from "../repository/local-store";
import { appendRosterAudit } from "./audit-helpers";

const DEFAULT_CURRENCY = "AUD";

function shiftHours(shift: Shift): number {
  return (new Date(shift.utcEnd).getTime() - new Date(shift.utcStart).getTime()) / 3_600_000;
}

export interface BuildForecastInput {
  rosterPeriodId: string;
  organisationId?: string;
  currency?: string;
  ratesByRole?: Record<string, number>;
  allowancesPerShift?: number;
  onCostsPercent?: number;
  overtimeThresholdHours?: number;
  asOf?: string;
}

export function buildCostForecast(actor: M05Actor, input: BuildForecastInput): CostForecast {
  assertM05Permission(actor, "roster.report");
  const period = store.getPeriod(input.rosterPeriodId);
  if (!period) throw new Error(`Period not found: ${input.rosterPeriodId}`);
  assertM05ClinicScope(actor, [period.clinicId]);

  const rates = input.ratesByRole ?? {};
  const allowances = input.allowancesPerShift ?? 0;
  const onCostsPct = input.onCostsPercent ?? 0;
  const otThreshold = input.overtimeThresholdHours ?? 8;
  const asOf = input.asOf ?? new Date().toISOString();

  const shifts = store
    .listShifts(period.id)
    .filter((s) => !["cancelled", "superseded"].includes(s.status));

  const lineItems: CostForecastLineItem[] = [];
  const warnings: string[] = [];
  let ordinaryTotal = 0;
  let overtimeTotal = 0;
  let allowancesTotal = 0;
  let onCostsTotal = 0;

  for (const shift of shifts) {
    const hours = shiftHours(shift);
    const rate = shift.roleLabel ? rates[shift.roleLabel] : undefined;
    const missingRate = rate == null;
    if (missingRate && shift.roleLabel) {
      warnings.push(`Missing rate for role ${shift.roleLabel} — line ${shift.id}`);
    }
    const ordinary = Math.max(0, Math.min(otThreshold, hours));
    const overtime = Math.max(0, hours - otThreshold);
    const ordinaryCost = missingRate ? 0 : ordinary * (rate ?? 0);
    const overtimeCost = missingRate ? 0 : overtime * (rate ?? 0) * 1.5;
    const shiftAllowance = allowances;
    const subtotal = ordinaryCost + overtimeCost + shiftAllowance;
    const onCosts = subtotal * (onCostsPct / 100);

    const assignment = shift.currentAssignmentId
      ? store.getAssignment(shift.currentAssignmentId)
      : null;

    lineItems.push({
      personId: assignment?.personId ?? null,
      roleLabel: shift.roleLabel ?? null,
      hoursOrdinary: ordinary,
      hoursOvertime: overtime,
      ratePerHour: rate ?? null,
      allowancesTotal: shiftAllowance,
      onCostsTotal: onCosts,
      subtotal: subtotal + onCosts,
      missingRate,
      clinicId: shift.clinicId,
    });

    ordinaryTotal += ordinaryCost;
    overtimeTotal += overtimeCost;
    allowancesTotal += shiftAllowance;
    onCostsTotal += onCosts;
  }

  const forecast: CostForecast = {
    id: store.newCostForecastId(),
    rosterPeriodId: period.id,
    clinicId: period.clinicId,
    organisationId: input.organisationId ?? period.organisationId,
    asOf,
    planningOnly: true,
    currency: input.currency ?? DEFAULT_CURRENCY,
    ordinaryTotal,
    overtimeTotal,
    allowancesTotal,
    onCostsTotal,
    grandTotal: ordinaryTotal + overtimeTotal + allowancesTotal + onCostsTotal,
    lineItems,
    warnings,
    createdAt: new Date().toISOString(),
    createdBy: actor.userId,
    version: 1,
  };
  store.upsertCostForecast(forecast);
  appendRosterAudit({
    actorId: actor.userId,
    organisationId: forecast.organisationId,
    clinicId: forecast.clinicId,
    action: "cost-forecast.built",
    targetType: "cost-forecast",
    targetId: forecast.id,
    detail: { rosterPeriodId: forecast.rosterPeriodId, warnings: warnings.length },
  });
  return forecast;
}

/**
 * Return a cost forecast with rate/cost numbers masked when the actor lacks
 * `roster.cost.view`. Structure is preserved for UI wiring.
 */
export function maskForecastForActor(actor: M05Actor, forecast: CostForecast): CostForecast {
  if (hasM05Permission(actor, "roster.cost.view")) return forecast;
  return {
    ...forecast,
    ordinaryTotal: 0,
    overtimeTotal: 0,
    allowancesTotal: 0,
    onCostsTotal: 0,
    grandTotal: 0,
    lineItems: forecast.lineItems.map((li) => ({
      ...li,
      ratePerHour: null,
      allowancesTotal: null,
      onCostsTotal: null,
      subtotal: null,
    })),
    warnings: forecast.warnings,
  };
}

export function listCostForecastsForActor(actor: M05Actor, periodId?: string): CostForecast[] {
  assertM05Permission(actor, "roster.report");
  return store
    .listCostForecasts(periodId)
    .filter((f) => {
      if (actor.permissions.includes("*")) return true;
      if (actor.clinicIds === undefined) return true;
      if (!actor.clinicIds.length) return false;
      return actor.clinicIds.includes(f.clinicId);
    })
    .map((f) => maskForecastForActor(actor, f));
}
