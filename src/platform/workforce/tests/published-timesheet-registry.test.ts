/**
 * Checkpoint 2.1 — published timesheet contract, hash, registry tests.
 */

import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";

import {
  PUBLISHED_TIMESHEET_CONTRACT_VERSION,
  type PublishedTimesheetPayrollContent,
  type PublishTimesheetInput,
} from "../contracts/published-timesheet-contract";
import {
  CanonicalizationError,
  calculatePayrollContentHash,
  canonicalPayrollJson,
  verifyOrCalculatePayrollContentHash,
} from "../contracts/published-timesheet-hash";
import { createTimesheetApprovalLifecycleEvent } from "../contracts/timesheet-approval-events";
import {
  validatePublishTimesheetInput,
  validatePublishedTimesheetContractVersion,
  validatePublishedTimesheetPayrollContent,
  validateTimesheetApprovalLifecycleEvent,
  PROHIBITED_PUBLISHED_TIMESHEET_FIELDS,
} from "../validation/published-timesheet-validation";
import {
  PUBLISHED_TIMESHEET_REGISTRY_KEYS,
  PUBLISHED_TIMESHEET_REGISTRY_MIGRATION_ID,
  PublishedTimesheetRegistryError,
  getCurrentPublishedTimesheet,
  getPublicationLineage,
  getPublishedTimesheetByRegistryId,
  getPublishedTimesheetVersion,
  listPublishedTimesheetVersions,
  publishTimesheetVersion,
  publishedIntakeIdentity,
  rebuildCurrentIndexFromHistory,
  replayPublishedTimesheetEvents,
  runPublishedTimesheetRegistryMigration,
} from "../services/published-timesheet-registry";
import {
  clearMigrationFlag,
  hasMigration,
  readJsonSafe,
  writeJsonSafe,
} from "@/platform/storage/storage";

