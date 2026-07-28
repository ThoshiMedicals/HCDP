/**
 * Version-preserving PublishedTimesheetRegistry — Checkpoint 2.1.
 *
 * Append-only published-version store + independently maintained current-state index.
 * M07 must not write this registry. Platform owns publication/read model only.
 *
 * Atomicity (localStorage): write version → write event → update current index.
 * On interruption, rebuildCurrentIndexFromHistory() recovers derived state from
 * immutable history without deleting valid version rows.
 */

import { uid, readJsonSafe, writeJsonSafe, runMigrationOnce } from "@/platform/storage/storage";
import {
  PUBLISHED_TIMESHEET_CONTRACT_VERSION,
  type PublishTimesheetInput,
  type PublishedTimesheetCurrentIndex,
  type PublishedTimesheetVersion,
  type TimesheetApprovalState,
} from "../contracts/published-timesheet-contract";
import { verifyOrCalculatePayrollContentHash } from "../contracts/published-timesheet-hash";
import {
  createTimesheetApprovalLifecycleEvent,
  type TimesheetApprovalLifecycleEvent,
} from "../contracts/timesheet-approval-events";
import {
  eventTypeForApprovalState,
  validatePublishTimesheetInput,
  validatePublishedTimesheetContractVersion,
  type ClinicMembershipCheck,
} from "../validation/published-timesheet-validation";

export const PUBLISHED_TIMESHEET_REGISTRY_MIGRATION_ID =
  "platform-published-timesheet-registry-v1";
export const PUBLISHED_TIMESHEET_REGISTRY_STORAGE_VERSION = 1;

export const PUBLISHED_TIMESHEET_REGISTRY_KEYS = {
  versions: "pulse.platform.workforce.publishedTimesheets.versions",
  current: "pulse.platform.workforce.publishedTimesheets.current",
  events: "pulse.platform.workforce.publishedTimesheets.events",
  meta: "pulse.platform.workforce.publishedTimesheets.meta",
} as const;

export class PublishedTimesheetRegistryError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "PublishedTimesheetRegistryError";
    this.code = code;
  }
}

export type PublishTimesheetResult =
  | { status: "published"; version: PublishedTimesheetVersion; event: TimesheetApprovalLifecycleEvent }
  | { status: "idempotent"; version: PublishedTimesheetVersion; event: TimesheetApprovalLifecycleEvent };

export type RegistryQueryScope = {
  organisationId: string;
  legalEntityId: string;
};

function versionKey(organisationId: string, legalEntityId: string, timesheetRecordId: string, sourceVersion: number) {
  return `${organisationId}::${legalEntityId}::${timesheetRecordId}::${sourceVersion}`;
}

function currentKey(organisationId: string, legalEntityId: string, timesheetRecordId: string) {
  return `${organisationId}::${legalEntityId}::${timesheetRecordId}`;
}

function readVersions(): PublishedTimesheetVersion[] {
  return readJsonSafe<PublishedTimesheetVersion[]>(PUBLISHED_TIMESHEET_REGISTRY_KEYS.versions, []);
}

function writeVersions(rows: PublishedTimesheetVersion[]) {
  writeJsonSafe(PUBLISHED_TIMESHEET_REGISTRY_KEYS.versions, rows);
}

function readCurrentMap(): Record<string, PublishedTimesheetCurrentIndex> {
  return readJsonSafe<Record<string, PublishedTimesheetCurrentIndex>>(
    PUBLISHED_TIMESHEET_REGISTRY_KEYS.current,
    {}
  );
}

function writeCurrentMap(map: Record<string, PublishedTimesheetCurrentIndex>) {
  writeJsonSafe(PUBLISHED_TIMESHEET_REGISTRY_KEYS.current, map);
}

function readEvents(): TimesheetApprovalLifecycleEvent[] {
  return readJsonSafe<TimesheetApprovalLifecycleEvent[]>(PUBLISHED_TIMESHEET_REGISTRY_KEYS.events, []);
}

