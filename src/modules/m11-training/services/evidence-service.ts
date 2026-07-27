/** M11 evidence service — add, verify, reject evidence records. */

import { assertM11Permission, assertM11ClinicScope, type M11Actor } from "../permissions";
import * as store from "../repository/local-store";
import type { EvidenceRecord, EvidenceSource } from "../types/domain";

const DEFAULT_ORG = "org_parent";

export function addEvidence(
  actor: M11Actor,
  input: {
    personId: string;
    source: EvidenceSource;
    label: string;
    courseId?: string;
    requirementId?: string;
    assignmentId?: string;
    url?: string;
    mimeType?: string;
    sensitive?: boolean;
    organisationId?: string;
    clinicId?: string;
  }
): EvidenceRecord {
  assertM11Permission(actor, "training.view");
  if (input.clinicId) assertM11ClinicScope(actor, [input.clinicId]);
  const now = new Date().toISOString();
  const evidence: EvidenceRecord = {
    id: store.newEvidenceId(),
    personId: input.personId,
    courseId: input.courseId ?? null,
    requirementId: input.requirementId ?? null,
    assignmentId: input.assignmentId ?? null,
    organisationId: input.organisationId ?? DEFAULT_ORG,
    clinicId: input.clinicId,
    source: input.source,
    label: input.label,
    url: input.url ?? null,
    mimeType: input.mimeType ?? null,
    status: "pending",
    uploadedBy: actor.userId,
    uploadedAt: now,
    verifiedBy: null,
    verifiedAt: null,
    rejectedReason: null,
    sensitive: input.sensitive ?? false,
    createdAt: now,
    updatedAt: now,
    version: 1,
  };
  store.upsertEvidence(evidence);
  return evidence;
}

export function verifyEvidence(
  actor: M11Actor,
  evidenceId: string
): EvidenceRecord {
  assertM11Permission(actor, "training.evidence.verify");
  const existing = store.getEvidence(evidenceId);
  if (!existing) throw new Error(`Evidence not found: ${evidenceId}`);
  if (existing.sensitive) {
    assertM11Permission(actor, "training.view_sensitive_evidence");
  }
  const now = new Date().toISOString();
  const updated: EvidenceRecord = {
    ...existing,
    status: "verified",
    verifiedBy: actor.userId,
    verifiedAt: now,
    updatedAt: now,
    version: existing.version + 1,
  };
  store.upsertEvidence(updated);
  return updated;
}

export function rejectEvidence(
  actor: M11Actor,
  evidenceId: string,
  reason: string
): EvidenceRecord {
  assertM11Permission(actor, "training.evidence.verify");
  const existing = store.getEvidence(evidenceId);
  if (!existing) throw new Error(`Evidence not found: ${evidenceId}`);
  const now = new Date().toISOString();
  const updated: EvidenceRecord = {
    ...existing,
    status: "rejected",
    rejectedReason: reason,
    updatedAt: now,
    version: existing.version + 1,
  };
  store.upsertEvidence(updated);
  return updated;
}

export function listEvidence(personId?: string): EvidenceRecord[] {
  return store.listEvidence(personId);
}

export type MaskedEvidence = EvidenceRecord & { masked?: boolean };

/**
 * Clinic-scoped evidence list. Sensitive rows outside clearance are masked
 * (label/url redacted) rather than leaked across clinic boundaries.
 */
export function listEvidenceForActor(actor: M11Actor, personId?: string): MaskedEvidence[] {
  assertM11Permission(actor, "training.view");
  const canSeeSensitive = actor.permissions.includes("*") || actor.permissions.includes("training.view_sensitive_evidence");
  return listEvidence(personId)
    .filter((e) => {
      if (actor.clinicIds === undefined || actor.permissions.includes("*")) return true;
      if (!actor.clinicIds.length) return false;
      if (!e.clinicId) return false;
      return actor.clinicIds.includes(e.clinicId);
    })
    .map((e) => {
      if (!e.sensitive || canSeeSensitive) return e;
      return {
        ...e,
        label: "[masked sensitive evidence]",
        url: null,
        masked: true,
      };
    });
}
