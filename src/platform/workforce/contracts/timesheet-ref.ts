import {
  WORKFORCE_CONTRACT_VERSION,
  type WorkforceRefBase,
} from "./common";

/** Approved timesheet reference — owned by M06; consumed by M07. */
export interface TimesheetRef extends WorkforceRefBase {
  owningModuleId: "time-attendance";
  personId: string;
  periodStart: string;
  periodEnd: string;
  approved: boolean;
  /** Additive optional publish metadata (Wave 5) — never required for existing consumers. */
  sourceVersion?: number;
  publishedAt?: string;
  idempotencyKey?: string;
  attendanceSessionIds?: string[];
}

export function createTimesheetRef(
  input: Omit<TimesheetRef, "contractVersion" | "owningModuleId" | "route" | "displayLabel"> & {
    route?: string;
    displayLabel?: string;
    section?: string;
  }
): TimesheetRef {
  return {
    contractVersion: WORKFORCE_CONTRACT_VERSION,
    owningModuleId: "time-attendance",
    recordId: input.recordId,
    clinicId: input.clinicId,
    organisationId: input.organisationId,
    status: input.status,
    route: input.route ?? "/time-attendance",
    section: input.section ?? "timesheets",
    displayLabel: input.displayLabel ?? `Timesheet ${input.recordId}`,
    personId: input.personId,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    approved: input.approved,
    sourceVersion: input.sourceVersion,
    publishedAt: input.publishedAt,
    idempotencyKey: input.idempotencyKey,
    attendanceSessionIds: input.attendanceSessionIds,
  };
}
