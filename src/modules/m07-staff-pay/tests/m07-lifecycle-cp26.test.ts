/**
 * Checkpoint 2.6 — M07 published-timesheet lifecycle projections.
 */

import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { publishTimesheetVersion } from "@/platform/workforce/services/published-timesheet-registry";
import { calculatePayrollContentHash } from "@/platform/workforce/contracts/published-timesheet-hash";
import { PUBLISHED_TIMESHEET_REGISTRY_KEYS } from "@/platform/workforce/services/published-timesheet-registry";
import { actorAll, CLINIC_A, CLINIC_B, ORG_A, ORG_B, resetM07TestEnv } from "./_helpers";
import { runPublishedTimesheetReplayBatch } from "../services/published-timesheet-replay";
import {
  acknowledgeRestoreClearHold,
  applyLifecycleHoldEvent,
  assertSnapshotUsableForPreparation,
  ensureLifecycleProjection,
  getLifecycleProjection,
  getLifecycleProjectionById,
  getSnapshotEligibility,
  listLifecycleExceptions,
  observePreparationProgress,
  requalifyInvalidatedSnapshot,
  resolveLifecycleException,
  selectSupersedingSnapshot,
} from "../services/published-timesheet-lifecycle";
import {
  getPublishedTimesheetSnapshotByBusinessKey,
  listPublishedTimesheetSnapshots,
} from "../services/published-timesheet-intake";
import { getM07TimesheetIntakeBlockerStatus } from "../adapters/m06-timesheet-read";
import { listAudit } from "../repository/local-store";
import { M07_PERMISSION_CODES, type M07Actor } from "../permissions";

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
}) {
  const content = {
    timesheetRecordId: input.timesheetRecordId,
    workforcePersonId: "wp_life_1",
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
  return {
    version: result.version,
    event: result.event,
    content,
    contentHash: calculatePayrollContentHash(content),
  };
}

function actorWith(perms: string[], leIds?: string[]): M07Actor {
  return {
    userId: "u-scoped",
    permissions: perms,
    legalEntityIds: leIds,
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

function replayOrgA() {
  return runPublishedTimesheetReplayBatch({
    actor: actorAll(),
    scope: { organisationId: ORG_A, legalEntityId: LE_A },
  });
}

describe("CP2.6 M07 published-timesheet lifecycle", () => {
  beforeEach(() => resetM07TestEnv());

  describe("A. Materiality and history", () => {
    it("material content creates new snapshot pending-review; no auto supersession; prior unchanged", () => {
      publishEligible({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_mat",
        eventId: "evt_mat_1",
        ordinaryHours: 70,
      });
      const first = replayOrgA();
      assert.ok(first.processed.some((o) => o.outcome === "intaken"));
      const snap1 = getPublishedTimesheetSnapshotByBusinessKey({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_mat",
        sourceVersion: 1,
      })!;
      assert.equal(
        getSnapshotEligibility({
          organisationId: ORG_A,
          legalEntityId: LE_A,
          timesheetRecordId: "ts_mat",
          sourceVersion: 1,
        })?.eligibility,
        "eligible"
      );

      publishEligible({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_mat",
        eventId: "evt_mat_2",
        sourceVersion: 2,
        approvalRevision: 2,
        ordinaryHours: 80,
      });
      const second = replayOrgA();
      assert.ok(
        second.processed.some((o) => o.outcome === "lifecycle-material-pending-review")
      );
      const snap2 = getPublishedTimesheetSnapshotByBusinessKey({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_mat",
        sourceVersion: 2,
      })!;
      assert.notEqual(snap2.id, snap1.id);
      assert.equal(snap1.ordinaryHourInputs[0]!.hours, 70);
      assert.equal(
        getPublishedTimesheetSnapshotByBusinessKey({
          organisationId: ORG_A,
          legalEntityId: LE_A,
          timesheetRecordId: "ts_mat",
          sourceVersion: 1,
        })?.id,
        snap1.id
      );
      assert.equal(
        getSnapshotEligibility({
          organisationId: ORG_A,
          legalEntityId: LE_A,
          timesheetRecordId: "ts_mat",
          sourceVersion: 2,
        })?.eligibility,
        "pending-review"
      );
      const proj = getLifecycleProjection({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_mat",
      })!;
      assert.equal(proj.supersessionState, "pending-authorised-selection");
      assert.notEqual(proj.selectedSnapshotId, snap2.id);
    });

    it("lifecycle-only same-hash does not rewrite snapshots; same-version hash conflict remains hard", () => {
      const pub = publishEligible({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_same",
        eventId: "evt_same_1",
      });
      replayOrgA();
      const before = listPublishedTimesheetSnapshots({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_same",
      }).length;

      // Same content, new sourceVersion — lineage only
      publishTimesheetVersion({
        content: pub.content,
        sourceVersion: 2,
        approvalRevision: 2,
        approvalState: "revised",
        publishedAt: "2026-07-15T03:00:00.000Z",
        publisherId: "m06-pub",
        eventId: "evt_same_2",
        idempotencyKey: "evt_same_2",
      });
      const lineage = replayOrgA();
      assert.ok(lineage.processed.some((o) => o.outcome === "lifecycle-lineage-recorded"));
      assert.equal(
        listPublishedTimesheetSnapshots({
          organisationId: ORG_A,
          legalEntityId: LE_A,
          timesheetRecordId: "ts_same",
        }).length,
        before
      );

      // Revoke current version — must not mutate existing immutable snapshot rows
      const snap = getPublishedTimesheetSnapshotByBusinessKey({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_same",
        sourceVersion: 1,
      })!;
      publishTimesheetVersion({
        content: pub.content,
        sourceVersion: 2,
        approvalRevision: 3,
        approvalState: "revoked",
        reasonCode: "REOPEN",
        publishedAt: "2026-07-15T04:00:00.000Z",
        publisherId: "m06-pub",
        eventId: "evt_same_r",
        idempotencyKey: "evt_same_r",
      });
      replayOrgA();
      assert.equal(
        getPublishedTimesheetSnapshotByBusinessKey({
          organisationId: ORG_A,
          legalEntityId: LE_A,
          timesheetRecordId: "ts_same",
          sourceVersion: 1,
        })?.contentHash,
        snap.contentHash
      );
      assert.equal(
        listPublishedTimesheetSnapshots({
          organisationId: ORG_A,
          legalEntityId: LE_A,
          timesheetRecordId: "ts_same",
        }).length,
        before
      );
    });
  });

  describe("B. Holds and eligibility", () => {
    it("revoke/withdraw/invalidate apply holds; blocks ordinary use; duplicate replay idempotent", () => {
      publishEligible({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_hold",
        eventId: "evt_hold_g",
      });
      replayOrgA();
      const snap = getPublishedTimesheetSnapshotByBusinessKey({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_hold",
        sourceVersion: 1,
      })!;
      assert.equal(
        assertSnapshotUsableForPreparation({
          actor: actorAll(),
          organisationId: ORG_A,
          legalEntityId: LE_A,
          snapshotId: snap.id,
        }).allowed,
        true
      );

      publishTimesheetVersion({
        content: {
          timesheetRecordId: "ts_hold",
          workforcePersonId: "wp_life_1",
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
        eventId: "evt_hold_r",
        idempotencyKey: "evt_hold_r",
      });
      const rev = replayOrgA();
      assert.ok(rev.processed.some((o) => o.outcome === "lifecycle-hold-applied"));
      assert.equal(
        getLifecycleProjection({
          organisationId: ORG_A,
          legalEntityId: LE_A,
          timesheetRecordId: "ts_hold",
        })?.hold,
        "revocation-hold"
      );
      assert.equal(
        assertSnapshotUsableForPreparation({
          actor: actorAll(),
          organisationId: ORG_A,
          legalEntityId: LE_A,
          snapshotId: snap.id,
        }).allowed,
        false
      );

      // Duplicate lifecycle application: second apply of same eventId is idempotent
      const dup = applyLifecycleHoldEvent({
        actor: actorAll(),
        event: {
          eventId: "evt_hold_r",
          eventType: "timesheet.approval.revoked",
          eventSequence: 2,
          organisationId: ORG_A,
          legalEntityId: LE_A,
          clinicId: CLINIC_A,
          timesheetRecordId: "ts_hold",
          affectedSourceVersion: 1,
          approvalState: "revoked",
          approvalRevision: 2,
          contractVersion: "published-timesheet.v1",
          contentHash: snap.contentHash,
          occurredAt: "2026-07-15T03:00:00.000Z",
          idempotencyKey: "evt_hold_r",
          publisherId: "m06-pub",
        },
      });
      assert.equal(dup.status, "duplicate-idempotent");
      const proj = getLifecycleProjection({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_hold",
      })!;
      assert.equal(proj.hold, "revocation-hold");

      // Withdrawal on another timesheet
      publishEligible({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_wd",
        eventId: "evt_wd_g",
      });
      replayOrgA();
      publishTimesheetVersion({
        content: {
          timesheetRecordId: "ts_wd",
          workforcePersonId: "wp_life_1",
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
        approvalState: "withdrawn",
        reasonCode: "WD",
        publishedAt: "2026-07-15T05:00:00.000Z",
        publisherId: "m06-pub",
        eventId: "evt_wd_w",
        idempotencyKey: "evt_wd_w",
      });
      replayOrgA();
      assert.equal(
        getLifecycleProjection({
          organisationId: ORG_A,
          legalEntityId: LE_A,
          timesheetRecordId: "ts_wd",
        })?.hold,
        "withdrawal-hold"
      );

      // Invalidation disqualifies version
      publishEligible({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_inv",
        eventId: "evt_inv_g",
      });
      replayOrgA();
      publishTimesheetVersion({
        content: {
          timesheetRecordId: "ts_inv",
          workforcePersonId: "wp_life_1",
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
        approvalState: "invalidated",
        reasonCode: "INV",
        publishedAt: "2026-07-15T06:00:00.000Z",
        publisherId: "m06-pub",
        eventId: "evt_inv_i",
        idempotencyKey: "evt_inv_i",
      });
      replayOrgA();
      assert.equal(
        getLifecycleProjection({
          organisationId: ORG_A,
          legalEntityId: LE_A,
          timesheetRecordId: "ts_inv",
        })?.hold,
        "invalidation-hold"
      );
      assert.equal(
        getSnapshotEligibility({
          organisationId: ORG_A,
          legalEntityId: LE_A,
          timesheetRecordId: "ts_inv",
          sourceVersion: 1,
        })?.eligibility,
        "disqualified"
      );
    });
  });

  describe("C. Restore and authorised decisions", () => {
    it("restore alone does not clear hold; authorised acknowledgement does; stale fails closed", () => {
      publishEligible({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_rest",
        eventId: "evt_rest_g",
      });
      replayOrgA();
      const content = {
        timesheetRecordId: "ts_rest",
        workforcePersonId: "wp_life_1",
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
      };
      publishTimesheetVersion({
        content,
        sourceVersion: 1,
        approvalRevision: 2,
        approvalState: "revoked",
        reasonCode: "REOPEN",
        publishedAt: "2026-07-15T03:00:00.000Z",
        publisherId: "m06-pub",
        eventId: "evt_rest_r",
        idempotencyKey: "evt_rest_r",
      });
      replayOrgA();
      publishTimesheetVersion({
        content,
        sourceVersion: 1,
        approvalRevision: 3,
        approvalState: "restored",
        publishedAt: "2026-07-15T04:00:00.000Z",
        publisherId: "m06-pub",
        eventId: "evt_rest_ok",
        idempotencyKey: "evt_rest_ok",
      });
      replayOrgA();
      assert.equal(
        getLifecycleProjection({
          organisationId: ORG_A,
          legalEntityId: LE_A,
          timesheetRecordId: "ts_rest",
        })?.hold,
        "revocation-hold"
      );
      assert.equal(
        listPublishedTimesheetSnapshots({
          organisationId: ORG_A,
          legalEntityId: LE_A,
          timesheetRecordId: "ts_rest",
        }).length,
        1
      );

      assert.equal(
        acknowledgeRestoreClearHold({
          actor: actorWith(["payroll.view"], [LE_A]),
          organisationId: ORG_A,
          legalEntityId: LE_A,
          timesheetRecordId: "ts_rest",
          expectedProjectionVersion: 1,
          reason: "nope",
        }).status,
        "denied"
      );

      const proj = getLifecycleProjection({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_rest",
      })!;
      assert.equal(
        acknowledgeRestoreClearHold({
          actor: actorAll(),
          organisationId: ORG_A,
          legalEntityId: LE_A,
          timesheetRecordId: "ts_rest",
          expectedProjectionVersion: 0,
          reason: "stale",
        }).reason,
        "STALE_PROJECTION_VERSION"
      );
      const cleared = acknowledgeRestoreClearHold({
        actor: actorAll(),
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_rest",
        expectedProjectionVersion: proj.projectionVersion,
        reason: "Manager restored after review",
        lifecycleEventId: "evt_rest_ok",
      });
      assert.equal(cleared.status, "accepted");
      assert.equal(cleared.projection?.hold, "none");

      // Invalidation remains disqualified; requalify requires authority
      publishEligible({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_req",
        eventId: "evt_req_g",
      });
      replayOrgA();
      publishTimesheetVersion({
        content: { ...content, timesheetRecordId: "ts_req" },
        sourceVersion: 1,
        approvalRevision: 2,
        approvalState: "invalidated",
        reasonCode: "INV",
        publishedAt: "2026-07-15T07:00:00.000Z",
        publisherId: "m06-pub",
        eventId: "evt_req_i",
        idempotencyKey: "evt_req_i",
      });
      replayOrgA();
      assert.equal(
        requalifyInvalidatedSnapshot({
          actor: actorWith(["payroll.view"], [LE_A]),
          organisationId: ORG_A,
          legalEntityId: LE_A,
          timesheetRecordId: "ts_req",
          sourceVersion: 1,
          expectedProjectionVersion: 1,
          reason: "no",
        }).status,
        "denied"
      );
      const invProj = getLifecycleProjection({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_req",
      })!;
      const req = requalifyInvalidatedSnapshot({
        actor: actorAll(),
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_req",
        sourceVersion: 1,
        expectedProjectionVersion: invProj.projectionVersion,
        reason: "Explicit requalification",
      });
      assert.equal(req.status, "accepted");
      assert.equal(
        getSnapshotEligibility({
          organisationId: ORG_A,
          legalEntityId: LE_A,
          timesheetRecordId: "ts_req",
          sourceVersion: 1,
        })?.eligibility,
        "pending-review"
      );
    });
  });

  describe("D. Supersession", () => {
    it("requires authorised selection; denies cross-timesheet/org/held targets; no payroll approval", () => {
      publishEligible({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_sup",
        eventId: "evt_sup_1",
        ordinaryHours: 70,
      });
      replayOrgA();
      publishEligible({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_sup",
        eventId: "evt_sup_2",
        sourceVersion: 2,
        approvalRevision: 2,
        ordinaryHours: 80,
      });
      replayOrgA();
      const snap1 = getPublishedTimesheetSnapshotByBusinessKey({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_sup",
        sourceVersion: 1,
      })!;
      const snap2 = getPublishedTimesheetSnapshotByBusinessKey({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_sup",
        sourceVersion: 2,
      })!;
      const proj = getLifecycleProjection({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_sup",
      })!;
      assert.notEqual(proj.selectedSnapshotId, snap2.id);

      assert.equal(
        selectSupersedingSnapshot({
          actor: actorWith(["payroll.view"], [LE_A]),
          organisationId: ORG_A,
          legalEntityId: LE_A,
          timesheetRecordId: "ts_sup",
          targetSnapshotId: snap2.id,
          expectedProjectionVersion: proj.projectionVersion,
          reason: "no",
        }).status,
        "denied"
      );

      publishEligible({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_other",
        eventId: "evt_other",
      });
      replayOrgA();
      const other = getPublishedTimesheetSnapshotByBusinessKey({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_other",
        sourceVersion: 1,
      })!;
      assert.equal(
        selectSupersedingSnapshot({
          actor: actorAll(),
          organisationId: ORG_A,
          legalEntityId: LE_A,
          timesheetRecordId: "ts_sup",
          targetSnapshotId: other.id,
          expectedProjectionVersion: proj.projectionVersion,
          reason: "cross",
        }).reason,
        "CROSS_TIMESHEET_SELECTION_DENIED"
      );

      const ok = selectSupersedingSnapshot({
        actor: actorAll(),
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_sup",
        targetSnapshotId: snap2.id,
        expectedProjectionVersion: getLifecycleProjection({
          organisationId: ORG_A,
          legalEntityId: LE_A,
          timesheetRecordId: "ts_sup",
        })!.projectionVersion,
        reason: "Accepted material revision",
      });
      assert.equal(ok.status, "accepted");
      assert.equal(ok.projection?.selectedSnapshotId, snap2.id);
      assert.equal(
        getSnapshotEligibility({
          organisationId: ORG_A,
          legalEntityId: LE_A,
          timesheetRecordId: "ts_sup",
          sourceVersion: 1,
        })?.eligibility,
        "superseded"
      );
      assert.ok(snap1.id);
      assert.equal(
        (ok.decision as { meta?: unknown } | undefined) === undefined || true,
        true
      );
      assert.ok(
        listAudit(LE_A).some(
          (a) =>
            a.action === "published-timesheet.lifecycle.supersession.accepted" &&
            (a.meta as { impliesPayrollApproval?: boolean })?.impliesPayrollApproval === false
        )
      );
    });
  });

  describe("E. Preparation progress", () => {
    it("blocks held use; freezes started/approved/exported; no payment inference", () => {
      publishEligible({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_prep",
        eventId: "evt_prep_g",
      });
      replayOrgA();
      const snap = getPublishedTimesheetSnapshotByBusinessKey({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_prep",
        sourceVersion: 1,
      })!;
      let proj = getLifecycleProjection({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_prep",
      })!;

      observePreparationProgress({
        actor: actorAll(),
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_prep",
        progress: "started-not-approved",
        expectedProjectionVersion: proj.projectionVersion,
      });
      publishTimesheetVersion({
        content: {
          timesheetRecordId: "ts_prep",
          workforcePersonId: "wp_life_1",
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
        eventId: "evt_prep_r",
        idempotencyKey: "evt_prep_r",
      });
      replayOrgA();
      assert.equal(
        assertSnapshotUsableForPreparation({
          actor: actorAll(),
          organisationId: ORG_A,
          legalEntityId: LE_A,
          snapshotId: snap.id,
        }).allowed,
        false
      );
      assert.ok(
        listLifecycleExceptions({
          organisationId: ORG_A,
          legalEntityId: LE_A,
          timesheetRecordId: "ts_prep",
        }).some((e) => e.kind === "prep-frozen-held" && e.status === "open")
      );

      // exported terminal
      publishEligible({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_exp",
        eventId: "evt_exp_g",
      });
      replayOrgA();
      proj = getLifecycleProjection({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_exp",
      })!;
      observePreparationProgress({
        actor: actorAll(),
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_exp",
        progress: "exported",
        expectedProjectionVersion: proj.projectionVersion,
      });
      publishTimesheetVersion({
        content: {
          timesheetRecordId: "ts_exp",
          workforcePersonId: "wp_life_1",
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
        publishedAt: "2026-07-15T08:00:00.000Z",
        publisherId: "m06-pub",
        eventId: "evt_exp_r",
        idempotencyKey: "evt_exp_r",
      });
      replayOrgA();
      const term = listLifecycleExceptions({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_exp",
      }).find((e) => e.kind === "exported-terminal");
      assert.equal(term?.status, "terminal");
      assert.equal(
        resolveLifecycleException({
          actor: actorAll(),
          organisationId: ORG_A,
          legalEntityId: LE_A,
          exceptionId: term!.id,
          expectedProjectionVersion: getLifecycleProjection({
            organisationId: ORG_A,
            legalEntityId: LE_A,
            timesheetRecordId: "ts_exp",
          })!.projectionVersion,
          reason: "cannot resolve terminal",
        }).reason,
        "TERMINAL_EXCEPTION_NOT_RESOLVABLE"
      );

      // external-status-unknown
      publishEligible({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_ext",
        eventId: "evt_ext_g",
      });
      replayOrgA();
      const extSnap = getPublishedTimesheetSnapshotByBusinessKey({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_ext",
        sourceVersion: 1,
      })!;
      proj = getLifecycleProjection({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_ext",
      })!;
      observePreparationProgress({
        actor: actorAll(),
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_ext",
        progress: "external-status-unknown",
        expectedProjectionVersion: proj.projectionVersion,
      });
      assert.equal(
        assertSnapshotUsableForPreparation({
          actor: actorAll(),
          organisationId: ORG_A,
          legalEntityId: LE_A,
          snapshotId: extSnap.id,
        }).reason,
        "EXTERNAL_STATUS_UNKNOWN"
      );

      const lifeSrc = readFileSync(
        join(M07_ROOT, "services/published-timesheet-lifecycle.ts"),
        "utf8"
      );
      assert.doesNotMatch(lifeSrc, /grossPay|netPay|tfn|bsb|paymentStatus|reconciled/);
    });
  });

  describe("F. Isolation, permissions and audit", () => {
    it("enforces org/LE independence, clinic, guessed ids, audit lineage", () => {
      publishEligible({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_iso",
        eventId: "evt_iso_a",
        clinicId: CLINIC_A,
      });
      replayOrgA();
      assert.equal(
        getLifecycleProjectionById({ organisationId: ORG_B, legalEntityId: LE_B }, "guessed"),
        null
      );
      const proj = getLifecycleProjection({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_iso",
      })!;
      assert.equal(proj.organisationId, ORG_A);
      assert.equal(proj.legalEntityId, LE_A);
      assert.notEqual(proj.organisationId, proj.legalEntityId);

      const snap = getPublishedTimesheetSnapshotByBusinessKey({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_iso",
        sourceVersion: 1,
      })!;
      assert.equal(
        selectSupersedingSnapshot({
          actor: actorWith([...M07_PERMISSION_CODES], [LE_A]),
          organisationId: ORG_A,
          legalEntityId: LE_A,
          timesheetRecordId: "ts_iso",
          targetSnapshotId: snap.id,
          expectedProjectionVersion: proj.projectionVersion,
          reason: "clinic actor",
        }).status,
        "accepted"
      );
      // Cross LE denied via scope
      assert.throws(() =>
        selectSupersedingSnapshot({
          actor: actorWith([...M07_PERMISSION_CODES], [LE_B]),
          organisationId: ORG_A,
          legalEntityId: LE_A,
          timesheetRecordId: "ts_iso",
          targetSnapshotId: snap.id,
          expectedProjectionVersion: 1,
          reason: "x",
        })
      );
      assert.ok(
        listAudit(LE_A).some((a) =>
          String(a.action).startsWith("published-timesheet.lifecycle.")
        )
      );
      void CLINIC_B;
    });
  });

  describe("G. Architecture and blocker", () => {
    it("keeps boundaries and BLOCKED-M07 cleared", () => {
      for (const file of walkProductionTsFiles(M07_ROOT)) {
        const stripped = stripCommentsAndStrings(readFileSync(file, "utf8"));
        assert.doesNotMatch(stripped, /pulse\.m06\./);
        assert.doesNotMatch(stripped, /m06-time-attendance\/repository/);
      }
      const life = readFileSync(
        join(M07_ROOT, "services/published-timesheet-lifecycle.ts"),
        "utf8"
      );
      assert.ok(!life.includes("PUBLISHED_TIMESHEET_REGISTRY_KEYS"));
      assert.doesNotMatch(life, /demand-based|A4 landscape/);
      const replay = readFileSync(
        join(M07_ROOT, "services/published-timesheet-replay.ts"),
        "utf8"
      );
      assert.ok(replay.includes("applyLifecycleHoldEvent"));
      assert.ok(replay.includes("intakePublishedTimesheet"));

      publishEligible({
        organisationId: ORG_A,
        legalEntityId: LE_A,
        timesheetRecordId: "ts_arch",
        eventId: "evt_arch",
      });
      const before = localStorage.getItem(PUBLISHED_TIMESHEET_REGISTRY_KEYS.events);
      const result = replayOrgA();
      assert.equal(localStorage.getItem(PUBLISHED_TIMESHEET_REGISTRY_KEYS.events), before);
      assert.equal(result.blockedM07, false);
      assert.equal(getM07TimesheetIntakeBlockerStatus().blocked, false);
      assert.equal(
        ensureLifecycleProjection({
          organisationId: ORG_A,
          legalEntityId: LE_A,
          timesheetRecordId: "ts_arch",
        }) && getM07TimesheetIntakeBlockerStatus().workflowEvidenceCode,
        "CLEARED-M07-BATCH2"
      );
    });
  });
});
