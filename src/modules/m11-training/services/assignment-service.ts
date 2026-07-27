/** M11 assignment service — rules, manual assignment, completion, clinic-TZ state transitions. */

import { assertM11ClinicScope, assertM11Permission, type M11Actor } from "../permissions";
import * as store from "../repository/local-store";
import type { Assignment, AssignmentRule, AssignmentStatus, CompletionRecord } from "../types/domain";
import { publishM11TrainingEvent } from "./events";
import {
  ClinicTimezoneUnresolvedError,
  addCalendarDays,
  deriveAssignmentScheduleStatus,
  requireClinicToday,
  type AssignmentScheduleStatus,
} from "@/platform/workforce/services/clinic-timezone";

const DEFAULT_ORG = "org_parent";
const DEFAULT_GRACE_DAYS = 0;

function graceDaysForAssignment(a: Assignment): number {
  if (a.ruleId) {
    const rule = store.getRule(a.ruleId);
    if (rule) {
      // AssignmentRule has no graceDays — pull from active policy rule for course
      const policy = store.getActivePolicy(a.organisationId);
      const pr = policy?.rules.find((r) => r.courseId === a.courseId);
      if (pr?.graceDays != null) return pr.graceDays;
    }
  }
  const policy = store.getActivePolicy(a.organisationId);
  const pr = policy?.rules.find((r) => r.courseId === a.courseId);
  if (pr?.graceDays != null) return pr.graceDays;
  return DEFAULT_GRACE_DAYS;
}

export function createRule(
  actor: M11Actor,
  input: {
    courseId: string;
    targetRoleLabels?: string[];
    clinicIds?: string[];
    dueDays: number;
    recurrenceMonths?: number;
    organisationId?: string;
  }
): AssignmentRule {
  assertM11Permission(actor, "training.assign");
  if (input.clinicIds?.length) assertM11ClinicScope(actor, input.clinicIds);
  const now = new Date().toISOString();
  const rule: AssignmentRule = {
    id: store.newRuleId(),
    organisationId: input.organisationId ?? DEFAULT_ORG,
    courseId: input.courseId,
    targetRoleLabels: input.targetRoleLabels ?? ["*"],
    clinicIds: input.clinicIds ?? [],
    dueDays: input.dueDays,
    recurrenceMonths: input.recurrenceMonths ?? null,
    createdAt: now,
    updatedAt: now,
    version: 1,
    active: true,
  };
  store.upsertRule(rule);
  return rule;
}

export function assignManual(
  actor: M11Actor,
  input: {
    personId: string;
    courseId: string;
    dueDate: string;
    organisationId?: string;
    clinicId?: string;
    notes?: string;
    graceDays?: number;
  }
): Assignment {
  assertM11Permission(actor, "training.assign");
  if (input.clinicId) assertM11ClinicScope(actor, [input.clinicId]);
  else if (actor.clinicIds !== undefined && !actor.permissions.includes("*")) {
    throw new Error("clinicId is required when actor has clinic scope");
  }
  const now = new Date().toISOString();
  const assignment: Assignment = {
    id: store.newAssignmentId(),
    personId: input.personId,
    courseId: input.courseId,
    organisationId: input.organisationId ?? DEFAULT_ORG,
    clinicId: input.clinicId,
    assignedBy: actor.userId,
    assignedAt: now,
    dueDate: input.dueDate,
    status: "assigned",
    ruleId: null,
    completionRecordId: null,
    exemptionId: null,
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
    version: 1,
  };
  store.upsertAssignment(assignment);
  publishAssignmentEvent(assignment, actor.userId, "training.assignment.created");
  return assignment;
}

