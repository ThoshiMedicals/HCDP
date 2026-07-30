/**
 * PPA-1 Foundation UI — isolated lane tests (pending integration).
 * Does not wire production ppa-service / section-meta / navigation.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  AdjustmentRegister,
  type PpaUiCase,
} from "../sections/adjustments/AdjustmentRegister";
import {
  CreateAdjustmentForm,
  buildCreateAdjustmentPayload,
  validateCreateAdjustmentInput,
} from "../sections/adjustments/CreateAdjustmentForm";
import { AdjustmentCaseDetail } from "../sections/adjustments/AdjustmentCaseDetail";
import { AdjustmentsSection } from "../sections/AdjustmentsSection";

const ROOT = process.cwd();

const SAMPLE_DRAFT: PpaUiCase = {
  id: "ppa-1",
  status: "draft",
  sourcePeriodId: "period-src-1",
  sourcePeriodLabel: "Fortnight 2026-07-01",
  adjustmentPeriodId: "period-adj-1",
  legalEntityId: "le-1",
  reasonCode: "manual-correction",
  reasonText: "Late timesheet after lock",
  evidenceRefs: ["ev-1"],
  createdAt: "2026-07-30T01:00:00.000Z",
  createdBy: "clerk-1",
  sourcePeriodVersion: 3,
  sourceLockedAt: "2026-07-29T12:00:00.000Z",
  sourceLockedBy: "mgr-1",
  sourceLockId: "lock-1",
  sourceExportBatchId: "exp-1",
  sourceExportChecksum: "abc123",
};

const SAMPLE_CANCELLED: PpaUiCase = {
  ...SAMPLE_DRAFT,
  id: "ppa-2",
  status: "cancelled",
  adjustmentPeriodId: "period-adj-2",
  cancelledAt: "2026-07-30T02:00:00.000Z",
  cancelledBy: "clerk-1",
  cancelReason: "Created in error",
};

const LOCKED_SOURCES = [
  {
    periodId: "period-src-1",
    label: "Fortnight 2026-07-01",
    periodStart: "2026-07-01",
    periodEnd: "2026-07-14",
    legalEntityId: "le-1",
    lockedAt: "2026-07-29T12:00:00.000Z",
  },
];

function html(node: ReactElement): string {
  return renderToStaticMarkup(node);
}

describe("M07 PPA-1 UI (isolated · pending integration)", () => {
  it("labels lane as isolated UI pending integration", () => {
    const markup = html(createElement(AdjustmentsSection, {}));
    assert.match(markup, /isolated · pending integration/i);
    assert.match(markup, /data-m07-ppa-lane="isolated-ui-pending-integration"/);
    assert.match(markup, /Unlock\/reopen is not a PPA/i);
  });

  it("register renders rows with status, source, adjustment period, LE, reason, created actor", () => {
    const markup = html(
      createElement(AdjustmentRegister, {
        cases: [SAMPLE_DRAFT, SAMPLE_CANCELLED],
        onOpenCase: () => {},
        onCreate: () => {},
      })
    );
    assert.match(markup, /data-m07-ppa-row="ppa-1"/);
    assert.match(markup, /data-m07-ppa-row="ppa-2"/);
    assert.match(markup, /Fortnight 2026-07-01/);
    assert.match(markup, /period-adj-1/);
    assert.match(markup, /le-1/);
    assert.match(markup, /manual-correction/);
    assert.match(markup, /Late timesheet after lock/);
    assert.match(markup, /clerk-1/);
    assert.match(markup, /Open adjustment ppa-1/);
    assert.match(markup, /data-status="draft"/);
    assert.match(markup, /data-status="cancelled"/);
  });

  it("register empty state offers create CTA", () => {
    const markup = html(
      createElement(AdjustmentRegister, {
        cases: [],
        onOpenCase: () => {},
        onCreate: () => {},
      })
    );
    assert.match(markup, /data-m07-ppa-empty="true"/);
    assert.match(markup, /No prior-period adjustments yet/);
    assert.match(markup, /Create first adjustment/);
  });

  it("validates mandatory reason code and text; allows optional evidence", () => {
    const missing = validateCreateAdjustmentInput({
      sourcePeriodId: "period-src-1",
      reasonCode: "  ",
      reasonText: "",
    });
    assert.equal(missing.ok, false);
    assert.ok(missing.fieldErrors.reasonCode);
    assert.ok(missing.fieldErrors.reasonText);

    const withoutEvidence = validateCreateAdjustmentInput({
      sourcePeriodId: "period-src-1",
      reasonCode: "manual-correction",
      reasonText: "Authorized correction",
    });
    assert.equal(withoutEvidence.ok, true);
    assert.equal(withoutEvidence.evidenceRefs, undefined);
    const payloadNoEv = buildCreateAdjustmentPayload(withoutEvidence);
    assert.deepEqual(payloadNoEv, {
      sourcePeriodId: "period-src-1",
      reasonCode: "manual-correction",
      reasonText: "Authorized correction",
    });

    const withEvidence = validateCreateAdjustmentInput({
      sourcePeriodId: "period-src-1",
      reasonCode: "manual-correction",
      reasonText: "Authorized correction",
      evidenceText: "ev-a, ev-b\nev-c",
    });
    assert.equal(withEvidence.ok, true);
    assert.deepEqual(withEvidence.evidenceRefs, ["ev-a", "ev-b", "ev-c"]);
    const payload = buildCreateAdjustmentPayload(withEvidence);
    assert.deepEqual(payload, {
      sourcePeriodId: "period-src-1",
      reasonCode: "manual-correction",
      reasonText: "Authorized correction",
      evidenceRefs: ["ev-a", "ev-b", "ev-c"],
    });
  });

  it("create form shows unlock≠PPA warning, labelled fields, and disables while submitting", () => {
    const idle = html(
      createElement(CreateAdjustmentForm, {
        lockedSources: LOCKED_SOURCES,
        onSubmit: () => {},
        onCancel: () => {},
      })
    );
    assert.match(idle, /data-m07-ppa-unlock-warning="true"/);
    assert.match(idle, /Unlock or reopen is not a prior-period adjustment/);
    assert.match(idle, /Locked ordinary source period/);
    assert.match(idle, /Reason code/);
    assert.match(idle, /Reason text/);
    assert.match(idle, /Evidence references/);
    assert.match(idle, /\(optional\)/);

    const submitting = html(
      createElement(CreateAdjustmentForm, {
        lockedSources: LOCKED_SOURCES,
        submitting: true,
        onSubmit: () => {},
        onCancel: () => {},
      })
    );
    assert.match(submitting, /Submitting prior-period adjustment/);
    assert.match(submitting, /Creating…/);
    assert.match(submitting, /disabled=""/);
  });

  it("surfaces create error and denied state via props", () => {
    const errored = html(
      createElement(CreateAdjustmentForm, {
        lockedSources: LOCKED_SOURCES,
        error: "source-not-locked",
        onSubmit: () => {},
        onCancel: () => {},
      })
    );
    assert.match(errored, /role="alert"/);
    assert.match(errored, /source-not-locked/);

    const denied = html(
      createElement(AdjustmentsSection, {
        canView: false,
        viewDeniedReason: "Requires payroll.adjust",
      })
    );
    assert.match(denied, /data-m07-ppa-denied="true"/);
    assert.match(denied, /Requires payroll.adjust/);
  });

  it("detail shows pins and cancel only for draft", () => {
    const draft = html(
      createElement(AdjustmentCaseDetail, {
        caseRow: SAMPLE_DRAFT,
        onBack: () => {},
        onCancelDraft: () => {},
      })
    );
    assert.match(draft, /Immutable source pins/);
    assert.match(draft, /sourcePeriodVersion|Source period version/);
    assert.match(draft, /lock-1/);
    assert.match(draft, /exp-1/);
    assert.match(draft, /abc123/);
    assert.match(draft, /data-m07-ppa-cancel="true"/);
    assert.match(draft, /Cancel draft/);

    const cancelled = html(
      createElement(AdjustmentCaseDetail, {
        caseRow: SAMPLE_CANCELLED,
        onBack: () => {},
        onCancelDraft: () => {},
      })
    );
    assert.doesNotMatch(cancelled, /data-m07-ppa-cancel="true"/);
    assert.match(cancelled, /Cancel is only available while the adjustment is in draft status/);
  });

  it("exposes no calculation, approval, export, or payment controls", () => {
    const section = html(
      createElement(AdjustmentsSection, {
        cases: [SAMPLE_DRAFT],
        lockedSources: LOCKED_SOURCES,
        initialView: "detail",
        initialSelectedCaseId: "ppa-1",
      })
    );
    assert.match(section, /data-m07-ppa-no-downstream="true"/);
    assert.match(section, /No calculation, approval, export, payment/i);
    assert.doesNotMatch(section, />Calculate</);
    assert.doesNotMatch(section, />Approve</);
    assert.doesNotMatch(section, />Export</);
    assert.doesNotMatch(section, />Mark as paid</);
    assert.doesNotMatch(section, /bank file/i);
    assert.doesNotMatch(section, /STP submission/i);

    const createSrc = readFileSync(
      join(ROOT, "src/modules/m07-staff-pay/sections/adjustments/CreateAdjustmentForm.tsx"),
      "utf8"
    );
    const detailSrc = readFileSync(
      join(ROOT, "src/modules/m07-staff-pay/sections/adjustments/AdjustmentCaseDetail.tsx"),
      "utf8"
    );
    const sectionSrc = readFileSync(
      join(ROOT, "src/modules/m07-staff-pay/sections/AdjustmentsSection.tsx"),
      "utf8"
    );
    for (const src of [createSrc, detailSrc, sectionSrc]) {
      assert.doesNotMatch(src, /from ["'].*ppa-service/);
      assert.doesNotMatch(src, /from ["'].*calculate-service/);
      assert.doesNotMatch(src, /from ["'].*export-service/);
      assert.doesNotMatch(src, /from ["'].*approval-service/);
    }
  });

  it("keyboard/a11y: labelled controls, status/error roles, focus and reduced-motion shell", () => {
    const form = html(
      createElement(CreateAdjustmentForm, {
        lockedSources: LOCKED_SOURCES,
        onSubmit: () => {},
        onCancel: () => {},
      })
    );
    assert.match(form, /\sfor="/);
    assert.match(form, /Reason code/);
    assert.match(form, /aria-labelledby="m07-ppa-create-heading"/);

    const shell = html(createElement(AdjustmentsSection, { cases: [SAMPLE_DRAFT] }));
    assert.match(shell, /:focus-visible/);
    assert.match(shell, /prefers-reduced-motion/);
    assert.match(shell, /overflow-x-hidden/);
    assert.match(shell, /aria-labelledby="m07-adjustments-heading"/);

    const register = html(
      createElement(AdjustmentRegister, {
        cases: [SAMPLE_DRAFT],
        onOpenCase: () => {},
        onCreate: () => {},
      })
    );
    assert.match(register, /aria-label="Open adjustment ppa-1"/);
    assert.match(register, /scope="col"/);
  });

  it("does not modify section-meta or navigation wiring on this lane", () => {
    const meta = readFileSync(join(ROOT, "src/modules/m07-staff-pay/section-meta.ts"), "utf8");
    assert.match(meta, /adjustments: \{ label: "Adjustments", batch1: "planned" \}/);

    const workspace = readFileSync(
      join(ROOT, "src/modules/m07-staff-pay/StaffPayWorkspace.tsx"),
      "utf8"
    );
    assert.doesNotMatch(workspace, /AdjustmentsSection/);

    const index = readFileSync(join(ROOT, "src/modules/m07-staff-pay/sections/index.ts"), "utf8");
    assert.doesNotMatch(index, /AdjustmentsSection/);
  });
});