function writeEvents(events: TimesheetApprovalLifecycleEvent[]) {
  writeJsonSafe(PUBLISHED_TIMESHEET_REGISTRY_KEYS.events, events);
}

function nextEventSequence(events: TimesheetApprovalLifecycleEvent[]): number {
  let max = 0;
  for (const e of events) {
    if (typeof e.eventSequence === "number" && e.eventSequence > max) max = e.eventSequence;
  }
  return max + 1;
}

function assertTenantMatch(
  row: { organisationId: string; legalEntityId: string },
  scope: RegistryQueryScope
): void {
  if (row.organisationId !== scope.organisationId || row.legalEntityId !== scope.legalEntityId) {
    throw new PublishedTimesheetRegistryError(
      "TENANT_ISOLATION",
      "Publication is not visible outside its organisation/legal-entity scope"
    );
  }
}

/**
 * Additive, idempotent, insert-if-absent migration. Non-destructive.
 * Does not wipe Batch 1 or other module data.
 */
export function runPublishedTimesheetRegistryMigration(): boolean {
  return runMigrationOnce(
    PUBLISHED_TIMESHEET_REGISTRY_MIGRATION_ID,
    PUBLISHED_TIMESHEET_REGISTRY_STORAGE_VERSION,
    () => {
      const versions = readVersions();
      if (!Array.isArray(versions)) writeVersions([]);
      else if (versions.length === 0) writeVersions([]);

      const current = readCurrentMap();
      if (current == null || typeof current !== "object" || Array.isArray(current)) {
        writeCurrentMap({});
      }

      const events = readEvents();
      if (!Array.isArray(events)) writeEvents([]);
      else if (events.length === 0) writeEvents([]);

      const meta = readJsonSafe<{ version?: number } | null>(PUBLISHED_TIMESHEET_REGISTRY_KEYS.meta, null);
      if (!meta || meta.version !== PUBLISHED_TIMESHEET_REGISTRY_STORAGE_VERSION) {
        writeJsonSafe(PUBLISHED_TIMESHEET_REGISTRY_KEYS.meta, {
          version: PUBLISHED_TIMESHEET_REGISTRY_STORAGE_VERSION,
          migratedAt: new Date().toISOString(),
        });
      }
    }
  );
}

/**
 * Rebuild current-index from immutable version + event history.
 * Prefer highest sourceVersion per record; within that, highest approvalRevision
 * from events (or from the matching version row).
 */
export function rebuildCurrentIndexFromHistory(): Record<string, PublishedTimesheetCurrentIndex> {
  const versions = readVersions();
  const events = readEvents();
  const map: Record<string, PublishedTimesheetCurrentIndex> = {};

  for (const v of versions) {
    const ck = currentKey(v.organisationId, v.legalEntityId, v.timesheetRecordId);
    const existing = map[ck];
    if (!existing || v.sourceVersion > existing.currentSourceVersion) {
      map[ck] = {
        organisationId: v.organisationId,
        legalEntityId: v.legalEntityId,
        timesheetRecordId: v.timesheetRecordId,
        currentSourceVersion: v.sourceVersion,
        currentApprovalRevision: v.approvalRevision,
        currentApprovalState: v.approvalState,
        currentContentHash: v.contentHash,
        currentRegistryPublicationId: v.registryPublicationId,
        latestEventSequence: v.eventSequence,
        updatedAt: v.publishedAt,
      };
    } else if (v.sourceVersion === existing.currentSourceVersion) {
      // Prefer higher approvalRevision for same content version.
      if (v.approvalRevision > existing.currentApprovalRevision) {
        map[ck] = {
          ...existing,
          currentApprovalRevision: v.approvalRevision,
          currentApprovalState: v.approvalState,
          currentContentHash: v.contentHash,
          currentRegistryPublicationId: v.registryPublicationId,
          latestEventSequence: Math.max(existing.latestEventSequence, v.eventSequence),
          updatedAt: v.publishedAt,
        };
      }
    }
  }

  // Apply later lifecycle-only events that may advance approval without new version row.
  const sortedEvents = [...events].sort((a, b) => a.eventSequence - b.eventSequence);
  for (const e of sortedEvents) {
    const ck = currentKey(e.organisationId, e.legalEntityId, e.timesheetRecordId);
    const existing = map[ck];
    if (!existing) continue;
    if (e.approvalRevision < existing.currentApprovalRevision) continue;
    if (e.eventSequence < existing.latestEventSequence) continue;
    if (
      e.approvalRevision > existing.currentApprovalRevision ||
      e.eventSequence > existing.latestEventSequence
    ) {
      map[ck] = {
        ...existing,
        currentApprovalRevision: e.approvalRevision,
        currentApprovalState: e.approvalState,
        currentContentHash: e.contentHash ?? existing.currentContentHash,
        latestEventSequence: Math.max(existing.latestEventSequence, e.eventSequence),
        updatedAt: e.occurredAt,
      };
    }
  }

  writeCurrentMap(map);
  return map;
}

