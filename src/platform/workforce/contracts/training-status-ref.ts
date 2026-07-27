import {
  WORKFORCE_CONTRACT_VERSION,
  type WorkforceRefBase,
} from "./common";

/** Training / competency status — owned by M11; referenced by M04 readiness contributions. */
export interface TrainingStatusRef extends WorkforceRefBase {
  owningModuleId: "training";
  personId: string;
  requirementId: string;
  requirementLabel: string;
  completedOn?: string | null;
  expiresOn?: string | null;
  competencyMet: boolean;
  /** Rule that produced this status (traceability). */
  ruleId?: string;
  ruleVersion?: number;
  /** Source event that last triggered evaluation (idempotent replay). */
  sourceEventId?: string;
}

export function createTrainingStatusRef(
  input: Omit<TrainingStatusRef, "contractVersion" | "owningModuleId" | "route" | "displayLabel"> & {
    route?: string;
    displayLabel?: string;
    section?: string;
  }
): TrainingStatusRef {
  return {
    contractVersion: WORKFORCE_CONTRACT_VERSION,
    owningModuleId: "training",
    recordId: input.recordId,
    clinicId: input.clinicId,
    organisationId: input.organisationId,
    status: input.status,
    route: input.route ?? "/training",
    section: input.section ?? "records",
    displayLabel: input.displayLabel ?? input.requirementLabel,
    personId: input.personId,
    requirementId: input.requirementId,
    requirementLabel: input.requirementLabel,
    completedOn: input.completedOn ?? null,
    expiresOn: input.expiresOn ?? null,
    competencyMet: input.competencyMet,
    ruleId: input.ruleId,
    ruleVersion: input.ruleVersion,
    sourceEventId: input.sourceEventId,
  };
}
