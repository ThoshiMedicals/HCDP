"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePortal } from "@/lib/portal-context";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { toggleFavorite, readNavPrefs } from "@/lib/shell/nav-prefs";
import { CcCard } from "./command-centre/cc-ui";
import { CommandCentre } from "./command-centre/CommandCentre";

const EMERGENCY_INTERVENTION_PROGRESS: Array<{ name: string; status: string; percent: number }> = [
  { name: "Bald Hills", status: "Completed", percent: 100 },
  { name: "Lawnton", status: "Acknowledged", percent: 55 },
  { name: "Beachmere", status: "Pending", percent: 15 },
];

const MANAGEMENT_CONTROL_ROWS: Array<{ label: string; detail: string; status: string; tone: "default" | "warn" | "danger" }> = [
  { label: "Sign-in", detail: "MFA enforced", status: "Current", tone: "default" },
  { label: "Escalation", detail: "1 SLA breach", status: "Critical", tone: "danger" },
  { label: "Offline", detail: "3 staged items", status: "Review Required", tone: "warn" },
  { label: "Access", detail: "1 temporary grant", status: "Active", tone: "default" },
];

function statusToneClass(tone: "default" | "warn" | "danger") {
  if (tone === "danger") return "cc-badge-danger border";
  if (tone === "warn") return "cc-badge-warn border";
  return "cc-badge-default border";
}

function ControlStatusCard({
  title,
  detail,
  actionLabel,
  href,
  onAction,
}: {
  title: string;
  detail: string;
  actionLabel: string;
  href?: string;
  onAction?: () => void;
}) {
  return (
    <CcCard className="flex flex-col gap-1.5 p-3">
      <strong className="text-[12px] font-extrabold leading-tight text-[var(--cc-ink)]">{title}</strong>
      <p className="m-0 flex-1 text-[11px] leading-snug text-[var(--cc-muted)]">{detail}</p>
      {href ? (
        <Link
          href={href}
          className="cc-ctrl inline-flex w-fit items-center justify-center whitespace-nowrap text-[11px]"
        >
          {actionLabel}
        </Link>
      ) : (
        <Button small variant="line" className="w-fit" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </CcCard>
  );
}

/** Local-demo shell chrome above the Command Centre — enterprise sign-in, access scope,
 *  connection health, offline reconciliation, emergency intervention and management controls.
 *  Backend-dependent actions are labelled as demo-only; no Module 2 / action-inbox logic here. */
function DashboardShellStrip() {
  const { pushToast } = usePortal();

  return (
    <div className="mx-auto w-full max-w-[1480px] px-3 pt-2.5 lg:px-5">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <ControlStatusCard
          title="Enterprise Sign-In (MFA enforced)"
          detail="MFA is enforced before entry. Passwords are not stored in this platform."
          actionLabel="Review sign-in journey"
          onAction={() =>
            pushToast("Reviewing the sign-in journey requires a live authentication backend (demo only).", "default")
          }
        />
        <ControlStatusCard
          title="Clinic & Workspace Scope"
          detail="Clinic visibility and view, create, approve and export authority are evaluated together."
          actionLabel="Review access controls"
          href="/organisation"
        />
        <ControlStatusCard
          title="Connection Healthy"
          detail="Operational summaries are current."
          actionLabel="Simulate outage"
          onAction={() => pushToast("Outage simulated locally — no live connectivity is affected (demo).", "warn")}
        />
        <ControlStatusCard
          title="Restoration Reconciliation"
          detail="3 captured item(s) are waiting for verification or commitment."
          actionLabel="Open staging review"
          href="/sync-centre"
        />
      </div>

      <div className="mt-2 grid gap-2 lg:grid-cols-2">
        <CcCard className="p-3">
          <div className="mb-1.5 flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <strong className="block text-[12px] font-extrabold text-[var(--cc-ink)]">
                Cross-Location Emergency Intervention
              </strong>
              <p className="m-0 mt-0.5 text-[11px] leading-snug text-[var(--cc-muted)]">
                Issue a mandatory action to every affected Practice Manager and track local completion.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-1.5">
              <Link href="/emergency-centre" className="cc-ctrl text-[11px]">
                Open Emergency Control
              </Link>
              <Button
                small
                variant="danger"
                onClick={() => pushToast("Starting an intervention requires a live escalation backend (demo only).", "warn")}
              >
                Start Intervention
              </Button>
            </div>
          </div>
          <div className="grid gap-1.5">
            {EMERGENCY_INTERVENTION_PROGRESS.map((row) => (
              <div key={row.name} className="flex items-center gap-2 text-[11px]">
                <span className="w-[76px] shrink-0 font-bold text-[var(--cc-ink)]">{row.name}</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--cc-soft)]">
                  <span
                    className="block h-full rounded-full bg-[var(--cc-exec,#1e40af)]"
                    style={{ width: `${row.percent}%` }}
                  />
                </span>
                <span className="w-[92px] shrink-0 text-right font-semibold text-[var(--cc-muted)]">{row.status}</span>
              </div>
            ))}
          </div>
        </CcCard>

        <CcCard className="p-3">
          <strong className="block text-[12px] font-extrabold text-[var(--cc-ink)]">Management Control Status</strong>
          <p className="m-0 mt-0.5 text-[11px] leading-snug text-[var(--cc-muted)]">
            Business controls introduced in the research-amended BRD.
          </p>
          <div className="mt-1.5 grid gap-1.5">
            {MANAGEMENT_CONTROL_ROWS.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between gap-2 rounded-lg border border-[var(--cc-card-line)] bg-[var(--cc-soft)] px-2.5 py-1.5"
              >
                <span className="w-[68px] shrink-0 text-[10px] font-extrabold uppercase tracking-wide text-[var(--cc-muted)]">
                  {row.label}
                </span>
                <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-[var(--cc-ink)]">
                  {row.detail}
                </span>
                <span
                  className={`inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${statusToneClass(row.tone)}`}
                >
                  {row.status}
                </span>
              </div>
            ))}
          </div>
        </CcCard>
      </div>
    </div>
  );
}

