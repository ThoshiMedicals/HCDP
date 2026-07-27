/**
 * Clinic timezone / DST resolution for M05.
 *
 * Bindings (§4 of the plan):
 * - Uses `resolveClinicTimezone` (Wave 3) — no silent UTC fallback.
 * - Returns explainable UnresolvedTimezoneResult on failure.
 * - Handles cross-midnight (`crossesLocalMidnight`).
 * - Handles DST fall-back (repeated local hour) via fold flag.
 * - Handles DST spring-forward gap by returning `dst-gap` unresolved.
 *
 * Local wall time is converted to a canonical UTC instant by using
 * `Intl.DateTimeFormat` to compute the timezone offset at candidate instants.
 * We probe both candidate instants around a wall time to detect gap/fold
 * scenarios without depending on Temporal.
 */

import { resolveClinicTimezone } from "@/platform/workforce/services/clinic-timezone";
import type {
  FoldFlag,
  ResolvedShiftWindow,
  ShiftTimezoneResult,
  UnresolvedTimezoneResult,
} from "../types/timezone";

const LOCAL_YMD_HM_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

function unresolved(
  reason: UnresolvedTimezoneResult["reason"],
  message: string,
  extra: Partial<UnresolvedTimezoneResult> = {}
): UnresolvedTimezoneResult {
  return { ok: false, reason, message, ...extra };
}

function parseLocal(input: string): { y: number; m: number; d: number; h: number; mi: number } | null {
  const match = LOCAL_YMD_HM_RE.exec(input);
  if (!match) return null;
  const [, y, m, d, h, mi] = match;
  return {
    y: Number(y),
    m: Number(m),
    d: Number(d),
    h: Number(h),
    mi: Number(mi),
  };
}

/**
 * Compute the timezone offset (minutes) applied for a specific UTC instant
 * in a given IANA timezone. Positive = east of UTC (e.g. AEST = +600).
 */
function offsetMinutesForInstant(instant: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = dtf.formatToParts(instant);
  const lookup: Record<string, string> = {};
  for (const p of parts) if (p.type !== "literal") lookup[p.type] = p.value;
  const hh = lookup.hour === "24" ? "00" : lookup.hour!;
  const localMs = Date.UTC(
    Number(lookup.year),
    Number(lookup.month) - 1,
    Number(lookup.day),
    Number(hh),
    Number(lookup.minute),
    Number(lookup.second)
  );
  return Math.round((localMs - instant.getTime()) / 60_000);
}

/**
 * Convert a local wall time in `timeZone` to a UTC ISO instant.
 * Returns null with a reason if the wall time is inside a DST gap.
 * `fold` chooses earlier (0) or later (1) instant when the wall time is repeated.
 */
function localWallTimeToUtc(
  local: { y: number; m: number; d: number; h: number; mi: number },
  timeZone: string,
  fold: FoldFlag
): { utc: Date; offsetMinutes: number } | { gap: true } {
  const guessUtc = Date.UTC(local.y, local.m - 1, local.d, local.h, local.mi, 0);

  // Primary probe: offset at the guess treated as UTC.
  const offA = offsetMinutesForInstant(new Date(guessUtc), timeZone);
  const candA = new Date(guessUtc - offA * 60_000);
  const offACheck = offsetMinutesForInstant(candA, timeZone);
  const validA = offACheck === offA;

  // Fall-back / spring-forward can straddle a wide UTC gap depending on the
  // clinic's UTC offset. Probe both an hour BEFORE and an hour AFTER the
  // primary candidate to reliably discover an alternate valid offset for
  // repeated local hours regardless of the sign of the UTC offset.
  const findAlternate = (deltaMs: number): { utc: Date; offsetMinutes: number } | null => {
    const probe = candA.getTime() + deltaMs;
    const probeOff = offsetMinutesForInstant(new Date(probe), timeZone);
    if (probeOff === offACheck) return null;
    const altCandidate = new Date(guessUtc - probeOff * 60_000);
    const altCheck = offsetMinutesForInstant(altCandidate, timeZone);
    if (altCheck !== probeOff) return null;
    if (altCandidate.getTime() === candA.getTime()) return null;
    return { utc: altCandidate, offsetMinutes: altCheck };
  };
  const altBefore = findAlternate(-60 * 60_000);
  const altAfter = findAlternate(60 * 60_000);
  const altCandidate = altBefore ?? altAfter;

  if (!validA && !altCandidate) {
    return { gap: true };
  }
  if (validA && altCandidate) {
    const primary = { utc: candA, offsetMinutes: offACheck };
    const [earlier, later] =
      primary.utc.getTime() <= altCandidate.utc.getTime()
        ? [primary, altCandidate]
        : [altCandidate, primary];
    return fold === 1 ? later : earlier;
  }
  if (validA) return { utc: candA, offsetMinutes: offACheck };
  return altCandidate!;
}

