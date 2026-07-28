/**
 * Wave 4 M05 performance evidence — measurable targets from plan §23.
 *
 * Each `it(...)` measures ONE §23 target against a planned synthetic dataset,
 * appends a record to `results`, and asserts the target. Records are written
 * to `docs/audits/wave4-m05-performance-evidence.json` at the end of the
 * suite. Unit-test count is NEVER used as a stand-in for a performance target
 * — every row here contains an actual timed operation.
 *
 * Method conventions:
 *   metricType = "p95"     → run N ≥ 20 iterations, sort, take 95th percentile
 *   metricType = "max"     → single timed pass, or worst of N iterations
 *   metricType = "per-op"  → total elapsed / dataset size
 *
 * Every record additionally carries `datasetSize`, `targetMs`, `measuredMs`,
 * `method` (human-readable), `notes` (any caveats), and `pass`/`result`.
 */

import assert from "node:assert/strict";
import { describe, it, before } from "node:test";
import fs from "node:fs";
import path from "node:path";

import { resetWorkforceEventBusForTests } from "@/platform/workforce/services/workforce-event-bus";
import {
  clearClinicTimezoneOverridesForTests,
  registerClinicTimezone,
} from "@/platform/workforce/services/clinic-timezone";
import {
  registerWorkforceReadinessLookup,
  registerWorkforceReadinessRecalculate,
  type WorkforceReadinessOutcome,
} from "@/platform/workforce/services/workforce-eligibility";
import { resetRosterProjectionRegistryForTests } from "@/platform/workforce/registries/roster-projection-registry";
import { PLATFORM_KEYS, writeJsonSafe } from "@/platform/storage/storage";
import { M2_STORAGE } from "@/lib/action-inbox/storage";
import { loadActions } from "@/lib/action-inbox/repository";
import { findInboxActionForSource } from "@/platform/services/action-inbox-bridge";

import { resetM05BootstrapCacheForTests } from "../storage/bootstrap";
import { runM05StorageMigrations } from "../storage/migrations";
import { runM05SchemaV2Migration } from "../storage/migrate-v2";
import * as store from "../repository/local-store";
import {
  createPeriod,
  listPeriodsForActor,
  transitionPeriod,
} from "../services/period-service";
import { createShift, listShiftsForActor } from "../services/shift-service";
import { assignPerson } from "../services/assignment-service";
import { evaluateEligibility } from "../services/eligibility-service";
import { evaluateConflicts } from "../services/conflict-service";
import { evaluateCoverage } from "../services/coverage-service";
import {
  previewPublication,
  publishPeriod,
} from "../services/publication-service";
import { offerOpenShift, acceptOpenShift } from "../services/open-shift-service";
import {
  requestSwap,
  proposeReplacement,
  recipientAcceptSwap,
  approveSwap,
} from "../services/swap-service";
import {
  previewBulk,
  submitBulk,
  type BulkOperation,
} from "../services/bulk-operation-service";
import {
  buildScopedReport,
  exportShiftAssignmentsCsv,
} from "../services/reporting-service";
import { syncCoverageGapToInbox } from "../adapters/m05-inbox-sync";
import type { M05Actor } from "../permissions";
import type { CoverageGap, CoverageRequirement } from "../types/domain";

// ------------------------------------------------------------
// In-memory localStorage — matches the other m05 tests.
// ------------------------------------------------------------
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

// ------------------------------------------------------------
// Test rig: seed shared state + record helper.
// ------------------------------------------------------------
const admin: M05Actor = {
  userId: "usr_perf",
  permissions: ["*"],
};
const CLINIC = "clinic_perf";
const ORG = "org_perf";

const results: Array<Record<string, unknown>> = [];

interface RecordInput {
  id: string;
  name: string;
  datasetSize: number;
  targetMs: number;
  measuredMs: number;
  method: string;
  metricType: "p95" | "max" | "per-op" | "typical";
  extra?: Record<string, unknown>;
}

function record(input: RecordInput) {
  const rounded = Math.round(input.measuredMs * 100) / 100;
  const pass = rounded <= input.targetMs;
  results.push({
    id: input.id,
    name: input.name,
    datasetSize: input.datasetSize,
    targetMs: input.targetMs,
    measuredMs: rounded,
    method: input.method,
    metricType: input.metricType,
    result: pass ? "pass" : "fail",
    executedAt: new Date().toISOString(),
    ...(input.extra ?? {}),
  });
  assert.ok(
    pass,
    `${input.name}: ${rounded}ms > ${input.targetMs}ms (dataset=${input.datasetSize}, ${input.metricType})`
  );
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(rank);
  const hi = Math.ceil(rank);
  if (lo === hi) return sorted[lo]!;
  return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (rank - lo);
}

