"use client";

import { Suspense, useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";
import { TrainingProvider, resolveM11Section, useTraining } from "./context";
import type { M11SectionId } from "./types/domain";
import {
  OverviewSection,
  CatalogueSection,
  AssignmentsSection,
  SessionsSection,
  AssessmentsSection,
  CompetenciesSection,
  CertificatesSection,
  ExemptionsSection,
  EvidenceSection,
  ReportsSection,
  SettingsSection,
} from "./sections";
import {
  LoadingState,
  EmptyState,
  FilteredEmptyState,
  RestrictedState,
  ValidationErrorState,
  SystemErrorState,
  OfflineState,
} from "./sections/ux-states";

const NAV: { id: M11SectionId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "catalogue", label: "Course Catalogue" },
  { id: "assignments", label: "Assignments" },
  { id: "sessions", label: "Sessions" },
  { id: "assessments", label: "Assessments" },
  { id: "competencies", label: "Competencies" },
  { id: "certificates", label: "Certificates" },
  { id: "exemptions", label: "Exemptions" },
  { id: "evidence", label: "Evidence" },
  { id: "reports", label: "Reports" },
  { id: "settings", label: "Policy & Settings" },
];

function SectionBody({ section }: { section: M11SectionId }) {
  switch (section) {
    case "overview":
      return <OverviewSection />;
    case "catalogue":
      return <CatalogueSection />;
    case "assignments":
      return <AssignmentsSection />;
    case "sessions":
      return <SessionsSection />;
    case "assessments":
      return <AssessmentsSection />;
    case "competencies":
      return <CompetenciesSection />;
    case "certificates":
      return <CertificatesSection />;
    case "exemptions":
      return <ExemptionsSection />;
    case "evidence":
      return <EvidenceSection />;
    case "reports":
      return <ReportsSection />;
    case "settings":
      return <SettingsSection />;
    default:
      return null;
  }
}

function UxStateDemo({ state }: { state: string }) {
  switch (state) {
    case "loading":
      return <LoadingState label="Loading training data…" />;
    case "empty":
      return (
        <EmptyState
          title="No training records yet"
          description="Functional empty state for acceptance evidence."
        />
      );
    case "filtered-empty":
      return <FilteredEmptyState />;
    case "restricted":
      return <RestrictedState permission="training.manage_sessions" />;
    case "validation-error":
      return <ValidationErrorState errors={["Due date is required.", "Course ID is required."]} />;
    case "system-error":
      return <SystemErrorState error="Simulated system failure for acceptance evidence." />;
    case "offline":
      return (
        <div data-ux-state="offline" className="grid gap-2">
          <OfflineState />
          <PanelForceOffline />
        </div>
      );
    default:
      return null;
  }
}

/** Always-visible offline banner when uxState=offline (functional component, not screenshot). */
function PanelForceOffline() {
  return (
    <div
      role="status"
      data-testid="ux-offline-forced"
      className="rounded-[16px] border border-[var(--v34-card-line)] bg-white p-5 shadow-[var(--v34-card-shadow)]"
    >
      <div className="font-extrabold text-[var(--ink)]">You are offline</div>
      <p className="mt-1 text-sm text-[#64748b]">
        Changes cannot be saved until your connection is restored. Read-only data may still be
        available from local storage.
      </p>
    </div>
  );
}

function DeepLinkSync() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { section, setSection } = useTraining();
  const uxState = searchParams.get("uxState");

  useEffect(() => {
    setSection(resolveM11Section(searchParams.get("section")));
  }, [searchParams, setSection]);

  const navigateSection = useCallback(
    (next: M11SectionId) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === "overview") params.delete("section");
      else params.set("section", next);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  if (uxState) {
    return (
      <div className="grid gap-4" data-testid={`ux-state-${uxState}`}>
        <h2 className="m-0 text-xl font-extrabold text-[var(--ink)]">UX state · {uxState}</h2>
        <UxStateDemo state={uxState} />
      </div>
    );
  }

  return <TrainingWorkspaceChrome section={section} onNavigate={navigateSection} />;
}

function TrainingWorkspaceChrome({
  section,
  onNavigate,
}: {
  section: M11SectionId;
  onNavigate: (section: M11SectionId) => void;
}) {
  const { actorName } = useTraining();

  return (
    <div className="grid gap-[18px] lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="h-fit rounded-[16px] border border-[var(--v34-card-line)] bg-white p-3 shadow-[var(--v34-card-shadow)] lg:sticky lg:top-4">
        <div className="mb-3 px-2">
          <div className="text-xs font-bold uppercase tracking-wide text-[#526479]">Module 11</div>
          <div className="text-sm font-extrabold text-[var(--ink)]">Training Management</div>
          <div className="mt-1 text-xs text-[#64748b]">{actorName}</div>
        </div>
        <nav className="grid gap-0.5" aria-label="Training Management sections">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              aria-current={section === item.id ? "page" : undefined}
              className={cn(
                "rounded-lg px-3 py-2 text-left text-sm font-semibold transition",
                section === item.id
                  ? "bg-[var(--teal-3)] text-[#1d4ed8]"
                  : "text-[#526479] hover:bg-[#f8fafc]"
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
      <div className="min-w-0">
        <SectionBody section={section} />
      </div>
    </div>
  );
}

export function TrainingWorkspace() {
  return (
    <TrainingProvider>
      <Suspense
        fallback={
          <div className="text-sm text-[#64748b]" role="status">
            Loading Training Management…
          </div>
        }
      >
        <DeepLinkSync />
      </Suspense>
    </TrainingProvider>
  );
}
