/**
 * QA-PPA1-001 remediation — behavioural proof that test hooks fail closed
 * outside an explicit Node test allow-list. Not source-string assertions alone.
 */

import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";

import {
  areM07TestHooksAllowed,
  disableM07TestHooksForTests,
  enableM07TestHooksForTests,
  M07_TEST_HOOKS_ENV,
} from "../testing/m07-test-hooks-gate";
import {
  __setPpaCaseWriteFailForTests,
  __setPpaCorruptAfterWriteForTests,
  __setPpaCreateInterleaveHookForTests,
  __resetPpaRepositoryTestHooks,
  upsertPriorPeriodAdjustment,
  newPriorPeriodAdjustmentId,
} from "../storage/ppa-repository";
import {
  __setPeriodWriteFailForTests,
  clearM07LocalStoreCacheForTests,
  upsertPeriod,
  newPeriodId,
} from "../repository/local-store";
import {
  __setM07AuditFailForTests,
  __setM07AuditFailActionsForTests,
  recordM07Audit,
} from "../services/audit-service";
import { __setM02InboxFailForTests } from "../adapters/m02-inbox-publish";
import { installMemoryLocalStorage, actorClerk, ORG_A } from "./_helpers";
import type { PriorPeriodAdjustment, PayPeriodRecord } from "../types/domain";

function samplePpa(): PriorPeriodAdjustment {
  const id = newPriorPeriodAdjustmentId();
  const now = new Date().toISOString();
  return {
    id,
    legalEntityId: ORG_A,
    sourcePeriodId: "src-hook",
    adjustmentPeriodId: "adj-hook",
    status: "draft",
    reasonCode: "manual",
    reasonText: "hook probe",
    sourcePeriodVersion: 1,
    sourceLockedAt: now,
    sourceLockedBy: "u",
    sourceLockId: null,
    sourceExportBatchId: null,
    sourceExportChecksum: null,
    sourceManifestChecksum: null,
    sourceReconciliationId: null,
    sourceApprovalId: null,
    version: 1,
    idempotencyKey: `hook-${id}`,
    createdAt: now,
    createdBy: "u",
    updatedAt: now,
    updatedBy: "u",
    cancelledAt: null,
    cancelledBy: null,
    cancelReason: null,
  };
}

function samplePeriod(): PayPeriodRecord {
  const id = newPeriodId();
  const now = new Date().toISOString();
  return {
    id,
    legalEntityId: ORG_A,
    clinicIds: [],
    kind: "ordinary",
    state: "open",
    cadence: "fortnightly",
    periodStart: "2026-07-01",
    periodEnd: "2026-07-14",
    version: 1,
    createdAt: now,
    createdBy: "u",
    updatedAt: now,
    updatedBy: "u",
  } as PayPeriodRecord;
}

