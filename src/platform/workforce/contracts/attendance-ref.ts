import {
  WORKFORCE_CONTRACT_VERSION,
  type WorkforceRefBase,
} from "./common";

/** Clock / attendance event reference — owned by M06. */
export interface AttendanceRef extends WorkforceRefBase {
  owningModuleId: "time-attendance";
  personId: string;
  shiftId?: string;
  eventType: "clock-in" | "clock-out" | "break-start" | "break-end" | "correction";
  occurredAt: string;
}

export function createAttendanceRef(
  input: Omit<AttendanceRef, "contractVersion" | "owningModuleId" | "route" | "displayLabel"> & {
    route?: string;
    displayLabel?: string;
    section?: string;
  }
): AttendanceRef {
  return {
    contractVersion: WORKFORCE_CONTRACT_VERSION,
    owningModuleId: "time-attendance",
    recordId: input.recordId,
    clinicId: input.clinicId,
    organisationId: input.organisationId,
    status: input.status,
    route: input.route ?? "/time-attendance",
    section: input.section ?? "clock-events",
    displayLabel: input.displayLabel ?? `${input.eventType} — ${input.personId}`,
    personId: input.personId,
    shiftId: input.shiftId,
    eventType: input.eventType,
    occurredAt: input.occurredAt,
  };
}
