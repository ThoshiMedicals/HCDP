import {
  WORKFORCE_CONTRACT_VERSION,
  type WorkforceRefBase,
} from "./common";

export type ReadinessLevel = "ready" | "blocked" | "advisory" | "unknown";

export interface ReadinessBlocker {
  code: string;
  label: string;
  owningModuleId: string;
  sourceRecordId?: string;
  severity: "blocking" | "advisory";
}

/** Aggregated workforce readiness projection for roster eligibility and M01 summaries. */
export interface ReadinessRef extends WorkforceRefBase {
  owningModuleId: "staff-doctors";
  personId: string;
  readiness: ReadinessLevel;
  blockers: ReadinessBlocker[];
  asOf: string;
}

export function createReadinessRef(
  input: Omit<ReadinessRef, "contractVersion" | "owningModuleId" | "route" | "displayLabel"> & {
    route?: string;
    displayLabel?: string;
    section?: string;
  }
): ReadinessRef {
  return {
    contractVersion: WORKFORCE_CONTRACT_VERSION,
    owningModuleId: "staff-doctors",
    recordId: input.recordId,
    clinicId: input.clinicId,
    organisationId: input.organisationId,
    status: input.status,
    route: input.route ?? "/staff-doctors",
    section: input.section ?? "staff",
    displayLabel: input.displayLabel ?? `Readiness ${input.readiness} — ${input.personId}`,
    personId: input.personId,
    readiness: input.readiness,
    blockers: input.blockers,
    asOf: input.asOf,
  };
}
