/**
 * M05 acknowledgement service.
 *
 * - Ack/decline apply to the EXACT `publicationVersion` shown to the worker.
 * - Acks against a superseded publication are REJECTED (stale-replay guard).
 * - After each ack/decline the publication's derived `acknowledgementStatus`
 *   is recomputed via `recomputePublicationAckStatus`.
 * - Period lifecycle is not affected (§11 rule).
 */

import { assertM05Permission, type M05Actor } from "../permissions";
import type { Acknowledgement, AcknowledgementOutcome } from "../types/domain";
import * as store from "../repository/local-store";
import { appendRosterAudit } from "./audit-helpers";
import { recomputePublicationAckStatus } from "./publication-service";

export interface AcknowledgeInput {
  publicationId: string;
  publicationVersion: number;
  outcome: AcknowledgementOutcome;
  note?: string;
  actAsPersonId: string;
}

export function acknowledgePublication(
  actor: M05Actor,
  input: AcknowledgeInput
): Acknowledgement {
  assertM05Permission(actor, "roster.acknowledge");

  const publication = store.getPublication(input.publicationId);
  if (!publication) throw new Error(`Publication not found: ${input.publicationId}`);

  if (publication.publicationVersion !== input.publicationVersion) {
    throw new Error(
      `Acknowledgement version ${input.publicationVersion} does not match current publication version ${publication.publicationVersion}`
    );
  }
  if (publication.supersededById) {
    throw new Error("Cannot acknowledge a superseded publication — refresh to the latest version");
  }
  if (!publication.requiredAcknowledgerPersonIds.includes(input.actAsPersonId)) {
    throw new Error(
      `Person ${input.actAsPersonId} is not in the required acknowledger set for publication ${publication.id}`
    );
  }

  const now = new Date().toISOString();
  const ack: Acknowledgement = {
    id: store.newAcknowledgementId(),
    publicationId: publication.id,
    publicationVersion: publication.publicationVersion,
    personId: input.actAsPersonId,
    outcome: input.outcome,
    respondedAt: now,
    note: input.note ?? null,
    createdAt: now,
    version: 1,
  };
  store.appendAcknowledgement(ack);
  recomputePublicationAckStatus(publication.id);
  appendRosterAudit({
    actorId: actor.userId,
    organisationId: publication.organisationId,
    clinicId: publication.clinicId,
    action: `publication.${input.outcome}`,
    targetType: "acknowledgement",
    targetId: ack.id,
    detail: {
      publicationId: publication.id,
      publicationVersion: publication.publicationVersion,
      actAsPersonId: input.actAsPersonId,
    },
  });
  return ack;
}

export function listAcknowledgementsForPublication(publicationId: string): Acknowledgement[] {
  return store.listAcknowledgements(publicationId);
}
