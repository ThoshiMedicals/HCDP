"use client";

import { useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Metric } from "@/components/ui/Metric";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/cn";
import type { IconName } from "@/lib/modules";
import type { MetricTone } from "@/lib/types";
import { useOrganisation } from "@/lib/organisation/context";
import type { OrgSectionId, RiskLevel } from "@/lib/organisation/types";

type StatusTone = "success" | "warn" | "danger" | "info" | "default" | "emergency";

const STATUS_STYLES: Record<StatusTone, { bg: string; text: string; icon: string }> = {
  success: { bg: "bg-[#dcfce7]", text: "text-[#166534]", icon: "✓" },
  warn: { bg: "bg-[#fef3c7]", text: "text-[#92400e]", icon: "!" },
  danger: { bg: "bg-[#fee2e2]", text: "text-[#991b1b]", icon: "✕" },
  info: { bg: "bg-[#dbeafe]", text: "text-[#1d4ed8]", icon: "i" },
  default: { bg: "bg-[#eef2f7]", text: "text-[#556575]", icon: "·" },
  emergency: { bg: "bg-[#ede9fe]", text: "text-[#7c3aed]", icon: "⚡" },
};

export function riskToTone(risk: RiskLevel | string): StatusTone {
  if (risk === "Critical") return "emergency";
  if (risk === "High") return "danger";
  if (risk === "Medium") return "warn";
  if (risk === "Low") return "success";
  return "default";
}

export function StatusPill({
  label,
  tone = "default",
  title,
}: {
  label: string;
  tone?: StatusTone;
  title?: string;
}) {
  const s = STATUS_STYLES[tone];
  return (
    <span
      title={title || label}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[length:var(--type-control)] font-extrabold",
        s.bg,
        s.text
      )}
    >
      <span aria-hidden>{s.icon}</span>
      {label}
    </span>
  );
}

export function WarningBanner({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--hcdp-status-warning-border)] bg-[var(--hcdp-status-warning-surface)] px-4 py-3 text-sm text-[#92400e]">
      <strong className="mr-1">⚠</strong>
      {children}
    </div>
  );
}

export function EmergencyBanner({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-[#c4b5fd] bg-[#f5f3ff] px-4 py-3 text-sm font-semibold text-[#7c3aed]">
      <strong className="mr-1">⚡</strong>
      {children}
    </div>
  );
}

export function ClickableMetric({
  label,
  value,
  icon,
  tone = "default",
  onClick,
  title,
}: {
  label: string;
  value: string | number;
  icon: IconName;
  tone?: MetricTone;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title || `Open ${label}`}
      className="w-full cursor-pointer text-left transition hover:scale-[1.01] hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--teal)]"
    >
      <Metric label={label} value={value} icon={icon} tone={tone} />
    </button>
  );
}

export function SearchBox({
  value,
  onChange,
  placeholder = "Search users, clinics, requests, audit…",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <Icon name="file" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[var(--line)] bg-[var(--card)] py-2.5 pl-9 pr-3 text-sm text-[var(--ink)] shadow-sm focus:border-[var(--teal)] focus:outline-none"
      />
    </div>
  );
}

export function FilterBar({
  children,
  onClear,
}: {
  children: ReactNode;
  onClear?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3 py-2">
      <span className="text-xs font-bold text-[var(--muted)]">Filters</span>
      {children}
      {onClear ? (
        <Button small variant="line" onClick={onClear}>
          Clear
        </Button>
      ) : null}
    </div>
  );
}

export function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-1 text-[length:var(--type-control)] font-bold transition",
        active
          ? "border-[var(--teal)] bg-[var(--teal-3)] text-[#1d4ed8]"
          : "border-[var(--line)] bg-[var(--card)] text-[var(--muted)] hover:bg-[var(--soft)]"
      )}
    >
      {label}
    </button>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  danger,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button variant="line" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={danger ? "danger" : "teal"}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="m-0 text-sm text-[var(--muted)]">{message}</p>
    </Modal>
  );
}

