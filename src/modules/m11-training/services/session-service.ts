/** M11 session service — create, enrol, cancel, mark attendance. */

import { assertM11Permission, type M11Actor } from "../permissions";
import * as store from "../repository/local-store";
import type { Session } from "../types/domain";
import { publishM11TrainingEvent } from "./events";

const DEFAULT_ORG = "org_parent";

export function createSession(
  actor: M11Actor,
  input: {
    courseId: string;
    scheduledStart: string;
    scheduledEnd: string;
    organisationId?: string;
    clinicId?: string;
    facilitator?: string;
    locationLabel?: string;
    capacityMax?: number;
  }
): Session {
  assertM11Permission(actor, "training.manage_sessions");
  const now = new Date().toISOString();
  const session: Session = {
    id: store.newSessionId(),
    courseId: input.courseId,
    organisationId: input.organisationId ?? DEFAULT_ORG,
    clinicId: input.clinicId,
    facilitator: input.facilitator,
    locationLabel: input.locationLabel,
    scheduledStart: input.scheduledStart,
    scheduledEnd: input.scheduledEnd,
    capacityMax: input.capacityMax ?? null,
    enrolledPersonIds: [],
    attendedPersonIds: [],
    status: "scheduled",
    cancelledReason: null,
    createdAt: now,
    updatedAt: now,
    version: 1,
  };
  store.upsertSession(session);
  return session;
}

export function enrolInSession(
  actor: M11Actor,
  sessionId: string,
  personId: string
): Session {
  assertM11Permission(actor, "training.manage_sessions");
  const session = store.getSession(sessionId);
  if (!session) throw new Error(`Session not found: ${sessionId}`);
  if (session.status !== "scheduled") {
    throw new Error(`Cannot enrol in session with status: ${session.status}`);
  }
  if (session.capacityMax != null && session.enrolledPersonIds.length >= session.capacityMax) {
    throw new Error("Session is at capacity");
  }
  if (session.enrolledPersonIds.includes(personId)) return session;

  const now = new Date().toISOString();
  const updated: Session = {
    ...session,
    enrolledPersonIds: [...session.enrolledPersonIds, personId],
    updatedAt: now,
    version: session.version + 1,
  };
  store.upsertSession(updated);
  return updated;
}

export function cancelSession(
  actor: M11Actor,
  sessionId: string,
  reason?: string
): Session {
  assertM11Permission(actor, "training.manage_sessions");
  const session = store.getSession(sessionId);
  if (!session) throw new Error(`Session not found: ${sessionId}`);
  if (session.status === "cancelled") return session;
  const now = new Date().toISOString();
  const updated: Session = {
    ...session,
    status: "cancelled",
    cancelledReason: reason ?? null,
    updatedAt: now,
    version: session.version + 1,
  };
  store.upsertSession(updated);
  publishM11TrainingEvent({
    eventType: "worker.status.changed",
    sourceRecordId: updated.id,
    sourceRecordVersion: updated.version,
    sourceRecordType: "training-session",
    sourceRecordTitle: `Session ${updated.id} cancelled`,
    organisationId: updated.organisationId,
    clinicId: updated.clinicId,
    actor: actor.userId,
    idempotencyKey: `m11::session-cancel::${updated.id}::v${updated.version}`,
    section: "sessions",
    currentStatus: "cancelled",
  });
  return updated;
}

export function markAttendance(
  actor: M11Actor,
  sessionId: string,
  attendedPersonIds: string[]
): Session {
  assertM11Permission(actor, "training.manage_sessions");
  const session = store.getSession(sessionId);
  if (!session) throw new Error(`Session not found: ${sessionId}`);
  if (session.status === "cancelled") {
    throw new Error("Cannot mark attendance on a cancelled session");
  }
  const now = new Date().toISOString();
  const updated: Session = {
    ...session,
    attendedPersonIds,
    status: "completed",
    updatedAt: now,
    version: session.version + 1,
  };
  store.upsertSession(updated);
  return updated;
}

export function listSessions(courseId?: string): Session[] {
  return store.listSessions(courseId);
}

export function getSession(id: string): Session | null {
  return store.getSession(id);
}
