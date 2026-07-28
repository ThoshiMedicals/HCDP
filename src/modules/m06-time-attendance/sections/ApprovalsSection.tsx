"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { SectionFrame } from "../components/SectionFrame";
import { EmptyState, RestrictedState } from "../components/ux";
import { useAttendance } from "../context";
import { hasM06Permission } from "../permissions";
import { approveQueueItem, listPendingApprovals } from "../services/approval-service";
import { previewBulkApprove, submitBulkApprove } from "../services/bulk-operation-service";

export function ApprovalsSection() {
  const { actor, clinicId, bump, refreshKey, pushToast } = useAttendance();
  const rows = useMemo(() => {
    try {
      return listPendingApprovals(actor, clinicId);
    } catch {
      return [];
    }
  }, [actor, clinicId, refreshKey]);

  if (!hasM06Permission(actor, "attendance.approve")) {
    return (
      <SectionFrame sectionId="approvals" title="Approvals">
        <RestrictedState permission="attendance.approve" />
      </SectionFrame>
    );
  }

  return (
    <SectionFrame sectionId="approvals" title="Approvals">
      {hasM06Permission(actor, "attendance.bulk.approve") ? (
        <Button
          data-testid="m06-bulk-approve"
          small
          className="mb-3"
          onClick={() => {
            const ids = rows.map((r) => r.id);
            previewBulkApprove({ actor, approvalIds: ids });
            const result = submitBulkApprove({ actor, approvalIds: ids });
            pushToast(`Bulk approve: ${result.results.filter((r) => r.ok).length} ok`);
            bump();
          }}
        >
          Bulk approve pending
        </Button>
      ) : null}
      {rows.length === 0 ? (
        <EmptyState title="No pending approvals" />
      ) : (
        <ul className="grid gap-2" data-testid="m06-approval-list">
          {rows.map((a) => (
            <li key={a.id} className="rounded border p-3 text-sm flex justify-between gap-2">
              <span>
                {a.kind} · {a.targetId}
              </span>
              <Button
                small
                variant="teal"
                data-testid={`m06-approval-approve-${a.id}`}
                onClick={() => {
                  approveQueueItem({ actor, approvalId: a.id, expectedVersion: a.version });
                  bump();
                }}
              >
                Approve
              </Button>
            </li>
          ))}
        </ul>
      )}
    </SectionFrame>
  );
}
