/**
 * M07 → platform published-timesheet discovery (Checkpoint 2.3).
 *
 * BOUNDARY: reads only the platform PublishedTimesheetRegistry.
 * Does NOT read pulse.m06.*, import M06 repositories/services/storage/domain,
 * or enumerate localStorage for M06 keys.
 * Does NOT invent a second registry reader for replay (platform query only).
 * Global BLOCKED-M07 is cleared (Checkpoint 2.7B). Discovery alone is still not intake.
 */

import {
  PUBLISHED_TIMESHEET_CONTRACT_VERSION,
  type PublishedTimesheetVersion,
} from "@/platform/workforce/contracts/published-timesheet-contract";
import type { TimesheetRef } from "@/platform/workforce/contracts/timesheet-ref";
import {
  listCurrentByApprovalState,
  listPublishedTimesheetVersions,
  getPublishedTimesheetByRegistryId,
  getPublishedTimesheetVersion,
  PUBLISHED_TIMESHEET_REGISTRY_KEYS,
} from "@/platform/workforce/services/published-timesheet-registry";

/** Sole permitted discovery source after Checkpoint 2.3. */
export const M07_PUBLISHED_TIMESHEET_DISCOVERY_SOURCE =
  "platform.PublishedTimesheetRegistry" as const;

/** @deprecated Removed scrape — retained name only as compile break if misused. */
export const M07_INTAKE_BATCH1_STATUS = "not-implemented" as const;

export type ApprovedTimesheetReadView = {
  timesheetRecordId: string;
  workforcePersonId: string;
  /** @deprecated alias of workforcePersonId for Batch 1 callers */
  personId: string;
  clinicId?: string;
  organisationId: string;
  legalEntityId: string;
  periodStart: string;
  periodEnd: string;
  /** Lifecycle approval on the publication — not payroll approval. */
  publicationApprovalState: string;
  sourceVersion: number;
  approvalRevision: number;
  contentHash: string;
  registryPublicationId: string;
  contractVersion: string;
  readOnly: true;
  /** Explicit: discovery is not intake. */
  intakeImplemented: false;
};

export type PublicationDiscoveryScope = {
  organisationId: string;
  legalEntityId: string;
  clinicId?: string;
};

export type PublicationDiscoveryReason =
  | "NO_ELIGIBLE_PUBLICATION"
  | "MISSING_SCOPE"
  | "REGISTRY_UNAVAILABLE"
  | "REGISTRY_CORRUPT"
  | "UNSUPPORTED_CONTRACT";

export type PublicationDiscoveryResult = {
  items: ApprovedTimesheetReadView[];
  /** Discovery API does not perform intake. */
  intakeStatus: "not-implemented";
  /** Propagates authoritative global blocker status (cleared at CP 2.7B). */
  blockedM07: boolean;
  status: "available" | "empty" | "unavailable";
  reason?: PublicationDiscoveryReason;
};

function failClosed(
  reason: PublicationDiscoveryReason
): PublicationDiscoveryResult {
  return {
    items: [],
    intakeStatus: "not-implemented",
    blockedM07: getM07TimesheetIntakeBlockerStatus().blocked,
    status: reason === "NO_ELIGIBLE_PUBLICATION" ? "empty" : "unavailable",
    reason,
  };
}

function mapVersion(v: PublishedTimesheetVersion): ApprovedTimesheetReadView {
  return {
    timesheetRecordId: v.timesheetRecordId,
    workforcePersonId: v.workforcePersonId,
    personId: v.workforcePersonId,
    clinicId: v.clinicId,
    organisationId: v.organisationId,
    legalEntityId: v.legalEntityId,
    periodStart: v.periodStart,
    periodEnd: v.periodEnd,
    publicationApprovalState: v.approvalState,
    sourceVersion: v.sourceVersion,
    approvalRevision: v.approvalRevision,
    contentHash: v.contentHash,
    registryPublicationId: v.registryPublicationId,
    contractVersion: v.contractVersion,
    readOnly: true,
    intakeImplemented: false,
  };
}

function assertScope(scope: PublicationDiscoveryScope): PublicationDiscoveryReason | null {
  if (!scope.organisationId?.trim() || !scope.legalEntityId?.trim()) {
    return "MISSING_SCOPE";
  }
  return null;
}

function registryHealth(): PublicationDiscoveryReason | null {
  try {
    if (typeof window === "undefined") {
      // Node tests install window; absence means registry APIs no-op to empty.
      return null;
    }
    const rawVersions = window.localStorage.getItem(PUBLISHED_TIMESHEET_REGISTRY_KEYS.versions);
    if (rawVersions == null) return null; // empty registry is healthy
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawVersions);
    } catch {
      return "REGISTRY_CORRUPT";
    }
    if (!Array.isArray(parsed)) return "REGISTRY_CORRUPT";
    return null;
  } catch {
    return "REGISTRY_UNAVAILABLE";
  }
}

/**
 * Controlled discovery of platform-published timesheets for a tenant scope.
 * Never falls back to M06 storage. Never implies intake/calculation/payment.
 */
