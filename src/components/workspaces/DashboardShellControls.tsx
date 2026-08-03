"use client";

import Link from "next/link";
import { CcCard } from "./command-centre/cc-ui";

const EMERGENCY_INTERVENTION_PROGRESS: Array<{ name: string; status: string; percent: number }> = [
  { name: "Bald Hills", status: "Completed", percent: 100 },
  { name: "Lawnton", status: "Acknowledged", percent: 55 },
  { name: "Beachmere", status: "Pending", percent: 15 },
];

const MANAGEMENT_CONTROL_ROWS: Array<{
  label: string;
  detail: string;
  status: string;
  tone: "default" | "warn" | "danger";
}> = [
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
  nonOperationalNote,
}: {
  title: string;
  detail: string;
  actionLabel?: string;
  href?: string;
  /** Explanatory label only — never a clickable fake success control. */
  nonOperationalNote?: string;
}) {
  return (
    <CcCard className="flex flex-col gap-1.5 p-3">
      <strong className="text-[12px] font-extrabold leading-tight text-[var(--cc-ink)]">{title}</strong>
      <p className="m-0 flex-1 text-[length:var(--type-control)] leading-snug text-[var(--cc-muted)]">{detail}</p>
      {href && actionLabel ? (
        <Link
          href={href}
          className="cc-ctrl inline-flex w-fit items-center justify-center whitespace-nowrap text-[length:var(--type-control)]"
        >
          {actionLabel}
        </Link>
      ) : null}
      {nonOperationalNote ? (
        <p className="m-0 text-[length:var(--type-meta)] font-semibold uppercase tracking-wide text-[var(--cc-muted)]" role="status">
          {nonOperationalNote}
        </p>
      ) : null}
    </CcCard>
  );
}

/**
 * Shell controls relocated from the stacked first-viewport chrome into an
 * accessible secondary disclosure (function preservation for QC-1 surfaces).
 */
export function DashboardShellControlsPanel() {
  return (
    <div className="grid gap-2" data-dashboard-shell-controls="true">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <ControlStatusCard
          title="Enterprise Sign-In (MFA enforced)"
          detail="MFA is enforced before entry. Passwords are not stored in this platform."
          nonOperationalNote="Non-operational — live authentication backend required"
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
          nonOperationalNote="Status display only — outage simulation is not available"
        />
        <ControlStatusCard
          title="Restoration Reconciliation"
          detail="3 captured item(s) are waiting for verification or commitment."
          actionLabel="Open staging review"
          href="/sync-centre"
        />
      </div>

      <div className="mt-1 grid gap-2 lg:grid-cols-2">
        <CcCard className="p-3">
          <div className="mb-1.5 flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <strong className="block text-[12px] font-extrabold text-[var(--cc-ink)]">
                Cross-Location Emergency Intervention
              </strong>
              <p className="m-0 mt-0.5 text-[length:var(--type-control)] leading-snug text-[var(--cc-muted)]">
                Issue a mandatory action to every affected Practice Manager and track local completion.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-1.5">
              <Link href="/emergency-centre" className="cc-ctrl text-[length:var(--type-control)]">
                Open Emergency Control
              </Link>
              <span
                className="inline-flex items-center rounded-md border border-[var(--cc-card-line)] px-2 py-1 text-[length:var(--type-meta)] font-semibold uppercase tracking-wide text-[var(--cc-muted)]"
                role="status"
              >
                Start intervention — non-operational
              </span>
            </div>
          </div>
          <div className="grid gap-1.5">
            {EMERGENCY_INTERVENTION_PROGRESS.map((row) => (
              <div key={row.name} className="flex items-center gap-2 text-[length:var(--type-control)]">
                <span className="w-[76px] shrink-0 font-bold text-[var(--cc-ink)]">{row.name}</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--cc-soft)]">
                  <span
                    className="block h-full rounded-full bg-[var(--cc-exec,#1e40af)]"
                    style={{ width: `${row.percent}%` }}
                  />
                </span>
                <span className="w-[92px] shrink-0 text-right font-semibold text-[var(--cc-muted)]">
                  {row.status}
                </span>
              </div>
            ))}
          </div>
        </CcCard>

        <CcCard className="p-3">
          <strong className="block text-[12px] font-extrabold text-[var(--cc-ink)]">
            Management Control Status
          </strong>
          <p className="m-0 mt-0.5 text-[length:var(--type-control)] leading-snug text-[var(--cc-muted)]">
            Business controls introduced in the research-amended BRD. Demo-seed sample — not live
            production status.
          </p>
          <div className="mt-1.5 grid gap-1.5">
            {MANAGEMENT_CONTROL_ROWS.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between gap-2 rounded-lg border border-[var(--cc-card-line)] bg-[var(--cc-soft)] px-2.5 py-1.5"
              >
                <span className="w-[68px] shrink-0 text-[length:var(--type-meta)] font-extrabold uppercase tracking-wide text-[var(--cc-muted)]">
                  {row.label}
                </span>
                <span className="min-w-0 flex-1 truncate text-[length:var(--type-control)] font-semibold text-[var(--cc-ink)]">
                  {row.detail}
                </span>
                <span
                  className={`inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[length:var(--type-meta)] font-extrabold uppercase tracking-wide ${statusToneClass(row.tone)}`}
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
