/**
 * OD-A2 — PublishFromOutboxResult discriminant narrowing regression.
 *
 * Proves success/failure variants preserve code/message, retry/exhaustion,
 * and that rejected results are never treated as success (and vice versa).
 */

import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { readJsonSafe, writeJsonSafe } from "@/platform/storage/storage";
import { calculatePayrollContentHash } from "@/platform/workforce/contracts/published-timesheet-hash";
import {
  getCurrentPublishedTimesheet,
  getPublishedTimesheetVersion,
} from "@/platform/workforce/services/published-timesheet-registry";

import { actorAll, CLINIC, CLINIC_B, resetM06TestEnv } from "./_helpers";
import { clockIn, clockOut } from "../services/clock-service";
import {
  approveTimesheet,
  generateTimesheet,
  submitTimesheet,
} from "../services/timesheet-service";
import {
  DEFAULT_PUBLICATION_MAX_ATTEMPTS,
  enqueueAndAttemptPlatformPublication,
  listPublicationOutbox,
  processPublicationOutboxItem,
  retryPublicationOutboxItem,
} from "../services/published-timesheet-outbox";
import { publishOutboxItemToPlatform } from "../adapters/m06-published-timesheet-publisher";
import { getTimesheet, upsertTimesheet } from "../repository/local-store";
import { M06_STORAGE_KEYS } from "../storage/keys";
import { runM06SchemaV3Migration } from "../storage/migrate-v3";

const ORG = "org_m06_alpha";
const LE = "le_m06_payroll_1";

function seedClosedSession(actorId: string) {
  const actor = actorAll(actorId);
  const { session } = clockIn({
    actor,
    clinicId: CLINIC,
    localCivil: "2026-07-28T09:00",
    unrostered: true,
    clientEventId: `${actorId}-in`,
  });
  clockOut({
    actor,
    sessionId: session.id,
    localCivil: "2026-07-28T17:00",
    expectedVersion: session.version,
  });
  return actor;
}

function approveScopedTimesheet(actorId: string) {
  const actor = seedClosedSession(actorId);
  let ts = generateTimesheet({
    actor,
    personId: actor.personId!,
    clinicId: CLINIC,
    periodStart: "2026-07-20",
    periodEnd: "2026-07-30",
    organisationId: ORG,
    legalEntityId: LE,
  });
  ts = submitTimesheet({ actor, timesheetId: ts.id, expectedVersion: ts.version });
  ts = approveTimesheet({ actor, timesheetId: ts.id, expectedVersion: ts.version });
  return { actor, ts };
}

