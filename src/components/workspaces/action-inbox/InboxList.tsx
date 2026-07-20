"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { DisplayDensity, InboxAction } from "@/lib/action-inbox/types";
import {
  canViewSensitive,
  categoryColor,
  formatDateTime,
  isOverdue,
  timeRemainingLabel,
} from "@/lib/action-inbox/utils";
import { cn } from "@/lib/cn";

type QuickKind =
  | "approve"
  | "reject"
  | "complete"
  | "acknowledge"
  | "snooze"
  | "escalate"
  | "comment";

export function InboxList({
  actions,
  density,
  canSeeSensitive,
  isManager,
  selectedIds,
  expandedId,
  onToggleSelect,
  onToggleExpand,
  onOpenReview,
  onQuick,
  emptyKind,
  onEmptyAction,
}: {
  actions: InboxAction[];
  density: DisplayDensity;
  canSeeSensitive: boolean;
  isManager: boolean;
  selectedIds: string[];
  expandedId: string | null;
  onToggleSelect: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onOpenReview: (id: string) => void;
  onQuick: (kind: QuickKind, id: string) => void;
  emptyKind: "inbox" | "filtered";
  onEmptyAction: (act: "completed" | "create" | "refresh" | "clear" | "edit") => void;
}) {
  if (!actions.length) {
    if (emptyKind === "inbox") {
      return (
        <div className="rounded-2xl border border-dashed border-[var(--v34-card-line)] bg-white p-10 text-center">
          <h3 className="m-0 text-lg font-extrabold text-[#334155]">You’re all caught up</h3>
          <p className="mt-1 text-sm text-[#64748b]">
            There are no open actions requiring your attention.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button variant="line" onClick={() => onEmptyAction("completed")}>
              View Completed
            </Button>
            <Button variant="teal" onClick={() => onEmptyAction("create")}>
              Create Action
            </Button>
            <Button variant="line" onClick={() => onEmptyAction("refresh")}>
              Refresh Inbox
            </Button>
          </div>
        </div>
      );
    }
    return (
      <div className="rounded-2xl border border-dashed border-[var(--v34-card-line)] bg-white p-10 text-center">
        <h3 className="m-0 text-lg font-extrabold text-[#334155]">No actions match these filters</h3>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button variant="teal" onClick={() => onEmptyAction("clear")}>
            Clear Filters
          </Button>
          <Button variant="line" onClick={() => onEmptyAction("edit")}>
            Edit Filters
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[14px] border border-[var(--v34-card-line)] bg-white shadow-[var(--v34-card-shadow)]">
      <div
        className={cn(
          "hidden grid-cols-[auto_72px_1fr_90px_90px_100px_70px_90px_100px_88px] gap-2 border-b border-[var(--v34-card-line)] bg-[#f8fafc] px-3 text-[10px] font-extrabold uppercase tracking-wide text-[#64748b] lg:grid",
          density === "compact" ? "py-1.5" : "py-2.5"
        )}
      >
        {isManager ? <span /> : <span />}
        <span>#</span>
        <span>Action</span>
        <span>Category</span>
        <span>Clinic</span>
        <span>Owner</span>
        <span>Pri</span>
        <span>Status</span>
        <span>Due</span>
        <span />
      </div>
      {actions.map((action) => {
        const restricted = !canViewSensitive(action, canSeeSensitive);
        const overdue = isOverdue(action);
        const expanded = expandedId === action.id;
        const title = restricted ? "Restricted Action" : action.title;
        return (
          <div
            key={action.id}
            className={cn(
              "border-b border-[#eef2f6] last:border-0",
              action.unread && !restricted && "bg-[#f8fbff]",
              overdue && "border-l-4 border-l-[#dc2626]"
            )}
          >
            <div
              role="button"
              tabIndex={0}
              onClick={() => onToggleExpand(action.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onToggleExpand(action.id);
                }
              }}
              className={cn(
                "grid cursor-pointer grid-cols-1 gap-2 px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#2563eb] lg:grid-cols-[auto_72px_1fr_90px_90px_100px_70px_90px_100px_88px] lg:items-center",
                density === "compact" ? "py-2" : "py-3"
              )}
            >
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                {isManager ? (
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(action.id)}
                    onChange={() => onToggleSelect(action.id)}
                  aria-label={`Select ${restricted ? "restricted action" : action.number}`}
                  />
                ) : (
                  <span className="w-4" />
                )}
                {action.unread && !restricted ? (
                  <span className="h-2 w-2 rounded-full bg-[#2563eb]" title="Unread" />
                ) : (
                  <span className="h-2 w-2" />
                )}
              </div>
              <div className="text-[11px] font-bold text-[#64748b]">{action.number}</div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={cn(
                      "truncate text-[13px] text-[var(--ink)]",
                      action.unread && !restricted ? "font-extrabold" : "font-semibold"
                    )}
                  >
                    {title}
                  </span>
                  {action.unread && !restricted ? (
                    <span className="rounded bg-[#dbeafe] px-1.5 py-0.5 text-[10px] font-extrabold text-[#1d4ed8]">
                      New
                    </span>
                  ) : null}
                  {action.isDemo ? (
                    <span className="rounded bg-[#e2e8f0] px-1.5 py-0.5 text-[9px] font-bold text-[#475569]">
                      Demonstration Data
                    </span>
                  ) : null}
                  {overdue ? <Badge tone="danger">Overdue</Badge> : null}
                </div>
                {!restricted ? (
                  <div className="mt-0.5 truncate text-[11px] text-[#64748b]">{action.explanation}</div>
                ) : (
                  <div className="mt-0.5 text-[11px] text-[#64748b]">
                    You do not have permission to view details for this sensitivity level.
                  </div>
                )}
                <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-[#94a3b8]">
                  {!restricted && action.attachments.length ? (
                    <span>📎 {action.attachments.length}</span>
                  ) : null}
                  {!restricted && action.comments.length ? (
                    <span>💬 {action.comments.length}</span>
                  ) : null}
                  {!restricted && action.watchers.length ? (
                    <span>👁 {action.watchers.length}</span>
                  ) : null}
                </div>
              </div>
              <div>
                {!restricted ? (
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold"
                    style={{
                      color: categoryColor(action.category),
                      background: `${categoryColor(action.category)}18`,
                    }}
                  >
                    {action.category}
                  </span>
                ) : (
                  <span className="text-[11px] text-[#94a3b8]">—</span>
                )}
              </div>
              <div className="truncate text-[12px] text-[#475569]">
                {restricted ? "—" : action.clinicName}
              </div>
              <div className="truncate text-[12px] text-[#475569]">
                {restricted ? "—" : action.owner}
              </div>
              <div>
                {!restricted ? (
                  <Badge
                    tone={
                      action.priority === "Urgent" || action.priority === "High"
                        ? "danger"
                        : action.priority === "Medium"
                          ? "warn"
                          : "default"
                    }
                  >
                    {action.priority}
                  </Badge>
                ) : (
                  "—"
                )}
              </div>
              <div className="truncate text-[11px] font-semibold text-[#475569]">
                {restricted ? "—" : action.status}
              </div>
              <div className="text-[11px]">
                {!restricted ? (
                  <>
                    <div className={overdue ? "font-bold text-[#dc2626]" : "text-[#475569]"}>
                      {formatDateTime(action.dueAt)}
                    </div>
                    <div className={overdue ? "text-[#dc2626]" : "text-[#94a3b8]"}>
                      {timeRemainingLabel(action.dueAt)}
                    </div>
                  </>
                ) : (
                  "—"
                )}
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <Button small variant="line" onClick={() => onOpenReview(action.id)}>
                  Open Review Panel
                </Button>
              </div>
            </div>

            {expanded && !restricted ? (
              <div className="border-t border-[#eef2f6] bg-[#fbfdff] px-4 py-3">
                <div className="grid gap-2 text-[12px] text-[#475569] md:grid-cols-3">
                  <div>
                    <strong>Requested by:</strong> {action.requestedBy}
                  </div>
                  <div>
                    <strong>Team:</strong> {action.team}
                  </div>
                  <div>
                    <strong>Source:</strong> {action.sourceModule} · {action.sourceRecord || "—"}
                  </div>
                  <div className="md:col-span-3">{action.fullExplanation}</div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {action.category === "Approval" ? (
                    <>
                      <Button small variant="teal" onClick={() => onQuick("approve", action.id)}>
                        Approve
                      </Button>
                      <Button small variant="danger" onClick={() => onQuick("reject", action.id)}>
                        Reject
                      </Button>
                    </>
                  ) : null}
                  {action.acknowledgementRequired && !action.acknowledgedAt ? (
                    <Button small variant="warn" onClick={() => onQuick("acknowledge", action.id)}>
                      Acknowledge
                    </Button>
                  ) : null}
                  <Button small variant="line" onClick={() => onQuick("complete", action.id)}>
                    Complete
                  </Button>
                  <Button small variant="line" onClick={() => onQuick("comment", action.id)}>
                    Add Comment
                  </Button>
                  <Button small variant="line" onClick={() => onQuick("escalate", action.id)}>
                    Escalate
                  </Button>
                  {action.category === "Reminder" ? (
                    <Button small variant="line" onClick={() => onQuick("snooze", action.id)}>
                      Snooze
                    </Button>
                  ) : null}
                  <Button small variant="soft" onClick={() => onOpenReview(action.id)}>
                    Open Review Panel
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
