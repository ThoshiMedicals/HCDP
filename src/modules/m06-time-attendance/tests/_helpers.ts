/**
 * Shared test helpers for M06.
 */

import {
  clearClinicTimezoneOverridesForTests,
  registerClinicTimezone,
} from "@/platform/workforce/services/clinic-timezone";
import { clearM06LocalStoreCacheForTests } from "../repository/local-store";
import { resetM06BootstrapCacheForTests } from "../storage/bootstrap";
import { runM06StorageMigrations } from "../storage/migrations";
import { runM06SchemaV2Migration } from "../storage/migrate-v2";
import type { M06Actor } from "../permissions";
import { M06_PERMISSION_CODES } from "../permissions";

export const CLINIC = "clinic_m06_a";
export const CLINIC_B = "clinic_m06_b";

export function installMemoryLocalStorage() {
  const map = new Map<string, string>();
  const storage = {
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string) => {
      map.set(k, String(v));
    },
    removeItem: (k: string) => {
      map.delete(k);
    },
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    get length() {
      return map.size;
    },
  } as Storage;
  (globalThis as { localStorage?: Storage }).localStorage = storage;
  (globalThis as { window?: { localStorage: Storage } }).window = { localStorage: storage };
}

export function resetM06TestEnv() {
  installMemoryLocalStorage();
  clearClinicTimezoneOverridesForTests();
  registerClinicTimezone(CLINIC, "Australia/Brisbane");
  registerClinicTimezone(CLINIC_B, "Pacific/Auckland");
  clearM06LocalStoreCacheForTests();
  resetM06BootstrapCacheForTests();
  runM06StorageMigrations();
  runM06SchemaV2Migration();
}

export function actorAll(userId = "u-manager"): M06Actor {
  return { userId, personId: userId, permissions: ["*", ...M06_PERMISSION_CODES], clinicIds: undefined };
}

export function actorWorker(userId = "u-worker"): M06Actor {
  return {
    userId,
    personId: userId,
    permissions: [
      "attendance.view.self",
      "attendance.clock.self",
      "attendance.break.self",
      "attendance.declare",
      "attendance.correction.request",
      "attendance.timesheet.view",
      "attendance.timesheet.generate",
      "attendance.timesheet.submit",
      "attendance.sync.resolve",
    ],
    clinicIds: [CLINIC],
  };
}

export function actorManager(userId = "u-mgr"): M06Actor {
  return {
    userId,
    personId: userId,
    permissions: M06_PERMISSION_CODES.filter(
      (c) =>
        c !== "attendance.override" &&
        c !== "attendance.evidence.view" &&
        c !== "attendance.audit.view" &&
        c !== "attendance.policy.manage"
    ),
    clinicIds: [CLINIC],
  };
}
