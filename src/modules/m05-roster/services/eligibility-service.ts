/**
 * M05 eligibility orchestration service.
 *
 * Rules (§7 of the plan):
 * - Every assignment / open-shift acceptance / swap MUST call
 *   `getAuthoritativeWorkforceEligibility` (M04/platform).
 * - Result carries `authority: "m04-platform"`, `asOf`, blockers, and
 *   remediation hints.
 * - Approved-leave clash is a hard block (from local M04-approved leave cache;
 *   never imports M04 repos).
 * - Never overridable when: person SoT missing, clinic timezone unresolved
 *   for authoritative calc, `stale: true` on the outcome.
 */

import { resolveClinicTimezone } from "@/platform/workforce/services/clinic-timezone";
import type { WorkforceReadinessOutcome } from "@/platform/workforce/services/workforce-eligibility";
import { getRosterEligibility } from "../adapters/eligibility-read";
import type { ResolvedShiftWindow } from "../types/timezone";
import { listApprovedLeaveForPerson } from "./availability-read-service";

export type EligibilityDecisionClass =
  | "eligible"
  | "warning"
  | "hard_block"
  | "never_overridable"
  | "unknown_person";

export interface EligibilityBlockerReason {
  code: string;
  description: string;
  ruleId?: string;
  ruleVersion?: number;
  remediation?: string;
  neverOverridable?: boolean;
}

export interface EligibilityDecision {
  authority: "m04-platform";
  personId: string;
  clinicId?: string;
  asOf: string;
  decision: EligibilityDecisionClass;
  outcome: WorkforceReadinessOutcome | null;
  blockers: EligibilityBlockerReason[];
  warnings: EligibilityBlockerReason[];
  overridable: boolean;
}

/**
 * Evaluate roster eligibility for a candidate assignment.
 * `shiftWindow` is optional but required to check approved-leave clash
 * against clinic-local dates.
 */
export function evaluateEligibility(input: {
  personId: string;
  clinicId?: string;
  asOf?: string;
  shiftWindow?: ResolvedShiftWindow | null;
}): EligibilityDecision {
  const asOf = input.asOf ?? new Date().toISOString();

  const outcome = getRosterEligibility(input.personId, {
    asOf,
    clinicId: input.clinicId,
    shiftWindow: input.shiftWindow ?? undefined,
  });

  if (!outcome) {
    return {
      authority: "m04-platform",
      personId: input.personId,
      clinicId: input.clinicId,
      asOf,
      decision: "unknown_person",
      outcome: null,
      blockers: [
        {
          code: "person.unknown",
          description: "No M04 person SoT record — cannot evaluate eligibility",
          neverOverridable: true,
        },
      ],
      warnings: [],
      overridable: false,
    };
  }

  const blockers: EligibilityBlockerReason[] = [];
  const warnings: EligibilityBlockerReason[] = [];
  let neverOverridable = false;

  if (input.clinicId) {
    const tz = resolveClinicTimezone(input.clinicId);
    if (!tz.ok) {
      neverOverridable = true;
      blockers.push({
        code: "clinic.timezone.unresolved",
        description: tz.reason,
        neverOverridable: true,
        remediation: "Configure clinic IANA timezone before publishing / assigning",
      });
    }
  }

  if (outcome.stale) {
    neverOverridable = true;
    blockers.push({
      code: "readiness.stale",
      description: "Authoritative readiness is stale — refresh M04 readiness before assigning",
      neverOverridable: true,
    });
  }

  for (const blocker of outcome.blockers ?? []) {
    if (blocker.severity === "blocking") {
      blockers.push({
        code: `readiness.blocker.${blocker.code}`,
        description: blocker.label,
      });
    } else {
      warnings.push({
        code: `readiness.advisory.${blocker.code}`,
        description: blocker.label,
      });
    }
  }

  // Approved-leave clash (only when we have a shift window with local dates).
  if (input.shiftWindow) {
    const fromDate = input.shiftWindow.localStart.slice(0, 10);
    const toDate = input.shiftWindow.localEnd.slice(0, 10);
    const clashes = listApprovedLeaveForPerson(input.personId, input.clinicId).filter(
      (row) => row.localFromDate <= toDate && row.localToDate >= fromDate
    );
    for (const clash of clashes) {
      blockers.push({
        code: "leave.approved.clash",
        description: `Approved leave ${clash.localFromDate}..${clash.localToDate} clashes with shift window`,
        ruleId: "approved_leave_clash",
        ruleVersion: 1,
        remediation: "Assign a different person or revoke leave via M04 before assigning",
      });
    }
  }

  let decision: EligibilityDecisionClass;
  if (neverOverridable) decision = "never_overridable";
  else if (blockers.length) decision = "hard_block";
  else if (outcome.readiness !== "ready") {
    warnings.push({
      code: "readiness.not_ready",
      description: `Advisory readiness: ${outcome.readiness}`,
      remediation: "Confirm readiness improvements or override with reason",
    });
    decision = "warning";
  } else {
    decision = "eligible";
  }

  return {
    authority: "m04-platform",
    personId: input.personId,
    clinicId: input.clinicId,
    asOf,
    decision,
    outcome,
    blockers,
    warnings,
    overridable: !neverOverridable && blockers.length > 0,
  };
}

export function isEligibilityAllowedWithOverride(
  decision: EligibilityDecision,
  overrideReason: string | undefined
): { allowed: boolean; reason?: string } {
  if (decision.decision === "eligible" || decision.decision === "warning") return { allowed: true };
  if (decision.decision === "never_overridable" || decision.decision === "unknown_person") {
    return { allowed: false, reason: "Decision is never overridable" };
  }
  if (!overrideReason || !overrideReason.trim()) {
    return { allowed: false, reason: "Override reason required" };
  }
  return { allowed: true };
}
