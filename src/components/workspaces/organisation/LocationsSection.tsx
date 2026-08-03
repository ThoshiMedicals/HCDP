"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Modal } from "@/components/ui/Modal";
import { Panel, PanelSub, PanelTitle } from "@/components/ui/Panel";
import { Table, THead, Th, Td } from "@/components/ui/Table";
import { Tabs } from "@/components/ui/Tabs";
import { useOrganisation } from "@/lib/organisation/context";
import type { ClinicLifecycleStatus, OrgClinic } from "@/lib/organisation/types";
import { EmptyStateWithAction, FilterBar, FilterChip, SavedViewsBar, SectionHeader, StatusPill, WarningBanner, useConfirm } from "./org-ui";

const STATUSES: ClinicLifecycleStatus[] = [
  "Planned",
  "Setup in Progress",
  "Draft",
  "Active",
  "Temporarily Closed",
  "Under Renovation",
  "Merging",
  "Merged",
  "Permanently Closed",
  "Sold or Transferred",
];

const DAY_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const DAY_LABELS: Record<(typeof DAY_KEYS)[number], string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

export function LocationsSection() {
  const { clinics, state, filters, setFilters, changeClinicStatus, activateClinic, completeMerger, completeCombinedMerger, addTemporaryClosure, patchState, pushToast } = useOrganisation();
  const [tab, setTab] = useState("all");
  const [statusModal, setStatusModal] = useState<OrgClinic | null>(null);
  const [statusForm, setStatusForm] = useState({ status: "Active" as ClinicLifecycleStatus, reason: "", date: "" });
  const [createOpen, setCreateOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [shortForm, setShortForm] = useState({ name: "", suburb: "", regionId: "reg_moreton" });
  const [detailId, setDetailId] = useState<string | null>(null);
  const [closureForm, setClosureForm] = useState({ date: "", name: "", reason: "" });
  const [mergerReason, setMergerReason] = useState("");
  const { ask, dialog } = useConfirm();

  const detail = detailId ? state.clinics.find((c) => c.id === detailId) || null : null;

  const filtered = useMemo(() => {
    let list = clinics;
    if (filters.status === "warnings") list = list.filter((c) => c.warnings.length > 0);
    else if (filters.status) list = list.filter((c) => c.status === filters.status);
    if (filters.clinicId) list = list.filter((c) => c.id === filters.clinicId);
    if (filters.card) list = list.filter((c) => c.id === filters.card);
    if (tab === "drafts") list = list.filter((c) => c.isDraft);
    if (tab === "merger") list = list.filter((c) => c.status === "Merging" || c.mergerPartnerId);
    return list;
  }, [clinics, filters, tab]);

  const openStatusChange = (clinic: OrgClinic) => {
    setStatusForm({ status: clinic.status, reason: clinic.statusReason || "", date: clinic.statusEffectiveDate || "" });
    setStatusModal(clinic);
  };

  const submitStatus = () => {
    if (!statusModal) return;
    const clinic = statusModal;
    ask({
      title: "Confirm clinic status change",
      message: `Change ${clinic.name} to "${statusForm.status}"? This is recorded to the audit log and may notify clinic staff.`,
      confirmLabel: "Confirm change",
      onConfirm: () => {
        changeClinicStatus(clinic.id, statusForm.status, statusForm.reason, statusForm.date);
      },
    });
    setStatusModal(null);
  };

  const toggleReadiness = (clinicId: string, itemId: string) => {
    patchState((prev) => ({
      ...prev,
      clinics: prev.clinics.map((c) =>
        c.id === clinicId
          ? { ...c, readiness: c.readiness.map((r) => (r.id === itemId ? { ...r, done: !r.done } : r)) }
          : c
      ),
    }));
  };

  const createDraft = () => {
    if (!shortForm.name.trim()) {
      pushToast("Clinic name is required.", "danger");
      return;
    }
    const id = `loc_${Math.random().toString(36).slice(2, 7)}`;
    patchState((prev) => ({
      ...prev,
      clinics: [
        ...prev.clinics,
        {
          id,
          name: shortForm.name,
          tradingName: shortForm.name,
          shortName: shortForm.name.split(" ")[0],
          address: "TBC",
          suburb: shortForm.suburb,
          state: "QLD",
          postcode: "0000",
          phone: "",
          email: "",
          status: "Planned",
          practiceManager: "Not assigned",
          regionId: shortForm.regionId,
          businessGroupId: "bg_coastal",
          openingHoursSummary: "Planned",
          serviceHours: [],
          holidays: [],
          activeUsers: 0,
          warnings: ["Planned clinic — complete guided setup"],
          lat: -27.4,
          lng: 153.0,
          isDraft: true,
          readiness: [
            { id: "r1", label: "Practice manager assigned", done: false, required: true },
            { id: "r2", label: "Opening hours confirmed", done: false, required: true },
            { id: "r3", label: "Primary rooms listed", done: false, required: true },
            { id: "r4", label: "Emergency contacts set", done: false, required: true },
            { id: "r5", label: "Public holiday region set", done: false, required: true },
            { id: "r6", label: "Activation approved by Director / Senior Administrator", done: false, required: true },
          ],
          createdAt: new Date().toISOString().slice(0, 10),
        },
      ],
    }));
    pushToast("Draft clinic created — continue guided setup.", "success");
    setCreateOpen(false);
    setWizardStep(0);
  };

  const submitClosure = () => {
    if (!detail) return;
    if (addTemporaryClosure(detail.id, closureForm)) {
      setClosureForm({ date: "", name: "", reason: "" });
    }
  };

  const submitMerger = (method: "Keep one and archive" | "Create combined clinic", primaryId: string, secondaryId: string) => {
    if (!mergerReason.trim()) {
      pushToast("A reason is required to complete a merger.", "danger");
      return;
    }
    completeMerger(method, primaryId, secondaryId, mergerReason);
    setMergerReason("");
  };

  const submitCombinedMerger = (combinedId: string, partnerIds: string[]) => {
    if (!mergerReason.trim()) {
      pushToast("A reason is required to complete a merger.", "danger");
      return;
    }
    completeCombinedMerger(combinedId, partnerIds, mergerReason);
    setMergerReason("");
  };

  const mergerPairs = useMemo(() => {
    const seen = new Set<string>();
    const pairs: { a: OrgClinic; b: OrgClinic }[] = [];
    for (const c of state.clinics) {
      if (!c.mergerPartnerId || seen.has(c.id)) continue;
      const partner = state.clinics.find((p) => p.id === c.mergerPartnerId);
      if (!partner) continue;
      seen.add(c.id);
      seen.add(partner.id);
      pairs.push({ a: c, b: partner });
    }
    return pairs;
  }, [state.clinics]);

  return (
    <div className="grid gap-[18px]">
      <SectionHeader
        title="Locations & clinics"
        subtitle="Lifecycle status, service hours, holidays, mergers and activation readiness."
        actions={
          <>
            <Button variant="line" onClick={() => setCreateOpen(true)}>Short create</Button>
            <Button variant="teal" onClick={() => { setCreateOpen(true); setWizardStep(1); }}>Guided setup</Button>
          </>
        }
      />

      <SavedViewsBar section="locations" />

      <FilterBar onClear={() => setFilters({})}>
        <FilterChip label="All" active={!filters.status} onClick={() => setFilters({})} />
        <FilterChip label="Warnings" active={filters.status === "warnings"} onClick={() => setFilters({ status: "warnings" })} />
        {STATUSES.slice(0, 5).map((s) => (
          <FilterChip key={s} label={s} active={filters.status === s} onClick={() => setFilters({ status: s })} />
        ))}
      </FilterBar>

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { id: "all", label: "All clinics" },
          { id: "drafts", label: "Drafts" },
          { id: "merger", label: "Merger flows" },
        ]}
      />

      {tab === "merger" ? (
        <div className="grid gap-3">
          {mergerPairs.map(({ a, b }) => (
            <Panel key={`${a.id}-${b.id}`}>
              <PanelTitle>{a.shortName} ↔ {b.shortName}</PanelTitle>
              <PanelSub>Method on file: {a.mergerMethod || b.mergerMethod || "Not set"}</PanelSub>
              <div className="mt-3 grid gap-2">
                <label className="grid gap-1 text-sm">
                  <span className="font-bold">Merger completion reason</span>
                  <textarea className="rounded-lg border px-3 py-2" rows={2} value={mergerReason} onChange={(e) => setMergerReason(e.target.value)} />
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button small variant="teal" onClick={() => submitMerger("Keep one and archive", a.id, b.id)}>
                    Method A — Keep {a.shortName}, merge {b.shortName}
                  </Button>
                  <Button small variant="teal" onClick={() => submitMerger("Keep one and archive", b.id, a.id)}>
                    Method A — Keep {b.shortName}, merge {a.shortName}
                  </Button>
                  {(() => {
                    const combined = state.clinics.find((c) => c.isDraft && (c.mergerPartnerId === a.id || c.mergerPartnerId === b.id));
                    if (!combined) return null;
                    return (
                      <Button
                        small
                        variant="line"
                        onClick={() => submitCombinedMerger(combined.id, [a.id, b.id])}
                      >
                        Method B — Activate combined clinic ({combined.shortName})
                      </Button>
                    );
                  })()}
                </div>
              </div>
            </Panel>
          ))}
          {mergerPairs.length === 0 ? <EmptyStateWithAction title="No merger flows in progress" description="Clinics with a merger partner set will appear here." /> : null}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyStateWithAction
          title="No clinics match"
          description="Try clearing filters or switch tabs."
          actionLabel="Clear filters"
          onAction={() => { setFilters({}); setTab("all"); }}
        />
      ) : (
        <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((loc) => (
            <Panel key={loc.id}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <PanelTitle>{loc.name}</PanelTitle>
                  <PanelSub>{loc.address}</PanelSub>
                </div>
                <StatusPill
                  label={loc.status}
                  tone={loc.status === "Active" ? "success" : loc.isDraft ? "warn" : loc.status === "Temporarily Closed" ? "danger" : "default"}
                />
              </div>
              {loc.warnings.map((w) => (
                <div key={w} className="mt-2">
                  <WarningBanner>{w}</WarningBanner>
                </div>
              ))}
              <div className="mt-3 grid gap-1 text-xs text-[var(--muted)]">
                <div><strong>Manager:</strong> {loc.practiceManager}</div>
                <div><strong>Hours:</strong> {loc.openingHoursSummary}</div>
                <div><strong>Active users:</strong> {loc.activeUsers}</div>
              </div>
              {loc.isDraft || loc.readiness.some((r) => !r.done) ? (
                <div className="mt-3 rounded-lg bg-[#fbfcfd] p-3">
                  <div className="text-xs font-bold text-[var(--muted)]">Readiness checklist</div>
                  <ul className="mt-2 grid gap-1 text-xs">
                    {loc.readiness.map((r) => (
                      <li key={r.id} className="flex items-center gap-2">
                        <input type="checkbox" checked={r.done} onChange={() => toggleReadiness(loc.id, r.id)} />
                        <span className={r.done ? "text-[#166534]" : ""}>{r.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2 border-t border-[#f0f3f6] pt-3">
                <Button small variant="line" onClick={() => setDetailId(loc.id)}>Service hours & holidays</Button>
                <Button small variant="line" onClick={() => openStatusChange(loc)}>Change status</Button>
                {loc.isDraft ? (
                  <Button small variant="teal" onClick={() => activateClinic(loc.id)} title="Requires complete readiness checklist">
                    Activate
                  </Button>
                ) : null}
              </div>
              {loc.mergerPartnerId ? (
                <p className="mt-2 text-xs text-[var(--muted)]">
                  Merger with {state.clinics.find((c) => c.id === loc.mergerPartnerId)?.shortName} ({loc.mergerMethod})
                </p>
              ) : null}
            </Panel>
          ))}
        </div>
      )}

      <Modal
        open={!!statusModal}
        title="Change clinic status"
        onClose={() => setStatusModal(null)}
        footer={
          <>
            <Button variant="line" onClick={() => setStatusModal(null)}>Cancel</Button>
            <Button variant="teal" onClick={submitStatus}>Save status</Button>
          </>
        }
      >
        <p className="text-sm text-[var(--muted)]">Reason and effective date are required for every status change.</p>
        <div className="mt-3 grid gap-3">
          <label className="grid gap-1 text-sm">
            <span className="font-bold">New status</span>
            <select className="rounded-lg border px-3 py-2" value={statusForm.status} onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value as ClinicLifecycleStatus })}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-bold">Reason</span>
            <textarea className="rounded-lg border px-3 py-2" rows={3} value={statusForm.reason} onChange={(e) => setStatusForm({ ...statusForm, reason: e.target.value })} />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-bold">Effective date</span>
            <input type="date" className="rounded-lg border px-3 py-2" value={statusForm.date} onChange={(e) => setStatusForm({ ...statusForm, date: e.target.value })} />
          </label>
        </div>
      </Modal>

      <Modal
        open={createOpen}
        title={wizardStep ? "Guided clinic setup" : "Short create clinic"}
        onClose={() => setCreateOpen(false)}
        footer={
          <>
            {wizardStep > 0 ? <Button variant="line" onClick={() => setWizardStep((s) => s - 1)}>Back</Button> : null}
            <Button variant="teal" onClick={() => (wizardStep < 2 ? setWizardStep((s) => s + 1) : createDraft())}>
              {wizardStep < 2 ? "Next" : "Create draft"}
            </Button>
          </>
        }
      >
        {wizardStep === 0 ? (
          <div className="grid gap-3">
            <label className="grid gap-1 text-sm"><span className="font-bold">Clinic name</span>
              <input className="rounded-lg border px-3 py-2" value={shortForm.name} onChange={(e) => setShortForm({ ...shortForm, name: e.target.value })} />
            </label>
            <label className="grid gap-1 text-sm"><span className="font-bold">Suburb</span>
              <input className="rounded-lg border px-3 py-2" value={shortForm.suburb} onChange={(e) => setShortForm({ ...shortForm, suburb: e.target.value })} />
            </label>
          </div>
        ) : wizardStep === 1 ? (
          <p className="text-sm text-[var(--muted)]">Confirm region and business group. Service hours and holidays are configured after draft creation.</p>
        ) : (
          <p className="text-sm text-[var(--muted)]">Draft will appear under Drafts tab. Complete readiness checklist before activation.</p>
        )}
      </Modal>

      <Drawer
        open={!!detail}
        title={detail ? `${detail.name} — service hours & holidays` : ""}
        onClose={() => setDetailId(null)}
      >
        {detail ? (
          <div className="grid gap-4">
            <Panel>
              <PanelTitle>Service hours</PanelTitle>
              <div className="mt-2 overflow-auto">
                <table className="w-full min-w-[560px] text-xs">
                  <thead>
                    <tr className="text-left text-[var(--muted)]">
                      <th className="py-1 pr-2">Service</th>
                      {DAY_KEYS.map((d) => <th key={d} className="py-1 pr-2">{DAY_LABELS[d]}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {detail.serviceHours.length === 0 ? (
                      <tr><td colSpan={8} className="py-2 text-[#94a3b8]">No service hours configured yet.</td></tr>
                    ) : (
                      detail.serviceHours.map((sh) => (
                        <tr key={sh.service} className="border-t border-[#f0f3f6]">
                          <td className="py-1.5 pr-2 font-semibold">{sh.service}</td>
                          {DAY_KEYS.map((d) => <td key={d} className="py-1.5 pr-2">{sh[d]}</td>)}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Panel>

            <Panel>
              <PanelTitle>Holidays & closures</PanelTitle>
              <ul className="mt-2 grid gap-2 text-sm text-[var(--muted)]">
                {detail.holidays.map((h) => (
                  <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f0f3f6] pb-2">
                    <span><strong>{h.date}</strong> — {h.name}</span>
                    <StatusPill label={h.type} tone={h.type === "Temporary Closure" ? "warn" : "info"} title={h.reason} />
                  </li>
                ))}
                {detail.holidays.length === 0 ? <li>No holidays or closures on record.</li> : null}
              </ul>

              <div className="mt-4 rounded-lg bg-[#fbfcfd] p-3">
                <div className="text-xs font-bold text-[var(--muted)]">Add temporary closure</div>
                <div className="mt-2 grid gap-2 md:grid-cols-3">
                  <input type="date" className="rounded-lg border px-3 py-2 text-sm" value={closureForm.date} onChange={(e) => setClosureForm({ ...closureForm, date: e.target.value })} />
                  <input className="rounded-lg border px-3 py-2 text-sm" placeholder="Name" value={closureForm.name} onChange={(e) => setClosureForm({ ...closureForm, name: e.target.value })} />
                  <input className="rounded-lg border px-3 py-2 text-sm" placeholder="Reason" value={closureForm.reason} onChange={(e) => setClosureForm({ ...closureForm, reason: e.target.value })} />
                </div>
                <Button small variant="teal" className="mt-2" onClick={submitClosure}>Add closure</Button>
              </div>
            </Panel>
          </div>
        ) : null}
      </Drawer>
      {dialog}
    </div>
  );
}
