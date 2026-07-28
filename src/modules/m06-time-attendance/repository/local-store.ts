/**
 * M06 local JSON store for attendance domain records.
 * Additive persistence — never wipes existing data. No cross-module repo imports.
 */

import { readJsonSafe, uid, writeJsonSafe } from "@/platform/storage/storage";
import type {
  ApprovalQueueItem,
  AttendanceAuditEntry,
  AttendanceDeclaration,
  AttendanceException,
  AttendanceSession,
  BreakRecord,
  ClockEvent,
  CorrectionRequest,
  OfflineQueueItem,
  RegisteredDevice,
  TimesheetRecord,
  VerificationEvidence,
} from "../types/domain";
import type { AttendancePolicy } from "../types/policy";
import { M06_STORAGE_KEYS } from "../storage/keys";

const listCache = new Map<string, unknown[]>();
let forceSystemError = false;

export function clearM06LocalStoreCacheForTests(): void {
  listCache.clear();
  forceSystemError = false;
}

export function invalidateM06LocalStoreCache(key?: string): void {
  if (key) listCache.delete(key);
  else listCache.clear();
}

export function evidenceForceSystemError(on = true): void {
  forceSystemError = on;
}

function loadList<T>(key: string): T[] {
  if (forceSystemError) throw new Error("M06 store system error (evidence)");
  const cached = listCache.get(key);
  if (cached) return cached as T[];
  const list = readJsonSafe<T[]>(key, []);
  listCache.set(key, list as unknown[]);
  return list;
}

