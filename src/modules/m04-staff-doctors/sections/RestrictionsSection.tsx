"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Panel, PanelSub, PanelTitle } from "@/components/ui/Panel";
import { Table, THead, Th, Td } from "@/components/ui/Table";
import { useStaffDoctors } from "../context";
import { createRestriction, listRestrictionsForActor } from "../services/lifecycle-service";
import { listPeople } from "../services/person-service";
import type { RestrictionSensitivity } from "../types/domain";

export function RestrictionsSection() {
  const { actor, bump, pushToast, refreshKey } = useStaffDoctors();
  void refreshKey;
  const people = listPeople().filter((p) => p.status !== "Archived");
  const [personId, setPersonId] = useState(people[0]?.id ?? "");
  const [sensitivity, setSensitivity] = useState<RestrictionSensitivity>("Restricted");
  const restrictions = listRestrictionsForActor(actor);

  return (
    <div className="grid gap-4">
      <div>
        <h2 className="m-0 text-xl font-extrabold">Restrictions & adjustments</h2>
        <p className="m-0 mt-1 text-sm text-[var(--muted)]">
          Sensitive detail is masked without restriction.view_sensitive.
        </p>
      </div>
      <Panel>
        <PanelTitle>Add restriction</PanelTitle>
        <PanelSub>Operational adjustment with sensitivity classification.</PanelSub>
        <div className="mt-3 grid gap-2 md:grid-cols-4">
          <select
            className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
            value={personId}
            onChange={(e) => setPersonId(e.target.value)}
          >
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.preferredName}
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
            value={sensitivity}
            onChange={(e) => setSensitivity(e.target.value as RestrictionSensitivity)}
          >
            <option>Standard</option>
            <option>Restricted</option>
            <option>Confidential</option>
            <option>Highly Confidential</option>
          </select>
          <Button
            variant="teal"
            disabled={!personId}
            onClick={() => {
              try {
                createRestriction(actor, {
                  personId,
                  organisationId: "org_parent",
                  sensitivity,
                  title: "Operational adjustment",
                  detail: "Sensitive clinical restriction detail",
                  reason: "Confidential operational reason",
                  effectiveFrom: new Date().toISOString().slice(0, 10),
                });
                bump();
                pushToast("Restriction recorded.", "success");
              } catch (e) {
                pushToast(e instanceof Error ? e.message : "Failed", "danger");
              }
            }}
          >
            Add
          </Button>
        </div>
      </Panel>
      <Panel pad={false}>
        <Table>
          <THead>
            <Th>Person</Th>
            <Th>Title</Th>
            <Th>Sensitivity</Th>
            <Th>Detail</Th>
            <Th>Reason</Th>
            <Th>Masked</Th>
          </THead>
          <tbody>
            {restrictions.map((r) => (
              <tr key={r.id}>
                <Td>{people.find((p) => p.id === r.personId)?.preferredName ?? r.personId}</Td>
                <Td>{r.title}</Td>
                <Td>
                  <Badge tone={r.sensitivity === "Standard" ? "default" : "warn"}>{r.sensitivity}</Badge>
                </Td>
                <Td className="text-sm">{r.detail}</Td>
                <Td className="text-sm">{r.reason}</Td>
                <Td>{r.masked ? "Yes" : "No"}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>
    </div>
  );
}
