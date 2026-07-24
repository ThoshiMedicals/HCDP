"use client";

import { ModuleLanding } from "@/components/workspaces/ModuleLanding";
import { getModule } from "@/lib/modules";
import { MODULE_ROUTE } from "./module.config";

/**
 * Module 18 entry — Next landing until detailed rebuild.
 * Does not use HTML iframe as the main experience.
 */
export function DigitalOperationsModule() {
  const slug = MODULE_ROUTE.replace(/^\//, "");
  const mod = getModule(slug);
  if (!mod) {
    return (
      <div className="rounded-2xl border border-[var(--v34-card-line)] bg-[var(--card)] p-6">
        <h1 className="text-xl font-bold">Module 18</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Register entry missing for {MODULE_ROUTE}.</p>
      </div>
    );
  }
  return <ModuleLanding module={mod} />;
}
