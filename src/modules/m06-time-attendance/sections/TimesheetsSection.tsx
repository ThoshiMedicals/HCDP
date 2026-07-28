"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { SectionFrame } from "../components/SectionFrame";
import { EmptyState, RestrictedState } from "../components/ux";
import { useAttendance } from "../context";
import { hasM06Permission } from "../permissions";
import {
  approveTimesheet,
  generateTimesheet,
  listTimesheetsForActor,
  submitTimesheet,
} from "../services/timesheet-service";

export function TimesheetsSection() {
  const { actor, clinicId, bump, pushToast, refreshKey } = useAttendance();
  const rows = useMemo(() => listTimesheetsForActor(actor, clinicId), [actor, clinicId, refreshKey]);

  if (!hasM06Permission(actor, "attendance.timesheet.view")) {
    return (
      <SectionFrame sectionId="timesheets" title="Timesheets">
        <RestrictedState permission="attendance.timesheet.view" />
      </SectionFrame>
    );
  }

  return (
    <SectionFrame sectionId="timesheets" title="Timesheets">
      <div className="flex flex-wrap gap-2 mb-3">
        <Button
          data-testid="m06-timesheet-generate"
          small
          variant="teal"
          onClick={() => {
            generateTimesheet({
              actor,
              personId: actor.personId ?? actor.userId,
              clinicId,
              periodStart: "2026-07-20",
              periodEnd: "2026-07-26",
            });
            pushToast("Timesheet draft generated");
            bump();
          }}
        >
          Generate timesheet
        </Button>
      </div>
      {rows.length === 0 ? (
        <EmptyState title="No timesheets" description="Generate a draft for the current period." />
      ) : (
        <ul className="grid gap-2" data-testid="m06-timesheet-list">
          {rows.map((t) => (
            <li key={t.id} className="rounded border p-3 text-sm flex flex-wrap gap-2 items-center justify-between">
              <span>
                {t.periodStart}→{t.periodEnd} · {t.state} · {t.totalMinutes} min
              </span>
              <span className="flex gap-2">
                {t.state === "draft" || t.state === "reopened" ? (
                  <Button
                    small
                    data-testid={`m06-timesheet-submit-${t.id}`}
                    onClick={() => {
                      submitTimesheet({ actor, timesheetId: t.id, expectedVersion: t.version });
                      bump();
                    }}
                  >
                    Submit
                  </Button>
                ) : null}
                {t.state === "submitted" && hasM06Permission(actor, "attendance.approve") ? (
                  <Button
                    small
                    variant="teal"
                    data-testid={`m06-timesheet-approve-${t.id}`}
                    onClick={() => {
                      approveTimesheet({ actor, timesheetId: t.id, expectedVersion: t.version });
                      pushToast("Timesheet approved and published (WF-19A)");
                      bump();
                    }}
                  >
                    Approve & publish
                  </Button>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      )}
    </SectionFrame>
  );
}
