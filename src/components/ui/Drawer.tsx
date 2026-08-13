"use client";

import { useEffect, useId, useRef } from "react";
import { Button } from "./Button";
import { focusFirst, handleFocusTrapKeydown } from "@/lib/shell/focus-trap";

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
      focusFirst(panelRef.current);
    }, 0);
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      handleFocusTrapKeydown(e, panelRef.current);
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
        className={`fixed inset-0 z-40 bg-[rgba(15,23,42,0.28)] motion-safe:transition ${open ? "block" : "hidden"}`}
        onClick={onClose}
        aria-hidden
      />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-shell-region="detail-pane"
        data-testid="shell-drawer"
        className={`fixed bottom-0 right-0 top-0 z-50 flex flex-col bg-[var(--dp-bg-surface,var(--card))] text-[var(--ink)] shadow-[-20px_0_60px_rgba(15,23,42,0.2)] motion-safe:transition-transform motion-safe:duration-200 ${
          open ? "translate-x-0" : "translate-x-full pointer-events-none"
        }`}
        style={{ width: "min(var(--drawer-width, 420px), 96vw)" }}
        aria-hidden={!open}
        inert={!open ? true : undefined}
      >
        <div
          className="flex items-center justify-between border-b border-[var(--line)] px-5"
          style={{ minHeight: "var(--module-header-height, 56px)" }}
        >
          <div>
            <h2 id={titleId} className="m-0 text-[19px] font-extrabold">
              {title}
            </h2>
            {subtitle ? <p className="m-0 text-[13px] text-[var(--muted)]">{subtitle}</p> : null}
          </div>
          <Button
            variant="line"
            className="h-11 w-11 min-h-[44px] min-w-[44px] justify-center px-0"
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
