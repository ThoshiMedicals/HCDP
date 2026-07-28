/**
 * M07 → M04 leave reads.
 * BOUNDARY: must NOT import m04-staff-doctors repositories or services.
 * Reads approved leave via platform storage key contract + test injection.
 */

import { readJsonSafe } from "@/platform/storage/storage";

/** M04 leave storage key — platform storage register; not an M04 repository import. */
const M04_LEAVE_KEY = "pulse.m04.workforce.leave";
const M04_PEOPLE_KEY = "pulse.m04.workforce.people";

export type M04ApprovedLeaveView = {
  leaveRecordId: string;
  personId: string;
  organisationId: string;
  clinicId?: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: "Approved";
  version: number;
  readOnly: true;
  source: "m04-adapter";
};

export type M04PersonKindView = {
  personId: string;
  personKind?: string;
  organisationId?: string;
  clinicIds?: string[];
  displayLabel?: string;
  classificationHint?: string | null;
};

type StoredLeave = {
  id: string;
  personId: string;
  organisationId: string;
  clinicId?: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: string;
  version: number;
};

type StoredPerson = {
  id: string;
  personKind?: string;
  organisationId?: string;
  clinicIds?: string[];
  preferredName?: string;
  roleLabel?: string;
};

const testLeaves = new Map<string, M04ApprovedLeaveView>();
const testPeopleExtra = new Map<string, M04PersonKindView>();

export function resetM04LeaveReadForTests(): void {
  testLeaves.clear();
  testPeopleExtra.clear();
}

export function injectTestApprovedLeave(view: M04ApprovedLeaveView): void {
  testLeaves.set(view.leaveRecordId, view);
}

export function injectTestPersonKind(view: M04PersonKindView): void {
  testPeopleExtra.set(view.personId, view);
}

function inclusiveLeaveDays(startDate: string, endDate: string): number {
  const a = Date.parse(`${startDate}T00:00:00.000Z`);
  const b = Date.parse(`${endDate}T00:00:00.000Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return 0;
  return Math.floor((b - a) / 86400000) + 1;
}

export function computeInclusiveLeaveDays(startDate: string, endDate: string): number {
  return inclusiveLeaveDays(startDate, endDate);
}

/** Approved leave only — Pending/Rejected/Cancelled never returned. */
export function listApprovedLeaveForPerson(input: {
  personId: string;
  organisationId: string;
  periodStart?: string;
  periodEnd?: string;
}): M04ApprovedLeaveView[] {
  const fromStore = readJsonSafe<StoredLeave[]>(M04_LEAVE_KEY, [])
    .filter((l) => l.status === "Approved")
    .filter((l) => l.personId === input.personId)
    .filter((l) => l.organisationId === input.organisationId)
    .map(
      (l): M04ApprovedLeaveView => ({
        leaveRecordId: l.id,
        personId: l.personId,
        organisationId: l.organisationId,
        clinicId: l.clinicId,
        leaveType: l.leaveType,
        startDate: l.startDate,
        endDate: l.endDate,
        status: "Approved",
        version: l.version,
        readOnly: true,
        source: "m04-adapter",
      })
    );

  const injected = [...testLeaves.values()].filter(
    (l) => l.personId === input.personId && l.organisationId === input.organisationId
  );

  const merged = new Map<string, M04ApprovedLeaveView>();
  for (const row of [...fromStore, ...injected]) merged.set(row.leaveRecordId, row);

  let rows = [...merged.values()];
  if (input.periodStart && input.periodEnd) {
    rows = rows.filter(
      (l) => l.startDate <= input.periodEnd! && l.endDate >= input.periodStart!
    );
  }
  return rows;
}

export function getApprovedLeaveById(
  leaveRecordId: string,
  organisationId: string
): M04ApprovedLeaveView | null {
  const injected = testLeaves.get(leaveRecordId);
  if (injected) {
    return injected.organisationId === organisationId ? injected : null;
  }
  const row = readJsonSafe<StoredLeave[]>(M04_LEAVE_KEY, []).find((l) => l.id === leaveRecordId);
  if (!row || row.status !== "Approved") return null;
  if (row.organisationId !== organisationId) return null;
  return {
    leaveRecordId: row.id,
    personId: row.personId,
    organisationId: row.organisationId,
    clinicId: row.clinicId,
    leaveType: row.leaveType,
    startDate: row.startDate,
    endDate: row.endDate,
    status: "Approved",
    version: row.version,
    readOnly: true,
    source: "m04-adapter",
  };
}

/** Read-only personKind enrichment from M04 people storage (no repository import). */
export function readM04PersonKind(personId: string): M04PersonKindView | null {
  const injected = testPeopleExtra.get(personId);
  if (injected) return injected;
  const row = readJsonSafe<StoredPerson[]>(M04_PEOPLE_KEY, []).find((p) => p.id === personId);
  if (!row) return null;
  return {
    personId: row.id,
    personKind: row.personKind,
    organisationId: row.organisationId,
    clinicIds: row.clinicIds,
    displayLabel: row.preferredName ?? row.roleLabel,
  };
}

export const M07_M04_LEAVE_READ_SOURCE = "platform-storage-key+test-injection" as const;