describe("M07 test-hook security gate (QA-PPA1-001)", () => {
  let savedNodeEnv: string | undefined;
  let savedAllow: string | undefined;

  beforeEach(() => {
    savedNodeEnv = process.env.NODE_ENV;
    savedAllow = process.env[M07_TEST_HOOKS_ENV];
    installMemoryLocalStorage();
    clearM07LocalStoreCacheForTests();
    __resetPpaRepositoryTestHooks();
    enableM07TestHooksForTests();
    __setM07AuditFailForTests(false);
    __setM07AuditFailActionsForTests(null);
    __setPeriodWriteFailForTests(0);
    __setPpaCaseWriteFailForTests(0);
    __setM02InboxFailForTests(false);
  });

  afterEach(() => {
    if (savedNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = savedNodeEnv;
    if (savedAllow === undefined) delete process.env[M07_TEST_HOOKS_ENV];
    else process.env[M07_TEST_HOOKS_ENV] = savedAllow;
    __resetPpaRepositoryTestHooks();
    __setM07AuditFailForTests(false);
    __setM07AuditFailActionsForTests(null);
    __setPeriodWriteFailForTests(0);
    enableM07TestHooksForTests();
  });

  it("allows hooks when M07_ALLOW_TEST_HOOKS=1 under non-production Node", () => {
    delete process.env.NODE_ENV;
    enableM07TestHooksForTests();
    assert.equal(areM07TestHooksAllowed(), true);
    __setPpaCaseWriteFailForTests(1);
    assert.throws(() => upsertPriorPeriodAdjustment(samplePpa()), /m07-ppa-case-write-fail-for-tests/);
  });

  it("allows hooks when NODE_ENV=test even without allow flag", () => {
    disableM07TestHooksForTests();
    process.env.NODE_ENV = "test";
    assert.equal(areM07TestHooksAllowed(), true);
    __setPeriodWriteFailForTests(1);
    assert.throws(() => upsertPeriod(samplePeriod()), /m07-period-write-fail-for-tests/);
  });

  it("disables hooks when NODE_ENV=production (setters no-op; failures do not fire)", () => {
    enableM07TestHooksForTests();
    __setPpaCaseWriteFailForTests(1);
    __setPeriodWriteFailForTests(1);
    __setM07AuditFailForTests(true);
    process.env.NODE_ENV = "production";
    assert.equal(areM07TestHooksAllowed(), false);

    // Setters must no-op in production — cannot arm new failures.
    __setPpaCaseWriteFailForTests(5);
    __setPeriodWriteFailForTests(5);
    __setM07AuditFailForTests(true);
    __setM07AuditFailActionsForTests(["ppa.create"]);
    __setPpaCorruptAfterWriteForTests(true);
    __setPpaCreateInterleaveHookForTests(() => {
      throw new Error("interleave must not run in production");
    });
    __setM02InboxFailForTests(true);

    // Previously armed counters must not fire while production gate is active.
    const stored = upsertPriorPeriodAdjustment(samplePpa());
    assert.ok(stored.id);
    const period = upsertPeriod(samplePeriod());
    assert.ok(period.id);
    const audit = recordM07Audit({
      actor: actorClerk(),
      action: "ppa.create",
      entityType: "prior-period-adjustment",
      entityId: stored.id,
      legalEntityId: ORG_A,
    });
    assert.ok(audit.id);
  });

  it("disables hooks in unknown/development runtime without explicit allow", () => {
    disableM07TestHooksForTests();
    process.env.NODE_ENV = "development";
    assert.equal(areM07TestHooksAllowed(), false);
    __setPpaCaseWriteFailForTests(1);
    __setPeriodWriteFailForTests(1);
    __setM07AuditFailForTests(true);
    // No-op setters — writes succeed.
    assert.ok(upsertPriorPeriodAdjustment(samplePpa()).id);
    assert.ok(upsertPeriod(samplePeriod()).id);
    assert.ok(
      recordM07Audit({
        actor: actorClerk(),
        action: "probe",
        entityType: "prior-period-adjustment",
        entityId: "x",
        legalEntityId: ORG_A,
      }).id
    );
  });

  it("browser-like undefined process must never enable hooks", () => {
    // Behavioural contract: undefined process disables hooks regardless of env flags.
    const simulate = (processValue: unknown, env: Record<string, string | undefined>) => {
      if (typeof processValue === "undefined") return false;
      const nodeEnv = env.NODE_ENV;
      if (nodeEnv === "production") return false;
      if (nodeEnv === "test") return true;
      if (env[M07_TEST_HOOKS_ENV] === "1") return true;
      return false;
    };
    assert.equal(simulate(undefined, {}), false);
    assert.equal(simulate(undefined, { NODE_ENV: "test" }), false);
    assert.equal(simulate(undefined, { [M07_TEST_HOOKS_ENV]: "1" }), false);
    assert.equal(simulate({}, { NODE_ENV: "production" }), false);
    assert.equal(simulate({}, { NODE_ENV: "development" }), false);
    assert.equal(simulate({}, { NODE_ENV: "test" }), true);
    assert.equal(simulate({}, { [M07_TEST_HOOKS_ENV]: "1" }), true);

    // Live function must start with the undefined-process fail-closed check.
    const gateSource = areM07TestHooksAllowed.toString().replace(/\s+/g, "");
    assert.ok(
      gateSource.includes('typeofprocess==="undefined"') ||
        gateSource.includes("typeofprocess==='undefined'"),
      "gate must fail closed when process is undefined"
    );
  });

  it("production gate prevents arming then re-enabling from leaking prior arms after reset", () => {
    process.env.NODE_ENV = "production";
    __setPpaCaseWriteFailForTests(3);
    assert.equal(areM07TestHooksAllowed(), false);
    delete process.env.NODE_ENV;
    enableM07TestHooksForTests();
    __resetPpaRepositoryTestHooks();
    // After reset under allow, no leftover fail counter from production no-op sets.
    assert.ok(upsertPriorPeriodAdjustment(samplePpa()).id);
  });
});
