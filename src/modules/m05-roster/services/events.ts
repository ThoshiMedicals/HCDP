/**
 * M05 roster event publisher.
 *
 * Emits `WorkforceEventEnvelope` events on the shared workforce event bus
 * (same pattern as M11). Consumers dedupe by `eventId`; keep idempotency
 * keys stable via `rosterEventIdempotencyKey`.
 */

import type { SourceRecordRef } from "@/platform/contracts/source-record";
import {
  createWorkforceEvent,
  type WorkforceEventEnvelope,
  type WorkforceEventType,
} from "@/platform/workforce/contracts/workforce-events";
import {
  publishWorkforceEvent,
  type PublishWorkforceEventResult,
} from "@/platform/workforce/services/workforce-event-bus";
import { dispatchToRosterProjections } from "@/platform/workforce/registries/roster-projection-registry";
import type { RosterEventType } from "@/platform/workforce/events/roster-events";

const SOURCE_MODULE = "roster" as const;
const ROUTE = "/roster";

export type PublishM05EventInput = {
  eventType: RosterEventType | WorkforceEventType;
  sourceRecordId: string;
  sourceRecordVersion: number;
  sourceRecordType: string;
  sourceRecordTitle: string;
  organisationId?: string;
  clinicId?: string;
  actor: string;
  idempotencyKey: string;
  section?: string;
  currentStatus?: string;
  payload?: Record<string, unknown>;
  occurredAt?: string;
};

export function publishM05RosterEvent(
  input: PublishM05EventInput
): PublishWorkforceEventResult {
  const source: SourceRecordRef = {
    sourceModuleId: SOURCE_MODULE,
    sourceRecordType: input.sourceRecordType,
    sourceRecordId: input.sourceRecordId,
    sourceRecordTitle: input.sourceRecordTitle,
    clinicId: input.clinicId,
    organisationId: input.organisationId,
    currentStatus: input.currentStatus,
    route: ROUTE,
    section: input.section,
  };

  const event: WorkforceEventEnvelope = createWorkforceEvent({
    eventId: input.idempotencyKey,
    eventType: input.eventType as WorkforceEventType,
    sourceVersion: input.sourceRecordVersion,
    occurredAt: input.occurredAt ?? new Date().toISOString(),
    activeIdentityId: input.actor,
    clinicId: input.clinicId,
    organisationId: input.organisationId,
    idempotencyKey: input.idempotencyKey,
    source,
    payload: {
      sourceModule: SOURCE_MODULE,
      sourceRecordId: input.sourceRecordId,
      sourceRecordVersion: input.sourceRecordVersion,
      actor: input.actor,
      ...input.payload,
    },
  });

  const result = publishWorkforceEvent(event);
  if (result.accepted && !result.duplicate) {
    dispatchToRosterProjections(event);
  }
  return result;
}

export { createWorkforceEvent, publishWorkforceEvent };
