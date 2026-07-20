"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Panel, PanelSub, PanelTitle } from "@/components/ui/Panel";
import { Table, THead, Th, Td } from "@/components/ui/Table";
import { useOrganisation } from "@/lib/organisation/context";
import type { AccessReview, ReviewDecision } from "@/lib/organisation/types";
import { EmptyStateWithAction, FilterBar, FilterChip, RiskBadge, SavedViewsBar, SectionHeader, StatusPill, WarningBanner } from "./org-ui";

const DECISIONS: ReviewDecision[] = [
  "Confirm",
  "Remove",
  "Reduce",
  "Request increase",
  "Change role",
  "Change clinic",
  "Suspend",
  "Request information",
];

export function AccessReviewsSection() {
  const { state, filters, setFilters, completeReview, isOverdue } = useOrganisation();
  const [modal, setModal] = useState<AccessReview | null>(null);
  const [decision, setDecision] = useState<ReviewDecision>("Confirm");
  const [notes, setNotes] = useState("");

  const reviews = useMemo(() => {
    let list = [...state.reviews];
    if (filters.status === "OpenAndInProgress") list = list.filter((r) => r.status === "Open" || r.status === "In Progress");
    else if (filters.status) list = list.filter((r) => r.status === filters.status);
    if (filters.card) list = list.filter((r) => r.id === filters.card);
    return list.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [state.reviews, filters]);

  const triggers = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of state.reviews) map.set(r.trigger, (map.get(r.trigger) || 0) + 1);
    return [...map.entries()];
  }, [state.reviews]);

  const submit = () => {
    if (!modal) return;
    completeReview(modal.id, decision, notes);
    setModal(null);
    setNotes("");
  };

  return (
    <div className="grid gap-[18px]">
      <SectionHeader
        title="Access reviews"
        subtitle="Scheduled and auto-triggered reviews. Request increase creates a new access request."
      />

      <SavedViewsBar section="access-reviews" />

      <FilterBar onClear={() => setFilters({})}>
        <FilterChip label="Open" active={filters.status === "Open"} onClick={() => setFilters({ status: "Open" })} />
        <FilterChip label="In Progress" active={filters.status === "In Progress"} onClick={() => setFilters({ status: "In Progress" })} />
        <FilterChip label="Overdue" active={filters.status === "Overdue"} onClick={() => setFilters({ status: "Overdue" })} />
        <FilterChip label="Completed" active={filters.status === "Completed"} onClick={() => setFilters({ status: "Completed" })} />
      </FilterBar>

      <div className="grid gap-3 md:grid-cols-2">
        <Panel>
          <PanelTitle>Review triggers (frequency)</PanelTitle>
          <ul className="mt-2 grid gap-1 text-sm text-[#526479]">
            {triggers.map(([t, n]) => (
              <li key={t} className="flex justify-between"><span>{t}</span><strong>{n}</strong></li>
            ))}
          </ul>
        </Panel>
        <Panel>
          <PanelTitle>Auto triggers</PanelTitle>
          <PanelSub>Role change, primary clinic change, emergency expiry, inactivity and security concerns.</PanelSub>
          <WarningBanner>Overdue reviews escalate to Security alerts after due date.</WarningBanner>
        </Panel>
      </div>

      {reviews.length === 0 ? (
        <EmptyStateWithAction
          title="No access reviews match these filters"
          description="Try clearing filters to see all reviews."
          actionLabel="Clear filters"
          onAction={() => setFilters({})}
        />
      ) : (
      <Table>
        <THead>
          <Th>User</Th>
          <Th>Trigger</Th>
          <Th>Status</Th>
          <Th>Risk</Th>
          <Th>Due</Th>
          <Th>Owner</Th>
          <Th />
        </THead>
        <tbody>
          {reviews.map((r) => (
            <tr key={r.id}>
              <Td><strong>{r.userName}</strong></Td>
              <Td>{r.trigger}</Td>
              <Td>
                <StatusPill label={r.status} tone={r.status === "Overdue" ? "danger" : r.status === "Completed" ? "success" : "info"} />
                {isOverdue(r.dueDate) && r.status !== "Completed" ? <StatusPill label="Escalated" tone="warn" /> : null}
              </Td>
              <Td><RiskBadge risk={r.riskLevel} /></Td>
              <Td>{r.dueDate}</Td>
              <Td>{r.ownerName}</Td>
              <Td>
                {r.status !== "Completed" ? (
                  <Button small variant="teal" onClick={() => { setModal(r); setDecision("Confirm"); }}>Decide</Button>
                ) : (
                  <span className="text-xs text-[#64748b]">{r.decision}</span>
                )}
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      )}

      <Modal open={!!modal} title={`Review — ${modal?.userName}`} onClose={() => setModal(null)} footer={
        <>
          <Button variant="line" onClick={() => setModal(null)}>Cancel</Button>
          <Button variant="teal" onClick={submit}>Complete review</Button>
        </>
      }>
        <div className="grid gap-3 text-sm">
          <label className="grid gap-1"><span className="font-bold">Decision</span>
            <select className="rounded-lg border px-3 py-2" value={decision} onChange={(e) => setDecision(e.target.value as ReviewDecision)}>
              {DECISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
          {decision === "Request increase" ? (
            <WarningBanner>This decision will create a new high-risk access request requiring dual approval.</WarningBanner>
          ) : null}
          <label className="grid gap-1"><span className="font-bold">Notes</span>
            <textarea className="rounded-lg border px-3 py-2" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
        </div>
      </Modal>
    </div>
  );
}
