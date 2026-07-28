/**
 * M07 published-timesheet lifecycle repository — Checkpoint 2.6.
 */

import { readJsonSafe, uid, writeJsonSafe } from "@/platform/storage/storage";
import { M07_STORAGE_KEYS } from "../storage/keys";
import { runM07SchemaV5Migration } from "../storage/migrate-v5";
import type {
  PublishedTimesheetLifecycleDecision,
  PublishedTimesheetLifecycleEventApplication,
  PublishedTimesheetLifecycleException,
  PublishedTimesheetLifecycleProjection,
  PublishedTimesheetSnapshotEligibility,
} from "../types/domain";

function ensureMigrated() {
  runM07SchemaV5Migration();
}

function projectionKey(organisationId: string, legalEntityId: string, timesheetRecordId: string) {
  return `${organisationId}::${legalEntityId}::${timesheetRecordId}`;
}

function eligibilityKey(
  organisationId: string,
  legalEntityId: string,
  timesheetRecordId: string,
  sourceVersion: number
) {
  return `${organisationId}::${legalEntityId}::${timesheetRecordId}::${sourceVersion}`;
}

export function newLifecycleProjectionId() {
  return uid("pts_lcp");
}
export function newEligibilityId() {
  return uid("pts_elg");
}
export function newLifecycleDecisionId() {
  return uid("pts_lcd");
}
export function newLifecycleExceptionId() {
  return uid("pts_lex");
}
export function newLifecycleEventApplicationId() {
  return uid("pts_lea");
}

export function getLifecycleProjection(scope: {
  organisationId: string;
  legalEntityId: string;
  timesheetRecordId: string;
}): PublishedTimesheetLifecycleProjection | null {
  ensureMigrated();
  const key = projectionKey(scope.organisationId, scope.legalEntityId, scope.timesheetRecordId);
  return (
    readJsonSafe<PublishedTimesheetLifecycleProjection[]>(
      M07_STORAGE_KEYS.publishedTimesheetLifecycleProjections,
      []
    ).find(
      (p) =>
        projectionKey(p.organisationId, p.legalEntityId, p.timesheetRecordId) === key
    ) ?? null
  );
}

export function getLifecycleProjectionById(
  scope: { organisationId: string; legalEntityId: string },
  id: string
): PublishedTimesheetLifecycleProjection | null {
  ensureMigrated();
  const row = readJsonSafe<PublishedTimesheetLifecycleProjection[]>(
    M07_STORAGE_KEYS.publishedTimesheetLifecycleProjections,
    []
  ).find((p) => p.id === id);
  if (!row) return null;
  if (row.organisationId !== scope.organisationId || row.legalEntityId !== scope.legalEntityId) {
    return null;
  }
  return row;
}

export function upsertLifecycleProjection(
  projection: PublishedTimesheetLifecycleProjection
): PublishedTimesheetLifecycleProjection {
  ensureMigrated();
  const list = readJsonSafe<PublishedTimesheetLifecycleProjection[]>(
    M07_STORAGE_KEYS.publishedTimesheetLifecycleProjections,
    []
  );
  const key = projectionKey(
    projection.organisationId,
    projection.legalEntityId,
    projection.timesheetRecordId
  );
  const idx = list.findIndex(
    (p) => projectionKey(p.organisationId, p.legalEntityId, p.timesheetRecordId) === key
  );
  if (idx >= 0) list[idx] = projection;
  else list.push(projection);
  writeJsonSafe(M07_STORAGE_KEYS.publishedTimesheetLifecycleProjections, list);
  return projection;
}

export function ensureLifecycleProjection(input: {
  organisationId: string;
  legalEntityId: string;
  timesheetRecordId: string;
}): PublishedTimesheetLifecycleProjection {
  const existing = getLifecycleProjection(input);
  if (existing) return existing;
  return upsertLifecycleProjection({
    id: newLifecycleProjectionId(),
    organisationId: input.organisationId,
    legalEntityId: input.legalEntityId,
    timesheetRecordId: input.timesheetRecordId,
    hold: "none",
    selectedSnapshotId: null,
    supersessionState: "none",
    preparationProgress: "not-started",
    projectionVersion: 1,
    updatedAt: new Date().toISOString(),
  });
}

export function getSnapshotEligibility(input: {
  organisationId: string;
  legalEntityId: string;
  timesheetRecordId: string;
  sourceVersion: number;
}): PublishedTimesheetSnapshotEligibility | null {
  ensureMigrated();
  const key = eligibilityKey(
    input.organisationId,
    input.legalEntityId,
    input.timesheetRecordId,
    input.sourceVersion
  );
  return (
    readJsonSafe<PublishedTimesheetSnapshotEligibility[]>(
      M07_STORAGE_KEYS.publishedTimesheetSnapshotEligibility,
      []
    ).find(
      (e) =>
        eligibilityKey(e.organisationId, e.legalEntityId, e.timesheetRecordId, e.sourceVersion) ===
        key
    ) ?? null
  );
}

export function getSnapshotEligibilityBySnapshotId(scope: {
  organisationId: string;
  legalEntityId: string;
  snapshotId: string;
}): PublishedTimesheetSnapshotEligibility | null {
  ensureMigrated();
  const row = readJsonSafe<PublishedTimesheetSnapshotEligibility[]>(
    M07_STORAGE_KEYS.publishedTimesheetSnapshotEligibility,
    []
  ).find((e) => e.snapshotId === scope.snapshotId);
  if (!row) return null;
  if (row.organisationId !== scope.organisationId || row.legalEntityId !== scope.legalEntityId) {
    return null;
  }
  return row;
}

