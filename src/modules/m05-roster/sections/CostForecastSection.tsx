"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Panel, PanelSub, PanelTitle } from "@/components/ui/Panel";
import { Table, THead, Th, Td } from "@/components/ui/Table";
import { useRoster } from "../context";
import { hasM05Permission } from "../permissions";
import {
  buildCostForecast,
  listCostForecastsForActor,
  maskForecastForActor,
} from "../services/cost-forecast-service";
import { listPeriodsForActor } from "../services/period-service";
import type { CostForecast } from "../types/domain";
import {
  EmptyState,
  OfflineState,
  RestrictedState,
  ValidationErrorState,
} from "../components/ux";

export function CostForecastSection() {
  const { actor, bump, pushToast, refreshKey } = useRoster();
  void refreshKey;

  const canView = hasM05Permission(actor, "roster.view");
  const canReport = hasM05Permission(actor, "roster.report");
  const canSeeCosts = hasM05Permission(actor, "roster.cost.view");

  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const periods = useMemo(() => (canView ? listPeriodsForActor(actor) : []), [
    actor,
    canView,
    refreshKey,
  ]);

  const forecasts = useMemo<CostForecast[]>(() => {
    if (!canReport) return [];
    try {
      return listCostForecastsForActor(actor);
    } catch {
      return [];
    }
  }, [actor, canReport, refreshKey]);

  const handleBuild = () => {
    if (!selectedPeriodId) {
      setErrors(["Select a period."]);
      return;
    }
    setErrors([]);
    try {
      const forecast = buildCostForecast(actor, {
        rosterPeriodId: selectedPeriodId,
        ratesByRole: {
          "Clinical Nurse": 55,
          Reception: 32,
          "Overnight Cover": 48,
        },
        allowancesPerShift: 12,
        onCostsPercent: 18,
      });
      bump();
      const masked = maskForecastForActor(actor, forecast);
      pushToast(
        `Forecast built · grand total ${masked.currency} ${masked.grandTotal.toFixed(2)}`,
        "success"
      );
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Build failed", "danger");
    }
  };

  if (!canView) {
    return (
      <div className="grid gap-4">
        <div>
          <h2 className="m-0 text-xl font-extrabold text-[var(--ink)]">Cost Forecast</h2>
        </div>
        <RestrictedState permission="roster.view" />
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <OfflineState />
      <div>
        <h2 className="m-0 text-xl font-extrabold text-[var(--ink)]">Cost Forecast</h2>
        <p className="m-0 mt-1 text-sm text-[#526479]">
          Planning-only forecasts. Rate and cost figures are masked without{" "}
          <code>roster.cost.view</code>.
        </p>
      </div>

      {!canSeeCosts ? (
        <Panel>
          <PanelTitle>Cost data masked</PanelTitle>
          <PanelSub>
            You can view forecast structure and warnings. Rates, subtotals and totals
            require <code>roster.cost.view</code>.
          </PanelSub>
        </Panel>
      ) : null}

      {canReport ? (
        <Panel>
          <PanelTitle>Build forecast</PanelTitle>
          <PanelSub>Uses seed rates for demo (Clinical Nurse, Reception, Overnight Cover).</PanelSub>
          <ValidationErrorState errors={errors} onDismiss={() => setErrors([])} />
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            <select
              className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
              value={selectedPeriodId ?? ""}
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
            <Button variant="teal" onClick={handleBuild}>
              Build cost forecast
            </Button>
          </div>
        </Panel>
      ) : null}

      {forecasts.length === 0 ? (
        <EmptyState
          title="No cost forecasts"
          description={canReport ? "Build one above." : "You do not have roster.report permission."}
        />
      ) : (
        <div className="grid gap-3">
          {forecasts.map((f) => (
            <Panel key={f.id} pad={false}>
              <div className="border-b border-[var(--line)] px-5 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <PanelTitle>Forecast — period {f.rosterPeriodId}</PanelTitle>
                    <PanelSub>
                      As of {f.asOf} · currency {f.currency} · planning-only
                    </PanelSub>
                  </div>
                  <Badge tone="warn">planning only</Badge>
                </div>
              </div>
              <div className="grid gap-3 p-3 md:grid-cols-4">
                <Metric label="Ordinary" value={canSeeCosts ? f.ordinaryTotal.toFixed(2) : "—"} />
                <Metric label="Overtime" value={canSeeCosts ? f.overtimeTotal.toFixed(2) : "—"} />
                <Metric label="Allowances" value={canSeeCosts ? f.allowancesTotal.toFixed(2) : "—"} />
                <Metric label="Grand total" value={canSeeCosts ? f.grandTotal.toFixed(2) : "—"} />
              </div>
              {f.warnings.length > 0 ? (
                <div className="border-t border-[var(--line)] px-5 py-3">
                  <div className="text-xs font-bold uppercase text-[#92400e]">Warnings</div>
                  <ul className="mt-1 list-disc pl-4 text-xs text-[#78350f]">
                    {f.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <Table>
                <THead>
                  <Th>Role</Th>
                  <Th>Person</Th>
                  <Th>Ordinary h</Th>
                  <Th>Overtime h</Th>
                  <Th>Rate/hr</Th>
                  <Th>Subtotal</Th>
                </THead>
                <tbody>
                  {f.lineItems.map((li, i) => (
                    <tr key={i}>
                      <Td>{li.roleLabel ?? "—"}</Td>
                      <Td className="font-mono text-xs">{li.personId ?? "—"}</Td>
                      <Td>{li.hoursOrdinary.toFixed(2)}</Td>
                      <Td>{li.hoursOvertime.toFixed(2)}</Td>
                      <Td>{canSeeCosts && li.ratePerHour != null ? li.ratePerHour.toFixed(2) : "—"}</Td>
                      <Td>
                        {canSeeCosts && li.subtotal != null ? li.subtotal.toFixed(2) : "—"}
                        {li.missingRate ? (
                          <span className="ml-1">
                            <Badge tone="warn">missing rate</Badge>
                          </span>
                        ) : null}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-white p-3">
      <div className="text-[11px] font-bold uppercase text-[#64748b]">{label}</div>
      <div className="mt-1 text-lg font-extrabold text-[var(--ink)]">{value}</div>
    </div>
  );
}
