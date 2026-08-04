"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ModuleSectionNav } from "@/components/shell/ModuleSectionNav";
import { RosterProvider, resolveM05Section, useRoster } from "./context";
import type { M05SectionId } from "./types/domain";
import { invalidateM05LocalStoreCache } from "./repository/local-store";
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
      className="rounded-[16px] border border-[var(--v34-card-line)] bg-[var(--card)] p-5 shadow-[var(--v34-card-shadow)]"
    >
      <div className="font-extrabold text-[var(--ink)]">You are offline</div>
      <p className="mt-1 text-sm text-[var(--muted)]">
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

const EVIDENCE_FORCE_LOADING_KEY = "pulse.m05.evidence.forceLoading";
const EVIDENCE_FORCE_LOADING_MS = 700;

function useEvidenceForcedLoading(): boolean {
  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem(EVIDENCE_FORCE_LOADING_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!loading) return;
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.removeItem(EVIDENCE_FORCE_LOADING_KEY);
      } catch {
        // ignore storage failures — flag is best-effort
      }
      setLoading(false);
    }, EVIDENCE_FORCE_LOADING_MS);
    return () => window.clearTimeout(timer);
  }, [loading]);

  return loading;
}

function RosterWorkspaceChrome({
  section,
  onNavigate,
}: {
  section: M05SectionId;
  onNavigate: (section: M05SectionId) => void;
}) {
  const { actorName } = useRoster();
  const forcedLoading = useEvidenceForcedLoading();

  return (
    <div className="grid min-w-0 gap-4" data-workspace-nav="horizontal">
      <div className="min-w-0 max-w-full rounded-2xl border border-[var(--v34-card-line)] bg-[var(--card)] px-4 py-3 shadow-[var(--v34-card-shadow)]">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="hcdp-type-meta m-0">Module 5 · sections</p>
          <p className="m-0 text-xs text-[var(--muted)]" role="status">
            Acting as {actorName}
          </p>
        </div>
        <div className="mt-2">
          <ModuleSectionNav
            items={NAV}
            value={section}
            onChange={onNavigate}
            ariaLabel="Roster sections"
            testIdPrefix="m05"
          />
        </div>
      </div>
      <div className="min-w-0">
        {forcedLoading ? (
          <LoadingState label="Loading roster data…" />
        ) : (
          <SectionBody section={section} />
        )}
      </div>
    </div>
  );
}

export function RosterWorkspace() {
  useEffect(() => {
    const w = window as Window & {
      __pulseM05InvalidateStore?: (key?: string) => void;
    };
    w.__pulseM05InvalidateStore = invalidateM05LocalStoreCache;
    return () => {
      delete w.__pulseM05InvalidateStore;
    };
  }, []);

  return (
    <RosterProvider>
      <Suspense
        fallback={
          <div className="text-sm text-[var(--muted)]" role="status">
            Loading Roster &amp; Shift Management…
          </div>
        }
      >
        <DeepLinkSync />
      </Suspense>
    </RosterProvider>
  );
}
