/**
 * Authoritative workforce readiness lookup registry.
 * M04 registers its effective readiness / recalculation; M05 (and others) consume via platform only.
 */

import type { ReadinessRef, ReadinessLevel } from "../contracts/readiness-ref";

export type WorkforceReadinessOutcome = {
  readiness: ReadinessLevel;
  blockers: ReadinessRef["blockers"];
  asOf: string;
  stale: boolean;
  personId: string;
  /** Training detail refs for explanation UI only — never a second eligibility SoT. */
  trainingDetailRefs?: Array<{ recordId: string; route: string; section?: string }>;
};

export type WorkforceReadinessLookup = (personId: string, asOf?: string) => WorkforceReadinessOutcome | null;

export type WorkforceReadinessRecalculate = (
  personId: string,
  options?: { asOf?: string; sourceEventId?: string }
) => ReadinessRef | null;

let lookup: WorkforceReadinessLookup | null = null;
let recalculate: WorkforceReadinessRecalculate | null = null;

export function registerWorkforceReadinessLookup(fn: WorkforceReadinessLookup | null): void {
  lookup = fn;
}

export function registerWorkforceReadinessRecalculate(fn: WorkforceReadinessRecalculate | null): void {
  recalculate = fn;
}

export function getAuthoritativeWorkforceEligibility(
  personId: string,
  asOf?: string
): WorkforceReadinessOutcome | null {
  if (!lookup) return null;
  return lookup(personId, asOf);
}

export function recalculateAuthoritativeWorkforceReadiness(
  personId: string,
  options?: { asOf?: string; sourceEventId?: string }
): ReadinessRef | null {
  if (!recalculate) return null;
  return recalculate(personId, options);
}
