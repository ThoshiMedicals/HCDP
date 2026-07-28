"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { SectionFrame } from "../components/SectionFrame";
import { EmptyState, RestrictedState } from "../components/ux";
import { useAttendance } from "../context";
import { hasM06Permission } from "../permissions";
import { listPoliciesForActor, publishPolicy } from "../services/policy-service";

export function SettingsSection() {
  const { actor, clinicId, bump, refreshKey, pushToast } = useAttendance();
  const rows = useMemo(() => {
    try {
      return listPoliciesForActor(actor, clinicId);
    } catch {
      return [];
    }
  }, [actor, clinicId, refreshKey]);

  if (!hasM06Permission(actor, "attendance.policy.manage")) {
    return (
      <SectionFrame sectionId="settings" title="Settings & Policies">
        <RestrictedState permission="attendance.policy.manage" />
      </SectionFrame>
    );
  }

  return (
    <SectionFrame sectionId="settings" title="Settings & Policies">
      <p className="text-sm text-[#64748b] m-0 mb-3">
        Prototype policies are not employment-law, award, payroll or clinical-safety certification.
      </p>
      <Button
        data-testid="m06-policy-publish"
        small
        variant="teal"
        className="mb-3"
        onClick={() => {
          const before = rows[0]?.version ?? 0;
          const published = publishPolicy({ actor, clinicId, patch: { lateInGraceMinutes: 5 } });
          pushToast(`Policy published v${published.version}`);
          bump();
          void before;
        }}
      >
        Publish policy
      </Button>
      {rows.length === 0 ? (
        <EmptyState title="No policies" />
      ) : (
        <ul data-testid="m06-policy-list" className="grid gap-2">
          {rows.map((p) => (
            <li
              key={p.id}
              className="rounded border p-3 text-sm"
              data-testid={`m06-policy-row-${p.id}`}
              data-m06-policy-version={String(p.version)}
            >
              v{p.version} · {p.state} · late grace {p.lateInGraceMinutes}m
            </li>
          ))}
        </ul>
      )}
      <p data-testid="m06-policy-latest-version" className="text-xs text-[#64748b] mt-2">
        Latest version: {rows[0]?.version ?? 0}
      </p>
    </SectionFrame>
  );
}
