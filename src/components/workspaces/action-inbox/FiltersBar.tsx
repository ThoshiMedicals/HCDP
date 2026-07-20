"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { InboxFilters, SavedView } from "@/lib/action-inbox/types";
import { cn } from "@/lib/cn";

const inputCls =
  "rounded-[10px] border border-[var(--line)] bg-white px-2.5 py-[0.45rem] text-[12px] font-semibold text-[#0f172a] min-h-[34px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#2563eb]";

export function FiltersBar({
  filters,
  setFilters,
  savedViews,
  onApplyView,
  onSaveView,
  onTogglePin,
  onClear,
  clinics,
  isManager,
}: {
  filters: InboxFilters;
  setFilters: (f: InboxFilters | ((prev: InboxFilters) => InboxFilters)) => void;
  savedViews: SavedView[];
  onApplyView: (v: SavedView) => void;
  onSaveView: (name: string, scope: "private" | "shared") => void;
  onTogglePin?: (id: string) => void;
  onClear: () => void;
  clinics: { id: string; name: string }[];
  isManager: boolean;
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saveName, setSaveName] = useState("");

  const patch = (partial: Partial<InboxFilters>) => setFilters((f) => ({ ...f, ...partial }));

  return (
    <div className="rounded-[14px] border border-[var(--v34-card-line)] bg-white p-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          className={inputCls + " min-w-[200px] flex-1"}
          placeholder="Search title, number, owner, clinic, comments, attachments…"
          value={filters.search}
          onChange={(e) => patch({ search: e.target.value })}
          aria-label="Search actions"
        />
        <select
          className={inputCls}
          value={filters.clinicId}
          onChange={(e) => patch({ clinicId: e.target.value })}
          aria-label="Clinic filter"
        >
          <option value="">All clinics</option>
          {clinics.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          className={inputCls}
          value={filters.priority}
          onChange={(e) => patch({ priority: e.target.value as InboxFilters["priority"] })}
          aria-label="Priority filter"
        >
          <option value="">All priorities</option>
          <option value="Urgent">Urgent</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        <select
          className={inputCls}
          value={filters.status}
          onChange={(e) => patch({ status: e.target.value as InboxFilters["status"] })}
          aria-label="Status filter"
        >
          <option value="">All statuses</option>
          {[
            "Open",
            "In Progress",
            "Awaiting Approval",
            "Awaiting Verification",
            "On Hold",
            "Returned for Correction",
            "Completed",
            "Archived",
          ].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <Button small variant="line" onClick={() => setShowAdvanced((v) => !v)}>
          {showAdvanced ? "Hide filters" : "More filters"}
        </Button>
        <Button small variant="soft" onClick={onClear}>
          Clear All Filters
        </Button>
      </div>

      {showAdvanced ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <input
            className={inputCls}
            placeholder="Owner"
            value={filters.owner}
            onChange={(e) => patch({ owner: e.target.value })}
          />
          <input
            className={inputCls}
            placeholder="Requester"
            value={filters.requester}
            onChange={(e) => patch({ requester: e.target.value })}
          />
          <label className="flex items-center gap-2 text-[12px] font-semibold">
            Due from
            <input
              type="date"
              className={inputCls}
              value={filters.dueFrom}
              onChange={(e) => patch({ dueFrom: e.target.value })}
            />
          </label>
          <label className="flex items-center gap-2 text-[12px] font-semibold">
            Due to
            <input
              type="date"
              className={inputCls}
              value={filters.dueTo}
              onChange={(e) => patch({ dueTo: e.target.value })}
            />
          </label>
          <label className="flex items-center gap-2 text-[12px] font-semibold">
            <input
              type="checkbox"
              checked={filters.overdueOnly}
              onChange={(e) => patch({ overdueOnly: e.target.checked })}
            />
            Overdue only
          </label>
          <label className="flex items-center gap-2 text-[12px] font-semibold">
            <input
              type="checkbox"
              checked={filters.delegatedOnly}
              onChange={(e) => patch({ delegatedOnly: e.target.checked })}
            />
            Delegated
          </label>
          <label className="flex items-center gap-2 text-[12px] font-semibold">
            <input
              type="checkbox"
              checked={filters.watchedOnly}
              onChange={(e) => patch({ watchedOnly: e.target.checked })}
            />
            Watched
          </label>
          <label className="flex items-center gap-2 text-[12px] font-semibold">
            <input
              type="checkbox"
              checked={filters.hasAttachments}
              onChange={(e) => patch({ hasAttachments: e.target.checked })}
            />
            Has attachments
          </label>
          <label className="flex items-center gap-2 text-[12px] font-semibold">
            <input
              type="checkbox"
              checked={filters.awaitingVerification}
              onChange={(e) => patch({ awaitingVerification: e.target.checked })}
            />
            Awaiting verification
          </label>
          <select
            className={inputCls}
            value={filters.escalationLevel === "" ? "" : String(filters.escalationLevel)}
            onChange={(e) =>
              patch({
                escalationLevel: e.target.value === "" ? "" : (Number(e.target.value) as 0 | 1 | 2 | 3 | 4),
              })
            }
          >
            <option value="">Escalation level</option>
            {[0, 1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                Level {n}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#94a3b8]">
          Saved views
        </span>
        {savedViews
          .slice()
          .sort((a, b) => Number(b.pinned) - Number(a.pinned))
          .map((v) => (
            <div key={v.id} className="inline-flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => onApplyView(v)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]",
                  v.pinned
                    ? "border-[#2563eb] bg-[#eff6ff] text-[#1d4ed8]"
                    : "border-[var(--line)] bg-[#f8fafc]"
                )}
                title={`${v.scope} · ${v.createdBy}`}
              >
                {v.pinned ? "Pinned · " : ""}
                {v.name}
                {v.scope === "shared" ? " (shared)" : ""}
              </button>
              {onTogglePin ? (
                <button
                  type="button"
                  className="rounded-full border border-[var(--line)] bg-white px-1.5 py-1 text-[10px] font-bold text-[#64748b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]"
                  onClick={() => onTogglePin(v.id)}
                  aria-label={v.pinned ? `Unpin ${v.name}` : `Pin ${v.name}`}
                >
                  {v.pinned ? "Unpin" : "Pin"}
                </button>
              ) : null}
            </div>
          ))}
        <input
          className={inputCls + " max-w-[160px]"}
          placeholder="New view name"
          value={saveName}
          onChange={(e) => setSaveName(e.target.value)}
        />
        <Button
          small
          variant="line"
          onClick={() => {
            if (!saveName.trim()) return;
            onSaveView(saveName.trim(), "private");
            setSaveName("");
          }}
        >
          Save private
        </Button>
        {isManager ? (
          <Button
            small
            variant="line"
            onClick={() => {
              if (!saveName.trim()) return;
              onSaveView(saveName.trim(), "shared");
              setSaveName("");
            }}
          >
            Save shared
          </Button>
        ) : null}
      </div>
    </div>
  );
}
