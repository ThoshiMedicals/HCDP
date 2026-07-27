/**
 * Clinic IANA timezone resolution for workforce day-boundary calculations.
 * Authoritative due/grace/overdue/expiry must not silently assume UTC.
 */

export type ClinicTimezoneResolution =
  | { ok: true; timeZone: string; clinicId: string }
  | { ok: false; clinicId: string | undefined; reason: string };

/** Built-in demo clinic → IANA map (Wave 3). Register overrides via registerClinicTimezone. */
const DEFAULT_CLINIC_TIMEZONES: Record<string, string> = {
  clinic_a: "Australia/Brisbane",
  clinic_b: "Pacific/Auckland", // UTC+12/+13 — date often differs from UTC
  clinic_la: "America/Los_Angeles", // UTC-8/-7 — date often differs from UTC
  loc_woolloongabba: "Australia/Brisbane",
  loc_cannonhill: "Australia/Brisbane",
  loc_eightmile: "Australia/Brisbane",
  loc_chapelhill: "Australia/Brisbane",
  loc_indooroopilly: "Australia/Brisbane",
  loc_baldhills: "Australia/Brisbane",
  loc_lawnton: "Australia/Brisbane",
  loc_beachmere: "Australia/Brisbane",
};

const overrides = new Map<string, string>();

export function registerClinicTimezone(clinicId: string, ianaTimeZone: string): void {
  overrides.set(clinicId, ianaTimeZone);
}

export function clearClinicTimezoneOverridesForTests(): void {
  overrides.clear();
}

export function resolveClinicTimezone(clinicId: string | undefined | null): ClinicTimezoneResolution {
  if (!clinicId || !clinicId.trim()) {
    return {
      ok: false,
      clinicId: clinicId ?? undefined,
      reason: "Clinic id missing — cannot resolve IANA timezone for authoritative day boundary",
    };
  }
  const tz = overrides.get(clinicId) ?? DEFAULT_CLINIC_TIMEZONES[clinicId];
  if (!tz) {
    return {
      ok: false,
      clinicId,
      reason: `No IANA timezone configured for clinic ${clinicId}`,
    };
  }
  // Validate IANA id is accepted by the runtime
  try {
    new Intl.DateTimeFormat("en-AU", { timeZone: tz }).format(new Date());
  } catch {
    return {
      ok: false,
      clinicId,
      reason: `Invalid or unsupported IANA timezone "${tz}" for clinic ${clinicId}`,
    };
  }
  return { ok: true, timeZone: tz, clinicId };
}

export class ClinicTimezoneUnresolvedError extends Error {
  clinicId?: string;
  constructor(resolution: Extract<ClinicTimezoneResolution, { ok: false }>) {
    super(resolution.reason);
    this.name = "ClinicTimezoneUnresolvedError";
    this.clinicId = resolution.clinicId;
  }
}

/** Calendar date YYYY-MM-DD in the clinic IANA timezone for an absolute instant. */
export function clinicCalendarDate(
  asOf: Date | string,
  timeZone: string
): string {
  const d = typeof asOf === "string" ? new Date(asOf) : asOf;
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid asOf instant: ${asOf}`);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  if (!y || !m || !day) throw new Error(`Failed to format clinic calendar date in ${timeZone}`);
  return `${y}-${m}-${day}`;
}

/** Compare YYYY-MM-DD calendar dates: -1 if a<b, 0 if equal, 1 if a>b. */
export function compareCalendarDates(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

/** Add days to a YYYY-MM-DD calendar date (pure date arithmetic, not UTC midnight). */
export function addCalendarDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const utc = Date.UTC(y!, m! - 1, d! + days);
  const iso = new Date(utc).toISOString().slice(0, 10);
  return iso;
}

/** Add calendar months to a YYYY-MM-DD date (clamps day when needed). */
export function addCalendarMonths(ymd: string, months: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d!));
  const targetMonth = dt.getUTCMonth() + months;
  dt.setUTCMonth(targetMonth);
  // If overflowed (e.g. Jan 31 + 1 month), JS rolls — clamp to last day of intended month
  const intended = new Date(Date.UTC(y!, m! - 1 + months, 1));
  const lastDay = new Date(Date.UTC(intended.getUTCFullYear(), intended.getUTCMonth() + 1, 0)).getUTCDate();
  if (d! > lastDay) {
    return `${intended.getUTCFullYear()}-${String(intended.getUTCMonth() + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  }
  return dt.toISOString().slice(0, 10);
}

export type AssignmentScheduleStatus = "assigned" | "due" | "grace" | "overdue";

/**
 * Derive due/grace/overdue from clinic calendar dates.
 * graceDays: days after dueDate that remain in grace before overdue (0 = overdue the day after due).
 */
export function deriveAssignmentScheduleStatus(input: {
  dueDate: string;
  clinicToday: string;
  graceDays: number;
}): AssignmentScheduleStatus {
  const cmp = compareCalendarDates(input.clinicToday, input.dueDate);
  if (cmp < 0) return "assigned";
  if (cmp === 0) return "due";
  const graceEnd = addCalendarDays(input.dueDate, Math.max(0, input.graceDays));
  if (compareCalendarDates(input.clinicToday, graceEnd) <= 0) return "grace";
  return "overdue";
}

/** Resolve clinic today or throw ClinicTimezoneUnresolvedError. */
export function requireClinicToday(
  clinicId: string | undefined | null,
  asOf: Date | string
): { timeZone: string; clinicToday: string; clinicId: string } {
  const resolved = resolveClinicTimezone(clinicId);
  if (!resolved.ok) throw new ClinicTimezoneUnresolvedError(resolved);
  return {
    timeZone: resolved.timeZone,
    clinicId: resolved.clinicId,
    clinicToday: clinicCalendarDate(asOf, resolved.timeZone),
  };
}
