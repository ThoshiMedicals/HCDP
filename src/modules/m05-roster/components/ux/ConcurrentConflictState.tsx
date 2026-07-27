"use client";

import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";

export function ConcurrentConflictState({
  message = "This record was updated by someone else. Refresh to load the latest version, then reapply your change.",
  onRefresh,
  targetType,
  targetId,
}: {
  message?: string;
  onRefresh?: () => void;
  targetType?: string;
  targetId?: string;
}) {
  return (
    <div
      role="alert"
      data-ux-state="concurrent-conflict"
      data-testid="m05-ux-concurrent-conflict"
    >
      <Panel>
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="text-3xl select-none" aria-hidden="true">
            🔁
          </div>
          <div>
            <div className="font-semibold text-[var(--ink)]">
              Concurrent update detected
            </div>
            <p className="mt-1 text-sm text-[#64748b]">{message}</p>
            {targetType && targetId ? (
              <p className="mt-1 text-xs text-[#94a3b8]">
                {targetType} · {targetId}
              </p>
            ) : null}
          </div>
          {onRefresh ? (
            <Button variant="teal" small onClick={onRefresh}>
              Refresh
            </Button>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}
