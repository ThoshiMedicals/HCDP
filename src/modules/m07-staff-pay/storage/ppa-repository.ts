/**
 * PPA-1 — PriorPeriodAdjustment persistence via existing adjustments storage key.
 * Does not modify keys.ts / migrations; uses M07_STORAGE_KEYS.adjustments as-is.
 *
 * Note: platform writeJsonSafe is not transactional across keys. Callers must
 * validate pre-write and verify post-write consistency (see ppa-service).
 */

import { readJsonSafe, uid, writeJsonSafe } from "@/platform/storage/storage";
import { M07_STORAGE_KEYS } from "./keys";
import type { PriorPeriodAdjustment } from "../types/domain";

/** Test-only: force the next N PPA case upserts to fail (PPA-1 atomicity injection). */
let __ppaCaseWriteFailRemaining = 0;
/** Test-only: after a successful case write, corrupt linkage for consistency-verify tests. */
let __ppaCorruptAfterWrite = false;

function allowPpaRepoTestHooks(): boolean {
  return typeof process === "undefined" || process.env.NODE_ENV !== "production";
}

/**
 * Test-only. No-ops when NODE_ENV === "production".
 * Causes the next `count` calls to `upsertPriorPeriodAdjustment` to throw before persistence.
 */
export function __setPpaCaseWriteFailForTests(count: number): void {
  if (!allowPpaRepoTestHooks()) return;
  __ppaCaseWriteFailRemaining = Math.max(0, Math.floor(count));
}

/**
 * Test-only. When true, the next successful case upsert writes a deliberately
 * inconsistent `adjustmentPeriodId` so post-write consistency verification fails.
 */
export function __setPpaCorruptAfterWriteForTests(corrupt: boolean): void {
  if (!allowPpaRepoTestHooks()) return;
  __ppaCorruptAfterWrite = corrupt;
}

export function __resetPpaRepositoryTestHooks(): void {
  __ppaCaseWriteFailRemaining = 0;
  __ppaCorruptAfterWrite = false;
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

export function upsertPriorPeriodAdjustment(
  row: PriorPeriodAdjustment
): PriorPeriodAdjustment {
  if (__ppaCaseWriteFailRemaining > 0 && allowPpaRepoTestHooks()) {
    __ppaCaseWriteFailRemaining -= 1;
    throw new Error("m07-ppa-case-write-fail-for-tests");
  }
  let toStore = row;
  if (__ppaCorruptAfterWrite && allowPpaRepoTestHooks()) {
    __ppaCorruptAfterWrite = false;
    toStore = { ...row, adjustmentPeriodId: `${row.adjustmentPeriodId}__corrupt` };
  }
  const list = loadAll();
  const idx = list.findIndex((x) => x.id === toStore.id);
  if (idx >= 0) list[idx] = toStore;
  else list.push(toStore);
  saveAll(list);
  return toStore;
}
