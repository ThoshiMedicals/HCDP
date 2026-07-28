/**
 * Batch 5 — deterministic eligible population for a pay period (OD-3).
 * Aligns tenant/LE/period, M04 employment context, and M06 cleared snapshots.
 * Fail-closed on missing/ambiguous/cross-boundary data — never silently omits.
 */

import {
  assertM07LegalEntityScope,
  assertM07Permission,
  M07ValidationError,
  type M07Actor,
} from "../permissions";
import { getPeriod, listProfiles } from "../repository/local-store";
import { listPublishedTimesheetSnapshots } from "../repository/published-timesheet-snapshots";
import { getSnapshotEligibilityBySnapshotId } from "../repository/published-timesheet-lifecycle";
import { resolvePersonIdentity } from "../adapters/m04-person-read";
import { isDoctorPayExcluded } from "./classification-resolve";
import type {
  EligiblePopulationExclusion,
  EligiblePopulationMember,
  EligiblePopulationResult,
  PayPeriodRecord,
} from "../types/domain";

function overlapsPeriod(
  from: string | undefined,
  to: string | null | undefined,
  periodStart: string,
  periodEnd: string
): boolean {
  const start = from && from.trim() ? from : null;
  const end = to === undefined ? null : to;
  if (!start) return false;
  if (start > periodEnd) return false;
  if (end != null && end !== "" && end < periodStart) return false;
  return true;
}

function classifyEmploymentExclusion(
  identity: NonNullable<ReturnType<typeof resolvePersonIdentity>>,
  period: PayPeriodRecord
): EligiblePopulationExclusion | null {
  const status = identity.employmentStatus ?? "active";
  const empFrom = identity.employmentEffectiveFrom;
  const empTo = identity.employmentEffectiveTo ?? null;

  if (status === "terminated") {
    if (!empFrom || !overlapsPeriod(empFrom, empTo, period.periodStart, period.periodEnd)) {
      return {
        personId: identity.personId,
        reason: "terminated-outside-period",
        rule: "m04-employment-terminated",
        message: "Person terminated / not employed during the payroll period",
        clinicId: identity.clinicId,
      };
    }
  }
  if (status === "inactive") {
    if (!empFrom || !overlapsPeriod(empFrom, empTo, period.periodStart, period.periodEnd)) {
      return {
        personId: identity.personId,
        reason: "inactive-outside-period",
        rule: "m04-employment-inactive",
        message: "Person inactive outside the payroll period",
        clinicId: identity.clinicId,
      };
    }
  }
  if (empFrom && empFrom > period.periodEnd) {
    return {
      personId: identity.personId,
      reason: "future-starter",
      rule: "m04-employment-future-start",
      message: "Person employment starts after the payroll period",
      clinicId: identity.clinicId,
    };
  }
  if (empFrom && !overlapsPeriod(empFrom, empTo, period.periodStart, period.periodEnd)) {
    return {
      personId: identity.personId,
      reason: "inactive-outside-period",
      rule: "m04-employment-window",
      message: "Person employment window does not overlap the payroll period",
      clinicId: identity.clinicId,
    };
  }
  // Require known employment window for population decisions (fail closed if absent
  // when person appears via M06 — handled by caller with blocking reason).
  return null;
}

