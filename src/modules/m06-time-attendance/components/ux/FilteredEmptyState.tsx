"use client";

export function FilteredEmptyState({
  message = "No rows match the current filters.",
}: {
  message?: string;
}) {
  return (
    <div data-ux-state="filtered-empty" data-testid="m06-ux-filtered-empty" className="p-4 text-sm">
      {message}
    </div>
  );
}
