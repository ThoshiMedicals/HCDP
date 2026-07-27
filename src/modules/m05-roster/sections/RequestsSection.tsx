"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Panel, PanelSub, PanelTitle } from "@/components/ui/Panel";
import { Table, THead, Th, Td } from "@/components/ui/Table";
import { useRoster } from "../context";
import { hasM05Permission } from "../permissions";
import {
  approveSwap,
  proposeReplacement,
  recipientAcceptSwap,
  rejectSwap,
  requestSwap,
  withdrawSwap,
} from "../services/swap-service";
import { ConcurrentConflictError } from "../services/errors";
import * as store from "../repository/local-store";
import type { SwapRequest } from "../types/domain";
import {
  ConcurrentConflictState,
  EmptyState,
  OfflineState,
  RestrictedState,
  ValidationErrorState,
} from "../components/ux";

export function RequestsSection() {
  const { actor, bump, pushToast, refreshKey } = useRoster();
  void refreshKey;

  const canView = hasM05Permission(actor, "roster.view");
  const canRequest = hasM05Permission(actor, "roster.swap.request");
  const canApprove = hasM05Permission(actor, "roster.swap.approve");

  const [conflict, setConflict] = useState<{ targetType: string; targetId: string } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [shiftId, setShiftId] = useState("");
  const [requester, setRequester] = useState("");
  const [recipient, setRecipient] = useState("");
  const [proposeFor, setProposeFor] = useState<string | null>(null);
  const [proposeRecipient, setProposeRecipient] = useState("");
  const [approveFor, setApproveFor] = useState<string | null>(null);
  const [approveOverride, setApproveOverride] = useState("");
  const [acceptFor, setAcceptFor] = useState<string | null>(null);
  const [acceptPerson, setAcceptPerson] = useState("");
  const [rejectFor, setRejectFor] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const swaps = useMemo<SwapRequest[]>(() => {
    if (!canView) return [];
    return store.listSwaps();
  }, [canView, refreshKey]);

  const handleRequest = () => {
    const errs: string[] = [];
    if (!shiftId.trim()) errs.push("Shift id is required.");
    if (!requester.trim()) errs.push("Requester person id is required.");
    if (errs.length) {
      setErrors(errs);
      return;
    }
    setErrors([]);
    try {
      requestSwap(actor, {
        shiftId: shiftId.trim(),
        requesterPersonId: requester.trim(),
        recipientPersonId: recipient.trim() || null,
      });
      setShiftId("");
      setRequester("");
      setRecipient("");
      bump();
      pushToast("Swap requested.", "success");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Request failed", "danger");
    }
  };

  const handlePropose = (swap: SwapRequest) => {
    if (!proposeRecipient.trim()) {
      setErrors(["Recipient person id required."]);
      return;
    }
    setErrors([]);
    try {
      proposeReplacement(actor, {
        swapId: swap.id,
        recipientPersonId: proposeRecipient.trim(),
        expectedVersion: swap.version,
      });
      setProposeFor(null);
      setProposeRecipient("");
      bump();
      pushToast("Replacement proposed.", "success");
    } catch (e) {
      if (e instanceof ConcurrentConflictError) {
        setConflict({ targetType: e.targetType, targetId: e.targetId });
      } else {
        pushToast(e instanceof Error ? e.message : "Propose failed", "danger");
      }
    }
  };

  const handleAccept = (swap: SwapRequest) => {
    if (!acceptPerson.trim()) {
      setErrors(["Act-as person id required."]);
      return;
    }
    setErrors([]);
    try {
      recipientAcceptSwap(actor, {
        swapId: swap.id,
        expectedVersion: swap.version,
        actAsPersonId: acceptPerson.trim(),
      });
      setAcceptFor(null);
      setAcceptPerson("");
      bump();
      pushToast("Swap accepted by recipient.", "success");
    } catch (e) {
      if (e instanceof ConcurrentConflictError) {
        setConflict({ targetType: e.targetType, targetId: e.targetId });
      } else {
        pushToast(e instanceof Error ? e.message : "Accept failed", "danger");
      }
    }
  };

  const handleApprove = (swap: SwapRequest) => {
    const shift = store.getShift(swap.shiftId);
    if (!shift) {
      pushToast("Shift missing for swap.", "danger");
      return;
    }
    try {
      approveSwap(actor, {
        swapId: swap.id,
        expectedVersion: swap.version,
        expectedShiftVersion: shift.version,
        overrideReason: approveOverride.trim() || undefined,
      });
      setApproveFor(null);
      setApproveOverride("");
      bump();
      pushToast("Swap approved — reassignment created.", "success");
    } catch (e) {
      if (e instanceof ConcurrentConflictError) {
        setConflict({ targetType: e.targetType, targetId: e.targetId });
      } else {
        pushToast(e instanceof Error ? e.message : "Approve failed", "danger");
      }
    }
  };

  const handleReject = (swap: SwapRequest) => {
    if (!rejectReason.trim()) {
      setErrors(["Reject reason required."]);
      return;
    }
    setErrors([]);
    try {
      rejectSwap(actor, {
        swapId: swap.id,
        expectedVersion: swap.version,
        reason: rejectReason.trim(),
      });
      setRejectFor(null);
      setRejectReason("");
      bump();
      pushToast("Swap rejected.", "success");
    } catch (e) {
      if (e instanceof ConcurrentConflictError) {
        setConflict({ targetType: e.targetType, targetId: e.targetId });
      } else {
        pushToast(e instanceof Error ? e.message : "Reject failed", "danger");
      }
    }
  };

  const handleWithdraw = (swap: SwapRequest) => {
    try {
      withdrawSwap(actor, { swapId: swap.id, expectedVersion: swap.version });
      bump();
      pushToast("Swap withdrawn.", "success");
    } catch (e) {
      if (e instanceof ConcurrentConflictError) {
        setConflict({ targetType: e.targetType, targetId: e.targetId });
      } else {
        pushToast(e instanceof Error ? e.message : "Withdraw failed", "danger");
      }
    }
  };

  if (!canView) {
    return (
      <div className="grid gap-4">
        <div>
          <h2 className="m-0 text-xl font-extrabold text-[var(--ink)]">Requests</h2>
        </div>
        <RestrictedState permission="roster.view" />
      </div>
    );
  }

  if (conflict) {
    return (
      <div className="grid gap-4">
        <div>
          <h2 className="m-0 text-xl font-extrabold text-[var(--ink)]">Requests</h2>
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
        <h2 className="m-0 text-xl font-extrabold text-[var(--ink)]">Requests</h2>
        <p className="m-0 mt-1 text-sm text-[#526479]">
          Manage swap requests — request, propose, recipient-accept, approve, reject and
          withdraw.
        </p>
      </div>

      {canRequest ? (
        <Panel>
          <PanelTitle>Request swap</PanelTitle>
          <PanelSub>Requires roster.swap.request.</PanelSub>
          <ValidationErrorState errors={errors} onDismiss={() => setErrors([])} />
          <div className="mt-3 grid gap-2 md:grid-cols-4">
            <input
              className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
              placeholder="Shift id"
              value={shiftId}
              onChange={(e) => setShiftId(e.target.value)}
              aria-label="Shift id"
            />
            <input
              className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
              placeholder="Requester person id"
              value={requester}
              onChange={(e) => setRequester(e.target.value)}
              aria-label="Requester"
            />
            <input
              className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
              placeholder="Recipient (optional)"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              aria-label="Recipient"
            />
            <Button variant="teal" onClick={handleRequest}>
              Request swap
            </Button>
          </div>
        </Panel>
      ) : null}

      {swaps.length === 0 ? (
        <EmptyState
          title="No swap requests"
          description="Create a swap request above."
        />
      ) : (
        <Panel pad={false}>
          <div className="border-b border-[var(--line)] px-5 py-3">
            <PanelTitle>Swap requests</PanelTitle>
          </div>
          <Table>
            <THead>
              <Th>Shift</Th>
              <Th>Requester</Th>
              <Th>Recipient</Th>
              <Th>Status</Th>
              <Th>Version</Th>
              <Th>Actions</Th>
            </THead>
            <tbody>
              {swaps.map((swap) => (
                <tr key={swap.id}>
                  <Td className="font-mono text-xs">{swap.shiftId}</Td>
                  <Td className="font-mono text-xs">{swap.requesterPersonId}</Td>
                  <Td className="font-mono text-xs">{swap.recipientPersonId ?? "—"}</Td>
                  <Td>
                    <Badge
                      tone={
                        swap.status === "approved"
                          ? "success"
                          : swap.status === "rejected" || swap.status === "withdrawn"
                            ? "danger"
                            : "warn"
                      }
                    >
                      {swap.status}
                    </Badge>
                  </Td>
                  <Td className="text-xs">v{swap.version}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {canRequest && swap.status === "requested" ? (
                        proposeFor === swap.id ? (
                          <div className="grid gap-1">
                            <input
                              className="rounded border border-[var(--line)] px-2 py-1 text-xs"
                              placeholder="Recipient person"
                              value={proposeRecipient}
                              onChange={(e) => setProposeRecipient(e.target.value)}
                              aria-label="Propose recipient"
                            />
                            <div className="flex gap-1">
                              <Button
                                small
                                variant="teal"
                                onClick={() => handlePropose(swap)}
                              >
                                Propose
                              </Button>
                              <Button
                                small
                                variant="line"
                                onClick={() => setProposeFor(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            small
                            variant="line"
                            onClick={() => setProposeFor(swap.id)}
                          >
                            Propose
                          </Button>
                        )
                      ) : null}
                      {canRequest && swap.status === "proposed" ? (
                        acceptFor === swap.id ? (
                          <div className="grid gap-1">
                            <input
                              className="rounded border border-[var(--line)] px-2 py-1 text-xs"
                              placeholder="Act as person"
                              value={acceptPerson}
                              onChange={(e) => setAcceptPerson(e.target.value)}
                              aria-label="Accept as"
                            />
                            <div className="flex gap-1">
                              <Button small variant="teal" onClick={() => handleAccept(swap)}>
                                Accept
                              </Button>
                              <Button
                                small
                                variant="line"
                                onClick={() => setAcceptFor(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button small variant="line" onClick={() => setAcceptFor(swap.id)}>
                            Accept
                          </Button>
                        )
                      ) : null}
                      {canApprove && swap.status === "recipient_accepted" ? (
                        approveFor === swap.id ? (
                          <div className="grid gap-1">
                            <input
                              className="rounded border border-[var(--line)] px-2 py-1 text-xs"
                              placeholder="Override reason (if blockers)"
                              value={approveOverride}
                              onChange={(e) => setApproveOverride(e.target.value)}
                              aria-label="Approve override"
                            />
                            <div className="flex gap-1">
                              <Button small variant="teal" onClick={() => handleApprove(swap)}>
                                Approve
                              </Button>
                              <Button
                                small
                                variant="line"
                                onClick={() => setApproveFor(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            small
                            variant="line"
                            onClick={() => setApproveFor(swap.id)}
                          >
                            Approve
                          </Button>
                        )
                      ) : null}
                      {canApprove &&
                      (swap.status === "requested" ||
                        swap.status === "proposed" ||
                        swap.status === "recipient_accepted") ? (
                        rejectFor === swap.id ? (
                          <div className="grid gap-1">
                            <input
                              className="rounded border border-[var(--line)] px-2 py-1 text-xs"
                              placeholder="Reject reason"
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              aria-label="Reject reason"
                            />
                            <div className="flex gap-1">
                              <Button small variant="danger" onClick={() => handleReject(swap)}>
                                Reject
                              </Button>
                              <Button
                                small
                                variant="line"
                                onClick={() => setRejectFor(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            small
                            variant="line"
                            onClick={() => setRejectFor(swap.id)}
                          >
                            Reject
                          </Button>
                        )
                      ) : null}
                      {canRequest &&
                      (swap.status === "requested" ||
                        swap.status === "proposed" ||
                        swap.status === "recipient_accepted") ? (
                        <Button
                          small
                          variant="line"
                          onClick={() => handleWithdraw(swap)}
                        >
                          Withdraw
                        </Button>
                      ) : null}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Panel>
      )}
    </div>
  );
}
