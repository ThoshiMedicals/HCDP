"use client";

import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";

export function SystemErrorState({
  error,
  onRetry,
}: {
  error: string;
  onRetry?: () => void;
}) {
  return (
    <div data-ux-state="system-error" data-testid="m05-ux-system-error">
      <Panel>
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="text-3xl select-none" aria-hidden="true">
            ⚠️
          </div>
          <div>
            <div className="font-semibold text-[var(--ink)]">Something went wrong</div>
            <p className="mt-1 text-sm text-[var(--muted)]">{error}</p>
          </div>
          {onRetry ? (
            <Button variant="line" small onClick={onRetry}>
              Retry
            </Button>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}
