"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { SectionFrame } from "../components/SectionFrame";
import { EmptyState, RestrictedState, SystemErrorState } from "../components/ux";
import { useAttendance } from "../context";
import { hasM06Permission } from "../permissions";
import { listSessionsForActor } from "../services/session-service";
import { evidenceForceSystemError } from "../repository/local-store";

export function LiveAttendanceSection() {
  const { actor, refreshKey, bump, clinicId } = useAttendance();

  const loaded = useMemo(() => {
    try {
      if (typeof window !== "undefined" && localStorage.getItem("pulse.m06.evidence.forceSystemError") === "1") {
        evidenceForceSystemError(true);
      } else {
        evidenceForceSystemError(false);
      }
      return {
        ok: true as const,
        sessions: listSessionsForActor(actor, clinicId).filter(
          (s) => s.state === "open" || s.state === "on_break"
        ),
      };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : String(e) };
    }
  }, [actor, clinicId, refreshKey]);

  if (!hasM06Permission(actor, "attendance.view.team") && !hasM06Permission(actor, "attendance.view.self")) {
    return (
      <SectionFrame sectionId="live" title="Live Attendance">
        <RestrictedState permission="attendance.view.team" />
      </SectionFrame>
    );
  }

  if (!loaded.ok) {
    return (
      <SectionFrame sectionId="live" title="Live Attendance">
        <SystemErrorState error={loaded.error} />
      </SectionFrame>
    );
  }

  const sessions = loaded.sessions;

  return (
    <SectionFrame sectionId="live" title="Live Attendance">
      {sessions.length === 0 ? (
        <EmptyState
          title="No live sessions"
          description="Open clock-ins will appear here."
          action={{ label: "Refresh board", onClick: bump }}
        />
      ) : (
        <div className="grid gap-2" data-testid="m06-live-board">
          {sessions.map((s) => (
            <div key={s.id} className="rounded border border-[var(--v34-card-border)] p-3 text-sm">
              <strong>{s.personId}</strong> · {s.state} · {s.openedAt.localCivil} ({s.openedAt.timeZoneId})
            </div>
          ))}
          <Button small variant="line" data-testid="m06-live-refresh" onClick={bump}>
            Refresh live board
          </Button>
        </div>
      )}
      {sessions.length === 0 ? (
        <Button small variant="line" className="mt-2" data-testid="m06-live-refresh" onClick={bump}>
          Refresh live board
        </Button>
      ) : null}
    </SectionFrame>
  );
}
