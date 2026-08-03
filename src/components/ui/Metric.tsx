import { cn } from "@/lib/cn";
import type { MetricTone } from "@/lib/types";
import type { IconName } from "@/lib/modules";
import { Icon } from "./Icon";

const tones: Record<MetricTone, string> = {
  default: "bg-[var(--card)] border-[var(--line)]",
  warning: "bg-[var(--hcdp-status-warning-surface)] border-[var(--hcdp-status-warning-border)]",
  danger: "bg-[var(--hcdp-status-critical-surface)] border-[var(--hcdp-status-critical-border)]",
  info: "bg-[var(--hcdp-status-info-surface)] border-[var(--hcdp-status-info-border)]",
  success: "bg-[var(--hcdp-status-success-surface)] border-[var(--hcdp-status-success-border)]",
};

export function Metric({
  label,
  value,
  icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  icon: IconName;
  tone?: MetricTone;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 rounded-[18px] border p-[18px] shadow-[var(--v34-card-shadow)]",
        tones[tone]
      )}
    >
      <div>
        <div className="text-[length:var(--type-meta)] font-extrabold uppercase tracking-[0.04em] text-[var(--muted)]">
          {label}
        </div>
        <div className="mt-1 text-[28px] font-extrabold tracking-tight text-[var(--ink)]">
          {value}
        </div>
      </div>
      <div className="grid h-[39px] w-[39px] place-items-center rounded-xl bg-[var(--hcdp-status-info-surface)] text-[var(--hcdp-action)]">
        <Icon name={icon} />
      </div>
    </div>
  );
}
