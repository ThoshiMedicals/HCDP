/**
 * Durable M06→platform published-timesheet outbox (Checkpoint 2.2).
 *
 * M06 approval remains authoritative. Publication is a retryable projection.
 * Never rolls back approval because platform publication failed.
 * Never claims publication success unless the registry confirms it.
 */

import { readJsonSafe, uid, writeJsonSafe } from "@/platform/storage/storage";
import { calculatePayrollContentHash } from "@/platform/workforce/contracts/published-timesheet-hash";
import type { ClinicMembershipCheck } from "@/platform/workforce/validation/published-timesheet-validation";
import {
  buildPublicationEventIdentity,
  mapOrdinaryHoursFromTotalMinutes,
  publishOutboxItemToPlatform,
} from "../adapters/m06-published-timesheet-publisher";
import { getTimesheet, upsertTimesheet } from "../repository/local-store";
import { M06_STORAGE_KEYS } from "../storage/keys";
import {
  runM06SchemaV3Migration,
  type PublishedTimesheetOutboxMeta,
} from "../storage/migrate-v3";
import type {
  PlatformPublicationIntent,
  PlatformPublicationOutboxItem,
  TimesheetRecord,
} from "../types/domain";

export const DEFAULT_PUBLICATION_MAX_ATTEMPTS = 5;

function ensureOutboxMigrated() {
  runM06SchemaV3Migration();
}

function readOutbox(): PlatformPublicationOutboxItem[] {
  ensureOutboxMigrated();
  return readJsonSafe<PlatformPublicationOutboxItem[]>(M06_STORAGE_KEYS.publishedTimesheetOutbox, []);
}

function writeOutbox(items: PlatformPublicationOutboxItem[]) {
  writeJsonSafe(M06_STORAGE_KEYS.publishedTimesheetOutbox, items);
}

function readOutboxMeta(): PublishedTimesheetOutboxMeta {
  ensureOutboxMigrated();
  return readJsonSafe<PublishedTimesheetOutboxMeta>(M06_STORAGE_KEYS.publishedTimesheetOutboxMeta, {
    nextEventSequence: 1,
  });
}

function allocateEventSequence(): number {
  const meta = readOutboxMeta();
  const seq = meta.nextEventSequence;
  writeJsonSafe(M06_STORAGE_KEYS.publishedTimesheetOutboxMeta, {
    nextEventSequence: seq + 1,
  } satisfies PublishedTimesheetOutboxMeta);
  return seq;
}

export function listPublicationOutbox(filter?: {
  timesheetId?: string;
  status?: PlatformPublicationOutboxItem["status"] | PlatformPublicationOutboxItem["status"][];
}): PlatformPublicationOutboxItem[] {
  const statuses = filter?.status
    ? Array.isArray(filter.status)
      ? filter.status
      : [filter.status]
    : null;
  return readOutbox().filter((item) => {
    if (filter?.timesheetId && item.timesheetId !== filter.timesheetId) return false;
    if (statuses && !statuses.includes(item.status)) return false;
    return true;
  });
}

export function getPublicationOutboxItem(id: string): PlatformPublicationOutboxItem | null {
  return readOutbox().find((i) => i.id === id) ?? null;
}

function upsertOutboxItem(item: PlatformPublicationOutboxItem): PlatformPublicationOutboxItem {
  const list = readOutbox();
  const idx = list.findIndex((i) => i.id === item.id);
  if (idx >= 0) list[idx] = item;
  else list.push(item);
  writeOutbox(list);
  return item;
}

/**
 * Enqueue a publication obligation with stable event identity + monotonic sequence.
 * Exact logical retry reuses the same eventId/idempotencyKey/eventSequence.
 */
export function enqueuePlatformPublication(input: {
  timesheet: TimesheetRecord;
  intent: PlatformPublicationIntent;
  publisherId: string;
  sourceVersion: number;
  approvalRevision: number;
  reasonCode?: string;
  maxAttempts?: number;
}): PlatformPublicationOutboxItem {
  ensureOutboxMigrated();

  const organisationId = input.timesheet.organisationId?.trim() ?? "";
  const legalEntityId = input.timesheet.legalEntityId?.trim() ?? "";
  const { eventId, idempotencyKey } = buildPublicationEventIdentity({
    timesheetId: input.timesheet.id,
    sourceVersion: input.sourceVersion,
    approvalRevision: input.approvalRevision,
    intent: input.intent,
  });

  const existing = readOutbox().find((i) => i.idempotencyKey === idempotencyKey);
  if (existing) {
    return existing;
  }

  const now = new Date().toISOString();
  const item: PlatformPublicationOutboxItem = {
    id: uid("m06pts"),
    timesheetId: input.timesheet.id,
    organisationId,
    legalEntityId,
    clinicId: input.timesheet.clinicId,
    intent: input.intent,
    sourceVersion: input.sourceVersion,
    approvalRevision: input.approvalRevision,
    eventId,
    idempotencyKey,
    eventSequence: allocateEventSequence(),
    status: "pending",
    attemptCount: 0,
    maxAttempts: input.maxAttempts ?? DEFAULT_PUBLICATION_MAX_ATTEMPTS,
    reasonCode: input.reasonCode,
    contentSnapshot: {
      workforcePersonId: input.timesheet.personId,
      periodStart: input.timesheet.periodStart,
      periodEnd: input.timesheet.periodEnd,
      attendanceSessionIds: [...input.timesheet.sessionIds],
      totalMinutes: input.timesheet.totalMinutes,
      publisherId: input.publisherId,
      publishedAt: now,
    },
    createdAt: now,
    updatedAt: now,
  };
  return upsertOutboxItem(item);
}

