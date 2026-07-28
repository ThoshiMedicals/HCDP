import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { clockIn } from "../services/clock-service";
import { exportAttendance } from "../services/reporting-service";
import { listAudit } from "../repository/local-store";
import { actorAll, actorManager, CLINIC, resetM06TestEnv } from "./_helpers";
import { assertM06Permission, M06PermissionError } from "../permissions";

describe("m06 privacy", () => {
  beforeEach(() => resetM06TestEnv());

  it("masks sensitive evidence without attendance.evidence.view", () => {
    const manager = actorManager();
    clockIn({
      actor: manager,
      clinicId: CLINIC,
      localCivil: "2026-07-28T09:00",
      unrostered: true,
      clientEventId: "priv-1",
    });
    const exp = exportAttendance({ actor: manager, clinicId: CLINIC });
    assert.equal(exp.maskedEvidence, true);
    const evidenceRows = exp.rows.filter((r) => r.type === "evidence");
    for (const row of evidenceRows) {
      assert.equal(row.sensitivePayload, "[masked]");
    }
  });

  it("audit view restricted for manager without audit.view", () => {
    const manager = actorManager();
    assert.throws(() => assertM06Permission(manager, "attendance.audit.view"), M06PermissionError);
  });

  it("senior can export unmasked evidence", () => {
    const senior = actorAll();
    clockIn({
      actor: senior,
      clinicId: CLINIC,
      localCivil: "2026-07-28T09:00",
      unrostered: true,
      clientEventId: "priv-2",
    });
    const exp = exportAttendance({ actor: senior, clinicId: CLINIC });
    assert.equal(exp.maskedEvidence, false);
    assert.ok(listAudit().length >= 1);
  });
});
