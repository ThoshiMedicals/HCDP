"use client";

import { M07_NON_CERTIFIED_DISCLAIMER } from "../types/domain";
import { M07_SECTION_META, type M07SectionId } from "../section-meta";

export function PlannedSection({ section }: { section: M07SectionId }) {
  const meta = M07_SECTION_META[section];
  return (
    <section
      className="space-y-3 rounded-2xl border border-[var(--v34-card-line)] bg-[var(--card)] p-6"
      aria-labelledby={`m07-planned-${section}-heading`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-800" role="status">
        Planned — not operational in Batch 1
      </p>
      <h2 id={`m07-planned-${section}-heading`} className="text-lg font-bold text-[var(--ink)]">
        {meta.label}
      </h2>
      <p className="text-sm text-[var(--muted)]">
        This screen is mounted for navigation only. Controls that would mutate payroll preparation
        workflows (intake, calculate, approve, export, reconcile, lock) are unavailable until a later
        authorised batch. Mounted UI is not prototype parity and is not functional evidence.
      </p>
      <p className="text-xs text-[var(--muted)]">{M07_NON_CERTIFIED_DISCLAIMER}</p>
      <button
        type="button"
        disabled
        aria-disabled="true"
        aria-describedby={`m07-planned-${section}-why`}
        className="cursor-not-allowed rounded-lg border border-[var(--v34-card-line)] px-3 py-2 text-sm opacity-50"
        title="Not authorised in Batch 1"
      >
        Actions unavailable
      </button>
      <p id={`m07-planned-${section}-why`} className="text-xs text-[var(--muted)]">
        Unavailable: Batch 1 foundation only. No mutations are enabled on this section.
      </p>
    </section>
  );
}
