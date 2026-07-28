/**
 * M07 published-timesheet lifecycle projections — Checkpoint 2.6.
 *
 * Applies operational holds, eligibility, authorised supersession / restore /
 * requalification, and preparation-progress safeguards.
 *
 * Does not mutate the platform registry or overwrite CP 2.4 snapshots. Global BLOCKED-M07 is cleared (CP 2.7B); holds/eligibility remain independent.
 */

import type { TimesheetApprovalLifecycleEvent } from "@/platform/workforce/contracts/timesheet-approval-events";
import {
  assertM07ClinicScope,
  assertM07LegalEntityScope,
  assertM07Permission,
  M07ValidationError,
  type M07Actor,
  type M07PermissionCode,
} from "../permissions";
import {
  appendLifecycleDecision,
  appendLifecycleEventApplication,
  appendLifecycleException,
  ensureLifecycleProjection,
  getLifecycleEventApplication,
  getLifecycleProjection,
  getLifecycleProjectionById,
  getSnapshotEligibility,
  getSnapshotEligibilityBySnapshotId,
  listLifecycleExceptions,
  listSnapshotEligibility,
  newEligibilityId,
  newLifecycleDecisionId,
  newLifecycleEventApplicationId,
  newLifecycleExceptionId,
  upsertLifecycleException,
  upsertLifecycleProjection,
  upsertSnapshotEligibility,
} from "../repository/published-timesheet-lifecycle";
import {
  getPublishedTimesheetSnapshotById,
  listPublishedTimesheetSnapshots,
} from "../repository/published-timesheet-snapshots";
import { runM07SchemaV5Migration } from "../storage/migrate-v5";
import { m07GlobalBlockerFields } from "../adapters/m06-timesheet-read";
import { recordM07Audit } from "./audit-service";
import type {
  OperationalHoldKind,
  PreparationProgressKind,
  PublishedTimesheetLifecycleDecision,
  PublishedTimesheetLifecycleException,
  PublishedTimesheetLifecycleProjection,
  PublishedTimesheetSnapshotEligibility,
  PublishedTimesheetSourceSnapshot,
  SnapshotEligibilityState,
} from "../types/domain";

export type LifecycleBlockedResult = {
  blockedM07: boolean;
  workflowEvidenceCode: string;
};

function lifecycleBlockerFields(): LifecycleBlockedResult {
  return m07GlobalBlockerFields();
}

export type LifecycleApplyResult = LifecycleBlockedResult & {
  status:
    | "hold-applied"
    | "lineage-recorded"
    | "material-pending-review"
    | "eligibility-seeded"
    | "duplicate-idempotent"
    | "conflict"
    | "unavailable"
    | "retryable-failure";
  reason?: string;
  projection?: PublishedTimesheetLifecycleProjection;
  eligibility?: PublishedTimesheetSnapshotEligibility;
  snapshotId?: string;
  safelyRecoverable: boolean;
};

export type LifecycleDecisionResult = LifecycleBlockedResult & {
  status: "accepted" | "rejected" | "denied";
  reason?: string;
  decision?: PublishedTimesheetLifecycleDecision;
  projection?: PublishedTimesheetLifecycleProjection;
};

export type PreparationUseGateResult = LifecycleBlockedResult & {
  allowed: boolean;
  reason?: string;
  eligibility?: SnapshotEligibilityState;
  hold?: OperationalHoldKind;
  preparationProgress?: PreparationProgressKind;
};

function bumpProjection(
  projection: PublishedTimesheetLifecycleProjection,
  patch: Partial<PublishedTimesheetLifecycleProjection>
): PublishedTimesheetLifecycleProjection {
  return upsertLifecycleProjection({
    ...projection,
    ...patch,
    projectionVersion: projection.projectionVersion + 1,
    updatedAt: new Date().toISOString(),
  });
}

function createPrepException(input: {
  actor: M07Actor;
  organisationId: string;
  legalEntityId: string;
  timesheetRecordId: string;
  kind: PublishedTimesheetLifecycleException["kind"];
  status: PublishedTimesheetLifecycleException["status"];
  preparationProgress: PreparationProgressKind;
  reason: string;
  sourceEventId?: string;
  snapshotId?: string;
}): PublishedTimesheetLifecycleException {
  const open = listLifecycleExceptions({
    organisationId: input.organisationId,
    legalEntityId: input.legalEntityId,
    timesheetRecordId: input.timesheetRecordId,
  }).find((e) => e.kind === input.kind && e.status === "open");
  if (open) return open;

  const row = appendLifecycleException({
    id: newLifecycleExceptionId(),
    organisationId: input.organisationId,
    legalEntityId: input.legalEntityId,
    timesheetRecordId: input.timesheetRecordId,
    kind: input.kind,
    status: input.status,
    preparationProgressAtCreate: input.preparationProgress,
    sourceEventId: input.sourceEventId,
    snapshotId: input.snapshotId,
    reason: input.reason,
    createdAt: new Date().toISOString(),
    createdBy: input.actor.userId,
  });
  recordM07Audit({
    actor: input.actor,
    action: "published-timesheet.lifecycle.exception.created",
    entityType: "published-timesheet-lifecycle-exception",
    entityId: row.id,
    legalEntityId: input.legalEntityId,
    reason: input.reason,
    meta: {
      organisationId: input.organisationId,
      timesheetRecordId: input.timesheetRecordId,
      kind: input.kind,
      status: input.status,
      blockedM07: lifecycleBlockerFields().blockedM07,
    },
  });
  return row;
}

