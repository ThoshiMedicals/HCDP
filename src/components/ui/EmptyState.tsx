import { Icon } from "./Icon";

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 text-center text-[#64748b]">
      <Icon name="file" className="h-[52px] w-[52px] text-[#b5bfca]" />
      <h3 className="m-0 text-base text-[#45566b]">{title}</h3>
      <p className="m-0 text-[#7a8798]">{description}</p>
    </div>
  );
}
