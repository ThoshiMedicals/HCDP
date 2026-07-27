/**
 * M05 publication service.
 *
 * Contract (§11 of the plan):
 * - Publication body is IMMUTABLE once appended. Corrections/amendments create
 *   a NEW publication and mark the prior one `superseded`.
 * - Period lifecycle moves to `published` at publish time; prior publication
 *   for the same period is marked superseded on new publish.
 * - Period STAYS `published` while acks are in flight. Ack aggregation is a
 *   DERIVED status (`none` / `partial` / `full`) recomputed via
 *   `recomputePublicationAckStatus` — it does NOT rewrite the immutable body.
 * - Full revalidation of assignments against M04/platform eligibility happens
 *   at publish time; publish is denied for stale period version.
 */

import { assertM05ClinicScope, assertM05Permission, type M05Actor } from "../permissions";
import { resolveClinicTimezone } from "@/platform/workforce/services/clinic-timezone";
import type {
  Acknowledgement,
  PublicationAcknowledgementStatus,
  PublicationShiftSnapshot,
  PublicationWarningSummary,
  RosterPublication,
} from "../types/domain";
import * as store from "../repository/local-store";
import { appendRosterAudit } from "./audit-helpers";
import { evaluateEligibility } from "./eligibility-service";
import { publishM05RosterEvent } from "./events";
import { rosterEventIdempotencyKey } from "@/platform/workforce/events/roster-events";
import {
  ConcurrentConflictError,
  ImmutablePublicationError,
  InvalidLifecycleTransitionError,
  OverrideReasonRequiredError,
} from "./errors";

export interface PreviewPublicationInput {
  rosterPeriodId: string;
  asOf?: string;
  selectedClinicIds?: string[];
}

export interface PublicationPreview {
  rosterPeriodId: string;
  clinicId: string;
  timeZoneId: string;
  proposedPublicationVersion: number;
  supersedesId: string | null;
  requiredAcknowledgerPersonIds: string[];
  assignments: PublicationShiftSnapshot[];
  warnings: PublicationWarningSummary[];
  blockers: PublicationWarningSummary[];
  asOf: string;
  eligibilityBlockedAssignmentIds: string[];
}

// ——— Preview ———

export function previewPublication(actor: M05Actor, input: PreviewPublicationInput): PublicationPreview {
  assertM05Permission(actor, "roster.publish");
  const period = store.getPeriod(input.rosterPeriodId);
  if (!period) throw new Error(`Period not found: ${input.rosterPeriodId}`);
  assertM05ClinicScope(actor, [period.clinicId]);

  if (input.selectedClinicIds && !input.selectedClinicIds.includes(period.clinicId)) {
    throw new Error("Selected clinicIds does not include the period's clinic");
  }

  const tz = resolveClinicTimezone(period.clinicId);
  if (!tz.ok) throw new Error(`Cannot publish — clinic timezone unresolved: ${tz.reason}`);

  const asOf = input.asOf ?? new Date().toISOString();
  const shifts = store.listShifts(period.id).filter((s) => !["cancelled", "superseded"].includes(s.status));

  const assignments: PublicationShiftSnapshot[] = [];
  const warnings: PublicationWarningSummary[] = [];
  const blockers: PublicationWarningSummary[] = [];
  const requiredAckSet = new Set<string>();
  const eligibilityBlockedAssignmentIds: string[] = [];

  for (const shift of shifts) {
    const assignment = shift.currentAssignmentId
      ? store.getAssignment(shift.currentAssignmentId)
      : null;

    assignments.push({
      shiftId: shift.id,
      personId: assignment?.personId ?? null,
      timeZoneId: shift.timeZoneId,
      localStart: shift.localStart,
      localEnd: shift.localEnd,
      utcStart: shift.utcStart,
      utcEnd: shift.utcEnd,
      roleLabel: shift.roleLabel,
    });
    if (assignment?.personId) requiredAckSet.add(assignment.personId);

    if (!assignment || assignment.state !== "assigned") {
      warnings.push({
        ruleId: "coverage.unassigned",
        ruleVersion: 1,
        severity: "warn",
        description: `Shift ${shift.id} is not currently assigned`,
      });
      continue;
    }

    const decision = evaluateEligibility({
      personId: assignment.personId,
      clinicId: shift.clinicId,
      asOf,
      shiftWindow: {
        clinicId: shift.clinicId,
        timeZoneId: shift.timeZoneId,
        localStart: shift.localStart,
        localEnd: shift.localEnd,
        utcStart: shift.utcStart,
        utcEnd: shift.utcEnd,
        startOffsetMinutes: shift.startOffsetMinutes,
        endOffsetMinutes: shift.endOffsetMinutes,
        startFold: shift.startFold,
        endFold: shift.endFold,
        crossesLocalMidnight: shift.crossesLocalMidnight,
      },
    });
    if (decision.decision === "hard_block" || decision.decision === "never_overridable") {
      eligibilityBlockedAssignmentIds.push(assignment.id);
      for (const b of decision.blockers) {
        blockers.push({
          ruleId: `eligibility.${b.code}`,
          ruleVersion: 1,
          severity: "block",
          description: b.description,
          overrideReason: assignment.overrideReason ?? null,
        });
      }
    }
    for (const w of decision.warnings) {
      warnings.push({
        ruleId: `eligibility.${w.code}`,
        ruleVersion: 1,
        severity: "warn",
        description: w.description,
        overrideReason: assignment.overrideReason ?? null,
      });
    }
  }

  const priorPublication = store
    .listPublications(period.id)
    .filter((p) => !p.supersededById)
    .sort((a, b) => b.publicationVersion - a.publicationVersion)[0];

  return {
    rosterPeriodId: period.id,
    clinicId: period.clinicId,
    timeZoneId: tz.timeZone,
    proposedPublicationVersion: (priorPublication?.publicationVersion ?? 0) + 1,
    supersedesId: priorPublication?.id ?? null,
    requiredAcknowledgerPersonIds: [...requiredAckSet],
    assignments,
    warnings,
    blockers,
    asOf,
    eligibilityBlockedAssignmentIds,
  };
}

