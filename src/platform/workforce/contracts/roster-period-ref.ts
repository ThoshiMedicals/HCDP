/**
 * Roster period reference — owned by M05.
 * Additive contract exposed for cross-module deep links (e.g. M02 inbox, M01 summaries).
 */

import { WORKFORCE_CONTRACT_VERSION, type WorkforceRefBase } from "./common";

export type RosterPeriodLifecycleState =
  | "draft"
  | "under_review"
  | "ready_to_publish"
  | "published"
  | "superseded"
  | "cancelled"
  | "archived";

export interface RosterPeriodRef extends WorkforceRefBase {
  owningModuleId: "roster";
  rosterPeriodId: string;
  label: string;
  startsOn: string;
  endsOn: string;
  lifecycleState: RosterPeriodLifecycleState;
  timeZoneId?: string;
}

export function createRosterPeriodRef(
  input: Omit<RosterPeriodRef, "contractVersion" | "owningModuleId" | "route" | "displayLabel"> & {
    route?: string;
    displayLabel?: string;
    section?: string;
  }
): RosterPeriodRef {
  return {
    contractVersion: WORKFORCE_CONTRACT_VERSION,
    owningModuleId: "roster",
    recordId: input.recordId,
    clinicId: input.clinicId,
    organisationId: input.organisationId,
    status: input.status,
    route: input.route ?? "/roster",
    section: input.section ?? "roster-board",
    displayLabel: input.displayLabel ?? input.label,
    rosterPeriodId: input.rosterPeriodId,
    label: input.label,
    startsOn: input.startsOn,
    endsOn: input.endsOn,
    lifecycleState: input.lifecycleState,
    timeZoneId: input.timeZoneId,
  };
}
