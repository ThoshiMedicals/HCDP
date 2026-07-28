/**
 * M07 published-timesheet ordered replay coordinator — Checkpoint 2.5.
 *
 * Dependency direction:
 *   platform replayPublishedTimesheetEvents (tenant-scoped, ordered)
 *   → this coordinator (ordering/gap/cursor)
 *   → CP 2.4 intakePublishedTimesheet (for eligible grant/revise/restore)
 *   → immutable snapshots
 *
 * Does not mutate the platform registry or read pulse.m06.*. Global BLOCKED-M07 cleared at CP 2.7B; cursor safety remains independent.
 * Does not implement operational supersession or revocation holds (Checkpoint 2.6+).
 */

import { PUBLISHED_TIMESHEET_CONTRACT_VERSION } from "@/platform/workforce/contracts/published-timesheet-contract";
import type { TimesheetApprovalLifecycleEvent } from "@/platform/workforce/contracts/timesheet-approval-events";
import {
  getPublishedTimesheetVersion,
  replayPublishedTimesheetEvents,
} from "@/platform/workforce/services/published-timesheet-registry";
import type { ClinicMembershipCheck } from "@/platform/workforce/validation/published-timesheet-validation";
import {
  assertM07ClinicScope,
  assertM07LegalEntityScope,
  assertM07Permission,
  type M07Actor,
} from "../permissions";
import {
  appendReplayOutcome,
  ensureReplayCheckpoint,
  getReplayCheckpoint,
  getReplayCheckpointById,
  getReplayOutcomeByEventId,
  listReplayOutcomes,
  newReplayOutcomeId,
  upsertReplayCheckpoint,
} from "../repository/published-timesheet-replay";
import { recordM07Audit } from "./audit-service";
import {
  intakePublishedTimesheet,
  type IntakeScope,
} from "./published-timesheet-intake";
import {
  applyLifecycleHoldEvent,
  applyMaterialRevisionAfterIntake,
  findPriorSnapshotWithSameContentHash,
  recordSameContentLineage,
  seedEligibilityForImportedSnapshot,
} from "./published-timesheet-lifecycle";
import { runM07SchemaV4Migration } from "../storage/migrate-v4";
import { runM07SchemaV5Migration } from "../storage/migrate-v5";
import { listPublishedTimesheetSnapshots } from "../repository/published-timesheet-snapshots";
import type {
  PublishedTimesheetReplayCheckpoint,
  PublishedTimesheetReplayEventOutcome,
  PublishedTimesheetReplayOutcomeKind,
} from "../types/domain";
import {
  M07_PUBLISHED_TIMESHEET_REPLAY_STREAM,
} from "../types/domain";
import { m07GlobalBlockerFields } from "../adapters/m06-timesheet-read";

export const DEFAULT_REPLAY_BATCH_LIMIT = 25;

const INTAKE_ELIGIBLE_EVENT_TYPES = new Set([
  "timesheet.approval.granted",
  "timesheet.approval.revised",
  "timesheet.approval.restored",
]);

const LIFECYCLE_LATER_EVENT_TYPES = new Set([
  "timesheet.approval.revoked",
  "timesheet.record.withdrawn",
  "timesheet.record.invalidated",
]);

export type ReplayBatchResult = {
  checkpoint: PublishedTimesheetReplayCheckpoint;
  processed: PublishedTimesheetReplayEventOutcome[];
  moreAvailable: boolean;
  stoppedReason?: PublishedTimesheetReplayOutcomeKind | "batch-complete" | "empty";
  /** Propagates authoritative global blocker status (cleared at CP 2.7B). */
  blockedM07: boolean;
  workflowEvidenceCode: string;
};

function failClosedBlocked(
  checkpoint: PublishedTimesheetReplayCheckpoint,
  processed: PublishedTimesheetReplayEventOutcome[],
  stoppedReason: ReplayBatchResult["stoppedReason"]
): ReplayBatchResult {
  return {
    checkpoint,
    processed,
    moreAvailable: false,
    stoppedReason,
    ...m07GlobalBlockerFields(),
  };
}

