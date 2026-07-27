/**
 * Local JSON store for M04 domain records.
 * Soft-archive only for people (status Archived). Never hard-delete people.
 */

import { readJsonSafe, writeJsonSafe, uid } from "@/platform/storage/storage";
import type {
  AvailabilityWindow,
  Credential,
  Engagement,
  LeaveRequest,
  OffboardingRecord,
  OnboardingRecord,
  ReadinessCache,
  Restriction,
  WorkforcePerson,
} from "../types/domain";
import { M04_STORAGE_KEYS } from "../storage/keys";

function loadList<T>(key: string): T[] {
  return readJsonSafe<T[]>(key, []);
}

function saveList<T>(key: string, items: T[]): void {
  writeJsonSafe(key, items);
}

function upsertById<T extends { id: string }>(key: string, item: T): T {
  const list = loadList<T>(key);
  const idx = list.findIndex((x) => x.id === item.id);
  if (idx >= 0) list[idx] = item;
  else list.push(item);
  saveList(key, list);
  return item;
}

// ——— People ———

export function listPeople(): WorkforcePerson[] {
  return loadList<WorkforcePerson>(M04_STORAGE_KEYS.people);
}

export function getPerson(id: string): WorkforcePerson | null {
  return listPeople().find((p) => p.id === id || p.legacyId === id) ?? null;
}

export function upsertPerson(person: WorkforcePerson): WorkforcePerson {
  return upsertById(M04_STORAGE_KEYS.people, person);
}

/** Soft-archive only — never removes the row. */
export function archivePerson(id: string, now = new Date().toISOString()): WorkforcePerson | null {
  const person = getPerson(id);
  if (!person) return null;
  return upsertPerson({
    ...person,
    status: "Archived",
    updatedAt: now,
    version: person.version + 1,
  });
}

export function newPersonId(kind: "staff" | "doctor" = "staff"): string {
  return uid(kind === "doctor" ? "wpd" : "wps");
}

// ——— Engagements ———

export function listEngagements(personId?: string): Engagement[] {
  const all = loadList<Engagement>(M04_STORAGE_KEYS.engagements);
  return personId ? all.filter((e) => e.personId === personId) : all;
}

export function getEngagement(id: string): Engagement | null {
  return listEngagements().find((e) => e.id === id) ?? null;
}

export function upsertEngagement(engagement: Engagement): Engagement {
  return upsertById(M04_STORAGE_KEYS.engagements, engagement);
}

export function newEngagementId(): string {
  return uid("eng");
}

// ——— Credentials ———

export function listCredentials(personId?: string): Credential[] {
  const all = loadList<Credential>(M04_STORAGE_KEYS.credentials);
  return personId ? all.filter((c) => c.personId === personId) : all;
}

export function getCredential(id: string): Credential | null {
  return listCredentials().find((c) => c.id === id) ?? null;
}

export function upsertCredential(credential: Credential): Credential {
  return upsertById(M04_STORAGE_KEYS.credentials, credential);
}

export function newCredentialId(): string {
  return uid("cred");
}

// ——— Leave ———

export function listLeave(personId?: string): LeaveRequest[] {
  const all = loadList<LeaveRequest>(M04_STORAGE_KEYS.leave);
  return personId ? all.filter((l) => l.personId === personId) : all;
}

export function getLeave(id: string): LeaveRequest | null {
  return listLeave().find((l) => l.id === id) ?? null;
}

export function upsertLeave(leave: LeaveRequest): LeaveRequest {
  return upsertById(M04_STORAGE_KEYS.leave, leave);
}

export function newLeaveId(): string {
  return uid("leave");
}

// ——— Availability ———

export function listAvailability(personId?: string): AvailabilityWindow[] {
  const all = loadList<AvailabilityWindow>(M04_STORAGE_KEYS.availability);
  return personId ? all.filter((a) => a.personId === personId) : all;
}

export function getAvailability(id: string): AvailabilityWindow | null {
  return listAvailability().find((a) => a.id === id) ?? null;
}

export function upsertAvailability(window: AvailabilityWindow): AvailabilityWindow {
  return upsertById(M04_STORAGE_KEYS.availability, window);
}

export function newAvailabilityId(): string {
  return uid("avail");
}

// ——— Restrictions ———

export function listRestrictions(personId?: string): Restriction[] {
  const all = loadList<Restriction>(M04_STORAGE_KEYS.restrictions);
  return personId ? all.filter((r) => r.personId === personId) : all;
}

export function getRestriction(id: string): Restriction | null {
  return listRestrictions().find((r) => r.id === id) ?? null;
}

export function upsertRestriction(restriction: Restriction): Restriction {
  return upsertById(M04_STORAGE_KEYS.restrictions, restriction);
}

export function newRestrictionId(): string {
  return uid("rest");
}

// ——— Onboarding ———

export function listOnboarding(personId?: string): OnboardingRecord[] {
  const all = loadList<OnboardingRecord>(M04_STORAGE_KEYS.onboarding);
  return personId ? all.filter((r) => r.personId === personId) : all;
}

export function getOnboarding(id: string): OnboardingRecord | null {
  return listOnboarding().find((r) => r.id === id) ?? null;
}

export function upsertOnboarding(record: OnboardingRecord): OnboardingRecord {
  return upsertById(M04_STORAGE_KEYS.onboarding, record);
}

export function newOnboardingId(): string {
  return uid("onb");
}

// ——— Offboarding ———

export function listOffboarding(personId?: string): OffboardingRecord[] {
  const all = loadList<OffboardingRecord>(M04_STORAGE_KEYS.offboarding);
  return personId ? all.filter((r) => r.personId === personId) : all;
}

export function getOffboarding(id: string): OffboardingRecord | null {
  return listOffboarding().find((r) => r.id === id) ?? null;
}

export function upsertOffboarding(record: OffboardingRecord): OffboardingRecord {
  return upsertById(M04_STORAGE_KEYS.offboarding, record);
}

export function newOffboardingId(): string {
  return uid("off");
}

// ——— Readiness cache ———

export function listReadiness(): ReadinessCache[] {
  return loadList<ReadinessCache>(M04_STORAGE_KEYS.readiness);
}

export function getReadinessCache(personId: string): ReadinessCache | null {
  return listReadiness().find((r) => r.personId === personId) ?? null;
}

export function upsertReadinessCache(cache: ReadinessCache): ReadinessCache {
  const list = listReadiness();
  const idx = list.findIndex((r) => r.personId === cache.personId);
  if (idx >= 0) list[idx] = cache;
  else list.push(cache);
  saveList(M04_STORAGE_KEYS.readiness, list);
  return cache;
}

export function invalidateReadinessCache(personId: string): void {
  const list = listReadiness().filter((r) => r.personId !== personId);
  saveList(M04_STORAGE_KEYS.readiness, list);
}
