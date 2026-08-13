"use client";

import { useRef, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";

export type ModuleSectionNavItem = {
  id: string;
  label: string;
  /** Optional accessible name override (e.g. Planned qualifications). */
  ariaLabel?: string;
  /** Compact suffix shown on desktop tabs (e.g. Planned). */
  badge?: string;
  /** When true, badge is announced via aria-hidden visual + ariaLabel. */
  badgeAriaHidden?: boolean;
};

type ModuleSectionNavProps<T extends string = string> = {
  items: ModuleSectionNavItem[];
  value: T;
  onChange: (id: T) => void;
  ariaLabel: string;
  /** Prefix for data-testid / data-*-nav-active attributes (e.g. m05, m06). */
  testIdPrefix?: "m05" | "m06";
  className?: string;
};

/**
 * Shared module section navigation — horizontal controls on desktop,
 * compact labelled selector at 768px and below.
 *
 * Not implemented as ARIA tabs: section panels live in parent workspaces
 * without tabpanel IDs / aria-controls wiring. Uses navigation + aria-current
 * (P1-B4 remediation / P1-GAP-009).
 */
export function ModuleSectionNav<T extends string = string>({
  items,
  value,
  onChange,
  ariaLabel,
  testIdPrefix,
  className,
}: ModuleSectionNavProps<T>) {
  const listRef = useRef<HTMLElement>(null);

  function focusAt(index: number) {
    const buttons = listRef.current?.querySelectorAll<HTMLElement>(
      "[data-section-id]"
    );
    if (!buttons?.length) return;
    const next = ((index % buttons.length) + buttons.length) % buttons.length;
    const el = buttons[next];
    el?.focus();
    const id = el?.getAttribute("data-section-id");
    if (id) onChange(id as T);
  }

  function onItemKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        focusAt(index + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        focusAt(index - 1);
        break;
      case "Home":
        e.preventDefault();
        focusAt(0);
        break;
      case "End":
        e.preventDefault();
        focusAt(items.length - 1);
        break;
      default:
        break;
    }
  }

  return (
    <div className={cn("module-section-nav", className)}>
      <div
        className="module-section-nav__desktop-only"
        data-module-section-nav="desktop"
      >
        <nav
          ref={listRef}
          className="module-section-nav__scroller"
          aria-label={ariaLabel}
          data-testid="module-section-nav-list"
        >
          {items.map((item, index) => {
            const selected = value === item.id;
            return (
              <button
                key={item.id}
                type="button"
                tabIndex={selected ? 0 : -1}
                aria-current={selected ? "page" : undefined}
                aria-label={item.ariaLabel ?? item.label}
                data-section-id={item.id}
                data-testid={testIdPrefix ? `${testIdPrefix}-nav-${item.id}` : undefined}
                data-m05-nav-active={
                  testIdPrefix === "m05" ? (selected ? "true" : "false") : undefined
                }
                data-m06-nav-active={
                  testIdPrefix === "m06" ? (selected ? "true" : "false") : undefined
                }
                onClick={() => onChange(item.id as T)}
                onKeyDown={(e) => onItemKeyDown(e, index)}
                className={cn(
                  "module-section-nav__tab",
                  selected && "module-section-nav__tab--selected"
                )}
              >
                <span className="module-section-nav__tab-label">{item.label}</span>
                {item.badge ? (
                  <span
                    className="module-section-nav__badge"
                    aria-hidden={item.badgeAriaHidden ? true : undefined}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>

      <div
        className="module-section-nav__compact-only"
        data-module-section-nav="compact"
      >
        <label className="module-section-nav__select-label">
          <span className="module-section-nav__select-caption">Section</span>
          <select
            className="module-section-nav__select"
            aria-label={ariaLabel}
            value={value}
            onChange={(e) => onChange(e.target.value as T)}
            data-testid={testIdPrefix ? `${testIdPrefix}-section-select` : undefined}
          >
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.badge ? `${item.label} (${item.badge})` : item.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