// ------------------------------------------------------------
// Seed helpers — build synthetic in-memory dataset per suite.
// ------------------------------------------------------------
interface SeedOptions {
  shiftCount: number;
  assignmentCount: number;
  weekStart: string; // clinic-local YMD Monday
  personCount: number;
}

function ymdOffset(baseYmd: string, days: number): string {
  const [y, m, d] = baseYmd.split("-").map(Number);
  const dt = new Date(Date.UTC(y!, (m ?? 1) - 1, d ?? 1));
  dt.setUTCDate(dt.getUTCDate() + days);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
}

function seedPeriodAndShifts(opts: SeedOptions) {
  const period = createPeriod(admin, {
    label: `Perf ${opts.weekStart}`,
    startsOn: opts.weekStart,
    endsOn: ymdOffset(opts.weekStart, 6),
    clinicId: CLINIC,
    organisationId: ORG,
  });
  const shifts: string[] = [];
  for (let i = 0; i < opts.shiftCount; i++) {
    const dayIdx = i % 7;
    const ymd = ymdOffset(opts.weekStart, dayIdx);
    const startH = 6 + (i % 12); // 06:00..17:00
    const endH = Math.min(23, startH + 4);
    const shift = createShift(admin, {
      rosterPeriodId: period.id,
      clinicId: CLINIC,
      organisationId: ORG,
      localStartYmd: ymd,
      localStartHm: `${String(startH).padStart(2, "0")}:00`,
      localEndYmd: ymd,
      localEndHm: `${String(endH).padStart(2, "0")}:00`,
      roleLabel: i % 2 === 0 ? "GP" : "Nurse",
    });
    shifts.push(shift.id);
  }
  return { period, shifts };
}

function seedCoverageRequirements(periodId: string, count: number) {
  const now = new Date().toISOString();
  for (let i = 0; i < count; i++) {
    const req: CoverageRequirement = {
      id: store.newCoverageRequirementId(),
      rosterPeriodId: periodId,
      clinicId: CLINIC,
      organisationId: ORG,
      roleLabel: i % 2 === 0 ? "GP" : "Nurse",
      localDate: ymdOffset("2027-01-04", i % 7),
      localStartTime: "08:00",
      localEndTime: "18:00",
      requiredCount: 1,
      createdAt: now,
      updatedAt: now,
      version: 1,
    };
    store.upsertCoverageRequirement(req);
  }
}

