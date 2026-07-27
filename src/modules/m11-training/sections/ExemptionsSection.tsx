"use client";

import { Fragment, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Panel, PanelSub, PanelTitle } from "@/components/ui/Panel";
import { Table, THead, Th, Td } from "@/components/ui/Table";
import { useTraining } from "../context";
import {
  requestExemption,
  approveExemption,
  rejectExemption,
  revokeExemption,
  listExemptions,
} from "../services/exemption-service";
import { listCourses } from "../services/catalogue-service";
import { hasM11Permission } from "../permissions";
import type { ExemptionStatus } from "../types/domain";
import {
  EmptyState,
  FilteredEmptyState,
  ValidationErrorState,
  OfflineState,
} from "./ux-states";

const STATUS_TONES: Record<ExemptionStatus, "success" | "danger" | "warn" | "default" | "info"> = {
  request: "info",
  approved: "success",
  rejected: "danger",
  expired: "warn",
  revoked: "default",
};

export function ExemptionsSection() {
  const { actor, bump, pushToast, refreshKey } = useTraining();
  void refreshKey;

  const canRequest = hasM11Permission(actor, "training.exemption.request");
  const canApprove = hasM11Permission(actor, "training.exemption.approve");

  const [personId, setPersonId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [reason, setReason] = useState("");
  const [expiresOn, setExpiresOn] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<ExemptionStatus | "">("");
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [revokeMap, setRevokeMap] = useState<Record<string, string>>({});

  const exemptions = listExemptions();
  const courses = listCourses();
  const courseMap = Object.fromEntries(courses.map((c) => [c.id, c.title]));

  const filtered = statusFilter
    ? exemptions.filter((e) => e.status === statusFilter)
    : exemptions;

  const handleRequest = () => {
    const errs: string[] = [];
    if (!personId.trim()) errs.push("Person ID is required.");
    if (!courseId) errs.push("Course is required.");
    if (!reason.trim()) errs.push("Reason is required.");
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);

    try {
      requestExemption(actor, {
        personId: personId.trim(),
        courseId,
        reason: reason.trim(),
        expiresOn: expiresOn || undefined,
      });
      setPersonId("");
      setCourseId("");
      setReason("");
      setExpiresOn("");
      bump();
      pushToast("Exemption request submitted.", "success");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Request failed", "danger");
    }
  };

  const handleApprove = (id: string) => {
    try {
      approveExemption(actor, id, reviewNotes[id]);
      setReviewNotes((prev) => { const next = { ...prev }; delete next[id]; return next; });
      bump();
      pushToast("Exemption approved.", "success");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Approve failed", "danger");
    }
  };

  const handleReject = (id: string) => {
    try {
      rejectExemption(actor, id, reviewNotes[id]);
      setReviewNotes((prev) => { const next = { ...prev }; delete next[id]; return next; });
      bump();
      pushToast("Exemption rejected.", "warn");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Reject failed", "danger");
    }
  };

  const handleRevoke = (id: string) => {
    const rReason = revokeMap[id];
    if (!rReason?.trim()) {
      pushToast("A revocation reason is required.", "warn");
      return;
    }
    try {
      revokeExemption(actor, id, rReason.trim());
      setRevokeMap((prev) => { const next = { ...prev }; delete next[id]; return next; });
      bump();
      pushToast("Exemption revoked.", "warn");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Revoke failed", "danger");
    }
  };

  return (
    <div className="grid gap-4">
      <OfflineState />
      <div>
        <h2 className="m-0 text-xl font-extrabold text-[var(--ink)]">Exemptions</h2>
        <p className="m-0 mt-1 text-sm text-[#526479]">
          Request and manage training exemptions. Self-approval is not permitted.
        </p>
      </div>

      {canRequest ? (
        <Panel>
          <PanelTitle>Request exemption</PanelTitle>
          <PanelSub>Requires training.exemption.request. You cannot approve your own request.</PanelSub>
          <ValidationErrorState errors={errors} onDismiss={() => setErrors([])} />
          <div className="mt-3 grid gap-2 md:grid-cols-4">
            <input
              className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
              placeholder="Person ID"
              value={personId}
              onChange={(e) => setPersonId(e.target.value)}
              aria-label="Person ID"
            />
            <select
              className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              aria-label="Course"
            >
              <option value="">— Select course —</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.courseCode} — {c.title}
                </option>
              ))}
            </select>
            <input
              className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
              placeholder="Reason (required)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              aria-label="Reason"
            />
            <input
              className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
              type="date"
              placeholder="Expires on (optional)"
              value={expiresOn}
              onChange={(e) => setExpiresOn(e.target.value)}
              aria-label="Expires on"
            />
          </div>
          <Button
            className="mt-3"
            variant="teal"
            onClick={handleRequest}
            disabled={!personId.trim() || !courseId || !reason.trim()}
          >
            Submit request
          </Button>
        </Panel>
      ) : null}

      <Panel>
        <PanelTitle>Filter</PanelTitle>
        <div className="mt-2 flex flex-wrap gap-2">
          {(["", "request", "approved", "rejected", "expired", "revoked"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1 text-xs font-semibold border transition ${
                statusFilter === s
                  ? "border-[var(--teal-6)] bg-[var(--teal-3)] text-[#1d4ed8]"
                  : "border-[var(--line)] text-[#526479] hover:bg-[#f8fafc]"
              }`}
            >
              {s === "" ? "All" : s}
            </button>
          ))}
        </div>
      </Panel>

      {exemptions.length === 0 ? (
        <EmptyState title="No exemptions" description="Submit an exemption request above." />
      ) : filtered.length === 0 ? (
        <FilteredEmptyState onClear={() => setStatusFilter("")} />
      ) : (
        <Panel pad={false}>
          <Table>
            <THead>
              <Th>Person</Th>
              <Th>Course</Th>
              <Th>Status</Th>
              <Th>Reason</Th>
              <Th>Expires</Th>
              <Th>Requested by</Th>
              <Th>Actions</Th>
            </THead>
            <tbody>
              {filtered.map((ex) => {
                  const isSelf = ex.requestedBy === actor.userId;
                  return (
                  <Fragment key={ex.id}>
                    <tr key={ex.id}>
                      <Td className="font-mono text-xs">{ex.personId}</Td>
                      <Td>{courseMap[ex.courseId] ?? ex.courseId}</Td>
                      <Td>
                        <Badge tone={STATUS_TONES[ex.status]}>{ex.status}</Badge>
                      </Td>
                      <Td className="max-w-[200px] truncate text-xs">{ex.reason}</Td>
                      <Td className="text-xs">{ex.expiresOn ?? "—"}</Td>
                      <Td className="text-xs text-[#64748b]">{ex.requestedBy}</Td>
                      <Td>
                        <div className="flex flex-wrap gap-1">
                          {canApprove && ex.status === "request" && !isSelf ? (
                            <>
                              <Button small variant="green" onClick={() => handleApprove(ex.id)}>
                                Approve
                              </Button>
                              <Button small variant="warn" onClick={() => handleReject(ex.id)}>
                                Reject
                              </Button>
                            </>
                          ) : null}
                          {canApprove && ex.status === "request" && isSelf ? (
                            <span className="text-xs text-[#64748b] italic">
                              Cannot self-approve
                            </span>
                          ) : null}
                          {canApprove && ex.status === "approved" ? (
                            <Button
                              small
                              variant="warn"
                              onClick={() =>
                                setRevokeMap((prev) => ({
                                  ...prev,
                                  [ex.id]: prev[ex.id] ?? "",
                                }))
                              }
                            >
                              Revoke
                            </Button>
                          ) : null}
                        </div>
                      </Td>
                    </tr>
                    {revokeMap[ex.id] !== undefined ? (
                      <tr key={`${ex.id}-revoke`}>
                        <td colSpan={7} className="bg-[#f8fafc]">
                          <div className="flex gap-2 p-2">
                            <input
                              className="flex-1 rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
                              placeholder="Revocation reason (required)"
                              value={revokeMap[ex.id]}
                              onChange={(e) =>
                                setRevokeMap((prev) => ({ ...prev, [ex.id]: e.target.value }))
                              }
                              aria-label="Revocation reason"
                            />
                            <Button small variant="warn" onClick={() => handleRevoke(ex.id)}>
                              Confirm
                            </Button>
                            <Button
                              small
                              variant="line"
                              onClick={() =>
                                setRevokeMap((prev) => {
                                  const next = { ...prev };
                                  delete next[ex.id];
                                  return next;
                                })
                              }
                            >
                              Cancel
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                    {canApprove && ex.status === "request" && !isSelf ? (
                      <tr key={`${ex.id}-notes`}>
                        <td colSpan={7} className="bg-[#f8fafc]">
                          <div className="flex gap-2 p-2">
                            <input
                              className="flex-1 rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
                              placeholder="Review notes (optional) — shown after Approve or Reject above"
                              value={reviewNotes[ex.id] ?? ""}
                              onChange={(e) =>
                                setReviewNotes((prev) => ({ ...prev, [ex.id]: e.target.value }))
                              }
                              aria-label="Review notes"
                            />
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </Table>
        </Panel>
      )}
    </div>
  );
}