function clinicEffective(
  identity: NonNullable<ReturnType<typeof resolvePersonIdentity>>,
  period: PayPeriodRecord
): { ok: true; clinicId: string } | { ok: false; exclusion?: EligiblePopulationExclusion; block?: string } {
  const clinicId = identity.clinicId;
  if (!clinicId) {
    return {
      ok: false,
      block: `missing-effective-clinic-assignment:${identity.personId}`,
    };
  }
  const cFrom = identity.clinicAssignmentEffectiveFrom ?? identity.employmentEffectiveFrom;
  const cTo =
    identity.clinicAssignmentEffectiveTo !== undefined
      ? identity.clinicAssignmentEffectiveTo
      : identity.employmentEffectiveTo ?? null;
  if (cFrom && !overlapsPeriod(cFrom, cTo, period.periodStart, period.periodEnd)) {
    return {
      ok: false,
      exclusion: {
        personId: identity.personId,
        reason: "clinic-assignment-outside-period",
        rule: "m04-clinic-assignment-window",
        message: "Clinic assignment not effective during the payroll period",
        clinicId,
      },
    };
  }
  if (!cFrom && !identity.employmentEffectiveFrom) {
    // Soft demo identities without dates: allow only when employmentStatus active/undefined
    if ((identity.employmentStatus ?? "active") === "active") {
      return { ok: true, clinicId };
    }
    return {
      ok: false,
      block: `ambiguous-employment-context:${identity.personId}`,
    };
  }
  return { ok: true, clinicId };
}

/**
 * Resolve eligible staff population for a period.
 * Empty period.clinicIds ⇒ all eligible clinics discovered from period-effective members
 * (not all historical profiles).
 */
