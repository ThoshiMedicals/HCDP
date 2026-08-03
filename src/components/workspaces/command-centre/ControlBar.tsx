"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { HealthDot } from "./cc-ui";
import type { CcAppearance, ClinicGroup, ClinicHealthProfile, LayoutPeriod } from "@/lib/command-centre/types";
import type { CustomRange } from "@/lib/command-centre/period-engine";
import type { SavedLayout } from "@/lib/command-centre/storage";
import type { Location } from "@/lib/types";
import { formatClock } from "@/lib/command-centre/utils";
import { cn } from "@/lib/cn";
import { QaDemoMenu } from "./QaDemoMenu";
import type { QaCardState } from "@/lib/command-centre/cc-extras";

const PERIOD_OPTIONS: LayoutPeriod[] = [
  "Today",
  "Yesterday",
  "This Week",
  "Last 7 Days",
  "This Month",
  "Last Month",
  "Current Quarter",
  "Custom Range",
];

const NORTH_CORRIDOR_IDS = ["loc_baldhills", "loc_lawnton", "loc_beachmere"];

export function ControlBar({
  locations,
  health,
  clinicGroups,
  onSaveClinicGroup,
  selectedClinicIds,
  onChangeClinics,
  period,
  onPeriod,
  customRange,
  onCustomRange,
  onOpenCustomRange,
  layoutName,
  layouts,
  onSelectLayout,
  onLayout,
  searchQuery,
  onSearch,
  lastUpdated,
  nextRefresh,
  paused,
  onRefreshNow,
  onTogglePause,
  onPublish,
  onCreateAction,
  onCustomise,
  onExport,
  onNotifications,
  unsavedLayout,
  appearance,
  onAppearance,
  notificationCounts,
  onQaSimulateNextDay,
  onQaSetCardState,
  onQaResetActions,
  onTemplatesRecurring,
  onSignOut,
  onAppearanceReminder,
}: {
  locations: Location[];
  health: ClinicHealthProfile[];
  clinicGroups: ClinicGroup[];
  onSaveClinicGroup: (name: string, ids: string[]) => void;
  selectedClinicIds: string[];
  onChangeClinics: (ids: string[]) => void;
  period: LayoutPeriod;
  onPeriod: (p: LayoutPeriod) => void;
  customRange?: CustomRange | null;
  onCustomRange?: (range: CustomRange) => void;
  onOpenCustomRange?: () => void;
  layoutName: string;
  layouts?: SavedLayout[];
  onSelectLayout?: (id: string) => void;
  onLayout: () => void;
  searchQuery: string;
  onSearch: (q: string) => void;
  lastUpdated: Date;
  nextRefresh: Date;
  paused: boolean;
  onRefreshNow: () => void;
  onTogglePause: () => void;
  onPublish: () => void;
  onCreateAction: () => void;
  onCustomise: () => void;
  onExport: () => void;
  onNotifications: () => void;
  unsavedLayout: boolean;
  appearance: CcAppearance;
  onAppearance: (a: CcAppearance) => void;
  notificationCounts: { emergency: number; unread: number; approvals: number };
  onQaSimulateNextDay?: () => void;
  onQaSetCardState?: (state: QaCardState | null) => void;
  onQaResetActions?: () => void;
  onTemplatesRecurring?: () => void;
  onSignOut?: () => void;
  onAppearanceReminder?: () => void;
}) {
  const [clinicsOpen, setClinicsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [layoutsOpen, setLayoutsOpen] = useState(false);
  const clinicsRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const layoutsRef = useRef<HTMLDivElement>(null);

  const healthMap = Object.fromEntries(health.map((h) => [h.locationId, h]));
  const urgentClinicIds = health
    .filter((h) => h.urgentIssues > 0 || h.emergencyStatus || h.band === "Urgent Review")
    .map((h) => h.locationId);
  const allSelected =
    selectedClinicIds.length === 0 || selectedClinicIds.length === locations.length;
  const canSaveGroup = selectedClinicIds.length > 0;
  const northCorridorGroup = clinicGroups.find((g) => g.name.toLowerCase().includes("north corridor"));
  const otherClinicGroups = clinicGroups.filter((g) => g !== northCorridorGroup);
  const totalNotes =
    notificationCounts.emergency + notificationCounts.unread + notificationCounts.approvals;

  function toggleClinic(id: string) {
    if (selectedClinicIds.includes(id)) {
      onChangeClinics(selectedClinicIds.filter((x) => x !== id));
    } else {
      onChangeClinics([...selectedClinicIds, id]);
    }
  }

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (clinicsRef.current && !clinicsRef.current.contains(t)) setClinicsOpen(false);
      if (moreRef.current && !moreRef.current.contains(t)) setMoreOpen(false);
      if (userRef.current && !userRef.current.contains(t)) setUserOpen(false);
      if (layoutsRef.current && !layoutsRef.current.contains(t)) setLayoutsOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function handlePeriodChange(next: LayoutPeriod) {
    if (next === "Custom Range") {
      onOpenCustomRange?.();
      onPeriod(next);
      return;
    }
    onPeriod(next);
  }

  return (
    <div className="sticky top-0 z-30 border-b border-[var(--cc-card-line)] bg-[color-mix(in_srgb,var(--cc-canvas)_94%,var(--cc-card))] backdrop-blur-md">
      <div className="mx-auto w-full max-w-[1480px] px-4 py-2.5 lg:px-7">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative" ref={clinicsRef}>
            <button
              type="button"
              className="cc-ctrl"
              aria-expanded={clinicsOpen}
              aria-haspopup="listbox"
              onClick={() => {
                setClinicsOpen((v) => !v);
                setMoreOpen(false);
                setUserOpen(false);
                setLayoutsOpen(false);
              }}
            >
              Select Clinics
            </button>
            {clinicsOpen ? (
              <div
                className="absolute left-0 top-[110%] z-40 max-h-[360px] w-[320px] overflow-auto rounded-xl border border-[var(--cc-card-line)] bg-[var(--cc-card)] p-2 shadow-xl"
                role="listbox"
              >
                <div className="mb-2 flex flex-wrap gap-1">
                  <Button small variant="soft" onClick={() => onChangeClinics(locations.map((l) => l.id))}>
                    All clinics
                  </Button>
                  <Button small variant="line" onClick={() => onChangeClinics(urgentClinicIds)}>
                    Clinics with urgent issues
                  </Button>
                  <Button
                    small
                    variant="line"
                    onClick={() => onChangeClinics(northCorridorGroup?.locationIds ?? NORTH_CORRIDOR_IDS)}
                  >
                    Saved group: North corridor
                  </Button>
                </div>
                <div className="mb-1 text-[length:var(--type-meta)] font-extrabold uppercase tracking-wide text-[var(--cc-muted)]">
                  Saved groups
                </div>
                {otherClinicGroups.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    className="mb-0.5 flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs font-semibold hover:bg-[var(--cc-soft)]"
                    onClick={() => onChangeClinics(g.locationIds)}
                  >
                    {g.name}
                    <span className="text-[length:var(--type-meta)] text-[var(--cc-muted)]">{g.locationIds.length}</span>
                  </button>
                ))}
                {canSaveGroup ? (
                  <Button
                    small
                    variant="teal"
                    className="mb-2 w-full"
                    onClick={() => {
                      const name = window.prompt("Name for this clinic group", "");
                      if (!name?.trim()) return;
                      onSaveClinicGroup(name.trim(), [...selectedClinicIds]);
                      setClinicsOpen(false);
                    }}
                  >
                    Save clinic group ({selectedClinicIds.length})
                  </Button>
                ) : null}
                <div className="my-2 border-t border-[var(--cc-card-line)]" />
                {locations.map((loc) => {
                  const h = healthMap[loc.id];
                  return (
                    <label
                      key={loc.id}
                      className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold hover:bg-[var(--cc-soft)]"
                    >
                      <input
                        type="checkbox"
                        checked={selectedClinicIds.includes(loc.id)}
                        onChange={() => toggleClinic(loc.id)}
                      />
                      <span className="min-w-0 flex-1 truncate">{loc.shortName}</span>
                      {h ? (
                        <span className="flex shrink-0 items-center gap-1.5">
                          <HealthDot band={h.override?.band ?? h.band} score={h.overallScore} />
                          <span className="whitespace-nowrap text-[length:var(--type-meta)] font-bold text-[var(--cc-muted)]">
                            {h.override?.band ?? h.band}
                            {h.emergencyStatus ? " · Emergency" : ""}
                          </span>
                        </span>
                      ) : null}
                    </label>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div className="relative" ref={layoutsRef}>
            <button
              type="button"
              className="cc-ctrl"
              onClick={() => {
                setLayoutsOpen((v) => !v);
                setClinicsOpen(false);
              }}
              aria-label="Choose Layout"
            >
              Layout · {layoutName.length > 18 ? `${layoutName.slice(0, 16)}…` : layoutName}
              {unsavedLayout ? " *" : ""}
            </button>
            {layoutsOpen && layouts?.length ? (
              <div className="absolute left-0 top-[110%] z-40 max-h-[280px] w-[260px] overflow-auto rounded-xl border border-[var(--cc-card-line)] bg-[var(--cc-card)] p-1 shadow-xl">
                {layouts.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    className={cn(
                      "flex w-full rounded-lg px-2.5 py-2 text-left text-xs font-semibold hover:bg-[var(--cc-soft)]",
                      l.name === layoutName && "bg-[var(--cc-soft)]"
                    )}
                    onClick={() => {
                      onSelectLayout?.(l.id);
                      setLayoutsOpen(false);
                    }}
                  >
                    {l.name}
                    {l.isDefault ? (
                      <span className="ml-auto text-[length:var(--type-meta)] text-[var(--cc-muted)]">Default</span>
                    ) : null}
                  </button>
                ))}
                <div className="my-1 border-t border-[var(--cc-card-line)]" />
                <button
                  type="button"
                  className="flex w-full rounded-lg px-2.5 py-2 text-left text-xs font-semibold hover:bg-[var(--cc-soft)]"
                  onClick={() => {
                    onLayout();
                    setLayoutsOpen(false);
                  }}
                >
                  Customise layouts…
                </button>
              </div>
            ) : (
              <button type="button" className="hidden" onClick={onLayout} aria-hidden />
            )}
          </div>

          <select
            className="cc-ctrl appearance-none pr-7"
            value={period}
            onChange={(e) => handlePeriodChange(e.target.value as LayoutPeriod)}
            aria-label="Period"
          >
            {PERIOD_OPTIONS.map((p) => (
              <option key={p} value={p}>
                Period:{" "}
                {p === "This Week"
                  ? "This week"
                  : p === "This Month"
                    ? "This month"
                    : p === "Current Quarter"
                      ? "Current quarter"
                      : p}
              </option>
            ))}
          </select>

          {period === "Custom Range" ? (
            <div className="flex flex-wrap items-center gap-1">
              <input
                type="date"
                className="cc-ctrl text-xs"
                value={customRange?.start ?? ""}
                onChange={(e) =>
                  onCustomRange?.({ start: e.target.value, end: customRange?.end ?? e.target.value })
                }
                aria-label="Custom range start"
              />
              <span className="text-[length:var(--type-control)] text-[var(--cc-muted)]">→</span>
              <input
                type="date"
                className="cc-ctrl text-xs"
                value={customRange?.end ?? ""}
                onChange={(e) =>
                  onCustomRange?.({ start: customRange?.start ?? e.target.value, end: e.target.value })
                }
                aria-label="Custom range end"
              />
            </div>
          ) : null}

          <div className="min-w-[180px] max-w-lg flex-1 basis-[220px]">
            <input
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search or Ask…"
              aria-label="Search or ask a question across the platform"
              className="cc-ctrl w-full font-semibold"
            />
          </div>

          <Button small variant="line" onClick={onRefreshNow} aria-label="Refresh now">
            Refresh
          </Button>
          <Button small variant="primary" onClick={onCreateAction}>
            Create Action
          </Button>
          <Button small variant="teal" onClick={onPublish}>
            Publish Announcement
          </Button>
          <Button small variant="line" onClick={onCustomise}>
            Customise Dashboard
          </Button>
          <Button small variant="line" onClick={onExport}>
            Export
          </Button>
          <Button
            small
            variant={paused ? "warn" : "line"}
            onClick={onTogglePause}
          >
            {paused ? "Resume Automatic Refresh" : "Pause Automatic Refresh"}
          </Button>

          <button
            type="button"
            className="cc-ctrl relative"
            onClick={onNotifications}
            aria-label="Notifications"
          >
            Notifications
            {totalNotes > 0 ? (
              <span className="ml-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-[var(--cc-exec,#1e40af)] px-1 text-[length:var(--type-meta)] font-black text-white">
                {totalNotes}
              </span>
            ) : null}
          </button>

          <select
            className="cc-ctrl appearance-none pr-7"
            value={appearance}
            onChange={(e) => onAppearance(e.target.value as CcAppearance)}
            aria-label="Appearance"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">Device setting</option>
          </select>

          {onQaSimulateNextDay && onQaSetCardState && onQaResetActions ? (
            <QaDemoMenu
              onSimulateNextDay={onQaSimulateNextDay}
              onSetCardState={onQaSetCardState}
              onResetActions={onQaResetActions}
            />
          ) : null}

          {onTemplatesRecurring ? (
            <div className="relative" ref={moreRef}>
              <button
                type="button"
                className="cc-ctrl"
                aria-expanded={moreOpen}
                onClick={() => {
                  setMoreOpen((v) => !v);
                  setClinicsOpen(false);
                  setUserOpen(false);
                }}
              >
                More
              </button>
              {moreOpen ? (
                <div className="absolute right-0 top-[110%] z-40 w-[220px] rounded-xl border border-[var(--cc-card-line)] bg-[var(--cc-card)] p-1.5 shadow-xl">
                  {[["Templates & Recurring", onTemplatesRecurring] as const].map(([label, fn]) => (
                    <button
                      key={String(label)}
                      type="button"
                      className="flex w-full rounded-lg px-2.5 py-2 text-left text-xs font-semibold hover:bg-[var(--cc-soft)]"
                      onClick={() => {
                        fn();
                        setMoreOpen(false);
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="relative" ref={userRef}>
            <button
              type="button"
              className="cc-ctrl"
              aria-expanded={userOpen}
              onClick={() => {
                setUserOpen((v) => !v);
                setClinicsOpen(false);
                setMoreOpen(false);
              }}
            >
              Neil ▾
            </button>
            {userOpen ? (
              <div className="absolute right-0 top-[110%] z-40 w-[240px] rounded-xl border border-[var(--cc-card-line)] bg-[var(--cc-card)] p-2 shadow-xl">
                <div className="px-2 py-1 text-[length:var(--type-control)] font-bold text-[var(--cc-muted)]">Owner / Director</div>
                <div className="px-2 pb-2 text-xs font-semibold">Demonstration user · local session only</div>
                <p className="m-0 px-2 pb-2 text-[length:var(--type-meta)] text-[var(--cc-muted)]">
                  Sign-in, SSO and role switching require a future authentication backend.
                </p>
                {[
                  ["Open notifications", onNotifications],
                  ["Export", onExport],
                  [
                    "Appearance",
                    () => {
                      setUserOpen(false);
                      onAppearanceReminder?.();
                    },
                  ],
                  ["Sign out (demo)", () => {
                    setUserOpen(false);
                    onSignOut?.();
                  }],
                ].map(([label, fn]) => (
                  <button
                    key={String(label)}
                    type="button"
                    className="flex w-full rounded-lg px-2.5 py-2 text-left text-xs font-semibold hover:bg-[var(--cc-soft)]"
                    onClick={() => {
                      (fn as () => void)();
                      if (label !== "Appearance") setUserOpen(false);
                    }}
                  >
                    {label as string}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {allSelected ? (
            <span className="cc-chip cc-chip-active">All Clinics</span>
          ) : (
            selectedClinicIds.map((id) => {
              const loc = locations.find((l) => l.id === id);
              const h = healthMap[id];
              return (
                <span key={id} className="cc-chip">
                  {h ? <HealthDot band={h.override?.band ?? h.band} score={h.overallScore} /> : null}
                  <span className="max-w-[110px] truncate">{loc?.shortName ?? id}</span>
                  {h ? (
                    <span className="whitespace-nowrap text-[length:var(--type-meta)] font-bold text-[var(--cc-muted)]">
                      {h.override?.band ?? h.band}
                    </span>
                  ) : null}
                  <button
                    type="button"
                    className="ml-0.5 text-[var(--cc-muted)] hover:cc-text-danger"
                    aria-label={`Remove ${loc?.shortName}`}
                    onClick={() => onChangeClinics(selectedClinicIds.filter((x) => x !== id))}
                  >
                    ×
                  </button>
                </span>
              );
            })
          )}

          <div
            className={cn(
              "ml-auto flex flex-wrap items-center gap-2 text-[length:var(--type-control)] text-[var(--cc-muted)]",
              paused && "font-semibold cc-text-warn"
            )}
          >
            <Button small variant="line" onClick={onRefreshNow} aria-label="Refresh now">
              Refresh Now
            </Button>
            <span>
              Last updated: {formatClock(lastUpdated)} · Next refresh {formatClock(nextRefresh)}
            </span>
            {paused ? <span>Paused (emergency still live)</span> : null}
            <span className="hidden sm:inline">
              Emergency {notificationCounts.emergency} · Unread {notificationCounts.unread} · Approvals{" "}
              {notificationCounts.approvals}
            </span>
          </div>
        </div>
      </div>
      {unsavedLayout ? (
        <div className="border-t cc-surface-warn border px-4 py-1.5 text-xs font-semibold cc-text-warn lg:px-7">
          You have unsaved layout changes. Select Save Layout to keep them.
        </div>
      ) : null}
    </div>
  );
}
