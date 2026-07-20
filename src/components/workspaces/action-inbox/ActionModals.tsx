"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { InboxAction } from "@/lib/action-inbox/types";
import { snoozeOptions } from "@/lib/action-inbox/utils";

const inputCls =
  "w-full rounded-[10px] border border-[var(--line)] bg-white px-2.5 py-2 text-[13px] text-[#0f172a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]";

export function ReasonModal({
  kind,
  action,
  staff,
  onClose,
  onSubmit,
}: {
  kind: string;
  action: InboxAction | null;
  staff: string[];
  onClose: () => void;
  onSubmit: (payload: {
    reason: string;
    person?: string;
    dueAt?: string;
    startDate?: string;
    endDate?: string;
    canComplete?: boolean;
    canFurtherDelegate?: boolean;
    sendUpdatesToOwner?: boolean;
    outcome?: string;
    snoozeId?: string;
    targetId?: string;
  }) => void;
}) {
  const [reason, setReason] = useState("");
  const [person, setPerson] = useState(staff[0] || "");
  const [dueAt, setDueAt] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState("");
  const [canComplete, setCanComplete] = useState(true);
  const [canFurtherDelegate, setCanFurtherDelegate] = useState(false);
  const [sendUpdatesToOwner, setSendUpdatesToOwner] = useState(true);
  const [outcome, setOutcome] = useState("Completed");
  const [snoozeId, setSnoozeId] = useState("1h");
  const [rejectMode, setRejectMode] = useState<"close" | "return">("close");

  const titles: Record<string, string> = {
    reject: "Reject request",
    return: "Return for correction",
    reassign: "Reassign action",
    delegate: "Delegate action",
    due: "Change due date",
    hold: "Place on hold",
    withdraw: "Withdraw request",
    comment: "Add comment",
    escalate: "Escalate action",
    decline: "Decline assignment",
    "self-approve": "Exceptional self-approval",
    complete: "Complete action",
    verify: "Verify resolution",
    acknowledge: "Acknowledge exception",
    snooze: "Snooze reminder",
    info: "Request more information",
    "follow-up": "Create linked follow-up",
    "hide-comment": "Hide comment",
  };

  const needsReason = kind !== "snooze";

  return (
    <Modal
      open
      title={titles[kind] || "Confirm"}
      onClose={onClose}
      footer={
        <>
          <Button variant="line" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="teal"
            onClick={() => {
              if (needsReason && !reason.trim()) return;
              if (kind === "reject") {
                onSubmit({ reason, outcome: rejectMode });
                return;
              }
              onSubmit({
                reason: reason || (kind === "snooze" ? snoozeId : ""),
                person,
                dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
                startDate,
                endDate,
                canComplete,
                canFurtherDelegate,
                sendUpdatesToOwner,
                outcome,
                snoozeId,
              });
            }}
          >
            Confirm
          </Button>
        </>
      }
    >
      <div className="grid gap-3">
        {action ? (
          <p className="m-0 text-sm text-[#64748b]">
            {action.number} — {action.title}
          </p>
        ) : null}

        {kind === "reject" ? (
          <div className="grid gap-2">
            <label className="text-[12px] font-bold">
              <input
                type="radio"
                className="mr-2"
                checked={rejectMode === "close"}
                onChange={() => setRejectMode("close")}
              />
              Close as Rejected
            </label>
            <label className="text-[12px] font-bold">
              <input
                type="radio"
                className="mr-2"
                checked={rejectMode === "return"}
                onChange={() => setRejectMode("return")}
              />
              Return for Correction
            </label>
          </div>
        ) : null}

        {kind === "self-approve" ? (
          <div className="rounded-lg border border-[#fecaca] bg-[#fef2f2] p-3 text-sm text-[#991b1b]">
            Self-approval is an exceptional demonstration only when no other authorised approver is
            available. The item will be marked Self-Approved, the relevant manager notified, and the
            event recorded in history.
          </div>
        ) : null}

        {(kind === "reassign" || kind === "delegate") && (
          <label className="grid gap-1 text-[12px] font-bold">
            {kind === "delegate" ? "Delegate" : "New owner"}
            <select className={inputCls} value={person} onChange={(e) => setPerson(e.target.value)}>
              {staff.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        )}

        {kind === "delegate" ? (
          <>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="grid gap-1 text-[12px] font-bold">
                Start date
                <input
                  type="date"
                  className={inputCls}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </label>
              <label className="grid gap-1 text-[12px] font-bold">
                End date
                <input
                  type="date"
                  className={inputCls}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </label>
            </div>
            <label className="flex items-center gap-2 text-[12px] font-semibold">
              <input
                type="checkbox"
                checked={canComplete}
                onChange={(e) => setCanComplete(e.target.checked)}
              />
              Can complete action
            </label>
            <label className="flex items-center gap-2 text-[12px] font-semibold">
              <input
                type="checkbox"
                checked={canFurtherDelegate}
                onChange={(e) => setCanFurtherDelegate(e.target.checked)}
              />
              Can further delegate
            </label>
            <label className="flex items-center gap-2 text-[12px] font-semibold">
              <input
                type="checkbox"
                checked={sendUpdatesToOwner}
                onChange={(e) => setSendUpdatesToOwner(e.target.checked)}
              />
              Send updates to original owner
            </label>
            <p className="m-0 text-[11px] text-[#64748b]">
              Delegate means the original owner remains responsible.
            </p>
          </>
        ) : null}

        {kind === "reassign" ? (
          <p className="m-0 text-[11px] text-[#64748b]">
            Reassign moves full responsibility. Due date is kept. Old and new owners are notified.
          </p>
        ) : null}

        {(kind === "due" || kind === "escalate" || kind === "follow-up" || kind === "snooze") && (
          <label className="grid gap-1 text-[12px] font-bold">
            {kind === "snooze" ? "Approved date and time (if custom)" : "Date / time"}
            <input
              type="datetime-local"
              className={inputCls}
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
            />
          </label>
        )}

        {kind === "snooze" ? (
          <div className="grid gap-1">
            {snoozeOptions().map((o) => (
              <label key={o.id} className="flex items-center gap-2 text-[12px] font-semibold">
                <input
                  type="radio"
                  name="snooze"
                  checked={snoozeId === o.id}
                  onChange={() => setSnoozeId(o.id)}
                />
                {o.label}
              </label>
            ))}
          </div>
        ) : null}

        {kind === "complete" ? (
          <label className="grid gap-1 text-[12px] font-bold">
            Outcome
            <select className={inputCls} value={outcome} onChange={(e) => setOutcome(e.target.value)}>
              <option>Completed</option>
              <option>Resolved</option>
              <option>Closed with note</option>
            </select>
          </label>
        ) : null}

        {needsReason ? (
          <label className="grid gap-1 text-[12px] font-bold">
            {kind === "comment" ? "Comment (use @Name to mention)" : "Reason (required)"}
            <textarea
              className={inputCls + " min-h-[100px]"}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </label>
        ) : null}
      </div>
    </Modal>
  );
}

export function ConfirmExportModal({
  onClose,
  onExport,
  isManager,
}: {
  onClose: () => void;
  onExport: (format: string) => void;
  isManager: boolean;
}) {
  return (
    <Modal
      open
      title="Export"
      onClose={onClose}
      footer={
        <Button variant="line" onClick={onClose}>
          Close
        </Button>
      }
    >
      <p className="mb-3 text-sm text-[#64748b]">
        Permission-controlled demonstration exports. Each export or print is recorded in audit
        history.
      </p>
      <div className="grid gap-2">
        {["PDF summary", "Excel / CSV list", "Printable action report", "Full action-history report"].map(
          (fmt) => (
            <Button
              key={fmt}
              variant="line"
              disabled={fmt.includes("Full") && !isManager}
              onClick={() => onExport(fmt)}
            >
              {fmt}
            </Button>
          )
        )}
      </div>
    </Modal>
  );
}
