/**
 * Roster shift assignment reference — owned by M05.
 * Assignment history is append-only in M05; this ref points at the current
 * assignment row for the shift.
 */

import { WORKFORCE_CONTRACT_VERSION, type WorkforceRefBase } from "./common";

export type RosterAssignmentStatus =
  | "assigned"
  | "replaced"
  | "cancelled"
  | "invalidated"
  | "superseded";

export interface AssignmentRef extends WorkforceRefBase {
  owningModuleId: "roster";
  assignmentId: string;
  shiftId: string;
  rosterPeriodId: string;
  personId: string;
  assignmentStatus: RosterAssignmentStatus;
  assignedAt: string;
  publicationId?: string | null;
  overrideReason?: string | null;
}

export function createAssignmentRef(
  input: Omit<AssignmentRef, "contractVersion" | "owningModuleId" | "route" | "displayLabel"> & {
    route?: string;
    displayLabel?: string;
    section?: string;
  }
): AssignmentRef {
  return {
    contractVersion: WORKFORCE_CONTRACT_VERSION,
    owningModuleId: "roster",
    recordId: input.recordId,
    clinicId: input.clinicId,
    organisationId: input.organisationId,
    status: input.status,
    route: input.route ?? "/roster",
    section: input.section ?? "roster-board",
    displayLabel:
      input.displayLabel ?? `Assignment ${input.assignmentId} — ${input.personId}`,
    assignmentId: input.assignmentId,
    shiftId: input.shiftId,
    rosterPeriodId: input.rosterPeriodId,
    personId: input.personId,
    assignmentStatus: input.assignmentStatus,
    assignedAt: input.assignedAt,
    publicationId: input.publicationId ?? null,
    overrideReason: input.overrideReason ?? null,
  };
}