function applyPrepProgressSafeguards(input: {
  actor: M07Actor;
  projection: PublishedTimesheetLifecycleProjection;
  eventId?: string;
}): void {
  const progress = input.projection.preparationProgress;
  if (progress === "not-started") return;
  if (progress === "started-not-approved") {
    createPrepException({
      actor: input.actor,
      organisationId: input.projection.organisationId,
      legalEntityId: input.projection.legalEntityId,
      timesheetRecordId: input.projection.timesheetRecordId,
      kind: "prep-frozen-held",
      status: "open",
      preparationProgress: progress,
      reason: "PREP_FROZEN_ON_HOLD",
      sourceEventId: input.eventId,
      snapshotId: input.projection.selectedSnapshotId ?? undefined,
    });
    return;
  }
  if (progress === "approved") {
    createPrepException({
      actor: input.actor,
      organisationId: input.projection.organisationId,
      legalEntityId: input.projection.legalEntityId,
      timesheetRecordId: input.projection.timesheetRecordId,
      kind: "approved-blocked",
      status: "open",
      preparationProgress: progress,
      reason: "APPROVED_PREP_BLOCKED_ON_HOLD",
      sourceEventId: input.eventId,
      snapshotId: input.projection.selectedSnapshotId ?? undefined,
    });
    return;
  }
  if (progress === "exported") {
    createPrepException({
      actor: input.actor,
      organisationId: input.projection.organisationId,
      legalEntityId: input.projection.legalEntityId,
      timesheetRecordId: input.projection.timesheetRecordId,
      kind: "exported-terminal",
      status: "terminal",
      preparationProgress: progress,
      reason: "EXPORTED_ARTEFACT_PRESERVED_TERMINAL_EXCEPTION",
      sourceEventId: input.eventId,
      snapshotId: input.projection.selectedSnapshotId ?? undefined,
    });
    return;
  }
  if (progress === "external-status-unknown") {
    createPrepException({
      actor: input.actor,
      organisationId: input.projection.organisationId,
      legalEntityId: input.projection.legalEntityId,
      timesheetRecordId: input.projection.timesheetRecordId,
      kind: "external-status-unknown",
      status: "open",
      preparationProgress: progress,
      reason: "EXTERNAL_STATUS_UNKNOWN_FAIL_CLOSED",
      sourceEventId: input.eventId,
    });
  }
}

function markAffectedEligibilityHeld(
  projection: PublishedTimesheetLifecycleProjection,
  exceptDisqualified = true
): void {
  for (const el of listSnapshotEligibility(projection)) {
    if (exceptDisqualified && el.eligibility === "disqualified") continue;
    if (el.eligibility === "superseded") continue;
    if (el.eligibility === "held" || el.eligibility === "disqualified") continue;
    upsertSnapshotEligibility({
      ...el,
      eligibility: "held",
      eligibilityVersion: el.eligibilityVersion + 1,
      updatedAt: new Date().toISOString(),
    });
  }
}

/**
 * Seed eligibility for a newly intaken snapshot (first import → eligible when no hold).
 */
export function seedEligibilityForImportedSnapshot(input: {
  actor: M07Actor;
  snapshot: PublishedTimesheetSourceSnapshot;
}): LifecycleApplyResult {
  runM07SchemaV5Migration();
  assertM07Permission(input.actor, "payroll.intake.run");
  assertM07LegalEntityScope(input.actor, input.snapshot.legalEntityId);

  const existing = getSnapshotEligibility({
    organisationId: input.snapshot.organisationId,
    legalEntityId: input.snapshot.legalEntityId,
    timesheetRecordId: input.snapshot.timesheetRecordId,
    sourceVersion: input.snapshot.sourceVersion,
  });
  if (existing) {
    return {
      status: "duplicate-idempotent",
      reason: "ELIGIBILITY_ALREADY_SEEDED",
      eligibility: existing,
      snapshotId: existing.snapshotId,
      safelyRecoverable: true,
      ...lifecycleBlockerFields(),
    };
  }

  const projection = ensureLifecycleProjection({
    organisationId: input.snapshot.organisationId,
    legalEntityId: input.snapshot.legalEntityId,
    timesheetRecordId: input.snapshot.timesheetRecordId,
  });

  const eligibilityState: SnapshotEligibilityState =
    projection.hold !== "none" ? "held" : "eligible";

  const eligibility = upsertSnapshotEligibility({
    id: newEligibilityId(),
    organisationId: input.snapshot.organisationId,
    legalEntityId: input.snapshot.legalEntityId,
    timesheetRecordId: input.snapshot.timesheetRecordId,
    sourceVersion: input.snapshot.sourceVersion,
    snapshotId: input.snapshot.id,
    contentHash: input.snapshot.contentHash,
    eligibility: eligibilityState,
    eligibilityVersion: 1,
    updatedAt: new Date().toISOString(),
  });

  let next = projection;
  if (projection.selectedSnapshotId == null && projection.supersessionState === "none" && projection.hold === "none") {
    next = bumpProjection(projection, {
      selectedSnapshotId: input.snapshot.id,
      supersessionState: "selected",
    });
  }

  recordM07Audit({
    actor: input.actor,
    action: "published-timesheet.lifecycle.eligibility.changed",
    entityType: "published-timesheet-snapshot-eligibility",
    entityId: eligibility.id,
    legalEntityId: input.snapshot.legalEntityId,
    clinicId: input.snapshot.clinicId,
    after: { eligibility: eligibility.eligibility, snapshotId: eligibility.snapshotId },
    meta: {
      organisationId: input.snapshot.organisationId,
      timesheetRecordId: input.snapshot.timesheetRecordId,
      sourceVersion: input.snapshot.sourceVersion,
      blockedM07: lifecycleBlockerFields().blockedM07,
    },
  });

  return {
    status: "eligibility-seeded",
    projection: next,
    eligibility,
    snapshotId: input.snapshot.id,
    safelyRecoverable: true,
    ...lifecycleBlockerFields(),
  };
}

/**
 * Apply material revision after a NEW content snapshot was intaken via CP 2.4.
 */
