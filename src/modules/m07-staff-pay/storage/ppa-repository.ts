/**
 * PPA-1 — PriorPeriodAdjustment persistence via existing adjustments storage key.
 * Does not modify keys.ts / migrations; uses M07_STORAGE_KEYS.adjustments as-is.
 *
 * Note: platform writeJsonSafe is not transactional across keys. Callers must
 * validate pre-write and verify post-write consistency (see ppa-service).
 *
 * One-open-PPA (QA-PPA1-002): storage-level uniqueness on upsert + in-process
 * create serialization gate. Pre-write service checks alone are insufficient.
 */

import { readJsonSafe, uid, writeJsonSafe } from "@/platform/storage/storage";
import { M07_STORAGE_KEYS } from "./keys";
import type { PriorPeriodAdjustment } from "../types/domain";
import { areM07TestHooksAllowed } from "../testing/m07-test-hooks-gate";

/** Test-only: force the next N PPA case upserts to fail (PPA-1 atomicity injection). */
let __ppaCaseWriteFailRemaining = 0;
/** Test-only: after a successful case write, corrupt linkage for consistency-verify tests. */
let __ppaCorruptAfterWrite = false;
/** Test-only: nested callback fired while a create gate is held (genuine interleave). */
let __ppaCreateInterleaveHook: ((phase: "after-open-claim") => void) | null = null;

/**
 * In-process serialization for open-PPA create against a source period.
 * Prevents TOCTOU where two callers both pass pre-write checks before either writes.
 */
const openPpaCreateGates = new Set<string>();

export class PpaOpenUniquenessError extends Error {
  readonly reason = "duplicate-open-ppa";
  constructor(message: string) {
    super(message);
    this.name = "PpaOpenUniquenessError";
  }
}

/**
 * Test-only. No-ops unless `areM07TestHooksAllowed()`.
 * Causes the next `count` calls to `upsertPriorPeriodAdjustment` to throw before persistence.
 */
export function __setPpaCaseWriteFailForTests(count: number): void {
  if (!areM07TestHooksAllowed()) return;
  __ppaCaseWriteFailRemaining = Math.max(0, Math.floor(count));
}

/**
 * Test-only. When true, the next successful case upsert writes a deliberately
 * inconsistent `adjustmentPeriodId` so post-write consistency verification fails.
 */
export function __setPpaCorruptAfterWriteForTests(corrupt: boolean): void {
  if (!areM07TestHooksAllowed()) return;
  __ppaCorruptAfterWrite = corrupt;
}

/**
 * Test-only. Invoked once after an open-create gate is claimed and storage re-checked,
 * before period/case writes — used to nest a competing create (genuine interleave).
 */
export function __setPpaCreateInterleaveHookForTests(
  hook: ((phase: "after-open-claim") => void) | null
): void {
  if (!areM07TestHooksAllowed()) return;
  __ppaCreateInterleaveHook = hook;
}

export function __resetPpaRepositoryTestHooks(): void {
  __ppaCaseWriteFailRemaining = 0;
  __ppaCorruptAfterWrite = false;
  __ppaCreateInterleaveHook = null;
  openPpaCreateGates.clear();
}

function loadAll(): PriorPeriodAdjustment[] {
  const raw = readJsonSafe<PriorPeriodAdjustment[]>(M07_STORAGE_KEYS.adjustments, []);
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (r) => r && typeof r === "object" && typeof (r as PriorPeriodAdjustment).id === "string"
  );
}

function saveAll(items: PriorPeriodAdjustment[]): void {
  writeJsonSafe(M07_STORAGE_KEYS.adjustments, items);
}

export function newPriorPeriodAdjustmentId(): string {
  return uid("ppa");
}

export function listPriorPeriodAdjustments(legalEntityId?: string): PriorPeriodAdjustment[] {
  const all = loadAll();
  return legalEntityId ? all.filter((r) => r.legalEntityId === legalEntityId) : all;
}

export function getPriorPeriodAdjustment(id: string): PriorPeriodAdjustment | null {
  return loadAll().find((r) => r.id === id) ?? null;
}

