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
          disabled={!open}
          title={!open ? "Requires an open attendance session" : undefined}
          onClick={() => {
            setErrors([]);
            try {
              if (!open) throw new Error("No open session — clock in first");
              const localCivil = open.openedAt.localCivil.slice(0, 10) + "T12:00";
              startBreak({
                actor,
                sessionId: open.id,
                localCivil,
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
          disabled={!open || !breaks.some((b) => b.state === "in_progress")}
          title={!open ? "Requires an open attendance session" : !breaks.some((b) => b.state === "in_progress") ? "No in-progress break" : undefined}
          onClick={() => {
            setErrors([]);
            try {
              const brk = breaks.find((b) => b.state === "in_progress");
              if (!brk) throw new Error("No in-progress break");
              const localCivil = (brk.startedAt?.localCivil ?? open!.openedAt.localCivil).slice(0, 10) + "T12:30";
              endBreak({
                actor,
                breakId: brk.id,
                localCivil,
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
      {!open ? (
        <p className="text-sm text-[#64748b] mb-3" data-testid="m06-break-disabled-reason">
          Break controls are disabled until you have an open attendance session.
        </p>
      ) : null}
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
