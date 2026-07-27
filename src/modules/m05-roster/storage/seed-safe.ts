/**
 * M05 safe seed — insert-if-absent demo roster period, shifts and a default
 * conflict policy. Never overwrites existing records by id. Rows are tagged
 * with `seedBatchId` and can be removed via `rollbackSeedOwnedM05`.
 *
 * IMPORTANT: seed data must never mutate frozen Wave 2 (M04) or Wave 3 (M11)
 * stores. It writes only into `pulse.m05.roster.*` keys.
 */

import { readJsonSafe, runMigrationOnce, uid, writeJsonSafe } from "@/platform/storage/storage";
import type {
  RosterPeriod,
  Shift,
} from "../types/domain";
import type { ConflictPolicy } from "../types/policy";
import { DEFAULT_CONFLICT_POLICY_RULES } from "../types/policy";
import {
  M05_POLICY_MIGRATION_ID,
  M05_SEED_MIGRATION_ID,
  M05_STORAGE_KEYS,
} from "./keys";
import { ensureM05Bootstrapped, notifyM05BootstrapListeners } from "./bootstrap";

export const M05_SEED_BATCH_ID = "seed-demo-v1";
const DEFAULT_ORG = "org_parent";
const DEFAULT_CLINIC = "loc_woolloongabba";
const DEFAULT_TIMEZONE = "Australia/Brisbane";

// ——— Demo period + shifts ———

function buildDemoPeriod(now: string): RosterPeriod {
  return {
    id: uid("prd"),
    organisationId: DEFAULT_ORG,
    clinicId: DEFAULT_CLINIC,
    label: "Demo Roster — Week A",
    startsOn: "2026-08-03",
    endsOn: "2026-08-09",
    timeZoneId: DEFAULT_TIMEZONE,
    lifecycleState: "draft",
    seedBatchId: M05_SEED_BATCH_ID,
    cancelReason: null,
    createdAt: now,
    createdBy: "seed",
    updatedAt: now,
    version: 1,
  };
}

function buildDemoShift(
  now: string,
  periodId: string,
  input: {
    localStart: string;
    localEnd: string;
    utcStart: string;
    utcEnd: string;
    offset: number;
    roleLabel: string;
    crossesLocalMidnight?: boolean;
  }
): Shift {
  return {
    id: uid("shf"),
    rosterPeriodId: periodId,
    clinicId: DEFAULT_CLINIC,
    organisationId: DEFAULT_ORG,
    status: "unassigned",
    timeZoneId: DEFAULT_TIMEZONE,
    localStart: input.localStart,
    localEnd: input.localEnd,
    utcStart: input.utcStart,
    utcEnd: input.utcEnd,
    startOffsetMinutes: input.offset,
    endOffsetMinutes: input.offset,
    startFold: 0,
    endFold: 0,
    crossesLocalMidnight: input.crossesLocalMidnight ?? false,
    roleLabel: input.roleLabel,
    requiredCapability: null,
    requiredCount: 1,
    breakPlannedMinutes: 30,
    splitGroupId: null,
    supersedesId: null,
    supersededById: null,
    cancelReason: null,
    currentAssignmentId: null,
    seedBatchId: M05_SEED_BATCH_ID,
    createdAt: now,
    createdBy: "seed",
    updatedAt: now,
    version: 1,
  };
}

// Australia/Brisbane is UTC+10, no DST. 08:00 local = 22:00 previous day UTC.
function buildDemoShifts(now: string, periodId: string): Shift[] {
  return [
    buildDemoShift(now, periodId, {
      localStart: "2026-08-03T08:00",
      localEnd: "2026-08-03T16:00",
      utcStart: "2026-08-02T22:00:00.000Z",
      utcEnd: "2026-08-03T06:00:00.000Z",
      offset: 600,
      roleLabel: "Clinical Nurse",
    }),
    buildDemoShift(now, periodId, {
      localStart: "2026-08-04T14:00",
      localEnd: "2026-08-04T22:00",
      utcStart: "2026-08-04T04:00:00.000Z",
      utcEnd: "2026-08-04T12:00:00.000Z",
      offset: 600,
      roleLabel: "Reception",
    }),
    buildDemoShift(now, periodId, {
      localStart: "2026-08-05T22:00",
      localEnd: "2026-08-06T06:00",
      utcStart: "2026-08-05T12:00:00.000Z",
      utcEnd: "2026-08-05T20:00:00.000Z",
      offset: 600,
      roleLabel: "Overnight Cover",
      crossesLocalMidnight: true,
    }),
  ];
}

// ——— Default conflict policy ———

function buildDefaultConflictPolicy(now: string): ConflictPolicy {
  return {
    id: uid("polc"),
    policyVersion: 1,
    organisationId: DEFAULT_ORG,
    clinicIds: [],
    status: "published",
    label: "Default Roster Conflict Policy v1",
    rules: DEFAULT_CONFLICT_POLICY_RULES,
    publishedAt: now,
    archivedAt: null,
    createdAt: now,
    createdBy: "seed",
  };
}

// ——— Seed period + shifts (insert-if-absent) ———

function seedPeriodAndShifts(): void {
  const periods = readJsonSafe<RosterPeriod[]>(M05_STORAGE_KEYS.periods, []);
  const alreadySeeded = periods.some((p) => p.seedBatchId === M05_SEED_BATCH_ID);
  if (alreadySeeded) return;

  const now = new Date().toISOString();
  const period = buildDemoPeriod(now);
  periods.push(period);
  writeJsonSafe(M05_STORAGE_KEYS.periods, periods);

  const shifts = readJsonSafe<Shift[]>(M05_STORAGE_KEYS.shifts, []);
  const demoShifts = buildDemoShifts(now, period.id);
  shifts.push(...demoShifts);
  writeJsonSafe(M05_STORAGE_KEYS.shifts, shifts);
}

// ——— Seed default policy (insert-if-absent) ———

function seedDefaultPolicy(): void {
  const policies = readJsonSafe<ConflictPolicy[]>(M05_STORAGE_KEYS.policies, []);
  const alreadySeeded = policies.some(
    (p) => (p as ConflictPolicy & { seedBatchId?: string }).createdBy === "seed"
  );
  if (alreadySeeded) return;
  const now = new Date().toISOString();
  const policy = buildDefaultConflictPolicy(now);
  policies.push(policy);
  writeJsonSafe(M05_STORAGE_KEYS.policies, policies);
}

// ——— Public API ———

export function runM05PortalSeed(): boolean {
  ensureM05Bootstrapped();
  return runMigrationOnce(M05_SEED_MIGRATION_ID, 1, () => {
    seedPeriodAndShifts();
    notifyM05BootstrapListeners();
  });
}

export function runM05PolicySeed(): boolean {
  ensureM05Bootstrapped();
  return runMigrationOnce(M05_POLICY_MIGRATION_ID, 1, () => {
    seedDefaultPolicy();
    notifyM05BootstrapListeners();
  });
}
