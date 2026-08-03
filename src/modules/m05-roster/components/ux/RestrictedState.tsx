"use client";

import { Panel } from "@/components/ui/Panel";

export function RestrictedState({
  permission,
  message,
}: {
  permission?: string;
  message?: string;
}) {
  return (
    <div data-ux-state="restricted" data-testid="m05-ux-restricted">
      <Panel>
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="text-3xl select-none" aria-hidden="true">
            🔒
          </div>
          <div>
            <div className="font-semibold text-[var(--ink)]">Access restricted</div>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {message ??
                (permission
                  ? `You need the "${permission}" permission to view this section.`
                  : "You do not have permission to view this section.")}
            </p>
          </div>
        </div>
      </Panel>
    </div>
  );
}
