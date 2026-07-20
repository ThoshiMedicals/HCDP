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
    <div className="flex flex-wrap items-center gap-2">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={cn(
            "rounded-[11px] px-3.5 py-2.5 font-bold",
            value === item.id
              ? "bg-[#121417] text-white"
              : "bg-[#f5f7f8] text-[#465a70]"
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
