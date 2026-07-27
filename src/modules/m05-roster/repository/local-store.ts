/**
 * M05 local JSON store for all roster domain records.
 * Additive persistence on top of Wave 1 keys — never wipes existing data.
 *
 * Rules preserved from the Wave 4 plan:
 * - Publication bodies are immutable — `appendPublication` refuses duplicates.
 * - Assignment history is append-only — corrections create new rows.
 * - Audit is append-only.
 * - No cross-module repository imports.
 */

import { readJsonSafe, uid, writeJsonSafe } from "@/platform/storage/storage";
import type {
  Acknowledgement,
  ApprovedLeaveCacheRow,
  Assignment,
  CostForecast,
  CoverageRequirement,
  OpenShift,
  RosterAuditEntry,
  RosterAvailabilityDeclaration,
  RosterPeriod,
  RosterPublication,
  Shift,
  SwapRequest,
} from "../types/domain";
import type { ConflictPolicy } from "../types/policy";
import { M05_STORAGE_KEYS } from "../storage/keys";

function loadList<T>(key: string): T[] {
  return readJsonSafe<T[]>(key, []);
}

function saveList<T>(key: string, items: T[]): void {
  writeJsonSafe(key, items);
}

export function upsertById<T extends { id: string }>(key: string, item: T): T {
  const list = loadList<T>(key);
  const idx = list.findIndex((x) => x.id === item.id);
  if (idx >= 0) list[idx] = item;
  else list.push(item);
  saveList(key, list);
  return item;
}

// ——— UID helpers ———

export function newPeriodId(): string { return uid("prd"); }
export function newShiftId(): string { return uid("shf"); }
export function newAssignmentId(): string { return uid("asn"); }
export function newOpenShiftId(): string { return uid("osh"); }
export function newSwapRequestId(): string { return uid("swp"); }
export function newPublicationId(): string { return uid("pub"); }
export function newAcknowledgementId(): string { return uid("ack"); }
export function newCoverageRequirementId(): string { return uid("crq"); }
export function newPolicyId(): string { return uid("polc"); }
export function newCostForecastId(): string { return uid("cf"); }
export function newAuditId(): string { return uid("aud"); }
export function newAvailabilityId(): string { return uid("avl"); }
export function newLeaveCacheId(): string { return uid("lvc"); }

// ——— Periods ———

export function listPeriods(clinicId?: string): RosterPeriod[] {
  const all = loadList<RosterPeriod>(M05_STORAGE_KEYS.periods);
  return clinicId ? all.filter((p) => p.clinicId === clinicId) : all;
}

export function getPeriod(id: string): RosterPeriod | null {
  return listPeriods().find((p) => p.id === id) ?? null;
}

export function upsertPeriod(period: RosterPeriod): RosterPeriod {
  return upsertById(M05_STORAGE_KEYS.periods, period);
}

// ——— Shifts ———

export function listShifts(periodId?: string): Shift[] {
  const all = loadList<Shift>(M05_STORAGE_KEYS.shifts);
  return periodId ? all.filter((s) => s.rosterPeriodId === periodId) : all;
}

export function getShift(id: string): Shift | null {
  return listShifts().find((s) => s.id === id) ?? null;
}

export function upsertShift(shift: Shift): Shift {
  return upsertById(M05_STORAGE_KEYS.shifts, shift);
}

export function listShiftsForClinic(clinicId: string): Shift[] {
  return loadList<Shift>(M05_STORAGE_KEYS.shifts).filter((s) => s.clinicId === clinicId);
}

// ——— Assignments (append-only) ———

export function listAssignments(shiftId?: string): Assignment[] {
  const all = loadList<Assignment>(M05_STORAGE_KEYS.assignments);
  return shiftId ? all.filter((a) => a.shiftId === shiftId) : all;
}

export function listAssignmentsForPerson(personId: string): Assignment[] {
  return loadList<Assignment>(M05_STORAGE_KEYS.assignments).filter(
    (a) => a.personId === personId
  );
}

export function getAssignment(id: string): Assignment | null {
  return listAssignments().find((a) => a.id === id) ?? null;
}

/** Append-only: throw if id already exists (assignments are immutable history). */
export function appendAssignment(assignment: Assignment): Assignment {
  const list = loadList<Assignment>(M05_STORAGE_KEYS.assignments);
  if (list.some((a) => a.id === assignment.id)) {
    throw new Error(`Assignment ${assignment.id} already exists — assignments are append-only`);
  }
  list.push(assignment);
  saveList(M05_STORAGE_KEYS.assignments, list);
  return assignment;
}

