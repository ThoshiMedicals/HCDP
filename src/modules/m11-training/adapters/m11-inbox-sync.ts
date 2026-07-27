/**
 * M11 → M02 Action Inbox projections with create / update / dedupe / close / stale-replay.
 * Keys: training::training-overdue::, training::certificate-expired::, training::exemption-expiring::
 */

import type { SourceRecordRef } from "@/platform/contracts/source-record";
import { dispatchActionInboxEvent, findInboxActionForSource } from "@/platform/services/action-inbox-bridge";
import type { Assignment, Exemption, TrainingCertificate } from "../types/domain";

const MODULE_ID = "training";

function dueInDays(days: number): string {
  return new Date(Date.now() + days * 86400000).toISOString();
}

function assignmentSource(a: Assignment): SourceRecordRef {
  return {
    sourceModuleId: MODULE_ID,
    sourceRecordType: "training-overdue",
    sourceRecordId: a.id,
    sourceRecordTitle: `Overdue training assignment`,
    clinicId: a.clinicId,
    organisationId: a.organisationId,
    currentStatus: a.status,
    route: "/training",
    section: "assignments",
  };
}

/** Create or update overdue projection. Repeat sync does not duplicate. */
export function syncOverdueAssignmentToInbox(assignment: Assignment) {
  if (typeof window === "undefined") return null;
  if (assignment.status !== "overdue") return null;

  const source = assignmentSource(assignment);
  const projectionKey = `training::training-overdue::${assignment.id}`;
  const existing = findInboxActionForSource(MODULE_ID, "training-overdue", assignment.id);

  return dispatchActionInboxEvent({
    kind: existing ? "update" : "create",
    projectionKey,
    source,
    sourceRecordVersion: assignment.version,
    actionTitle: `Overdue training: ${assignment.courseId}`,
    actionSummary: `Training assignment for person ${assignment.personId} is overdue (due ${assignment.dueDate}). Status=${assignment.status} v${assignment.version}.`,
    category: "Exception",
    actionType: "TrainingOverdue",
    clinicId: assignment.clinicId,
    owner: "Training Manager",
    requester: "M11 Training",
    priority: "High",
    dueAt: dueInDays(3),
    requiredOutcome: "Complete training or raise exemption request",
    sensitivity: "Standard",
    inboxStatus: "Open",
    completionRequirements: ["Complete training", "Or approve exemption"],
  });
}

export function closeOverdueAssignmentInbox(assignment: Assignment, actor: string) {
  if (typeof window === "undefined") return null;
  const source = assignmentSource(assignment);
  const projectionKey = `training::training-overdue::${assignment.id}`;
  return dispatchActionInboxEvent({
    kind: "close",
    projectionKey,
    source,
    sourceRecordVersion: assignment.version,
    actionTitle: `Training resolved: ${assignment.courseId}`,
    actionSummary: `Assignment ${assignment.id} resolved (status ${assignment.status}). Closed by ${actor}.`,
    category: "Exception",
    actionType: "TrainingOverdue",
    clinicId: assignment.clinicId,
    owner: "Training Manager",
    requester: actor,
    priority: "Medium",
    dueAt: dueInDays(0),
    requiredOutcome: "N/A",
  });
}

/**
 * Reconcile overdue inbox from assignment state:
 * overdue → create/update; completed/revoked/exempt → close; other → no-op.
 */
export function reconcileOverdueAssignmentInbox(assignment: Assignment, actor = "M11 Training") {
  if (typeof window === "undefined") return null;
  if (assignment.status === "overdue") return syncOverdueAssignmentToInbox(assignment);
  if (["completed", "revoked", "exempt", "superseded"].includes(assignment.status)) {
    const existing = findInboxActionForSource(MODULE_ID, "training-overdue", assignment.id);
    if (!existing) return null;
    return closeOverdueAssignmentInbox(assignment, actor);
  }
  return null;
}

function certSource(cert: TrainingCertificate): SourceRecordRef {
  return {
    sourceModuleId: MODULE_ID,
    sourceRecordType: "certificate-expired",
    sourceRecordId: cert.id,
    sourceRecordTitle: `Training certificate expired`,
    clinicId: cert.clinicId,
    organisationId: cert.organisationId,
    currentStatus: cert.status,
    route: "/training",
    section: "certificates",
  };
}

export function syncExpiredCertificateToInbox(cert: TrainingCertificate) {
  if (typeof window === "undefined") return null;
  if (cert.status !== "expired") return null;

  const source = certSource(cert);
  const projectionKey = `training::certificate-expired::${cert.id}`;
  const existing = findInboxActionForSource(MODULE_ID, "certificate-expired", cert.id);

  return dispatchActionInboxEvent({
    kind: existing ? "update" : "create",
    projectionKey,
    source,
    sourceRecordVersion: cert.version,
    actionTitle: `Training certificate expired`,
    actionSummary: `Training certificate ${cert.id} for person ${cert.personId} has expired (v${cert.version}).`,
    category: "Exception",
    actionType: "CertificateExpiry",
    clinicId: cert.clinicId,
    owner: "Training Manager",
    requester: "M11 Training",
    priority: "High",
    dueAt: dueInDays(7),
    requiredOutcome: "Renew training certificate",
    sensitivity: "Standard",
    inboxStatus: "Open",
    completionRequirements: ["Renew training", "Issue new certificate"],
  });
}

