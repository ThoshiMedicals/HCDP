"use client";

import { useId, useRef } from "react";
import { useFocusTrap } from "@/lib/a11y/use-focus-trap";
import { Button } from "./Button";

export function Modal({
  open,
  title,
  children,
  footer,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(open, panelRef, onClose);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[var(--aurora-overlay,rgba(15,23,42,0.45))] p-5"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-aurora-surface="raised"
        data-aurora-focus-trap="true"
        data-testid="shell-modal"
        tabIndex={-1}
        className="w-[min(920px,100%)] overflow-hidden rounded-[var(--aurora-radius-panel,20px)] bg-[var(--aurora-surface,var(--card))] text-[var(--aurora-text-primary,var(--ink))] shadow-[var(--aurora-elevation-panel,0_30px_80px_rgba(15,23,42,0.25))]"
      >
        <div className="flex items-center justify-between border-b border-[var(--aurora-border-subtle,var(--line))] px-5 py-[18px]">
          <h2 id={titleId} className="m-0 text-[19px] font-extrabold">
            {title}
          </h2>
          <Button
            variant="line"
            className="h-10 w-10 min-h-[var(--aurora-touch-target-min,44px)] min-w-[var(--aurora-touch-target-min,44px)] justify-center px-0 md:min-h-10 md:min-w-10"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ×
          </Button>
        </div>
        <div className="max-h-[72vh] overflow-auto p-5">{children}</div>
        {footer ? (
          <div className="flex justify-end gap-2 border-t border-[var(--aurora-border-subtle,var(--line))] bg-[var(--aurora-surface-muted,var(--soft))] px-5 py-3.5">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
