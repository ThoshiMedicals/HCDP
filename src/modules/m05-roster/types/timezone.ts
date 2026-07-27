/**
 * M05 shift-time / clinic-timezone types.
 *
 * A resolved shift window carries both clinic-local intent AND canonical UTC
 * instants, plus enough disambiguation (offset, fold) to preserve behaviour
 * across DST gap/fall-back.
 *
 * When the clinic timezone cannot be resolved we return an unresolved result
 * (no silent UTC — Wave 3 rule).
 */

export type FoldFlag = 0 | 1;

export interface ResolvedShiftWindow {
  clinicId: string;
  timeZoneId: string;
  /** Clinic-local civil datetime intent (`YYYY-MM-DDTHH:mm`). */
  localStart: string;
  localEnd: string;
  /** Canonical UTC instants (ISO strings, e.g. `2026-08-01T22:00:00.000Z`). */
  utcStart: string;
  utcEnd: string;
  /** UTC offset applied at start/end, in minutes. */
  startOffsetMinutes: number;
  endOffsetMinutes: number;
  /**
   * DST disambiguation flags for repeated local hour (fall-back):
   * 0 = earlier occurrence, 1 = later occurrence.
   */
  startFold: FoldFlag;
  endFold: FoldFlag;
  /** True if this window crosses local midnight (overnight/cross-midnight). */
  crossesLocalMidnight: boolean;
}

export type UnresolvedShiftTimezoneReason =
  | "clinic-missing"
  | "clinic-timezone-unresolved"
  | "invalid-local-time"
  | "dst-gap"
  | "end-before-start"
  | "unknown";

export interface UnresolvedTimezoneResult {
  ok: false;
  reason: UnresolvedShiftTimezoneReason;
  message: string;
  clinicId?: string;
  timeZoneId?: string;
  localStart?: string;
  localEnd?: string;
}

export type ShiftTimezoneResult =
  | { ok: true; window: ResolvedShiftWindow }
  | UnresolvedTimezoneResult;
