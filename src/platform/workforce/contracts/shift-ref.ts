import {
  WORKFORCE_CONTRACT_VERSION,
  type WorkforceRefBase,
} from "./common";

/** Roster shift reference — owned by M05. */
export interface ShiftRef extends WorkforceRefBase {
  owningModuleId: "roster";
  rosterPeriodId: string;
  personId?: string;
  startsAt: string;
  endsAt: string;
  roleLabel?: string;
  published: boolean;
}

export function createShiftRef(
  input: Omit<ShiftRef, "contractVersion" | "owningModuleId" | "route" | "displayLabel"> & {
    route?: string;
    displayLabel?: string;
    section?: string;
  }
): ShiftRef {
  return {
    contractVersion: WORKFORCE_CONTRACT_VERSION,
    owningModuleId: "roster",
    recordId: input.recordId,
    clinicId: input.clinicId,
    organisationId: input.organisationId,
    status: input.status,
    route: input.route ?? "/roster",
    section: input.section ?? "roster-grid",
    displayLabel:
      input.displayLabel ??
      `Shift ${input.recordId}${input.personId ? ` — ${input.personId}` : ""}`,
    rosterPeriodId: input.rosterPeriodId,
    personId: input.personId,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    roleLabel: input.roleLabel,
    published: input.published,
  };
}
