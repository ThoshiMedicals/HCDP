"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { loadAudit } from "@/lib/action-inbox/repository";
import type { InboxAction } from "@/lib/action-inbox/types";
import { DEMO_USER } from "@/lib/action-inbox/types";
import {
  canViewSensitive,
  categoryColor,
  formatDateTime,
  isOverdue,
  timeRemainingLabel,
} from "@/lib/action-inbox/utils";

type ActionKind =
  | "complete"
  | "approve"
  | "reject"
  | "return"
  | "acknowledge"
  | "verify"
  | "open-source"
  | "reassign"
  | "delegate"
  | "hold"
  | "due"
  | "info"
  | "comment"
  | "escalate"
  | "withdraw"
  | "follow-up"
  | "snooze"
  | "decline";

export function ReviewPanel({
  action,
  open,
  canSeeSensitive,
  isManager,
  auditKey,
  onClose,
  onAction,
}: {
  action: InboxAction | null;
  open: boolean;
  canSeeSensitive: boolean;
  isManager: boolean;
  auditKey: number;
  onClose: () => void;
  onAction: (kind: ActionKind) => void;
}) {
  const audit = useMemo(() => {
    if (!action) return [];
    return loadAudit().filter((e) => e.actionId === action.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action?.id, auditKey]);

  if (!action) {
    return null;
  }

  const restricted = !canViewSensitive(action, canSeeSensitive);
  const overdue = isOverdue(action);
  const locked = ["Completed", "Archived", "Withdrawn", "Rejected"].includes(action.status);
  const archived = action.status === "Archived";

  if (restricted) {
    return (
      <Drawer
        open={open}
        title="Restricted Action"
        subtitle={action.number}
        onClose={onClose}
        footer={
          <Button variant="line" onClick={onClose}>
            Close
          </Button>
        }
      >
        <p className="text-sm text-[var(--muted)]">
          You do not have permission to view the title, owner, description or attachments for this
          sensitivity level ({action.sensitivity}).
        </p>
      </Drawer>
    );
  }

  return (
    <Drawer
      open={open}
      title={action.title}
      subtitle={`${action.number} · ${action.category} · ${action.clinicName}`}
      onClose={onClose}
      footer={
        <div className="flex w-full flex-wrap justify-end gap-2">
          <Button variant="line" onClick={onClose}>
            Close
          </Button>
          {archived ? (
            <>
              <Button variant="line" onClick={() => onAction("follow-up")}>
                Create Linked Follow-up
              </Button>
              <Button variant="line" onClick={() => onAction("open-source")}>
                Open Source Record
              </Button>
            </>
          ) : (
            <>
              {action.category === "Approval" && action.status === "Awaiting Approval" ? (
                <>
                  <Button variant="teal" onClick={() => onAction("approve")}>
                    Approve
                  </Button>
                  <Button variant="danger" onClick={() => onAction("reject")}>
                    Reject
                  </Button>
                  <Button variant="warn" onClick={() => onAction("return")}>
                    Return for Correction
                  </Button>
                </>
              ) : null}
              {action.acknowledgementRequired && !action.acknowledgedAt ? (
                <Button variant="warn" onClick={() => onAction("acknowledge")}>
                  Acknowledge
                </Button>
              ) : null}
              {action.status === "Awaiting Verification" && isManager ? (
                <Button variant="teal" onClick={() => onAction("verify")}>
                  Verify Resolution
                </Button>
              ) : null}
              {!locked ? (
                <Button variant="green" onClick={() => onAction("complete")}>
                  Complete
                </Button>
              ) : (
                <Button variant="line" onClick={() => onAction("follow-up")}>
                  Create Linked Follow-up
                </Button>
              )}
              <Button variant="line" onClick={() => onAction("open-source")}>
                Open Source Record
              </Button>
            </>
          )}
        </div>
      }
    >
      <div className="grid gap-4">
        <div className="flex flex-wrap gap-1.5">
          <Badge tone="info">{action.category}</Badge>
          <Badge tone={action.priority === "Urgent" || action.priority === "High" ? "danger" : "warn"}>
            {action.priority}
          </Badge>
          <Badge tone={overdue ? "danger" : "default"}>{action.status}</Badge>
          <Badge tone="teal">{action.sensitivity}</Badge>
          {action.isDemo ? <Badge tone="default">Demonstration Data</Badge> : null}
          {action.escalationLevel > 0 ? (
            <Badge tone="danger">Escalation L{action.escalationLevel}</Badge>
          ) : null}
          {overdue ? <Badge tone="danger">Overdue</Badge> : null}
        </div>

        <Section title="Explanation">{action.fullExplanation}</Section>
        <Section title="Required outcome">{action.requiredOutcome}</Section>

        <div className="grid gap-2 sm:grid-cols-2">
          <Field label="Clinic" value={action.clinicName} />
          <Field label="Team" value={action.team} />
          <Field label="Owner" value={action.owner} />
          <Field label="Requested by" value={action.requestedBy} />
          <Field label="Created" value={formatDateTime(action.createdAt)} />
          <Field
            label="Due"
            value={`${formatDateTime(action.dueAt)} (${timeRemainingLabel(action.dueAt)})`}
          />
        </div>

        {(action.expectedResult || action.actualResult) && (
          <div className="grid gap-2 rounded-xl border border-[var(--hcdp-status-warning-border)] bg-[var(--hcdp-status-warning-surface)] p-3">
            <Field label="Expected result" value={action.expectedResult || "—"} />
            <Field label="Actual result" value={action.actualResult || "—"} />
            <Field label="Possible cause" value={action.possibleCause || "—"} />
            <Field label="Possible effect" value={action.possibleEffect || "—"} />
            <Field label="Recommended next action" value={action.recommendedNextAction || "—"} />
          </div>
        )}

        {action.approvalSteps.length > 0 ? (
          <div>
            <h4 className="m-0 mb-2 text-[13px] font-extrabold">Approval pathway</h4>
            <ol className="m-0 grid list-decimal gap-2 pl-4">
              {action.approvalSteps.map((s) => (
                <li key={s.id} className="text-sm">
                  <span className="font-bold">Step {s.order}:</span> {s.approver} — {s.status}
                  {s.selfApproved ? " (Self-Approved)" : ""}
                  {s.redirectedTo ? ` → redirected to ${s.redirectedTo}` : ""}
                  {s.decisionNote ? ` · ${s.decisionNote}` : ""}
                </li>
              ))}
            </ol>
            {action.approvalPurpose ? (
              <p className="mt-2 text-[length:var(--type-control)] text-[var(--muted)]">Purpose: {action.approvalPurpose}</p>
            ) : null}
            {action.decisionEffect ? (
              <p className="text-[length:var(--type-control)] text-[var(--muted)]">Effect: {action.decisionEffect}</p>
            ) : null}
          </div>
        ) : null}

        <div>
          <h4 className="m-0 mb-2 text-[13px] font-extrabold">Attachments</h4>
          {action.attachments.length === 0 ? (
            <p className="m-0 text-sm text-[#94a3b8]">None</p>
          ) : (
            action.attachments.map((att) => (
              <div
                key={att.id}
                className="mb-1 flex items-center justify-between rounded-lg border border-[var(--line)] bg-[var(--card)] px-3 py-2 text-sm"
              >
                <span>
                  {att.hidden ? (
                    <em>Hidden attachment — reason retained in audit</em>
                  ) : (
                    <>
                      {att.name} <span className="text-[#94a3b8]">({att.sizeLabel})</span>
                    </>
                  )}
                </span>
                {!att.hidden ? (
                  <Button
                    small
                    variant="line"
                    onClick={() => onAction("comment")}
                    title="Download recorded in audit when exported"
                  >
                    Download
                  </Button>
                ) : null}
              </div>
            ))
          )}
        </div>

        <div>
          <h4 className="m-0 mb-2 text-[13px] font-extrabold">Related records</h4>
          {action.relatedRecords.length === 0 ? (
            <p className="m-0 text-sm text-[#94a3b8]">None</p>
          ) : (
            action.relatedRecords.map((r) => (
              <div key={r.id} className="text-sm">
                {r.label} · {r.module} · {r.ref}
              </div>
            ))
          )}
          <p className="mt-1 text-[length:var(--type-control)] text-[var(--muted)]">
            Source record: {action.sourceModule} / {action.sourceRecord || "—"}
          </p>
        </div>

        <Section title="Notes">{action.notes || "—"}</Section>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="m-0 text-[13px] font-extrabold">Comments & mentions</h4>
            <Button small variant="line" onClick={() => onAction("comment")}>
              Add Comment
            </Button>
          </div>
          {action.comments.length === 0 ? (
            <p className="m-0 text-sm text-[#94a3b8]">No comments</p>
          ) : (
            action.comments.map((c) => (
              <div
                key={c.id}
                className="mb-2 rounded-lg border border-[var(--line)] bg-[var(--card)] px-3 py-2 text-sm"
              >
                <div className="text-[length:var(--type-control)] font-bold text-[var(--muted)]">
                  {c.author} · {formatDateTime(c.at)}
                  {c.mentions.length ? ` · mentions ${c.mentions.join(", ")}` : ""}
                </div>
                <div>
                  {c.hidden ? <em>Hidden comment — retained in full audit history</em> : c.body}
                </div>
              </div>
            ))
          )}
        </div>

        <div>
          <h4 className="m-0 mb-2 text-[13px] font-extrabold">Watchers</h4>
          <p className="m-0 text-sm">
            {action.watchers.length ? action.watchers.join(", ") : "None"}
          </p>
        </div>

        <div>
          <h4 className="m-0 mb-2 text-[13px] font-extrabold">
            Activity timeline {isManager ? "(full detail)" : "(summary)"}
          </h4>
          <div className="grid gap-1.5">
            {audit.length === 0 ? (
              <p className="m-0 text-sm text-[#94a3b8]">No events yet</p>
            ) : (
              audit.map((e) => (
                <div
                  key={e.id}
                  className="rounded-lg border-l-4 bg-[var(--soft)] px-3 py-2 text-[length:var(--type-control)]"
                  style={{ borderColor: categoryColor(action.category) }}
                >
                  <strong>{e.event}</strong> · {e.user} · {formatDateTime(e.at)}
                  {e.detail ? ` — ${e.detail}` : ""}
                  {isManager && e.reason ? ` · Reason: ${e.reason}` : ""}
                  {isManager && e.previousValue ? (
                    <div className="text-[var(--muted)]">
                      {e.previousValue} → {e.newValue}
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <h4 className="m-0 mb-2 text-[13px] font-extrabold">More Actions</h4>
          {archived ? (
            <p className="m-0 text-[length:var(--type-control)] text-[var(--muted)]">
              Archived records may be searched, filtered, viewed, printed, exported and used to create
              a linked follow-up. They cannot be edited or deleted. Reopen is not available.
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-2">
            {(
              (
                archived
                  ? ([["Create Linked Follow-up", "follow-up"]] as const)
                  : ([
                      ["Reassign", "reassign"],
                      ["Delegate", "delegate"],
                      ["Place on Hold", "hold"],
                      ["Change Due Date", "due"],
                      ["Request More Information", "info"],
                      ["Watch", "comment"],
                      ["Escalate", "escalate"],
                      ["Withdraw Request", "withdraw"],
                      ["Create Linked Follow-up", "follow-up"],
                      ["Decline assignment", "decline"],
                      ["Snooze reminder", "snooze"],
                    ] as const)
              )
            ).map(([label, kind]) => (
              <Button key={kind + label} small variant="line" onClick={() => onAction(kind)}>
                {label}
              </Button>
            ))}
          </div>
          <p className="mt-2 text-[length:var(--type-control)] text-[#94a3b8]">
            Signed in as {DEMO_USER.name}. Reopen is not available — use Create Linked Follow-up.
          </p>
        </div>
      </div>
    </Drawer>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="m-0 mb-1 text-[13px] font-extrabold">{title}</h4>
      <p className="m-0 whitespace-pre-wrap text-sm text-[#334155]">{children}</p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-2 border-b border-[var(--line)] py-1.5 text-sm">
      <span className="text-[length:var(--type-control)] font-bold text-[#758397]">{label}</span>
      <span>{value}</span>
    </div>
  );
}
