/**
 * M06 → M07 acknowledgement boundary.
 *
 * Must stay consistent with M07 `getM07TimesheetIntakeBlockerStatus()`
 * (M06 must not import M07 modules). Checkpoint 2.7B clears the global blocker.
 * This bridge still does not write pulse.m07.* or invent payroll truth.
 */

export const M06_M07_BRIDGE_CLEARANCE_CODE = "CLEARED-M07-BATCH2" as const;

export type M07IntakeResult = {
  blocked: boolean;
  workflowEvidenceCode: "BLOCKED-M07" | "CLEARED-M07-BATCH2";
  message: string;
};

export function acknowledgeApprovedTimesheetIntake(_timesheetId: string): M07IntakeResult {
  return {
    blocked: false,
    workflowEvidenceCode: M06_M07_BRIDGE_CLEARANCE_CODE,
    message:
      "M07 Batch 2 published-timesheet acknowledgement boundary cleared (owner-authorised Checkpoint 2.7B). M06 must not write pulse.m07.* or invent payroll truth; intake remains M07-owned via the platform registry path.",
  };
}
