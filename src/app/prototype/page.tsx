"use client";

import { HtmlPrototypeFrame } from "@/components/shell/HtmlPrototypeFrame";

/** Full HTML codebase as-is — nothing omitted. */
export default function PrototypePage() {
  return (
    <div className="fixed inset-0 z-[100] bg-white">
      <HtmlPrototypeFrame className="h-screen w-full border-0" />
    </div>
  );
}
