"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  M07_SECTION_META,
  StaffPayProvider,
  resolveM07Section,
  useStaffPay,
  type M07SectionId,
} from "./context";
import {
  OverviewSection,
  PlannedSection,
  SettingsSection,
  PeopleReviewSection,
  LeavePrepSection,
  VariancesSection,
  ExceptionsSection,
  ApprovalSection,
  ExportSection,
  ReconciliationSection,
} from "./sections";
import { M07_NON_CERTIFIED_DISCLAIMER } from "./types/domain";

const NAV = (Object.keys(M07_SECTION_META) as M07SectionId[]).map((id) => ({
  id,
  label: M07_SECTION_META[id].label,
  batch1: M07_SECTION_META[id].batch1,
  batchNote: M07_SECTION_META[id].batchNote,
}));

function SectionBody({ section }: { section: M07SectionId }) {
  switch (section) {
    case "overview":
      return <OverviewSection />;
    case "settings":
      return <SettingsSection />;
    case "people":
      return <PeopleReviewSection />;
    case "leave":
      return <LeavePrepSection />;
    case "variances":
      return <VariancesSection />;
    case "exceptions":
      return <ExceptionsSection />;
    case "approval":
      return <ApprovalSection />;
    case "export":
      return <ExportSection />;
    case "reconciliation":
      return <ReconciliationSection />;
    default:
      return <PlannedSection section={section} />;
  }
}

function DeepLinkSync() {
  const searchParams = useSearchParams();
  const { setSection } = useStaffPay();
  useEffect(() => {
    setSection(resolveM07Section(searchParams.get("section")));
  }, [searchParams, setSection]);
  return null;
}

function WorkspaceInner() {
  const { section, setSection, bootstrap } = useStaffPay();
  const router = useRouter();
  const pathname = usePathname();
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const apply = () => setNarrow(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  function go(id: M07SectionId) {
    setSection(id);
    router.replace(`${pathname}?section=${id}`);
  }

  return (
    <div
      className="m07-shell space-y-4 overflow-x-hidden"
      data-m07-shell="batch6-export"
    >
      <style>{`
        .m07-shell :focus-visible {
          outline: 2px solid var(--ink, #111);
          outline-offset: 2px;
        }
        @media (prefers-reduced-motion: reduce) {
          .m07-shell * {
            transition: none !important;
            animation: none !important;
          }
        }
      `}</style>
      <header className="rounded-2xl border border-[var(--v34-card-line)] bg-[var(--card)] p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          Module 7 · Staff Pay & Payroll Preparation
        </p>
        <h1 className="mt-1 text-2xl font-bold text-[var(--ink)]">
          Staff Pay — Batch 6 export preparation
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-[var(--muted)]">
          Non-certified export preparation, package reconciliation and period locking from an
          approved Batch 5 package. Not payment, bank, STP, superannuation or Xero execution.
          Management approval remains non-certified and is not payment authority.
        </p>
        <p className="mt-2 text-xs text-[var(--muted)]">{M07_NON_CERTIFIED_DISCLAIMER}</p>
        {bootstrap ? (
          <p className="mt-2 text-xs text-[var(--muted)]" role="status">
            Storage bootstrap · schema v9 · v9Ran={String(bootstrap.v9Ran ?? false)}
          </p>
        ) : null}
      </header>

      <div
        className={cn(
          "grid gap-4 min-w-0",
          narrow ? "grid-cols-1" : "md:grid-cols-[minmax(0,220px)_minmax(0,1fr)]"
        )}
      >
        <nav
          aria-label="Staff Pay sections"
          className="rounded-2xl border border-[var(--v34-card-line)] bg-[var(--card)] p-3 min-w-0"
        >
          <ul className="space-y-1">
            {NAV.map((item) => {
              const selected = section === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    aria-current={selected ? "page" : undefined}
                    aria-label={
                      item.batch1 === "planned"
                        ? `${item.label} (planned — not operational)`
                        : item.batchNote
                          ? `${item.label} (${item.batchNote})`
                          : item.label
                    }
                    onClick={() => go(item.id)}
                    className={cn(
                      "flex w-full min-w-0 items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm",
                      selected
                        ? "bg-[var(--ink)] text-[var(--card)]"
                        : "hover:bg-[var(--v34-soft)]"
                    )}
                  >
                    <span className="truncate">{item.label}</span>
                    {item.batch1 === "planned" ? (
                      <span className="shrink-0 text-[10px] uppercase opacity-80" aria-hidden="true">
                        Planned
                      </span>
                    ) : (
                      <span className="sr-only">Available</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        <main id="m07-main" className="min-w-0" tabIndex={-1}>
          <SectionBody section={section} />
        </main>
      </div>
    </div>
  );
}

export function StaffPayWorkspace() {
  return (
    <StaffPayProvider>
      <Suspense fallback={<div className="p-6 text-sm text-[var(--muted)]">Loading Staff Pay…</div>}>
        <DeepLinkSync />
        <WorkspaceInner />
      </Suspense>
    </StaffPayProvider>
  );
}
