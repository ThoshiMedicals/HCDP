"use client";

import { Suspense } from "react";
import { ActionInboxApp } from "./action-inbox/ActionInboxApp";

/** Module 2 — Action Inbox & Notifications */
export function ActionInboxWorkspace() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-[40vh] place-items-center rounded-2xl border border-[var(--v34-card-line)] bg-[var(--card)] p-10 text-sm text-[var(--muted)]">
          Loading your actions…
        </div>
      }
    >
      <ActionInboxApp />
    </Suspense>
  );
}
