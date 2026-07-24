"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ModuleDef } from "@/lib/modules";
import {
  conditionLabel,
  getPlatformModule,
  type PlatformModule,
} from "@/platform/module-registry";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

function resolvePlatform(module: ModuleDef): PlatformModule | undefined {
  return getPlatformModule(module.platformId) ?? getPlatformModule(module.id);
}

export function ModuleLanding({
  module,
  children,
}: {
  module: ModuleDef;
  /** Optional partial Next UI for partially-implemented modules */
  children?: React.ReactNode;
}) {
  const search = useSearchParams();
  const section = search.get("section");
  const plat = resolvePlatform(module);
  if (!plat) {
    return (
      <div className="rounded-2xl border border-[var(--v34-card-line)] bg-[var(--card)] p-6">
        <h1 className="text-xl font-bold">{module.title}</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Module register entry missing.</p>
      </div>
    );
  }

  const activeSection = plat.sections.find((s) => s.id === section) ?? plat.sections[0];
  const isComplete = plat.condition === "complete-interactive-rebuild";
  const showPending = !isComplete;

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-[var(--v34-card-line)] bg-[var(--card)] p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] font-extrabold uppercase tracking-wide text-[var(--muted)]">
              Module {plat.number}
              {plat.tier === "enterprise" ? " · Enterprise Extension" : ""}
            </div>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[var(--ink)]">
              {plat.displayName}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--muted)]">{plat.purpose}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {showPending ? (
              <Badge tone="warn">Rebuild pending</Badge>
            ) : (
              <Badge tone="success">Interactive rebuild</Badge>
            )}
            <Badge tone="info">{conditionLabel(plat.condition)}</Badge>
            {plat.canCreateInboxEvents ? (
              <Badge tone="teal">Can create Action Inbox items</Badge>
            ) : (
              <Badge tone="default">Inbox events not wired yet</Badge>
            )}
          </div>
        </div>

        {showPending ? (
          <p className="mt-4 rounded-xl border border-[color-mix(in_srgb,#b45309_25%,var(--line))] bg-[color-mix(in_srgb,#b45309_8%,var(--card))] px-3 py-2 text-sm text-[#92400e]">
            This approved module is not fully rebuilt in Next yet. Use the section list below to navigate
            planned workspaces. The HTML prototype remains available for Development / QA at{" "}
            <Link href="/prototype-reference" className="font-bold underline">
              /prototype-reference
            </Link>
            .
          </p>
        ) : null}
      </header>

      <section className="rounded-2xl border border-[var(--v34-card-line)] bg-[var(--card)] p-5">
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-[var(--muted)]">
          Internal sections
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {plat.sections.map((s) => {
            const active = activeSection?.id === s.id;
            return (
              <Link
                key={s.id}
                href={`${plat.mainRoute}?section=${encodeURIComponent(s.id)}`}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm font-semibold transition",
                  active
                    ? "border-[var(--theme-primary)] bg-[color-mix(in_srgb,var(--theme-primary)_12%,var(--card))] text-[var(--theme-primary)]"
                    : "border-[var(--v34-card-line)] text-[var(--ink)] hover:bg-[var(--soft)]"
                )}
                aria-current={active ? "page" : undefined}
              >
                {s.label}
              </Link>
            );
          })}
        </div>
        {activeSection ? (
          <p className="mt-3 text-sm text-[var(--muted)]">
            Active section: <strong className="text-[var(--ink)]">{activeSection.label}</strong>
          </p>
        ) : null}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-[var(--v34-card-line)] bg-[var(--card)] p-5">
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-[var(--muted)]">
            Legacy features identified
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--ink)]">
            {plat.legacyFeatures.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-[var(--v34-card-line)] bg-[var(--card)] p-5">
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-[var(--muted)]">
            Related modules
          </h2>
          <ul className="mt-2 space-y-1 text-sm">
            {plat.relatedModuleIds.map((id) => {
              const rel = getPlatformModule(id);
              if (!rel) return null;
              return (
                <li key={id}>
                  <Link href={rel.mainRoute} className="font-semibold text-[var(--theme-primary)] underline">
                    {rel.number}. {rel.displayName}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      {children ? <div className="mt-2">{children}</div> : null}
    </div>
  );
}
