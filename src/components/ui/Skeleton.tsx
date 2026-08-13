import { cn } from "@/lib/cn";

export function Skeleton({
  className,
  width,
  height = 16,
  label = "Loading",
}: {
  className?: string;
  width?: number | string;
  height?: number | string;
  label?: string;
}) {
  return (
    <span
      className={cn("aurora-skeleton", className)}
      style={{ width: width ?? "100%", height }}
      role="status"
      aria-live="polite"
      aria-label={label}
    />
  );
}

export function LoadingBlock({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-[var(--aurora-space-2,8px)]", className)} role="status" aria-label="Loading">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} height={i === 0 ? 20 : 14} width={i === lines - 1 ? "64%" : "100%"} />
      ))}
    </div>
  );
}
