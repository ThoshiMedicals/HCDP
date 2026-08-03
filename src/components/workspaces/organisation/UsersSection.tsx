"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Modal } from "@/components/ui/Modal";
import { Panel, PanelSub, PanelTitle } from "@/components/ui/Panel";
import { Table, THead, Th, Td } from "@/components/ui/Table";
import { Tabs } from "@/components/ui/Tabs";
import { useOrganisation } from "@/lib/organisation/context";
import { appendAudit } from "@/lib/organisation/store";
import type { OrgUser, UserAccountStatus } from "@/lib/organisation/types";
import { EmptyStateWithAction, FilterBar, FilterChip, SavedViewsBar, SectionHeader, StatusPill, WarningBanner } from "./org-ui";

const STATUS_OPTIONS: UserAccountStatus[] = [
  "Invited",
  "Pending Approval",
  "Active",
  "Temporarily Suspended",
  "Locked",
  "On Leave",
  "Access Review Required",
  "Employment Ended",
  "Archived",
];

export function UsersSection() {
  const { state, clinics, filters, setFilters, changePrimaryClinic, changeUserStatus, daysUntil, patchState, pushToast } = useOrganisation();
  const [createMode, setCreateMode] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [profileTab, setProfileTab] = useState("personal");
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", clinicId: clinics[0]?.id || "", role: "Receptionist" });
  const [statusModal, setStatusModal] = useState(false);
  const [statusForm, setStatusForm] = useState<{ status: UserAccountStatus; reason: string }>({ status: "Active", reason: "" });

  const selected = selectedId ? state.users.find((u) => u.id === selectedId) || null : null;

  const users = useMemo(() => {
    let list = state.users.filter((u) => clinics.some((c) => c.id === u.primaryClinicId) || state.assignments.some((a) => a.userId === u.id));
    if (filters.status === "issues") list = list.filter((u) => u.accessIssues.length > 0);
    else if (filters.status) list = list.filter((u) => u.status === filters.status);
    if (filters.role) list = list.filter((u) => u.role === filters.role);
    if (filters.clinicId) {
      list = list.filter(
        (u) => u.primaryClinicId === filters.clinicId || state.assignments.some((a) => a.userId === u.id && a.clinicId === filters.clinicId)
      );
    }
    if (filters.query) list = list.filter((u) => `${u.firstName} ${u.lastName}`.toLowerCase().includes(filters.query!.toLowerCase()));
    if (filters.card) list = list.filter((u) => u.id === filters.card);
    return list;
  }, [state, clinics, filters]);

  const createUser = (via: OrgUser["createdVia"]) => {
    if (!form.firstName || !form.email) {
      pushToast("Name and email required.", "danger");
      return;
    }
    const id = `usr_${Math.random().toString(36).slice(2, 7)}`;
    const status: OrgUser["status"] = via === "Manager request" ? "Pending Approval" : "Invited";
    patchState((prev) =>
      appendAudit(
        {
          ...prev,
          users: [
            ...prev.users,
            {
              id,
              firstName: form.firstName,
              lastName: form.lastName,
              email: form.email,
              phone: "",
              status,
              primaryClinicId: form.clinicId,
              role: form.role as OrgUser["role"],
              secondaryRoles: [],
              jobTitle: form.role,
              employmentType: "Full-time",
              startDate: new Date().toISOString().slice(0, 10),
              trainingComplete: false,
              verificationComplete: false,
              failedSignIns: 0,
              emergencyAccessActive: false,
              accessIssues: via === "Manager request" ? ["Awaiting approval"] : ["Invitation pending"],
              createdVia: via,
            },
          ],
          assignments: [...prev.assignments, { id: `as_${id}`, userId: id, clinicId: form.clinicId, type: "Primary Clinic", startDate: new Date().toISOString().slice(0, 10) }],
        },
        {
          entityType: "User",
          entityId: id,
          entityLabel: `${form.firstName} ${form.lastName}`,
          field: "status",
          previousValue: "—",
          newValue: status,
          reason: `User created via ${via}`,
          device: "Desktop · Demo",
          locationLabel: "Module 3",
        }
      )
    );
    pushToast(`User created via ${via}.`, "success");
    setCreateMode(null);
  };

  const userAssignments = selected ? state.assignments.filter((a) => a.userId === selected.id) : [];
  const userExceptions = selected ? state.exceptions.filter((e) => e.userId === selected.id) : [];
  const userAudit = selected
    ? state.audit.filter((a) => a.entityId === selected.id || a.entityLabel.includes(`${selected.firstName} ${selected.lastName}`))
    : [];
  const userReviews = selected ? state.reviews.filter((r) => r.userId === selected.id) : [];
  const userRequests = selected ? state.requests.filter((r) => r.subjectUserId === selected.id) : [];

  const openStatusModal = () => {
    if (!selected) return;
    setStatusForm({ status: selected.status, reason: "" });
    setStatusModal(true);
  };

  const submitStatusChange = () => {
    if (!selected) return;
    if (!statusForm.reason.trim()) {
      pushToast("A reason is required for a status change.", "danger");
      return;
    }
    if (changeUserStatus(selected.id, statusForm.status, statusForm.reason)) {
      setStatusModal(false);
    }
  };

  return (
    <div className="grid gap-[18px]">
      <SectionHeader
        title="Users"
        subtitle="Create manually, via manager, staff record or bulk import. One primary clinic per user."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="line" small onClick={() => setCreateMode("Manual entry")}>Manual</Button>
            <Button variant="line" small onClick={() => setCreateMode("Manager request")}>Manager</Button>
            <Button variant="line" small onClick={() => setCreateMode("Existing staff record")}>Staff record</Button>
            <Button variant="teal" small onClick={() => setCreateMode("Bulk import")}>Bulk</Button>
          </div>
        }
      />

      <SavedViewsBar section="users" />

      <FilterBar onClear={() => setFilters({})}>
        <FilterChip label="All" active={!filters.status} onClick={() => setFilters({})} />
        <FilterChip label="Active" active={filters.status === "Active"} onClick={() => setFilters({ status: "Active" })} />
        <FilterChip label="Access issues" active={filters.status === "issues"} onClick={() => setFilters({ status: "issues" })} />
        <FilterChip label="Locked" active={filters.status === "Locked"} onClick={() => setFilters({ status: "Locked" })} />
        <FilterChip label="Archived" active={filters.status === "Archived"} onClick={() => setFilters({ status: "Archived" })} />
        {filters.role ? <FilterChip label={`Role: ${filters.role}`} active onClick={() => setFilters({ ...filters, role: undefined })} /> : null}
        {filters.clinicId ? (
          <FilterChip
            label={`Clinic: ${clinics.find((c) => c.id === filters.clinicId)?.shortName || filters.clinicId}`}
            active
            onClick={() => setFilters({ ...filters, clinicId: undefined })}
          />
        ) : null}
      </FilterBar>

      {users.length === 0 ? (
        <EmptyStateWithAction
          title="No users match these filters"
          description="Try clearing filters to see the full user list."
          actionLabel="Clear filters"
          onAction={() => setFilters({})}
        />
      ) : (
        <Table>
          <THead>
            <Th>Name</Th>
            <Th>Status</Th>
            <Th>Role</Th>
            <Th>Primary clinic</Th>
            <Th>Issues</Th>
            <Th />
          </THead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <Td><strong>{u.firstName} {u.lastName}</strong><div className="text-xs text-[var(--muted)]">{u.email}</div></Td>
                <Td><StatusPill label={u.status} tone={u.status === "Active" ? "success" : u.status === "Locked" ? "danger" : "warn"} /></Td>
                <Td>{u.role}</Td>
                <Td>{clinics.find((c) => c.id === u.primaryClinicId)?.shortName || u.primaryClinicId}</Td>
                <Td>{u.accessIssues[0] || "—"}</Td>
                <Td><Button small variant="line" onClick={() => { setSelectedId(u.id); setProfileTab("personal"); }}>Open</Button></Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal open={!!createMode} title={`Create user — ${createMode}`} onClose={() => setCreateMode(null)} footer={
        <>
          <Button variant="line" onClick={() => setCreateMode(null)}>Cancel</Button>
          <Button variant="teal" onClick={() => createUser(createMode as OrgUser["createdVia"])}>Create</Button>
        </>
      }>
        {createMode === "Bulk import" ? (
          <p className="text-sm text-[var(--muted)]">Bulk import demo: adds one sample user. Full CSV import is out of scope for this prototype.</p>
        ) : (
          <div className="grid gap-3">
            <input className="rounded-lg border px-3 py-2" placeholder="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            <input className="rounded-lg border px-3 py-2" placeholder="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            <input className="rounded-lg border px-3 py-2" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <select className="rounded-lg border px-3 py-2" value={form.clinicId} onChange={(e) => setForm({ ...form, clinicId: e.target.value })}>
              {clinics.map((c) => <option key={c.id} value={c.id}>{c.shortName}</option>)}
            </select>
          </div>
        )}
      </Modal>

      <Drawer
        open={!!selected}
        title={selected ? `${selected.firstName} ${selected.lastName}` : ""}
        subtitle={selected ? `${selected.role} · ${selected.status}` : undefined}
        onClose={() => setSelectedId(null)}
        footer={selected ? <Button variant="teal" onClick={openStatusModal}>Change status</Button> : undefined}
      >
        {selected ? (
          <div className="grid gap-4">
            <Tabs value={profileTab} onChange={setProfileTab} items={[
              { id: "personal", label: "Personal & Contact" },
              { id: "employment", label: "Employment" },
              { id: "assignments", label: "Clinic Assignments" },
              { id: "roles", label: "Roles & Permissions" },
              { id: "training", label: "Training & Verification" },
              { id: "security", label: "Login & Security" },
              { id: "history", label: "Access History" },
              { id: "audit", label: "Audit Records" },
            ]} />

            {profileTab === "personal" ? (
              <Panel>
                <PanelTitle>Personal & contact</PanelTitle>
                <div className="mt-2 grid gap-1 text-sm text-[var(--muted)]">
                  <div><strong>Name:</strong> {selected.firstName} {selected.lastName}</div>
                  <div><strong>Email:</strong> {selected.email}</div>
                  <div><strong>Phone:</strong> {selected.phone || "—"}</div>
                  <div><strong>Status:</strong> <StatusPill label={selected.status} tone="info" /></div>
                </div>
              </Panel>
            ) : null}

            {profileTab === "employment" ? (
              <Panel>
                <PanelTitle>Employment</PanelTitle>
                <div className="mt-2 grid gap-1 text-sm text-[var(--muted)]">
                  <div><strong>Job title:</strong> {selected.jobTitle}</div>
                  <div><strong>Employment type:</strong> {selected.employmentType}</div>
                  <div><strong>Manager:</strong> {selected.managerName || "—"}</div>
                  <div><strong>Start date:</strong> {selected.startDate}</div>
                  <div><strong>Created via:</strong> {selected.createdVia}</div>
                </div>
              </Panel>
            ) : null}

            {profileTab === "assignments" ? (
              <Panel>
                <PanelTitle>Clinic assignments</PanelTitle>
                <ul className="mt-2 grid gap-2 text-sm">
                  {userAssignments.map((a) => {
                    const isExpiring = a.type === "Temporary Cover" || a.type === "Emergency Access";
                    const days = a.endDate ? daysUntil(a.endDate) : null;
                    return (
                      <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f0f3f6] pb-2">
                        <span>{clinics.find((c) => c.id === a.clinicId)?.shortName || a.clinicId}</span>
                        <div className="flex items-center gap-2">
                          <StatusPill label={a.type} tone={a.type === "Emergency Access" ? "emergency" : "default"} />
                          {isExpiring && days !== null ? (
                            <StatusPill
                              label={days <= 0 ? "Expired" : `${days} day${days === 1 ? "" : "s"} left`}
                              tone={days <= 1 ? "danger" : days <= 7 ? "warn" : "default"}
                            />
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                  {userAssignments.length === 0 ? <li className="text-[var(--muted)]">No clinic assignments.</li> : null}
                </ul>
                <PanelSub>Changing primary clinic triggers an access review.</PanelSub>
                <select
                  className="mt-3 w-full rounded-lg border px-3 py-2 text-sm"
                  value={selected.primaryClinicId}
                  onChange={(e) => changePrimaryClinic(selected.id, e.target.value, "Primary clinic changed from user profile")}
                >
                  {clinics.map((c) => <option key={c.id} value={c.id}>{c.shortName}</option>)}
                </select>
              </Panel>
            ) : null}

            {profileTab === "roles" ? (
              <Panel>
                <PanelTitle>Roles & permissions</PanelTitle>
                <div className="mt-2 grid gap-1 text-sm text-[var(--muted)]">
                  <div><strong>Primary role:</strong> {selected.role}</div>
                  <div><strong>Secondary roles:</strong> {selected.secondaryRoles.length ? selected.secondaryRoles.join(", ") : "None"}</div>
                </div>
                {userExceptions.length ? (
                  <div className="mt-3">
                    <div className="text-xs font-bold text-[var(--muted)]">Permission exceptions</div>
                    <ul className="mt-1 grid gap-1 text-sm text-[var(--muted)]">
                      {userExceptions.map((e) => (
                        <li key={e.id}>{e.permissionKey} — {e.level} (reviews {e.reviewDate})</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </Panel>
            ) : null}

            {profileTab === "training" ? (
              <Panel>
                <PanelTitle>Training & verification</PanelTitle>
                <div className="mt-2 flex flex-wrap gap-2">
                  <StatusPill label={selected.trainingComplete ? "Training complete" : "Training incomplete"} tone={selected.trainingComplete ? "success" : "warn"} />
                  <StatusPill label={selected.verificationComplete ? "Identity verified" : "Verification pending"} tone={selected.verificationComplete ? "success" : "warn"} />
                </div>
              </Panel>
            ) : null}

            {profileTab === "security" ? (
              <Panel>
                <PanelTitle>Login & security</PanelTitle>
                <div className="mt-2 grid gap-1 text-sm text-[var(--muted)]">
                  <div><strong>Last login:</strong> {selected.lastLogin ? new Date(selected.lastLogin).toLocaleString() : "Never"}</div>
                  <div><strong>Failed sign-ins:</strong> {selected.failedSignIns}</div>
                  <div><strong>Emergency access active:</strong> {selected.emergencyAccessActive ? "Yes" : "No"}</div>
                </div>
                {selected.accessIssues.length ? (
                  <div className="mt-3 grid gap-2">
                    {selected.accessIssues.map((i) => <WarningBanner key={i}>{i}</WarningBanner>)}
                  </div>
                ) : null}
              </Panel>
            ) : null}

            {profileTab === "history" ? (
              <Panel>
                <PanelTitle>Access history</PanelTitle>
                <div className="mt-2 grid gap-2 text-sm text-[var(--muted)]">
                  {userRequests.map((r) => (
                    <div key={r.id} className="border-b border-[#f0f3f6] pb-2">
                      <strong>{r.title}</strong> — <StatusPill label={r.status} tone="info" />
                    </div>
                  ))}
                  {userReviews.map((r) => (
                    <div key={r.id} className="border-b border-[#f0f3f6] pb-2">
                      Review ({r.trigger}) — <StatusPill label={r.status} tone={r.status === "Overdue" ? "danger" : "info"} />
                    </div>
                  ))}
                  {userRequests.length === 0 && userReviews.length === 0 ? <div>No access requests or reviews on record.</div> : null}
                </div>
              </Panel>
            ) : null}

            {profileTab === "audit" ? (
              <Panel>
                <PanelTitle>Audit records</PanelTitle>
                <ul className="mt-2 grid gap-2 text-sm text-[var(--muted)]">
                  {userAudit.map((a) => (
                    <li key={a.id} className="border-b border-[#f0f3f6] pb-2">
                      <div className="text-xs text-[#94a3b8]">{new Date(a.at).toLocaleString()} · {a.actorName}</div>
                      {a.field}: {a.previousValue} → {a.newValue}
                    </li>
                  ))}
                  {userAudit.length === 0 ? <li>No audit records for this user yet.</li> : null}
                </ul>
              </Panel>
            ) : null}
          </div>
        ) : null}
      </Drawer>

      <Modal
        open={statusModal}
        title="Change user status"
        onClose={() => setStatusModal(false)}
        footer={
          <>
            <Button variant="line" onClick={() => setStatusModal(false)}>Cancel</Button>
            <Button variant="teal" onClick={submitStatusChange}>Save status</Button>
          </>
        }
      >
        <div className="grid gap-3 text-sm">
          <label className="grid gap-1">
            <span className="font-bold">New status</span>
            <select
              className="rounded-lg border px-3 py-2"
              value={statusForm.status}
              onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value as UserAccountStatus })}
            >
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="grid gap-1">
            <span className="font-bold">Reason (required)</span>
            <textarea className="rounded-lg border px-3 py-2" rows={3} value={statusForm.reason} onChange={(e) => setStatusForm({ ...statusForm, reason: e.target.value })} />
          </label>
        </div>
      </Modal>
    </div>
  );
}
