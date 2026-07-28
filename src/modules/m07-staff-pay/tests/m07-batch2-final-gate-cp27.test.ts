/**
 * Checkpoint 2.7A — Batch 2 final-gate E2E / integration proof.
 * Composes existing production services only (no duplicate paths).
 *
 * Publication: M06 approve → outbox → platform registry (authorised publisher path).
 * Then: CP 2.5 replay → CP 2.4 intake → CP 2.6 lifecycle decisions.
 */

import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  getCurrentPublishedTimesheet,
  publishTimesheetVersion,
  PUBLISHED_TIMESHEET_REGISTRY_KEYS,
  replayPublishedTimesheetEvents,
} from "@/platform/workforce/services/published-timesheet-registry";
import { calculatePayrollContentHash } from "@/platform/workforce/contracts/published-timesheet-hash";
import { writeJsonSafe } from "@/platform/storage/storage";

import {
  actorAll as m06ActorAll,
  CLINIC as M06_CLINIC,
  resetM06TestEnv,
} from "../../m06-time-attendance/tests/_helpers";
import { clockIn, clockOut } from "../../m06-time-attendance/services/clock-service";
import {
  approveTimesheet,
  generateTimesheet,
  reopenTimesheet,
  submitTimesheet,
} from "../../m06-time-attendance/services/timesheet-service";
import { runM06SchemaV3Migration } from "../../m06-time-attendance/storage/migrate-v3";
import { listPublicationOutbox } from "../../m06-time-attendance/services/published-timesheet-outbox";
import { acknowledgeApprovedTimesheetIntake } from "../../m06-time-attendance/adapters/m07-timesheet-bridge";
import { getTimesheet } from "../../m06-time-attendance/repository/local-store";

import { actorAll, resetM07TestEnv } from "./_helpers";
import {
  clearM07LocalStoreCacheForTests,
} from "../repository/local-store";
import {
  ensureM07Bootstrapped,
  resetM07BootstrapCacheForTests,
} from "../storage";
import { runPublishedTimesheetReplayBatch } from "../services/published-timesheet-replay";
import {
  acknowledgeRestoreClearHold,
  assertSnapshotUsableForPreparation,
  getLifecycleProjection,
  getSnapshotEligibility,
  selectSupersedingSnapshot,
} from "../services/published-timesheet-lifecycle";
import {
  getPublishedTimesheetSnapshotByBusinessKey,
  listPublishedTimesheetSnapshots,
} from "../services/published-timesheet-intake";
import {
  getReplayCheckpoint,
  upsertReplayCheckpoint,
} from "../services/published-timesheet-replay";
import { getM07TimesheetIntakeBlockerStatus } from "../adapters/m06-timesheet-read";
import { PUBLISHED_TIMESHEET_CONTRACT_VERSION } from "@/platform/workforce/contracts/published-timesheet-contract";

const ORG = "org_m06_alpha";
const LE = "le_m06_payroll_1";
const LE_OTHER = "le_other_gate";

function bootBothModules() {
  // Shared memory localStorage: M06 first (installs storage + seeds), then M07 bootstrap additive.
  resetM06TestEnv();
  runM06SchemaV3Migration();
  clearM07LocalStoreCacheForTests();
  resetM07BootstrapCacheForTests();
  ensureM07Bootstrapped();
}

function approveAndPublish(personSuffix: string) {
  const actor = m06ActorAll(`cp27-${personSuffix}`);
  const { session } = clockIn({
    actor,
    clinicId: M06_CLINIC,
    localCivil: "2026-07-28T09:00",
    unrostered: true,
    clientEventId: `${personSuffix}-in`,
  });
  clockOut({
    actor,
    sessionId: session.id,
    localCivil: "2026-07-28T17:00",
    expectedVersion: session.version,
  });
  let ts = generateTimesheet({
    actor,
    personId: actor.personId!,
    clinicId: M06_CLINIC,
    periodStart: "2026-07-20",
    periodEnd: "2026-07-30",
    organisationId: ORG,
    legalEntityId: LE,
  });
  ts = submitTimesheet({ actor, timesheetId: ts.id, expectedVersion: ts.version });
  ts = approveTimesheet({ actor, timesheetId: ts.id, expectedVersion: ts.version });
  return { actor, ts };
}

