"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { SHELL_BREAKPOINTS_PX, SHELL_DIMENSIONS_PX } from "@/lib/shell/design-contract";
import { focusFirst, handleFocusTrapKeydown } from "@/lib/shell/focus-trap";

/**
 * Shared Decision A detail panel (P1-GAP-003 / P1-GAP-051).
 * Desktop: docked right within 320–420px band (default 360).
 * Tablet/mobile: drawer/sheet behaviour via `mode`.
 */
export function DetailPanel({
  open,
  title,
  subtitle,
  children,
  footer,
  onClose,
  mode = "auto",
  widthPx = SHELL_DIMENSIONS_PX.detailPanelWidth,
  className,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
  /** auto = docked ≥1280, drawer below */
  mode?: "auto" | "docked" | "drawer";
  widthPx?: number;
  className?: string;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const [desktop, setDesktop] = useState(true);
  const clamped = Math.min(
    SHELL_DIMENSIONS_PX.detailPanelMaxWidth,
    Math.max(SHELL_DIMENSIONS_PX.detailPanelMinWidth, widthPx)
  );

  useEffect(() => {
    function sync() {
      setDesktop(window.innerWidth >= SHELL_BREAKPOINTS_PX.desktopMin);
    }
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

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
      // Compute drawer mode inside the handler — do not assign refs during render.
      const trapActive =
        mode === "drawer" ||
        (mode === "auto" && window.innerWidth < SHELL_BREAKPOINTS_PX.desktopMin);
      if (trapActive) {
        handleFocusTrapKeydown(e, panelRef.current);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [open, onClose, mode]);

  const resolvedMode = mode === "auto" ? (desktop ? "docked" : "drawer") : mode;

  if (!open && resolvedMode === "docked") {
    return null;
  }

  const panel = (
    <aside
      ref={panelRef}
      role={resolvedMode === "drawer" ? "dialog" : "complementary"}
      aria-modal={resolvedMode === "drawer" && open ? true : undefined}
      aria-labelledby={titleId}
      tabIndex={resolvedMode === "drawer" ? -1 : undefined}
      data-shell-region="detail-pane"
      data-testid="shell-detail-panel"
      data-detail-mode={resolvedMode}
      className={cn(
        "flex h-full min-h-0 flex-col border-l border-[var(--dp-border-subtle)] bg-[var(--dp-bg-surface)] text-[var(--dp-text-primary)]",
        resolvedMode === "drawer" &&
          "fixed bottom-0 right-0 top-0 z-50 shadow-[-20px_0_60px_rgba(15,23,42,0.2)] motion-safe:transition-transform motion-safe:duration-200",
        resolvedMode === "drawer" && (open ? "translate-x-0" : "pointer-events-none translate-x-full"),
        className
      )}
      style={{
        width: resolvedMode === "drawer" ? `min(${clamped}px, 96vw)` : clamped,
        minWidth: resolvedMode === "docked" ? SHELL_DIMENSIONS_PX.detailPanelMinWidth : undefined,
        maxWidth: SHELL_DIMENSIONS_PX.detailPanelMaxWidth,
      }}
      aria-hidden={resolvedMode === "drawer" ? !open : undefined}
      inert={resolvedMode === "drawer" && !open ? true : undefined}
    >
      <div
        className="flex items-center justify-between border-b border-[var(--dp-border-subtle)] px-4"
        style={{ minHeight: "var(--module-header-height)" }}
      >
        <div className="min-w-0">
          <h2 id={titleId} className="m-0 truncate text-[16px] font-semibold">
            {title}
          </h2>
          {subtitle ? (
            <p className="m-0 truncate text-[12px] text-[var(--dp-text-secondary)]">{subtitle}</p>
          ) : null}
        </div>
        <Button
          variant="line"
          className="h-11 w-11 min-h-[44px] min-w-[44px] justify-center px-0"
          onClick={onClose}
          aria-label="Close detail panel"
        >
          ×
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-4">{children}</div>
      {footer ? (
        <div className="flex justify-end gap-2 border-t border-[var(--dp-border-subtle)] bg-[var(--dp-bg-canvas)] px-4 py-3">
          {footer}
        </div>
      ) : null}
    </aside>
  );

  if (resolvedMode === "drawer") {
    return (
      <>
        <div
          className={cn(
            "fixed inset-0 z-40 bg-[rgba(15,23,42,0.28)] motion-safe:transition",
            open ? "block" : "hidden"
          )}
          onClick={onClose}
          aria-hidden
        />
        {panel}
      </>
    );
  }

  return panel;
}
