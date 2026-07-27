import {
  WORKFORCE_CONTRACT_VERSION,
  type WorkforceRefBase,
} from "./common";

/**
 * Roster shift reference — owned by M05.
 *
 * Wave 4 (M05) additive fields:
 * - `timeZoneId` / `localStart` / `localEnd` / `startOffsetMinutes` /
 *   `endOffsetMinutes` / `startFold` / `endFold` are OPTIONAL and preserve
 *   clinic-local intent alongside the canonical UTC instants in `startsAt` / `endsAt`.
 * - Existing consumers relying only on `startsAt` / `endsAt` continue to work
 *   unchanged.
 */
export interface ShiftRef extends WorkforceRefBase {
  owningModuleId: "roster";
  rosterPeriodId: string;
  personId?: string;
  startsAt: string;
  endsAt: string;
  roleLabel?: string;
  published: boolean;
  /** IANA timezone id resolved at write time (clinic authoritative TZ). */
  timeZoneId?: string;
  /** Clinic-local civil datetime intent, e.g. "2026-08-01T22:00". */
  localStart?: string;
  localEnd?: string;
  /** UTC offset applied at the local start/end, in minutes. */
  startOffsetMinutes?: number;
  endOffsetMinutes?: number;
  /** DST disambiguation for repeated local hours (fall-back): 0 = earlier, 1 = later. */
  startFold?: 0 | 1;
  endFold?: 0 | 1;
}

export function createShiftRef(
  input: Omit<ShiftRef, "contractVersion" | "owningModuleId" | "route" | "displayLabel"> & {
    route?: string;
    displayLabel?: string;
    section?: string;
  }
): ShiftRef {
  return {
    contractVersion: WORKFORCE_CONTRACT_VERSION,
    owningModuleId: "roster",
    recordId: input.recordId,
    clinicId: input.clinicId,
    organisationId: input.organisationId,
    status: input.status,
    route: input.route ?? "/roster",
    section: input.section ?? "roster-grid",
    displayLabel:
      input.displayLabel ??
      `Shift ${input.recordId}${input.personId ? ` — ${input.personId}` : ""}`,
    rosterPeriodId: input.rosterPeriodId,
    personId: input.personId,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    roleLabel: input.roleLabel,
    published: input.published,
    timeZoneId: input.timeZoneId,
    localStart: input.localStart,
    localEnd: input.localEnd,
    startOffsetMinutes: input.startOffsetMinutes,
    endOffsetMinutes: input.endOffsetMinutes,
    startFold: input.startFold,
    endFold: input.endFold,
  };
}