export function closeCertificateInboxProjection(cert: TrainingCertificate, actor: string) {
  if (typeof window === "undefined") return null;
  const source = certSource(cert);
  const projectionKey = `training::certificate-expired::${cert.id}`;
  return dispatchActionInboxEvent({
    kind: "close",
    projectionKey,
    source,
    sourceRecordVersion: cert.version,
    actionTitle: `Certificate resolved: ${cert.courseId}`,
    actionSummary: `Certificate ${cert.id} status=${cert.status}. Closed by ${actor}.`,
    category: "Exception",
    actionType: "CertificateExpiry",
    clinicId: cert.clinicId,
    owner: "Training Manager",
    requester: actor,
    priority: "Medium",
    dueAt: dueInDays(0),
    requiredOutcome: "N/A",
  });
}

export function reconcileExpiredCertificateInbox(cert: TrainingCertificate, actor = "M11 Training") {
  if (typeof window === "undefined") return null;
  if (cert.status === "expired") return syncExpiredCertificateToInbox(cert);
  if (["revoked", "issued"].includes(cert.status)) {
    const existing = findInboxActionForSource(MODULE_ID, "certificate-expired", cert.id);
    if (!existing || existing.status === "Completed") return existing ?? null;
    if (cert.status === "revoked" || (cert.status === "issued" && existing)) {
      // renewed (re-issued) or revoked closes expiry action
      if (cert.status === "revoked" || cert.verifiedAt) {
        return closeCertificateInboxProjection(cert, actor);
      }
    }
  }
  return null;
}

function exemptionSource(e: Exemption): SourceRecordRef {
  return {
    sourceModuleId: MODULE_ID,
    sourceRecordType: "exemption-expiring",
    sourceRecordId: e.id,
    sourceRecordTitle: `Training exemption expiring`,
    clinicId: e.clinicId,
    organisationId: e.organisationId,
    currentStatus: e.status,
    route: "/training",
    section: "exemptions",
  };
}

export function syncExemptionExpiringToInbox(
  exemption: Exemption,
  withinDays = 14,
  asOf: Date | string = new Date()
) {
  if (typeof window === "undefined") return null;
  if (exemption.status !== "approved" || !exemption.expiresOn) return null;

  const asOfMs = typeof asOf === "string" ? new Date(asOf).getTime() : asOf.getTime();
  const expiresMs = new Date(exemption.expiresOn + "T23:59:59.000Z").getTime();
  if (expiresMs - asOfMs > withinDays * 86400000) return null;

  const source = exemptionSource(exemption);
  const projectionKey = `training::exemption-expiring::${exemption.id}`;
  const existing = findInboxActionForSource(MODULE_ID, "exemption-expiring", exemption.id);

  return dispatchActionInboxEvent({
    kind: existing ? "update" : "create",
    projectionKey,
    source,
    sourceRecordVersion: exemption.version,
    actionTitle: `Training exemption expiring`,
    actionSummary: `Exemption for ${exemption.personId} / ${exemption.courseId} expires ${exemption.expiresOn} (v${exemption.version}).`,
    category: "Exception",
    actionType: "ExemptionExpiring",
    clinicId: exemption.clinicId,
    owner: "Training Manager",
    requester: "M11 Training",
    priority: "Medium",
    dueAt: exemption.expiresOn,
    requiredOutcome: "Renew exemption or assign training",
    sensitivity: "Standard",
    inboxStatus: "Open",
    completionRequirements: ["Renew or revoke exemption", "Or reassign training"],
  });
}

export function closeExemptionExpiringInbox(exemption: Exemption, actor: string) {
  if (typeof window === "undefined") return null;
  const source = exemptionSource(exemption);
  const projectionKey = `training::exemption-expiring::${exemption.id}`;
  return dispatchActionInboxEvent({
    kind: "close",
    projectionKey,
    source,
    sourceRecordVersion: exemption.version,
    actionTitle: `Exemption resolved: ${exemption.courseId}`,
    actionSummary: `Exemption ${exemption.id} status=${exemption.status}. Closed by ${actor}.`,
    category: "Exception",
    actionType: "ExemptionExpiring",
    clinicId: exemption.clinicId,
    owner: "Training Manager",
    requester: actor,
    priority: "Medium",
    dueAt: dueInDays(0),
    requiredOutcome: "N/A",
  });
}

export function reconcileExemptionExpiringInbox(
  exemption: Exemption,
  actor = "M11 Training",
  asOf: Date | string = new Date()
) {
  if (typeof window === "undefined") return null;
  if (["revoked", "rejected", "expired"].includes(exemption.status)) {
    const existing = findInboxActionForSource(MODULE_ID, "exemption-expiring", exemption.id);
    if (!existing) return null;
    return closeExemptionExpiringInbox(exemption, actor);
  }
  return syncExemptionExpiringToInbox(exemption, 14, asOf);
}
