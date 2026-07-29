/**
 * M07 published-timesheet intake — Checkpoint 2.4.
 *
 * Dependency direction:
 *   platform PublishedTimesheetRegistry (tenant-scoped query)
 *   → this service (eligibility + immutable snapshot)
 *   → M07 snapshot store
 *
 * Does not read pulse.m06.* or mutate the platform registry. Global BLOCKED-M07 cleared at CP 2.7B; eligibility/isolation remain independent.
 */

import {
  PUBLISHED_TIMESHEET_CONTRACT_VERSION,
  type PublishedTimesheetVersion,
} from "@/platform/workforce/contracts/published-timesheet-contract";
import { calculatePayrollContentHash } from "@/platform/workforce/contracts/published-timesheet-hash";
import {
  getCurrentPublishedTimesheet,
  getPublishedTimesheetByRegistryId,
  getPublishedTimesheetVersion,
} from "@/platform/workforce/services/published-timesheet-registry";
import type { ClinicMembershipCheck } from "@/platform/workforce/validation/published-timesheet-validation";
import {
  assertM07ClinicScope,
  assertM07LegalEntityScope,
  assertM07Permission,
  type M07Actor,
} from "../permissions";
import {
  appendPublishedTimesheetSnapshot,
  getCurrentIntakeIndex,
  getPublishedTimesheetSnapshotByBusinessKey,
  getPublishedTimesheetSnapshotById,
  listPublishedTimesheetSnapshots,
  newSnapshotId,
  rebuildPublishedTimesheetSnapshotIndexes,
} from "../repository/published-timesheet-snapshots";
import { recordM07Audit } from "./audit-service";
import { assertNoProhibitedFields } from "./sensitive-fields";
import { assertNoLockedPeriodAffectedBySnapshot } from "./period-lock-guard";
import { runM07SchemaV3Migration } from "../storage/migrate-v3";
import type {
  PublishedTimesheetIntakeStatus,
  PublishedTimesheetSourceSnapshot,
} from "../types/domain";
import { m07GlobalBlockerFields } from "../adapters/m06-timesheet-read";

const ELIGIBLE_PUBLICATION_STATES = new Set(["approved", "revised", "restored"]);
const INELIGIBLE_PUBLICATION_STATES = new Set([
  "revoked",
  "withdrawn",
  "invalidated",
  "draft",
  "submitted",
  "rejected",
  "disputed",
]);

export type IntakeScope = {
  organisationId: string;
  legalEntityId: string;
  clinicId?: string;
};

export type IntakePublishedTimesheetResult = {
  status: PublishedTimesheetIntakeStatus;
  snapshot?: PublishedTimesheetSourceSnapshot;
  reason?: string;
  /** Propagates authoritative global blocker status (cleared at CP 2.7B). */
  blockedM07: boolean;
  workflowEvidenceCode: string;
};

function blockedResult(
  status: PublishedTimesheetIntakeStatus,
  reason: string,
  snapshot?: PublishedTimesheetSourceSnapshot
): IntakePublishedTimesheetResult {
  return {
    status,
    reason,
    snapshot,
    ...m07GlobalBlockerFields(),
  };
}

function resolvePublication(
  scope: IntakeScope,
  registryPublicationId: string
): { ok: true; version: PublishedTimesheetVersion } | { ok: false; reason: string; status: PublishedTimesheetIntakeStatus } {
  try {
    const version = getPublishedTimesheetByRegistryId(
      { organisationId: scope.organisationId, legalEntityId: scope.legalEntityId },
      registryPublicationId
    );
    if (!version) {
      return { ok: false, reason: "PUBLICATION_NOT_FOUND", status: "rejected" };
    }
    return { ok: true, version };
  } catch {
    return { ok: false, reason: "REGISTRY_UNAVAILABLE", status: "unavailable" };
  }
}

