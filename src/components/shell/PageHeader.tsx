"use client";

import Link from "next/link";
import type { ModuleDef } from "@/lib/modules";
import { locationName } from "@/lib/mock/data";
import { usePortal } from "@/lib/portal-context";
import { Icon } from "@/components/ui/Icon";

export function PageHeader({ module }: { module: ModuleDef }) {
  const { activeLocation, activeLocationId, locations, pushToast } = usePortal();

  return (
    <header className="flex min-h-[74px] items-center justify-between gap-3 border-b border-[var(--v34-card-line)] bg-white px-4 py-3 lg:px-7">
      <div className="page-title min-w-0">
        <div className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.08em] text-[var(--muted)]">
          {module.group}
        </div>
        <h1 className="mb-1.5 truncate text-[22px] font-extrabold tracking-tight">
          {module.title}
        </h1>
        <p className="m-0 text-[13px] text-[#657287]">
          {module.subtitle}
          {" · "}
          <span className="font-semibold text-[#334155]">
            {activeLocation?.shortName ?? locationName(activeLocationId, locations)}
          </span>
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--v34-card-line)] bg-white text-[#54657a] shadow-sm"
          title="Refresh"
          onClick={() =>
            pushToast("View refreshed from extracted HTML mock data.", "success")
          }
        >
          <Icon name="task" />
        </button>
        <Link
          href="/action-inbox"
          className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--v34-card-line)] bg-white text-[#54657a] shadow-sm"
          title="Notifications"
        >
          <Icon name="bell" />
        </Link>
      </div>
    </header>
  );
}
