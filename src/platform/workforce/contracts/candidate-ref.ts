import {
  WORKFORCE_CONTRACT_VERSION,
  type WorkforceRefBase,
} from "./common";

/** Candidate reference until approved promotion to M04 — owned by M22. */
export interface CandidateRef extends WorkforceRefBase {
  owningModuleId: "recruitment";
  preferredName: string;
  vacancyId?: string;
  stage: string;
  promotedPersonId?: string | null;
}

export function createCandidateRef(
  input: Omit<CandidateRef, "contractVersion" | "owningModuleId" | "route" | "displayLabel"> & {
    route?: string;
    displayLabel?: string;
    section?: string;
  }
): CandidateRef {
  return {
    contractVersion: WORKFORCE_CONTRACT_VERSION,
    owningModuleId: "recruitment",
    recordId: input.recordId,
    clinicId: input.clinicId,
    organisationId: input.organisationId,
    status: input.status,
    route: input.route ?? "/recruitment",
    section: input.section ?? "candidates",
    displayLabel: input.displayLabel ?? input.preferredName,
    preferredName: input.preferredName,
    vacancyId: input.vacancyId,
    stage: input.stage,
    promotedPersonId: input.promotedPersonId ?? null,
  };
}
