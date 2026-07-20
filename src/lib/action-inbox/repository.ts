import {
  SEED_ACTIONS,
  SEED_AUDIT,
  SEED_DELEGATIONS,
  SEED_DRAFTS,
  SEED_NOTIFICATIONS,
  SEED_SAVED_VIEWS,
  SEED_TEMPLATES,
} from "./mock-data";
import {
  clearAllModule2Storage,
  migrateLegacyM2Storage,
  M2_STORAGE,
  notifyInboxChanged,
  readJson,
  safeParseArray,
  writeJson,
} from "./storage";
import type {
  ActionDraft,
  ActionTemplate,
  AuditEntry,
  AuditEventType,
  DelegationRecord,
  InboxAction,
  InboxNotification,
  NotificationSettings,
  SavedView,
} from "./types";
import { DEFAULT_NOTIFICATION_SETTINGS, DEMO_USER } from "./types";
import { canSnooze, isOverdue, nextWorkingDayIso, nowIso, uid } from "./utils";

function cloneActions(seed = SEED_ACTIONS): InboxAction[] {
  return seed.map((a) => ({
    ...a,
    attachments: a.attachments.map((x) => ({ ...x })),
    comments: a.comments.map((x) => ({ ...x })),
    relatedRecords: a.relatedRecords.map((x) => ({ ...x })),
    approvalSteps: a.approvalSteps.map((x) => ({ ...x })),
    watchers: [...a.watchers],
    ownershipHistory: a.ownershipHistory.map((x) => ({ ...x })),
    linkedFollowUps: [...a.linkedFollowUps],
    completionRequirements: [...a.completionRequirements],
    notificationMethods: [...a.notificationMethods],
  }));
}

function isValidAction(a: unknown): a is InboxAction {
  if (!a || typeof a !== "object") return false;
  const row = a as Partial<InboxAction>;
  return Boolean(row.id && row.number && row.title && row.category && row.status);
}

export function loadActions(): InboxAction[] {
  migrateLegacyM2Storage();
  try {
    const stored = readJson<InboxAction[] | null>(M2_STORAGE.actions, null);
    if (stored && Array.isArray(stored) && stored.length) {
      const valid = stored.filter(isValidAction);
      if (valid.length) return valid;
    }
  } catch {
    /* fall through to seed */
  }
  const seed = cloneActions();
  writeJson(M2_STORAGE.actions, seed);
  notifyInboxChanged();
  return seed;
}

export function saveActions(actions: InboxAction[]) {
  writeJson(M2_STORAGE.actions, actions);
  notifyInboxChanged();
}

export function resetActionsToSeed() {
  clearAllModule2Storage();
  const seed = cloneActions();
  writeJson(M2_STORAGE.actions, seed);
  writeJson(M2_STORAGE.notifications, SEED_NOTIFICATIONS.map((n) => ({ ...n })));
  writeJson(M2_STORAGE.audit, SEED_AUDIT.map((a) => ({ ...a })));
  writeJson(M2_STORAGE.delegations, SEED_DELEGATIONS.map((d) => ({ ...d })));
  writeJson(M2_STORAGE.drafts, SEED_DRAFTS.map((d) => ({ ...d })));
  writeJson(M2_STORAGE.templates, SEED_TEMPLATES.map((t) => ({ ...t })));
  writeJson(M2_STORAGE.savedViews, SEED_SAVED_VIEWS.map((v) => ({ ...v })));
  writeJson(M2_STORAGE.settings, DEFAULT_NOTIFICATION_SETTINGS);
  writeJson(M2_STORAGE.demoMode, true);
  notifyInboxChanged();
  return seed;
}

export function loadNotifications(): InboxNotification[] {
  migrateLegacyM2Storage();
  try {
    const stored = readJson<InboxNotification[] | null>(M2_STORAGE.notifications, null);
    const list = safeParseArray(stored, []);
    if (list.length) return list;
  } catch {
    /* fall through */
  }
  const seed = SEED_NOTIFICATIONS.map((n) => ({ ...n }));
  writeJson(M2_STORAGE.notifications, seed);
  return seed;
}

