/** Effective-dated engagements with overlap protection. */

import { assertM04Permission, type M04Actor } from "../permissions";
import * as store from "../repository/local-store";
import type { Engagement, EmploymentType } from "../types/domain";
import { publishM04WorkforceEvent } from "./events";
import { invalidateReadinessForPerson } from "./readiness-service";

function toTime(iso: string): number {
  return new Date(iso).getTime();
}

function rangesOverlap(
  aFrom: string,
  aTo: string | null | undefined,
  bFrom: string,
  bTo: string | null | undefined
): boolean {
  const aStart = toTime(aFrom);
  const aEnd = aTo ? toTime(aTo) : Number.POSITIVE_INFINITY;
  const bStart = toTime(bFrom);
  const bEnd = bTo ? toTime(bTo) : Number.POSITIVE_INFINITY;
  return aStart <= bEnd && bStart <= aEnd;
}

export function findEngagementOverlap(
  personId: string,
  clinicId: string,
  effectiveFrom: string,
  effectiveTo?: string | null,
  excludeId?: string
): Engagement | null {
  return (
    store.listEngagements(personId).find((e) => {
      if (excludeId && e.id === excludeId) return false;
      if (e.status === "Ended" || e.status === "Draft") return false;
      if (e.clinicId !== clinicId) return false;
      return rangesOverlap(e.effectiveFrom, e.effectiveTo, effectiveFrom, effectiveTo);
    }) ?? null
  );
}

export function createEngagement(
  actor: M04Actor,
  input: {
    personId: string;
    clinicId: string;
    organisationId: string;
    roleLabel: string;
    employmentType: EmploymentType | string;
    effectiveFrom: string;
    effectiveTo?: string | null;
  }
): Engagement {
  assertM04Permission(actor, "workforce.manage_engagement");
  const person = store.getPerson(input.personId);
  if (!person) throw new Error(`Person not found: ${input.personId}`);

  const overlap = findEngagementOverlap(
    input.personId,
    input.clinicId,
    input.effectiveFrom,
    input.effectiveTo
  );
  if (overlap) {
    throw new Error(
      `Engagement overlaps existing engagement ${overlap.id} (${overlap.roleLabel}) at clinic ${overlap.clinicId}`
    );
  }

  const now = new Date().toISOString();
  const engagement: Engagement = {
    id: store.newEngagementId(),
    personId: input.personId,
    clinicId: input.clinicId,
    organisationId: input.organisationId,
    roleLabel: input.roleLabel,
    employmentType: input.employmentType,
    effectiveFrom: input.effectiveFrom,
    effectiveTo: input.effectiveTo ?? null,
    status: "Active",
    createdAt: now,
    updatedAt: now,
    version: 1,
  };
  store.upsertEngagement(engagement);

  if (!person.clinicIds.includes(input.clinicId)) {
    store.upsertPerson({
      ...person,
      clinicIds: [...person.clinicIds, input.clinicId],
      updatedAt: now,
      version: person.version + 1,
    });
  }

  publishM04WorkforceEvent({
    eventType: "engagement.created",
    sourceRecordId: engagement.id,
    sourceRecordVersion: engagement.version,
    sourceRecordType: "engagement",
    sourceRecordTitle: `${engagement.roleLabel} — ${person.preferredName}`,
    organisationId: engagement.organisationId,
    clinicId: engagement.clinicId,
    actor: actor.userId,
    idempotencyKey: `m04::engagement-created::${engagement.id}::v${engagement.version}`,
    section: "engagements",
    currentStatus: engagement.status,
    payload: { personId: engagement.personId },
  });
  invalidateReadinessForPerson(engagement.personId);
  return engagement;
}

export function updateEngagement(
  actor: M04Actor,
  id: string,
  patch: Partial<Pick<Engagement, "roleLabel" | "employmentType" | "effectiveFrom" | "effectiveTo" | "status">>
): Engagement {
  assertM04Permission(actor, "workforce.manage_engagement");
  const existing = store.getEngagement(id);
  if (!existing) throw new Error(`Engagement not found: ${id}`);

  const nextFrom = patch.effectiveFrom ?? existing.effectiveFrom;
  const nextTo = patch.effectiveTo !== undefined ? patch.effectiveTo : existing.effectiveTo;
  const overlap = findEngagementOverlap(existing.personId, existing.clinicId, nextFrom, nextTo, existing.id);
  if (overlap) {
    throw new Error(`Engagement overlaps existing engagement ${overlap.id}`);
  }

  const now = new Date().toISOString();
  const next: Engagement = {
    ...existing,
    ...patch,
    effectiveFrom: nextFrom,
    effectiveTo: nextTo,
    updatedAt: now,
    version: existing.version + 1,
  };
  store.upsertEngagement(next);
  publishM04WorkforceEvent({
    eventType: "engagement.changed",
    sourceRecordId: next.id,
    sourceRecordVersion: next.version,
    sourceRecordType: "engagement",
    sourceRecordTitle: next.roleLabel,
    organisationId: next.organisationId,
    clinicId: next.clinicId,
    actor: actor.userId,
    idempotencyKey: `m04::engagement-changed::${next.id}::v${next.version}`,
    section: "engagements",
    currentStatus: next.status,
    payload: { personId: next.personId },
  });
  invalidateReadinessForPerson(next.personId);
  return next;
}

export function listEngagements(personId?: string): Engagement[] {
  return store.listEngagements(personId);
}
