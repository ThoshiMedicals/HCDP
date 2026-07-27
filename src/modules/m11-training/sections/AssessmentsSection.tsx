"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Panel, PanelSub, PanelTitle } from "@/components/ui/Panel";
import { Table, THead, Th, Td } from "@/components/ui/Table";
import { useTraining } from "../context";
import { recordAssessment, listAssessments } from "../services/assessment-service";
import { listCourses } from "../services/catalogue-service";
import { hasM11Permission } from "../permissions";
import type { AssessmentOutcome } from "../types/domain";
import { EmptyState, ValidationErrorState, RestrictedState, OfflineState } from "./ux-states";

const OUTCOME_TONES: Record<AssessmentOutcome, "success" | "danger" | "warn"> = {
  pass: "success",
  fail: "danger",
  borderline: "warn",
};

export function AssessmentsSection() {
  const { actor, bump, pushToast, refreshKey } = useTraining();
  void refreshKey;

  const canAssess = hasM11Permission(actor, "training.assess");

  const [personId, setPersonId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [outcome, setOutcome] = useState<AssessmentOutcome>("pass");
  const [score, setScore] = useState("");
  const [maxScore, setMaxScore] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  const assessments = listAssessments();
  const courses = listCourses();
  const courseMap = Object.fromEntries(courses.map((c) => [c.id, c.title]));
  const active = assessments.filter((a) => !a.supersededById);

  if (!canAssess) {
    return (
      <div className="grid gap-4">
        <div>
          <h2 className="m-0 text-xl font-extrabold text-[var(--ink)]">Assessments</h2>
        </div>
        <RestrictedState permission="training.assess" />
      </div>
    );
  }

  const handleRecord = () => {
    const errs: string[] = [];
    if (!personId.trim()) errs.push("Person ID is required.");
    if (!courseId) errs.push("Course is required.");
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);

    try {
      recordAssessment(actor, {
        personId: personId.trim(),
        courseId,
        outcome,
        score: score ? Number(score) : undefined,
        maxScore: maxScore ? Number(maxScore) : undefined,
        notes: notes.trim() || undefined,
      });
      setPersonId("");
      setCourseId("");
      setScore("");
      setMaxScore("");
      setNotes("");
      bump();
      pushToast(`Assessment recorded: ${outcome}.`, "success");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Record failed", "danger");
    }
  };

  return (
    <div className="grid gap-4">
      <OfflineState />
      <div>
        <h2 className="m-0 text-xl font-extrabold text-[var(--ink)]">Assessments</h2>
        <p className="m-0 mt-1 text-sm text-[#526479]">
          Record assessment outcomes. Supersede prior records by linking via supersedesId.
        </p>
      </div>

      <Panel>
        <PanelTitle>Record assessment</PanelTitle>
        <PanelSub>Requires training.assess.</PanelSub>
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
          <select
            className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
            value={outcome}
            onChange={(e) => setOutcome(e.target.value as AssessmentOutcome)}
            aria-label="Outcome"
          >
            <option value="pass">Pass</option>
            <option value="fail">Fail</option>
            <option value="borderline">Borderline</option>
          </select>
          <Button
            variant="teal"
            onClick={handleRecord}
            disabled={!personId.trim() || !courseId}
          >
            Record
          </Button>
        </div>
        <div className="mt-2 grid gap-2 md:grid-cols-3">
          <input
            className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
            type="number"
            placeholder="Score (optional)"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            aria-label="Score"
          />
          <input
            className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
            type="number"
            placeholder="Max score (optional)"
            value={maxScore}
            onChange={(e) => setMaxScore(e.target.value)}
            aria-label="Max score"
          />
          <input
            className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            aria-label="Notes"
          />
        </div>
      </Panel>

      {assessments.length === 0 ? (
        <EmptyState title="No assessments recorded" description="Record an assessment above." />
      ) : (
        <Panel pad={false}>
          <div className="border-b border-[var(--line)] px-5 py-3 flex items-center gap-3">
            <PanelTitle>Assessment records</PanelTitle>
            <span className="text-xs text-[#64748b]">
              {active.length} active · {assessments.length - active.length} superseded
            </span>
          </div>
          <Table>
            <THead>
              <Th>Person</Th>
              <Th>Course</Th>
              <Th>Outcome</Th>
              <Th>Score</Th>
              <Th>Assessor</Th>
              <Th>Date</Th>
              <Th>State</Th>
            </THead>
            <tbody>
              {assessments.map((a) => (
                <tr key={a.id} className={a.supersededById ? "opacity-50" : ""}>
                  <Td className="font-mono text-xs">{a.personId}</Td>
                  <Td>{courseMap[a.courseId] ?? a.courseId}</Td>
                  <Td>
                    <Badge tone={OUTCOME_TONES[a.outcome]}>{a.outcome}</Badge>
                  </Td>
                  <Td className="text-xs">
                    {a.score != null ? `${a.score}${a.maxScore != null ? ` / ${a.maxScore}` : ""}` : "—"}
                  </Td>
                  <Td className="text-xs text-[#64748b]">{a.assessorId}</Td>
                  <Td className="text-xs">{a.createdAt.slice(0, 10)}</Td>
                  <Td>
                    {a.supersededById ? (
                      <Badge tone="default">superseded</Badge>
                    ) : (
                      <Badge tone="success">active</Badge>
                    )}
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
