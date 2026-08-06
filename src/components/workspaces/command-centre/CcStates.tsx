"use client";

import { Button } from "@/components/ui/Button";
import { CcCard } from "./cc-ui";
import { cn } from "@/lib/cn";

export type CardDataState =
  | "loading"
  | "ready"
  | "empty"
  | "no-match"
  | "incomplete"
  | "stale"
  | "error"
  | "permission";

export function CardStateFrame({
  state,
  children,
  lastUpdated,
  source,
  onRetry,
  onOpenSource,
  onCreateFollowUp,
  className,
}: {
  state: CardDataState;
  children: React.ReactNode;
  lastUpdated?: string;
  source?: string;
  onRetry?: () => void;
  onOpenSource?: () => void;
  onCreateFollowUp?: () => void;
  className?: string;
}) {
  if (state === "ready") return <>{children}</>;

  const copy: Record<Exclude<CardDataState, "ready">, { title: string; body: string }> = {
    loading: { title: "Loading", body: "Retrieving the latest demonstration data…" },
    empty: { title: "No data", body: "Nothing is available for this section yet." },
    "no-match": { title: "No matching records", body: "Try clearing priority, category or clinic filters." },
    incomplete: {
      title: "Data incomplete",
      body: "Some source fields are missing. Incomplete areas do not reduce clinic health scores.",
    },
    stale: {
      title: "Data may be outdated",
      body: "The last successful update is older than expected for this demonstration refresh cycle.",
    },
    error: {
      title: "Error retrieving information",
      body: "A demonstration error occurred while loading this card.",
    },
    permission: {
      title: "Permission unavailable",
      body: "This information is outside the current role demonstration permissions.",
    },
  };

  const c = copy[state];

  return (
    <CcCard className={cn(className)}>
      <div className="px-4 py-5">
        <div className="text-[13px] font-extrabold">{c.title}</div>
        <p className="m-0 mt-1 text-[length:var(--type-control)] text-[var(--cc-muted)]">{c.body}</p>
        {lastUpdated ? (
          <p className="m-0 mt-1 text-[length:var(--type-control)] text-[var(--cc-muted)]">Last successful update: {lastUpdated}</p>
        ) : null}
        {source ? <p className="m-0 text-[length:var(--type-control)] text-[var(--cc-muted)]">Source: {source}</p> : null}
        <div className="mt-3 flex flex-wrap gap-2">
          {onRetry ? (
            <Button small variant="line" onClick={onRetry}>
              Retry
            </Button>
          ) : null}
          {onOpenSource ? (
            <Button small variant="soft" onClick={onOpenSource}>
              Open source record
            </Button>
          ) : null}
          {onCreateFollowUp ? (
            <Button small variant="teal" onClick={onCreateFollowUp}>
              Create follow-up action
            </Button>
          ) : null}
        </div>
        <p className="m-0 mt-3 text-[length:var(--type-control)] text-[var(--cc-muted)]">
          Live source connectivity requires a future backend connection.
        </p>
      </div>
    </CcCard>
  );
}

export function FilterSentenceBar({
  sentence,
  onClear,
}: {
  sentence: string;
  onClear?: () => void;
}) {
  return (
    <div
      data-cc-filter-sentence="true"
      className="cc-surface-info flex w-full min-w-0 max-w-full flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 text-[length:var(--type-control)] font-semibold"
    >
      <span className="min-w-0 max-w-full flex-1 basis-[min(100%,12rem)] leading-snug break-words">
        {sentence}
      </span>
      {onClear ? (
        <Button small variant="line" className="max-w-full shrink-0" onClick={onClear}>
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}

export function BackendHint({ children }: { children: React.ReactNode }) {
  return <p className="m-0 text-[length:var(--type-control)] leading-snug text-[var(--cc-muted)]">{children}</p>;
}
