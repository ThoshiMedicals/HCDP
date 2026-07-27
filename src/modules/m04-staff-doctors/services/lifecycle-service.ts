/** Onboarding / offboarding / restriction lifecycle with sensitivity masking. */

import { assertM04Permission, hasM04Permission, type M04Actor } from "../permissions";
import * as store from "../repository/local-store";
import type {
  OffboardingRecord,
  OnboardingRecord,
  Restriction,
  RestrictionSensitivity,
} from "../types/domain";
import { publishM04WorkforceEvent } from "./events";
import { invalidateReadinessForPerson } from "./readiness-service";
import {
  syncIncompleteOffboardingToInbox,
  closeOffboardingInboxProjection,
} from "../adapters/m04-inbox-sync";

function setPersonStatus(personId: string, status: "Active" | "Onboarding" | "Offboarding" | "Archived", actor: string) {
  const person = store.getPerson(personId);
  if (!person) throw new Error(`Person not found: ${personId}`);
  const now = new Date().toISOString();
  const next = {
    ...person,
    status,
    updatedAt: now,
    version: person.version + 1,
  };
  store.upsertPerson(next);
  publishM04WorkforceEvent({
    eventType: "worker.status.changed",
    sourceRecordId: next.id,
    sourceRecordVersion: next.version,
    sourceRecordType: "workforce-person",
    sourceRecordTitle: next.preferredName,
    organisationId: next.organisationId,
    clinicId: next.clinicIds[0],
    actor,
    idempotencyKey: `m04::person-status::${next.id}::v${next.version}`,
    section: "people",
    currentStatus: next.status,
  });
  invalidateReadinessForPerson(next.id);
  return next;
}

const DEFAULT_ONBOARDING_CHECKLIST = [
  "Identity verification",
  "Clinic access assigned",
  "Credentials collected",
  "Orientation complete",
];

const MASK = "•••• restricted ••••";

export function maskRestriction(restriction: Restriction, actor: M04Actor): Restriction {
  const sensitive =
    restriction.sensitivity === "Restricted" ||
    restriction.sensitivity === "Confidential" ||
    restriction.sensitivity === "Highly Confidential";
  if (!sensitive) return { ...restriction, masked: false };
  if (hasM04Permission(actor, "restriction.view_sensitive")) {
    return { ...restriction, masked: false };
  }
  return {
    ...restriction,
    detail: MASK,
    reason: MASK,
    masked: true,
  };
}

export function listRestrictionsForActor(actor: M04Actor, personId?: string): Restriction[] {
  assertM04Permission(actor, "workforce.view");
  return store.listRestrictions(personId).map((r) => maskRestriction(r, actor));
}

export function createRestriction(
  actor: M04Actor,
  input: {
    personId: string;
    organisationId: string;
    clinicId?: string;
    sensitivity: RestrictionSensitivity;
    title: string;
    detail: string;
    reason: string;
    effectiveFrom: string;
    effectiveTo?: string | null;
  }
): Restriction {
  assertM04Permission(actor, "restriction.manage");
  const person = store.getPerson(input.personId);
  if (!person) throw new Error(`Person not found: ${input.personId}`);

  const now = new Date().toISOString();
  const restriction: Restriction = {
    id: store.newRestrictionId(),
    personId: input.personId,
    organisationId: input.organisationId,
    clinicId: input.clinicId,
    sensitivity: input.sensitivity,
    title: input.title,
    detail: input.detail,
    reason: input.reason,
    effectiveFrom: input.effectiveFrom,
    effectiveTo: input.effectiveTo ?? null,
    status: "Active",
    createdAt: now,
    updatedAt: now,
    version: 1,
  };
  store.upsertRestriction(restriction);
  publishM04WorkforceEvent({
    eventType: "restriction.changed",
    sourceRecordId: restriction.id,
    sourceRecordVersion: restriction.version,
    sourceRecordType: "restriction",
    sourceRecordTitle: restriction.title,
    organisationId: restriction.organisationId,
    clinicId: restriction.clinicId,
    actor: actor.userId,
    idempotencyKey: `m04::restriction::${restriction.id}::v${restriction.version}`,
    section: "restrictions",
    currentStatus: restriction.status,
    payload: { personId: restriction.personId, sensitivity: restriction.sensitivity },
  });
  invalidateReadinessForPerson(restriction.personId);
  return maskRestriction(restriction, actor);
}

export function startOnboarding(
  actor: M04Actor,
  personId: string,
  organisationId: string,
  clinicId?: string
): OnboardingRecord {
  assertM04Permission(actor, "onboarding.manage");
  const person = store.getPerson(personId);
  if (!person) throw new Error(`Person not found: ${personId}`);

  const now = new Date().toISOString();
  const record: OnboardingRecord = {
    id: store.newOnboardingId(),
    personId,
    organisationId,
    clinicId,
    status: "In Progress",
    checklist: [...DEFAULT_ONBOARDING_CHECKLIST],
    completedItems: [],
    startedAt: now,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
    version: 1,
  };
  store.upsertOnboarding(record);
  setPersonStatus(personId, "Onboarding", actor.userId);
  return record;
}

