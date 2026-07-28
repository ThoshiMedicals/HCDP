/**
 * Batch 6 — pre-export readiness validation (failure-closed).
 */

import type { M07Actor } from "../permissions";
import {
  getCalculationBatch,
  getCode,
  getLeavePrepLine,
  getProfile,
  listExceptions,
} from "../repository/local-store";
import type {
  ExportValidationIssue,
  PayPeriodApproval,
  PayPeriodRecord,
} from "../types/domain";
import { unitsEqual } from "./export-decimal";

function issue(
  partial: Omit<ExportValidationIssue, "legalEntityId" | "periodId"> & {
    legalEntityId?: string;
    periodId?: string;
  },
  period: PayPeriodRecord
): ExportValidationIssue {
  return {
    ...partial,
    legalEntityId: partial.legalEntityId ?? period.legalEntityId,
    periodId: partial.periodId ?? period.id,
  };
}

/**
 * Validate approved package for export readiness. Does not mutate state.
 */
export function validateExportReadiness(
  _actor: M07Actor,
  input: {
    period: PayPeriodRecord;
    approval: PayPeriodApproval;
    batchId?: string;
  }
): { ok: boolean; issues: ExportValidationIssue[] } {
  const { period, approval } = input;
  const issues: ExportValidationIssue[] = [];
  const manifest = approval.manifest;

  if (approval.legalEntityId !== period.legalEntityId) {
    issues.push(
      issue(
        {
          code: "cross-legal-entity",
          severity: "blocking",
          message: "Approval legal entity does not match period",
          remediation: "Use the approval package for this legal entity only",
        },
        period
      )
    );
  }

  if (manifest.legalEntityId !== period.legalEntityId) {
    issues.push(
      issue(
        {
          code: "manifest-legal-entity",
          severity: "blocking",
          message: "Manifest legal entity does not match period",
        },
        period
      )
    );
  }

  const unresolved = listExceptions(period.legalEntityId).filter(
    (e) =>
      e.periodId === period.id &&
      !["resolved", "waived", "cancelled"].includes(e.status)
  );
  for (const ex of unresolved) {
    issues.push(
      issue(
        {
          code: "unresolved-exception",
          severity: "blocking",
          message: `Unresolved exception ${ex.kind}: ${ex.message}`,
          personId: ex.personId,
          field: "exception",
          remediation: "Resolve or waive the exception before export",
          batchId: input.batchId,
        },
        period
      )
    );
  }

  if (!manifest.eligiblePersonIds.length) {
    issues.push(
      issue(
        {
          code: "empty-population",
          severity: "blocking",
          message: "Approved package has empty eligible population",
        },
        period
      )
    );
  }

  if (manifest.readinessStatus !== "ready") {
    issues.push(
      issue(
        {
          code: "readiness-not-ready",
          severity: "blocking",
          message: `Pinned readiness status is ${manifest.readinessStatus}`,
        },
        period
      )
    );
  }

  const seenExternal = new Map<string, string>();

  for (const personId of manifest.eligiblePersonIds) {
    const profilePin = manifest.profiles.find((p) => p.personId === personId);
    const profile = profilePin ? getProfile(profilePin.profileId) : null;
    if (!profile) {
      issues.push(
        issue(
          {
            code: "missing-profile",
            severity: "blocking",
            message: `Missing pay profile for eligible person ${personId}`,
            personId,
            profileId: profilePin?.profileId,
            remediation: "Ensure profile is pinned and present",
          },
          period
        )
      );
      continue;
    }

    const externalId = profile.externalPayrollEmployeeId?.trim();
    if (!externalId) {
      issues.push(
        issue(
          {
            code: "missing-external-payroll-employee-id",
            severity: "blocking",
            message: `Required external payroll employee ID missing for ${personId}`,
            personId,
            profileId: profile.id,
            field: "externalPayrollEmployeeId",
            remediation: "Link externalPayrollEmployeeId on the pay profile",
          },
          period
        )
      );
    } else {
      const prior = seenExternal.get(externalId);
      if (prior && prior !== personId) {
        issues.push(
          issue(
            {
              code: "duplicate-external-payroll-employee-id",
              severity: "blocking",
              message: `Duplicate external payroll employee ID ${externalId}`,
              personId,
              profileId: profile.id,
              field: "externalPayrollEmployeeId",
              remediation: "Ensure uniqueness within legal entity",
            },
            period
          )
        );
      } else {
        seenExternal.set(externalId, personId);
      }
    }

    const calcPin = manifest.calculations.find((c) => c.personId === personId);
    if (!calcPin) {
      issues.push(
        issue(
          {
            code: "missing-calculation",
            severity: "blocking",
            message: `No pinned calculation for eligible person ${personId}`,
            personId,
          },
          period
        )
      );
      continue;
    }
    const batch = getCalculationBatch(calcPin.batchId);
    if (!batch || batch.status !== "completed") {
      issues.push(
        issue(
          {
            code: "calculation-not-completed",
            severity: "blocking",
            message: `Calculation batch ${calcPin.batchId} is missing or not completed`,
            personId,
            sourceLineId: calcPin.batchId,
          },
          period
        )
      );
      continue;
    }

    const seenSourceLines = new Set<string>();
    for (const line of batch.lines) {
      if (seenSourceLines.has(line.id)) {
        issues.push(
          issue(
            {
              code: "duplicate-source-line",
              severity: "blocking",
              message: `Duplicate source line ${line.id}`,
              personId,
              sourceLineId: line.id,
            },
            period
          )
        );
      }
      seenSourceLines.add(line.id);

      if (line.hours < 0 || (line.quantity != null && line.quantity < 0)) {
        issues.push(
          issue(
            {
              code: "negative-value",
              severity: "blocking",
              message: `Negative units on source line ${line.id}`,
              personId,
              sourceLineId: line.id,
              field: "hours",
              remediation: "Correct upstream calculation; prior-period adjustments are out of Batch 6 scope",
            },
            period
          )
        );
      }

      if (
        (line.lineType === "ordinary" || line.lineType === "overtime") &&
        unitsEqual(line.hours, 0)
      ) {
        // Allowed zero ordinary/OT lines as warnings only when explicitly zero hours
        issues.push(
          issue(
            {
              code: "zero-value-line",
              severity: "warning",
              message: `Zero-hour ${line.lineType} line ${line.id}`,
              personId,
              sourceLineId: line.id,
            },
            period
          )
        );
      }

      if ((line.lineType === "allowance" || line.lineType === "deduction") && line.codeId) {
        const code = getCode(line.codeId);
        if (!code || code.status === "retired") {
          issues.push(
            issue(
              {
                code: "unmapped-code",
                severity: "blocking",
                message: `Unsupported ${line.lineType} code for line ${line.id}`,
                personId,
                sourceLineId: line.id,
                field: "codeId",
                mapping: line.code,
                remediation: "Activate a supported code mapping",
              },
              period
            )
          );
        }
      }

      if (!line.code && (line.lineType === "ordinary" || line.lineType === "overtime")) {
        issues.push(
          issue(
            {
              code: "unmapped-earning-code",
              severity: "blocking",
              message: `Missing earning code on ${line.lineType} line ${line.id}`,
              personId,
              sourceLineId: line.id,
              field: "code",
            },
            period
          )
        );
      }
    }
  }

  for (const leave of manifest.leavePrep) {
    const row = getLeavePrepLine(leave.leavePrepLineId);
    if (!row) {
      issues.push(
        issue(
          {
            code: "missing-leave-prep",
            severity: "blocking",
            message: `Pinned leave prep ${leave.leavePrepLineId} missing`,
            personId: leave.personId,
            sourceLineId: leave.leavePrepLineId,
          },
          period
        )
      );
      continue;
    }
    if (row.status === "blocked") {
      issues.push(
        issue(
          {
            code: "leave-prep-blocked",
            severity: "blocking",
            message: `Leave prep line blocked for ${leave.personId}`,
            personId: leave.personId,
            sourceLineId: row.id,
          },
          period
        )
      );
    }
    if (!row.leavePayMapping && !row.leaveType) {
      issues.push(
        issue(
          {
            code: "unmapped-leave-code",
            severity: "blocking",
            message: `Unmapped leave type on ${row.id}`,
            personId: leave.personId,
            sourceLineId: row.id,
            field: "leaveType",
          },
          period
        )
      );
    }
  }

  const blocking = issues.filter((i) => i.severity === "blocking");
  return { ok: blocking.length === 0, issues };
}
