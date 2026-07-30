"use client";

/**
 * PPA-1 Foundation — Adjustments section shell (isolated UI lane; pending integration).
 *
 * Not wired to section-meta / navigation on this branch. Integration agent must mount this
 * section and supply real PPA service data via props/callbacks.
 *
 * Unlock/reopen is NOT a prior-period adjustment.
 */

import { useState } from "react";
import { M07_NON_CERTIFIED_DISCLAIMER } from "../types/domain";
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
};

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

  return (
    <section
      className="m07-ppa-shell space-y-4 min-w-0 overflow-x-hidden"
      aria-labelledby="m07-adjustments-heading"
      data-m07-section="adjustments"
      data-m07-ppa-lane="isolated-ui-pending-integration"
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
          className="text-xs font-semibold uppercase tracking-wide text-amber-900 dark:text-amber-200"
          role="status"
        >
          PPA-1 foundation UI · isolated · pending integration
        </p>
        <h2 id="m07-adjustments-heading" className="mt-1 text-lg font-bold text-[var(--ink)]">
          Prior-period adjustments
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Create and review prior-period adjustment cases against locked ordinary sources. This lane
          is not wired to production navigation or the PPA service yet. Unlock/reopen is not a PPA.
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