/** Soft-update the state of a prior assignment (invalidated / replaced / cancelled / superseded). */
export function markAssignmentState(
  id: string,
  state: Assignment["state"],
  extra?: Partial<Pick<Assignment, "replacedById" | "invalidationReason" | "updatedAt">>
): void {
  const list = loadList<Assignment>(M05_STORAGE_KEYS.assignments);
  const idx = list.findIndex((a) => a.id === id);
  if (idx < 0) return;
  const now = new Date().toISOString();
  list[idx] = { ...list[idx]!, state, updatedAt: extra?.updatedAt ?? now, ...extra } as Assignment;
  saveList(M05_STORAGE_KEYS.assignments, list);
}

/**
 * Record publication provenance on an assignment (one-way write, does not
 * mutate the append-only state). Used by the publication service to link
 * assignments contained in a publication snapshot to the publication id.
 */
export function linkAssignmentToPublication(assignmentId: string, publicationId: string): void {
  const list = loadList<Assignment>(M05_STORAGE_KEYS.assignments);
  const idx = list.findIndex((a) => a.id === assignmentId);
  if (idx < 0) return;
  list[idx] = { ...list[idx]!, publicationId } as Assignment;
  saveList(M05_STORAGE_KEYS.assignments, list);
}

// ——— Open shifts ———

export function listOpenShifts(periodId?: string): OpenShift[] {
  const all = loadList<OpenShift>(M05_STORAGE_KEYS.openShifts);
  return periodId ? all.filter((o) => o.rosterPeriodId === periodId) : all;
}

export function getOpenShift(id: string): OpenShift | null {
  return listOpenShifts().find((o) => o.id === id) ?? null;
}

export function upsertOpenShift(item: OpenShift): OpenShift {
  return upsertById(M05_STORAGE_KEYS.openShifts, item);
}

// ——— Swap requests ———

export function listSwaps(periodId?: string): SwapRequest[] {
  const all = loadList<SwapRequest>(M05_STORAGE_KEYS.swaps);
  return periodId ? all.filter((s) => s.rosterPeriodId === periodId) : all;
}

export function getSwap(id: string): SwapRequest | null {
  return listSwaps().find((s) => s.id === id) ?? null;
}

export function upsertSwap(swap: SwapRequest): SwapRequest {
  return upsertById(M05_STORAGE_KEYS.swaps, swap);
}

// ——— Publications (immutable body) ———

export function listPublications(periodId?: string): RosterPublication[] {
  const all = loadList<RosterPublication>(M05_STORAGE_KEYS.publications);
  return periodId ? all.filter((p) => p.rosterPeriodId === periodId) : all;
}

export function getPublication(id: string): RosterPublication | null {
  return listPublications().find((p) => p.id === id) ?? null;
}

/** Append-only: publication bodies are immutable. */
export function appendPublication(pub: RosterPublication): RosterPublication {
  const list = loadList<RosterPublication>(M05_STORAGE_KEYS.publications);
  if (list.some((p) => p.id === pub.id)) {
    throw new Error(`Publication ${pub.id} already exists — publication bodies are immutable`);
  }
  list.push(pub);
  saveList(M05_STORAGE_KEYS.publications, list);
  return pub;
}

/**
 * Update derived acknowledgementStatus / supersedesId / supersededById / cancelReason
 * WITHOUT mutating the immutable assignment snapshot or warning summary body.
 */
export function updatePublicationRollUp(
  id: string,
  partial: Partial<
    Pick<
      RosterPublication,
      "acknowledgementStatus" | "supersededById" | "supersedesId" | "cancelReason"
    >
  >
): RosterPublication | null {
  const list = loadList<RosterPublication>(M05_STORAGE_KEYS.publications);
  const idx = list.findIndex((p) => p.id === id);
  if (idx < 0) return null;
  const next = { ...list[idx]!, ...partial } as RosterPublication;
  list[idx] = next;
  saveList(M05_STORAGE_KEYS.publications, list);
  return next;
}

// ——— Acknowledgements ———

