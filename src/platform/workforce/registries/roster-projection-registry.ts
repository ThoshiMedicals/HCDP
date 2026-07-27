/**
 * Optional projection registry hook for roster-family projections
 * (M01 executive aggregates and M02 action-inbox lifecycles).
 *
 * Wave 4 (M05) publishes projections through its own adapters (`m05-inbox-sync`,
 * `m05-executive`); this registry lets other modules register additional
 * projection hooks without importing M05 internals. It is intentionally thin:
 * consumers are called with the roster event envelope only.
 */

import type { WorkforceEventEnvelope } from "../contracts/workforce-events";

export type RosterProjectionKind =
  | "action-inbox"
  | "executive-aggregate"
  | "audit";

export type RosterProjectionHandler = (event: WorkforceEventEnvelope) => void;

export interface RosterProjectionRegistration {
  id: string;
  kind: RosterProjectionKind;
  handler: RosterProjectionHandler;
}

const registrations = new Map<string, RosterProjectionRegistration>();

export function registerRosterProjection(
  registration: RosterProjectionRegistration
): () => void {
  registrations.set(registration.id, registration);
  return () => {
    registrations.delete(registration.id);
  };
}

export function listRosterProjections(): RosterProjectionRegistration[] {
  return [...registrations.values()];
}

export function dispatchToRosterProjections(event: WorkforceEventEnvelope): void {
  for (const reg of registrations.values()) {
    try {
      reg.handler(event);
    } catch {
      // Projection handlers must not throw — swallow to preserve producer flow.
    }
  }
}

export function resetRosterProjectionRegistryForTests(): void {
  registrations.clear();
}
