"use client";

import { CommandCentre } from "./command-centre/CommandCentre";

/** Module 1 — Owner/Director Command Centre (single title owned by CommandCentre). */
export function DashboardWorkspace() {
  return (
    <div className="min-w-0 max-w-full" data-dashboard-hierarchy="executive-v2">
      <CommandCentre />
    </div>
  );
}
