/**
 * Informational M05 roster vs M06 worked-time variance (Batch 4 CP 4.3 / OD-4).
 * Never blocks calculation; never writes M05/M06; no monetary variance.
 */

import {
  assertM07ClinicScope,
  assertM07LegalEntityScope,
  assertM07Permission,
  type M07Actor,
} from "../permissions";
import { getPeriod, listProfiles } from "../repository/local-store";
import {
  listPublishedAssignmentsForPerson,
  getPublishedShift,
} from "../adapters/m05-roster-read";
import {
  listPublishedTimesheetSnapshots,
} from "../repository/published-timesheet-snapshots";
import { getSnapshotEligibilityBySnapshotId } from "../repository/published-timesheet-lifecycle";
import {
  M07_NON_CERTIFIED_DISCLAIMER,
  type VariancePersonView,
} from "../types/domain";
import { isDoctorPayExcluded } from "./classification-resolve";

function hoursBetween(start?: string, end?: string): number | null {
  if (!start || !end) return null;
  const a = Date.parse(start);
  const b = Date.parse(end);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return null;
  return (b - a) / 3600000;
}

function pickEligibleSnapshot(input: {
  organisationId: string;
  legalEntityId: string;
  personId: string;
  periodStart: string;
  periodEnd: string;
}) {
  const candidates = listPublishedTimesheetSnapshots({
    organisationId: input.organisationId,
    legalEntityId: input.legalEntityId,
  }).filter(
    (s) =>
      s.workforcePersonId === input.personId &&
      s.periodStart <= input.periodEnd &&
      s.periodEnd >= input.periodStart
  );
  const eligible = candidates.filter((s) => {
    const el = getSnapshotEligibilityBySnapshotId({
      organisationId: s.organisationId,
      legalEntityId: s.legalEntityId,
      snapshotId: s.id,
    });
    return el?.eligibility === "eligible";
  });
  eligible.sort((a, b) => b.sourceVersion - a.sourceVersion);
  return eligible[0] ?? null;
}

function sumSnapshotHours(
  snap: { ordinaryHourInputs?: Array<{ hours: number }>; overtimeHourInputs?: Array<{ hours: number }> },
  kind: "ordinary" | "overtime"
): number {
  const rows = kind === "ordinary" ? snap.ordinaryHourInputs : snap.overtimeHourInputs;
  return (rows ?? []).reduce((acc, r) => acc + (Number(r.hours) || 0), 0);
}

/**
 * Build informational variance rows for a period.
 * Misaligned scope → unavailable/incomplete — never a fabricated numeric delta.
 */
