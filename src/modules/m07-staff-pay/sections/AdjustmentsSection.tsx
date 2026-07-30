"use client";

/**
 * PPA-1 Foundation — Adjustments section.
 *
 * Presentational `AdjustmentsSection` remains prop-driven for isolated UI tests.
 * Production shell mounts `ConnectedAdjustmentsSection`, which wires real ppa-service
 * + authoritative M07 actor/LE/clinic context.
 *
 * Unlock/reopen is NOT a prior-period adjustment.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useStaffPay } from "../context";
import {
  hasM07Permission,
  M07ClinicScopeError,
  M07LegalEntityScopeError,
  M07PermissionError,
  M07ValidationError,
} from "../permissions";
import { getPeriod, listPeriods } from "../repository/local-store";
import {
  cancelPriorPeriodAdjustmentDraft,
  createPriorPeriodAdjustment,
  listPriorPeriodAdjustmentsForEntity,
} from "../services/ppa-service";
import { M07_NON_CERTIFIED_DISCLAIMER, type PriorPeriodAdjustment } from "../types/domain";
import {
  AdjustmentRegister,
  type PpaUiCase,
} from "./adjustments/AdjustmentRegister";
import {
  CreateAdjustmentForm,
  type CreatePpaUiPayload,
  type PpaUiLockedSourceOption,
} from "./adjustments/CreateAdjustmentForm";
import { AdjustmentCaseDetail } from "./adjustments/AdjustmentCaseDetail";

export type { PpaUiCase, PpaUiCaseStatus } from "./adjustments/AdjustmentRegister";
export type {
  CreatePpaUiPayload,
  PpaUiLockedSourceOption,
} from "./adjustments/CreateAdjustmentForm";

export type AdjustmentsSectionView = "register" | "create" | "detail";

export type AdjustmentsSectionProps = {
  cases?: PpaUiCase[];
  lockedSources?: PpaUiLockedSourceOption[];
  loading?: boolean;
  /** Register / list error (permission or load failure). */
  error?: string | null;
  /** Create-form submission error from the host. */
  createError?: string | null;
  /** Detail load / action error from the host. */
  detailError?: string | null;
  submitting?: boolean;
  cancelling?: boolean;
  /** When false, register/create/detail show denied affordances. */
  canView?: boolean;
  canCreate?: boolean;
  canCancel?: boolean;
  viewDeniedReason?: string;
  createDeniedReason?: string;
  cancelDeniedReason?: string;
  initialView?: AdjustmentsSectionView;
  initialSelectedCaseId?: string | null;
  onCreate?: (payload: CreatePpaUiPayload) => void;
  onCancelDraft?: (caseId: string) => void;
  onOpenCase?: (caseId: string) => void;
  /** Defaults to isolated for focused UI tests; production connected host sets "wired". */
  integrationStatus?: "isolated" | "wired";
};

function formatPeriodLabel(periodStart: string, periodEnd: string, state?: string): string {
  const base = `${periodStart} → ${periodEnd}`;
  return state ? `${base} (${state})` : base;
}

export function mapPriorPeriodAdjustmentToUiCase(
  row: PriorPeriodAdjustment,
  sourceLabel?: string
): PpaUiCase {
  return {
    id: row.id,
    status: row.status,
    sourcePeriodId: row.sourcePeriodId,
    sourcePeriodLabel: sourceLabel,
    adjustmentPeriodId: row.adjustmentPeriodId,
    legalEntityId: row.legalEntityId,
    reasonCode: row.reasonCode,
    reasonText: row.reasonText,
    evidenceRefs: row.evidenceRefs,
    createdAt: row.createdAt,
    createdBy: row.createdBy,
    updatedAt: row.updatedAt,
    updatedBy: row.updatedBy,
    sourcePeriodVersion: row.sourcePeriodVersion,
    sourceLockedAt: row.sourceLockedAt,
    sourceLockedBy: row.sourceLockedBy,
    sourceLockId: row.sourceLockId,
    sourceExportBatchId: row.sourceExportBatchId,
    sourceExportChecksum: row.sourceExportChecksum,
    sourceManifestChecksum: row.sourceManifestChecksum,
    sourceReconciliationId: row.sourceReconciliationId,
    sourceApprovalId: row.sourceApprovalId,
    cancelledAt: row.cancelledAt,
    cancelledBy: row.cancelledBy,
    cancelReason: row.cancelReason,
  };
}

/**
 * Locked ordinary sources only — excludes adjustment periods; respects actor clinic scope.
 * Does not widen caller LE beyond authoritative period.legalEntityId.
 */
