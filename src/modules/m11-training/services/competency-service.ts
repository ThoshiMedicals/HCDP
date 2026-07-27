/** M11 competency service — record competency with attestation, supersede prior. */

import { assertM11Permission, type M11Actor } from "../permissions";
import * as store from "../repository/local-store";
import type { CompetencyRecord } from "../types/domain";
import { publishM11TrainingEvent } from "./events";

const DEFAULT_ORG = "org_parent";

export function recordCompetency(
  actor: M11Actor,
  input: {
    personId: string;
    courseId: string;
    requirementId: string;
    competencyMet: boolean;
    expiresOn?: string;
    notes?: string;
    organisationId?: string;
    clinicId?: string;
    supersedesId?: string;
  }
): CompetencyRecord {
  assertM11Permission(actor, "training.competency.record");
  const now = new Date().toISOString();

  if (input.supersedesId) {
    const prior = store.getCompetency(input.supersedesId);
    if (!prior) throw new Error(`Prior competency not found: ${input.supersedesId}`);
    if (prior.supersededById) {
      throw new Error(`Competency ${input.supersedesId} is already superseded`);
    }
  }

  const record: CompetencyRecord = {
    id: store.newCompetencyId(),
    personId: input.personId,
    courseId: input.courseId,
    requirementId: input.requirementId,
    organisationId: input.organisationId ?? DEFAULT_ORG,
    clinicId: input.clinicId,
    attestedBy: actor.userId,
    attestedAt: now,
    competencyMet: input.competencyMet,
    expiresOn: input.expiresOn ?? null,
    notes: input.notes,
    supersedesId: input.supersedesId ?? null,
    supersededById: null,
    createdAt: now,
    version: 1,
  };
  store.upsertCompetency(record);

  if (input.supersedesId) {
    const prior = store.getCompetency(input.supersedesId)!;
    store.upsertCompetency({ ...prior, supersededById: record.id });
  }

  publishM11TrainingEvent({
    eventType: "worker.status.changed",
    sourceRecordId: record.id,
    sourceRecordVersion: record.version,
    sourceRecordType: "training-competency",
    sourceRecordTitle: `Competency: ${record.personId} / ${record.requirementId}`,
    organisationId: record.organisationId,
    clinicId: record.clinicId,
    actor: actor.userId,
    idempotencyKey: `m11::competency::${record.id}::v${record.version}`,
    section: "competencies",
    currentStatus: record.competencyMet ? "met" : "not_met",
  });
  return record;
}

export function listCompetencies(personId?: string): CompetencyRecord[] {
  return store.listCompetencies(personId);
}

/** Latest active (non-superseded) competency record for a person + requirement. */
export function getActiveCompetency(personId: string, requirementId: string): CompetencyRecord | null {
  return (
    store
      .listCompetencies(personId)
      .filter((c) => c.requirementId === requirementId && !c.supersededById)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null
  );
}
