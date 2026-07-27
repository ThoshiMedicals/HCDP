/**
 * Wave 4 (M05) roster event helpers.
 *
 * These are additive typing helpers layered on the existing workforce event
 * envelope; they do NOT introduce a parallel bus. Producers still call
 * `publishWorkforceEvent` on the shared workforce event bus.
 *
 * Roster event types are drawn from `WorkforceEventType` — they must remain
 * a subset of that union so bus validation continues to accept them.
 */

import type { WorkforceEventType } from "../contracts/workforce-events";

/** Subset of workforce event types produced by M05. */
export type RosterEventType = Extract<
  WorkforceEventType,
  | "roster.published"
  | "shift.created"
  | "shift.changed"
  | "shift.cancelled"
>;

export const ROSTER_EVENT_TYPES: readonly RosterEventType[] = [
  "roster.published",
  "shift.created",
  "shift.changed",
  "shift.cancelled",
] as const;

export type RosterEventNamespace =
  | "roster.period"
  | "roster.publication"
  | "roster.assignment"
  | "roster.open-shift"
  | "roster.swap";

/** Stable idempotency key builder for M05 events. */
export function rosterEventIdempotencyKey(input: {
  namespace: RosterEventNamespace;
  recordId: string;
  version: number;
  suffix?: string;
}): string {
  const tail = input.suffix ? `::${input.suffix}` : "";
  return `m05::${input.namespace}::${input.recordId}::v${input.version}${tail}`;
}

/** Well-known payload shapes emitted by M05 (documentation only — payload remains `Record<string, unknown>`). */
export interface RosterPublishedEventPayload {
  rosterPeriodId: string;
  publicationId: string;
  publicationVersion: number;
  supersedesId?: string | null;
  clinicId?: string;
  timeZoneId?: string;
  assignmentCount: number;
  warningCount: number;
}

export interface ShiftChangedEventPayload {
  shiftId: string;
  rosterPeriodId: string;
  personId?: string | null;
  clinicId?: string;
  published: boolean;
}
