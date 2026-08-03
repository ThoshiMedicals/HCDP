"use client";

import { CommandCentre } from "./command-centre/CommandCentre";

/** Module 1 — Owner/Director Command Centre (single title owned by CommandCentre). */
export function DashboardWorkspace() {
  return (
    <div data-dashboard-hierarchy="executive-v2">
      <CommandCentre />
    </div>
  );
}
