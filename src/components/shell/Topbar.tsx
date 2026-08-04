"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCreateForm } from "@/components/forms/CreateFormProvider";
import { Icon } from "@/components/ui/Icon";
import {
  getInboxBadgeSnapshot,
  hydrateInboxBadge,
  subscribeInboxBadge,
} from "@/lib/action-inbox/badge";
import { usePortal } from "@/lib/portal-context";
import { useClinicContext } from "@/platform/context/clinic-context";
import { useIdentity } from "@/platform/context/identity-context";
import { searchPlatformNav } from "@/platform/navigation/nav-search";
import { modulesVisibleForRole } from "@/platform/module-registry";
import { cn } from "@/lib/cn";

const ONLINE_STORE = "pulse.v31.online";

function readOnline(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = window.localStorage.getItem(ONLINE_STORE);
    if (raw === null) return true;
    return raw !== "0" && raw !== "false";
  } catch {
    return true;
  }
}

function writeOnline(online: boolean) {
  try {
    window.localStorage.setItem(ONLINE_STORE, online ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { setSidebarOpen, pushToast } = usePortal();
  const {
    selection,
    groups,
    locations,
    setAllClinics,
    setSingleClinic,
    setClinicGroup,
    scopeLabel,
  } = useClinicContext();
  const { identity } = useIdentity();
  const { openCreate } = useCreateForm();
  const [openCount, setOpenCount] = useState(0);
  const [online, setOnline] = useState(true);
  const [ribbonSearch, setRibbonSearch] = useState("");

  useEffect(() => {
    hydrateInboxBadge();
    const refresh = () => setOpenCount(getInboxBadgeSnapshot().count);
    queueMicrotask(() => {
      setOnline(readOnline());
      refresh();
    });
    return subscribeInboxBadge(refresh);
  }, []);

  const onDashboard = pathname === "/dashboard" || pathname === "/";
  const onInbox = pathname.startsWith("/action-inbox");

  function clinicSelectValue(): string {
    if (selection.mode === "all") return "all";
    if (selection.mode === "group" && selection.groupId) return `group:${selection.groupId}`;
    if (selection.mode === "single" && selection.selectedClinicIds[0]) {
      return selection.selectedClinicIds[0];
    }
    if (selection.mode === "multiple") return "multiple";
    return "all";
  }

  function onClinicChange(value: string) {
    if (value === "all") setAllClinics();
    else if (value.startsWith("group:")) setClinicGroup(value.slice(6));
    else if (value === "multiple") {
      pushToast("Use Command Centre multi-clinic controls for custom multi-select (executive).", "default");
    } else setSingleClinic(value);
  }

  function runRibbonSearch() {
    const q = ribbonSearch.trim();
    if (!q) {
      pushToast("Enter a module or section keyword.", "warn");
      return;
    }
    const visible = modulesVisibleForRole(identity.role);
    const hits = searchPlatformNav(q, visible);
    if (hits[0]) {
      router.push(hits[0].href);
      pushToast(`Opened ${hits[0].matchLabel}`);
      return;
    }
    pushToast(`No module or section matched “${q}”.`, "warn");
  }

  function toggleOnline() {
    const next = !online;
    setOnline(next);
    writeOnline(next);
    pushToast(
      next
        ? "Connection Healthy — operational summaries are current."
        : "Offline Continuity — local capture continues; sync when online (demo).",
      next ? "success" : "warn"
    );
  }

  return (
    <div className="pulse-top-ribbon sticky top-0 z-[3] flex min-h-[52px] flex-wrap items-center justify-between gap-2 border-b border-[var(--v34-card-line)] bg-[var(--card)] px-[10px] py-1.5 text-[var(--ink)] lg:flex-nowrap lg:px-[14px]">
      <div className="ribbon-left flex min-w-0 flex-1 items-center gap-2 lg:flex-none">
        <button
          type="button"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[var(--v34-card-line)] bg-[var(--card)] text-[var(--muted)] lg:hidden"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          ☰
        </button>
        <div className="brand-compact" aria-label="Doctors Pulse Operations Portal">
          <div className="brand-dot" aria-hidden>
            H
          </div>
          <div className="brand-compact-text">
            <strong>Doctors Pulse</strong>
            <small>Operations Portal</small>
          </div>
        </div>
        <div className="flex min-w-0 flex-col">
          <select
            className="clinic-select-compact"
            value={clinicSelectValue()}
            onChange={(e) => onClinicChange(e.target.value)}
            aria-label="Clinic scope"
            title={scopeLabel}
          >
            <option value="all">All Clinics</option>
            {groups.map((g) => (
              <option key={g.id} value={`group:${g.id}`}>
                Clinic Group · {g.name}
              </option>
            ))}
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                Single · {loc.shortName}
              </option>
            ))}
            {selection.mode === "multiple" ? (
              <option value="multiple">Multiple Clinics · {selection.selectedClinicIds.length}</option>
            ) : null}
          </select>
          <span className="hidden pl-1 text-[length:var(--type-control)] font-semibold text-[var(--muted)] sm:block">
            Scope: {scopeLabel}
          </span>
        </div>
      </div>

      <div className="ribbon-center order-3 flex w-full min-w-0 justify-center lg:order-none lg:max-w-[440px] lg:flex-1">
        <label className="search-compact flex h-9 w-full max-w-[520px] items-center gap-2 rounded-[10px] border border-[#d7e1ec] bg-[var(--soft)] px-2.5 text-[#718096]">
          <Icon name="search" className="h-3.5 w-3.5 shrink-0" />
          <input
            type="search"
            className="w-full border-0 bg-transparent text-[length:var(--type-control)] font-semibold text-[var(--ink)] outline-none placeholder:text-[#8a96a8]"
            placeholder="Search modules and sections..."
            aria-label="Search modules and sections"
            value={ribbonSearch}
            onChange={(e) => setRibbonSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") runRibbonSearch();
            }}
          />
        </label>
      </div>

      <div className="ribbon-right flex shrink-0 items-center gap-1.5 overflow-x-auto sm:gap-2">
        <div className="seg-mini">
          <Link href="/dashboard" className={cn(onDashboard && "active")}>
            Dashboard
          </Link>
          <Link href="/action-inbox" className={cn(onInbox && "active")}>
            Action Inbox{openCount ? ` ${openCount}` : ""}
          </Link>
        </div>
        <button
          type="button"
          className="hidden rounded-[10px] border border-[var(--hcdp-status-info-border)] bg-[var(--hcdp-status-info-surface)] px-2.5 py-1.5 text-sm font-bold text-[var(--hcdp-status-info-text)] md:inline-flex"
          onClick={() => openCreate("locations")}
        >
          + New Entry
        </button>
        <button
          type="button"
          className="hidden rounded-[10px] border border-[var(--v34-card-line)] bg-[var(--card)] px-2.5 py-1.5 text-sm font-bold text-[var(--ink)] md:inline-flex"
          onClick={() =>
            pushToast("Portal export requires a reporting backend. Use Command Centre Export for local demo packs.", "default")
          }
        >
          Export
        </button>
        <button
          type="button"
          className="hidden items-center gap-1.5 rounded-[10px] border border-[var(--v34-card-line)] bg-[var(--soft)] px-2 py-1 text-[length:var(--type-control)] font-bold text-[var(--muted)] lg:inline-flex"
          onClick={() =>
            pushToast("Enterprise Sign-In · MFA requires a live authentication backend (demo).", "default")
          }
        >
          <Icon name="shield" className="h-3.5 w-3.5 text-[var(--theme-primary)]" />
          Enterprise Sign-In · MFA
        </button>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-[10px] border px-2 py-1 text-[length:var(--type-control)] font-bold",
            online
              ? "border-[var(--hcdp-status-success-border)] bg-[var(--hcdp-status-success-surface)] text-[var(--hcdp-status-success-text)]"
              : "border-[var(--hcdp-status-warning-border)] bg-[var(--hcdp-status-warning-surface)] text-[var(--hcdp-status-warning-text)]"
          )}
          onClick={toggleOnline}
          aria-label={online ? "Online" : "Offline"}
        >
          {online ? "Online" : "Offline"}
        </button>
      </div>
    </div>
  );
}
