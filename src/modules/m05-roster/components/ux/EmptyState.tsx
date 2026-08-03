"use client";

import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div data-ux-state="empty" data-testid="m05-ux-empty">
      <Panel>
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="text-3xl select-none" aria-hidden="true">
            📭
          </div>
          <div>
            <div className="font-semibold text-[var(--ink)]">{title}</div>
            {description ? (
              <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>
            ) : null}
          </div>
          {action ? (
            <Button variant="teal" small onClick={action.onClick}>
              {action.label}
            </Button>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}
