"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { QaCardState } from "@/lib/command-centre/cc-extras";

const CARD_STATES: Array<{ value: QaCardState | null; label: string }> = [
  { value: null, label: "Normal (ready)" },
  { value: "loading", label: "Loading" },
  { value: "empty", label: "Empty" },
  { value: "no-match", label: "No matching records" },
  { value: "incomplete", label: "Data incomplete" },
  { value: "stale", label: "Stale data" },
  { value: "error", label: "Error" },
  { value: "permission", label: "Permission denied" },
];

export function QaDemoMenu({
  onSimulateNextDay,
  onSetCardState,
  onResetActions,
}: {
  onSimulateNextDay: () => void;
  onSetCardState: (state: QaCardState | null) => void;
  onResetActions: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="cc-ctrl border-dashed cc-text-warn"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        title="Demonstration / QA tools only — not for production use"
      >
        QA Demo ▾
      </button>
      {open ? (
        <div className="absolute right-0 top-[110%] z-50 w-[280px] rounded-xl border border-[var(--cc-card-line)] bg-[var(--cc-card)] p-2 shadow-xl">
          <div className="cc-demo-banner mb-2 text-[10px]">
            Demonstration / QA only — these controls simulate behaviour locally.
          </div>
          <button
            type="button"
            className="mb-1 flex w-full rounded-lg px-2.5 py-2 text-left text-xs font-semibold hover:bg-[var(--cc-soft)]"
            onClick={() => {
              onSimulateNextDay();
              setOpen(false);
            }}
          >
            Simulate Next Day
          </button>
          <div className="my-2 border-t border-[var(--cc-card-line)]" />
          <div className="mb-1 px-1 text-[10px] font-extrabold uppercase text-[var(--cc-muted)]">
            Force card states
          </div>
          {CARD_STATES.map(({ value, label }) => (
            <button
              key={label}
              type="button"
              className="flex w-full rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold hover:bg-[var(--cc-soft)]"
              onClick={() => {
                onSetCardState(value);
                setOpen(false);
              }}
            >
              {label}
            </button>
          ))}
          <div className="my-2 border-t border-[var(--cc-card-line)]" />
          <Button
            small
            variant="warn"
            className="w-full"
            onClick={() => {
              if (window.confirm("Reset Module 1 actions to seed data? Local edits will be lost.")) {
                onResetActions();
                setOpen(false);
              }
            }}
          >
            Reset actions to seed
          </Button>
        </div>
      ) : null}
    </div>
  );
}
