"use client";

import { useMemo } from "react";

/**
 * Full HTML prototype as-is (all modules, forms, seeds, wizards).
 * Hash routing matches the HTML SPA (#dashboard, #checklists, etc.).
 */
export function HtmlPrototypeFrame({
  htmlId,
  className = "",
}: {
  htmlId?: string;
  className?: string;
}) {
  const src = useMemo(() => {
    const hash = htmlId ? `#${htmlId}` : "#dashboard";
    return `/pulse-html-prototype.html${hash}`;
  }, [htmlId]);

  return (
    <iframe
      key={src}
      src={src}
      title="Healthcare Doctors Pulse — HTML prototype (complete)"
      className={className || "h-[calc(100vh-52px)] w-full border-0 bg-white"}
    />
  );
}
