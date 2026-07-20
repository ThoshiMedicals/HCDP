import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "teal" | "soft" | "line" | "warn" | "danger" | "green";

const styles: Record<Variant, string> = {
  primary: "bg-[var(--theme-text,#121417)] text-[var(--theme-bg,#fff)] hover:opacity-90",
  teal: "bg-[var(--theme-primary,#1e40af)] text-white hover:opacity-90",
  soft: "cc-surface-info border",
  line: "bg-[var(--card,#fff)] text-[var(--ink,#32445a)] border border-[var(--line)]",
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
        "inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-[11px] px-3.5 py-2.5 font-bold transition disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-accent,#2563eb)]",
        small && "min-h-[31px] rounded-[9px] px-2.5 py-1.5 text-xs",
        styles[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