export function findPriorPeriodAdjustmentByIdempotencyKey(
  legalEntityId: string,
  idempotencyKey: string
): PriorPeriodAdjustment | null {
  const matches = loadAll().filter(
    (r) => r.legalEntityId === legalEntityId && r.idempotencyKey === idempotencyKey
  );
  if (!matches.length) return null;
  return matches.find((r) => r.status !== "cancelled") ?? matches[0] ?? null;
}

export function findOpenPriorPeriodAdjustmentForSource(
  sourcePeriodId: string
): PriorPeriodAdjustment | null {
  return (
    loadAll().find((r) => r.sourcePeriodId === sourcePeriodId && r.status !== "cancelled") ?? null
  );
}

/**
 * Storage-level uniqueness: refuse to persist a second non-cancelled PPA for the same source.
 * Enforced on every production write path through this repository (not UI-only).
 */
function assertNoOtherOpenForSource(list: PriorPeriodAdjustment[], row: PriorPeriodAdjustment): void {
  if (row.status === "cancelled") return;
  const other = list.find(
    (r) =>
      r.sourcePeriodId === row.sourcePeriodId &&
      r.status !== "cancelled" &&
      r.id !== row.id
  );
  if (other) {
    throw new PpaOpenUniquenessError(
      `An open PPA already exists for source period ${row.sourcePeriodId}`
    );
  }
}

export function upsertPriorPeriodAdjustment(
  row: PriorPeriodAdjustment
): PriorPeriodAdjustment {
  if (__ppaCaseWriteFailRemaining > 0 && areM07TestHooksAllowed()) {
    __ppaCaseWriteFailRemaining -= 1;
    throw new Error("m07-ppa-case-write-fail-for-tests");
  }
  let toStore = row;
  if (__ppaCorruptAfterWrite && areM07TestHooksAllowed()) {
    __ppaCorruptAfterWrite = false;
    toStore = { ...row, adjustmentPeriodId: `${row.adjustmentPeriodId}__corrupt` };
  }

  // Load → uniqueness check → merge → re-check → save (single-key write for adjustments).
  const list = loadAll();
  assertNoOtherOpenForSource(list, toStore);
  const idx = list.findIndex((x) => x.id === toStore.id);
  if (idx >= 0) list[idx] = toStore;
  else list.push(toStore);
  assertNoOtherOpenForSource(
    list.filter((x) => x.id !== toStore.id),
    toStore
  );
  saveAll(list);

  // Post-write invariant: at most one open case per source.
  const opens = loadAll().filter(
    (r) => r.sourcePeriodId === toStore.sourcePeriodId && r.status !== "cancelled"
  );
  if (opens.length > 1) {
    throw new PpaOpenUniquenessError(
      `Post-write open-PPA uniqueness violated for source ${toStore.sourcePeriodId}`
    );
  }
  return toStore;
}

/**
 * Serialize open-PPA creation for a source period within this JS realm.
 * Nested / overlapping creates for the same source fail closed with duplicate-open-ppa.
 */
export function withOpenPpaCreateGate<T>(sourcePeriodId: string, fn: () => T): T {
  if (openPpaCreateGates.has(sourcePeriodId)) {
    throw new PpaOpenUniquenessError(
      `An open PPA create is already in progress for source period ${sourcePeriodId}`
    );
  }
  openPpaCreateGates.add(sourcePeriodId);
  try {
    const existing = findOpenPriorPeriodAdjustmentForSource(sourcePeriodId);
    if (existing) {
      throw new PpaOpenUniquenessError(
        `An open PPA already exists for source period ${sourcePeriodId}`
      );
    }
    if (__ppaCreateInterleaveHook && areM07TestHooksAllowed()) {
      const hook = __ppaCreateInterleaveHook;
      __ppaCreateInterleaveHook = null; // one-shot
      hook("after-open-claim");
      const afterInterleave = findOpenPriorPeriodAdjustmentForSource(sourcePeriodId);
      if (afterInterleave) {
        throw new PpaOpenUniquenessError(
          `An open PPA already exists for source period ${sourcePeriodId}`
        );
      }
    }
    return fn();
  } finally {
    openPpaCreateGates.delete(sourcePeriodId);
  }
}

/** Diagnostics for tests — whether a create gate is currently held. */
export function __isOpenPpaCreateGateHeldForTests(sourcePeriodId: string): boolean {
  return openPpaCreateGates.has(sourcePeriodId);
}
