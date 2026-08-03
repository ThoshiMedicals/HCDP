"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Panel, PanelSub, PanelTitle } from "@/components/ui/Panel";
import { useRoster } from "../context";
import { hasM05Permission } from "../permissions";
import {
  buildScopedReport,
  exportShiftAssignmentsCsv,
} from "../services/reporting-service";
import { RestrictedState, OfflineState } from "../components/ux";
import { SectionFrame } from "../components/SectionFrame";

export function ReportsSection() {
  const { actor, pushToast, refreshKey } = useRoster();
  void refreshKey;

  const canView = hasM05Permission(actor, "roster.view");
  const canReport = hasM05Permission(actor, "roster.report");
  const canExport = hasM05Permission(actor, "roster.export");
  const canSeeCosts = hasM05Permission(actor, "roster.cost.view");

  const [clinicIdsInput, setClinicIdsInput] = useState("");
  const [csvPreview, setCsvPreview] = useState<string | null>(null);

  const summary = useMemo(() => {
    if (!canReport) return null;
    try {
      return buildScopedReport(actor);
    } catch {
      return null;
    }
  }, [actor, canReport, refreshKey]);

  const handleExport = () => {
    const scope = clinicIdsInput.trim()
      ? {
          clinicIds: clinicIdsInput
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        }
      : {};
    try {
      const csv = exportShiftAssignmentsCsv(actor, {
        scope,
        includeCosts: canSeeCosts,
      });
      setCsvPreview(csv);
      pushToast(`Exported ${csv.split("\n").length - 1} row(s).`, "success");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Export denied", "danger");
    }
  };

  if (!canView) {
    return (
      <SectionFrame sectionId="reports" title="Reports">
        <RestrictedState permission="roster.view" />
      </SectionFrame>
    );
  }

  return (
    <SectionFrame sectionId="reports" title="Reports">
      <OfflineState />
      <div>
        <p className="m-0 mt-1 text-sm text-[var(--muted)]">
          Scoped roster reports. Export requires <code>roster.export</code>. Cost
          columns require <code>roster.cost.view</code>.
        </p>
      </div>

      {summary ? (
        <div className="grid gap-3 md:grid-cols-4">
          <StatPanel label="Periods" value={summary.periods.length} />
          <StatPanel label="Shifts" value={summary.shifts.length} />
          <StatPanel label="Assignments" value={summary.assignments.length} />
          <StatPanel label="Publications" value={summary.publications.length} />
        </div>
      ) : (
        <Panel>
          <PanelTitle>Scoped report</PanelTitle>
          <PanelSub>Requires roster.report to build the scoped summary.</PanelSub>
        </Panel>
      )}

      <Panel>
        <PanelTitle>Scoped CSV export</PanelTitle>
        <PanelSub>
          Optionally limit by clinic ids (comma separated). Rows outside your clinic
          scope are always excluded.
        </PanelSub>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <input
            className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
            placeholder="Clinic ids (optional)"
            value={clinicIdsInput}
            onChange={(e) => setClinicIdsInput(e.target.value)}
            aria-label="Clinic ids"
          />
          {canExport ? (
            <Button variant="teal" onClick={handleExport} data-testid="m05-report-export">
              Export CSV
            </Button>
          ) : (
            <div className="text-sm text-[var(--muted)]">
              You do not have <code>roster.export</code>.
            </div>
          )}
        </div>
      </Panel>

      {csvPreview ? (
        <Panel>
          <PanelTitle>CSV preview</PanelTitle>
          <pre className="mt-2 max-h-64 overflow-auto rounded-lg border border-[var(--line)] bg-[#0f172a] p-3 text-[length:var(--type-control)] leading-relaxed text-[#e2e8f0]">
            {csvPreview}
          </pre>
        </Panel>
      ) : null}
    </SectionFrame>
  );
}

function StatPanel({ label, value }: { label: string; value: number }) {
  return (
    <Panel>
      <div className="text-[length:var(--type-control)] font-bold uppercase text-[var(--muted)]">{label}</div>
      <div className="mt-1 text-2xl font-extrabold text-[var(--ink)]">{value}</div>
    </Panel>
  );
}
