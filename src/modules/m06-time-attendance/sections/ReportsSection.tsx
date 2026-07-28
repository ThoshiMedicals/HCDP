"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { SectionFrame } from "../components/SectionFrame";
import { RestrictedState } from "../components/ux";
import { useAttendance } from "../context";
import { hasM06Permission } from "../permissions";
import { reconcileRosterAttendance } from "../services/reconcile-service";
import { buildAttendanceReport, exportAttendance } from "../services/reporting-service";

export function ReportsSection() {
  const { actor, clinicId, pushToast } = useAttendance();
  const [report, setReport] = useState<ReturnType<typeof buildAttendanceReport> | null>(null);
  const [exportInfo, setExportInfo] = useState<string>("");

  if (!hasM06Permission(actor, "attendance.report")) {
    return (
      <SectionFrame sectionId="reports" title="Reports">
        <RestrictedState permission="attendance.report" />
      </SectionFrame>
    );
  }

  return (
    <SectionFrame sectionId="reports" title="Reports">
      <div className="flex flex-wrap gap-2 mb-3">
        <Button
          data-testid="m06-report-build"
          small
          variant="teal"
          onClick={() => setReport(buildAttendanceReport({ actor, clinicId }))}
        >
          Build report
        </Button>
        <Button
          data-testid="m06-report-reconcile"
          small
          onClick={() => {
            const r = reconcileRosterAttendance({ actor, clinicId });
            pushToast(`Reconcile rows: ${r.rows.length}`);
            setReport(buildAttendanceReport({ actor, clinicId }));
          }}
        >
          Roster vs attendance
        </Button>
        {hasM06Permission(actor, "attendance.export") ? (
          <Button
            data-testid="m06-report-export"
            small
            onClick={() => {
              const exp = exportAttendance({ actor, clinicId });
              setExportInfo(`${exp.rows.length} rows; maskedEvidence=${exp.maskedEvidence}`);
            }}
          >
            Export scoped
          </Button>
        ) : null}
      </div>
      {report ? (
        <pre data-testid="m06-report-output" className="text-xs overflow-auto rounded border p-3">
          {JSON.stringify(report, null, 2)}
        </pre>
      ) : (
        <p className="text-sm text-[#64748b]">Run a report to see operational totals.</p>
      )}
      {exportInfo ? <p data-testid="m06-export-meta" className="text-sm">{exportInfo}</p> : null}
    </SectionFrame>
  );
}
