"use client";

import { cn } from "@/lib/cn";

export type ToastTone = "default" | "success" | "warn" | "danger";

export interface ToastItem {
  id: string;
  message: string;
  tone?: ToastTone;
}

const tones: Record<ToastTone, string> = {
  default: "bg-[#0f172a]",
  success: "bg-[#065f46]",
  warn: "bg-[#92400e]",
  danger: "bg-[#991b1b]",
};

export function ToastStack({ toasts }: { toasts: ToastItem[] }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-[18px] right-[18px] z-[80] flex max-w-[360px] flex-col gap-2.5">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "rounded-[14px] px-3.5 py-3 text-white shadow-[0_20px_45px_rgba(15,23,42,0.18)]",
            tones[t.tone ?? "default"]
          )}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