export type PublishOptions = {
  clinicMembershipCheck?: ClinicMembershipCheck;
  /**
   * Test hook: interrupt after writing version (before event/current) to simulate
   * partial publication. Recovery rebuilds current from history.
   */
  interruptAfterVersionWrite?: boolean;
};

export function publishTimesheetVersion(
  input: PublishTimesheetInput,
  options?: PublishOptions
): PublishTimesheetResult {
  runPublishedTimesheetRegistryMigration();

  const validation = validatePublishTimesheetInput(input, {
    clinicMembershipCheck: options?.clinicMembershipCheck,
  });
  if (!validation.ok) {
    throw new PublishedTimesheetRegistryError(
      "VALIDATION",
      validation.issues.map((i) => `${i.field}: ${i.message}`).join("; ")
    );
  }

  const contractCheck = validatePublishedTimesheetContractVersion(
    PUBLISHED_TIMESHEET_CONTRACT_VERSION
  );
  if (!contractCheck.ok) {
    throw new PublishedTimesheetRegistryError("UNSUPPORTED_CONTRACT", "Unsupported contract version");
  }

  let contentHash: string;
  try {
    contentHash = verifyOrCalculatePayrollContentHash(input.content, input.contentHash);
  } catch (err) {
    throw new PublishedTimesheetRegistryError(
      "CONTENT_HASH",
      err instanceof Error ? err.message : "contentHash verification failed"
    );
  }

  const versions = readVersions();
  const events = readEvents();
  const currentMap = readCurrentMap();

  // Idempotency: exact retry by eventId / idempotencyKey
  const priorByEvent = events.find(
    (e) => e.eventId === input.eventId || e.idempotencyKey === input.idempotencyKey
  );
  if (priorByEvent) {
    const priorVersion = versions.find(
      (v) =>
        v.eventId === input.eventId ||
        v.idempotencyKey === input.idempotencyKey ||
        (v.organisationId === input.content.organisationId &&
          v.legalEntityId === input.content.legalEntityId &&
          v.timesheetRecordId === input.content.timesheetRecordId &&
          v.sourceVersion === input.sourceVersion &&
          v.contentHash === contentHash &&
          v.approvalRevision === input.approvalRevision)
    );
    if (
      priorByEvent.organisationId !== input.content.organisationId ||
      priorByEvent.legalEntityId !== input.content.legalEntityId ||
      priorByEvent.timesheetRecordId !== input.content.timesheetRecordId ||
      priorByEvent.affectedSourceVersion !== input.sourceVersion ||
      priorByEvent.approvalRevision !== input.approvalRevision ||
      (priorByEvent.contentHash && priorByEvent.contentHash !== contentHash) ||
      priorByEvent.approvalState !== input.approvalState
    ) {
      throw new PublishedTimesheetRegistryError(
        "IDEMPOTENCY_CONFLICT",
        "idempotencyKey/eventId reused with different content or lifecycle payload"
      );
    }
    if (!priorVersion) {
      throw new PublishedTimesheetRegistryError(
        "CORRUPT_REGISTRY",
        "Event exists without matching version history; rebuild required"
      );
    }
    return { status: "idempotent", version: priorVersion, event: priorByEvent };
  }

  const vk = versionKey(
    input.content.organisationId,
    input.content.legalEntityId,
    input.content.timesheetRecordId,
    input.sourceVersion
  );
  const existingSameVersion = versions.find(
    (v) =>
      versionKey(v.organisationId, v.legalEntityId, v.timesheetRecordId, v.sourceVersion) === vk
  );
  if (existingSameVersion && existingSameVersion.contentHash !== contentHash) {
    throw new PublishedTimesheetRegistryError(
      "VERSION_HASH_CONFLICT",
      "Same sourceVersion with different contentHash is rejected"
    );
  }

  const ck = currentKey(
    input.content.organisationId,
    input.content.legalEntityId,
    input.content.timesheetRecordId
  );
  const current = currentMap[ck];

  if (current) {
    if (input.sourceVersion < current.currentSourceVersion) {
      throw new PublishedTimesheetRegistryError(
        "SOURCE_VERSION_REGRESSION",
        "Lower sourceVersion cannot regress current content"
      );
    }
    if (
      input.sourceVersion === current.currentSourceVersion &&
      contentHash !== current.currentContentHash
    ) {
      throw new PublishedTimesheetRegistryError(
        "VERSION_HASH_CONFLICT",
        "Same sourceVersion with different contentHash is rejected"
      );
    }
    if (input.approvalRevision < current.currentApprovalRevision) {
      throw new PublishedTimesheetRegistryError(
        "APPROVAL_REVISION_REGRESSION",
        "Stale approvalRevision cannot regress lifecycle state"
      );
    }
    if (
      input.approvalRevision === current.currentApprovalRevision &&
      input.approvalState !== current.currentApprovalState
    ) {
      throw new PublishedTimesheetRegistryError(
        "APPROVAL_REVISION_CONFLICT",
        "Same approvalRevision with incompatible lifecycle state"
      );
    }
    if (input.eventSequence !== undefined && input.eventSequence <= current.latestEventSequence) {
      throw new PublishedTimesheetRegistryError(
        "EVENT_OUT_OF_ORDER",
        "Out-of-order eventSequence would regress current lifecycle projection"
      );
    }
  }

  const eventSequence =
    input.eventSequence !== undefined ? input.eventSequence : nextEventSequence(events);

  if (events.some((e) => e.eventSequence === eventSequence)) {
    throw new PublishedTimesheetRegistryError(
      "EVENT_SEQUENCE_CONFLICT",
      "eventSequence already used"
    );
  }

  /**
   * Lifecycle-only: same sourceVersion + same contentHash + advanced approvalRevision.
   * Append event + advance current index; do not overwrite or duplicate the version row.
   */
  const isLifecycleOnly =
    !!existingSameVersion &&
    existingSameVersion.contentHash === contentHash &&
    input.approvalRevision > (current?.currentApprovalRevision ?? existingSameVersion.approvalRevision);

  if (existingSameVersion && !isLifecycleOnly) {
    if (
      existingSameVersion.approvalRevision === input.approvalRevision &&
      existingSameVersion.approvalState === input.approvalState
    ) {
      throw new PublishedTimesheetRegistryError(
        "VERSION_EXISTS",
        "Published sourceVersion already exists; use identical eventId for idempotent retry"
      );
    }
    if (existingSameVersion.approvalRevision === input.approvalRevision) {
      throw new PublishedTimesheetRegistryError(
        "APPROVAL_REVISION_CONFLICT",
        "Same approvalRevision with incompatible lifecycle state"
      );
    }
  }

  const event = createTimesheetApprovalLifecycleEvent({
    eventType: eventTypeForApprovalState(input.approvalState),
    eventId: input.eventId,
    idempotencyKey: input.idempotencyKey,
    eventSequence,
    timesheetRecordId: input.content.timesheetRecordId,
    affectedSourceVersion: input.sourceVersion,
    approvalRevision: input.approvalRevision,
    organisationId: input.content.organisationId,
    legalEntityId: input.content.legalEntityId,
    clinicId: input.content.clinicId,
    reasonCode: input.reasonCode,
    occurredAt: input.publishedAt,
    publisherId: input.publisherId,
    contentHash,
    approvalState: input.approvalState,
    previousSourceVersion: current?.currentSourceVersion,
    previousApprovalRevision: current?.currentApprovalRevision,
  });

  if (isLifecycleOnly && existingSameVersion) {
    writeEvents([...events, event]);
    currentMap[ck] = {
      organisationId: existingSameVersion.organisationId,
      legalEntityId: existingSameVersion.legalEntityId,
      timesheetRecordId: existingSameVersion.timesheetRecordId,
      currentSourceVersion: existingSameVersion.sourceVersion,
      currentApprovalRevision: input.approvalRevision,
      currentApprovalState: input.approvalState,
      currentContentHash: existingSameVersion.contentHash,
      currentRegistryPublicationId: existingSameVersion.registryPublicationId,
      latestEventSequence: eventSequence,
      updatedAt: input.publishedAt,
    };
    writeCurrentMap(currentMap);
    // Immutable version row preserved; lifecycle projection is in event + current index.
    return { status: "published", version: existingSameVersion, event };
  }

  const registryPublicationId = uid("pts");
  const version: PublishedTimesheetVersion = {
    ...input.content,
    contractVersion: PUBLISHED_TIMESHEET_CONTRACT_VERSION,
    sourceVersion: input.sourceVersion,
    approvalRevision: input.approvalRevision,
    approvalState: input.approvalState,
    contentHash,
    publishedAt: input.publishedAt,
    publisherId: input.publisherId,
    eventId: input.eventId,
    idempotencyKey: input.idempotencyKey,
    eventSequence,
    registryPublicationId,
    reasonCode: input.reasonCode,
  };

  // Atomic publication sequence (best-effort for localStorage):
  // 1) append immutable version  2) append event  3) advance current index
  writeVersions([...versions, version]);

  if (options?.interruptAfterVersionWrite) {
    throw new PublishedTimesheetRegistryError(
      "INTERRUPTED_PUBLICATION",
      "Interrupted after version write (test/recovery scenario)"
    );
  }

  writeEvents([...events, event]);

  currentMap[ck] = {
    organisationId: version.organisationId,
    legalEntityId: version.legalEntityId,
    timesheetRecordId: version.timesheetRecordId,
    currentSourceVersion: version.sourceVersion,
    currentApprovalRevision: version.approvalRevision,
    currentApprovalState: version.approvalState,
    currentContentHash: version.contentHash,
    currentRegistryPublicationId: version.registryPublicationId,
    latestEventSequence: version.eventSequence,
    updatedAt: version.publishedAt,
  };
  writeCurrentMap(currentMap);

  return { status: "published", version, event };
}

