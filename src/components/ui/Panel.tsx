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
        "min-w-0 max-w-full rounded-[var(--radius)] border border-[var(--v34-card-line)] bg-[var(--card)] shadow-[var(--v34-card-shadow)]",
        pad && "p-5",
        className
      )}
    >
      {children}
    </div>
  );
}

export function PanelTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="hcdp-type-title m-0 mb-1 tracking-tight">{children}</h3>;
}

export function PanelSub({ children }: { children: React.ReactNode }) {
  return <p className="hcdp-type-body m-0 text-[var(--muted)]">{children}</p>;
}