// ——— Publish ———

export interface PublishInput {
  rosterPeriodId: string;
  expectedPeriodVersion: number;
  asOf?: string;
  emergencyOverrideReason?: string;
}

export function publishPeriod(actor: M05Actor, input: PublishInput): RosterPublication {
  assertM05Permission(actor, "roster.publish");
  const period = store.getPeriod(input.rosterPeriodId);
  if (!period) throw new Error(`Period not found: ${input.rosterPeriodId}`);
  assertM05ClinicScope(actor, [period.clinicId]);

  if (period.version !== input.expectedPeriodVersion) {
    throw new ConcurrentConflictError({
      targetType: "period",
      targetId: period.id,
      expectedVersion: input.expectedPeriodVersion,
      actualVersion: period.version,
    });
  }
  const publishableFrom: Array<typeof period.lifecycleState> = [
    "draft",
    "under_review",
    "ready_to_publish",
    // `published` is allowed for supersede — a new immutable publication is
    // appended and the period stays `published` (§11). Prior publication
    // is linked via `supersedesId`.
    "published",
  ];
  if (!publishableFrom.includes(period.lifecycleState)) {
    throw new InvalidLifecycleTransitionError({
      from: period.lifecycleState,
      to: "published",
      targetType: "period",
    });
  }

  const preview = previewPublication(actor, {
    rosterPeriodId: period.id,
    asOf: input.asOf,
  });

  if (preview.blockers.length > 0) {
    if (!input.emergencyOverrideReason?.trim()) {
      throw new OverrideReasonRequiredError(
        `${preview.blockers.length} eligibility blocker(s) — emergency override reason required to publish`
      );
    }
    assertM05Permission(actor, "roster.override");
  }

  const now = new Date().toISOString();
  const publication: RosterPublication = {
    id: store.newPublicationId(),
    rosterPeriodId: period.id,
    clinicId: period.clinicId,
    organisationId: period.organisationId,
    publicationVersion: preview.proposedPublicationVersion,
    publishedAt: now,
    publishedBy: actor.userId,
    asOf: preview.asOf,
    timeZoneId: preview.timeZoneId,
    assignments: preview.assignments,
    warnings: [...preview.warnings, ...preview.blockers],
    supersedesId: preview.supersedesId,
    supersededById: null,
    acknowledgementStatus: "none",
    requiredAcknowledgerPersonIds: preview.requiredAcknowledgerPersonIds,
    cancelReason: null,
    seedBatchId: null,
    createdAt: now,
    version: 1,
  };
  store.appendPublication(publication);

  if (preview.supersedesId) {
    const prior = store.getPublication(preview.supersedesId);
    if (prior) {
      store.updatePublicationRollUp(prior.id, { supersededById: publication.id });
    }
  }

  // Move period to `published` and bump its version — future edits should
  // create superseding publications rather than mutating the current one.
  const nextPeriod = { ...period, lifecycleState: "published" as const, updatedAt: now, version: period.version + 1 };
  store.upsertPeriod(nextPeriod);

  for (const snap of preview.assignments) {
    if (!snap.personId) continue;
    const shift = store.getShift(snap.shiftId);
    if (!shift?.currentAssignmentId) continue;
    store.linkAssignmentToPublication(shift.currentAssignmentId, publication.id);
  }

  appendRosterAudit({
    actorId: actor.userId,
    organisationId: period.organisationId,
    clinicId: period.clinicId,
    action: "period.published",
    targetType: "publication",
    targetId: publication.id,
    detail: {
      publicationVersion: publication.publicationVersion,
      supersedesId: publication.supersedesId,
      warnings: publication.warnings.length,
      requiredAcks: publication.requiredAcknowledgerPersonIds.length,
      emergencyOverrideReason: input.emergencyOverrideReason ?? null,
    },
  });

  publishM05RosterEvent({
    eventType: "roster.published",
    sourceRecordId: publication.id,
    sourceRecordVersion: publication.publicationVersion,
    sourceRecordType: "roster-publication",
    sourceRecordTitle: `Publication v${publication.publicationVersion}`,
    organisationId: publication.organisationId,
    clinicId: publication.clinicId,
    actor: actor.userId,
    idempotencyKey: rosterEventIdempotencyKey({
      namespace: "roster.publication",
      recordId: publication.id,
      version: publication.publicationVersion,
    }),
    section: "published-history",
    currentStatus: publication.acknowledgementStatus,
    payload: {
      rosterPeriodId: publication.rosterPeriodId,
      supersedesId: publication.supersedesId,
      assignmentCount: publication.assignments.length,
      warningCount: publication.warnings.length,
    },
  });

  return publication;
}