/** Exact version lookup — tenant-scoped; guessing another org's id fails closed. */
export function getPublishedTimesheetVersion(
  scope: RegistryQueryScope,
  timesheetRecordId: string,
  sourceVersion: number
): PublishedTimesheetVersion | null {
  runPublishedTimesheetRegistryMigration();
  const row = readVersions().find(
    (v) =>
      v.organisationId === scope.organisationId &&
      v.legalEntityId === scope.legalEntityId &&
      v.timesheetRecordId === timesheetRecordId &&
      v.sourceVersion === sourceVersion
  );
  return row ?? null;
}

/** Lookup by registryPublicationId — still requires matching tenant scope. */
export function getPublishedTimesheetByRegistryId(
  scope: RegistryQueryScope,
  registryPublicationId: string
): PublishedTimesheetVersion | null {
  runPublishedTimesheetRegistryMigration();
  const row = readVersions().find((v) => v.registryPublicationId === registryPublicationId);
  if (!row) return null;
  try {
    assertTenantMatch(row, scope);
  } catch {
    return null;
  }
  return row;
}

export function getCurrentPublishedTimesheet(
  scope: RegistryQueryScope,
  timesheetRecordId: string
): PublishedTimesheetCurrentIndex | null {
  runPublishedTimesheetRegistryMigration();
  const row = readCurrentMap()[currentKey(scope.organisationId, scope.legalEntityId, timesheetRecordId)];
  return row ?? null;
}

