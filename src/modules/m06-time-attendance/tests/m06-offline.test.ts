import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { enqueueOfflineEvent, syncOfflineQueue, resolveOfflineConflict } from "../services/offline-sync-service";
import { listOfflineQueue, upsertDevice } from "../repository/local-store";
import { actorWorker, CLINIC, resetM06TestEnv } from "./_helpers";

describe("m06 offline", () => {
  beforeEach(() => {
    resetM06TestEnv();
    upsertDevice({
      id: "dev-off",
      clinicId: CLINIC,
      label: "Device",
      revoked: false,
      createdAt: new Date().toISOString(),
    });
  });

  it("idempotent enqueue by clientEventId", () => {
    const actor = actorWorker();
    const a = enqueueOfflineEvent({
      actor,
      deviceId: "dev-off",
      clientEventId: "same",
      clientSequence: 1,
      clinicId: CLINIC,
      payload: { kind: "clock-in", localCivil: "2026-07-28T09:00" },
    });
    const b = enqueueOfflineEvent({
      actor,
      deviceId: "dev-off",
      clientEventId: "same",
      clientSequence: 2,
      clinicId: CLINIC,
      payload: { kind: "clock-in", localCivil: "2026-07-28T09:05" },
    });
    assert.equal(a.id, b.id);
  });

  it("ordered sync applies then conflicts resolve", () => {
    const actor = actorWorker();
    enqueueOfflineEvent({
      actor,
      deviceId: "dev-off",
      clientEventId: "o1",
      clientSequence: 1,
      clinicId: CLINIC,
      payload: { kind: "clock-in", localCivil: "2026-07-28T09:00" },
    });
    enqueueOfflineEvent({
      actor,
      deviceId: "dev-off",
      clientEventId: "o2",
      clientSequence: 2,
      clinicId: CLINIC,
      payload: { kind: "clock-in", localCivil: "2026-07-28T09:30" },
    });
    const sync = syncOfflineQueue({ actor, deviceId: "dev-off" });
    assert.ok(sync.applied.length >= 1);
    const conflicts = listOfflineQueue().filter((o) => o.state === "conflict");
    if (conflicts[0]) {
      const resolved = resolveOfflineConflict({
        actor,
        offlineId: conflicts[0].id,
        resolution: "keep-server",
      });
      assert.equal(resolved.state, "resolved");
    }
  });
});
