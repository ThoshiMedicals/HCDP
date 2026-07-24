/** Safe SSR/client badge snapshots — never read localStorage until after hydrate. */

import { loadActions } from "./repository";
import { M2_INBOX_CHANGED_EVENT } from "./storage";
import type { InboxAction } from "./types";
import { DEMO_USER } from "./types";
import { isOverdue, isUrgent } from "./utils";

const CLOSED = new Set(["Completed", "Archived", "Withdrawn", "Rejected"]);

const SERVER_SNAPSHOT = Object.freeze({ count: 0, urgent: false });

let badgeCache: { count: number; urgent: boolean } = SERVER_SNAPSHOT;
let badgeHydrated = false;
const badgeListeners = new Set<() => void>();

/** Open inbox items relevant to the demonstration user (owner or active delegate). */
export function isBadgeRelevant(action: InboxAction, user = DEMO_USER.name): boolean {
  if (CLOSED.has(action.status)) return false;
  return action.owner === user || action.delegatedTo === user;
}

export function computeBadgeStats(actions: InboxAction[], user = DEMO_USER.name) {
  const open = actions.filter((a) => isBadgeRelevant(a, user));
  const urgent = open.some((a) => isOverdue(a) || isUrgent(a) || a.priority === "Urgent");
  return { count: open.length, urgent };
}

export type InboxBadgeSnapshot = { count: number; urgent: boolean };

/** Stable for SSR and first client paint — matches getServerSnapshot. */
export function getInboxBadgeSnapshot(): InboxBadgeSnapshot {
  if (!badgeHydrated) return SERVER_SNAPSHOT;
  return badgeCache;
}

export function getInboxBadgeServerSnapshot(): InboxBadgeSnapshot {
  return SERVER_SNAPSHOT;
}

function emitBadge() {
  badgeListeners.forEach((l) => l());
}

/** Call once after mount (and on inbox change) to load real counts. */
export function hydrateInboxBadge(): InboxBadgeSnapshot {
  if (typeof window === "undefined") return SERVER_SNAPSHOT;
  try {
    badgeCache = computeBadgeStats(loadActions());
  } catch {
    badgeCache = SERVER_SNAPSHOT;
  }
  badgeHydrated = true;
  emitBadge();
  return badgeCache;
}

export function subscribeInboxBadge(listener: () => void): () => void {
  badgeListeners.add(listener);
  if (typeof window === "undefined") {
    return () => {
      badgeListeners.delete(listener);
    };
  }
  const onChange = () => {
    hydrateInboxBadge();
  };
  window.addEventListener(M2_INBOX_CHANGED_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    badgeListeners.delete(listener);
    window.removeEventListener(M2_INBOX_CHANGED_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
