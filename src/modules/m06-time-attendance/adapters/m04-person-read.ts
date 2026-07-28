/**
 * M06 → M04 person/leave/eligibility reads.
 * BOUNDARY: must NOT import m04-staff-doctors repositories.
 */

import type { EngagementRef } from "@/platform/workforce/contracts/engagement-ref";
import type { WorkforcePersonRef } from "@/platform/workforce/contracts/workforce-person-ref";

type PlatformDemoRefs = {
  person?: WorkforcePersonRef;
  engagement?: EngagementRef;
};

let cached: PlatformDemoRefs | null = null;

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

async function refs(): Promise<PlatformDemoRefs> {
  if (cached) return cached;
  cached = await loadPlatformDemoRefs();
  return cached;
}

function refsSync(): PlatformDemoRefs {
  return cached ?? {};
}

export async function ensurePersonReadWarmed(): Promise<void> {
  await refs();
}

export function listWorkforcePeopleForClinic(clinicId: string): WorkforcePersonRef[] {
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

/** Demo leave check — returns conflicting leave windows if any (empty = none). */
export function listApprovedLeaveConflicts(
  personId: string,
  _localCivil: string
): Array<{ leaveId: string; personId: string; note: string }> {
  void personId;
  // Platform leave SoT remains M04; this adapter returns empty unless demo leave is injected in tests.
  return [];
}

export const M06_PERSON_READ_SOURCE = "platform-demo-refs" as const;
