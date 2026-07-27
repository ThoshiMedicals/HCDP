/**
 * M04 repository interfaces — person SoT.
 * Other modules must consume WorkforcePersonRef / EngagementRef, not this repository.
 */

import type { WorkforcePersonRef } from "@/platform/workforce/contracts/workforce-person-ref";
import type { EngagementRef } from "@/platform/workforce/contracts/engagement-ref";
import type { CredentialRef } from "@/platform/workforce/contracts/credential-ref";
import type { ReadinessRef } from "@/platform/workforce/contracts/readiness-ref";

export interface M04PersonRepository {
  listPeople(): WorkforcePersonRef[];
  getPerson(id: string): WorkforcePersonRef | null;
  upsertPerson(person: WorkforcePersonRef): void;
}

export interface M04EngagementRepository {
  listEngagements(personId?: string): EngagementRef[];
  getEngagement(id: string): EngagementRef | null;
  upsertEngagement(engagement: EngagementRef): void;
}

export interface M04CredentialRepository {
  listCredentials(personId?: string): CredentialRef[];
  getCredential(id: string): CredentialRef | null;
  upsertCredential(credential: CredentialRef): void;
}

export interface M04ReadinessRepository {
  getReadiness(personId: string): ReadinessRef | null;
  upsertReadiness(readiness: ReadinessRef): void;
}

export interface M04Repositories {
  people: M04PersonRepository;
  engagements: M04EngagementRepository;
  credentials: M04CredentialRepository;
  readiness: M04ReadinessRepository;
}
