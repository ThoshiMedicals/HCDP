import { assertM06ClinicScope, assertM06Permission, type M06Actor } from "../permissions";
import {
  findOpenSessionForPerson,
  getSession,
  listBreaks,
  listDevices,
  listOfflineQueue,
  newOfflineId,
  upsertOfflineItem,
} from "../repository/local-store";
import type { FoldFlag, OfflineQueueItem } from "../types";
import { closeOfflineConflict, syncOfflineConflict } from "../adapters/m06-inbox-sync";
import { clockIn, clockOut } from "./clock-service";
import { endBreak, startBreak } from "./break-service";
import { writeAudit } from "./audit-helpers";
import {
  InvalidLifecycleTransitionError,
  OverrideReasonRequiredError,
  ValidationError,
} from "./errors";

export function enqueueOfflineEvent(input: {
  actor: M06Actor;
  deviceId: string;
  clientEventId: string;
  clientSequence: number;
  clinicId: string;
  payload: OfflineQueueItem["payload"];
}): OfflineQueueItem {
  assertM06Permission(input.actor, "attendance.clock.self");
  assertM06ClinicScope(input.actor, [input.clinicId]);
  const device = listDevices().find((d) => d.id === input.deviceId);
  if (device?.revoked) throw new ValidationError("Device revoked");
  const existing = listOfflineQueue().find((o) => o.clientEventId === input.clientEventId);
  if (existing) return existing;
  const now = new Date().toISOString();
  const item: OfflineQueueItem = {
    id: newOfflineId(),
    clientEventId: input.clientEventId,
    clientSequence: input.clientSequence,
    deviceId: input.deviceId,
    personId: input.actor.personId ?? input.actor.userId,
    clinicId: input.clinicId,
    state: "queued",
    payload: input.payload,
    createdAt: now,
    updatedAt: now,
  };
  return upsertOfflineItem(item);
}

export function syncOfflineQueue(input: { actor: M06Actor; deviceId: string }): {
  applied: string[];
  conflicts: string[];
} {
  const queued = listOfflineQueue()
    .filter((o) => o.deviceId === input.deviceId && (o.state === "queued" || o.state === "conflict"))
    .sort((a, b) => a.clientSequence - b.clientSequence);

  const applied: string[] = [];
  const conflicts: string[] = [];

  for (const item of queued) {
    upsertOfflineItem({ ...item, state: "syncing", updatedAt: new Date().toISOString() });
    try {
      applyOfflineItem(input.actor, item);
      upsertOfflineItem({ ...item, state: "applied", updatedAt: new Date().toISOString() });
      applied.push(item.id);
    } catch (e) {
      const conflicted = {
        ...item,
        state: "conflict" as const,
        conflictReason: e instanceof Error ? e.message : String(e),
        updatedAt: new Date().toISOString(),
      };
      upsertOfflineItem(conflicted);
      syncOfflineConflict(conflicted);
      conflicts.push(item.id);
    }
  }
  return { applied, conflicts };
}

function applyOfflineItem(actor: M06Actor, item: OfflineQueueItem): void {
  const fold = (item.payload.fold ?? 0) as FoldFlag;
  if (item.payload.kind === "clock-in") {
    clockIn({
      actor,
      clinicId: item.clinicId,
      localCivil: item.payload.localCivil,
      fold,
      clientEventId: item.clientEventId,
      idempotencyKey: item.clientEventId,
      method: "offline",
    });
    return;
  }
  if (item.payload.kind === "clock-out") {
    const session =
      (item.payload.sessionId ? getSession(item.payload.sessionId) : null) ??
      findOpenSessionForPerson(item.personId);
    if (!session) throw new ValidationError("No open session for offline clock-out");
    clockOut({
      actor,
      sessionId: session.id,
      localCivil: item.payload.localCivil,
      fold,
      clientEventId: item.clientEventId,
      idempotencyKey: item.clientEventId,
      expectedVersion: session.version,
    });
    return;
  }
  if (item.payload.kind === "break-start") {
    const session =
      (item.payload.sessionId ? getSession(item.payload.sessionId) : null) ??
      findOpenSessionForPerson(item.personId);
    if (!session) throw new ValidationError("No open session for break");
    startBreak({
      actor,
      sessionId: session.id,
      localCivil: item.payload.localCivil,
      fold,
      expectedSessionVersion: session.version,
      clientEventId: item.clientEventId,
    });
    return;
  }
  if (item.payload.kind === "break-end") {
    const session =
      (item.payload.sessionId ? getSession(item.payload.sessionId) : null) ??
      findOpenSessionForPerson(item.personId);
    if (!session) throw new ValidationError("No session for break end");
    const brk = listBreaks(session.id).find((b) => b.state === "in_progress");
    if (!brk) throw new ValidationError("No in-progress break");
    endBreak({
      actor,
      breakId: brk.id,
      localCivil: item.payload.localCivil,
      fold,
      expectedVersion: brk.version,
      clientEventId: item.clientEventId,
    });
  }
}

export function resolveOfflineConflict(input: {
  actor: M06Actor;
  offlineId: string;
  resolution: "reapply" | "keep-server";
}): OfflineQueueItem {
  assertM06Permission(input.actor, "attendance.sync.resolve");
  const item = listOfflineQueue().find((o) => o.id === input.offlineId);
  if (!item) throw new ValidationError("Offline item not found");
  assertM06ClinicScope(input.actor, [item.clinicId]);
  if (item.state !== "conflict") {
    throw new InvalidLifecycleTransitionError({ from: item.state, to: "resolved", targetType: "offline" });
  }
  if (input.resolution === "reapply") {
    applyOfflineItem(input.actor, item);
  }
  const next = { ...item, state: "resolved" as const, updatedAt: new Date().toISOString() };
  upsertOfflineItem(next);
  closeOfflineConflict(next);
  writeAudit({
    actorId: input.actor.userId,
    action: "offline.resolved",
    targetType: "offline",
    targetId: item.id,
    clinicId: item.clinicId,
    detail: input.resolution,
  });
  return next;
}

export function discardOfflineItem(input: {
  actor: M06Actor;
  offlineId: string;
  reason: string;
}): OfflineQueueItem {
  assertM06Permission(input.actor, "attendance.override");
  if (!input.reason.trim()) throw new OverrideReasonRequiredError();
  const item = listOfflineQueue().find((o) => o.id === input.offlineId);
  if (!item) throw new ValidationError("Offline item not found");
  const next = { ...item, state: "discarded" as const, updatedAt: new Date().toISOString() };
  upsertOfflineItem(next);
  closeOfflineConflict(next);
  return next;
}
