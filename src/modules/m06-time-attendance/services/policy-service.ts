import { assertM06ClinicScope, assertM06Permission, type M06Actor } from "../permissions";
import { getPolicy, listPolicies, newPolicyId, upsertPolicy } from "../repository/local-store";
import type { AttendancePolicy } from "../types/policy";
import { DEFAULT_POLICY } from "../types/policy";
import { writeAudit } from "./audit-helpers";
import {
  ConcurrentConflictError,
  InvalidLifecycleTransitionError,
  ValidationError,
} from "./errors";

export function listPoliciesForActor(actor: M06Actor, clinicId?: string): AttendancePolicy[] {
  assertM06Permission(actor, "attendance.policy.manage");
  let rows = clinicId ? listPolicies(clinicId) : listPolicies();
  if (actor.clinicIds) rows = rows.filter((p) => actor.clinicIds!.includes(p.clinicId));
  return rows;
}

export function publishPolicy(input: {
  actor: M06Actor;
  clinicId: string;
  patch?: Partial<AttendancePolicy>;
  expectedVersion?: number;
  policyId?: string;
}): AttendancePolicy {
  assertM06Permission(input.actor, "attendance.policy.manage");
  assertM06ClinicScope(input.actor, [input.clinicId]);
  const now = new Date().toISOString();
  if (input.policyId) {
    const existing = getPolicy(input.policyId);
    if (!existing) throw new ValidationError("Policy not found");
    if (input.expectedVersion != null && existing.version !== input.expectedVersion) {
      throw new ConcurrentConflictError({
        targetType: "policy",
        targetId: existing.id,
        expectedVersion: input.expectedVersion,
        actualVersion: existing.version,
      });
    }
    const next: AttendancePolicy = {
      ...existing,
      ...input.patch,
      state: "published",
      version: existing.version + 1,
      publishedAt: now,
      updatedAt: now,
    };
    upsertPolicy(next);
    writeAudit({
      actorId: input.actor.userId,
      action: "policy.published",
      targetType: "policy",
      targetId: next.id,
      clinicId: next.clinicId,
    });
    return next;
  }
  const created: AttendancePolicy = {
    id: newPolicyId(),
    clinicId: input.clinicId,
    ...DEFAULT_POLICY,
    ...input.patch,
    state: "published",
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
  };
  upsertPolicy(created);
  return created;
}

export function archivePolicy(input: {
  actor: M06Actor;
  policyId: string;
  expectedVersion: number;
}): AttendancePolicy {
  assertM06Permission(input.actor, "attendance.policy.manage");
  const existing = getPolicy(input.policyId);
  if (!existing) throw new ValidationError("Policy not found");
  assertM06ClinicScope(input.actor, [existing.clinicId]);
  if (existing.state === "archived") {
    throw new InvalidLifecycleTransitionError({ from: "archived", to: "archived", targetType: "policy" });
  }
  if (existing.version !== input.expectedVersion) {
    throw new ConcurrentConflictError({
      targetType: "policy",
      targetId: existing.id,
      expectedVersion: input.expectedVersion,
      actualVersion: existing.version,
    });
  }
  const next = {
    ...existing,
    state: "archived" as const,
    version: existing.version + 1,
    updatedAt: new Date().toISOString(),
  };
  return upsertPolicy(next);
}
