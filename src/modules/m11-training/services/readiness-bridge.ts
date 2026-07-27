/**
 * M11 readiness bridge — compute training contributions for platform registry.
 * Does NOT compute final eligibility — M05 must use platform/M04 authoritative readiness.
 */

import { evaluatePersonRequirements } from "./policy-service";
import type { TrainingReadinessContribution } from "@/platform/workforce/contracts/readiness-contribution";
import type { ReadinessContributionExplanation } from "@/platform/workforce/contracts/readiness-contribution";
import type { ReadinessExplanation } from "../types/domain";
import * as store from "../repository/local-store";

function mapExplanation(e: ReadinessExplanation, ruleVersion = 1): ReadinessContributionExplanation {
  let resultingStatus: ReadinessContributionExplanation["resultingStatus"] = "unknown";
  if (e.status === "met") resultingStatus = "satisfied";
  else if (e.status === "exempt") resultingStatus = "exempt";
  else if (e.status === "overdue" || e.status === "not_met") resultingStatus = "blocked";
  else if (e.status === "pending") resultingStatus = "advisory";

  return {
    requirementId: e.requirementId,
    requirementLabel: e.requirementLabel,
    evidenceUsed: e.sourceRecordIds.map((recordId) => ({ type: "training", recordId })),
    ruleId: e.requirementId,
    ruleVersion,
    resultingStatus,
    effectiveDate: e.asOf,
    blockingReason:
      resultingStatus === "blocked" || resultingStatus === "advisory"
        ? e.overrideReason ?? `${e.requirementLabel} status: ${e.status}`
        : undefined,
    remediationAction:
      resultingStatus === "blocked"
        ? "Complete required training or record competency / exemption"
        : undefined,
  };
}

/** Build training contributions for a person as of asOf (platform contract shape). */
export function buildContributions(
  personId: string,
  asOf = new Date().toISOString(),
  organisationId = "org_parent"
): TrainingReadinessContribution {
  const { trainingRefs, explanations } = evaluatePersonRequirements(
    personId,
    organisationId,
    asOf
  );

  const policy = store.getActivePolicy(organisationId);
  const ruleVersion = policy?.version ?? 1;

  const sourceVersions: Record<string, number | string> = {};
  for (const c of store.listCompletions(personId)) {
    sourceVersions[`completion:${c.id}`] = c.version;
  }
  for (const c of store.listCompetencies(personId)) {
    sourceVersions[`competency:${c.id}`] = c.version;
  }
  for (const e of store.listExemptions(personId)) {
    sourceVersions[`exemption:${e.id}`] = e.version;
  }
  for (const a of store.listAssignments(personId)) {
    sourceVersions[`assignment:${a.id}`] = a.version;
  }
  if (policy) sourceVersions[`policy:${policy.id}`] = policy.version;

  return {
    personId,
    asOf,
    training: trainingRefs,
    explanations: explanations.map((e) => mapExplanation(e, ruleVersion)),
    sourceVersions,
    trainingDetailRefs: trainingRefs.map((t) => ({
      recordId: t.recordId,
      route: t.route,
      section: t.section,
    })),
  };
}
