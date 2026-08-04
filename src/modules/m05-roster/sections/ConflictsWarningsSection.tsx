"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Panel, PanelSub, PanelTitle } from "@/components/ui/Panel";
import { Table, THead, Th, Td } from "@/components/ui/Table";
import { useRoster } from "../context";
import { hasM05Permission } from "../permissions";
import { evaluateConflicts, type ConflictFinding } from "../services/conflict-service";
import { listShiftsForActor } from "../services/shift-service";
import type { Shift } from "../types/domain";
import {
  EmptyState,
  OfflineState,
  RestrictedState,
  ValidationErrorState,
} from "../components/ux";
import { SectionFrame } from "../components/SectionFrame";

export function ConflictsWarningsSection() {
  const { actor, pushToast, refreshKey } = useRoster();
  void refreshKey;

  const canView = hasM05Permission(actor, "roster.view");

  const [personId, setPersonId] = useState("");
  const [candidateShiftId, setCandidateShiftId] = useState("");
  const [findings, setFindings] = useState<ConflictFinding[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [hasRun, setHasRun] = useState(false);

  const shifts = useMemo<Shift[]>(() => {
    if (!canView) return [];
    try {
      return listShiftsForActor(actor);
    } catch {
      return [];
    }
  }, [canView, actor, refreshKey]);

  const handleEvaluate = () => {
    const errs: string[] = [];
    if (!personId.trim()) errs.push("Person id is required.");
    if (!candidateShiftId.trim()) errs.push("Select a candidate shift.");
    if (errs.length) {
      setErrors(errs);
      return;
    }
    setErrors([]);
    const shift = shifts.find((s) => s.id === candidateShiftId);
    if (!shift) {
      setErrors(["Shift not found in your clinic scope."]);
      return;
    }
    try {
      const result = evaluateConflicts({
        personId: personId.trim(),
        clinicId: shift.clinicId,
        candidateShift: shift,
      });
      setFindings(result);
      setHasRun(true);
      pushToast(
        result.length === 0
          ? "No conflicts detected."
          : `${result.length} finding(s) detected.`,
        result.length === 0 ? "success" : "warn"
      );
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Evaluation failed", "danger");
    }
  };

  if (!canView) {
    return (
      <SectionFrame sectionId="conflicts-warnings" title="Conflicts & Warnings">
        <RestrictedState permission="roster.view" />
      </SectionFrame>
    );
  }

  return (
    <SectionFrame sectionId="conflicts-warnings" title="Conflicts & Warnings">
      <OfflineState />
      <div>
        <p className="m-0 mt-1 text-sm text-[var(--muted)]">
          Evaluate conflicts and fatigue rules for a candidate shift and person against
          the current published policy.
        </p>
      </div>

      <Panel>
        <PanelTitle>Evaluate</PanelTitle>
        <PanelSub>
          Pick a candidate shift and person. Uses the active organisation conflict
          policy.
        </PanelSub>
        <ValidationErrorState errors={errors} onDismiss={() => setErrors([])} />
        <div className="mt-3 grid min-w-0 gap-2 md:grid-cols-3">
          <select
            className="min-w-0 w-full max-w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
            value={candidateShiftId}
            onChange={(e) => setCandidateShiftId(e.target.value)}
            aria-label="Candidate shift"
          >
            <option value="">Select shift…</option>
            {shifts.map((s) => (
              <option key={s.id} value={s.id}>
                {s.roleLabel ?? "shift"} · {s.localStart} → {s.localEnd}
              </option>
            ))}
          </select>
          <input
            className="min-w-0 w-full max-w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
            placeholder="Person id"
            value={personId}
            onChange={(e) => setPersonId(e.target.value)}
            aria-label="Person id"
          />
          <Button
            variant="teal"
            className="min-w-0 w-full max-w-full"
            onClick={handleEvaluate}
            data-testid="m05-conflicts-run"
          >
            Evaluate conflicts
          </Button>
        </div>
      </Panel>

      {hasRun && findings.length === 0 ? (
        <EmptyState
          title="No conflicts detected"
          description="This person + shift pairing passes all active policy rules."
        />
      ) : findings.length === 0 ? null : (
        <Panel pad={false}>
          <div className="border-b border-[var(--line)] px-5 py-3">
            <PanelTitle>Findings ({findings.length})</PanelTitle>
          </div>
          <Table>
            <THead>
              <Th>Rule</Th>
              <Th>Severity</Th>
              <Th>Description</Th>
              <Th>Remediation</Th>
              <Th>Offending shifts</Th>
            </THead>
            <tbody>
              {findings.map((f, idx) => (
                <tr key={`${f.ruleId}-${idx}`}>
                  <Td className="font-mono text-xs">
                    {f.ruleId} v{f.ruleVersion}
                  </Td>
                  <Td>
                    <Badge
                      tone={
                        f.severity === "block"
                          ? "danger"
                          : f.severity === "warn"
                            ? "warn"
                            : "info"
                      }
                    >
                      {f.severity}
                    </Badge>
                  </Td>
                  <Td className="text-xs">{f.description}</Td>
                  <Td className="text-xs">{f.remediation ?? "—"}</Td>
                  <Td className="font-mono text-xs">
                    {f.offendingShiftIds.join(", ")}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Panel>
      )}
    </SectionFrame>
  );
}
