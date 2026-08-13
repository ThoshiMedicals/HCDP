"use client";

import { M07_NON_CERTIFIED_DISCLAIMER } from "../types/domain";
import { M07_SECTION_META, type M07SectionId } from "../section-meta";

/**
 * Honesty surface for planned / non-operational M07 sections (e.g. History).
 * Does not implement payroll history or claim operational capability.
 */
export function PlannedSection({ section }: { section: M07SectionId }) {
  const meta = M07_SECTION_META[section];
  const statusId = `m07-planned-${section}-status`;
  const whyId = `m07-planned-${section}-why`;
  const headingId = `m07-planned-${section}-heading`;

  return (
    <section
      className="space-y-3 rounded-2xl border border-[var(--v34-card-line)] bg-[var(--card)] p-6 min-w-0"
      aria-labelledby={headingId}
      data-m07-section={section}
      data-m07-planned="true"
    >
      <p
        id={statusId}
        className="text-xs font-semibold uppercase tracking-wide text-[var(--ink)]"
        role="status"
      >
        Planned — not yet available
      </p>
      <h2 id={headingId} className="text-lg font-bold text-[var(--ink)]">
        {meta.label}
      </h2>
      <p className="text-sm text-[var(--muted)]">
        This screen is mounted for navigation honesty only. Payroll history and related reporting
        controls are <strong className="font-semibold text-[var(--ink)]">not operational</strong>.
        No clickable control on this section may start history workflows, emit success toasts, or
        imply that History is live. Mounted UI is not prototype parity and is not functional
        evidence.
      </p>
      {meta.batchNote ? (
        <p className="text-xs text-[var(--muted)]" role="note">
          {meta.batchNote}
        </p>
      ) : null}
      <p className="text-xs text-[var(--muted)]">{M07_NON_CERTIFIED_DISCLAIMER}</p>
      <button
        type="button"
        aria-disabled="true"
        aria-describedby={`${statusId} ${whyId}`}
        className="cursor-not-allowed rounded-lg border border-[var(--v34-card-line)] px-3 py-2 text-sm opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)]"
        title="Not yet available — payroll history is not operational"
        onClick={(e) => {
          e.preventDefault();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
          }
        }}
      >
        Actions unavailable — not yet available
      </button>
      <p id={whyId} className="text-xs text-[var(--muted)]">
        Unavailable: History / Reports remains planned and non-operational. No mutations or success
        outcomes are enabled on this section.
      </p>
    </section>
  );
}
