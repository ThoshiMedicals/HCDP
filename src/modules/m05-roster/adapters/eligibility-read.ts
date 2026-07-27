/**
 * M05 roster eligibility adapter — Wave 3 read-only interface only.
 * Consumes authoritative readiness via M04/platform registry.
 * Does NOT treat M11 training status as the final eligibility decision.
 * Does NOT implement roster workspace workflows (Wave 4).
 */

import {
  getAuthoritativeWorkforceEligibility,
  type WorkforceReadinessOutcome,
} from "@/platform/workforce/services/workforce-eligibility";

export type RosterEligibilityResult = WorkforceReadinessOutcome & {
  eligible: boolean;
  authority: "m04-platform";
};

/**
 * Authoritative roster eligibility for a person.
 * Ready + not stale ⇒ eligible. Training detail refs are explanatory only.
 */
export function getRosterEligibility(
  personId: string,
  asOf?: string
): RosterEligibilityResult | null {
  const outcome = getAuthoritativeWorkforceEligibility(personId, asOf);
  if (!outcome) return null;
  return {
    ...outcome,
    eligible: !outcome.stale && outcome.readiness === "ready",
    authority: "m04-platform",
  };
}
