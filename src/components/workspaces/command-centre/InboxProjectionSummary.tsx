"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  computeExecutiveInboxSummary,
  type ExecutiveInboxSummary,
} from "@/platform/services/executive-summary";
import { M2_INBOX_CHANGED_EVENT } from "@/lib/action-inbox/storage";
import { CcCard, CcCardHeader } from "./cc-ui";

/**
 * Module 2 operational action projection for Module 1.
 * Distinct from executive-only actions stored in pulse.cc.m1.*.
 */
export function InboxProjectionSummary() {
  const [summary, setSummary] = useState<ExecutiveInboxSummary | null>(null);

  useEffect(() => {
    const refresh = () => setSummary(computeExecutiveInboxSummary());
    refresh();
    window.addEventListener(M2_INBOX_CHANGED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(M2_INBOX_CHANGED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  if (!summary) return null;

  return (
    <CcCard accent="#0f766e">
      <CcCardHeader
        title="Operational Action Inbox (Module 2)"
        subtitle="Live projection from Action Inbox — not duplicated as editable Command Centre records"
      />
      <div className="space-y-3 px-4 pb-4">
        <div className="flex flex-wrap gap-2">
          <Badge tone="info">{summary.openCount} open</Badge>
          <Badge tone="warn">{summary.overdueCount} overdue</Badge>
          <Badge tone="danger">{summary.urgentCount} urgent</Badge>
          <Badge tone="default">{summary.escalatedCount} escalated</Badge>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {summary.byCategory.map((c) => (
            <div
              key={c.category}
              className="rounded-xl border border-[var(--cc-card-line)] bg-[var(--cc-soft)] px-3 py-2 text-sm"
            >
              <div className="text-[10px] font-extrabold uppercase tracking-wide text-[var(--cc-muted)]">
                {c.category}
              </div>
              <div className="font-bold">
                {c.open} open · {c.overdue} overdue
              </div>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--cc-card-line)] text-[11px] uppercase tracking-wide text-[var(--cc-muted)]">
                <th className="py-2 pr-2">Action</th>
                <th className="py-2 pr-2">Clinic</th>
                <th className="py-2 pr-2">Priority</th>
                <th className="py-2">Open</th>
              </tr>
            </thead>
            <tbody>
              {summary.sampleActions.map((a) => (
                <tr key={a.id} className="border-b border-[var(--cc-card-line)]/60">
                  <td className="py-2 pr-2">
                    <div className="font-semibold">{a.number}</div>
                    <div className="text-[var(--cc-muted)]">{a.title}</div>
                    {a.overdue ? <Badge tone="danger">Overdue</Badge> : null}
                  </td>
                  <td className="py-2 pr-2">{a.clinicName}</td>
                  <td className="py-2 pr-2">{a.priority}</td>
                  <td className="py-2">
                    <Link href={a.href} className="font-bold text-[var(--theme-primary)] underline">
                      Open in Action Inbox
                    </Link>
                  </td>
                </tr>
              ))}
              {!summary.sampleActions.length ? (
                <tr>
                  <td colSpan={4} className="py-3 text-[var(--cc-muted)]">
                    No open Action Inbox items.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href="/action-inbox">
            <Button small variant="teal">
              Open Action Inbox
            </Button>
          </Link>
          <Link href="/action-inbox?category=Approval">
            <Button small variant="line">
              Approvals only
            </Button>
          </Link>
          <span className="self-center text-[11px] text-[var(--cc-muted)]">
            Executive-only actions remain in Module 1 stores on this dashboard.
          </span>
        </div>
      </div>
    </CcCard>
  );
}
