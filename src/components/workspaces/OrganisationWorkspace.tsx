"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { OrganisationProvider, useOrganisation } from "@/lib/organisation/context";
import type { OrgNotification, OrgSectionId } from "@/lib/organisation/types";
import { AccessRequestsSection } from "./organisation/AccessRequestsSection";
import { AccessReviewsSection } from "./organisation/AccessReviewsSection";
import { AuditSection } from "./organisation/AuditSection";
import { DepartmentsSection } from "./organisation/DepartmentsSection";
import { LocationsSection } from "./organisation/LocationsSection";
import { OverviewSection } from "./organisation/OverviewSection";
import {
  EmergencyBanner,
  SearchBox,
  SectionHeader,
  StatusPill,
} from "./organisation/org-ui";
import { ReportsSection } from "./organisation/ReportsSection";
import { RolesSection } from "./organisation/RolesSection";
import { SecuritySection } from "./organisation/SecuritySection";
import { SettingsSection } from "./organisation/SettingsSection";
import { StructureSection } from "./organisation/StructureSection";
import { UsersSection } from "./organisation/UsersSection";
import { cn } from "@/lib/cn";

const NAV: { id: OrgSectionId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "structure", label: "Organisation Structure" },
  { id: "locations", label: "Locations" },
  { id: "departments", label: "Departments & Rooms" },
  { id: "users", label: "Users" },
  { id: "roles", label: "Roles & Permissions" },
  { id: "access-requests", label: "Access Requests" },
  { id: "access-reviews", label: "Access Reviews" },
  { id: "security", label: "Security Monitoring" },
  { id: "audit", label: "Audit History" },
  { id: "reports", label: "Reports" },
  { id: "settings", label: "Settings" },
];

const VALID_SECTIONS = new Set(NAV.map((n) => n.id));

function SectionBody({ section }: { section: OrgSectionId }) {
  switch (section) {
    case "overview":
      return <OverviewSection />;
    case "structure":
      return <StructureSection />;
    case "locations":
      return <LocationsSection />;
    case "departments":
      return <DepartmentsSection />;
    case "users":
      return <UsersSection />;
    case "roles":
      return <RolesSection />;
    case "access-requests":
      return <AccessRequestsSection />;
    case "access-reviews":
      return <AccessReviewsSection />;
    case "security":
      return <SecuritySection />;
    case "audit":
      return <AuditSection />;
    case "reports":
      return <ReportsSection />;
    case "settings":
      return <SettingsSection />;
    default:
      return null;
  }
}

function OrganisationDeepLink() {
  const searchParams = useSearchParams();
  const { setSection, navigate } = useOrganisation();

  useEffect(() => {
    const section = searchParams.get("section");
    const recordId = searchParams.get("recordId");
    if (section && VALID_SECTIONS.has(section as OrgSectionId)) {
      setSection(section as OrgSectionId);
      if (recordId) {
        navigate(section as OrgSectionId, { card: recordId, query: recordId });
      }
    }
  }, [searchParams, setSection, navigate]);

  return null;
}

