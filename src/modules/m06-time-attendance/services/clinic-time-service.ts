/**
 * Clinic timezone / DST resolution for M06.
 * Uses resolveClinicTimezone — no silent UTC fallback.
 */

import { resolveClinicTimezone } from "@/platform/workforce/services/clinic-timezone";
import type { FoldFlag, InstantTimezoneResult, UnresolvedInstantResult } from "../types/timezone";
import type { AttendanceTimeStamp } from "../types/domain";

const LOCAL_YMD_HM_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

function unresolved(
  reason: UnresolvedInstantResult["reason"],
  message: string,
  extra: Partial<UnresolvedInstantResult> = {}
): UnresolvedInstantResult {
  return { ok: false, reason, message, ...extra };
}

function parseLocal(input: string): { y: number; m: number; d: number; h: number; mi: number } | null {
  const match = LOCAL_YMD_HM_RE.exec(input);
  if (!match) return null;
  const [, y, m, d, h, mi] = match;
  return { y: Number(y), m: Number(m), d: Number(d), h: Number(h), mi: Number(mi) };
}

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

function localWallTimeToUtc(
  local: { y: number; m: number; d: number; h: number; mi: number },
  timeZone: string,
  fold: FoldFlag
): { utc: Date; offsetMinutes: number } | { gap: true } {
  const guessUtc = Date.UTC(local.y, local.m - 1, local.d, local.h, local.mi, 0);
  const offA = offsetMinutesForInstant(new Date(guessUtc), timeZone);
  const candA = new Date(guessUtc - offA * 60_000);
  const offACheck = offsetMinutesForInstant(candA, timeZone);
  const validA = offACheck === offA;

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
  const altCandidate = findAlternate(-60 * 60_000) ?? findAlternate(60 * 60_000);

  if (!validA && !altCandidate) return { gap: true };
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
 * Resolve a clinic-local civil instant. Never silently falls back to UTC.
 */
export function resolveLocalInstant(
  clinicId: string | undefined | null,
  localCivil: string,
  fold: FoldFlag = 0,
  options?: { expectedTimeZoneId?: string; deviceReportedAt?: string; receivedAt?: string; skewWarnMinutes?: number }
): InstantTimezoneResult {
  if (!clinicId || !clinicId.trim()) {
    return unresolved("clinic-missing", "Clinic id missing — cannot resolve IANA timezone.");
  }
  const tz = resolveClinicTimezone(clinicId);
  if (!tz.ok) {
    return unresolved("clinic-timezone-unresolved", tz.reason, { clinicId });
  }
  if (options?.expectedTimeZoneId && options.expectedTimeZoneId !== tz.timeZone) {
    return unresolved(
      "stale-timezone",
      `Offline event expected timezone ${options.expectedTimeZoneId} but clinic now resolves to ${tz.timeZone}.`,
      { clinicId, timeZoneId: tz.timeZone, localCivil }
    );
  }
  const parsed = parseLocal(localCivil);
  if (!parsed) {
    return unresolved("invalid-local-time", `Invalid local civil time: ${localCivil}`, {
      clinicId,
      timeZoneId: tz.timeZone,
      localCivil,
    });
  }
  const resolution = localWallTimeToUtc(parsed, tz.timeZone, fold);
  if ("gap" in resolution) {
    return unresolved(
      "dst-gap",
      `Local time ${localCivil} does not exist in ${tz.timeZone} (DST spring-forward gap).`,
      { clinicId, timeZoneId: tz.timeZone, localCivil }
    );
  }

  let deviceSkewMinutes: number | undefined;
  if (options?.deviceReportedAt && options?.receivedAt) {
    deviceSkewMinutes = Math.round(
      (new Date(options.deviceReportedAt).getTime() - new Date(options.receivedAt).getTime()) / 60_000
    );
    const warn = options.skewWarnMinutes ?? 10;
    if (Math.abs(deviceSkewMinutes) > warn) {
      // Warning path: still resolve, but mark skew for evidence/tests (TZ-06).
      return {
        ok: true,
        instant: {
          clinicId,
          timeZoneId: tz.timeZone,
          localCivil,
          occurredAtUtc: resolution.utc.toISOString(),
          offsetMinutes: resolution.offsetMinutes,
          fold,
          deviceSkewMinutes,
        },
      };
    }
  }

  return {
    ok: true,
    instant: {
      clinicId,
      timeZoneId: tz.timeZone,
      localCivil,
      occurredAtUtc: resolution.utc.toISOString(),
      offsetMinutes: resolution.offsetMinutes,
      fold,
      deviceSkewMinutes,
    },
  };
}

export function toAttendanceTimeStamp(result: Extract<InstantTimezoneResult, { ok: true }>["instant"]): AttendanceTimeStamp {
  return {
    timeZoneId: result.timeZoneId,
    localCivil: result.localCivil,
    occurredAtUtc: result.occurredAtUtc,
    offsetMinutes: result.offsetMinutes,
    fold: result.fold,
  };
}

export function testOnlyResolveOffsetForWallTime(
  clinicId: string,
  ymd: string,
  hm: string,
  fold: FoldFlag = 0
): { ok: true; offsetMinutes: number; timeZoneId: string } | UnresolvedInstantResult {
  const r = resolveLocalInstant(clinicId, `${ymd}T${hm}`, fold);
  if (!r.ok) return r;
  return { ok: true, offsetMinutes: r.instant.offsetMinutes, timeZoneId: r.instant.timeZoneId };
}

export function crossesLocalMidnight(startLocalCivil: string, endLocalCivil: string): boolean {
  return startLocalCivil.slice(0, 10) !== endLocalCivil.slice(0, 10);
}
