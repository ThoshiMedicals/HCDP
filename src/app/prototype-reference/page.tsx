"use client";

import Link from "next/link";
import { HtmlPrototypeFrame } from "@/components/shell/HtmlPrototypeFrame";

/** Development / QA reference only — not linked from the normal sidebar. */
export default function PrototypeReferencePage() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d7e1ec] bg-[#0f172a] px-4 py-2 text-white">
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-wide text-[#94a3b8]">
            Development / QA Reference
          </div>
          <strong className="text-sm">HTML prototype — not the default module experience</strong>
        </div>
        <Link
          href="/dashboard"
          className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-bold hover:bg-white/20"
        >
          Return to Next platform
        </Link>
      </div>
      <HtmlPrototypeFrame className="h-full w-full flex-1 border-0" />
    </div>
  );
}
