/**
 * M05 roster eligibility adapter.
 *
 * Consumes authoritative readiness via M04/platform registry.
 * MUST NOT import M11 repositories. MUST retain `authority: "m04-platform"`.
 *
 * Backward compatibility (Wave 3 signature): `getRosterEligibility(personId, asOfString?)`
 * still works. Wave 4 extends it with an optional options object carrying
 * `clinicId`, `asOf`, and `shiftWindow` for authoritative shift-window checks.
 */

import {
  getAuthoritativeWorkforceEligibility,
  type WorkforceReadinessOutcome,
} from "@/platform/workforce/services/workforce-eligibility";
import type { ResolvedShiftWindow } from "../types/timezone";

export type RosterEligibilityResult = WorkforceReadinessOutcome & {
  eligible: boolean;
  authority: "m04-platform";
  requestedClinicId?: string;
  requestedShiftWindow?: {
    utcStart: string;
    utcEnd: string;
    timeZoneId: string;
  };
};

export interface RosterEligibilityOptions {
  asOf?: string;
  clinicId?: string;
  shiftWindow?: ResolvedShiftWindow;
}

function isOptions(
  value: string | RosterEligibilityOptions | undefined
): value is RosterEligibilityOptions {
  return typeof value === "object" && value !== null;
}

/**
 * Authoritative roster eligibility for a person.
 * Ready + not stale ⇒ eligible. Training detail refs are explanatory only.
 *
 * Overloads:
 *  - `getRosterEligibility(personId)` — reuse current default asOf
 *  - `getRosterEligibility(personId, asOfString)` — Wave 3 compat
 *  - `getRosterEligibility(personId, { asOf?, clinicId?, shiftWindow? })` — Wave 4
 */
export function getRosterEligibility(
  personId: string,
  asOf?: string
): RosterEligibilityResult | null;
export function getRosterEligibility(
  personId: string,
  options: RosterEligibilityOptions
): RosterEligibilityResult | null;
export function getRosterEligibility(
  personId: string,
  arg?: string | RosterEligibilityOptions
): RosterEligibilityResult | null {
  const options: RosterEligibilityOptions = isOptions(arg) ? arg : { asOf: arg };
  const asOf = options.asOf;

  const outcome = getAuthoritativeWorkforceEligibility(personId, asOf);
  if (!outcome) return null;

  return {
    ...outcome,
    eligible: !outcome.stale && outcome.readiness === "ready",
    authority: "m04-platform",
    requestedClinicId: options.clinicId,
    requestedShiftWindow: options.shiftWindow
      ? {
          utcStart: options.shiftWindow.utcStart,
          utcEnd: options.shiftWindow.utcEnd,
          timeZoneId: options.shiftWindow.timeZoneId,
        }
      : undefined,
  };
}
