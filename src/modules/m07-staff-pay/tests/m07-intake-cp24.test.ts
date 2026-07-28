/**
 * Checkpoint 2.4 — M07 immutable published-timesheet intake.
 */

import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { publishTimesheetVersion } from "@/platform/workforce/services/published-timesheet-registry";
import { calculatePayrollContentHash } from "@/platform/workforce/contracts/published-timesheet-hash";
import { clearMigrationFlag, readJsonSafe, writeJsonSafe } from "@/platform/storage/storage";
import { actorAll, CLINIC_A, CLINIC_B, ORG_A, ORG_B, resetM07TestEnv } from "./_helpers";
import {
  getCurrentIntakeIndex,
  getPublishedTimesheetSnapshotByBusinessKey,
  getPublishedTimesheetSnapshotById,
  intakePublishedTimesheet,
  listPublishedTimesheetSnapshots,
  rebuildPublishedTimesheetSnapshotIndexes,
} from "../services/published-timesheet-intake";
import { getM07TimesheetIntakeBlockerStatus } from "../adapters/m06-timesheet-read";
import { M07_MIGRATION_V3_ID, M07_STORAGE_KEYS, runM07SchemaV3Migration } from "../storage";
import { listAudit } from "../repository/local-store";

const LE_A = "le_pay_a";
const LE_B = "le_pay_b";

function publishEligible(input: {
  organisationId: string;
  legalEntityId: string;
  timesheetRecordId: string;
  eventId: string;
  sourceVersion?: number;
  approvalRevision?: number;
  approvalState?: "approved" | "revised" | "restored" | "revoked" | "withdrawn" | "invalidated";
  clinicId?: string;
  ordinaryHours?: number;
  reasonCode?: string;
}) {
  const content = {
    timesheetRecordId: input.timesheetRecordId,
    workforcePersonId: "wp_intake_1",
    organisationId: input.organisationId,
    legalEntityId: input.legalEntityId,
    clinicId: input.clinicId ?? CLINIC_A,
    periodStart: "2026-07-01",
    periodEnd: "2026-07-14",
    attendanceSessionIds: ["sess_b", "sess_a"],
    ordinaryHourInputs: [{ code: "ORD", hours: input.ordinaryHours ?? 76 }],
    overtimeHourInputs: [{ code: "OT15", hours: 2 }],
    penaltyHourInputs: [],
    leaveInputs: [],
    allowanceInputs: [{ allowanceCode: "MEAL", quantity: 1 }],
  };
  const result = publishTimesheetVersion({
    content,
    sourceVersion: input.sourceVersion ?? 1,
    approvalRevision: input.approvalRevision ?? 1,
    approvalState: input.approvalState ?? "approved",
    publishedAt: "2026-07-15T02:00:00.000Z",
    publisherId: "m06-pub",
    eventId: input.eventId,
    idempotencyKey: input.eventId,
    reasonCode: input.reasonCode,
  });
  return { version: result.version, content, contentHash: calculatePayrollContentHash(content) };
}

