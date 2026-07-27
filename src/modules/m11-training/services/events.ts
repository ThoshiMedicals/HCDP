/**
 * M11 training event publisher.
 * Mirrors M04 pattern: WorkforceEventEnvelope via platform workforce event bus.
 */

import type { SourceRecordRef } from "@/platform/contracts/source-record";
import {
  createWorkforceEvent,
  type WorkforceEventType,
  type WorkforceEventEnvelope,
} from "@/platform/workforce/contracts/workforce-events";
import {
  publishWorkforceEvent,
  type PublishWorkforceEventResult,
} from "@/platform/workforce/services/workforce-event-bus";

const SOURCE_MODULE = "training" as const;
const ROUTE = "/training";

export type PublishM11EventInput = {
  eventType: WorkforceEventType;
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

export function publishM11TrainingEvent(input: PublishM11EventInput): PublishWorkforceEventResult {
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
    eventType: input.eventType,
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

  return publishWorkforceEvent(event);
}

export { createWorkforceEvent, publishWorkforceEvent };
