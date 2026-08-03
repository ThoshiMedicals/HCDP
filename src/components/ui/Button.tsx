import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "teal" | "soft" | "line" | "warn" | "danger" | "green";

const styles: Record<Variant, string> = {
  primary:
    "bg-[var(--hcdp-action)] text-[var(--hcdp-on-action)] hover:bg-[var(--hcdp-action-hover)]",
  teal:
    "bg-[var(--theme-primary)] text-[var(--hcdp-on-action)] hover:bg-[var(--hcdp-action-hover)]",
  soft: "cc-surface-info border",
  line: "bg-[var(--card)] text-[var(--ink)] border border-[var(--hcdp-control-border)]",
  warn: "cc-surface-warn border",
  danger: "cc-surface-danger border",
  green: "cc-surface-success border",
};

export function Button({
  children,
  variant = "primary",
  small,
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  small?: boolean;
}) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-[11px] px-3.5 py-2.5 text-[length:var(--type-control)] font-bold transition disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring,var(--accent-champagne))]",
        small && "min-h-[31px] rounded-[9px] px-2.5 py-1.5 text-[length:var(--type-control)]",
        styles[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
