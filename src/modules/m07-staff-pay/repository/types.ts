/**
 * M07 repository interfaces — payroll preparation SoT.
 * Consumes TimesheetRef / WorkforcePersonRef; never edits M04/M06 repositories.
 */

import type { PayPeriodRef } from "@/platform/workforce/contracts/pay-period-ref";
import type { TimesheetRef } from "@/platform/workforce/contracts/timesheet-ref";
import type { WorkforcePersonRef } from "@/platform/workforce/contracts/workforce-person-ref";

export interface M07StaffPayRepository {
  listPeriods(): PayPeriodRef[];
  getPeriod(id: string): PayPeriodRef | null;
  upsertPeriod(period: PayPeriodRef): void;
  /** Import approved timesheets by reference only. */
  linkApprovedTimesheet(periodId: string, timesheet: TimesheetRef): void;
  resolvePerson(personId: string): WorkforcePersonRef | null;
}

export type M07Repositories = {
  staffPay: M07StaffPayRepository;
};
