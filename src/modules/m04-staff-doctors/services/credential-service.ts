/** Credential verify / expiry handling. */

import { createCredentialRef } from "@/platform/workforce/contracts/credential-ref";
import type { CredentialRef } from "@/platform/workforce/contracts/credential-ref";
import { assertM04Permission, type M04Actor } from "../permissions";
import * as store from "../repository/local-store";
import type { Credential, CredentialStatus } from "../types/domain";
import { publishM04WorkforceEvent } from "./events";
import { invalidateReadinessForPerson } from "./readiness-service";
import { syncExpiredCredentialToInbox, closeCredentialInboxProjection } from "../adapters/m04-inbox-sync";

function deriveStatus(expiresOn: string | null | undefined, verified: boolean, asOf = new Date()): CredentialStatus {
  if (expiresOn) {
    const exp = new Date(expiresOn);
    if (!Number.isNaN(exp.getTime()) && exp.getTime() < asOf.getTime()) return "expired";
  }
  if (!verified) return "pending";
  return "valid";
}

export function toCredentialRef(c: Credential): CredentialRef {
  return createCredentialRef({
    recordId: c.id,
    personId: c.personId,
    clinicId: c.clinicId,
    organisationId: c.organisationId,
    status: c.status,
    credentialType: c.credentialType,
    expiresOn: c.expiresOn,
    verified: c.verified,
  });
}

export function createCredential(
  actor: M04Actor,
  input: {
    personId: string;
    organisationId: string;
    clinicId?: string;
    credentialType: string;
    expiresOn?: string | null;
    notes?: string;
  }
): Credential {
  assertM04Permission(actor, "workforce.edit");
  const person = store.getPerson(input.personId);
  if (!person) throw new Error(`Person not found: ${input.personId}`);

  const now = new Date().toISOString();
  const status = deriveStatus(input.expiresOn, false);
  const credential: Credential = {
    id: store.newCredentialId(),
    personId: input.personId,
    organisationId: input.organisationId,
    clinicId: input.clinicId,
    credentialType: input.credentialType,
    status,
    expiresOn: input.expiresOn ?? null,
    verified: false,
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
    version: 1,
  };
  store.upsertCredential(credential);
  publishStatus(credential, actor.userId);
  invalidateReadinessForPerson(credential.personId);
  if (credential.status === "expired") syncExpiredCredentialToInbox(credential);
  return credential;
}

export function verifyCredential(actor: M04Actor, id: string): Credential {
  assertM04Permission(actor, "credential.verify");
  const existing = store.getCredential(id);
  if (!existing) throw new Error(`Credential not found: ${id}`);
  const now = new Date().toISOString();
  const status = deriveStatus(existing.expiresOn, true);
  const next: Credential = {
    ...existing,
    verified: true,
    verifiedAt: now,
    verifiedBy: actor.userId,
    status,
    updatedAt: now,
    version: existing.version + 1,
  };
  store.upsertCredential(next);
  publishStatus(next, actor.userId);
  invalidateReadinessForPerson(next.personId);
  if (next.status === "expired") syncExpiredCredentialToInbox(next);
  else closeCredentialInboxProjection(next, actor.userId);
  return next;
}

export function refreshCredentialExpiry(credential: Credential, asOf = new Date()): Credential {
  const status = deriveStatus(credential.expiresOn, credential.verified, asOf);
  if (status === credential.status) return credential;
  const next: Credential = {
    ...credential,
    status,
    updatedAt: asOf.toISOString(),
    version: credential.version + 1,
  };
  store.upsertCredential(next);
  invalidateReadinessForPerson(next.personId);
  if (next.status === "expired") syncExpiredCredentialToInbox(next);
  else closeCredentialInboxProjection(next, "system");
  return next;
}

export function listCredentials(personId?: string): Credential[] {
  return store.listCredentials(personId).map((c) => refreshCredentialExpiry(c));
}

function publishStatus(credential: Credential, actor: string) {
  publishM04WorkforceEvent({
    eventType: "credential.status.changed",
    sourceRecordId: credential.id,
    sourceRecordVersion: credential.version,
    sourceRecordType: "credential",
    sourceRecordTitle: credential.credentialType,
    organisationId: credential.organisationId,
    clinicId: credential.clinicId,
    actor,
    idempotencyKey: `m04::credential-status::${credential.id}::v${credential.version}`,
    section: "credentials",
    currentStatus: credential.status,
    payload: { personId: credential.personId, verified: credential.verified },
  });
}