function evaluateEligibility(
  version: PublishedTimesheetVersion,
  scope: IntakeScope,
  options?: { clinicMembershipCheck?: ClinicMembershipCheck }
): { ok: true } | { ok: false; reason: string } {
  if (!scope.organisationId?.trim() || !scope.legalEntityId?.trim()) {
    return { ok: false, reason: "MISSING_SCOPE" };
  }
  if (
    version.organisationId !== scope.organisationId ||
    version.legalEntityId !== scope.legalEntityId
  ) {
    return { ok: false, reason: "SCOPE_MISMATCH" };
  }
  if (version.contractVersion !== PUBLISHED_TIMESHEET_CONTRACT_VERSION) {
    return { ok: false, reason: "UNSUPPORTED_CONTRACT" };
  }
  if (!Number.isInteger(version.sourceVersion) || version.sourceVersion < 1) {
    return { ok: false, reason: "INVALID_SOURCE_VERSION" };
  }
  if (!Number.isInteger(version.approvalRevision) || version.approvalRevision < 1) {
    return { ok: false, reason: "INVALID_APPROVAL_REVISION" };
  }
  if (!version.workforcePersonId?.trim()) {
    return { ok: false, reason: "MISSING_WORKFORCE_PERSON" };
  }
  if (!version.timesheetRecordId?.trim()) {
    return { ok: false, reason: "MISSING_TIMESHEET_RECORD" };
  }
  if (!version.periodStart?.trim() || !version.periodEnd?.trim()) {
    return { ok: false, reason: "MISSING_PERIOD" };
  }
  if (!version.eventId?.trim() || !version.idempotencyKey?.trim()) {
    return { ok: false, reason: "MISSING_EVENT_IDENTITY" };
  }
  if (!Number.isInteger(version.eventSequence) || version.eventSequence < 1) {
    return { ok: false, reason: "INVALID_EVENT_SEQUENCE" };
  }

  // Prefer current lifecycle projection — immutable version rows retain original approvalState.
  const current = getCurrentPublishedTimesheet(
    { organisationId: version.organisationId, legalEntityId: version.legalEntityId },
    version.timesheetRecordId
  );
  const lifecycleState = current?.currentApprovalState ?? version.approvalState;
  if (INELIGIBLE_PUBLICATION_STATES.has(lifecycleState)) {
    return { ok: false, reason: `INELIGIBLE_STATE_${lifecycleState.toUpperCase()}` };
  }
  if (!ELIGIBLE_PUBLICATION_STATES.has(lifecycleState)) {
    return { ok: false, reason: "INELIGIBLE_APPROVAL_STATE" };
  }
  // Only intake the content version that is currently projected (unless no current — use version).
  if (current && current.currentSourceVersion !== version.sourceVersion) {
    return { ok: false, reason: "NOT_CURRENT_SOURCE_VERSION" };
  }

  if (scope.clinicId && version.clinicId && version.clinicId !== scope.clinicId) {
    return { ok: false, reason: "CLINIC_MISMATCH" };
  }
  if (options?.clinicMembershipCheck && version.clinicId) {
    const ok = options.clinicMembershipCheck({
      organisationId: version.organisationId,
      legalEntityId: version.legalEntityId,
      clinicId: version.clinicId,
    });
    if (!ok) return { ok: false, reason: "CLINIC_MEMBERSHIP" };
  }

  try {
    assertNoProhibitedFields(version);
  } catch {
    return { ok: false, reason: "PROHIBITED_FIELDS" };
  }

  let calculated: string;
  try {
    calculated = calculatePayrollContentHash({
      timesheetRecordId: version.timesheetRecordId,
      workforcePersonId: version.workforcePersonId,
      organisationId: version.organisationId,
      legalEntityId: version.legalEntityId,
      clinicId: version.clinicId,
      periodStart: version.periodStart,
      periodEnd: version.periodEnd,
      attendanceSessionIds: version.attendanceSessionIds,
      ordinaryHourInputs: version.ordinaryHourInputs,
      overtimeHourInputs: version.overtimeHourInputs,
      penaltyHourInputs: version.penaltyHourInputs,
      leaveInputs: version.leaveInputs,
      allowanceInputs: version.allowanceInputs,
    });
  } catch {
    return { ok: false, reason: "MALFORMED_PAYLOAD" };
  }
  if (calculated !== version.contentHash) {
    return { ok: false, reason: "CONTENT_HASH_MISMATCH" };
  }

  return { ok: true };
}

function buildSnapshot(
  version: PublishedTimesheetVersion,
  actorUserId: string
): PublishedTimesheetSourceSnapshot {
  return {
    id: newSnapshotId(),
    registryPublicationId: version.registryPublicationId,
    organisationId: version.organisationId,
    legalEntityId: version.legalEntityId,
    clinicId: version.clinicId,
    timesheetRecordId: version.timesheetRecordId,
    workforcePersonId: version.workforcePersonId,
    periodStart: version.periodStart,
    periodEnd: version.periodEnd,
    attendanceSessionIds: [...version.attendanceSessionIds],
    ordinaryHourInputs: version.ordinaryHourInputs.map((h) => ({ ...h })),
    overtimeHourInputs: version.overtimeHourInputs.map((h) => ({ ...h })),
    penaltyHourInputs: version.penaltyHourInputs.map((h) => ({ ...h })),
    leaveInputs: version.leaveInputs.map((l) => ({ ...l })),
    allowanceInputs: version.allowanceInputs.map((a) => ({ ...a })),
    sourceVersion: version.sourceVersion,
    approvalRevision: version.approvalRevision,
    contentHash: version.contentHash,
    contractVersion: version.contractVersion,
    sourceEventId: version.eventId,
    sourceIdempotencyKey: version.idempotencyKey,
    sourceEventSequence: version.eventSequence,
    sourcePublishedAt: version.publishedAt,
    publisherId: version.publisherId,
    publicationApprovalState: version.approvalState,
    intakeStatus: "imported",
    intakenAt: new Date().toISOString(),
    intakenBy: actorUserId,
    immutable: true,
  };
}

