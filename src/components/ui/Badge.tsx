import { cn } from "@/lib/cn";
import type { BadgeTone } from "@/lib/types";

const tones: Record<BadgeTone, string> = {
  default:
    "bg-[var(--hcdp-status-neutral-surface)] text-[var(--hcdp-status-neutral-text)] border border-[var(--hcdp-status-neutral-border)]",
  success:
    "bg-[var(--hcdp-status-success-surface)] text-[var(--hcdp-status-success-text)] border border-[var(--hcdp-status-success-border)]",
  warn:
    "bg-[var(--hcdp-status-warning-surface)] text-[var(--hcdp-status-warning-text)] border border-[var(--hcdp-status-warning-border)]",
  danger:
    "bg-[var(--hcdp-status-critical-surface)] text-[var(--hcdp-status-critical-text)] border border-[var(--hcdp-status-critical-border)]",
  info:
    "bg-[var(--hcdp-status-info-surface)] text-[var(--hcdp-status-info-text)] border border-[var(--hcdp-status-info-border)]",
  teal:
    "bg-[var(--hcdp-status-info-surface)] text-[var(--hcdp-status-info-text)] border border-[var(--hcdp-status-info-border)]",
};

export function Badge({
  children,
  tone = "default",
  className,
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[length:var(--type-control)] font-extrabold",
        tones[tone],
        className
      )}
      role="status"
    >
      {children}
    </span>
  );
}