describe("OD-A2 PublishFromOutboxResult narrowing", () => {
  beforeEach(() => {
    resetM06TestEnv();
    runM06SchemaV3Migration();
  });

  it("success: published path acknowledges and does not write lastError", () => {
    const { ts } = approveScopedTimesheet("oda2-ok");
    assert.ok(ts.platformPublicationAck);
    const item = listPublicationOutbox({ timesheetId: ts.id })[0];
    assert.equal(item.status, "published");
    assert.equal(item.lastError, undefined);
    const current = getCurrentPublishedTimesheet({ organisationId: ORG, legalEntityId: LE }, ts.id);
    assert.equal(current?.currentSourceVersion, 1);
    const version = getPublishedTimesheetVersion({ organisationId: ORG, legalEntityId: LE }, ts.id, 1)!;
    assert.equal(version.contentHash, calculatePayrollContentHash(version));
  });

  it("success: re-process of published item stays idempotent (not failed)", () => {
    const { ts } = approveScopedTimesheet("oda2-idem");
    const item = listPublicationOutbox({ timesheetId: ts.id })[0];
    const again = processPublicationOutboxItem(item.id);
    assert.equal(again.outcome, "idempotent");
    assert.equal(again.item.status, "published");
    assert.notEqual(again.outcome, "failed");
    assert.equal(again.item.lastError, undefined);
  });

  it("rejected: eligibility failure preserves exact code and message in lastError", () => {
    const actor = seedClosedSession("oda2-miss-le");
    let ts = generateTimesheet({
      actor,
      personId: actor.personId!,
      clinicId: CLINIC,
      periodStart: "2026-07-20",
      periodEnd: "2026-07-30",
      organisationId: ORG,
      // legalEntityId omitted → rejected publication
    });
    ts = submitTimesheet({ actor, timesheetId: ts.id, expectedVersion: ts.version });
    ts = approveTimesheet({ actor, timesheetId: ts.id, expectedVersion: ts.version });
    assert.equal(ts.state, "approved");
    assert.equal(ts.platformPublicationAck, undefined);

    const item = listPublicationOutbox({ timesheetId: ts.id })[0];
    assert.equal(item.status, "failed");
    assert.match(item.lastError ?? "", /^[A-Z0-9_]+: .+/);
    assert.match(item.lastError ?? "", /MISSING_LEGAL_ENTITY|legalEntityId/);

    const direct = publishOutboxItemToPlatform(item);
    assert.equal(direct.status, "rejected");
    if (direct.status === "rejected") {
      assert.ok(direct.code.length > 0);
      assert.ok(direct.message.length > 0);
      assert.equal(item.lastError, `${direct.code}: ${direct.message}`);
    }
  });

  it("rejected: clinic membership failure preserves CLINIC_MEMBERSHIP code/message", () => {
    const actor = seedClosedSession("oda2-clinic");
    let ts = generateTimesheet({
      actor,
      personId: actor.personId!,
      clinicId: CLINIC,
      periodStart: "2026-07-20",
      periodEnd: "2026-07-30",
      organisationId: ORG,
      legalEntityId: LE,
    });
    ts = submitTimesheet({ actor, timesheetId: ts.id, expectedVersion: ts.version });
    ts = { ...ts, state: "approved", version: ts.version + 1 };
    upsertTimesheet(ts);

    const result = enqueueAndAttemptPlatformPublication({
      timesheet: ts,
      intent: "granted",
      publisherId: actor.userId,
      clinicMembershipCheck: ({ clinicId }) => clinicId === CLINIC_B,
    });
    assert.equal(result.processResult.outcome, "failed");
    assert.notEqual(result.processResult.outcome, "published");
    assert.match(result.outboxItem.lastError ?? "", /CLINIC_MEMBERSHIP/);
    assert.equal(result.outboxItem.attemptCount, 1);

    const direct = publishOutboxItemToPlatform(result.outboxItem, {
      clinicMembershipCheck: ({ clinicId }) => clinicId === CLINIC_B,
    });
    assert.equal(direct.status, "rejected");
    if (direct.status === "rejected") {
      assert.match(direct.code, /CLINIC_MEMBERSHIP/);
      assert.ok(direct.message.length > 0);
      assert.equal(result.outboxItem.lastError, `${direct.code}: ${direct.message}`);
    }
  });

  it("retryable failure: attemptCount increments; identity preserved on retry after fixable state", () => {
    const actor = seedClosedSession("oda2-retry");
    let ts = generateTimesheet({
      actor,
      personId: actor.personId!,
      clinicId: CLINIC,
      periodStart: "2026-07-20",
      periodEnd: "2026-07-30",
      organisationId: ORG,
      // missing LE → fail
    });
    ts = submitTimesheet({ actor, timesheetId: ts.id, expectedVersion: ts.version });
    ts = approveTimesheet({ actor, timesheetId: ts.id, expectedVersion: ts.version });
    const failed = listPublicationOutbox({ timesheetId: ts.id })[0];
    assert.equal(failed.status, "failed");
    assert.equal(failed.attemptCount, 1);
    const eventId = failed.eventId;
    const seq = failed.eventSequence;

    // Repair LE on timesheet + outbox row (same identity); contentSnapshot has no LE field.
    upsertTimesheet({
      ...getTimesheet(ts.id)!,
      legalEntityId: LE,
      updatedAt: new Date().toISOString(),
    });
    const raw = readJsonSafe(M06_STORAGE_KEYS.publishedTimesheetOutbox, [] as typeof failed[]);
    const idx = raw.findIndex((i) => i.id === failed.id);
    raw[idx] = { ...raw[idx], legalEntityId: LE, status: "pending" };
    writeJsonSafe(M06_STORAGE_KEYS.publishedTimesheetOutbox, raw);

    const retried = retryPublicationOutboxItem(failed.id);
    assert.ok(retried.outcome === "published" || retried.outcome === "idempotent");
    assert.notEqual(retried.outcome, "failed");
    assert.equal(retried.item.eventId, eventId);
    assert.equal(retried.item.eventSequence, seq);
    assert.ok(retried.item.attemptCount >= 2);
    assert.ok(getTimesheet(ts.id)!.platformPublicationAck);
  });

  it("terminal: exhausted attempts skip without treating as success", () => {
    const actor = seedClosedSession("oda2-exh");
    let ts = generateTimesheet({
      actor,
      personId: actor.personId!,
      clinicId: CLINIC,
      periodStart: "2026-07-20",
      periodEnd: "2026-07-30",
      organisationId: ORG,
    });
    ts = submitTimesheet({ actor, timesheetId: ts.id, expectedVersion: ts.version });
    ts = approveTimesheet({ actor, timesheetId: ts.id, expectedVersion: ts.version });
    const failed = listPublicationOutbox({ timesheetId: ts.id })[0];
    assert.equal(failed.status, "failed");

    const raw = readJsonSafe(M06_STORAGE_KEYS.publishedTimesheetOutbox, [] as typeof failed[]);
    const idx = raw.findIndex((i) => i.id === failed.id);
    const priorError = raw[idx].lastError;
    raw[idx] = {
      ...raw[idx],
      status: "failed",
      attemptCount: DEFAULT_PUBLICATION_MAX_ATTEMPTS,
      maxAttempts: DEFAULT_PUBLICATION_MAX_ATTEMPTS,
    };
    writeJsonSafe(M06_STORAGE_KEYS.publishedTimesheetOutbox, raw);

    const skipped = processPublicationOutboxItem(failed.id);
    assert.equal(skipped.outcome, "skipped_exhausted");
    assert.notEqual(skipped.outcome, "published");
    assert.notEqual(skipped.outcome, "idempotent");
    assert.equal(skipped.item.attemptCount, DEFAULT_PUBLICATION_MAX_ATTEMPTS);
    assert.equal(skipped.item.lastError, priorError);
    assert.equal(getTimesheet(ts.id)!.platformPublicationAck, undefined);
  });

  it("publisher union: rejected arm has code/message; success arms do not", () => {
    const { ts } = approveScopedTimesheet("oda2-union");
    const okItem = listPublicationOutbox({ timesheetId: ts.id })[0];
    const ok = publishOutboxItemToPlatform(okItem);
    assert.ok(ok.status === "published" || ok.status === "idempotent");
    if (ok.status === "published" || ok.status === "idempotent") {
      assert.ok(ok.result);
      assert.ok(ok.contentHash.length > 0);
      assert.equal("code" in ok, false);
      assert.equal("message" in ok, false);
    }

    const actor = seedClosedSession("oda2-union-rej");
    let bad = generateTimesheet({
      actor,
      personId: actor.personId!,
      clinicId: CLINIC,
      periodStart: "2026-07-20",
      periodEnd: "2026-07-30",
      organisationId: ORG,
    });
    bad = submitTimesheet({ actor, timesheetId: bad.id, expectedVersion: bad.version });
    bad = approveTimesheet({ actor, timesheetId: bad.id, expectedVersion: bad.version });
    const badItem = listPublicationOutbox({ timesheetId: bad.id })[0];
    const rejected = publishOutboxItemToPlatform(badItem);
    assert.equal(rejected.status, "rejected");
    if (rejected.status === "rejected") {
      assert.equal("result" in rejected, false);
      assert.equal(typeof rejected.code, "string");
      assert.equal(typeof rejected.message, "string");
    }
  });

  it("source still uses rejected discriminant for failure path (no published||idempotent else-access)", () => {
    const src = readFileSync(
      join(process.cwd(), "src/modules/m06-time-attendance/services/published-timesheet-outbox.ts"),
      "utf8"
    );
    assert.match(src, /result\.status === ["']rejected["']/);
    assert.match(src, /result\.code/);
    assert.match(src, /result\.message/);
    // Failure branch must not rely on complementary OR narrowing alone.
    const processFn = src.slice(src.indexOf("export function processPublicationOutboxItem"));
    const body = processFn.slice(0, processFn.indexOf("export function processPublicationOutbox"));
    assert.equal(/\nif \(result\.status === "published" \|\| result\.status === "idempotent"\)/.test(body), false);
  });
});
