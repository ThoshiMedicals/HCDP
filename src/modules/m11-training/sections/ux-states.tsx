"use client";

import { useEffect, useState } from "react";
import { Panel, PanelSub, PanelTitle } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 py-8 text-sm text-[#64748b]" role="status" aria-live="polite">
      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[var(--teal-6)] border-t-transparent" />
      {label}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <Panel>
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <div className="text-3xl select-none" aria-hidden="true">📭</div>
        <div>
          <div className="font-semibold text-[var(--ink)]">{title}</div>
          {description ? <p className="mt-1 text-sm text-[#64748b]">{description}</p> : null}
        </div>
        {action ? (
          <Button variant="teal" small onClick={action.onClick}>
            {action.label}
          </Button>
        ) : null}
      </div>
    </Panel>
  );
}

export function FilteredEmptyState({
  onClear,
}: {
  onClear?: () => void;
}) {
  return (
    <Panel>
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <div className="text-3xl select-none" aria-hidden="true">🔍</div>
        <div>
          <div className="font-semibold text-[var(--ink)]">No results match the current filter</div>
          <p className="mt-1 text-sm text-[#64748b]">Try adjusting or clearing the filter.</p>
        </div>
        {onClear ? (
          <Button variant="line" small onClick={onClear}>
            Clear filter
          </Button>
        ) : null}
      </div>
    </Panel>
  );
}

export function RestrictedState({
  permission,
  message,
}: {
  permission?: string;
  message?: string;
}) {
  return (
    <Panel>
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <div className="text-3xl select-none" aria-hidden="true">🔒</div>
        <div>
          <div className="font-semibold text-[var(--ink)]">Access restricted</div>
          <p className="mt-1 text-sm text-[#64748b]">
            {message ?? (permission
              ? `You need the "${permission}" permission to view this section.`
              : "You do not have permission to view this section.")}
          </p>
        </div>
      </div>
    </Panel>
  );
}

export function ValidationErrorState({
  errors,
  onDismiss,
}: {
  errors: string[];
  onDismiss?: () => void;
}) {
  if (!errors.length) return null;
  return (
    <div
      role="alert"
      className="rounded-lg border border-[#fca5a5] bg-[#fef2f2] px-4 py-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold text-[#b91c1c] text-sm">Please fix the following:</div>
          <ul className="mt-1 list-disc pl-4 text-sm text-[#991b1b]">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="mt-0.5 text-[#b91c1c] hover:opacity-70"
            aria-label="Dismiss errors"
          >
            ✕
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function SystemErrorState({
  error,
  onRetry,
}: {
  error: string;
  onRetry?: () => void;
}) {
  return (
    <Panel>
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <div className="text-3xl select-none" aria-hidden="true">⚠️</div>
        <div>
          <div className="font-semibold text-[var(--ink)]">Something went wrong</div>
          <p className="mt-1 text-sm text-[#64748b]">{error}</p>
        </div>
        {onRetry ? (
          <Button variant="line" small onClick={onRetry}>
            Retry
          </Button>
        ) : null}
      </div>
    </Panel>
  );
}

export function OfflineState() {
  const [offline, setOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false
  );

  useEffect(() => {
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  if (!offline) return null;

  return (
    <Panel>
      <PanelTitle>You are offline</PanelTitle>
      <PanelSub>
        Changes cannot be saved until your connection is restored. Read-only data may still be
        available from local storage.
      </PanelSub>
    </Panel>
  );
}
