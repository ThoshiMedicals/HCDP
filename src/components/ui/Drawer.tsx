"use client";

import { useId, useRef } from "react";
import { useFocusTrap } from "@/lib/a11y/use-focus-trap";
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
  useFocusTrap(open, panelRef, onClose);

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-[var(--aurora-overlay,rgba(15,23,42,0.28))] transition duration-[var(--aurora-motion-drawer,200ms)] ease-[var(--aurora-motion-easing,ease)] ${open ? "block" : "hidden"}`}
        onClick={onClose}
        aria-hidden
      />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-shell-region="detail-pane"
        data-testid="shell-drawer"
        data-aurora-surface="raised"
        data-aurora-focus-trap={open ? "true" : "false"}
        tabIndex={-1}
        className={`fixed bottom-0 right-0 top-0 z-50 flex flex-col bg-[var(--aurora-surface-raised,var(--dp-bg-surface,var(--card)))] text-[var(--aurora-text-primary,var(--ink))] shadow-[var(--aurora-elevation-panel,-20px_0_60px_rgba(15,23,42,0.2))] transition-transform duration-[var(--aurora-motion-drawer,200ms)] ease-[var(--aurora-motion-easing,ease)] ${
          open ? "translate-x-0" : "translate-x-full pointer-events-none"
        }`}
        style={{ width: "min(var(--drawer-width, 420px), 96vw)" }}
        aria-hidden={!open}
        inert={!open ? true : undefined}
      >
        <div
          className="flex items-center justify-between border-b border-[var(--aurora-border-subtle,var(--line))] px-5"
          style={{ minHeight: "var(--module-header-height, 56px)" }}
        >
          <div>
            <h2 id={titleId} className="m-0 text-[19px] font-extrabold">
              {title}
            </h2>
            {subtitle ? (
              <p className="m-0 text-[13px] text-[var(--aurora-text-muted,var(--muted))]">{subtitle}</p>
            ) : null}
          </div>
          <Button
            variant="line"
            className="h-10 w-10 min-h-[var(--aurora-touch-target-min,44px)] min-w-[var(--aurora-touch-target-min,44px)] justify-center px-0 md:min-h-10 md:min-w-10"
            onClick={onClose}
            aria-label="Close panel"
          >
            ×
          </Button>
        </div>
        <div className="flex-1 overflow-auto p-5">{children}</div>
        {footer ? (
          <div className="flex justify-end gap-2.5 border-t border-[var(--aurora-border-subtle,var(--line))] bg-[var(--aurora-surface-muted,var(--soft))] px-5 py-3.5">
            {footer}
          </div>
        ) : null}
      </aside>
    </>
  );
}
