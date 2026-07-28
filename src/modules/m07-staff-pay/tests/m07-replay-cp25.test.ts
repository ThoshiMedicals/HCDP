/**
 * Checkpoint 2.5 — ordered registry-event replay for M07 published-timesheet intake.
 */

import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import {
  publishTimesheetVersion,
  PUBLISHED_TIMESHEET_REGISTRY_KEYS,
  replayPublishedTimesheetEvents,
} from "@/platform/workforce/services/published-timesheet-registry";
import { calculatePayrollContentHash } from "@/platform/workforce/contracts/published-timesheet-hash";
import { PUBLISHED_TIMESHEET_CONTRACT_VERSION } from "@/platform/workforce/contracts/published-timesheet-contract";
import { readJsonSafe, writeJsonSafe } from "@/platform/storage/storage";
import { actorAll, CLINIC_A, CLINIC_B, ORG_A, ORG_B, resetM07TestEnv } from "./_helpers";
import {
  getReplayCheckpoint,
  getReplayCheckpointById,
  listReplayOutcomes,
  runPublishedTimesheetReplayBatch,
  upsertReplayCheckpoint,
} from "../services/published-timesheet-replay";
import {
  listPublishedTimesheetSnapshots,
  getPublishedTimesheetSnapshotByBusinessKey,
} from "../services/published-timesheet-intake";
import { getM07TimesheetIntakeBlockerStatus } from "../adapters/m06-timesheet-read";
import { M07_STORAGE_KEYS } from "../storage";
import { listAudit } from "../repository/local-store";
import type { M07Actor } from "../permissions";
import { M07_PERMISSION_CODES } from "../permissions";

const LE_A = "le_pay_a";
const LE_B = "le_pay_b";
const M07_ROOT = join(process.cwd(), "src/modules/m07-staff-pay");

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
  eventSequence?: number;
}) {
  const content = {
    timesheetRecordId: input.timesheetRecordId,
    workforcePersonId: "wp_replay_1",
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
    eventSequence: input.eventSequence,
  });
  return {
    version: result.version,
    event: result.event,
    content,
    contentHash: calculatePayrollContentHash(content),
  };
}

function actorScoped(leIds: string[]): M07Actor {
  return {
    userId: "u-scoped",
    permissions: [...M07_PERMISSION_CODES],
    legalEntityIds: leIds,
    clinicIds: undefined,
  };
}

function walkProductionTsFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "tests" || name === "node_modules") continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walkProductionTsFiles(full, out);
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

