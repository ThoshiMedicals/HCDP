import { cn } from "@/lib/cn";

export function Tabs({
  items,
  value,
  onChange,
}: {
  items: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="tablist">
      {items.map((item) => {
        const selected = value === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(item.id)}
            className={cn(
              "rounded-[11px] border px-3.5 py-2.5 text-[length:var(--type-label)] font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring,var(--accent-champagne))]",
              selected
                ? "border-[var(--accent-champagne)] bg-[var(--ink)] text-[var(--card)] shadow-[inset_0_-2px_0_var(--accent-champagne)]"
                : "border-[var(--v34-card-line)] bg-[var(--soft)] text-[var(--text)]"
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
