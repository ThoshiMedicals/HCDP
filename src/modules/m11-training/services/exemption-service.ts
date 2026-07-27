/** M11 exemption service — request, approve (no self-approval), revoke; audited. */

import { assertM11Permission, type M11Actor } from "../permissions";
import * as store from "../repository/local-store";
import type { AuditEntry, Exemption } from "../types/domain";
import { publishM11TrainingEvent } from "./events";

const DEFAULT_ORG = "org_parent";

export function requestExemption(
  actor: M11Actor,
  input: {
    personId: string;
    courseId: string;
    requirementId?: string;
    reason: string;
    organisationId?: string;
    clinicId?: string;
    expiresOn?: string;
  }
): Exemption {
  assertM11Permission(actor, "training.exemption.request");
  const now = new Date().toISOString();
  const exemption: Exemption = {
    id: store.newExemptionId(),
    personId: input.personId,
    courseId: input.courseId,
    requirementId: input.requirementId ?? null,
    organisationId: input.organisationId ?? DEFAULT_ORG,
    clinicId: input.clinicId,
    requestedBy: actor.userId,
    requestedAt: now,
    reason: input.reason,
    status: "request",
    reviewedBy: null,
    reviewedAt: null,
    reviewNotes: null,
    expiresOn: input.expiresOn ?? null,
    revokedAt: null,
    revokedReason: null,
    createdAt: now,
    updatedAt: now,
    version: 1,
  };
  store.upsertExemption(exemption);
  appendAudit(exemption, actor.userId, "exemption.requested");
  return exemption;
}

export function approveExemption(
  actor: M11Actor,
  exemptionId: string,
  reviewNotes?: string
): Exemption {
  assertM11Permission(actor, "training.exemption.approve");
  const existing = store.getExemption(exemptionId);
  if (!existing) throw new Error(`Exemption not found: ${exemptionId}`);
  if (existing.status !== "request") {
    throw new Error(`Exemption not in request status: ${existing.status}`);
  }
  // No self-approval
  if (existing.requestedBy === actor.userId) {
    throw new Error("Cannot approve your own exemption request");
  }
  const now = new Date().toISOString();
  const updated: Exemption = {
    ...existing,
    status: "approved",
    reviewedBy: actor.userId,
    reviewedAt: now,
    reviewNotes: reviewNotes ?? null,
    updatedAt: now,
    version: existing.version + 1,
  };
  store.upsertExemption(updated);
  appendAudit(updated, actor.userId, "exemption.approved");
  publishM11TrainingEvent({
    eventType: "worker.status.changed",
    sourceRecordId: updated.id,
    sourceRecordVersion: updated.version,
    sourceRecordType: "training-exemption",
    sourceRecordTitle: `Exemption: ${updated.personId} / ${updated.courseId}`,
    organisationId: updated.organisationId,
    clinicId: updated.clinicId,
    actor: actor.userId,
    idempotencyKey: `m11::exemption::${updated.id}::v${updated.version}`,
    section: "exemptions",
    currentStatus: updated.status,
  });
  return updated;
}

export function rejectExemption(
  actor: M11Actor,
  exemptionId: string,
  reviewNotes?: string
): Exemption {
  assertM11Permission(actor, "training.exemption.approve");
  const existing = store.getExemption(exemptionId);
  if (!existing) throw new Error(`Exemption not found: ${exemptionId}`);
  if (existing.requestedBy === actor.userId) {
    throw new Error("Cannot reject your own exemption request");
  }
  const now = new Date().toISOString();
  const updated: Exemption = {
    ...existing,
    status: "rejected",
    reviewedBy: actor.userId,
    reviewedAt: now,
    reviewNotes: reviewNotes ?? null,
    updatedAt: now,
    version: existing.version + 1,
  };
  store.upsertExemption(updated);
  appendAudit(updated, actor.userId, "exemption.rejected");
  return updated;
}

export function revokeExemption(
  actor: M11Actor,
  exemptionId: string,
  reason: string
): Exemption {
  assertM11Permission(actor, "training.exemption.approve");
  const existing = store.getExemption(exemptionId);
  if (!existing) throw new Error(`Exemption not found: ${exemptionId}`);
  if (existing.status !== "approved") {
    throw new Error(`Cannot revoke exemption in status: ${existing.status}`);
  }
  const now = new Date().toISOString();
  const updated: Exemption = {
    ...existing,
    status: "revoked",
    revokedAt: now,
    revokedReason: reason,
    updatedAt: now,
    version: existing.version + 1,
  };
  store.upsertExemption(updated);
  appendAudit(updated, actor.userId, "exemption.revoked");
  return updated;
}

export function listExemptions(personId?: string): Exemption[] {
  return store.listExemptions(personId);
}

function appendAudit(exemption: Exemption, actorId: string, action: string) {
  const entry: AuditEntry = {
    id: store.newAuditId(),
    organisationId: exemption.organisationId,
    actorId,
    action,
    targetType: "training-exemption",
    targetId: exemption.id,
    detail: { status: exemption.status, personId: exemption.personId, courseId: exemption.courseId },
    occurredAt: new Date().toISOString(),
  };
  store.appendAuditEntry(entry);
}
