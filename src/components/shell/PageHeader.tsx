"use client";

import Link from "next/link";
import type { ModuleDef } from "@/lib/modules";
import { locationName } from "@/lib/mock/data";
import { usePortal } from "@/lib/portal-context";
import { Icon } from "@/components/ui/Icon";

export function PageHeader({ module }: { module: ModuleDef }) {
  const { activeLocation, activeLocationId, locations } = usePortal();

  return (
    <header className="flex min-h-[74px] items-center justify-between gap-3 border-b border-[var(--v34-card-line)] bg-[var(--card)] px-4 py-3 lg:px-7">
      <div className="page-title min-w-0">
        <div className="hcdp-type-control mb-1">{module.group}</div>
        <h1 className="hcdp-type-display mb-1.5 truncate">{module.title}</h1>
        <p className="hcdp-type-body m-0 text-[var(--muted)]">
          {module.subtitle}
          {" · "}
          <span className="font-semibold text-[var(--ink)]">
            {activeLocation?.shortName ?? locationName(activeLocationId, locations)}
          </span>
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/action-inbox"
          className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--v34-card-line)] bg-[var(--card)] text-[var(--muted)] shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
          title="Open Action Inbox"
          aria-label="Open Action Inbox"
        >
          <Icon name="bell" />
        </Link>
      </div>
    </header>
  );
}
