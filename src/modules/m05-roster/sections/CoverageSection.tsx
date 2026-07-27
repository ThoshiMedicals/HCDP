"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Panel, PanelSub, PanelTitle } from "@/components/ui/Panel";
import { Table, THead, Th, Td } from "@/components/ui/Table";
import { useRoster } from "../context";
import { hasM05Permission } from "../permissions";
import { listPeriodsForActor } from "../services/period-service";
import { escalateCoverageGap, evaluateCoverage } from "../services/coverage-service";
import type { CoverageEvaluation } from "../services/coverage-service";
import type { RosterPeriod } from "../types/domain";
import * as store from "../repository/local-store";
import {
  EmptyState,
  OfflineState,
  RestrictedState,
  SystemErrorState,
  ValidationErrorState,
} from "../components/ux";
import { SectionFrame } from "../components/SectionFrame";

export function CoverageSection() {
  const { actor, bump, pushToast, refreshKey } = useRoster();
  void refreshKey;
  const canView = hasM05Permission(actor, "roster.view");
  const canManageOpen = hasM05Permission(actor, "roster.open_shift.manage");

  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<CoverageEvaluation | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [escalateReason, setEscalateReason] = useState("");
  const [escalateOpenShiftId, setEscalateOpenShiftId] = useState<string | null>(null);
  const [systemError, setSystemError] = useState<string | null>(null);

  // Evidence-hardened read: `listPeriodsForActor` also drives the
  // `pulse.m05.evidence.forceSystemError` flag (see period-service). We must
  // catch here so the section renders `SystemErrorState` on genuine flow
  // instead of throwing during render.
  const { periods, readError } = useMemo<{
    periods: RosterPeriod[];
    readError: string | null;
  }>(() => {
    if (!canView) return { periods: [], readError: null };
    try {
      return { periods: listPeriodsForActor(actor), readError: null };
    } catch (e) {
      return {
        periods: [],
        readError: e instanceof Error ? e.message : "Unexpected error",
      };
    }
  }, [actor, canView, refreshKey]);

  const effectiveSystemError = systemError ?? readError;

  const activePeriodId = selectedPeriodId ?? periods[0]?.id ?? null;

  const openShifts = useMemo(() => {
    if (!activePeriodId) return [];
    return store.listOpenShifts(activePeriodId);
  }, [activePeriodId, refreshKey]);

  const requirements = useMemo(() => {
    if (!activePeriodId) return [];
    return store.listCoverageRequirements(activePeriodId);
  }, [activePeriodId, refreshKey]);

  const handleRun = () => {
    if (!activePeriodId) {
      setErrors(["Select a period first."]);
      return;
    }
    setErrors([]);
    try {
      const result = evaluateCoverage({ rosterPeriodId: activePeriodId });
      setEvaluation(result);
      setSystemError(null);
      pushToast(
        result.fullyCovered
          ? "Coverage evaluation complete — no gaps."
          : `Coverage evaluation complete — ${result.gaps.length} gap(s).`,
        result.fullyCovered ? "success" : "warn"
      );
    } catch (e) {
      setSystemError(e instanceof Error ? e.message : "Coverage evaluation failed");
      pushToast(e instanceof Error ? e.message : "Coverage evaluation failed", "danger");
    }
  };

  const handleEscalate = (openShiftId: string) => {
    if (!escalateReason.trim()) {
      setErrors(["Escalation reason required."]);
      setEscalateOpenShiftId(openShiftId);
      return;
    }
    setErrors([]);
    try {
      escalateCoverageGap(actor, { openShiftId, reason: escalateReason.trim() });
      setEscalateReason("");
      setEscalateOpenShiftId(null);
      bump();
      pushToast("Coverage gap escalated.", "success");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Escalation failed", "danger");
    }
  };

  if (!canView) {
    return (
      <SectionFrame sectionId="coverage" title="Coverage">
        <RestrictedState permission="roster.view" />
      </SectionFrame>
    );
  }

  if (effectiveSystemError) {
    return (
      <SectionFrame sectionId="coverage" title="Coverage">
        <SystemErrorState
          error={effectiveSystemError}
          onRetry={() => {
            setSystemError(null);
            bump();
          }}
        />
      </SectionFrame>
    );
  }

  return (
    <SectionFrame sectionId="coverage" title="Coverage">
      <OfflineState />
      <div>
        <p className="m-0 mt-1 text-sm text-[#526479]">
          Compare coverage requirements against assigned shifts and escalate hard gaps.
        </p>
      </div>

      <Panel>
        <PanelTitle>Run coverage evaluation</PanelTitle>
        <PanelSub>Select a period, then run coverage calculation.</PanelSub>
        <ValidationErrorState errors={errors} onDismiss={() => setErrors([])} />
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <select
            className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
            value={activePeriodId ?? ""}
            onChange={(e) => setSelectedPeriodId(e.target.value || null)}
            aria-label="Period"
          >
            <option value="">Select period…</option>
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label} ({p.startsOn}..{p.endsOn})
              </option>
            ))}
          </select>
          <Button variant="teal" onClick={handleRun} data-testid="m05-coverage-run">
            Evaluate coverage
          </Button>
        </div>
      </Panel>

      {requirements.length === 0 ? (
        <EmptyState
          title="No coverage requirements defined"
          description="Add requirements via services or Settings to see gap analysis."
        />
      ) : (
        <Panel pad={false}>
          <div className="border-b border-[var(--line)] px-5 py-3">
            <PanelTitle>Requirements</PanelTitle>
          </div>
          <Table>
            <THead>
              <Th>Role</Th>
              <Th>Date</Th>
              <Th>Window</Th>
              <Th>Required</Th>
            </THead>
            <tbody>
              {requirements.map((r) => (
                <tr key={r.id}>
                  <Td className="font-semibold">{r.roleLabel}</Td>
                  <Td className="font-mono text-xs">{r.localDate}</Td>
                  <Td className="text-xs">
                    {r.localStartTime && r.localEndTime
                      ? `${r.localStartTime} → ${r.localEndTime}`
                      : "All day"}
                  </Td>
                  <Td>{r.requiredCount}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Panel>
      )}

      {evaluation ? (
        <Panel pad={false}>
          <div className="border-b border-[var(--line)] px-5 py-3">
            <PanelTitle>
              Gaps ({evaluation.gaps.length}) — {evaluation.fullyCovered ? "fully covered" : "gaps present"}
            </PanelTitle>
            <PanelSub>Evaluated at {evaluation.asOf}.</PanelSub>
          </div>
          {evaluation.gaps.length === 0 ? (
            <div className="p-4 text-sm text-[#64748b]">No coverage gaps detected.</div>
          ) : (
            <Table>
              <THead>
                <Th>Role</Th>
                <Th>Date</Th>
                <Th>Severity</Th>
                <Th>Filled / Required</Th>
                <Th>Reason</Th>
              </THead>
              <tbody>
                {evaluation.gaps.map((g) => (
                  <tr key={`${g.requirementId}-${g.localDate}`}>
                    <Td className="font-semibold">{g.roleLabel}</Td>
                    <Td className="font-mono text-xs">{g.localDate}</Td>
                    <Td>
                      <Badge tone={g.severity === "hard" ? "danger" : "warn"}>
                        {g.severity}
                      </Badge>
                    </Td>
                    <Td>
                      {g.filledCount} / {g.requiredCount}
                    </Td>
                    <Td className="text-xs">{g.reason}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Panel>
      ) : null}

      {canManageOpen && openShifts.length > 0 ? (
        <Panel pad={false}>
          <div className="border-b border-[var(--line)] px-5 py-3">
            <PanelTitle>Open shifts — escalate</PanelTitle>
            <PanelSub>Requires roster.open_shift.manage.</PanelSub>
          </div>
          <Table>
            <THead>
              <Th>Open shift</Th>
              <Th>Status</Th>
              <Th>Level</Th>
              <Th>Actions</Th>
            </THead>
            <tbody>
              {openShifts.map((o) => (
                <tr key={o.id}>
                  <Td className="font-mono text-xs">{o.id}</Td>
                  <Td>
                    <Badge tone={o.status === "escalated" ? "danger" : "default"}>
                      {o.status}
                    </Badge>
                  </Td>
                  <Td>{o.escalatedLevel ?? 0}</Td>
                  <Td>
                    {escalateOpenShiftId === o.id ? (
                      <div className="grid gap-2 md:grid-cols-2">
                        <input
                          className="rounded-lg border border-[var(--line)] px-2 py-1 text-xs"
                          placeholder="Reason"
                          value={escalateReason}
                          onChange={(e) => setEscalateReason(e.target.value)}
                          aria-label="Escalation reason"
                        />
                        <div className="flex gap-2">
                          <Button
                            variant="teal"
                            small
                            onClick={() => handleEscalate(o.id)}
                          >
                            Confirm
                          </Button>
                          <Button
                            variant="line"
                            small
                            onClick={() => {
                              setEscalateOpenShiftId(null);
                              setEscalateReason("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="line"
                        small
                        onClick={() => setEscalateOpenShiftId(o.id)}
                      >
                        Escalate
                      </Button>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Panel>
      ) : null}
    </SectionFrame>
  );
}
