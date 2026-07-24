/**
 * Controlled Module 3 → Module 2 demonstration connection.
 * One Access Request, one Access Review, one Security Alert → inbox projections.
 * Does not duplicate Module 3 business records inside Module 2.
 */

import type { AccessRequest, AccessReview, OrgState, SecurityAlert } from "@/lib/organisation/types";
import { dispatchActionInboxEvent, findInboxActionForSource } from "@/platform/services/action-inbox-bridge";
import { publishPlatformNotification } from "@/platform/services/notification-publisher";
import type { SourceRecordRef } from "@/platform/contracts/source-record";
import { runMigrationOnce } from "@/platform/storage";
import type { ActionPriority } from "@/lib/action-inbox/types";

const MODULE_ID = "organisation-access";

function riskToPriority(risk: string): ActionPriority {
  if (risk === "Critical") return "Urgent";
  if (risk === "High") return "High";
  if (risk === "Medium") return "Medium";
  return "Low";
}

function requestSource(req: AccessRequest): SourceRecordRef {
  return {
    sourceModuleId: MODULE_ID,
    sourceRecordType: "access-request",
    sourceRecordId: req.id,
    sourceRecordTitle: req.title,
    clinicId: req.clinicId,
    organisationId: "org_parent",
    currentStatus: req.status,
    route: "/settings",
    section: "access-requests",
  };
}

function reviewSource(rev: AccessReview): SourceRecordRef {
  return {
    sourceModuleId: MODULE_ID,
    sourceRecordType: "access-review",
    sourceRecordId: rev.id,
    sourceRecordTitle: `Access review — ${rev.userName}`,
    clinicId: rev.clinicId,
    organisationId: "org_parent",
    currentStatus: rev.status,
    route: "/settings",
    section: "access-reviews",
  };
}

function alertSource(alert: SecurityAlert): SourceRecordRef {
  return {
    sourceModuleId: MODULE_ID,
    sourceRecordType: "security-alert",
    sourceRecordId: alert.id,
    sourceRecordTitle: alert.title,
    clinicId: alert.clinicId,
    organisationId: "org_parent",
    currentStatus: alert.resolved ? "Resolved" : "Open",
    route: "/settings",
    section: "security",
  };
}

/** Seed three controlled projections once (idempotent). */
export function ensureOrgInboxDemoBridge(state: OrgState) {
  if (typeof window === "undefined") return;

  runMigrationOnce("org-m3-inbox-bridge", 1, () => {
    const request =
      state.requests.find((r) => r.id === "req1") ??
      state.requests.find((r) => r.status === "In Review") ??
      state.requests[0];
    const review =
      state.reviews.find((r) => r.id === "rev1") ??
      state.reviews.find((r) => r.status === "Overdue" || r.status === "Open") ??
      state.reviews[0];
    const alert =
      state.alerts.find((a) => a.id === "al1") ??
      state.alerts.find((a) => !a.resolved) ??
      state.alerts[0];

    if (request) syncAccessRequestToInbox(request);
    if (review) syncAccessReviewToInbox(review);
    if (alert) syncSecurityAlertToInbox(alert);
  });
}

export function syncAccessRequestToInbox(req: AccessRequest) {
  const source = requestSource(req);
  const closed = ["Approved", "Rejected", "Cancelled"].includes(req.status);
  const existing = findInboxActionForSource(MODULE_ID, "access-request", req.id);
  let action = dispatchActionInboxEvent({
    kind: existing ? "update" : "create",
    source,
    actionTitle: `Access request: ${req.title}`,
    actionSummary: req.riskSummary,
    category: "Approval",
    actionType: "AccessRequest",
    clinicId: req.clinicId,
    owner: req.approvals[0]?.approverName ?? "Sarah Mitchell",
    requester: req.requesterName,
    priority: riskToPriority(req.riskLevel),
    dueAt: req.dueAt,
    requiredOutcome: "Approve or reject access request in Organisation & Access",
    approvalPathway: req.requiresTwoApprovers ? "Dual approval" : "Single approval",
    sensitivity: req.riskLevel === "Critical" || req.riskLevel === "High" ? "Restricted" : "Standard",
    inboxStatus: closed ? "Completed" : "Awaiting Approval",
    watchers: req.approvals.map((a) => a.approverName),
    completionRequirements: ["Open source access request", "Record dual approval if required"],
  });

  if (closed && action) {
    action =
      dispatchActionInboxEvent({
        kind: "close",
        source,
        actionTitle: `Access request: ${req.title}`,
        actionSummary: `Source status: ${req.status}`,
        category: "Approval",
        clinicId: req.clinicId,
        owner: action.owner,
        requester: req.requesterName,
        priority: riskToPriority(req.riskLevel),
        dueAt: req.dueAt,
        requiredOutcome: "Closed from Organisation & Access",
      }) ?? action;
  }

  if (action && !closed && !existing) {
    publishPlatformNotification({
      sourceRecord: source,
      recipient: action.owner,
      title: `Access request awaiting decision`,
      message: req.title,
      priority: riskToPriority(req.riskLevel),
      deliveryChannels: ["platform"],
      actionId: action.id,
      actionNumber: action.number,
      groupingKey: `org-access-request:${req.id}`,
      mandatory: req.requiresTwoApprovers,
    });
  }

  return action;
}