export function saveNotifications(items: InboxNotification[]) {
  writeJson(M2_STORAGE.notifications, items);
}

export function loadSettings(): NotificationSettings {
  return readJson(M2_STORAGE.settings, DEFAULT_NOTIFICATION_SETTINGS);
}

export function saveSettings(settings: NotificationSettings) {
  writeJson(M2_STORAGE.settings, settings);
}

export function loadDrafts(): ActionDraft[] {
  return readJson(M2_STORAGE.drafts, SEED_DRAFTS.map((d) => ({ ...d })));
}

export function saveDrafts(drafts: ActionDraft[]) {
  writeJson(M2_STORAGE.drafts, drafts);
}

export function loadTemplates(): ActionTemplate[] {
  return readJson(M2_STORAGE.templates, SEED_TEMPLATES.map((t) => ({ ...t })));
}

export function loadSavedViews(): SavedView[] {
  return readJson(M2_STORAGE.savedViews, SEED_SAVED_VIEWS.map((v) => ({ ...v })));
}

export function saveSavedViews(views: SavedView[]) {
  writeJson(M2_STORAGE.savedViews, views);
}

export function loadDelegations(): DelegationRecord[] {
  return readJson(M2_STORAGE.delegations, SEED_DELEGATIONS.map((d) => ({ ...d })));
}

export function saveDelegations(items: DelegationRecord[]) {
  writeJson(M2_STORAGE.delegations, items);
}

export function loadAudit(): AuditEntry[] {
  return readJson(M2_STORAGE.audit, SEED_AUDIT.map((a) => ({ ...a })));
}

export function appendAudit(
  entry: Omit<AuditEntry, "id">,
  existing?: AuditEntry[]
): AuditEntry[] {
  const next: AuditEntry = { ...entry, id: uid("aud") };
  const all = [next, ...(existing ?? loadAudit())];
  writeJson(M2_STORAGE.audit, all);
  return all;
}

export function recordAudit(
  actionId: string,
  event: AuditEventType,
  detail?: Partial<AuditEntry>
) {
  return appendAudit({
    actionId,
    event,
    user: DEMO_USER.name,
    at: nowIso(),
    ...detail,
  });
}

export function pushNotification(
  partial: Omit<InboxNotification, "id" | "read"> & { read?: boolean },
  list?: InboxNotification[]
): InboxNotification[] {
  const next: InboxNotification = {
    ...partial,
    id: uid("n"),
    read: partial.read ?? false,
  };
  const all = [next, ...(list ?? loadNotifications())];
  saveNotifications(all);
  return all;
}

export function updateAction(
  actions: InboxAction[],
  id: string,
  updater: (a: InboxAction) => InboxAction
): InboxAction[] {
  return actions.map((a) => (a.id === id ? updater(a) : a));
}

export function findActiveDelegate(owner: string, delegations: DelegationRecord[]): string | null {
  const today = nowIso().slice(0, 10);
  const hit = delegations.find(
    (d) =>
      d.active &&
      d.fromOwner === owner &&
      !d.actionId &&
      d.startDate <= today &&
      d.endDate >= today
  );
  return hit?.delegate ?? null;
}

/** Apply overdue escalation side-effects for open overdue actions */
export function applyOverdueEffects(
  actions: InboxAction[],
  notifications: InboxNotification[]
): { actions: InboxAction[]; notifications: InboxNotification[] } {
  let notifs = notifications;
  const next = actions.map((a) => {
    if (!isOverdue(a) || ["Completed", "Archived", "Withdrawn", "Rejected"].includes(a.status)) {
      return a;
    }
    let level = a.escalationLevel;
    if (level < 1) level = 1;
    const updated = {
      ...a,
      escalationLevel: level as InboxAction["escalationLevel"],
      overdueNotified: true,
      category: level >= 2 && a.category !== "Escalation" ? a.category : a.category,
    };
    if (!a.overdueNotified) {
      notifs = pushNotification(
        {
          title: "Action overdue",
          reason: `${a.number} is overdue — owner and requester notified`,
          actionId: a.id,
          actionNumber: a.number,
          clinicName: a.clinicName,
          at: nowIso(),
          priority: a.priority === "Low" ? "Medium" : a.priority,
          kind: "urgent",
        },
        notifs
      );
    }
    return updated;
  });
  saveActions(next);
  return { actions: next, notifications: notifs };
}

