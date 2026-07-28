/**
 * Seed-owned rollback only — removes rows tagged with M06 seed batch id.
 */

import { readJsonSafe, writeJsonSafe } from "@/platform/storage/storage";
import { clearM06LocalStoreCacheForTests } from "../repository/local-store";
import { M06_SEED_BATCH_ID, M06_STORAGE_KEYS } from "./keys";

function stripSeed<T extends { seedBatchId?: string }>(key: string): number {
  const list = readJsonSafe<T[]>(key, []);
  const next = list.filter((row) => row.seedBatchId !== M06_SEED_BATCH_ID);
  const removed = list.length - next.length;
  writeJsonSafe(key, next);
  return removed;
}

export function rollbackSeedOwnedM06(clearFlag = true): Record<string, number> {
  const removed: Record<string, number> = {};
  for (const [name, key] of Object.entries(M06_STORAGE_KEYS)) {
    if (name === "meta") continue;
    removed[name] = stripSeed(key);
  }
  if (clearFlag) {
    writeJsonSafe(`${M06_STORAGE_KEYS.meta}.seedReport`, null);
  }
  clearM06LocalStoreCacheForTests();
  return removed;
}