export function listPublishedTimesheetVersions(
  scope: RegistryQueryScope,
  filter?: {
    timesheetRecordId?: string;
    periodOverlaps?: { start: string; end: string };
    approvalStates?: TimesheetApprovalState[];
  }
): PublishedTimesheetVersion[] {
  runPublishedTimesheetRegistryMigration();
  return readVersions().filter((v) => {
    if (v.organisationId !== scope.organisationId) return false;
    if (v.legalEntityId !== scope.legalEntityId) return false;
    if (filter?.timesheetRecordId && v.timesheetRecordId !== filter.timesheetRecordId) return false;
    if (filter?.approvalStates && !filter.approvalStates.includes(v.approvalState)) return false;
    if (filter?.periodOverlaps) {
      if (v.periodEnd < filter.periodOverlaps.start || v.periodStart > filter.periodOverlaps.end) {
        return false;
      }
    }
    return true;
  });
}

export function listCurrentByApprovalState(
  scope: RegistryQueryScope,
  states: TimesheetApprovalState[]
): PublishedTimesheetCurrentIndex[] {
  runPublishedTimesheetRegistryMigration();
  return Object.values(readCurrentMap()).filter(
    (c) =>
      c.organisationId === scope.organisationId &&
      c.legalEntityId === scope.legalEntityId &&
      states.includes(c.currentApprovalState)
  );
}

