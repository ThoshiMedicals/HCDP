/**
 * Insert-if-missing M06 portal + policy seeds. Never overwrite by id.
 */

import { writeJsonSafe } from "@/platform/storage/storage";
import { runMigrationOnce } from "@/platform/storage/storage";
import type { AttendanceSession, MigrationReport } from "../types/domain";
import { DEFAULT_POLICY } from "../types/policy";
import {
  listSessions,
  upsertDevice,
  upsertPolicy,
  upsertSession,
  newDeviceId,
  newPolicyId,
  newSessionId,
} from "../repository/local-store";
import { M06_POLICY_SEED_ID, M06_SEED_BATCH_ID, M06_STORAGE_KEYS } from "./keys";

const DEMO_CLINIC = "loc_baldhills";
const DEMO_PERSON = "person_demo_001";

export function runM06PortalSeed(): MigrationReport {
  const inserted: Record<string, number> = { sessions: 0, devices: 0 };
  const skipped: Record<string, number> = { sessions: 0, devices: 0 };
  const existing = listSessions().find((s) => s.id === "ats-seed-demo-1");
  if (existing) {
    skipped.sessions = 1;
  } else {
    const now = new Date().toISOString();
    const session: AttendanceSession = {
      id: "ats-seed-demo-1",
      personId: DEMO_PERSON,
      clinicId: DEMO_CLINIC,
      state: "closed",
      version: 1,
      rostered: true,
      shiftId: "shf-demo-seed",
      openedAt: {
        timeZoneId: "Australia/Brisbane",
        localCivil: "2026-07-20T09:00",
        occurredAtUtc: "2026-07-20T23:00:00.000Z",
        offsetMinutes: 600,
        fold: 0,
      },
      closedAt: {
        timeZoneId: "Australia/Brisbane",
        localCivil: "2026-07-20T17:00",
        occurredAtUtc: "2026-07-21T07:00:00.000Z",
        offsetMinutes: 600,
        fold: 0,
      },
      seedBatchId: M06_SEED_BATCH_ID,
      createdAt: now,
      updatedAt: now,
    };
    upsertSession(session);
    inserted.sessions = 1;
  }

  const deviceId = "dev-seed-kiosk-1";
  upsertDevice({
    id: deviceId,
    clinicId: DEMO_CLINIC,
    label: "Bald Hills Kiosk",
    revoked: false,
    seedBatchId: M06_SEED_BATCH_ID,
    createdAt: new Date().toISOString(),
  });
  inserted.devices = 1;

  const report: MigrationReport = {
    at: new Date().toISOString(),
    seedBatchId: M06_SEED_BATCH_ID,
    inserted,
    skipped,
  };
  writeJsonSafe(`${M06_STORAGE_KEYS.meta}.seedReport`, report);
  return report;
}

export function runM06PolicySeed(): void {
  runMigrationOnce(M06_POLICY_SEED_ID, 1, () => {
    const now = new Date().toISOString();
    upsertPolicy({
      id: "apol-seed-bald-hills",
      clinicId: DEMO_CLINIC,
      ...DEFAULT_POLICY,
      state: "published",
      publishedAt: now,
      seedBatchId: M06_SEED_BATCH_ID,
      createdAt: now,
      updatedAt: now,
    });
  });
}

/** Ensure seed helpers remain available for tests that need fresh ids. */
export function allocateSeedIds() {
  return { sessionId: newSessionId(), policyId: newPolicyId(), deviceId: newDeviceId() };
}
