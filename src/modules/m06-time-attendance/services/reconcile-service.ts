import { assertM06ClinicScope, assertM06Permission, type M06Actor } from "../permissions";
import { listExceptions, listSessions } from "../repository/local-store";
import {
  listPublishedAssignmentsForClinic,
  listPublishedAssignmentsForPerson,
} from "../adapters/m05-shift-read";
import { raiseException } from "./exception-service";

export type ReconcileRow = {
  personId: string;
  clinicId: string;
  shiftId: string;
  assignmentId: string;
  hasAttendance: boolean;
  variance: "matched" | "missing-attendance" | "unrostered-attendance";
};

export function reconcileRosterAttendance(input: {
  actor: M06Actor;
  clinicId: string;
  personId?: string;
}): { rows: ReconcileRow[]; exceptionIds: string[] } {
  assertM06Permission(input.actor, "attendance.report");
  assertM06ClinicScope(input.actor, [input.clinicId]);

  const sessions = listSessions(input.clinicId);
  const people = new Set<string>();
  if (input.personId) people.add(input.personId);
  for (const s of sessions) people.add(s.personId);
  for (const a of listPublishedAssignmentsForClinic(input.clinicId)) people.add(a.personId);

  const rows: ReconcileRow[] = [];
  const exceptionIds: string[] = [];

  for (const personId of people) {
    const assignments = listPublishedAssignmentsForPerson(personId).filter(
      (a) => a.clinicId === input.clinicId && a.published
    );
    for (const a of assignments) {
      const has = sessions.some(
        (s) => s.personId === personId && (s.shiftId === a.shiftId || s.assignmentId === a.assignmentId)
      );
      rows.push({
        personId,
        clinicId: input.clinicId,
        shiftId: a.shiftId,
        assignmentId: a.assignmentId,
        hasAttendance: has,
        variance: has ? "matched" : "missing-attendance",
      });
      if (!has) {
        const existing = listExceptions(input.clinicId).find(
          (e) => e.kind === "missed-in" && e.personId === personId && e.message.includes(a.shiftId)
        );
        if (!existing) {
          const ex = raiseException({
            system: true,
            personId,
            clinicId: input.clinicId,
            kind: "missed-in",
            message: `Reconcile: missing attendance for shift ${a.shiftId}`,
          });
          exceptionIds.push(ex.id);
        }
      }
    }
    for (const s of sessions.filter((x) => x.personId === personId && !x.rostered)) {
      rows.push({
        personId,
        clinicId: input.clinicId,
        shiftId: s.shiftId ?? "",
        assignmentId: s.assignmentId ?? "",
        hasAttendance: true,
        variance: "unrostered-attendance",
      });
    }
  }
  return { rows, exceptionIds };
}
