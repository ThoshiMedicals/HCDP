"use client";

import { useEffect, useId, useRef } from "react";
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

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const t = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>("button, [href], input, select, textarea")?.focus();
    }, 0);
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(15,23,42,0.45)] p-5"
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
        className="w-[min(920px,100%)] overflow-hidden rounded-[20px] bg-[var(--card)] text-[var(--ink)] shadow-[0_30px_80px_rgba(15,23,42,0.25)]"
      >
        <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-[18px]">
          <h2 id={titleId} className="m-0 text-[19px] font-extrabold">
            {title}
          </h2>
          <Button
            variant="line"
            className="h-10 w-10 min-h-0 justify-center px-0"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ×
          </Button>
        </div>
        <div className="max-h-[72vh] overflow-auto p-5">{children}</div>
        {footer ? (
          <div className="flex justify-end gap-2 border-t border-[var(--line)] bg-[var(--soft)] px-5 py-3.5">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
