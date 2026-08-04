"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Panel, PanelSub, PanelTitle } from "@/components/ui/Panel";
import { Table, THead, Th, Td } from "@/components/ui/Table";
import { useStaffDoctors } from "../context";
import { createEngagement, listEngagements } from "../services/engagement-service";
import { listPeople } from "../services/person-service";

export function EngagementsSection() {
  const { actor, bump, pushToast, refreshKey } = useStaffDoctors();
  void refreshKey;
  const people = listPeople().filter((p) => p.status !== "Archived");
  const [personId, setPersonId] = useState(people[0]?.id ?? "");
  const [clinicId, setClinicId] = useState("loc_woolloongabba");
  const [roleLabel, setRoleLabel] = useState("Reception");
  const [from, setFrom] = useState(new Date().toISOString().slice(0, 10));

  const engagements = listEngagements();

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
      <div>
        <h2 className="m-0 text-xl font-extrabold">Engagements</h2>
        <p className="m-0 mt-1 text-sm text-[var(--muted)]">
          Effective-dated role/clinic assignments with overlap protection.
        </p>
      </div>
      <Panel>
        <PanelTitle>Create engagement</PanelTitle>
        <PanelSub>Overlapping active engagements at the same clinic are rejected.</PanelSub>
        <div className="mt-3 grid min-w-0 gap-2 md:grid-cols-5">
          <select
            className="min-w-0 w-full max-w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
            value={personId}
            onChange={(e) => setPersonId(e.target.value)}
          >
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.preferredName}
              </option>
            ))}
          </select>
          <input
            className="min-w-0 w-full max-w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
            value={clinicId}
            onChange={(e) => setClinicId(e.target.value)}
            placeholder="Clinic id"
          />
          <input
            className="min-w-0 w-full max-w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
            value={roleLabel}
            onChange={(e) => setRoleLabel(e.target.value)}
            placeholder="Role"
          />
          <input
            type="date"
            className="min-w-0 w-full max-w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <Button
            variant="teal"
            className="min-w-0 w-full max-w-full"
            onClick={() => {
              try {
                createEngagement(actor, {
                  personId,
                  clinicId,
                  organisationId: "org_parent",
                  roleLabel,
                  employmentType: "Casual",
                  effectiveFrom: from,
                });
                bump();
                pushToast("Engagement created.", "success");
              } catch (e) {
                pushToast(e instanceof Error ? e.message : "Failed", "danger");
              }
            }}
            disabled={!personId}
          >
            Create
          </Button>
        </div>
      </Panel>
      <Panel pad={false}>
        <Table>
          <THead>
            <Th>Person</Th>
            <Th>Role</Th>
            <Th>Clinic</Th>
            <Th>From</Th>
            <Th>To</Th>
            <Th>Status</Th>
          </THead>
          <tbody>
            {engagements.map((e) => (
              <tr key={e.id}>
                <Td>{people.find((p) => p.id === e.personId)?.preferredName ?? e.personId}</Td>
                <Td>{e.roleLabel}</Td>
                <Td>{e.clinicId}</Td>
                <Td>{e.effectiveFrom}</Td>
                <Td>{e.effectiveTo ?? "—"}</Td>
                <Td>{e.status}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>
    </div>
  );
}