export function buildVarianceViews(
  actor: M07Actor,
  input: { legalEntityId: string; periodId: string; personId?: string }
): VariancePersonView[] {
  assertM07Permission(actor, "payroll.view");
  assertM07LegalEntityScope(actor, input.legalEntityId);

  const period = getPeriod(input.periodId);
  if (!period || period.legalEntityId !== input.legalEntityId) return [];

  const profiles = listProfiles(input.legalEntityId)
    .filter((p) => p.status === "active")
    .filter((p) => (input.personId ? p.personId === input.personId : true));

  const views: VariancePersonView[] = [];

  for (const profile of profiles) {
    try {
      assertM07ClinicScope(actor, [profile.clinicId, ...(period.clinicIds ?? [])]);
    } catch {
      continue;
    }

    if (isDoctorPayExcluded(profile.personId)) {
      views.push({
        personId: profile.personId,
        legalEntityId: input.legalEntityId,
        clinicId: profile.clinicId,
        periodId: period.id,
        status: "excluded",
        message: "Doctor / M08 excluded from staff-pay variance",
        rosterOrdinaryHours: null,
        rosterOvertimeHours: null,
        workedOrdinaryHours: null,
        workedOvertimeHours: null,
        ordinaryDelta: null,
        overtimeDelta: null,
        disclaimer: M07_NON_CERTIFIED_DISCLAIMER,
        informationalOnly: true,
      });
      continue;
    }

    const snap = pickEligibleSnapshot({
      organisationId: input.legalEntityId,
      legalEntityId: input.legalEntityId,
      personId: profile.personId,
      periodStart: period.periodStart,
      periodEnd: period.periodEnd,
    });

    const assignments = listPublishedAssignmentsForPerson(profile.personId).filter((a) => {
      if (a.clinicId && profile.clinicId && a.clinicId !== profile.clinicId) return false;
      const shift = getPublishedShift(a.shiftId);
      if (!shift?.localStart || !shift.localEnd) return false;
      const day = shift.localStart.slice(0, 10);
      return day >= period.periodStart && day <= period.periodEnd;
    });

    let rosterOrdinary: number | null = 0;
    let rosterIncomplete = false;
    for (const a of assignments) {
      const shift = getPublishedShift(a.shiftId);
      const hrs = hoursBetween(shift?.localStart, shift?.localEnd);
      if (hrs == null) {
        rosterIncomplete = true;
        continue;
      }
      rosterOrdinary += hrs;
    }
    if (!assignments.length) rosterOrdinary = null;

    if (!snap) {
      views.push({
        personId: profile.personId,
        legalEntityId: input.legalEntityId,
        clinicId: profile.clinicId,
        periodId: period.id,
        status: "unavailable",
        message: "No eligible M06 worked-time snapshot for aligned comparison",
        rosterOrdinaryHours: rosterIncomplete ? null : rosterOrdinary,
        rosterOvertimeHours: null,
        workedOrdinaryHours: null,
        workedOvertimeHours: null,
        ordinaryDelta: null,
        overtimeDelta: null,
        disclaimer: M07_NON_CERTIFIED_DISCLAIMER,
        informationalOnly: true,
      });
      continue;
    }

    if (snap.legalEntityId !== input.legalEntityId || snap.organisationId !== input.legalEntityId) {
      views.push({
        personId: profile.personId,
        legalEntityId: input.legalEntityId,
        clinicId: profile.clinicId,
        periodId: period.id,
        status: "unavailable",
        message: "Snapshot organisation/legal-entity cannot be safely aligned",
        rosterOrdinaryHours: null,
        rosterOvertimeHours: null,
        workedOrdinaryHours: null,
        workedOvertimeHours: null,
        ordinaryDelta: null,
        overtimeDelta: null,
        disclaimer: M07_NON_CERTIFIED_DISCLAIMER,
        informationalOnly: true,
      });
      continue;
    }

    if (snap.clinicId && profile.clinicId && snap.clinicId !== profile.clinicId) {
      views.push({
        personId: profile.personId,
        legalEntityId: input.legalEntityId,
        clinicId: profile.clinicId,
        periodId: period.id,
        status: "incomplete",
        message: "Clinic dimensions do not align for numeric variance",
        rosterOrdinaryHours: null,
        rosterOvertimeHours: null,
        workedOrdinaryHours: null,
        workedOvertimeHours: null,
        ordinaryDelta: null,
        overtimeDelta: null,
        disclaimer: M07_NON_CERTIFIED_DISCLAIMER,
        informationalOnly: true,
      });
      continue;
    }

    const workedOrd = sumSnapshotHours(snap, "ordinary");
    const workedOt = sumSnapshotHours(snap, "overtime");
    // M05 published shifts do not carry OT category — roster OT unavailable
    const rosterOt: number | null = null;

    if (rosterOrdinary == null || rosterIncomplete) {
      views.push({
        personId: profile.personId,
        legalEntityId: input.legalEntityId,
        clinicId: profile.clinicId,
        periodId: period.id,
        status: "incomplete",
        message: "Roster hours incomplete — numeric variance withheld",
        rosterOrdinaryHours: null,
        rosterOvertimeHours: rosterOt,
        workedOrdinaryHours: workedOrd,
        workedOvertimeHours: workedOt,
        ordinaryDelta: null,
        overtimeDelta: null,
        disclaimer: M07_NON_CERTIFIED_DISCLAIMER,
        informationalOnly: true,
      });
      continue;
    }

    views.push({
      personId: profile.personId,
      legalEntityId: input.legalEntityId,
      clinicId: profile.clinicId,
      periodId: period.id,
      status: "compared",
      message: "Informational only — does not block calculation",
      rosterOrdinaryHours: rosterOrdinary,
      rosterOvertimeHours: rosterOt,
      workedOrdinaryHours: workedOrd,
      workedOvertimeHours: workedOt,
      ordinaryDelta: workedOrd - rosterOrdinary,
      overtimeDelta: rosterOt == null ? null : workedOt - rosterOt,
      disclaimer: M07_NON_CERTIFIED_DISCLAIMER,
      informationalOnly: true,
    });
  }

  return views;
}
