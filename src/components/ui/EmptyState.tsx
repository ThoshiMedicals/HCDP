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
      className="flex min-h-[220px] flex-col items-center justify-center gap-2 text-center"
      role="status"
    >
      <Icon name="file" className="h-[52px] w-[52px] text-[var(--muted)]" />
      <h3 className="hcdp-type-title m-0 text-[var(--ink)]">{title}</h3>
      <p className="hcdp-type-body m-0 text-[var(--muted)]">{description}</p>
    </div>
  );
}
