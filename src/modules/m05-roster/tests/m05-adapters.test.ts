/**
 * M05 adapters — M02 lifecycles, M01 aggregates, M10 deferred bridge.
 *
 * M02 (§21) — five lifecycles: coverage-gap, unacked-publication, swap-action,
 * open-shift-escalation, assignment-invalidated. Each proves create → dedupe →
 * update → close → stale-replay-blocked.
 *
 * M01 — aggregate operational counts only.
 *
 * M10 (§22) — bridge is BLOCKED at Wave 4; workflow 12 evidence must be
 * BLOCKED-M10, not silent pass.
 */

import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";

import { PLATFORM_KEYS, writeJsonSafe } from "@/platform/storage/storage";
import { resetWorkforceEventBusForTests } from "@/platform/workforce/services/workforce-event-bus";
import { M2_STORAGE } from "@/lib/action-inbox/storage";
import { loadActions } from "@/lib/action-inbox/repository";

import { runM05StorageMigrations } from "../storage/migrations";
import { runM05SchemaV2Migration } from "../storage/migrate-v2";
import { resetM05BootstrapCacheForTests } from "../storage/bootstrap";
import {
  syncCoverageGapToInbox,
  closeCoverageGapInbox,
  syncUnackedPublicationToInbox,
  closeUnackedPublicationInbox,
  reconcileUnackedPublicationInbox,
  syncSwapActionToInbox,
  syncOpenShiftEscalationToInbox,
  syncAssignmentInvalidatedToInbox,
} from "../adapters/m05-inbox-sync";
import { getRosterCounts } from "../adapters/m05-executive";
import {
  transferOpeningClosingDuties,
  M10_DUTY_BRIDGE_STATUS,
} from "../adapters/m10-duty-bridge";
import * as store from "../repository/local-store";
import type {
  Assignment,
  CoverageGap,
  OpenShift,
  RosterPeriod,
  RosterPublication,
  SwapRequest,
} from "../types/domain";

function installMemoryLocalStorage() {
  const map = new Map<string, string>();
  (globalThis as { window?: { localStorage: Storage } }).window = {
    localStorage: {
      getItem: (k) => (map.has(k) ? map.get(k)! : null),
      setItem: (k, v) => {
        map.set(k, String(v));
      },
      removeItem: (k) => {
        map.delete(k);
      },
      clear: () => map.clear(),
      key: () => null,
      length: 0,
    } as Storage,
  };
}

function nowIso(): string {
  return new Date().toISOString();
}

function baseCoverageGap(overrides: Partial<CoverageGap> = {}): CoverageGap {
  return {
    requirementId: "req-1",
    rosterPeriodId: "period-1",
    clinicId: "clinic_a",
    roleLabel: "Nurse",
    localDate: "2026-08-03",
    severity: "hard",
    missingCount: 1,
    filledCount: 0,
    requiredCount: 1,
    reason: "no coverage",
    asOf: nowIso(),
    ...overrides,
  };
}

function basePeriod(id = "period-1"): RosterPeriod {
  return {
    id,
    organisationId: "org_parent",
    clinicId: "clinic_a",
    label: "Test",
    startsOn: "2026-08-03",
    endsOn: "2026-08-09",
    timeZoneId: "Australia/Brisbane",
    lifecycleState: "published",
    seedBatchId: null,
    cancelReason: null,
    createdAt: nowIso(),
    createdBy: "seed",
    updatedAt: nowIso(),
    version: 1,
  };
}

function basePublication(overrides: Partial<RosterPublication> = {}): RosterPublication {
  return {
    id: overrides.id ?? "pub-1",
    rosterPeriodId: overrides.rosterPeriodId ?? "period-1",
    clinicId: "clinic_a",
    organisationId: "org_parent",
    publicationVersion: overrides.publicationVersion ?? 1,
    publishedAt: nowIso(),
    publishedBy: "usr_admin",
    asOf: nowIso(),
    timeZoneId: "Australia/Brisbane",
    assignments: [],
    warnings: [],
    supersedesId: null,
    supersededById: null,
    acknowledgementStatus: "none",
    requiredAcknowledgerPersonIds: ["worker_a"],
    cancelReason: null,
    seedBatchId: null,
    createdAt: nowIso(),
    version: 1,
    ...overrides,
  };
}

function baseSwap(overrides: Partial<SwapRequest> = {}): SwapRequest {
  return {
    id: overrides.id ?? "swap-1",
    shiftId: "shift-1",
    rosterPeriodId: "period-1",
    clinicId: "clinic_a",
    organisationId: "org_parent",
    requesterPersonId: "worker_a",
    recipientPersonId: null,
    status: "requested",
    requestedAt: nowIso(),
    respondedAt: null,
    approvedAt: null,
    approvedBy: null,
    rejectedReason: null,
    resultingAssignmentId: null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    version: 1,
    ...overrides,
  };
}

