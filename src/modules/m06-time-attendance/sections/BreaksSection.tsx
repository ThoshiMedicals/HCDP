"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { SectionFrame } from "../components/SectionFrame";
import { EmptyState, RestrictedState, ValidationErrorState } from "../components/ux";
import { useAttendance } from "../context";
import { hasM06Permission } from "../permissions";
import { endBreak, listBreaksForSession, startBreak } from "../services/break-service";
import { findOpenSessionForPerson } from "../repository/local-store";

export function BreaksSection() {
  const { actor, bump, pushToast } = useAttendance();
  const [errors, setErrors] = useState<string[]>([]);
  const open = findOpenSessionForPerson(actor.personId ?? actor.userId);
  const breaks = useMemo(() => (open ? listBreaksForSession(open.id) : []), [open, bump]);

  if (!hasM06Permission(actor, "attendance.break.self")) {
    return (
      <SectionFrame sectionId="breaks" title="Breaks">
        <RestrictedState permission="attendance.break.self" />
      </SectionFrame>
    );
  }

  return (
    <SectionFrame sectionId="breaks" title="Breaks">
      {errors.length ? <ValidationErrorState errors={errors} /> : null}
      <div className="flex gap-2 mb-3">
        <Button
          data-testid="m06-break-start"
          small
          variant="teal"
          onClick={() => {
            setErrors([]);
            try {
              if (!open) throw new Error("No open session");
              startBreak({
                actor,
                sessionId: open.id,
                localCivil: "2026-07-28T12:00",
                expectedSessionVersion: open.version,
                clientEventId: `brk-start-${Date.now()}`,
              });
              pushToast("Break started");
              bump();
            } catch (e) {
              setErrors([e instanceof Error ? e.message : String(e)]);
            }
          }}
        >
          Start break
        </Button>
        <Button
          data-testid="m06-break-end"
          small
          onClick={() => {
            setErrors([]);
            try {
              const brk = breaks.find((b) => b.state === "in_progress");
              if (!brk) throw new Error("No in-progress break");
              endBreak({
                actor,
                breakId: brk.id,
                localCivil: "2026-07-28T12:30",
                expectedVersion: brk.version,
                clientEventId: `brk-end-${Date.now()}`,
              });
              pushToast("Break ended");
              bump();
            } catch (e) {
              setErrors([e instanceof Error ? e.message : String(e)]);
            }
          }}
        >
          End break
        </Button>
      </div>
      {breaks.length === 0 ? (
        <EmptyState title="No breaks recorded" />
      ) : (
        <ul data-testid="m06-break-list" className="grid gap-2">
          {breaks.map((b) => (
            <li key={b.id} className="rounded border p-3 text-sm">
              {b.state} {b.startedAt?.localCivil ?? ""}
            </li>
          ))}
        </ul>
      )}
    </SectionFrame>
  );
}
