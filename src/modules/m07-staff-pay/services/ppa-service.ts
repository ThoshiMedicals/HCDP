/**
 * PPA-1 Foundation — Prior-Period Adjustment service (core domain lane).
 *
 * Creates an immutable-linked PPA case + dedicated kind=adjustment period against a
 * locked ordinary source. No delta lines, calculation, approval, export, or payment.
 *
 * Atomicity: platform localStorage helpers are not multi-key transactional.
 * Create validates fully before any write, pre-assigns ids, writes period then case,
 * verifies both, and compensates (archive period) if case persistence fails.
 * True cross-key rollback is not proven — treat residual orphan risk as a PPA-1
 * acceptance qualification for QA/integration (fail-closed; do not claim unproven rollback).
 */

import {
  assertM07ClinicScope,
  assertM07LegalEntityScope,
  assertM07Permission,
  M07ValidationError,
  type M07Actor,
} from "../permissions";
import {
  getActivePeriodLockForPeriod,
  getCurrentApprovalForPeriod,
  getCurrentExportBatchForPeriod,
  getPeriod,
  listPeriods,
  newPeriodId,
  upsertPeriod,
} from "../repository/local-store";
import {
  findOpenPriorPeriodAdjustmentForSource,
  findPriorPeriodAdjustmentByIdempotencyKey,
  getPriorPeriodAdjustment,
  listPriorPeriodAdjustments,
  newPriorPeriodAdjustmentId,
  upsertPriorPeriodAdjustment,
} from "../storage/ppa-repository";
import type { PriorPeriodAdjustment } from "../types/domain";
import { recordM07Audit } from "./audit-service";
import { createAdjustmentPayPeriod } from "./period-service";
import { isCanonicalCalendarDate } from "./period-lock-guard";
import { assertNoProhibitedFields } from "./sensitive-fields";

function sameStringArray(a: string[] | undefined, b: string[] | undefined): boolean {
  const left = [...(a ?? [])].map(String).sort();
  const right = [...(b ?? [])].map(String).sort();
  if (left.length !== right.length) return false;
  return left.every((v, i) => v === right[i]);
}

function assertConsistentCaseAndPeriod(ppa: PriorPeriodAdjustment): void {
  const period = getPeriod(ppa.adjustmentPeriodId);
  if (!period) {
    throw new M07ValidationError(
      "ppa-orphan-period-missing",
      "PPA case references a missing adjustment period"
    );
  }
  if (period.kind !== "adjustment") {
    throw new M07ValidationError(
      "ppa-orphan-period-kind",
      "Linked period is not kind=adjustment"
    );
  }
  if (period.sourcePeriodId !== ppa.sourcePeriodId) {
    throw new M07ValidationError(
      "ppa-orphan-source-mismatch",
      "Adjustment period sourcePeriodId does not match PPA case"
    );
  }
  if (period.priorPeriodAdjustmentId !== ppa.id) {
    throw new M07ValidationError(
      "ppa-orphan-case-mismatch",
      "Adjustment period priorPeriodAdjustmentId does not match PPA case"
    );
  }
  if (period.legalEntityId !== ppa.legalEntityId) {
    throw new M07ValidationError(
      "ppa-orphan-le-mismatch",
      "Adjustment period legalEntityId does not match PPA case"
    );
  }
}

function archiveOrphanAdjustmentPeriod(
  actor: M07Actor,
  periodId: string,
  reason: string
): void {
  const period = getPeriod(periodId);
  if (!period) return;
  if (period.state === "archived") return;
  const now = new Date().toISOString();
  upsertPeriod({
    ...period,
    state: "archived",
    updatedAt: now,
    updatedBy: actor.userId,
    version: period.version + 1,
  });
  try {
    recordM07Audit({
      actor,
      action: "period.archive-orphan-adjustment",
      entityType: "pay-period",
      entityId: periodId,
      legalEntityId: period.legalEntityId,
      reason,
      before: period,
    });
  } catch {
    /* audit failure must not mask primary create failure */
  }
}

