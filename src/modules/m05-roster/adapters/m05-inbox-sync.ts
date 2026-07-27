/**
 * M05 → M02 action-inbox projections (§21 of the plan).
 *
 * Five lifecycles:
 *  - coverage-gap
 *  - unacked-publication
 *  - swap-action
 *  - open-shift-escalation
 *  - assignment-invalidated
 *
 * Uses stable projection keys `m05::<condition>::<clinicId>::<subjectId>::v<version>`
 * as documented in §21. Dispatches via `dispatchActionInboxEvent` (never
 * writes M02 repositories directly). Stale-replay protection is provided by
 * the action-inbox bridge.
 */

import type { SourceRecordRef } from "@/platform/contracts/source-record";
import {
  dispatchActionInboxEvent,
  findInboxActionForSource,
} from "@/platform/services/action-inbox-bridge";
import type {
  Assignment,
  CoverageGap,
  OpenShift,
  RosterPublication,
  SwapRequest,
} from "../types/domain";

const MODULE_ID = "roster";

function dueInDays(days: number): string {
  return new Date(Date.now() + days * 86400000).toISOString();
}

// ——— Coverage gap ———

function coverageSource(gap: CoverageGap): SourceRecordRef {
  return {
    sourceModuleId: MODULE_ID,
    sourceRecordType: "coverage-gap",
    sourceRecordId: `${gap.rosterPeriodId}::${gap.requirementId}`,
    sourceRecordTitle: `Coverage gap: ${gap.roleLabel} on ${gap.localDate}`,
    clinicId: gap.clinicId,
    currentStatus: gap.severity,
    route: "/roster",
    section: "coverage",
  };
}

function coverageProjectionKey(gap: CoverageGap): string {
  return `${MODULE_ID}::coverage-gap::${gap.rosterPeriodId}::${gap.requirementId}`;
}

export function syncCoverageGapToInbox(gap: CoverageGap) {
  if (typeof window === "undefined") return null;
  const source = coverageSource(gap);
  const projectionKey = coverageProjectionKey(gap);
  const existing = findInboxActionForSource(MODULE_ID, "coverage-gap", source.sourceRecordId);
  return dispatchActionInboxEvent({
    kind: existing ? "update" : "create",
    projectionKey,
    source,
    sourceRecordVersion: 1,
    actionTitle: source.sourceRecordTitle,
    actionSummary: `${gap.reason} — ${gap.filledCount}/${gap.requiredCount} filled`,
    category: "Exception",
    actionType: "RosterCoverageGap",
    clinicId: gap.clinicId,
    owner: "Roster Coordinator",
    requester: "M05 Roster",
    priority: gap.severity === "hard" ? "Urgent" : "High",
    dueAt: dueInDays(1),
    requiredOutcome: "Fill coverage or authorise emergency override",
    sensitivity: "Standard",
    inboxStatus: "Open",
    completionRequirements: ["Fill the gap", "Or supersede the publication"],
  });
}

export function closeCoverageGapInbox(gap: CoverageGap, actor = "M05 Roster") {
  if (typeof window === "undefined") return null;
  const source = coverageSource(gap);
  const projectionKey = coverageProjectionKey(gap);
  return dispatchActionInboxEvent({
    kind: "close",
    projectionKey,
    source,
    sourceRecordVersion: 1,
    actionTitle: `Coverage resolved`,
    actionSummary: `Coverage gap ${gap.requirementId} resolved.`,
    category: "Exception",
    actionType: "RosterCoverageGap",
    clinicId: gap.clinicId,
    owner: "Roster Coordinator",
    requester: actor,
    priority: "Medium",
    dueAt: dueInDays(0),
    requiredOutcome: "N/A",
  });
}

// ——— Unacknowledged publication ———

function publicationSource(pub: RosterPublication): SourceRecordRef {
  return {
    sourceModuleId: MODULE_ID,
    sourceRecordType: "unacked-publication",
    sourceRecordId: pub.id,
    sourceRecordTitle: `Roster publication v${pub.publicationVersion} needs acknowledgement`,
    clinicId: pub.clinicId,
    organisationId: pub.organisationId,
    currentStatus: pub.acknowledgementStatus,
    route: "/roster",
    section: "published-history",
  };
}

function publicationProjectionKey(pub: RosterPublication): string {
  return `${MODULE_ID}::unacked-publication::${pub.id}`;
}