export function escalateAction(
  action: InboxAction,
  reason: string,
  newDue?: string
): InboxAction {
  const level = Math.min(4, (action.escalationLevel || 0) + 1) as InboxAction["escalationLevel"];
  const owners: Record<number, string> = {
    1: action.owner,
    2: action.owner,
    3: "Alex Chen",
    4: "Jordan Blake",
  };
  return {
    ...action,
    escalationLevel: level,
    category: level >= 2 ? "Escalation" : action.category,
    owner: level >= 3 ? owners[level] : action.owner,
    dueAt: newDue || action.dueAt,
    unread: true,
    notes: `${action.notes}\nEscalation L${level}: ${reason}`.trim(),
  };
}

export function approveStep(
  action: InboxAction,
  actor: string,
  note: string,
  allowSelfApprove: boolean,
  selfReason?: string
): { action: InboxAction; error?: string; selfApproved?: boolean } {
  const steps = action.approvalSteps.map((s) => ({ ...s }));
  const pending = steps.find((s) => s.status === "Pending");
  if (!pending) return { action, error: "No pending approval step." };

  const isSelf = pending.approver === action.requestedBy && actor === action.requestedBy;
  const isOwnerSelf = actor === action.requestedBy && pending.approver === actor;
  if ((isSelf || isOwnerSelf) && !allowSelfApprove) {
    return {
      action,
      error:
        "Self-approval is normally prevented. Enable exceptional self-approval only when no other authorised approver is available.",
    };
  }

  if (pending.approver !== actor && !allowSelfApprove) {
    // Check delegation redirect
    const dels = loadDelegations();
    const del = dels.find(
      (d) =>
        d.active &&
        d.fromOwner === pending.approver &&
        d.delegate === actor &&
        d.startDate <= nowIso().slice(0, 10) &&
        d.endDate >= nowIso().slice(0, 10)
    );
    if (del) {
      pending.redirectedTo = actor;
      pending.status = "Redirected";
      // treat as approval by delegate
    } else if (pending.approver !== actor) {
      return { action, error: `This step requires ${pending.approver} (or their nominated delegate).` };
    }
  }

  const selfApproved = allowSelfApprove && pending.approver === actor && actor === action.requestedBy;
  pending.status = "Approved";
  pending.decidedAt = nowIso();
  pending.decisionNote = note;
  pending.selfApproved = selfApproved;

  const stillPending = steps.some((s) => s.status === "Pending");
  const next: InboxAction = {
    ...action,
    approvalSteps: steps.map((s) =>
      s.id === pending.id
        ? {
            ...pending,
            status: "Approved",
          }
        : s
    ),
    status: stillPending ? "Awaiting Approval" : action.managerVerificationRequired ? "Awaiting Verification" : "Completed",
    completedAt: stillPending ? action.completedAt : nowIso(),
    unread: false,
    outcome: stillPending ? action.outcome : "Approved",
  };

  return { action: next, selfApproved };
}

export function rejectAction(
  action: InboxAction,
  reason: string,
  mode: "close" | "return"
): InboxAction {
  const steps = action.approvalSteps.map((s) =>
    s.status === "Pending"
      ? { ...s, status: "Rejected" as const, decidedAt: nowIso(), decisionNote: reason }
      : s
  );
  if (mode === "return") {
    return {
      ...action,
      approvalSteps: steps,
      status: "Returned for Correction",
      notes: `${action.notes}\nReturned: ${reason}`.trim(),
      unread: true,
    };
  }
  return {
    ...action,
    approvalSteps: steps,
    status: "Rejected",
    completedAt: nowIso(),
    outcome: "Rejected",
    notes: `${action.notes}\nRejected: ${reason}`.trim(),
  };
}

