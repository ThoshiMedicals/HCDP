/**
 * M07 → M05 published roster reads for variance context.
 * BOUNDARY: readJsonSafe only — no M05 repository imports; no writes.
 */

import { readJsonSafe } from "@/platform/storage/storage";

const ASSIGNMENTS_KEY = "pulse.m05.roster.assignments";
const SHIFTS_KEY = "pulse.m05.roster.shifts";
const PUBLICATIONS_KEY = "pulse.m05.roster.publications";

export type M05PublishedAssignmentView = {
  assignmentId: string;
  shiftId: string;
  personId: string;
  clinicId?: string;
  state?: string;
  publicationId?: string;
  readOnly: true;
};

export type M05PublishedShiftView = {
  shiftId: string;
  clinicId?: string;
  localStart?: string;
  localEnd?: string;
  readOnly: true;
};

export function listPublishedAssignmentsForPerson(personId: string): M05PublishedAssignmentView[] {
  const assignments = readJsonSafe<Array<Record<string, unknown>>>(ASSIGNMENTS_KEY, []);
  const publications = readJsonSafe<Array<Record<string, unknown>>>(PUBLICATIONS_KEY, []);
  const publishedIds = new Set(
    publications.filter((p) => p.state === "published").map((p) => String(p.id))
  );
  return assignments
    .filter((a) => a.personId === personId)
    .filter((a) => !a.publicationId || publishedIds.has(String(a.publicationId)))
    .map((a) => ({
      assignmentId: String(a.id),
      shiftId: String(a.shiftId),
      personId: String(a.personId),
      clinicId: a.clinicId ? String(a.clinicId) : undefined,
      state: a.state ? String(a.state) : undefined,
      publicationId: a.publicationId ? String(a.publicationId) : undefined,
      readOnly: true as const,
    }));
}

export function getPublishedShift(shiftId: string): M05PublishedShiftView | null {
  const shifts = readJsonSafe<Array<Record<string, unknown>>>(SHIFTS_KEY, []);
  const shift = shifts.find((s) => String(s.id) === shiftId);
  if (!shift) return null;
  return {
    shiftId: String(shift.id),
    clinicId: shift.clinicId ? String(shift.clinicId) : undefined,
    localStart: shift.localStart ? String(shift.localStart) : undefined,
    localEnd: shift.localEnd ? String(shift.localEnd) : undefined,
    readOnly: true,
  };
}

export const M07_M05_ROSTER_READ_SOURCE = "pulse.m05.roster.*" as const;
