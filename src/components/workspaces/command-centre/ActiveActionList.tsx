"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CcCard, CcCardHeader, PriorityBadge, inputClass } from "./cc-ui";
import type { CommandAction } from "@/lib/command-centre/types";
import type { Location } from "@/lib/types";
import { locationShort } from "@/lib/mock/data";
import { priorityRank } from "@/lib/command-centre/utils";
import { cn } from "@/lib/cn";

function sortActions(list: CommandAction[]) {
  return [...list].sort((a, b) => {
    const pr = priorityRank(a.priority) - priorityRank(b.priority);
    if (pr !== 0) return pr;
    const od = (b.overdueAge ? 1 : 0) - (a.overdueAge ? 1 : 0);
    if (od !== 0) return od;
    const esc = (b.escalation.includes("Owner") ? 1 : 0) - (a.escalation.includes("Owner") ? 1 : 0);
    if (esc !== 0) return esc;
    if (a.due !== b.due) return a.due.localeCompare(b.due);
    return b.latestUpdate.localeCompare(a.latestUpdate);
  });
}

export function ActiveActionList({
  actions,
  locations,
  onOpen,
  onBulk,
  onComment,
  showCompleted,
}: {
  actions: CommandAction[];
  locations: Location[];
  onOpen: (id: string) => void;
  onBulk: (ids: string[], verb: string) => void;
  onComment: (id: string, body: string) => void;
  showCompleted?: boolean;
}) {
  const [view, setView] = useState<"card" | "table">("card");
  const [showAll, setShowAll] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const sorted = useMemo(() => {
    const inactive = new Set(["Completed", "Closed", "Dismissed", "Archived"]);
    const base = showCompleted
      ? actions.filter((a) => a.priority === "Completed Today" || a.stage === "Completed" || a.stage === "Closed")
      : actions.filter(
          (a) => a.priority !== "Completed Today" && !inactive.has(a.stage)
        );
    return sortActions(base);
  }, [actions, showCompleted]);

  const visible = showAll ? sorted : sorted.slice(0, 10);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <CcCard accent="#1e40af">
      <CcCardHeader
        title={showCompleted ? "Completed Today" : "Active Action List"}
        subtitle={
          showCompleted
            ? "Completed, closed, dismissed and archived records are excluded from active queues. Completed Today stays until end of day, then clears while history remains."
            : "Active queue only — completed, closed, dismissed and archived excluded. Ordered by priority, overdue age, escalation, due date and last update."
        }
        actions={
          <>
            <Button small variant={view === "card" ? "teal" : "line"} onClick={() => setView("card")}>
              Card
            </Button>
            <Button small variant={view === "table" ? "teal" : "line"} onClick={() => setView("table")}>
              Table
            </Button>
            <Button small variant="soft" onClick={() => setShowAll((v) => !v)}>
              {showAll ? "Show first 10" : "View All Actions"}
            </Button>
          </>
        }
      />

      <div className="cc-surface-info mx-4 mb-3 flex flex-wrap items-center gap-1.5 rounded-xl border p-2">
        <span className="text-xs font-bold">Bulk:</span>
        {["Acknowledge", "Assign", "Escalate", "Mark Complete", "Dismiss"].map((verb) => (
          <Button
            key={verb}
            small
            variant="line"
            disabled={selected.length === 0}
            onClick={() => {
              if (!selected.length) return;
              onBulk(selected, verb);
            }}
          >
            {verb}
          </Button>
        ))}
        <span className="text-[length:var(--type-meta)] font-semibold text-[var(--cc-muted)]">
          {selected.length > 0 ? `${selected.length} selected` : "Select one or more actions."}
        </span>
        <span className="text-[length:var(--type-meta)] font-semibold text-[var(--cc-muted)]">
          Change Priority, Due Date, Reminder and Export require a future workflow backend.
        </span>
      </div>

      {view === "card" ? (
        <div className="grid gap-2.5 px-4 pb-4">
          {visible.map((a) => (
            <div key={a.id} className="rounded-xl border border-[var(--cc-card-line)] bg-[var(--cc-soft)] p-3.5">
              <div className="flex flex-wrap items-start gap-2">
                <input type="checkbox" checked={selected.includes(a.id)} onChange={() => toggle(a.id)} />
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-[length:var(--type-control)] font-bold cc-text-info">{a.reference}</span>
                    <PriorityBadge priority={a.priority} />
                    <Badge tone="info">{a.stage}</Badge>
                    {a.linkedReferences[0] ? (
                      <span className="text-[length:var(--type-meta)] text-[var(--cc-muted)]">Linked {a.linkedReferences[0]}</span>
                    ) : null}
                  </div>
                  <strong className="block text-[15px]">{a.title}</strong>
                  <div className="mt-1 grid gap-0.5 text-[length:var(--type-control)] leading-snug text-[var(--cc-muted)] sm:grid-cols-2">
                    <span>
                      {locationShort(a.locationId === "all" ? "all" : a.locationId, locations)} · {a.category}
                    </span>
                    <span>
                      Source: {a.sourceModule} · Owner: {a.owner}
                    </span>
                    <span>
                      Due {new Date(a.due).toLocaleString("en-AU")}
                      {a.overdueAge ? ` · Overdue ${a.overdueAge}` : ""}
                    </span>
                    <span>
                      Reminders: {a.reminders} · Escalation: {a.escalation}
                    </span>
                    <span className="sm:col-span-2 line-clamp-2">
                      Latest: {a.latestUpdate}
                      {a.delayReason ? ` · Delay: ${a.delayReason}` : ""}
                      {a.attachments ? ` · Attachments: ${a.attachments}` : ""}
                    </span>
                  </div>
                  <div className="cc-action-btns mt-2">
                    <Button small variant="teal" onClick={() => onOpen(a.id)}>
                      Open Full Action
                    </Button>
                    {["Acknowledge", "Assign", "Approve", "Mark Complete", "Escalate", "Dismiss"].map((verb) => (
                      <Button key={verb} small variant="line" onClick={() => onBulk([a.id], verb)}>
                        {verb}
                      </Button>
                    ))}
                    <details className="relative">
                      <summary className="cc-ctrl cursor-pointer list-none text-[length:var(--type-control)]">More</summary>
                      <div className="absolute left-0 top-[110%] z-20 w-[220px] rounded-xl border border-[var(--cc-card-line)] bg-[var(--cc-card)] p-1 shadow-lg">
                        {["Reassign", "Reject", "Request More Information"].map((label) => (
                          <button
                            key={label}
                            type="button"
                            className="block w-full rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold hover:bg-[var(--cc-soft)]"
                            onClick={() => onBulk([a.id], label)}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </details>
                  </div>
                  <div className="mt-2 grid gap-2">
                    <div className="flex flex-wrap gap-2">
                      <input
                        className={cn(inputClass, "min-h-9 min-w-[160px] flex-1 py-1.5 text-xs")}
                        placeholder="Add comment…"
                        value={drafts[a.id] ?? ""}
                        onChange={(e) => {
                          setDrafts((d) => ({ ...d, [a.id]: e.target.value }));
                          try {
                            window.sessionStorage.setItem("pulse.cc.draftForm", "1");
                          } catch {
                            /* ignore */
                          }
                        }}
                      />
                      <Button
                        small
                        variant="soft"
                        onClick={() => {
                          const body = drafts[a.id]?.trim();
                          if (!body) return;
                          onComment(a.id, body);
                          setDrafts((d) => ({ ...d, [a.id]: "" }));
                        }}
                      >
                        Post Update
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 text-[length:var(--type-meta)] font-semibold text-[var(--cc-muted)]">
                      <button
                        type="button"
                        className="rounded-md border border-[var(--cc-card-line)] px-1.5 py-0.5 opacity-60"
                        disabled
                        title="Requires people directory backend"
                      >
                        Mention User
                      </button>
                      <button
                        type="button"
                        className="rounded-md border border-[var(--cc-card-line)] px-1.5 py-0.5 opacity-60"
                        disabled
                        title="Requires file storage backend"
                      >
                        Attach File
                      </button>
                      <button
                        type="button"
                        className="rounded-md border border-[var(--cc-card-line)] px-1.5 py-0.5"
                        onClick={() => {
                          const body = drafts[a.id]?.trim() || "Instruction noted";
                          onComment(a.id, `[Instruction] ${body}`);
                          setDrafts((d) => ({ ...d, [a.id]: "" }));
                        }}
                      >
                        Mark as Instruction
                      </button>
                      <button
                        type="button"
                        className="rounded-md border border-[var(--cc-card-line)] px-1.5 py-0.5"
                        onClick={() => {
                          const body = drafts[a.id]?.trim() || "Response requested";
                          onComment(a.id, `[Response requested] ${body}`);
                          setDrafts((d) => ({ ...d, [a.id]: "" }));
                        }}
                      >
                        Request Response
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {!visible.length ? (
            <div className="cc-surface-info rounded-xl border p-4 text-sm font-semibold">
              {showCompleted
                ? "No completed actions match the current clinic selection for today."
                : "No matching active actions for the current filters. Try Clear filters."}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="overflow-auto px-4 pb-4">
          <table className="w-full min-w-[900px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--cc-card-line)] text-[length:var(--type-meta)] uppercase text-[var(--cc-muted)]">
                <th className="py-2 pr-2">Ref</th>
                <th className="py-2 pr-2">Priority</th>
                <th className="py-2 pr-2">Title</th>
                <th className="py-2 pr-2">Clinic</th>
                <th className="py-2 pr-2">Owner</th>
                <th className="py-2 pr-2">Due</th>
                <th className="py-2 pr-2">Stage</th>
                <th className="py-2">Open</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((a) => (
                <tr key={a.id} className="border-b border-[var(--cc-card-line)]">
                  <td className="py-2 pr-2 font-mono font-bold cc-text-info">{a.reference}</td>
                  <td className="py-2 pr-2">
                    <PriorityBadge priority={a.priority} />
                  </td>
                  <td className="py-2 pr-2 font-semibold">{a.title}</td>
                  <td className="py-2 pr-2">{locationShort(a.locationId, locations)}</td>
                  <td className="py-2 pr-2">{a.owner}</td>
                  <td className="py-2 pr-2">{new Date(a.due).toLocaleDateString("en-AU")}</td>
                  <td className="py-2 pr-2">{a.stage}</td>
                  <td className="py-2">
                    <Button small variant="line" onClick={() => onOpen(a.id)}>
                      Open
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CcCard>
  );
}
