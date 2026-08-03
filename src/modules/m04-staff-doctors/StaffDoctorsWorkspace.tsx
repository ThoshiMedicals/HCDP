"use client";

import { Suspense, useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ModuleSectionNav } from "@/components/shell/ModuleSectionNav";
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
    <div className="grid min-w-0 gap-4" data-workspace-nav="horizontal">
      <div className="rounded-2xl border border-[var(--v34-card-line)] bg-[var(--card)] px-4 py-3 shadow-[var(--v34-card-shadow)]">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="hcdp-type-meta m-0">Module 4 · sections</p>
          <p className="m-0 text-xs text-[var(--muted)]" role="status">
            Acting as {actorName}
          </p>
        </div>
        <div className="mt-2">
          <ModuleSectionNav
            items={NAV}
            value={section}
            onChange={onNavigate}
            ariaLabel="Staff and Doctor Management sections"
          />
        </div>
      </div>
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
          <div className="text-sm text-[var(--muted)]" role="status">
            Loading Staff & Doctor Management…
          </div>
        }
      >
        <DeepLinkSync />
      </Suspense>
    </StaffDoctorsProvider>
  );
}