export function completeAction(
  action: InboxAction,
  note: string,
  outcome: string
): { action: InboxAction; error?: string } {
  if (!note.trim()) return { action, error: "Completion note is required." };
  if (action.evidenceRequired && !action.attachments.length) {
    return { action, error: "Evidence attachment is required before completion." };
  }
  if (action.acknowledgementRequired && !action.acknowledgedAt) {
    return { action, error: "Acknowledgement is required before completion." };
  }
  if (action.approvalSteps.some((s) => s.status === "Pending")) {
    return { action, error: "All approval steps must be completed." };
  }
  for (const req of action.completionRequirements) {
    if (req.toLowerCase().includes("checklist") && !action.checklistComplete) {
      return { action, error: "Completion checklist must be finished." };
    }
  }

  if (action.managerVerificationRequired && !action.verifiedAt) {
    return {
      action: {
        ...action,
        status: "Awaiting Verification",
        completionNote: note,
        outcome,
        unread: false,
      },
    };
  }

  return {
    action: {
      ...action,
      status: "Completed",
      completionNote: note,
      outcome,
      completedAt: nowIso(),
      unread: false,
    },
  };
}

export function archiveCompleted(actions: InboxAction[], days = 30): InboxAction[] {
  const cutoff = Date.now() - days * 86400000;
  return actions.map((a) => {
    if (a.status === "Completed" && a.completedAt && Date.parse(a.completedAt) < cutoff) {
      return { ...a, status: "Archived" as const, archivedAt: nowIso() };
    }
    return a;
  });
}

export function changeDueDate(action: InboxAction, newDue: string, reason: string): InboxAction {
  return {
    ...action,
    dueAt: newDue,
    snoozedUntil: undefined,
    notes: `${action.notes}\nDue date changed: ${reason}`.trim(),
    unread: true,
  };
}

export function applySnooze(
  action: InboxAction,
  optionId: string,
  customIso?: string
): { action: InboxAction; error?: string } {
  if (!canSnooze(action)) {
    return {
      action,
      error: "Snooze is not allowed for urgent, overdue, escalated or mandatory reminders.",
    };
  }
  let until: string;
  const now = new Date();
  switch (optionId) {
    case "1h":
      until = new Date(now.getTime() + 3600000).toISOString();
      break;
    case "later-today":
      until = new Date(now.getTime() + 4 * 3600000).toISOString();
      break;
    case "tomorrow":
      until = new Date(now.getTime() + 86400000).toISOString();
      break;
    case "next-working-day":
      until = nextWorkingDayIso(now);
      break;
    case "next-week":
      until = new Date(now.getTime() + 7 * 86400000).toISOString();
      break;
    case "custom":
      if (!customIso) return { action, error: "Choose an approved date and time." };
      until = customIso;
      break;
    default:
      return { action, error: "Unknown snooze option." };
  }
  return {
    action: {
      ...action,
      snoozedUntil: until,
      reminderAt: until,
    },
  };
}

export function nextActionNumber(actions: InboxAction[]): string {
  const nums = actions
    .map((a) => Number(a.number.replace(/\D/g, "").slice(-4)))
    .filter((n) => Number.isFinite(n));
  const max = nums.length ? Math.max(...nums) : 1000;
  return `ACT-2026-${max + 1}`;
}

export function findPossibleDuplicates(
  actions: InboxAction[],
  title: string,
  clinicId: string
): InboxAction[] {
  const t = title.trim().toLowerCase();
  if (t.length < 4) return [];
  return actions.filter(
    (a) =>
      !["Completed", "Archived", "Withdrawn", "Rejected"].includes(a.status) &&
      a.clinicId === clinicId &&
      (a.title.toLowerCase().includes(t.slice(0, 12)) || t.includes(a.title.toLowerCase().slice(0, 12)))
  );
}

export function readDemoMode(): boolean {
  return readJson(M2_STORAGE.demoMode, true);
}

export function writeDemoMode(on: boolean) {
  writeJson(M2_STORAGE.demoMode, on);
}
