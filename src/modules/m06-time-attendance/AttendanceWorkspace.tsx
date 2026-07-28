"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";
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
    <div className="grid gap-[18px] lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="h-fit rounded-[16px] border border-[var(--v34-card-line)] bg-white p-3 shadow-[var(--v34-card-shadow)] lg:sticky lg:top-4">
        <div className="mb-3 px-2">
          <div className="text-xs font-bold uppercase tracking-wide text-[#526479]">Module 6</div>
          <div className="text-sm font-extrabold text-[var(--ink)]">Time &amp; Attendance</div>
          <div className="mt-1 text-xs text-[#64748b]">{actorName}</div>
        </div>
        <nav className="grid gap-0.5" aria-label="Attendance sections">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              aria-current={section === item.id ? "page" : undefined}
              data-testid={`m06-nav-${item.id}`}
              data-m06-nav-active={section === item.id ? "true" : "false"}
              className={cn(
                "rounded-lg px-3 py-2 text-left text-sm font-semibold transition",
                "outline-none",
                "focus-visible:!outline focus-visible:!outline-2 focus-visible:!outline-solid focus-visible:!outline-offset-2 focus-visible:!outline-[var(--theme-accent,#2563eb)]",
                "focus-visible:!shadow-[0_0_0_3px_rgba(37,99,235,0.35)]",
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
          <div className="text-sm text-[#64748b]" role="status">
            Loading Time &amp; Attendance…
          </div>
        }
      >
        <DeepLinkSync />
      </Suspense>
    </AttendanceProvider>
  );
}