/**
 * Resolve a clinic-local shift window to canonical UTC + fold metadata.
 * On any failure returns UnresolvedTimezoneResult (no silent UTC).
 *
 * @param localStartYmd `YYYY-MM-DD`
 * @param localStartHm  `HH:mm`
 * @param localEndYmd   `YYYY-MM-DD`
 * @param localEndHm    `HH:mm`
 * @param fold          Optional fold override for repeated local hour (start & end).
 */
export function resolveLocalShiftWindow(
  clinicId: string | undefined | null,
  localStartYmd: string,
  localStartHm: string,
  localEndYmd: string,
  localEndHm: string,
  fold?: { start?: FoldFlag; end?: FoldFlag }
): ShiftTimezoneResult {
  if (!clinicId || !clinicId.trim()) {
    return unresolved(
      "clinic-missing",
      "Clinic id missing — cannot resolve IANA timezone for shift window."
    );
  }
  const tz = resolveClinicTimezone(clinicId);
  if (!tz.ok) {
    return unresolved("clinic-timezone-unresolved", tz.reason, { clinicId });
  }

  const localStart = `${localStartYmd}T${localStartHm}`;
  const localEnd = `${localEndYmd}T${localEndHm}`;
  const s = parseLocal(localStart);
  const e = parseLocal(localEnd);
  if (!s || !e) {
    return unresolved("invalid-local-time", `Invalid local time value(s): ${localStart} / ${localEnd}`, {
      clinicId,
      timeZoneId: tz.timeZone,
      localStart,
      localEnd,
    });
  }

  const startResolution = localWallTimeToUtc(s, tz.timeZone, fold?.start ?? 0);
  if ("gap" in startResolution) {
    return unresolved(
      "dst-gap",
      `Local start time ${localStart} does not exist in ${tz.timeZone} (DST spring-forward gap).`,
      { clinicId, timeZoneId: tz.timeZone, localStart, localEnd }
    );
  }
  const endResolution = localWallTimeToUtc(e, tz.timeZone, fold?.end ?? 0);
  if ("gap" in endResolution) {
    return unresolved(
      "dst-gap",
      `Local end time ${localEnd} does not exist in ${tz.timeZone} (DST spring-forward gap).`,
      { clinicId, timeZoneId: tz.timeZone, localStart, localEnd }
    );
  }
  if (endResolution.utc.getTime() <= startResolution.utc.getTime()) {
    return unresolved(
      "end-before-start",
      `Local end ${localEnd} does not fall after local start ${localStart} in ${tz.timeZone}.`,
      { clinicId, timeZoneId: tz.timeZone, localStart, localEnd }
    );
  }

  const window: ResolvedShiftWindow = {
    clinicId,
    timeZoneId: tz.timeZone,
    localStart,
    localEnd,
    utcStart: startResolution.utc.toISOString(),
    utcEnd: endResolution.utc.toISOString(),
    startOffsetMinutes: startResolution.offsetMinutes,
    endOffsetMinutes: endResolution.offsetMinutes,
    startFold: fold?.start ?? 0,
    endFold: fold?.end ?? 0,
    crossesLocalMidnight: localStartYmd !== localEndYmd,
  };
  return { ok: true, window };
}

/** Test helper — resolve just the offset for a wall time (used by TZ-05/TZ-06 style tests). */
export function testOnlyResolveOffsetForWallTime(
  clinicId: string,
  ymd: string,
  hm: string,
  fold: FoldFlag = 0
): { ok: true; offsetMinutes: number; timeZoneId: string } | UnresolvedTimezoneResult {
  const tz = resolveClinicTimezone(clinicId);
  if (!tz.ok) return unresolved("clinic-timezone-unresolved", tz.reason, { clinicId });
  const parsed = parseLocal(`${ymd}T${hm}`);
  if (!parsed) return unresolved("invalid-local-time", `Invalid ${ymd}T${hm}`, { clinicId });
  const resolution = localWallTimeToUtc(parsed, tz.timeZone, fold);
  if ("gap" in resolution) {
    return unresolved("dst-gap", `Wall time ${ymd}T${hm} is inside DST gap in ${tz.timeZone}.`, {
      clinicId,
      timeZoneId: tz.timeZone,
    });
  }
  return { ok: true, offsetMinutes: resolution.offsetMinutes, timeZoneId: tz.timeZone };
}