function installMemoryLocalStorage() {
  const store = new Map<string, string>();
  const localStorage = {
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
    removeItem(key: string) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
  (globalThis as { window?: { localStorage: typeof localStorage } }).window = { localStorage };
  return store;
}

function sampleContent(
  overrides: Partial<PublishedTimesheetPayrollContent> = {}
): PublishedTimesheetPayrollContent {
  return {
    timesheetRecordId: "ts_001",
    workforcePersonId: "wp_001",
    organisationId: "org_alpha",
    legalEntityId: "le_payroll_1",
    clinicId: "clinic_north",
    periodStart: "2026-07-01",
    periodEnd: "2026-07-14",
    attendanceSessionIds: ["sess_b", "sess_a"],
    ordinaryHourInputs: [{ code: "ORD", hours: 76 }],
    overtimeHourInputs: [{ code: "OT15", hours: 2 }],
    penaltyHourInputs: [],
    leaveInputs: [],
    allowanceInputs: [{ allowanceCode: "MEAL", quantity: 1 }],
    ...overrides,
  };
}

function samplePublish(
  overrides: Partial<PublishTimesheetInput> & {
    content?: Partial<PublishedTimesheetPayrollContent>;
  } = {}
): PublishTimesheetInput {
  const { content: contentOverrides, ...rest } = overrides;
  return {
    content: sampleContent(contentOverrides),
    sourceVersion: 1,
    approvalRevision: 1,
    approvalState: "approved",
    publishedAt: "2026-07-15T02:00:00.000Z",
    publisherId: "actor_pub_1",
    eventId: "evt_1",
    idempotencyKey: "idem_1",
    ...rest,
  };
}

describe("CP2.1 published timesheet contract validation", () => {
  it("requires record identity, org/LE separation fields, versions, and event identity", () => {
    const bad = validatePublishTimesheetInput({
      content: {
        timesheetRecordId: "",
        workforcePersonId: "",
        organisationId: "",
        legalEntityId: "",
        periodStart: "",
        periodEnd: "",
        attendanceSessionIds: [],
        ordinaryHourInputs: [],
        overtimeHourInputs: [],
        penaltyHourInputs: [],
        leaveInputs: [],
        allowanceInputs: [],
      },
      sourceVersion: 0,
      approvalRevision: -1,
      approvalState: "approved",
      publishedAt: "",
      publisherId: "",
      eventId: "",
      idempotencyKey: "",
    });
    assert.equal(bad.ok, false);
    if (!bad.ok) {
      const fields = bad.issues.map((i) => i.field);
      assert.ok(fields.includes("timesheetRecordId"));
      assert.ok(fields.includes("organisationId"));
      assert.ok(fields.includes("legalEntityId"));
      assert.ok(fields.includes("sourceVersion"));
      assert.ok(fields.includes("approvalRevision"));
      assert.ok(fields.includes("eventId"));
      assert.ok(fields.includes("idempotencyKey"));
    }
  });

  it("accepts supported contract version and rejects unsupported/unknown", () => {
    assert.equal(
      validatePublishedTimesheetContractVersion(PUBLISHED_TIMESHEET_CONTRACT_VERSION).ok,
      true
    );
    assert.equal(validatePublishedTimesheetContractVersion("published-timesheet.v0").ok, false);
    assert.equal(validatePublishedTimesheetContractVersion("published-timesheet.v99").ok, false);
    assert.equal(validatePublishedTimesheetContractVersion("workforce-contract-v1").ok, false);
  });

  it("rejects prohibited banking/TFN/super fields", () => {
    const withTfn = validatePublishedTimesheetPayrollContent({
      ...sampleContent(),
      // @ts-expect-error intentional prohibited field
      tfn: "123456789",
    } as PublishedTimesheetPayrollContent);
    assert.equal(withTfn.ok, false);
    assert.ok(PROHIBITED_PUBLISHED_TIMESHEET_FIELDS.includes("tfn"));
  });

  it("validates clinic membership when checker provided", () => {
    const ok = validatePublishedTimesheetPayrollContent(sampleContent(), {
      clinicMembershipCheck: () => true,
    });
    assert.equal(ok.ok, true);
    const bad = validatePublishedTimesheetPayrollContent(sampleContent(), {
      clinicMembershipCheck: () => false,
    });
    assert.equal(bad.ok, false);
  });

  it("requires reasonCode for revoke/withdraw/invalidate lifecycle events", () => {
    const evt = createTimesheetApprovalLifecycleEvent({
      eventType: "timesheet.approval.revoked",
      eventId: "e1",
      idempotencyKey: "e1",
      eventSequence: 1,
      timesheetRecordId: "ts_001",
      affectedSourceVersion: 1,
      approvalRevision: 2,
      organisationId: "org_alpha",
      legalEntityId: "le_payroll_1",
      occurredAt: "2026-07-15T03:00:00.000Z",
      publisherId: "actor",
      approvalState: "revoked",
    });
    assert.equal(validateTimesheetApprovalLifecycleEvent(evt).ok, false);
  });
});

describe("CP2.1 canonical hashing", () => {
  it("produces identical hashes for logically equivalent payloads", () => {
    const a = sampleContent({
      attendanceSessionIds: ["sess_b", "sess_a"],
    });
    const b = sampleContent({
      attendanceSessionIds: ["sess_a", "sess_b"],
    });
    assert.equal(calculatePayrollContentHash(a), calculatePayrollContentHash(b));
  });

  it("changes hash on material source change", () => {
    const a = calculatePayrollContentHash(sampleContent());
    const b = calculatePayrollContentHash(
      sampleContent({ ordinaryHourInputs: [{ code: "ORD", hours: 80 }] })
    );
    assert.notEqual(a, b);
  });

  it("does not include approval lifecycle metadata in hash boundary", () => {
    const content = sampleContent();
    const hash = calculatePayrollContentHash(content);
    const json = canonicalPayrollJson(content);
    assert.ok(!json.includes("approvalState"));
    assert.ok(!json.includes("approvalRevision"));
    assert.ok(!json.includes("publishedAt"));
    assert.ok(!json.includes("idempotencyKey"));
    assert.ok(!json.includes("registryPublicationId"));
    assert.equal(typeof hash, "string");
    assert.match(hash, /^[a-f0-9]{64}$/);
  });

  it("preserves business order for hour inputs but sorts set-like session ids", () => {
    const ordered = sampleContent({
      ordinaryHourInputs: [
        { code: "A", hours: 1 },
        { code: "B", hours: 2 },
      ],
    });
    const reorderedHours = sampleContent({
      ordinaryHourInputs: [
        { code: "B", hours: 2 },
        { code: "A", hours: 1 },
      ],
    });
    assert.notEqual(calculatePayrollContentHash(ordered), calculatePayrollContentHash(reorderedHours));
  });

  it("treats omitted optional clinicId as distinct from present clinicId", () => {
    const withClinic = calculatePayrollContentHash(sampleContent({ clinicId: "clinic_north" }));
    const without = calculatePayrollContentHash(sampleContent({ clinicId: undefined }));
    assert.notEqual(withClinic, without);
  });

  it("rejects NaN, Infinity, and invalid timestamps", () => {
    assert.throws(
      () =>
        calculatePayrollContentHash(
          sampleContent({ ordinaryHourInputs: [{ code: "ORD", hours: Number.NaN }] })
        ),
      CanonicalizationError
    );
    assert.throws(
      () =>
        calculatePayrollContentHash(
          sampleContent({ ordinaryHourInputs: [{ code: "ORD", hours: Number.POSITIVE_INFINITY }] })
        ),
      CanonicalizationError
    );
    assert.throws(
      () =>
        calculatePayrollContentHash(
          sampleContent({
            leaveInputs: [
              {
                leaveRecordId: "lv1",
                leaveTypeCode: "AL",
                hours: 8,
                localStart: "not-a-date",
                localEnd: "2026-07-02T00:00:00.000Z",
                sourceVersion: 1,
              },
            ],
          })
        ),
      CanonicalizationError
    );
  });

  it("rejects mismatched supplied contentHash", () => {
    assert.throws(
      () => verifyOrCalculatePayrollContentHash(sampleContent(), "deadbeef"),
      CanonicalizationError
    );
  });
});

describe("CP2.1 published timesheet registry", () => {
  beforeEach(() => {
    installMemoryLocalStorage();
  });

  it("migrates additively and is idempotent", () => {
    assert.equal(runPublishedTimesheetRegistryMigration(), true);
    assert.equal(hasMigration(PUBLISHED_TIMESHEET_REGISTRY_MIGRATION_ID, 1), true);
    assert.equal(runPublishedTimesheetRegistryMigration(), false);
    assert.deepEqual(readJsonSafe(PUBLISHED_TIMESHEET_REGISTRY_KEYS.versions, null), []);
  });

  it("resumes after partial migration (flag cleared, data present)", () => {
    assert.equal(runPublishedTimesheetRegistryMigration(), true);
    writeJsonSafe(PUBLISHED_TIMESHEET_REGISTRY_KEYS.versions, []);
    clearMigrationFlag(PUBLISHED_TIMESHEET_REGISTRY_MIGRATION_ID);
    assert.equal(runPublishedTimesheetRegistryMigration(), true);
    assert.equal(hasMigration(PUBLISHED_TIMESHEET_REGISTRY_MIGRATION_ID, 1), true);
  });

  it("appends versions without overwrite and resolves exact history", () => {
    const first = publishTimesheetVersion(samplePublish());
    assert.equal(first.status, "published");
    const second = publishTimesheetVersion(
      samplePublish({
        content: { ordinaryHourInputs: [{ code: "ORD", hours: 80 }] },
        sourceVersion: 2,
        approvalRevision: 2,
        eventId: "evt_2",
        idempotencyKey: "idem_2",
      })
    );
    assert.equal(second.status, "published");

    const v1 = getPublishedTimesheetVersion(
      { organisationId: "org_alpha", legalEntityId: "le_payroll_1" },
      "ts_001",
      1
    );
    const v2 = getPublishedTimesheetVersion(
      { organisationId: "org_alpha", legalEntityId: "le_payroll_1" },
      "ts_001",
      2
    );
    assert.ok(v1);
    assert.ok(v2);
    assert.notEqual(v1!.contentHash, v2!.contentHash);
    assert.equal(v1!.ordinaryHourInputs[0].hours, 76);

    const current = getCurrentPublishedTimesheet(
      { organisationId: "org_alpha", legalEntityId: "le_payroll_1" },
      "ts_001"
    );
    assert.equal(current?.currentSourceVersion, 2);
    assert.equal(getPublicationLineage({ organisationId: "org_alpha", legalEntityId: "le_payroll_1" }, "ts_001").length, 2);
  });

  it("enforces tenant/legal-entity isolation on lookups", () => {
    const published = publishTimesheetVersion(samplePublish());
    assert.equal(
      getPublishedTimesheetByRegistryId(
        { organisationId: "org_other", legalEntityId: "le_payroll_1" },
        published.version.registryPublicationId
      ),
      null
    );
    assert.equal(
      listPublishedTimesheetVersions({ organisationId: "org_other", legalEntityId: "le_payroll_1" })
        .length,
      0
    );
  });

  it("returns idempotent success on identical retry", () => {
    const a = publishTimesheetVersion(samplePublish());
    const b = publishTimesheetVersion(samplePublish());
    assert.equal(a.status, "published");
    assert.equal(b.status, "idempotent");
    assert.equal(a.version.registryPublicationId, b.version.registryPublicationId);
  });

  it("rejects same version with different hash", () => {
    publishTimesheetVersion(samplePublish());
    assert.throws(
      () =>
        publishTimesheetVersion(
          samplePublish({
            content: { ordinaryHourInputs: [{ code: "ORD", hours: 99 }] },
            eventId: "evt_conflict",
            idempotencyKey: "idem_conflict",
          })
        ),
      (err: unknown) =>
        err instanceof PublishedTimesheetRegistryError && err.code === "VERSION_HASH_CONFLICT"
    );
  });

  it("rejects reused eventId with different payload", () => {
    publishTimesheetVersion(samplePublish());
    assert.throws(
      () =>
        publishTimesheetVersion(
          samplePublish({
            content: { ordinaryHourInputs: [{ code: "ORD", hours: 70 }] },
            sourceVersion: 2,
            approvalRevision: 2,
            eventId: "evt_1",
            idempotencyKey: "idem_different",
          })
        ),
      (err: unknown) =>
        err instanceof PublishedTimesheetRegistryError && err.code === "IDEMPOTENCY_CONFLICT"
    );
  });

  it("rejects lower sourceVersion and stale approvalRevision", () => {
    publishTimesheetVersion(samplePublish({ sourceVersion: 2, approvalRevision: 2 }));
    assert.throws(
      () =>
        publishTimesheetVersion(
          samplePublish({
            sourceVersion: 1,
            approvalRevision: 3,
            eventId: "evt_low",
            idempotencyKey: "idem_low",
          })
        ),
      (err: unknown) =>
        err instanceof PublishedTimesheetRegistryError && err.code === "SOURCE_VERSION_REGRESSION"
    );
    publishTimesheetVersion(
      samplePublish({
        content: { ordinaryHourInputs: [{ code: "ORD", hours: 80 }] },
        sourceVersion: 3,
        approvalRevision: 5,
        eventId: "evt_high",
        idempotencyKey: "idem_high",
      })
    );
    assert.throws(
      () =>
        publishTimesheetVersion(
          samplePublish({
            content: { ordinaryHourInputs: [{ code: "ORD", hours: 80 }] },
            sourceVersion: 3,
            approvalRevision: 4,
            approvalState: "revoked",
            reasonCode: "STALE",
            eventId: "evt_stale",
            idempotencyKey: "idem_stale",
          })
        ),
      (err: unknown) =>
        err instanceof PublishedTimesheetRegistryError && err.code === "APPROVAL_REVISION_REGRESSION"
    );
  });

  it("supports lifecycle-only revoke without changing content hash or overwriting version", () => {
    const first = publishTimesheetVersion(samplePublish());
    const hash = first.version.contentHash;
    const revoked = publishTimesheetVersion(
      samplePublish({
        approvalRevision: 2,
        approvalState: "revoked",
        reasonCode: "MANAGER_REVOKE",
        eventId: "evt_revoke",
        idempotencyKey: "idem_revoke",
      })
    );
    assert.equal(revoked.version.contentHash, hash);
    assert.equal(revoked.event.approvalState, "revoked");
    assert.equal(
      getPublishedTimesheetVersion(
        { organisationId: "org_alpha", legalEntityId: "le_payroll_1" },
        "ts_001",
        1
      )?.approvalState,
      "approved"
    );
    const current = getCurrentPublishedTimesheet(
      { organisationId: "org_alpha", legalEntityId: "le_payroll_1" },
      "ts_001"
    );
    assert.equal(current?.currentApprovalState, "revoked");
    assert.equal(current?.currentContentHash, hash);
    assert.equal(
      listPublishedTimesheetVersions({ organisationId: "org_alpha", legalEntityId: "le_payroll_1" })
        .length,
      1
    );
  });

  it("rejects out-of-order eventSequence", () => {
    publishTimesheetVersion(samplePublish({ eventSequence: 5 }));
    assert.throws(
      () =>
        publishTimesheetVersion(
          samplePublish({
            approvalRevision: 2,
            approvalState: "revoked",
            reasonCode: "X",
            eventId: "evt_oo",
            idempotencyKey: "idem_oo",
            eventSequence: 3,
          })
        ),
      (err: unknown) =>
        err instanceof PublishedTimesheetRegistryError && err.code === "EVENT_OUT_OF_ORDER"
    );
  });

  it("recovers current index after interrupted publication", () => {
    assert.throws(
      () => publishTimesheetVersion(samplePublish(), { interruptAfterVersionWrite: true }),
      (err: unknown) =>
        err instanceof PublishedTimesheetRegistryError && err.code === "INTERRUPTED_PUBLICATION"
    );
    const versions = readJsonSafe(PUBLISHED_TIMESHEET_REGISTRY_KEYS.versions, []);
    assert.equal(versions.length, 1);
    assert.equal(
      getCurrentPublishedTimesheet(
        { organisationId: "org_alpha", legalEntityId: "le_payroll_1" },
        "ts_001"
      ),
      null
    );
    rebuildCurrentIndexFromHistory();
    const current = getCurrentPublishedTimesheet(
      { organisationId: "org_alpha", legalEntityId: "le_payroll_1" },
      "ts_001"
    );
    assert.equal(current?.currentSourceVersion, 1);
    assert.equal(current?.currentRegistryPublicationId, versions[0].registryPublicationId);
  });

  it("rebuilds from history when current index is stale", () => {
    const published = publishTimesheetVersion(samplePublish());
    writeJsonSafe(PUBLISHED_TIMESHEET_REGISTRY_KEYS.current, {
      "org_alpha::le_payroll_1::ts_001": {
        ...getCurrentPublishedTimesheet(
          { organisationId: "org_alpha", legalEntityId: "le_payroll_1" },
          "ts_001"
        )!,
        currentSourceVersion: 99,
        currentContentHash: "stale",
      },
    });
    rebuildCurrentIndexFromHistory();
    const current = getCurrentPublishedTimesheet(
      { organisationId: "org_alpha", legalEntityId: "le_payroll_1" },
      "ts_001"
    );
    assert.equal(current?.currentSourceVersion, 1);
    assert.equal(current?.currentContentHash, published.version.contentHash);
  });

  it("exposes intake identity without using idempotencyKey as business uniqueness", () => {
    const published = publishTimesheetVersion(samplePublish());
    const identity = publishedIntakeIdentity(published.version);
    assert.equal(identity.organisationId, "org_alpha");
    assert.equal(identity.legalEntityId, "le_payroll_1");
    assert.equal(identity.timesheetRecordId, "ts_001");
    assert.equal(identity.sourceVersion, 1);
    assert.ok(identity.idempotencyKey);
    assert.ok(identity.registryPublicationId);
    // Business uniqueness key components (documented for M07):
    const businessKey = `${identity.organisationId}|${identity.legalEntityId}|${identity.timesheetRecordId}|${identity.sourceVersion}`;
    assert.equal(businessKey, "org_alpha|le_payroll_1|ts_001|1");
    assert.ok(!businessKey.includes(identity.idempotencyKey));
  });

  it("replays events in sequence order", () => {
    publishTimesheetVersion(samplePublish());
    publishTimesheetVersion(
      samplePublish({
        approvalRevision: 2,
        approvalState: "revoked",
        reasonCode: "R",
        eventId: "evt_r",
        idempotencyKey: "idem_r",
      })
    );
    const replay = replayPublishedTimesheetEvents(
      { organisationId: "org_alpha", legalEntityId: "le_payroll_1" },
      0
    );
    assert.equal(replay.length, 2);
    assert.ok(replay[0].eventSequence < replay[1].eventSequence);
  });

  it("boundary: registry module has no M07 mutation API surface beyond publication/read", async () => {
    // Export-level boundary check — publish is platform-owned;
    // no acceptIntake / writePulseM07 symbols are exported from this module.
    const registry = await import("../services/published-timesheet-registry");
    assert.equal(typeof registry.publishTimesheetVersion, "function");
    assert.equal("acceptIntake" in registry, false);
    assert.equal("writeM07Snapshot" in registry, false);
    assert.equal("scrapeM06Timesheets" in registry, false);
  });
});
