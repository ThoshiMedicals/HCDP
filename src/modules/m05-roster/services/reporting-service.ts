/**
 * M05 reporting / scoped export service.
 *
 * Clinic scope is enforced at the service layer — UI filtering is not the
 * security boundary. Sensitive rate / cost data must be masked via
 * `maskForecastForActor` before export unless the actor holds
 * `roster.cost.view`.
 */

import {
  assertM05Permission,
  isInActorClinicScope,
  hasM05Permission,
  type M05Actor,
} from "../permissions";
import type {
  Assignment,
  CostForecast,
  RosterPeriod,
  RosterPublication,
  Shift,
} from "../types/domain";
import * as store from "../repository/local-store";
import { appendRosterAudit } from "./audit-helpers";
import { maskForecastForActor } from "./cost-forecast-service";

export interface ReportScope {
  organisationId?: string;
  clinicIds?: string[];
  fromDate?: string;
  toDate?: string;
  limit?: number;
}

function inScope(actor: M05Actor, clinicId: string, scope?: ReportScope): boolean {
  if (!isInActorClinicScope(actor, clinicId)) return false;
  if (!scope?.clinicIds?.length) return true;
  return scope.clinicIds.includes(clinicId);
}

export interface ScopedRosterReport {
  generatedAt: string;
  scope: ReportScope;
  periods: RosterPeriod[];
  shifts: Shift[];
  assignments: Assignment[];
  publications: RosterPublication[];
  costForecasts: CostForecast[];
  truncated: boolean;
}

export function buildScopedReport(actor: M05Actor, scope: ReportScope = {}): ScopedRosterReport {
  assertM05Permission(actor, "roster.report");
  const now = new Date().toISOString();
  const limit = scope.limit ?? 5000;

  const periods = store
    .listPeriods()
    .filter((p) =>
      inScope(actor, p.clinicId, scope) &&
      (!scope.organisationId || p.organisationId === scope.organisationId) &&
      (!scope.fromDate || p.endsOn >= scope.fromDate) &&
      (!scope.toDate || p.startsOn <= scope.toDate)
    );
  const periodIds = new Set(periods.map((p) => p.id));

  const shifts = store
    .listShifts()
    .filter((s) => periodIds.has(s.rosterPeriodId) && inScope(actor, s.clinicId, scope));

  const assignments = store
    .listAssignments()
    .filter((a) => periodIds.has(a.rosterPeriodId) && inScope(actor, a.clinicId, scope));

  const publications = store
    .listPublications()
    .filter((p) => periodIds.has(p.rosterPeriodId) && inScope(actor, p.clinicId, scope));

  const costForecasts = store
    .listCostForecasts()
    .filter((f) => periodIds.has(f.rosterPeriodId) && inScope(actor, f.clinicId, scope))
    .map((f) => maskForecastForActor(actor, f));

  const total = shifts.length + assignments.length + publications.length + costForecasts.length;
  const truncated = total > limit;

  appendRosterAudit({
    actorId: actor.userId,
    organisationId: scope.organisationId,
    clinicId: undefined,
    action: "report.built",
    targetType: "system",
    targetId: "report",
    detail: {
      totals: {
        periods: periods.length,
        shifts: shifts.length,
        assignments: assignments.length,
        publications: publications.length,
        costForecasts: costForecasts.length,
      },
      truncated,
    },
  });

  return {
    generatedAt: now,
    scope,
    periods,
    shifts: truncated ? shifts.slice(0, limit) : shifts,
    assignments: truncated ? assignments.slice(0, limit) : assignments,
    publications: truncated ? publications.slice(0, limit) : publications,
    costForecasts: truncated ? costForecasts.slice(0, limit) : costForecasts,
    truncated,
  };
}

export interface CsvExportOptions {
  scope?: ReportScope;
  includeCosts?: boolean;
}

/**
 * Export shift assignments as CSV. Cost / rate fields require `roster.cost.view`.
 * Rows are limited to clinics in the actor's scope.
 */
export function exportShiftAssignmentsCsv(
  actor: M05Actor,
  options: CsvExportOptions = {}
): string {
  assertM05Permission(actor, "roster.export");
  const canSeeCosts = hasM05Permission(actor, "roster.cost.view");
  const scope = options.scope ?? {};
  const report = buildScopedReport(actor, scope);

  const header = [
    "period_id",
    "clinic_id",
    "shift_id",
    "role",
    "local_start",
    "local_end",
    "utc_start",
    "utc_end",
    "person_id",
    "assignment_state",
    "publication_id",
    canSeeCosts && options.includeCosts ? "hours" : null,
  ]
    .filter((h): h is string => h != null)
    .join(",");

  const lines: string[] = [header];
  for (const shift of report.shifts) {
    const asg = shift.currentAssignmentId
      ? report.assignments.find((a) => a.id === shift.currentAssignmentId)
      : undefined;
    const hours = ((new Date(shift.utcEnd).getTime() - new Date(shift.utcStart).getTime()) / 3_600_000).toFixed(2);
    const row = [
      shift.rosterPeriodId,
      shift.clinicId,
      shift.id,
      shift.roleLabel ?? "",
      shift.localStart,
      shift.localEnd,
      shift.utcStart,
      shift.utcEnd,
      asg?.personId ?? "",
      asg?.state ?? shift.status,
      asg?.publicationId ?? "",
      canSeeCosts && options.includeCosts ? hours : null,
    ]
      .filter((v): v is string => v != null)
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",");
    lines.push(row);
  }

  appendRosterAudit({
    actorId: actor.userId,
    action: "report.exported",
    targetType: "system",
    targetId: "csv-export",
    detail: { rowCount: report.shifts.length, includeCosts: !!(canSeeCosts && options.includeCosts) },
  });
  return lines.join("\n");
}
