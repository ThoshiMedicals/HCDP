import {
  WORKFORCE_CONTRACT_VERSION,
  type WorkforceRefBase,
} from "./common";

/** Pay period / payroll preparation reference — owned by M07. */
export interface PayPeriodRef extends WorkforceRefBase {
  owningModuleId: "staff-pay";
  periodStart: string;
  periodEnd: string;
  exportCreated: boolean;
  locked: boolean;
}

export function createPayPeriodRef(
  input: Omit<PayPeriodRef, "contractVersion" | "owningModuleId" | "route" | "displayLabel"> & {
    route?: string;
    displayLabel?: string;
    section?: string;
  }
): PayPeriodRef {
  return {
    contractVersion: WORKFORCE_CONTRACT_VERSION,
    owningModuleId: "staff-pay",
    recordId: input.recordId,
    clinicId: input.clinicId,
    organisationId: input.organisationId,
    status: input.status,
    route: input.route ?? "/staffpay",
    section: input.section ?? "pay-prep",
    displayLabel: input.displayLabel ?? `Pay period ${input.recordId}`,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    exportCreated: input.exportCreated,
    locked: input.locked,
  };
}
