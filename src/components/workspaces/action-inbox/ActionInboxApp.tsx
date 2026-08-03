"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useIdentity } from "@/platform/context/identity-context";
import { getSourceLinkForInboxAction } from "@/platform/services/action-inbox-bridge";
import { buildSourceHref } from "@/platform/contracts/source-record";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { usePortal } from "@/lib/portal-context";
import { CLINIC_OPTIONS, STAFF_DIRECTORY } from "@/lib/action-inbox/mock-data";
import {
  applyOverdueEffects,
  applySnooze,
  approveStep,
  archiveCompleted,
  changeDueDate,
  completeAction,
  escalateAction,
  loadActions,
  loadAudit,
  loadDelegations,
  loadDrafts,
  loadNotifications,
  loadSavedViews,
  loadSettings,
  loadTemplates,
  nextActionNumber,
  pushNotification,
  readDemoMode,
  recordAudit,
  rejectAction,
  resetActionsToSeed,
  saveActions,
  saveDelegations,
  saveDrafts,
  saveNotifications,
  saveSavedViews,
  saveSettings,
  updateAction,
  writeDemoMode,
} from "@/lib/action-inbox/repository";
import { M2_STORAGE, readJson, writeJson } from "@/lib/action-inbox/storage";
import type {
  ActionCategory,
  ActionDraft,
  ActionTemplate,
  CategoryFilter,
  DelegationRecord,
  DemoRole,
  DisplayDensity,
  InboxAction,
  InboxFilters,
  InboxNotification,
  MainView,
  NotificationSettings,
  SavedView,
} from "@/lib/action-inbox/types";
import { DEFAULT_FILTERS, DEMO_USER } from "@/lib/action-inbox/types";
import {
  canViewSensitive,
  formatDateTime,
  isLockedAction,
  matchesCategory,
  matchesFilters,
  matchesMainView,
  nowIso,
  sortInbox,
  uid,
} from "@/lib/action-inbox/utils";
import { cn } from "@/lib/cn";
import { AnalyticsPanel } from "./AnalyticsPanel";
import { ConfirmExportModal, ReasonModal } from "./ActionModals";
import { CreateActionWorkspace } from "./CreateActionWorkspace";
import { FiltersBar } from "./FiltersBar";
import { InboxList } from "./InboxList";
import { NotificationCentre } from "./NotificationCentre";
import { NotificationSettingsPanel } from "./NotificationSettingsPanel";
import { ReviewPanel } from "./ReviewPanel";
import { SummaryCards } from "./SummaryCards";

type LoadState = "loading" | "ready" | "error";
type Overlay =
  | null
  | "create"
  | "notifications"
  | "settings"
  | "analytics"
  | "delegations"
  | "drafts"
  | "export";
type ReasonKind =
  | "reject"
  | "return"
  | "self-approve"
  | "reassign"
  | "delegate"
  | "due"
  | "hold"
  | "withdraw"
  | "comment"
  | "escalate"
  | "decline"
  | "complete"
  | "verify"
  | "acknowledge"
  | "snooze"
  | "follow-up"
  | "info"
  | "hide-comment";

const MAIN_VIEWS: { id: MainView; label: string; managerOnly?: boolean }[] = [
  { id: "my-actions", label: "My Actions" },
  { id: "my-team", label: "My Team", managerOnly: true },
  { id: "all-clinics", label: "All Clinics", managerOnly: true },
  { id: "delegated-by-me", label: "Delegated by Me" },
  { id: "watching", label: "Watching" },
  { id: "completed", label: "Completed" },
  { id: "archive", label: "Archive" },
];

const CATEGORY_TABS: { id: CategoryFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "Approval", label: "Approvals" },
  { id: "Exception", label: "Exceptions" },
  { id: "Escalation", label: "Escalations" },
  { id: "Reminder", label: "Reminders" },
];

