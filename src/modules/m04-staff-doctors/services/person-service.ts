/**
 * Person create/update with duplicate prevention and soft archive / suspend.
 */

import { createWorkforcePersonRef } from "@/platform/workforce/contracts/workforce-person-ref";
import type { WorkforcePersonRef } from "@/platform/workforce/contracts/workforce-person-ref";
import {
  assertM04ClinicScope,
  assertM04Permission,
  M04ClinicScopeError,
  type M04Actor,
} from "../permissions";
import * as store from "../repository/local-store";
import type { PersonKind, WorkforcePerson, WorkforcePersonStatus } from "../types/domain";
import { publishM04WorkforceEvent } from "./events";
import { invalidateReadinessForPerson } from "./readiness-service";

const DEFAULT_ORG = "org_parent";

export function duplicatePersonCheck(
  preferredName: string,
  email: string,
  excludeId?: string
): WorkforcePerson | null {
  const name = preferredName.trim().toLowerCase();
  const mail = email.trim().toLowerCase();
  return (
    store.listPeople().find((p) => {
      if (excludeId && p.id === excludeId) return false;
      if (p.status === "Archived") return false;
      return p.preferredName.trim().toLowerCase() === name && p.email.trim().toLowerCase() === mail;
    }) ?? null
  );
}

export function toWorkforcePersonRef(person: WorkforcePerson): WorkforcePersonRef {
  return createWorkforcePersonRef({
    recordId: person.id,
    clinicId: person.clinicIds[0],
    organisationId: person.organisationId,
    status: person.status,
    personKind: person.personKind,
    preferredName: person.preferredName,
    section: person.personKind === "doctor" ? "doctor-profiles" : "staff-profiles",
  });
}

export function createPerson(
  actor: M04Actor,
  input: {
    personKind: PersonKind;
    preferredName: string;
    email: string;
    clinicIds?: string[];
    organisationId?: string;
    phone?: string;
    roleLabel?: string;
    status?: WorkforcePersonStatus;
  }
): WorkforcePerson {
  assertM04Permission(actor, "workforce.create");
  const clinicIds = input.clinicIds ?? [];
  if (actor.clinicIds !== undefined && !actor.permissions.includes("*")) {
    if (!clinicIds.length) {
      throw new M04ClinicScopeError("Clinic assignment required for clinic-scoped actors");
    }
    assertM04ClinicScope(actor, clinicIds);
  }
  const dup = duplicatePersonCheck(input.preferredName, input.email);
  if (dup) {
    throw new Error(`Duplicate person: ${dup.preferredName} <${dup.email}> already exists (${dup.id})`);
  }
  const now = new Date().toISOString();
  const person: WorkforcePerson = {
    id: store.newPersonId(input.personKind),
    personKind: input.personKind,
    preferredName: input.preferredName.trim(),
    email: input.email.trim().toLowerCase(),
    status: input.status ?? "Active",
    clinicIds,
    organisationId: input.organisationId ?? DEFAULT_ORG,
    createdAt: now,
    updatedAt: now,
    version: 1,
    phone: input.phone,
    roleLabel: input.roleLabel,
  };
  store.upsertPerson(person);
  publishM04WorkforceEvent({
    eventType: "worker.status.changed",
    sourceRecordId: person.id,
    sourceRecordVersion: person.version,
    sourceRecordType: "workforce-person",
    sourceRecordTitle: person.preferredName,
    organisationId: person.organisationId,
    clinicId: person.clinicIds[0],
    actor: actor.userId,
    idempotencyKey: `m04::person-created::${person.id}::v${person.version}`,
    section: "people",
    currentStatus: person.status,
  });
  invalidateReadinessForPerson(person.id);
  return person;
}