// ——— Supersede an existing publication with a new one ———

export function supersedePublication(
  actor: M05Actor,
  input: PublishInput & { priorPublicationId: string }
): RosterPublication {
  const prior = store.getPublication(input.priorPublicationId);
  if (!prior) throw new Error(`Prior publication not found: ${input.priorPublicationId}`);
  if (prior.rosterPeriodId !== input.rosterPeriodId) {
    throw new Error("priorPublicationId does not belong to the given period");
  }
  if (prior.supersededById) {
    throw new ImmutablePublicationError("Prior publication is already superseded");
  }
  return publishPeriod(actor, input);
}

// ——— Acknowledgement rollup ———

function deriveAckStatus(
  required: string[],
  acks: Acknowledgement[]
): PublicationAcknowledgementStatus {
  if (required.length === 0) return "full";
  const acknowledged = new Set(
    acks.filter((a) => a.outcome === "acknowledged").map((a) => a.personId)
  );
  const anyAck = acknowledged.size > 0;
  const allAck = required.every((pid) => acknowledged.has(pid));
  if (allAck) return "full";
  if (anyAck) return "partial";
  return "none";
}

export function recomputePublicationAckStatus(publicationId: string): PublicationAcknowledgementStatus {
  const pub = store.getPublication(publicationId);
  if (!pub) return "none";
  const acks = store.listAcknowledgements(pub.id).filter((a) => a.publicationVersion === pub.publicationVersion);
  const status = deriveAckStatus(pub.requiredAcknowledgerPersonIds, acks);
  if (status !== pub.acknowledgementStatus) {
    store.updatePublicationRollUp(pub.id, { acknowledgementStatus: status });
  }
  return status;
}

// ——— Reads ———

export function listPublicationsForActor(
  actor: M05Actor,
  periodId?: string
): RosterPublication[] {
  assertM05Permission(actor, "roster.view");
  return store.listPublications(periodId).filter((p) => {
    if (actor.permissions.includes("*")) return true;
    if (actor.clinicIds === undefined) return true;
    if (!actor.clinicIds.length) return false;
    return actor.clinicIds.includes(p.clinicId);
  });
}
