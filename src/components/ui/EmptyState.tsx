import { Icon } from "./Icon";

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div
      className="flex min-h-[220px] flex-col items-center justify-center gap-[var(--aurora-space-2,8px)] text-center"
      role="status"
      data-aurora-surface="content"
    >
      <Icon name="file" className="h-[52px] w-[52px] text-[var(--aurora-text-muted,var(--muted))]" />
      <h3 className="hcdp-type-title m-0 text-[var(--aurora-text-primary,var(--ink))]">{title}</h3>
      <p className="hcdp-type-body m-0 text-[var(--aurora-text-muted,var(--muted))]">{description}</p>
    </div>
  );
}
