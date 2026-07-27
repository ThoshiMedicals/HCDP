/**
 * Idempotent in-memory workforce event bus (Wave 1 foundation).
 * Duplicate eventId deliveries are ignored. Does not write other modules' repositories.
 */

import { uid } from "@/platform/storage/storage";
import type { WorkforceEventEnvelope } from "../contracts/workforce-events";
import { validateWorkforceEvent } from "../validation/workforce-reference-validation";

export type WorkforceEventHandler = (event: WorkforceEventEnvelope) => void;

const processedIds = new Set<string>();
const handlers = new Set<WorkforceEventHandler>();
const history: WorkforceEventEnvelope[] = [];

export type PublishWorkforceEventResult =
  | { accepted: true; duplicate: false; event: WorkforceEventEnvelope }
  | { accepted: true; duplicate: true; event: WorkforceEventEnvelope }
  | { accepted: false; issues: { field: string; message: string }[] };

export function resetWorkforceEventBusForTests() {
  processedIds.clear();
  handlers.clear();
  history.length = 0;
}

export function subscribeWorkforceEvents(handler: WorkforceEventHandler): () => void {
  handlers.add(handler);
  return () => {
    handlers.delete(handler);
  };
}

export function getWorkforceEventHistory(): readonly WorkforceEventEnvelope[] {
  return history;
}

export function hasProcessedWorkforceEvent(eventId: string): boolean {
  return processedIds.has(eventId);
}

export function publishWorkforceEvent(
  event: WorkforceEventEnvelope
): PublishWorkforceEventResult {
  const validation = validateWorkforceEvent(event);
  if (!validation.ok) {
    return { accepted: false, issues: validation.issues };
  }

  if (processedIds.has(event.eventId)) {
    return { accepted: true, duplicate: true, event };
  }

  processedIds.add(event.eventId);
  history.push(event);
  for (const handler of handlers) {
    handler(event);
  }
  return { accepted: true, duplicate: false, event };
}

export function newWorkforceEventId(prefix = "wfe"): string {
  return uid(prefix);
}
