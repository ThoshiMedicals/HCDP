"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCreateForm } from "@/components/forms/CreateFormProvider";
import { Icon } from "@/components/ui/Icon";
import { getInboxBadgeSnapshot, subscribeInboxBadge } from "@/lib/action-inbox/badge";
import { locationName } from "@/lib/mock/data";
import { usePortal } from "@/lib/portal-context";

export function Topbar() {
  const { setSidebarOpen, pushToast, activeLocationId, locations } = usePortal();
  const { openCreate } = useCreateForm();
  const [openCount, setOpenCount] = useState(0);

  useEffect(() => {
    const refresh = () => setOpenCount(getInboxBadgeSnapshot().count);
    refresh();
    return subscribeInboxBadge(refresh);
  }, []);

  return (
    <div className="sticky top-0 z-[3] flex h-[52px] items-center justify-between gap-2 border-b border-[var(--v34-card-line)] bg-[var(--card)] px-[14px] text-[var(--ink)] lg:px-[22px]">
      <div className="flex min-w-0 items-center gap-2.5 font-bold text-[var(--ink)]">
        <button
          type="button"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[var(--v34-card-line)] bg-[var(--card)] text-[var(--muted)] lg:hidden"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          ☰
        </button>
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[color-mix(in_srgb,var(--theme-accent)_14%,var(--card))] text-[var(--theme-primary)]">
          <Icon name="shield" className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <div className="truncate text-sm leading-tight">Operations Portal</div>
          <div className="truncate text-[11px] font-semibold text-[var(--muted)]">
            {locationName(activeLocationId, locations)} · {openCount} open actions
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 overflow-x-auto sm:gap-2">
        <Link
          href="/prototype"
          className="hidden rounded-[10px] border border-[color-mix(in_srgb,#0f766e_35%,var(--line))] bg-[color-mix(in_srgb,#0f766e_10%,var(--card))] px-2.5 py-1.5 text-sm font-bold text-[#0f766e] sm:inline-flex"
          title="Full HTML codebase — every module, form and seed"
        >
          Full HTML
        </Link>
        <button
          type="button"
          className="hidden rounded-[10px] border border-[var(--line)] bg-[var(--card)] px-2.5 py-1.5 text-sm font-bold text-[var(--ink)] md:inline-flex"
          onClick={() => openCreate("locations")}
        >
          + Location
        </button>
        <Link
          href="/settings"
          className="rounded-[10px] border border-[var(--v34-card-line)] bg-[var(--card)] px-2.5 py-1.5 text-sm font-bold text-[var(--ink)]"
        >
          Settings
        </Link>
        <button
          type="button"
          className="rounded-[10px] border border-[var(--v34-card-line)] bg-[var(--card)] px-2.5 py-1.5 text-sm font-bold text-[var(--ink)]"
          onClick={() =>
            pushToast(
              "For complete UI/forms use Full HTML (exact HTML prototype).",
              "default"
            )
          }
        >
          Help
        </button>
      </div>
    </div>
  );
}
