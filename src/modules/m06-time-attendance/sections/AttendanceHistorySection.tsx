"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { SectionFrame } from "../components/SectionFrame";
import { EmptyState, FilteredEmptyState, RestrictedState } from "../components/ux";
import { useAttendance } from "../context";
import { hasM06Permission } from "../permissions";
import { listSessionsForActor } from "../services/session-service";

export function AttendanceHistorySection() {
  const { actor, clinicId, refreshKey } = useAttendance();
  const [filter, setFilter] = useState("");
  const rows = useMemo(() => listSessionsForActor(actor, clinicId), [actor, clinicId, refreshKey]);
  const filtered = rows.filter((s) => !filter || s.state.includes(filter) || s.personId.includes(filter));

  if (!hasM06Permission(actor, "attendance.view.self") && !hasM06Permission(actor, "attendance.view.team")) {
    return (
      <SectionFrame sectionId="history" title="Attendance History">
        <RestrictedState permission="attendance.view.self" />
      </SectionFrame>
    );
  }

  return (
    <SectionFrame sectionId="history" title="Attendance History">
      <label className="grid gap-1 text-sm mb-3 max-w-sm">
        Filter
        <input
          data-testid="m06-history-filter"
          className="rounded border px-2 py-1"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </label>
      {rows.length === 0 ? (
        <EmptyState title="No attendance history" />
      ) : filtered.length === 0 ? (
        <FilteredEmptyState />
      ) : (
        <ul data-testid="m06-history-list" className="grid gap-2">
          {filtered.map((s) => (
            <li key={s.id} className="rounded border p-3 text-sm">
              {s.personId} · {s.state} · {s.openedAt.localCivil}
              {s.closedAt ? ` → ${s.closedAt.localCivil}` : ""}
            </li>
          ))}
        </ul>
      )}
      <Button small variant="line" className="mt-2" data-testid="m06-history-clear-filter" onClick={() => setFilter("")}>
        Clear filter
      </Button>
    </SectionFrame>
  );
}