/** Fail-closed: cancel a draft case residual so it is not an open PPA after compensation. */
function cancelOrphanPpaCaseResidual(
  actor: M07Actor,
  ppaId: string,
  reason: string
): void {
  const existing = getPriorPeriodAdjustment(ppaId);
  if (!existing) return;
  if (existing.status === "cancelled") return;
  const now = new Date().toISOString();
  try {
    upsertPriorPeriodAdjustment({
      ...existing,
      status: "cancelled",
      // Free the original idempotency key so a deterministic retry can succeed.
      idempotencyKey: `${existing.idempotencyKey}__compensated-${now}`,
      version: existing.version + 1,
      updatedAt: now,
      updatedBy: actor.userId,
      cancelledAt: now,
      cancelledBy: actor.userId,
      cancelReason: reason,
    });
  } catch {
    /* best-effort compensation — residual may remain; qualify for QA */
  }
}

function isIdempotentReplayMatch(
  existing: PriorPeriodAdjustment,
  input: {
    sourcePeriodId: string;
    reasonCode: string;
    reasonText: string;
    evidenceRefs?: string[];
  }
): boolean {
  return (
    existing.sourcePeriodId === input.sourcePeriodId &&
    existing.reasonCode === input.reasonCode &&
    existing.reasonText === input.reasonText &&
    sameStringArray(existing.evidenceRefs, input.evidenceRefs)
  );
}

export function listPriorPeriodAdjustmentsForEntity(
  actor: M07Actor,
  legalEntityId: string
): PriorPeriodAdjustment[] {
  assertM07Permission(actor, "payroll.adjust");
  assertM07LegalEntityScope(actor, legalEntityId);
  return listPriorPeriodAdjustments(legalEntityId);
}

export function getPriorPeriodAdjustmentForActor(
  actor: M07Actor,
  ppaId: string
): PriorPeriodAdjustment | null {
  assertM07Permission(actor, "payroll.adjust");
  const row = getPriorPeriodAdjustment(ppaId);
  if (!row) return null;
  assertM07LegalEntityScope(actor, row.legalEntityId);
  const period = getPeriod(row.adjustmentPeriodId);
  if (period) assertM07ClinicScope(actor, period.clinicIds);
  return row;
}