export function syncAccessReviewToInbox(rev: AccessReview) {
  const source = reviewSource(rev);
  const closed = rev.status === "Completed";
  const existing = findInboxActionForSource(MODULE_ID, "access-review", rev.id);
  let action = dispatchActionInboxEvent({
    kind: existing ? "update" : "create",
    source,
    actionTitle: `Access review: ${rev.userName}`,
    actionSummary: `${rev.trigger} review · risk ${rev.riskLevel}`,
    category: rev.status === "Overdue" ? "Escalation" : "Reminder",
    actionType: "AccessReview",
    clinicId: rev.clinicId,
    owner: rev.ownerName,
    requester: "Organisation module",
    priority: riskToPriority(rev.riskLevel),
    dueAt: `${rev.dueDate}T17:00:00`,
    requiredOutcome: "Complete access review decision in Organisation & Access",
    sensitivity: "Restricted",
    inboxStatus: closed ? "Completed" : "Open",
    completionRequirements: ["Open source access review", "Record review decision"],
  });

  if (closed && action) {
    action =
      dispatchActionInboxEvent({
        kind: "close",
        source,
        actionTitle: `Access review: ${rev.userName}`,
        actionSummary: `Source status: ${rev.status}`,
        category: "Reminder",
        clinicId: rev.clinicId,
        owner: rev.ownerName,
        requester: "Organisation module",
        priority: riskToPriority(rev.riskLevel),
        dueAt: `${rev.dueDate}T17:00:00`,
        requiredOutcome: "Closed from Organisation & Access",
      }) ?? action;
  }

  if (action && !closed && !existing) {
    publishPlatformNotification({
      sourceRecord: source,
      recipient: rev.ownerName,
      title: `Access review ${rev.status === "Overdue" ? "overdue" : "due"}`,
      message: `${rev.userName} · ${rev.trigger}`,
      priority: riskToPriority(rev.riskLevel),
      deliveryChannels: ["platform"],
      actionId: action.id,
      actionNumber: action.number,
      groupingKey: `org-access-review:${rev.id}`,
    });
  }

  return action;
}

export function syncSecurityAlertToInbox(alert: SecurityAlert) {
  const source = alertSource(alert);
  const existing = findInboxActionForSource(MODULE_ID, "security-alert", alert.id);
  let action = dispatchActionInboxEvent({
    kind: existing ? "update" : "create",
    source,
    actionTitle: `Security alert: ${alert.title}`,
    actionSummary: `${alert.category} · risk ${alert.risk}`,
    category: "Exception",
    actionType: "SecurityAlert",
    clinicId: alert.clinicId,
    owner: "Sarah Mitchell",
    requester: "Security Monitoring",
    priority: riskToPriority(alert.risk),
    dueAt: alert.createdAt,
    requiredOutcome: "Investigate and resolve security alert in Organisation & Access",
    sensitivity: "Confidential",
    inboxStatus: alert.resolved ? "Completed" : "Open",
    completionRequirements: ["Open source security alert", "Resolve or escalate"],
  });

  if (alert.resolved && action) {
    action =
      dispatchActionInboxEvent({
        kind: "close",
        source,
        actionTitle: `Security alert: ${alert.title}`,
        actionSummary: "Resolved in Organisation & Access",
        category: "Exception",
        clinicId: alert.clinicId,
        owner: "Sarah Mitchell",
        requester: "Security Monitoring",
        priority: riskToPriority(alert.risk),
        dueAt: alert.createdAt,
        requiredOutcome: "Closed from Organisation & Access",
      }) ?? action;
  }

  if (action && !alert.resolved && !existing) {
    publishPlatformNotification({
      sourceRecord: source,
      recipient: "Sarah Mitchell",
      title: "Security alert requires attention",
      message: alert.title,
      priority: riskToPriority(alert.risk),
      deliveryChannels: ["platform"],
      actionId: action.id,
      actionNumber: action.number,
      groupingKey: `org-security-alert:${alert.id}`,
      mandatory: alert.risk === "Critical",
    });
  }

  return action;
}

/** After Module 3 mutations, refresh linked projections when applicable. */
export function syncOrgRecordToInbox(
  state: OrgState,
  kind: "access-request" | "access-review" | "security-alert",
  id: string
) {
  if (kind === "access-request") {
    const req = state.requests.find((r) => r.id === id);
    if (req) syncAccessRequestToInbox(req);
  } else if (kind === "access-review") {
    const rev = state.reviews.find((r) => r.id === id);
    if (rev) syncAccessReviewToInbox(rev);
  } else {
    const alert = state.alerts.find((a) => a.id === id);
    if (alert) syncSecurityAlertToInbox(alert);
  }
}