/**
 * Intake one eligible platform publication into an immutable M07 source snapshot.
 * Exact retry is idempotent. Same sourceVersion + different hash is a hard conflict.
 */
export function intakePublishedTimesheet(input: {
  actor: M07Actor;
  scope: IntakeScope;
  registryPublicationId: string;
  clinicMembershipCheck?: ClinicMembershipCheck;
}): IntakePublishedTimesheetResult {
  runM07SchemaV3Migration();
  assertM07Permission(input.actor, "payroll.intake.run");
  assertM07LegalEntityScope(input.actor, input.scope.legalEntityId);
  if (input.scope.clinicId) {
    assertM07ClinicScope(input.actor, [input.scope.clinicId]);
  }

  if (!input.scope.organisationId?.trim() || !input.scope.legalEntityId?.trim()) {
    return blockedResult("rejected", "MISSING_SCOPE");
  }
  // organisationId is independently required — never derive from legalEntityId.
  if (input.actor.legalEntityIds && !input.actor.permissions.includes("*")) {
    // Actor LE scope already asserted; organisation is a separate tenant boundary on the publication.
  }

  const resolved = resolvePublication(input.scope, input.registryPublicationId);
  if (!resolved.ok) {
    recordM07Audit({
      actor: input.actor,
      action: "published-timesheet.intake.rejected",
      entityType: "published-timesheet-snapshot",
      entityId: input.registryPublicationId,
      legalEntityId: input.scope.legalEntityId,
      clinicId: input.scope.clinicId,
      reason: resolved.reason,
      meta: {
        organisationId: input.scope.organisationId,
        status: resolved.status,
        blockedM07: m07GlobalBlockerFields().blockedM07,
      },
    });
    return blockedResult(resolved.status, resolved.reason);
  }

  const version = resolved.version;
  assertM07ClinicScope(input.actor, [version.clinicId]);

  const eligibility = evaluateEligibility(version, input.scope, {
    clinicMembershipCheck: input.clinicMembershipCheck,
  });
  if (!eligibility.ok) {
    recordM07Audit({
      actor: input.actor,
      action: "published-timesheet.intake.rejected",
      entityType: "published-timesheet-snapshot",
      entityId: version.registryPublicationId,
      legalEntityId: version.legalEntityId,
      clinicId: version.clinicId,
      reason: eligibility.reason,
      meta: {
        organisationId: version.organisationId,
        timesheetRecordId: version.timesheetRecordId,
        sourceVersion: version.sourceVersion,
        approvalRevision: version.approvalRevision,
        eventId: version.eventId,
        eventSequence: version.eventSequence,
        contentHash: version.contentHash,
        blockedM07: m07GlobalBlockerFields().blockedM07,
      },
    });
    return blockedResult("rejected", eligibility.reason);
  }

  const existing = getPublishedTimesheetSnapshotByBusinessKey({
    organisationId: version.organisationId,
    legalEntityId: version.legalEntityId,
    timesheetRecordId: version.timesheetRecordId,
    sourceVersion: version.sourceVersion,
  });

  if (existing) {
    if (existing.contentHash !== version.contentHash) {
      recordM07Audit({
        actor: input.actor,
        action: "published-timesheet.intake.conflict",
        entityType: "published-timesheet-snapshot",
        entityId: existing.id,
        legalEntityId: version.legalEntityId,
        clinicId: version.clinicId,
        reason: "SOURCE_VERSION_HASH_CONFLICT",
        meta: {
          organisationId: version.organisationId,
          timesheetRecordId: version.timesheetRecordId,
          sourceVersion: version.sourceVersion,
          existingContentHash: existing.contentHash,
          incomingContentHash: version.contentHash,
          blockedM07: m07GlobalBlockerFields().blockedM07,
        },
      });
      return blockedResult("conflict", "SOURCE_VERSION_HASH_CONFLICT", existing);
    }
    recordM07Audit({
      actor: input.actor,
      action: "published-timesheet.intake.idempotent",
      entityType: "published-timesheet-snapshot",
      entityId: existing.id,
      legalEntityId: version.legalEntityId,
      clinicId: version.clinicId,
      meta: {
        organisationId: version.organisationId,
        timesheetRecordId: version.timesheetRecordId,
        sourceVersion: version.sourceVersion,
        approvalRevision: version.approvalRevision,
        eventId: version.eventId,
        eventSequence: version.eventSequence,
        contentHash: version.contentHash,
        registryPublicationId: version.registryPublicationId,
        blockedM07: m07GlobalBlockerFields().blockedM07,
      },
    });
    return blockedResult("duplicate-idempotent", "EXACT_DUPLICATE", existing);
  }

  // Different event key for same version/hash is covered by business-key uniqueness above.
  // Lock guard BEFORE any authoritative snapshot write.
  assertNoLockedPeriodAffectedBySnapshot(input.actor, {
    legalEntityId: version.legalEntityId,
    periodStart: version.periodStart,
    periodEnd: version.periodEnd,
    reason: "published-timesheet-intake",
    personId: version.workforcePersonId,
  });

  const snapshot = buildSnapshot(version, input.actor.userId);
  const stored = appendPublishedTimesheetSnapshot(snapshot);

  // Acknowledge only when snapshot is resolvable.
  const resolvedSnap = getPublishedTimesheetSnapshotById(
    { organisationId: stored.organisationId, legalEntityId: stored.legalEntityId },
    stored.id
  );
  if (!resolvedSnap) {
    return blockedResult("unavailable", "SNAPSHOT_NOT_RESOLVABLE_AFTER_WRITE");
  }

  recordM07Audit({
    actor: input.actor,
    action: "published-timesheet.intake.imported",
    entityType: "published-timesheet-snapshot",
    entityId: resolvedSnap.id,
    legalEntityId: resolvedSnap.legalEntityId,
    clinicId: resolvedSnap.clinicId,
    after: {
      snapshotId: resolvedSnap.id,
      registryPublicationId: resolvedSnap.registryPublicationId,
      timesheetRecordId: resolvedSnap.timesheetRecordId,
      sourceVersion: resolvedSnap.sourceVersion,
      approvalRevision: resolvedSnap.approvalRevision,
      contentHash: resolvedSnap.contentHash,
      sourceEventId: resolvedSnap.sourceEventId,
      sourceEventSequence: resolvedSnap.sourceEventSequence,
    },
    meta: {
      organisationId: resolvedSnap.organisationId,
      blockedM07: m07GlobalBlockerFields().blockedM07,
      lineage: {
        snapshotId: resolvedSnap.id,
        registryPublicationId: resolvedSnap.registryPublicationId,
        contentHash: resolvedSnap.contentHash,
        sourceEventId: resolvedSnap.sourceEventId,
        timesheetRecordId: resolvedSnap.timesheetRecordId,
      },
    },
  });

  return blockedResult("imported", "IMPORTED", resolvedSnap);
}

