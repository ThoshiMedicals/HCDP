"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Panel, PanelSub, PanelTitle } from "@/components/ui/Panel";
import { Table, THead, Th, Td } from "@/components/ui/Table";
import { useRoster } from "../context";
import { hasM05Permission } from "../permissions";
import {
  acceptOpenShift,
  offerOpenShift,
  selectOpenShiftApplicant,
  withdrawOpenShift,
} from "../services/open-shift-service";
import { listShiftsForActor } from "../services/shift-service";
import { ConcurrentConflictError } from "../services/errors";
import * as store from "../repository/local-store";
import type { OpenShift } from "../types/domain";
import {
  ConcurrentConflictState,
  EmptyState,
  OfflineState,
  RestrictedState,
  ValidationErrorState,
} from "../components/ux";

export function OpenShiftsSection() {
  const { actor, bump, pushToast, refreshKey } = useRoster();
  void refreshKey;

  const canView = hasM05Permission(actor, "roster.view");
  const canManage = hasM05Permission(actor, "roster.open_shift.manage");
  const canAssign = hasM05Permission(actor, "roster.assign");

  const [conflict, setConflict] = useState<{ targetType: string; targetId: string } | null>(null);
  const [offerShiftId, setOfferShiftId] = useState<string>("");
  const [offerAudience, setOfferAudience] = useState<string>("");
  const [offerErrors, setOfferErrors] = useState<string[]>([]);
  const [acceptOpenShiftId, setAcceptOpenShiftId] = useState<string | null>(null);
  const [acceptPersonId, setAcceptPersonId] = useState("");
  const [selectFor, setSelectFor] = useState<string | null>(null);
  const [selectPersonId, setSelectPersonId] = useState("");
  const [selectOverride, setSelectOverride] = useState("");

  const openShifts = useMemo(() => {
    if (!canView) return [];
    return store.listOpenShifts();
  }, [canView, refreshKey]);

  const unassignedShifts = useMemo(() => {
    if (!canView) return [];
    try {
      return listShiftsForActor(actor).filter(
        (s) => !s.currentAssignmentId && s.status !== "cancelled" && s.status !== "superseded"
      );
    } catch {
      return [];
    }
  }, [actor, canView, refreshKey]);

  const handleOffer = () => {
    const errs: string[] = [];
    if (!offerShiftId) errs.push("Select a shift.");
    if (!offerAudience.trim()) errs.push("Audience personIds required (comma separated).");
    if (errs.length) {
      setOfferErrors(errs);
      return;
    }
    setOfferErrors([]);
    const audience = offerAudience
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      offerOpenShift(actor, { shiftId: offerShiftId, audiencePersonIds: audience });
      setOfferShiftId("");
      setOfferAudience("");
      bump();
      pushToast("Open shift offered.", "success");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Offer failed", "danger");
    }
  };

  const handleAccept = (open: OpenShift) => {
    if (!acceptPersonId.trim()) {
      pushToast("Person id required to accept.", "danger");
      return;
    }
    try {
      acceptOpenShift(actor, {
        openShiftId: open.id,
        expectedVersion: open.version,
        actAsPersonId: acceptPersonId.trim(),
      });
      setAcceptOpenShiftId(null);
      setAcceptPersonId("");
      bump();
      pushToast(`${acceptPersonId} applied to ${open.id}.`, "success");
    } catch (e) {
      if (e instanceof ConcurrentConflictError) {
        setConflict({ targetType: e.targetType, targetId: e.targetId });
      } else {
        pushToast(e instanceof Error ? e.message : "Accept failed", "danger");
      }
    }
  };

  const handleSelect = (open: OpenShift) => {
    if (!selectPersonId.trim()) {
      pushToast("Person id required to select.", "danger");
      return;
    }
    const shift = store.getShift(open.shiftId);
    if (!shift) {
      pushToast("Shift missing for open shift.", "danger");
      return;
    }
    try {
      selectOpenShiftApplicant(actor, {
        openShiftId: open.id,
        expectedVersion: open.version,
        expectedShiftVersion: shift.version,
        personId: selectPersonId.trim(),
        overrideReason: selectOverride.trim() || undefined,
      });
      setSelectFor(null);
      setSelectPersonId("");
      setSelectOverride("");
      bump();
      pushToast(`Selected ${selectPersonId} — assignment created.`, "success");
    } catch (e) {
      if (e instanceof ConcurrentConflictError) {
        setConflict({ targetType: e.targetType, targetId: e.targetId });
      } else {
        pushToast(e instanceof Error ? e.message : "Select failed", "danger");
      }
    }
  };

  const handleWithdraw = (open: OpenShift) => {
    const reason = window.prompt("Withdraw reason:") ?? "";
    if (!reason.trim()) return;
    try {
      withdrawOpenShift(actor, {
        openShiftId: open.id,
        expectedVersion: open.version,
        reason: reason.trim(),
      });
      bump();
      pushToast("Open shift withdrawn.", "success");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Withdraw failed", "danger");
    }
  };

  if (!canView) {
    return (
      <div className="grid gap-4">
        <div>
          <h2 className="m-0 text-xl font-extrabold text-[var(--ink)]">Open Shifts</h2>
        </div>
        <RestrictedState permission="roster.view" />
      </div>
    );
  }

  if (conflict) {
    return (
      <div className="grid gap-4">
        <div>
          <h2 className="m-0 text-xl font-extrabold text-[var(--ink)]">Open Shifts</h2>
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
        <h2 className="m-0 text-xl font-extrabold text-[var(--ink)]">Open Shifts</h2>
        <p className="m-0 mt-1 text-sm text-[#526479]">
          Offer, accept and select workers for open shifts. Every acceptance re-checks
          authoritative eligibility.
        </p>
      </div>

      {canManage ? (
        <Panel>
          <PanelTitle>Offer open shift</PanelTitle>
          <PanelSub>Requires roster.open_shift.manage.</PanelSub>
          <ValidationErrorState errors={offerErrors} onDismiss={() => setOfferErrors([])} />
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            <select
              className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
              value={offerShiftId}
              onChange={(e) => setOfferShiftId(e.target.value)}
              aria-label="Shift"
            >
              <option value="">Select shift…</option>
              {unassignedShifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.roleLabel ?? "shift"} · {s.localStart} → {s.localEnd}
                </option>
              ))}
            </select>
            <input
              className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
              placeholder="Audience personIds (comma-separated)"
              value={offerAudience}
              onChange={(e) => setOfferAudience(e.target.value)}
              aria-label="Audience"
            />
            <Button variant="teal" onClick={handleOffer}>
              Offer
            </Button>
          </div>
        </Panel>
      ) : null}

      {openShifts.length === 0 ? (
        <EmptyState
          title="No open shifts"
          description="Offer an unassigned shift above to create one."
        />
      ) : (
        <Panel pad={false}>
          <div className="border-b border-[var(--line)] px-5 py-3">
            <PanelTitle>Open shifts</PanelTitle>
          </div>
          <Table>
            <THead>
              <Th>Shift</Th>
              <Th>Status</Th>
              <Th>Audience</Th>
              <Th>Applicants</Th>
              <Th>Selected</Th>
              <Th>Actions</Th>
            </THead>
            <tbody>
              {openShifts.map((o) => {
                const shift = store.getShift(o.shiftId);
                return (
                  <tr key={o.id}>
                    <Td className="font-mono text-xs">
                      {shift?.roleLabel ?? "?"} · {o.shiftId}
                    </Td>
                    <Td>
                      <Badge
                        tone={
                          o.status === "closed"
                            ? "success"
                            : o.status === "escalated"
                              ? "danger"
                              : "warn"
                        }
                      >
                        {o.status}
                      </Badge>
                    </Td>
                    <Td className="text-xs">
                      {o.audiencePersonIds.length}
                    </Td>
                    <Td className="text-xs">
                      {o.applicants.length}
                      {o.applicants.length > 0 ? (
                        <span className="ml-1 text-[10px] text-[#64748b]">
                          ({o.applicants.map((a) => a.personId).join(", ")})
                        </span>
                      ) : null}
                    </Td>
                    <Td className="text-xs">{o.selectedPersonId ?? "—"}</Td>
                    <Td>
                      <div className="flex flex-wrap gap-2">
                        {canView && !o.selectedPersonId ? (
                          acceptOpenShiftId === o.id ? (
                            <div className="grid gap-1">
                              <input
                                className="rounded border border-[var(--line)] px-2 py-1 text-xs"
                                placeholder="Act as personId"
                                value={acceptPersonId}
                                onChange={(e) => setAcceptPersonId(e.target.value)}
                                aria-label="Accept as person"
                              />
                              <div className="flex gap-1">
                                <Button
                                  small
                                  variant="teal"
                                  onClick={() => handleAccept(o)}
                                >
                                  Apply
                                </Button>
                                <Button
                                  small
                                  variant="line"
                                  onClick={() => setAcceptOpenShiftId(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              small
                              variant="line"
                              onClick={() => setAcceptOpenShiftId(o.id)}
                            >
                              Apply
                            </Button>
                          )
                        ) : null}
                        {canAssign && canManage && !o.selectedPersonId ? (
                          selectFor === o.id ? (
                            <div className="grid gap-1">
                              <input
                                className="rounded border border-[var(--line)] px-2 py-1 text-xs"
                                placeholder="Applicant personId"
                                value={selectPersonId}
                                onChange={(e) => setSelectPersonId(e.target.value)}
                                aria-label="Select person"
                              />
                              <input
                                className="rounded border border-[var(--line)] px-2 py-1 text-xs"
                                placeholder="Override reason (if blockers)"
                                value={selectOverride}
                                onChange={(e) => setSelectOverride(e.target.value)}
                                aria-label="Override reason"
                              />
                              <div className="flex gap-1">
                                <Button
                                  small
                                  variant="teal"
                                  onClick={() => handleSelect(o)}
                                >
                                  Confirm select
                                </Button>
                                <Button
                                  small
                                  variant="line"
                                  onClick={() => setSelectFor(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              small
                              variant="line"
                              onClick={() => setSelectFor(o.id)}
                            >
                              Select
                            </Button>
                          )
                        ) : null}
                        {canManage &&
                        (o.status === "open" ||
                          o.status === "offered" ||
                          o.status === "eoi_received" ||
                          o.status === "escalated") ? (
                          <Button
                            small
                            variant="line"
                            onClick={() => handleWithdraw(o)}
                          >
                            Withdraw
                          </Button>
                        ) : null}
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Panel>
      )}
    </div>
  );
}
