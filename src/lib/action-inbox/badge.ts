import { loadActions } from "./repository";
import { M2_INBOX_CHANGED_EVENT } from "./storage";
import type { InboxAction } from "./types";
import { DEMO_USER } from "./types";
import { isOverdue, isUrgent } from "./utils";

const CLOSED = new Set(["Completed", "Archived", "Withdrawn", "Rejected"]);

/** Open inbox items relevant to the demonstration user (owner or active delegate). */
export function isBadgeRelevant(action: InboxAction, user = DEMO_USER.name): boolean {
  if (CLOSED.has(action.status)) return false;
  // Drafts never enter the inbox store; treat On Hold / Returned as still open.
  return action.owner === user || action.delegatedTo === user;
}

export function computeBadgeStats(actions: InboxAction[], user = DEMO_USER.name) {
  const open = actions.filter((a) => isBadgeRelevant(a, user));
  const urgent = open.some((a) => isOverdue(a) || isUrgent(a) || a.priority === "Urgent");
  return { count: open.length, urgent };
}

export type InboxBadgeSnapshot = { count: number; urgent: boolean };

/** Safe for SSR / first paint — never throws. */
export function getInboxBadgeSnapshot(): InboxBadgeSnapshot {
  if (typeof window === "undefined") return { count: 0, urgent: false };
  try {
    const actions = loadActions();
    return computeBadgeStats(actions);
  } catch {
    return { count: 0, urgent: false };
  }
}

export function subscribeInboxBadge(listener: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const onChange = () => listener();
  window.addEventListener(M2_INBOX_CHANGED_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(M2_INBOX_CHANGED_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
