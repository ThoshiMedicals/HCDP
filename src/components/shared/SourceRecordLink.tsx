"use client";

import Link from "next/link";
import type { SourceRecordRef } from "@/platform/contracts/source-record";
import { buildSourceHref } from "@/platform/contracts/source-record";

export function SourceRecordLink({
  source,
  className,
  children,
}: {
  source: SourceRecordRef;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <Link href={buildSourceHref(source)} className={className ?? "font-semibold text-[var(--theme-primary)] underline"}>
      {children ?? source.sourceRecordTitle}
    </Link>
  );
}
