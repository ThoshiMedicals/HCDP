/**
 * Thin M05 helpers over the shared workforce event bus + roster projection
 * registry. Existing service call sites use `publishM05RosterEvent` directly;
 * this adapter surfaces the same primitives for consumers that only want
 * to subscribe to roster events.
 */

import {
  subscribeWorkforceEvents,
  getWorkforceEventHistory,
  type WorkforceEventHandler,
} from "@/platform/workforce/services/workforce-event-bus";
import {
  registerRosterProjection,
  type RosterProjectionRegistration,
} from "@/platform/workforce/registries/roster-projection-registry";
import type { WorkforceEventEnvelope } from "@/platform/workforce/contracts/workforce-events";
import {
  ROSTER_EVENT_TYPES,
  type RosterEventType,
} from "@/platform/workforce/events/roster-events";

export function isRosterEvent(event: WorkforceEventEnvelope): boolean {
  return (ROSTER_EVENT_TYPES as readonly string[]).includes(event.eventType);
}

export function subscribeToRosterEvents(handler: (event: WorkforceEventEnvelope) => void): () => void {
  const wrapped: WorkforceEventHandler = (event) => {
    if (isRosterEvent(event)) handler(event);
  };
  return subscribeWorkforceEvents(wrapped);
}

export function listRosterEventHistory(): WorkforceEventEnvelope[] {
  return getWorkforceEventHistory().filter(isRosterEvent);
}

export function registerM05Projection(
  reg: RosterProjectionRegistration
): () => void {
  return registerRosterProjection(reg);
}

export { ROSTER_EVENT_TYPES };
export type { RosterEventType };
