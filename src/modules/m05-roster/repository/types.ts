/**
 * M05 repository interfaces — roster / shift SoT.
 * People are referenced via WorkforcePersonRef only.
 */

import type { ShiftRef } from "@/platform/workforce/contracts/shift-ref";
import type { WorkforcePersonRef } from "@/platform/workforce/contracts/workforce-person-ref";

export interface RosterPeriodRecord {
  id: string;
  label: string;
  startsOn: string;
  endsOn: string;
  status: string;
  clinicId?: string;
}

export interface M05RosterRepository {
  listPeriods(): RosterPeriodRecord[];
  getPeriod(id: string): RosterPeriodRecord | null;
  upsertPeriod(period: RosterPeriodRecord): void;
  listShifts(periodId?: string): ShiftRef[];
  getShift(id: string): ShiftRef | null;
  upsertShift(shift: ShiftRef): void;
  /** Resolve assigned worker via M04 person ref — never duplicate person rows. */
  resolveAssignedPerson(personId: string): WorkforcePersonRef | null;
}

export type M05Repositories = {
  roster: M05RosterRepository;
};
