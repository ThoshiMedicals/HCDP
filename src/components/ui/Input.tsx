import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-[var(--aurora-control-height,40px)] w-full min-w-0 border border-[var(--aurora-border-strong,var(--hcdp-control-border))] bg-[var(--aurora-surface,var(--card))] px-3 text-[length:var(--type-body)] text-[var(--aurora-text-primary,var(--ink))] outline-none transition duration-[var(--aurora-motion-surface,160ms)] ease-[var(--aurora-motion-easing,ease)] placeholder:text-[var(--aurora-text-muted,var(--muted))]",
        "rounded-[var(--aurora-radius-input,10px)]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--aurora-focus-ring,var(--focus-ring))]",
        "disabled:cursor-not-allowed disabled:opacity-55",
        className
      )}
      {...props}
    />
  );
}

export function SearchInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Input
      type="search"
      className={cn("min-h-[var(--aurora-touch-target-min,44px)] md:min-h-[var(--aurora-control-height,40px)]", className)}
      {...props}
    />
  );
}
