/**
 * Action Inbox bridge service — destination write path for Module 2 projections.
 * Source modules call this via adapters; they must not import M2 repository internals.
 */

import {
  appendAudit,
  loadActions,
  loadNotifications,
  pushNotification,
  saveActions,
} from "@/lib/action-inbox/repository";
import type { InboxAction } from "@/lib/action-inbox/types";
import { nowIso, uid } from "@/lib/action-inbox/utils";
import { LOCATIONS } from "@/lib/mock/data";
import type { ActionInboxEventInput, SourceLinkRecord } from "@/platform/contracts/action-inbox-events";
import { buildSourceHref, sourceRefKey } from "@/platform/contracts/source-record";
import { PLATFORM_KEYS, readJsonSafe, writeJsonSafe } from "@/platform/storage";

export type {
  ActionInboxEventInput,
  InboxEventKind,
  SourceLinkRecord,
} from "@/platform/contracts/action-inbox-events";

type LinkMap = Record<string, SourceLinkRecord>;

function loadLinks(): LinkMap {
  return readJsonSafe<LinkMap>(PLATFORM_KEYS.sourceLinks, {});
}

function saveLinks(map: LinkMap) {
  writeJsonSafe(PLATFORM_KEYS.sourceLinks, map);
}

function clinicName(clinicId?: string): string {
  if (!clinicId) return "Organisation";
  return LOCATIONS.find((l) => l.id === clinicId)?.shortName ?? clinicId;
}

function projectionKeyFor(input: ActionInboxEventInput): string {
  return input.projectionKey ?? sourceRefKey(input.source);
}

function buildInboxAction(input: ActionInboxEventInput, existing?: InboxAction): InboxAction {
  const href = buildSourceHref(input.source);
  const related = {
    id: input.source.sourceRecordId,
    label: input.source.sourceRecordTitle,
    module: input.source.sourceModuleId,
    ref: href,
  };

  if (existing) {
    return {
      ...existing,
      title: input.actionTitle,
      explanation: input.actionSummary,
      fullExplanation: input.actionSummary,
      category: input.category,
      clinicId: input.clinicId ?? existing.clinicId,
      clinicName: clinicName(input.clinicId ?? existing.clinicId),
      owner: input.owner,
      requestedBy: input.requester,
      priority: input.priority,
      dueAt: input.dueAt,
      requiredOutcome: input.requiredOutcome,
      sensitivity: input.sensitivity ?? existing.sensitivity,
      status: input.inboxStatus ?? existing.status,
      sourceRecord: href,
      sourceModule: input.source.sourceModuleId,
      watchers: input.watchers ?? existing.watchers,
      completionRequirements: input.completionRequirements ?? existing.completionRequirements,
      relatedRecords: [related, ...existing.relatedRecords.filter((r) => r.id !== related.id)],
    };
  }

  const id = uid("act");
  return {
    id,
    number: `ORG-${Date.now().toString().slice(-6)}`,
    title: input.actionTitle,
    explanation: input.actionSummary,
    fullExplanation: input.actionSummary,
    category: input.category,
    clinicId: input.clinicId ?? "",
    clinicName: clinicName(input.clinicId),
    team: "Organisation & Access",
    owner: input.owner,
    requestedBy: input.requester,
    priority: input.priority,
    status: input.inboxStatus ?? "Open",
    sensitivity: input.sensitivity ?? "Restricted",
    createdAt: nowIso(),
    dueAt: input.dueAt,
    requiredOutcome: input.requiredOutcome,
    sourceRecord: href,
    sourceModule: input.source.sourceModuleId,
    unread: true,
    isDemo: true,
    escalationLevel: 0,
    watchers: input.watchers ?? [],
    notes: `Projection of ${input.source.sourceRecordType} ${input.source.sourceRecordId}. Source module remains system of record.`,
    attachments: [],
    comments: [],
    relatedRecords: [related],
    approvalSteps: input.approvalPathway
      ? [{ id: uid("ap"), order: 1, approver: input.owner, status: "Pending" }]
      : [],
    ownershipHistory: [
      {
        at: nowIso(),
        from: "System",
        to: input.owner,
        reason: "Created from source module event",
        kind: "assign",
      },
    ],
    linkedFollowUps: [],
    completionRequirements: input.completionRequirements ?? ["Review source record", "Record decision"],
    notificationMethods: input.notificationRules ?? ["Platform"],
  };
}

