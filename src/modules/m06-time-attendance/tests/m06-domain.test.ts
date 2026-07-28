import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { clockIn, clockOut } from "../services/clock-service";
import { startBreak, endBreak, recordMissedBreak } from "../services/break-service";
import { cancelSession } from "../services/session-service";
import {
  ConcurrentConflictError,
  InvalidLifecycleTransitionError,
  OverrideReasonRequiredError,
} from "../services/errors";
import { actorAll, CLINIC, resetM06TestEnv } from "./_helpers";
import { getSession } from "../repository/local-store";

describe("m06 domain / lifecycle", () => {
  beforeEach(() => resetM06TestEnv());

  it("session open → on_break → open → closed", () => {
    const actor = actorAll();
    const { session } = clockIn({
      actor,
      clinicId: CLINIC,
      localCivil: "2026-07-28T09:00",
      unrostered: true,
      clientEventId: "dom-1",
    });
    const brk = startBreak({
      actor,
      sessionId: session.id,
      localCivil: "2026-07-28T12:00",
      expectedSessionVersion: session.version,
    });
    assert.equal(getSession(session.id)?.state, "on_break");
    endBreak({
      actor,
      breakId: brk.id,
      localCivil: "2026-07-28T12:30",
      expectedVersion: brk.version,
    });
    const open = getSession(session.id)!;
    clockOut({
      actor,
      sessionId: open.id,
      localCivil: "2026-07-28T17:00",
      expectedVersion: open.version,
    });
    assert.equal(getSession(session.id)?.state, "closed");
  });

  it("concurrent conflict on stale version", () => {
    const actor = actorAll();
    const { session } = clockIn({
      actor,
      clinicId: CLINIC,
      localCivil: "2026-07-28T09:00",
      unrostered: true,
      clientEventId: "dom-2",
    });
    assert.throws(
      () =>
        clockOut({
          actor,
          sessionId: session.id,
          localCivil: "2026-07-28T17:00",
          expectedVersion: session.version + 5,
        }),
      ConcurrentConflictError
    );
  });

  it("invalid transition cancelled is terminal", () => {
    const actor = actorAll();
    const { session } = clockIn({
      actor,
      clinicId: CLINIC,
      localCivil: "2026-07-28T09:00",
      unrostered: true,
      clientEventId: "dom-3",
    });
    cancelSession({ actor, sessionId: session.id, expectedVersion: session.version, reason: "test cancel" });
    assert.throws(
      () =>
        cancelSession({
          actor,
          sessionId: session.id,
          expectedVersion: session.version + 1,
          reason: "again",
        }),
      InvalidLifecycleTransitionError
    );
  });

  it("override requires reason", () => {
    const actor = actorAll();
    const { session } = clockIn({
      actor,
      clinicId: CLINIC,
      localCivil: "2026-07-28T09:00",
      unrostered: true,
      clientEventId: "dom-4",
    });
    assert.throws(
      () => cancelSession({ actor, sessionId: session.id, expectedVersion: session.version, reason: "  " }),
      OverrideReasonRequiredError
    );
  });

  it("missed break records exception path", () => {
    const actor = actorAll();
    const { session } = clockIn({
      actor,
      clinicId: CLINIC,
      localCivil: "2026-07-28T09:00",
      unrostered: true,
      clientEventId: "dom-5",
    });
    const brk = recordMissedBreak({
      sessionId: session.id,
      personId: session.personId,
      clinicId: CLINIC,
      breakReqId: "lunch",
    });
    assert.equal(brk.state, "missed");
  });
});
