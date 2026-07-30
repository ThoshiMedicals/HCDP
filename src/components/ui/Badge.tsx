import { cn } from "@/lib/cn";
import type { BadgeTone } from "@/lib/types";

const tones: Record<BadgeTone, string> = {
  default: "bg-[var(--soft)] text-[var(--status-neutral)] border border-[var(--v34-card-line)]",
  success: "bg-[color-mix(in_srgb,var(--status-success)_12%,var(--card))] text-[var(--status-success)] border border-[color-mix(in_srgb,var(--status-success)_35%,var(--v34-card-line))]",
  warn: "bg-[color-mix(in_srgb,var(--status-warning)_12%,var(--card))] text-[var(--status-warning)] border border-[color-mix(in_srgb,var(--status-warning)_35%,var(--v34-card-line))]",
  danger: "bg-[color-mix(in_srgb,var(--status-critical)_12%,var(--card))] text-[var(--status-critical)] border border-[color-mix(in_srgb,var(--status-critical)_35%,var(--v34-card-line))]",
  info: "bg-[color-mix(in_srgb,var(--status-info)_12%,var(--card))] text-[var(--status-info)] border border-[color-mix(in_srgb,var(--status-info)_35%,var(--v34-card-line))]",
  teal: "bg-[var(--teal-3)] text-[var(--status-info)] border border-[color-mix(in_srgb,var(--status-info)_30%,var(--v34-card-line))]",
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
        "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[length:var(--type-meta)] font-extrabold",
        tones[tone],
        className
      )}
      role="status"
    >
      {children}
    </span>
  );
}
