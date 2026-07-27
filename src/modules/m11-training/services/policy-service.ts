/**
 * M11 policy service — create/publish versioned policy; evaluate person requirements.
 * Course completion does NOT set competencyMet unless policy.allowCompletionAsCompetency === true.
 */

import { assertM11Permission, type M11Actor } from "../permissions";
import * as store from "../repository/local-store";
import { uid } from "@/platform/storage/storage";
import type { PolicyRule, PolicyVersion, ReadinessExplanation } from "../types/domain";
import { createTrainingStatusRef } from "@/platform/workforce/contracts/training-status-ref";
import type { TrainingStatusRef } from "@/platform/workforce/contracts/training-status-ref";
import {
  addCalendarMonths,
  clinicCalendarDate,
  compareCalendarDates,
  resolveClinicTimezone,
} from "@/platform/workforce/services/clinic-timezone";

const DEFAULT_ORG = "org_parent";

export function createPolicyVersion(
  actor: M11Actor,
  input: {
    label: string;
    rules: Omit<PolicyRule, "id" | "policyVersionId" | "createdAt" | "version">[];
    organisationId?: string;
  }
): PolicyVersion {
  assertM11Permission(actor, "training.manage_policy");
  const now = new Date().toISOString();
  const policyVersionId = uid("polv");
  const rules: PolicyRule[] = input.rules.map((r) => ({
    ...r,
    id: uid("polr"),
    policyVersionId,
    createdAt: now,
    version: 1,
  }));
  const policy: PolicyVersion = {
    id: uid("pol"),
    policyVersionId,
    organisationId: input.organisationId ?? DEFAULT_ORG,
    label: input.label,
    status: "draft",
    publishedAt: null,
    archivedAt: null,
    rules,
    createdAt: now,
    createdBy: actor.userId,
    version: 1,
  };
  store.upsertPolicy(policy);
  return policy;
}

export function publishPolicyVersion(
  actor: M11Actor,
  policyId: string
): PolicyVersion {
  assertM11Permission(actor, "training.manage_policy");
  const policy = store.getPolicy(policyId);
  if (!policy) throw new Error(`Policy not found: ${policyId}`);
  if (policy.status === "published") return policy;

  const now = new Date().toISOString();

  // Archive prior published version(s) — immutable update
  const allPolicies = store.listPolicies(policy.organisationId);
  for (const prior of allPolicies) {
    if (prior.id !== policyId && prior.status === "published") {
      store.upsertPolicy({
        ...prior,
        status: "archived",
        archivedAt: now,
        version: prior.version + 1,
      });
    }
  }

  const published: PolicyVersion = {
    ...policy,
    status: "published",
    publishedAt: now,
    version: policy.version + 1,
  };
  store.upsertPolicy(published);
  return published;
}

export type EvaluatePersonResult = {
  explanations: ReadinessExplanation[];
  trainingRefs: TrainingStatusRef[];
  unresolvedTimezone?: string;
};

/**
 * Evaluate all policy requirements for a person as of asOf (clinic-TZ aware).
 * Completion does NOT count as competency unless allowCompletionAsCompetency === true.
 * Missing clinic timezone ⇒ unresolved explanations (not silent UTC).
 */
