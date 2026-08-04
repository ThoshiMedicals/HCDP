"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Panel, PanelSub, PanelTitle } from "@/components/ui/Panel";
import { Table, THead, Th, Td } from "@/components/ui/Table";
import { useStaffDoctors } from "../context";
import {
  createPerson,
  listPeople,
  softArchivePerson,
  suspendPerson,
  reinstatePerson,
} from "../services/person-service";
import type { PersonKind } from "../types/domain";

export function PeopleSection({ kindFilter }: { kindFilter?: PersonKind }) {
  const { actor, bump, pushToast, refreshKey } = useStaffDoctors();
  void refreshKey;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [kind, setKind] = useState<PersonKind>(kindFilter ?? "staff");

  const people = listPeople({ personKind: kindFilter }).filter((p) => p.status !== "Archived");

  const onCreate = () => {
    try {
      createPerson(actor, {
        personKind: kindFilter ?? kind,
        preferredName: name,
        email,
        roleLabel: (kindFilter ?? kind) === "doctor" ? "Doctor" : "Staff",
      });
      setName("");
      setEmail("");
      bump();
      pushToast("Person created.", "success");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Create failed", "danger");
    }
  };

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
      <div>
        <h2 className="m-0 text-xl font-extrabold">
          {kindFilter === "doctor" ? "Doctor profiles" : kindFilter === "staff" ? "Staff profiles" : "People directory"}
        </h2>
        <p className="m-0 mt-1 text-sm text-[var(--muted)]">
          Duplicate check on name + email. Soft-archive only — history is retained.
        </p>
      </div>

      <Panel>
        <PanelTitle>Add {kindFilter ?? "person"}</PanelTitle>
        <PanelSub>Workflow: add staff / add doctor / duplicate prevention.</PanelSub>
        <div className="mt-3 grid min-w-0 gap-2 md:grid-cols-4">
          {!kindFilter ? (
            <select
              className="min-w-0 w-full max-w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
              value={kind}
              onChange={(e) => setKind(e.target.value as PersonKind)}
            >
              <option value="staff">Staff</option>
              <option value="doctor">Doctor</option>
            </select>
          ) : null}
          <input
            className="min-w-0 w-full max-w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
            placeholder="Preferred name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            data-testid="m04-person-name"
            aria-label="Preferred name"
          />
          <input
            className="min-w-0 w-full max-w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            data-testid="m04-person-email"
            aria-label="Email"
          />
          <Button
            variant="teal"
            className="min-w-0 w-full max-w-full"
            onClick={onCreate}
            disabled={!name.trim() || !email.trim()}
            data-testid="m04-person-create"
          >
            Create
          </Button>
        </div>
      </Panel>

      <Panel pad={false}>
        <Table>
          <THead>
            <Th>Name</Th>
            <Th>Email</Th>
            <Th>Kind</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </THead>
          <tbody>
            {people.map((p) => (
              <tr key={p.id}>
                <Td>{p.preferredName}</Td>
                <Td>{p.email}</Td>
                <Td>{p.personKind}</Td>
                <Td>
                  <Badge tone={p.status === "Active" ? "success" : p.status === "Suspended" ? "danger" : "warn"}>
                    {p.status}
                  </Badge>
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    {p.status === "Active" ? (
                      <Button
                        small
                        variant="warn"
                        onClick={() => {
                          try {
                            suspendPerson(actor, p.id);
                            bump();
                            pushToast("Suspended.", "warn");
                          } catch (e) {
                            pushToast(e instanceof Error ? e.message : "Failed", "danger");
                          }
                        }}
                      >
                        Suspend
                      </Button>
                    ) : null}
                    {p.status === "Suspended" ? (
                      <Button
                        small
                        variant="green"
                        onClick={() => {
                          try {
                            reinstatePerson(actor, p.id);
                            bump();
                            pushToast("Reinstated.", "success");
                          } catch (e) {
                            pushToast(e instanceof Error ? e.message : "Failed", "danger");
                          }
                        }}
                      >
                        Reinstate
                      </Button>
                    ) : null}
                    <Button
                      small
                      variant="line"
                      onClick={() => {
                        try {
                          softArchivePerson(actor, p.id);
                          bump();
                          pushToast("Soft-archived.", "default");
                        } catch (e) {
                          pushToast(e instanceof Error ? e.message : "Failed", "danger");
                        }
                      }}
                    >
                      Archive
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
