/**
 * M07 published-timesheet snapshot repository — Checkpoint 2.4.
 * Append-only immutable snapshots + derived indexes.
 */

import { readJsonSafe, uid, writeJsonSafe } from "@/platform/storage/storage";
import { M07_STORAGE_KEYS } from "../storage/keys";
import { runM07SchemaV3Migration } from "../storage/migrate-v3";
import type {
  PublishedTimesheetCurrentIntakeIndex,
  PublishedTimesheetSnapshotIndexEntry,
  PublishedTimesheetSourceSnapshot,
} from "../types/domain";

function ensureMigrated() {
  runM07SchemaV3Migration();
}

export function newSnapshotId(): string {
  return uid("pts_snap");
}

export function businessSnapshotKey(
  organisationId: string,
  legalEntityId: string,
  timesheetRecordId: string,
  sourceVersion: number
): string {
  return `${organisationId}::${legalEntityId}::${timesheetRecordId}::${sourceVersion}`;
}

export function currentIntakeKey(
  organisationId: string,
  legalEntityId: string,
  timesheetRecordId: string
): string {
  return `${organisationId}::${legalEntityId}::${timesheetRecordId}`;
}

export function listPublishedTimesheetSnapshots(scope?: {
  organisationId: string;
  legalEntityId: string;
  timesheetRecordId?: string;
}): PublishedTimesheetSourceSnapshot[] {
  ensureMigrated();
  const all = readJsonSafe<PublishedTimesheetSourceSnapshot[]>(
    M07_STORAGE_KEYS.publishedTimesheetSnapshots,
    []
  );
  if (!scope) return all;
  return all.filter((s) => {
    if (s.organisationId !== scope.organisationId) return false;
    if (s.legalEntityId !== scope.legalEntityId) return false;
    if (scope.timesheetRecordId && s.timesheetRecordId !== scope.timesheetRecordId) return false;
    return true;
  });
}

export function getPublishedTimesheetSnapshotById(
  scope: { organisationId: string; legalEntityId: string },
  snapshotId: string
): PublishedTimesheetSourceSnapshot | null {
  ensureMigrated();
  const row = listPublishedTimesheetSnapshots().find((s) => s.id === snapshotId);
  if (!row) return null;
  if (row.organisationId !== scope.organisationId || row.legalEntityId !== scope.legalEntityId) {
    return null; // fail closed — no cross-tenant existence leak
  }
  return row;
}

export function getPublishedTimesheetSnapshotByBusinessKey(input: {
  organisationId: string;
  legalEntityId: string;
  timesheetRecordId: string;
  sourceVersion: number;
}): PublishedTimesheetSourceSnapshot | null {
  ensureMigrated();
  const key = businessSnapshotKey(
    input.organisationId,
    input.legalEntityId,
    input.timesheetRecordId,
    input.sourceVersion
  );
  const index = readJsonSafe<PublishedTimesheetSnapshotIndexEntry[]>(
    M07_STORAGE_KEYS.publishedTimesheetSnapshotIndex,
    []
  );
  const entry = index.find(
    (e) =>
      businessSnapshotKey(e.organisationId, e.legalEntityId, e.timesheetRecordId, e.sourceVersion) ===
      key
  );
  if (!entry) {
    // Fallback scan immutable history (recovery path)
    return (
      listPublishedTimesheetSnapshots({
        organisationId: input.organisationId,
        legalEntityId: input.legalEntityId,
        timesheetRecordId: input.timesheetRecordId,
      }).find((s) => s.sourceVersion === input.sourceVersion) ?? null
    );
  }
  return getPublishedTimesheetSnapshotById(
    { organisationId: input.organisationId, legalEntityId: input.legalEntityId },
    entry.snapshotId
  );
}

export function getCurrentIntakeIndex(input: {
  organisationId: string;
  legalEntityId: string;
  timesheetRecordId: string;
}): PublishedTimesheetCurrentIntakeIndex | null {
  ensureMigrated();
  const map = readJsonSafe<Record<string, PublishedTimesheetCurrentIntakeIndex>>(
    M07_STORAGE_KEYS.publishedTimesheetCurrentIntake,
    {}
  );
  return map[currentIntakeKey(input.organisationId, input.legalEntityId, input.timesheetRecordId)] ?? null;
}

/**
 * Append immutable snapshot then update derived indexes.
 * Callers must not mutate returned snapshot objects in place for persistence.
 */
