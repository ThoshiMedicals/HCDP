/**
 * M07 published-timesheet replay checkpoint repository — Checkpoint 2.5.
 */

import { readJsonSafe, uid, writeJsonSafe } from "@/platform/storage/storage";
import { M07_STORAGE_KEYS } from "../storage/keys";
import { runM07SchemaV4Migration } from "../storage/migrate-v4";
import type {
  PublishedTimesheetReplayCheckpoint,
  PublishedTimesheetReplayEventOutcome,
} from "../types/domain";
import {
  M07_PUBLISHED_TIMESHEET_REPLAY_STREAM,
} from "../types/domain";

function ensureMigrated() {
  runM07SchemaV4Migration();
}

export function replayCheckpointKey(input: {
  organisationId: string;
  legalEntityId: string;
  clinicId?: string;
  streamPurpose?: string;
  contractVersion: string;
}): string {
  const clinic = input.clinicId?.trim() ? input.clinicId.trim() : "*";
  const stream = input.streamPurpose ?? M07_PUBLISHED_TIMESHEET_REPLAY_STREAM;
  return `${input.organisationId}::${input.legalEntityId}::${clinic}::${stream}::${input.contractVersion}`;
}

export function listReplayCheckpoints(scope?: {
  organisationId: string;
  legalEntityId: string;
}): PublishedTimesheetReplayCheckpoint[] {
  ensureMigrated();
  const all = readJsonSafe<PublishedTimesheetReplayCheckpoint[]>(
    M07_STORAGE_KEYS.publishedTimesheetReplayCheckpoints,
    []
  );
  if (!scope) return all;
  return all.filter(
    (c) =>
      c.organisationId === scope.organisationId && c.legalEntityId === scope.legalEntityId
  );
}

export function getReplayCheckpoint(input: {
  organisationId: string;
  legalEntityId: string;
  clinicId?: string;
  contractVersion: string;
}): PublishedTimesheetReplayCheckpoint | null {
  ensureMigrated();
  const key = replayCheckpointKey(input);
  return (
    listReplayCheckpoints().find((c) => replayCheckpointKey(c) === key) ?? null
  );
}

export function getReplayCheckpointById(
  scope: { organisationId: string; legalEntityId: string },
  checkpointId: string
): PublishedTimesheetReplayCheckpoint | null {
  ensureMigrated();
  const row = listReplayCheckpoints().find((c) => c.id === checkpointId);
  if (!row) return null;
  if (row.organisationId !== scope.organisationId || row.legalEntityId !== scope.legalEntityId) {
    return null;
  }
  return row;
}

export function upsertReplayCheckpoint(
  checkpoint: PublishedTimesheetReplayCheckpoint
): PublishedTimesheetReplayCheckpoint {
  ensureMigrated();
  const list = readJsonSafe<PublishedTimesheetReplayCheckpoint[]>(
    M07_STORAGE_KEYS.publishedTimesheetReplayCheckpoints,
    []
  );
  const key = replayCheckpointKey(checkpoint);
  const idx = list.findIndex((c) => replayCheckpointKey(c) === key);
  if (idx >= 0) list[idx] = checkpoint;
  else list.push(checkpoint);
  writeJsonSafe(M07_STORAGE_KEYS.publishedTimesheetReplayCheckpoints, list);
  return checkpoint;
}

export function ensureReplayCheckpoint(input: {
  organisationId: string;
  legalEntityId: string;
  clinicId?: string;
  contractVersion: string;
}): PublishedTimesheetReplayCheckpoint {
  const existing = getReplayCheckpoint(input);
  if (existing) return existing;
  const now = new Date().toISOString();
  return upsertReplayCheckpoint({
    id: uid("pts_rpl"),
    organisationId: input.organisationId,
    legalEntityId: input.legalEntityId,
    clinicId: input.clinicId,
    streamPurpose: M07_PUBLISHED_TIMESHEET_REPLAY_STREAM,
    contractVersion: input.contractVersion,
    lastCompletedEventSequence: 0,
    lastCompletedEventId: null,
    checkpointVersion: 1,
    updatedAt: now,
    status: "active",
  });
}

export function listReplayOutcomes(scope: {
  organisationId: string;
  legalEntityId: string;
  eventId?: string;
}): PublishedTimesheetReplayEventOutcome[] {
  ensureMigrated();
  return readJsonSafe<PublishedTimesheetReplayEventOutcome[]>(
    M07_STORAGE_KEYS.publishedTimesheetReplayOutcomes,
    []
  ).filter((o) => {
    if (o.organisationId !== scope.organisationId) return false;
    if (o.legalEntityId !== scope.legalEntityId) return false;
    if (scope.eventId && o.eventId !== scope.eventId) return false;
    return true;
  });
}

export function getReplayOutcomeByEventId(input: {
  organisationId: string;
  legalEntityId: string;
  eventId: string;
}): PublishedTimesheetReplayEventOutcome | null {
  return listReplayOutcomes(input)[0] ?? null;
}

export function appendReplayOutcome(
  outcome: PublishedTimesheetReplayEventOutcome
): PublishedTimesheetReplayEventOutcome {
  ensureMigrated();
  const list = readJsonSafe<PublishedTimesheetReplayEventOutcome[]>(
    M07_STORAGE_KEYS.publishedTimesheetReplayOutcomes,
    []
  );
  const existingIdx = list.findIndex(
    (o) =>
      o.organisationId === outcome.organisationId &&
      o.legalEntityId === outcome.legalEntityId &&
      o.eventId === outcome.eventId
  );
  if (existingIdx >= 0) {
    // Idempotent: keep first durable outcome unless conflict upgrade.
    const existing = list[existingIdx]!;
    if (
      existing.outcome !== "conflict" &&
      outcome.outcome === "conflict"
    ) {
      list[existingIdx] = outcome;
      writeJsonSafe(M07_STORAGE_KEYS.publishedTimesheetReplayOutcomes, list);
      return outcome;
    }
    return existing;
  }
  writeJsonSafe(M07_STORAGE_KEYS.publishedTimesheetReplayOutcomes, [...list, outcome]);
  return outcome;
}

export function newReplayOutcomeId(): string {
  return uid("pts_rpo");
}
