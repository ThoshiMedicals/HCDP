/** Shared source-record reference contract for cross-module deep links. */

export interface SourceRecordRef {
  sourceModuleId: string;
  sourceRecordType: string;
  sourceRecordId: string;
  sourceRecordTitle: string;
  clinicId?: string;
  organisationId?: string;
  currentStatus?: string;
  route: string;
  section?: string;
  tab?: string;
  returnUrl?: string;
}

export function buildSourceHref(ref: SourceRecordRef): string {
  const params = new URLSearchParams();
  if (ref.section) params.set("section", ref.section);
  if (ref.tab) params.set("tab", ref.tab);
  if (ref.sourceRecordId) params.set("recordId", ref.sourceRecordId);
  if (ref.sourceRecordType) params.set("recordType", ref.sourceRecordType);
  const qs = params.toString();
  return qs ? `${ref.route}?${qs}` : ref.route;
}

export function sourceRefKey(
  ref: Pick<SourceRecordRef, "sourceModuleId" | "sourceRecordType" | "sourceRecordId">
): string {
  return `${ref.sourceModuleId}::${ref.sourceRecordType}::${ref.sourceRecordId}`;
}

export function parseSourceQuery(searchParams: URLSearchParams): {
  section?: string;
  tab?: string;
  recordId?: string;
  recordType?: string;
} {
  return {
    section: searchParams.get("section") ?? undefined,
    tab: searchParams.get("tab") ?? undefined,
    recordId: searchParams.get("recordId") ?? undefined,
    recordType: searchParams.get("recordType") ?? undefined,
  };
}
