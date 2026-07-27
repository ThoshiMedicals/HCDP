"use client";

import { Fragment, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Panel, PanelSub, PanelTitle } from "@/components/ui/Panel";
import { Table, THead, Th, Td } from "@/components/ui/Table";
import { useTraining } from "../context";
import {
  createSession,
  enrolInSession,
  cancelSession,
  markAttendance,
  listSessions,
} from "../services/session-service";
import { listCourses } from "../services/catalogue-service";
import { hasM11Permission } from "../permissions";
import type { SessionStatus } from "../types/domain";
import { EmptyState, ValidationErrorState, RestrictedState, OfflineState } from "./ux-states";

const STATUS_TONES: Record<SessionStatus, "success" | "danger" | "warn" | "default" | "info"> = {
  scheduled: "info",
  cancelled: "danger",
  completed: "success",
};

export function SessionsSection() {
  const { actor, bump, pushToast, refreshKey } = useTraining();
  void refreshKey;

  const canManage = hasM11Permission(actor, "training.manage_sessions");

  const [courseId, setCourseId] = useState("");
  const [scheduledStart, setScheduledStart] = useState("");
  const [scheduledEnd, setScheduledEnd] = useState("");
  const [facilitator, setFacilitator] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [capacityMax, setCapacityMax] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  const [enrolSessionId, setEnrolSessionId] = useState<string | null>(null);
  const [enrolPersonId, setEnrolPersonId] = useState("");
  const [attendSessionId, setAttendSessionId] = useState<string | null>(null);
  const [attendIds, setAttendIds] = useState("");

  const sessions = listSessions();
  const courses = listCourses();
  const courseMap = Object.fromEntries(courses.map((c) => [c.id, c.title]));

  if (!canManage) {
    return (
      <div className="grid gap-4">
        <div>
          <h2 className="m-0 text-xl font-extrabold text-[var(--ink)]">Sessions</h2>
        </div>
        <RestrictedState permission="training.manage_sessions" />
      </div>
    );
  }

  const handleCreate = () => {
    const errs: string[] = [];
    if (!courseId) errs.push("Course is required.");
    if (!scheduledStart) errs.push("Start date/time is required.");
    if (!scheduledEnd) errs.push("End date/time is required.");
    if (scheduledEnd && scheduledStart && scheduledEnd <= scheduledStart)
      errs.push("End must be after start.");
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);

    try {
      createSession(actor, {
        courseId,
        scheduledStart,
        scheduledEnd,
        facilitator: facilitator.trim() || undefined,
        locationLabel: locationLabel.trim() || undefined,
        capacityMax: capacityMax ? Number(capacityMax) : undefined,
      });
      setCourseId("");
      setScheduledStart("");
      setScheduledEnd("");
      setFacilitator("");
      setLocationLabel("");
      setCapacityMax("");
      bump();
      pushToast("Session created.", "success");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Create failed", "danger");
    }
  };

  const handleEnrol = (sessionId: string) => {
    if (!enrolPersonId.trim()) {
      pushToast("Enter a person ID to enrol.", "warn");
      return;
    }
    try {
      enrolInSession(actor, sessionId, enrolPersonId.trim());
      setEnrolPersonId("");
      setEnrolSessionId(null);
      bump();
      pushToast("Person enrolled.", "success");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Enrol failed", "danger");
    }
  };

  const handleCancel = (sessionId: string) => {
    try {
      cancelSession(actor, sessionId, "Cancelled by manager");
      bump();
      pushToast("Session cancelled.", "warn");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Cancel failed", "danger");
    }
  };

  const handleMarkAttendance = (sessionId: string) => {
    const ids = attendIds
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      markAttendance(actor, sessionId, ids);
      setAttendIds("");
      setAttendSessionId(null);
      bump();
      pushToast(`Attendance marked for ${ids.length} person(s).`, "success");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Mark attendance failed", "danger");
    }
  };

  return (
    <div className="grid gap-4">
      <OfflineState />
      <div>
        <h2 className="m-0 text-xl font-extrabold text-[var(--ink)]">Sessions</h2>
        <p className="m-0 mt-1 text-sm text-[#526479]">
          Create scheduled training sessions, enrol participants, and mark attendance.
        </p>
      </div>

      <Panel>
        <PanelTitle>Create session</PanelTitle>
        <PanelSub>Requires training.manage_sessions.</PanelSub>
        <ValidationErrorState errors={errors} onDismiss={() => setErrors([])} />
        <div className="mt-3 grid gap-2 md:grid-cols-3">
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
            type="datetime-local"
            value={scheduledStart}
            onChange={(e) => setScheduledStart(e.target.value)}
            aria-label="Scheduled start"
          />
          <input
            className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
            type="datetime-local"
            value={scheduledEnd}
            onChange={(e) => setScheduledEnd(e.target.value)}
            aria-label="Scheduled end"
          />
          <input
            className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
            placeholder="Facilitator (optional)"
            value={facilitator}
            onChange={(e) => setFacilitator(e.target.value)}
            aria-label="Facilitator"
          />
          <input
            className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
            placeholder="Location (optional)"
            value={locationLabel}
            onChange={(e) => setLocationLabel(e.target.value)}
            aria-label="Location"
          />
          <input
            className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
            type="number"
            min={1}
            placeholder="Max capacity (optional)"
            value={capacityMax}
            onChange={(e) => setCapacityMax(e.target.value)}
            aria-label="Max capacity"
          />
        </div>
        <Button
          className="mt-3"
          variant="teal"
          onClick={handleCreate}
          disabled={!courseId || !scheduledStart || !scheduledEnd}
        >
          Create session
        </Button>
      </Panel>

      {sessions.length === 0 ? (
        <EmptyState
          title="No sessions scheduled"
          description="Create a session above to get started."
        />
      ) : (
        <Panel pad={false}>
          <Table>
            <THead>
              <Th>Course</Th>
              <Th>Start</Th>
              <Th>End</Th>
              <Th>Capacity</Th>
              <Th>Enrolled</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </THead>
            <tbody>
              {sessions.map((s) => (
                <Fragment key={s.id}>
                  <tr key={s.id}>
                    <Td>{courseMap[s.courseId] ?? s.courseId}</Td>
                    <Td className="text-xs">{s.scheduledStart.replace("T", " ").slice(0, 16)}</Td>
                    <Td className="text-xs">{s.scheduledEnd.replace("T", " ").slice(0, 16)}</Td>
                    <Td>
                      {s.enrolledPersonIds.length}
                      {s.capacityMax != null ? ` / ${s.capacityMax}` : " / ∞"}
                    </Td>
                    <Td>{s.enrolledPersonIds.length}</Td>
                    <Td>
                      <Badge tone={STATUS_TONES[s.status]}>{s.status}</Badge>
                    </Td>
                    <Td>
                      <div className="flex flex-wrap gap-1">
                        {s.status === "scheduled" ? (
                          <>
                            <Button
                              small
                              variant="line"
                              onClick={() =>
                                setEnrolSessionId(enrolSessionId === s.id ? null : s.id)
                              }
                            >
                              Enrol
                            </Button>
                            <Button
                              small
                              variant="line"
                              onClick={() =>
                                setAttendSessionId(attendSessionId === s.id ? null : s.id)
                              }
                            >
                              Attendance
                            </Button>
                            <Button
                              small
                              variant="warn"
                              onClick={() => handleCancel(s.id)}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : null}
                        {s.status === "completed" ? (
                          <span className="text-xs text-[#64748b]">
                            {s.attendedPersonIds.length} attended
                          </span>
                        ) : null}
                      </div>
                    </Td>
                  </tr>
                  {enrolSessionId === s.id ? (
                    <tr key={`${s.id}-enrol`}>
                      <td colSpan={7} className="bg-[#f8fafc]">
                        <div className="flex gap-2 p-2">
                          <input
                            className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
                            placeholder="Person ID"
                            value={enrolPersonId}
                            onChange={(e) => setEnrolPersonId(e.target.value)}
                            aria-label="Person ID to enrol"
                          />
                          <Button
                            small
                            variant="teal"
                            onClick={() => handleEnrol(s.id)}
                            disabled={!enrolPersonId.trim()}
                          >
                            Enrol
                          </Button>
                          <Button small variant="line" onClick={() => setEnrolSessionId(null)}>
                            Cancel
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                  {attendSessionId === s.id ? (
                    <tr key={`${s.id}-attend`}>
                      <td colSpan={7} className="bg-[#f8fafc]">
                        <div className="flex gap-2 p-2">
                          <input
                            className="flex-1 rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
                            placeholder="Attended person IDs (comma-separated)"
                            value={attendIds}
                            onChange={(e) => setAttendIds(e.target.value)}
                            aria-label="Attended person IDs"
                          />
                          <Button
                            small
                            variant="teal"
                            onClick={() => handleMarkAttendance(s.id)}
                          >
                            Mark attendance
                          </Button>
                          <Button small variant="line" onClick={() => setAttendSessionId(null)}>
                            Cancel
                          </Button>
                        </div>
                        <p className="px-3 pb-2 text-xs text-[#64748b]">
                          Marking attendance sets session to &quot;completed&quot;.
                        </p>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
            </tbody>
          </Table>
        </Panel>
      )}
    </div>
  );
}