export function syncUnackedPublicationToInbox(pub: RosterPublication) {
  if (typeof window === "undefined") return null;
  if (pub.acknowledgementStatus === "full") return null;
  const source = publicationSource(pub);
  const projectionKey = publicationProjectionKey(pub);
  const existing = findInboxActionForSource(MODULE_ID, "unacked-publication", pub.id);
  return dispatchActionInboxEvent({
    kind: existing ? "update" : "create",
    projectionKey,
    source,
    sourceRecordVersion: pub.publicationVersion,
    actionTitle: source.sourceRecordTitle,
    actionSummary: `Publication ${pub.id} awaiting acknowledgements (${pub.acknowledgementStatus}).`,
    category: "Reminder",
    actionType: "RosterAcknowledgement",
    clinicId: pub.clinicId,
    owner: "Clinic Manager",
    requester: "M05 Roster",
    priority: "High",
    dueAt: dueInDays(3),
    requiredOutcome: "All required recipients acknowledge",
    sensitivity: "Standard",
    inboxStatus: "Open",
    completionRequirements: ["Full acknowledgement received", "Or publication superseded"],
  });
}

export function closeUnackedPublicationInbox(pub: RosterPublication, actor = "M05 Roster") {
  if (typeof window === "undefined") return null;
  const source = publicationSource(pub);
  const projectionKey = publicationProjectionKey(pub);
  return dispatchActionInboxEvent({
    kind: "close",
    projectionKey,
    source,
    sourceRecordVersion: pub.publicationVersion,
    actionTitle: `Publication acknowledged`,
    actionSummary: `Publication ${pub.id} status=${pub.acknowledgementStatus}. Closed by ${actor}.`,
    category: "Reminder",
    actionType: "RosterAcknowledgement",
    clinicId: pub.clinicId,
    owner: "Clinic Manager",
    requester: actor,
    priority: "Medium",
    dueAt: dueInDays(0),
    requiredOutcome: "N/A",
  });
}

export function reconcileUnackedPublicationInbox(pub: RosterPublication) {
  if (typeof window === "undefined") return null;
  if (pub.acknowledgementStatus === "full" || pub.supersededById) {
    const existing = findInboxActionForSource(MODULE_ID, "unacked-publication", pub.id);
    return existing ? closeUnackedPublicationInbox(pub) : null;
  }
  return syncUnackedPublicationToInbox(pub);
}

// ——— Swap requiring action ———

function swapSource(swap: SwapRequest): SourceRecordRef {
  return {
    sourceModuleId: MODULE_ID,
    sourceRecordType: "swap-action",
    sourceRecordId: swap.id,
    sourceRecordTitle: `Swap ${swap.id} requires action`,
    clinicId: swap.clinicId,
    organisationId: swap.organisationId,
    currentStatus: swap.status,
    route: "/roster",
    section: "requests",
  };
}

function swapProjectionKey(swap: SwapRequest): string {
  return `${MODULE_ID}::swap-action::${swap.id}`;
}

export function syncSwapActionToInbox(swap: SwapRequest) {
  if (typeof window === "undefined") return null;
  const openStates = ["requested", "proposed", "recipient_accepted"];
  const source = swapSource(swap);
  const projectionKey = swapProjectionKey(swap);
  const existing = findInboxActionForSource(MODULE_ID, "swap-action", swap.id);
  if (!openStates.includes(swap.status)) {
    if (existing) {
      return dispatchActionInboxEvent({
        kind: "close",
        projectionKey,
        source,
        sourceRecordVersion: swap.version,
        actionTitle: `Swap resolved`,
        actionSummary: `Swap ${swap.id} status=${swap.status}.`,
        category: "Approval",
        actionType: "RosterSwap",
        clinicId: swap.clinicId,
        owner: "Clinic Manager",
        requester: "M05 Roster",
        priority: "Medium",
        dueAt: dueInDays(0),
        requiredOutcome: "N/A",
      });
    }
    return null;
  }
  return dispatchActionInboxEvent({
    kind: existing ? "update" : "create",
    projectionKey,
    source,
    sourceRecordVersion: swap.version,
    actionTitle: source.sourceRecordTitle,
    actionSummary: `Swap for shift ${swap.shiftId} status=${swap.status}.`,
    category: "Approval",
    actionType: "RosterSwap",
    clinicId: swap.clinicId,
    owner: swap.status === "recipient_accepted" ? "Clinic Manager" : "Roster Coordinator",
    requester: "M05 Roster",
    priority: "High",
    dueAt: dueInDays(2),
    requiredOutcome: "Approve or reject swap",
    sensitivity: "Standard",
    inboxStatus: "Open",
    completionRequirements: ["Approve", "Reject", "Withdraw"],
  });
}