export function dispatchActionInboxEvent(input: ActionInboxEventInput): InboxAction | null {
  if (typeof window === "undefined") return null;

  const key = projectionKeyFor(input);
  const links = loadLinks();
  const link = links[key];
  let actions = loadActions();

  if (input.kind === "create" || input.kind === "update") {
    const existing = link ? actions.find((a) => a.id === link.inboxActionId) : undefined;
    const nextAction = buildInboxAction(input, existing);
    if (existing) {
      actions = actions.map((a) => (a.id === existing.id ? nextAction : a));
      appendAudit({
        actionId: nextAction.id,
        event: "Edited",
        user: input.requester,
        at: nowIso(),
        detail: `Updated from ${input.source.sourceModuleId}`,
      });
    } else {
      actions = [nextAction, ...actions];
      appendAudit({
        actionId: nextAction.id,
        event: "Created",
        user: input.requester,
        at: nowIso(),
        detail: `Created from ${input.source.sourceModuleId} · ${input.source.sourceRecordType}`,
      });
      pushNotification({
        title: input.actionTitle,
        reason: input.actionSummary,
        actionId: nextAction.id,
        actionNumber: nextAction.number,
        clinicName: nextAction.clinicName,
        at: nowIso(),
        priority: input.priority,
        kind: input.priority === "Urgent" ? "urgent" : "routine",
        groupKey: `src:${key}`,
      });
    }
    saveActions(actions);
    links[key] = {
      projectionKey: key,
      inboxActionId: nextAction.id,
      sourceKey: sourceRefKey(input.source),
      source: input.source,
      updatedAt: nowIso(),
    };
    saveLinks(links);
    return nextAction;
  }

  if (!link) return null;
  const target = actions.find((a) => a.id === link.inboxActionId);
  if (!target) return null;

  let updated = { ...target };

  switch (input.kind) {
    case "change-owner":
      updated = {
        ...updated,
        owner: input.owner,
        ownershipHistory: [
          {
            at: nowIso(),
            from: target.owner,
            to: input.owner,
            reason: "Owner changed from source module",
            kind: "reassign",
          },
          ...updated.ownershipHistory,
        ],
      };
      appendAudit({
        actionId: updated.id,
        event: "Reassigned",
        user: input.requester,
        at: nowIso(),
        previousValue: target.owner,
        newValue: input.owner,
      });
      break;
    case "change-due-date":
      updated = { ...updated, dueAt: input.dueAt };
      appendAudit({
        actionId: updated.id,
        event: "Due date changed",
        user: input.requester,
        at: nowIso(),
        previousValue: target.dueAt,
        newValue: input.dueAt,
      });
      break;
    case "change-priority":
      updated = { ...updated, priority: input.priority };
      appendAudit({
        actionId: updated.id,
        event: "Priority changed",
        user: input.requester,
        at: nowIso(),
        previousValue: target.priority,
        newValue: input.priority,
      });
      break;
    case "mark-source-resolved":
    case "close":
      updated = {
        ...updated,
        status: "Completed",
        completedAt: nowIso(),
        actualResult: input.actionSummary,
      };
      appendAudit({
        actionId: updated.id,
        event: "Completed",
        user: input.requester,
        at: nowIso(),
        detail: "Source record resolved",
      });
      break;
    case "archive":
      updated = { ...updated, status: "Archived", archivedAt: nowIso() };
      appendAudit({
        actionId: updated.id,
        event: "Archived",
        user: input.requester,
        at: nowIso(),
      });
      break;
    case "create-follow-up": {
      const follow = buildInboxAction({
        ...input,
        kind: "create",
        projectionKey: `${key}::followup::${Date.now()}`,
        actionTitle: `Follow-up: ${input.actionTitle}`,
      });
      follow.linkedFollowUpOf = target.id;
      actions = [follow, ...actions];
      updated = { ...updated, linkedFollowUps: [...updated.linkedFollowUps, follow.id] };
      appendAudit({
        actionId: follow.id,
        event: "Linked follow-up created",
        user: input.requester,
        at: nowIso(),
        detail: `Follow-up of ${target.number}`,
      });
      saveActions(
        actions.map((a) => (a.id === updated.id ? updated : a.id === follow.id ? follow : a))
      );
      return follow;
    }
    default:
      break;
  }

  actions = actions.map((a) => (a.id === updated.id ? updated : a));
  saveActions(actions);
  links[key] = { ...link, source: input.source, updatedAt: nowIso() };
  saveLinks(links);
  return updated;
}

export function findInboxActionForSource(
  sourceModuleId: string,
  sourceRecordType: string,
  sourceRecordId: string
): InboxAction | undefined {
  const key = sourceRefKey({ sourceModuleId, sourceRecordType, sourceRecordId });
  const link = loadLinks()[key];
  if (!link) return undefined;
  return loadActions().find((a) => a.id === link.inboxActionId);
}

export function getSourceLinkForInboxAction(actionId: string): SourceLinkRecord | undefined {
  return Object.values(loadLinks()).find((l) => l.inboxActionId === actionId);
}

export function peekInboxNotifications() {
  return loadNotifications();
}
