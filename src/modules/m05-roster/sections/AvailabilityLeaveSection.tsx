"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Panel, PanelSub, PanelTitle } from "@/components/ui/Panel";
import { Table, THead, Th, Td } from "@/components/ui/Table";
import { useRoster } from "../context";
import { hasM05Permission } from "../permissions";
import {
  listApprovedLeaveForClinic,
} from "../services/availability-read-service";
import { listPeriodsForActor } from "../services/period-service";
import * as store from "../repository/local-store";
import type { RosterAvailabilityDeclaration } from "../types/domain";
import {
  EmptyState,
  OfflineState,
  RestrictedState,
  ValidationErrorState,
} from "../components/ux";
import { SectionFrame } from "../components/SectionFrame";

const DEFAULT_ORG = "org_parent";

export function AvailabilityLeaveSection() {
  const { actor, bump, pushToast, refreshKey } = useRoster();
  void refreshKey;

  const canView = hasM05Permission(actor, "roster.view");
  const canDeclare =
    hasM05Permission(actor, "roster.view") &&
    (hasM05Permission(actor, "roster.swap.request") ||
      hasM05Permission(actor, "roster.shift.edit"));

  const [personFilter, setPersonFilter] = useState("");
  const [clinicFilter, setClinicFilter] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");
  const [declPerson, setDeclPerson] = useState("");
  const [declKind, setDeclKind] = useState<"preferred" | "unavailable">("preferred");
  const [declFrom, setDeclFrom] = useState("");
  const [declTo, setDeclTo] = useState("");
  const [declNote, setDeclNote] = useState("");

  const periods = useMemo(() => (canView ? listPeriodsForActor(actor) : []), [
    actor,
    canView,
    refreshKey,
  ]);

  const declarations = useMemo(() => {
    if (!canView) return [];
    let all = store.listAvailabilityDeclarations(personFilter.trim() || undefined);
    if (clinicFilter.trim()) {
      all = all.filter((d) => d.clinicId === clinicFilter.trim());
    }
    return all;
  }, [canView, personFilter, clinicFilter, refreshKey]);

  const leave = useMemo(() => {
    if (!canView) return [];
    let rows = listApprovedLeaveForClinic(clinicFilter.trim() || undefined);
    if (personFilter.trim()) rows = rows.filter((r) => r.personId === personFilter.trim());
    return rows;
  }, [canView, personFilter, clinicFilter, refreshKey]);

  const handleCreateDeclaration = () => {
    const errs: string[] = [];
    if (!selectedPeriodId) errs.push("Select a roster period.");
    if (!declPerson.trim()) errs.push("Person id is required.");
    if (!declFrom) errs.push("From date is required.");
    if (!declTo) errs.push("To date is required.");
    if (errs.length) {
      setErrors(errs);
      return;
    }
    setErrors([]);
    const period = periods.find((p) => p.id === selectedPeriodId);
    if (!period) {
      setErrors(["Period not found."]);
      return;
    }
    const now = new Date().toISOString();
    const declaration: RosterAvailabilityDeclaration = {
      id: store.newAvailabilityId(),
      rosterPeriodId: period.id,
      personId: declPerson.trim(),
      clinicId: period.clinicId,
      organisationId: period.organisationId ?? DEFAULT_ORG,
      kind: declKind,
      localFromDate: declFrom,
      localToDate: declTo,
      note: declNote.trim() || null,
      createdAt: now,
      createdBy: actor.userId,
      version: 1,
    };
    try {
      store.upsertAvailabilityDeclaration(declaration);
      setDeclPerson("");
      setDeclFrom("");
      setDeclTo("");
      setDeclNote("");
      bump();
      pushToast(`Availability declaration recorded.`, "success");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Save failed", "danger");
    }
  };

  if (!canView) {
    return (
      <SectionFrame sectionId="availability-leave" title="Availability & Leave">
        <RestrictedState permission="roster.view" />
      </SectionFrame>
    );
  }

  return (
    <SectionFrame sectionId="availability-leave" title="Availability & Leave">
      <OfflineState />
      <div>
        <p className="m-0 mt-1 text-sm text-[#526479]">
          M05 owns roster-side preferences/declarations. Approved leave is READ from
          the M05-side contract cache — M05 never mutates M04 leave records.
        </p>
      </div>

      <Panel>
        <PanelTitle>Filter</PanelTitle>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <input
            className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
            placeholder="Person id filter"
            value={personFilter}
            onChange={(e) => setPersonFilter(e.target.value)}
            aria-label="Person id filter"
            data-testid="m05-availability-filter-person"
          />
          <input
            className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
            placeholder="Clinic id filter"
            value={clinicFilter}
            onChange={(e) => setClinicFilter(e.target.value)}
            aria-label="Clinic id filter"
          />
        </div>
      </Panel>

      {canDeclare ? (
        <Panel>
          <PanelTitle>Record roster availability declaration</PanelTitle>
          <PanelSub>
            Preferences or declared unavailability — layer 3 / 8 of precedence.
          </PanelSub>
          <ValidationErrorState errors={errors} onDismiss={() => setErrors([])} />
          <div className="mt-3 grid gap-2 md:grid-cols-6">
            <select
              className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm md:col-span-2"
              value={selectedPeriodId}
              onChange={(e) => setSelectedPeriodId(e.target.value)}
              aria-label="Period"
            >
              <option value="">Period…</option>
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label} ({p.clinicId})
                </option>
              ))}
            </select>
            <input
              className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
              placeholder="Person id"
              value={declPerson}
              onChange={(e) => setDeclPerson(e.target.value)}
              aria-label="Declaration person id"
            />
            <select
              className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
              value={declKind}
              onChange={(e) =>
                setDeclKind(e.target.value === "unavailable" ? "unavailable" : "preferred")
              }
              aria-label="Kind"
            >
              <option value="preferred">Preferred</option>
              <option value="unavailable">Unavailable</option>
            </select>
            <input
              type="date"
              className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
              value={declFrom}
              onChange={(e) => setDeclFrom(e.target.value)}
              aria-label="From date"
            />
            <input
              type="date"
              className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
              value={declTo}
              onChange={(e) => setDeclTo(e.target.value)}
              aria-label="To date"
            />
            <input
              className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm md:col-span-5"
              placeholder="Note (optional)"
              value={declNote}
              onChange={(e) => setDeclNote(e.target.value)}
              aria-label="Note"
            />
            <Button variant="teal" onClick={handleCreateDeclaration}>
              Save declaration
            </Button>
          </div>
        </Panel>
      ) : null}

      <Panel pad={false}>
        <div className="border-b border-[var(--line)] px-5 py-3">
          <PanelTitle>Roster availability declarations</PanelTitle>
          <PanelSub>M05-owned preferences / declared unavailability.</PanelSub>
        </div>
        {declarations.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="No availability declarations"
              description={
                personFilter || clinicFilter
                  ? "No declarations match the current filter."
                  : "No preferences or declared unavailability yet."
              }
            />
          </div>
        ) : (
          <Table>
            <THead>
              <Th>Person</Th>
              <Th>Kind</Th>
              <Th>Clinic</Th>
              <Th>From</Th>
              <Th>To</Th>
              <Th>Note</Th>
            </THead>
            <tbody>
              {declarations.map((d) => (
                <tr key={d.id}>
                  <Td className="font-mono text-xs">{d.personId}</Td>
                  <Td>
                    <Badge tone={d.kind === "unavailable" ? "danger" : "info"}>
                      {d.kind}
                    </Badge>
                  </Td>
                  <Td className="text-xs">{d.clinicId}</Td>
                  <Td className="font-mono text-xs">{d.localFromDate}</Td>
                  <Td className="font-mono text-xs">{d.localToDate}</Td>
                  <Td className="text-xs">{d.note ?? "—"}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>

      <Panel pad={false}>
        <div className="border-b border-[var(--line)] px-5 py-3">
          <PanelTitle>Approved leave (contract cache)</PanelTitle>
          <PanelSub>Read-through M04 leave — populated via contract adapter only.</PanelSub>
        </div>
        {leave.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="No approved leave cached"
              description="Contract cache is empty — populate via M04 read-through in staging."
            />
          </div>
        ) : (
          <Table>
            <THead>
              <Th>Person</Th>
              <Th>Clinic</Th>
              <Th>From</Th>
              <Th>To</Th>
              <Th>Reason</Th>
              <Th>Loaded at</Th>
            </THead>
            <tbody>
              {leave.map((l) => (
                <tr key={l.id}>
                  <Td className="font-mono text-xs">{l.personId}</Td>
                  <Td className="text-xs">{l.clinicId ?? "—"}</Td>
                  <Td className="font-mono text-xs">{l.localFromDate}</Td>
                  <Td className="font-mono text-xs">{l.localToDate}</Td>
                  <Td className="text-xs">{l.reasonCategory ?? "—"}</Td>
                  <Td className="text-xs">{l.loadedAt}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>
    </SectionFrame>
  );
}
