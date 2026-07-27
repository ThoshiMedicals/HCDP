/** M11 bulk assignment service — preview and submit with partial success + clinic scope. */

import { assertM11Permission, M11ClinicScopeError, type M11Actor } from "../permissions";
import * as store from "../repository/local-store";
import type { Assignment } from "../types/domain";
import { assignManual } from "./assignment-service";

export type BulkAssignInput = {
  personIds: string[];
  courseId: string;
  dueDate: string;
  organisationId?: string;
  clinicId?: string;
  /** Optional per-person clinic overrides for multi-clinic bulk. */
  personClinicIds?: Record<string, string>;
  notes?: string;
};

export type BulkAssignPreview = {
  courseId: string;
  targetCount: number;
  alreadyAssigned: string[];
  willAssign: string[];
  outOfScope: string[];
};

export type BulkAssignResult = {
  succeeded: Assignment[];
  failed: Array<{ personId: string; error: string }>;
};

function clinicForPerson(input: BulkAssignInput, personId: string): string | undefined {
  return input.personClinicIds?.[personId] ?? input.clinicId;
}

function isOutOfScope(actor: M11Actor, clinicId: string | undefined): boolean {
  if (actor.clinicIds === undefined || actor.permissions.includes("*")) return false;
  if (!clinicId) return true;
  if (!actor.clinicIds.length) return true;
  return !actor.clinicIds.includes(clinicId);
}

export function previewBulkAssign(
  actor: M11Actor,
  input: BulkAssignInput
): BulkAssignPreview {
  assertM11Permission(actor, "training.assign");
  const existing = store.listAssignments();
  const alreadyAssigned = input.personIds.filter((pid) =>
    existing.some(
      (a) =>
        a.personId === pid &&
        a.courseId === input.courseId &&
        !["superseded", "revoked", "expired", "completed"].includes(a.status)
    )
  );
  const outOfScope = input.personIds.filter((pid) =>
    isOutOfScope(actor, clinicForPerson(input, pid))
  );
  const willAssign = input.personIds.filter(
    (pid) => !alreadyAssigned.includes(pid) && !outOfScope.includes(pid)
  );
  return {
    courseId: input.courseId,
    targetCount: input.personIds.length,
    alreadyAssigned,
    willAssign,
    outOfScope,
  };
}

export function submitBulkAssign(
  actor: M11Actor,
  input: BulkAssignInput
): BulkAssignResult {
  assertM11Permission(actor, "training.assign");
  const preview = previewBulkAssign(actor, input);
  const succeeded: Assignment[] = [];
  const failed: Array<{ personId: string; error: string }> = [];

  for (const personId of preview.outOfScope) {
    failed.push({
      personId,
      error: `Clinic scope denied for ${clinicForPerson(input, personId) ?? "(missing clinic)"}`,
    });
  }

  for (const personId of preview.willAssign) {
    try {
      const clinicId = clinicForPerson(input, personId);
      if (isOutOfScope(actor, clinicId)) {
        throw new M11ClinicScopeError();
      }
      const a = assignManual(actor, {
        personId,
        courseId: input.courseId,
        dueDate: input.dueDate,
        organisationId: input.organisationId,
        clinicId,
        notes: input.notes,
      });
      succeeded.push(a);
    } catch (err) {
      failed.push({
        personId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  for (const personId of preview.alreadyAssigned) {
    failed.push({
      personId,
      error: `Already has an active assignment for course ${input.courseId}`,
    });
  }

  return { succeeded, failed };
}