export function SimpleChartBar({
  title,
  items,
  onItemClick,
}: {
  title: string;
  items: { label: string; value: number; tone?: StatusTone }[];
  onItemClick?: (label: string) => void;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--card)] p-4">
      <h4 className="m-0 mb-3 text-sm font-extrabold text-[var(--ink)]">{title}</h4>
      <div className="grid gap-2">
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            disabled={!onItemClick}
            title={onItemClick ? `Open filtered records for ${item.label}` : undefined}
            onClick={() => onItemClick?.(item.label)}
            className={cn(
              "grid gap-1 rounded-lg text-left",
              onItemClick && "cursor-pointer hover:bg-[var(--soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--theme-accent,#2563eb)]"
            )}
          >
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-[var(--muted)]">{item.label}</span>
              <span className="font-bold tabular-nums">{item.value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#eef2f7]">
              <div
                className={cn(
                  "h-full rounded-full",
                  item.tone === "danger" && "bg-[#dc2626]",
                  item.tone === "warn" && "bg-[#d97706]",
                  item.tone === "success" && "bg-[#16a34a]",
                  item.tone === "info" && "bg-[#2563eb]",
                  item.tone === "emergency" && "bg-[#7c3aed]",
                  (!item.tone || item.tone === "default") && "bg-[#94a3b8]"
                )}
                style={{ width: `${Math.round((item.value / max) * 100)}%` }}
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export function EmptyStateWithAction({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="grid gap-3">
      <EmptyState title={title} description={description} />
      {actionLabel && onAction ? (
        <div className="flex justify-center">
          <Button variant="teal" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function SectionHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="m-0 text-lg font-extrabold tracking-tight">{title}</h2>
        {subtitle ? <p className="m-0 mt-1 text-sm text-[var(--muted)]">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  const map = {
    Low: "success",
    Medium: "warn",
    High: "danger",
    Critical: "danger",
  } as const;
  return <Badge tone={map[risk]}>{risk}</Badge>;
}

export function SavedViewsBar({ section }: { section: OrgSectionId }) {
  const { state, filters, setFilters, patchState, pushToast } = useOrganisation();
  const [name, setName] = useState("");

  const views = state.savedViews.filter((v) => v.section === section);

  const saveView = () => {
    if (!name.trim()) {
      pushToast("Name your view before saving.", "danger");
      return;
    }
    const clean: Record<string, string> = {};
    Object.entries(filters).forEach(([k, v]) => {
      if (v) clean[k] = v;
    });
    patchState((prev) => ({
      ...prev,
      savedViews: [
        ...prev.savedViews,
        {
          id: `sv_${Math.random().toString(36).slice(2, 7)}`,
          name: name.trim(),
          section,
          shared: false,
          filters: clean,
          createdBy: prev.currentUserId,
        },
      ],
    }));
    pushToast(`View "${name.trim()}" saved.`, "success");
    setName("");
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--card)] px-3 py-2">
      <span className="text-xs font-bold text-[var(--muted)]">Saved views</span>
      {views.length === 0 ? <span className="text-xs text-[#94a3b8]">None yet</span> : null}
      {views.map((v) => (
        <button
          key={v.id}
          type="button"
          title={v.shared ? "Shared view" : "Private view"}
          onClick={() => setFilters(v.filters)}
          className="rounded-full border border-[var(--line)] bg-[var(--card)] px-2.5 py-1 text-[length:var(--type-control)] font-bold text-[var(--muted)] transition hover:bg-[var(--soft)]"
        >
          {v.name}
          {v.shared ? " · shared" : ""}
        </button>
      ))}
      <span className="mx-1 h-4 w-px bg-[#e2e8f0]" />
      <input
        className="w-40 rounded-lg border border-[var(--line)] px-2 py-1 text-xs"
        placeholder="Name this view"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Button small variant="line" onClick={saveView}>
        Save current view
      </Button>
    </div>
  );
}

export function useConfirm() {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    danger?: boolean;
    confirmLabel?: string;
  } | null>(null);

  const ask = (opts: {
    title: string;
    message: string;
    onConfirm: () => void;
    danger?: boolean;
    confirmLabel?: string;
  }) => {
    setConfig(opts);
    setOpen(true);
  };

  const dialog = config ? (
    <ConfirmDialog
      open={open}
      title={config.title}
      message={config.message}
      confirmLabel={config.confirmLabel}
      danger={config.danger}
      onConfirm={config.onConfirm}
      onClose={() => setOpen(false)}
    />
  ) : null;

  return { ask, dialog };
}