export function evaluatePersonRequirements(
  personId: string,
  organisationId = DEFAULT_ORG,
  asOf = new Date().toISOString(),
  clinicId?: string
): EvaluatePersonResult {
  const policy = store.getActivePolicy(organisationId);
  if (!policy) return { explanations: [], trainingRefs: [] };

  const assignments = store.listAssignments(personId);
  const inferredClinic =
    clinicId ??
    assignments.find((a) => a.clinicId)?.clinicId ??
    policy.rules.find((r) => r.clinicIds[0])?.clinicIds[0];

  const tz = resolveClinicTimezone(inferredClinic);
  if (!tz.ok) {
    const asOfRaw = asOf;
    const explanation: ReadinessExplanation = {
      requirementId: "clinic.timezone.unresolved",
      requirementLabel: "Clinic timezone unresolved",
      courseId: "",
      status: "unknown",
      completedOn: null,
      expiresOn: null,
      competencyMet: false,
      overrideReason: tz.reason,
      sourceRecordIds: [],
      asOf: typeof asOfRaw === "string" ? asOfRaw.slice(0, 10) : asOfRaw,
    };
    return {
      explanations: [explanation],
      trainingRefs: [
        createTrainingStatusRef({
          recordId: `${personId}::timezone-unresolved`,
          organisationId,
          status: "pending",
          personId,
          requirementId: "clinic.timezone.unresolved",
          requirementLabel: "Clinic timezone unresolved",
          competencyMet: false,
          section: "settings",
        }),
      ],
      unresolvedTimezone: tz.reason,
    };
  }
  const clinicAsOf = clinicCalendarDate(asOf, tz.timeZone);

  const completions = store.listCompletions(personId);
  const competencies = store.listCompetencies(personId);
  const exemptions = store.listExemptions(personId).filter((e) => e.status === "approved");

  const explanations: ReadinessExplanation[] = [];
  const trainingRefs: TrainingStatusRef[] = [];

  for (const rule of policy.rules) {
    if (rule.organisationId !== organisationId) continue;

    const courseCompletions = completions.filter(
      (c) => c.courseId === rule.courseId && !c.supersededById
    );
    const latestCompletion = courseCompletions.sort((a, b) =>
      b.completedOn.localeCompare(a.completedOn)
    )[0] ?? null;

    const activeCompetency = competencies
      .filter(
        (c) =>
          c.requirementId === rule.requirementId &&
          !c.supersededById &&
          c.competencyMet
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;

    const isExempt = exemptions.some(
      (e) =>
        e.courseId === rule.courseId &&
        (!e.expiresOn || compareCalendarDates(e.expiresOn, clinicAsOf) >= 0)
    );

    let completedOn: string | null = latestCompletion?.completedOn ?? null;
    let completionExpiresOn: string | null = null;
    if (completedOn && rule.recurrenceMonths) {
      completionExpiresOn = addCalendarMonths(completedOn, rule.recurrenceMonths);
      if (compareCalendarDates(completionExpiresOn, clinicAsOf) < 0) {
        completedOn = null;
        completionExpiresOn = null;
      }
    }

    const completionMet = rule.requireCompletion ? completedOn != null : true;

    const competencyMet =
      !rule.requireCompetency
        ? true
        : activeCompetency != null ||
          (rule.allowCompletionAsCompetency && completedOn != null);

    let status: ReadinessExplanation["status"];
    if (isExempt) {
      status = "exempt";
    } else if (completionMet && competencyMet) {
      status = "met";
    } else if (completedOn == null && !isExempt && rule.requireCompletion) {
      const overdue = assignments.filter(
        (a) => a.courseId === rule.courseId && a.status === "overdue"
      );
      status = overdue.length > 0 ? "overdue" : "not_met";
    } else {
      status = "not_met";
    }

    const explanation: ReadinessExplanation = {
      requirementId: rule.requirementId,
      requirementLabel: rule.requirementLabel,
      courseId: rule.courseId,
      status,
      completedOn,
      expiresOn: completionExpiresOn ?? activeCompetency?.expiresOn ?? null,
      competencyMet,
      sourceRecordIds: [
        ...(latestCompletion ? [latestCompletion.id] : []),
        ...(activeCompetency ? [activeCompetency.id] : []),
      ],
      asOf: clinicAsOf,
    };
    explanations.push(explanation);

    const trainingStatus =
      status === "met"
        ? "valid"
        : status === "exempt"
          ? "exempt"
          : status === "overdue"
            ? "overdue"
            : "pending";

    const ref = createTrainingStatusRef({
      recordId: `${personId}::${rule.requirementId}`,
      clinicId: inferredClinic,
      organisationId,
      status: trainingStatus,
      personId,
      requirementId: rule.requirementId,
      requirementLabel: rule.requirementLabel,
      completedOn,
      expiresOn: explanation.expiresOn,
      competencyMet,
      ruleId: rule.requirementId,
      ruleVersion: policy.version,
      section: "settings",
    });
    trainingRefs.push(ref);
  }

  return { explanations, trainingRefs };
}

export function getActivePolicy(organisationId = DEFAULT_ORG): PolicyVersion | null {
  return store.getActivePolicy(organisationId);
}

export function listPolicies(organisationId = DEFAULT_ORG): PolicyVersion[] {
  return store.listPolicies(organisationId);
}
