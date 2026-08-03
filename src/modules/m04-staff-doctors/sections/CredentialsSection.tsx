"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Panel, PanelSub, PanelTitle } from "@/components/ui/Panel";
import { Table, THead, Th, Td } from "@/components/ui/Table";
import { useStaffDoctors } from "../context";
import { createCredential, listCredentials, verifyCredential } from "../services/credential-service";
import { calculateReadiness, getEffectiveReadiness } from "../services/readiness-service";
import { listPeople } from "../services/person-service";

export function CredentialsSection() {
  const { actor, bump, pushToast, refreshKey } = useStaffDoctors();
  void refreshKey;
  const people = listPeople().filter((p) => p.status !== "Archived");
  const [personId, setPersonId] = useState(people[0]?.id ?? "");
  const [type, setType] = useState("AHPRA");
  const [expiresOn, setExpiresOn] = useState("");

  const credentials = listCredentials();

  return (
    <div className="grid gap-4">
      <div>
        <h2 className="m-0 text-xl font-extrabold">Credentials</h2>
        <p className="m-0 mt-1 text-sm text-[var(--muted)]">
          Verify credentials and recalculate readiness. Expired credentials project to Action Inbox.
        </p>
      </div>
      <Panel>
        <PanelTitle>Add credential</PanelTitle>
        <PanelSub>Use a past expiry date to exercise expired → inbox projection.</PanelSub>
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
          <input
            className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
            value={type}
            onChange={(e) => setType(e.target.value)}
          />
          <input
            type="date"
            className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
            value={expiresOn}
            onChange={(e) => setExpiresOn(e.target.value)}
          />
          <Button
            variant="teal"
            disabled={!personId}
            onClick={() => {
              try {
                createCredential(actor, {
                  personId,
                  organisationId: "org_parent",
                  credentialType: type,
                  expiresOn: expiresOn || null,
                });
                calculateReadiness(personId);
                bump();
                pushToast("Credential added.", "success");
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
            <Th>Type</Th>
            <Th>Status</Th>
            <Th>Verified</Th>
            <Th>Expires</Th>
            <Th>Readiness</Th>
            <Th />
          </THead>
          <tbody>
            {credentials.map((c) => {
              const ready = getEffectiveReadiness(c.personId);
              return (
                <tr key={c.id}>
                  <Td>{people.find((p) => p.id === c.personId)?.preferredName ?? c.personId}</Td>
                  <Td>{c.credentialType}</Td>
                  <Td>
                    <Badge tone={c.status === "valid" ? "success" : c.status === "expired" ? "danger" : "warn"}>
                      {c.status}
                    </Badge>
                  </Td>
                  <Td>{c.verified ? "Yes" : "No"}</Td>
                  <Td>{c.expiresOn ?? "—"}</Td>
                  <Td>{ready.stale ? "stale" : ready.readiness}</Td>
                  <Td>
                    <Button
                      small
                      variant="line"
                      onClick={() => {
                        try {
                          verifyCredential(actor, c.id);
                          calculateReadiness(c.personId);
                          bump();
                          pushToast("Verified.", "success");
                        } catch (e) {
                          pushToast(e instanceof Error ? e.message : "Failed", "danger");
                        }
                      }}
                    >
                      Verify
                    </Button>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Panel>
    </div>
  );
}
