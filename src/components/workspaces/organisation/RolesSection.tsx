"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Panel, PanelSub, PanelTitle } from "@/components/ui/Panel";
import { Table, THead, Th, Td } from "@/components/ui/Table";
import { useOrganisation } from "@/lib/organisation/context";
import { appendAudit } from "@/lib/organisation/store";
import type { PermissionAction, PermissionLevel } from "@/lib/organisation/types";
import { SectionHeader, StatusPill, WarningBanner } from "./org-ui";

const ACTIONS: PermissionAction[] = ["view", "create", "edit", "delete", "approve", "export", "assign", "manageSettings", "viewSensitive"];
const LEVELS: PermissionLevel[] = ["No Access", "View Only", "Standard Access", "Manager Access", "Full Administration"];

export function RolesSection() {
  const { state, patchState, pushToast, actor, dangerousCombo } = useOrganisation();
  const [compare, setCompare] = useState(false);
  const [selectedRole, setSelectedRole] = useState(state.roles[0]?.id || "");
  const [exceptionOpen, setExceptionOpen] = useState(false);
  const [exForm, setExForm] = useState({ userId: "usr_elena", permissionKey: "export.sensitive", reason: "", approver: actor.id });

  const role = state.roles.find((r) => r.id === selectedRole) || state.roles[0];
  const compareRole = state.roles.find((r) => r.name === "Director");

  const addException = () => {
    if (!exForm.reason.trim()) {
      pushToast("Reason is required for permission exceptions.", "danger");
      return;
    }
    if (exForm.userId === actor.id) {
      pushToast("Self-approval is blocked — choose another approver.", "danger");
      return;
    }
    const user = state.users.find((u) => u.id === exForm.userId);
    const approver = state.users.find((u) => u.id === exForm.approver);
    const exceptionId = `ex_${Math.random().toString(36).slice(2, 7)}`;
    patchState((prev) =>
      appendAudit(
        {
          ...prev,
          exceptions: [
            ...prev.exceptions,
            {
              id: exceptionId,
              userId: exForm.userId,
              permissionKey: exForm.permissionKey,
              level: "Manager Access",
              reason: exForm.reason,
              approvingManagerId: exForm.approver,
              approvingManagerName: approver ? `${approver.firstName} ${approver.lastName}` : actor.name,
              startDate: new Date().toISOString().slice(0, 10),
              reviewDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
              expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
              auditId: `aud_ex_${Date.now()}`,
            },
          ],
        },
        {
          entityType: "Permission",
          entityId: exceptionId,
          entityLabel: user ? `${user.firstName} ${user.lastName} — ${exForm.permissionKey}` : exForm.permissionKey,
          field: "exception",
          previousValue: "Standard Access",
          newValue: "Manager Access (temporary)",
          reason: exForm.reason,
          approval: approver ? `${approver.firstName} ${approver.lastName}` : actor.name,
          device: "Desktop · Demo",
          locationLabel: "Module 3",
        }
      )
    );
    pushToast("Permission exception recorded with approver and dates.", "success");
    setExceptionOpen(false);
  };

  const risky = role ? dangerousCombo([role.name, role.level, ...ACTIONS.filter((a) => role.permissions[a]).map((a) => a)]) : false;

  return (
    <div className="grid gap-[18px]">
      <SectionHeader
        title="Roles & permissions"
        subtitle="11 roles across 5 permission levels. Exceptions require reason, approver and review dates."
        actions={
          <>
            <Button variant="line" onClick={() => setCompare((v) => !v)}>{compare ? "Single role" : "Compare with Director"}</Button>
            <Button variant="teal" onClick={() => setExceptionOpen(true)}>Add exception</Button>
          </>
        }
      />

      <div className="flex flex-wrap gap-2">
        {state.roles.map((r) => (
          <Button key={r.id} small variant={selectedRole === r.id ? "teal" : "line"} onClick={() => setSelectedRole(r.id)}>
            {r.name}
          </Button>
        ))}
      </div>

      {risky ? (
        <WarningBanner>This role combination may be high risk — review before assigning broadly.</WarningBanner>
      ) : null}

      <Panel>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <PanelTitle>{role?.name}</PanelTitle>
            <PanelSub>{role?.description}</PanelSub>
            <div className="mt-2"><StatusPill label={role?.level || ""} tone="info" /></div>
          </div>
          {role?.sensitive ? <StatusPill label="Sensitive role" tone="warn" /> : null}
        </div>

        <Table>
          <THead>
            <Th>Action</Th>
            <Th>{role?.name}</Th>
            {compare && compareRole ? <Th>{compareRole.name} (reference)</Th> : null}
          </THead>
          <tbody>
            {ACTIONS.map((action) => (
              <tr key={action}>
                <Td>{action}</Td>
                <Td>{role?.permissions[action] ? "✓ Allowed" : "—"}</Td>
                {compare && compareRole ? <Td>{compareRole.permissions[action] ? "✓" : "—"}</Td> : null}
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>

      <Panel>
        <PanelTitle>Permission level guide</PanelTitle>
        <div className="mt-2 flex flex-wrap gap-2">
          {LEVELS.map((l) => (
            <StatusPill key={l} label={l} tone="default" title="Five standard permission levels" />
          ))}
        </div>
      </Panel>

      <Panel>
        <PanelTitle>Active exceptions</PanelTitle>
        <Table>
          <THead>
            <Th>User</Th>
            <Th>Permission</Th>
            <Th>Reason</Th>
            <Th>Approver</Th>
            <Th>Review / expiry</Th>
          </THead>
          <tbody>
            {state.exceptions.map((ex) => (
              <tr key={ex.id}>
                <Td>{state.users.find((u) => u.id === ex.userId)?.firstName} {state.users.find((u) => u.id === ex.userId)?.lastName}</Td>
                <Td>{ex.permissionKey}</Td>
                <Td>{ex.reason}</Td>
                <Td>{ex.approvingManagerName}</Td>
                <Td>{ex.reviewDate} → {ex.expiryDate}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>

      <Modal open={exceptionOpen} title="Permission exception" onClose={() => setExceptionOpen(false)} footer={
        <>
          <Button variant="line" onClick={() => setExceptionOpen(false)}>Cancel</Button>
          <Button variant="teal" onClick={addException}>Save exception</Button>
        </>
      }>
        <div className="grid gap-3 text-sm">
          <label className="grid gap-1"><span className="font-bold">User</span>
            <select className="rounded-lg border px-3 py-2" value={exForm.userId} onChange={(e) => setExForm({ ...exForm, userId: e.target.value })}>
              {state.users.map((u) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
            </select>
          </label>
          <label className="grid gap-1"><span className="font-bold">Reason</span>
            <textarea className="rounded-lg border px-3 py-2" rows={3} value={exForm.reason} onChange={(e) => setExForm({ ...exForm, reason: e.target.value })} />
          </label>
          <label className="grid gap-1"><span className="font-bold">Approving manager</span>
            <select className="rounded-lg border px-3 py-2" value={exForm.approver} onChange={(e) => setExForm({ ...exForm, approver: e.target.value })}>
              {state.users.filter((u) => u.role === "Director" || u.role === "Senior Administrator").map((u) => (
                <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
              ))}
            </select>
          </label>
          {exForm.userId === actor.id ? <WarningBanner>Self-approval is blocked for your own account.</WarningBanner> : null}
        </div>
      </Modal>
    </div>
  );
}