function mapIntakeStatusToOutcome(
  status: string
): PublishedTimesheetReplayOutcomeKind {
  switch (status) {
    case "imported":
      return "intaken";
    case "duplicate-idempotent":
      return "duplicate-idempotent";
    case "conflict":
      return "conflict";
    case "unavailable":
      return "unavailable";
    case "rejected":
    default:
      return "rejected-ineligible";
  }
}

function recordOutcome(input: {
  actor: M07Actor;
  event: TimesheetApprovalLifecycleEvent;
  outcome: PublishedTimesheetReplayOutcomeKind;
  reason?: string;
  snapshotId?: string;
  intakeStatus?: string;
}): PublishedTimesheetReplayEventOutcome {
  const prior = getReplayOutcomeByEventId({
    organisationId: input.event.organisationId,
    legalEntityId: input.event.legalEntityId,
    eventId: input.event.eventId,
  });
  if (prior) {
    // Conflicting reuse of event identity with different content/outcome → hard conflict
    if (
      (input.event.contentHash &&
        prior.contentHash &&
        input.event.contentHash !== prior.contentHash) ||
      (prior.outcome !== input.outcome &&
        input.outcome === "conflict")
    ) {
      const conflict = appendReplayOutcome({
        ...prior,
        id: newReplayOutcomeId(),
        outcome: "conflict",
        reason: "EVENT_IDENTITY_CONTENT_CONFLICT",
        contentHash: input.event.contentHash,
        recordedAt: new Date().toISOString(),
        recordedBy: input.actor.userId,
      });
      return conflict;
    }
    return prior;
  }

  const row = appendReplayOutcome({
    id: newReplayOutcomeId(),
    organisationId: input.event.organisationId,
    legalEntityId: input.event.legalEntityId,
    clinicId: input.event.clinicId,
    streamPurpose: M07_PUBLISHED_TIMESHEET_REPLAY_STREAM,
    eventId: input.event.eventId,
    eventSequence: input.event.eventSequence,
    eventType: input.event.eventType,
    timesheetRecordId: input.event.timesheetRecordId,
    affectedSourceVersion: input.event.affectedSourceVersion,
    contentHash: input.event.contentHash,
    outcome: input.outcome,
    reason: input.reason,
    snapshotId: input.snapshotId,
    intakeStatus: input.intakeStatus,
    recordedAt: new Date().toISOString(),
    recordedBy: input.actor.userId,
  });

  recordM07Audit({
    actor: input.actor,
    action: `published-timesheet.replay.${input.outcome}`,
    entityType: "published-timesheet-replay-outcome",
    entityId: row.id,
    legalEntityId: input.event.legalEntityId,
    clinicId: input.event.clinicId,
    reason: input.reason,
    meta: {
      organisationId: input.event.organisationId,
      eventId: input.event.eventId,
      eventSequence: input.event.eventSequence,
      eventType: input.event.eventType,
      timesheetRecordId: input.event.timesheetRecordId,
      affectedSourceVersion: input.event.affectedSourceVersion,
      contentHash: input.event.contentHash,
      snapshotId: input.snapshotId,
      blockedM07: m07GlobalBlockerFields().blockedM07,
    },
  });

  return row;
}

function advanceCheckpoint(
  checkpoint: PublishedTimesheetReplayCheckpoint,
  event: TimesheetApprovalLifecycleEvent,
  status: PublishedTimesheetReplayCheckpoint["status"] = "active",
  blockedReason?: string
): PublishedTimesheetReplayCheckpoint {
  return upsertReplayCheckpoint({
    ...checkpoint,
    lastCompletedEventSequence: event.eventSequence,
    lastCompletedEventId: event.eventId,
    checkpointVersion: checkpoint.checkpointVersion + 1,
    updatedAt: new Date().toISOString(),
    status,
    blockedReason,
  });
}

