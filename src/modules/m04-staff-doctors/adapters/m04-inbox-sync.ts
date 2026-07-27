/**
 * M04 → M02 Action Inbox projections for expired credentials and incomplete offboarding.
 * Stable projectionKey; findInboxActionForSource first — update/close, never duplicate.
 */

import type { SourceRecordRef } from "@/platform/contracts/source-record";
import { dispatchActionInboxEvent, findInboxActionForSource } from "@/platform/services/action-inbox-bridge";
import type { Credential, OffboardingRecord } from "../types/domain";

const MODULE_ID = "staff-doctors";

function dueInDays(days: number): string {
  return new Date(Date.now() + days * 86400000).toISOString();
}

function credentialSource(c: Credential): SourceRecordRef {
  return {
    sourceModuleId: MODULE_ID,
    sourceRecordType: "credential-expired",
    sourceRecordId: c.id,
    sourceRecordTitle: `${c.credentialType} expired`,
    clinicId: c.clinicId,
    organisationId: c.organisationId,
    currentStatus: c.status,
    route: "/staff-doctors",
    section: "credentials",
  };
}

function offboardingSource(r: OffboardingRecord): SourceRecordRef {
  return {
    sourceModuleId: MODULE_ID,
    sourceRecordType: "offboarding-incomplete",
    sourceRecordId: r.id,
    sourceRecordTitle: `Incomplete offboarding`,
    clinicId: r.clinicId,
    organisationId: r.organisationId,
    currentStatus: r.status,
    route: "/staff-doctors",
    section: "offboarding",
  };
}

export function syncExpiredCredentialToInbox(credential: Credential) {
  if (typeof window === "undefined") return null;
  if (credential.status !== "expired") return null;

  const source = credentialSource(credential);
  const projectionKey = `m04::credential-expired::${credential.id}`;
  const existing = findInboxActionForSource(MODULE_ID, "credential-expired", credential.id);

  return dispatchActionInboxEvent({
    kind: existing ? "update" : "create",
    projectionKey,
    source,
    actionTitle: `Credential expired: ${credential.credentialType}`,
    actionSummary: `Credential ${credential.credentialType} for person ${credential.personId} is expired.`,
    category: "Exception",
    actionType: "CredentialExpiry",
    clinicId: credential.clinicId,
    owner: "Workforce Manager",
    requester: "M04 Staff & Doctors",
    priority: "High",
    dueAt: dueInDays(3),
    requiredOutcome: "Verify or renew credential in Staff & Doctor Management",
    sensitivity: "Standard",
    inboxStatus: "Open",
    completionRequirements: ["Open credential record", "Verify or renew", "Recalculate readiness"],
  });
}

export function closeCredentialInboxProjection(credential: Credential, actor: string) {
  if (typeof window === "undefined") return null;
  const source = credentialSource(credential);
  const projectionKey = `m04::credential-expired::${credential.id}`;
  findInboxActionForSource(MODULE_ID, "credential-expired", credential.id);
  return dispatchActionInboxEvent({
    kind: "close",
    projectionKey,
    source,
    actionTitle: `Credential resolved: ${credential.credentialType}`,
    actionSummary: `Credential no longer expired (status ${credential.status}). Closed by ${actor}.`,
    category: "Exception",
    actionType: "CredentialExpiry",
    clinicId: credential.clinicId,
    owner: "Workforce Manager",
    requester: actor,
    priority: "Medium",
    dueAt: dueInDays(0),
    requiredOutcome: "N/A",
  });
}

export function syncIncompleteOffboardingToInbox(record: OffboardingRecord) {
  if (typeof window === "undefined") return null;
  if (record.status !== "Incomplete" && record.status !== "In Progress") return null;
  if (record.status === "In Progress" && record.openResponsibilities.length === 0) return null;

  const source = offboardingSource(record);
  const projectionKey = `m04::offboarding-incomplete::${record.id}`;
  const existing = findInboxActionForSource(MODULE_ID, "offboarding-incomplete", record.id);

  return dispatchActionInboxEvent({
    kind: existing ? "update" : "create",
    projectionKey,
    source,
    actionTitle: `Incomplete offboarding`,
    actionSummary: `Offboarding ${record.id} has open responsibilities or incomplete status.`,
    category: "Escalation",
    actionType: "Offboarding",
    clinicId: record.clinicId,
    owner: "Workforce Manager",
    requester: "M04 Staff & Doctors",
    priority: "High",
    dueAt: dueInDays(5),
    requiredOutcome: "Transfer responsibilities and complete offboarding",
    sensitivity: "Restricted",
    inboxStatus: "Open",
    completionRequirements: ["Transfer open responsibilities", "Complete offboarding"],
  });
}

export function closeOffboardingInboxProjection(record: OffboardingRecord, actor: string) {
  if (typeof window === "undefined") return null;
  const source = offboardingSource(record);
  const projectionKey = `m04::offboarding-incomplete::${record.id}`;
  findInboxActionForSource(MODULE_ID, "offboarding-incomplete", record.id);
  return dispatchActionInboxEvent({
    kind: "close",
    projectionKey,
    source,
    actionTitle: `Offboarding complete`,
    actionSummary: `Offboarding ${record.id} completed by ${actor}.`,
    category: "Escalation",
    actionType: "Offboarding",
    clinicId: record.clinicId,
    owner: "Workforce Manager",
    requester: actor,
    priority: "Medium",
    dueAt: dueInDays(0),
    requiredOutcome: "N/A",
  });
}
