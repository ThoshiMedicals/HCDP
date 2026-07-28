/**
 * M07 → M06 approved-timesheet intake boundary (Batch 1 interface only).
 * BOUNDARY: no M06 repository imports; no pulse.m07.* writes from this adapter.
 * Full intake consumer is NOT implemented in Batch 1 — BLOCKED-M07 remains unresolved.
 */

import type { TimesheetRef } from "@/platform/workforce/contracts/timesheet-ref";
import { readJsonSafe } from "@/platform/storage/storage";

const TIMESHEETS_KEY = "pulse.m06.attendance.timesheets";

export type ApprovedTimesheetReadView = {
  timesheetRecordId: string;
  personId: string;
  clinicId?: string;
  organisationId?: string;
  periodStart?: string;
  periodEnd?: string;
  approved: boolean;
  sourceVersion?: number;
  readOnly: true;
};

/**
 * Read approved timesheet publications for future intake.
 * Does not link into M07 periods in Batch 1.
 */
export function listApprovedTimesheetRefs(): ApprovedTimesheetReadView[] {
  const rows = readJsonSafe<Array<Record<string, unknown>>>(TIMESHEETS_KEY, []);
  return rows
    .filter((r) => r.approved === true || r.state === "approved")
    .map((r) => ({
      timesheetRecordId: String(r.id ?? r.recordId),
      personId: String(r.personId ?? ""),
      clinicId: r.clinicId ? String(r.clinicId) : undefined,
      organisationId: r.organisationId ? String(r.organisationId) : undefined,
      periodStart: r.periodStart ? String(r.periodStart) : undefined,
      periodEnd: r.periodEnd ? String(r.periodEnd) : undefined,
      approved: true,
      sourceVersion: typeof r.sourceVersion === "number" ? r.sourceVersion : undefined,
      readOnly: true as const,
    }));
}

/** Placeholder for Batch 2+ — explicitly unavailable. */
export function linkApprovedTimesheetToPeriod(
  _periodId: string,
  _timesheet: TimesheetRef
): { ok: false; code: "BATCH1_INTAKE_NOT_IMPLEMENTED" } {
  return { ok: false, code: "BATCH1_INTAKE_NOT_IMPLEMENTED" };
}

export const M07_M06_TIMESHEET_READ_SOURCE = "pulse.m06.attendance.timesheets" as const;
export const M07_INTAKE_BATCH1_STATUS = "not-implemented" as const;
