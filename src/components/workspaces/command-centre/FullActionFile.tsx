"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Badge } from "@/components/ui/Badge";
import { PriorityBadge, Field, inputClass } from "./cc-ui";
import type { CommandAction } from "@/lib/command-centre/types";
import type { Location } from "@/lib/types";
import { locationShort } from "@/lib/mock/data";
import { appendAudit, loadAudit, pushTimeline } from "@/lib/command-centre/action-repository";

export function FullActionFile({
  action,
  locations,
  open,
  onClose,
  onUpdate,
  onPasswordGate,
}: {
  action: CommandAction | null;
  locations: Location[];
  open: boolean;
  onClose: () => void;
  onUpdate: (next: CommandAction) => void;
  onPasswordGate: (action: CommandAction, verb: string, apply: () => void) => void;
}) {
  const [comment, setComment] = useState("");
  const [dismissReason, setDismissReason] = useState("");
  const [dismissApproval, setDismissApproval] = useState("");
  const [dismissEvidence, setDismissEvidence] = useState("");
  const [dismissNotify, setDismissNotify] = useState("");
  const [reopenReason, setReopenReason] = useState("");

  const auditRows = useMemo(
    () => (action ? loadAudit().filter((a) => a.actionId === action.id) : []),
    [action]
  );

  if (!action) return null;

  function applyStage(stage: CommandAction["stage"], extra?: Partial<CommandAction>) {
    const next = pushTimeline(
      {
        ...action!,
        stage,
        latestUpdate: `${stage} by Neil · ${new Date().toLocaleString("en-AU")}`,
        ...extra,
      },
      "Neil",
      `Stage → ${stage}`
    );
    onUpdate(next);
    appendAudit({
      actionId: action!.id,
      event: `Stage changed to ${stage}`,
      user: "Neil",
      at: new Date().toISOString(),
      previousValue: action!.stage,
      newValue: stage,
      reason: `Progress decision: ${stage}`,
      approval: "Neil (demonstration)",
      evidence: "Evidence placeholder (local demonstration)",
    });
  }

  function run(verb: string, fn: () => void) {
    if (
      action!.requiresPassword &&
      ["Approve", "Reject", "Dismiss", "Close", "Temporary continued use"].includes(verb)
    ) {
      onPasswordGate(action!, verb, fn);
      return;
    }
    fn();
  }

  const isCompletedLike = action.stage === "Completed" || action.stage === "Closed" || action.priority === "Completed Today";

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={action.reference}
      subtitle="Full action file — process without leaving Command Centre"
      footer={
        <>
          <Button variant="line" onClick={onClose}>
            Close panel
          </Button>
          <Button
            variant="teal"
            onClick={() =>
              run("Approve", () =>
                applyStage(action.stage === "Awaiting Approval" ? "Completed" : "In Progress")
              )
            }
          >
            Save progress
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <section className="rounded-xl border border-[var(--line)] p-3">
          <div className="mb-2 flex flex-wrap gap-1.5">
            <PriorityBadge priority={action.priority} />
            <Badge tone="info">{action.stage}</Badge>
            <Badge tone="teal">{action.category}</Badge>
            {action.dismissed || action.stage === "Dismissed" ? (
              <Badge tone="warn">Dismissed — searchable history</Badge>
            ) : null}
          </div>
          <h3 className="m-0 text-lg font-extrabold">{action.title}</h3>
          <p className="m-0 mt-1 text-sm text-[var(--cc-muted)]">{action.summary}</p>
          <div className="mt-2 grid gap-1 text-xs text-[var(--cc-muted)] sm:grid-cols-2">
            <span>Clinic: {locationShort(action.locationId, locations)}</span>
            <span>Source module: {action.sourceModule}</span>
            <span>Owner: {action.owner}</span>
            <span>Due: {new Date(action.due).toLocaleString("en-AU")}</span>
            <span>Reminders: {action.reminders}</span>
            <span>Escalation: {action.escalation}</span>
            {action.overdueAge ? <span>Overdue age: {action.overdueAge}</span> : null}
            {action.delayReason ? <span>Delay reason: {action.delayReason}</span> : null}
            {action.searchable === false ? null : (
              <span className="sm:col-span-2">Remains searchable after leaving active queues.</span>
            )}
          </div>
        </section>

        <section>
          <h4 className="m-0 mb-1 text-sm font-extrabold">Details</h4>
          <p className="m-0 text-sm leading-relaxed text-[var(--cc-ink)]">{action.details}</p>
        </section>

        <section>
          <h4 className="m-0 mb-2 text-sm font-extrabold">Progress & decisions</h4>
          <div className="flex flex-wrap gap-1.5">
            {[
              "Acknowledge",
              "Assign",
              "Reassign",
              "Approve",
              "Reject",
              "Request More Information",
              "Change Priority",
              "Change Due Date",
              "Send Reminder",
              "Mark Complete",
              "Escalate",
              "Dismiss",
              "Reopen",
            ].map((verb) => (
              <Button
                key={verb}
                small
                variant={verb === "Mark Complete" ? "green" : verb === "Escalate" ? "warn" : "line"}
                disabled={verb === "Reopen" && !isCompletedLike}
                onClick={() => {
                  if (verb === "Dismiss") {
                    if (!dismissReason.trim() || !dismissApproval.trim()) return;
                    run("Dismiss", () => {
                      const meta = {
                        reason: dismissReason.trim(),
                        by: "Neil",
                        at: new Date().toISOString(),
                        approval: dismissApproval.trim(),
                        evidence: dismissEvidence.trim() || undefined,
                        notify: dismissNotify.trim() || undefined,
                      };
                      applyStage("Dismissed", {
                        dismissed: true,
                        searchable: true,
                        dismissMeta: meta,
                        details: `${action.details}\n\nDismissed: ${dismissReason}\nApproval: ${dismissApproval}${
                          dismissEvidence ? `\nEvidence: ${dismissEvidence}` : ""
                        }`,
                      });
                      appendAudit({
                        actionId: action.id,
                        event: "Dismissed",
                        user: "Neil",
                        at: meta.at,
                        reason: meta.reason,
                        approval: meta.approval,
                        evidence: meta.evidence || "Evidence placeholder (local demonstration)",
                        previousValue: action.stage,
                        newValue: "Dismissed",
                      });
                    });
                    return;
                  }
                  if (verb === "Reopen") {
                    if (!reopenReason.trim()) return;
                    run("Reopen", () => {
                      const next = pushTimeline(
                        {
                          ...action,
                          stage: "Reopened",
                          details: `${action.details}\n\nReopened: ${reopenReason}`,
                          priority:
                            action.priority === "Completed Today" || action.stage === "Closed"
                              ? "Attention Required"
                              : action.priority,
                          completedAt: undefined,
                          dismissed: false,
                          dismissMeta: undefined,
                          latestUpdate: "Reopened after completion",
                        },
                        "Neil",
                        "Reopened after completion"
                      );
                      onUpdate(next);
                      appendAudit({
                        actionId: action.id,
                        event: "Reopened after completion",
                        user: "Neil",
                        at: new Date().toISOString(),
                        reason: reopenReason.trim(),
                        previousValue: action.stage,
                        newValue: "Reopened",
                        approval: "Neil (demonstration)",
                        evidence: "Evidence placeholder (local demonstration)",
                      });
                    });
                    return;
                  }
                  if (verb === "Mark Complete") {
                    run("Mark Complete", () =>
                      applyStage("Completed", {
                        priority: "Completed Today",
                        completedAt: new Date().toISOString(),
                      })
                    );
                    return;
                  }
                  if (verb === "Escalate") {
                    run("Escalate", () => applyStage("Escalated", { escalation: "Owner/Director" }));
                    return;
                  }
                  if (verb === "Approve") {
                    run("Approve", () =>
                      applyStage("Completed", {
                        priority: "Completed Today",
                        completedAt: new Date().toISOString(),
                      })
                    );
                    return;
                  }
                  if (verb === "Request More Information") {
                    applyStage("Waiting for Information");
                    return;
                  }
                  if (verb === "Acknowledge") {
                    onUpdate({ ...action, acknowledged: true, latestUpdate: "Acknowledged by Neil" });
                    return;
                  }
                  if (verb === "Change Priority") {
                    const order = ["Emergency", "Urgent", "Attention Required", "Routine", "Overdue"] as const;
                    const idx = order.indexOf(action.priority as (typeof order)[number]);
                    const next = order[Math.min(Math.max(idx, 0) + 1, order.length - 1)] ?? "Routine";
                    run("Change Priority", () => {
                      onUpdate({ ...action, priority: next, latestUpdate: `Priority changed to ${next}` });
                      appendAudit({
                        actionId: action.id,
                        event: "Priority changed",
                        user: "Neil",
                        at: new Date().toISOString(),
                        previousValue: action.priority,
                        newValue: next,
                        reason: "Local demonstration priority change",
                        approval: "Neil (demonstration)",
                        evidence: "Evidence placeholder (local demonstration)",
                      });
                    });
                    return;
                  }
                  if (verb === "Change Due Date") {
                    const due = window.prompt("New due date (YYYY-MM-DD)", action.due?.slice(0, 10) ?? "") ?? "";
                    if (!due.trim()) return;
                    onUpdate({ ...action, due: due.trim(), latestUpdate: `Due date set to ${due.trim()}` });
                    return;
                  }
                  if (verb === "Send Reminder") {
                    onUpdate({ ...action, latestUpdate: "Reminder sent (local demonstration)" });
                    appendAudit({
                      actionId: action.id,
                      event: "Reminder sent",
                      user: "Neil",
                      at: new Date().toISOString(),
                      reason: "Local demonstration reminder",
                    });
                    return;
                  }
                  applyStage(verb === "Assign" || verb === "Reassign" ? "Assigned" : "In Progress");
                }}
              >
                {verb}
              </Button>
            ))}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Field label="Dismiss reason (required)">
              <textarea className={inputClass} rows={2} value={dismissReason} onChange={(e) => setDismissReason(e.target.value)} />
            </Field>
            <Field label="Approving manager (required)">
              <input className={inputClass} value={dismissApproval} onChange={(e) => setDismissApproval(e.target.value)} />
            </Field>
            <Field label="Evidence / attachment reference">
              <input className={inputClass} value={dismissEvidence} onChange={(e) => setDismissEvidence(e.target.value)} />
            </Field>
            <Field label="Notify (optional)">
              <input className={inputClass} value={dismissNotify} onChange={(e) => setDismissNotify(e.target.value)} />
            </Field>
            <Field label="Reopen reason (required after completion)">
              <textarea className={inputClass} rows={2} value={reopenReason} onChange={(e) => setReopenReason(e.target.value)} />
            </Field>
          </div>
          {action.dismissMeta ? (
            <div className="mt-2 rounded-lg border cc-surface-warn border p-2 text-xs">
              Dismissed by {action.dismissMeta.by} · {new Date(action.dismissMeta.at).toLocaleString("en-AU")} ·
              Approval: {action.dismissMeta.approval}
            </div>
          ) : null}
          <p className="mt-2 text-[11px] text-[var(--cc-muted)]">
            Dismissed actions leave the active queue but remain searchable. Reopen sets stage to Reopened after completion.
          </p>
        </section>

        <section>
          <h4 className="m-0 mb-2 text-sm font-extrabold">Comments</h4>
          <div className="grid gap-2">
            {action.comments.map((c) => (
              <div key={c.id} className="rounded-lg border border-[var(--line)] bg-[var(--cc-soft)] p-2.5 text-sm">
                <div className="text-[11px] font-bold text-[var(--cc-muted)]">
                  {c.author} · {new Date(c.at).toLocaleString("en-AU")}
                  {c.private ? " · Private" : ""}
                </div>
                <div>{c.body}</div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              className={`${inputClass} flex-1`}
              placeholder="Add comment…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <Button
              small
              variant="soft"
              onClick={() => {
                if (!comment.trim()) return;
                onUpdate({
                  ...action,
                  comments: [
                    ...action.comments,
                    { id: `c-${Date.now()}`, author: "Neil", at: new Date().toISOString(), body: comment.trim() },
                  ],
                  latestUpdate: `Comment by Neil: ${comment.trim()}`,
                });
                setComment("");
              }}
            >
              Add Comment
            </Button>
          </div>
        </section>

        <section>
          <h4 className="m-0 mb-2 text-sm font-extrabold">Audit History</h4>
          {auditRows.length ? (
            <div className="grid gap-2">
              {auditRows.map((a) => (
                <div key={a.id} className="rounded-lg border border-[var(--cc-card-line)] px-2.5 py-2 text-xs">
                  <strong>{a.event}</strong> · {a.user} · {new Date(a.at).toLocaleString("en-AU")}
                  <div className="text-[var(--cc-muted)]">Source action: {a.actionId}</div>
                  {a.previousValue != null ? (
                    <div className="text-[var(--cc-muted)]">Previous: {a.previousValue}</div>
                  ) : null}
                  {a.newValue != null ? <div className="text-[var(--cc-muted)]">New: {a.newValue}</div> : null}
                  {a.reason ? <div className="text-[var(--cc-muted)]">Reason: {a.reason}</div> : null}
                  {a.approval ? <div className="text-[var(--cc-muted)]">Approval: {a.approval}</div> : null}
                  {a.evidence ? <div className="text-[var(--cc-muted)]">Evidence: {a.evidence}</div> : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="m-0 text-sm text-[var(--cc-muted)]">No audit entries for this action yet.</p>
          )}
        </section>

        <section>
          <h4 className="m-0 mb-2 text-sm font-extrabold">Complete timeline</h4>
          <div className="grid gap-2">
            {action.timeline.map((t) => (
              <div key={t.id} className="flex gap-3 border-l-2 border-[var(--cc-exec,#1e40af)] pl-3 text-sm">
                <div>
                  <div className="text-[11px] font-bold text-[var(--cc-muted)]">
                    {new Date(t.at).toLocaleString("en-AU")} · {t.actor}
                  </div>
                  <div>{t.event}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border cc-surface-success border p-3">
          <h4 className="m-0 mb-1 text-sm font-extrabold cc-text-success">Completion</h4>
          <p className="m-0 text-sm cc-text-success">
            {action.completedAt
              ? `Completed ${new Date(action.completedAt).toLocaleString("en-AU")}. Remains on dashboard until end of demo day.`
              : "Not completed. Use Mark Complete, then formally Close when accepted."}
          </p>
          {action.stage === "Completed" ? (
            <Button
              small
              variant="green"
              className="mt-2"
              onClick={() => run("Close", () => applyStage("Closed"))}
            >
              Formally Close
            </Button>
          ) : null}
        </section>
      </div>
    </Drawer>
  );
}
