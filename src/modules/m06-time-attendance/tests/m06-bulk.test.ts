import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { clockIn, clockOut } from "../services/clock-service";
import { generateTimesheet, submitTimesheet } from "../services/timesheet-service";
import { listApprovals } from "../repository/local-store";
import { previewBulkApprove, submitBulkApprove } from "../services/bulk-operation-service";
import { actorAll, actorWorker, CLINIC, resetM06TestEnv } from "./_helpers";

describe("m06 bulk", () => {
  beforeEach(() => resetM06TestEnv());

  it("bulk preview and partial success", () => {
    const worker = actorWorker();
    const manager = actorAll();
    const { session } = clockIn({
      actor: worker,
      clinicId: CLINIC,
      localCivil: "2026-07-28T09:00",
      unrostered: true,
      clientEventId: "bulk-in",
    });
    clockOut({
      actor: worker,
      sessionId: session.id,
      localCivil: "2026-07-28T17:00",
      expectedVersion: session.version,
    });
    let ts = generateTimesheet({
      actor: worker,
      personId: worker.personId!,
      clinicId: CLINIC,
      periodStart: "2026-07-20",
      periodEnd: "2026-07-30",
    });
    ts = submitTimesheet({ actor: worker, timesheetId: ts.id, expectedVersion: ts.version });
    const ids = listApprovals(CLINIC).filter((a) => a.state === "pending").map((a) => a.id);
    const preview = previewBulkApprove({ actor: manager, approvalIds: [...ids, "nope"] });
    assert.ok(preview.ineligible.length >= 1);
    const result = submitBulkApprove({ actor: manager, approvalIds: [...ids, "nope"] });
    assert.ok(result.results.some((r) => r.ok));
    assert.ok(result.results.some((r) => !r.ok));
  });
});
