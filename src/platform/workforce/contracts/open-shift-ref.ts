/**
 * Open-shift reference — owned by M05.
 * Represents a shift released as an open shift (audience, EOI, selection).
 */

import { WORKFORCE_CONTRACT_VERSION, type WorkforceRefBase } from "./common";

export type OpenShiftLifecycleStatus =
  | "open"
  | "offered"
  | "eoi_received"
  | "selected"
  | "closed"
  | "withdrawn"
  | "expired"
  | "escalated";

export interface OpenShiftRef extends WorkforceRefBase {
  owningModuleId: "roster";
  openShiftId: string;
  shiftId: string;
  rosterPeriodId: string;
  lifecycleStatus: OpenShiftLifecycleStatus;
  offeredAt?: string;
  closedAt?: string | null;
}

export function createOpenShiftRef(
  input: Omit<OpenShiftRef, "contractVersion" | "owningModuleId" | "route" | "displayLabel"> & {
    route?: string;
    displayLabel?: string;
    section?: string;
  }
): OpenShiftRef {
  return {
    contractVersion: WORKFORCE_CONTRACT_VERSION,
    owningModuleId: "roster",
    recordId: input.recordId,
    clinicId: input.clinicId,
    organisationId: input.organisationId,
    status: input.status,
    route: input.route ?? "/roster",
    section: input.section ?? "open-shifts",
    displayLabel: input.displayLabel ?? `Open shift ${input.openShiftId}`,
    openShiftId: input.openShiftId,
    shiftId: input.shiftId,
    rosterPeriodId: input.rosterPeriodId,
    lifecycleStatus: input.lifecycleStatus,
    offeredAt: input.offeredAt,
    closedAt: input.closedAt ?? null,
  };
}