export function completeOnboarding(actor: M04Actor, recordId: string): OnboardingRecord {
  assertM04Permission(actor, "onboarding.manage");
  const existing = store.getOnboarding(recordId);
  if (!existing) throw new Error(`Onboarding not found: ${recordId}`);
  const now = new Date().toISOString();
  const next: OnboardingRecord = {
    ...existing,
    status: "Complete",
    completedItems: [...existing.checklist],
    completedAt: now,
    updatedAt: now,
    version: existing.version + 1,
  };
  store.upsertOnboarding(next);
  setPersonStatus(existing.personId, "Active", actor.userId);
  invalidateReadinessForPerson(existing.personId);
  return next;
}

export function startOffboarding(
  actor: M04Actor,
  input: {
    personId: string;
    organisationId: string;
    clinicId?: string;
    openResponsibilities: string[];
    notes?: string;
  }
): OffboardingRecord {
  assertM04Permission(actor, "offboarding.manage");
  const person = store.getPerson(input.personId);
  if (!person) throw new Error(`Person not found: ${input.personId}`);

  const now = new Date().toISOString();
  const record: OffboardingRecord = {
    id: store.newOffboardingId(),
    personId: input.personId,
    organisationId: input.organisationId,
    clinicId: input.clinicId,
    status: "In Progress",
    openResponsibilities: input.openResponsibilities,
    transferredToPersonId: null,
    startedAt: now,
    completedAt: null,
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
    version: 1,
  };
  store.upsertOffboarding(record);
  setPersonStatus(input.personId, "Offboarding", actor.userId);
  publishM04WorkforceEvent({
    eventType: "worker.offboarding.started",
    sourceRecordId: record.id,
    sourceRecordVersion: record.version,
    sourceRecordType: "offboarding",
    sourceRecordTitle: `Offboarding ${person.preferredName}`,
    organisationId: record.organisationId,
    clinicId: record.clinicId,
    actor: actor.userId,
    idempotencyKey: `m04::offboarding-started::${record.id}::v${record.version}`,
    section: "offboarding",
    currentStatus: record.status,
    payload: { personId: record.personId },
  });
  invalidateReadinessForPerson(record.personId);
  syncIncompleteOffboardingToInbox(record);
  return record;
}

export function transferOffboardingResponsibilities(
  actor: M04Actor,
  recordId: string,
  transferredToPersonId: string
): OffboardingRecord {
  assertM04Permission(actor, "offboarding.manage");
  const existing = store.getOffboarding(recordId);
  if (!existing) throw new Error(`Offboarding not found: ${recordId}`);
  const target = store.getPerson(transferredToPersonId);
  if (!target) throw new Error(`Transfer target not found: ${transferredToPersonId}`);

  const now = new Date().toISOString();
  const next: OffboardingRecord = {
    ...existing,
    transferredToPersonId,
    openResponsibilities: [],
    updatedAt: now,
    version: existing.version + 1,
  };
  store.upsertOffboarding(next);
  invalidateReadinessForPerson(existing.personId);
  return next;
}

export function completeOffboarding(actor: M04Actor, recordId: string): OffboardingRecord {
  assertM04Permission(actor, "offboarding.manage");
  const existing = store.getOffboarding(recordId);
  if (!existing) throw new Error(`Offboarding not found: ${recordId}`);
  if (existing.openResponsibilities.length > 0 && !existing.transferredToPersonId) {
    const incomplete: OffboardingRecord = {
      ...existing,
      status: "Incomplete",
      updatedAt: new Date().toISOString(),
      version: existing.version + 1,
    };
    store.upsertOffboarding(incomplete);
    syncIncompleteOffboardingToInbox(incomplete);
    throw new Error("Cannot complete offboarding with open responsibilities; transfer first");
  }

  const now = new Date().toISOString();
  const next: OffboardingRecord = {
    ...existing,
    status: "Complete",
    completedAt: now,
    updatedAt: now,
    version: existing.version + 1,
  };
  store.upsertOffboarding(next);
  // Soft-archive person — never hard-delete
  store.archivePerson(existing.personId, now);
  publishM04WorkforceEvent({
    eventType: "worker.offboarding.completed",
    sourceRecordId: next.id,
    sourceRecordVersion: next.version,
    sourceRecordType: "offboarding",
    sourceRecordTitle: `Offboarding complete`,
    organisationId: next.organisationId,
    clinicId: next.clinicId,
    actor: actor.userId,
    idempotencyKey: `m04::offboarding-completed::${next.id}::v${next.version}`,
    section: "offboarding",
    currentStatus: next.status,
    payload: { personId: next.personId },
  });
  closeOffboardingInboxProjection(next, actor.userId);
  invalidateReadinessForPerson(next.personId);
  return next;
}

export function markOffboardingIncomplete(actor: M04Actor, recordId: string): OffboardingRecord {
  assertM04Permission(actor, "offboarding.manage");
  const existing = store.getOffboarding(recordId);
  if (!existing) throw new Error(`Offboarding not found: ${recordId}`);
  const next: OffboardingRecord = {
    ...existing,
    status: "Incomplete",
    updatedAt: new Date().toISOString(),
    version: existing.version + 1,
  };
  store.upsertOffboarding(next);
  syncIncompleteOffboardingToInbox(next);
  invalidateReadinessForPerson(next.personId);
  return next;
}

export function listOnboarding(personId?: string): OnboardingRecord[] {
  return store.listOnboarding(personId);
}

export function listOffboarding(personId?: string): OffboardingRecord[] {
  return store.listOffboarding(personId);
}
