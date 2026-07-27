/**
 * Safe workforce link resolver — builds deep-link hrefs from workforce refs.
 * Uses SourceRecordRef where a platform inbox/source link is required.
 */

import { buildSourceHref, type SourceRecordRef } from "@/platform/contracts/source-record";
import type { WorkforceRefBase } from "../contracts/common";
import { workforceRefKey } from "../contracts/common";
import { validateWorkforceRefBase } from "../validation/workforce-reference-validation";

export type ResolveWorkforceLinkResult =
  | { ok: true; href: string; key: string; source: SourceRecordRef }
  | { ok: false; issues: { field: string; message: string }[] };

export function toSourceRecordRef(
  ref: WorkforceRefBase,
  sourceRecordType: string
): SourceRecordRef {
  return {
    sourceModuleId: ref.owningModuleId,
    sourceRecordType,
    sourceRecordId: ref.recordId,
    sourceRecordTitle: ref.displayLabel,
    clinicId: ref.clinicId,
    organisationId: ref.organisationId,
    currentStatus: ref.status,
    route: ref.route,
    section: ref.section,
  };
}

export function resolveWorkforceLink(
  ref: WorkforceRefBase | null | undefined,
  sourceRecordType: string
): ResolveWorkforceLinkResult {
  const validation = validateWorkforceRefBase(ref);
  if (!validation.ok || !ref) {
    return {
      ok: false,
      issues: validation.ok ? [{ field: "ref", message: "Reference is missing" }] : validation.issues,
    };
  }
  const source = toSourceRecordRef(ref, sourceRecordType);
  return {
    ok: true,
    href: buildSourceHref(source),
    key: workforceRefKey(ref),
    source,
  };
}