export function appendPublishedTimesheetSnapshot(
  snapshot: PublishedTimesheetSourceSnapshot
): PublishedTimesheetSourceSnapshot {
  ensureMigrated();
  const frozen: PublishedTimesheetSourceSnapshot = {
    ...snapshot,
    immutable: true,
    attendanceSessionIds: [...snapshot.attendanceSessionIds],
    ordinaryHourInputs: snapshot.ordinaryHourInputs.map((h) => ({ ...h })),
    overtimeHourInputs: snapshot.overtimeHourInputs.map((h) => ({ ...h })),
    penaltyHourInputs: snapshot.penaltyHourInputs.map((h) => ({ ...h })),
    leaveInputs: snapshot.leaveInputs.map((l) => ({ ...l })),
    allowanceInputs: snapshot.allowanceInputs.map((a) => ({ ...a })),
  };

  const list = readJsonSafe<PublishedTimesheetSourceSnapshot[]>(
    M07_STORAGE_KEYS.publishedTimesheetSnapshots,
    []
  );
  if (list.some((s) => s.id === frozen.id)) {
    return list.find((s) => s.id === frozen.id)!;
  }
  // Never overwrite an existing business-key row
  const existingSame = list.find(
    (s) =>
      s.organisationId === frozen.organisationId &&
      s.legalEntityId === frozen.legalEntityId &&
      s.timesheetRecordId === frozen.timesheetRecordId &&
      s.sourceVersion === frozen.sourceVersion
  );
  if (existingSame) return existingSame;

  writeJsonSafe(M07_STORAGE_KEYS.publishedTimesheetSnapshots, [...list, frozen]);

  const index = readJsonSafe<PublishedTimesheetSnapshotIndexEntry[]>(
    M07_STORAGE_KEYS.publishedTimesheetSnapshotIndex,
    []
  );
  if (
    !index.some(
      (e) =>
        e.organisationId === frozen.organisationId &&
        e.legalEntityId === frozen.legalEntityId &&
        e.timesheetRecordId === frozen.timesheetRecordId &&
        e.sourceVersion === frozen.sourceVersion
    )
  ) {
    writeJsonSafe(M07_STORAGE_KEYS.publishedTimesheetSnapshotIndex, [
      ...index,
      {
        organisationId: frozen.organisationId,
        legalEntityId: frozen.legalEntityId,
        timesheetRecordId: frozen.timesheetRecordId,
        sourceVersion: frozen.sourceVersion,
        snapshotId: frozen.id,
        contentHash: frozen.contentHash,
        registryPublicationId: frozen.registryPublicationId,
      },
    ]);
  }

  const map = readJsonSafe<Record<string, PublishedTimesheetCurrentIntakeIndex>>(
    M07_STORAGE_KEYS.publishedTimesheetCurrentIntake,
    {}
  );
  const ck = currentIntakeKey(frozen.organisationId, frozen.legalEntityId, frozen.timesheetRecordId);
  const cur = map[ck];
  if (!cur || frozen.sourceVersion >= cur.latestSourceVersion) {
    map[ck] = {
      organisationId: frozen.organisationId,
      legalEntityId: frozen.legalEntityId,
      timesheetRecordId: frozen.timesheetRecordId,
      latestSourceVersion: frozen.sourceVersion,
      latestSnapshotId: frozen.id,
      updatedAt: frozen.intakenAt,
    };
    writeJsonSafe(M07_STORAGE_KEYS.publishedTimesheetCurrentIntake, map);
  }

  return frozen;
}

/** Rebuild derived indexes from immutable snapshot history (recovery). */
export function rebuildPublishedTimesheetSnapshotIndexes(): {
  indexCount: number;
  currentCount: number;
} {
  ensureMigrated();
  const snapshots = readJsonSafe<PublishedTimesheetSourceSnapshot[]>(
    M07_STORAGE_KEYS.publishedTimesheetSnapshots,
    []
  );
  const index: PublishedTimesheetSnapshotIndexEntry[] = [];
  const current: Record<string, PublishedTimesheetCurrentIntakeIndex> = {};

  for (const s of snapshots) {
    if (!s?.id || !s.organisationId || !s.legalEntityId || !s.timesheetRecordId) continue;
    if (!Number.isInteger(s.sourceVersion) || s.sourceVersion < 1) continue;
    index.push({
      organisationId: s.organisationId,
      legalEntityId: s.legalEntityId,
      timesheetRecordId: s.timesheetRecordId,
      sourceVersion: s.sourceVersion,
      snapshotId: s.id,
      contentHash: s.contentHash,
      registryPublicationId: s.registryPublicationId,
    });
    const ck = currentIntakeKey(s.organisationId, s.legalEntityId, s.timesheetRecordId);
    const cur = current[ck];
    if (!cur || s.sourceVersion >= cur.latestSourceVersion) {
      current[ck] = {
        organisationId: s.organisationId,
        legalEntityId: s.legalEntityId,
        timesheetRecordId: s.timesheetRecordId,
        latestSourceVersion: s.sourceVersion,
        latestSnapshotId: s.id,
        updatedAt: s.intakenAt,
      };
    }
  }

  writeJsonSafe(M07_STORAGE_KEYS.publishedTimesheetSnapshotIndex, index);
  writeJsonSafe(M07_STORAGE_KEYS.publishedTimesheetCurrentIntake, current);
  return { indexCount: index.length, currentCount: Object.keys(current).length };
}
