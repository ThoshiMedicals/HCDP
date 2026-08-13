import { cn } from "@/lib/cn";

type SurfaceVariant = "content" | "raised" | "critical" | "chrome";

const variantClass: Record<SurfaceVariant, string> = {
  content: "aurora-surface",
  raised: "aurora-surface aurora-surface--raised",
  critical: "aurora-surface aurora-surface--critical",
  /** Navigation/control chrome only — never for operational cards/tables/forms. */
  chrome: "aurora-surface--glass",
};

export function Surface({
  children,
  className,
  variant = "content",
  pad = true,
  as: Comp = "div",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: SurfaceVariant;
  pad?: boolean;
  as?: "div" | "section" | "article";
}) {
  return (
    <Comp
      className={cn(variantClass[variant], pad && "p-[var(--aurora-space-4,16px)]", className)}
      data-aurora-surface={variant}
    >
      {children}
    </Comp>
  );
}

/** Solid operational card — alias of content Surface. */
export function Card({
  children,
  className,
  pad = true,
}: {
  children: React.ReactNode;
  className?: string;
  pad?: boolean;
}) {
  return (
    <Surface variant="content" pad={pad} className={className}>
      {children}
    </Surface>
  );
}
