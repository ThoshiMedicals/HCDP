/**
 * M07 → M04 person/employment/classification reads.
 * BOUNDARY: must NOT import m04-staff-doctors repositories.
 * BOUNDARY: must NOT write M04 storage keys.
 */

import type { EngagementRef } from "@/platform/workforce/contracts/engagement-ref";
import type { WorkforcePersonRef } from "@/platform/workforce/contracts/workforce-person-ref";

export type M04PersonIdentityView = {
  personId: string;
  displayLabel: string;
  personKind?: string;
  organisationId?: string;
  clinicId?: string;
  engagementId?: string;
  classificationRef?: string | null;
  /**
   * Period-effective M04 employment context (read-only).
   * Used by Batch 5 eligible-population resolver — never written by M07.
   */
  employmentStatus?: "active" | "inactive" | "terminated";
  employmentEffectiveFrom?: string;
  employmentEffectiveTo?: string | null;
  clinicAssignmentEffectiveFrom?: string;
  clinicAssignmentEffectiveTo?: string | null;
  readOnly: true;
  source: "m04-adapter";
};

type PlatformDemoRefs = {
  person?: WorkforcePersonRef;
  engagement?: EngagementRef;
};

let cached: PlatformDemoRefs | null = null;
const testPeople = new Map<string, M04PersonIdentityView>();

export function resetM04PersonReadForTests(): void {
  cached = null;
  testPeople.clear();
}

export function injectTestPersonIdentity(view: M04PersonIdentityView): void {
  testPeople.set(view.personId, view);
}

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

export async function ensureM04PersonReadWarmed(): Promise<void> {
  if (!cached) cached = await loadPlatformDemoRefs();
}

function refsSync(): PlatformDemoRefs {
  return cached ?? {};
}

export function resolvePersonIdentity(personId: string): M04PersonIdentityView | null {
  const injected = testPeople.get(personId);
  if (injected) return injected;
  const { person, engagement } = refsSync();
  if (person && person.recordId === personId) {
    return {
      personId: person.recordId,
      displayLabel: person.displayLabel,
      personKind: person.personKind,
      organisationId: person.organisationId,
      clinicId: person.clinicId,
      engagementId: engagement?.recordId ?? person.engagementId,
      classificationRef: null,
      readOnly: true,
      source: "m04-adapter",
    };
  }
  // Soft demo fallback for foundation tests without demo bag
  if (personId.startsWith("person_")) {
    return {
      personId,
      displayLabel: personId,
      personKind: "staff",
      organisationId: undefined,
      clinicId: undefined,
      classificationRef: null,
      readOnly: true,
      source: "m04-adapter",
    };
  }
  return null;
}

export function getEngagementOrganisationId(personId: string): string | null {
  const injected = testPeople.get(personId);
  if (injected?.organisationId) return injected.organisationId;
  const { engagement, person } = refsSync();
  if (engagement?.personId === personId) return engagement.organisationId ?? null;
  if (person?.recordId === personId) return person.organisationId ?? null;
  return null;
}

/** Read-only classification token from M04 — never editable via M07. */
export function readM04ClassificationRef(personId: string): string | null {
  return resolvePersonIdentity(personId)?.classificationRef ?? null;
}

export const M07_M04_PERSON_READ_SOURCE = "platform-demo-refs" as const;
