"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Panel, PanelSub, PanelTitle } from "@/components/ui/Panel";
import { Table, THead, Th, Td } from "@/components/ui/Table";
import { Tabs } from "@/components/ui/Tabs";
import { useOrganisation } from "@/lib/organisation/context";
import type { AccessRequest } from "@/lib/organisation/types";
import { EmptyStateWithAction, FilterBar, FilterChip, RiskBadge, SavedViewsBar, SectionHeader, StatusPill, WarningBanner } from "./org-ui";

export function AccessRequestsSection() {
  const { state, filters, setFilters, approveRequestItem, submitRequestApproval, isOverdue, actor } = useOrganisation();
  const [view, setView] = useState("list");
  const [detailId, setDetailId] = useState<string | null>(null);

  const requests = useMemo(() => {
    let list = [...state.requests];
    if (filters.card) list = list.filter((r) => r.id === filters.card);
    if (filters.status === "overdue") list = list.filter((r) => isOverdue(r.dueAt) && r.status !== "Approved" && r.status !== "Rejected");
    if (filters.status === "history") list = list.filter((r) => r.status === "Rejected" || r.status === "Approved");
    else if (filters.status) list = list.filter((r) => r.status === filters.status);
    return list;
  }, [state.requests, filters, isOverdue]);

  // Detail is derived from live state so approvals/decisions stay in sync while the drawer is open.
  const detail: AccessRequest | null = detailId ? state.requests.find((r) => r.id === detailId) || null : null;

  const openDetail = (req: AccessRequest) => setDetailId(req.id);

  return (
    <div className="grid gap-[18px]">
      <SectionHeader title="Access requests" subtitle="Partial approval, dual approvers for high risk, SLAs and overdue tracking." />

      <SavedViewsBar section="access-requests" />

      <FilterBar onClear={() => setFilters({})}>
        <FilterChip label="In review" active={filters.status === "In Review"} onClick={() => setFilters({ status: "In Review" })} />
        <FilterChip label="Overdue" active={filters.status === "overdue"} onClick={() => setFilters({ status: "overdue" })} />
        <FilterChip label="History" active={filters.status === "history"} onClick={() => setFilters({ status: "history" })} />
      </FilterBar>

      <Tabs value={view} onChange={setView} items={[{ id: "list", label: "List" }, { id: "cards", label: "Cards" }]} />

      {requests.length === 0 ? (
        <EmptyStateWithAction
          title="No access requests match these filters"
          description="Try clearing filters to see all requests."
          actionLabel="Clear filters"
          onAction={() => setFilters({})}
        />
      ) : view === "list" ? (
        <Table>
          <THead>
            <Th>Request</Th>
            <Th>Subject</Th>
            <Th>Priority</Th>
            <Th>Risk</Th>
            <Th>Status</Th>
            <Th>Due</Th>
            <Th />
          </THead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id}>
                <Td><strong>{r.title}</strong></Td>
                <Td>{r.subjectUserName}</Td>
                <Td><StatusPill label={r.priority} tone={r.priority === "Emergency" ? "emergency" : "warn"} /></Td>
                <Td><RiskBadge risk={r.riskLevel} /></Td>
                <Td>
                  <StatusPill label={r.status} tone={r.status === "Approved" ? "success" : r.status === "Rejected" ? "danger" : "info"} />
                  {isOverdue(r.dueAt) && r.status !== "Approved" ? <StatusPill label="Overdue" tone="danger" /> : null}
                </Td>
                <Td>{new Date(r.dueAt).toLocaleString()}</Td>
                <Td><Button small variant="line" onClick={() => openDetail(r)}>Open</Button></Td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {requests.map((r) => (
            <Panel key={r.id}>
              <PanelTitle>{r.title}</PanelTitle>
              <PanelSub>{r.riskSummary}</PanelSub>
              <div className="mt-2 flex flex-wrap gap-2">
                <RiskBadge risk={r.riskLevel} />
                <StatusPill label={r.status} tone="info" />
                {r.requiresTwoApprovers ? <StatusPill label="Dual approval" tone="warn" /> : null}
              </div>
              <Button className="mt-3" small variant="teal" onClick={() => openDetail(r)}>Review</Button>
            </Panel>
          ))}
        </div>
      )}

      <Drawer open={!!detail} title={detail?.title || ""} onClose={() => setDetailId(null)}>
        {detail ? (
          <div className="grid gap-4">
            <Panel>
              <PanelTitle>Risk summary</PanelTitle>
              <p className="text-sm text-[var(--muted)]">{detail.riskSummary}</p>
              {detail.subjectUserId === actor.id ? (
                <WarningBanner>Self-approval blocked — you cannot approve your own request.</WarningBanner>
              ) : null}
            </Panel>
            <Panel>
              <PanelTitle>Items (partial approval)</PanelTitle>
              <ul className="grid gap-2">
                {detail.items.map((item) => (
                  <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f0f3f6] pb-2 text-sm">
                    <span>{item.label} <RiskBadge risk={item.risk} /></span>
                    <div className="flex gap-1">
                      <Button small variant="line" disabled={item.status !== "Pending"} onClick={() => approveRequestItem(detail.id, item.id, "Approved")}>Approve</Button>
                      <Button small variant="line" disabled={item.status !== "Pending"} onClick={() => approveRequestItem(detail.id, item.id, "Rejected")}>Reject</Button>
                      <StatusPill label={item.status} tone={item.status === "Approved" ? "success" : item.status === "Rejected" ? "danger" : "default"} />
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel>
              <PanelTitle>Approvers</PanelTitle>
              <ul className="text-sm text-[var(--muted)]">
                {detail.approvals.map((a) => (
                  <li key={a.approverId}>{a.approverName}: {a.decision || "Pending"} {a.decidedAt ? `@ ${a.decidedAt}` : ""}</li>
                ))}
              </ul>
              <div className="mt-3 flex gap-2">
                <Button variant="teal" onClick={() => submitRequestApproval(detail.id, "Approved")}>Approve request</Button>
                <Button variant="line" onClick={() => submitRequestApproval(detail.id, "Rejected")}>Reject request</Button>
              </div>
            </Panel>
            {detail.decisionHistory.length ? (
              <Panel>
                <PanelTitle>Decision history</PanelTitle>
                <ul className="text-sm text-[var(--muted)]">{detail.decisionHistory.map((h) => <li key={h}>{h}</li>)}</ul>
              </Panel>
            ) : null}
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