export function applyMaterialRevisionAfterIntake(input: {
  actor: M07Actor;
  snapshot: PublishedTimesheetSourceSnapshot;
  eventId: string;
}): LifecycleApplyResult {
  runM07SchemaV5Migration();
  const priorApp = getLifecycleEventApplication({
    organisationId: input.snapshot.organisationId,
    legalEntityId: input.snapshot.legalEntityId,
    eventId: input.eventId,
  });
  if (priorApp) {
    return {
      status: "duplicate-idempotent",
      reason: "LIFECYCLE_EVENT_ALREADY_APPLIED",
      safelyRecoverable: true,
      ...lifecycleBlockerFields(),
    };
  }

  let projection = ensureLifecycleProjection({
    organisationId: input.snapshot.organisationId,
    legalEntityId: input.snapshot.legalEntityId,
    timesheetRecordId: input.snapshot.timesheetRecordId,
  });

  const priorSelectedOrEligible =
    projection.selectedSnapshotId != null ||
    projection.supersessionState === "selected" ||
    listSnapshotEligibility(projection).some(
      (e) => e.eligibility === "eligible" || e.eligibility === "held"
    ) ||
    projection.preparationProgress !== "not-started";

  const eligibility = upsertSnapshotEligibility({
    id:
      getSnapshotEligibility({
        organisationId: input.snapshot.organisationId,
        legalEntityId: input.snapshot.legalEntityId,
        timesheetRecordId: input.snapshot.timesheetRecordId,
        sourceVersion: input.snapshot.sourceVersion,
      })?.id ?? newEligibilityId(),
    organisationId: input.snapshot.organisationId,
    legalEntityId: input.snapshot.legalEntityId,
    timesheetRecordId: input.snapshot.timesheetRecordId,
    sourceVersion: input.snapshot.sourceVersion,
    snapshotId: input.snapshot.id,
    contentHash: input.snapshot.contentHash,
    eligibility: "pending-review",
    eligibilityVersion:
      (getSnapshotEligibility({
        organisationId: input.snapshot.organisationId,
        legalEntityId: input.snapshot.legalEntityId,
        timesheetRecordId: input.snapshot.timesheetRecordId,
        sourceVersion: input.snapshot.sourceVersion,
      })?.eligibilityVersion ?? 0) + 1,
    updatedAt: new Date().toISOString(),
  });

  if (priorSelectedOrEligible) {
    projection = bumpProjection(projection, {
      hold: "revision-review-hold",
      holdAppliedEventId: input.eventId,
      holdReason: "MATERIAL_REVISION_PENDING_REVIEW",
      supersessionState: "pending-authorised-selection",
    });
    markAffectedEligibilityHeld(projection, true);
    // keep new snapshot pending-review (re-write after held sweep)
    upsertSnapshotEligibility({
      ...eligibility,
      eligibility: "pending-review",
      eligibilityVersion: eligibility.eligibilityVersion + 1,
      updatedAt: new Date().toISOString(),
    });
    applyPrepProgressSafeguards({
      actor: input.actor,
      projection,
      eventId: input.eventId,
    });
  } else {
    projection = bumpProjection(projection, {
      supersessionState: "pending-authorised-selection",
      holdReason: "MATERIAL_REVISION_PENDING_SELECTION",
    });
  }

  appendLifecycleEventApplication({
    id: newLifecycleEventApplicationId(),
    organisationId: input.snapshot.organisationId,
    legalEntityId: input.snapshot.legalEntityId,
    timesheetRecordId: input.snapshot.timesheetRecordId,
    eventId: input.eventId,
    eventType: "material-revision",
    eventSequence: input.snapshot.sourceEventSequence,
    outcome: "material-pending-review",
    reason: "MATERIAL_REVISION_REQUIRES_AUTHORISED_SELECTION",
    appliedAt: new Date().toISOString(),
  });

  recordM07Audit({
    actor: input.actor,
    action: "published-timesheet.lifecycle.material-revision.pending-review",
    entityType: "published-timesheet-lifecycle-projection",
    entityId: projection.id,
    legalEntityId: input.snapshot.legalEntityId,
    clinicId: input.snapshot.clinicId,
    after: {
      hold: projection.hold,
      supersessionState: projection.supersessionState,
      snapshotId: input.snapshot.id,
    },
    meta: {
      organisationId: input.snapshot.organisationId,
      eventId: input.eventId,
      sourceVersion: input.snapshot.sourceVersion,
      blockedM07: lifecycleBlockerFields().blockedM07,
    },
  });

  return {
    status: "material-pending-review",
    reason: "MATERIAL_REVISION_REQUIRES_AUTHORISED_SELECTION",
    projection,
    eligibility,
    snapshotId: input.snapshot.id,
    safelyRecoverable: true,
    ...lifecycleBlockerFields(),
  };
}

/**
 * Same contentHash, different sourceVersion — lineage only; no new snapshot intake.
 */
