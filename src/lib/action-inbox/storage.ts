import { readJson, writeJson } from "@/lib/command-centre/storage";

/** Canonical Module 2 localStorage prefix — all keys use pulse.m2.inbox.* */
export const M2_PREFIX = "pulse.m2.inbox.";

export const M2_STORAGE = {
  actions: `${M2_PREFIX}actions`,
  notifications: `${M2_PREFIX}notifications`,
  settings: `${M2_PREFIX}notificationSettings`,
  drafts: `${M2_PREFIX}drafts`,
  templates: `${M2_PREFIX}templates`,
  savedViews: `${M2_PREFIX}savedViews`,
  delegations: `${M2_PREFIX}delegations`,
  audit: `${M2_PREFIX}audit`,
  ui: `${M2_PREFIX}ui`,
  demoMode: `${M2_PREFIX}demoMode`,
  role: `${M2_PREFIX}demoRole`,
  sensitivity: `${M2_PREFIX}canSeeSensitive`,
} as const;

/** Legacy keys that may exist from earlier builds (migrate once, then remove). */
const LEGACY_KEY_MAP: Record<string, string> = {
  "pulse.m2.actions": M2_STORAGE.actions,
  "pulse.m2.notifications": M2_STORAGE.notifications,
  "pulse.m2.notificationSettings": M2_STORAGE.settings,
  "pulse.m2.drafts": M2_STORAGE.drafts,
  "pulse.m2.templates": M2_STORAGE.templates,
  "pulse.m2.savedViews": M2_STORAGE.savedViews,
  "pulse.m2.delegations": M2_STORAGE.delegations,
  "pulse.m2.audit": M2_STORAGE.audit,
  "pulse.m2.ui": M2_STORAGE.ui,
  "pulse.m2.demoMode": M2_STORAGE.demoMode,
};

let migrated = false;

/** One-time migration from legacy pulse.m2.* keys into pulse.m2.inbox.* */
export function migrateLegacyM2Storage() {
  if (typeof window === "undefined" || migrated) return;
  migrated = true;
  try {
    for (const [legacy, canonical] of Object.entries(LEGACY_KEY_MAP)) {
      const existing = window.localStorage.getItem(canonical);
      const old = window.localStorage.getItem(legacy);
      if (old != null && existing == null) {
        window.localStorage.setItem(canonical, old);
      }
      if (old != null) window.localStorage.removeItem(legacy);
    }
  } catch {
    /* ignore */
  }
}

/** Remove every Module 2 key (inbox + any leftover pulse.m2.*) without touching Module 1. */
export function clearAllModule2Storage() {
  if (typeof window === "undefined") return;
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key) continue;
      if (key.startsWith("pulse.m2.")) toRemove.push(key);
    }
    toRemove.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}

export function safeParseArray<T>(raw: unknown, fallback: T[]): T[] {
  if (!Array.isArray(raw)) return fallback;
  return raw as T[];
}

export { readJson, writeJson };

export const M2_INBOX_CHANGED_EVENT = "pulse.m2.inbox.changed";

export function notifyInboxChanged() {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent(M2_INBOX_CHANGED_EVENT));
  } catch {
    /* ignore */
  }
}
