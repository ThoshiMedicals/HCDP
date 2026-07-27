/**
 * Readiness calculation via platform projectReadiness + training contribution registry.
 * Cache stores calculatedAt + sourceVersions (M04 + training). Never accept manual Ready.
 * Stale or missing cache → not Ready.
 * Does NOT import M11 repositories/services — training via platform registry only.
 */

import { projectReadiness } from "@/platform/workforce/services/readiness-projection";
import { getTrainingContributionsForPerson } from "@/platform/workforce/services/training-contribution-registry";
import { explanationsToBlockers } from "@/platform/workforce/contracts/readiness-contribution";
import { createReadinessRef, type ReadinessRef } from "@/platform/workforce/contracts/readiness-ref";
import { createCredentialRef } from "@/platform/workforce/contracts/credential-ref";
import * as store from "../repository/local-store";
import type { ReadinessCache, ReadinessLevel } from "../types/domain";

const STALE_MS = 24 * 60 * 60 * 1000;

export function buildSourceVersions(personId: string): Record<string, number | string> {
  const versions: Record<string, number | string> = {};
  for (const c of store.listCredentials(personId)) {
    versions[`credential:${c.id}`] = c.version;
  }
  for (const e of store.listEngagements(personId)) {
    versions[`engagement:${e.id}`] = e.version;
  }
  for (const l of store.listLeave(personId)) {
    versions[`leave:${l.id}`] = l.version;
  }
  for (const a of store.listAvailability(personId)) {
    versions[`availability:${a.id}`] = a.version;
  }
  for (const r of store.listRestrictions(personId)) {
    versions[`restriction:${r.id}`] = r.version;
  }
  const person = store.getPerson(personId);
  if (person) versions[`person:${person.id}`] = person.version;

  const contrib = getTrainingContributionsForPerson(personId);
  if (contrib?.sourceVersions) {
    Object.assign(versions, contrib.sourceVersions);
  }
  return versions;
}

function versionsEqual(a: Record<string, number | string>, b: Record<string, number | string>): boolean {
  const ak = Object.keys(a).sort();
  const bk = Object.keys(b).sort();
  if (ak.length !== bk.length) return false;
  return ak.every((k, i) => k === bk[i] && a[k] === b[k]);
}

export function isReadinessCacheFresh(cache: ReadinessCache | null, personId: string, now = Date.now()): boolean {
  if (!cache) return false;
  const age = now - new Date(cache.calculatedAt).getTime();
  if (Number.isNaN(age) || age > STALE_MS) return false;
  return versionsEqual(cache.sourceVersions, buildSourceVersions(personId));
}

/**
 * Effective readiness for UI/eligibility.
 * Missing or stale cache is never treated as Ready.
 */
export function getEffectiveReadiness(personId: string): {
  readiness: ReadinessLevel;
  blockers: ReadinessCache["blockers"];
  cache: ReadinessCache | null;
  stale: boolean;
  trainingDetailRefs?: Array<{ recordId: string; route: string; section?: string }>;
} {
  const cache = store.getReadinessCache(personId);
  const contrib = getTrainingContributionsForPerson(personId);
  if (!isReadinessCacheFresh(cache, personId)) {
    return {
      readiness: "unknown",
      blockers: cache?.blockers ?? [
        {
          code: "readiness.stale",
          label: "Readiness not calculated or sources changed",
          owningModuleId: "staff-doctors",
          severity: "blocking",
        },
      ],
      cache,
      stale: true,
      trainingDetailRefs: contrib?.trainingDetailRefs,
    };
  }
  return {
    readiness: cache!.readiness,
    blockers: cache!.blockers,
    cache,
    stale: false,
    trainingDetailRefs: contrib?.trainingDetailRefs,
  };
}

export type CalculateReadinessOptions = {
  asOf?: string;
  sourceEventId?: string;
  /** @deprecated Prefer platform training registry; retained for unit tests only. */
  trainingOverride?: Parameters<typeof projectReadiness>[0]["training"];
};

/**
 * Recalculate from credentials + platform training contributions.
 * Never set Ready manually.
 * Stale-event protection: if options.asOf is older than existing cache.calculatedAt, skip overwrite.
 */
