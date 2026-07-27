"use client";

import type { ReactNode } from "react";

/**
 * Testability wrapper for every M05 section body.
 *
 * Emits stable identity attributes so the Wave 4 evidence harness can assert:
 *   - which section is currently mounted (`data-m05-section`)
 *   - the section's user-visible title (`data-m05-section-title`)
 *   - the section's heading test id (`m05-heading-<sectionId>`)
 *
 * Every branch of a section (restricted, conflict, empty, error, main render)
 * MUST be wrapped in this frame so section identity is never lost.
 */
export function SectionFrame({
  sectionId,
  title,
  children,
}: {
  sectionId: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div
      className="grid gap-4"
      data-testid={`m05-section-${sectionId}`}
      data-m05-section={sectionId}
      data-m05-section-title={title}
    >
      <div>
        <h2
          className="m-0 text-xl font-extrabold text-[var(--ink)]"
          data-testid={`m05-heading-${sectionId}`}
        >
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}
