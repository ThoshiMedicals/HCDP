"use client";

export function OfflineState({
  message = "You appear offline. Clock events will queue for synchronization.",
}: {
  message?: string;
}) {
  return (
    <div data-ux-state="offline" data-testid="m06-ux-offline" role="status" className="p-4 text-sm">
      {message}
    </div>
  );
}