describe("CP2.4 M07 published-timesheet intake", () => {
  beforeEach(() => resetM07TestEnv());

  describe("A. Eligibility", () => {
    it("eligible approved publication creates a snapshot", () => {
      const { version, contentHash } = publishEligible({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_ok",
        eventId: "evt_ok",
      });
      const result = intakePublishedTimesheet({
        actor: actorAll(),
        scope: { organisationId: ORG_A, legalEntityId: LE_A },
        registryPublicationId: version.registryPublicationId,
      });
      assert.equal(result.status, "imported");
      assert.ok(result.snapshot);
      assert.equal(result.snapshot!.contentHash, contentHash);
      assert.equal(result.snapshot!.immutable, true);
      assert.equal(result.blockedM07, false);
      assert.equal(result.workflowEvidenceCode, "CLEARED-M07-BATCH2");
    });

    it("revoked publications are not intaken", () => {
      const granted = publishEligible({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_rev",
        eventId: "evt_rev_g",
      });
      publishTimesheetVersion({
        content: {
          timesheetRecordId: "ts_rev",
          workforcePersonId: "wp_intake_1",
          organisationId: ORG_A,
          legalEntityId: LE_A,
          clinicId: CLINIC_A,
          periodStart: "2026-07-01",
          periodEnd: "2026-07-14",
          attendanceSessionIds: ["sess_b", "sess_a"],
          ordinaryHourInputs: [{ code: "ORD", hours: 76 }],
          overtimeHourInputs: [{ code: "OT15", hours: 2 }],
          penaltyHourInputs: [],
          leaveInputs: [],
          allowanceInputs: [{ allowanceCode: "MEAL", quantity: 1 }],
        },
        sourceVersion: 1,
        approvalRevision: 2,
        approvalState: "revoked",
        reasonCode: "REOPEN",
        publishedAt: "2026-07-15T03:00:00.000Z",
        publisherId: "m06-pub",
        eventId: "evt_rev_r",
        idempotencyKey: "evt_rev_r",
      });
      const result = intakePublishedTimesheet({
        actor: actorAll(),
        scope: { organisationId: ORG_A, legalEntityId: LE_A },
        registryPublicationId: granted.version.registryPublicationId,
      });
      assert.equal(result.status, "rejected");
      assert.match(result.reason ?? "", /INELIGIBLE_STATE_REVOKED/);
      assert.equal(
        listPublishedTimesheetSnapshots({
          organisationId: ORG_A,
          legalEntityId: LE_A,
          timesheetRecordId: "ts_rev",
        }).length,
        0
      );
    });

    it("rejects incomplete scope and clinic mismatch", () => {
      const { version } = publishEligible({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_scope",
        eventId: "evt_scope",
        clinicId: CLINIC_A,
      });
      assert.equal(
        intakePublishedTimesheet({
          actor: actorAll(),
          scope: { organisationId: "", legalEntityId: LE_A },
          registryPublicationId: version.registryPublicationId,
        }).status,
        "rejected"
      );
      assert.equal(
        intakePublishedTimesheet({
          actor: actorAll(),
          scope: { organisationId: ORG_A, legalEntityId: LE_A, clinicId: CLINIC_B },
          registryPublicationId: version.registryPublicationId,
        }).reason,
        "CLINIC_MISMATCH"
      );
    });
  });

  describe("B. Snapshot fidelity", () => {
    it("preserves structured inputs and platform contentHash without payroll fields", () => {
      const { version, contentHash } = publishEligible({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_fid",
        eventId: "evt_fid",
        ordinaryHours: 80,
      });
      const result = intakePublishedTimesheet({
        actor: actorAll(),
        scope: { organisationId: ORG_A, legalEntityId: LE_A },
        registryPublicationId: version.registryPublicationId,
      });
      const snap = result.snapshot!;
      assert.equal(snap.ordinaryHourInputs[0]!.hours, 80);
      assert.equal(snap.overtimeHourInputs[0]!.hours, 2);
      assert.equal(snap.allowanceInputs[0]!.allowanceCode, "MEAL");
      assert.equal(snap.contentHash, contentHash);
      assert.equal(snap.sourceVersion, 1);
      assert.equal(snap.approvalRevision, 1);
      assert.equal(snap.contractVersion, version.contractVersion);
      assert.equal((snap as { grossPay?: unknown }).grossPay, undefined);
      assert.equal((snap as { netPay?: unknown }).netPay, undefined);
      assert.equal((snap as { tfn?: unknown }).tfn, undefined);
      // Immutability: mutating returned object does not rewrite store
      snap.ordinaryHourInputs[0]!.hours = 1;
      const reloaded = getPublishedTimesheetSnapshotById(
        { organisationId: ORG_A, legalEntityId: LE_A },
        snap.id
      )!;
      assert.equal(reloaded.ordinaryHourInputs[0]!.hours, 80);
    });
  });

  describe("C. Identity and idempotency", () => {
    it("exact retry and new event id for same version/hash are idempotent; hash conflict is hard", () => {
      const { version } = publishEligible({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_id",
        eventId: "evt_id_1",
      });
      const first = intakePublishedTimesheet({
        actor: actorAll(),
        scope: { organisationId: ORG_A, legalEntityId: LE_A },
        registryPublicationId: version.registryPublicationId,
      });
      assert.equal(first.status, "imported");
      const second = intakePublishedTimesheet({
        actor: actorAll(),
        scope: { organisationId: ORG_A, legalEntityId: LE_A },
        registryPublicationId: version.registryPublicationId,
      });
      assert.equal(second.status, "duplicate-idempotent");
      assert.equal(second.snapshot!.id, first.snapshot!.id);
      assert.equal(
        listPublishedTimesheetSnapshots({
          organisationId: ORG_A,
          legalEntityId: LE_A,
          timesheetRecordId: "ts_id",
        }).length,
        1
      );

      // Simulate conflict: existing snapshot with different hash for same business key
      const existing = getPublishedTimesheetSnapshotByBusinessKey({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_id",
        sourceVersion: 1,
      })!;
      writeJsonSafe(
        M07_STORAGE_KEYS.publishedTimesheetSnapshots,
        listPublishedTimesheetSnapshots().map((s) =>
          s.id === existing.id ? { ...s, contentHash: "b".repeat(64) } : s
        )
      );
      rebuildPublishedTimesheetSnapshotIndexes();
      const conflict = intakePublishedTimesheet({
        actor: actorAll(),
        scope: { organisationId: ORG_A, legalEntityId: LE_A },
        registryPublicationId: version.registryPublicationId,
      });
      assert.equal(conflict.status, "conflict");
      assert.equal(conflict.reason, "SOURCE_VERSION_HASH_CONFLICT");
    });

    it("newer sourceVersion creates a second snapshot; older remains resolvable", () => {
      const v1 = publishEligible({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_ver",
        eventId: "evt_v1",
        sourceVersion: 1,
        ordinaryHours: 70,
      });
      intakePublishedTimesheet({
        actor: actorAll(),
        scope: { organisationId: ORG_A, legalEntityId: LE_A },
        registryPublicationId: v1.version.registryPublicationId,
      });
      const v2 = publishEligible({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_ver",
        eventId: "evt_v2",
        sourceVersion: 2,
        approvalRevision: 2,
        ordinaryHours: 80,
      });
      const imported = intakePublishedTimesheet({
        actor: actorAll(),
        scope: { organisationId: ORG_A, legalEntityId: LE_A },
        registryPublicationId: v2.version.registryPublicationId,
      });
      assert.equal(imported.status, "imported");
      assert.equal(imported.snapshot!.sourceVersion, 2);
      assert.ok(
        getPublishedTimesheetSnapshotByBusinessKey({
          organisationId: ORG_A,
          legalEntityId: LE_A,
          timesheetRecordId: "ts_ver",
          sourceVersion: 1,
        })
      );
      assert.equal(
        getCurrentIntakeIndex({
          organisationId: ORG_A,
          legalEntityId: LE_A,
          timesheetRecordId: "ts_ver",
        })?.latestSourceVersion,
        2
      );
    });
  });

  describe("D. Isolation", () => {
    it("denies cross-org and cross-LE; guessed publication id fails closed", () => {
      const { version } = publishEligible({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_iso",
        eventId: "evt_iso",
      });
      assert.equal(
        intakePublishedTimesheet({
          actor: actorAll(),
          scope: { organisationId: ORG_B, legalEntityId: LE_A },
          registryPublicationId: version.registryPublicationId,
        }).status,
        "rejected"
      );
      assert.equal(
        intakePublishedTimesheet({
          actor: actorAll(),
          scope: { organisationId: ORG_A, legalEntityId: LE_B },
          registryPublicationId: version.registryPublicationId,
        }).status,
        "rejected"
      );
      assert.equal(
        getPublishedTimesheetSnapshotById(
          { organisationId: ORG_B, legalEntityId: LE_B },
          "guessed"
        ),
        null
      );
    });
  });

  describe("E. Recovery", () => {
    it("rebuilds indexes; partial migration resumes; Batch1 data preserved", () => {
      writeJsonSafe(M07_STORAGE_KEYS.periods, [{ id: "keep_period" }]);
      const { version } = publishEligible({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_rec",
        eventId: "evt_rec",
      });
      const imported = intakePublishedTimesheet({
        actor: actorAll(),
        scope: { organisationId: ORG_A, legalEntityId: LE_A },
        registryPublicationId: version.registryPublicationId,
      });
      writeJsonSafe(M07_STORAGE_KEYS.publishedTimesheetCurrentIntake, {});
      writeJsonSafe(M07_STORAGE_KEYS.publishedTimesheetSnapshotIndex, []);
      const rebuilt = rebuildPublishedTimesheetSnapshotIndexes();
      assert.ok(rebuilt.indexCount >= 1);
      assert.equal(
        getCurrentIntakeIndex({
          organisationId: ORG_A,
          legalEntityId: LE_A,
          timesheetRecordId: "ts_rec",
        })?.latestSnapshotId,
        imported.snapshot!.id
      );

      clearMigrationFlag(M07_MIGRATION_V3_ID);
      assert.equal(runM07SchemaV3Migration(), true);
      assert.deepEqual(readJsonSafe(M07_STORAGE_KEYS.periods, []), [{ id: "keep_period" }]);
      assert.ok(
        getPublishedTimesheetSnapshotById(
          { organisationId: ORG_A, legalEntityId: LE_A },
          imported.snapshot!.id
        )
      );
    });
  });

  describe("F. Boundaries", () => {
    it("keeps BLOCKED-M07 cleared, no M06 scrape, no registry mutation from intake module", () => {
      const { version } = publishEligible({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_bound",
        eventId: "evt_bound",
      });
      const result = intakePublishedTimesheet({
        actor: actorAll(),
        scope: { organisationId: ORG_A, legalEntityId: LE_A },
        registryPublicationId: version.registryPublicationId,
      });
      assert.equal(result.blockedM07, false);
      assert.equal(getM07TimesheetIntakeBlockerStatus().blocked, false);

      const src = readFileSync(
        join(process.cwd(), "src/modules/m07-staff-pay/services/published-timesheet-intake.ts"),
        "utf8"
      );
      assert.doesNotMatch(src, /["']pulse\.m06\./);
      assert.ok(!src.includes("m06-time-attendance/repository"));
      assert.ok(!src.includes("writeJsonSafe(PUBLISHED_TIMESHEET"));
      assert.ok(listAudit(LE_A).some((a) => a.action === "published-timesheet.intake.imported"));
    });
  });
});
