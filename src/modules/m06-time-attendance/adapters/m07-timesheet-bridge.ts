/**
 * M07 intake bridge — BLOCKED-M07 until Wave 6.
 * Must not write pulse.m07.* or simulate successful intake.
 */

export type M07IntakeResult = {
  blocked: true;
  workflowEvidenceCode: "BLOCKED-M07";
  message: string;
};

export function acknowledgeApprovedTimesheetIntake(_timesheetId: string): M07IntakeResult {
  return {
    blocked: true,
    workflowEvidenceCode: "BLOCKED-M07",
    message:
      "M07-owned timesheet intake contract is not available. M06 may publish TimesheetRef events but must not write pulse.m07.* or invent payroll truth.",
  };
}
