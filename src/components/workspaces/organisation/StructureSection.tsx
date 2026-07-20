"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Panel, PanelSub, PanelTitle } from "@/components/ui/Panel";
import { Table, THead, Th, Td } from "@/components/ui/Table";
import { Tabs } from "@/components/ui/Tabs";
import { useOrganisation } from "@/lib/organisation/context";
import { appendAudit } from "@/lib/organisation/store";
import type { OrgNode, StructureLevel } from "@/lib/organisation/types";
import { SectionHeader, StatusPill, WarningBanner } from "./org-ui";

const LEVELS: StructureLevel[] = ["Parent Company", "Business Group", "Region", "Clinic"];
const STRUCTURE_GATE_ROLES = ["Director", "Senior Administrator"];

export function StructureSection() {
  const { state, patchState, pushToast, actor, clinics } = useOrganisation();
  const [view, setView] = useState("tree");
  const [modal, setModal] = useState<{ open: boolean; node?: OrgNode }>({ open: false });
  const [form, setForm] = useState({ name: "", level: "Region" as StructureLevel, parentId: "org_parent" });
  const canEditStructure = STRUCTURE_GATE_ROLES.includes(actor.role);

  const roots = state.nodes.filter((n) => !n.parentId);
  const childrenOf = (id: string) => state.nodes.filter((n) => n.parentId === id);

  function renderTree(parentId: string | null, depth = 0): React.ReactNode {
    const nodes = parentId ? childrenOf(parentId) : roots;
    return nodes.map((n) => (
      <div key={n.id} style={{ marginLeft: depth * 16 }} className="border-l border-[#e2e8f0] pl-3">
        <div className="flex flex-wrap items-center gap-2 py-1.5">
          <StatusPill label={n.level} tone="info" />
          <span className="font-semibold text-sm">{n.name}</span>
          <Button
            small
            variant="line"
            disabled={!canEditStructure}
            onClick={() => { setForm({ name: n.name, level: n.level, parentId: n.parentId || "org_parent" }); setModal({ open: true, node: n }); }}
          >
            Edit
          </Button>
        </div>
        {renderTree(n.id, depth + 1)}
      </div>
    ));
  }

  const saveNode = () => {
    if (!form.name.trim()) {
      pushToast("Name is required.", "danger");
      return;
    }
    if (!canEditStructure) {
      pushToast("Structural changes require Director or Senior Administrator sign-off.", "danger");
      return;
    }
    patchState((prev) => {
      if (modal.node) {
        const previousName = modal.node.name;
        return appendAudit(
          {
            ...prev,
            nodes: prev.nodes.map((n) => (n.id === modal.node!.id ? { ...n, name: form.name, level: form.level } : n)),
          },
          {
            entityType: "Structure",
            entityId: modal.node!.id,
            entityLabel: form.name,
            field: "name/level",
            previousValue: `${previousName} · ${modal.node!.level}`,
            newValue: `${form.name} · ${form.level}`,
            reason: "Structure node updated",
            approval: "Director / Senior Administrator",
            device: "Desktop · Demo",
            locationLabel: "Module 3",
          }
        );
      }
      const id = `node_${Math.random().toString(36).slice(2, 7)}`;
      return appendAudit(
        {
          ...prev,
          nodes: [...prev.nodes, { id, name: form.name, level: form.level, parentId: form.parentId }],
        },
        {
          entityType: "Structure",
          entityId: id,
          entityLabel: form.name,
          field: "created",
          previousValue: "—",
          newValue: `${form.name} · ${form.level}`,
          reason: "Structure node created",
          approval: "Director / Senior Administrator",
          device: "Desktop · Demo",
          locationLabel: "Module 3",
        }
      );
    });
    pushToast(modal.node ? "Structure node updated." : "Structure node created.", "success");
    setModal({ open: false });
  };

  const setRelationshipPrimary = (clinicId: string, nodeId: string) => {
    if (!canEditStructure) {
      pushToast("Reporting relationship changes require Director or Senior Administrator sign-off.", "danger");
      return;
    }
    patchState((prev) =>
      appendAudit(
        {
          ...prev,
          relationships: prev.relationships.map((r) =>
            r.clinicId === clinicId ? { ...r, isPrimary: r.reportsToNodeId === nodeId } : r
          ),
        },
        {
          entityType: "Structure",
          entityId: clinicId,
          entityLabel: `${clinics.find((c) => c.id === clinicId)?.shortName || clinicId} reporting`,
          field: "primaryReporting",
          previousValue: "—",
          newValue: state.nodes.find((n) => n.id === nodeId)?.name || nodeId,
          reason: "Primary reporting relationship changed",
          approval: "Director / Senior Administrator",
          device: "Desktop · Demo",
          locationLabel: "Module 3",
        }
      )
    );
    pushToast("Primary reporting relationship updated.", "success");
  };

  return (
    <div className="grid gap-[18px]">
      <SectionHeader
        title="Organisation structure"
        subtitle="Parent Company → Business Group → Region → Clinic. Major changes require Director or Senior Administrator approval."
        actions={
          <Button
            variant="teal"
            disabled={!canEditStructure}
            title={canEditStructure ? undefined : "Only Director or Senior Administrator can make structural changes"}
            onClick={() => {
              setForm({ name: "", level: "Region", parentId: "bg_metro" });
              setModal({ open: true });
            }}
          >
            + Add node
          </Button>
        }
      />

      <WarningBanner>
        Structural changes affecting clinics or reporting lines must be approved by a Director or Senior Administrator.
        {!canEditStructure ? " You are viewing as a role without edit rights — changes are disabled." : ""}
      </WarningBanner>

      <Tabs
        value={view}
        onChange={setView}
        items={[
          { id: "tree", label: "Tree" },
          { id: "cards", label: "Cards" },
          { id: "list", label: "List" },
          { id: "reporting", label: "Reporting" },
          { id: "map", label: "Map" },
        ]}
      />

      {view === "tree" ? <Panel className="overflow-auto">{renderTree(null)}</Panel> : null}

      {view === "cards" ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {LEVELS.map((level) => (
            <Panel key={level}>
              <h4 className="m-0 text-sm font-extrabold">{level}</h4>
              <ul className="mt-2 grid gap-1 text-sm text-[#526479]">
                {state.nodes.filter((n) => n.level === level).map((n) => (
                  <li key={n.id}>{n.name}</li>
                ))}
              </ul>
            </Panel>
          ))}
        </div>
      ) : null}

      {view === "list" ? (
        <Panel>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[#526479]">
                <th className="pb-2">Name</th>
                <th>Level</th>
                <th>Parent</th>
              </tr>
            </thead>
            <tbody>
              {state.nodes.map((n) => (
                <tr key={n.id} className="border-t border-[#f0f3f6]">
                  <td className="py-2 font-semibold">{n.name}</td>
                  <td>{n.level}</td>
                  <td>{state.nodes.find((p) => p.id === n.parentId)?.name || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      ) : null}

      {view === "reporting" ? (
        <Panel>
          <PanelTitle>Clinic reporting relationships</PanelTitle>
          <PanelSub>Primary reporting drives escalation and structure rollups. Clinics may also have additional (non-primary) reporting lines.</PanelSub>
          <Table>
            <THead>
              <Th>Clinic</Th>
              <Th>Reports to</Th>
              <Th>Type</Th>
              <Th />
            </THead>
            <tbody>
              {state.relationships.map((r) => (
                <tr key={r.id}>
                  <Td>{clinics.find((c) => c.id === r.clinicId)?.shortName || r.clinicId}</Td>
                  <Td>{state.nodes.find((n) => n.id === r.reportsToNodeId)?.name || r.reportsToNodeId}</Td>
                  <Td><StatusPill label={r.isPrimary ? "Primary" : "Additional"} tone={r.isPrimary ? "success" : "default"} /></Td>
                  <Td>
                    {!r.isPrimary ? (
                      <Button small variant="line" disabled={!canEditStructure} onClick={() => setRelationshipPrimary(r.clinicId, r.reportsToNodeId)}>
                        Make primary
                      </Button>
                    ) : null}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Panel>
      ) : null}

      {view === "map" ? (
        <Panel>
          <p className="m-0 text-sm text-[#526479]">
            Clinic map pins use latitude/longitude from clinic profiles. Open Locations for full map controls.
          </p>
          <div className="mt-4 grid gap-2 md:grid-cols-3">
            {state.clinics.slice(0, 6).map((c) => (
              <div key={c.id} className="rounded-lg border border-[var(--line)] p-3 text-xs">
                <strong>{c.shortName}</strong>
                <div className="text-[#64748b]">
                  {c.lat.toFixed(3)}, {c.lng.toFixed(3)}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      ) : null}

      <Modal
        open={modal.open}
        title={modal.node ? "Edit structure node" : "Create structure node"}
        onClose={() => setModal({ open: false })}
        footer={
          <>
            <Button variant="line" onClick={() => setModal({ open: false })}>Cancel</Button>
            <Button variant="teal" onClick={saveNode}>Save</Button>
          </>
        }
      >
        <div className="grid gap-3">
          <label className="grid gap-1 text-sm">
            <span className="font-bold">Name</span>
            <input className="rounded-lg border border-[var(--line)] px-3 py-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-bold">Level</span>
            <select className="rounded-lg border border-[var(--line)] px-3 py-2" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value as StructureLevel })}>
              {LEVELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </label>
        </div>
      </Modal>
    </div>
  );
}
