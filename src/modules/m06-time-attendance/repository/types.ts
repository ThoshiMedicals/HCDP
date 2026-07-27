/**
 * M06 repository interfaces — attendance / timesheet SoT.
 * Shifts referenced via ShiftRef; people via WorkforcePersonRef.
 */

import type { AttendanceRef } from "@/platform/workforce/contracts/attendance-ref";
import type { TimesheetRef } from "@/platform/workforce/contracts/timesheet-ref";
import type { ShiftRef } from "@/platform/workforce/contracts/shift-ref";

export interface M06AttendanceRepository {
  listEvents(personId?: string): AttendanceRef[];
  getEvent(id: string): AttendanceRef | null;
  upsertEvent(event: AttendanceRef): void;
  listTimesheets(personId?: string): TimesheetRef[];
  getTimesheet(id: string): TimesheetRef | null;
  upsertTimesheet(timesheet: TimesheetRef): void;
  /** Resolve linked shift via M05 ref — never edit M05 repository. */
  resolveShift(shiftId: string): ShiftRef | null;
}

export type M06Repositories = {
  attendance: M06AttendanceRepository;
};
