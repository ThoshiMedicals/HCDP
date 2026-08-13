import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, hint, error, id, disabled, readOnly, "aria-describedby": ariaDescribedBy, ...props },
  ref
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [ariaDescribedBy, hintId, errorId].filter(Boolean).join(" ") || undefined;

  const control = (
    <input
      ref={ref}
      id={inputId}
      disabled={disabled}
      readOnly={readOnly}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy}
      className={cn(
        "h-[var(--aurora-control-height,40px)] w-full min-w-0 border border-[var(--aurora-border-strong,var(--hcdp-control-border))] bg-[var(--aurora-surface,var(--card))] px-3 text-[length:var(--type-body)] text-[var(--aurora-text-primary,var(--ink))] outline-none transition duration-[var(--aurora-motion-surface,160ms)] ease-[var(--aurora-motion-easing,ease)] placeholder:text-[var(--aurora-text-muted,var(--muted))]",
        "rounded-[var(--aurora-radius-input,10px)]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--aurora-focus-ring,var(--focus-ring))]",
        "disabled:cursor-not-allowed disabled:opacity-55",
        "read-only:bg-[var(--aurora-surface-muted,var(--soft))]",
        error ? "border-[var(--aurora-danger,var(--hcdp-status-critical-text))]" : null,
        className
      )}
      {...props}
    />
  );

  if (!label && !hint && !error) return control;

  return (
    <div className="grid gap-1.5">
      {label ? (
        <label htmlFor={inputId} className="hcdp-type-label m-0 text-[var(--aurora-text-primary,var(--ink))]">
          {label}
        </label>
      ) : null}
      {control}
      {hint ? (
        <p id={hintId} className="m-0 text-[length:var(--type-control)] text-[var(--aurora-text-muted,var(--muted))]">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="m-0 text-[length:var(--type-control)] text-[var(--aurora-danger,var(--hcdp-status-critical-text))]">
          {error}
        </p>
      ) : null}
    </div>
  );
});

export const SearchInput = forwardRef<HTMLInputElement, InputProps>(function SearchInput(
  { className, ...props },
  ref
) {
  return (
    <Input
      ref={ref}
      type="search"
      className={cn(
        "min-h-[var(--aurora-touch-target-min,44px)] md:min-h-[var(--aurora-control-height,40px)]",
        className
      )}
      {...props}
    />
  );
});
