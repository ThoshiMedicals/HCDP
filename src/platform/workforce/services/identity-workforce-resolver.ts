/**
 * Platform identity → workforce person resolver.
 * Authentication / callers must NOT import M04 repositories.
 * Returns WorkforcePersonRef via a registered lookup, or null.
 */

import type { WorkforcePersonRef } from "../contracts/workforce-person-ref";

export type WorkforcePersonLookup = (personId: string) => WorkforcePersonRef | null;

let lookup: WorkforcePersonLookup | null = null;

/** M04 (or test) registers the lookup — auth never imports the repository. */
export function registerWorkforcePersonLookup(fn: WorkforcePersonLookup | null) {
  lookup = fn;
}

export function resolveProfileWorkforcePerson(
  workforcePersonId: string | null | undefined
): WorkforcePersonRef | null {
  if (!workforcePersonId || !lookup) return null;
  return lookup(workforcePersonId);
}
