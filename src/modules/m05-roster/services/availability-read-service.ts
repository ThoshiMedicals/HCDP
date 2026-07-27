/**
 * M05 availability & leave read service.
 *
 * Boundary rule (§2 / §8 of the Wave 4 plan):
 * - M05 must NOT own workforce leave SoT.
 * - M05 must NOT import M04 repositories.
 * - Approved workforce leave is READ from an M05-side leave cache that is
 *   populated exclusively via contract-shaped setters (or a future M04 pull
 *   contract). This module never mutates M04.
 *
 * Precedence order used by callers (§8):
 *   1) emergency override → 2) approved leave → 3) declared unavailable →
 *   4) published assignments → 5) draft assignments → 6) open-shift apps →
 *   7) recurring availability (M04, not owned) → 8) preferred / roster availability (M05)
 *
 * This service exposes:
 *   - list/set helpers for the leave cache (contract-stub only)
 *   - a `precedenceForCandidate` helper returning the highest-precedence
 *     constraint against a candidate window for a person
 */

import type {
  ApprovedLeaveCacheRow,
  RosterAvailabilityDeclaration,
} from "../types/domain";
import * as store from "../repository/local-store";

// ——— Approved-leave cache (contract-stub only) ———

/**
 * Replace the local M04-approved leave cache in one call.
 * Used by test scaffolding and by future contract adapters. This is the ONLY
 * supported write path — M05 never queries M04 repositories directly.
 */
export function setApprovedLeaveForTests(rows: ApprovedLeaveCacheRow[]): void {
  store.replaceApprovedLeaveCache(rows);
}

export function upsertApprovedLeaveContractRow(row: ApprovedLeaveCacheRow): ApprovedLeaveCacheRow {
  return store.upsertApprovedLeaveCacheRow(row);
}

export function listApprovedLeaveForClinic(clinicId?: string): ApprovedLeaveCacheRow[] {
  const all = store.listApprovedLeaveCache();
  return clinicId ? all.filter((r) => !r.clinicId || r.clinicId === clinicId) : all;
}

export function listApprovedLeaveForPerson(
  personId: string,
  clinicId?: string
): ApprovedLeaveCacheRow[] {
  return listApprovedLeaveForClinic(clinicId).filter((r) => r.personId === personId);
}

// ——— Roster-side availability declarations (M05 owns) ———

export function listAvailabilityDeclarationsForPerson(
  personId: string
): RosterAvailabilityDeclaration[] {
  return store.listAvailabilityDeclarations(personId);
}

// ——— Precedence resolution helper ———

export type PrecedenceLayer =
  | "emergency_override"
  | "approved_leave"
  | "declared_unavailable"
  | "published_assignment"
  | "draft_assignment"
  | "open_shift_application"
  | "recurring_availability"
  | "roster_availability_preference"
  | "clear";

const LAYER_ORDER: Record<PrecedenceLayer, number> = {
  emergency_override: 1,
  approved_leave: 2,
  declared_unavailable: 3,
  published_assignment: 4,
  draft_assignment: 5,
  open_shift_application: 6,
  recurring_availability: 7,
  roster_availability_preference: 8,
  clear: 9,
};

export interface PrecedenceResult {
  layer: PrecedenceLayer;
  explanation: string;
  sourceRecordId?: string;
}

function ymdOverlaps(
  aFrom: string,
  aTo: string,
  bFromDate: string,
  bToDate: string
): boolean {
  return aFrom <= bToDate && aTo >= bFromDate;
}

/**
 * Determine the highest-precedence layer that CONSTRAINS assigning `personId`
 * to a shift falling within the clinic-local YYYY-MM-DD range [`localFromDate`, `localToDate`].
 * Callers may pass `emergencyOverrideActive: true` to force layer 1.
 *
 * Note: layers 4/5/6/7 require access to other stores at call sites; this
 * helper handles layers 1/2/3/8 here and exposes constants so services can
 * evaluate the remaining layers with their own data.
 */
export function precedenceForCandidate(input: {
  personId: string;
  clinicId?: string;
  localFromDate: string;
  localToDate: string;
  emergencyOverrideActive?: boolean;
}): PrecedenceResult {
  if (input.emergencyOverrideActive) {
    return { layer: "emergency_override", explanation: "Emergency override active for this action" };
  }

  const leave = listApprovedLeaveForPerson(input.personId, input.clinicId).find((r) =>
    ymdOverlaps(input.localFromDate, input.localToDate, r.localFromDate, r.localToDate)
  );
  if (leave) {
    return {
      layer: "approved_leave",
      explanation: `Approved M04 leave overlaps ${leave.localFromDate}..${leave.localToDate}`,
      sourceRecordId: leave.id,
    };
  }

  const declaration = listAvailabilityDeclarationsForPerson(input.personId).find(
    (d) =>
      d.kind === "unavailable" &&
      ymdOverlaps(input.localFromDate, input.localToDate, d.localFromDate, d.localToDate)
  );
  if (declaration) {
    return {
      layer: "declared_unavailable",
      explanation: `Person declared unavailable ${declaration.localFromDate}..${declaration.localToDate}`,
      sourceRecordId: declaration.id,
    };
  }

  const preferred = listAvailabilityDeclarationsForPerson(input.personId).find(
    (d) =>
      d.kind === "preferred" &&
      ymdOverlaps(input.localFromDate, input.localToDate, d.localFromDate, d.localToDate)
  );
  if (preferred) {
    return {
      layer: "roster_availability_preference",
      explanation: `Roster preference active ${preferred.localFromDate}..${preferred.localToDate}`,
      sourceRecordId: preferred.id,
    };
  }

  return { layer: "clear", explanation: "No availability constraints found" };
}

export { LAYER_ORDER as PRECEDENCE_LAYER_ORDER };
