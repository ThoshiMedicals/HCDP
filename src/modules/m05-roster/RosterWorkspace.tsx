"use client";

import { Suspense, useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";
import { RosterProvider, resolveM05Section, useRoster } from "./context";
import type { M05SectionId } from "./types/domain";
import {
  RosterBoardSection,
  CoverageSection,
  OpenShiftsSection,
  AvailabilityLeaveSection,
  RequestsSection,
  ConflictsWarningsSection,
  PublishedHistorySection,
  CostForecastSection,
  ReportsSection,
  SettingsSection,
} from "./sections";
import {
  ConcurrentConflictState,
  EmptyState,
  FilteredEmptyState,
  LoadingState,
  OfflineState,
  RestrictedState,
  SystemErrorState,
  ValidationErrorState,
} from "./components/ux";

const NAV: { id: M05SectionId; label: string }[] = [
  { id: "roster-board", label: "Roster Board" },
  { id: "coverage", label: "Coverage" },
  { id: "open-shifts", label: "Open Shifts" },
  { id: "availability-leave", label: "Availability & Leave" },
  { id: "requests", label: "Requests" },
  { id: "conflicts-warnings", label: "Conflicts & Warnings" },
  { id: "published-history", label: "Published & History" },
  { id: "cost-forecast", label: "Cost Forecast" },
  { id: "reports", label: "Reports" },
  { id: "settings", label: "Policy & Settings" },
];

function SectionBody({ section }: { section: M05SectionId }) {
  switch (section) {
    case "roster-board":
      return <RosterBoardSection />;
    case "coverage":
      return <CoverageSection />;
    case "open-shifts":
      return <OpenShiftsSection />;
    case "availability-leave":
      return <AvailabilityLeaveSection />;
    case "requests":
      return <RequestsSection />;
    case "conflicts-warnings":
      return <ConflictsWarningsSection />;
    case "published-history":
      return <PublishedHistorySection />;
    case "cost-forecast":
      return <CostForecastSection />;
    case "reports":
      return <ReportsSection />;
    case "settings":
      return <SettingsSection />;
    default:
      return null;
  }
}

function UxStateDemo({ state, onRefresh }: { state: string; onRefresh: () => void }) {
  switch (state) {
    case "loading":
      return <LoadingState label="Loading roster data…" />;
    case "empty":
      return (
        <EmptyState
          title="No roster data yet"
          description="Functional empty state for acceptance evidence."
        />
      );
    case "filtered-empty":
      return <FilteredEmptyState />;
    case "restricted":
      return <RestrictedState permission="roster.publish" />;
    case "validation-error":
      return (
        <ValidationErrorState
          errors={["Start time must be before end time.", "Person id is required."]}
        />
      );
    case "system-error":
      return (
        <SystemErrorState error="Simulated system failure for acceptance evidence." />
      );
    case "offline":
      return (
        <div className="grid gap-2">
          <OfflineState />
          <PanelForceOffline />
        </div>
      );
    case "concurrent-conflict":
      return (
        <ConcurrentConflictState
          targetType="shift"
          targetId="shf_demo_001"
          onRefresh={onRefresh}
        />
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
      data-testid="m05-ux-offline-forced"
      className="rounded-[16px] border border-[var(--v34-card-line)] bg-white p-5 shadow-[var(--v34-card-shadow)]"
    >
      <div className="font-extrabold text-[var(--ink)]">You are offline</div>
      <p className="mt-1 text-sm text-[#64748b]">
        Changes cannot be saved until your connection is restored. Read-only data may
        still be available from local storage.
      </p>
    </div>
  );
}

function DeepLinkSync() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { section, setSection, bump } = useRoster();
  const uxState = searchParams.get("uxState");

  useEffect(() => {
    setSection(resolveM05Section(searchParams.get("section")));
  }, [searchParams, setSection]);

  const navigateSection = useCallback(
    (next: M05SectionId) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === "roster-board") params.delete("section");
      else params.set("section", next);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  if (uxState) {
    return (
      <div className="grid gap-4" data-testid={`ux-state-${uxState}`}>
        <h2 className="m-0 text-xl font-extrabold text-[var(--ink)]">
          UX state · {uxState}
        </h2>
        <UxStateDemo state={uxState} onRefresh={bump} />
      </div>
    );
  }

  return <RosterWorkspaceChrome section={section} onNavigate={navigateSection} />;
}

function RosterWorkspaceChrome({
  section,
  onNavigate,
}: {
  section: M05SectionId;
  onNavigate: (section: M05SectionId) => void;
}) {
  const { actorName } = useRoster();

  return (
    <div className="grid gap-[18px] lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="h-fit rounded-[16px] border border-[var(--v34-card-line)] bg-white p-3 shadow-[var(--v34-card-shadow)] lg:sticky lg:top-4">
        <div className="mb-3 px-2">
          <div className="text-xs font-bold uppercase tracking-wide text-[#526479]">
            Module 5
          </div>
          <div className="text-sm font-extrabold text-[var(--ink)]">
            Roster &amp; Shift Management
          </div>
          <div className="mt-1 text-xs text-[#64748b]">{actorName}</div>
        </div>
        <nav className="grid gap-0.5" aria-label="Roster sections">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              aria-current={section === item.id ? "page" : undefined}
              data-testid={`m05-nav-${item.id}`}
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

export function RosterWorkspace() {
  return (
    <RosterProvider>
      <Suspense
        fallback={
          <div className="text-sm text-[#64748b]" role="status">
            Loading Roster &amp; Shift Management…
          </div>
        }
      >
        <DeepLinkSync />
      </Suspense>
    </RosterProvider>
  );
}