export function listLockedOrdinarySourceOptionsForActor(input: {
  legalEntityId: string;
  clinicIds?: string[];
}): PpaUiLockedSourceOption[] {
  const periods = listPeriods(input.legalEntityId);
  return periods
    .filter((p) => p.kind === "ordinary" && p.state === "locked")
    .filter((p) => {
      if (input.clinicIds === undefined) return true;
      if (!input.clinicIds.length) return false;
      const known = (p.clinicIds ?? []).filter(Boolean);
      if (!known.length) return true;
      return known.some((id) => input.clinicIds!.includes(id));
    })
    .map((p) => ({
      periodId: p.id,
      label: formatPeriodLabel(p.periodStart, p.periodEnd, p.state),
      periodStart: p.periodStart,
      periodEnd: p.periodEnd,
      legalEntityId: p.legalEntityId,
      lockedAt: p.lockedAt ?? null,
    }))
    .sort((a, b) => a.periodStart.localeCompare(b.periodStart) || a.periodId.localeCompare(b.periodId));
}

function errorMessage(err: unknown): string {
  if (
    err instanceof M07PermissionError ||
    err instanceof M07ValidationError ||
    err instanceof M07LegalEntityScopeError ||
    err instanceof M07ClinicScopeError
  ) {
    return err.message;
  }
  return err instanceof Error ? err.message : "Action failed";
}

