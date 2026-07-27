/**
 * Swap request reference — owned by M05.
 * Points at a swap workflow row. Final eligibility must be revalidated in M05
 * via M04/platform authority at approval time.
 */

import { WORKFORCE_CONTRACT_VERSION, type WorkforceRefBase } from "./common";

export type SwapRequestLifecycleStatus =
  | "requested"
  | "proposed"
  | "recipient_accepted"
  | "approved"
  | "rejected"
  | "withdrawn"
  | "expired";

export interface SwapRequestRef extends WorkforceRefBase {
  owningModuleId: "roster";
  swapRequestId: string;
  shiftId: string;
  rosterPeriodId: string;
  requesterPersonId: string;
  recipientPersonId?: string | null;
  lifecycleStatus: SwapRequestLifecycleStatus;
  requestedAt: string;
  resolvedAt?: string | null;
}

export function createSwapRequestRef(
  input: Omit<SwapRequestRef, "contractVersion" | "owningModuleId" | "route" | "displayLabel"> & {
    route?: string;
    displayLabel?: string;
    section?: string;
  }
): SwapRequestRef {
  return {
    contractVersion: WORKFORCE_CONTRACT_VERSION,
    owningModuleId: "roster",
    recordId: input.recordId,
    clinicId: input.clinicId,
    organisationId: input.organisationId,
    status: input.status,
    route: input.route ?? "/roster",
    section: input.section ?? "requests",
    displayLabel:
      input.displayLabel ?? `Swap ${input.swapRequestId} for shift ${input.shiftId}`,
    swapRequestId: input.swapRequestId,
    shiftId: input.shiftId,
    rosterPeriodId: input.rosterPeriodId,
    requesterPersonId: input.requesterPersonId,
    recipientPersonId: input.recipientPersonId ?? null,
    lifecycleStatus: input.lifecycleStatus,
    requestedAt: input.requestedAt,
    resolvedAt: input.resolvedAt ?? null,
  };
}
