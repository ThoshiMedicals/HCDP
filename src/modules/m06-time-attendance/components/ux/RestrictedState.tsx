"use client";

export function RestrictedState({ permission }: { permission: string }) {
  return (
    <div data-ux-state="restricted" data-testid="m06-ux-restricted" role="alert" className="p-4 text-sm">
      You do not have permission <code>{permission}</code> for this attendance action.
    </div>
  );
}
