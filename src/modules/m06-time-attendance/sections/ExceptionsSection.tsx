"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { SectionFrame } from "../components/SectionFrame";
import { EmptyState, RestrictedState } from "../components/ux";
import { useAttendance } from "../context";
import { hasM06Permission } from "../permissions";
import {
  escalateException,
  listExceptionsForActor,
  resolveException,
} from "../services/exception-service";

export function ExceptionsSection() {
  const { actor, clinicId, bump, refreshKey } = useAttendance();
  const rows = useMemo(() => {
    try {
      return listExceptionsForActor(actor, clinicId);
    } catch {
      return [];
    }
  }, [actor, clinicId, refreshKey]);

  if (!hasM06Permission(actor, "attendance.exception.view") && !hasM06Permission(actor, "attendance.view.self")) {
    return (
      <SectionFrame sectionId="exceptions" title="Exceptions">
        <RestrictedState permission="attendance.exception.view" />
      </SectionFrame>
    );
  }

  return (
    <SectionFrame sectionId="exceptions" title="Exceptions">
      {rows.length === 0 ? (
        <EmptyState title="No exceptions" />
      ) : (
        <ul className="grid gap-2" data-testid="m06-exception-list">
          {rows.map((e) => (
            <li key={e.id} className="rounded border p-3 text-sm flex flex-wrap gap-2 justify-between">
              <span>
                {e.kind} · {e.state} · {e.message}
              </span>
              {hasM06Permission(actor, "attendance.exception.resolve") ? (
                <span className="flex gap-2">
                  <Button
                    small
                    data-testid={`m06-exception-escalate-${e.id}`}
                    onClick={() => {
                      escalateException({ actor, exceptionId: e.id, expectedVersion: e.version });
                      bump();
                    }}
                  >
                    Escalate
                  </Button>
                  <Button
                    small
                    variant="teal"
                    data-testid={`m06-exception-resolve-${e.id}`}
                    onClick={() => {
                      resolveException({
                        actor,
                        exceptionId: e.id,
                        note: "Resolved in UI",
                        expectedVersion: e.version,
                      });
                      bump();
                    }}
                  >
                    Resolve
                  </Button>
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </SectionFrame>
  );
}