/**
 * Intake by timesheet record + sourceVersion (must resolve through registry, not caller payload).
 */
export function intakePublishedTimesheetByRecordVersion(input: {
  actor: M07Actor;
  scope: IntakeScope;
  timesheetRecordId: string;
  sourceVersion: number;
  clinicMembershipCheck?: ClinicMembershipCheck;
}): IntakePublishedTimesheetResult {
  runM07SchemaV3Migration();
  assertM07Permission(input.actor, "payroll.intake.run");
  assertM07LegalEntityScope(input.actor, input.scope.legalEntityId);

  let version: PublishedTimesheetVersion | null;
  try {
    version = getPublishedTimesheetVersion(
      { organisationId: input.scope.organisationId, legalEntityId: input.scope.legalEntityId },
      input.timesheetRecordId,
      input.sourceVersion
    );
  } catch {
    return blockedResult("unavailable", "REGISTRY_UNAVAILABLE");
  }
  if (!version) {
    return blockedResult("rejected", "PUBLICATION_NOT_FOUND");
  }
  return intakePublishedTimesheet({
    actor: input.actor,
    scope: input.scope,
    registryPublicationId: version.registryPublicationId,
    clinicMembershipCheck: input.clinicMembershipCheck,
  });
}

export {
  getPublishedTimesheetSnapshotById,
  getPublishedTimesheetSnapshotByBusinessKey,
  listPublishedTimesheetSnapshots,
  getCurrentIntakeIndex,
  rebuildPublishedTimesheetSnapshotIndexes,
};
