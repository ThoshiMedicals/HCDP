"use client";

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
 * Shared module section navigation — horizontal tabs on desktop,
 * compact labelled selector at 768px and below. Visibility is CSS-driven
 * so SSR/mobile audit does not depend on JS matchMedia hydration timing.
 */
export function ModuleSectionNav<T extends string = string>({
  items,
  value,
  onChange,
  ariaLabel,
  testIdPrefix,
  className,
}: ModuleSectionNavProps<T>) {
  return (
    <div className={cn("module-section-nav", className)}>
      <div
        className="module-section-nav__desktop-only"
        data-module-section-nav="desktop"
      >
        <div className="module-section-nav__scroller" role="tablist" aria-label={ariaLabel}>
          {items.map((item) => {
            const selected = value === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-current={selected ? "page" : undefined}
                aria-label={item.ariaLabel ?? item.label}
                data-testid={testIdPrefix ? `${testIdPrefix}-nav-${item.id}` : undefined}
                data-m05-nav-active={
                  testIdPrefix === "m05" ? (selected ? "true" : "false") : undefined
                }
                data-m06-nav-active={
                  testIdPrefix === "m06" ? (selected ? "true" : "false") : undefined
                }
                onClick={() => onChange(item.id as T)}
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
        </div>
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