/** Prototype v33 context strip — Quick find / Workflows / Insights / View / favourite. */
function ModuleContextStrip() {
  const { pushToast } = usePortal();
  const [dialog, setDialog] = useState<"find" | "flows" | "insights" | "view" | null>(null);
  const [findQuery, setFindQuery] = useState("");
  const [fav, setFav] = useState(true);

  useEffect(() => {
    queueMicrotask(() => {
      setFav(readNavPrefs().favorites.includes("dashboard"));
    });
  }, []);

  const findResults = useMemo(() => {
    const q = findQuery.trim().toLowerCase();
    const rows = [
      { label: "Owner/Director Command Centre", href: "/dashboard" },
      { label: "Action Inbox & Notification Centre", href: "/action-inbox" },
      { label: "Risk Centre", href: "/risk-centre" },
      { label: "Compliance Centre", href: "/compliance-centre" },
      { label: "Emergency Control", href: "/emergency-centre" },
      { label: "Roster & Shift Management", href: "/roster" },
    ];
    if (!q) return rows;
    return rows.filter((r) => r.label.toLowerCase().includes(q));
  }, [findQuery]);

  const toggleFav = useCallback(() => {
    const { favorites, added } = toggleFavorite("dashboard");
    setFav(favorites.includes("dashboard"));
    pushToast(added ? "Added to favourites" : "Removed from favourites");
  }, [pushToast]);

  return (
    <>
      <div className="v33-context-strip border-b border-[var(--v34-card-line)] bg-[var(--card)] px-4 py-1.5 lg:px-7">
        <div className="mx-auto flex w-full max-w-[1480px] flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="v33-module-chip inline-flex h-[30px] items-center gap-1.5 rounded-[9px] border border-[color-mix(in_srgb,#2563eb_42%,#cbd6e4)] bg-[color-mix(in_srgb,#2563eb_13%,#fff)] px-2.5 text-[10px] font-black text-[#2563eb]">
              <b>01</b>
              <span className="max-w-[220px] truncate sm:max-w-[310px]">Executive Command Centre</span>
            </span>
            <span className="hidden text-[10px] text-[var(--muted)] md:inline">
              Current operational sample · refreshed 2 min ago
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                ["find", "search", "Quick find"],
                ["flows", "task", "Workflows"],
                ["insights", "chart", "Insights"],
                ["view", "file", "View"],
              ] as const
            ).map(([id, icon, label]) => (
              <button
                key={id}
                type="button"
                className="v33-context-btn inline-flex h-8 items-center gap-1.5 rounded-[9px] border border-[var(--v34-card-line)] bg-[var(--card)] px-2.5 text-[10px] font-extrabold text-[var(--ink)]"
                onClick={() => setDialog(id)}
              >
                <Icon name={icon} className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
            <button
              type="button"
              className={cnStar(fav)}
              aria-label={fav ? "Remove from favourites" : "Add to favourites"}
              onClick={toggleFav}
            >
              ★
            </button>
          </div>
        </div>
      </div>

      <Modal
        open={dialog === "find"}
        title="Quick find"
        onClose={() => setDialog(null)}
        footer={
          <Button variant="line" onClick={() => setDialog(null)}>
            Close
          </Button>
        }
      >
        <label className="mb-2 block text-[11px] font-bold text-[var(--muted)]">
          Search workspaces
          <input
            className="mt-1 w-full rounded-lg border border-[var(--v34-card-line)] px-3 py-2 text-sm"
            value={findQuery}
            onChange={(e) => setFindQuery(e.target.value)}
            placeholder="Module, action or family"
            autoFocus
          />
        </label>
        <div className="grid gap-1">
          {findResults.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[var(--soft)]"
              onClick={() => setDialog(null)}
            >
              {r.label}
            </Link>
          ))}
          {!findResults.length ? (
            <p className="m-0 text-sm text-[var(--muted)]">No workspace found.</p>
          ) : null}
        </div>
      </Modal>

      <Modal
        open={dialog === "flows"}
        title="Executive Command Centre Workflows"
        onClose={() => setDialog(null)}
        footer={
          <Button variant="line" onClick={() => setDialog(null)}>
            Close
          </Button>
        }
      >
        <div className="grid gap-2 text-sm">
          {[
            ["Acknowledge emergency and redirect patients", "Start from Priority Summary → Open Full Action"],
            ["Approve temporary continued use", "My Executive Actions → Approve with Conditions"],
            ["Close end-of-day summary", "End-of-Day Summary on the tabs row"],
          ].map(([title, steps]) => (
            <div key={title} className="rounded-xl border border-[var(--v34-card-line)] p-3">
              <strong>{title}</strong>
              <p className="m-0 mt-1 text-[12px] text-[var(--muted)]">{steps}</p>
            </div>
          ))}
          <p className="m-0 text-[11px] text-[var(--muted)]">
            Full resumable flow runner requires a workflow backend. Local steps are listed for demonstration.
          </p>
        </div>
      </Modal>

      <Modal
        open={dialog === "insights"}
        title="Executive Command Centre Insights"
        onClose={() => setDialog(null)}
        footer={
          <Button variant="line" onClick={() => setDialog(null)}>
            Close
          </Button>
        }
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            ["Organisation health", "84%", "Across eight equal areas"],
            ["Overdue actions", "7", "Owner-visible queue"],
            ["Staffing fill", "93%", "Rostered vs present"],
            ["Digital availability", "97.2%", "Critical systems"],
          ].map(([k, v, note]) => (
            <div key={k} className="rounded-xl border border-[var(--v34-card-line)] p-3">
              <div className="text-[10px] font-extrabold uppercase tracking-wide text-[var(--muted)]">{k}</div>
              <div className="text-[22px] font-black text-[var(--ink)]">{v}</div>
              <div className="text-[11px] text-[var(--muted)]">{note}</div>
            </div>
          ))}
        </div>
      </Modal>

      <Modal
        open={dialog === "view"}
        title="View and Navigation Preferences"
        onClose={() => setDialog(null)}
        footer={
          <Button variant="teal" onClick={() => setDialog(null)}>
            Done
          </Button>
        }
      >
        <div className="grid gap-3 text-sm">
          <section className="rounded-xl border border-[var(--v34-card-line)] p-3">
            <strong>Display Density</strong>
            <p className="m-0 mt-1 text-[12px] text-[var(--muted)]">
              Comfortable spacing is the default. Compact mode is available when a density backend preference is wired.
            </p>
          </section>
          <section className="rounded-xl border border-[var(--v34-card-line)] p-3">
            <strong>Current Workspace</strong>
            <p className="m-0 mt-1 text-[12px] text-[var(--muted)]">Owner/Director Command Centre</p>
            <Button small variant="line" className="mt-2" onClick={toggleFav}>
              {fav ? "Remove Favourite" : "Add Favourite"}
            </Button>
          </section>
          <section className="rounded-xl border border-[var(--v34-card-line)] p-3">
            <strong>Keyboard Shortcuts</strong>
            <p className="m-0 mt-1 text-[12px] text-[var(--muted)]">
              Ctrl/⌘ + K opens Quick Find. Esc closes dialogs.
            </p>
          </section>
        </div>
      </Modal>
    </>
  );
}

function cnStar(active: boolean) {
  return [
    "inline-flex h-8 w-8 items-center justify-center rounded-[9px] border text-[14px]",
    active
      ? "border-[#efcf67] bg-[#fff8dc] text-[#9a6700]"
      : "border-[var(--v34-card-line)] bg-[var(--card)] text-[var(--muted)]",
  ].join(" ");
}

/** Module 1 — Owner/Director Command Centre */
export function DashboardWorkspace() {
  return (
    <>
      <ModuleContextStrip />
      <DashboardShellStrip />
      <CommandCentre />
    </>
  );
}
