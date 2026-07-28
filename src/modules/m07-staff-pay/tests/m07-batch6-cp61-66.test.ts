/**
 * Wave 6 / M07 Batch 6 — export preparation, reconciliation, lock/unlock.
 * Named groups A–K per owner implementation instruction.
 */

import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { publishTimesheetVersion } from "@/platform/workforce/services/published-timesheet-registry";
import { findInboxActionForSource } from "@/platform/services/action-inbox-bridge";

import {
  actorAll,
  actorApprover,
  actorClerk,
  actorExportOperator,
  actorPayAdmin,
  CLINIC_A,
  ORG_A,
  ORG_B,
  resetM07TestEnv,
} from "./_helpers";
import { createOrdinaryPayPeriod } from "../services/period-service";
import {
  createPayProfile,
  linkExternalPayrollEmployeeId,
} from "../services/profile-service";
import {
  createClassificationMapping,
  createPreparationRule,
} from "../services/rule-service";
import { calculatePersonOrdinaryAndOvertime } from "../services/calculate-service";
import {
  submitPeriodForReview,
  approvePeriodManagement,
} from "../services/approval-service";
import { verifyManifestAgainstCurrent } from "../services/source-manifest-service";
import { intakePublishedTimesheet } from "../services/published-timesheet-intake";
import { seedEligibilityForImportedSnapshot } from "../services/published-timesheet-lifecycle";
import {
  assertExportBatchTransition,
} from "../services/export-lifecycle";
import {
  createOrRefreshPayrollExportBatch,
  finalizePayrollExportBatch,
  cancelPayrollExportBatch,
} from "../services/export-service";
import { downloadPayrollExportArtifact } from "../services/export-download-service";
import { reconcileExportBatchAgainstApproval } from "../services/reconciliation-service";
import { explicitLockPayPeriod } from "../services/period-lock-service";
import {
  requestPeriodUnlock,
  approvePeriodUnlock,
  rejectPeriodUnlock,
} from "../services/period-unlock-service";
import { checksumCanonicalExport } from "../services/export-canonical-service";
import { M07_SCHEMA_VERSION } from "../storage/keys";
import {
  getCurrentExportBatchForPeriod,
  getPeriod,
  listAudit,
  listExportBatches,
  upsertExportBatch,
} from "../repository/local-store";
import {
  M07PermissionError,
  M07SeparationOfDutiesError,
  M07ValidationError,
} from "../permissions";

function seedRuleAndMapping() {
  const rule = createPreparationRule(actorAll(), {
    legalEntityId: ORG_A,
    code: "ORD_OT_B6",
    label: "Ordinary/OT prep",
    ordinaryMultiplier: 1,
    overtimeMultiplier: 1.5,
    effectiveFrom: "2026-01-01",
  });
  createClassificationMapping(actorAll(), {
    legalEntityId: ORG_A,
    m04ClassificationRef: "class_rn",
    preparationRuleId: rule.id,
    effectiveFrom: "2026-01-01",
  });
}

function seedProfile(externalId?: string) {
  const profile = createPayProfile(actorAll(), {
    personId: "person_a",
    legalEntityId: ORG_A,
    clinicId: CLINIC_A,
    m04ClassificationRef: "class_rn",
    ordinaryHourlyRate: 40,
    effectiveFrom: "2026-01-01",
  });
  if (externalId) {
    linkExternalPayrollEmployeeId(actorAll(), profile.id, externalId, "seed");
  }
  return profile;
}