export function upsertSnapshotEligibility(
  row: PublishedTimesheetSnapshotEligibility
): PublishedTimesheetSnapshotEligibility {
  ensureMigrated();
  const list = readJsonSafe<PublishedTimesheetSnapshotEligibility[]>(
    M07_STORAGE_KEYS.publishedTimesheetSnapshotEligibility,
    []
  );
  const key = eligibilityKey(
    row.organisationId,
    row.legalEntityId,
    row.timesheetRecordId,
    row.sourceVersion
  );
  const idx = list.findIndex(
    (e) =>
      eligibilityKey(e.organisationId, e.legalEntityId, e.timesheetRecordId, e.sourceVersion) ===
      key
  );
  if (idx >= 0) list[idx] = row;
  else list.push(row);
  writeJsonSafe(M07_STORAGE_KEYS.publishedTimesheetSnapshotEligibility, list);
  return row;
}

export function listSnapshotEligibility(scope: {
  organisationId: string;
  legalEntityId: string;
  timesheetRecordId: string;
}): PublishedTimesheetSnapshotEligibility[] {
  ensureMigrated();
  return readJsonSafe<PublishedTimesheetSnapshotEligibility[]>(
    M07_STORAGE_KEYS.publishedTimesheetSnapshotEligibility,
    []
  ).filter(
    (e) =>
      e.organisationId === scope.organisationId &&
      e.legalEntityId === scope.legalEntityId &&
      e.timesheetRecordId === scope.timesheetRecordId
  );
}

export function appendLifecycleDecision(
  decision: PublishedTimesheetLifecycleDecision
): PublishedTimesheetLifecycleDecision {
  ensureMigrated();
  const list = readJsonSafe<PublishedTimesheetLifecycleDecision[]>(
    M07_STORAGE_KEYS.publishedTimesheetLifecycleDecisions,
    []
  );
  writeJsonSafe(M07_STORAGE_KEYS.publishedTimesheetLifecycleDecisions, [...list, decision]);
  return decision;
}

export function listLifecycleDecisions(scope: {
  organisationId: string;
  legalEntityId: string;
  timesheetRecordId?: string;
}): PublishedTimesheetLifecycleDecision[] {
  ensureMigrated();
  return readJsonSafe<PublishedTimesheetLifecycleDecision[]>(
    M07_STORAGE_KEYS.publishedTimesheetLifecycleDecisions,
    []
  ).filter((d) => {
    if (d.organisationId !== scope.organisationId) return false;
    if (d.legalEntityId !== scope.legalEntityId) return false;
    if (scope.timesheetRecordId && d.timesheetRecordId !== scope.timesheetRecordId) return false;
    return true;
  });
}

export function appendLifecycleException(
  row: PublishedTimesheetLifecycleException
): PublishedTimesheetLifecycleException {
  ensureMigrated();
  const list = readJsonSafe<PublishedTimesheetLifecycleException[]>(
    M07_STORAGE_KEYS.publishedTimesheetLifecycleExceptions,
    []
  );
  writeJsonSafe(M07_STORAGE_KEYS.publishedTimesheetLifecycleExceptions, [...list, row]);
  return row;
}

export function upsertLifecycleException(
  row: PublishedTimesheetLifecycleException
): PublishedTimesheetLifecycleException {
  ensureMigrated();
  const list = readJsonSafe<PublishedTimesheetLifecycleException[]>(
    M07_STORAGE_KEYS.publishedTimesheetLifecycleExceptions,
    []
  );
  const idx = list.findIndex((e) => e.id === row.id);
  if (idx >= 0) list[idx] = row;
  else list.push(row);
  writeJsonSafe(M07_STORAGE_KEYS.publishedTimesheetLifecycleExceptions, list);
  return row;
}

export function listLifecycleExceptions(scope: {
  organisationId: string;
  legalEntityId: string;
  timesheetRecordId?: string;
}): PublishedTimesheetLifecycleException[] {
  ensureMigrated();
  return readJsonSafe<PublishedTimesheetLifecycleException[]>(
    M07_STORAGE_KEYS.publishedTimesheetLifecycleExceptions,
    []
  ).filter((e) => {
    if (e.organisationId !== scope.organisationId) return false;
    if (e.legalEntityId !== scope.legalEntityId) return false;
    if (scope.timesheetRecordId && e.timesheetRecordId !== scope.timesheetRecordId) return false;
    return true;
  });
}

export function getLifecycleEventApplication(scope: {
  organisationId: string;
  legalEntityId: string;
  eventId: string;
}): PublishedTimesheetLifecycleEventApplication | null {
  ensureMigrated();
  return (
    readJsonSafe<PublishedTimesheetLifecycleEventApplication[]>(
      M07_STORAGE_KEYS.publishedTimesheetLifecycleEventApplications,
      []
    ).find(
      (a) =>
        a.organisationId === scope.organisationId &&
        a.legalEntityId === scope.legalEntityId &&
        a.eventId === scope.eventId
    ) ?? null
  );
}

export function appendLifecycleEventApplication(
  row: PublishedTimesheetLifecycleEventApplication
): PublishedTimesheetLifecycleEventApplication {
  ensureMigrated();
  const existing = getLifecycleEventApplication(row);
  if (existing) return existing;
  const list = readJsonSafe<PublishedTimesheetLifecycleEventApplication[]>(
    M07_STORAGE_KEYS.publishedTimesheetLifecycleEventApplications,
    []
  );
  writeJsonSafe(M07_STORAGE_KEYS.publishedTimesheetLifecycleEventApplications, [
    ...list,
    row,
  ]);
  return row;
}
