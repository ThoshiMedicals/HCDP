"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Panel, PanelSub, PanelTitle } from "@/components/ui/Panel";
import { Table, THead, Th, Td } from "@/components/ui/Table";
import { useStaffDoctors } from "../context";
import {
  completeOffboarding,
  listOffboarding,
  startOffboarding,
  transferOffboardingResponsibilities,
  markOffboardingIncomplete,
} from "../services/lifecycle-service";
import { listPeople } from "../services/person-service";

export function OffboardingSection() {
  const { actor, bump, pushToast, refreshKey } = useStaffDoctors();
  void refreshKey;
  const people = listPeople().filter((p) => p.status !== "Archived");
  const [personId, setPersonId] = useState(people[0]?.id ?? "");
  const [transferTo, setTransferTo] = useState(people[1]?.id ?? people[0]?.id ?? "");

  return (
    <div className="grid gap-4">
      <div>
        <h2 className="m-0 text-xl font-extrabold">Offboarding</h2>
        <p className="m-0 mt-1 text-sm text-[var(--muted)]">
          Transfer open responsibilities before completion. Incomplete offboarding projects to Action Inbox.
        </p>
      </div>
      <Panel>
        <PanelTitle>Start offboarding</PanelTitle>
        <PanelSub>Person is soft-archived on successful completion — never hard-deleted.</PanelSub>
        <div className="mt-3 flex flex-wrap gap-2">
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
          <Button
            variant="warn"
            disabled={!personId}
            onClick={() => {
              try {
                startOffboarding(actor, {
                  personId,
                  organisationId: "org_parent",
                  openResponsibilities: ["Clinic keys", "Open roster duties"],
                });
                bump();
                pushToast("Offboarding started.", "warn");
              } catch (e) {
                pushToast(e instanceof Error ? e.message : "Failed", "danger");
              }
            }}
          >
            Start with open responsibilities
          </Button>
        </div>
      </Panel>
      <Panel pad={false}>
        <Table>
          <THead>
            <Th>Person</Th>
            <Th>Status</Th>
            <Th>Open items</Th>
            <Th>Transfer to</Th>
            <Th>Actions</Th>
          </THead>
          <tbody>
            {listOffboarding().map((o) => (
              <tr key={o.id}>
                <Td>{people.find((p) => p.id === o.personId)?.preferredName ?? o.personId}</Td>
                <Td>
                  <Badge tone={o.status === "Complete" ? "success" : o.status === "Incomplete" ? "danger" : "warn"}>
                    {o.status}
                  </Badge>
                </Td>
                <Td className="text-sm">{o.openResponsibilities.join(", ") || "—"}</Td>
                <Td className="text-xs">{o.transferredToPersonId ?? "—"}</Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    <select
                      className="rounded border border-[var(--line)] px-2 py-1 text-xs"
                      value={transferTo}
                      onChange={(e) => setTransferTo(e.target.value)}
                    >
                      {people
                        .filter((p) => p.id !== o.personId)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.preferredName}
                          </option>
                        ))}
                    </select>
                    <Button
                      small
                      variant="line"
                      onClick={() => {
                        try {
                          transferOffboardingResponsibilities(actor, o.id, transferTo);
                          bump();
                          pushToast("Responsibilities transferred.", "success");
                        } catch (e) {
                          pushToast(e instanceof Error ? e.message : "Failed", "danger");
                        }
                      }}
                    >
                      Transfer
                    </Button>
                    <Button
                      small
                      variant="green"
                      onClick={() => {
                        try {
                          completeOffboarding(actor, o.id);
                          bump();
                          pushToast("Offboarding complete (person archived).", "success");
                        } catch (e) {
                          pushToast(e instanceof Error ? e.message : "Failed", "danger");
                        }
                      }}
                    >
                      Complete
                    </Button>
                    <Button
                      small
                      variant="danger"
                      onClick={() => {
                        try {
                          markOffboardingIncomplete(actor, o.id);
                          bump();
                          pushToast("Marked incomplete → inbox.", "warn");
                        } catch (e) {
                          pushToast(e instanceof Error ? e.message : "Failed", "danger");
                        }
                      }}
                    >
                      Mark incomplete
                    </Button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>
    </div>
  );
}