function saveList<T>(key: string, items: T[]): void {
  listCache.set(key, items as unknown[]);
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

export function newSessionId(): string { return uid("ats"); }
export function newEventId(): string { return uid("cev"); }
export function newBreakId(): string { return uid("brk"); }
export function newExceptionId(): string { return uid("aex"); }
export function newCorrectionId(): string { return uid("acr"); }
export function newTimesheetId(): string { return uid("atsheet"); }
export function newApprovalId(): string { return uid("aap"); }
export function newAuditId(): string { return uid("aud"); }
export function newEvidenceId(): string { return uid("evd"); }
export function newOfflineId(): string { return uid("off"); }
export function newDeviceId(): string { return uid("dev"); }
export function newDeclarationId(): string { return uid("dec"); }
export function newPolicyId(): string { return uid("apol"); }

// Sessions
export function listSessions(clinicId?: string): AttendanceSession[] {
  const all = loadList<AttendanceSession>(M06_STORAGE_KEYS.sessions);
  return clinicId ? all.filter((s) => s.clinicId === clinicId) : all;
}
export function getSession(id: string): AttendanceSession | null {
  return listSessions().find((s) => s.id === id) ?? null;
}
export function upsertSession(s: AttendanceSession): AttendanceSession {
  return upsertById(M06_STORAGE_KEYS.sessions, s);
}
export function findOpenSessionForPerson(personId: string): AttendanceSession | null {
  return listSessions().find((s) => s.personId === personId && (s.state === "open" || s.state === "on_break")) ?? null;
}

// Events (append-only preferred; corrections supersede)
export function listEvents(sessionId?: string): ClockEvent[] {
  const all = loadList<ClockEvent>(M06_STORAGE_KEYS.events);
  return sessionId ? all.filter((e) => e.sessionId === sessionId) : all;
}
export function getEvent(id: string): ClockEvent | null {
  return listEvents().find((e) => e.id === id) ?? null;
}
export function appendEvent(event: ClockEvent): ClockEvent {
  const list = loadList<ClockEvent>(M06_STORAGE_KEYS.events);
  if (list.some((e) => e.id === event.id)) {
    throw new Error(`Clock event ${event.id} already exists`);
  }
  if (event.clientEventId && list.some((e) => e.clientEventId === event.clientEventId)) {
    return list.find((e) => e.clientEventId === event.clientEventId)!;
  }
  if (event.idempotencyKey && list.some((e) => e.idempotencyKey === event.idempotencyKey)) {
    return list.find((e) => e.idempotencyKey === event.idempotencyKey)!;
  }
  list.push(event);
  saveList(M06_STORAGE_KEYS.events, list);
  return event;
}
export function upsertEvent(event: ClockEvent): ClockEvent {
  return upsertById(M06_STORAGE_KEYS.events, event);
}

// Breaks
export function listBreaks(sessionId?: string): BreakRecord[] {
  const all = loadList<BreakRecord>(M06_STORAGE_KEYS.breaks);
  return sessionId ? all.filter((b) => b.sessionId === sessionId) : all;
}
export function getBreak(id: string): BreakRecord | null {
  return listBreaks().find((b) => b.id === id) ?? null;
}
export function upsertBreak(b: BreakRecord): BreakRecord {
  return upsertById(M06_STORAGE_KEYS.breaks, b);
}

// Exceptions
export function listExceptions(clinicId?: string): AttendanceException[] {
  const all = loadList<AttendanceException>(M06_STORAGE_KEYS.exceptions);
  return clinicId ? all.filter((e) => e.clinicId === clinicId) : all;
}
export function getException(id: string): AttendanceException | null {
  return listExceptions().find((e) => e.id === id) ?? null;
}
export function upsertException(e: AttendanceException): AttendanceException {
  return upsertById(M06_STORAGE_KEYS.exceptions, e);
}

// Corrections
export function listCorrections(clinicId?: string): CorrectionRequest[] {
  const all = loadList<CorrectionRequest>(M06_STORAGE_KEYS.corrections);
  return clinicId ? all.filter((c) => c.clinicId === clinicId) : all;
}
export function getCorrection(id: string): CorrectionRequest | null {
  return listCorrections().find((c) => c.id === id) ?? null;
}
export function upsertCorrection(c: CorrectionRequest): CorrectionRequest {
  return upsertById(M06_STORAGE_KEYS.corrections, c);
}

// Approvals
export function listApprovals(clinicId?: string): ApprovalQueueItem[] {
  const all = loadList<ApprovalQueueItem>(M06_STORAGE_KEYS.approvals);
  return clinicId ? all.filter((a) => a.clinicId === clinicId) : all;
}
export function getApproval(id: string): ApprovalQueueItem | null {
  return listApprovals().find((a) => a.id === id) ?? null;
}
export function upsertApproval(a: ApprovalQueueItem): ApprovalQueueItem {
  return upsertById(M06_STORAGE_KEYS.approvals, a);
}

// Timesheets
export function listTimesheets(clinicId?: string): TimesheetRecord[] {
  const all = loadList<TimesheetRecord>(M06_STORAGE_KEYS.timesheets);
  return clinicId ? all.filter((t) => t.clinicId === clinicId) : all;
}
export function getTimesheet(id: string): TimesheetRecord | null {
  return listTimesheets().find((t) => t.id === id) ?? null;
}
export function upsertTimesheet(t: TimesheetRecord): TimesheetRecord {
  return upsertById(M06_STORAGE_KEYS.timesheets, t);
}

// Offline
export function listOfflineQueue(): OfflineQueueItem[] {
  return loadList<OfflineQueueItem>(M06_STORAGE_KEYS.offlineQueue);
}
export function getOfflineItem(id: string): OfflineQueueItem | null {
  return listOfflineQueue().find((o) => o.id === id) ?? null;
}
export function upsertOfflineItem(o: OfflineQueueItem): OfflineQueueItem {
  return upsertById(M06_STORAGE_KEYS.offlineQueue, o);
}

// Policies
export function listPolicies(clinicId?: string): AttendancePolicy[] {
  const all = loadList<AttendancePolicy>(M06_STORAGE_KEYS.policies);
  return clinicId ? all.filter((p) => p.clinicId === clinicId) : all;
}
export function getPolicy(id: string): AttendancePolicy | null {
  return listPolicies().find((p) => p.id === id) ?? null;
}
export function upsertPolicy(p: AttendancePolicy): AttendancePolicy {
  return upsertById(M06_STORAGE_KEYS.policies, p);
}
export function getPublishedPolicyForClinic(clinicId: string): AttendancePolicy | null {
  return listPolicies(clinicId)
    .filter((p) => p.state === "published")
    .sort((a, b) => b.version - a.version)[0] ?? null;
}

// Evidence
export function listEvidence(): VerificationEvidence[] {
  return loadList<VerificationEvidence>(M06_STORAGE_KEYS.evidence);
}
export function upsertEvidence(e: VerificationEvidence): VerificationEvidence {
  return upsertById(M06_STORAGE_KEYS.evidence, e);
}

// Audit (append-only)
export function listAudit(): AttendanceAuditEntry[] {
  return loadList<AttendanceAuditEntry>(M06_STORAGE_KEYS.audit);
}
export function appendAudit(entry: AttendanceAuditEntry): AttendanceAuditEntry {
  const list = loadList<AttendanceAuditEntry>(M06_STORAGE_KEYS.audit);
  list.push(entry);
  saveList(M06_STORAGE_KEYS.audit, list);
  return entry;
}

// Devices
export function listDevices(): RegisteredDevice[] {
  return loadList<RegisteredDevice>(M06_STORAGE_KEYS.devices);
}
export function upsertDevice(d: RegisteredDevice): RegisteredDevice {
  return upsertById(M06_STORAGE_KEYS.devices, d);
}

// Declarations
export function listDeclarations(): AttendanceDeclaration[] {
  return loadList<AttendanceDeclaration>(M06_STORAGE_KEYS.declarations);
}
export function upsertDeclaration(d: AttendanceDeclaration): AttendanceDeclaration {
  return upsertById(M06_STORAGE_KEYS.declarations, d);
}

/** Count keys for migration evidence (does not touch M07). */
export function countM06Keys(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [name, key] of Object.entries(M06_STORAGE_KEYS)) {
    if (name === "meta") continue;
    out[name] = loadList(key).length;
  }
  return out;
}

export function assertNoM07KeysCreated(): boolean {
  if (typeof localStorage === "undefined") return true;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith("pulse.m07.")) return false;
  }
  return true;
}
