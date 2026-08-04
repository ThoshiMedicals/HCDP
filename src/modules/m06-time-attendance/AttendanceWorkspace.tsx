"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ModuleSectionNav } from "@/components/shell/ModuleSectionNav";
import { AttendanceProvider, resolveM06Section, useAttendance, type M06SectionId } from "./context";
import { invalidateM06LocalStoreCache } from "./repository/local-store";
import {
  ApprovalsSection,
  AttendanceHistorySection,
  BreaksSection,
  ClockSection,
  CorrectionsSection,
  ExceptionsSection,
  LiveAttendanceSection,
  ReportsSection,
  SettingsSection,
  TimesheetsSection,
} from "./sections";
import {
  ConcurrentConflictState,
  EmptyState,
  FilteredEmptyState,
  LoadingState,
  OfflineState,
  RestrictedState,
  SyncConflictState,
  SystemErrorState,
  ValidationErrorState,
} from "./components/ux";

const NAV: { id: M06SectionId; label: string }[] = [
  { id: "live", label: "Live Attendance" },
  { id: "clock", label: "Clock In/Out" },
  { id: "timesheets", label: "Timesheets" },
  { id: "exceptions", label: "Exceptions" },
  { id: "corrections", label: "Corrections" },
  { id: "approvals", label: "Approvals" },
  { id: "breaks", label: "Breaks" },
  { id: "history", label: "Attendance History" },
  { id: "reports", label: "Reports" },
  { id: "settings", label: "Settings & Policies" },
];

function SectionBody({ section }: { section: M06SectionId }) {
  switch (section) {
    case "live":
      return <LiveAttendanceSection />;
    case "clock":
      return <ClockSection />;
    case "timesheets":
      return <TimesheetsSection />;
    case "exceptions":
      return <ExceptionsSection />;
    case "corrections":
      return <CorrectionsSection />;
    case "approvals":
      return <ApprovalsSection />;
    case "breaks":
      return <BreaksSection />;
    case "history":
      return <AttendanceHistorySection />;
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
      return <LoadingState />;
    case "empty":
      return <EmptyState title="No attendance data yet" description="Functional empty state." />;
    case "filtered-empty":
      return <FilteredEmptyState />;
    case "restricted":
      return <RestrictedState permission="attendance.approve" />;
    case "validation-error":
      return <ValidationErrorState errors={["Clock-out must be after clock-in."]} />;
    case "system-error":
      return <SystemErrorState error="Simulated system failure for acceptance evidence." />;
    case "offline":
      return <OfflineState />;
    case "sync-conflict":
      return <SyncConflictState detail="Offline event order conflict" />;
    case "concurrent-conflict":
      return (
        <ConcurrentConflictState targetType="session" targetId="ats_demo" onRefresh={onRefresh} />
      );
    default:
      return null;
  }
}

function DeepLinkSync() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { section, setSection, bump } = useAttendance();
  const uxState = searchParams.get("uxState");

  useEffect(() => {
    setSection(resolveM06Section(searchParams.get("section")));
  }, [searchParams, setSection]);

  const navigateSection = useCallback(
    (next: M06SectionId) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === "live") params.delete("section");
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
        <UxStateDemo state={uxState} onRefresh={bump} />
      </div>
    );
  }

  return <AttendanceWorkspaceChrome section={section} onNavigate={navigateSection} />;
}

const EVIDENCE_FORCE_LOADING_KEY = "pulse.m06.evidence.forceLoading";

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
        /* ignore */
      }
      setLoading(false);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [loading]);

  return loading;
}

function AttendanceWorkspaceChrome({
  section,
  onNavigate,
}: {
  section: M06SectionId;
  onNavigate: (section: M06SectionId) => void;
}) {
  const { actorName } = useAttendance();
  const forcedLoading = useEvidenceForcedLoading();

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4" data-workspace-nav="horizontal">
      <div className="min-w-0 max-w-full rounded-2xl border border-[var(--v34-card-line)] bg-[var(--card)] px-4 py-3 shadow-[var(--v34-card-shadow)]">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="hcdp-type-meta m-0">Module 6 · sections</p>
          <p className="m-0 text-xs text-[var(--muted)]" role="status">
            Acting as {actorName}
          </p>
        </div>
        <div className="mt-2">
          <ModuleSectionNav
            items={NAV}
            value={section}
            onChange={onNavigate}
            ariaLabel="Attendance sections"
            testIdPrefix="m06"
          />
        </div>
      </div>
      <div className="min-w-0">
        {forcedLoading ? <LoadingState /> : <SectionBody section={section} />}
      </div>
    </div>
  );
}

export function AttendanceWorkspace() {
  useEffect(() => {
    const w = window as Window & {
      __pulseM06InvalidateStore?: (key?: string) => void;
    };
    w.__pulseM06InvalidateStore = invalidateM06LocalStoreCache;
    return () => {
      delete w.__pulseM06InvalidateStore;
    };
  }, []);

  return (
    <AttendanceProvider>
      <Suspense
        fallback={
          <div className="text-sm text-[var(--muted)]" role="status">
            Loading Time &amp; Attendance…
          </div>
        }
      >
        <DeepLinkSync />
      </Suspense>
    </AttendanceProvider>
  );
}