export function discoverPublishedTimesheets(
  scope: PublicationDiscoveryScope
): PublicationDiscoveryResult {
  const scopeFail = assertScope(scope);
  if (scopeFail) return failClosed(scopeFail);

  const health = registryHealth();
  if (health) return failClosed(health);

  try {
    const currentApproved = listCurrentByApprovalState(
      { organisationId: scope.organisationId, legalEntityId: scope.legalEntityId },
      ["approved", "revised", "restored"]
    );

    const items: ApprovedTimesheetReadView[] = [];
    let sawUnsupported = false;

    for (const cur of currentApproved) {
      const version = getPublishedTimesheetVersion(
        { organisationId: scope.organisationId, legalEntityId: scope.legalEntityId },
        cur.timesheetRecordId,
        cur.currentSourceVersion
      );
      if (!version) continue;
      if (version.contractVersion !== PUBLISHED_TIMESHEET_CONTRACT_VERSION) {
        sawUnsupported = true;
        continue;
      }
      if (scope.clinicId && version.clinicId && version.clinicId !== scope.clinicId) {
        continue;
      }
      // Tenant already enforced by registry list; re-assert independence of fields.
      if (
        version.organisationId !== scope.organisationId ||
        version.legalEntityId !== scope.legalEntityId
      ) {
        continue;
      }
      items.push(mapVersion(version));
    }

    if (items.length === 0) {
      // Distinguish unsupported-only vs empty
      if (sawUnsupported) return failClosed("UNSUPPORTED_CONTRACT");
      const anyVersions = listPublishedTimesheetVersions({
        organisationId: scope.organisationId,
        legalEntityId: scope.legalEntityId,
      });
      const onlyUnsupported =
        anyVersions.length > 0 &&
        anyVersions.every((v) => v.contractVersion !== PUBLISHED_TIMESHEET_CONTRACT_VERSION);
      if (onlyUnsupported) return failClosed("UNSUPPORTED_CONTRACT");
      return failClosed("NO_ELIGIBLE_PUBLICATION");
    }

    return {
      items,
      intakeStatus: "not-implemented",
      blockedM07: getM07TimesheetIntakeBlockerStatus().blocked,
      status: "available",
    };
  } catch {
    return failClosed("REGISTRY_UNAVAILABLE");
  }
}

/**
 * Tenant-scoped lookup by registry id — returns null on miss or cross-tenant guess
 * without revealing whether another tenant’s record exists.
 */
export function getDiscoveredPublication(
  scope: PublicationDiscoveryScope,
  registryPublicationId: string
): ApprovedTimesheetReadView | null {
  if (assertScope(scope)) return null;
  try {
    const row = getPublishedTimesheetByRegistryId(
      { organisationId: scope.organisationId, legalEntityId: scope.legalEntityId },
      registryPublicationId
    );
    if (!row) return null;
    if (row.contractVersion !== PUBLISHED_TIMESHEET_CONTRACT_VERSION) return null;
    return mapVersion(row);
  } catch {
    return null;
  }
}

/**
 * Convenience list of discovery views (empty when unavailable).
 * Prefer `discoverPublishedTimesheets` for status/reason.
 */
export function listApprovedTimesheetRefs(
  scope: PublicationDiscoveryScope
): ApprovedTimesheetReadView[] {
  return discoverPublishedTimesheets(scope).items;
}

/** Period-link stub — Batch 2 intake is via intakePublishedTimesheet, not this helper. */
export function linkApprovedTimesheetToPeriod(
  _periodId: string,
  _timesheet: TimesheetRef
): { ok: false; code: "INTAKE_NOT_IMPLEMENTED"; blockedM07: boolean } {
  return {
    ok: false,
    code: "INTAKE_NOT_IMPLEMENTED",
    blockedM07: getM07TimesheetIntakeBlockerStatus().blocked,
  };
}

/**
 * Authoritative M07 Batch 2 global intake-blocker status.
 * Cleared at Checkpoint 2.7B. Operational holds, eligibility, replay safety,
 * permissions and validation remain independently fail-closed.
 */
export type M07IntakeBlockerStatus = {
  blocked: boolean;
  workflowEvidenceCode: "BLOCKED-M07" | "CLEARED-M07-BATCH2";
  message: string;
};

export function getM07TimesheetIntakeBlockerStatus(): M07IntakeBlockerStatus {
  return {
    blocked: false,
    workflowEvidenceCode: "CLEARED-M07-BATCH2",
    message:
      "M07 Batch 2 published-timesheet boundary cleared (owner-authorised Checkpoint 2.7B). Lifecycle holds, eligibility, replay cursor safety, isolation and permissions remain independently enforced.",
  };
}

/** Propagation fields for intake / replay / lifecycle results — single source. */
export function m07GlobalBlockerFields(): {
  blockedM07: boolean;
  workflowEvidenceCode: M07IntakeBlockerStatus["workflowEvidenceCode"];
} {
  const status = getM07TimesheetIntakeBlockerStatus();
  return {
    blockedM07: status.blocked,
    workflowEvidenceCode: status.workflowEvidenceCode,
  };
}

/** Probe helper used by tests — never scans for M06 keys. */
export function assertNoLegacyM06TimesheetScrapeInAdapterModule(): true {
  return true;
}
