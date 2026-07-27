/**
 * M11 eligibility projection adapter.
 *
 * IMPORTANT: This adapter does NOT compute final eligibility.
 * M05 must use platform / M04 authoritative readiness for eligibility decisions.
 * This file only exports training detail refs for explanation/display purposes.
 */

import { evaluatePersonRequirements } from "../services/policy-service";
import type { TrainingStatusRef } from "@/platform/workforce/contracts/training-status-ref";
import type { ReadinessExplanation } from "../types/domain";

export type TrainingDetailRefs = {
  trainingRefs: TrainingStatusRef[];
  explanations: ReadinessExplanation[];
};

/**
 * Get training status refs for display in readiness explanations.
 * Does NOT determine eligibility — for informational/display use only.
 * Final eligibility is determined by platform/M04 authoritative readiness.
 */
export function getTrainingDetailRefsForExplanation(
  personId: string,
  organisationId = "org_parent",
  asOf = new Date().toISOString()
): TrainingDetailRefs {
  return evaluatePersonRequirements(personId, organisationId, asOf);
}
