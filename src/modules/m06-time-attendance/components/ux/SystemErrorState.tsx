"use client";

export function SystemErrorState({ error }: { error: string }) {
  return (
    <div data-ux-state="system-error" data-testid="m06-ux-system-error" role="alert" className="p-4 text-sm">
      {error}
    </div>
  );
}