function processOneEvent(input: {
  actor: M07Actor;
  scope: IntakeScope;
  event: TimesheetApprovalLifecycleEvent;
  clinicMembershipCheck?: ClinicMembershipCheck;
}): PublishedTimesheetReplayEventOutcome {
  // Unsupported contract version on event
  if (input.event.contractVersion !== PUBLISHED_TIMESHEET_CONTRACT_VERSION) {
    return recordOutcome({
      actor: input.actor,
      event: input.event,
      outcome: "unsupported",
      reason: "UNSUPPORTED_EVENT_CONTRACT",
    });
  }

  // Lifecycle holds (CP 2.6) — apply operational holds; advance only when safely recoverable.
  if (LIFECYCLE_LATER_EVENT_TYPES.has(input.event.eventType)) {
    const applied = applyLifecycleHoldEvent({
      actor: input.actor,
      event: input.event,
    });
    if (!applied.safelyRecoverable) {
      return recordOutcome({
        actor: input.actor,
        event: input.event,
        outcome: applied.status === "unavailable" ? "unavailable" : "conflict",
        reason: applied.reason ?? "LIFECYCLE_APPLY_FAILED",
      });
    }
    return recordOutcome({
      actor: input.actor,
      event: input.event,
      outcome:
        applied.status === "duplicate-idempotent"
          ? "duplicate-idempotent"
          : "lifecycle-hold-applied",
      reason: applied.reason,
    });
  }

  if (!INTAKE_ELIGIBLE_EVENT_TYPES.has(input.event.eventType)) {
    return recordOutcome({
      actor: input.actor,
      event: input.event,
      outcome: "malformed",
      reason: "UNKNOWN_EVENT_TYPE",
    });
  }

  // Resolve publication through registry — never trust event payload alone for intake.
  let version;
  try {
    version = getPublishedTimesheetVersion(
      {
        organisationId: input.scope.organisationId,
        legalEntityId: input.scope.legalEntityId,
      },
      input.event.timesheetRecordId,
      input.event.affectedSourceVersion
    );
  } catch {
    return recordOutcome({
      actor: input.actor,
      event: input.event,
      outcome: "unavailable",
      reason: "REGISTRY_UNAVAILABLE",
    });
  }

  if (!version) {
    // Event resolved for this tenant but publication row missing — integrity failure; do not advance.
    return recordOutcome({
      actor: input.actor,
      event: input.event,
      outcome: "unavailable",
      reason: "PUBLICATION_NOT_FOUND",
    });
  }

  if (
    input.event.contentHash &&
    version.contentHash &&
    input.event.contentHash !== version.contentHash
  ) {
    return recordOutcome({
      actor: input.actor,
      event: input.event,
      outcome: "conflict",
      reason: "EVENT_CONTENT_HASH_MISMATCH",
    });
  }

  // Same verified contentHash on a different sourceVersion → lineage only (no duplicate snapshot).
  const sameContentPrior = findPriorSnapshotWithSameContentHash({
    organisationId: input.scope.organisationId,
    legalEntityId: input.scope.legalEntityId,
    timesheetRecordId: version.timesheetRecordId,
    contentHash: version.contentHash,
    excludeSourceVersion: version.sourceVersion,
  });
  if (sameContentPrior && sameContentPrior.sourceVersion !== version.sourceVersion) {
    const lineage = recordSameContentLineage({
      actor: input.actor,
      organisationId: input.scope.organisationId,
      legalEntityId: input.scope.legalEntityId,
      timesheetRecordId: version.timesheetRecordId,
      sourceVersion: version.sourceVersion,
      contentHash: version.contentHash,
      event: input.event,
      existingSnapshotId: sameContentPrior.id,
    });
    if (!lineage.safelyRecoverable) {
      return recordOutcome({
        actor: input.actor,
        event: input.event,
        outcome: "unavailable",
        reason: lineage.reason,
      });
    }
    return recordOutcome({
      actor: input.actor,
      event: input.event,
      outcome: "lifecycle-lineage-recorded",
      reason: lineage.reason,
      snapshotId: sameContentPrior.id,
    });
  }

  const priorVersions = listPublishedTimesheetSnapshots({
    organisationId: input.scope.organisationId,
    legalEntityId: input.scope.legalEntityId,
    timesheetRecordId: version.timesheetRecordId,
  });
  const isNewSourceVersion = !priorVersions.some(
    (s) => s.sourceVersion === version.sourceVersion
  );
  const isMaterialNewContent =
    isNewSourceVersion &&
    priorVersions.some((s) => s.contentHash !== version.contentHash);

  const intake = intakePublishedTimesheet({
    actor: input.actor,
    scope: input.scope,
    registryPublicationId: version.registryPublicationId,
    clinicMembershipCheck: input.clinicMembershipCheck,
  });

  if (intake.status === "imported" && intake.snapshot) {
    if (isMaterialNewContent && priorVersions.length > 0) {
      const material = applyMaterialRevisionAfterIntake({
        actor: input.actor,
        snapshot: intake.snapshot,
        eventId: input.event.eventId,
      });
      if (!material.safelyRecoverable) {
        return recordOutcome({
          actor: input.actor,
          event: input.event,
          outcome: "unavailable",
          reason: material.reason,
          snapshotId: intake.snapshot.id,
          intakeStatus: intake.status,
        });
      }
      return recordOutcome({
        actor: input.actor,
        event: input.event,
        outcome: "lifecycle-material-pending-review",
        reason: material.reason,
        snapshotId: intake.snapshot.id,
        intakeStatus: intake.status,
      });
    }
    seedEligibilityForImportedSnapshot({
      actor: input.actor,
      snapshot: intake.snapshot,
    });
  }

  return recordOutcome({
    actor: input.actor,
    event: input.event,
    outcome: mapIntakeStatusToOutcome(intake.status),
    reason: intake.reason,
    snapshotId: intake.snapshot?.id,
    intakeStatus: intake.status,
  });
}

