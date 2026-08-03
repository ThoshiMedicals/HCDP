"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Panel, PanelSub, PanelTitle } from "@/components/ui/Panel";
import { useOrganisation } from "@/lib/organisation/context";
import type { SecurityAlert } from "@/lib/organisation/types";
import { EmergencyBanner, FilterBar, FilterChip, RiskBadge, SectionHeader, SimpleChartBar, StatusPill, useConfirm } from "./org-ui";

export function SecuritySection() {
  const { state, filters, setFilters, resolveAlert, grantEmergencyAccess, clinics, actor } = useOrganisation();
  const [resolveModal, setResolveModal] = useState<SecurityAlert | null>(null);
  const [resolveNote, setResolveNote] = useState("");
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [emForm, setEmForm] = useState({ userId: "usr_lucy", clinicId: "loc_eightmile", reason: "", permissions: "", expiresAt: "", verified: false });
  const { ask, dialog } = useConfirm();

  const openAlerts = useMemo(() => {
    let list = state.alerts.filter((a) => !a.resolved);
    if (filters.risk) list = list.filter((a) => a.risk === filters.risk);
    return list;
  }, [state.alerts, filters.risk]);

  const byCategory = Object.entries(
    openAlerts.reduce<Record<string, number>>((acc, a) => {
      acc[a.category] = (acc[a.category] || 0) + 1;
      return acc;
    }, {})
  ).map(([label, value]) => ({ label, value, tone: "warn" as const }));

  const byRisk = (["Critical", "High", "Medium", "Low"] as const).map((r) => ({
    label: r,
    value: state.alerts.filter((a) => !a.resolved && a.risk === r).length,
    tone: (r === "Critical" ? "emergency" : r === "High" ? "danger" : "warn") as "emergency" | "danger" | "warn",
  }));

  const submitResolve = () => {
    if (!resolveModal) return;
    if (resolveModal.risk === "Critical" && !resolveNote.trim()) {
      return;
    }
    resolveAlert(resolveModal.id, resolveNote);
    setResolveModal(null);
    setResolveNote("");
  };

  const submitEmergency = () => {
    ask({
      title: "Confirm emergency access grant",
      message: `Grant emergency access to ${state.users.find((u) => u.id === emForm.userId)?.firstName || "this user"}? This creates a critical security alert and mandatory notification.`,
      confirmLabel: "Grant access",
      onConfirm: () => {
        grantEmergencyAccess({
          ...emForm,
          approverId: actor.id,
          expiresAt: emForm.expiresAt || new Date(Date.now() + 86400000).toISOString(),
        });
        setEmergencyOpen(false);
      },
    });
  };

  return (
    <div className="grid gap-[18px]">
      <SectionHeader
        title="Security monitoring"
        subtitle="All alert types with risk levels. Critical alerts need a resolution note."
        actions={<Button variant="teal" onClick={() => setEmergencyOpen(true)}>Grant emergency access</Button>}
      />

      <FilterBar onClear={() => setFilters({})}>
        <FilterChip label="All risk" active={!filters.risk} onClick={() => setFilters({})} />
        {(["Critical", "High", "Medium", "Low"] as const).map((r) => (
          <FilterChip key={r} label={r} active={filters.risk === r} onClick={() => setFilters({ risk: r })} />
        ))}
      </FilterBar>

      {state.emergency.some((e) => e.active) ? (
        <EmergencyBanner>
          Active emergency sessions: {state.emergency.filter((e) => e.active).map((e) => e.userName).join(", ")}
        </EmergencyBanner>
      ) : null}

      <div className="grid gap-3.5 md:grid-cols-2">
        <SimpleChartBar title="Open alerts by category" items={byCategory.length ? byCategory : [{ label: "None open", value: 0, tone: "success" }]} />
        <SimpleChartBar title="Open alerts by risk" items={byRisk} />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {openAlerts.map((a) => (
          <Panel key={a.id}>
            <PanelTitle>{a.title}</PanelTitle>
            <PanelSub>{a.category} · {new Date(a.createdAt).toLocaleString()}</PanelSub>
            <div className="mt-2 flex flex-wrap gap-2">
              <RiskBadge risk={a.risk} />
              <StatusPill label="Open" tone="warn" />
            </div>
            <Button className="mt-3" small variant="teal" onClick={() => setResolveModal(a)}>
              Resolve
            </Button>
          </Panel>
        ))}
      </div>

      <Modal open={!!resolveModal} title="Resolve alert" onClose={() => setResolveModal(null)} footer={
        <>
          <Button variant="line" onClick={() => setResolveModal(null)}>Cancel</Button>
          <Button variant="teal" onClick={submitResolve} disabled={resolveModal?.risk === "Critical" && !resolveNote.trim()}>
            Resolve
          </Button>
        </>
      }>
        <p className="text-sm text-[var(--muted)]">{resolveModal?.title}</p>
        {resolveModal?.risk === "Critical" ? (
          <label className="mt-3 grid gap-1 text-sm">
            <span className="font-bold">Resolution note (required for Critical)</span>
            <textarea className="rounded-lg border px-3 py-2" rows={3} value={resolveNote} onChange={(e) => setResolveNote(e.target.value)} />
          </label>
        ) : null}
      </Modal>

      <Modal open={emergencyOpen} title="Grant emergency access" onClose={() => setEmergencyOpen(false)} footer={
        <>
          <Button variant="line" onClick={() => setEmergencyOpen(false)}>Cancel</Button>
          <Button variant="teal" onClick={submitEmergency}>Grant</Button>
        </>
      }>
        <div className="grid gap-3 text-sm">
          <select className="rounded-lg border px-3 py-2" value={emForm.userId} onChange={(e) => setEmForm({ ...emForm, userId: e.target.value })}>
            {state.users.map((u) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
          </select>
          <select className="rounded-lg border px-3 py-2" value={emForm.clinicId} onChange={(e) => setEmForm({ ...emForm, clinicId: e.target.value })}>
            {clinics.map((c) => <option key={c.id} value={c.id}>{c.shortName}</option>)}
          </select>
          <textarea className="rounded-lg border px-3 py-2" placeholder="Reason" value={emForm.reason} onChange={(e) => setEmForm({ ...emForm, reason: e.target.value })} />
          <input className="rounded-lg border px-3 py-2" placeholder="Permissions granted" value={emForm.permissions} onChange={(e) => setEmForm({ ...emForm, permissions: e.target.value })} />
          <input type="datetime-local" className="rounded-lg border px-3 py-2" value={emForm.expiresAt} onChange={(e) => setEmForm({ ...emForm, expiresAt: e.target.value })} />
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={emForm.verified} onChange={(e) => setEmForm({ ...emForm, verified: e.target.checked })} />
            Strong verification completed
          </label>
        </div>
      </Modal>
      {dialog}
    </div>
  );
}
