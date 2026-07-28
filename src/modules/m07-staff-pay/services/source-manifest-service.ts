/**
 * Batch 5 — immutable source manifest builder + checksum verification.
 */

import { getPeriod, listExceptions, listLeavePrepLines, listProfiles } from "../repository/local-store";
import { getPublishedTimesheetSnapshotById } from "../repository/published-timesheet-snapshots";
import { listClassificationMaps } from "../repository/local-store";
import type { M07Actor } from "../permissions";
import { M07ValidationError } from "../permissions";
import type { PayPeriodSourceManifest, PeriodReadiness } from "../types/domain";
import { checksumCanonical } from "./canonical-checksum";
import { assessPeriodReadiness } from "./readiness-service";
import { listActiveDeductionPrepInputs } from "./deduction-prep-input-service";
import { listPersonCalculationBatches } from "./calculate-service";

function bodyWithoutChecksum(
  manifest: Omit<PayPeriodSourceManifest, "checksum"> & { checksum?: string }
): Omit<PayPeriodSourceManifest, "checksum"> {
  const { checksum: _c, ...rest } = manifest as PayPeriodSourceManifest;
  void _c;
  return rest;
}

export function buildSourceManifest(
  actor: M07Actor,
  input: {
    legalEntityId: string;
    periodId: string;
    submittedBy?: string;
    submittedAt?: string;
    readiness?: PeriodReadiness;
    /** When set, pin this period version (e.g. post-transition) instead of current. */
    periodVersionOverride?: number;
  }
): PayPeriodSourceManifest {
  const period = getPeriod(input.periodId);
  if (!period || period.legalEntityId !== input.legalEntityId) {
    throw new M07ValidationError("not-found", "Period not found for manifest");
  }

  const readiness =
    input.readiness ??
    assessPeriodReadiness(actor, {
      legalEntityId: input.legalEntityId,
      periodId: input.periodId,
    });

  if (readiness.status !== "ready") {
    throw new M07ValidationError(
      "readiness-incomplete",
      `Cannot build submission manifest while readiness is ${readiness.status}`
    );
  }

  const eligibleIds = readiness.people
    .filter((p) => p.status === "ready")
    .map((p) => p.personId)
    .sort();

  const calculations: PayPeriodSourceManifest["calculations"] = [];
  const profiles: PayPeriodSourceManifest["profiles"] = [];
  const deductionInputs: PayPeriodSourceManifest["deductionInputs"] = [];
  const leavePrep: PayPeriodSourceManifest["leavePrep"] = [];

  for (const personId of eligibleIds) {
    const batches = listPersonCalculationBatches(
      actor,
      input.legalEntityId,
      personId,
      input.periodId
    ).filter((b) => b.status === "completed");
    const latest = batches.sort((a, b) => b.batchVersion - a.batchVersion)[0];
    if (!latest) {
      throw new M07ValidationError(
        "manifest-incomplete",
        `Missing completed calculation for ${personId}`
      );
    }
    const snap = getPublishedTimesheetSnapshotById(
      { organisationId: input.legalEntityId, legalEntityId: input.legalEntityId },
      latest.snapshotId
    );
    if (!snap) {
      throw new M07ValidationError(
        "manifest-incomplete",
        `Missing snapshot for calculation ${latest.id}`
      );
    }
    calculations.push({
      personId,
      batchId: latest.id,
      batchVersion: latest.batchVersion,
      snapshotId: snap.id,
      snapshotSourceVersion: snap.sourceVersion,
      contentHash: snap.contentHash,
    });

    const profile = listProfiles(input.legalEntityId).find(
      (p) => p.personId === personId && p.status === "active"
    );
    if (!profile) {
      throw new M07ValidationError("manifest-incomplete", `Missing profile for ${personId}`);
    }
    const map = listClassificationMaps(input.legalEntityId).find(
      (m) =>
        m.m04ClassificationRef === profile.m04ClassificationRef &&
        m.status === "active"
    );
    profiles.push({
      personId,
      profileId: profile.id,
      profileVersion: profile.version,
      classificationRef: profile.m04ClassificationRef ?? null,
      mappingId: map?.id,
      mappingVersion: map?.version,
    });

    for (const d of listActiveDeductionPrepInputs(actor, input.legalEntityId, {
      periodId: input.periodId,
      personId,
    })) {
      deductionInputs.push({
        personId,
        inputId: d.id,
        inputVersion: d.version,
      });
    }

    for (const l of listLeavePrepLines(input.legalEntityId).filter(
      (x) =>
        x.personId === personId &&
        x.periodId === input.periodId &&
        x.status === "prepared"
    )) {
      leavePrep.push({
        personId,
        leavePrepLineId: l.id,
        m04LeaveRecordId: l.m04LeaveRecordId,
        m04LeaveVersion: l.m04LeaveVersion,
      });
    }
  }

  const exceptions = listExceptions(input.legalEntityId)
    .filter(
      (e) =>
        e.periodId === input.periodId &&
        eligibleIds.includes(e.personId) &&
        (e.status === "resolved" || e.status === "waived" || e.status === "open")
    )
    .map((e) => ({
      id: e.id,
      personId: e.personId,
      status: e.status,
      version: e.version,
      kind: e.kind,
      waivedBy: e.waivedBy,
      waiverReason: e.waiverReason,
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  if (exceptions.some((e) => e.status === "open")) {
    throw new M07ValidationError(
      "manifest-incomplete",
      "Open exceptions present — cannot pin submission manifest"
    );
  }

  const body: Omit<PayPeriodSourceManifest, "checksum"> = {
    tenantId: input.legalEntityId,
    legalEntityId: input.legalEntityId,
    periodId: input.periodId,
    periodVersion: input.periodVersionOverride ?? period.version,
    includedClinicIds: [...readiness.includedClinicIds].sort(),
    eligiblePersonIds: eligibleIds,
    calculations: calculations.sort((a, b) => a.personId.localeCompare(b.personId)),
    profiles: profiles.sort((a, b) => a.personId.localeCompare(b.personId)),
    deductionInputs: deductionInputs.sort(
      (a, b) => a.personId.localeCompare(b.personId) || a.inputId.localeCompare(b.inputId)
    ),
    leavePrep: leavePrep.sort(
      (a, b) =>
        a.personId.localeCompare(b.personId) ||
        a.leavePrepLineId.localeCompare(b.leavePrepLineId)
    ),
    exceptions,
    exclusions: [...readiness.exclusions].sort((a, b) =>
      a.personId.localeCompare(b.personId)
    ),
    readinessStatus: readiness.status,
    readinessVersion: readiness.version,
    submittedBy: input.submittedBy,
    submittedAt: input.submittedAt,
  };

  const checksum = checksumCanonical(body);
  return { ...body, checksum };
}

export function verifyManifestAgainstCurrent(
  actor: M07Actor,
  pinned: PayPeriodSourceManifest
): { ok: true } | { ok: false; reason: string } {
  try {
    const rebuilt = buildSourceManifest(actor, {
      legalEntityId: pinned.legalEntityId,
      periodId: pinned.periodId,
      submittedBy: pinned.submittedBy,
      submittedAt: pinned.submittedAt,
      periodVersionOverride: pinned.periodVersion,
    });
    if (rebuilt.checksum !== pinned.checksum) {
      return { ok: false, reason: "manifest-checksum-mismatch" };
    }
    const bodyCheck = checksumCanonical(bodyWithoutChecksum(rebuilt));
    if (bodyCheck !== rebuilt.checksum) {
      return { ok: false, reason: "manifest-checksum-corrupt" };
    }
    // Also require live period version still matches pin (no silent period mutation)
    const period = getPeriod(pinned.periodId);
    if (!period || period.version !== pinned.periodVersion) {
      return { ok: false, reason: "period-version-mismatch" };
    }
    return { ok: true };
  } catch (e) {
    const reason =
      e instanceof M07ValidationError ? e.reason : "manifest-reproduce-failed";
    return { ok: false, reason };
  }
}
