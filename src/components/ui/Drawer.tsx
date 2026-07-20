"use client";

import { useEffect, useId, useRef } from "react";
import { Button } from "./Button";

export function Drawer({
  open,
  title,
  subtitle,
  children,
  footer,
  onClose,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);

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

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-[rgba(15,23,42,0.28)] transition ${open ? "block" : "hidden"}`}
        onClick={onClose}
        aria-hidden
      />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`fixed bottom-0 right-0 top-0 z-50 flex w-[min(760px,96vw)] flex-col bg-[var(--card)] text-[var(--ink)] shadow-[-20px_0_60px_rgba(15,23,42,0.2)] transition-transform duration-200 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!open}
      >
        <div className="flex h-[70px] items-center justify-between border-b border-[var(--line)] px-5">
          <div>
            <h2 id={titleId} className="m-0 text-[19px] font-extrabold">
              {title}
            </h2>
            {subtitle ? <p className="m-0 text-[13px] text-[var(--muted)]">{subtitle}</p> : null}
          </div>
          <Button
            variant="line"
            className="h-10 w-10 min-h-0 justify-center px-0"
            onClick={onClose}
            aria-label="Close panel"
          >
            ×
          </Button>
        </div>
        <div className="flex-1 overflow-auto p-5">{children}</div>
        {footer ? (
          <div className="flex justify-end gap-2.5 border-t border-[var(--line)] bg-[var(--soft)] px-5 py-3.5">
            {footer}
          </div>
        ) : null}
      </aside>
    </>
  );
}
