/** Lightweight shared validators for platform contracts. */

import type { SourceRecordRef } from "@/platform/contracts/source-record";

export function isValidSourceRecordRef(ref: Partial<SourceRecordRef> | null | undefined): ref is SourceRecordRef {
  return Boolean(
    ref &&
      ref.sourceModuleId &&
      ref.sourceRecordType &&
      ref.sourceRecordId &&
      ref.sourceRecordTitle &&
      ref.route
  );
}

export function requireNonEmpty(value: string | undefined | null, label: string): string {
  const v = (value ?? "").trim();
  if (!v) throw new Error(`${label} is required`);
  return v;
}