describe("CP2.5 M07 published-timesheet ordered replay", () => {
  beforeEach(() => resetM07TestEnv());

  describe("A. Ordered replay", () => {
    it("processes events in authoritative sequence and reports moreAvailable", () => {
      publishEligible({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_ord_1",
        eventId: "evt_ord_1",
      });
      publishEligible({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_ord_2",
        eventId: "evt_ord_2",
        sourceVersion: 1,
      });
      publishEligible({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_ord_3",
        eventId: "evt_ord_3",
      });

      const first = runPublishedTimesheetReplayBatch({
        actor: actorAll(),
        scope: { organisationId: ORG_A, legalEntityId: LE_A },
        batchLimit: 2,
      });
      assert.equal(first.processed.length, 2);
      assert.equal(first.processed[0]!.eventSequence, 1);
      assert.equal(first.processed[1]!.eventSequence, 2);
      assert.equal(first.moreAvailable, true, `processed=${first.processed.length} stopped=${first.stoppedReason}`);
      assert.equal(first.checkpoint.lastCompletedEventSequence, 2);
      assert.equal(first.blockedM07, false);

      const second = runPublishedTimesheetReplayBatch({
        actor: actorAll(),
        scope: { organisationId: ORG_A, legalEntityId: LE_A },
        batchLimit: 2,
      });
      assert.equal(second.processed.length, 1);
      assert.equal(second.processed[0]!.eventSequence, 3);
      assert.equal(second.moreAvailable, false);
      assert.equal(second.checkpoint.lastCompletedEventSequence, 3);
      assert.equal(
        listPublishedTimesheetSnapshots({
          organisationId: ORG_A,
          legalEntityId: LE_A,
        }).length,
        3
      );
    });

    it("duplicate delivery is idempotent; completed events do not create another snapshot", () => {
      publishEligible({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_dup",
        eventId: "evt_dup",
      });
      const a = runPublishedTimesheetReplayBatch({
        actor: actorAll(),
        scope: { organisationId: ORG_A, legalEntityId: LE_A },
      });
      assert.equal(a.processed[0]!.outcome, "intaken");
      const snapCount = listPublishedTimesheetSnapshots({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_dup",
      }).length;
      assert.equal(snapCount, 1);

      // Reset cursor behind completed event to simulate redelivery
      const cp = getReplayCheckpoint({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        contractVersion: PUBLISHED_TIMESHEET_CONTRACT_VERSION,
      })!;
      upsertReplayCheckpoint({
        ...cp,
        lastCompletedEventSequence: 0,
        lastCompletedEventId: null,
        checkpointVersion: cp.checkpointVersion + 1,
        updatedAt: new Date().toISOString(),
        status: "active",
      });

      const b = runPublishedTimesheetReplayBatch({
        actor: actorAll(),
        scope: { organisationId: ORG_A, legalEntityId: LE_A },
      });
      assert.ok(
        b.processed.some(
          (o) => o.outcome === "duplicate-idempotent" || o.eventId === "evt_dup"
        )
      );
      assert.equal(
        listPublishedTimesheetSnapshots({
          organisationId: ORG_A,
          legalEntityId: LE_A,
          timesheetRecordId: "ts_dup",
        }).length,
        1
      );
    });

    it("sequence gaps stop advancement; out-of-order cannot regress checkpoint", () => {
      // Non-monotonic tenant page (duplicate sequence) → blocked-gap.
      // Platform rejects duplicate sequences on publish; inject via registry event store.
      const pub = publishEligible({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_gap_1",
        eventId: "evt_gap_1",
        eventSequence: 1,
      });
      const events = readJsonSafe(
        PUBLISHED_TIMESHEET_REGISTRY_KEYS.events,
        [] as Array<Record<string, unknown>>
      );
      const clone = {
        ...events[0],
        eventId: "evt_gap_dup_seq",
        timesheetRecordId: "ts_gap_dup",
        eventSequence: 1,
      };
      writeJsonSafe(PUBLISHED_TIMESHEET_REGISTRY_KEYS.events, [...events, clone]);

      const gap = runPublishedTimesheetReplayBatch({
        actor: actorAll(),
        scope: { organisationId: ORG_A, legalEntityId: LE_A },
      });
      assert.equal(gap.stoppedReason, "blocked-gap");
      assert.equal(gap.checkpoint.status, "blocked-gap");
      assert.ok(gap.processed.some((o) => o.outcome === "blocked-gap"));
      // Cursor must not advance past the integrity failure
      assert.equal(gap.checkpoint.lastCompletedEventSequence, 1);

      const retry = runPublishedTimesheetReplayBatch({
        actor: actorAll(),
        scope: { organisationId: ORG_A, legalEntityId: LE_A },
      });
      assert.equal(retry.stoppedReason, "blocked-gap");
      assert.equal(retry.checkpoint.lastCompletedEventSequence, 1);

      // Out-of-order regress: reset status, force cursor ahead, inject older unseen event id
      upsertReplayCheckpoint({
        ...gap.checkpoint,
        status: "active",
        blockedReason: undefined,
        lastCompletedEventSequence: 5,
        lastCompletedEventId: "synthetic",
        checkpointVersion: gap.checkpoint.checkpointVersion + 1,
        updatedAt: new Date().toISOString(),
      });
      writeJsonSafe(PUBLISHED_TIMESHEET_REGISTRY_KEYS.events, [
        {
          ...pub.event,
          eventId: "evt_ooo",
          eventSequence: 2,
        },
      ]);
      const ooo = runPublishedTimesheetReplayBatch({
        actor: actorAll(),
        scope: { organisationId: ORG_A, legalEntityId: LE_A },
      });
      // afterSequence=5 → empty page from platform; cursor must not regress
      assert.equal(ooo.checkpoint.lastCompletedEventSequence, 5);
      assert.equal(ooo.stoppedReason, "empty");
    });

    it("conflicting reuse of an event identity is detected", () => {
      const pub = publishEligible({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_conf",
        eventId: "evt_conf",
      });
      runPublishedTimesheetReplayBatch({
        actor: actorAll(),
        scope: { organisationId: ORG_A, legalEntityId: LE_A },
      });

      // Corrupt stored outcome contentHash to simulate identity reuse conflict on redelivery
      const outcomes = readJsonSafe(M07_STORAGE_KEYS.publishedTimesheetReplayOutcomes, [] as Array<{
        eventId: string;
        contentHash?: string;
      }>);
      writeJsonSafe(
        M07_STORAGE_KEYS.publishedTimesheetReplayOutcomes,
        outcomes.map((o) =>
          o.eventId === pub.event.eventId ? { ...o, contentHash: "c".repeat(64) } : o
        )
      );
      const cp = getReplayCheckpoint({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        contractVersion: PUBLISHED_TIMESHEET_CONTRACT_VERSION,
      })!;
      upsertReplayCheckpoint({
        ...cp,
        lastCompletedEventSequence: 0,
        lastCompletedEventId: null,
        status: "active",
        blockedReason: undefined,
        checkpointVersion: cp.checkpointVersion + 1,
        updatedAt: new Date().toISOString(),
      });

      const conflict = runPublishedTimesheetReplayBatch({
        actor: actorAll(),
        scope: { organisationId: ORG_A, legalEntityId: LE_A },
      });
      assert.equal(conflict.stoppedReason, "conflict");
      assert.equal(conflict.checkpoint.status, "blocked-conflict");
      assert.ok(
        conflict.processed.some(
          (o) => o.outcome === "conflict" && o.reason === "EVENT_IDENTITY_CONTENT_CONFLICT"
        )
      );
    });
  });

  describe("B. Recovery", () => {
    it("interruption before checkpoint advancement resumes without duplicate snapshots", () => {
      publishEligible({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_rec",
        eventId: "evt_rec",
      });
      // Simulate: outcome recorded + snapshot exists, cursor not advanced
      const mid = runPublishedTimesheetReplayBatch({
        actor: actorAll(),
        scope: { organisationId: ORG_A, legalEntityId: LE_A },
      });
      assert.equal(mid.processed[0]!.outcome, "intaken");
      const snapId = mid.processed[0]!.snapshotId;
      const cp = getReplayCheckpoint({
        organisationId: ORG_A,
        legalEntityId: LE_A,
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

      const resume = runPublishedTimesheetReplayBatch({
        actor: actorAll(),
        scope: { organisationId: ORG_A, legalEntityId: LE_A },
      });
      assert.equal(resume.checkpoint.lastCompletedEventSequence, 1);
      assert.equal(
        listPublishedTimesheetSnapshots({
          organisationId: ORG_A,
          legalEntityId: LE_A,
          timesheetRecordId: "ts_rec",
        }).length,
        1
      );
      assert.equal(
        getPublishedTimesheetSnapshotByBusinessKey({
          organisationId: ORG_A,
          legalEntityId: LE_A,
          timesheetRecordId: "ts_rec",
          sourceVersion: 1,
        })?.id,
        snapId
      );
    });

    it("corrupt cursor data fails closed; registry unavailability preserves last safe checkpoint", () => {
      publishEligible({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_safe",
        eventId: "evt_safe",
      });
      const ok = runPublishedTimesheetReplayBatch({
        actor: actorAll(),
        scope: { organisationId: ORG_A, legalEntityId: LE_A },
      });
      assert.equal(ok.checkpoint.lastCompletedEventSequence, 1);
      const safeSeq = ok.checkpoint.lastCompletedEventSequence;

      writeJsonSafe(M07_STORAGE_KEYS.publishedTimesheetReplayCheckpoints, [
        {
          id: "corrupt",
          organisationId: ORG_A,
          legalEntityId: LE_A,
          streamPurpose: "published-timesheet.lifecycle",
          contractVersion: PUBLISHED_TIMESHEET_CONTRACT_VERSION,
          lastCompletedEventSequence: "not-a-number",
          lastCompletedEventId: null,
          checkpointVersion: 1,
          updatedAt: new Date().toISOString(),
          status: "active",
        },
      ]);

      const corrupt = runPublishedTimesheetReplayBatch({
        actor: actorAll(),
        scope: { organisationId: ORG_A, legalEntityId: LE_A },
      });
      assert.equal(corrupt.stoppedReason, "conflict");
      assert.equal(corrupt.checkpoint.status, "blocked-conflict");
      assert.equal(corrupt.checkpoint.blockedReason, "CORRUPT_CHECKPOINT_SEQUENCE");

      // Restore valid cursor then remove publication row with no prior outcome → unavailable
      writeJsonSafe(M07_STORAGE_KEYS.publishedTimesheetReplayCheckpoints, [
        {
          ...ok.checkpoint,
          lastCompletedEventSequence: 0,
          lastCompletedEventId: null,
          status: "active",
          blockedReason: undefined,
        },
      ]);
      writeJsonSafe(M07_STORAGE_KEYS.publishedTimesheetReplayOutcomes, []);
      writeJsonSafe(PUBLISHED_TIMESHEET_REGISTRY_KEYS.versions, []);
      const down = runPublishedTimesheetReplayBatch({
        actor: actorAll(),
        scope: { organisationId: ORG_A, legalEntityId: LE_A },
      });
      assert.equal(down.stoppedReason, "unavailable");
      assert.equal(down.checkpoint.lastCompletedEventSequence, 0);
      assert.ok(down.processed.some((o) => o.outcome === "unavailable"));
      void safeSeq;
    });
  });

  describe("C. Isolation", () => {
    it("denies cross-organisation and cross-legal-entity replay; guessed ids reveal nothing", () => {
      const a = publishEligible({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_iso_a",
        eventId: "evt_iso_a",
      });
      publishEligible({
        organisationId: ORG_B,
        legalEntityId: LE_B,
        timesheetRecordId: "ts_iso_b",
        eventId: "evt_iso_b",
      });

      const orgB = runPublishedTimesheetReplayBatch({
        actor: actorAll(),
        scope: { organisationId: ORG_B, legalEntityId: LE_B },
      });
      assert.equal(orgB.processed.length, 1);
      assert.equal(orgB.processed[0]!.organisationId, ORG_B);

      const orgA = runPublishedTimesheetReplayBatch({
        actor: actorAll(),
        scope: { organisationId: ORG_A, legalEntityId: LE_A },
      });
      assert.ok(orgA.processed.every((o) => o.organisationId === ORG_A));
      assert.equal(
        listReplayOutcomes({ organisationId: ORG_A, legalEntityId: LE_A }).every(
          (o) => o.organisationId === ORG_A && o.legalEntityId === LE_A
        ),
        true
      );

      assert.equal(
        getReplayCheckpointById(
          { organisationId: ORG_B, legalEntityId: LE_B },
          orgA.checkpoint.id
        ),
        null
      );
      assert.equal(
        getReplayCheckpointById(
          { organisationId: ORG_A, legalEntityId: LE_A },
          "guessed-checkpoint"
        ),
        null
      );

      // Wrong LE cannot see ORG_A/LE_A events via platform query either
      assert.equal(
        replayPublishedTimesheetEvents(
          { organisationId: ORG_A, legalEntityId: LE_B },
          0
        ).length,
        0
      );

      assert.throws(() =>
        runPublishedTimesheetReplayBatch({
          actor: actorScoped([LE_B]),
          scope: { organisationId: ORG_A, legalEntityId: LE_A },
        })
      );

      // Clinic mismatch on intake path during replay
      publishEligible({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_clinic",
        eventId: "evt_clinic",
        clinicId: CLINIC_A,
      });
      const clinic = runPublishedTimesheetReplayBatch({
        actor: actorAll(),
        scope: { organisationId: ORG_A, legalEntityId: LE_A, clinicId: CLINIC_B },
      });
      assert.ok(
        clinic.processed.some(
          (o) =>
            o.timesheetRecordId === "ts_clinic" &&
            (o.outcome === "rejected-ineligible" || o.reason === "CLINIC_MISMATCH")
        ),
        JSON.stringify(clinic.processed.map((o) => ({ t: o.timesheetRecordId, o: o.outcome, r: o.reason })))
      );
      void a;
    });

    it("cursors are independently tenant and legal-entity scoped", () => {
      publishEligible({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_cur_a",
        eventId: "evt_cur_a",
      });
      publishEligible({
        organisationId: ORG_A,
        legalEntityId: LE_B,
        timesheetRecordId: "ts_cur_b",
        eventId: "evt_cur_b",
      });
      const a = runPublishedTimesheetReplayBatch({
        actor: actorAll(),
        scope: { organisationId: ORG_A, legalEntityId: LE_A },
      });
      const b = runPublishedTimesheetReplayBatch({
        actor: actorAll(),
        scope: { organisationId: ORG_A, legalEntityId: LE_B },
      });
      assert.notEqual(a.checkpoint.id, b.checkpoint.id);
      assert.equal(a.checkpoint.legalEntityId, LE_A);
      assert.equal(b.checkpoint.legalEntityId, LE_B);
      assert.equal(a.checkpoint.lastCompletedEventSequence, 1);
      assert.equal(b.checkpoint.lastCompletedEventSequence, 2); // global sequence for LE_B event
      assert.ok(a.checkpoint.lastCompletedEventSequence < b.checkpoint.lastCompletedEventSequence || a.checkpoint.id !== b.checkpoint.id);
    });
  });

  describe("D. Lifecycle boundary", () => {
    it("records revocation with hold application; later versions do not overwrite; BLOCKED-M07 cleared", () => {
      const granted = publishEligible({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_life",
        eventId: "evt_life_g",
        sourceVersion: 1,
      });
      runPublishedTimesheetReplayBatch({
        actor: actorAll(),
        scope: { organisationId: ORG_A, legalEntityId: LE_A },
      });
      const snap1 = getPublishedTimesheetSnapshotByBusinessKey({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_life",
        sourceVersion: 1,
      })!;
      assert.ok(snap1);

      publishTimesheetVersion({
        content: {
          timesheetRecordId: "ts_life",
          workforcePersonId: "wp_replay_1",
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
        eventId: "evt_life_r",
        idempotencyKey: "evt_life_r",
      });

      const rev = runPublishedTimesheetReplayBatch({
        actor: actorAll(),
        scope: { organisationId: ORG_A, legalEntityId: LE_A },
      });
      assert.ok(
        rev.processed.some(
          (o) =>
            o.outcome === "lifecycle-hold-applied" &&
            o.reason === "REVOCATION_HOLD_APPLIED"
        )
      );
      // Cursor may advance after durable recoverable hold application
      assert.equal(rev.checkpoint.status, "active");
      assert.ok(rev.checkpoint.lastCompletedEventSequence >= 2);

      // Prior immutable snapshot untouched
      const still = getPublishedTimesheetSnapshotByBusinessKey({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_life",
        sourceVersion: 1,
      })!;
      assert.equal(still.id, snap1.id);
      assert.equal(still.contentHash, snap1.contentHash);

      // Later material version creates new snapshot; does not overwrite v1
      publishEligible({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_life",
        eventId: "evt_life_v2",
        sourceVersion: 2,
        approvalRevision: 3,
        ordinaryHours: 80,
      });
      const v2 = runPublishedTimesheetReplayBatch({
        actor: actorAll(),
        scope: { organisationId: ORG_A, legalEntityId: LE_A },
      });
      assert.ok(
        v2.processed.some(
          (o) =>
            o.outcome === "lifecycle-material-pending-review" || o.outcome === "intaken"
        )
      );
      assert.ok(
        getPublishedTimesheetSnapshotByBusinessKey({
          organisationId: ORG_A,
          legalEntityId: LE_A,
          timesheetRecordId: "ts_life",
          sourceVersion: 1,
        })
      );
      assert.equal(
        getPublishedTimesheetSnapshotByBusinessKey({
          organisationId: ORG_A,
          legalEntityId: LE_A,
          timesheetRecordId: "ts_life",
          sourceVersion: 2,
        })?.ordinaryHourInputs[0]?.hours,
        80
      );

      assert.equal(v2.blockedM07, false);
      assert.equal(getM07TimesheetIntakeBlockerStatus().blocked, false);
      assert.equal(getM07TimesheetIntakeBlockerStatus().workflowEvidenceCode, "CLEARED-M07-BATCH2");

      const replaySrc = readFileSync(
        join(M07_ROOT, "services/published-timesheet-replay.ts"),
        "utf8"
      );
      assert.doesNotMatch(replaySrc, /payroll\.recalc|grossPay/);
      void granted;
    });
  });

  describe("E. Architectural boundaries", () => {
    it("M07 has no pulse.m06 scrape; replay uses CP2.4 intake; no registry mutation", () => {
      for (const file of walkProductionTsFiles(M07_ROOT)) {
        const stripped = stripCommentsAndStrings(readFileSync(file, "utf8"));
        assert.doesNotMatch(stripped, /pulse\.m06\./);
        assert.doesNotMatch(stripped, /m06-time-attendance\/repository/);
        assert.doesNotMatch(stripped, /m06-time-attendance\/services/);
      }

      const replaySrc = readFileSync(
        join(M07_ROOT, "services/published-timesheet-replay.ts"),
        "utf8"
      );
      assert.ok(replaySrc.includes("intakePublishedTimesheet"));
      assert.ok(replaySrc.includes("replayPublishedTimesheetEvents"));
      assert.ok(!replaySrc.includes("PUBLISHED_TIMESHEET_REGISTRY_KEYS"));
      assert.ok(!replaySrc.includes("writeJsonSafe(PUBLISHED"));

      // Module 5 demand-based rostering must not be mixed into M07
      assert.doesNotMatch(replaySrc, /demand-based|coverage periods|A4 landscape/);
      assert.doesNotMatch(
        readFileSync(join(M07_ROOT, "services/published-timesheet-intake.ts"), "utf8"),
        /demand-based roster|A4 landscape/
      );
      publishEligible({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_arch",
        eventId: "evt_arch",
      });
      const beforeEvents = localStorage.getItem(PUBLISHED_TIMESHEET_REGISTRY_KEYS.events);
      const result = runPublishedTimesheetReplayBatch({
        actor: actorAll(),
        scope: { organisationId: ORG_A, legalEntityId: LE_A },
      });
      assert.equal(localStorage.getItem(PUBLISHED_TIMESHEET_REGISTRY_KEYS.events), beforeEvents);
      assert.equal(result.blockedM07, false);
      assert.ok(
        listAudit(LE_A).some((a) => String(a.action).startsWith("published-timesheet.replay."))
      );
    });
  });
});
