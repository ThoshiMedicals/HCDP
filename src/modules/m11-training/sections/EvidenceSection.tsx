"use client";

import { Fragment, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Panel, PanelSub, PanelTitle } from "@/components/ui/Panel";
import { Table, THead, Th, Td } from "@/components/ui/Table";
import { useTraining } from "../context";
import {
  addEvidence,
  verifyEvidence,
  rejectEvidence,
  listEvidence,
} from "../services/evidence-service";
import { listCourses } from "../services/catalogue-service";
import { hasM11Permission } from "../permissions";
import type { EvidenceStatus } from "../types/domain";
import {
  EmptyState,
  FilteredEmptyState,
  ValidationErrorState,
  OfflineState,
} from "./ux-states";

const STATUS_TONES: Record<EvidenceStatus, "success" | "danger" | "warn" | "default"> = {
  pending: "warn",
  verified: "success",
  rejected: "danger",
};

export function EvidenceSection() {
  const { actor, bump, pushToast, refreshKey } = useTraining();
  void refreshKey;

  const canVerify = hasM11Permission(actor, "training.evidence.verify");
  const canViewSensitive = hasM11Permission(actor, "training.view_sensitive_evidence");

  const [personId, setPersonId] = useState("");
  const [label, setLabel] = useState("");
  const [courseId, setCourseId] = useState("");
  const [source, setSource] = useState<"external" | "upload">("external");
  const [url, setUrl] = useState("");
  const [sensitive, setSensitive] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<EvidenceStatus | "">("");
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [rejectOpen, setRejectOpen] = useState<Record<string, boolean>>({});

  const allEvidence = listEvidence();
  const courses = listCourses();
  const courseMap = Object.fromEntries(courses.map((c) => [c.id, c.title]));

  const filtered = statusFilter
    ? allEvidence.filter((e) => e.status === statusFilter)
    : allEvidence;

  const handleAdd = () => {
    const errs: string[] = [];
    if (!personId.trim()) errs.push("Person ID is required.");
    if (!label.trim()) errs.push("Label is required.");
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);

    try {
      addEvidence(actor, {
        personId: personId.trim(),
        source,
        label: label.trim(),
        courseId: courseId || undefined,
        url: url.trim() || undefined,
        sensitive,
      });
      setPersonId("");
      setLabel("");
      setCourseId("");
      setUrl("");
      setSensitive(false);
      bump();
      pushToast("Evidence added.", "success");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Add failed", "danger");
    }
  };

  const handleVerify = (id: string) => {
    try {
      verifyEvidence(actor, id);
      bump();
      pushToast("Evidence verified.", "success");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Verify failed", "danger");
    }
  };

  const handleReject = (id: string) => {
    const r = rejectReason[id];
    if (!r?.trim()) {
      pushToast("A rejection reason is required.", "warn");
      return;
    }
    try {
      rejectEvidence(actor, id, r.trim());
      setRejectReason((prev) => { const next = { ...prev }; delete next[id]; return next; });
      setRejectOpen((prev) => { const next = { ...prev }; delete next[id]; return next; });
      bump();
      pushToast("Evidence rejected.", "warn");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Reject failed", "danger");
    }
  };

  return (
    <div className="grid gap-4">
      <OfflineState />
      <div>
        <h2 className="m-0 text-xl font-extrabold text-[var(--ink)]">Evidence</h2>
        <p className="m-0 mt-1 text-sm text-[#526479]">
          Training evidence records. Sensitive evidence is masked unless you have{" "}
          <code>training.view_sensitive_evidence</code>.
        </p>
      </div>

      <Panel>
        <PanelTitle>Add evidence</PanelTitle>
        <PanelSub>Requires training.view (basic add).</PanelSub>
        <ValidationErrorState errors={errors} onDismiss={() => setErrors([])} />
        <div className="mt-3 grid gap-2 md:grid-cols-4">
          <input
            className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
            placeholder="Person ID"
            value={personId}
            onChange={(e) => setPersonId(e.target.value)}
            aria-label="Person ID"
          />
          <input
            className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
            placeholder="Label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            aria-label="Label"
          />
          <select
            className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            aria-label="Course (optional)"
          >
            <option value="">— Course (optional) —</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.courseCode} — {c.title}
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
            value={source}
            onChange={(e) => setSource(e.target.value as "external" | "upload")}
            aria-label="Source"
          >
            <option value="external">External</option>
            <option value="upload">Upload</option>
          </select>
        </div>
        <div className="mt-2 grid gap-2 md:grid-cols-3">
          <input
            className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm col-span-2"
            placeholder="URL (optional)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            aria-label="URL"
          />
          <label className="flex items-center gap-2 text-sm text-[#526479]">
            <input
              type="checkbox"
              checked={sensitive}
              onChange={(e) => setSensitive(e.target.checked)}
            />
            Sensitive evidence
          </label>
        </div>
        <Button
          className="mt-3"
          variant="teal"
          onClick={handleAdd}
          disabled={!personId.trim() || !label.trim()}
        >
          Add evidence
        </Button>
      </Panel>

      <Panel>
        <PanelTitle>Filter by status</PanelTitle>
        <div className="mt-2 flex flex-wrap gap-2">
          {(["", "pending", "verified", "rejected"] as const).map((s) => (
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

      {allEvidence.length === 0 ? (
        <EmptyState title="No evidence records" description="Add evidence above." />
      ) : filtered.length === 0 ? (
        <FilteredEmptyState onClear={() => setStatusFilter("")} />
      ) : (
        <Panel pad={false}>
          <Table>
            <THead>
              <Th>Person</Th>
              <Th>Label</Th>
              <Th>Course</Th>
              <Th>Source</Th>
              <Th>Sensitive</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </THead>
            <tbody>
              {filtered.map((ev) => {
                const isHidden = ev.sensitive && !canViewSensitive;
                return (
                  <Fragment key={ev.id}>
                    <tr key={ev.id}>
                      <Td className="font-mono text-xs">{ev.personId}</Td>
                      <Td>
                        {isHidden ? (
                          <span className="text-[#64748b] italic text-xs">
                            [sensitive — restricted]
                          </span>
                        ) : (
                          ev.label
                        )}
                      </Td>
                      <Td>{courseMap[ev.courseId ?? ""] ?? (ev.courseId ?? "—")}</Td>
                      <Td className="text-xs">{ev.source}</Td>
                      <Td>
                        {ev.sensitive ? <Badge tone="warn">sensitive</Badge> : <span className="text-xs text-[#64748b]">no</span>}
                      </Td>
                      <Td>
                        <Badge tone={STATUS_TONES[ev.status]}>{ev.status}</Badge>
                      </Td>
                      <Td>
                        {!isHidden && canVerify && ev.status === "pending" ? (
                          <div className="flex flex-wrap gap-1">
                            <Button small variant="teal" onClick={() => handleVerify(ev.id)}>
                              Verify
                            </Button>
                            <Button
                              small
                              variant="warn"
                              onClick={() =>
                                setRejectOpen((prev) => ({ ...prev, [ev.id]: !prev[ev.id] }))
                              }
                            >
                              Reject
                            </Button>
                          </div>
                        ) : null}
                      </Td>
                    </tr>
                    {rejectOpen[ev.id] ? (
                      <tr key={`${ev.id}-reject`}>
                        <td colSpan={7} className="bg-[#fef2f2]">
                          <div className="flex gap-2 p-2">
                            <input
                              className="flex-1 rounded-lg border border-[#fca5a5] px-3 py-2 text-sm"
                              placeholder="Rejection reason"
                              value={rejectReason[ev.id] ?? ""}
                              onChange={(e) =>
                                setRejectReason((prev) => ({ ...prev, [ev.id]: e.target.value }))
                              }
                              aria-label="Rejection reason"
                            />
                            <Button small variant="warn" onClick={() => handleReject(ev.id)}>
                              Confirm
                            </Button>
                            <Button
                              small
                              variant="line"
                              onClick={() =>
                                setRejectOpen((prev) => { const next = { ...prev }; delete next[ev.id]; return next; })
                              }
                            >
                              Cancel
                            </Button>
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
