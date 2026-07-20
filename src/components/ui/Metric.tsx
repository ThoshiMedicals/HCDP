import { cn } from "@/lib/cn";
import type { MetricTone } from "@/lib/types";
import type { IconName } from "@/lib/modules";
import { Icon } from "./Icon";

const tones: Record<MetricTone, string> = {
  default: "bg-white border-[var(--line)]",
  warning: "bg-[#fffbf3] border-[#f5d08d]",
  danger: "bg-[#fff6f6] border-[#f4b4b4]",
  info: "bg-[#f6f9ff] border-[#c9dafd]",
  success: "bg-[#f6fff8] border-[#c8f0ce]",
};

export function Metric({
  label,
  value,
  icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  icon: IconName;
  tone?: MetricTone;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 rounded-[18px] border p-[18px] shadow-[var(--v34-card-shadow)]",
        tones[tone]
      )}
    >
      <div>
        <div className="text-xs font-extrabold uppercase tracking-[0.04em] text-[#5d6e82]">
          {label}
        </div>
        <div className="mt-1 text-[28px] font-extrabold tracking-tight text-[var(--ink)]">
          {value}
        </div>
      </div>
      <div className="grid h-[39px] w-[39px] place-items-center rounded-xl bg-[var(--teal-3)] text-[var(--teal)]">
        <Icon name={icon} />
      </div>
    </div>
  );
}
