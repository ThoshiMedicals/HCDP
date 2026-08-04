"use client";

import type { ReactNode } from "react";

export function SectionFrame({
  sectionId,
  title,
  children,
}: {
  sectionId: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div
      className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4"
      data-testid={`m06-section-${sectionId}`}
      data-m06-section={sectionId}
      data-m06-section-title={title}
    >
      <div>
        <h2
          className="m-0 text-xl font-extrabold text-[var(--ink)]"
          data-testid={`m06-heading-${sectionId}`}
        >
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}
