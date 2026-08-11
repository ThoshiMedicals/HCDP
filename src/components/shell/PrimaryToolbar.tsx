"use client";

import { cn } from "@/lib/cn";

/**
 * Shared Decision A primary toolbar primitive (P1-GAP-003).
 * Layout chrome only — actions remain caller-owned.
 */
export function PrimaryToolbar({
  leading,
  trailing,
  children,
  className,
  "aria-label": ariaLabel = "Primary toolbar",
}: {
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <div
      role="toolbar"
      data-shell-region="toolbar"
      data-testid="shell-primary-toolbar"
      aria-label={ariaLabel}
      className={cn(
        "flex w-full min-w-0 max-w-full flex-wrap items-center gap-2 border-b border-[var(--dp-border-subtle)] bg-[var(--dp-bg-surface)] px-3",
        className
      )}
      style={{ minHeight: "var(--toolbar-height)" }}
    >
      {leading ? <div className="flex min-w-0 flex-wrap items-center gap-2">{leading}</div> : null}
      {children ? <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">{children}</div> : null}
      {trailing ? (
        <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-2">{trailing}</div>
      ) : null}
    </div>
  );
}
