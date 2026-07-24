/** Shared audit-event contract. */

import type { SourceRecordRef } from "./source-record";
import type { PlatformSensitivity } from "@/platform/status";
import { uid } from "@/platform/storage";

export type AuditSensitivity = PlatformSensitivity;

export interface PlatformAuditEvent {
  eventId: string;
  at: string;
  userId: string;
  userName: string;
  role: string;
  organisationId?: string;
  organisationName?: string;
  clinicId?: string;
  moduleId: string;
  sourceRecord?: SourceRecordRef;
  action: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
  sensitivity: AuditSensitivity;
  sessionContext?: string;
}

export function createAuditEvent(
  partial: Omit<PlatformAuditEvent, "eventId"> & { eventId?: string }
): PlatformAuditEvent {
  return {
    ...partial,
    sensitivity: partial.sensitivity ?? "Standard",
    eventId: partial.eventId ?? uid("aud"),
  };
}

export function adaptM2Audit(entry: {
  id: string;
  actionId: string;
  event: string;
  user: string;
  at: string;
  detail?: string;
  previousValue?: string;
  newValue?: string;
  reason?: string;
}): PlatformAuditEvent {
  return createAuditEvent({
    eventId: entry.id,
    at: entry.at,
    userId: entry.user,
    userName: entry.user,
    role: "Action Inbox actor",
    moduleId: "action-inbox",
    action: entry.event,
    oldValue: entry.previousValue,
    newValue: entry.newValue,
    reason: entry.reason ?? entry.detail,
    sensitivity: "Standard",
    sessionContext: `inbox:${entry.actionId}`,
  });
}

export function adaptM3Audit(entry: {
  id: string;
  at: string;
  actorId: string;
  actorName: string;
  entityType: string;
  entityId: string;
  action: string;
  summary: string;
  before?: string;
  after?: string;
  reason?: string;
  sensitive?: boolean;
  clinicId?: string;
}): PlatformAuditEvent {
  return createAuditEvent({
    eventId: entry.id,
    at: entry.at,
    userId: entry.actorId,
    userName: entry.actorName,
    role: "Organisation actor",
    clinicId: entry.clinicId,
    moduleId: "organisation-access",
    action: entry.action,
    oldValue: entry.before,
    newValue: entry.after,
    reason: entry.reason ?? entry.summary,
    sensitivity: entry.sensitive ? "Restricted" : "Standard",
    sessionContext: `${entry.entityType}:${entry.entityId}`,
  });
}

export function adaptM1Audit(entry: {
  id: string;
  at?: string;
  user?: string;
  action?: string;
  detail?: string;
  previousValue?: string;
  newValue?: string;
}): PlatformAuditEvent {
  return createAuditEvent({
    eventId: entry.id,
    at: entry.at ?? new Date().toISOString(),
    userId: entry.user ?? "executive",
    userName: entry.user ?? "Executive",
    role: "Executive",
    moduleId: "executive-command-centre",
    action: entry.action ?? "Recorded",
    oldValue: entry.previousValue,
    newValue: entry.newValue,
    reason: entry.detail,
    sensitivity: "Standard",
  });
}
