"use client";

import { Button } from "@/components/ui/Button";

export function SyncConflictState({
  detail,
  onResolve,
}: {
  detail: string;
  onResolve?: () => void;
}) {
  return (
    <div
      data-ux-state="sync-conflict"
      data-testid="m06-ux-sync-conflict"
      role="alert"
      className="grid gap-2 p-4 text-sm"
    >
      <div>Synchronization conflict: {detail}</div>
      {onResolve ? (
        <Button small variant="teal" onClick={onResolve}>
          Resolve conflict
        </Button>
      ) : null}
    </div>
  );
}
