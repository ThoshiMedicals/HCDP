"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { SectionFrame } from "../components/SectionFrame";
import { RestrictedState } from "../components/ux";
import { useAttendance } from "../context";
import { hasM06Permission } from "../permissions";
import { reconcileRosterAttendance, type ReconcileRow } from "../services/reconcile-service";
import { buildAttendanceReport, exportAttendance } from "../services/reporting-service";

export function ReportsSection() {
  const { actor, clinicId, pushToast } = useAttendance();
  const [report, setReport] = useState<ReturnType<typeof buildAttendanceReport> | null>(null);
  const [reconcileRows, setReconcileRows] = useState<ReconcileRow[] | null>(null);
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
          onClick={() => {
            setReconcileRows(null);
            setReport(buildAttendanceReport({ actor, clinicId }));
          }}
        >
          Build report
        </Button>
        <Button
          data-testid="m06-report-reconcile"
          small
          onClick={() => {
            const r = reconcileRosterAttendance({ actor, clinicId });
            setReconcileRows(r.rows);
            setReport(buildAttendanceReport({ actor, clinicId }));
            pushToast(`Reconcile rows: ${r.rows.length}`);
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
        <p className="text-sm text-[var(--muted)]">Run a report to see operational totals.</p>
      )}
      {reconcileRows ? (
        <ul data-testid="m06-reconcile-output" className="grid gap-1 mt-3 text-sm">
          {reconcileRows.map((row, i) => (
            <li
              key={`${row.assignmentId}-${row.personId}-${i}`}
              data-testid={`m06-reconcile-row-${row.variance}`}
              data-m06-reconcile-variance={row.variance}
              data-m06-reconcile-shift={row.shiftId}
              data-m06-reconcile-person={row.personId}
            >
              {row.variance} · shift {row.shiftId} · person {row.personId}
            </li>
          ))}
        </ul>
      ) : null}
      {exportInfo ? <p data-testid="m06-export-meta" className="text-sm">{exportInfo}</p> : null}
    </SectionFrame>
  );
}
