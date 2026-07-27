/**
 * Workforce event idempotency tests (Wave 1).
 */

import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";

import { createWorkforceEvent } from "../contracts/workforce-events";
import {
  publishWorkforceEvent,
  resetWorkforceEventBusForTests,
  getWorkforceEventHistory,
  hasProcessedWorkforceEvent,
} from "../services/workforce-event-bus";
import { validateWorkforceEvent } from "../validation/workforce-reference-validation";

const source = {
  sourceModuleId: "staff-doctors",
  sourceRecordType: "credential",
  sourceRecordId: "cred_1",
  sourceRecordTitle: "WWCC",
  route: "/staff-doctors",
  section: "credentials",
};

describe("workforce event idempotency", () => {
  beforeEach(() => {
    resetWorkforceEventBusForTests();
  });

  it("accepts a valid event once", () => {
    const event = createWorkforceEvent({
      eventId: "evt_1",
      eventType: "credential.status.changed",
      sourceVersion: 1,
      occurredAt: "2026-07-27T00:00:00.000Z",
      activeIdentityId: "demo-admin",
      clinicId: "chapel-hill",
      source,
    });
    assert.equal(validateWorkforceEvent(event).ok, true);
    const first = publishWorkforceEvent(event);
    assert.equal(first.accepted, true);
    if (first.accepted) assert.equal(first.duplicate, false);
    assert.equal(getWorkforceEventHistory().length, 1);
    assert.equal(hasProcessedWorkforceEvent("evt_1"), true);
  });

  it("ignores duplicate eventId", () => {
    const event = createWorkforceEvent({
      eventId: "evt_dup",
      eventType: "roster.published",
      sourceVersion: 2,
      occurredAt: "2026-07-27T01:00:00.000Z",
      activeIdentityId: "demo-admin",
      source: {
        ...source,
        sourceModuleId: "roster",
        sourceRecordType: "roster-period",
        sourceRecordId: "period_w30",
        sourceRecordTitle: "Week 30",
        route: "/roster",
        section: "publish",
      },
    });
    const first = publishWorkforceEvent(event);
    const second = publishWorkforceEvent({ ...event, sourceVersion: 3 });
    assert.equal(first.accepted, true);
    assert.equal(second.accepted, true);
    if (second.accepted) assert.equal(second.duplicate, true);
    assert.equal(getWorkforceEventHistory().length, 1);
  });

  it("rejects invalid event", () => {
    const result = publishWorkforceEvent({
      contractVersion: 1,
      eventId: "",
      eventType: "shift.created",
      sourceVersion: 1,
      occurredAt: "2026-07-27T00:00:00.000Z",
      activeIdentityId: "demo-admin",
      source,
    });
    assert.equal(result.accepted, false);
    assert.equal(getWorkforceEventHistory().length, 0);
  });

  it("rejects unknown event type", () => {
    const result = validateWorkforceEvent({
      contractVersion: 1,
      eventId: "evt_x",
      eventType: "not.a.real.event" as never,
      sourceVersion: 1,
      occurredAt: "2026-07-27T00:00:00.000Z",
      activeIdentityId: "demo-admin",
      source,
    });
    assert.equal(result.ok, false);
  });
});
