/**
 * M11 certificate service — issue and verify M11 training qualification outcome.
 * These are M11-owned training certificates, NOT M04 workforce credentials.
 */

import { assertM11Permission, type M11Actor } from "../permissions";
import * as store from "../repository/local-store";
import type { TrainingCertificate } from "../types/domain";
import { publishM11TrainingEvent } from "./events";
import {
  clinicCalendarDate,
  compareCalendarDates,
  resolveClinicTimezone,
} from "@/platform/workforce/services/clinic-timezone";

const DEFAULT_ORG = "org_parent";

export function issueCertificate(
  actor: M11Actor,
  input: {
    personId: string;
    courseId: string;
    requirementId?: string;
    expiresOn?: string;
    organisationId?: string;
    clinicId?: string;
  }
): TrainingCertificate {
  assertM11Permission(actor, "training.certificate.verify");
  const now = new Date().toISOString();
  const cert: TrainingCertificate = {
    id: store.newCertificateId(),
    personId: input.personId,
    courseId: input.courseId,
    requirementId: input.requirementId ?? null,
    organisationId: input.organisationId ?? DEFAULT_ORG,
    clinicId: input.clinicId,
    issuedAt: now,
    expiresOn: input.expiresOn ?? null,
    status: "issued",
    issuedBy: actor.userId,
    createdAt: now,
    updatedAt: now,
    version: 1,
  };
  store.upsertCertificate(cert);
  publishCertEvent(cert, actor.userId);
  return cert;
}

export function verifyCertificate(
  actor: M11Actor,
  certId: string
): TrainingCertificate {
  assertM11Permission(actor, "training.certificate.verify");
  const cert = store.getCertificate(certId);
  if (!cert) throw new Error(`Certificate not found: ${certId}`);
  if (cert.status !== "issued") throw new Error(`Certificate ${certId} is not in issued status`);
  const now = new Date().toISOString();
  const updated: TrainingCertificate = {
    ...cert,
    verifiedAt: now,
    verifiedBy: actor.userId,
    updatedAt: now,
    version: cert.version + 1,
  };
  store.upsertCertificate(updated);
  publishCertEvent(updated, actor.userId);
  return updated;
}

export function revokeCertificate(
  actor: M11Actor,
  certId: string,
  reason: string
): TrainingCertificate {
  assertM11Permission(actor, "training.certificate.verify");
  const cert = store.getCertificate(certId);
  if (!cert) throw new Error(`Certificate not found: ${certId}`);
  const now = new Date().toISOString();
  const updated: TrainingCertificate = {
    ...cert,
    status: "revoked",
    revokedAt: now,
    revokedReason: reason,
    updatedAt: now,
    version: cert.version + 1,
  };
  store.upsertCertificate(updated);
  publishCertEvent(updated, actor.userId);
  return updated;
}

export function refreshCertificateExpiry(
  cert: TrainingCertificate,
  asOf: Date | string = new Date()
): TrainingCertificate {
  if (cert.status !== "issued") return cert;
  if (!cert.expiresOn) return cert;
  if (!cert.clinicId) {
    // Cannot authoritatively expire without clinic TZ — leave unchanged
    return cert;
  }
  const resolved = resolveClinicTimezone(cert.clinicId);
  if (!resolved.ok) return cert;
  const clinicToday = clinicCalendarDate(asOf, resolved.timeZone);
  if (compareCalendarDates(cert.expiresOn, clinicToday) >= 0) return cert;
  const now = typeof asOf === "string" ? asOf : asOf.toISOString();
  const updated: TrainingCertificate = {
    ...cert,
    status: "expired",
    updatedAt: now,
    version: cert.version + 1,
  };
  store.upsertCertificate(updated);
  return updated;
}

export function listCertificates(personId?: string): TrainingCertificate[] {
  return store.listCertificates(personId).map((c) => refreshCertificateExpiry(c));
}

function publishCertEvent(cert: TrainingCertificate, actor: string) {
  publishM11TrainingEvent({
    eventType: "worker.status.changed",
    sourceRecordId: cert.id,
    sourceRecordVersion: cert.version,
    sourceRecordType: "training-certificate",
    sourceRecordTitle: `Certificate: ${cert.personId} / ${cert.courseId}`,
    organisationId: cert.organisationId,
    clinicId: cert.clinicId,
    actor,
    idempotencyKey: `m11::cert::${cert.id}::v${cert.version}`,
    section: "certificates",
    currentStatus: cert.status,
  });
}