export function listAcknowledgements(publicationId?: string): Acknowledgement[] {
  const all = loadList<Acknowledgement>(M05_STORAGE_KEYS.acknowledgements);
  return publicationId ? all.filter((a) => a.publicationId === publicationId) : all;
}

export function getAcknowledgement(id: string): Acknowledgement | null {
  return listAcknowledgements().find((a) => a.id === id) ?? null;
}

export function appendAcknowledgement(ack: Acknowledgement): Acknowledgement {
  const list = loadList<Acknowledgement>(M05_STORAGE_KEYS.acknowledgements);
  if (list.some((a) => a.id === ack.id)) {
    throw new Error(`Acknowledgement ${ack.id} already exists`);
  }
  list.push(ack);
  saveList(M05_STORAGE_KEYS.acknowledgements, list);
  return ack;
}

// ——— Coverage requirements ———

export function listCoverageRequirements(periodId?: string): CoverageRequirement[] {
  const all = loadList<CoverageRequirement>(M05_STORAGE_KEYS.coverageRequirements);
  return periodId ? all.filter((c) => c.rosterPeriodId === periodId) : all;
}

export function upsertCoverageRequirement(req: CoverageRequirement): CoverageRequirement {
  return upsertById(M05_STORAGE_KEYS.coverageRequirements, req);
}

// ——— Policies ———

export function listPolicies(organisationId?: string): ConflictPolicy[] {
  const all = loadList<ConflictPolicy>(M05_STORAGE_KEYS.policies);
  return organisationId ? all.filter((p) => p.organisationId === organisationId) : all;
}

export function getPolicy(id: string): ConflictPolicy | null {
  return listPolicies().find((p) => p.id === id) ?? null;
}

export function upsertPolicy(policy: ConflictPolicy): ConflictPolicy {
  return upsertById(M05_STORAGE_KEYS.policies, policy);
}

export function getActiveConflictPolicy(organisationId: string): ConflictPolicy | null {
  return (
    listPolicies(organisationId)
      .filter((p) => p.status === "published")
      .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))[0] ?? null
  );
}

// ——— Cost forecasts ———

export function listCostForecasts(periodId?: string): CostForecast[] {
  const all = loadList<CostForecast>(M05_STORAGE_KEYS.costForecasts);
  return periodId ? all.filter((c) => c.rosterPeriodId === periodId) : all;
}

export function upsertCostForecast(cf: CostForecast): CostForecast {
  return upsertById(M05_STORAGE_KEYS.costForecasts, cf);
}

// ——— Audit ———

export function listAudit(clinicId?: string): RosterAuditEntry[] {
  const all = loadList<RosterAuditEntry>(M05_STORAGE_KEYS.audit);
  return clinicId ? all.filter((a) => a.clinicId === clinicId) : all;
}

export function appendAuditEntry(entry: RosterAuditEntry): RosterAuditEntry {
  const list = loadList<RosterAuditEntry>(M05_STORAGE_KEYS.audit);
  list.push(entry);
  saveList(M05_STORAGE_KEYS.audit, list);
  return entry;
}

// ——— Availability declarations (roster preferences, NOT M04 leave SoT) ———

export function listAvailabilityDeclarations(personId?: string): RosterAvailabilityDeclaration[] {
  const all = loadList<RosterAvailabilityDeclaration>(M05_STORAGE_KEYS.availabilityDeclarations);
  return personId ? all.filter((d) => d.personId === personId) : all;
}

export function upsertAvailabilityDeclaration(
  declaration: RosterAvailabilityDeclaration
): RosterAvailabilityDeclaration {
  return upsertById(M05_STORAGE_KEYS.availabilityDeclarations, declaration);
}

// ——— M04-approved leave cache (populated ONLY via contract stub setters) ———

export function listApprovedLeaveCache(personId?: string): ApprovedLeaveCacheRow[] {
  const all = loadList<ApprovedLeaveCacheRow>(M05_STORAGE_KEYS.approvedLeaveCache);
  return personId ? all.filter((r) => r.personId === personId) : all;
}

export function replaceApprovedLeaveCache(rows: ApprovedLeaveCacheRow[]): void {
  saveList(M05_STORAGE_KEYS.approvedLeaveCache, rows);
}

export function upsertApprovedLeaveCacheRow(row: ApprovedLeaveCacheRow): ApprovedLeaveCacheRow {
  return upsertById(M05_STORAGE_KEYS.approvedLeaveCache, row);
}
