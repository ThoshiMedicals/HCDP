/**
 * M04 approved-leave preparation lines (Batch 3 CP 3.4).
 * Never infers leave from M06 snapshot leaveInputs.
 */

import {
  assertM07ClinicScope,
  assertM07LegalEntityScope,
  assertM07Permission,
  M07ValidationError,
  type M07Actor,
} from "../permissions";
import {
  getPeriod,
  listLeavePrepLines,
  listProfiles,
  newLeavePrepLineId,
  upsertLeavePrepLine,
} from "../repository/local-store";
import {
  computeInclusiveLeaveDays,
  listApprovedLeaveForPerson,
} from "../adapters/m04-leave-read";
import {
  M07_NON_CERTIFIED_DISCLAIMER,
  type LeavePrepLine,
} from "../types/domain";
import { isDoctorPayExcluded } from "./classification-resolve";
import { openPayPrepException } from "./exception-service";
import { recordM07Audit } from "./audit-service";
import { assertNoProhibitedFields } from "./sensitive-fields";
import { invalidateApprovalIfSourcesChanged } from "./approval-invalidation";

export function listLeavePreparation(
  actor: M07Actor,
  legalEntityId: string,
  filter?: { periodId?: string; personId?: string }
): LeavePrepLine[] {
  assertM07Permission(actor, "payroll.view");
  assertM07LegalEntityScope(actor, legalEntityId);
  return listLeavePrepLines(legalEntityId)
    .filter((l) => (filter?.periodId ? l.periodId === filter.periodId : true))
    .filter((l) => (filter?.personId ? l.personId === filter.personId : true))
    .filter((l) => {
      try {
        assertM07ClinicScope(actor, [l.clinicId]);
        return true;
      } catch {
        return false;
      }
    });
}

export type LeavePrepGenerateResult = {
  prepared: LeavePrepLine[];
  blockedExceptionIds: string[];
};

/**
 * Generate leave prep lines for a person/period from approved M04 leave only.
 */
export function generateLeavePreparationForPerson(
  actor: M07Actor,
  input: { periodId: string; personId: string }
): LeavePrepGenerateResult {
  assertM07Permission(actor, "payroll.calculate");
  assertNoProhibitedFields(input);

  const period = getPeriod(input.periodId);
  if (!period) throw new M07ValidationError("not-found", `Period ${input.periodId} not found`);
  assertM07LegalEntityScope(actor, period.legalEntityId);
  assertM07ClinicScope(actor, period.clinicIds);

  const legalEntityId = period.legalEntityId;
  const organisationId = legalEntityId;
  const blockedExceptionIds: string[] = [];
  const prepared: LeavePrepLine[] = [];

  if (isDoctorPayExcluded(input.personId)) {
    const ex = openPayPrepException(actor, {
      legalEntityId,
      organisationId,
      periodId: period.id,
      personId: input.personId,
      kind: "doctor-pay-excluded",
      message: "Doctors excluded from staff leave preparation",
    });
    return { prepared: [], blockedExceptionIds: [ex.id] };
  }

  const profile = listProfiles(legalEntityId).find(
    (p) => p.personId === input.personId && p.status === "active"
  );

  const approved = listApprovedLeaveForPerson({
    personId: input.personId,
    organisationId,
    periodStart: period.periodStart,
    periodEnd: period.periodEnd,
  });

  if (!approved.length) {
    return { prepared: [], blockedExceptionIds: [] };
  }

  for (const leave of approved) {
    if (leave.organisationId !== organisationId) {
      const ex = openPayPrepException(actor, {
        legalEntityId,
        organisationId,
        clinicId: leave.clinicId ?? profile?.clinicId,
        periodId: period.id,
        personId: input.personId,
        kind: "legal-entity-boundary-mismatch",
        message: "Leave organisation does not match period legal entity",
        m04LeaveRecordId: leave.leaveRecordId,
      });
      blockedExceptionIds.push(ex.id);
      continue;
    }

    if (leave.clinicId) {
      try {
        assertM07ClinicScope(actor, [leave.clinicId]);
      } catch {
        const ex = openPayPrepException(actor, {
          legalEntityId,
          organisationId,
          clinicId: leave.clinicId,
          periodId: period.id,
          personId: input.personId,
          kind: "clinic-boundary-mismatch",
          message: "Leave clinic outside actor scope",
          m04LeaveRecordId: leave.leaveRecordId,
        });
        blockedExceptionIds.push(ex.id);
        continue;
      }
    }

    const mapping = profile?.leavePayMapping ?? null;
    if (!mapping) {
      const ex = openPayPrepException(actor, {
        legalEntityId,
        organisationId,
        clinicId: leave.clinicId ?? profile?.clinicId,
        periodId: period.id,
        personId: input.personId,
        kind: "leave-mapping-missing",
        message: "Leave pay mapping missing on pay profile — leave not prepared",
        m04LeaveRecordId: leave.leaveRecordId,
      });
      blockedExceptionIds.push(ex.id);
      continue;
    }

    const leaveDays = computeInclusiveLeaveDays(leave.startDate, leave.endDate);
    if (leaveDays <= 0) {
      const ex = openPayPrepException(actor, {
        legalEntityId,
        organisationId,
        clinicId: leave.clinicId ?? profile?.clinicId,
        periodId: period.id,
        personId: input.personId,
        kind: "unsupported-leave",
        message: "Leave date range is unsupported",
        m04LeaveRecordId: leave.leaveRecordId,
      });
      blockedExceptionIds.push(ex.id);
      continue;
    }

    const existing = listLeavePrepLines(legalEntityId).find(
      (l) =>
        l.periodId === period.id &&
        l.m04LeaveRecordId === leave.leaveRecordId &&
        l.m04LeaveVersion === leave.version
    );
    if (existing) {
      prepared.push(existing);
      continue;
    }

    const now = new Date().toISOString();
    const line: LeavePrepLine = {
      id: newLeavePrepLineId(),
      legalEntityId,
      organisationId,
      clinicId: leave.clinicId ?? profile?.clinicId,
      periodId: period.id,
      personId: input.personId,
      m04LeaveRecordId: leave.leaveRecordId,
      m04LeaveVersion: leave.version,
      leaveType: leave.leaveType,
      startDate: leave.startDate,
      endDate: leave.endDate,
      leaveDays,
      leavePayMapping: mapping,
      status: "prepared",
      certified: false,
      disclaimer: M07_NON_CERTIFIED_DISCLAIMER,
      createdAt: now,
      createdBy: actor.userId,
      version: 1,
    };
    upsertLeavePrepLine(line);
    recordM07Audit({
      actor,
      action: "leave-prep.created",
      entityType: "leave-prep-line",
      entityId: line.id,
      legalEntityId,
      clinicId: line.clinicId,
      after: line,
      meta: {
        m04LeaveRecordId: leave.leaveRecordId,
        m04LeaveVersion: leave.version,
      },
    });
    prepared.push(line);
  }

  if (prepared.length || blockedExceptionIds.length) {
    invalidateApprovalIfSourcesChanged(
      actor,
      period.id,
      "leave-prep-change"
    );
  }

  return { prepared, blockedExceptionIds };
}