/** Ordered replay from exclusive cursor (eventSequence). */
export function replayPublishedTimesheetEvents(
  scope: RegistryQueryScope,
  afterEventSequence = 0
): TimesheetApprovalLifecycleEvent[] {
  runPublishedTimesheetRegistryMigration();
  return readEvents()
    .filter(
      (e) =>
        e.organisationId === scope.organisationId &&
        e.legalEntityId === scope.legalEntityId &&
        e.eventSequence > afterEventSequence
    )
    .sort((a, b) => a.eventSequence - b.eventSequence);
}

export function getPublicationLineage(
  scope: RegistryQueryScope,
  timesheetRecordId: string
): PublishedTimesheetVersion[] {
  return listPublishedTimesheetVersions(scope, { timesheetRecordId }).sort(
    (a, b) => a.sourceVersion - b.sourceVersion || a.approvalRevision - b.approvalRevision
  );
}

/**
 * Identity fields exposed for later M07 snapshot uniqueness:
 * organisationId + legalEntityId + timesheetRecordId + sourceVersion
 * (idempotencyKey is NOT part of snapshot business uniqueness).
 */
export function publishedIntakeIdentity(version: PublishedTimesheetVersion): {
  registryPublicationId: string;
  organisationId: string;
  legalEntityId: string;
  timesheetRecordId: string;
  sourceVersion: number;
  approvalRevision: number;
  contentHash: string;
  eventId: string;
  idempotencyKey: string;
  eventSequence: number;
  contractVersion: string;
} {
  return {
    registryPublicationId: version.registryPublicationId,
    organisationId: version.organisationId,
    legalEntityId: version.legalEntityId,
    timesheetRecordId: version.timesheetRecordId,
    sourceVersion: version.sourceVersion,
    approvalRevision: version.approvalRevision,
    contentHash: version.contentHash,
    eventId: version.eventId,
    idempotencyKey: version.idempotencyKey,
    eventSequence: version.eventSequence,
    contractVersion: version.contractVersion,
  };
}
