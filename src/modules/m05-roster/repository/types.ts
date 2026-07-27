/**
 * M05 repository interfaces — roster / shift SoT.
 * People are referenced via WorkforcePersonRef only.
 *
 * Wave 4 additive expansion: exposes snapshot types + additive repository
 * shape covering full M05 domain. Wave 1 `RosterPeriodRecord` / `ShiftRef`
 * usage is preserved for backward compatibility.
 */

import type { ShiftRef } from "@/platform/workforce/contracts/shift-ref";
import type { WorkforcePersonRef } from "@/platform/workforce/contracts/workforce-person-ref";
import type {
  Acknowledgement,
  Assignment,
  CostForecast,
  CoverageRequirement,
  OpenShift,
  RosterAuditEntry,
  RosterAvailabilityDeclaration,
  RosterPeriod,
  RosterPublication,
  Shift,
  SwapRequest,
} from "../types/domain";
import type { ConflictPolicy } from "../types/policy";

/** Backward-compatible Wave 1 skeleton record. */
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

/** Wave 4 in-memory snapshot shape (test helpers, coverage/reporting reads). */
export interface M05StoreSnapshot {
  periods: RosterPeriod[];
  shifts: Shift[];
  assignments: Assignment[];
  openShifts: OpenShift[];
  swaps: SwapRequest[];
  publications: RosterPublication[];
  acknowledgements: Acknowledgement[];
  coverageRequirements: CoverageRequirement[];
  policies: ConflictPolicy[];
  costForecasts: CostForecast[];
  audit: RosterAuditEntry[];
  availabilityDeclarations: RosterAvailabilityDeclaration[];
}