export function assignFromRules(
  actor: M11Actor,
  personId: string,
  roleLabel: string,
  clinicId: string,
  organisationId = DEFAULT_ORG,
  asOf: Date | string = new Date()
): Assignment[] {
  assertM11Permission(actor, "training.assign");
  assertM11ClinicScope(actor, [clinicId]);
  const { clinicToday } = requireClinicToday(clinicId, asOf);
  const rules = store.listRules(organisationId).filter((r) => {
    if (!r.active) return false;
    if (r.clinicIds.length && !r.clinicIds.includes(clinicId)) return false;
    if (!r.targetRoleLabels.includes("*") && !r.targetRoleLabels.includes(roleLabel)) return false;
    return true;
  });

  const existing = store.listAssignments(personId);
  const created: Assignment[] = [];

  for (const rule of rules) {
    const alreadyActive = existing.some(
      (a) =>
        a.courseId === rule.courseId &&
        a.ruleId === rule.id &&
        !["superseded", "revoked", "expired"].includes(a.status)
    );
    if (alreadyActive) continue;

    const dueDate = addCalendarDays(clinicToday, rule.dueDays);
    const now = new Date().toISOString();
    const assignment: Assignment = {
      id: store.newAssignmentId(),
      personId,
      courseId: rule.courseId,
      organisationId,
      clinicId,
      assignedBy: actor.userId,
      assignedAt: now,
      dueDate,
      status: "assigned",
      ruleId: rule.id,
      completionRecordId: null,
      exemptionId: null,
      createdAt: now,
      updatedAt: now,
      version: 1,
    };
    store.upsertAssignment(assignment);
    publishAssignmentEvent(assignment, actor.userId, "training.assignment.created");
    created.push(assignment);
  }
  return created;
}

export function completeAssignment(
  actor: M11Actor,
  assignmentId: string,
  input: {
    completedOn?: string;
    notes?: string;
    sessionId?: string;
  } = {}
): { assignment: Assignment; completion: CompletionRecord } {
  assertM11Permission(actor, "training.complete");
  const assignment = store.getAssignment(assignmentId);
  if (!assignment) throw new Error(`Assignment not found: ${assignmentId}`);
  if (assignment.clinicId) assertM11ClinicScope(actor, [assignment.clinicId]);
  if (["superseded", "revoked", "exempt"].includes(assignment.status)) {
    throw new Error(`Cannot complete assignment in status: ${assignment.status}`);
  }

  const now = new Date().toISOString();
  let completedOn = input.completedOn;
  if (!completedOn) {
    if (!assignment.clinicId) {
      throw new ClinicTimezoneUnresolvedError({
        ok: false,
        clinicId: undefined,
        reason: "Cannot default completedOn without clinic timezone",
      });
    }
    completedOn = requireClinicToday(assignment.clinicId, now).clinicToday;
  }

  const completion: CompletionRecord = {
    id: store.newCompletionId(),
    personId: assignment.personId,
    courseId: assignment.courseId,
    assignmentId: assignment.id,
    sessionId: input.sessionId ?? null,
    organisationId: assignment.organisationId,
    clinicId: assignment.clinicId,
    completedOn,
    completedBy: actor.userId,
    notes: input.notes,
    createdAt: now,
    version: 1,
  };
  store.appendCompletion(completion);

  const updated: Assignment = {
    ...assignment,
    status: "completed",
    completionRecordId: completion.id,
    updatedAt: now,
    version: assignment.version + 1,
  };
  store.upsertAssignment(updated);
  publishAssignmentEvent(updated, actor.userId, "worker.status.changed");
  return { assignment: updated, completion };
}

export type RefreshAssignmentResult =
  | { ok: true; assignment: Assignment; schedule: AssignmentScheduleStatus }
  | { ok: false; assignmentId: string; reason: string };

/**
 * Refresh a single assignment using clinic IANA timezone.
 * Missing timezone ⇒ unresolved (does not silently use UTC).
 */