// ------------------------------------------------------------
// Suite.
// ------------------------------------------------------------
describe("m05 wave4 performance", () => {
  before(() => {
    installMemoryLocalStorage();
    resetWorkforceEventBusForTests();
    resetM05BootstrapCacheForTests();
    resetRosterProjectionRegistryForTests();
    clearClinicTimezoneOverridesForTests();
    writeJsonSafe(M2_STORAGE.actions, []);
    writeJsonSafe(PLATFORM_KEYS.sourceLinks, {});
    registerWorkforceReadinessLookup((personId, asOf): WorkforceReadinessOutcome => ({
      personId,
      readiness: "ready",
      blockers: [],
      asOf: asOf ?? new Date().toISOString(),
      stale: false,
      trainingDetailRefs: [],
    }));
    registerWorkforceReadinessRecalculate(null);
    runM05StorageMigrations();
    runM05SchemaV2Migration();
    registerClinicTimezone(CLINIC, "Australia/Brisbane");
  });

  // -----------------------------------------------------------------------
  // §23 · initial roster-board load simulation ≤ 2500 ms (max, one pass)
  // Dataset: 200 shifts + 200 assignments across 1 period.
  // Method: listPeriodsForActor + listShiftsForActor once, timed.
  // -----------------------------------------------------------------------
  it("initial roster-board load simulation ≤2500ms max", () => {
    const { period, shifts } = seedPeriodAndShifts({
      shiftCount: 200,
      assignmentCount: 200,
      weekStart: "2027-01-04",
      personCount: 200,
    });
    let assigned = 0;
    for (const shiftId of shifts) {
      const shift = store.getShift(shiftId)!;
      try {
        assignPerson(admin, {
          shiftId,
          personId: `perf_person_${assigned}`,
          expectedShiftVersion: shift.version,
        });
        assigned += 1;
      } catch {
        /* skip on ordering — best-effort dataset build */
      }
    }
    const t0 = performance.now();
    const periods = listPeriodsForActor(admin, CLINIC);
    const boardShifts = listShiftsForActor(admin, period.id);
    const elapsed = performance.now() - t0;
    record({
      id: "perf.board.initial-load",
      name: "Initial roster-board load simulation",
      datasetSize: 200,
      targetMs: 2500,
      measuredMs: elapsed,
      method: "listPeriodsForActor + listShiftsForActor over 200 shifts (single pass)",
      metricType: "max",
      extra: { periods: periods.length, shifts: boardShifts.length, assigned },
    });
  });

  // -----------------------------------------------------------------------
  // §23 · board filtering ≥200 rows ≤ 300 ms p95 (20 iterations)
  // -----------------------------------------------------------------------
  it("board filtering 200+ rows ≤300ms p95", () => {
    const period = store.listPeriods(CLINIC)[0]!;
    const shifts = store.listShifts(period.id);
    assert.ok(shifts.length >= 200, `need ≥200 shifts; had ${shifts.length}`);
    const filters = ["Nurse", "GP", "gp", "unassigned", "shf", "assigned"];
    const durations: number[] = [];
    for (let i = 0; i < 20; i++) {
      const q = filters[i % filters.length]!.toLowerCase();
      const t0 = performance.now();
      const filtered = shifts.filter(
        (s) =>
          (s.roleLabel ?? "").toLowerCase().includes(q) ||
          s.status.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q)
      );
      durations.push(performance.now() - t0);
      assert.ok(filtered.length >= 0);
    }
    const p95 = percentile(durations, 95);
    record({
      id: "perf.board.filter",
      name: "Board filtering 200+ rows",
      datasetSize: shifts.length,
      targetMs: 300,
      measuredMs: p95,
      method: "20 iterations, in-memory filter across role/status/id, p95",
      metricType: "p95",
      extra: {
        min: Math.round(Math.min(...durations) * 100) / 100,
        max: Math.round(Math.max(...durations) * 100) / 100,
        samples: durations.length,
      },
    });
  });

  // -----------------------------------------------------------------------
  // §23 · single eligibility lookup ≤ 100 ms typical
  // -----------------------------------------------------------------------
  it("eligibility lookup single ≤100ms typical", () => {
    const period = store.listPeriods(CLINIC)[0]!;
    const shift = store.listShifts(period.id)[0]!;
    const durations: number[] = [];
    for (let i = 0; i < 25; i++) {
      const t0 = performance.now();
      evaluateEligibility({
        personId: `perf_person_${i}`,
        clinicId: shift.clinicId,
        shiftWindow: {
          clinicId: shift.clinicId,
          timeZoneId: shift.timeZoneId,
          localStart: shift.localStart,
          localEnd: shift.localEnd,
          utcStart: shift.utcStart,
          utcEnd: shift.utcEnd,
          startOffsetMinutes: shift.startOffsetMinutes,
          endOffsetMinutes: shift.endOffsetMinutes,
          startFold: shift.startFold,
          endFold: shift.endFold,
          crossesLocalMidnight: shift.crossesLocalMidnight,
        },
      });
      durations.push(performance.now() - t0);
    }
    const median = percentile(durations, 50);
    record({
      id: "perf.eligibility.single",
      name: "Single eligibility lookup",
      datasetSize: 1,
      targetMs: 100,
      measuredMs: median,
      method: "25 iterations, median (typical)",
      metricType: "typical",
      extra: { p95: Math.round(percentile(durations, 95) * 100) / 100 },
    });
  });

  // -----------------------------------------------------------------------
  // §23 · conflict recalculation 150+ assignments ≤ 2000 ms max
  // -----------------------------------------------------------------------
  it("conflict recalculation 150+ assignments ≤2000ms max", () => {
    const period = store.listPeriods(CLINIC)[0]!;
    const shifts = store.listShifts(period.id).slice(0, 160);
    assert.ok(shifts.length >= 150, `need ≥150 shifts; had ${shifts.length}`);
    const t0 = performance.now();
    let total = 0;
    // Recompute across all 160 candidate shifts against a synthetic worker who
    // already holds several assignments. This mirrors the "recalc after edit"
    // flow the plan calls out in §23.
    for (const shift of shifts) {
      const findings = evaluateConflicts({
        personId: "perf_person_1",
        clinicId: shift.clinicId,
        candidateShift: {
          id: shift.id,
          clinicId: shift.clinicId,
          utcStart: shift.utcStart,
          utcEnd: shift.utcEnd,
          localStart: shift.localStart,
          localEnd: shift.localEnd,
          rosterPeriodId: shift.rosterPeriodId,
          organisationId: shift.organisationId,
        },
        organisationId: shift.organisationId,
      });
      total += findings.length;
    }
    const elapsed = performance.now() - t0;
    record({
      id: "perf.conflict.recalc",
      name: "Conflict recalculation 150+ assignments",
      datasetSize: shifts.length,
      targetMs: 2000,
      measuredMs: elapsed,
      method: `evaluateConflicts across ${shifts.length} candidate shifts (single pass)`,
      metricType: "max",
      extra: { totalFindings: total },
    });
  });

  // -----------------------------------------------------------------------
  // §23 · coverage calculation ≤ 500 ms p95 (20 iterations)
  // -----------------------------------------------------------------------
  it("coverage calculation ≤500ms p95", () => {
    const period = store.listPeriods(CLINIC)[0]!;
    seedCoverageRequirements(period.id, 30);
    const durations: number[] = [];
    for (let i = 0; i < 20; i++) {
      const t0 = performance.now();
      evaluateCoverage({ rosterPeriodId: period.id });
      durations.push(performance.now() - t0);
    }
    const p95 = percentile(durations, 95);
    record({
      id: "perf.coverage.calc",
      name: "Coverage calculation",
      datasetSize: 30,
      targetMs: 500,
      measuredMs: p95,
      method: "20 iterations of evaluateCoverage over 30 requirements + 200 shifts, p95",
      metricType: "p95",
    });
  });

  // -----------------------------------------------------------------------
  // §23 · publication preview ≤ 2000 ms max
  // §23 · publication submission ≤ 3000 ms max
  // We build a fresh, smaller period specifically for publish so the eligibility
  // revalidation surfaces the real cost.
  // -----------------------------------------------------------------------
  it("publication preview ≤2000ms max and submission ≤3000ms max", () => {
    const period = createPeriod(admin, {
      label: "Perf Publish",
      startsOn: "2027-02-01",
      endsOn: "2027-02-07",
      clinicId: CLINIC,
      organisationId: ORG,
    });
    const SHIFT_COUNT = 60;
    for (let i = 0; i < SHIFT_COUNT; i++) {
      const day = ymdOffset("2027-02-01", i % 7);
      const shift = createShift(admin, {
        rosterPeriodId: period.id,
        clinicId: CLINIC,
        organisationId: ORG,
        localStartYmd: day,
        localStartHm: "08:00",
        localEndYmd: day,
        localEndHm: "12:00",
        roleLabel: i % 2 === 0 ? "GP" : "Nurse",
      });
      assignPerson(admin, {
        shiftId: shift.id,
        personId: `pub_person_${i}`,
        expectedShiftVersion: shift.version,
      });
    }
    // ready_to_publish
    transitionPeriod(admin, {
      periodId: period.id,
      to: "ready_to_publish",
      expectedVersion: store.getPeriod(period.id)!.version,
    });

    const tPreview = performance.now();
    const preview = previewPublication(admin, { rosterPeriodId: period.id });
    const previewMs = performance.now() - tPreview;
    record({
      id: "perf.publication.preview",
      name: "Publication preview",
      datasetSize: SHIFT_COUNT,
      targetMs: 2000,
      measuredMs: previewMs,
      method: `previewPublication over ${SHIFT_COUNT} assigned shifts (single pass)`,
      metricType: "max",
      extra: {
        assignmentCount: preview.assignments.length,
        warningCount: preview.warnings.length,
        blockerCount: preview.blockers.length,
      },
    });

    const readyVersion = store.getPeriod(period.id)!.version;
    const tSubmit = performance.now();
    const pub = publishPeriod(admin, {
      rosterPeriodId: period.id,
      expectedPeriodVersion: readyVersion,
    });
    const submitMs = performance.now() - tSubmit;
    record({
      id: "perf.publication.submit",
      name: "Publication submission",
      datasetSize: SHIFT_COUNT,
      targetMs: 3000,
      measuredMs: submitMs,
      method: `publishPeriod over ${SHIFT_COUNT} assigned shifts (immutable snapshot + event dispatch)`,
      metricType: "max",
      extra: {
        publicationId: pub.id,
        publicationVersion: pub.publicationVersion,
        requiredAcks: pub.requiredAcknowledgerPersonIds.length,
      },
    });
  });

  // -----------------------------------------------------------------------
  // §23 · open-shift acceptance ≤ 400 ms max
  // -----------------------------------------------------------------------
  it("open-shift acceptance ≤400ms max", () => {
    const period = createPeriod(admin, {
      label: "Perf OS",
      startsOn: "2027-03-01",
      endsOn: "2027-03-07",
      clinicId: CLINIC,
      organisationId: ORG,
    });
    const shift = createShift(admin, {
      rosterPeriodId: period.id,
      clinicId: CLINIC,
      organisationId: ORG,
      localStartYmd: "2027-03-02",
      localStartHm: "08:00",
      localEndYmd: "2027-03-02",
      localEndHm: "12:00",
      roleLabel: "Locum",
    });
    const open = offerOpenShift(admin, {
      shiftId: shift.id,
      audiencePersonIds: ["open_person_1", "open_person_2"],
    });
    const t0 = performance.now();
    const accepted = acceptOpenShift(admin, {
      openShiftId: open.id,
      expectedVersion: open.version,
      actAsPersonId: "open_person_1",
    });
    const elapsed = performance.now() - t0;
    record({
      id: "perf.open-shift.accept",
      name: "Open-shift acceptance",
      datasetSize: 1,
      targetMs: 400,
      measuredMs: elapsed,
      method: "acceptOpenShift end-to-end (eligibility + transition + audit)",
      metricType: "max",
      extra: { finalStatus: accepted.status },
    });
  });

  // -----------------------------------------------------------------------
  // §23 · swap approval ≤ 500 ms max
  // -----------------------------------------------------------------------
  it("swap approval ≤500ms max", () => {
    const period = createPeriod(admin, {
      label: "Perf Swap",
      startsOn: "2027-04-05",
      endsOn: "2027-04-11",
      clinicId: CLINIC,
      organisationId: ORG,
    });
    const shift = createShift(admin, {
      rosterPeriodId: period.id,
      clinicId: CLINIC,
      organisationId: ORG,
      localStartYmd: "2027-04-06",
      localStartHm: "08:00",
      localEndYmd: "2027-04-06",
      localEndHm: "12:00",
      roleLabel: "GP",
    });
    const assignment = assignPerson(admin, {
      shiftId: shift.id,
      personId: "swap_requester",
      expectedShiftVersion: shift.version,
    });
    const shiftAfterAssign = store.getShift(shift.id)!;
    const swap = requestSwap(admin, {
      shiftId: shift.id,
      requesterPersonId: "swap_requester",
      recipientPersonId: null,
    });
    const proposed = proposeReplacement(admin, {
      swapId: swap.id,
      recipientPersonId: "swap_recipient",
      expectedVersion: swap.version,
    });
    const acceptedByRecipient = recipientAcceptSwap(admin, {
      swapId: swap.id,
      expectedVersion: proposed.version,
      actAsPersonId: "swap_recipient",
    });
    const approver: M05Actor = {
      userId: "usr_approver",
      permissions: ["*"],
    };
    const t0 = performance.now();
    const outcome = approveSwap(approver, {
      swapId: swap.id,
      expectedVersion: acceptedByRecipient.version,
      expectedShiftVersion: shiftAfterAssign.version,
    });
    const elapsed = performance.now() - t0;
    record({
      id: "perf.swap.approve",
      name: "Swap approval",
      datasetSize: 1,
      targetMs: 500,
      measuredMs: elapsed,
      method: "approveSwap end-to-end (eligibility + assignPerson + audit)",
      metricType: "max",
      extra: {
        assignmentId: outcome.assignmentId,
        originalAssignmentId: assignment.id,
      },
    });
  });

  // -----------------------------------------------------------------------
  // §23 · bulk preview ≤500 ops ≤ 2000 ms max
  // §23 · bulk submission ≤500 ops ≤ 5000 ms max
  // -----------------------------------------------------------------------
  it("bulk preview ≤500 ops ≤2000ms and submission ≤500 ops ≤5000ms", () => {
    const period = createPeriod(admin, {
      label: "Perf Bulk",
      startsOn: "2027-05-03",
      endsOn: "2027-05-09",
      clinicId: CLINIC,
      organisationId: ORG,
    });
    const SIZE = 500;
    const ops: BulkOperation[] = Array.from({ length: SIZE }, (_, i) => {
      const day = ymdOffset("2027-05-03", i % 7);
      const startH = 6 + (i % 10);
      const endH = Math.min(23, startH + 2);
      return {
        idempotencyKey: `bulk-op-${i}`,
        kind: "create-shift" as const,
        clinicId: CLINIC,
        payload: {
          rosterPeriodId: period.id,
          organisationId: ORG,
          localStartYmd: day,
          localStartHm: `${String(startH).padStart(2, "0")}:00`,
          localEndYmd: day,
          localEndHm: `${String(endH).padStart(2, "0")}:00`,
          roleLabel: i % 2 === 0 ? "GP" : "Nurse",
        },
      };
    });

    const tPreview = performance.now();
    const preview = previewBulk(admin, ops);
    const previewMs = performance.now() - tPreview;
    record({
      id: "perf.bulk.preview",
      name: "Bulk preview 500 ops",
      datasetSize: SIZE,
      targetMs: 2000,
      measuredMs: previewMs,
      method: "previewBulk(500 create-shift ops) single pass",
      metricType: "max",
      extra: { willAttempt: preview.willAttempt, duplicates: preview.duplicateOps },
    });

    const tSubmit = performance.now();
    const submitted = submitBulk(admin, ops);
    const submitMs = performance.now() - tSubmit;
    record({
      id: "perf.bulk.submit",
      name: "Bulk submission 500 ops",
      datasetSize: SIZE,
      targetMs: 5000,
      measuredMs: submitMs,
      method: "submitBulk(500 create-shift ops) end-to-end",
      metricType: "max",
      extra: {
        succeeded: submitted.succeeded.length,
        failed: submitted.failed.length,
        skippedDuplicate: submitted.skippedDuplicate.length,
        notificationsSuppressed: submitted.notificationsSuppressed,
      },
    });
  });

  // -----------------------------------------------------------------------
  // §23 · M02 projection single ≤ 50 ms
  //
  // Diagnosis of prior false pass:
  //   The previous harness registered a `registerRosterProjection` observer
  //   (kind "action-inbox") and then called `syncCoverageGapToInbox`. That
  //   adapter writes M02 via `dispatchActionInboxEvent` and never invokes the
  //   roster-projection registry — so `projectionsInvoked` stayed 0 while the
  //   row still claimed "M02 write". This test measures the real approved
  //   M05 → M02 path and fails when no inbox write is delivered.
  // -----------------------------------------------------------------------
  it("M02 projection single ≤50ms typical", () => {
    writeJsonSafe(M2_STORAGE.actions, []);
    writeJsonSafe(PLATFORM_KEYS.sourceLinks, {});

    const baseGap: CoverageGap = {
      requirementId: "req_perf_probe",
      rosterPeriodId: "prd_perf_m02",
      clinicId: CLINIC,
      roleLabel: "GP",
      localDate: "2027-01-04",
      severity: "hard",
      missingCount: 1,
      filledCount: 0,
      requiredCount: 1,
      reason: "perf coverage gap",
      asOf: new Date().toISOString(),
    };

    const durations: number[] = [];
    let writes = 0;
    let lastProjectionKey = "";
    let lastSourceRecordId = "";
    let lastActionId: string | null = null;

    for (let i = 0; i < 30; i++) {
      const gap: CoverageGap = {
        ...baseGap,
        requirementId: `req_perf_m02_${i}`,
        asOf: new Date().toISOString(),
      };
      const expectedProjectionKey = `roster::coverage-gap::${gap.rosterPeriodId}::${gap.requirementId}`;
      const expectedSourceId = `${gap.rosterPeriodId}::${gap.requirementId}`;

      const t0 = performance.now();
      const written = syncCoverageGapToInbox(gap);
      durations.push(performance.now() - t0);

      assert.ok(
        written,
        `M02 projection write returned null for ${expectedProjectionKey} — syncCoverageGapToInbox must deliver an inbox action`
      );
      assert.equal(written!.status, "Open");
      assert.match(written!.title, /Coverage gap/);

      const found = findInboxActionForSource("roster", "coverage-gap", expectedSourceId);
      assert.ok(
        found,
        `Expected M02 inbox row missing for source ${expectedSourceId}`
      );
      assert.equal(found!.id, written!.id);

      writes += 1;
      lastProjectionKey = expectedProjectionKey;
      lastSourceRecordId = expectedSourceId;
      lastActionId = written!.id;
    }

    assert.ok(writes > 0, "projectionsInvoked/write count must be > 0");
    assert.equal(writes, 30, "each syncCoverageGapToInbox iteration must produce a write");
    assert.ok(lastActionId, "expected last M02 action id");

    const coverageRows = loadActions().filter(
      (a) => a.sourceModule === "roster" && a.title.includes("Coverage gap")
    );
    assert.ok(
      coverageRows.length >= 30,
      `expected ≥30 M02 coverage-gap rows; found ${coverageRows.length}`
    );

    const median = percentile(durations, 50);
    record({
      id: "perf.m02.projection",
      name: "M02 projection single",
      datasetSize: 1,
      targetMs: 50,
      measuredMs: median,
      method:
        "30 iterations of syncCoverageGapToInbox → dispatchActionInboxEvent (real M05→M02 path), median; asserts write + findInboxActionForSource",
      metricType: "typical",
      extra: {
        p95: Math.round(percentile(durations, 95) * 100) / 100,
        projectionsInvoked: writes,
        m02Writes: writes,
        projectionKey: lastProjectionKey,
        sourceRecordType: "coverage-gap",
        sourceRecordId: lastSourceRecordId,
        dedupeIdentity: lastProjectionKey,
        lastActionId,
        inboxCoverageGapRows: coverageRows.length,
      },
    });
  });

  // -----------------------------------------------------------------------
  // §23 · reports build ≤ 3000 ms max
  // -----------------------------------------------------------------------
  it("reports build ≤3000ms max", () => {
    const t0 = performance.now();
    const report = buildScopedReport(admin, {});
    const elapsed = performance.now() - t0;
    record({
      id: "perf.report.build",
      name: "Scoped report build",
      datasetSize:
        report.shifts.length +
        report.assignments.length +
        report.publications.length +
        report.costForecasts.length,
      targetMs: 3000,
      measuredMs: elapsed,
      method: "buildScopedReport over all seeded periods/shifts/assignments/publications",
      metricType: "max",
      extra: {
        periods: report.periods.length,
        shifts: report.shifts.length,
        assignments: report.assignments.length,
        publications: report.publications.length,
        costForecasts: report.costForecasts.length,
      },
    });
  });

  // -----------------------------------------------------------------------
  // §23 · scoped export ≤ 3000 ms max
  // -----------------------------------------------------------------------
  it("scoped export ≤3000ms max", () => {
    const t0 = performance.now();
    const csv = exportShiftAssignmentsCsv(admin, { includeCosts: false });
    const elapsed = performance.now() - t0;
    const lineCount = csv.split("\n").length;
    record({
      id: "perf.report.export",
      name: "Scoped CSV export",
      datasetSize: lineCount - 1,
      targetMs: 3000,
      measuredMs: elapsed,
      method: "exportShiftAssignmentsCsv over full clinic-scoped shift set",
      metricType: "max",
      extra: { csvLineCount: lineCount, csvBytes: csv.length },
    });
  });

  // -----------------------------------------------------------------------
  // Persist evidence JSON exactly once at the end of the suite.
  // -----------------------------------------------------------------------
  it("writes wave4 M05 performance evidence json", () => {
    const outDir = path.join(process.cwd(), "docs", "audits");
    fs.mkdirSync(outDir, { recursive: true });
    const summary = {
      generatedAt: new Date().toISOString(),
      spec: "HCDP §23 M05 performance targets",
      note: "Each row measures a single §23 target on a planned synthetic dataset. Unit test counts are NOT reported as performance.",
      total: results.length,
      pass: results.filter((r) => r.result === "pass").length,
      fail: results.filter((r) => r.result === "fail").length,
      results,
    };
    fs.writeFileSync(
      path.join(outDir, "wave4-m05-performance-evidence.json"),
      JSON.stringify(summary, null, 2)
    );
    assert.equal(summary.fail, 0, `${summary.fail} performance target(s) failed`);
  });
});
