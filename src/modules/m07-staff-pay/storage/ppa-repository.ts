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
  return (
    loadAll().find(
      (r) => r.legalEntityId === legalEntityId && r.idempotencyKey === idempotencyKey
    ) ?? null
  );
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
  const list = loadAll();
  const idx = list.findIndex((x) => x.id === row.id);
  if (idx >= 0) list[idx] = row;
  else list.push(row);
  saveAll(list);
  return row;
}
