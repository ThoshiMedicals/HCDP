"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Panel, PanelSub, PanelTitle } from "@/components/ui/Panel";
import { Table, THead, Th, Td } from "@/components/ui/Table";
import { useStaffDoctors } from "../context";
import { addAvailability, approveLeave, listAvailability, listLeave, requestLeave } from "../services/leave-service";
import { listPeople } from "../services/person-service";

export function LeaveAvailabilitySection() {
  const { actor, bump, pushToast, refreshKey } = useStaffDoctors();
  void refreshKey;
  const people = listPeople().filter((p) => p.status !== "Archived");
  const [personId, setPersonId] = useState(people[0]?.id ?? "");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));

  return (
    <div className="grid gap-4">
      <div>
        <h2 className="m-0 text-xl font-extrabold">Leave & availability</h2>
        <p className="m-0 mt-1 text-sm text-[var(--muted)]">Self-approval of leave is rejected.</p>
      </div>

      <Panel>
        <PanelTitle>Request leave</PanelTitle>
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
          <input type="date" className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <input type="date" className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          <Button
            variant="teal"
            disabled={!personId}
            onClick={() => {
              try {
                requestLeave(actor, {
                  personId,
                  organisationId: "org_parent",
                  startDate,
                  endDate,
                  leaveType: "Annual",
                });
                bump();
                pushToast("Leave requested.", "success");
              } catch (e) {
                pushToast(e instanceof Error ? e.message : "Failed", "danger");
              }
            }}
          >
            Request
          </Button>
        </div>
      </Panel>

      <Panel pad={false}>
        <div className="border-b border-[var(--line)] px-5 py-3">
          <PanelTitle>Leave requests</PanelTitle>
        </div>
        <Table>
          <THead>
            <Th>Person</Th>
            <Th>Type</Th>
            <Th>Dates</Th>
            <Th>Status</Th>
            <Th>Requested by</Th>
            <Th />
          </THead>
          <tbody>
            {listLeave().map((l) => (
              <tr key={l.id}>
                <Td>{people.find((p) => p.id === l.personId)?.preferredName ?? l.personId}</Td>
                <Td>{l.leaveType}</Td>
                <Td>
                  {l.startDate} → {l.endDate}
                </Td>
                <Td>
                  <Badge tone={l.status === "Approved" ? "success" : l.status === "Rejected" ? "danger" : "warn"}>
                    {l.status}
                  </Badge>
                </Td>
                <Td className="text-xs">{l.requestedBy}</Td>
                <Td>
                  {l.status === "Pending" ? (
                    <div className="flex gap-1">
                      <Button
                        small
                        variant="green"
                        onClick={() => {
                          try {
                            approveLeave(actor, l.id, "Approved");
                            bump();
                            pushToast("Leave approved.", "success");
                          } catch (e) {
                            pushToast(e instanceof Error ? e.message : "Failed", "danger");
                          }
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        small
                        variant="danger"
                        onClick={() => {
                          try {
                            approveLeave(actor, l.id, "Rejected");
                            bump();
                            pushToast("Leave rejected.", "warn");
                          } catch (e) {
                            pushToast(e instanceof Error ? e.message : "Failed", "danger");
                          }
                        }}
                      >
                        Reject
                      </Button>
                    </div>
                  ) : null}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>

      <Panel>
        <PanelTitle>Add availability window</PanelTitle>
        <PanelSub>Day-of-week availability for roster consumers.</PanelSub>
        <Button
          className="mt-3"
          small
          variant="line"
          disabled={!personId}
          onClick={() => {
            try {
              addAvailability(actor, {
                personId,
                organisationId: "org_parent",
                dayOfWeek: 1,
                startTime: "09:00",
                endTime: "17:00",
                effectiveFrom: startDate,
              });
              bump();
              pushToast("Availability added.", "success");
            } catch (e) {
              pushToast(e instanceof Error ? e.message : "Failed", "danger");
            }
          }}
        >
          Add Mon 09:00–17:00
        </Button>
        <ul className="mt-3 list-disc pl-5 text-sm text-[var(--muted)]">
          {listAvailability().slice(0, 10).map((a) => (
            <li key={a.id}>
              {a.personId} · dow {a.dayOfWeek} · {a.startTime}-{a.endTime}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
