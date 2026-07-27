"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Panel, PanelSub, PanelTitle } from "@/components/ui/Panel";
import { Table, THead, Th, Td } from "@/components/ui/Table";
import { useTraining } from "../context";
import {
  assignManual,
  completeAssignment,
  revokeAssignment,
  listAssignments,
} from "../services/assignment-service";
import { listCourses } from "../services/catalogue-service";
import { hasM11Permission } from "../permissions";
import type { AssignmentStatus } from "../types/domain";
import {
  EmptyState,
  FilteredEmptyState,
  ValidationErrorState,
  OfflineState,
} from "./ux-states";

const STATUS_TONES: Record<AssignmentStatus, "success" | "danger" | "warn" | "default" | "info"> = {
  assigned: "info",
  in_progress: "info",
  completed: "success",
  due: "warn",
  grace: "warn",
  overdue: "danger",
  expired: "danger",
  superseded: "default",
  revoked: "default",
  exempt: "default",
};

export function AssignmentsSection() {
  const { actor, bump, pushToast, refreshKey } = useTraining();
  void refreshKey;

  const [personId, setPersonId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<AssignmentStatus | "">("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const canAssign = hasM11Permission(actor, "training.assign");
  const canComplete = hasM11Permission(actor, "training.complete");

  const allAssignments = listAssignments();
  const courses = listCourses();

  const filtered = statusFilter
    ? allAssignments.filter((a) => a.status === statusFilter)
    : allAssignments;
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pageCount - 1);
  const paged = filtered.slice(pageSafe * PAGE_SIZE, pageSafe * PAGE_SIZE + PAGE_SIZE);

  const courseMap = Object.fromEntries(courses.map((c) => [c.id, c.title]));

  const handleAssign = () => {
    const errs: string[] = [];
    if (!personId.trim()) errs.push("Person ID is required.");
    if (!courseId.trim()) errs.push("Course ID is required.");
    if (!dueDate) errs.push("Due date is required.");
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);

    try {
      assignManual(actor, {
        personId: personId.trim(),
        courseId: courseId.trim(),
        dueDate,
        notes: notes.trim() || undefined,
      });
      setPersonId("");
      setCourseId("");
      setDueDate("");
      setNotes("");
      bump();
      pushToast("Assignment created.", "success");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Assign failed", "danger");
    }
  };

  const handleComplete = (assignmentId: string) => {
    try {
      completeAssignment(actor, assignmentId);
      bump();
      pushToast("Assignment completed.", "success");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Complete failed", "danger");
    }
  };

  const handleRevoke = (assignmentId: string) => {
    try {
      revokeAssignment(actor, assignmentId, "Revoked by manager");
      bump();
      pushToast("Assignment revoked.", "warn");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Revoke failed", "danger");
    }
  };

  return (
    <div className="grid gap-4">
      <OfflineState />
      <div>
        <h2 className="m-0 text-xl font-extrabold text-[var(--ink)]">Assignments</h2>
        <p className="m-0 mt-1 text-sm text-[#526479]">
          Manual assignment of courses to people. Complete or revoke as needed.
        </p>
      </div>

      {canAssign ? (
        <Panel>
          <PanelTitle>Assign course manually</PanelTitle>
          <PanelSub>Enter a person ID and select a course. Use text input for personId (demo).</PanelSub>
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
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              aria-label="Due date"
            />
            <Button
              variant="teal"
              onClick={handleAssign}
              disabled={!personId.trim() || !courseId || !dueDate}
            >
              Assign
            </Button>
          </div>
          <div className="mt-2">
            <input
              className="w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
              placeholder="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              aria-label="Notes"
            />
          </div>
        </Panel>
      ) : null}

      <Panel>
        <PanelTitle>Filter by status</PanelTitle>
        <div className="mt-2 flex flex-wrap gap-2">
          {(["", "assigned", "in_progress", "completed", "due", "overdue", "revoked", "exempt"] as const).map(
            (s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setStatusFilter(s);
                  setPage(0);
                }}
                className={`rounded-full px-3 py-1 text-xs font-semibold border transition ${
                  statusFilter === s
                    ? "border-[var(--teal-6)] bg-[var(--teal-3)] text-[#1d4ed8]"
                    : "border-[var(--line)] text-[#526479] hover:bg-[#f8fafc]"
                }`}
              >
                {s === "" ? "All" : s}
              </button>
            )
          )}
        </div>
      </Panel>

      {allAssignments.length === 0 ? (
        <EmptyState
          title="No assignments yet"
          description="Assign a course manually above or via assignment rules."
        />
      ) : filtered.length === 0 ? (
        <FilteredEmptyState onClear={() => setStatusFilter("")} />
      ) : (
        <Panel pad={false}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] px-5 py-3">
            <PanelTitle>
              Assignments ({filtered.length}) — page {pageSafe + 1}/{pageCount}
            </PanelTitle>
            <div className="flex gap-2">
              <Button
                small
                variant="line"
                disabled={pageSafe <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </Button>
              <Button
                small
                variant="line"
                disabled={pageSafe >= pageCount - 1}
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
          <Table>
            <THead>
              <Th>Person ID</Th>
              <Th>Course</Th>
              <Th>Due</Th>
              <Th>Status</Th>
              <Th>Assigned by</Th>
              <Th>Actions</Th>
            </THead>
            <tbody>
              {paged.map((a) => (
                <tr key={a.id}>
                  <Td className="font-mono text-xs">{a.personId}</Td>
                  <Td>{courseMap[a.courseId] ?? a.courseId}</Td>
                  <Td>{a.dueDate}</Td>
                  <Td>
                    <Badge tone={STATUS_TONES[a.status]}>{a.status}</Badge>
                  </Td>
                  <Td className="text-xs text-[#64748b]">{a.assignedBy}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {canComplete &&
                      !["completed", "revoked", "superseded", "exempt"].includes(a.status) ? (
                        <Button small variant="green" onClick={() => handleComplete(a.id)}>
                          Complete
                        </Button>
                      ) : null}
                      {canAssign &&
                      !["revoked", "superseded", "completed"].includes(a.status) ? (
                        <Button small variant="warn" onClick={() => handleRevoke(a.id)}>
                          Revoke
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
