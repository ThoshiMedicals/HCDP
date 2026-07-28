/**
 * Checkpoint 2.7B — owner-authorised BLOCKED-M07 clearance verification.
 * Proves helpers agree, successful Batch 2 paths report blockedM07: false,
 * and operational fail-closed rules remain independent of the retired global blocker.
 */

import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { publishTimesheetVersion } from "@/platform/workforce/services/published-timesheet-registry";
import { writeJsonSafe } from "@/platform/storage/storage";
import { PUBLISHED_TIMESHEET_CONTRACT_VERSION } from "@/platform/workforce/contracts/published-timesheet-contract";

import { acknowledgeApprovedTimesheetIntake } from "../../m06-time-attendance/adapters/m07-timesheet-bridge";
import {
  getM07TimesheetIntakeBlockerStatus,
  m07GlobalBlockerFields,
} from "../adapters/m06-timesheet-read";
import { actorAll, CLINIC_A, ORG_A, resetM07TestEnv } from "./_helpers";
import { intakePublishedTimesheet } from "../services/published-timesheet-intake";
import {
  getReplayCheckpoint,
  runPublishedTimesheetReplayBatch,
} from "../services/published-timesheet-replay";
import {
  acknowledgeRestoreClearHold,
  assertSnapshotUsableForPreparation,
  getLifecycleProjection,
  getSnapshotEligibility,
  selectSupersedingSnapshot,
} from "../services/published-timesheet-lifecycle";
import { getPublishedTimesheetSnapshotByBusinessKey } from "../services/published-timesheet-intake";
import { M07_PERMISSION_CODES } from "../permissions";

const LE_A = "le_pay_a";
const LE_OTHER = "le_pay_other_cp27b";
const ROOT = process.cwd();
const M07_ROOT = join(ROOT, "src/modules/m07-staff-pay");

function walkProductionTs(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "tests" || name === "node_modules") continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walkProductionTs(full, out);
    else if (/\.(ts|tsx)$/.test(name) && !name.endsWith(".d.ts")) out.push(full);
  }
  return out;
}

