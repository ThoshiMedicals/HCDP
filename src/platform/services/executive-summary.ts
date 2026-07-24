/**
 * Executive summary service — reads Module 2 actions into the shared projection contract.
 */

import { loadActions } from "@/lib/action-inbox/repository";
import type { ActionCategory, InboxAction } from "@/lib/action-inbox/types";
import { isOverdue, isUrgent } from "@/lib/action-inbox/utils";
import type { ExecutiveInboxSummary } from "@/platform/contracts/executive-summary";
import { getSourceLinkForInboxAction } from "@/platform/services/action-inbox-bridge";

export type { ExecutiveInboxSummary } from "@/platform/contracts/executive-summary";

const CLOSED = new Set(["Completed", "Archived", "Withdrawn", "Rejected"]);

function openActions(actions: InboxAction[]): InboxAction[] {
  return actions.filter((a) => !CLOSED.has(a.status));
}

export function computeExecutiveInboxSummary(actions?: InboxAction[]): ExecutiveInboxSummary {
  const all = actions ?? (typeof window !== "undefined" ? loadActions() : []);
  const open = openActions(all);
  const overdue = open.filter((a) => isOverdue(a));
  const urgent = open.filter((a) => isUrgent(a) || a.priority === "Urgent");
  const escalated = open.filter((a) => a.escalationLevel > 0 || a.category === "Escalation");

  const clinicMap = new Map<
    string,
    { clinicId: string; clinicName: string; open: number; overdue: number; urgent: number }
  >();
  for (const a of open) {
    const key = a.clinicId || "org";
    const row = clinicMap.get(key) ?? {
      clinicId: a.clinicId,
      clinicName: a.clinicName || "Organisation",
      open: 0,
      overdue: 0,
      urgent: 0,
    };
    row.open += 1;
    if (isOverdue(a)) row.overdue += 1;
    if (isUrgent(a) || a.priority === "Urgent") row.urgent += 1;
    clinicMap.set(key, row);
  }

  const categories: ActionCategory[] = ["Approval", "Exception", "Escalation", "Reminder"];
  const byCategory = categories.map((category) => {
    const subset = open.filter((a) => a.category === category);
    return {
      category,
      open: subset.length,
      overdue: subset.filter((a) => isOverdue(a)).length,
    };
  });

  const sampleActions = [...open]
    .sort((a, b) => {
      const score = (x: InboxAction) =>
        (isOverdue(x) ? 100 : 0) + (x.priority === "Urgent" ? 50 : x.priority === "High" ? 30 : 0);
      return score(b) - score(a);
    })
    .slice(0, 8)
    .map((a) => ({
      id: a.id,
      number: a.number,
      title: a.title,
      priority: a.priority,
      clinicName: a.clinicName,
      dueAt: a.dueAt,
      overdue: isOverdue(a),
      href: `/action-inbox?actionId=${encodeURIComponent(a.id)}`,
      origin: "action-inbox" as const,
    }));

  return {
    openCount: open.length,
    overdueCount: overdue.length,
    urgentCount: urgent.length,
    escalatedCount: escalated.length,
    byClinic: [...clinicMap.values()].sort((a, b) => b.open - a.open),
    byCategory,
    sampleActions,
    generatedAt: new Date().toISOString(),
  };
}

export function isOperationalInboxProjection(actionId: string): boolean {
  return Boolean(getSourceLinkForInboxAction(actionId));
}