export function recordSameContentLineage(input: {
  actor: M07Actor;
  organisationId: string;
  legalEntityId: string;
  timesheetRecordId: string;
  sourceVersion: number;
  contentHash: string;
  event: TimesheetApprovalLifecycleEvent;
  existingSnapshotId: string;
}): LifecycleApplyResult {
  runM07SchemaV5Migration();
  const priorApp = getLifecycleEventApplication({
    organisationId: input.organisationId,
    legalEntityId: input.legalEntityId,
    eventId: input.event.eventId,
  });
  if (priorApp) {
    return {
      status: "duplicate-idempotent",
      reason: "LIFECYCLE_EVENT_ALREADY_APPLIED",
      snapshotId: input.existingSnapshotId,
      safelyRecoverable: true,
      ...lifecycleBlockerFields(),
    };
  }

  const projection = ensureLifecycleProjection({
    organisationId: input.organisationId,
    legalEntityId: input.legalEntityId,
    timesheetRecordId: input.timesheetRecordId,
  });

  appendLifecycleEventApplication({
    id: newLifecycleEventApplicationId(),
    organisationId: input.organisationId,
    legalEntityId: input.legalEntityId,
    timesheetRecordId: input.timesheetRecordId,
    eventId: input.event.eventId,
    eventType: input.event.eventType,
    eventSequence: input.event.eventSequence,
    outcome: "lineage-recorded",
    reason: "SAME_CONTENT_HASH_NO_DUPLICATE_SNAPSHOT",
    appliedAt: new Date().toISOString(),
  });

  recordM07Audit({
    actor: input.actor,
    action: "published-timesheet.lifecycle.lineage.recorded",
    entityType: "published-timesheet-lifecycle-projection",
    entityId: projection.id,
    legalEntityId: input.legalEntityId,
    reason: "SAME_CONTENT_HASH_NO_DUPLICATE_SNAPSHOT",
    meta: {
      organisationId: input.organisationId,
      eventId: input.event.eventId,
      sourceVersion: input.sourceVersion,
      contentHash: input.contentHash,
      existingSnapshotId: input.existingSnapshotId,
      blockedM07: lifecycleBlockerFields().blockedM07,
    },
  });

  return {
    status: "lineage-recorded",
    reason: "SAME_CONTENT_HASH_NO_DUPLICATE_SNAPSHOT",
    projection,
    snapshotId: input.existingSnapshotId,
    safelyRecoverable: true,
    ...lifecycleBlockerFields(),
  };
}

/**
 * Apply revoke / withdraw / invalidate from registry replay.
 */
export function applyLifecycleHoldEvent(input: {
  actor: M07Actor;
  event: TimesheetApprovalLifecycleEvent;
}): LifecycleApplyResult {
  runM07SchemaV5Migration();
  assertM07LegalEntityScope(input.actor, input.event.legalEntityId);

  const priorApp = getLifecycleEventApplication({
    organisationId: input.event.organisationId,
    legalEntityId: input.event.legalEntityId,
    eventId: input.event.eventId,
  });
  if (priorApp) {
    recordM07Audit({
      actor: input.actor,
      action: "published-timesheet.lifecycle.event.duplicate-idempotent",
      entityType: "published-timesheet-lifecycle-event-application",
      entityId: priorApp.id,
      legalEntityId: input.event.legalEntityId,
      reason: "DUPLICATE_LIFECYCLE_EVENT",
      meta: {
        organisationId: input.event.organisationId,
        eventId: input.event.eventId,
        blockedM07: lifecycleBlockerFields().blockedM07,
      },
    });
    return {
      status: "duplicate-idempotent",
      reason: "DUPLICATE_LIFECYCLE_EVENT",
      safelyRecoverable: true,
      ...lifecycleBlockerFields(),
    };
  }

  let hold: OperationalHoldKind = "none";
  let reason = "";
  if (input.event.eventType === "timesheet.approval.revoked") {
    hold = "revocation-hold";
    reason = "REVOCATION_HOLD_APPLIED";
  } else if (input.event.eventType === "timesheet.record.withdrawn") {
    hold = "withdrawal-hold";
    reason = "WITHDRAWAL_HOLD_APPLIED";
  } else if (input.event.eventType === "timesheet.record.invalidated") {
    hold = "invalidation-hold";
    reason = "INVALIDATION_HOLD_APPLIED";
  } else {
    return {
      status: "conflict",
      reason: "UNSUPPORTED_LIFECYCLE_EVENT",
      safelyRecoverable: false,
      ...lifecycleBlockerFields(),
    };
  }

  let projection = ensureLifecycleProjection({
    organisationId: input.event.organisationId,
    legalEntityId: input.event.legalEntityId,
    timesheetRecordId: input.event.timesheetRecordId,
  });
  const before = { ...projection };

  projection = bumpProjection(projection, {
    hold,
    holdAppliedEventId: input.event.eventId,
    holdReason: reason,
  });

  if (hold === "invalidation-hold") {
    const el = getSnapshotEligibility({
      organisationId: input.event.organisationId,
      legalEntityId: input.event.legalEntityId,
      timesheetRecordId: input.event.timesheetRecordId,
      sourceVersion: input.event.affectedSourceVersion,
    });
    if (el) {
      upsertSnapshotEligibility({
        ...el,
        eligibility: "disqualified",
        eligibilityVersion: el.eligibilityVersion + 1,
        updatedAt: new Date().toISOString(),
      });
    }
    // Other non-disqualified versions become held
    markAffectedEligibilityHeld(projection, true);
  } else {
    markAffectedEligibilityHeld(projection, true);
  }

  applyPrepProgressSafeguards({
    actor: input.actor,
    projection,
    eventId: input.event.eventId,
  });

  appendLifecycleEventApplication({
    id: newLifecycleEventApplicationId(),
    organisationId: input.event.organisationId,
    legalEntityId: input.event.legalEntityId,
    timesheetRecordId: input.event.timesheetRecordId,
    eventId: input.event.eventId,
    eventType: input.event.eventType,
    eventSequence: input.event.eventSequence,
    outcome: "hold-applied",
    reason,
    appliedAt: new Date().toISOString(),
  });

  recordM07Audit({
    actor: input.actor,
    action: "published-timesheet.lifecycle.hold.applied",
    entityType: "published-timesheet-lifecycle-projection",
    entityId: projection.id,
    legalEntityId: input.event.legalEntityId,
    clinicId: input.event.clinicId,
    before: { hold: before.hold },
    after: { hold: projection.hold },
    reason,
    meta: {
      organisationId: input.event.organisationId,
      eventId: input.event.eventId,
      timesheetRecordId: input.event.timesheetRecordId,
      affectedSourceVersion: input.event.affectedSourceVersion,
      blockedM07: lifecycleBlockerFields().blockedM07,
    },
  });

  return {
    status: "hold-applied",
    reason,
    projection,
    safelyRecoverable: true,
    ...lifecycleBlockerFields(),
  };
}

