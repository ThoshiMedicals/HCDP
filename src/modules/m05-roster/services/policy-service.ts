/**
 * M05 policy service — versioned roster conflict policies.
 *
 * Draft → published → archived. Publishing archives the prior published
 * policy for the same organisation (single active policy per org).
 */

import { assertM05Permission, type M05Actor } from "../permissions";
import type {
  ConflictPolicy,
  ConflictPolicyRule,
  ConflictPolicyStatus,
} from "../types/policy";
import { DEFAULT_CONFLICT_POLICY_RULES } from "../types/policy";
import * as store from "../repository/local-store";
import { appendRosterAudit } from "./audit-helpers";

const DEFAULT_ORG = "org_parent";

export function createPolicyVersion(
  actor: M05Actor,
  input: {
    label: string;
    rules?: ConflictPolicyRule[];
    organisationId?: string;
    clinicIds?: string[];
  }
): ConflictPolicy {
  assertM05Permission(actor, "roster.policy.manage");
  const now = new Date().toISOString();
  const policy: ConflictPolicy = {
    id: store.newPolicyId(),
    policyVersion: 1,
    organisationId: input.organisationId ?? DEFAULT_ORG,
    clinicIds: input.clinicIds ?? [],
    status: "draft",
    label: input.label,
    rules: input.rules ?? DEFAULT_CONFLICT_POLICY_RULES,
    publishedAt: null,
    archivedAt: null,
    createdAt: now,
    createdBy: actor.userId,
  };
  store.upsertPolicy(policy);
  appendRosterAudit({
    actorId: actor.userId,
    organisationId: policy.organisationId,
    action: "policy.created",
    targetType: "policy",
    targetId: policy.id,
    detail: { label: policy.label },
  });
  return policy;
}

export function publishPolicy(actor: M05Actor, policyId: string): ConflictPolicy {
  assertM05Permission(actor, "roster.policy.manage");
  const policy = store.getPolicy(policyId);
  if (!policy) throw new Error(`Policy not found: ${policyId}`);
  if (policy.status === "published") return policy;

  const now = new Date().toISOString();
  for (const prior of store.listPolicies(policy.organisationId)) {
    if (prior.id !== policy.id && prior.status === "published") {
      store.upsertPolicy({ ...prior, status: "archived" as ConflictPolicyStatus, archivedAt: now });
    }
  }
  const published: ConflictPolicy = {
    ...policy,
    status: "published",
    publishedAt: now,
    policyVersion: policy.policyVersion + 1,
  };
  store.upsertPolicy(published);
  appendRosterAudit({
    actorId: actor.userId,
    organisationId: policy.organisationId,
    action: "policy.published",
    targetType: "policy",
    targetId: policy.id,
    detail: { policyVersion: published.policyVersion },
  });
  return published;
}

export function getActivePolicyForOrg(organisationId = DEFAULT_ORG): ConflictPolicy | null {
  return store.getActiveConflictPolicy(organisationId);
}

export function listPolicies(organisationId?: string): ConflictPolicy[] {
  return store.listPolicies(organisationId);
}