export function createPriorPeriodAdjustment(
  actor: M07Actor,
  input: {
    sourcePeriodId: string;
    reasonCode: string;
    reasonText: string;
    idempotencyKey: string;
    evidenceRefs?: string[];
    /** Optional caller LE hint — must match authoritative source LE when provided. */
    legalEntityId?: string;
  }
): PriorPeriodAdjustment {
  assertM07Permission(actor, "payroll.adjust");
  assertNoProhibitedFields(input);

  if (!input.sourcePeriodId) {
    throw new M07ValidationError("source-period-required", "sourcePeriodId is required");
  }
  if (!input.idempotencyKey || !String(input.idempotencyKey).trim()) {
    throw new M07ValidationError("idempotency-key-required", "idempotencyKey is required");
  }
  if (!input.reasonCode || !String(input.reasonCode).trim()) {
    throw new M07ValidationError("missing-ppa-reason", "reasonCode is required");
  }
  if (!input.reasonText || !String(input.reasonText).trim()) {
    throw new M07ValidationError("missing-ppa-reason", "reasonText is required and must not be blank");
  }

  const source = getPeriod(input.sourcePeriodId);
  if (!source) {
    throw new M07ValidationError("source-period-not-found", "Source pay period was not found");
  }

  // Authoritative LE from stored source — reject caller widening / mismatch.
  const legalEntityId = source.legalEntityId;
  assertM07LegalEntityScope(actor, legalEntityId);
  assertM07ClinicScope(actor, source.clinicIds);
  if (input.legalEntityId != null && input.legalEntityId !== legalEntityId) {
    throw new M07ValidationError(
      "legal-entity-mismatch",
      "Caller legalEntityId does not match the authoritative source period legal entity"
    );
  }

  if (source.kind !== "ordinary") {
    throw new M07ValidationError(
      "source-not-ordinary",
      "PPA source period must be kind=ordinary"
    );
  }
  if (source.state !== "locked") {
    throw new M07ValidationError(
      "source-not-locked",
      "Only locked ordinary source periods are eligible for PPA"
    );
  }
  if (!isCanonicalCalendarDate(source.periodStart) || !isCanonicalCalendarDate(source.periodEnd)) {
    throw new M07ValidationError(
      "invalid-effective-date",
      "Source period dates must be canonical Gregorian YYYY-MM-DD"
    );
  }

  // Idempotent replay (same key + same material payload) — before duplicate-open check.
  // Cancelled / compensated residuals do not satisfy replay (key was freed or status terminal).
  const byKey = findPriorPeriodAdjustmentByIdempotencyKey(
    legalEntityId,
    input.idempotencyKey
  );
  if (byKey && byKey.status !== "cancelled") {
    if (!isIdempotentReplayMatch(byKey, input)) {
      throw new M07ValidationError(
        "conflicting-idempotency-replay",
        "idempotencyKey was reused with a conflicting PPA payload"
      );
    }
    assertConsistentCaseAndPeriod(byKey);
    try {
      recordM07Audit({
        actor,
        action: "ppa.create.replay",
        entityType: "prior-period-adjustment",
        entityId: byKey.id,
        legalEntityId: byKey.legalEntityId,
        after: byKey,
        reason: "idempotent replay",
        meta: { idempotencyKey: byKey.idempotencyKey },
      });
    } catch {
      /* replay audit is best-effort; business result remains the existing case */
    }
    return byKey;
  }

  const openExisting = findOpenPriorPeriodAdjustmentForSource(source.id);
  if (openExisting) {
    throw new M07ValidationError(
      "duplicate-open-ppa",
      `An open PPA already exists for source period ${source.id}`
    );
  }

  const lock = getActivePeriodLockForPeriod(source.id);
  const exportBatch = getCurrentExportBatchForPeriod(source.id);
  const approval = getCurrentApprovalForPeriod(source.id);

  const now = new Date().toISOString();
  const ppaId = newPriorPeriodAdjustmentId();
  const adjustmentPeriodId = newPeriodId();

  const draft: PriorPeriodAdjustment = {
    id: ppaId,
    legalEntityId,
    sourcePeriodId: source.id,
    adjustmentPeriodId,
    status: "draft",
    reasonCode: String(input.reasonCode).trim(),
    reasonText: String(input.reasonText).trim(),
    evidenceRefs: input.evidenceRefs ? [...input.evidenceRefs] : undefined,
    sourcePeriodVersion: source.version,
    sourceLockedAt: source.lockedAt ?? lock?.lockedAt ?? null,
    sourceLockedBy: source.lockedBy ?? lock?.lockedBy ?? null,
    sourceLockId: lock?.id ?? null,
    sourceExportBatchId: lock?.exportBatchId ?? exportBatch?.id ?? null,
    sourceExportChecksum:
      lock?.exportChecksum ?? exportBatch?.artifact?.checksum ?? null,
    sourceManifestChecksum:
      lock?.sourceManifestChecksum ?? exportBatch?.sourceManifestChecksum ?? null,
    sourceReconciliationId: lock?.reconciliationId ?? null,
    sourceApprovalId: lock?.approvalId ?? approval?.id ?? null,
    version: 1,
    idempotencyKey: input.idempotencyKey,
    createdAt: now,
    createdBy: actor.userId,
    updatedAt: now,
    updatedBy: actor.userId,
    cancelledAt: null,
    cancelledBy: null,
    cancelReason: null,
  };

  // Pre-write complete. Dual write: period first, then case; verify; compensate on failure.
  // Platform localStorage is not multi-key transactional — fail-closed compensation only.
  let periodWritten = false;
  let caseWritten = false;
  try {
    try {
      createAdjustmentPayPeriod(actor, {
        legalEntityId,
        sourcePeriodId: source.id,
        priorPeriodAdjustmentId: ppaId,
        clinicIds: source.clinicIds,
        periodStart: source.periodStart,
        periodEnd: source.periodEnd,
        cadence: source.cadence,
        periodId: adjustmentPeriodId,
      });
      periodWritten = true;
    } catch (periodErr) {
      // Period may already be persisted if createAdjustmentPayPeriod failed after upsert
      // (e.g. audit-write failure). Treat residual as written for fail-closed archive.
      if (getPeriod(adjustmentPeriodId)) periodWritten = true;
      throw periodErr;
    }

    upsertPriorPeriodAdjustment(draft);
    caseWritten = true;
    const storedCase = getPriorPeriodAdjustment(ppaId);
    if (!storedCase) {
      throw new M07ValidationError(
        "ppa-case-write-failed",
        "PPA case was not persisted after adjustment period create"
      );
    }
    assertConsistentCaseAndPeriod(storedCase);

    // Source must remain unchanged.
    const sourceAfter = getPeriod(source.id);
    if (
      !sourceAfter ||
      sourceAfter.version !== source.version ||
      sourceAfter.state !== "locked" ||
      sourceAfter.kind !== "ordinary"
    ) {
      throw new M07ValidationError(
        "source-period-mutated",
        "Source period changed during PPA create — refusing success"
      );
    }

    recordM07Audit({
      actor,
      action: "ppa.create",
      entityType: "prior-period-adjustment",
      entityId: storedCase.id,
      legalEntityId: storedCase.legalEntityId,
      after: storedCase,
      reason: storedCase.reasonText,
      meta: {
        reasonCode: storedCase.reasonCode,
        sourcePeriodId: storedCase.sourcePeriodId,
        adjustmentPeriodId: storedCase.adjustmentPeriodId,
        idempotencyKey: storedCase.idempotencyKey,
      },
    });

    return storedCase;
  } catch (err) {
    // Fail-closed: no success response; archive residual adjustment period; cancel residual open case.
    // True cross-key atomicity is NOT proven — residual archived periods / cancelled cases may remain.
    if (periodWritten || getPeriod(adjustmentPeriodId)) {
      archiveOrphanAdjustmentPeriod(
        actor,
        adjustmentPeriodId,
        "compensating archive after PPA create failure"
      );
    }
    if (caseWritten || getPriorPeriodAdjustment(ppaId)) {
      cancelOrphanPpaCaseResidual(
        actor,
        ppaId,
        "compensating cancel after PPA create failure"
      );
    }
    throw err;
  }
}