/** Gate ordinary preparation use of a snapshot. */
export function assertSnapshotUsableForPreparation(input: {
  actor: M07Actor;
  organisationId: string;
  legalEntityId: string;
  snapshotId: string;
}): PreparationUseGateResult {
  runM07SchemaV5Migration();
  assertM07Permission(input.actor, "payroll.calculate");
  assertM07LegalEntityScope(input.actor, input.legalEntityId);

  const snap = getPublishedTimesheetSnapshotById(
    { organisationId: input.organisationId, legalEntityId: input.legalEntityId },
    input.snapshotId
  );
  if (!snap) {
    return {
      allowed: false,
      reason: "SNAPSHOT_NOT_FOUND",
      ...lifecycleBlockerFields(),
    };
  }

  const projection = getLifecycleProjection({
    organisationId: input.organisationId,
    legalEntityId: input.legalEntityId,
    timesheetRecordId: snap.timesheetRecordId,
  });
  const el = getSnapshotEligibilityBySnapshotId({
    organisationId: input.organisationId,
    legalEntityId: input.legalEntityId,
    snapshotId: input.snapshotId,
  });

  if (projection?.preparationProgress === "external-status-unknown") {
    return {
      allowed: false,
      reason: "EXTERNAL_STATUS_UNKNOWN",
      hold: projection.hold,
      preparationProgress: projection.preparationProgress,
      ...lifecycleBlockerFields(),
    };
  }
  if (projection && projection.hold !== "none") {
    return {
      allowed: false,
      reason: "OPERATIONAL_HOLD_ACTIVE",
      hold: projection.hold,
      eligibility: el?.eligibility,
      preparationProgress: projection.preparationProgress,
      ...lifecycleBlockerFields(),
    };
  }
  if (!el || el.eligibility !== "eligible") {
    return {
      allowed: false,
      reason: `SNAPSHOT_NOT_ELIGIBLE_${(el?.eligibility ?? "missing").toUpperCase()}`,
      eligibility: el?.eligibility,
      hold: projection?.hold,
      preparationProgress: projection?.preparationProgress,
      ...lifecycleBlockerFields(),
    };
  }
  if (
    projection?.preparationProgress === "exported" ||
    projection?.preparationProgress === "approved"
  ) {
    return {
      allowed: false,
      reason: "PREP_PROGRESS_BLOCKS_ORDINARY_USE",
      eligibility: el.eligibility,
      hold: projection.hold,
      preparationProgress: projection.preparationProgress,
      ...lifecycleBlockerFields(),
    };
  }

  return {
    allowed: true,
    eligibility: el.eligibility,
    hold: projection?.hold ?? "none",
    preparationProgress: projection?.preparationProgress ?? "not-started",
    ...lifecycleBlockerFields(),
  };
}

/**
 * Observational prep-progress setter for lifecycle gates / tests.
 * Does not implement payroll calculation, payment, or reconciliation.
 */
export function observePreparationProgress(input: {
  actor: M07Actor;
  organisationId: string;
  legalEntityId: string;
  timesheetRecordId: string;
  progress: PreparationProgressKind;
  expectedProjectionVersion: number;
}): LifecycleDecisionResult {
  runM07SchemaV5Migration();
  assertM07Permission(input.actor, "payroll.lifecycle.review");
  assertM07LegalEntityScope(input.actor, input.legalEntityId);

  const projection = ensureLifecycleProjection(input);
  if (projection.projectionVersion !== input.expectedProjectionVersion) {
    recordM07Audit({
      actor: input.actor,
      action: "published-timesheet.lifecycle.stale-decision.denied",
      entityType: "published-timesheet-lifecycle-projection",
      entityId: projection.id,
      legalEntityId: input.legalEntityId,
      reason: "STALE_PROJECTION_VERSION",
      meta: { organisationId: input.organisationId, blockedM07: lifecycleBlockerFields().blockedM07 },
    });
    return {
      status: "rejected",
      reason: "STALE_PROJECTION_VERSION",
      projection,
      ...lifecycleBlockerFields(),
    };
  }

  const next = bumpProjection(projection, { preparationProgress: input.progress });
  return {
    status: "accepted",
    projection: next,
    ...lifecycleBlockerFields(),
  };
}

