"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Panel, PanelTitle } from "@/components/ui/Panel";
import { Table, THead, Th, Td } from "@/components/ui/Table";
import { useStaffDoctors } from "../context";
import {
  completeOnboarding,
  listOnboarding,
  startOnboarding,
} from "../services/lifecycle-service";
import { listPeople } from "../services/person-service";

export function OnboardingSection() {
  const { actor, bump, pushToast, refreshKey } = useStaffDoctors();
  void refreshKey;
  const people = listPeople().filter((p) => p.status !== "Archived");
  const [personId, setPersonId] = useState(people[0]?.id ?? "");

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
      <div>
        <h2 className="m-0 text-xl font-extrabold">Onboarding</h2>
        <p className="m-0 mt-1 text-sm text-[var(--muted)]">Start and complete workforce onboarding.</p>
      </div>
      <Panel>
        <PanelTitle>Start onboarding</PanelTitle>
        <div className="mt-3 flex flex-wrap gap-2">
          <select
            className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
            value={personId}
            onChange={(e) => setPersonId(e.target.value)}
          >
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.preferredName} ({p.status})
              </option>
            ))}
          </select>
          <Button
            variant="teal"
            disabled={!personId}
            onClick={() => {
              try {
                startOnboarding(actor, personId, "org_parent");
                bump();
                pushToast("Onboarding started.", "success");
              } catch (e) {
                pushToast(e instanceof Error ? e.message : "Failed", "danger");
              }
            }}
          >
            Start
          </Button>
        </div>
      </Panel>
      <Panel pad={false}>
        <Table>
          <THead>
            <Th>Person</Th>
            <Th>Status</Th>
            <Th>Progress</Th>
            <Th />
          </THead>
          <tbody>
            {listOnboarding().map((o) => (
              <tr key={o.id}>
                <Td>{people.find((p) => p.id === o.personId)?.preferredName ?? o.personId}</Td>
                <Td>
                  <Badge tone={o.status === "Complete" ? "success" : "info"}>{o.status}</Badge>
                </Td>
                <Td>
                  {o.completedItems.length}/{o.checklist.length}
                </Td>
                <Td>
                  {o.status !== "Complete" ? (
                    <Button
                      small
                      variant="green"
                      onClick={() => {
                        try {
                          completeOnboarding(actor, o.id);
                          bump();
                          pushToast("Onboarding complete.", "success");
                        } catch (e) {
                          pushToast(e instanceof Error ? e.message : "Failed", "danger");
                        }
                      }}
                    >
                      Complete
                    </Button>
                  ) : null}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>
    </div>
  );
}
