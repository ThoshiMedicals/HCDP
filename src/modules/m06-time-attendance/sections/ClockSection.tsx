"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { SectionFrame } from "../components/SectionFrame";
import {
  ConcurrentConflictState,
  OfflineState,
  RestrictedState,
  ValidationErrorState,
} from "../components/ux";
import { useAttendance } from "../context";
import { hasM06Permission } from "../permissions";
import { clockIn, clockOut } from "../services/clock-service";
import { findOpenSessionForPerson } from "../repository/local-store";
import { ConcurrentConflictError } from "../services/errors";

export function ClockSection() {
  const { actor, clinicId, bump, pushToast, refreshKey } = useAttendance();
  const [localCivil, setLocalCivil] = useState("2026-07-28T09:00");
  const [errors, setErrors] = useState<string[]>([]);
  const [conflict, setConflict] = useState<{ type: string; id: string } | null>(null);
  const open = useMemo(
    () => findOpenSessionForPerson(actor.personId ?? actor.userId),
    [actor, refreshKey]
  );
  const offline =
    typeof navigator !== "undefined" && navigator.onLine === false
      ? true
      : typeof window !== "undefined" && localStorage.getItem("pulse.m06.evidence.forceOffline") === "1";

  if (!hasM06Permission(actor, "attendance.clock.self") && !hasM06Permission(actor, "attendance.manager.enter")) {
    return (
      <SectionFrame sectionId="clock" title="Clock In/Out">
        <RestrictedState permission="attendance.clock.self" />
      </SectionFrame>
    );
  }

  if (offline) {
    return (
      <SectionFrame sectionId="clock" title="Clock In/Out">
        <OfflineState />
      </SectionFrame>
    );
  }

  if (conflict) {
    return (
      <SectionFrame sectionId="clock" title="Clock In/Out">
        <ConcurrentConflictState
          targetType={conflict.type}
          targetId={conflict.id}
          onRefresh={() => {
            setConflict(null);
            bump();
          }}
        />
      </SectionFrame>
    );
  }

  return (
    <SectionFrame sectionId="clock" title="Clock In/Out">
      <div className="grid gap-3 max-w-md">
        <label className="grid gap-1 text-sm">
          Local civil time
          <input
            data-testid="m06-clock-local"
            className="rounded border px-2 py-1"
            value={localCivil}
            onChange={(e) => setLocalCivil(e.target.value)}
          />
        </label>
        {errors.length ? <ValidationErrorState errors={errors} /> : null}
        <div className="flex flex-wrap gap-2">
          <Button
            data-testid="m06-clock-in"
            variant="teal"
            small
            disabled={Boolean(open)}
            title={open ? "Already clocked in — clock out first" : undefined}
            onClick={() => {
              setErrors([]);
              try {
                const { session } = clockIn({
                  actor,
                  clinicId,
                  localCivil,
                  clientEventId: `ui-in-${Date.now()}`,
                });
                pushToast(session.rostered ? "Clocked in (rostered)" : "Clocked in (unrostered)", "default");
                bump();
              } catch (e) {
                setErrors([e instanceof Error ? e.message : String(e)]);
              }
            }}
          >
            Clock in
          </Button>
          <Button
            data-testid="m06-clock-out"
            variant="line"
            small
            disabled={!open}
            title={!open ? "No open session" : undefined}
            onClick={() => {
              setErrors([]);
              try {
                const current = findOpenSessionForPerson(actor.personId ?? actor.userId);
                if (!current) {
                  setErrors(["No open session"]);
                  return;
                }
                clockOut({
                  actor,
                  sessionId: current.id,
                  localCivil,
                  expectedVersion: current.version,
                  clientEventId: `ui-out-${Date.now()}`,
                });
                pushToast("Clocked out", "default");
                bump();
              } catch (e) {
                if (e instanceof ConcurrentConflictError) {
                  setConflict({ type: e.targetType, id: e.targetId });
                  return;
                }
                setErrors([e instanceof Error ? e.message : String(e)]);
              }
            }}
          >
            Clock out
          </Button>
        </div>
        {open ? (
          <p data-testid="m06-clock-open-session" className="text-sm rounded border p-2">
            Open session {open.id} · rostered={String(open.rostered)} · {open.state} · {open.openedAt.localCivil}
          </p>
        ) : (
          <p data-testid="m06-clock-no-session" className="text-sm text-[var(--muted)]">
            No open attendance session for this person.
          </p>
        )}
      </div>
    </SectionFrame>
  );
}