export function calculateReadiness(
  personId: string,
  trainingOrOptions?: Parameters<typeof projectReadiness>[0]["training"] | CalculateReadinessOptions,
  maybeOptions?: CalculateReadinessOptions
): ReadinessRef {
  // Support legacy signature calculateReadiness(personId, training[]) and new options object.
  let options: CalculateReadinessOptions = {};
  let trainingOverride: Parameters<typeof projectReadiness>[0]["training"] | undefined;
  if (Array.isArray(trainingOrOptions)) {
    trainingOverride = trainingOrOptions;
    options = maybeOptions ?? {};
  } else if (trainingOrOptions && typeof trainingOrOptions === "object") {
    options = trainingOrOptions;
    trainingOverride = trainingOrOptions.trainingOverride;
  }

  const asOf = options.asOf ?? new Date().toISOString();
  const existing = store.getReadinessCache(personId);
  if (existing && options.asOf && existing.calculatedAt > options.asOf) {
    // Stale event must not overwrite newer outcome.
    const p = store.getPerson(personId);
    return createReadinessRef({
      recordId: `ready_${personId}`,
      personId,
      clinicId: p?.clinicIds[0],
      organisationId: p?.organisationId,
      status: existing.readiness,
      readiness: existing.readiness,
      blockers: existing.blockers,
      asOf: existing.calculatedAt,
    });
  }

  const person = store.getPerson(personId);
  if (!person) throw new Error(`Person not found: ${personId}`);

  const contrib = getTrainingContributionsForPerson(personId, asOf);
  const training = trainingOverride ?? contrib?.training ?? [];

  const credentials = store.listCredentials(personId).map((c) =>
    createCredentialRef({
      recordId: c.id,
      personId: c.personId,
      clinicId: c.clinicId,
      organisationId: c.organisationId,
      status: c.status,
      credentialType: c.credentialType,
      expiresOn: c.expiresOn,
      verified: c.verified,
    })
  );
  const ref = projectReadiness({
    personId,
    clinicId: person.clinicIds[0],
    organisationId: person.organisationId,
    credentials,
    training,
    asOf,
  });

  const blockers = [...ref.blockers];
  if (contrib?.explanations?.length) {
    for (const b of explanationsToBlockers(contrib.explanations)) {
      if (!blockers.some((x) => x.code === b.code && x.sourceRecordId === b.sourceRecordId)) {
        blockers.push(b);
      }
    }
  }

  if (person.status === "Suspended" || person.status === "Archived") {
    blockers.push({
      code: `person.status.${person.status}`,
      label: `Person is ${person.status}`,
      owningModuleId: "staff-doctors",
      sourceRecordId: person.id,
      severity: "blocking",
    });
  }
  const incompleteOff = store
    .listOffboarding(personId)
    .find((o) => o.status === "Incomplete" || o.status === "In Progress");
  if (incompleteOff) {
    blockers.push({
      code: "offboarding.incomplete",
      label: "Offboarding incomplete",
      owningModuleId: "staff-doctors",
      sourceRecordId: incompleteOff.id,
      severity: "blocking",
    });
  }

  const hasBlocking = blockers.some((b) => b.severity === "blocking");
  const hasAdvisory = blockers.some((b) => b.severity === "advisory");
  let readiness: ReadinessLevel = "ready";
  if (hasBlocking) readiness = "blocked";
  else if (hasAdvisory) readiness = "advisory";

  const sourceVersions: Record<string, number | string> = {
    ...buildSourceVersions(personId),
  };
  if (options.sourceEventId) {
    sourceVersions[`event:${options.sourceEventId}`] = asOf;
  }

  const cache: ReadinessCache = {
    personId,
    readiness,
    blockers,
    calculatedAt: asOf,
    sourceVersions,
  };
  store.upsertReadinessCache(cache);

  return {
    ...ref,
    readiness,
    status: readiness,
    blockers,
    asOf: cache.calculatedAt,
  };
}

export function invalidateReadinessForPerson(personId: string): void {
  store.invalidateReadinessCache(personId);
}

/** Reject attempts to force Ready without recalculation. */
export function assertNotManualReady(proposed: ReadinessLevel, personId: string): void {
  if (proposed !== "ready") return;
  const effective = getEffectiveReadiness(personId);
  if (effective.stale || effective.readiness !== "ready") {
    throw new Error("Cannot set readiness to Ready manually; recalculate from sources");
  }
}
