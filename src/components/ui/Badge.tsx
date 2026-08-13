import { cn } from "@/lib/cn";
import type { BadgeTone } from "@/lib/types";
import type { IconName } from "@/lib/modules";
import { Icon } from "./Icon";

const tones: Record<BadgeTone, string> = {
  default:
    "bg-[var(--aurora-surface-muted,var(--hcdp-status-neutral-surface))] text-[var(--hcdp-status-neutral-text)] border border-[var(--hcdp-status-neutral-border)]",
  success:
    "bg-[var(--aurora-success-surface,var(--hcdp-status-success-surface))] text-[var(--aurora-success,var(--hcdp-status-success-text))] border border-[var(--hcdp-status-success-border)]",
  warn:
    "bg-[var(--aurora-warning-surface,var(--hcdp-status-warning-surface))] text-[var(--aurora-warning,var(--hcdp-status-warning-text))] border border-[var(--hcdp-status-warning-border)]",
  danger:
    "bg-[var(--aurora-danger-surface,var(--hcdp-status-critical-surface))] text-[var(--aurora-danger,var(--hcdp-status-critical-text))] border border-[var(--hcdp-status-critical-border)]",
  info:
    "bg-[var(--aurora-info-surface,var(--hcdp-status-info-surface))] text-[var(--aurora-info,var(--hcdp-status-info-text))] border border-[var(--hcdp-status-info-border)]",
  teal:
    "bg-[var(--aurora-info-surface,var(--hcdp-status-info-surface))] text-[var(--aurora-info,var(--hcdp-status-info-text))] border border-[var(--hcdp-status-info-border)]",
};

/** Tone default icons — text meaning is always required alongside colour. */
const toneIcons: Partial<Record<BadgeTone, IconName>> = {
  success: "checklist",
  warn: "alert",
  danger: "alert",
  info: "bell",
};

export function Badge({
  children,
  tone = "default",
  className,
  icon,
  showIcon,
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
  /** Optional explicit icon; when omitted, showIcon may pick a tone default. */
  icon?: IconName;
  showIcon?: boolean;
}) {
  const resolvedIcon = icon ?? (showIcon ? toneIcons[tone] : undefined);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[var(--aurora-radius-pill,999px)] px-2 py-1 text-[length:var(--type-control)] font-extrabold",
        tones[tone],
        className
      )}
      role="status"
    >
      {resolvedIcon ? (
        <Icon name={resolvedIcon} className="h-3.5 w-3.5 shrink-0" />
      ) : null}
      {children}
    </span>
  );
}

/** Aurora StatusBadge — text + optional icon + colour (never colour alone). */
export function StatusBadge({
  children,
  tone = "default",
  className,
  icon,
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
  icon?: IconName;
}) {
  return (
    <Badge tone={tone} className={className} icon={icon} showIcon>
      {children}
    </Badge>
  );
}