// ——— Open-shift escalation ———

function openShiftSource(open: OpenShift): SourceRecordRef {
  return {
    sourceModuleId: MODULE_ID,
    sourceRecordType: "open-shift-escalation",
    sourceRecordId: open.id,
    sourceRecordTitle: `Open shift ${open.id} escalation`,
    clinicId: open.clinicId,
    organisationId: open.organisationId,
    currentStatus: open.status,
    route: "/roster",
    section: "open-shifts",
  };
}

function openShiftProjectionKey(open: OpenShift): string {
  return `${MODULE_ID}::open-shift-escalation::${open.id}`;
}

export function syncOpenShiftEscalationToInbox(open: OpenShift) {
  if (typeof window === "undefined") return null;
  const source = openShiftSource(open);
  const projectionKey = openShiftProjectionKey(open);
  const existing = findInboxActionForSource(MODULE_ID, "open-shift-escalation", open.id);
  if (["closed", "withdrawn", "expired"].includes(open.status)) {
    if (!existing) return null;
    return dispatchActionInboxEvent({
      kind: "close",
      projectionKey,
      source,
      sourceRecordVersion: open.version,
      actionTitle: `Open shift resolved`,
      actionSummary: `Open shift ${open.id} status=${open.status}.`,
      category: "Escalation",
      actionType: "RosterOpenShift",
      clinicId: open.clinicId,
      owner: "Roster Coordinator",
      requester: "M05 Roster",
      priority: "Medium",
      dueAt: dueInDays(0),
      requiredOutcome: "N/A",
    });
  }
  return dispatchActionInboxEvent({
    kind: existing ? "update" : "create",
    projectionKey,
    source,
    sourceRecordVersion: open.version,
    actionTitle: source.sourceRecordTitle,
    actionSummary: `Open shift escalated to level ${open.escalatedLevel ?? 0}.`,
    category: "Exception",
    actionType: "RosterOpenShift",
    clinicId: open.clinicId,
    owner: "Roster Coordinator",
    requester: "M05 Roster",
    priority: "Urgent",
    dueAt: dueInDays(1),
    requiredOutcome: "Fill the open shift or supersede publication",
    sensitivity: "Standard",
    inboxStatus: "Open",
    completionRequirements: ["Select applicant", "Or supersede publication"],
  });
}

// ——— Published assignment invalidated ———

function assignmentInvalidatedSource(asg: Assignment): SourceRecordRef {
  return {
    sourceModuleId: MODULE_ID,
    sourceRecordType: "assignment-invalidated",
    sourceRecordId: asg.id,
    sourceRecordTitle: `Assignment ${asg.id} invalidated`,
    clinicId: asg.clinicId,
    organisationId: asg.organisationId,
    currentStatus: asg.state,
    route: "/roster",
    section: "conflicts-warnings",
  };
}

function assignmentInvalidatedProjectionKey(asg: Assignment): string {
  return `${MODULE_ID}::assignment-invalidated::${asg.id}`;
}

export function syncAssignmentInvalidatedToInbox(asg: Assignment) {
  if (typeof window === "undefined") return null;
  if (asg.state !== "invalidated") return null;
  const source = assignmentInvalidatedSource(asg);
  const projectionKey = assignmentInvalidatedProjectionKey(asg);
  const existing = findInboxActionForSource(MODULE_ID, "assignment-invalidated", asg.id);
  return dispatchActionInboxEvent({
    kind: existing ? "update" : "create",
    projectionKey,
    source,
    sourceRecordVersion: asg.version,
    actionTitle: source.sourceRecordTitle,
    actionSummary: `Published assignment ${asg.id} invalidated: ${asg.invalidationReason ?? "unspecified"}.`,
    category: "Exception",
    actionType: "RosterAssignmentInvalidated",
    clinicId: asg.clinicId,
    owner: "Roster Coordinator",
    requester: "M05 Roster",
    priority: "High",
    dueAt: dueInDays(1),
    requiredOutcome: "Reassign, override with audit, or supersede publication",
    sensitivity: "Standard",
    inboxStatus: "Open",
    completionRequirements: ["Reassign", "Or supersede publication"],
  });
}
