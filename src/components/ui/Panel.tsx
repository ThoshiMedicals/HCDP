import { cn } from "@/lib/cn";

export function Panel({
  children,
  className,
  pad = true,
}: {
  children: React.ReactNode;
  className?: string;
  pad?: boolean;
}) {
  return (
    <div
      className={cn(
        "min-w-0 max-w-full rounded-[var(--aurora-radius-card,16px)] border border-[var(--aurora-border-subtle,var(--v34-card-line))] bg-[var(--aurora-surface,var(--card))] text-[var(--aurora-text-primary,var(--ink))] shadow-[var(--aurora-elevation-raised,var(--v34-card-shadow))]",
        pad && "p-5",
        className
      )}
      data-aurora-surface="content"
    >
      {children}
    </div>
  );
}

export function PanelTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="hcdp-type-title m-0 mb-1 tracking-tight">{children}</h3>;
}

export function PanelSub({ children }: { children: React.ReactNode }) {
  return <p className="hcdp-type-body m-0 text-[var(--aurora-text-muted,var(--muted))]">{children}</p>;
}
