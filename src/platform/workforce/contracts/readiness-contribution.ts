/**
 * Versioned training → readiness contribution contracts.
 * Shared platform layer — modules must not import each other's repositories.
 */

import type { TrainingStatusRef } from "./training-status-ref";
import type { ReadinessBlocker } from "./readiness-ref";

export type ReadinessContributionStatus =
  | "satisfied"
  | "blocked"
  | "advisory"
  | "unknown"
  | "exempt";

/** Explainable readiness contribution from M11 (or future training SoT). */
export interface ReadinessContributionExplanation {
  requirementId: string;
  requirementLabel: string;
  evidenceUsed: Array<{ type: string; recordId: string }>;
  ruleId: string;
  ruleVersion: number;
  resultingStatus: ReadinessContributionStatus;
  effectiveDate: string;
  blockingReason?: string;
  remediationAction?: string;
  sourceEventId?: string;
}

export interface TrainingReadinessContribution {
  personId: string;
  asOf: string;
  training: TrainingStatusRef[];
  explanations: ReadinessContributionExplanation[];
  sourceVersions: Record<string, number | string>;
  /** Optional training-detail route refs for UI explanation only — not eligibility SoT. */
  trainingDetailRefs?: Array<{ recordId: string; route: string; section?: string }>;
}

export function explanationsToBlockers(
  explanations: ReadinessContributionExplanation[]
): ReadinessBlocker[] {
  const out: ReadinessBlocker[] = [];
  for (const e of explanations) {
    if (e.resultingStatus === "satisfied" || e.resultingStatus === "exempt") continue;
    out.push({
      code: `training.contrib.${e.requirementId}`,
      label: e.blockingReason ?? `${e.requirementLabel} — ${e.resultingStatus}`,
      owningModuleId: "training",
      sourceRecordId: e.evidenceUsed[0]?.recordId,
      severity: e.resultingStatus === "blocked" ? "blocking" : "advisory",
    });
  }
  return out;
}