function parseMentions(body: string): string[] {
  const found = new Set<string>();
  for (const name of STAFF_DIRECTORY) {
    const re = new RegExp(`@${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (re.test(body)) found.add(name);
  }
  return [...found];
}

function cloneAction(action: InboxAction): InboxAction {
  return {
    ...action,
    attachments: action.attachments.map((x) => ({ ...x })),
    comments: action.comments.map((x) => ({ ...x })),
    relatedRecords: action.relatedRecords.map((x) => ({ ...x })),
    approvalSteps: action.approvalSteps.map((x) => ({ ...x })),
    watchers: [...action.watchers],
    ownershipHistory: action.ownershipHistory.map((x) => ({ ...x })),
    linkedFollowUps: [...action.linkedFollowUps],
    completionRequirements: [...action.completionRequirements],
    notificationMethods: [...action.notificationMethods],
  };
}

export function ActionInboxApp() {
  const { pushToast } = usePortal();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { identity, inboxDemoRole, canSeeSensitive: identitySensitive } = useIdentity();

  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [actions, setActions] = useState<InboxAction[]>([]);
  const [notifications, setNotifications] = useState<InboxNotification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>(() => loadSettings());
  const [drafts, setDrafts] = useState<ActionDraft[]>([]);
  const [templates, setTemplates] = useState<ActionTemplate[]>([]);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [delegations, setDelegations] = useState<DelegationRecord[]>([]);

  const [mainView, setMainView] = useState<MainView>("my-actions");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [filters, setFilters] = useState<InboxFilters>({ ...DEFAULT_FILTERS });
  const [density, setDensity] = useState<DisplayDensity>("comfortable");
  const [demoMode, setDemoMode] = useState(true);
  const [roleOverride, setRoleOverride] = useState<DemoRole | null>(null);
  const [sensitivityOverride, setSensitivityOverride] = useState<boolean | null>(null);
  const [syncedIdentityUserId, setSyncedIdentityUserId] = useState(identity.userId);
  const [syncedManagerControls, setSyncedManagerControls] = useState(identity.managerControls);

  // Reset local inbox overrides when global Act-as identity changes (render-time sync).
  if (identity.userId !== syncedIdentityUserId) {
    setSyncedIdentityUserId(identity.userId);
    setRoleOverride(null);
    setSensitivityOverride(null);
  }
  if (identity.managerControls !== syncedManagerControls) {
    setSyncedManagerControls(identity.managerControls);
    if (!identity.managerControls) setMainView("my-actions");
  }

  const demoRole = roleOverride ?? inboxDemoRole;
  const canSeeSensitive = sensitivityOverride ?? identitySensitive;

  const applyDemoRole = useCallback((next: DemoRole) => {
    setRoleOverride(next);
    writeJson(M2_STORAGE.role, next);
  }, []);

  const applySensitivity = useCallback((full: boolean) => {
    setSensitivityOverride(full);
    writeJson(M2_STORAGE.sensitivity, full);
  }, []);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [activeSavedViewId, setActiveSavedViewId] = useState<string | null>(null);
  const [auditKey, setAuditKey] = useState(0);

  const [overlay, setOverlay] = useState<Overlay>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [reason, setReason] = useState<{ kind: ReasonKind; actionId: string; targetId?: string } | null>(
    null
  );
  const moreRef = useRef<HTMLDivElement>(null);

  const isManager = demoRole === "manager";
  const actor = DEMO_USER.name;

  const persistActions = useCallback((next: InboxAction[]) => {
    setActions(next);
    saveActions(next);
  }, []);

  const persistNotifications = useCallback((next: InboxNotification[]) => {
    setNotifications(next);
    saveNotifications(next);
  }, []);

  const bumpAudit = useCallback(() => setAuditKey((k) => k + 1), []);

  const hydrate = useCallback(() => {
    setLoadState("loading");
    try {
      let loaded = loadActions();
      let notifs = loadNotifications();
      const overdue = applyOverdueEffects(loaded, notifs);
      loaded = archiveCompleted(overdue.actions);
      saveActions(loaded);
      notifs = overdue.notifications;

      setActions(loaded);
      setNotifications(notifs);
      setSettings(loadSettings());
      setDrafts(loadDrafts());
      setTemplates(loadTemplates());
      setSavedViews(loadSavedViews());
      setDelegations(loadDelegations());
      setDemoMode(readDemoMode());
      // Touch audit so storage is primed
      loadAudit();
      setLoadState("ready");
    } catch {
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => hydrate());
  }, [hydrate]);

  /** Legacy /approvals redirect and deep-links: ?category=Approval */
  useEffect(() => {
    const raw = searchParams.get("category");
    if (!raw) return;
    const allowed: CategoryFilter[] = ["Approval", "Exception", "Escalation", "Reminder", "all"];
    if (allowed.includes(raw as CategoryFilter)) {
      queueMicrotask(() => {
        setCategory(raw as CategoryFilter);
        if (raw === "Approval") setMainView("all-clinics");
      });
    }
  }, [searchParams]);

  /** Deep-link: ?actionId=… */
  useEffect(() => {
    const actionId = searchParams.get("actionId");
    if (!actionId || !actions.length) return;
    if (actions.some((a) => a.id === actionId)) {
      queueMicrotask(() => {
        setReviewId(actionId);
        setExpandedId(actionId);
      });
    }
  }, [searchParams, actions]);

  useEffect(() => {
    if (!moreOpen) return;
    function onDoc(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [moreOpen]);

  const visibleViews = MAIN_VIEWS.filter((v) => !v.managerOnly || isManager);

  const filtered = useMemo(() => {
    const list = actions.filter(
      (a) =>
        matchesMainView(a, mainView, actor) &&
        matchesCategory(a, category) &&
        matchesFilters(a, filters, actor, canSeeSensitive)
    );
    return sortInbox(list);
  }, [actions, mainView, category, filters, actor, canSeeSensitive]);

  const reviewAction = useMemo(
    () => (reviewId ? actions.find((a) => a.id === reviewId) ?? null : null),
    [actions, reviewId]
  );

  const reasonAction = useMemo(
    () => (reason ? actions.find((a) => a.id === reason.actionId) ?? null : null),
    [actions, reason]
  );

  const unreadNotifs = notifications.filter((n) => !n.read && !n.silenced).length;

  const openReason = (kind: ReasonKind, actionId: string, targetId?: string) => {
    setReason({ kind, actionId, targetId });
  };

  const patchAction = (id: string, updater: (a: InboxAction) => InboxAction) => {
    const next = updateAction(actions, id, updater);
    persistActions(next);
    bumpAudit();
  };

  const tryApprove = (actionId: string, note: string, allowSelf: boolean, selfReason?: string) => {
    const action = actions.find((a) => a.id === actionId);
    if (!action) return;
    const result = approveStep(action, actor, note, allowSelf, selfReason);
    if (result.error) {
      if (result.error.toLowerCase().includes("self-approval")) {
        openReason("self-approve", actionId);
        pushToast(result.error, "warn");
        return;
      }
      pushToast(result.error, "danger");
      return;
    }
    persistActions(updateAction(actions, actionId, () => result.action));
    recordAudit(actionId, "Decision made", {
      detail: allowSelf ? "Exceptional self-approval" : "Approved",
      reason: note || selfReason,
      fullDetail: selfReason,
    });
    if (result.selfApproved) {
      recordAudit(actionId, "Self-Approved", { reason: selfReason || note });
      const notifs = pushNotification(
        {
          title: "Self-approval recorded",
          reason: `${action.number} was self-approved — manager notified (demonstration)`,
          actionId: action.id,
          actionNumber: action.number,
          clinicName: action.clinicName,
          at: nowIso(),
          priority: "High",
          kind: "mandatory-approval",
        },
        notifications
      );
      persistNotifications(notifs);
    } else {
      const notifs = pushNotification(
        {
          title: "Approval decision",
          reason: `${action.number} approved by ${actor}`,
          actionId: action.id,
          actionNumber: action.number,
          clinicName: action.clinicName,
          at: nowIso(),
          priority: action.priority,
          kind: "routine",
          groupKey: "approvals",
        },
        notifications
      );
      persistNotifications(notifs);
    }
    bumpAudit();
    pushToast(result.selfApproved ? "Self-approval recorded." : "Action approved.", "success");
  };

  const handleReasonSubmit = (payload: {
    reason: string;
    person?: string;
    dueAt?: string;
    startDate?: string;
    endDate?: string;
    canComplete?: boolean;
    canFurtherDelegate?: boolean;
    sendUpdatesToOwner?: boolean;
    outcome?: string;
    snoozeId?: string;
    targetId?: string;
  }) => {
    if (!reason) return;
    const { kind, actionId } = reason;
    const action = actions.find((a) => a.id === actionId);
    if (!action) {
      setReason(null);
      return;
    }

    if (kind === "reject") {
      const mode = payload.outcome === "return" ? "return" : "close";
      const next = rejectAction(action, payload.reason, mode);
      persistActions(updateAction(actions, actionId, () => next));
      recordAudit(actionId, mode === "return" ? "Returned for Correction" : "Decision made", {
        detail: mode === "return" ? "Returned for correction" : "Rejected",
        reason: payload.reason,
      });
      const notifs = pushNotification(
        {
          title: mode === "return" ? "Returned for correction" : "Request rejected",
          reason: `${action.number}: ${payload.reason}`,
          actionId,
          actionNumber: action.number,
          clinicName: action.clinicName,
          at: nowIso(),
          priority: action.priority,
          kind: "urgent",
        },
        notifications
      );
      persistNotifications(notifs);
      bumpAudit();
      pushToast(mode === "return" ? "Returned for correction." : "Request rejected.", "warn");
      setReason(null);
      return;
    }

    if (kind === "return") {
      const next = rejectAction(action, payload.reason, "return");
      persistActions(updateAction(actions, actionId, () => next));
      recordAudit(actionId, "Returned for Correction", { reason: payload.reason });
      bumpAudit();
      pushToast("Returned for correction.", "warn");
      setReason(null);
      return;
    }

    if (kind === "self-approve") {
      tryApprove(actionId, payload.reason, true, payload.reason);
      setReason(null);
      return;
    }

    if (kind === "reassign") {
      const person = payload.person || STAFF_DIRECTORY[0];
      patchAction(actionId, (a) => ({
        ...a,
        owner: person,
        originalOwner: a.originalOwner || a.owner,
        ownershipHistory: [
          ...a.ownershipHistory,
          {
            at: nowIso(),
            from: a.owner,
            to: person,
            reason: payload.reason,
            kind: "reassign" as const,
          },
        ],
        unread: true,
      }));
      recordAudit(actionId, "Reassigned", {
        reason: payload.reason,
        previousValue: action.owner,
        newValue: person,
      });
      const notifs = pushNotification(
        {
          title: "Action reassigned",
          reason: `${action.number} reassigned to ${person}`,
          actionId,
          actionNumber: action.number,
          clinicName: action.clinicName,
          at: nowIso(),
          priority: action.priority,
          kind: "routine",
          groupKey: "ownership",
        },
        notifications
      );
      persistNotifications(notifs);
      pushToast(`Reassigned to ${person}.`, "success");
      setReason(null);
      return;
    }

    if (kind === "delegate") {
      const person = payload.person || STAFF_DIRECTORY[0];
      const delId = uid("del");
      const record: DelegationRecord = {
        id: delId,
        actionId,
        fromOwner: action.owner,
        delegate: person,
        startDate: payload.startDate || nowIso().slice(0, 10),
        endDate: payload.endDate || nowIso().slice(0, 10),
        reason: payload.reason,
        canComplete: payload.canComplete ?? true,
        canFurtherDelegate: payload.canFurtherDelegate ?? false,
        sendUpdatesToOwner: payload.sendUpdatesToOwner ?? true,
        active: true,
      };
      const nextDels = [record, ...delegations];
      setDelegations(nextDels);
      saveDelegations(nextDels);
      patchAction(actionId, (a) => ({
        ...a,
        originalOwner: a.originalOwner || a.owner,
        delegatedTo: person,
        delegatedByMe: a.owner === actor || a.originalOwner === actor,
        delegationId: delId,
        ownershipHistory: [
          ...a.ownershipHistory,
          {
            at: nowIso(),
            from: a.owner,
            to: person,
            reason: payload.reason,
            kind: "delegate" as const,
          },
        ],
        unread: true,
      }));
      recordAudit(actionId, "Delegated", { reason: payload.reason, newValue: person });
      const notifs = pushNotification(
        {
          title: "Action delegated",
          reason: `${action.number} delegated to ${person} (owner remains responsible)`,
          actionId,
          actionNumber: action.number,
          clinicName: action.clinicName,
          at: nowIso(),
          priority: action.priority,
          kind: "routine",
          groupKey: "delegation",
        },
        notifications
      );
      persistNotifications(notifs);
      pushToast(`Delegated to ${person}.`, "success");
      setReason(null);
      return;
    }

    if (kind === "due") {
      if (!payload.dueAt) {
        pushToast("Choose a new due date and time.", "warn");
        return;
      }
      const next = changeDueDate(action, payload.dueAt, payload.reason);
      persistActions(updateAction(actions, actionId, () => next));
      recordAudit(actionId, "Due date changed", {
        reason: payload.reason,
        previousValue: action.dueAt,
        newValue: payload.dueAt,
      });
      bumpAudit();
      pushToast("Due date updated.", "success");
      setReason(null);
      return;
    }

    if (kind === "hold") {
      patchAction(actionId, (a) => ({
        ...a,
        onHold: true,
        holdReason: payload.reason,
        status: "On Hold",
        notes: `${a.notes}\nOn hold: ${payload.reason}`.trim(),
      }));
      recordAudit(actionId, "Placed on Hold", { reason: payload.reason });
      pushToast("Action placed on hold.", "warn");
      setReason(null);
      return;
    }

    if (kind === "withdraw") {
      patchAction(actionId, (a) => ({
        ...a,
        status: "Withdrawn",
        completedAt: nowIso(),
        outcome: "Withdrawn",
        notes: `${a.notes}\nWithdrawn: ${payload.reason}`.trim(),
      }));
      recordAudit(actionId, "Withdrawn", { reason: payload.reason });
      pushToast("Request withdrawn.", "default");
      setReason(null);
      return;
    }

    if (kind === "comment") {
      const mentions = parseMentions(payload.reason);
      patchAction(actionId, (a) => ({
        ...a,
        comments: [
          ...a.comments,
          {
            id: uid("cmt"),
            author: actor,
            body: payload.reason,
            at: nowIso(),
            mentions,
          },
        ],
        watchers: mentions.length
          ? Array.from(new Set([...a.watchers, ...mentions]))
          : a.watchers,
      }));
      recordAudit(actionId, "Comment added", {
        detail: payload.reason.slice(0, 120),
        reason: mentions.length ? `Mentions: ${mentions.join(", ")}` : undefined,
      });
      if (mentions.length) {
        const notifs = pushNotification(
          {
            title: "You were mentioned",
            reason: `${actor} mentioned you on ${action.number}`,
            actionId,
            actionNumber: action.number,
            clinicName: action.clinicName,
            at: nowIso(),
            priority: "Medium",
            kind: "routine",
            groupKey: "mentions",
          },
          notifications
        );
        persistNotifications(notifs);
      }
      pushToast("Comment added.", "success");
      setReason(null);
      return;
    }

    if (kind === "escalate") {
      const next = escalateAction(action, payload.reason, payload.dueAt);
      persistActions(updateAction(actions, actionId, () => next));
      recordAudit(actionId, "Escalation started", {
        reason: payload.reason,
        newValue: `L${next.escalationLevel}`,
      });
      const notifs = pushNotification(
        {
          title: "Action escalated",
          reason: `${action.number} escalated to L${next.escalationLevel}: ${payload.reason}`,
          actionId,
          actionNumber: action.number,
          clinicName: action.clinicName,
          at: nowIso(),
          priority: "Urgent",
          kind: "escalation",
        },
        notifications
      );
      persistNotifications(notifs);
      bumpAudit();
      pushToast(`Escalated to level ${next.escalationLevel}.`, "warn");
      setReason(null);
      return;
    }

    if (kind === "decline") {
      patchAction(actionId, (a) => ({
        ...a,
        owner: a.originalOwner || a.requestedBy,
        delegatedTo: undefined,
        notes: `${a.notes}\nDeclined assignment: ${payload.reason}`.trim(),
        unread: true,
      }));
      recordAudit(actionId, "Declined assignment", { reason: payload.reason });
      pushToast("Assignment declined.", "warn");
      setReason(null);
      return;
    }

    if (kind === "complete") {
      const result = completeAction(action, payload.reason, payload.outcome || "Completed");
      if (result.error) {
        pushToast(result.error, "danger");
        return;
      }
      persistActions(updateAction(actions, actionId, () => result.action));
      recordAudit(actionId, "Completed", {
        reason: payload.reason,
        detail: payload.outcome,
      });
      bumpAudit();
      pushToast(
        result.action.status === "Awaiting Verification"
          ? "Marked complete — awaiting verification."
          : "Action completed.",
        "success"
      );
      setReason(null);
      return;
    }

    if (kind === "verify") {
      patchAction(actionId, (a) => ({
        ...a,
        status: "Completed",
        verifiedAt: nowIso(),
        verifiedBy: actor,
        completedAt: a.completedAt || nowIso(),
        notes: `${a.notes}\nVerified: ${payload.reason}`.trim(),
      }));
      recordAudit(actionId, "Verified", { reason: payload.reason });
      pushToast("Resolution verified.", "success");
      setReason(null);
      return;
    }

    if (kind === "acknowledge") {
      patchAction(actionId, (a) => ({
        ...a,
        acknowledgedAt: nowIso(),
        acknowledgedBy: actor,
        notes: `${a.notes}\nAcknowledged: ${payload.reason}`.trim(),
        unread: false,
      }));
      recordAudit(actionId, "Acknowledged", { reason: payload.reason });
      pushToast("Exception acknowledged.", "success");
      setReason(null);
      return;
    }

    if (kind === "snooze") {
      const result = applySnooze(
        action,
        payload.snoozeId || "1h",
        payload.snoozeId === "custom" ? payload.dueAt : undefined
      );
      if (result.error) {
        pushToast(result.error, "danger");
        return;
      }
      persistActions(updateAction(actions, actionId, () => result.action));
      recordAudit(actionId, "Snoozed", {
        detail: payload.snoozeId,
        newValue: result.action.snoozedUntil,
      });
      bumpAudit();
      pushToast(
        `Snoozed until ${formatDateTime(result.action.snoozedUntil || nowIso())}.`,
        "default"
      );
      setReason(null);
      return;
    }

    if (kind === "follow-up") {
      const follow = cloneAction(action);
      const number = nextActionNumber(actions);
      const followId = uid("act");
      const created: InboxAction = {
        ...follow,
        id: followId,
        number,
        title: `Follow-up: ${action.title}`,
        explanation: payload.reason,
        fullExplanation: payload.reason,
        status: "Open",
        createdAt: nowIso(),
        dueAt: payload.dueAt || action.dueAt,
        completedAt: undefined,
        archivedAt: undefined,
        unread: true,
        linkedFollowUpOf: action.id,
        linkedFollowUps: [],
        comments: [],
        approvalSteps: [],
        ownershipHistory: [
          {
            at: nowIso(),
            from: actor,
            to: action.owner,
            reason: "Linked follow-up created",
            kind: "assign",
          },
        ],
        outcome: undefined,
        completionNote: undefined,
        onHold: false,
        holdReason: undefined,
        snoozedUntil: undefined,
      };
      const nextActions = updateAction(
        [created, ...actions],
        actionId,
        (a) => ({
          ...a,
          linkedFollowUps: [...a.linkedFollowUps, followId],
        })
      );
      persistActions(nextActions);
      recordAudit(actionId, "Linked follow-up created", {
        detail: number,
        reason: payload.reason,
      });
      recordAudit(followId, "Created", { detail: `Follow-up of ${action.number}` });
      bumpAudit();
      pushToast(`Linked follow-up ${number} created.`, "success");
      setReason(null);
      setReviewId(followId);
      return;
    }

    if (kind === "info") {
      patchAction(actionId, (a) => ({
        ...a,
        notes: `${a.notes}\nInfo requested: ${payload.reason}`.trim(),
        unread: true,
        status: a.status === "Open" ? "In Progress" : a.status,
      }));
      recordAudit(actionId, "Comment added", {
        detail: "Request more information",
        reason: payload.reason,
      });
      const notifs = pushNotification(
        {
          title: "More information requested",
          reason: `${action.number}: ${payload.reason}`,
          actionId,
          actionNumber: action.number,
          clinicName: action.clinicName,
          at: nowIso(),
          priority: action.priority,
          kind: "routine",
          groupKey: "info",
        },
        notifications
      );
      persistNotifications(notifs);
      pushToast("Information request recorded.", "default");
      setReason(null);
      return;
    }

    if (kind === "hide-comment") {
      const targetId = reason.targetId || payload.targetId;
      if (!targetId) {
        pushToast("No comment selected to hide.", "warn");
        setReason(null);
        return;
      }
      patchAction(actionId, (a) => ({
        ...a,
        comments: a.comments.map((c) =>
          c.id === targetId ? { ...c, hidden: true, hideReason: payload.reason } : c
        ),
      }));
      recordAudit(actionId, "Content hidden", {
        reason: payload.reason,
        detail: `Comment ${targetId}`,
        fullDetail: payload.reason,
      });
      pushToast("Comment hidden (retained in audit).", "warn");
      setReason(null);
      return;
    }

    setReason(null);
  };

  const onReviewAction = (kind: string) => {
    if (!reviewId) return;
    const a = actions.find((x) => x.id === reviewId);
    if (a && isLockedAction(a) && !["follow-up", "open-source", "comment"].includes(kind)) {
      if (a.status === "Archived") {
        pushToast("Archived records cannot be edited. Create a linked follow-up instead.", "warn");
        return;
      }
      if (kind !== "follow-up") {
        pushToast("This action is locked. Create a linked follow-up instead of reopening.", "warn");
        if (kind === "complete" || kind === "approve" || kind === "reject") return;
      }
    }
    if (kind === "approve") {
      tryApprove(reviewId, "", false);
      return;
    }
    if (kind === "open-source") {
      const link = a ? getSourceLinkForInboxAction(a.id) : undefined;
      const href =
        link?.source
          ? buildSourceHref(link.source)
          : a?.sourceRecord?.startsWith("/")
            ? a.sourceRecord
            : null;
      if (href) {
        router.push(href);
        pushToast(`Opening source record in ${link?.source.sourceModuleId ?? a?.sourceModule ?? "module"}.`, "success");
      } else {
        pushToast(
          a?.sourceRecord
            ? `Demonstration: would open ${a.sourceModule} / ${a.sourceRecord}.`
            : "No source record linked.",
          "default"
        );
      }
      return;
    }
    openReason(kind as ReasonKind, reviewId);
  };

  const onQuick = (kind: string, id: string) => {
    const a = actions.find((x) => x.id === id);
    if (a && isLockedAction(a)) {
      pushToast("This action is locked. Use Create Linked Follow-up from the review panel.", "warn");
      return;
    }
    if (kind === "approve") {
      tryApprove(id, "", false);
      return;
    }
    openReason(kind as ReasonKind, id);
  };

  const onSummarySelect = (cat: ActionCategory) => {
    setCategory((prev) => (prev === cat ? "all" : cat));
    setActiveSavedViewId(null);
  };

  const clearFilters = () => {
    setFilters({ ...DEFAULT_FILTERS });
    setActiveSavedViewId(null);
  };

  const applySavedView = (v: SavedView) => {
    setFilters({ ...v.filters });
    setMainView(v.mainView);
    setCategory(v.category);
    setActiveSavedViewId(v.id);
    pushToast(`Applied view “${v.name}”.`, "default");
  };

  const saveCurrentView = (name: string, scope: "private" | "shared") => {
    if (!isManager && scope === "shared") {
      pushToast("Only managers can create shared views.", "warn");
      return;
    }
    const view: SavedView = {
      id: uid("view"),
      name,
      scope,
      pinned: false,
      createdBy: actor,
      filters: { ...filters },
      mainView,
      category,
    };
    const next = [view, ...savedViews];
    setSavedViews(next);
    saveSavedViews(next);
    setActiveSavedViewId(view.id);
    pushToast(`Saved view “${name}”.`, "success");
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  };

  const bulkMarkRead = () => {
    let next = actions;
    for (const id of selectedIds) {
      next = updateAction(next, id, (a) => ({ ...a, unread: false }));
    }
    persistActions(next);
    setSelectedIds([]);
    pushToast("Marked selected as read.", "success");
  };

  const bulkWatch = () => {
    let next = actions;
    for (const id of selectedIds) {
      next = updateAction(next, id, (a) => ({
        ...a,
        watchers: a.watchers.includes(actor) ? a.watchers : [...a.watchers, actor],
      }));
      recordAudit(id, "Watch added");
    }
    persistActions(next);
    bumpAudit();
    setSelectedIds([]);
    pushToast("Added to Watching.", "success");
  };

  const bulkPriority = () => {
    let next = actions;
    for (const id of selectedIds) {
      next = updateAction(next, id, (a) => ({ ...a, priority: "High" }));
      recordAudit(id, "Priority changed", { newValue: "High" });
    }
    persistActions(next);
    bumpAudit();
    setSelectedIds([]);
    pushToast("Priority set to High for selection.", "success");
  };

  const bulkReminder = () => {
    let notifs = notifications;
    for (const id of selectedIds) {
      const a = actions.find((x) => x.id === id);
      if (!a) continue;
      notifs = pushNotification(
        {
          title: "Reminder sent",
          reason: `Bulk reminder for ${a.number}`,
          actionId: id,
          actionNumber: a.number,
          clinicName: a.clinicName,
          at: nowIso(),
          priority: a.priority,
          kind: "routine",
          groupKey: "bulk-reminder",
        },
        notifs
      );
      recordAudit(id, "Reminder sent");
    }
    persistNotifications(notifs);
    bumpAudit();
    setSelectedIds([]);
    pushToast("Reminders sent.", "success");
  };

  const bulkReassign = () => {
    const person = STAFF_DIRECTORY.find((s) => s !== actor) || STAFF_DIRECTORY[0];
    let next = actions;
    for (const id of selectedIds) {
      const a = next.find((x) => x.id === id);
      if (!a) continue;
      next = updateAction(next, id, (cur) => ({
        ...cur,
        owner: person,
        ownershipHistory: [
          ...cur.ownershipHistory,
          {
            at: nowIso(),
            from: cur.owner,
            to: person,
            reason: "Bulk reassign",
            kind: "reassign" as const,
          },
        ],
      }));
      recordAudit(id, "Reassigned", { newValue: person, reason: "Bulk reassign" });
    }
    persistActions(next);
    bumpAudit();
    setSelectedIds([]);
    pushToast(`Reassigned ${selectedIds.length} to ${person}.`, "success");
  };

  const onExport = (format: string) => {
    const exportable = filtered.filter((a) => canViewSensitive(a, canSeeSensitive));
    const skipped = filtered.length - exportable.length;
    for (const a of exportable.slice(0, 20)) {
      recordAudit(a.id, format.toLowerCase().includes("print") ? "Printed" : "Exported", {
        detail: format,
      });
    }
    bumpAudit();
    pushToast(
      skipped
        ? `${format} prepared for ${exportable.length} action(s). ${skipped} restricted action(s) excluded.`
        : `${format} prepared (demonstration — not downloaded).`,
      "default"
    );
    setOverlay(null);
  };

  const resetDemo = () => {
    const seed = resetActionsToSeed();
    setActions(seed);
    setNotifications(loadNotifications());
    setDrafts(loadDrafts());
    setDelegations(loadDelegations());
    setSavedViews(loadSavedViews());
    setSelectedIds([]);
    setExpandedId(null);
    setReviewId(null);
    setFilters({ ...DEFAULT_FILTERS });
    setCategory("all");
    setMainView("my-actions");
    bumpAudit();
    pushToast("Demonstration data reset.", "default");
    setMoreOpen(false);
  };

  const toggleDemoMode = () => {
    const next = !demoMode;
    setDemoMode(next);
    writeDemoMode(next);
    pushToast(next ? "Demo mode on." : "Demo mode off.", "default");
    setMoreOpen(false);
  };

  const emptyKind: "inbox" | "filtered" =
    Object.values(filters).some((v) => v !== "" && v !== false) || category !== "all"
      ? "filtered"
      : "inbox";

  if (loadState === "loading") {
    return (
      <div className="grid min-h-[40vh] place-items-center rounded-2xl border border-[var(--v34-card-line)] bg-[var(--card)] p-10">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[#cbd5e1] border-t-[#2563eb]" />
          <p className="m-0 text-sm font-semibold text-[var(--muted)]">Loading your actions…</p>
        </div>
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <div className="grid min-h-[40vh] place-items-center rounded-2xl border border-[#fecaca] bg-[#fef2f2] p-10">
        <div className="max-w-md text-center">
          <h2 className="m-0 text-lg font-extrabold text-[#991b1b]">Couldn’t load Action Inbox</h2>
          <p className="mt-2 text-sm text-[#7f1d1d]">
            Local demonstration storage failed to read. Your browser may be blocking storage, or data
            may be corrupted.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button variant="teal" onClick={hydrate}>
              Try Again
            </Button>
            <Button
              variant="line"
              onClick={() =>
                pushToast(
                  "Problem report recorded locally (demonstration). Contact your platform administrator if this persists.",
                  "warn"
                )
              }
            >
              Report a Problem
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {demoMode ? (
        <div className="cc-demo-banner rounded-[12px] border border-[#bfdbfe] bg-[#eff6ff] px-3 py-2 text-[12px] font-semibold text-[#1e3a8a]">
          Demonstration mode — actions, notifications and decisions are stored in this browser only.
          Email / SMS delivery is simulated.
        </div>
      ) : null}

      <header className="rounded-[14px] border border-[var(--v34-card-line)] bg-[var(--card)] p-4 shadow-[var(--v34-card-shadow)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="m-0 text-[22px] font-black tracking-tight text-[var(--ink)]">
              Action Inbox & Notifications
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
              Review, decide and complete work requiring your attention.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-1.5 text-[length:var(--type-control)] font-bold text-[#475569]">
                Demo role
                <select
                  className="rounded-lg border border-[var(--line)] bg-[var(--card)] px-2 py-1 text-[12px] font-semibold text-[var(--ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]"
                  value={demoRole}
                  onChange={(e) => {
                    const next = e.target.value as DemoRole;
                    applyDemoRole(next);
                    setSelectedIds([]);
                    if (next === "staff") setMainView("my-actions");
                    pushToast(
                      `Local inbox role override: ${next}. Prefer Act as User / Role in the sidebar for platform-wide identity.`,
                      "default"
                    );
                  }}
                  aria-label="Demonstration role (coordinates with global identity)"
                >
                  <option value="manager">Manager</option>
                  <option value="staff">Staff</option>
                </select>
              </label>
              <Badge tone="info">{identity.displayName} · {identity.role}</Badge>
              <label className="flex items-center gap-1.5 text-[length:var(--type-control)] font-bold text-[#475569]">
                Sensitivity
                <select
                  className="rounded-lg border border-[var(--line)] bg-[var(--card)] px-2 py-1 text-[12px] font-semibold text-[var(--ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]"
                  value={canSeeSensitive ? "full" : "restricted"}
                  onChange={(e) => {
                    const full = e.target.value === "full";
                    applySensitivity(full);
                    pushToast(
                      full ? "Full sensitivity view." : "Restricted sensitivity view.",
                      "default"
                    );
                  }}
                  aria-label="Sensitivity demonstration"
                >
                  <option value="full">Full (authorised)</option>
                  <option value="restricted">Restricted (unauthorised)</option>
                </select>
              </label>
              <Badge tone="info">{isManager ? "Manager view" : "Staff view"}</Badge>
              <Badge tone={canSeeSensitive ? "teal" : "warn"}>
                {canSeeSensitive ? "Full sensitivity" : "Restricted sensitivity"}
              </Badge>
              {unreadNotifs ? <Badge tone="danger">{unreadNotifs} unread</Badge> : null}
              <span className="text-[length:var(--type-control)] text-[#94a3b8]">Signed in as {actor}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="teal" onClick={() => setOverlay("create")}>
              Create Action
            </Button>
            <Button variant="line" onClick={() => setOverlay("analytics")}>
              Analytics
            </Button>
            <Button variant="line" onClick={() => setOverlay("settings")}>
              Notification Settings
            </Button>
            <Button variant="line" onClick={() => setOverlay("delegations")} disabled={!isManager}>
              Manage Delegations
            </Button>
            <Button variant="line" onClick={() => setOverlay("export")}>
              Export
            </Button>
            <div className="relative" ref={moreRef}>
              <Button variant="line" onClick={() => setMoreOpen((v) => !v)} aria-expanded={moreOpen}>
                More Actions
              </Button>
              {moreOpen ? (
                <div className="absolute right-0 z-30 mt-1 min-w-[240px] rounded-[12px] border border-[var(--v34-card-line)] bg-[var(--card)] p-1.5 shadow-lg">
                  <MoreItem
                    label="Notifications"
                    onClick={() => {
                      setOverlay("notifications");
                      setMoreOpen(false);
                    }}
                  />
                  <MoreItem
                    label="Drafts & Templates"
                    onClick={() => {
                      setOverlay("drafts");
                      setMoreOpen(false);
                    }}
                  />
                  <MoreItem
                    label="Refresh"
                    onClick={() => {
                      hydrate();
                      pushToast("Inbox refreshed.", "default");
                      setMoreOpen(false);
                    }}
                  />
                  <MoreItem
                    label={demoMode ? "Turn demo mode off" : "Turn demo mode on"}
                    onClick={() => {
                      if (!isManager) {
                        pushToast("Only managers can change demonstration mode.", "warn");
                        setMoreOpen(false);
                        return;
                      }
                      toggleDemoMode();
                    }}
                  />
                  <MoreItem
                    label={
                      demoRole === "manager" ? "Switch to staff role" : "Switch to manager role"
                    }
                    onClick={() => {
                      const next = demoRole === "manager" ? "staff" : "manager";
                      applyDemoRole(next);
                      setSelectedIds([]);
                      if (demoRole === "manager") setMainView("my-actions");
                      pushToast(
                        demoRole === "manager" ? "Staff view active." : "Manager view active.",
                        "default"
                      );
                      setMoreOpen(false);
                    }}
                  />
                  <MoreItem
                    label={
                      canSeeSensitive
                        ? "Sensitivity: switch to restricted"
                        : "Sensitivity: switch to full"
                    }
                    onClick={() => {
                      applySensitivity(!canSeeSensitive);
                      pushToast(
                        canSeeSensitive
                          ? "Restricted sensitivity view."
                          : "Full sensitivity view.",
                        "default"
                      );
                      setMoreOpen(false);
                    }}
                  />
                  {isManager ? (
                    <MoreItem label="Reset demonstration data" danger onClick={resetDemo} />
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[length:var(--type-control)] font-extrabold uppercase tracking-wide text-[var(--muted)]">
            Density
          </span>
          <Button
            small
            variant={density === "compact" ? "teal" : "line"}
            onClick={() => setDensity("compact")}
          >
            Compact
          </Button>
          <Button
            small
            variant={density === "comfortable" ? "teal" : "line"}
            onClick={() => setDensity("comfortable")}
          >
            Comfortable
          </Button>
          <Button small variant="soft" onClick={() => setOverlay("notifications")}>
            Notification Centre
            {unreadNotifs ? ` (${unreadNotifs})` : ""}
          </Button>
        </div>
      </header>

      <SummaryCards
        actions={actions}
        active={category === "all" ? null : (category as ActionCategory)}
        onSelect={onSummarySelect}
      />

      <div className="flex flex-wrap gap-1.5 rounded-[14px] border border-[var(--v34-card-line)] bg-[var(--card)] p-2">
        {visibleViews.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => {
              setMainView(v.id);
              setSelectedIds([]);
              setActiveSavedViewId(null);
            }}
            className={cn(
              "rounded-[10px] px-3 py-2 text-[12px] font-extrabold transition",
              mainView === v.id
                ? "bg-[#0f172a] text-white"
                : "bg-[var(--soft)] text-[#475569] hover:bg-[#eef2f7]"
            )}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {CATEGORY_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setCategory(t.id);
              setActiveSavedViewId(null);
            }}
            className={cn(
              "rounded-full px-3 py-1.5 text-[12px] font-bold transition",
              category === t.id
                ? "bg-[#2563eb] text-white"
                : "border border-[var(--line)] bg-[var(--card)] text-[#475569] hover:border-[#94a3b8]"
            )}
          >
            {t.label}
          </button>
        ))}
        {activeSavedViewId ? (
          <Badge tone="info">
            Saved view: {savedViews.find((v) => v.id === activeSavedViewId)?.name || "Active"}
          </Badge>
        ) : null}
      </div>

      <FiltersBar
        filters={filters}
        setFilters={setFilters}
        savedViews={savedViews}
        onApplyView={applySavedView}
        onSaveView={saveCurrentView}
        onTogglePin={(id) => {
          const next = savedViews.map((v) => (v.id === id ? { ...v, pinned: !v.pinned } : v));
          setSavedViews(next);
          saveSavedViews(next);
          pushToast("Saved view pin updated.", "default");
        }}
        onClear={clearFilters}
        clinics={CLINIC_OPTIONS}
        isManager={isManager}
      />

      {isManager && selectedIds.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-[12px] border border-[#bfdbfe] bg-[#eff6ff] px-3 py-2">
          <span className="text-[12px] font-extrabold text-[#1e3a8a]">
            {selectedIds.length} selected
          </span>
          <Button small variant="line" onClick={bulkReassign}>
            Reassign
          </Button>
          <Button small variant="line" onClick={bulkPriority}>
            Change priority
          </Button>
          <Button
            small
            variant="line"
            onClick={() => {
              if (selectedIds[0]) openReason("due", selectedIds[0]);
            }}
          >
            Change due date
          </Button>
          <Button small variant="line" onClick={bulkMarkRead}>
            Mark read
          </Button>
          <Button small variant="line" onClick={bulkWatch}>
            Add to Watching
          </Button>
          <Button small variant="line" onClick={bulkReminder}>
            Send reminder
          </Button>
          <Button small variant="line" onClick={() => setOverlay("export")}>
            Export selected
          </Button>
          <Button small variant="soft" onClick={() => setSelectedIds([])}>
            Clear selection
          </Button>
        </div>
      ) : null}

      <InboxList
        actions={filtered}
        density={density}
        canSeeSensitive={canSeeSensitive}
        isManager={isManager}
        selectedIds={selectedIds}
        expandedId={expandedId}
        onToggleSelect={toggleSelect}
        onToggleExpand={(id) => setExpandedId((cur) => (cur === id ? null : id))}
        onOpenReview={(id) => {
          setReviewId(id);
          patchAction(id, (a) => (a.unread ? { ...a, unread: false } : a));
          recordAudit(id, "Viewed", { detail: "Opened review panel" });
          bumpAudit();
        }}
        onQuick={onQuick}
        emptyKind={emptyKind}
        onEmptyAction={(act) => {
          if (act === "completed") setMainView("completed");
          if (act === "create") setOverlay("create");
          if (act === "refresh") {
            hydrate();
            pushToast("Inbox refreshed.", "default");
          }
          if (act === "clear") clearFilters();
          if (act === "edit") pushToast("Adjust filters above.", "default");
        }}
      />

      <ReviewPanel
        action={reviewAction}
        open={!!reviewId}
        canSeeSensitive={canSeeSensitive}
        isManager={isManager}
        auditKey={auditKey}
        onClose={() => setReviewId(null)}
        onAction={onReviewAction}
      />

      {overlay === "create" ? (
        <CreateActionWorkspace
          drafts={drafts}
          templates={templates}
          actions={actions}
          onClose={() => setOverlay(null)}
          onSaveDraft={(draft) => {
            const next = [draft, ...drafts.filter((d) => d.id !== draft.id)];
            setDrafts(next);
            saveDrafts(next);
            recordAudit(draft.id, "Draft saved", { detail: draft.title });
            pushToast("Draft saved.", "success");
          }}
          onSubmit={(action) => {
            persistActions([action, ...actions]);
            recordAudit(action.id, "Created", { detail: action.number });
            const notifs = pushNotification(
              {
                title: "New action created",
                reason: `${action.number}: ${action.title}`,
                actionId: action.id,
                actionNumber: action.number,
                clinicName: action.clinicName,
                at: nowIso(),
                priority: action.priority,
                kind: action.category === "Escalation" ? "escalation" : "routine",
                groupKey: "created",
              },
              notifications
            );
            persistNotifications(notifs);
            bumpAudit();
            setOverlay(null);
            setReviewId(action.id);
            pushToast(`${action.number} created.`, "success");
          }}
        />
      ) : null}

      {overlay === "notifications" ? (
        <NotificationCentre
          notifications={notifications}
          actions={actions}
          canSeeSensitive={canSeeSensitive}
          settings={settings}
          isManager={isManager}
          onClose={() => setOverlay(null)}
          onOpenAction={(actionId) => {
            setOverlay(null);
            setReviewId(actionId);
            const next = notifications.map((n) =>
              n.actionId === actionId ? { ...n, read: true } : n
            );
            persistNotifications(next);
            patchAction(actionId, (a) => (a.unread ? { ...a, unread: false } : a));
            recordAudit(actionId, "Viewed", { detail: "Opened from notification" });
            bumpAudit();
          }}
          onMarkRead={(id) => {
            if (!isManager) {
              pushToast("Open the related action to mark as read.", "warn");
              return;
            }
            const next = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
            persistNotifications(next);
            recordAudit(id, "Notification read");
          }}
          onOpenSettings={() => setOverlay("settings")}
        />
      ) : null}

      {overlay === "settings" ? (
        <NotificationSettingsPanel
          settings={settings}
          onClose={() => setOverlay(null)}
          onSave={(s) => {
            setSettings(s);
            saveSettings(s);
            setOverlay(null);
            pushToast("Notification settings saved.", "success");
          }}
        />
      ) : null}

      {overlay === "analytics" ? (
        <AnalyticsPanel
          actions={actions}
          canSeeSensitive={canSeeSensitive}
          onClose={() => setOverlay(null)}
          onDrillDown={(ids) => {
            setOverlay(null);
            setMainView("all-clinics");
            setFilters({ ...DEFAULT_FILTERS, search: "" });
            setSelectedIds(ids);
            if (ids[0]) setReviewId(ids[0]);
            pushToast(`Showing ${ids.length} drilled-down action(s).`, "default");
          }}
        />
      ) : null}

      {overlay === "export" ? (
        <ConfirmExportModal
          onClose={() => setOverlay(null)}
          onExport={onExport}
          isManager={isManager}
        />
      ) : null}

      {overlay === "delegations" ? (
        <DelegationsOverlay
          delegations={delegations}
          onClose={() => setOverlay(null)}
          onSave={(items) => {
            setDelegations(items);
            saveDelegations(items);
            pushToast("Delegations updated.", "success");
          }}
          onEnd={(id) => {
            const next = delegations.map((d) => (d.id === id ? { ...d, active: false } : d));
            setDelegations(next);
            saveDelegations(next);
            pushToast("Delegation ended.", "default");
          }}
        />
      ) : null}

      {overlay === "drafts" ? (
        <DraftsOverlay
          drafts={drafts}
          templates={templates}
          onClose={() => setOverlay(null)}
          onDeleteDraft={(id) => {
            const next = drafts.filter((d) => d.id !== id);
            setDrafts(next);
            saveDrafts(next);
            pushToast("Draft deleted.", "default");
          }}
          onOpenCreate={() => setOverlay("create")}
        />
      ) : null}

      {reason ? (
        <ReasonModal
          kind={reason.kind}
          action={reasonAction}
          staff={STAFF_DIRECTORY}
          onClose={() => setReason(null)}
          onSubmit={handleReasonSubmit}
        />
      ) : null}
    </div>
  );
}

function MoreItem({
  label,
  onClick,
  danger,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "block w-full rounded-[9px] px-3 py-2 text-left text-[12px] font-bold hover:bg-[#f1f5f9]",
        danger ? "text-[#b91c1c]" : "text-[#334155]"
      )}
    >
      {label}
    </button>
  );
}

function DelegationsOverlay({
  delegations,
  onClose,
  onSave,
  onEnd,
}: {
  delegations: DelegationRecord[];
  onClose: () => void;
  onSave: (items: DelegationRecord[]) => void;
  onEnd: (id: string) => void;
}) {
  const [fromOwner, setFromOwner] = useState(DEMO_USER.name);
  const [delegate, setDelegate] = useState(STAFF_DIRECTORY[1] || STAFF_DIRECTORY[0]);
  const [startDate, setStartDate] = useState(nowIso().slice(0, 10));
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const inputCls =
    "w-full rounded-[10px] border border-[var(--line)] bg-[var(--card)] px-2.5 py-2 text-[13px] text-[var(--ink)]";

  return (
    <Modal
      open
      title="Manage Delegations"
      onClose={onClose}
      footer={
        <Button variant="line" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="grid gap-4">
        <p className="m-0 text-sm text-[var(--muted)]">
          Time-bounded delegation keeps the original owner responsible. Active cover routes approval
          and ownership work to the nominated delegate.
        </p>
        <div className="grid gap-2 rounded-xl border border-[var(--line)] bg-[var(--soft)] p-3">
          <h4 className="m-0 text-[13px] font-extrabold">Create absence cover</h4>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="grid gap-1 text-[12px] font-bold">
              From owner
              <select
                className={inputCls}
                value={fromOwner}
                onChange={(e) => setFromOwner(e.target.value)}
              >
                {STAFF_DIRECTORY.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-[12px] font-bold">
              Delegate
              <select
                className={inputCls}
                value={delegate}
                onChange={(e) => setDelegate(e.target.value)}
              >
                {STAFF_DIRECTORY.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-[12px] font-bold">
              Start
              <input
                type="date"
                className={inputCls}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </label>
            <label className="grid gap-1 text-[12px] font-bold">
              End
              <input
                type="date"
                className={inputCls}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </label>
          </div>
          <label className="grid gap-1 text-[12px] font-bold">
            Reason
            <textarea
              className={inputCls + " min-h-[72px]"}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <Button
            variant="teal"
            onClick={() => {
              if (!reason.trim() || !endDate) return;
              const item: DelegationRecord = {
                id: uid("del"),
                fromOwner,
                delegate,
                startDate,
                endDate,
                reason,
                canComplete: true,
                canFurtherDelegate: false,
                sendUpdatesToOwner: true,
                active: true,
              };
              onSave([item, ...delegations]);
              setReason("");
            }}
          >
            Save Delegation
          </Button>
        </div>

        <div className="grid gap-2">
          <h4 className="m-0 text-[13px] font-extrabold">Active & recent</h4>
          {delegations.length === 0 ? (
            <p className="m-0 text-sm text-[#94a3b8]">No delegations yet.</p>
          ) : (
            delegations.map((d) => (
              <div
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--line)] bg-[var(--card)] px-3 py-2 text-sm"
              >
                <div>
                  <strong>
                    {d.fromOwner} → {d.delegate}
                  </strong>
                  <div className="text-[length:var(--type-control)] text-[var(--muted)]">
                    {d.startDate} – {d.endDate} · {d.active ? "Active" : "Ended"} · {d.reason}
                  </div>
                </div>
                {d.active ? (
                  <Button small variant="line" onClick={() => onEnd(d.id)}>
                    End early
                  </Button>
                ) : (
                  <Badge tone="default">Ended</Badge>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}

function DraftsOverlay({
  drafts,
  templates,
  onClose,
  onDeleteDraft,
  onOpenCreate,
}: {
  drafts: ActionDraft[];
  templates: ActionTemplate[];
  onClose: () => void;
  onDeleteDraft: (id: string) => void;
  onOpenCreate: () => void;
}) {
  return (
    <Modal
      open
      title="Drafts & Templates"
      onClose={onClose}
      footer={
        <>
          <Button variant="line" onClick={onClose}>
            Close
          </Button>
          <Button variant="teal" onClick={onOpenCreate}>
            Create Action
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <section>
          <h4 className="m-0 mb-2 text-[13px] font-extrabold">Your drafts</h4>
          {drafts.length === 0 ? (
            <p className="m-0 text-sm text-[#94a3b8]">No drafts saved.</p>
          ) : (
            drafts.map((d) => (
              <div
                key={d.id}
                className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--line)] bg-[var(--card)] px-3 py-2 text-sm"
              >
                <div>
                  <strong>{d.title || "Untitled draft"}</strong>
                  <div className="text-[length:var(--type-control)] text-[var(--muted)]">
                    {d.category} · updated {formatDateTime(d.updatedAt)}
                    {d.isPrivate ? " · Private" : ""}
                  </div>
                </div>
                <Button small variant="danger" onClick={() => onDeleteDraft(d.id)}>
                  Delete
                </Button>
              </div>
            ))
          )}
        </section>
        <section>
          <h4 className="m-0 mb-2 text-[13px] font-extrabold">Templates</h4>
          {templates.map((t) => (
            <div
              key={t.id}
              className="mb-2 rounded-lg border border-[var(--line)] bg-[var(--card)] px-3 py-2 text-sm"
            >
              <strong>{t.name}</strong>
              <div className="text-[length:var(--type-control)] text-[var(--muted)]">
                {t.scope} · {t.category} — {t.description}
              </div>
            </div>
          ))}
        </section>
      </div>
    </Modal>
  );
}
