/**
 * Batch 5 — deterministic eligible population for a pay period (OD-3).
 * Aligns tenant/LE/period, M04 employment context, and M06 cleared snapshots.
 * Fail-closed on missing/ambiguous/cross-boundary data — never silently omits.
 *
 * Soft employment/clinic defaults apply ONLY when identity.demoDataMarker ===
 * M07_DEMO_PERSON_SEED_MARKER (explicit demo adapter/seed). Ordinary persisted
 * records without that marker never enter the soft-default path.
 */

import {
  M07_DEMO_PERSON_SEED_MARKER,
  resolvePersonIdentity,
} from "../adapters/m04-person-read";
import {
  assertM07LegalEntityScope,
  assertM07Permission,
  M07ValidationError,
  type M07Actor,
} from "../permissions";
import { getPeriod, listProfiles } from "../repository/local-store";
import { getSnapshotEligibilityBySnapshotId } from "../repository/published-timesheet-lifecycle";
import { listPublishedTimesheetSnapshots } from "../repository/published-timesheet-snapshots";
import type {
  EligiblePopulationBlocker,
  EligiblePopulationExclusion,
  EligiblePopulationMember,
  EligiblePopulationResult,
  PayPeriodRecord,
} from "../types/domain";
import { isDoctorPayExcluded } from "./classification-resolve";

function isDemoSeed(
  identity: NonNullable<ReturnType<typeof resolvePersonIdentity>>
): boolean {
  return identity.demoDataMarker === M07_DEMO_PERSON_SEED_MARKER;
}

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

function datesAmbiguous(from: string | undefined, to: string | null | undefined): boolean {
  if (!from || !from.trim()) return false;
  if (to == null || to === "") return false;
  return from > to;
}

function pushBlocker(
  blockers: EligiblePopulationBlocker[],
  blockingReasons: string[],
  b: EligiblePopulationBlocker
): void {
  blockers.push(b);
  blockingReasons.push(
    `population-blocker:${b.personId}:${b.field}:${b.legalEntityId}:${b.periodId}`
  );
}