/**
 * Run one bounded ordered replay batch for a tenant/legal-entity scope.
 *
 * Cursor advancement (CP 2.6):
 * Advance only after the event outcome is durably recoverable — including
 * lifecycle-hold-applied, lifecycle-lineage-recorded, lifecycle-material-pending-review,
 * intaken/duplicate/rejected, and idempotent reprocessing.
 * Do not advance on unavailable / retryable-failure / conflict / blocked-gap.
 */
export function runPublishedTimesheetReplayBatch(input: {
  actor: M07Actor;
  scope: IntakeScope;
  batchLimit?: number;
  clinicMembershipCheck?: ClinicMembershipCheck;
}): ReplayBatchResult {
  runM07SchemaV4Migration();
  runM07SchemaV5Migration();
  assertM07Permission(input.actor, "payroll.intake.run");
  assertM07LegalEntityScope(input.actor, input.scope.legalEntityId);
  if (input.scope.clinicId) {
    assertM07ClinicScope(input.actor, [input.scope.clinicId]);
  }

  if (!input.scope.organisationId?.trim() || !input.scope.legalEntityId?.trim()) {
    const empty = ensureReplayCheckpoint({
      organisationId: input.scope.organisationId || "_missing_",
      legalEntityId: input.scope.legalEntityId || "_missing_",
      clinicId: input.scope.clinicId,
      contractVersion: PUBLISHED_TIMESHEET_CONTRACT_VERSION,
    });
    return failClosedBlocked(empty, [], "malformed");
  }

  // Platform stream is organisationId+legalEntityId partitioned (not clinic).
  // Clinic scope is enforced at intake / actor checks — not as a separate cursor.
  let checkpoint = ensureReplayCheckpoint({
    organisationId: input.scope.organisationId,
    legalEntityId: input.scope.legalEntityId,
    contractVersion: PUBLISHED_TIMESHEET_CONTRACT_VERSION,
  });

  if (
    typeof checkpoint.lastCompletedEventSequence !== "number" ||
    !Number.isFinite(checkpoint.lastCompletedEventSequence) ||
    checkpoint.lastCompletedEventSequence < 0
  ) {
    checkpoint = upsertReplayCheckpoint({
      ...checkpoint,
      status: "blocked-conflict",
      blockedReason: "CORRUPT_CHECKPOINT_SEQUENCE",
      updatedAt: new Date().toISOString(),
      checkpointVersion: checkpoint.checkpointVersion + 1,
    });
    return failClosedBlocked(checkpoint, [], "conflict");
  }

  if (checkpoint.status === "blocked-gap" || checkpoint.status === "blocked-conflict") {
    return failClosedBlocked(checkpoint, [], checkpoint.status === "blocked-gap" ? "blocked-gap" : "conflict");
  }

  const limit = Math.max(1, input.batchLimit ?? DEFAULT_REPLAY_BATCH_LIMIT);
  let events: TimesheetApprovalLifecycleEvent[];
  try {
    events = replayPublishedTimesheetEvents(
      {
        organisationId: input.scope.organisationId,
        legalEntityId: input.scope.legalEntityId,
      },
      checkpoint.lastCompletedEventSequence
    );
  } catch {
    checkpoint = upsertReplayCheckpoint({
      ...checkpoint,
      status: "unavailable",
      blockedReason: "REGISTRY_UNAVAILABLE",
      updatedAt: new Date().toISOString(),
      checkpointVersion: checkpoint.checkpointVersion + 1,
    });
    return failClosedBlocked(checkpoint, [], "unavailable");
  }

  // Platform returns ascending sequence; re-assert order (do not invent sequences).
  events = [...events].sort((a, b) => a.eventSequence - b.eventSequence);

  const batch = events.slice(0, limit);
  const moreAvailable = events.length > limit;
  const processed: PublishedTimesheetReplayEventOutcome[] = [];

  if (batch.length === 0) {
    return {
      checkpoint,
      processed,
      moreAvailable: false,
      stoppedReason: "empty",
      ...m07GlobalBlockerFields(),
    };
  }

  let lastSeenSequence = checkpoint.lastCompletedEventSequence;

  for (const event of batch) {
    // Tenant re-check — fail closed
    if (
      event.organisationId !== input.scope.organisationId ||
      event.legalEntityId !== input.scope.legalEntityId
    ) {
      const outcome = recordOutcome({
        actor: input.actor,
        event,
        outcome: "terminal-failure",
        reason: "CROSS_TENANT_EVENT",
      });
      processed.push(outcome);
      checkpoint = upsertReplayCheckpoint({
        ...checkpoint,
        status: "blocked-conflict",
        blockedReason: "CROSS_TENANT_EVENT",
        updatedAt: new Date().toISOString(),
        checkpointVersion: checkpoint.checkpointVersion + 1,
      });
      return failClosedBlocked(checkpoint, processed, "conflict");
    }

    // Authoritative order: sequences must strictly increase for this tenant page.
    // Platform eventSequence is globally monotonic; tenant-filtered pages may skip
    // numbers assigned to other tenants — that is NOT a gap.
    if (event.eventSequence <= lastSeenSequence) {
      const prior = getReplayOutcomeByEventId({
        organisationId: event.organisationId,
        legalEntityId: event.legalEntityId,
        eventId: event.eventId,
      });
      if (prior && event.eventSequence <= checkpoint.lastCompletedEventSequence) {
        // Already-completed redelivery — idempotent, do not regress cursor
        processed.push(prior);
        continue;
      }
      // Duplicate sequence or out-of-order within the page — fail closed
      const gapOutcome: PublishedTimesheetReplayEventOutcome = {
        id: newReplayOutcomeId(),
        organisationId: input.scope.organisationId,
        legalEntityId: input.scope.legalEntityId,
        clinicId: input.scope.clinicId,
        streamPurpose: M07_PUBLISHED_TIMESHEET_REPLAY_STREAM,
        eventId: `gap-nonmonotonic-${event.eventId}`,
        eventSequence: event.eventSequence,
        eventType: "replay.gap",
        timesheetRecordId: event.timesheetRecordId,
        affectedSourceVersion: event.affectedSourceVersion,
        outcome: "blocked-gap",
        reason: `NON_MONOTONIC_SEQUENCE_PREV_${lastSeenSequence}_GOT_${event.eventSequence}`,
        recordedAt: new Date().toISOString(),
        recordedBy: input.actor.userId,
      };
      appendReplayOutcome(gapOutcome);
      processed.push(gapOutcome);
      checkpoint = upsertReplayCheckpoint({
        ...checkpoint,
        status: "blocked-gap",
        blockedReason: gapOutcome.reason,
        updatedAt: new Date().toISOString(),
        checkpointVersion: checkpoint.checkpointVersion + 1,
      });
      recordM07Audit({
        actor: input.actor,
        action: "published-timesheet.replay.blocked-gap",
        entityType: "published-timesheet-replay-checkpoint",
        entityId: checkpoint.id,
        legalEntityId: input.scope.legalEntityId,
        reason: gapOutcome.reason,
        meta: {
          organisationId: input.scope.organisationId,
          lastSeenSequence,
          gotSequence: event.eventSequence,
          blockedM07: m07GlobalBlockerFields().blockedM07,
        },
      });
      return failClosedBlocked(checkpoint, processed, "blocked-gap");
    }

    // Duplicate event identity with conflicting content
    const priorOutcome = getReplayOutcomeByEventId({
      organisationId: event.organisationId,
      legalEntityId: event.legalEntityId,
      eventId: event.eventId,
    });
    if (
      priorOutcome &&
      priorOutcome.contentHash &&
      event.contentHash &&
      priorOutcome.contentHash !== event.contentHash
    ) {
      const outcome = recordOutcome({
        actor: input.actor,
        event,
        outcome: "conflict",
        reason: "EVENT_IDENTITY_CONTENT_CONFLICT",
      });
      processed.push(outcome);
      checkpoint = upsertReplayCheckpoint({
        ...checkpoint,
        status: "blocked-conflict",
        blockedReason: "EVENT_IDENTITY_CONTENT_CONFLICT",
        updatedAt: new Date().toISOString(),
        checkpointVersion: checkpoint.checkpointVersion + 1,
      });
      return failClosedBlocked(checkpoint, processed, "conflict");
    }

    const outcome = processOneEvent({
      actor: input.actor,
      scope: input.scope,
      event,
      clinicMembershipCheck: input.clinicMembershipCheck,
    });
    processed.push(outcome);

    if (outcome.outcome === "conflict") {
      checkpoint = advanceCheckpoint(checkpoint, event, "blocked-conflict", outcome.reason);
      return failClosedBlocked(checkpoint, processed, "conflict");
    }
    if (outcome.outcome === "unavailable" || outcome.outcome === "retryable-failure") {
      // Do not advance past unresolved registry/intake unavailability
      checkpoint = upsertReplayCheckpoint({
        ...checkpoint,
        status: "unavailable",
        blockedReason: outcome.reason,
        updatedAt: new Date().toISOString(),
        checkpointVersion: checkpoint.checkpointVersion + 1,
      });
      return failClosedBlocked(checkpoint, processed, "unavailable");
    }

    // Safe advancement after durable outcome (including later-lifecycle-required and rejects)
    checkpoint = advanceCheckpoint(checkpoint, event, "active");
    lastSeenSequence = event.eventSequence;
  }

  return {
    checkpoint,
    processed,
    moreAvailable,
    stoppedReason: moreAvailable ? "batch-complete" : "batch-complete",
    ...m07GlobalBlockerFields(),
  };
}

export {
  getReplayCheckpoint,
  getReplayCheckpointById,
  listReplayOutcomes,
  ensureReplayCheckpoint,
  upsertReplayCheckpoint,
};
