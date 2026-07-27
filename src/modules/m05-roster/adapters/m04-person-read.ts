/**
 * M05 → M04 person read adapter.
 *
 * BOUNDARY RULE: M05 must NOT import M04 (`m04-staff-doctors`) repositories.
 * This adapter exposes read-only person / engagement helpers built solely
 * on platform contracts (workforce refs, demo refs). If a richer M04 contract
 * becomes available at execution, this file is where to plug it in.
 */

import type { EngagementRef } from "@/platform/workforce/contracts/engagement-ref";
import type { WorkforcePersonRef } from "@/platform/workforce/contracts/workforce-person-ref";

type PlatformDemoRefs = {
  person?: WorkforcePersonRef;
  engagement?: EngagementRef;
};

// The platform demo module registers a small set of refs used by seeds and
// tests. We import it dynamically so this adapter has no hard coupling to the
// demo module — if it's absent the helpers simply return empty lists.
async function loadPlatformDemoRefs(): Promise<PlatformDemoRefs> {
  try {
    const mod = await import("@/platform/workforce/demo");
    const bag = mod as unknown as {
      DEMO_PERSON?: WorkforcePersonRef;
      DEMO_ENGAGEMENT?: EngagementRef;
    };
    return { person: bag.DEMO_PERSON, engagement: bag.DEMO_ENGAGEMENT };
  } catch {
    return {};
  }
}

let cached: PlatformDemoRefs | null = null;
async function refs(): Promise<PlatformDemoRefs> {
  if (cached) return cached;
  cached = await loadPlatformDemoRefs();
  return cached;
}

/** Synchronous fallback — used by services that cannot await. */
function refsSync(): PlatformDemoRefs {
  return cached ?? {};
}

/**
 * Warm the person-read cache. Call once at bootstrap. Safe to call multiple
 * times — subsequent calls are no-ops.
 */
export async function ensurePersonReadWarmed(): Promise<void> {
  await refs();
}

export function listWorkforcePeopleForClinic(
  clinicId: string
): WorkforcePersonRef[] {
  const { person } = refsSync();
  if (!person) return [];
  return person.clinicId === clinicId ? [person] : [];
}

export function getWorkforcePerson(personId: string): WorkforcePersonRef | null {
  const { person } = refsSync();
  if (!person) return null;
  return person.recordId === personId ? person : null;
}

export function getEngagementForPerson(personId: string): EngagementRef | null {
  const { engagement } = refsSync();
  if (!engagement) return null;
  return engagement.personId === personId ? engagement : null;
}

/**
 * Wave 4 note: This adapter intentionally exposes a small demo surface only.
 * At execution, a richer platform person-read contract can be substituted
 * without changing M05 service call sites.
 */
export const M05_PERSON_READ_SOURCE = "platform-demo-refs" as const;
