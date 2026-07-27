import {
  WORKFORCE_CONTRACT_VERSION,
  type WorkforceRefBase,
} from "./common";

/** Effective-dated engagement / role / clinic scope — owned by M04. */
export interface EngagementRef extends WorkforceRefBase {
  owningModuleId: "staff-doctors";
  personId: string;
  roleLabel: string;
  employmentType?: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
}

export function createEngagementRef(
  input: Omit<EngagementRef, "contractVersion" | "owningModuleId" | "route" | "displayLabel"> & {
    route?: string;
    displayLabel?: string;
    section?: string;
  }
): EngagementRef {
  return {
    contractVersion: WORKFORCE_CONTRACT_VERSION,
    owningModuleId: "staff-doctors",
    recordId: input.recordId,
    clinicId: input.clinicId,
    organisationId: input.organisationId,
    status: input.status,
    route: input.route ?? "/staff-doctors",
    section: input.section ?? "employment",
    displayLabel: input.displayLabel ?? `${input.roleLabel} (${input.personId})`,
    personId: input.personId,
    roleLabel: input.roleLabel,
    employmentType: input.employmentType,
    effectiveFrom: input.effectiveFrom,
    effectiveTo: input.effectiveTo ?? null,
  };
}
