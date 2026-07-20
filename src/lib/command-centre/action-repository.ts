import type { CommandAction, TimelineEvent } from "./types";
import { COMMAND_ACTIONS } from "./mock-data";
import { CC_STORAGE, readJson, writeJson } from "./storage";

/**
 * Module 1 action repository — single source of truth for Command Centre
 * action cards, Full Action File, executive links, completed items and reports.
 * Intentionally separate from Module 2 Action Inbox (`ACTION_ITEMS`).
 */
export interface ActionAuditEntry {
  id: string;
  actionId: string;
  event: string;
  user: string;
  at: string;
  previousValue?: string;
  newValue?: string;
  reason?: string;
  approval?: string;
  evidence?: string;
}

const ACTIONS_KEY = "pulse.cc.m1.actions";
const AUDIT_KEY = "pulse.cc.m1.audit";
const DRAFTS_KEY = "pulse.cc.m1.actionDrafts";

export type ActionDraft = {
  id: string;
  title: string;
  priority: string;
  category: string;
  clinicIds: string[];
  ownerType: "person" | "role" | "team";
  owner: string;
  template: string;
  recurring: string;
  details: string;
  due: string;
  createdBy: string;
  createdAt: string;
  lastEdited: string;
  monitoringNow: boolean;
  assignment: string;
  missing: string[];
};

function cloneSeed(): CommandAction[] {
  return COMMAND_ACTIONS.map((a) => ({
    ...a,
    comments: [...a.comments],
    timeline: [...a.timeline],
    linkedReferences: [...a.linkedReferences],
    relatedActions: [...a.relatedActions],
  }));
}

export function loadModule1Actions(): CommandAction[] {
  const stored = readJson<CommandAction[] | null>(ACTIONS_KEY, null);
  if (stored && Array.isArray(stored) && stored.length) return stored;
  const seed = cloneSeed();
  writeJson(ACTIONS_KEY, seed);
  return seed;
}

export function saveModule1Actions(actions: CommandAction[]) {
  writeJson(ACTIONS_KEY, actions);
}

export function loadAudit(): ActionAuditEntry[] {
  return readJson<ActionAuditEntry[]>(AUDIT_KEY, []);
}

export function appendAudit(entry: Omit<ActionAuditEntry, "id">) {
  const next: ActionAuditEntry = { ...entry, id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` };
  const all = [next, ...loadAudit()];
  writeJson(AUDIT_KEY, all);
  return next;
}

export function loadActionDrafts(): ActionDraft[] {
  return readJson<ActionDraft[]>(DRAFTS_KEY, []);
}

export function saveActionDrafts(drafts: ActionDraft[]) {
  writeJson(DRAFTS_KEY, drafts);
}

export function upsertActionDraft(draft: ActionDraft) {
  const drafts = loadActionDrafts();
  const idx = drafts.findIndex((d) => d.id === draft.id);
  const next = idx >= 0 ? drafts.map((d, i) => (i === idx ? draft : d)) : [draft, ...drafts];
  saveActionDrafts(next);
  return next;
}

export function discardActionDraft(id: string) {
  const next = loadActionDrafts().filter((d) => d.id !== id);
  saveActionDrafts(next);
  return next;
}

export function computeDraftMissing(d: Partial<ActionDraft>): string[] {
  const missing: string[] = [];
  if (!d.title?.trim()) missing.push("Title");
  if (!d.due) missing.push("Due date");
  if (!d.owner?.trim()) missing.push("Assignment");
  if (!(d.clinicIds?.length)) missing.push("Clinic");
  return missing;
}

export function pushTimeline(action: CommandAction, actor: string, event: string): CommandAction {
  const ev: TimelineEvent = {
    id: `t-${Date.now()}`,
    at: new Date().toISOString(),
    actor,
    event,
  };
  return { ...action, timeline: [ev, ...action.timeline] };
}

/** Reset repository to seed — QA helper only */
export function resetModule1ActionsToSeed() {
  const seed = cloneSeed();
  writeJson(ACTIONS_KEY, seed);
  return seed;
}

export { ACTIONS_KEY, AUDIT_KEY, DRAFTS_KEY, CC_STORAGE };