function publishAndIntake(suffix: string) {
  const content = {
    timesheetRecordId: `ts_b6_${suffix}`,
    workforcePersonId: "person_a",
    organisationId: ORG_A,
    legalEntityId: ORG_A,
    clinicId: CLINIC_A,
    periodStart: "2026-07-01",
    periodEnd: "2026-07-14",
    attendanceSessionIds: ["sess_a"],
    ordinaryHourInputs: [{ code: "ORD", hours: 76 }],
    overtimeHourInputs: [{ code: "OT15", hours: 2 }],
    penaltyHourInputs: [],
    leaveInputs: [],
    allowanceInputs: [] as Array<{ allowanceCode: string; quantity: number }>,
  };
  const published = publishTimesheetVersion({
    content,
    sourceVersion: 1,
    approvalRevision: 1,
    approvalState: "approved",
    publishedAt: "2026-07-15T02:00:00.000Z",
    publisherId: "m06-pub",
    eventId: `ev_b6_${suffix}`,
    idempotencyKey: `ev_b6_${suffix}`,
  });
  const intake = intakePublishedTimesheet({
    actor: actorAll(),
    scope: { organisationId: ORG_A, legalEntityId: ORG_A },
    registryPublicationId: published.version.registryPublicationId,
  });
  assert.equal(intake.status, "imported");
  seedEligibilityForImportedSnapshot({
    actor: actorAll(),
    snapshot: intake.snapshot!,
  });
}

function prepareApproved(suffix: string, withExternal = true) {
  seedRuleAndMapping();
  seedProfile(withExternal ? `EXT-${suffix}` : undefined);
  const period = createOrdinaryPayPeriod(actorAll(), {
    legalEntityId: ORG_A,
    clinicIds: [],
    periodStart: "2026-07-01",
    periodEnd: "2026-07-14",
  });
  publishAndIntake(suffix);
  calculatePersonOrdinaryAndOvertime(actorClerk("u-clerk-b6"), {
    periodId: period.id,
    personId: "person_a",
  });
  submitPeriodForReview(actorClerk("u-clerk-b6"), { periodId: period.id });
  const approved = approvePeriodManagement(actorApprover("u-approver-b6"), {
    periodId: period.id,
  });
  assert.equal(approved.status, "approved");
  assert.equal(getPeriod(period.id)?.state, "export-ready");
  return { period, approved };
}

function walkProductionTsFiles(root: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(root)) {
    if (name === "tests" || name === "node_modules") continue;
    const p = join(root, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walkProductionTsFiles(p));
    else if (name.endsWith(".ts") || name.endsWith(".tsx")) out.push(p);
  }
  return out;
}