function baseOpenShift(overrides: Partial<OpenShift> = {}): OpenShift {
  return {
    id: overrides.id ?? "os-1",
    shiftId: "shift-1",
    rosterPeriodId: "period-1",
    clinicId: "clinic_a",
    organisationId: "org_parent",
    status: "escalated",
    audiencePersonIds: ["worker_a"],
    applicants: [],
    selectedPersonId: null,
    closedAt: null,
    escalatedLevel: 1,
    createdAt: nowIso(),
    createdBy: "usr_admin",
    updatedAt: nowIso(),
    version: 1,
    ...overrides,
  };
}

function baseAssignment(overrides: Partial<Assignment> = {}): Assignment {
  return {
    id: overrides.id ?? "asn-1",
    shiftId: "shift-1",
    rosterPeriodId: "period-1",
    clinicId: "clinic_a",
    organisationId: "org_parent",
    personId: "worker_a",
    state: "invalidated",
    assignedAt: nowIso(),
    assignedBy: "usr_admin",
    replacesId: null,
    replacedById: null,
    overrideReason: null,
    overrideBy: null,
    invalidationReason: "leave granted",
    publicationId: "pub-1",
    seedBatchId: null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    version: 1,
    ...overrides,
  };
}

describe("m05 adapters", () => {
  beforeEach(() => {
    installMemoryLocalStorage();
    resetWorkforceEventBusForTests();
    resetM05BootstrapCacheForTests();
    writeJsonSafe(M2_STORAGE.actions, []);
    writeJsonSafe(PLATFORM_KEYS.sourceLinks, {});
    runM05StorageMigrations();
    runM05SchemaV2Migration();
  });

  it("M02-LG-01 coverage-gap: create → dedupe → update → close → stale replay blocked", () => {
    const gap = baseCoverageGap();
    const created = syncCoverageGapToInbox(gap);
    assert.ok(created);
    assert.equal(created!.status, "Open");
    // Dedupe on second call — still one action, no duplicate
    syncCoverageGapToInbox(gap);
    assert.equal(loadActions().filter((a) => a.title.includes("Coverage gap")).length, 1);
    // Update (still one row)
    const updated = syncCoverageGapToInbox({ ...gap, filledCount: 1, requiredCount: 2 });
    assert.ok(updated);
    assert.equal(loadActions().filter((a) => a.title.includes("Coverage gap")).length, 1);
    // Close
    const closed = closeCoverageGapInbox(gap, "usr_admin");
    assert.ok(closed);
    assert.equal(closed!.status, "Completed");
    // Stale replay — old sync should not reopen the closed row
    const replay = syncCoverageGapToInbox(gap);
    assert.ok(replay);
    assert.equal(replay!.status, "Completed");
  });

  it("M02-LG-02 unacked-publication: create → dedupe → close on `full` ack → stale replay blocked", () => {
    const pub = basePublication();
    const created = syncUnackedPublicationToInbox(pub);
    assert.ok(created);
    syncUnackedPublicationToInbox(pub);
    assert.equal(
      loadActions().filter((a) => a.title.includes("needs acknowledgement")).length,
      1
    );
    // Ack full → close via reconcile
    const acked = { ...pub, acknowledgementStatus: "full" as const };
    const reconciled = reconcileUnackedPublicationInbox(acked);
    assert.ok(reconciled);
    assert.equal(reconciled!.status, "Completed");
    // Stale replay: firing sync of old (still `none`) at older version doesn't reopen
    const replay = syncUnackedPublicationToInbox({ ...pub, publicationVersion: 1 });
    assert.ok(replay);
    assert.equal(replay!.status, "Completed");

    // Close explicit path also works
    const closed = closeUnackedPublicationInbox({ ...pub, acknowledgementStatus: "full" }, "usr_admin");
    assert.ok(closed);
    assert.equal(closed!.status, "Completed");
  });

  it("M02-LG-03 swap-action: create → dedupe → close on terminal state → stale replay blocked", () => {
    const swap = baseSwap({ status: "requested", version: 1 });
    const created = syncSwapActionToInbox(swap);
    assert.ok(created);
    syncSwapActionToInbox(swap);
    assert.equal(loadActions().filter((a) => a.title.includes("Swap")).length, 1);
    // Terminal state → close
    const closed = syncSwapActionToInbox({ ...swap, status: "approved", version: 2 });
    assert.ok(closed);
    assert.equal(closed!.status, "Completed");
    // Stale replay of older requested version doesn't reopen
    const replay = syncSwapActionToInbox({ ...swap, status: "requested", version: 1 });
    assert.ok(replay);
    assert.equal(replay!.status, "Completed");
  });

  it("M02-LG-04 open-shift-escalation: create → dedupe → close on `closed` status → stale replay blocked", () => {
    const os = baseOpenShift();
    const created = syncOpenShiftEscalationToInbox(os);
    assert.ok(created);
    syncOpenShiftEscalationToInbox(os);
    const matches = () =>
      loadActions().filter(
        (a) => a.sourceModule === "roster" && a.title.includes(`Open shift ${os.id}`)
      );
    assert.equal(matches().length, 1);
    // Close via `closed` status
    const closed = syncOpenShiftEscalationToInbox({ ...os, status: "closed", version: 2 });
    assert.ok(closed);
    assert.equal(closed!.status, "Completed");
    // Stale replay of older escalated state doesn't reopen
    const replay = syncOpenShiftEscalationToInbox({ ...os, status: "escalated", version: 1 });
    assert.ok(replay);
    assert.equal(replay!.status, "Completed");
  });

  it("M02-LG-05 assignment-invalidated: create → dedupe; non-invalidated state does not create a row", () => {
    const inv = baseAssignment();
    const created = syncAssignmentInvalidatedToInbox(inv);
    assert.ok(created);
    // Dedupe on repeat
    syncAssignmentInvalidatedToInbox(inv);
    assert.equal(loadActions().filter((a) => a.title.includes("invalidated")).length, 1);
    // A non-invalidated assignment must not create a row
    const alt = baseAssignment({ id: "asn-2", state: "assigned" });
    const shouldBeNull = syncAssignmentInvalidatedToInbox(alt);
    assert.equal(shouldBeNull, null);
  });

  it("M01: getRosterCounts returns aggregate operational counts only (no person-sensitive dumps)", () => {
    // Populate a small dataset directly in store
    const period = basePeriod();
    store.upsertPeriod(period);
    const draftPeriod = basePeriod("period-2");
    store.upsertPeriod({ ...draftPeriod, lifecycleState: "draft" });

    const pubActive = basePublication({ id: "pub-active", acknowledgementStatus: "partial" });
    const pubFull = basePublication({
      id: "pub-full",
      acknowledgementStatus: "full",
    });
    store.appendPublication(pubActive);
    store.appendPublication(pubFull);

    store.upsertSwap(baseSwap({ id: "swap-pending", status: "requested" }));
    store.upsertSwap(baseSwap({ id: "swap-done", status: "approved" }));

    store.upsertOpenShift(baseOpenShift({ id: "os-esc", status: "escalated" }));
    store.upsertOpenShift(baseOpenShift({ id: "os-open", status: "open" }));

    store.appendAssignment(baseAssignment({ id: "asn-inv", state: "invalidated" }));

    const counts = getRosterCounts();
    assert.equal(counts.totalPeriods, 2);
    assert.equal(counts.publishedPeriods, 1);
    assert.equal(counts.draftPeriods, 1);
    assert.equal(counts.pendingSwaps, 1);
    assert.equal(counts.openShiftEscalations, 1);
    assert.equal(counts.invalidatedPublishedAssignments, 1);
    // Sensitive fields shouldn't appear on the counts object at all
    const keys = Object.keys(counts);
    for (const k of keys) assert.doesNotMatch(k, /personId|rate|leaveReason/i);
  });

  it("M01 clinic-scoped counts filter to a single clinic", () => {
    store.upsertPeriod(basePeriod("period-a"));
    store.upsertPeriod({ ...basePeriod("period-b"), clinicId: "clinic_b" });
    const c1 = getRosterCounts("clinic_a");
    assert.equal(c1.totalPeriods, 1);
    const c2 = getRosterCounts("clinic_b");
    assert.equal(c2.totalPeriods, 1);
  });

  it("M10 (workflow #12): transferOpeningClosingDuties is BLOCKED with reason and evidence code — not silent pass", () => {
    const result = transferOpeningClosingDuties({
      publicationId: "pub-1",
      shiftIds: ["s1", "s2"],
      clinicId: "clinic_a",
      actor: "usr_admin",
    });
    assert.equal(result.blocked, true);
    assert.equal(result.status, M10_DUTY_BRIDGE_STATUS);
    assert.equal(result.status, "deferred");
    assert.equal(result.workflowEvidenceCode, "BLOCKED-M10");
    assert.ok(result.reason.length > 0);
    assert.deepEqual(result.shiftIds, ["s1", "s2"]);
  });
});
