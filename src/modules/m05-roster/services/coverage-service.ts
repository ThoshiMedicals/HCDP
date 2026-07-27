/**
 * M05 coverage calculation service.
 *
 * Given a roster period, compare each `CoverageRequirement` for the period's
 * clinic against the set of assigned shifts and report any coverage gaps
 * (hard = fully unfilled, soft = under-filled by count).
 *
 * `escalateCoverageGap` marks an existing open-shift row as `escalated` when
 * a hard gap persists — projections into M02 live in the adapter layer.
 */

import { assertM05ClinicScope, assertM05Permission, type M05Actor } from "../permissions";
import type {
  Assignment,
  CoverageGap,
  CoverageRequirement,
  Shift,
} from "../types/domain";
import * as store from "../repository/local-store";
import { appendRosterAudit } from "./audit-helpers";

export interface CoverageEvaluation {
  rosterPeriodId: string;
  clinicId: string;
  asOf: string;
  gaps: CoverageGap[];
  fullyCovered: boolean;
}

function activeAssignmentsForShift(
  shiftId: string,
  byShift: Map<string, Assignment[]>
): Assignment[] {
  return (byShift.get(shiftId) ?? []).filter((a) => a.state === "assigned");
}

function shiftFillCount(shift: Shift, byShift: Map<string, Assignment[]>): number {
  if (["cancelled", "superseded"].includes(shift.status)) return 0;
  return activeAssignmentsForShift(shift.id, byShift).length;
}

function timeOverlapsRequirement(
  shift: Shift,
  req: CoverageRequirement
): boolean {
  if (shift.localStart.slice(0, 10) !== req.localDate) return false;
  if (!req.localStartTime || !req.localEndTime) return true;
  const shiftStartHm = shift.localStart.slice(11, 16);
  const shiftEndHm = shift.localEnd.slice(11, 16);
  return shiftStartHm < req.localEndTime && shiftEndHm > req.localStartTime;
}

export function evaluateCoverage(input: {
  rosterPeriodId: string;
  asOf?: string;
}): CoverageEvaluation {
  store.evidenceForceSystemError();
  const period = store.getPeriod(input.rosterPeriodId);
  if (!period) {
    return {
      rosterPeriodId: input.rosterPeriodId,
      clinicId: "",
      asOf: input.asOf ?? new Date().toISOString(),
      gaps: [],
      fullyCovered: true,
    };
  }
  const asOf = input.asOf ?? new Date().toISOString();
  const requirements = store.listCoverageRequirements(period.id);
  const shifts = store
    .listShifts(period.id)
    .filter((s) => !["cancelled", "superseded"].includes(s.status));

  const byShift = new Map<string, Assignment[]>();
  for (const assignment of store.listAssignments()) {
    const bucket = byShift.get(assignment.shiftId);
    if (bucket) bucket.push(assignment);
    else byShift.set(assignment.shiftId, [assignment]);
  }

  const gaps: CoverageGap[] = [];
  for (const req of requirements) {
    const candidateShifts = shifts.filter(
      (s) => s.roleLabel === req.roleLabel && timeOverlapsRequirement(s, req)
    );
    const filled = candidateShifts.reduce(
      (sum, s) => sum + shiftFillCount(s, byShift),
      0
    );
    if (filled >= req.requiredCount) continue;
    const missing = req.requiredCount - filled;
    const severity = filled === 0 ? "hard" : "soft";
    gaps.push({
      requirementId: req.id,
      rosterPeriodId: period.id,
      clinicId: period.clinicId,
      roleLabel: req.roleLabel,
      localDate: req.localDate,
      severity,
      missingCount: missing,
      filledCount: filled,
      requiredCount: req.requiredCount,
      reason: `Requirement ${req.roleLabel} on ${req.localDate} short by ${missing}`,
      asOf,
    });
  }
  return {
    rosterPeriodId: period.id,
    clinicId: period.clinicId,
    asOf,
    gaps,
    fullyCovered: gaps.length === 0,
  };
}

export function escalateCoverageGap(
  actor: M05Actor,
  input: { openShiftId: string; reason: string }
): void {
  assertM05Permission(actor, "roster.open_shift.manage");
  const openShift = store.getOpenShift(input.openShiftId);
  if (!openShift) throw new Error(`Open shift not found: ${input.openShiftId}`);
  assertM05ClinicScope(actor, [openShift.clinicId]);

  const now = new Date().toISOString();
  const next = {
    ...openShift,
    status: "escalated" as const,
    escalatedLevel: (openShift.escalatedLevel ?? 0) + 1,
    updatedAt: now,
    version: openShift.version + 1,
  };
  store.upsertOpenShift(next);

  appendRosterAudit({
    actorId: actor.userId,
    organisationId: openShift.organisationId,
    clinicId: openShift.clinicId,
    action: "coverage.escalated",
    targetType: "open-shift",
    targetId: openShift.id,
    detail: { reason: input.reason, level: next.escalatedLevel },
  });
}

export function upsertCoverageRequirement(
  actor: M05Actor,
  input: Omit<CoverageRequirement, "id" | "createdAt" | "updatedAt" | "version"> & {
    id?: string;
  }
): CoverageRequirement {
  assertM05Permission(actor, "roster.shift.edit");
  assertM05ClinicScope(actor, [input.clinicId]);
  const now = new Date().toISOString();
  const existing = input.id
    ? store.listCoverageRequirements().find((r) => r.id === input.id)
    : undefined;
  const req: CoverageRequirement = existing
    ? { ...existing, ...input, updatedAt: now, version: existing.version + 1 }
    : {
        ...input,
        id: input.id ?? store.newCoverageRequirementId(),
        createdAt: now,
        updatedAt: now,
        version: 1,
      };
  store.upsertCoverageRequirement(req);
  return req;
}