export function updatePerson(
  actor: M04Actor,
  id: string,
  patch: Partial<Pick<WorkforcePerson, "preferredName" | "email" | "clinicIds" | "phone" | "roleLabel" | "status">>
): WorkforcePerson {
  assertM04Permission(actor, "workforce.edit");
  const existing = store.getPerson(id);
  if (!existing) throw new Error(`Person not found: ${id}`);
  assertM04ClinicScope(actor, existing.clinicIds);
  if (patch.clinicIds) assertM04ClinicScope(actor, patch.clinicIds);
  if (patch.preferredName != null || patch.email != null) {
    const dup = duplicatePersonCheck(
      patch.preferredName ?? existing.preferredName,
      patch.email ?? existing.email,
      existing.id
    );
    if (dup) throw new Error(`Duplicate person: ${dup.preferredName} <${dup.email}>`);
  }
  if (patch.clinicIds) {
    assertM04Permission(actor, "workforce.assign_clinic");
  }
  const now = new Date().toISOString();
  const next: WorkforcePerson = {
    ...existing,
    ...patch,
    email: patch.email != null ? patch.email.trim().toLowerCase() : existing.email,
    preferredName: patch.preferredName != null ? patch.preferredName.trim() : existing.preferredName,
    updatedAt: now,
    version: existing.version + 1,
  };
  store.upsertPerson(next);
  if (patch.status && patch.status !== existing.status) {
    publishM04WorkforceEvent({
      eventType: "worker.status.changed",
      sourceRecordId: next.id,
      sourceRecordVersion: next.version,
      sourceRecordType: "workforce-person",
      sourceRecordTitle: next.preferredName,
      organisationId: next.organisationId,
      clinicId: next.clinicIds[0],
      actor: actor.userId,
      idempotencyKey: `m04::person-status::${next.id}::v${next.version}`,
      section: "people",
      currentStatus: next.status,
    });
  }
  invalidateReadinessForPerson(next.id);
  return next;
}

export function softArchivePerson(actor: M04Actor, id: string): WorkforcePerson {
  assertM04Permission(actor, "workforce.edit");
  const existing = store.getPerson(id);
  if (!existing) throw new Error(`Person not found: ${id}`);
  assertM04ClinicScope(actor, existing.clinicIds);
  const archived = store.archivePerson(id);
  if (!archived) throw new Error(`Person not found: ${id}`);
  publishM04WorkforceEvent({
    eventType: "worker.status.changed",
    sourceRecordId: archived.id,
    sourceRecordVersion: archived.version,
    sourceRecordType: "workforce-person",
    sourceRecordTitle: archived.preferredName,
    organisationId: archived.organisationId,
    clinicId: archived.clinicIds[0],
    actor: actor.userId,
    idempotencyKey: `m04::person-archived::${archived.id}::v${archived.version}`,
    section: "people",
    currentStatus: archived.status,
  });
  invalidateReadinessForPerson(archived.id);
  return archived;
}

export function suspendPerson(actor: M04Actor, id: string): WorkforcePerson {
  assertM04Permission(actor, "workforce.suspend");
  const existing = store.getPerson(id);
  if (!existing) throw new Error(`Person not found: ${id}`);
  assertM04ClinicScope(actor, existing.clinicIds);
  const now = new Date().toISOString();
  const next: WorkforcePerson = {
    ...existing,
    status: "Suspended",
    updatedAt: now,
    version: existing.version + 1,
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
    actor: actor.userId,
    idempotencyKey: `m04::person-status::${next.id}::v${next.version}`,
    section: "people",
    currentStatus: next.status,
  });
  invalidateReadinessForPerson(next.id);
  return next;
}

export function reinstatePerson(actor: M04Actor, id: string): WorkforcePerson {
  assertM04Permission(actor, "workforce.reinstate");
  const person = store.getPerson(id);
  if (!person) throw new Error(`Person not found: ${id}`);
  assertM04ClinicScope(actor, person.clinicIds);
  if (person.status === "Archived") throw new Error("Cannot reinstate archived person");
  const now = new Date().toISOString();
  const next: WorkforcePerson = {
    ...person,
    status: "Active",
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
    actor: actor.userId,
    idempotencyKey: `m04::person-status::${next.id}::v${next.version}`,
    section: "people",
    currentStatus: next.status,
  });
  invalidateReadinessForPerson(next.id);
  return next;
}

export function getPerson(id: string): WorkforcePerson | null {
  return store.getPerson(id);
}

export function listPeople(filter?: { personKind?: PersonKind; status?: WorkforcePersonStatus; clinicId?: string }) {
  return store.listPeople().filter((p) => {
    if (filter?.personKind && p.personKind !== filter.personKind) return false;
    if (filter?.status && p.status !== filter.status) return false;
    if (filter?.clinicId && !p.clinicIds.includes(filter.clinicId)) return false;
    return true;
  });
}

/** View path with permission + optional clinic scope. */
export function listPeopleForActor(
  actor: M04Actor,
  filter?: { personKind?: PersonKind; status?: WorkforcePersonStatus; clinicId?: string }
): WorkforcePerson[] {
  assertM04Permission(actor, "workforce.view");
  return listPeople(filter).filter((p) => {
    if (actor.clinicIds === undefined || actor.permissions.includes("*")) return true;
    if (!actor.clinicIds.length) return false;
    return p.clinicIds.some((id) => actor.clinicIds!.includes(id));
  });
}