export function acknowledgeRestoreClearHold(input: {
  actor: M07Actor;
  organisationId: string;
  legalEntityId: string;
  timesheetRecordId: string;
  lifecycleEventId?: string;
  sourceVersion?: number;
  snapshotId?: string;
  expectedProjectionVersion: number;
  reason: string;
}): LifecycleDecisionResult {
  runM07SchemaV5Migration();
  const permission: M07PermissionCode = "payroll.lifecycle.hold.clear";
  try {
    assertM07Permission(input.actor, permission);
  } catch {
    recordM07Audit({
      actor: input.actor,
      action: "published-timesheet.lifecycle.permission.denied",
      entityType: "published-timesheet-lifecycle-projection",
      entityId: input.timesheetRecordId,
      legalEntityId: input.legalEntityId,
      reason: "MISSING_PERMISSION_HOLD_CLEAR",
      meta: { organisationId: input.organisationId, blockedM07: lifecycleBlockerFields().blockedM07 },
    });
    return {
      status: "denied",
      reason: "MISSING_PERMISSION_HOLD_CLEAR",
      ...lifecycleBlockerFields(),
    };
  }
  assertM07LegalEntityScope(input.actor, input.legalEntityId);

  const projection = ensureLifecycleProjection(input);
  if (projection.projectionVersion !== input.expectedProjectionVersion) {
    return rejectStale(input.actor, projection, "STALE_PROJECTION_VERSION");
  }
  if (projection.hold !== "revocation-hold" && projection.hold !== "withdrawal-hold") {
    const decision = recordDecision({
      actor: input.actor,
      projection,
      decisionKind: "hold-clear",
      permissionUsed: permission,
      reason: input.reason,
      expectedProjectionVersion: input.expectedProjectionVersion,
      status: "rejected",
      rejectionReason: "HOLD_NOT_CLEARABLE",
      lifecycleEventId: input.lifecycleEventId,
      sourceVersion: input.sourceVersion,
      snapshotId: input.snapshotId,
      resultingHold: projection.hold,
    });
    return {
      status: "rejected",
      reason: "HOLD_NOT_CLEARABLE",
      decision,
      projection,
      ...lifecycleBlockerFields(),
    };
  }

  const priorHold = projection.hold;
  const next = bumpProjection(projection, {
    hold: "none",
    holdAppliedEventId: undefined,
    holdReason: undefined,
  });

  // Restore held (non-disqualified, non-superseded) eligibilities to eligible if selected, else pending-review
  for (const el of listSnapshotEligibility(next)) {
    if (el.eligibility === "held") {
      upsertSnapshotEligibility({
        ...el,
        eligibility:
          next.selectedSnapshotId === el.snapshotId ? "eligible" : "pending-review",
        eligibilityVersion: el.eligibilityVersion + 1,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  const decision = recordDecision({
    actor: input.actor,
    projection: next,
    decisionKind: "hold-clear",
    permissionUsed: permission,
    reason: input.reason,
    expectedProjectionVersion: input.expectedProjectionVersion,
    status: "accepted",
    lifecycleEventId: input.lifecycleEventId,
    sourceVersion: input.sourceVersion,
    snapshotId: input.snapshotId ?? next.selectedSnapshotId ?? undefined,
    priorHold,
    resultingHold: "none",
  });

  return {
    status: "accepted",
    decision,
    projection: next,
    ...lifecycleBlockerFields(),
  };
}

export function selectSupersedingSnapshot(input: {
  actor: M07Actor;
  organisationId: string;
  legalEntityId: string;
  timesheetRecordId: string;
  targetSnapshotId: string;
  expectedProjectionVersion: number;
  reason: string;
}): LifecycleDecisionResult {
  runM07SchemaV5Migration();
  const permission: M07PermissionCode = "payroll.lifecycle.supersede";
  try {
    assertM07Permission(input.actor, permission);
  } catch {
    return {
      status: "denied",
      reason: "MISSING_PERMISSION_SUPERSEDE",
      ...lifecycleBlockerFields(),
    };
  }
  assertM07LegalEntityScope(input.actor, input.legalEntityId);

  const projection = ensureLifecycleProjection(input);
  if (projection.projectionVersion !== input.expectedProjectionVersion) {
    return rejectStale(input.actor, projection, "STALE_PROJECTION_VERSION");
  }
  if (projection.hold !== "none" && projection.hold !== "revision-review-hold") {
    return {
      status: "rejected",
      reason: "HOLD_BLOCKS_SUPERSESSION",
      projection,
      ...lifecycleBlockerFields(),
    };
  }

  const target = getPublishedTimesheetSnapshotById(
    { organisationId: input.organisationId, legalEntityId: input.legalEntityId },
    input.targetSnapshotId
  );
  if (!target) {
    return {
      status: "rejected",
      reason: "TARGET_SNAPSHOT_NOT_FOUND",
      ...lifecycleBlockerFields(),
    };
  }
  if (target.timesheetRecordId !== input.timesheetRecordId) {
    return {
      status: "rejected",
      reason: "CROSS_TIMESHEET_SELECTION_DENIED",
      ...lifecycleBlockerFields(),
    };
  }
  if (
    target.organisationId !== input.organisationId ||
    target.legalEntityId !== input.legalEntityId
  ) {
    return {
      status: "rejected",
      reason: "CROSS_TENANT_SELECTION_DENIED",
      ...lifecycleBlockerFields(),
    };
  }
  if (target.clinicId) {
    try {
      assertM07ClinicScope(input.actor, [target.clinicId]);
    } catch {
      return {
        status: "denied",
        reason: "CLINIC_MISMATCH",
        ...lifecycleBlockerFields(),
      };
    }
  }

  const targetEl = getSnapshotEligibilityBySnapshotId({
    organisationId: input.organisationId,
    legalEntityId: input.legalEntityId,
    snapshotId: target.id,
  });
  if (
    !targetEl ||
    targetEl.eligibility === "held" ||
    targetEl.eligibility === "disqualified" ||
    targetEl.eligibility === "superseded"
  ) {
    return {
      status: "rejected",
      reason: "TARGET_NOT_SELECTABLE",
      ...lifecycleBlockerFields(),
    };
  }

  if (
    projection.preparationProgress === "started-not-approved" ||
    projection.preparationProgress === "approved" ||
    projection.preparationProgress === "exported"
  ) {
    // Changing selection after prep started requires exception resolution path —
    // still allowed with supersede permission + reason, but records exception.
    createPrepException({
      actor: input.actor,
      organisationId: input.organisationId,
      legalEntityId: input.legalEntityId,
      timesheetRecordId: input.timesheetRecordId,
      kind:
        projection.preparationProgress === "exported"
          ? "exported-terminal"
          : projection.preparationProgress === "approved"
            ? "approved-blocked"
            : "prep-frozen-held",
      status: projection.preparationProgress === "exported" ? "terminal" : "open",
      preparationProgress: projection.preparationProgress,
      reason: "SUPERSESSION_AFTER_PREP_STARTED",
      snapshotId: target.id,
    });
  }

  const previousSnapshotId = projection.selectedSnapshotId;
  if (previousSnapshotId && previousSnapshotId !== target.id) {
    const prevEl = getSnapshotEligibilityBySnapshotId({
      organisationId: input.organisationId,
      legalEntityId: input.legalEntityId,
      snapshotId: previousSnapshotId,
    });
    if (prevEl && prevEl.eligibility !== "disqualified") {
      upsertSnapshotEligibility({
        ...prevEl,
        eligibility: "superseded",
        eligibilityVersion: prevEl.eligibilityVersion + 1,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  upsertSnapshotEligibility({
    ...(targetEl as PublishedTimesheetSnapshotEligibility),
    eligibility: "eligible",
    eligibilityVersion: targetEl.eligibilityVersion + 1,
    updatedAt: new Date().toISOString(),
  });

  const next = bumpProjection(projection, {
    selectedSnapshotId: target.id,
    supersessionState: "selected",
    hold: "none",
    holdAppliedEventId: undefined,
    holdReason: undefined,
  });

  const decision = recordDecision({
    actor: input.actor,
    projection: next,
    decisionKind: "supersession-select",
    permissionUsed: permission,
    reason: input.reason,
    expectedProjectionVersion: input.expectedProjectionVersion,
    status: "accepted",
    snapshotId: target.id,
    previousSnapshotId: previousSnapshotId ?? undefined,
    sourceVersion: target.sourceVersion,
    priorHold: projection.hold,
    resultingHold: "none",
    priorEligibility: targetEl.eligibility,
    resultingEligibility: "eligible",
  });

  recordM07Audit({
    actor: input.actor,
    action: "published-timesheet.lifecycle.supersession.accepted",
    entityType: "published-timesheet-lifecycle-decision",
    entityId: decision.id,
    legalEntityId: input.legalEntityId,
    reason: input.reason,
    before: { selectedSnapshotId: previousSnapshotId },
    after: { selectedSnapshotId: target.id },
    meta: {
      organisationId: input.organisationId,
      timesheetRecordId: input.timesheetRecordId,
      blockedM07: lifecycleBlockerFields().blockedM07,
      impliesPayrollApproval: false,
    },
  });

  return {
    status: "accepted",
    decision,
    projection: next,
    ...lifecycleBlockerFields(),
  };
}

export function requalifyInvalidatedSnapshot(input: {
  actor: M07Actor;
  organisationId: string;
  legalEntityId: string;
  timesheetRecordId: string;
  sourceVersion: number;
  expectedProjectionVersion: number;
  reason: string;
}): LifecycleDecisionResult {
  runM07SchemaV5Migration();
  const permission: M07PermissionCode = "payroll.lifecycle.requalify";
  try {
    assertM07Permission(input.actor, permission);
  } catch {
    return {
      status: "denied",
      reason: "MISSING_PERMISSION_REQUALIFY",
      ...lifecycleBlockerFields(),
    };
  }
  assertM07LegalEntityScope(input.actor, input.legalEntityId);

  const projection = ensureLifecycleProjection(input);
  if (projection.projectionVersion !== input.expectedProjectionVersion) {
    return rejectStale(input.actor, projection, "STALE_PROJECTION_VERSION");
  }

  const el = getSnapshotEligibility({
    organisationId: input.organisationId,
    legalEntityId: input.legalEntityId,
    timesheetRecordId: input.timesheetRecordId,
    sourceVersion: input.sourceVersion,
  });
  if (!el || el.eligibility !== "disqualified") {
    return {
      status: "rejected",
      reason: "NOT_DISQUALIFIED",
      projection,
      ...lifecycleBlockerFields(),
    };
  }

  upsertSnapshotEligibility({
    ...el,
    eligibility: "pending-review",
    eligibilityVersion: el.eligibilityVersion + 1,
    updatedAt: new Date().toISOString(),
  });

  const next =
    projection.hold === "invalidation-hold"
      ? bumpProjection(projection, {
          hold: "revision-review-hold",
          holdReason: "REQUALIFIED_PENDING_REVIEW",
          supersessionState: "pending-authorised-selection",
        })
      : bumpProjection(projection, {
          supersessionState: "pending-authorised-selection",
        });

  const decision = recordDecision({
    actor: input.actor,
    projection: next,
    decisionKind: "requalify",
    permissionUsed: permission,
    reason: input.reason,
    expectedProjectionVersion: input.expectedProjectionVersion,
    status: "accepted",
    sourceVersion: input.sourceVersion,
    snapshotId: el.snapshotId,
    priorHold: projection.hold,
    resultingHold: next.hold,
    priorEligibility: "disqualified",
    resultingEligibility: "pending-review",
  });

  return {
    status: "accepted",
    decision,
    projection: next,
    ...lifecycleBlockerFields(),
  };
}

export function resolveLifecycleException(input: {
  actor: M07Actor;
  organisationId: string;
  legalEntityId: string;
  exceptionId: string;
  expectedProjectionVersion: number;
  reason: string;
}): LifecycleDecisionResult {
  runM07SchemaV5Migration();
  const permission: M07PermissionCode = "payroll.lifecycle.exception.resolve";
  try {
    assertM07Permission(input.actor, permission);
  } catch {
    return {
      status: "denied",
      reason: "MISSING_PERMISSION_EXCEPTION_RESOLVE",
      ...lifecycleBlockerFields(),
    };
  }
  assertM07LegalEntityScope(input.actor, input.legalEntityId);

  const row = listLifecycleExceptions({
    organisationId: input.organisationId,
    legalEntityId: input.legalEntityId,
  }).find((e) => e.id === input.exceptionId);
  if (!row) {
    return {
      status: "rejected",
      reason: "EXCEPTION_NOT_FOUND",
      ...lifecycleBlockerFields(),
    };
  }
  if (row.status === "terminal") {
    return {
      status: "rejected",
      reason: "TERMINAL_EXCEPTION_NOT_RESOLVABLE",
      ...lifecycleBlockerFields(),
    };
  }

  const projection = ensureLifecycleProjection({
    organisationId: row.organisationId,
    legalEntityId: row.legalEntityId,
    timesheetRecordId: row.timesheetRecordId,
  });
  if (projection.projectionVersion !== input.expectedProjectionVersion) {
    return rejectStale(input.actor, projection, "STALE_PROJECTION_VERSION");
  }

  upsertLifecycleException({
    ...row,
    status: "resolved",
    resolvedAt: new Date().toISOString(),
    resolvedBy: input.actor.userId,
    resolutionReason: input.reason,
  });

  const decision = recordDecision({
    actor: input.actor,
    projection,
    decisionKind: "exception-resolve",
    permissionUsed: permission,
    reason: input.reason,
    expectedProjectionVersion: input.expectedProjectionVersion,
    status: "accepted",
    snapshotId: row.snapshotId,
    priorHold: projection.hold,
    resultingHold: projection.hold,
  });

  recordM07Audit({
    actor: input.actor,
    action: "published-timesheet.lifecycle.exception.resolved",
    entityType: "published-timesheet-lifecycle-exception",
    entityId: row.id,
    legalEntityId: input.legalEntityId,
    reason: input.reason,
    meta: { organisationId: input.organisationId, blockedM07: lifecycleBlockerFields().blockedM07 },
  });

  return {
    status: "accepted",
    decision,
    projection,
    ...lifecycleBlockerFields(),
  };
}

function rejectStale(
  actor: M07Actor,
  projection: PublishedTimesheetLifecycleProjection,
  reason: string
): LifecycleDecisionResult {
  recordM07Audit({
    actor,
    action: "published-timesheet.lifecycle.stale-decision.denied",
    entityType: "published-timesheet-lifecycle-projection",
    entityId: projection.id,
    legalEntityId: projection.legalEntityId,
    reason,
    meta: {
      organisationId: projection.organisationId,
      expectedNote: "caller version mismatch",
      blockedM07: lifecycleBlockerFields().blockedM07,
    },
  });
  return {
    status: "rejected",
    reason,
    projection,
    ...lifecycleBlockerFields(),
  };
}

function recordDecision(input: {
  actor: M07Actor;
  projection: PublishedTimesheetLifecycleProjection;
  decisionKind: PublishedTimesheetLifecycleDecision["decisionKind"];
  permissionUsed: string;
  reason: string;
  expectedProjectionVersion: number;
  status: "accepted" | "rejected";
  rejectionReason?: string;
  lifecycleEventId?: string;
  sourceVersion?: number;
  snapshotId?: string;
  previousSnapshotId?: string;
  priorHold?: OperationalHoldKind;
  resultingHold?: OperationalHoldKind;
  priorEligibility?: SnapshotEligibilityState;
  resultingEligibility?: SnapshotEligibilityState;
}): PublishedTimesheetLifecycleDecision {
  const decision = appendLifecycleDecision({
    id: newLifecycleDecisionId(),
    organisationId: input.projection.organisationId,
    legalEntityId: input.projection.legalEntityId,
    timesheetRecordId: input.projection.timesheetRecordId,
    decisionKind: input.decisionKind,
    sourceVersion: input.sourceVersion,
    snapshotId: input.snapshotId,
    previousSnapshotId: input.previousSnapshotId,
    lifecycleEventId: input.lifecycleEventId,
    priorHold: input.priorHold ?? input.projection.hold,
    resultingHold: input.resultingHold ?? input.projection.hold,
    priorEligibility: input.priorEligibility,
    resultingEligibility: input.resultingEligibility,
    expectedProjectionVersion: input.expectedProjectionVersion,
    actorUserId: input.actor.userId,
    permissionUsed: input.permissionUsed,
    reason: input.reason,
    decidedAt: new Date().toISOString(),
    decisionVersion: 1,
    status: input.status,
    rejectionReason: input.rejectionReason,
  });

  recordM07Audit({
    actor: input.actor,
    action: `published-timesheet.lifecycle.decision.${input.decisionKind}.${input.status}`,
    entityType: "published-timesheet-lifecycle-decision",
    entityId: decision.id,
    legalEntityId: input.projection.legalEntityId,
    reason: input.reason,
    before: { hold: decision.priorHold, eligibility: decision.priorEligibility },
    after: { hold: decision.resultingHold, eligibility: decision.resultingEligibility },
    meta: {
      organisationId: input.projection.organisationId,
      timesheetRecordId: input.projection.timesheetRecordId,
      permissionUsed: input.permissionUsed,
      blockedM07: lifecycleBlockerFields().blockedM07,
    },
  });

  return decision;
}

export function findPriorSnapshotWithSameContentHash(input: {
  organisationId: string;
  legalEntityId: string;
  timesheetRecordId: string;
  contentHash: string;
  excludeSourceVersion?: number;
}): PublishedTimesheetSourceSnapshot | null {
  return (
    listPublishedTimesheetSnapshots({
      organisationId: input.organisationId,
      legalEntityId: input.legalEntityId,
      timesheetRecordId: input.timesheetRecordId,
    }).find(
      (s) =>
        s.contentHash === input.contentHash &&
        (input.excludeSourceVersion === undefined ||
          s.sourceVersion !== input.excludeSourceVersion)
    ) ?? null
  );
}

export {
  getLifecycleProjection,
  getLifecycleProjectionById,
  listLifecycleExceptions,
  listSnapshotEligibility,
  getSnapshotEligibility,
  ensureLifecycleProjection,
};
