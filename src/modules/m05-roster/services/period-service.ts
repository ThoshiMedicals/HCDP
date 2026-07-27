/**
 * M05 roster-period lifecycle service.
 *
 * Lifecycle (§19.1): draft → under_review → ready_to_publish → published →
 * superseded / cancelled / archived. Acknowledgement does NOT move a period
 * out of `published` (§11).
 *
 * All mutations require permission + clinic scope. Optimistic version checks
 * throw `ConcurrentConflictError` when the caller has a stale copy.
 */

import { assertM05ClinicScope, assertM05Permission, type M05Actor } from "../permissions";
import { resolveClinicTimezone } from "@/platform/workforce/services/clinic-timezone";
import type { PeriodLifecycleState, RosterPeriod } from "../types/domain";
import * as store from "../repository/local-store";
import { appendRosterAudit } from "./audit-helpers";
import {
  ConcurrentConflictError,
  InvalidLifecycleTransitionError,
  OverrideReasonRequiredError,
} from "./errors";

const DEFAULT_ORG = "org_parent";

const ALLOWED_TRANSITIONS: Record<PeriodLifecycleState, PeriodLifecycleState[]> = {
  draft: ["under_review", "ready_to_publish", "cancelled"],
  under_review: ["draft", "ready_to_publish", "cancelled"],
  ready_to_publish: ["under_review", "published", "cancelled"],
  published: ["superseded", "cancelled", "archived"],
  superseded: ["archived"],
  cancelled: ["archived"],
  archived: [],
};

export function isValidPeriodTransition(from: PeriodLifecycleState, to: PeriodLifecycleState): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

// ——— Create ———

export function createPeriod(
  actor: M05Actor,
  input: {
    label: string;
    startsOn: string;
    endsOn: string;
    clinicId: string;
    organisationId?: string;
  }
): RosterPeriod {
  assertM05Permission(actor, "roster.period.create");
  assertM05ClinicScope(actor, [input.clinicId]);

  const tz = resolveClinicTimezone(input.clinicId);
  if (!tz.ok) {
    throw new Error(`Cannot create period without clinic IANA timezone: ${tz.reason}`);
  }

  if (input.startsOn > input.endsOn) {
    throw new Error("Period startsOn must be on or before endsOn (clinic local dates)");
  }

  const now = new Date().toISOString();
  const period: RosterPeriod = {
    id: store.newPeriodId(),
    organisationId: input.organisationId ?? DEFAULT_ORG,
    clinicId: input.clinicId,
    label: input.label,
    startsOn: input.startsOn,
    endsOn: input.endsOn,
    timeZoneId: tz.timeZone,
    lifecycleState: "draft",
    seedBatchId: null,
    cancelReason: null,
    createdAt: now,
    createdBy: actor.userId,
    updatedAt: now,
    version: 1,
  };
  store.upsertPeriod(period);
  appendRosterAudit({
    actorId: actor.userId,
    organisationId: period.organisationId,
    clinicId: period.clinicId,
    action: "period.created",
    targetType: "period",
    targetId: period.id,
    detail: { label: period.label, startsOn: period.startsOn, endsOn: period.endsOn },
  });
  return period;
}

// ——— Transition ———

export function transitionPeriod(
  actor: M05Actor,
  input: {
    periodId: string;
    to: PeriodLifecycleState;
    expectedVersion: number;
    reason?: string;
  }
): RosterPeriod {
  const period = store.getPeriod(input.periodId);
  if (!period) throw new Error(`Period not found: ${input.periodId}`);
  assertM05ClinicScope(actor, [period.clinicId]);

  switch (input.to) {
    case "under_review":
    case "ready_to_publish":
      assertM05Permission(actor, "roster.review");
      break;
    case "published":
      assertM05Permission(actor, "roster.publish");
      break;
    case "superseded":
      assertM05Permission(actor, "roster.publish");
      break;
    case "cancelled":
      assertM05Permission(actor, "roster.period.create");
      if (!input.reason || !input.reason.trim()) throw new OverrideReasonRequiredError("Cancellation reason required");
      break;
    case "archived":
      assertM05Permission(actor, "roster.audit.view");
      break;
    case "draft":
      assertM05Permission(actor, "roster.review");
      break;
  }

  if (period.version !== input.expectedVersion) {
    throw new ConcurrentConflictError({
      targetType: "period",
      targetId: period.id,
      expectedVersion: input.expectedVersion,
      actualVersion: period.version,
    });
  }

  if (!isValidPeriodTransition(period.lifecycleState, input.to)) {
    throw new InvalidLifecycleTransitionError({
      from: period.lifecycleState,
      to: input.to,
      targetType: "period",
    });
  }

  const now = new Date().toISOString();
  const next: RosterPeriod = {
    ...period,
    lifecycleState: input.to,
    cancelReason: input.to === "cancelled" ? input.reason ?? period.cancelReason ?? null : period.cancelReason,
    updatedAt: now,
    version: period.version + 1,
  };
  store.upsertPeriod(next);
  appendRosterAudit({
    actorId: actor.userId,
    organisationId: period.organisationId,
    clinicId: period.clinicId,
    action: `period.transition.${input.to}`,
    targetType: "period",
    targetId: period.id,
    detail: { from: period.lifecycleState, to: input.to, reason: input.reason ?? null },
  });
  return next;
}

// ——— Reads ———

export function listPeriodsForActor(actor: M05Actor, clinicId?: string): RosterPeriod[] {
  assertM05Permission(actor, "roster.view");
  const target = clinicId ? [clinicId] : undefined;
  return store.listPeriods(clinicId).filter((p) => {
    if (actor.permissions.includes("*")) return true;
    if (actor.clinicIds === undefined) return true;
    if (!actor.clinicIds.length) return false;
    return actor.clinicIds.includes(p.clinicId) && (!target || target.includes(p.clinicId));
  });
}

export function getPeriodForActor(actor: M05Actor, periodId: string): RosterPeriod | null {
  assertM05Permission(actor, "roster.view");
  const period = store.getPeriod(periodId);
  if (!period) return null;
  try {
    assertM05ClinicScope(actor, [period.clinicId]);
    return period;
  } catch {
    return null;
  }
}