function classifyEmploymentExclusion(
  identity: NonNullable<ReturnType<typeof resolvePersonIdentity>>,
  period: PayPeriodRecord
): EligiblePopulationExclusion | null {
  const status = identity.employmentStatus!;
  const empFrom = identity.employmentEffectiveFrom!;
  const empTo = identity.employmentEffectiveTo ?? null;

  if (status === "terminated") {
    if (!overlapsPeriod(empFrom, empTo, period.periodStart, period.periodEnd)) {
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
    if (!overlapsPeriod(empFrom, empTo, period.periodStart, period.periodEnd)) {
      return {
        personId: identity.personId,
        reason: "inactive-outside-period",
        rule: "m04-employment-inactive",
        message: "Person inactive outside the payroll period",
        clinicId: identity.clinicId,
      };
    }
  }
  if (empFrom > period.periodEnd) {
    return {
      personId: identity.personId,
      reason: "future-starter",
      rule: "m04-employment-future-start",
      message: "Person employment starts after the payroll period",
      clinicId: identity.clinicId,
    };
  }
  if (!overlapsPeriod(empFrom, empTo, period.periodStart, period.periodEnd)) {
    return {
      personId: identity.personId,
      reason: "inactive-outside-period",
      rule: "m04-employment-window",
      message: "Person employment window does not overlap the payroll period",
      clinicId: identity.clinicId,
    };
  }
  return null;
}

/**
 * Validate required employment/clinic context. Returns blockers (fail-closed) or null when OK.
 * Demo-seed marker alone may soft-fill missing fields for isolated tests — never for ordinary records.
 */
function assertEmploymentAndClinicContext(
  identity: NonNullable<ReturnType<typeof resolvePersonIdentity>>,
  period: PayPeriodRecord
):
  | { ok: true; clinicId: string; identity: NonNullable<ReturnType<typeof resolvePersonIdentity>> }
  | { ok: false; blockers: EligiblePopulationBlocker[]; exclusion?: EligiblePopulationExclusion } {
  const blockers: EligiblePopulationBlocker[] = [];
  const base = {
    personId: identity.personId,
    legalEntityId: period.legalEntityId,
    periodId: period.id,
    clinicId: identity.clinicId,
  };

  let working = { ...identity };

  if (isDemoSeed(identity)) {
    // Isolated demo soft-defaults — explicit marker only; documented boundary.
    if (!working.employmentStatus) working.employmentStatus = "active";
    if (!working.employmentEffectiveFrom) {
      working.employmentEffectiveFrom = "2000-01-01";
    }
    if (working.employmentEffectiveTo === undefined) {
      working.employmentEffectiveTo = null;
    }
    if (!working.clinicId && working.organisationId) {
      // Demo may still lack clinic — fail closed on clinic below
    }
    if (!working.clinicAssignmentEffectiveFrom && working.clinicId) {
      working.clinicAssignmentEffectiveFrom =
        working.employmentEffectiveFrom ?? "2000-01-01";
    }
    if (
      working.clinicAssignmentEffectiveTo === undefined &&
      working.clinicId
    ) {
      working.clinicAssignmentEffectiveTo = working.employmentEffectiveTo ?? null;
    }
  }

  if (!working.employmentStatus) {
    blockers.push({
      ...base,
      field: "employmentStatus",
      message:
        "Missing employment status — cannot assume active; submission/approval blocked until authoritative status is available",
    });
  }

  if (!working.employmentEffectiveFrom || !String(working.employmentEffectiveFrom).trim()) {
    blockers.push({
      ...base,
      field: "employmentEffectiveFrom",
      message:
        "Missing employment-effective start date — cannot assume unlimited employment window",
    });
  }

  if (datesAmbiguous(working.employmentEffectiveFrom, working.employmentEffectiveTo)) {
    blockers.push({
      ...base,
      field: "ambiguous-employment-dates",
      message: "Ambiguous employment dates (effectiveFrom after effectiveTo)",
    });
  }

  if (!working.clinicId) {
    blockers.push({
      ...base,
      field: "clinicId",
      message: "Missing period-effective clinic assignment",
    });
  }

  const cFrom =
    working.clinicAssignmentEffectiveFrom ??
    (isDemoSeed(identity) ? working.employmentEffectiveFrom : undefined);
  const cTo =
    working.clinicAssignmentEffectiveTo !== undefined
      ? working.clinicAssignmentEffectiveTo
      : isDemoSeed(identity)
        ? (working.employmentEffectiveTo ?? null)
        : undefined;

  if (working.clinicId && (!cFrom || !String(cFrom).trim())) {
    blockers.push({
      ...base,
      field: "clinicAssignmentEffectiveFrom",
      message: "Missing clinic-assignment effective start date",
    });
  }

  if (working.clinicId && datesAmbiguous(cFrom, cTo ?? null)) {
    blockers.push({
      ...base,
      field: "ambiguous-clinic-assignment",
      message: "Ambiguous clinic assignment dates",
    });
  }

  if (blockers.length > 0) {
    return { ok: false, blockers };
  }

  if (
    working.clinicId &&
    cFrom &&
    !overlapsPeriod(cFrom, cTo ?? null, period.periodStart, period.periodEnd)
  ) {
    return {
      ok: false,
      blockers: [],
      exclusion: {
        personId: identity.personId,
        reason: "clinic-assignment-outside-period",
        rule: "m04-clinic-assignment-window",
        message: "Clinic assignment not effective during the payroll period",
        clinicId: working.clinicId,
      },
    };
  }

  return { ok: true, clinicId: working.clinicId!, identity: working };
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
  const populationBlockers: EligiblePopulationBlocker[] = [];
  const exclusions: EligiblePopulationExclusion[] = [];
  const byPerson = new Map<
    string,
    {
      snapshotIds: string[];
      profileId?: string;
      sources: Set<"m06-snapshot" | "m07-profile">;
    }
  >();

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
    if (!identity.organisationId) {
      pushBlocker(populationBlockers, blockingReasons, {
        personId,
        field: "organisationId",
        message: "Missing or ambiguous legal-entity / organisation assignment",
        legalEntityId: period.legalEntityId,
        periodId: period.id,
        clinicId: identity.clinicId,
      });
      continue;
    }

    const ctx = assertEmploymentAndClinicContext(identity, period);
    if (!ctx.ok) {
      for (const b of ctx.blockers) {
        pushBlocker(populationBlockers, blockingReasons, b);
      }
      if (ctx.exclusion) exclusions.push(ctx.exclusion);
      continue;
    }

    const empEx = classifyEmploymentExclusion(ctx.identity, period);
    if (empEx) {
      exclusions.push(empEx);
      continue;
    }

    if (period.clinicIds.length > 0 && !period.clinicIds.includes(ctx.clinicId)) {
      exclusions.push({
        personId,
        reason: "clinic-assignment-outside-period",
        rule: "period-clinic-scope",
        message: "Person clinic is outside the period's included clinic tags",
        clinicId: ctx.clinicId,
      });
      continue;
    }

    discoveredClinics.add(ctx.clinicId);

    let source: EligiblePopulationMember["source"] = "m07-profile";
    if (bag.sources.has("m06-snapshot") && bag.sources.has("m07-profile")) source = "both";
    else if (bag.sources.has("m06-snapshot")) source = "m06-snapshot";

    eligible.push({
      personId,
      clinicId: ctx.clinicId,
      organisationId: period.legalEntityId,
      legalEntityId: period.legalEntityId,
      displayLabel: ctx.identity.displayLabel,
      source,
      snapshotIds: [...bag.snapshotIds].sort(),
      profileId: bag.profileId,
    });
  }

  const includedClinicIds =
    period.clinicIds.length > 0
      ? [...period.clinicIds].sort()
      : [...discoveredClinics].sort();

  const status: EligiblePopulationResult["status"] =
    populationBlockers.length > 0 || blockingReasons.length > 0
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
    populationBlockers: populationBlockers.sort((a, b) =>
      a.personId.localeCompare(b.personId)
    ),
    blockingReasons: [...new Set(blockingReasons)].sort(),
    version: 1,
    resolvedAt: new Date().toISOString(),
  };
}
