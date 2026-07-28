import { assertM06ClinicScope, assertM06Permission, hasM06Permission, type M06Actor } from "../permissions";
import { listAudit, listEvidence, listExceptions, listSessions, listTimesheets } from "../repository/local-store";
import { getAttendanceCounts } from "../adapters/m06-executive";
import { ValidationError } from "./errors";

export function buildAttendanceReport(input: { actor: M06Actor; clinicId: string }) {
  assertM06Permission(input.actor, "attendance.report");
  assertM06ClinicScope(input.actor, [input.clinicId]);
  return {
    counts: getAttendanceCounts(input.clinicId),
    sessions: listSessions(input.clinicId).length,
    exceptionsOpen: listExceptions(input.clinicId).filter((e) => e.state === "open").length,
    timesheets: listTimesheets(input.clinicId).length,
  };
}

export function exportAttendance(input: {
  actor: M06Actor;
  clinicId: string;
}): { rows: Array<Record<string, unknown>>; maskedEvidence: boolean } {
  assertM06Permission(input.actor, "attendance.export");
  assertM06ClinicScope(input.actor, [input.clinicId]);
  // Export bypass prevention: clinicId required and scoped
  if (!input.clinicId) throw new ValidationError("Export requires an explicit clinic scope");

  const canEvidence = hasM06Permission(input.actor, "attendance.evidence.view");
  const canAudit = hasM06Permission(input.actor, "attendance.audit.view");

  const rows: Array<Record<string, unknown>> = listSessions(input.clinicId).map((s) => ({
    type: "session",
    id: s.id,
    personId: s.personId,
    clinicId: s.clinicId,
    state: s.state,
    openedLocal: s.openedAt.localCivil,
    closedLocal: s.closedAt?.localCivil,
  }));

  for (const ev of listEvidence().filter((e) => e.clinicId === input.clinicId)) {
    rows.push({
      type: "evidence",
      id: ev.id,
      method: ev.method,
      summary: ev.summary,
      sensitivePayload: canEvidence ? ev.sensitivePayload ?? null : "[masked]",
    });
  }

  if (canAudit) {
    for (const a of listAudit().filter((x) => x.clinicId === input.clinicId)) {
      rows.push({ type: "audit", id: a.id, action: a.action, at: a.at, targetId: a.targetId });
    }
  }

  return { rows, maskedEvidence: !canEvidence };
}