export function cancelPriorPeriodAdjustmentDraft(
  actor: M07Actor,
  input: {
    ppaId: string;
    reason?: string;
  }
): PriorPeriodAdjustment {
  assertM07Permission(actor, "payroll.adjust");
  assertNoProhibitedFields(input);

  const existing = getPriorPeriodAdjustment(input.ppaId);
  if (!existing) {
    throw new M07ValidationError("ppa-not-found", "Prior-period adjustment was not found");
  }
  assertM07LegalEntityScope(actor, existing.legalEntityId);
  const adjPeriod = getPeriod(existing.adjustmentPeriodId);
  if (adjPeriod) assertM07ClinicScope(actor, adjPeriod.clinicIds);

  // Idempotent cancel of already-cancelled draft.
  if (existing.status === "cancelled") {
    return existing;
  }

  if (existing.status !== "draft") {
    throw new M07ValidationError(
      "ppa-invalid-cancel-state",
      `PPA may only be cancelled while draft (current: ${String(existing.status)})`
    );
  }

  const now = new Date().toISOString();
  const cancelled: PriorPeriodAdjustment = {
    ...existing,
    status: "cancelled",
    version: existing.version + 1,
    updatedAt: now,
    updatedBy: actor.userId,
    cancelledAt: now,
    cancelledBy: actor.userId,
    cancelReason: input.reason?.trim() || "cancelled",
  };
  upsertPriorPeriodAdjustment(cancelled);

  if (adjPeriod && adjPeriod.state !== "archived") {
    upsertPeriod({
      ...adjPeriod,
      state: "archived",
      updatedAt: now,
      updatedBy: actor.userId,
      version: adjPeriod.version + 1,
    });
  }

  const stored = getPriorPeriodAdjustment(cancelled.id);
  if (!stored || stored.status !== "cancelled") {
    throw new M07ValidationError("ppa-cancel-write-failed", "PPA cancel was not persisted");
  }

  recordM07Audit({
    actor,
    action: "ppa.cancel",
    entityType: "prior-period-adjustment",
    entityId: stored.id,
    legalEntityId: stored.legalEntityId,
    before: existing,
    after: stored,
    reason: stored.cancelReason ?? undefined,
  });

  return stored;
}

/** Test / diagnostics helper — does not create PPAs. */
export function countPriorPeriodAdjustmentsForSource(sourcePeriodId: string): number {
  return listPriorPeriodAdjustments().filter((r) => r.sourcePeriodId === sourcePeriodId).length;
}

/** Lists adjustment periods for diagnostics (not a mutation API). */
export function listAdjustmentPeriodsForSource(sourcePeriodId: string) {
  return listPeriods().filter(
    (p) => p.kind === "adjustment" && p.sourcePeriodId === sourcePeriodId
  );
}
