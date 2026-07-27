"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Panel, PanelSub, PanelTitle } from "@/components/ui/Panel";
import { Table, THead, Th, Td } from "@/components/ui/Table";
import { useRoster } from "../context";
import { hasM05Permission } from "../permissions";
import { createPeriod, listPeriodsForActor } from "../services/period-service";
import {
  createShift,
  listShiftsForActor,
} from "../services/shift-service";
import { assignPerson } from "../services/assignment-service";
import { evaluateEligibility } from "../services/eligibility-service";
import { ConcurrentConflictError } from "../services/errors";
import type { EligibilityDecision } from "../services/eligibility-service";
import type { RosterPeriod, Shift } from "../types/domain";
import {
  ConcurrentConflictState,
  EmptyState,
  FilteredEmptyState,
  OfflineState,
  RestrictedState,
  ValidationErrorState,
} from "../components/ux";

const DEFAULT_CLINIC = "loc_woolloongabba";

export function RosterBoardSection() {
  const { actor, bump, pushToast, refreshKey } = useRoster();
  void refreshKey;

  const canView = hasM05Permission(actor, "roster.view");
  const canCreatePeriod = hasM05Permission(actor, "roster.period.create");
  const canEditShift = hasM05Permission(actor, "roster.shift.edit");
  const canAssign = hasM05Permission(actor, "roster.assign");

  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [conflict, setConflict] = useState<{ targetType: string; targetId: string } | null>(null);

  // Create-period form
  const [newLabel, setNewLabel] = useState("");
  const [newStartsOn, setNewStartsOn] = useState("");
  const [newEndsOn, setNewEndsOn] = useState("");
  const [newClinic, setNewClinic] = useState(DEFAULT_CLINIC);
  const [periodErrors, setPeriodErrors] = useState<string[]>([]);

  // Create-shift form
  const [showShiftForm, setShowShiftForm] = useState(false);
  const [shiftDate, setShiftDate] = useState("");
  const [shiftStart, setShiftStart] = useState("");
  const [shiftEnd, setShiftEnd] = useState("");
  const [shiftRole, setShiftRole] = useState("");
  const [shiftErrors, setShiftErrors] = useState<string[]>([]);

  // Assign form
  const [assignShiftId, setAssignShiftId] = useState<string | null>(null);
  const [assignPersonId, setAssignPersonId] = useState("");
  const [assignOverrideReason, setAssignOverrideReason] = useState("");
  const [assignPreview, setAssignPreview] = useState<EligibilityDecision | null>(null);
  const [assignErrors, setAssignErrors] = useState<string[]>([]);

  const [filter, setFilter] = useState("");

  let periods: RosterPeriod[] = [];
  let restrictedError: string | null = null;
  try {
    periods = canView ? listPeriodsForActor(actor) : [];
  } catch (e) {
    restrictedError = e instanceof Error ? e.message : "Restricted";
  }

  const activePeriodId = useMemo(() => {
    if (selectedPeriodId && periods.some((p) => p.id === selectedPeriodId)) {
      return selectedPeriodId;
    }
    return periods[0]?.id ?? null;
  }, [selectedPeriodId, periods]);

  const shifts: Shift[] = useMemo(() => {
    if (!activePeriodId) return [];
    try {
      return listShiftsForActor(actor, activePeriodId);
    } catch {
      return [];
    }
  }, [actor, activePeriodId, refreshKey]);

  const filteredShifts = filter.trim()
    ? shifts.filter((s) => {
        const q = filter.toLowerCase();
        return (
          (s.roleLabel ?? "").toLowerCase().includes(q) ||
          s.status.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q)
        );
      })
    : shifts;

  const handleCreatePeriod = () => {
    const errs: string[] = [];
    if (!newLabel.trim()) errs.push("Label is required.");
    if (!newStartsOn) errs.push("Starts-on date is required.");
    if (!newEndsOn) errs.push("Ends-on date is required.");
    if (!newClinic.trim()) errs.push("Clinic id is required.");
    if (errs.length) {
      setPeriodErrors(errs);
      return;
    }
    setPeriodErrors([]);
    try {
      const period = createPeriod(actor, {
        label: newLabel.trim(),
        startsOn: newStartsOn,
        endsOn: newEndsOn,
        clinicId: newClinic.trim(),
      });
      setNewLabel("");
      setNewStartsOn("");
      setNewEndsOn("");
      setSelectedPeriodId(period.id);
      bump();
      pushToast(`Period "${period.label}" created.`, "success");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Create period failed", "danger");
    }
  };

  const handleCreateShift = () => {
    if (!activePeriodId) return;
    const period = periods.find((p) => p.id === activePeriodId);
    if (!period) return;
    const errs: string[] = [];
    if (!shiftDate) errs.push("Date is required.");
    if (!shiftStart) errs.push("Start time is required.");
    if (!shiftEnd) errs.push("End time is required.");
    if (errs.length) {
      setShiftErrors(errs);
      return;
    }
    setShiftErrors([]);
    try {
      const shift = createShift(actor, {
        rosterPeriodId: period.id,
        clinicId: period.clinicId,
        localStartYmd: shiftDate,
        localStartHm: shiftStart,
        localEndYmd: shiftDate,
        localEndHm: shiftEnd,
        roleLabel: shiftRole.trim() || undefined,
      });
      setShiftDate("");
      setShiftStart("");
      setShiftEnd("");
      setShiftRole("");
      setShowShiftForm(false);
      bump();
      pushToast(`Shift ${shift.id} created.`, "success");
    } catch (e) {
      if (e instanceof ConcurrentConflictError) {
        setConflict({ targetType: e.targetType, targetId: e.targetId });
      } else {
        pushToast(e instanceof Error ? e.message : "Create shift failed", "danger");
      }
    }
  };

  const openAssignFor = (shift: Shift) => {
    setAssignShiftId(shift.id);
    setAssignPersonId("");
    setAssignOverrideReason("");
    setAssignPreview(null);
    setAssignErrors([]);
  };

  const previewEligibility = () => {
    if (!assignShiftId) return;
    const shift = shifts.find((s) => s.id === assignShiftId);
    if (!shift) return;
    if (!assignPersonId.trim()) {
      setAssignErrors(["Person id is required."]);
      return;
    }
    setAssignErrors([]);
    const decision = evaluateEligibility({
      personId: assignPersonId.trim(),
      clinicId: shift.clinicId,
      shiftWindow: {
        clinicId: shift.clinicId,
        timeZoneId: shift.timeZoneId,
        localStart: shift.localStart,
        localEnd: shift.localEnd,
        utcStart: shift.utcStart,
        utcEnd: shift.utcEnd,
        startOffsetMinutes: shift.startOffsetMinutes,
        endOffsetMinutes: shift.endOffsetMinutes,
        startFold: shift.startFold,
        endFold: shift.endFold,
        crossesLocalMidnight: shift.crossesLocalMidnight,
      },
    });
    setAssignPreview(decision);
  };

  const handleAssign = () => {
    if (!assignShiftId) return;
    const shift = shifts.find((s) => s.id === assignShiftId);
    if (!shift) return;
    if (!assignPersonId.trim()) {
      setAssignErrors(["Person id is required."]);
      return;
    }
    setAssignErrors([]);
    try {
      assignPerson(actor, {
        shiftId: shift.id,
        personId: assignPersonId.trim(),
        expectedShiftVersion: shift.version,
        overrideReason: assignOverrideReason.trim() || undefined,
      });
      setAssignShiftId(null);
      setAssignPersonId("");
      setAssignOverrideReason("");
      setAssignPreview(null);
      bump();
      pushToast(`Assigned ${assignPersonId} to shift ${shift.id}.`, "success");
    } catch (e) {
      if (e instanceof ConcurrentConflictError) {
        setConflict({ targetType: e.targetType, targetId: e.targetId });
      } else {
        pushToast(e instanceof Error ? e.message : "Assign failed", "danger");
      }
    }
  };

  if (!canView) {
    return (
      <div className="grid gap-4">
        <div>
          <h2 className="m-0 text-xl font-extrabold text-[var(--ink)]">Roster Board</h2>
        </div>
        <RestrictedState permission="roster.view" />
      </div>
    );
  }

  if (restrictedError) {
    return (
      <div className="grid gap-4">
        <div>
          <h2 className="m-0 text-xl font-extrabold text-[var(--ink)]">Roster Board</h2>
        </div>
        <RestrictedState message={restrictedError} />
      </div>
    );
  }

  if (conflict) {
    return (
      <div className="grid gap-4">
        <div>
          <h2 className="m-0 text-xl font-extrabold text-[var(--ink)]">Roster Board</h2>
        </div>
        <ConcurrentConflictState
          targetType={conflict.targetType}
          targetId={conflict.targetId}
          onRefresh={() => {
            setConflict(null);
            bump();
          }}
        />
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <OfflineState />
      <div>
        <h2 className="m-0 text-xl font-extrabold text-[var(--ink)]">Roster Board</h2>
        <p className="m-0 mt-1 text-sm text-[#526479]">
          Build weekly rosters — periods, shifts and assignments. Every assignment runs
          authoritative M04/platform eligibility.
        </p>
      </div>

      {canCreatePeriod ? (
        <Panel>
          <PanelTitle>Create roster period</PanelTitle>
          <PanelSub>Requires roster.period.create.</PanelSub>
          <ValidationErrorState errors={periodErrors} onDismiss={() => setPeriodErrors([])} />
          <div className="mt-3 grid gap-2 md:grid-cols-5">
            <input
              className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
              placeholder="Label (e.g. Week B)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              aria-label="Period label"
            />
            <input
              type="date"
              className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
              value={newStartsOn}
              onChange={(e) => setNewStartsOn(e.target.value)}
              aria-label="Starts on"
            />
            <input
              type="date"
              className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
              value={newEndsOn}
              onChange={(e) => setNewEndsOn(e.target.value)}
              aria-label="Ends on"
            />
            <input
              className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
              placeholder="Clinic id"
              value={newClinic}
              onChange={(e) => setNewClinic(e.target.value)}
              aria-label="Clinic id"
            />
            <Button variant="teal" onClick={handleCreatePeriod}>
              Create period
            </Button>
          </div>
        </Panel>
      ) : null}

      {periods.length === 0 ? (
        <EmptyState
          title="No roster periods yet"
          description="Seed data loads on mount. Create a period above if you have permission."
        />
      ) : (
        <Panel pad={false}>
          <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-3">
            <PanelTitle>Periods</PanelTitle>
          </div>
          <div className="flex flex-wrap gap-2 p-3">
            {periods.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPeriodId(p.id)}
                className={
                  "rounded-lg border px-3 py-2 text-left text-xs transition " +
                  (activePeriodId === p.id
                    ? "border-[var(--theme-primary,#1e40af)] bg-[var(--teal-3)] text-[#1d4ed8]"
                    : "border-[var(--line)] bg-white hover:bg-[#f8fafc]")
                }
              >
                <div className="font-extrabold text-[var(--ink)]">{p.label}</div>
                <div className="text-[11px] text-[#64748b]">
                  {p.startsOn} → {p.endsOn}
                </div>
                <div className="mt-1 flex items-center gap-1">
                  <Badge tone={p.lifecycleState === "published" ? "success" : "warn"}>
                    {p.lifecycleState}
                  </Badge>
                  <span className="text-[10px] text-[#94a3b8]">v{p.version}</span>
                </div>
              </button>
            ))}
          </div>
        </Panel>
      )}

      {activePeriodId ? (
        <Panel pad={false}>
          <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-3">
            <div>
              <PanelTitle>Shifts in selected period</PanelTitle>
              <PanelSub>Filter and manage shifts.</PanelSub>
            </div>
            {canEditShift ? (
              <Button
                small
                variant="teal"
                onClick={() => setShowShiftForm((v) => !v)}
              >
                {showShiftForm ? "Cancel" : "New shift"}
              </Button>
            ) : null}
          </div>

          {showShiftForm && canEditShift ? (
            <div className="grid gap-2 border-b border-[var(--line)] bg-[#f8fafc] p-3 md:grid-cols-5">
              <input
                type="date"
                className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
                value={shiftDate}
                onChange={(e) => setShiftDate(e.target.value)}
                aria-label="Shift date"
              />
              <input
                type="time"
                className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
                value={shiftStart}
                onChange={(e) => setShiftStart(e.target.value)}
                aria-label="Start time"
              />
              <input
                type="time"
                className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
                value={shiftEnd}
                onChange={(e) => setShiftEnd(e.target.value)}
                aria-label="End time"
              />
              <input
                className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
                placeholder="Role label"
                value={shiftRole}
                onChange={(e) => setShiftRole(e.target.value)}
                aria-label="Role label"
              />
              <Button variant="teal" small onClick={handleCreateShift}>
                Save shift
              </Button>
              <div className="md:col-span-5">
                <ValidationErrorState errors={shiftErrors} onDismiss={() => setShiftErrors([])} />
              </div>
            </div>
          ) : null}

          <div className="border-b border-[var(--line)] p-3">
            <input
              className="w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
              placeholder="Filter shifts by role, status or id"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              aria-label="Filter shifts"
            />
          </div>

          {shifts.length === 0 ? (
            <div className="p-4">
              <EmptyState
                title="No shifts yet"
                description={
                  canEditShift
                    ? "Use “New shift” to add one, or run demo seed."
                    : "No shifts in this period."
                }
              />
            </div>
          ) : filteredShifts.length === 0 ? (
            <div className="p-4">
              <FilteredEmptyState onClear={() => setFilter("")} />
            </div>
          ) : (
            <Table>
              <THead>
                <Th>Role</Th>
                <Th>Local start → end</Th>
                <Th>Status</Th>
                <Th>Assignment</Th>
                <Th>Version</Th>
                {canAssign ? <Th>Actions</Th> : null}
              </THead>
              <tbody>
                {filteredShifts.map((shift) => (
                  <tr key={shift.id}>
                    <Td className="font-semibold">{shift.roleLabel ?? "—"}</Td>
                    <Td className="font-mono text-xs">
                      {shift.localStart} → {shift.localEnd}
                    </Td>
                    <Td>
                      <Badge
                        tone={
                          shift.status === "assigned"
                            ? "success"
                            : shift.status === "cancelled"
                              ? "danger"
                              : "warn"
                        }
                      >
                        {shift.status}
                      </Badge>
                    </Td>
                    <Td className="text-xs">
                      {shift.currentAssignmentId ?? "—"}
                    </Td>
                    <Td className="text-xs">v{shift.version}</Td>
                    {canAssign ? (
                      <Td>
                        <Button small variant="line" onClick={() => openAssignFor(shift)}>
                          Assign
                        </Button>
                      </Td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Panel>
      ) : null}

      {assignShiftId && canAssign ? (
        <Panel>
          <PanelTitle>Assign person to shift {assignShiftId}</PanelTitle>
          <PanelSub>
            Runs authoritative M04/platform eligibility. Blockers require an override
            reason and roster.override.
          </PanelSub>
          <ValidationErrorState errors={assignErrors} onDismiss={() => setAssignErrors([])} />
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            <input
              className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
              placeholder="Person id (e.g. person_demo_001)"
              value={assignPersonId}
              onChange={(e) => setAssignPersonId(e.target.value)}
              aria-label="Person id"
            />
            <input
              className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
              placeholder="Override reason (if blockers)"
              value={assignOverrideReason}
              onChange={(e) => setAssignOverrideReason(e.target.value)}
              aria-label="Override reason"
            />
            <div className="flex gap-2">
              <Button variant="line" small onClick={previewEligibility}>
                Preview eligibility
              </Button>
              <Button variant="teal" small onClick={handleAssign}>
                Assign
              </Button>
              <Button variant="line" small onClick={() => setAssignShiftId(null)}>
                Close
              </Button>
            </div>
          </div>
          {assignPreview ? (
            <div className="mt-3 rounded-lg border border-[var(--line)] bg-white p-3 text-sm">
              <div className="font-semibold">
                Eligibility decision:{" "}
                <Badge
                  tone={
                    assignPreview.decision === "eligible"
                      ? "success"
                      : assignPreview.decision === "warning"
                        ? "warn"
                        : "danger"
                  }
                >
                  {assignPreview.decision}
                </Badge>
              </div>
              {assignPreview.blockers.length > 0 ? (
                <div className="mt-2">
                  <div className="text-xs font-bold uppercase text-[#b91c1c]">
                    Blockers
                  </div>
                  <ul className="mt-1 list-disc pl-4 text-xs text-[#991b1b]">
                    {assignPreview.blockers.map((b, i) => (
                      <li key={i}>
                        {b.code}: {b.description}
                        {b.remediation ? ` — ${b.remediation}` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {assignPreview.warnings.length > 0 ? (
                <div className="mt-2">
                  <div className="text-xs font-bold uppercase text-[#92400e]">
                    Warnings
                  </div>
                  <ul className="mt-1 list-disc pl-4 text-xs text-[#78350f]">
                    {assignPreview.warnings.map((w, i) => (
                      <li key={i}>
                        {w.code}: {w.description}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </Panel>
      ) : null}
    </div>
  );
}
