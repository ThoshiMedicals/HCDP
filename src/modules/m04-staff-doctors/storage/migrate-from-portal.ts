/**
 * Idempotent portal → M04 people seed (m04-workforce-portal-seed-v1).
 *
 * Rules:
 * - Snapshot counts from HTML_STAFF / HTML_DOCTORS (extracted mock data).
 * - Migrate to people with legacyId = original id; retain identifiers.
 * - Write people if empty OR if migration flag not set.
 * - Do NOT write portal records.staff / records.doctors (legacy remains read-only).
 *
 * Rollback:
 * 1. Clear pulse.m04.workforce.* keys (people, meta, engagements, …).
 * 2. Clear migration flag `m04-workforce-portal-seed-v1` from pulse.platform.migrations.
 * 3. Legacy JSON / portal records remain untouched.
 */

import { HTML_DOCTORS, HTML_STAFF } from "@/lib/mock/data";
import {
  hasMigration,
  readJsonSafe,
  runMigrationOnce,
  writeJsonSafe,
  uid,
} from "@/platform/storage/storage";
import type { MigrationReport, WorkforcePerson, WorkforcePersonStatus } from "../types/domain";
import {
  M04_PORTAL_SEED_MIGRATION_ID,
  M04_PORTAL_SEED_VERSION,
  M04_STORAGE_KEYS,
} from "./keys";
import { seedM04StorageSkeleton } from "./migrations";

const DEFAULT_ORG = "org_parent";

function mapStatus(raw: unknown): WorkforcePersonStatus {
  const s = String(raw ?? "Active").toLowerCase();
  if (s === "suspended") return "Suspended";
  if (s === "archived" || s === "inactive") return "Archived";
  if (s === "pending" || s === "onboarding") return "Onboarding";
  if (s === "offboarding") return "Offboarding";
  return "Active";
}

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : v == null ? fallback : String(v);
}

function clinicIdsFromRow(row: Record<string, unknown>): string[] {
  const locs = row.locations;
  if (Array.isArray(locs)) {
    return locs.map((x) => asString(x)).filter(Boolean);
  }
  const loc = asString(row.location);
  return loc ? [loc] : [];
}

function rowToPerson(
  row: Record<string, unknown>,
  kind: "staff" | "doctor",
  now: string
): WorkforcePerson | null {
  const legacyId = asString(row.id);
  if (!legacyId) return null;
  const preferredName = asString(row.name).trim();
  const email = asString(row.email).trim().toLowerCase();
  if (!preferredName) return null;

  return {
    id: uid(kind === "doctor" ? "wpd" : "wps"),
    legacyId,
    personKind: kind,
    preferredName,
    email,
    status: mapStatus(row.status),
    clinicIds: clinicIdsFromRow(row),
    organisationId: DEFAULT_ORG,
    createdAt: asString(row.createdAt, now),
    updatedAt: asString(row.updatedAt, now),
    version: 1,
    phone: asString(row.contactNo || row.mobile) || undefined,
    roleLabel: asString(row.role || row.sourceDesignation) || (kind === "doctor" ? "Doctor" : undefined),
  };
}

export function buildPortalSeedPeople(now = new Date().toISOString()): {
  people: WorkforcePerson[];
  report: MigrationReport;
} {
  const staffRows = HTML_STAFF as Array<Record<string, unknown>>;
  const doctorRows = HTML_DOCTORS as Array<Record<string, unknown>>;
  const sourceCount = staffRows.length + doctorRows.length;

  const people: WorkforcePerson[] = [];
  const warnings: string[] = [];
  const unresolved: string[] = [];
  let rejected = 0;
  let duplicates = 0;
  const seenLegacy = new Set<string>();
  const seenEmailName = new Set<string>();

  const ingest = (rows: Array<Record<string, unknown>>, kind: "staff" | "doctor") => {
    for (const row of rows) {
      const person = rowToPerson(row, kind, now);
      if (!person) {
        rejected += 1;
        unresolved.push(`${kind}:${asString(row.id) || "unknown"}`);
        continue;
      }
      if (seenLegacy.has(person.legacyId!)) {
        duplicates += 1;
        warnings.push(`Duplicate legacyId skipped: ${person.legacyId}`);
        continue;
      }
      const key = `${person.preferredName.toLowerCase()}|${person.email}`;
      if (person.email && seenEmailName.has(key)) {
        duplicates += 1;
        warnings.push(`Duplicate name+email skipped: ${person.preferredName} <${person.email}>`);
        continue;
      }
      seenLegacy.add(person.legacyId!);
      if (person.email) seenEmailName.add(key);
      people.push(person);
    }
  };

  ingest(staffRows, "staff");
  ingest(doctorRows, "doctor");

  return {
    people,
    report: {
      migrationId: M04_PORTAL_SEED_MIGRATION_ID,
      sourceCount,
      migratedCount: people.length,
      duplicates,
      rejected,
      warnings,
      unresolved,
      ranAt: now,
    },
  };
}

/**
 * Run portal seed once. Writes people when collection is empty OR migration flag unset.
 * Never mutates portal records.
 */
export function migrateFromPortalOnce(): MigrationReport | null {
  if (typeof window === "undefined") return null;

  seedM04StorageSkeleton();

  const existingPeople = readJsonSafe<WorkforcePerson[]>(M04_STORAGE_KEYS.people, []);
  const alreadySeeded = hasMigration(M04_PORTAL_SEED_MIGRATION_ID, M04_PORTAL_SEED_VERSION);

  if (alreadySeeded && existingPeople.length > 0) {
    return null;
  }

  let report: MigrationReport | null = null;

  const ran = runMigrationOnce(M04_PORTAL_SEED_MIGRATION_ID, M04_PORTAL_SEED_VERSION, () => {
    const current = readJsonSafe<WorkforcePerson[]>(M04_STORAGE_KEYS.people, []);
    const { people, report: built } = buildPortalSeedPeople();
    report = built;
    if (current.length === 0) {
      writeJsonSafe(M04_STORAGE_KEYS.people, people);
    } else {
      // Flag was missing but people already present — do not overwrite.
      report = {
        ...built,
        migratedCount: 0,
        warnings: [
          ...built.warnings,
          "People collection already populated; portal seed skipped write (flag stamped only).",
        ],
      };
    }
    writeJsonSafe(`${M04_STORAGE_KEYS.meta}.portalSeedReport`, report);
  });

  if (!ran) return null;
  return report;
}

/** Test/helper: clear M04 workforce keys + portal seed flag. Does not touch legacy JSON. */
export function rollbackPortalSeedForTests(clearMigrationFlag: (id: string) => void): void {
  for (const key of Object.values(M04_STORAGE_KEYS)) {
    writeJsonSafe(key, key === M04_STORAGE_KEYS.meta ? null : []);
  }
  clearMigrationFlag(M04_PORTAL_SEED_MIGRATION_ID);
}