function acknowledgeOnTimesheet(
  timesheetId: string,
  ack: NonNullable<TimesheetRecord["platformPublicationAck"]>
): void {
  const t = getTimesheet(timesheetId);
  if (!t) return;
  upsertTimesheet({
    ...t,
    publicationSourceVersion: ack.sourceVersion,
    approvalRevision: ack.approvalRevision,
    platformPublicationAck: ack,
    updatedAt: new Date().toISOString(),
  });
}

export type ProcessOutboxItemResult = {
  item: PlatformPublicationOutboxItem;
  outcome: "published" | "idempotent" | "failed" | "skipped_exhausted";
};

const INTENT_APPROVAL_STATE: Record<
  PlatformPublicationIntent,
  NonNullable<TimesheetRecord["platformPublicationAck"]>["approvalState"]
> = {
  granted: "approved",
  revised: "revised",
  revoked: "revoked",
  restored: "restored",
  withdrawn: "withdrawn",
  invalidated: "invalidated",
};

/** Process a single outbox item once (bounded; no automatic loop). */
export function processPublicationOutboxItem(
  itemId: string,
  options?: { clinicMembershipCheck?: ClinicMembershipCheck }
): ProcessOutboxItemResult {
  const item = getPublicationOutboxItem(itemId);
  if (!item) {
    throw new Error(`Outbox item ${itemId} not found`);
  }
  if (item.status === "published") {
    return { item, outcome: "idempotent" };
  }
  if (item.attemptCount >= item.maxAttempts && item.status === "failed") {
    return { item, outcome: "skipped_exhausted" };
  }

  const attempted: PlatformPublicationOutboxItem = {
    ...item,
    attemptCount: item.attemptCount + 1,
    updatedAt: new Date().toISOString(),
  };
  upsertOutboxItem(attempted);

  const result = publishOutboxItemToPlatform(attempted, options);

  // Discriminated narrowing must use the failure status first. Checking
  // `published || idempotent` does not narrow the complementary branch for the
  // success-arm status union, so `code`/`message` were not proven (OD-A2).
  if (result.status === "rejected") {
    const failed: PlatformPublicationOutboxItem = {
      ...attempted,
      status: "failed",
      lastError: `${result.code}: ${result.message}`,
      updatedAt: new Date().toISOString(),
    };
    upsertOutboxItem(failed);
    return { item: failed, outcome: "failed" };
  }

  const published: PlatformPublicationOutboxItem = {
    ...attempted,
    status: "published",
    lastError: undefined,
    updatedAt: new Date().toISOString(),
  };
  upsertOutboxItem(published);
  const version = result.result.version;
  acknowledgeOnTimesheet(published.timesheetId, {
    registryPublicationId: version.registryPublicationId,
    contentHash: result.contentHash,
    sourceVersion: published.sourceVersion,
    approvalRevision: published.approvalRevision,
    eventId: published.eventId,
    idempotencyKey: published.idempotencyKey,
    eventSequence: published.eventSequence,
    approvalState: INTENT_APPROVAL_STATE[published.intent],
    acknowledgedAt: new Date().toISOString(),
  });
  return {
    item: published,
    outcome: result.status === "idempotent" ? "idempotent" : "published",
  };
}

/** Explicit bounded batch process — callers choose when to retry. */
export function processPublicationOutbox(options?: {
  maxItems?: number;
  clinicMembershipCheck?: ClinicMembershipCheck;
}): ProcessOutboxItemResult[] {
  const pending = listPublicationOutbox({ status: ["pending", "failed"] }).filter(
    (i) => i.attemptCount < i.maxAttempts
  );
  const limit = options?.maxItems ?? pending.length;
  const results: ProcessOutboxItemResult[] = [];
  for (const item of pending.slice(0, limit)) {
    results.push(processPublicationOutboxItem(item.id, options));
  }
  return results;
}

/** Authorised retry of one obligation — reuses original event identity. */
export function retryPublicationOutboxItem(
  itemId: string,
  options?: { clinicMembershipCheck?: ClinicMembershipCheck }
): ProcessOutboxItemResult {
  const item = getPublicationOutboxItem(itemId);
  if (!item) throw new Error(`Outbox item ${itemId} not found`);
  if (item.status === "published") return { item, outcome: "idempotent" };
  if (item.attemptCount >= item.maxAttempts) {
    upsertOutboxItem({
      ...item,
      attemptCount: 0,
      status: "pending",
      lastError: item.lastError,
      updatedAt: new Date().toISOString(),
    });
  } else if (item.status === "failed") {
    upsertOutboxItem({
      ...item,
      status: "pending",
      updatedAt: new Date().toISOString(),
    });
  }
  return processPublicationOutboxItem(itemId, options);
}

