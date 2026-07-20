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
        "rounded-[var(--radius)] border border-[var(--v34-card-line)] bg-[var(--card)] shadow-[var(--v34-card-shadow)]",
        pad && "p-5",
        className
      )}
    >
      {children}
    </div>
  );
}

export function PanelTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="m-0 mb-1 text-base font-extrabold tracking-tight">{children}</h3>;
}

export function PanelSub({ children }: { children: React.ReactNode }) {
  return <p className="m-0 text-[13px] text-[#526479]">{children}</p>;
}
