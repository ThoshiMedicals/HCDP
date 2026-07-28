"use client";

import { Button } from "@/components/ui/Button";

export function ConcurrentConflictState({
  targetType,
  targetId,
  onRefresh,
}: {
  targetType: string;
  targetId: string;
  onRefresh?: () => void;
}) {
  return (
    <div
      data-ux-state="concurrent-conflict"
      data-testid="m06-ux-concurrent-conflict"
      role="alert"
      className="grid gap-2 p-4 text-sm"
    >
      <div>
        Concurrent change on {targetType} {targetId}. Refresh and retry.
      </div>
      {onRefresh ? (
        <Button small variant="line" onClick={onRefresh}>
          Refresh
        </Button>
      ) : null}
    </div>
  );
}