function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `ppa1-${crypto.randomUUID()}`;
  }
  return `ppa1-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function AdjustmentsSection({
  cases = [],
  lockedSources = [],
  loading = false,
  error = null,
  createError = null,
  detailError = null,
  submitting = false,
  cancelling = false,
  canView = true,
  canCreate = true,
  canCancel = true,
  viewDeniedReason,
  createDeniedReason,
  cancelDeniedReason,
  initialView = "register",
  initialSelectedCaseId = null,
  onCreate,
  onCancelDraft,
  onOpenCase,
  integrationStatus = "isolated",
}: AdjustmentsSectionProps) {
  const [view, setView] = useState<AdjustmentsSectionView>(initialView);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(initialSelectedCaseId);

  const selectedCase = selectedCaseId
    ? cases.find((c) => c.id === selectedCaseId) ?? null
    : null;

  function openCase(caseId: string) {
    setSelectedCaseId(caseId);
    setView("detail");
    onOpenCase?.(caseId);
  }

  function goRegister() {
    setView("register");
    setSelectedCaseId(null);
  }

  function handleCreate(payload: CreatePpaUiPayload) {
    onCreate?.(payload);
  }

  function handleCancelDraft(caseId: string) {
    onCancelDraft?.(caseId);
  }

  const wired = integrationStatus === "wired";

  return (
    <section
      className="m07-ppa-shell space-y-4 min-w-0 overflow-x-hidden"
      aria-labelledby="m07-adjustments-heading"
      data-m07-section="adjustments"
      data-m07-ppa-lane={wired ? "ppa1-foundation-wired" : "isolated-ui-pending-integration"}
    >
      <style>{`
        .m07-ppa-shell :focus-visible {
          outline: 2px solid var(--ink, #111);
          outline-offset: 2px;
        }
        @media (prefers-reduced-motion: reduce) {
          .m07-ppa-shell * {
            transition: none !important;
            animation: none !important;
          }
        }
        @media (min-width: 390px) and (max-width: 1440px) {
          .m07-ppa-shell {
            max-width: 100%;
          }
        }
      `}</style>

      <div className="rounded-2xl border border-[var(--v34-card-line)] bg-[var(--card)] p-6 min-w-0">
        <p
          className={
            wired
              ? "hcdp-type-meta text-[var(--accent-positive)]"
              : "hcdp-type-meta text-[var(--status-warning)]"
          }
          role="status"
        >
          {wired
            ? "PPA-1 foundation · available · register / create / cancel draft"
            : "PPA-1 foundation UI · isolated · pending integration"}
        </p>
        <h2 id="m07-adjustments-heading" className="hcdp-type-heading mt-1 text-[var(--ink)]">
          Prior-period adjustments
        </h2>
        <p className="hcdp-type-body mt-2 text-[var(--muted)]">
          {wired
            ? "Create and review prior-period adjustment cases against locked ordinary sources. Unlock/reopen is not a PPA."
            : "Create and review prior-period adjustment cases against locked ordinary sources. This lane is not wired to production navigation or the PPA service yet. Unlock/reopen is not a PPA."}
        </p>
        <p className="mt-2 text-xs text-[var(--muted)]">{M07_NON_CERTIFIED_DISCLAIMER}</p>
        <p className="mt-2 text-xs text-[var(--muted)]" data-m07-ppa-scope="true">
          Scope: register, create, cancel draft, immutable pins. No calculation, approval, export,
          payment, bank, STP, superannuation, Xero, or Module 8 controls.
        </p>
      </div>

      {!canView ? (
        <div
          className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          role="alert"
          data-m07-ppa-denied="true"
        >
          {viewDeniedReason ||
            "Permission denied — prior-period adjustment view is required."}
        </div>
      ) : null}

      {canView && error ? (
        <div
          className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          role="alert"
          data-m07-ppa-error="true"
        >
          {error}
        </div>
      ) : null}

      {canView && view === "register" ? (
        <div className="rounded-2xl border border-[var(--v34-card-line)] bg-[var(--card)] p-6 min-w-0">
          <AdjustmentRegister
            cases={cases}
            loading={loading}
            onOpenCase={openCase}
            onCreate={() => setView("create")}
            canCreate={canCreate}
            createDeniedReason={createDeniedReason}
          />
        </div>
      ) : null}

      {canView && view === "create" ? (
        <div className="rounded-2xl border border-[var(--v34-card-line)] bg-[var(--card)] p-6 min-w-0">
          <CreateAdjustmentForm
            lockedSources={lockedSources}
            submitting={submitting}
            error={createError}
            onSubmit={handleCreate}
            onCancel={goRegister}
            canCreate={canCreate}
            createDeniedReason={createDeniedReason}
          />
        </div>
      ) : null}

      {canView && view === "detail" ? (
        <div className="rounded-2xl border border-[var(--v34-card-line)] bg-[var(--card)] p-6 min-w-0">
          <AdjustmentCaseDetail
            caseRow={selectedCase}
            loading={loading}
            error={detailError}
            cancelling={cancelling}
            onBack={goRegister}
            onCancelDraft={onCancelDraft ? handleCancelDraft : undefined}
            canCancel={canCancel}
            cancelDeniedReason={cancelDeniedReason}
          />
        </div>
      ) : null}
    </section>
  );
}

/**
 * Production M07 shell host — real ppa-service + StaffPay context.
 * Idempotency key is unique per intentional submit and preserved across retries of that submission.
 */
export function ConnectedAdjustmentsSection() {
  const { actor, legalEntityId, refresh, tick } = useStaffPay();
  const canAdjust = hasM07Permission(actor, "payroll.adjust");

  const [cases, setCases] = useState<PpaUiCase[]>([]);
  const [lockedSources, setLockedSources] = useState<PpaUiLockedSourceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Preserve idempotency key across retries of the same intentional submission.
  const pendingIdempotencyKeyRef = useRef<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    try {
      if (!canAdjust) {
        setCases([]);
        setLockedSources([]);
        setError(null);
        return;
      }
      const rows = listPriorPeriodAdjustmentsForEntity(actor, legalEntityId);
      const uiCases = rows.map((row) => {
        const source = getPeriod(row.sourcePeriodId);
        const label = source
          ? formatPeriodLabel(source.periodStart, source.periodEnd, source.state)
          : undefined;
        return mapPriorPeriodAdjustmentToUiCase(row, label);
      });
      setCases(uiCases);
      setLockedSources(
        listLockedOrdinarySourceOptionsForActor({
          legalEntityId,
          clinicIds: actor.clinicIds,
        })
      );
    } catch (err) {
      setCases([]);
      setLockedSources([]);
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [actor, legalEntityId, canAdjust]);

  useEffect(() => {
    load();
  }, [load, tick]);

  const deniedReason = "Requires payroll.adjust";

  function handleCreate(payload: CreatePpaUiPayload) {
    setCreateError(null);
    setSubmitting(true);
    if (!pendingIdempotencyKeyRef.current) {
      pendingIdempotencyKeyRef.current = newIdempotencyKey();
    }
    const idempotencyKey = pendingIdempotencyKeyRef.current;
    try {
      createPriorPeriodAdjustment(actor, {
        sourcePeriodId: payload.sourcePeriodId,
        reasonCode: payload.reasonCode,
        reasonText: payload.reasonText,
        evidenceRefs: payload.evidenceRefs,
        idempotencyKey,
        legalEntityId,
      });
      pendingIdempotencyKeyRef.current = null;
      setCreateError(null);
      refresh();
      load();
    } catch (err) {
      setCreateError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancelDraft(caseId: string) {
    setDetailError(null);
    setCancelling(true);
    try {
      cancelPriorPeriodAdjustmentDraft(actor, { ppaId: caseId, reason: "cancelled from adjustments UI" });
      refresh();
      load();
    } catch (err) {
      setDetailError(errorMessage(err));
    } finally {
      setCancelling(false);
    }
  }

  // Clear pending idempotency when actor/LE changes (new intentional context).
  useEffect(() => {
    pendingIdempotencyKeyRef.current = null;
  }, [actor.userId, legalEntityId]);

  return (
    <AdjustmentsSection
      integrationStatus="wired"
      cases={cases}
      lockedSources={lockedSources}
      loading={loading}
      error={error}
      createError={createError}
      detailError={detailError}
      submitting={submitting}
      cancelling={cancelling}
      canView={canAdjust}
      canCreate={canAdjust}
      canCancel={canAdjust}
      viewDeniedReason={deniedReason}
      createDeniedReason={deniedReason}
      cancelDeniedReason={deniedReason}
      onCreate={handleCreate}
      onCancelDraft={handleCancelDraft}
    />
  );
}
