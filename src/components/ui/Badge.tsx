import { cn } from "@/lib/cn";
import type { BadgeTone } from "@/lib/types";

const tones: Record<BadgeTone, string> = {
  default: "bg-[#eef2f7] text-[#556575]",
  success: "bg-[#dcfce7] text-[#166534]",
  warn: "bg-[#fef3c7] text-[#92400e]",
  danger: "bg-[#fee2e2] text-[#991b1b]",
  info: "bg-[#dbeafe] text-[#1d4ed8]",
  teal: "bg-[var(--teal-3)] text-[#1d4ed8]",
};

export function Badge({
  children,
  tone = "default",
  className,
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-extrabold",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
