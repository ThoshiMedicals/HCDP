import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "teal" | "soft" | "line" | "warn" | "danger" | "green";

const styles: Record<Variant, string> = {
  primary:
    "bg-[var(--aurora-accent,var(--hcdp-action))] text-[var(--aurora-accent-contrast,var(--hcdp-on-action))] hover:bg-[var(--aurora-accent-hover,var(--hcdp-action-hover))]",
  teal:
    "bg-[var(--theme-primary)] text-[var(--aurora-accent-contrast,var(--hcdp-on-action))] hover:bg-[var(--aurora-accent-hover,var(--hcdp-action-hover))]",
  soft: "cc-surface-info border",
  line: "bg-[var(--aurora-surface,var(--card))] text-[var(--aurora-text-primary,var(--ink))] border border-[var(--aurora-border-strong,var(--hcdp-control-border))]",
  warn: "cc-surface-warn border",
  danger: "cc-surface-danger border",
  green: "cc-surface-success border",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
    small?: boolean;
  }
>(function Button(
  { children, variant = "primary", small, className, type = "button", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex min-h-10 items-center gap-2 whitespace-nowrap px-3.5 py-2.5 text-[length:var(--type-control)] font-bold transition disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--aurora-focus-ring,var(--focus-ring,var(--accent-champagne)))]",
        "rounded-[var(--aurora-radius-button,12px)]",
        "duration-[var(--aurora-motion-surface,160ms)] ease-[var(--aurora-motion-easing,ease)]",
        small &&
          "min-h-[31px] rounded-[var(--aurora-radius-input,10px)] px-2.5 py-1.5 text-[length:var(--type-control)] max-md:min-h-[var(--aurora-touch-target-min,44px)]",
        styles[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});
