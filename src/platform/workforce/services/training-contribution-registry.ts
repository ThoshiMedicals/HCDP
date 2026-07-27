/**
 * Training contribution registry — M11 registers; M04 readiness consumes.
 * No cross-module repository imports.
 */

import type { TrainingReadinessContribution } from "../contracts/readiness-contribution";

export type TrainingContributionProvider = (
  personId: string,
  asOf?: string
) => TrainingReadinessContribution | null;

let provider: TrainingContributionProvider | null = null;

export function registerTrainingContributionProvider(fn: TrainingContributionProvider | null): void {
  provider = fn;
}

export function getTrainingContributionsForPerson(
  personId: string,
  asOf?: string
): TrainingReadinessContribution | null {
  if (!provider) return null;
  return provider(personId, asOf);
}
