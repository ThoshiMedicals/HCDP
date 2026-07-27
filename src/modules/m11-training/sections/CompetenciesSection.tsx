"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Panel, PanelSub, PanelTitle } from "@/components/ui/Panel";
import { Table, THead, Th, Td } from "@/components/ui/Table";
import { useTraining } from "../context";
import { recordCompetency, listCompetencies } from "../services/competency-service";
import { listCourses } from "../services/catalogue-service";
import { hasM11Permission } from "../permissions";
import { EmptyState, ValidationErrorState, RestrictedState, OfflineState } from "./ux-states";

export function CompetenciesSection() {
  const { actor, bump, pushToast, refreshKey } = useTraining();
  void refreshKey;

  const canRecord = hasM11Permission(actor, "training.competency.record");

  const [personId, setPersonId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [requirementId, setRequirementId] = useState("");
  const [competencyMet, setCompetencyMet] = useState(true);
  const [expiresOn, setExpiresOn] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  const records = listCompetencies();
  const courses = listCourses();
  const courseMap = Object.fromEntries(courses.map((c) => [c.id, c.title]));
  const active = records.filter((r) => !r.supersededById);

  if (!canRecord) {
    return (
      <div className="grid gap-4">
        <div>
          <h2 className="m-0 text-xl font-extrabold text-[var(--ink)]">Competencies</h2>
        </div>
        <RestrictedState permission="training.competency.record" />
      </div>
    );
  }

  const handleRecord = () => {
    const errs: string[] = [];
    if (!personId.trim()) errs.push("Person ID is required.");
    if (!courseId) errs.push("Course is required.");
    if (!requirementId.trim()) errs.push("Requirement ID is required.");
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);

    try {
      recordCompetency(actor, {
        personId: personId.trim(),
        courseId,
        requirementId: requirementId.trim(),
        competencyMet,
        expiresOn: expiresOn || undefined,
        notes: notes.trim() || undefined,
      });
      setPersonId("");
      setCourseId("");
      setRequirementId("");
      setExpiresOn("");
      setNotes("");
      bump();
      pushToast(`Competency recorded: ${competencyMet ? "met" : "not met"}.`, "success");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Record failed", "danger");
    }
  };

  return (
    <div className="grid gap-4">
      <OfflineState />
      <div>
        <h2 className="m-0 text-xl font-extrabold text-[var(--ink)]">Competencies</h2>
        <p className="m-0 mt-1 text-sm text-[#526479]">
          Record competency attestations against policy requirements. Supersede prior records via
          the service.
        </p>
      </div>

      <Panel>
        <PanelTitle>Record competency</PanelTitle>
        <PanelSub>Requires training.competency.record.</PanelSub>
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
            placeholder="Requirement ID (e.g. req-bls-annual)"
            value={requirementId}
            onChange={(e) => setRequirementId(e.target.value)}
            aria-label="Requirement ID"
          />
          <select
            className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
            value={competencyMet ? "yes" : "no"}
            onChange={(e) => setCompetencyMet(e.target.value === "yes")}
            aria-label="Competency met"
          >
            <option value="yes">Competency met</option>
            <option value="no">Competency not met</option>
          </select>
        </div>
        <div className="mt-2 grid gap-2 md:grid-cols-3">
          <input
            className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
            type="date"
            placeholder="Expires on (optional)"
            value={expiresOn}
            onChange={(e) => setExpiresOn(e.target.value)}
            aria-label="Expires on"
          />
          <input
            className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm col-span-2"
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            aria-label="Notes"
          />
        </div>
        <Button
          className="mt-3"
          variant="teal"
          onClick={handleRecord}
          disabled={!personId.trim() || !courseId || !requirementId.trim()}
        >
          Record competency
        </Button>
      </Panel>

      {records.length === 0 ? (
        <EmptyState title="No competency records" description="Record a competency above." />
      ) : (
        <Panel pad={false}>
          <div className="border-b border-[var(--line)] px-5 py-3 flex items-center gap-3">
            <PanelTitle>Competency records</PanelTitle>
            <span className="text-xs text-[#64748b]">
              {active.length} active · {records.length - active.length} superseded
            </span>
          </div>
          <Table>
            <THead>
              <Th>Person</Th>
              <Th>Course</Th>
              <Th>Requirement</Th>
              <Th>Met</Th>
              <Th>Expires</Th>
              <Th>Attested by</Th>
              <Th>Date</Th>
            </THead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className={r.supersededById ? "opacity-50" : ""}>
                  <Td className="font-mono text-xs">{r.personId}</Td>
                  <Td>{courseMap[r.courseId] ?? r.courseId}</Td>
                  <Td className="text-xs">{r.requirementId}</Td>
                  <Td>
                    <Badge tone={r.competencyMet ? "success" : "danger"}>
                      {r.competencyMet ? "met" : "not met"}
                    </Badge>
                  </Td>
                  <Td className="text-xs">{r.expiresOn ?? "—"}</Td>
                  <Td className="text-xs text-[#64748b]">{r.attestedBy}</Td>
                  <Td className="text-xs">{r.createdAt.slice(0, 10)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Panel>
      )}
    </div>
  );
}