/**
 * Compute next sourceVersion / approvalRevision for a timesheet publication intent.
 * sourceVersion advances only when content hash would change vs last ack.
 */
export function planPublicationVersions(input: {
  timesheet: TimesheetRecord;
  intent: PlatformPublicationIntent;
  nextContentHash: string;
}): { sourceVersion: number; approvalRevision: number } {
  const last = input.timesheet.platformPublicationAck;
  const lastSource = input.timesheet.publicationSourceVersion ?? last?.sourceVersion ?? 0;
  const lastRevision = input.timesheet.approvalRevision ?? last?.approvalRevision ?? 0;

  if (!last) {
    return { sourceVersion: 1, approvalRevision: 1 };
  }

  if (
    input.intent === "revoked" ||
    input.intent === "withdrawn" ||
    input.intent === "invalidated" ||
    input.intent === "restored"
  ) {
    return {
      sourceVersion: last.sourceVersion,
      approvalRevision: lastRevision + 1,
    };
  }

  if (input.nextContentHash !== last.contentHash) {
    return {
      sourceVersion: Math.max(lastSource, last.sourceVersion) + 1,
      approvalRevision: lastRevision + 1,
    };
  }

  return {
    sourceVersion: last.sourceVersion,
    approvalRevision: lastRevision + 1,
  };
}

function computeContentHashForTimesheet(timesheet: TimesheetRecord): string {
  if (!timesheet.organisationId?.trim() || !timesheet.legalEntityId?.trim()) {
    return `incomplete-scope:${timesheet.id}:${timesheet.totalMinutes}:${timesheet.sessionIds.join(",")}`;
  }
  return calculatePayrollContentHash({
    timesheetRecordId: timesheet.id,
    workforcePersonId: timesheet.personId,
    organisationId: timesheet.organisationId,
    legalEntityId: timesheet.legalEntityId,
    clinicId: timesheet.clinicId,
    periodStart: timesheet.periodStart,
    periodEnd: timesheet.periodEnd,
    attendanceSessionIds: timesheet.sessionIds,
    ordinaryHourInputs: mapOrdinaryHoursFromTotalMinutes(timesheet.totalMinutes),
    overtimeHourInputs: [],
    penaltyHourInputs: [],
    leaveInputs: [],
    allowanceInputs: [],
  });
}

export function enqueueAndAttemptPlatformPublication(input: {
  timesheet: TimesheetRecord;
  intent: PlatformPublicationIntent;
  publisherId: string;
  reasonCode?: string;
  clinicMembershipCheck?: ClinicMembershipCheck;
}): {
  timesheet: TimesheetRecord;
  outboxItem: PlatformPublicationOutboxItem;
  processResult: ProcessOutboxItemResult;
} {
  let nextContentHash: string;
  try {
    nextContentHash = computeContentHashForTimesheet(input.timesheet);
  } catch {
    nextContentHash = `unhashable:${input.timesheet.id}:${input.timesheet.totalMinutes}`;
  }

  let intent = input.intent;
  if (
    intent === "granted" &&
    input.timesheet.platformPublicationAck &&
    nextContentHash !== input.timesheet.platformPublicationAck.contentHash &&
    !nextContentHash.startsWith("incomplete-scope:")
  ) {
    intent = "revised";
  } else if (
    intent === "granted" &&
    input.timesheet.platformPublicationAck?.approvalState === "revoked"
  ) {
    intent = "restored";
  }

  const planned = planPublicationVersions({
    timesheet: input.timesheet,
    intent,
    nextContentHash,
  });

  const outboxItem = enqueuePlatformPublication({
    timesheet: input.timesheet,
    intent,
    publisherId: input.publisherId,
    sourceVersion: planned.sourceVersion,
    approvalRevision: planned.approvalRevision,
    reasonCode: input.reasonCode,
  });

  const processResult = processPublicationOutboxItem(outboxItem.id, {
    clinicMembershipCheck: input.clinicMembershipCheck,
  });

  const timesheet = getTimesheet(input.timesheet.id) ?? input.timesheet;
  return { timesheet, outboxItem: processResult.item, processResult };
}

/**
 * Typed compatibility support for withdrawn/invalidated — not operationally triggered by M06 UI.
 * Enqueues + attempts publication when called explicitly (tests / future authorised ops).
 */
export function publishTypedLifecycleCompatibility(input: {
  timesheet: TimesheetRecord;
  intent: "withdrawn" | "invalidated";
  publisherId: string;
  reasonCode: string;
  clinicMembershipCheck?: ClinicMembershipCheck;
}) {
  return enqueueAndAttemptPlatformPublication({
    timesheet: input.timesheet,
    intent: input.intent,
    publisherId: input.publisherId,
    reasonCode: input.reasonCode,
    clinicMembershipCheck: input.clinicMembershipCheck,
  });
}
