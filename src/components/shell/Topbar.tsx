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
import { useQaDemoMode } from "@/platform/context/qa-demo-mode";
import { searchPlatformNav } from "@/platform/navigation/nav-search";
import { modulesVisibleForRole } from "@/platform/module-registry";
import { cn } from "@/lib/cn";

const ONLINE_STORE = "pulse.v31.online";

const EXPORT_UNAVAILABLE =
  "Unavailable — portal export requires a reporting backend (not implemented in P1).";
const MFA_UNAVAILABLE =
  "Unavailable — Enterprise MFA requires a live authentication backend (not implemented in P1).";
const MULTI_CLINIC_GUIDANCE =
  "Shell multi-clinic selection is not available. Use Command Centre multi-clinic controls.";

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
  const { sidebarOpen, setSidebarOpen, pushToast } = usePortal();
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
  const { qaDemoMode } = useQaDemoMode();
  const { openCreate } = useCreateForm();
  const [openCount, setOpenCount] = useState(0);
  const [online, setOnline] = useState(true);
  const [ribbonSearch, setRibbonSearch] = useState("");
  const [exportExplainFocused, setExportExplainFocused] = useState(false);
  const [mfaExplainFocused, setMfaExplainFocused] = useState(false);

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
      // OWN-P1-005 — Accepted difference: Command Centre only. Not a success toast.
      pushToast(MULTI_CLINIC_GUIDANCE, "warn");
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
    if (!qaDemoMode) return;
    const next = !online;
    setOnline(next);
    writeOnline(next);
    pushToast(
      next
        ? "Demo simulation: Online — browser-local continuity flag only (not live connectivity monitoring)."
        : "Demo simulation: Offline — browser-local continuity flag only (not live connectivity monitoring).",
      "default"
    );
  }

  return (
    <div
      className="pulse-top-ribbon sticky top-0 z-[3] flex h-[var(--topbar-height)] max-h-[var(--topbar-height)] w-full min-w-0 max-w-full flex-nowrap items-center justify-between gap-2 overflow-x-auto overflow-y-hidden border-b border-[var(--dp-border-subtle,var(--v34-card-line))] bg-[var(--dp-bg-topbar,var(--card))] px-[10px] text-[var(--ink)] xl:px-[14px]"
      data-shell-region="topbar"
      data-testid="shell-topbar"
      style={{ height: "var(--topbar-height)", minHeight: "var(--topbar-height)" }}
    >
      <div className="ribbon-left flex min-w-0 shrink-0 items-center gap-2">
        <button
          type="button"
          className="grid h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 place-items-center rounded-xl border border-[var(--dp-border-subtle,var(--v34-card-line))] bg-[var(--card)] text-[var(--muted)] md:hidden"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? "Close menu" : "Open menu"}
          aria-expanded={sidebarOpen}
          aria-controls="shell-sidebar-nav"
          data-testid="shell-mobile-menu"
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
        <select
          className="clinic-select-compact"
          value={clinicSelectValue()}
          onChange={(e) => onClinicChange(e.target.value)}
          aria-label="Clinic scope"
          title={`Scope: ${scopeLabel}. Multi-clinic custom selection is available in Command Centre only.`}
          data-testid="shell-clinic-scope"
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
            <option value="multiple">
              Multiple Clinics · {selection.selectedClinicIds.length} (set in Command Centre)
            </option>
          ) : null}
        </select>
      </div>

      <div className="ribbon-center flex min-w-[10rem] max-w-[440px] flex-1 justify-center">
        <label className="search-compact flex h-8 w-full min-w-[10rem] max-w-[520px] items-center gap-2 rounded-[10px] border border-[#d7e1ec] bg-[var(--soft)] px-2.5 text-[#718096]">
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

      <div className="ribbon-right flex min-w-0 max-w-full items-center gap-1.5 overflow-x-auto sm:gap-2">
        {qaDemoMode ? (
          <span
            className="hidden shrink-0 rounded-[10px] border border-[var(--hcdp-status-warn-border,#f59e0b)] bg-[var(--hcdp-status-warn-surface,#fffbeb)] px-2 py-1 text-[length:var(--type-control)] font-extrabold uppercase tracking-wide text-[var(--hcdp-status-warn-text,#92400e)] xl:inline-flex"
            role="status"
            data-testid="shell-qa-demo-banner"
            title="QA / Demo mode — demonstration facility only; not a production security boundary"
          >
            QA / Demo mode
          </span>
        ) : null}
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
          className="hidden shrink-0 rounded-[10px] border border-[var(--hcdp-status-info-border)] bg-[var(--hcdp-status-info-surface)] px-2.5 py-1.5 text-sm font-bold text-[var(--hcdp-status-info-text)] xl:inline-flex"
          onClick={() => openCreate("locations")}
          data-testid="shell-new-entry"
          title="Create a location record in this browser (local demo storage)"
          aria-label="New Entry — create location (local demo storage)"
        >
          + New Entry
        </button>
        <div className="relative hidden shrink-0 xl:block" data-testid="shell-export-unavailable-wrap">
          <button
            type="button"
            className="inline-flex cursor-not-allowed rounded-[10px] border border-[var(--v34-card-line)] bg-[var(--soft)] px-2.5 py-1.5 text-sm font-bold text-[var(--muted)] opacity-70"
            aria-disabled="true"
            data-testid="shell-export-unavailable"
            aria-describedby="shell-export-unavailable-desc"
            aria-label="Export — unavailable. Portal export requires a reporting backend (not implemented in P1). Non-operational."
            onFocus={() => setExportExplainFocused(true)}
            onBlur={() => setExportExplainFocused(false)}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
          >
            Export
            <span className="ml-1 text-[length:var(--type-meta)] font-extrabold uppercase tracking-wide" aria-hidden>
              Unavailable
            </span>
          </button>
          <span
            id="shell-export-unavailable-desc"
            role="note"
            data-testid="shell-export-unavailable-desc"
            className={
              exportExplainFocused
                ? "fixed bottom-[18px] left-[18px] z-[90] max-w-[22rem] rounded-md border border-[var(--v34-card-line)] bg-[var(--card)] px-3 py-2 text-[length:var(--type-meta)] font-semibold leading-snug text-[var(--ink)] shadow-lg"
                : "sr-only"
            }
          >
            {EXPORT_UNAVAILABLE} This control is non-operational and does not run an export.
          </span>
        </div>
        <div className="relative hidden shrink-0 xl:block" data-testid="shell-mfa-unavailable-wrap">
          <button
            type="button"
            className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-[10px] border border-[var(--v34-card-line)] bg-[var(--soft)] px-2 py-1 text-[length:var(--type-control)] font-bold text-[var(--muted)] opacity-70"
            aria-disabled="true"
            data-testid="shell-mfa-unavailable"
            aria-describedby="shell-mfa-unavailable-desc"
            aria-label="Enterprise Sign-In · MFA — unavailable. Requires a live authentication backend (not implemented in P1). Non-operational."
            onFocus={() => setMfaExplainFocused(true)}
            onBlur={() => setMfaExplainFocused(false)}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
          >
            <Icon name="shield" className="h-3.5 w-3.5 text-[var(--muted)]" aria-hidden />
            Enterprise MFA
            <span className="text-[length:var(--type-meta)] font-extrabold uppercase tracking-wide" aria-hidden>
              Unavailable
            </span>
          </button>
          <span
            id="shell-mfa-unavailable-desc"
            role="note"
            data-testid="shell-mfa-unavailable-desc"
            className={
              mfaExplainFocused
                ? "fixed bottom-[18px] left-[18px] z-[90] max-w-[22rem] rounded-md border border-[var(--v34-card-line)] bg-[var(--card)] px-3 py-2 text-[length:var(--type-meta)] font-semibold leading-snug text-[var(--ink)] shadow-lg"
                : "sr-only"
            }
          >
            {MFA_UNAVAILABLE} This control is non-operational and does not verify MFA.
          </span>
        </div>
        {qaDemoMode ? (
          <button
            type="button"
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-[10px] border px-2 py-1 text-[length:var(--type-control)] font-bold",
              online
                ? "border-[var(--hcdp-status-success-border)] bg-[var(--hcdp-status-success-surface)] text-[var(--hcdp-status-success-text)]"
                : "border-[var(--hcdp-status-warning-border)] bg-[var(--hcdp-status-warning-surface)] text-[var(--hcdp-status-warning-text)]"
            )}
            onClick={toggleOnline}
            data-testid="shell-online-demo-toggle"
            aria-label={
              online
                ? "Online — browser demo simulation (not live connectivity)"
                : "Offline — browser demo simulation (not live connectivity)"
            }
            title="Demo simulation only — not live platform connectivity monitoring"
          >
            {online ? "Online (demo)" : "Offline (demo)"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
