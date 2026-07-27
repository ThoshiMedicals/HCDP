/**
 * Shared workforce reference base and contract versioning.
 * Cross-module refs must not duplicate owning-module business records.
 */

export const WORKFORCE_CONTRACT_VERSION = 1 as const;

/** Owning platform module ids for the connected workforce family. */
export type WorkforceOwningModuleId =
  | "staff-doctors"
  | "roster"
  | "time-attendance"
  | "staff-pay"
  | "training"
  | "recruitment";

/**
 * Every cross-module workforce reference includes owning module, record id,
 * clinic/organisation scope, status, route and safe display label.
 */
export interface WorkforceRefBase {
  contractVersion: typeof WORKFORCE_CONTRACT_VERSION;
  owningModuleId: WorkforceOwningModuleId;
  recordId: string;
  clinicId?: string;
  organisationId?: string;
  status: string;
  route: string;
  section?: string;
  displayLabel: string;
}

export function workforceRefKey(
  ref: Pick<WorkforceRefBase, "owningModuleId" | "recordId">
): string {
  return `${ref.owningModuleId}::${ref.recordId}`;
}
