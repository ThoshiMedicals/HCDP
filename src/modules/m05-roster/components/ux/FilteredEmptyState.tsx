"use client";

import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";

export function FilteredEmptyState({
  title = "No results match the current filter",
  description = "Try adjusting or clearing the filter.",
  onClear,
}: {
  title?: string;
  description?: string;
  onClear?: () => void;
}) {
  return (
    <div data-ux-state="filtered-empty" data-testid="m05-ux-filtered-empty">
      <Panel>
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="text-3xl select-none" aria-hidden="true">
            🔍
          </div>
          <div>
            <div className="font-semibold text-[var(--ink)]">{title}</div>
            <p className="mt-1 text-sm text-[#64748b]">{description}</p>
          </div>
          {onClear ? (
            <Button variant="line" small onClick={onClear}>
              Clear filter
            </Button>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}
