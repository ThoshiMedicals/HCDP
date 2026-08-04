"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ModuleSectionNav } from "@/components/shell/ModuleSectionNav";
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
  ConnectedAdjustmentsSection,
} from "./sections";
import { M07_NON_CERTIFIED_DISCLAIMER } from "./types/domain";

/** SSR + first client paint share this label; detail fills after bootstrap mounts. */
const BOOTSTRAP_STATUS_PLACEHOLDER = "Storage bootstrap · schema v9";

const NAV = (Object.keys(M07_SECTION_META) as M07SectionId[]).map((id) => ({
  id,
  label: M07_SECTION_META[id].label,
  badge: M07_SECTION_META[id].batch1 === "planned" ? "Planned" : undefined,
  badgeAriaHidden: true as const,
  ariaLabel:
    M07_SECTION_META[id].batch1 === "planned"
      ? `${M07_SECTION_META[id].label} (planned — not operational)`
      : M07_SECTION_META[id].batchNote
        ? `${M07_SECTION_META[id].label} (${M07_SECTION_META[id].batchNote})`
        : M07_SECTION_META[id].label,
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
    case "adjustments":
      return <ConnectedAdjustmentsSection />;
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
  const [bootstrapStatus, setBootstrapStatus] = useState(BOOTSTRAP_STATUS_PLACEHOLDER);

  useEffect(() => {
    if (!bootstrap) {
      setBootstrapStatus(BOOTSTRAP_STATUS_PLACEHOLDER);
      return;
    }
    setBootstrapStatus(
      `Storage bootstrap · schema v9 · v9Ran=${String(bootstrap.v9Ran ?? false)}`
    );
  }, [bootstrap]);

  function go(id: M07SectionId) {
    setSection(id);
    router.replace(`${pathname}?section=${id}`);
  }

  return (
    <div
      className="m07-shell space-y-4 overflow-x-hidden"
      data-m07-shell="batch6-export"
      data-workspace-nav="horizontal"
    >
      <style>{`
        .m07-shell :focus-visible {
          outline: 2px solid var(--focus-ring, var(--accent-champagne));
          outline-offset: 2px;
        }
        @media (prefers-reduced-motion: reduce) {
          .m07-shell * {
            transition: none !important;
            animation: none !important;
          }
        }
      `}</style>
      <header className="rounded-2xl border border-[var(--v34-card-line)] bg-[var(--card)] p-5 shadow-[var(--v34-card-shadow)]">
        <p className="hcdp-type-meta m-0">Module 7 · Non-certified payroll preparation</p>
        <p className="hcdp-type-body mt-2 max-w-3xl text-[var(--muted)]">
          Non-certified export preparation, package reconciliation and period locking from an
          approved Batch 5 package. Not payment, bank, STP, superannuation or Xero execution.
          Management approval remains non-certified and is not payment authority.
        </p>
        <p className="mt-2 text-[length:var(--type-control)] text-[var(--muted)]">
          {M07_NON_CERTIFIED_DISCLAIMER}
        </p>
        <p
          className="mt-2 text-[length:var(--type-control)] text-[var(--muted)]"
          role="status"
          data-m07-bootstrap-status="1"
        >
          {bootstrapStatus}
        </p>
        <div className="mt-4">
          <ModuleSectionNav
            items={NAV}
            value={section}
            onChange={go}
            ariaLabel="Staff Pay sections"
          />
        </div>
      </header>

      <main id="m07-main" className="min-w-0" tabIndex={-1}>
        <SectionBody section={section} />
      </main>
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