function stripCommentsAndStrings(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\/\/.*$/gm, " ")
    .replace(/`(?:\\.|[^`\\])*`/g, '""')
    .replace(/'(?:\\.|[^'\\])*'/g, '""')
    .replace(/"(?:\\.|[^"\\])*"/g, '""');
}

function publishApproved(timesheetRecordId: string, sourceVersion = 1, hours = 8) {
  return publishTimesheetVersion({
    content: {
      timesheetRecordId,
      workforcePersonId: "wp_cp27b",
      organisationId: ORG_A,
      legalEntityId: LE_A,
      clinicId: CLINIC_A,
      periodStart: "2026-07-20",
      periodEnd: "2026-07-30",
      attendanceSessionIds: [`s_${timesheetRecordId}`],
      ordinaryHourInputs: [{ code: "ORD", hours }],
      overtimeHourInputs: [],
      penaltyHourInputs: [],
      leaveInputs: [],
      allowanceInputs: [],
    },
    sourceVersion,
    approvalRevision: sourceVersion,
    approvalState: "approved",
    publishedAt: "2026-07-29T10:00:00.000Z",
    publisherId: "m06-pub",
    eventId: `evt_cp27b_${timesheetRecordId}_v${sourceVersion}`,
    idempotencyKey: `evt_cp27b_${timesheetRecordId}_v${sourceVersion}`,
  });
}

describe("CP2.7B BLOCKED-M07 clearance", () => {
  beforeEach(() => resetM07TestEnv());

  it("authoritative helpers are cleared and cannot disagree", () => {
    const m07 = getM07TimesheetIntakeBlockerStatus();
    const bridge = acknowledgeApprovedTimesheetIntake("any-id");
    assert.equal(m07.blocked, false);
    assert.equal(m07.workflowEvidenceCode, "CLEARED-M07-BATCH2");
    assert.equal(bridge.blocked, false);
    assert.equal(bridge.workflowEvidenceCode, "CLEARED-M07-BATCH2");
    assert.equal(m07.blocked, bridge.blocked);
    assert.equal(m07.workflowEvidenceCode, bridge.workflowEvidenceCode);
    assert.equal(m07GlobalBlockerFields().blockedM07, false);
  });

  it("successful intake, replay and authorised lifecycle report blockedM07: false", () => {
    publishApproved("ts_clear_ok");
    const replay = runPublishedTimesheetReplayBatch({
      actor: actorAll(),
      scope: { organisationId: ORG_A, legalEntityId: LE_A },
      batchLimit: 10,
    });
    assert.ok(replay.processed.some((o) => o.outcome === "intaken"));
    assert.equal(replay.blockedM07, false);
    assert.equal(replay.workflowEvidenceCode, "CLEARED-M07-BATCH2");

    const snap = getPublishedTimesheetSnapshotByBusinessKey({
      organisationId: ORG_A,
      legalEntityId: LE_A,
      timesheetRecordId: "ts_clear_ok",
      sourceVersion: 1,
    })!;
    const intakeRetry = intakePublishedTimesheet({
      actor: actorAll(),
      scope: { organisationId: ORG_A, legalEntityId: LE_A },
      registryPublicationId: snap.registryPublicationId,
    });
    assert.equal(intakeRetry.status, "duplicate-idempotent");
    assert.equal(intakeRetry.blockedM07, false);

    const gate = assertSnapshotUsableForPreparation({
      actor: actorAll(),
      organisationId: ORG_A,
      legalEntityId: LE_A,
      snapshotId: snap.id,
    });
    assert.equal(gate.allowed, true);
    assert.equal(gate.blockedM07, false);
  });

  it("no production hardcoded blockedM07: true remains for the retired global blocker", () => {
    for (const file of walkProductionTs(M07_ROOT)) {
      const raw = readFileSync(file, "utf8");
      const stripped = stripCommentsAndStrings(raw);
      assert.doesNotMatch(stripped, /blockedM07\s*:\s*true/, relative(ROOT, file));
      // Returned literal BLOCKED-M07 alone is forbidden; union type alternate is allowed.
      if (/workflowEvidenceCode:\s*"BLOCKED-M07"\s*[,;}]/.test(raw)) {
        assert.fail(`${relative(ROOT, file)} hardcodes workflowEvidenceCode: "BLOCKED-M07"`);
      }
    }
  });

  it("fail-closed paths remain independent: isolation, holds, restore, supersession, unsafe cursor", () => {
    const pub = publishApproved("ts_hold_gate");
    runPublishedTimesheetReplayBatch({
      actor: actorAll(),
      scope: { organisationId: ORG_A, legalEntityId: LE_A },
    });
    const snap1 = getPublishedTimesheetSnapshotByBusinessKey({
      organisationId: ORG_A,
      legalEntityId: LE_A,
      timesheetRecordId: "ts_hold_gate",
      sourceVersion: 1,
    })!;

    const denied = intakePublishedTimesheet({
      actor: actorAll(),
      scope: { organisationId: ORG_A, legalEntityId: LE_OTHER },
      registryPublicationId: pub.version.registryPublicationId,
    });
    assert.equal(denied.status, "rejected");
    assert.ok(denied.reason);
    assert.equal(denied.blockedM07, false);

    publishTimesheetVersion({
      content: {
        timesheetRecordId: "ts_hold_gate",
        workforcePersonId: "wp_cp27b",
        organisationId: ORG_A,
        legalEntityId: LE_A,
        clinicId: CLINIC_A,
        periodStart: "2026-07-20",
        periodEnd: "2026-07-30",
        attendanceSessionIds: ["s_ts_hold_gate"],
        ordinaryHourInputs: [{ code: "ORD", hours: 8 }],
        overtimeHourInputs: [],
        penaltyHourInputs: [],
        leaveInputs: [],
        allowanceInputs: [],
      },
      sourceVersion: 1,
      approvalRevision: 2,
      approvalState: "revoked",
      publishedAt: "2026-07-29T11:00:00.000Z",
      publisherId: "m06-pub",
      eventId: "evt_cp27b_revoke",
      idempotencyKey: "evt_cp27b_revoke",
      reasonCode: "REOPEN",
    });
    const afterHold = runPublishedTimesheetReplayBatch({
      actor: actorAll(),
      scope: { organisationId: ORG_A, legalEntityId: LE_A },
    });
    assert.ok(afterHold.processed.some((o) => o.outcome === "lifecycle-hold-applied"));
    assert.equal(afterHold.blockedM07, false);
    assert.equal(
      getLifecycleProjection({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_hold_gate",
      })?.hold,
      "revocation-hold"
    );
    assert.equal(
      assertSnapshotUsableForPreparation({
        actor: actorAll(),
        organisationId: ORG_A,
        legalEntityId: LE_A,
        snapshotId: snap1.id,
      }).allowed,
      false
    );

    publishTimesheetVersion({
      content: {
        timesheetRecordId: "ts_hold_gate",
        workforcePersonId: "wp_cp27b",
        organisationId: ORG_A,
        legalEntityId: LE_A,
        clinicId: CLINIC_A,
        periodStart: "2026-07-20",
        periodEnd: "2026-07-30",
        attendanceSessionIds: ["s_ts_hold_gate"],
        ordinaryHourInputs: [{ code: "ORD", hours: 8 }],
        overtimeHourInputs: [],
        penaltyHourInputs: [],
        leaveInputs: [],
        allowanceInputs: [],
      },
      sourceVersion: 1,
      approvalRevision: 3,
      approvalState: "restored",
      publishedAt: "2026-07-29T12:00:00.000Z",
      publisherId: "m06-pub",
      eventId: "evt_cp27b_restored",
      idempotencyKey: "evt_cp27b_restored",
    });
    runPublishedTimesheetReplayBatch({
      actor: actorAll(),
      scope: { organisationId: ORG_A, legalEntityId: LE_A },
    });
    assert.equal(
      getLifecycleProjection({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_hold_gate",
      })?.hold,
      "revocation-hold"
    );

    const proj = getLifecycleProjection({
      organisationId: ORG_A,
      legalEntityId: LE_A,
      timesheetRecordId: "ts_hold_gate",
    })!;
    const cleared = acknowledgeRestoreClearHold({
      actor: actorAll(),
      organisationId: ORG_A,
      legalEntityId: LE_A,
      timesheetRecordId: "ts_hold_gate",
      expectedProjectionVersion: proj.projectionVersion,
      reason: "CP27B ack",
      lifecycleEventId: "evt_cp27b_restored",
      snapshotId: snap1.id,
    });
    assert.equal(cleared.status, "accepted");
    assert.equal(cleared.blockedM07, false);

    publishTimesheetVersion({
      content: {
        timesheetRecordId: "ts_hold_gate",
        workforcePersonId: "wp_cp27b",
        organisationId: ORG_A,
        legalEntityId: LE_A,
        clinicId: CLINIC_A,
        periodStart: "2026-07-20",
        periodEnd: "2026-07-30",
        attendanceSessionIds: ["s_ts_hold_gate"],
        ordinaryHourInputs: [{ code: "ORD", hours: 99 }],
        overtimeHourInputs: [],
        penaltyHourInputs: [],
        leaveInputs: [],
        allowanceInputs: [],
      },
      sourceVersion: 2,
      approvalRevision: 4,
      approvalState: "approved",
      publishedAt: "2026-07-29T13:00:00.000Z",
      publisherId: "m06-pub",
      eventId: "evt_cp27b_material",
      idempotencyKey: "evt_cp27b_material",
    });
    const mat = runPublishedTimesheetReplayBatch({
      actor: actorAll(),
      scope: { organisationId: ORG_A, legalEntityId: LE_A },
    });
    assert.ok(mat.processed.some((o) => o.outcome === "lifecycle-material-pending-review"));
    const snap2 = getPublishedTimesheetSnapshotByBusinessKey({
      organisationId: ORG_A,
      legalEntityId: LE_A,
      timesheetRecordId: "ts_hold_gate",
      sourceVersion: 2,
    })!;
    assert.equal(
      getSnapshotEligibility({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_hold_gate",
        sourceVersion: 2,
      })?.eligibility,
      "pending-review"
    );
    assert.equal(
      selectSupersedingSnapshot({
        actor: { userId: "u-no", permissions: ["payroll.intake.run"] },
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_hold_gate",
        targetSnapshotId: snap2.id,
        expectedProjectionVersion: getLifecycleProjection({
          organisationId: ORG_A,
          legalEntityId: LE_A,
          timesheetRecordId: "ts_hold_gate",
        })!.projectionVersion,
        reason: "unauthorised",
      }).status,
      "denied"
    );
    assert.throws(() =>
      selectSupersedingSnapshot({
        actor: {
          userId: "u-le-b",
          permissions: [...M07_PERMISSION_CODES],
          legalEntityIds: [LE_OTHER],
        },
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_hold_gate",
        targetSnapshotId: snap2.id,
        expectedProjectionVersion: 1,
        reason: "cross-le",
      })
    );

    const cp = getReplayCheckpoint({
      organisationId: ORG_A,
      legalEntityId: LE_A,
      contractVersion: PUBLISHED_TIMESHEET_CONTRACT_VERSION,
    })!;
    writeJsonSafe("pulse.m07.staffpay.publishedTimesheetReplayCheckpoints", [
      { ...cp, lastCompletedEventSequence: "bad", status: "active" },
    ]);
    const corrupt = runPublishedTimesheetReplayBatch({
      actor: actorAll(),
      scope: { organisationId: ORG_A, legalEntityId: LE_A },
    });
    assert.equal(corrupt.stoppedReason, "conflict");
    assert.equal(corrupt.checkpoint.status, "blocked-conflict");
    assert.equal(corrupt.blockedM07, false);

    assert.equal(
      assertSnapshotUsableForPreparation({
        actor: actorAll(),
        organisationId: ORG_A,
        legalEntityId: LE_A,
        snapshotId: "guessed-foreign",
      }).allowed,
      false
    );
  });
});
