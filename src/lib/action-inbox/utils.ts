import type {
  ActionCategory,
  ActionPriority,
  CategoryFilter,
  InboxAction,
  InboxFilters,
  MainView,
} from "./types";
import { DEMO_USER } from "./types";

export function nowIso() {
  return new Date().toISOString();
}

export function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function parseDue(dueAt: string): number {
  const t = Date.parse(dueAt);
  return Number.isFinite(t) ? t : 0;
}

export function isOverdue(action: InboxAction, now = Date.now()): boolean {
  if (["Completed", "Archived", "Withdrawn", "Rejected"].includes(action.status)) return false;
  if (action.snoozedUntil && Date.parse(action.snoozedUntil) > now) return false;
  return parseDue(action.dueAt) < now;
}

export function isDueToday(action: InboxAction, now = new Date()): boolean {
  if (["Completed", "Archived", "Withdrawn", "Rejected"].includes(action.status)) return false;
  const d = new Date(action.dueAt);
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function isUrgent(action: InboxAction): boolean {
  return action.priority === "Urgent" || action.escalationLevel >= 3;
}

export function priorityRank(p: ActionPriority): number {
  switch (p) {
    case "Urgent":
      return 0;
    case "High":
      return 1;
    case "Medium":
      return 2;
    default:
      return 3;
  }
}

/** Default sort: most overdue → highest priority → closest due date */
export function sortInbox(actions: InboxAction[], now = Date.now()): InboxAction[] {
  return [...actions].sort((a, b) => {
    const aOver = isOverdue(a, now);
    const bOver = isOverdue(b, now);
    if (aOver !== bOver) return aOver ? -1 : 1;
    if (aOver && bOver) {
      const overdueDiff = parseDue(a.dueAt) - parseDue(b.dueAt);
      if (overdueDiff !== 0) return overdueDiff;
    }
    const pr = priorityRank(a.priority) - priorityRank(b.priority);
    if (pr !== 0) return pr;
    return parseDue(a.dueAt) - parseDue(b.dueAt);
  });
}

export function timeRemainingLabel(dueAt: string, now = Date.now()): string {
  const due = parseDue(dueAt);
  const diff = due - now;
  const abs = Math.abs(diff);
  const mins = Math.round(abs / 60000);
  const hours = Math.round(abs / 3600000);
  const days = Math.round(abs / 86400000);
  if (diff < 0) {
    if (mins < 60) return `${mins}m overdue`;
    if (hours < 48) return `${hours}h overdue`;
    return `${days}d overdue`;
  }
  if (mins < 60) return `${mins}m remaining`;
  if (hours < 48) return `${hours}h remaining`;
  return `${days}d remaining`;
}

export function categoryColor(cat: ActionCategory): string {
  switch (cat) {
    case "Approval":
      return "#2563eb";
    case "Exception":
      return "#d97706";
    case "Escalation":
      return "#dc2626";
    case "Reminder":
      return "#7c3aed";
  }
}

export function categorySoft(cat: ActionCategory): string {
  switch (cat) {
    case "Approval":
      return "#eff6ff";
    case "Exception":
      return "#fffbeb";
    case "Escalation":
      return "#fef2f2";
    case "Reminder":
      return "#f5f3ff";
  }
}

export function categoryIcon(cat: ActionCategory): string {
  switch (cat) {
    case "Approval":
      return "✓";
    case "Exception":
      return "!";
    case "Escalation":
      return "↑";
    case "Reminder":
      return "⏰";
  }
}

export function matchesMainView(action: InboxAction, view: MainView, user = DEMO_USER.name): boolean {
  const terminal = ["Completed", "Archived", "Withdrawn", "Rejected"].includes(action.status);
  switch (view) {
    case "my-actions":
      return (
        !terminal &&
        action.status !== "Archived" &&
        (action.owner === user || action.delegatedTo === user)
      );
    case "my-team":
      return !terminal && action.team === DEMO_USER.team;
    case "all-clinics":
      return !terminal && action.status !== "Archived";
    case "delegated-by-me":
      return !terminal && !!action.delegatedByMe;
    case "watching":
      return !terminal && action.watchers.includes(user);
    case "completed":
      return action.status === "Completed";
    case "archive":
      return action.status === "Archived";
    default:
      return true;
  }
}

export function matchesCategory(action: InboxAction, cat: CategoryFilter): boolean {
  if (cat === "all") return true;
  return action.category === cat;
}

export function matchesFilters(
  action: InboxAction,
  filters: InboxFilters,
  user = DEMO_USER.name,
  canSeeSensitive = true
): boolean {
  const restricted = !canViewSensitive(action, canSeeSensitive);

  if (filters.clinicId && action.clinicId !== filters.clinicId) return false;
  if (filters.category && action.category !== filters.category) return false;
  if (filters.status && action.status !== filters.status) return false;
  if (filters.priority && action.priority !== filters.priority) return false;

  // Do not match restricted records on owner/requester/attachment/comment text.
  if (restricted) {
    if (filters.owner || filters.requester) return false;
  } else {
    if (filters.owner && !action.owner.toLowerCase().includes(filters.owner.toLowerCase()))
      return false;
    if (
      filters.requester &&
      !action.requestedBy.toLowerCase().includes(filters.requester.toLowerCase())
    )
      return false;
  }

  if (filters.dueFrom && parseDue(action.dueAt) < Date.parse(filters.dueFrom)) return false;
  if (filters.dueTo && parseDue(action.dueAt) > Date.parse(filters.dueTo + "T23:59:59")) return false;
  if (filters.overdueOnly && !isOverdue(action)) return false;
  if (filters.escalationLevel !== "" && action.escalationLevel !== filters.escalationLevel)
    return false;
  if (filters.delegatedOnly && !action.delegatedTo) return false;
  if (filters.watchedOnly && !action.watchers.includes(user)) return false;
  if (filters.hasAttachments && !action.attachments.length) return false;
  if (filters.awaitingVerification && action.status !== "Awaiting Verification") return false;

  const q = filters.search.trim().toLowerCase();
  if (q) {
    if (restricted) {
      // Unauthorised users may only match on action number (never title/owner/body/attachments).
      if (!action.number.toLowerCase().includes(q)) return false;
    } else {
      const hay = [
        action.title,
        action.number,
        action.owner,
        action.requestedBy,
        action.clinicName,
        action.category,
        action.status,
        action.explanation,
        ...action.comments.map((c) => c.body),
        ...action.attachments.map((a) => a.name),
        ...action.relatedRecords.map((r) => r.label + " " + r.ref),
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
  }
  return true;
}

export function canViewSensitive(action: InboxAction, canSeeSensitive: boolean): boolean {
  if (action.sensitivity === "Standard") return true;
  return canSeeSensitive;
}

/** Mask notification copy so restricted titles/reasons never surface. */
export function maskNotificationForSensitivity(
  notification: { title: string; reason: string; actionId: string },
  actions: InboxAction[],
  canSeeSensitive: boolean
): { title: string; reason: string } {
  const action = actions.find((a) => a.id === notification.actionId);
  if (!action || canViewSensitive(action, canSeeSensitive)) {
    return { title: notification.title, reason: notification.reason };
  }
  return {
    title: "Restricted Action",
    reason: "Details hidden — you do not have permission for this sensitivity level.",
  };
}

export function displayTitle(action: InboxAction, canSeeSensitive: boolean): string {
  return canViewSensitive(action, canSeeSensitive) ? action.title : "Restricted Action";
}

export function isLockedAction(action: InboxAction): boolean {
  return ["Completed", "Archived", "Withdrawn", "Rejected"].includes(action.status);
}

export function summaryStats(actions: InboxAction[], category: ActionCategory) {
  const open = actions.filter(
    (a) =>
      a.category === category &&
      !["Completed", "Archived", "Withdrawn", "Rejected"].includes(a.status)
  );
  const overdue = open.filter((a) => isOverdue(a)).length;
  const dueToday = open.filter((a) => isDueToday(a)).length;
  const urgent = open.filter((a) => isUrgent(a)).length;
  // Demo period change vs previous comparable period
  const changeMap: Record<ActionCategory, number> = {
    Approval: 2,
    Exception: -1,
    Escalation: 1,
    Reminder: 0,
  };
  return {
    total: open.length,
    overdue,
    dueToday,
    urgent,
    change: changeMap[category],
  };
}

export function snoozeOptions(): { id: string; label: string; hours?: number; nextWorkingDay?: boolean; custom?: boolean }[] {
  return [
    { id: "1h", label: "One hour", hours: 1 },
    { id: "later-today", label: "Later today", hours: 4 },
    { id: "tomorrow", label: "Tomorrow", hours: 24 },
    { id: "next-working-day", label: "Next working day", nextWorkingDay: true },
    { id: "next-week", label: "Next week", hours: 24 * 7 },
    { id: "custom", label: "Approved date and time", custom: true },
  ];
}

export function canSnooze(action: InboxAction): boolean {
  if (!action.snoozeAllowed) return false;
  if (action.mandatoryReminder) return false;
  if (action.priority === "Urgent") return false;
  if (isOverdue(action)) return false;
  if (action.escalationLevel > 0 || action.category === "Escalation") return false;
  return true;
}

export function nextWorkingDayIso(from = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + 1);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

export function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function emptyFilters(): boolean {
  return true;
}
