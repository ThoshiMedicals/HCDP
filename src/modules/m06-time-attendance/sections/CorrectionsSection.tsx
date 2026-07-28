"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { SectionFrame } from "../components/SectionFrame";
import { EmptyState, RestrictedState, ValidationErrorState } from "../components/ux";
import { useAttendance } from "../context";
import { hasM06Permission } from "../permissions";
import { listCorrectionsForActor, requestCorrection } from "../services/correction-service";
import { listSessionsForActor } from "../services/session-service";

export function CorrectionsSection() {
  const { actor, clinicId, bump, refreshKey, pushToast } = useAttendance();
  const [errors, setErrors] = useState<string[]>([]);
  const rows = useMemo(() => listCorrectionsForActor(actor, clinicId), [actor, clinicId, refreshKey]);

  if (!hasM06Permission(actor, "attendance.correction.request") && !hasM06Permission(actor, "attendance.correction.apply")) {
    return (
      <SectionFrame sectionId="corrections" title="Corrections">
        <RestrictedState permission="attendance.correction.request" />
      </SectionFrame>
    );
  }

  return (
    <SectionFrame sectionId="corrections" title="Corrections">
      {errors.length ? <ValidationErrorState errors={errors} /> : null}
      <Button
        data-testid="m06-correction-request"
        small
        variant="teal"
        className="mb-3"
        onClick={() => {
          setErrors([]);
          try {
            const session =
              listSessionsForActor(actor, clinicId).find((s) => s.state === "closed" || s.state === "corrected") ??
              listSessionsForActor(actor, clinicId)[0];
            if (!session) {
              setErrors(["No session available to correct — clock in/out first"]);
              return;
            }
            const corr = requestCorrection({ actor, sessionId: session.id, reason: "Forgot to clock out" });
            pushToast(`Correction requested: ${corr.id}`);
            bump();
          } catch (e) {
            setErrors([e instanceof Error ? e.message : String(e)]);
          }
        }}
      >
        Request correction
      </Button>
      {rows.length === 0 ? (
        <EmptyState title="No correction requests" />
      ) : (
        <ul className="grid gap-2" data-testid="m06-correction-list">
          {rows.map((c) => (
            <li
              key={c.id}
              className="rounded border p-3 text-sm"
              data-testid={`m06-correction-row-${c.id}`}
              data-m06-correction-state={c.state}
            >
              {c.state}: {c.reason}
            </li>
          ))}
        </ul>
      )}
      <p data-testid="m06-correction-count" className="text-xs text-[#64748b] mt-2">
        {rows.length} correction request(s)
      </p>
    </SectionFrame>
  );
}