export function refreshAssignmentStatus(
  assignmentId: string,
  asOf: Date | string = new Date(),
  graceDaysOverride?: number
): RefreshAssignmentResult {
  const a = store.getAssignment(assignmentId);
  if (!a) return { ok: false, assignmentId, reason: "Assignment not found" };
  if (["completed", "superseded", "revoked", "exempt"].includes(a.status)) {
    return { ok: true, assignment: a, schedule: a.status === "completed" ? "assigned" : "assigned" };
  }
  if (!a.clinicId) {
    return {
      ok: false,
      assignmentId: a.id,
      reason: "Assignment has no clinicId — clinic timezone required for due/grace/overdue",
    };
  }
  let clinicToday: string;
  try {
    clinicToday = requireClinicToday(a.clinicId, asOf).clinicToday;
  } catch (e) {
    return {
      ok: false,
      assignmentId: a.id,
      reason: e instanceof Error ? e.message : String(e),
    };
  }
  const graceDays = graceDaysOverride ?? graceDaysForAssignment(a);
  const schedule = deriveAssignmentScheduleStatus({
    dueDate: a.dueDate,
    clinicToday,
    graceDays,
  });
  const next: AssignmentStatus =
    schedule === "assigned" && a.status === "in_progress" ? "in_progress" : schedule;
  if (next === a.status) return { ok: true, assignment: a, schedule };
  const asOfIso = typeof asOf === "string" ? asOf : asOf.toISOString();
  const upd: Assignment = {
    ...a,
    status: next,
    updatedAt: asOfIso,
    version: a.version + 1,
  };
  store.upsertAssignment(upd);
  return { ok: true, assignment: upd, schedule };
}

export function refreshAssignmentStatuses(
  asOf: Date | string = new Date()
): { updated: Assignment[]; unresolved: RefreshAssignmentResult[] } {
  const all = store.listAssignments();
  const updated: Assignment[] = [];
  const unresolved: RefreshAssignmentResult[] = [];
  for (const a of all) {
    if (["completed", "superseded", "revoked", "exempt"].includes(a.status)) continue;
    const result = refreshAssignmentStatus(a.id, asOf);
    if (!result.ok) unresolved.push(result);
    else if (result.assignment.version !== a.version) updated.push(result.assignment);
  }
  return { updated, unresolved };
}

export function revokeAssignment(
  actor: M11Actor,
  assignmentId: string,
  reason?: string
): Assignment {
  assertM11Permission(actor, "training.assign");
  const a = store.getAssignment(assignmentId);
  if (!a) throw new Error(`Assignment not found: ${assignmentId}`);
  if (a.clinicId) assertM11ClinicScope(actor, [a.clinicId]);
  const now = new Date().toISOString();
  const revoked: Assignment = {
    ...a,
    status: "revoked",
    notes: reason ?? a.notes,
    updatedAt: now,
    version: a.version + 1,
  };
  store.upsertAssignment(revoked);
  return revoked;
}

export function listAssignments(personId?: string): Assignment[] {
  return store.listAssignments(personId);
}

export function listAssignmentsForActor(actor: M11Actor, personId?: string): Assignment[] {
  assertM11Permission(actor, "training.view");
  return listAssignments(personId).filter((a) => {
    if (actor.clinicIds === undefined || actor.permissions.includes("*")) return true;
    if (!actor.clinicIds.length) return false;
    if (!a.clinicId) return false;
    return actor.clinicIds.includes(a.clinicId);
  });
}

function publishAssignmentEvent(
  a: Assignment,
  actor: string,
  eventType: "worker.status.changed" | "training.assignment.created"
) {
  publishM11TrainingEvent({
    eventType: eventType === "training.assignment.created" ? "training.assignment.created" : "worker.status.changed",
    sourceRecordId: a.id,
    sourceRecordVersion: a.version,
    sourceRecordType: "training-assignment",
    sourceRecordTitle: `Assignment for ${a.personId} → ${a.courseId}`,
    organisationId: a.organisationId,
    clinicId: a.clinicId,
    actor,
    idempotencyKey: `m11::assignment::${a.id}::v${a.version}`,
    section: "assignments",
    currentStatus: a.status,
    payload: { personId: a.personId, courseId: a.courseId },
  });
}
