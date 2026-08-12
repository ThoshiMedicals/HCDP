"use client";

/**
 * P1-B1 harness-only probe: mounts shared DetailPanel / KPI / toolbar primitives
 * when sessionStorage `p1-b1-harness-probe` === "1". Not part of product UX.
 */
import { useEffect, useState, useSyncExternalStore } from "react";
import { DetailPanel } from "@/components/shell/DetailPanel";
import { KpiStrip } from "@/components/shell/KpiStrip";
import { PrimaryToolbar } from "@/components/shell/PrimaryToolbar";

function subscribeProbe() {
  return () => {};
}

function getProbeSnapshot() {
  try {
    return window.sessionStorage.getItem("p1-b1-harness-probe") === "1";
  } catch {
    return false;
  }
}

function getProbeServerSnapshot() {
  return false;
}

export function ShellHarnessProbe() {
  const enabled = useSyncExternalStore(subscribeProbe, getProbeSnapshot, getProbeServerSnapshot);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    function onMessage(e: MessageEvent) {
      if (!e.data || typeof e.data !== "object") return;
      if (e.data.type === "p1-b1-detail-open") setDetailOpen(true);
      if (e.data.type === "p1-b1-detail-close") setDetailOpen(false);
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      data-testid="shell-harness-probe"
      className="fixed bottom-3 left-1/2 z-[70] w-[min(420px,92vw)] -translate-x-1/2 rounded-xl border border-[var(--dp-border-subtle)] bg-[var(--dp-bg-surface)] p-3 shadow-lg"
    >
      <KpiStrip
        items={[
          { id: "k1", label: "Harness KPI", value: "1", tone: "default" },
          { id: "k2", label: "Probe", value: "OK", tone: "ontrack" },
        ]}
      />
      <PrimaryToolbar
        leading={
          <button
            type="button"
            data-testid="shell-harness-open-detail"
            className="rounded-lg border border-[var(--dp-border-subtle)] px-3 py-2 text-sm font-semibold"
            onClick={() => setDetailOpen(true)}
          >
            Open detail panel
          </button>
        }
      />
      <DetailPanel
        open={detailOpen}
        title="Harness detail panel"
        subtitle="P1-B1 probe — not product content"
        onClose={() => setDetailOpen(false)}
        mode="drawer"
      >
        <p className="m-0 text-sm text-[var(--dp-text-secondary)]">
          Shared DetailPanel primitive exercised by the P1-B1 acceptance harness.
        </p>
      </DetailPanel>
    </div>
  );
}