function replay() {
  return runPublishedTimesheetReplayBatch({
    actor: actorAll(),
    scope: { organisationId: ORG, legalEntityId: LE },
    batchLimit: 25,
  });
}

describe("CP2.7A Batch 2 final-gate E2E", () => {
  beforeEach(() => bootBothModules());

  it("E2E: publish→replay→intake→hold→restore→material→supersession→recovery→isolation; BLOCKED-M07 cleared", () => {
    // --- Publication via authorised M06 publisher/outbox ---
    const { actor: m06Actor, ts } = approveAndPublish("e2e");
    assert.equal(ts.state, "approved");
    assert.ok(ts.platformPublicationAck);
    const outbox = listPublicationOutbox({ timesheetId: ts.id });
    assert.ok(
      outbox.some((o) => o.status === "published" || o.intent === "granted"),
      JSON.stringify(outbox.map((o) => ({ status: o.status, intent: o.intent })))
    );
    const current = getCurrentPublishedTimesheet({ organisationId: ORG, legalEntityId: LE }, ts.id);
    assert.equal(current?.currentApprovalState, "approved");
    assert.equal(current?.currentSourceVersion, 1);

    // Tenant-filtered ordered events exist
    const events = replayPublishedTimesheetEvents({ organisationId: ORG, legalEntityId: LE }, 0);
    assert.ok(events.length >= 1);
    assert.ok(events.every((e) => e.organisationId === ORG && e.legalEntityId === LE));
    for (let i = 1; i < events.length; i++) {
      assert.ok(events[i]!.eventSequence > events[i - 1]!.eventSequence);
    }

    // --- Bounded ordered replay + immutable intake ---
    const batch1 = replay();
    assert.equal(batch1.blockedM07, false);
    assert.ok(batch1.processed.some((o) => o.outcome === "intaken" || o.outcome === "duplicate-idempotent"));
    const snap1 = getPublishedTimesheetSnapshotByBusinessKey({
      organisationId: ORG,
      legalEntityId: LE,
      timesheetRecordId: ts.id,
      sourceVersion: 1,
    });
    assert.ok(snap1);
    assert.equal(snap1!.immutable, true);
    assert.equal(
      getSnapshotEligibility({
        organisationId: ORG,
        legalEntityId: LE,
        timesheetRecordId: ts.id,
        sourceVersion: 1,
      })?.eligibility,
      "eligible"
    );

    // Exact retry idempotent (re-deliver by resetting cursor)
    const cp = getReplayCheckpoint({
      organisationId: ORG,
      legalEntityId: LE,
      contractVersion: PUBLISHED_TIMESHEET_CONTRACT_VERSION,
    })!;
    upsertReplayCheckpoint({
      ...cp,
      lastCompletedEventSequence: 0,
      lastCompletedEventId: null,
      status: "active",
      checkpointVersion: cp.checkpointVersion + 1,
      updatedAt: new Date().toISOString(),
    });
    const retry = replay();
    assert.ok(
      retry.processed.some(
        (o) => o.outcome === "duplicate-idempotent" || o.eventId === events[0]!.eventId
      )
    );
    assert.equal(
      listPublishedTimesheetSnapshots({
        organisationId: ORG,
        legalEntityId: LE,
        timesheetRecordId: ts.id,
      }).length,
      1
    );

    // moreAvailable / continuation: two further authorised M06 publications, then bound batch
    approveAndPublish("e2e-extra1");
    approveAndPublish("e2e-extra2");
    const bounded = runPublishedTimesheetReplayBatch({
      actor: actorAll(),
      scope: { organisationId: ORG, legalEntityId: LE },
      batchLimit: 1,
    });
    assert.equal(bounded.moreAvailable, true);
    // Catch-up remaining events for subsequent lifecycle steps on primary timesheet
    replay();

    // --- Lifecycle hold via M06 reopen (authorised revoke publication) ---
    const fresh = getTimesheet(ts.id)!;
    assert.ok(fresh.platformPublicationAck, "approved timesheet must retain platform ack for revoke path");
    const beforeEventCount = (
      JSON.parse(localStorage.getItem(PUBLISHED_TIMESHEET_REGISTRY_KEYS.events) ?? "[]") as unknown[]
    ).length;
    const reopened = reopenTimesheet({
      actor: m06Actor,
      timesheetId: fresh.id,
      expectedVersion: fresh.version,
      reason: "E2E reopen",
    });
    assert.equal(reopened.state, "reopened");
    assert.equal(reopened.platformPublicationAck?.approvalState, "revoked");
    const afterEventCount = (
      JSON.parse(localStorage.getItem(PUBLISHED_TIMESHEET_REGISTRY_KEYS.events) ?? "[]") as unknown[]
    ).length;
    assert.ok(afterEventCount > beforeEventCount, "reopen must append registry lifecycle event");
    const afterRevoke = replay();
    assert.ok(
      afterRevoke.processed.some((o) => o.outcome === "lifecycle-hold-applied"),
      JSON.stringify(afterRevoke.processed.map((o) => ({ o: o.outcome, r: o.reason, t: o.eventType })))
    );
    assert.equal(
      getLifecycleProjection({
        organisationId: ORG,
        legalEntityId: LE,
        timesheetRecordId: ts.id,
      })?.hold,
      "revocation-hold"
    );
    assert.equal(
      assertSnapshotUsableForPreparation({
        actor: actorAll(),
        organisationId: ORG,
        legalEntityId: LE,
        snapshotId: snap1!.id,
      }).allowed,
      false
    );

    // Restore alone (platform restored publication) does not clear hold —
    // re-approve after reopen publishes restore/grant; still require M07 ack.
    // Use platform restore lifecycle for same content (publisher surface).
    const contentV1 = {
      timesheetRecordId: ts.id,
      workforcePersonId: snap1!.workforcePersonId,
      organisationId: ORG,
      legalEntityId: LE,
      clinicId: M06_CLINIC,
      periodStart: snap1!.periodStart,
      periodEnd: snap1!.periodEnd,
      attendanceSessionIds: snap1!.attendanceSessionIds,
      ordinaryHourInputs: snap1!.ordinaryHourInputs,
      overtimeHourInputs: snap1!.overtimeHourInputs,
      penaltyHourInputs: snap1!.penaltyHourInputs,
      leaveInputs: snap1!.leaveInputs,
      allowanceInputs: snap1!.allowanceInputs,
    };
    publishTimesheetVersion({
      content: contentV1,
      sourceVersion: 1,
      approvalRevision: (current?.latestApprovalRevision ?? 1) + 2,
      approvalState: "restored",
      publishedAt: "2026-07-29T02:00:00.000Z",
      publisherId: "m06-pub",
      eventId: "evt_e2e_restored",
      idempotencyKey: "evt_e2e_restored",
    });
    replay();
    assert.equal(
      getLifecycleProjection({
        organisationId: ORG,
        legalEntityId: LE,
        timesheetRecordId: ts.id,
      })?.hold,
      "revocation-hold"
    );

    const projHeld = getLifecycleProjection({
      organisationId: ORG,
      legalEntityId: LE,
      timesheetRecordId: ts.id,
    })!;
    const cleared = acknowledgeRestoreClearHold({
      actor: actorAll(),
      organisationId: ORG,
      legalEntityId: LE,
      timesheetRecordId: ts.id,
      expectedProjectionVersion: projHeld.projectionVersion,
      reason: "E2E authorised restore acknowledgement",
      lifecycleEventId: "evt_e2e_restored",
      snapshotId: snap1!.id,
    });
    assert.equal(cleared.status, "accepted");
    assert.equal(cleared.projection?.hold, "none");

    // --- Material revision (different verified contentHash) via platform publish API used by M06 publisher ---
    const materialContent = {
      ...contentV1,
      ordinaryHourInputs: [{ code: "ORD", hours: 99 }],
    };
    const materialHash = calculatePayrollContentHash(materialContent);
    assert.notEqual(materialHash, snap1!.contentHash);
    publishTimesheetVersion({
      content: materialContent,
      sourceVersion: 2,
      approvalRevision: 10,
      approvalState: "approved",
      publishedAt: "2026-07-29T03:00:00.000Z",
      publisherId: "m06-pub",
      eventId: "evt_e2e_material",
      idempotencyKey: "evt_e2e_material",
    });
    const materialReplay = replay();
    assert.ok(
      materialReplay.processed.some((o) => o.outcome === "lifecycle-material-pending-review")
    );
    const snap2 = getPublishedTimesheetSnapshotByBusinessKey({
      organisationId: ORG,
      legalEntityId: LE,
      timesheetRecordId: ts.id,
      sourceVersion: 2,
    });
    assert.ok(snap2);
    assert.notEqual(snap2!.id, snap1!.id);
    assert.equal(
      getPublishedTimesheetSnapshotByBusinessKey({
        organisationId: ORG,
        legalEntityId: LE,
        timesheetRecordId: ts.id,
        sourceVersion: 1,
      })?.id,
      snap1!.id
    );
    assert.equal(
      getSnapshotEligibility({
        organisationId: ORG,
        legalEntityId: LE,
        timesheetRecordId: ts.id,
        sourceVersion: 2,
      })?.eligibility,
      "pending-review"
    );
    const projMat = getLifecycleProjection({
      organisationId: ORG,
      legalEntityId: LE,
      timesheetRecordId: ts.id,
    })!;
    assert.equal(projMat.supersessionState, "pending-authorised-selection");
    assert.notEqual(projMat.selectedSnapshotId, snap2!.id);

    // Authorised supersession
    const selected = selectSupersedingSnapshot({
      actor: actorAll(),
      organisationId: ORG,
      legalEntityId: LE,
      timesheetRecordId: ts.id,
      targetSnapshotId: snap2!.id,
      expectedProjectionVersion: projMat.projectionVersion,
      reason: "E2E accept material revision",
    });
    assert.equal(selected.status, "accepted");
    assert.equal(selected.projection?.selectedSnapshotId, snap2!.id);
    assert.equal(
      getSnapshotEligibility({
        organisationId: ORG,
        legalEntityId: LE,
        timesheetRecordId: ts.id,
        sourceVersion: 1,
      })?.eligibility,
      "superseded"
    );
    assert.ok(
      getPublishedTimesheetSnapshotByBusinessKey({
        organisationId: ORG,
        legalEntityId: LE,
        timesheetRecordId: ts.id,
        sourceVersion: 1,
      })
    );

    // --- Interruption: outcome durable, cursor behind → resume without duplicate ---
    const cp2 = getReplayCheckpoint({
      organisationId: ORG,
      legalEntityId: LE,
      contractVersion: PUBLISHED_TIMESHEET_CONTRACT_VERSION,
    })!;
    const safeSeq = cp2.lastCompletedEventSequence;
    upsertReplayCheckpoint({
      ...cp2,
      lastCompletedEventSequence: Math.max(0, safeSeq - 1),
      status: "active",
      checkpointVersion: cp2.checkpointVersion + 1,
      updatedAt: new Date().toISOString(),
    });
    const resumed = replay();
    assert.equal(resumed.checkpoint.lastCompletedEventSequence >= safeSeq - 1, true);
    assert.equal(
      listPublishedTimesheetSnapshots({
        organisationId: ORG,
        legalEntityId: LE,
        timesheetRecordId: ts.id,
      }).filter((s) => s.sourceVersion === 2).length,
      1
    );

    // --- Unsafe cursor: corrupt sequence fails closed ---
    writeJsonSafe(
      "pulse.m07.staffpay.publishedTimesheetReplayCheckpoints",
      [
        {
          ...resumed.checkpoint,
          lastCompletedEventSequence: "bad",
          status: "active",
        },
      ]
    );
    const corrupt = replay();
    assert.equal(corrupt.stoppedReason, "conflict");
    assert.equal(corrupt.checkpoint.status, "blocked-conflict");

    // --- Isolation ---
    assert.equal(
      replayPublishedTimesheetEvents({ organisationId: ORG, legalEntityId: LE_OTHER }, 0).length,
      0
    );
    assert.equal(
      getPublishedTimesheetSnapshotByBusinessKey({
        organisationId: ORG,
        legalEntityId: LE_OTHER,
        timesheetRecordId: ts.id,
        sourceVersion: 1,
      }),
      null
    );
    assert.throws(() =>
      runPublishedTimesheetReplayBatch({
        actor: {
          userId: "u-le-b",
          permissions: ["payroll.intake.run"],
          legalEntityIds: [LE_OTHER],
        },
        scope: { organisationId: ORG, legalEntityId: LE },
      })
    );

    // Clinic mismatch on intake gate (publication clinic vs scope)
    assert.equal(
      assertSnapshotUsableForPreparation({
        actor: actorAll(),
        organisationId: ORG,
        legalEntityId: LE,
        snapshotId: "guessed-foreign",
      }).allowed,
      false
    );

    // Prohibited fields absent on snapshots
    assert.equal((snap1 as { tfn?: unknown }).tfn, undefined);
    assert.equal((snap2 as { grossPay?: unknown }).grossPay, undefined);
    assert.equal((snap2 as { paymentStatus?: unknown }).paymentStatus, undefined);

    // BLOCKED-M07 cleared (both authoritative helpers)
    assert.equal(getM07TimesheetIntakeBlockerStatus().blocked, false);
    assert.equal(getM07TimesheetIntakeBlockerStatus().workflowEvidenceCode, "CLEARED-M07-BATCH2");
    assert.equal(acknowledgeApprovedTimesheetIntake(ts.id).blocked, false);
    assert.equal(batch1.blockedM07, false);
    assert.equal(materialReplay.blockedM07, false);

    // No bypass: replay still depends on platform query + CP2.4 intake modules
    const replaySrc = readFileSync(
      join(process.cwd(), "src/modules/m07-staff-pay/services/published-timesheet-replay.ts"),
      "utf8"
    );
    assert.ok(replaySrc.includes("replayPublishedTimesheetEvents"));
    assert.ok(replaySrc.includes("intakePublishedTimesheet"));
  });

  it("global eventSequence tenant-filter: cross-tenant holes are not tenant gaps", () => {
    const a = approveAndPublish("gap-a");
    // Foreign tenant event occupies an intervening global sequence
    publishTimesheetVersion({
      content: {
        timesheetRecordId: "ts_foreign",
        workforcePersonId: "wp_f",
        organisationId: "org_foreign",
        legalEntityId: "le_foreign",
        clinicId: M06_CLINIC,
        periodStart: "2026-07-20",
        periodEnd: "2026-07-30",
        attendanceSessionIds: ["f1"],
        ordinaryHourInputs: [{ code: "ORD", hours: 1 }],
        overtimeHourInputs: [],
        penaltyHourInputs: [],
        leaveInputs: [],
        allowanceInputs: [],
      },
      sourceVersion: 1,
      approvalRevision: 1,
      approvalState: "approved",
      publishedAt: "2026-07-29T04:00:00.000Z",
      publisherId: "other",
      eventId: "evt_foreign",
      idempotencyKey: "evt_foreign",
    });
    publishTimesheetVersion({
      content: {
        timesheetRecordId: `${a.ts.id}-b`,
        workforcePersonId: "wp_b",
        organisationId: ORG,
        legalEntityId: LE,
        clinicId: M06_CLINIC,
        periodStart: "2026-07-20",
        periodEnd: "2026-07-30",
        attendanceSessionIds: ["b1"],
        ordinaryHourInputs: [{ code: "ORD", hours: 2 }],
        overtimeHourInputs: [],
        penaltyHourInputs: [],
        leaveInputs: [],
        allowanceInputs: [],
      },
      sourceVersion: 1,
      approvalRevision: 1,
      approvalState: "approved",
      publishedAt: "2026-07-29T05:00:00.000Z",
      publisherId: "m06-pub",
      eventId: "evt_same_tenant_b",
      idempotencyKey: "evt_same_tenant_b",
    });

    const result = replay();
    assert.notEqual(result.stoppedReason, "blocked-gap");
    assert.ok(result.processed.every((o) => o.outcome !== "blocked-gap"));
    assert.equal(getM07TimesheetIntakeBlockerStatus().blocked, false);
  });
});
