"use client";

import { Suspense, useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";
import { StaffDoctorsProvider, resolveM04Section, useStaffDoctors } from "./context";
import type { M04SectionId } from "./types/domain";
import {
  OverviewSection,
  PeopleSection,
  EngagementsSection,
  CredentialsSection,
  LeaveAvailabilitySection,
  RestrictionsSection,
  OnboardingSection,
  OffboardingSection,
  ReportsSection,
  SettingsSection,
} from "./sections";

const NAV: { id: M04SectionId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "people", label: "People Directory" },
  { id: "staff-profiles", label: "Staff Profiles" },
  { id: "doctor-profiles", label: "Doctor Profiles" },
  { id: "engagements", label: "Engagements" },
  { id: "credentials", label: "Credentials" },
  { id: "leave-availability", label: "Leave & Availability" },
  { id: "restrictions", label: "Restrictions" },
  { id: "onboarding", label: "Onboarding" },
  { id: "offboarding", label: "Offboarding" },
  { id: "reports", label: "Reports" },
  { id: "settings", label: "Settings" },
];

function SectionBody({ section }: { section: M04SectionId }) {
  switch (section) {
    case "overview":
      return <OverviewSection />;
    case "people":
      return <PeopleSection />;
    case "staff-profiles":
      return <PeopleSection kindFilter="staff" />;
    case "doctor-profiles":
      return <PeopleSection kindFilter="doctor" />;
    case "engagements":
      return <EngagementsSection />;
    case "credentials":
      return <CredentialsSection />;
    case "leave-availability":
      return <LeaveAvailabilitySection />;
    case "restrictions":
      return <RestrictionsSection />;
    case "onboarding":
      return <OnboardingSection />;
    case "offboarding":
      return <OffboardingSection />;
    case "reports":
      return <ReportsSection />;
    case "settings":
      return <SettingsSection />;
    default:
      return null;
  }
}

function DeepLinkSync() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { section, setSection } = useStaffDoctors();

  useEffect(() => {
    setSection(resolveM04Section(searchParams.get("section")));
  }, [searchParams, setSection]);

  const navigateSection = useCallback(
    (next: M04SectionId) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === "overview") params.delete("section");
      else params.set("section", next);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  return <StaffDoctorsWorkspaceChrome section={section} onNavigate={navigateSection} />;
}

function StaffDoctorsWorkspaceChrome({
  section,
  onNavigate,
}: {
  section: M04SectionId;
  onNavigate: (section: M04SectionId) => void;
}) {
  const { actorName } = useStaffDoctors();

  return (
    <div className="grid gap-[18px] lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="h-fit rounded-[16px] border border-[var(--v34-card-line)] bg-white p-3 shadow-[var(--v34-card-shadow)] lg:sticky lg:top-4">
        <div className="mb-3 px-2">
          <div className="text-xs font-bold uppercase tracking-wide text-[#526479]">Module 4</div>
          <div className="text-sm font-extrabold text-[var(--ink)]">Staff & Doctor Management</div>
          <div className="mt-1 text-xs text-[#64748b]">{actorName}</div>
        </div>
        <nav className="grid gap-0.5" aria-label="Staff and Doctor Management sections">
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

export function StaffDoctorsWorkspace() {
  return (
    <StaffDoctorsProvider>
      <Suspense
        fallback={
          <div className="text-sm text-[#64748b]" role="status">
            Loading Staff & Doctor Management…
          </div>
        }
      >
        <DeepLinkSync />
      </Suspense>
    </StaffDoctorsProvider>
  );
}