function OrganisationWorkspaceInner() {
  const {
    section,
    setSection,
    navigate,
    state,
    actor,
    demoActors,
    switchActor,
    search,
    advanceClock,
    runExpiryCheck,
    resetDemo,
    patchState,
    pushToast,
  } = useOrganisation();
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [criticalResolve, setCriticalResolve] = useState<OrgNotification | null>(null);
  const [criticalNote, setCriticalNote] = useState("");

  const results = useMemo(() => (query.trim() ? search(query) : []), [query, search]);
  const activeEmergency = state.emergency.filter((e) => e.active);
  const visibleNotifications = state.notifications.filter(
    (n) => !n.resolved && (!n.read || n.mandatory || n.type === "Critical alert")
  );

  const resolveNotification = (n: OrgNotification) => {
    if (n.type === "Critical alert") {
      setCriticalResolve(n);
      setCriticalNote("");
      return;
    }
    patchState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((x) => (x.id === n.id ? { ...x, resolved: true, read: true } : x)),
    }));
    pushToast("Notification resolved.", "success");
  };

  const confirmCriticalResolve = () => {
    if (!criticalResolve || !criticalNote.trim()) return;
    patchState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((x) =>
        x.id === criticalResolve.id ? { ...x, resolved: true, read: true } : x
      ),
    }));
    pushToast("Critical alert formally resolved with resolution note recorded.", "success");
    setCriticalResolve(null);
    setCriticalNote("");
  };

  return (
    <div className="grid gap-[18px] lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="h-fit rounded-[16px] border border-[var(--v34-card-line)] bg-[var(--card)] p-3 shadow-[var(--v34-card-shadow)] lg:sticky lg:top-4">
        <div className="mb-3 px-2">
          <div className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Module 3</div>
          <div className="text-sm font-extrabold text-[var(--ink)]">Organisation & Access</div>
          <div className="mt-1 text-xs text-[var(--muted)]">{actor.name} · {actor.role}</div>
        </div>
        <nav className="grid gap-0.5">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className={cn(
                "rounded-lg px-3 py-2 text-left text-sm font-semibold transition",
                section === item.id
                  ? "bg-[var(--teal-3)] text-[#1d4ed8]"
                  : "text-[var(--muted)] hover:bg-[var(--soft)]"
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="mt-4 grid gap-2 border-t border-[#f0f3f6] pt-3">
          <span className="px-2 text-[length:var(--type-meta)] font-bold uppercase text-[#94a3b8]">Acting as</span>
          {demoActors.map((a) => (
            <Button
              key={a.id}
              small
              variant={actor.id === a.id ? "teal" : "line"}
              onClick={() => switchActor(a.id)}
              title={`Act as ${a.name} (${a.role})`}
            >
              Act as {a.name.split(" ")[0]}
            </Button>
          ))}
        </div>
        <div className="mt-4 grid gap-2 border-t border-[#f0f3f6] pt-3">
          <span className="px-2 text-[length:var(--type-meta)] font-bold uppercase text-[#94a3b8]">Demo controls</span>
          <Button small variant="line" onClick={() => advanceClock(1)} title="Advance demo clock one day">
            +1 day
          </Button>
          <Button small variant="line" onClick={() => advanceClock(3)} title="Advance demo clock three days">
            +3 days
          </Button>
          <Button small variant="line" onClick={runExpiryCheck}>
            Run expiry check
          </Button>
          <Button small variant="line" onClick={resetDemo}>
            Reset demo data
          </Button>
        </div>
      </aside>

      <div className="min-w-0 grid gap-[18px]">
        <SectionHeader
          title="Organisation & Access"
          subtitle="Healthcare Doctors Pulse — structure, users, permissions and audit."
          actions={
            <Badge tone="teal">{actor.role}</Badge>
          }
        />

        {activeEmergency.length > 0 ? (
          <EmergencyBanner>
            Emergency access active for {activeEmergency.map((e) => e.userName).join(", ")} — expires{" "}
            {activeEmergency.map((e) => new Date(e.expiresAt).toLocaleString()).join("; ")}.
            <Button className="ml-2" small variant="line" onClick={() => navigate("security")}>
              Open security
            </Button>
          </EmergencyBanner>
        ) : null}

        {visibleNotifications.length > 0 ? (
          <div className="rounded-xl border border-[var(--line)] bg-[var(--soft)] p-3">
            <div className="mb-2 text-xs font-bold uppercase text-[var(--muted)]">Notifications</div>
            <div className="grid gap-2">
              {visibleNotifications.slice(0, 6).map((n) => (
                <div key={n.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[var(--card)] px-3 py-2 text-sm shadow-sm">
                  <div>
                    <strong>{n.title}</strong>
                    <div className="text-xs text-[var(--muted)]">{n.body}</div>
                    <div className="mt-1 flex gap-1">
                      {n.mandatory ? <StatusPill label="Mandatory" tone="warn" /> : null}
                      {n.type === "Critical alert" ? <StatusPill label="Critical" tone="danger" /> : null}
                      {n.read ? <StatusPill label="Read" tone="default" /> : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {n.actionSection ? (
                      <Button
                        small
                        variant="teal"
                        onClick={() => {
                          navigate(n.actionSection!, n.actionFilter ? { card: n.actionFilter } : undefined);
                          patchState((prev) => ({
                            ...prev,
                            notifications: prev.notifications.map((x) =>
                              x.id === n.id ? { ...x, read: true } : x
                            ),
                          }));
                        }}
                      >
                        {n.actionLabel || "Open"}
                      </Button>
                    ) : null}
                    <Button small variant="line" onClick={() => resolveNotification(n)}>
                      Resolve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <Modal
          open={!!criticalResolve}
          title="Resolve critical alert"
          onClose={() => setCriticalResolve(null)}
          footer={
            <>
              <Button variant="line" onClick={() => setCriticalResolve(null)}>Cancel</Button>
              <Button variant="teal" disabled={!criticalNote.trim()} onClick={confirmCriticalResolve}>
                Formally resolve
              </Button>
            </>
          }
        >
          <p className="m-0 text-sm text-[var(--muted)]">
            Critical alerts require a formal resolution note before they can be cleared.
          </p>
          <textarea
            className="mt-3 w-full rounded-lg border px-3 py-2 text-sm"
            rows={3}
            placeholder="Resolution note (required)"
            value={criticalNote}
            onChange={(e) => setCriticalNote(e.target.value)}
          />
        </Modal>

        <div className="relative">
          <SearchBox value={query} onChange={(v) => { setQuery(v); setSearchOpen(!!v.trim()); }} />
          {searchOpen && results.length > 0 ? (
            <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-[var(--line)] bg-[var(--card)] shadow-lg">
              {results.map((r) => (
                <button
                  key={`${r.section}-${r.id}`}
                  type="button"
                  className="flex w-full flex-col gap-0.5 border-b border-[#f0f3f6] px-3 py-2 text-left hover:bg-[var(--soft)]"
                  onClick={() => {
                    navigate(r.section, { card: r.id, query: undefined });
                    setQuery("");
                    setSearchOpen(false);
                  }}
                >
                  <strong className="text-sm">{r.title}</strong>
                  <span className="text-xs text-[var(--muted)]">{r.subtitle} · {NAV.find((n) => n.id === r.section)?.label}</span>
                </button>
              ))}
            </div>
          ) : null}
          {searchOpen && query.trim() && results.length === 0 ? (
            <div className="absolute z-20 mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--card)] px-3 py-4 text-sm text-[var(--muted)] shadow-lg">
              No matches for &ldquo;{query}&rdquo;
            </div>
          ) : null}
        </div>

        <SectionBody section={section} />
      </div>
    </div>
  );
}

export function OrganisationWorkspace() {
  return (
    <OrganisationProvider>
      <Suspense fallback={null}>
        <OrganisationDeepLink />
      </Suspense>
      <OrganisationWorkspaceInner />
    </OrganisationProvider>
  );
}
