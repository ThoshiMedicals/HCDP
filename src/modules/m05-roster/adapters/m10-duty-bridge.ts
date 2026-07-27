/**
 * M05 → M10 duty task bridge — DEFERRED (§22 of the plan).
 *
 * At Wave 4 execution the M10 opening/closing duty contract is not present
 * or not safe to bridge without accidentally creating a second task SoT in
 * M05. This adapter therefore blocks all calls with an explainable reason
 * and documents the deferral. Workflow #12 evidence should record as
 * `BLOCKED-M10`, not skipped silently.
 *
 * When M10 exposes a task/reference contract, replace this file with a
 * proper bridge — but DO NOT create competing M05-owned duty task records.
 */

export const M10_DUTY_BRIDGE_STATUS = "deferred" as const;

export const M10_DUTY_BRIDGE_DEFERRAL_REASON =
  "M10 duty task contract not present at Wave 4 execution start; M05 must not own general tasks. See WAVE4_M05_IMPLEMENTATION_PLAN.md §22.";

export interface TransferOpeningClosingDutiesInput {
  publicationId: string;
  shiftIds: string[];
  clinicId: string;
  organisationId?: string;
  actor: string;
}

export interface TransferOpeningClosingDutiesResult {
  blocked: true;
  reason: string;
  status: typeof M10_DUTY_BRIDGE_STATUS;
  publicationId: string;
  clinicId: string;
  shiftIds: string[];
  workflowEvidenceCode: "BLOCKED-M10";
}

/**
 * Placeholder bridge for opening/closing duty transfer.
 * Always returns `{ blocked: true }` in Wave 4 execution.
 */
export function transferOpeningClosingDuties(
  input: TransferOpeningClosingDutiesInput
): TransferOpeningClosingDutiesResult {
  return {
    blocked: true,
    reason: M10_DUTY_BRIDGE_DEFERRAL_REASON,
    status: M10_DUTY_BRIDGE_STATUS,
    publicationId: input.publicationId,
    clinicId: input.clinicId,
    shiftIds: input.shiftIds,
    workflowEvidenceCode: "BLOCKED-M10",
  };
}
