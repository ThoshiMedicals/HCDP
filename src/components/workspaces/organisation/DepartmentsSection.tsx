"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Panel, PanelSub, PanelTitle } from "@/components/ui/Panel";
import { Table, THead, Th, Td } from "@/components/ui/Table";
import { Tabs } from "@/components/ui/Tabs";
import { useOrganisation } from "@/lib/organisation/context";
import { appendAudit } from "@/lib/organisation/store";
import { EmptyStateWithAction, FilterBar, FilterChip, SectionHeader, StatusPill } from "./org-ui";

export function DepartmentsSection() {
  const { state, clinics, filters, setFilters, patchState, pushToast } = useOrganisation();
  const [view, setView] = useState("list");
  const [showArchived, setShowArchived] = useState(false);

  const clinicIds = useMemo(() => new Set(clinics.map((c) => c.id)), [clinics]);
  const departments = useMemo(() => {
    let deps = state.departments.filter((d) => clinicIds.has(d.clinicId));
    if (!showArchived) deps = deps.filter((d) => !d.archived);
    if (filters.clinicId) deps = deps.filter((d) => d.clinicId === filters.clinicId);
    if (filters.status === "restricted") deps = deps.filter((d) => d.restricted);
    return deps;
  }, [state.departments, clinicIds, showArchived, filters]);

  const archivedOnly = useMemo(
    () => state.departments.filter((d) => clinicIds.has(d.clinicId) && d.archived),
    [state.departments, clinicIds]
  );

  const archiveRoom = (id: string) => {
    const room = state.departments.find((d) => d.id === id);
    patchState((prev) =>
      appendAudit(
        {
          ...prev,
          departments: prev.departments.map((d) => (d.id === id ? { ...d, archived: true, status: "Decommissioned" as const } : d)),
        },
        {
          entityType: "Room",
          entityId: id,
          entityLabel: room ? `${room.name} · ${room.clinicId}` : id,
          field: "archived",
          previousValue: "false",
          newValue: "true",
          reason: "Room archived — history retained",
          device: "Desktop · Demo",
          locationLabel: "Module 3",
        }
      )
    );
    pushToast("Room archived — history retained.", "success");
  };

  const grouped = useMemo(() => {
    const map = new Map<string, typeof departments>();
    for (const d of departments) {
      const key = `${d.building} · ${d.floor} · ${d.zone}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(d);
    }
    return [...map.entries()];
  }, [departments]);

  return (
    <div className="grid gap-[18px]">
      <SectionHeader
        title="Departments & areas"
        subtitle="Rooms and areas by building, floor and zone. Archive instead of delete."
      />

      <FilterBar onClear={() => setFilters({})}>
        <FilterChip label="All clinics" active={!filters.clinicId} onClick={() => setFilters({})} />
        {clinics.slice(0, 4).map((c) => (
          <FilterChip key={c.id} label={c.shortName} active={filters.clinicId === c.id} onClick={() => setFilters({ clinicId: c.id })} />
        ))}
        <FilterChip label="Restricted" active={filters.status === "restricted"} onClick={() => setFilters({ status: "restricted" })} />
        <FilterChip label="Archived" active={showArchived} onClick={() => setShowArchived((v) => !v)} />
      </FilterBar>

      <Tabs
        value={view}
        onChange={setView}
        items={[
          { id: "list", label: "List" },
          { id: "cards", label: "Cards" },
          { id: "visual", label: "By building" },
        ]}
      />

      {!showArchived && departments.length === 0 ? (
        <EmptyStateWithAction
          title="No rooms match filters"
          description="Try a different clinic or turn on Archived to see decommissioned rooms."
          actionLabel="Show archived rooms"
          onAction={() => setShowArchived(true)}
        />
      ) : showArchived && archivedOnly.length === 0 ? (
        <EmptyStateWithAction title="No archived rooms" description="Archived rooms appear here for audit history." />
      ) : null}

      {view === "list" && departments.length > 0 ? (
        <Table>
          <THead>
            <Th>Area</Th>
            <Th>Clinic</Th>
            <Th>Location</Th>
            <Th>Primary / backup</Th>
            <Th>Status</Th>
            <Th />
          </THead>
          <tbody>
            {departments.map((d) => (
              <tr key={d.id}>
                <Td>
                  <strong>{d.name}</strong>
                  {d.restricted ? <StatusPill label="Restricted" tone="danger" /> : null}
                </Td>
                <Td>{clinics.find((c) => c.id === d.clinicId)?.shortName}</Td>
                <Td>{d.building} · {d.floor} · {d.zone}</Td>
                <Td>{d.primaryPersonName} / {d.backupPersonName}</Td>
                <Td><StatusPill label={d.status} tone={d.status === "Active" ? "success" : d.status === "Restricted Access" ? "danger" : "warn"} /></Td>
                <Td>
                  {!d.archived ? (
                    <Button small variant="line" onClick={() => archiveRoom(d.id)} title="Archive — do not delete">
                      Archive
                    </Button>
                  ) : (
                    <StatusPill label="Archived" tone="default" />
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : null}

      {view === "cards" ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {departments.map((d) => (
            <Panel key={d.id}>
              <PanelTitle>{d.name}</PanelTitle>
              <PanelSub>{clinics.find((c) => c.id === d.clinicId)?.shortName} · {d.zone}</PanelSub>
              <div className="mt-2 text-xs text-[var(--muted)]">
                Primary: {d.primaryPersonName}<br />
                Backup: {d.backupPersonName}
              </div>
              <div className="mt-2"><StatusPill label={d.status} tone={d.restricted ? "danger" : "success"} /></div>
            </Panel>
          ))}
        </div>
      ) : null}

      {view === "visual" ? (
        <div className="grid gap-4">
          {grouped.map(([key, items]) => (
            <Panel key={key}>
              <PanelTitle>{key}</PanelTitle>
              <div className="mt-3 flex flex-wrap gap-2">
                {items.map((d) => (
                  <div
                    key={d.id}
                    className="min-w-[120px] rounded-lg border border-[var(--line)] px-3 py-2 text-xs"
                    title={d.notes}
                  >
                    <strong>{d.name}</strong>
                    <div><StatusPill label={d.status} tone={d.restricted ? "danger" : "info"} /></div>
                  </div>
                ))}
              </div>
            </Panel>
          ))}
        </div>
      ) : null}

      {showArchived && archivedOnly.length > 0 ? (
        <Panel>
          <PanelTitle>Archived rooms</PanelTitle>
          <PanelSub>Immutable history — rooms are archived, not deleted.</PanelSub>
          <ul className="mt-3 grid gap-1 text-sm text-[var(--muted)]">
            {archivedOnly.map((d) => (
              <li key={d.id}>{d.name} · {clinics.find((c) => c.id === d.clinicId)?.shortName}</li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </div>
  );
}
