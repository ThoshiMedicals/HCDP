/** M11 assessment service — record assessment outcomes, supersede prior with supersedesId. */

import { assertM11Permission, type M11Actor } from "../permissions";
import * as store from "../repository/local-store";
import type { Assessment, AssessmentOutcome } from "../types/domain";
import { publishM11TrainingEvent } from "./events";

const DEFAULT_ORG = "org_parent";

export function recordAssessment(
  actor: M11Actor,
  input: {
    personId: string;
    courseId: string;
    assignmentId?: string;
    outcome: AssessmentOutcome;
    score?: number;
    maxScore?: number;
    notes?: string;
    organisationId?: string;
    clinicId?: string;
    /** If provided, the prior assessment ID to supersede. */
    supersedesId?: string;
  }
): Assessment {
  assertM11Permission(actor, "training.assess");
  const now = new Date().toISOString();

  // If superseding a prior record, close it
  if (input.supersedesId) {
    const prior = store.getAssessment(input.supersedesId);
    if (!prior) throw new Error(`Prior assessment not found: ${input.supersedesId}`);
    if (prior.supersededById) {
      throw new Error(`Assessment ${input.supersedesId} is already superseded`);
    }
  }

  const assessment: Assessment = {
    id: store.newAssessmentId(),
    personId: input.personId,
    courseId: input.courseId,
    assignmentId: input.assignmentId ?? null,
    organisationId: input.organisationId ?? DEFAULT_ORG,
    clinicId: input.clinicId,
    assessorId: actor.userId,
    outcome: input.outcome,
    score: input.score ?? null,
    maxScore: input.maxScore ?? null,
    notes: input.notes,
    supersedesId: input.supersedesId ?? null,
    supersededById: null,
    createdAt: now,
    version: 1,
  };
  store.upsertAssessment(assessment);

  if (input.supersedesId) {
    const prior = store.getAssessment(input.supersedesId)!;
    store.upsertAssessment({ ...prior, supersededById: assessment.id });
  }

  publishM11TrainingEvent({
    eventType: "worker.status.changed",
    sourceRecordId: assessment.id,
    sourceRecordVersion: assessment.version,
    sourceRecordType: "training-assessment",
    sourceRecordTitle: `Assessment: ${assessment.personId} / ${assessment.courseId}`,
    organisationId: assessment.organisationId,
    clinicId: assessment.clinicId,
    actor: actor.userId,
    idempotencyKey: `m11::assessment::${assessment.id}::v${assessment.version}`,
    section: "assessments",
    currentStatus: assessment.outcome,
    payload: { personId: assessment.personId, outcome: assessment.outcome },
  });
  return assessment;
}

export function listAssessments(personId?: string): Assessment[] {
  return store.listAssessments(personId);
}

/** Active (non-superseded) assessments for a person+course. */
export function getActiveAssessment(personId: string, courseId: string): Assessment | null {
  return (
    store
      .listAssessments(personId)
      .filter((a) => a.courseId === courseId && !a.supersededById)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null
  );
}
