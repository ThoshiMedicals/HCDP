/**
 * M06 → M05 shift/assignment/publication reads.
 * BOUNDARY: must NOT import m05-roster/repository.
 * Uses platform demo ShiftRef and optional readJsonSafe of pulse.m05 keys.
 */

import { readJsonSafe } from "@/platform/storage/storage";
import type { ShiftRef } from "@/platform/workforce/contracts/shift-ref";
import type { AssignmentRef } from "@/platform/workforce/contracts/assignment-ref";

export type PublishedAssignmentSnapshot = {
  assignmentId: string;
  shiftId: string;
  personId: string;
  clinicId: string;
  published: boolean;
  localStart?: string;
  localEnd?: string;
  publicationVersion?: number;
};

let demoShift: ShiftRef | null = null;

export async function ensureShiftReadWarmed(): Promise<void> {
  try {
    const mod = await import("@/platform/workforce/demo");
    demoShift = (mod as { DEMO_SHIFT?: ShiftRef }).DEMO_SHIFT ?? null;
  } catch {
    demoShift = null;
  }
}

export function getShiftRef(shiftId: string): ShiftRef | null {
  if (demoShift?.recordId === shiftId) return demoShift;
  return null;
}

function loadPublishedAssignmentSnapshots(): PublishedAssignmentSnapshot[] {
  // Prefer live M05 publication-linked assignments via storage keys (read-only).
  const assignments = readJsonSafe<
    Array<{
      id: string;
      shiftId: string;
      personId: string;
      clinicId: string;
      state?: string;
      publicationId?: string;
    }>
  >("pulse.m05.roster.assignments", []);
  const shifts = readJsonSafe<
    Array<{
      id: string;
      clinicId: string;
      localStart?: string;
      localEnd?: string;
      localStartYmd?: string;
      localStartHm?: string;
      localEndYmd?: string;
      localEndHm?: string;
    }>
  >("pulse.m05.roster.shifts", []);
  const pubs = readJsonSafe<Array<{ id: string; publicationVersion?: number; state?: string }>>(
    "pulse.m05.roster.publications",
    []
  );

  const out: PublishedAssignmentSnapshot[] = [];
  for (const a of assignments) {
    if (a.state && !["assigned", "published", "active"].includes(a.state) && !a.publicationId) continue;
    const shift = shifts.find((s) => s.id === a.shiftId);
    const pub = a.publicationId ? pubs.find((p) => p.id === a.publicationId) : undefined;
    out.push({
      assignmentId: a.id,
      shiftId: a.shiftId,
      personId: a.personId,
      clinicId: a.clinicId ?? shift?.clinicId ?? "",
      published: Boolean(a.publicationId) || pub != null,
      localStart:
        shift?.localStart ??
        (shift?.localStartYmd && shift?.localStartHm
          ? `${shift.localStartYmd}T${shift.localStartHm}`
          : undefined),
      localEnd:
        shift?.localEnd ??
        (shift?.localEndYmd && shift?.localEndHm ? `${shift.localEndYmd}T${shift.localEndHm}` : undefined),
      publicationVersion: pub?.publicationVersion,
    });
  }
  return out;
}

export function listPublishedAssignmentsForPerson(personId: string): PublishedAssignmentSnapshot[] {
  const out = loadPublishedAssignmentSnapshots().filter((a) => a.personId === personId);

  if (!out.length && demoShift && demoShift.personId === personId) {
    out.push({
      assignmentId: `asn-demo-for-${demoShift.recordId}`,
      shiftId: demoShift.recordId,
      personId,
      clinicId: demoShift.clinicId ?? "chapel-hill",
      published: Boolean(demoShift.published),
      localStart: demoShift.startsAt,
      localEnd: demoShift.endsAt,
    });
  }
  return out;
}

/** Clinic-scoped published assignments for roster-vs-attendance reconcile. */
export function listPublishedAssignmentsForClinic(clinicId: string): PublishedAssignmentSnapshot[] {
  return loadPublishedAssignmentSnapshots().filter((a) => a.clinicId === clinicId && a.published);
}

export function getAssignmentRef(_id: string): AssignmentRef | null {
  return null;
}

export const M06_SHIFT_READ_SOURCE = "platform-demo-and-m05-keys-readonly" as const;
