import {
  WORKFORCE_CONTRACT_VERSION,
  type WorkforceRefBase,
} from "./common";

export type WorkforcePersonKind = "staff" | "doctor" | "contractor" | "locum";

/** Stable person reference — M04 is the sole person source of truth after promotion. */
export interface WorkforcePersonRef extends WorkforceRefBase {
  owningModuleId: "staff-doctors";
  personKind: WorkforcePersonKind;
  preferredName: string;
  engagementId?: string;
}

export function createWorkforcePersonRef(
  input: Omit<WorkforcePersonRef, "contractVersion" | "owningModuleId" | "route" | "displayLabel"> & {
    route?: string;
    displayLabel?: string;
    section?: string;
  }
): WorkforcePersonRef {
  return {
    contractVersion: WORKFORCE_CONTRACT_VERSION,
    owningModuleId: "staff-doctors",
    recordId: input.recordId,
    clinicId: input.clinicId,
    organisationId: input.organisationId,
    status: input.status,
    route: input.route ?? "/staff-doctors",
    section: input.section ?? "staff",
    displayLabel: input.displayLabel ?? input.preferredName,
    personKind: input.personKind,
    preferredName: input.preferredName,
    engagementId: input.engagementId,
  };
}