function stripCommentsAndStrings(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .replace(/`(?:\\.|[^`])*`/g, '""')
    .replace(/"(?:\\.|[^"])*"/g, '""')
    .replace(/'(?:\\.|[^'])*'/g, '""');
}

describe("M07 Batch 6 — export / recon / lock", () => {
  beforeEach(() => {
    resetM07TestEnv();
  });

  describe("A. Domain and lifecycle", () => {
    it("allows legal transitions and rejects illegal ones", () => {
      assert.doesNotThrow(() => assertExportBatchTransition("draft", "validating"));
      assert.doesNotThrow(() => assertExportBatchTransition("ready", "finalized"));
      assert.throws(
        () => assertExportBatchTransition("cancelled", "ready"),
        M07ValidationError
      );
      assert.throws(
        () => assertExportBatchTransition("finalized", "draft"),
        M07ValidationError
      );
    });

    it("deterministic identity + idempotent create", () => {
      const { period } = prepareApproved("idemp");
      const a = createOrRefreshPayrollExportBatch(actorExportOperator(), {
        periodId: period.id,
      });
      const b = createOrRefreshPayrollExportBatch(actorExportOperator(), {
        periodId: period.id,
      });
      assert.equal(a.id, b.id);
      assert.equal(a.identityKey, b.identityKey);
      assert.equal(listExportBatches(ORG_A).filter((x) => x.periodId === period.id).length, 1);
    });

    it("does not overwrite finalized history — successor revision", () => {
      const { period } = prepareApproved("succ");
      const preview = createOrRefreshPayrollExportBatch(actorExportOperator("u-export-1"), {
        periodId: period.id,
      });
      const finalized = finalizePayrollExportBatch(actorExportOperator("u-export-1"), {
        exportBatchId: preview.id,
      });
      assert.equal(finalized.status, "downloadable");
      // Same identity returns existing finalized
      const again = createOrRefreshPayrollExportBatch(actorExportOperator("u-export-1"), {
        periodId: period.id,
      });
      assert.equal(again.id, finalized.id);
      assert.equal(again.status, "downloadable");
    });

    it("cancel supersedes mutable batch", () => {
      const { period } = prepareApproved("cancel");
      const batch = createOrRefreshPayrollExportBatch(actorExportOperator(), {
        periodId: period.id,
      });
      const cancelled = cancelPayrollExportBatch(actorPayAdmin(), {
        exportBatchId: batch.id,
        reason: "test cancel",
      });
      assert.equal(cancelled.status, "cancelled");
    });
  });

  describe("B. Manifest consumption", () => {
    it("accepts valid approved package", () => {
      const { period, approved } = prepareApproved("manok");
      assert.equal(verifyManifestAgainstCurrent(actorAll(), approved.manifest).ok, true);
      const batch = createOrRefreshPayrollExportBatch(actorExportOperator(), {
        periodId: period.id,
      });
      assert.ok(["ready", "blocked"].includes(batch.status));
      assert.equal(batch.sourceManifestChecksum, approved.manifest.checksum);
    });

    it("rejects missing / non-approved package", () => {
      seedRuleAndMapping();
      seedProfile("EXT-miss");
      const period = createOrdinaryPayPeriod(actorAll(), {
        legalEntityId: ORG_A,
        periodStart: "2026-07-01",
        periodEnd: "2026-07-14",
      });
      assert.throws(
        () =>
          createOrRefreshPayrollExportBatch(actorExportOperator(), {
            periodId: period.id,
          }),
        M07ValidationError
      );
    });
  });

  describe("C. Validation", () => {
    it("missing external payroll employee ID blocks", () => {
      const { period } = prepareApproved("noext", false);
      const batch = createOrRefreshPayrollExportBatch(actorExportOperator(), {
        periodId: period.id,
      });
      assert.equal(batch.status, "blocked");
      assert.ok(
        batch.validationIssues.some((i) => i.code === "missing-external-payroll-employee-id")
      );
    });

    it("rejects cross-tenant / cross-legal-entity actor scope", () => {
      const { period } = prepareApproved("xle");
      assert.throws(
        () =>
          createOrRefreshPayrollExportBatch(
            { ...actorExportOperator(), legalEntityIds: [ORG_B] },
            { periodId: period.id }
          ),
        Error
      );
    });
  });

  describe("D. Export preparation", () => {
    it("preview and final share validation; final re-verifies; checksum reproducible", () => {
      const { period } = prepareApproved("prep");
      const preview = createOrRefreshPayrollExportBatch(actorExportOperator("u-ex"), {
        periodId: period.id,
      });
      assert.equal(preview.status, "ready");
      assert.equal(preview.canonicalPreview?.previewOnly, true);
      const finalized = finalizePayrollExportBatch(actorExportOperator("u-ex"), {
        exportBatchId: preview.id,
      });
      assert.equal(finalized.status, "downloadable");
      assert.equal(finalized.finalizedCanonical?.previewOnly, false);
      const c1 = checksumCanonicalExport(finalized.finalizedCanonical!);
      const c2 = checksumCanonicalExport(finalized.finalizedCanonical!);
      assert.equal(c1, c2);
      assert.equal(finalized.artifact?.checksum, c1);
      const dup = finalizePayrollExportBatch(actorExportOperator("u-ex"), {
        exportBatchId: finalized.id,
      });
      assert.equal(dup.id, finalized.id);
    });
  });

  describe("E. Reconciliation", () => {
    it("matching package passes with structured totals", () => {
      const { period } = prepareApproved("recon");
      const preview = createOrRefreshPayrollExportBatch(actorExportOperator("u-ex"), {
        periodId: period.id,
      });
      const finalized = finalizePayrollExportBatch(actorExportOperator("u-ex"), {
        exportBatchId: preview.id,
      });
      assert.equal(finalized.reconciliationStatus, "matched");
      const recon = reconcileExportBatchAgainstApproval(actorExportOperator("u-ex"), {
        exportBatchId: finalized.id,
      });
      assert.equal(recon.status, "matched");
      assert.equal(recon.mismatches.length, 0);
    });
  });

  describe("F. Permissions and SoD", () => {
    it("enforces export.create permission", () => {
      const { period } = prepareApproved("perm");
      assert.throws(
        () =>
          createOrRefreshPayrollExportBatch(actorClerk(), { periodId: period.id }),
        M07PermissionError
      );
    });

    it("management approver cannot be sole final export generator when SoD on", () => {
      const { period } = prepareApproved("sod");
      const preview = createOrRefreshPayrollExportBatch(actorExportOperator(), {
        periodId: period.id,
      });
      assert.throws(
        () =>
          finalizePayrollExportBatch(actorApprover("u-approver-b6"), {
            exportBatchId: preview.id,
          }),
        (e: unknown) =>
          e instanceof M07SeparationOfDutiesError || e instanceof M07PermissionError
      );
      // Approver lacks export.create → permission; grant export.create to prove SoD
      const approverWithExport = {
        ...actorApprover("u-approver-b6"),
        permissions: [...actorApprover().permissions, "payroll.export.create" as const],
      };
      assert.throws(
        () =>
          finalizePayrollExportBatch(approverWithExport, {
            exportBatchId: preview.id,
          }),
        M07SeparationOfDutiesError
      );
    });
  });

  describe("G. Locking and unlocking", () => {
    it("locks only after matched recon; unlock requires reason + separate approver", () => {
      const { period } = prepareApproved("lock");
      const preview = createOrRefreshPayrollExportBatch(actorExportOperator("u-ex"), {
        periodId: period.id,
      });
      const finalized = finalizePayrollExportBatch(actorExportOperator("u-ex"), {
        exportBatchId: preview.id,
      });
      const lock = explicitLockPayPeriod(actorApprover("u-lock"), {
        periodId: period.id,
        exportBatchId: finalized.id,
        reason: "Period complete",
      });
      assert.equal(lock.status, "active");
      assert.equal(getPeriod(period.id)?.state, "locked");

      assert.throws(
        () =>
          calculatePersonOrdinaryAndOvertime(actorClerk(), {
            periodId: period.id,
            personId: "person_a",
          }),
        M07ValidationError
      );

      assert.throws(
        () =>
          requestPeriodUnlock(actorExportOperator("u-ex"), {
            periodId: period.id,
            reason: "",
          }),
        M07ValidationError
      );

      const req = requestPeriodUnlock(actorExportOperator("u-ex"), {
        periodId: period.id,
        reason: "Need correction path",
      });
      assert.equal(req.status, "requested");
      const inbox = findInboxActionForSource(
        "staff-pay",
        "period-unlock-request",
        req.logicalKey
      );
      assert.ok(inbox);

      assert.throws(
        () =>
          approvePeriodUnlock(actorExportOperator("u-ex"), {
            unlockRequestId: req.id,
          }),
        (e: unknown) =>
          e instanceof M07SeparationOfDutiesError || e instanceof M07PermissionError
      );

      const approved = approvePeriodUnlock(actorApprover("u-lock"), {
        unlockRequestId: req.id,
      });
      assert.equal(approved.status, "approved");
      assert.equal(getPeriod(period.id)?.state, "open");
    });

    it("unlock reject is separate and idempotent request replay", () => {
      const { period } = prepareApproved("unlrej");
      const preview = createOrRefreshPayrollExportBatch(actorExportOperator("u-ex"), {
        periodId: period.id,
      });
      const finalized = finalizePayrollExportBatch(actorExportOperator("u-ex"), {
        exportBatchId: preview.id,
      });
      explicitLockPayPeriod(actorApprover("u-lock"), {
        periodId: period.id,
        exportBatchId: finalized.id,
        reason: "lock",
      });
      const r1 = requestPeriodUnlock(actorExportOperator("u-ex"), {
        periodId: period.id,
        reason: "fix",
      });
      const r2 = requestPeriodUnlock(actorExportOperator("u-ex"), {
        periodId: period.id,
        reason: "fix",
      });
      assert.equal(r1.id, r2.id);
      const rejected = rejectPeriodUnlock(actorApprover("u-lock"), {
        unlockRequestId: r1.id,
        reason: "Not justified",
      });
      assert.equal(rejected.status, "rejected");
      assert.equal(getPeriod(period.id)?.state, "locked");
    });
  });

  describe("H. Download", () => {
    it("downloads only downloadable matched artifact and audits each download", () => {
      const { period } = prepareApproved("dl");
      const preview = createOrRefreshPayrollExportBatch(actorExportOperator("u-ex"), {
        periodId: period.id,
      });
      assert.throws(
        () =>
          downloadPayrollExportArtifact(actorExportOperator("u-ex"), {
            exportBatchId: preview.id,
          }),
        M07ValidationError
      );
      const finalized = finalizePayrollExportBatch(actorExportOperator("u-ex"), {
        exportBatchId: preview.id,
      });
      const dl1 = downloadPayrollExportArtifact(actorExportOperator("u-ex"), {
        exportBatchId: finalized.id,
      });
      const dl2 = downloadPayrollExportArtifact(actorExportOperator("u-ex"), {
        exportBatchId: finalized.id,
      });
      assert.equal(dl1.checksum, dl2.checksum);
      assert.notEqual(dl1.downloadId, dl2.downloadId);
      const audits = listAudit(ORG_A).filter((a) => a.action === "export-batch.downloaded");
      assert.ok(audits.length >= 2);

      // superseded rejected
      upsertExportBatch({ ...finalized, status: "superseded" });
      assert.throws(
        () =>
          downloadPayrollExportArtifact(actorExportOperator("u-ex"), {
            exportBatchId: finalized.id,
          }),
        M07ValidationError
      );
    });
  });

  describe("I. M02 and audit", () => {
    it("writes export lifecycle audits without sensitive payloads", () => {
      const { period } = prepareApproved("aud");
      const preview = createOrRefreshPayrollExportBatch(actorExportOperator("u-ex"), {
        periodId: period.id,
      });
      finalizePayrollExportBatch(actorExportOperator("u-ex"), {
        exportBatchId: preview.id,
      });
      const actions = listAudit(ORG_A).map((a) => a.action);
      assert.ok(actions.includes("export-batch.created"));
      assert.ok(actions.includes("export-batch.preview"));
      assert.ok(actions.includes("export-batch.finalized"));
      for (const a of listAudit(ORG_A)) {
        const blob = JSON.stringify(a);
        assert.equal(blob.toLowerCase().includes("tfn"), false);
        assert.equal(blob.toLowerCase().includes("bsb"), false);
      }
    });
  });

  describe("J. Storage and schema", () => {
    it("schema v9 and failure-closed legacy export defaults", () => {
      assert.equal(M07_SCHEMA_VERSION, 9);
      const { period } = prepareApproved("stor");
      const batch = createOrRefreshPayrollExportBatch(actorExportOperator(), {
        periodId: period.id,
      });
      assert.equal(batch.certified, false);
      assert.equal(batch.paymentReady, false);
      assert.ok(getCurrentExportBatchForPeriod(period.id));
    });
  });

  describe("K. Architecture", () => {
    it("no createExportPackage / lockPeriod( / cross-module repos / excluded payment features", () => {
      const root = join(__dirname, "..");
      const files = walkProductionTsFiles(root);
      for (const f of files) {
        const src = stripCommentsAndStrings(readFileSync(f, "utf8"));
        assert.equal(src.includes("createExportPackage"), false, f);
        assert.equal(src.includes("lockPeriod("), false, f);
        assert.equal(src.includes("Process Final Pay"), false, f);
        assert.equal(/m02-.*\/repository/.test(src), false, f);
        assert.equal(src.includes("pulse.m04."), false, f);
        assert.equal(src.includes("pulse.m05."), false, f);
        assert.equal(src.includes("pulse.m06."), false, f);
      }
    });
  });
});
