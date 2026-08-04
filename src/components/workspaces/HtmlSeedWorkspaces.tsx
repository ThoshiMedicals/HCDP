"use client";

import { useMemo, useState } from "react";
import { locationShort, HTML_RISKS } from "@/lib/mock/data";
import { usePortal } from "@/lib/portal-context";
import { useCreateForm } from "@/components/forms/CreateFormProvider";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Metric } from "@/components/ui/Metric";
import { Panel, PanelSub, PanelTitle } from "@/components/ui/Panel";
import { Table, THead, Th, Td } from "@/components/ui/Table";
import { Tabs } from "@/components/ui/Tabs";
import type { IconName } from "@/lib/modules";
import { hasFieldSchema } from "@/lib/forms/schemas";

function locLabel(
  value: unknown,
  locations: { id: string; shortName: string }[]
): string {
  if (!value) return "Unassigned";
  if (Array.isArray(value)) {
    if (!value.length) return "Unassigned";
    return value
      .map((id) => locationShort(String(id), locations as never) || String(id))
      .join(", ");
  }
  return locationShort(String(value), locations as never);
}

export function StaffDirectoryWorkspace() {
  const { locations, activeLocationId, records } = usePortal();
  const { openStaffWizard } = useCreateForm();
  const rows = useMemo(() => {
    const staff = records.staff || [];
    return staff.filter((s) => {
      if (activeLocationId === "all") return true;
      const locs = (s.locations as string[] | undefined) || [];
      const single = String(s.location || "");
      return locs.includes(activeLocationId) || single === activeLocationId || !locs.length;
    });
  }, [activeLocationId, records.staff]);

  return (
    <div className="grid gap-[18px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid flex-1 gap-3.5 md:grid-cols-3">
          <Metric label="Staff in register" value={records.staff?.length || 0} icon="users" />
          <Metric label="Showing" value={rows.length} icon="users" tone="info" />
          <Metric
            label="Active"
            value={rows.filter((s) => s.status === "Active").length}
            icon="shield"
            tone="success"
          />
        </div>
        <Button variant="teal" onClick={openStaffWizard}>
          + Add Staff
        </Button>
      </div>
      <Panel pad={false}>
        <div className="border-b border-[var(--line)] p-5">
          <PanelTitle>Staff register</PanelTitle>
          <PanelSub>
            Seeded from HTML SEED_STAFF. Add form matches HTML openStaffWizard (Basic →
            Emergency → Prefs → Personal).
          </PanelSub>
        </div>
        <div className="p-5 pt-0">
          <Table>
            <THead>
              <Th>Name</Th>
              <Th>Role</Th>
              <Th>Employment</Th>
              <Th>Contact</Th>
              <Th>Clinic</Th>
              <Th>Status</Th>
            </THead>
            <tbody>
              {rows.slice(0, 60).map((s) => (
                <tr key={String(s.id)}>
                  <Td>
                    <strong>{String(s.name)}</strong>
                    <div className="text-xs text-[var(--muted)]">{String(s.email || "")}</div>
                  </Td>
                  <Td>{String(s.role || s.sourceDesignation || "")}</Td>
                  <Td>{String(s.employmentType || "")}</Td>
                  <Td>{String(s.contactNo || s.phone || "")}</Td>
                  <Td>
                    {locLabel(
                      Array.isArray(s.locations) && (s.locations as unknown[]).length
                        ? s.locations
                        : s.location,
                      locations
                    )}
                  </Td>
                  <Td>
                    <Badge tone={s.status === "Active" ? "success" : "warn"}>
                      {String(s.status)}
                    </Badge>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Panel>
    </div>
  );
}

export function DoctorsDirectoryWorkspace() {
  const { locations, activeLocationId, records } = usePortal();
  const { openCreate } = useCreateForm();
  const rows = useMemo(() => {
    const doctors = records.doctors || [];
    return doctors.filter((d) => {
      if (activeLocationId === "all") return true;
      return String(d.location || "") === activeLocationId || !d.location;
    });
  }, [activeLocationId, records.doctors]);

  return (
    <div className="grid gap-[18px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid flex-1 gap-3.5 md:grid-cols-4">
          <Metric label="Doctors" value={records.doctors?.length || 0} icon="users" />
          <Metric label="Showing" value={rows.length} icon="users" tone="info" />
          <Metric
            label="Bank ready"
            value={rows.filter((d) => d.bankReady).length}
            icon="pay"
            tone="success"
          />
          <Metric
            label="GST registered"
            value={rows.filter((d) => d.gstRegistered).length}
            icon="chart"
          />
        </div>
        <Button variant="teal" onClick={() => openCreate("doctors")}>
          + Add Doctor
        </Button>
      </div>
      <Panel pad={false}>
        <div className="border-b border-[var(--line)] p-5">
          <PanelTitle>Doctor register</PanelTitle>
          <PanelSub>
            Seeded from HTML SEED_DOCTORS. Create drawer uses HTML FIELD_SCHEMAS.doctors.
          </PanelSub>
        </div>
        <div className="p-5 pt-0">
          <Table>
            <THead>
              <Th>Doctor</Th>
              <Th>ABN</Th>
              <Th>Clinic</Th>
              <Th>Rate %</Th>
              <Th>Bank</Th>
              <Th>Status</Th>
            </THead>
            <tbody>
              {rows.map((d) => (
                <tr key={String(d.id)}>
                  <Td>
                    <strong>{String(d.name)}</strong>
                    <div className="text-xs text-[var(--muted)]">{String(d.email || "")}</div>
                  </Td>
                  <Td>{String(d.abn || "—")}</Td>
                  <Td>{locLabel(d.location, locations)}</Td>
                  <Td>{String(d.contractRate ?? "—")}</Td>
                  <Td>
                    <Badge tone={d.bankReady ? "success" : "warn"}>
                      {d.bankReady ? "Ready" : "Not ready"}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge tone="success">{String(d.status || "Active")}</Badge>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Panel>
    </div>
  );
}

export function ChecklistsWorkspace() {
  const { records } = usePortal();
  const { openChecklistWizard } = useCreateForm();
  const [tab, setTab] = useState("templates");
  const checklists = records.checklists || [];

  return (
    <div className="grid gap-[18px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid flex-1 gap-3.5 md:grid-cols-3">
          <Metric label="Templates" value={checklists.length} icon="checklist" />
          <Metric
            label="Manager review required"
            value={checklists.filter((c) => c.managerReviewRequired).length}
            icon="shield"
            tone="warning"
          />
          <Metric
            label="Front desk"
            value={checklists.filter((c) => String(c.workflowScope).includes("Front")).length}
            icon="task"
            tone="info"
          />
        </div>
        <Button variant="teal" onClick={openChecklistWizard}>
          + Create Checklist
        </Button>
      </div>
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { id: "templates", label: "Checklist templates" },
          { id: "items", label: "Template item lists" },
        ]}
      />
      {tab === "templates" ? (
        <Panel pad={false}>
          <div className="border-b border-[var(--line)] p-5">
            <PanelTitle>Checklist library</PanelTitle>
            <PanelSub>
              HTML SEED_CHECKLISTS + newly published wizards. Create flow matches HTML
              openChecklistWizard.
            </PanelSub>
          </div>
          <div className="p-5 pt-0">
            <Table>
              <THead>
                <Th>Name</Th>
                <Th>Frequency</Th>
                <Th>Scope</Th>
                <Th>Role</Th>
                <Th>Review</Th>
                <Th>Status</Th>
              </THead>
              <tbody>
                {checklists.map((c) => (
                  <tr key={String(c.id)}>
                    <Td>
                      <strong>{String(c.name)}</strong>
                      <div className="text-xs text-[var(--muted)]">
                        {String(c.sourceDocument || "")}
                      </div>
                    </Td>
                    <Td>{String(c.frequency)}</Td>
                    <Td>{String(c.workflowScope)}</Td>
                    <Td>{String(c.responsibleRole)}</Td>
                    <Td>
                      <Badge tone={c.managerReviewRequired ? "warn" : "default"}>
                        {String(c.managerReviewStatus || "n/a")}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge tone="success">{String(c.status)}</Badge>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Panel>
      ) : (
        <div className="grid gap-3.5">
          {checklists.map((c) => (
            <Panel key={String(c.id)}>
              <PanelTitle>{String(c.name)}</PanelTitle>
              <PanelSub>{String(c.clockoutRule || c.assignment || "")}</PanelSub>
              <pre className="mt-3 max-h-48 overflow-auto rounded-xl bg-[var(--soft)] p-3 text-xs text-[#334155] whitespace-pre-wrap">
                {Array.isArray(c.items) ? (c.items as string[]).join("\n") : String(c.items || "")}
              </pre>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}

export function AccreditationWorkspace() {
  const { records } = usePortal();
  const { openCreate } = useCreateForm();
  const rows = records.accreditation || [];
  return (
    <div className="grid gap-[18px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Metric label="Evidence records" value={rows.length} icon="shield" tone="info" />
        <Button variant="teal" onClick={() => openCreate("accreditation")}>
          + Add Evidence
        </Button>
      </div>
      <Panel pad={false}>
        <div className="border-b border-[var(--line)] p-5">
          <PanelTitle>Accreditation evidence</PanelTitle>
          <PanelSub>HTML SEED_ACCREDITATION_RECORDS + FIELD_SCHEMAS.accreditation create form.</PanelSub>
        </div>
        <div className="p-5 pt-0">
          <Table>
            <THead>
              <Th>Title</Th>
              <Th>Standard</Th>
              <Th>Criterion</Th>
              <Th>Owner</Th>
              <Th>Status</Th>
            </THead>
            <tbody>
              {rows.map((r) => (
                <tr key={String(r.id)}>
                  <Td>
                    <strong>{String(r.title)}</strong>
                    <div className="text-xs text-[var(--muted)]">{String(r.description || "")}</div>
                  </Td>
                  <Td>{String(r.standard)}</Td>
                  <Td>{String(r.criterion)}</Td>
                  <Td>{String(r.owner)}</Td>
                  <Td>
                    <Badge tone="info">{String(r.status)}</Badge>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Panel>
    </div>
  );
}

export function RiskCentreWorkspace() {
  const { records } = usePortal();
  const { openCreate } = useCreateForm();
  const incidents = records.incidents || [];

  return (
    <div className="grid gap-[18px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid flex-1 gap-3.5 md:grid-cols-3">
          <Metric label="Risks" value={HTML_RISKS.length} icon="alert" tone="danger" />
          <Metric
            label="Critical / High"
            value={HTML_RISKS.filter((r) =>
              ["Critical", "High"].includes(String(r.severity || r.priority))
            ).length}
            icon="alert"
            tone="warning"
          />
          <Metric label="Incidents logged" value={incidents.length} icon="file" tone="info" />
        </div>
        <Button variant="teal" onClick={() => openCreate("incidents")}>
          + Report Incident
        </Button>
      </div>
      <div className="grid gap-2.5">
        {HTML_RISKS.map((r, i) => (
          <div
            key={String(r.id || i)}
            className="rounded-[14px] border border-[var(--v34-card-line)] bg-[var(--card)] p-4 shadow-[var(--v34-card-shadow)]"
          >
            <div className="mb-2 flex flex-wrap gap-1.5">
              <Badge tone="danger">{String(r.severity || r.priority || "Risk")}</Badge>
              <Badge tone="teal">{String(r.category || r.module || "Risk")}</Badge>
            </div>
            <strong className="block text-[15px]">
              {String(r.title || r.name || `Risk ${i + 1}`)}
            </strong>
            <p className="mb-0 mt-1 text-sm text-[var(--muted)]">
              {String(r.route || r.summary || r.description || "")}
            </p>
          </div>
        ))}
      </div>
      {incidents.length ? (
        <Panel>
          <PanelTitle>Incidents from HTML form ({incidents.length})</PanelTitle>
          <PanelSub>Created via FIELD_SCHEMAS.incidents.</PanelSub>
          <div className="mt-3 grid gap-2">
            {incidents.map((row) => (
              <div
                key={String(row.id)}
                className="rounded-xl border border-[var(--v34-card-line)] p-3 text-sm"
              >
                <strong>{String(row.title || row.id)}</strong>
                <div className="mt-1 text-xs text-[var(--muted)]">
                  {String(row.category || "")} · {String(row.severity || "")}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      ) : null}
    </div>
  );
}

export function HtmlModuleFallback({
  title,
  source,
  icon = "file",
  htmlId,
}: {
  title: string;
  source: string;
  icon?: IconName;
  htmlId: string;
}) {
  const { openCreate } = useCreateForm();
  const { records } = usePortal();
  const canCreate = hasFieldSchema(htmlId);
  const created = records[htmlId] || [];

  return (
    <div className="grid gap-[18px]">
      <Panel>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            <Badge tone="teal">HTML module</Badge>
            <Badge>FIELD_SCHEMAS</Badge>
          </div>
          {canCreate ? (
            <Button variant="teal" onClick={() => openCreate(htmlId)}>
              + Create
            </Button>
          ) : null}
        </div>
        <PanelTitle>{title}</PanelTitle>
        <PanelSub>
          Form fields copied from HTML FIELD_SCHEMAS when available. Source: {source}.
        </PanelSub>
        {!canCreate ? (
          <div className="mt-4 rounded-2xl border border-[#fed7aa] bg-[#fff7ed] p-4 text-sm text-[#92400e]">
            No create schema in HTML FIELD_SCHEMAS for `{htmlId}`.
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-[var(--hcdp-status-info-border)] bg-[var(--hcdp-status-info-surface)] p-4 text-sm text-[var(--hcdp-status-info-text)]">
            Use + Create to open the exact HTML form fields for this module.
          </div>
        )}
        <div className="mt-4 text-xs text-[var(--muted)]">Icon family: {icon}</div>
      </Panel>

      {created.length ? (
        <Panel>
          <PanelTitle>Created records ({created.length})</PanelTitle>
          <PanelSub>Saved locally in the UI session from the HTML form.</PanelSub>
          <div className="mt-3 grid gap-2">
            {created.slice(0, 20).map((row) => (
              <div
                key={String(row.id)}
                className="rounded-xl border border-[var(--v34-card-line)] p-3 text-sm"
              >
                <strong>
                  {String(row.name || row.title || row.id)}
                </strong>
                <pre className="mb-0 mt-2 overflow-auto text-[length:var(--type-control)] text-[var(--muted)]">
                  {JSON.stringify(row, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
