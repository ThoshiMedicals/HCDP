/** Leave request / approve and availability windows. Self-approval is rejected. */

import { assertM04Permission, type M04Actor } from "../permissions";
import * as store from "../repository/local-store";
import type { AvailabilityWindow, LeaveRequest } from "../types/domain";
import { publishM04WorkforceEvent } from "./events";
import { invalidateReadinessForPerson } from "./readiness-service";

export function requestLeave(
  actor: M04Actor,
  input: {
    personId: string;
    organisationId: string;
    clinicId?: string;
    startDate: string;
    endDate: string;
    leaveType: string;
    notes?: string;
  }
): LeaveRequest {
  assertM04Permission(actor, "workforce.edit");
  const person = store.getPerson(input.personId);
  if (!person) throw new Error(`Person not found: ${input.personId}`);

  const now = new Date().toISOString();
  const leave: LeaveRequest = {
    id: store.newLeaveId(),
    personId: input.personId,
    organisationId: input.organisationId,
    clinicId: input.clinicId,
    startDate: input.startDate,
    endDate: input.endDate,
    leaveType: input.leaveType,
    status: "Pending",
    requestedBy: actor.userId,
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
    version: 1,
  };
  store.upsertLeave(leave);
  invalidateReadinessForPerson(leave.personId);
  return leave;
}

export function approveLeave(actor: M04Actor, leaveId: string, decision: "Approved" | "Rejected"): LeaveRequest {
  assertM04Permission(actor, "leave.approve");
  const leave = store.getLeave(leaveId);
  if (!leave) throw new Error(`Leave not found: ${leaveId}`);
  if (leave.status !== "Pending") throw new Error(`Leave is already ${leave.status}`);

  // Reject self-approval: actor cannot approve their own leave
  if (leave.requestedBy === actor.userId) {
    throw new Error("Self-approval is not allowed for leave requests");
  }
  const person = store.getPerson(leave.personId);
  if (person && person.id === actor.userId) {
    throw new Error("Self-approval is not allowed for leave requests");
  }

  const now = new Date().toISOString();
  const next: LeaveRequest = {
    ...leave,
    status: decision,
    approvedBy: actor.userId,
    decidedAt: now,
    updatedAt: now,
    version: leave.version + 1,
  };
  store.upsertLeave(next);

  if (decision === "Approved") {
    publishM04WorkforceEvent({
      eventType: "leave.approved",
      sourceRecordId: next.id,
      sourceRecordVersion: next.version,
      sourceRecordType: "leave-request",
      sourceRecordTitle: `${next.leaveType} leave`,
      organisationId: next.organisationId,
      clinicId: next.clinicId,
      actor: actor.userId,
      idempotencyKey: `m04::leave-approved::${next.id}::v${next.version}`,
      section: "leave-availability",
      currentStatus: next.status,
      payload: { personId: next.personId },
    });
  }
  invalidateReadinessForPerson(next.personId);
  return next;
}

export function addAvailability(
  actor: M04Actor,
  input: {
    personId: string;
    organisationId: string;
    clinicId?: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    effectiveFrom: string;
    effectiveTo?: string | null;
    notes?: string;
  }
): AvailabilityWindow {
  assertM04Permission(actor, "workforce.edit");
  const person = store.getPerson(input.personId);
  if (!person) throw new Error(`Person not found: ${input.personId}`);

  const now = new Date().toISOString();
  const window: AvailabilityWindow = {
    id: store.newAvailabilityId(),
    personId: input.personId,
    organisationId: input.organisationId,
    clinicId: input.clinicId,
    dayOfWeek: input.dayOfWeek,
    startTime: input.startTime,
    endTime: input.endTime,
    effectiveFrom: input.effectiveFrom,
    effectiveTo: input.effectiveTo ?? null,
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
    version: 1,
  };
  store.upsertAvailability(window);
  invalidateReadinessForPerson(window.personId);
  publishM04WorkforceEvent({
    eventType: "availability.changed",
    sourceRecordId: window.id,
    sourceRecordVersion: window.version,
    sourceRecordType: "availability-window",
    sourceRecordTitle: `Availability dow${window.dayOfWeek}`,
    organisationId: window.organisationId,
    clinicId: window.clinicId,
    actor: actor.userId,
    idempotencyKey: `m04::availability::${window.id}::v${window.version}`,
    section: "leave-availability",
    payload: { personId: window.personId },
  });
  return window;
}

export function listLeave(personId?: string): LeaveRequest[] {
  return store.listLeave(personId);
}

export function listAvailability(personId?: string): AvailabilityWindow[] {
  return store.listAvailability(personId);
}
