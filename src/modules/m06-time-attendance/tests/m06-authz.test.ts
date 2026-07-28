import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import {
  M06ClinicScopeError,
  M06PermissionError,
  assertM06ClinicScope,
  assertM06Permission,
  mapDemoIdentityPermissions,
} from "../permissions";
import { clockIn } from "../services/clock-service";
import { exportAttendance } from "../services/reporting-service";
import { listSessionsForActor } from "../services/session-service";
import { actorAll, actorManager, actorWorker, CLINIC, CLINIC_B, resetM06TestEnv } from "./_helpers";

describe("m06 authz", () => {
  beforeEach(() => resetM06TestEnv());

  it("positive: worker can clock self", () => {
    const w = actorWorker();
    const { session } = clockIn({
      actor: w,
      clinicId: CLINIC,
      localCivil: "2026-07-28T09:00",
      unrostered: true,
      clientEventId: "authz-in-1",
    });
    assert.equal(session.state, "open");
  });

  it("negative: worker denied approve permission", () => {
    const w = actorWorker();
    assert.throws(() => assertM06Permission(w, "attendance.approve"), M06PermissionError);
  });

  it("cross-clinic denial", () => {
    const m = actorManager();
    assert.throws(() => assertM06ClinicScope(m, [CLINIC_B]), M06ClinicScopeError);
  });

  it("self vs team boundary", () => {
    const w = actorWorker("worker-a");
    clockIn({
      actor: actorAll("other"),
      clinicId: CLINIC,
      localCivil: "2026-07-28T09:00",
      unrostered: true,
      clientEventId: "other-in",
    });
    const rows = listSessionsForActor(w, CLINIC);
    assert.ok(rows.every((r) => r.personId === "worker-a"));
  });

  it("export bypass prevention requires clinic scope", () => {
    const m = actorManager();
    assert.throws(() => exportAttendance({ actor: m, clinicId: "" }), /clinic/i);
  });

  it("evidence masking without evidence.view", () => {
    const m = actorManager();
    clockIn({
      actor: m,
      clinicId: CLINIC,
      localCivil: "2026-07-28T09:00",
      unrostered: true,
      clientEventId: "ev-mask",
    });
    const exp = exportAttendance({ actor: m, clinicId: CLINIC });
    assert.equal(exp.maskedEvidence, true);
  });

  it("mapDemoIdentityPermissions worker vs full senior", () => {
    const worker = mapDemoIdentityPermissions({
      permissions: [],
      managerControls: false,
      sensitivityClearance: "restricted",
    });
    assert.ok(worker.includes("attendance.clock.self"));
    assert.ok(!worker.includes("attendance.override"));
    const senior = mapDemoIdentityPermissions({
      permissions: [],
      managerControls: true,
      sensitivityClearance: "full",
    });
    assert.ok(senior.includes("attendance.override"));
    assert.ok(senior.includes("attendance.evidence.view"));
  });
});