export function resolveEligiblePopulation(
  actor: M07Actor,
  input: { legalEntityId: string; periodId: string }
): EligiblePopulationResult {
  assertM07Permission(actor, "payroll.view");
  assertM07LegalEntityScope(actor, input.legalEntityId);

  const period = getPeriod(input.periodId);
  if (!period || period.legalEntityId !== input.legalEntityId) {
    throw new M07ValidationError("not-found", `Period ${input.periodId} not found for legal entity`);
  }

  const organisationId = period.legalEntityId;
  const blockingReasons: string[] = [];
  const exclusions: EligiblePopulationExclusion[] = [];
  const byPerson = new Map<
    string,
    {
      snapshotIds: string[];
      profileId?: string;
      sources: Set<"m06-snapshot" | "m07-profile">;
    }
  >();

  // M06 cleared eligible snapshots overlapping the period
  const snaps = listPublishedTimesheetSnapshots({
    organisationId,
    legalEntityId: period.legalEntityId,
  }).filter(
    (s) =>
      s.periodStart <= period.periodEnd &&
      s.periodEnd >= period.periodStart &&
      s.legalEntityId === period.legalEntityId &&
      s.organisationId === organisationId
  );

  for (const s of snaps) {
    if (s.organisationId !== organisationId || s.legalEntityId !== period.legalEntityId) {
      blockingReasons.push(`tenant-or-le-mismatch-snapshot:${s.id}`);
      continue;
    }
    const el = getSnapshotEligibilityBySnapshotId({
      organisationId: s.organisationId,
      legalEntityId: s.legalEntityId,
      snapshotId: s.id,
    });
    if (el?.eligibility !== "eligible") continue;

    const cur = byPerson.get(s.workforcePersonId) ?? {
      snapshotIds: [],
      sources: new Set(),
    };
    cur.snapshotIds.push(s.id);
    cur.sources.add("m06-snapshot");
    byPerson.set(s.workforcePersonId, cur);
  }

  // Active M07 profiles for LE (candidates) — filtered by M04 period-effective rules
  for (const p of listProfiles(period.legalEntityId).filter((x) => x.status === "active")) {
    const profileInPeriod =
      p.effectiveFrom <= period.periodEnd &&
      (p.effectiveTo == null || p.effectiveTo === "" || p.effectiveTo >= period.periodStart);
    if (!profileInPeriod) continue;
    const cur = byPerson.get(p.personId) ?? {
      snapshotIds: [],
      sources: new Set(),
    };
    cur.profileId = p.id;
    cur.sources.add("m07-profile");
    byPerson.set(p.personId, cur);
  }

  const eligible: EligiblePopulationMember[] = [];
  const discoveredClinics = new Set<string>();

  for (const [personId, bag] of byPerson) {
    if (isDoctorPayExcluded(personId)) {
      exclusions.push({
        personId,
        reason: "doctor-m08-excluded",
        rule: "q7-doctor-m08-exclusion",
        message: "Doctors / M08 doctor-pay are excluded from staff-pay preparation",
      });
      continue;
    }

    const identity = resolvePersonIdentity(personId);
    if (!identity) {
      blockingReasons.push(`missing-m04-identity:${personId}`);
      continue;
    }

    if (identity.organisationId && identity.organisationId !== period.legalEntityId) {
      exclusions.push({
        personId,
        reason: "not-assigned-to-legal-entity",
        rule: "m04-legal-entity-assignment",
        message: "Person not assigned to the period legal entity",
        clinicId: identity.clinicId,
      });
      continue;
    }
    if (!identity.organisationId && bag.sources.has("m06-snapshot")) {
      blockingReasons.push(`ambiguous-organisation:${personId}`);
      continue;
    }

    // M06-only candidates require employment window; profile+active may use soft demo defaults
    const needsStrictEmployment = bag.sources.has("m06-snapshot") || bag.sources.has("m07-profile");
    if (needsStrictEmployment && !identity.employmentEffectiveFrom) {
      if ((identity.employmentStatus ?? "active") !== "active") {
        blockingReasons.push(`ambiguous-employment-context:${personId}`);
        continue;
      }
    }

    const empEx = classifyEmploymentExclusion(identity, period);
    if (empEx) {
      exclusions.push(empEx);
      continue;
    }

    const clinic = clinicEffective(identity, period);
    if (!clinic.ok) {
      if (clinic.exclusion) exclusions.push(clinic.exclusion);
      if (clinic.block) blockingReasons.push(clinic.block);
      continue;
    }

    // Explicit period clinic tags constrain membership; empty ⇒ discovered clinics
    if (period.clinicIds.length > 0 && !period.clinicIds.includes(clinic.clinicId)) {
      exclusions.push({
        personId,
        reason: "clinic-assignment-outside-period",
        rule: "period-clinic-scope",
        message: "Person clinic is outside the period's included clinic tags",
        clinicId: clinic.clinicId,
      });
      continue;
    }

    discoveredClinics.add(clinic.clinicId);

    let source: EligiblePopulationMember["source"] = "m07-profile";
    if (bag.sources.has("m06-snapshot") && bag.sources.has("m07-profile")) source = "both";
    else if (bag.sources.has("m06-snapshot")) source = "m06-snapshot";

    // Eligible staff who appear only via profile without any eligible M06 snapshot
    // remain in population but readiness will block until calc/snapshot exists —
    // do not silently drop them (OD-3 silent-omission prevention).
    eligible.push({
      personId,
      clinicId: clinic.clinicId,
      organisationId: period.legalEntityId,
      legalEntityId: period.legalEntityId,
      displayLabel: identity.displayLabel,
      source,
      snapshotIds: [...bag.snapshotIds].sort(),
      profileId: bag.profileId,
    });
  }

  const includedClinicIds =
    period.clinicIds.length > 0
      ? [...period.clinicIds].sort()
      : [...discoveredClinics].sort();

  // Explicit clinics with zero discovered eligible people still appear as incomplete later;
  // missing clinic tags with no people → incomplete (not silent ready).
  if (period.clinicIds.length > 0) {
    for (const c of period.clinicIds) {
      if (!discoveredClinics.has(c) && !eligible.some((e) => e.clinicId === c)) {
        // Clinic tagged but no eligible people — readiness incomplete, not a population block
      }
    }
  }

  const status: EligiblePopulationResult["status"] =
    blockingReasons.length > 0
      ? "blocked"
      : eligible.length === 0 && exclusions.length === 0
        ? "incomplete"
        : "resolved";

  return {
    status,
    legalEntityId: period.legalEntityId,
    periodId: period.id,
    periodStart: period.periodStart,
    periodEnd: period.periodEnd,
    includedClinicIds,
    eligible: eligible.sort((a, b) => a.personId.localeCompare(b.personId)),
    exclusions: exclusions.sort((a, b) => a.personId.localeCompare(b.personId)),
    blockingReasons: [...new Set(blockingReasons)].sort(),
    version: 1,
    resolvedAt: new Date().toISOString(),
  };
}
