/**
 * Canonical serialization + SHA-256 hashing for published timesheet payroll content.
 * Platform-owned — publishers may not supply an unverified trusted hash.
 */

import { createHash } from "node:crypto";
import type { PublishedTimesheetPayrollContent } from "./published-timesheet-contract";

export class CanonicalizationError extends Error {
  field: string;
  constructor(field: string, message: string) {
    super(message);
    this.name = "CanonicalizationError";
    this.field = field;
  }
}

function assertFiniteNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || Number.isNaN(value)) {
    throw new CanonicalizationError(field, `${field} must be a finite number`);
  }
  return value;
}

function assertIsoTimestamp(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new CanonicalizationError(field, `${field} is required`);
  }
  const ms = Date.parse(value);
  if (!Number.isFinite(ms)) {
    throw new CanonicalizationError(field, `${field} must be a valid ISO timestamp`);
  }
  return new Date(ms).toISOString();
}

function assertNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new CanonicalizationError(field, `${field} is required`);
  }
  return value.trim();
}

/** Recursively sort object keys; arrays keep declared order unless set-like. */
export function canonicalizeJsonValue(value: unknown, path = "$"): unknown {
  if (value === null) return null;
  if (typeof value === "number") {
    if (!Number.isFinite(value) || Number.isNaN(value)) {
      throw new CanonicalizationError(path, `${path} must be finite`);
    }
    return value;
  }
  if (typeof value === "boolean" || typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.map((v, i) => canonicalizeJsonValue(v, `${path}[${i}]`));
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(obj).sort()) {
      if (obj[key] === undefined) continue; // omitted optionals excluded
      out[key] = canonicalizeJsonValue(obj[key], `${path}.${key}`);
    }
    return out;
  }
  throw new CanonicalizationError(path, `${path} has unsupported type`);
}

/**
 * Build the hash-boundary object with stable set-like array ordering.
 * Business-ordered arrays (hour/leave/allowance sequences) keep publisher order.
 * attendanceSessionIds is set-like → sorted lexicographically.
 */
export function buildCanonicalPayrollPayload(
  content: PublishedTimesheetPayrollContent
): Record<string, unknown> {
  const organisationId = assertNonEmptyString(content.organisationId, "organisationId");
  const legalEntityId = assertNonEmptyString(content.legalEntityId, "legalEntityId");
  // organisationId and legalEntityId remain independent fields — never derive one from the other.

  const attendanceSessionIds = [...(content.attendanceSessionIds ?? [])]
    .map((id, i) => assertNonEmptyString(id, `attendanceSessionIds[${i}]`))
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

  const ordinaryHourInputs = (content.ordinaryHourInputs ?? []).map((h, i) => ({
    code: assertNonEmptyString(h.code, `ordinaryHourInputs[${i}].code`),
    hours: assertFiniteNumber(h.hours, `ordinaryHourInputs[${i}].hours`),
    ...(h.localDate !== undefined
      ? { localDate: assertNonEmptyString(h.localDate, `ordinaryHourInputs[${i}].localDate`) }
      : {}),
    ...(h.notes !== undefined ? { notes: String(h.notes) } : {}),
  }));

  const overtimeHourInputs = (content.overtimeHourInputs ?? []).map((h, i) => ({
    code: assertNonEmptyString(h.code, `overtimeHourInputs[${i}].code`),
    hours: assertFiniteNumber(h.hours, `overtimeHourInputs[${i}].hours`),
    ...(h.localDate !== undefined
      ? { localDate: assertNonEmptyString(h.localDate, `overtimeHourInputs[${i}].localDate`) }
      : {}),
    ...(h.notes !== undefined ? { notes: String(h.notes) } : {}),
  }));

  const penaltyHourInputs = (content.penaltyHourInputs ?? []).map((h, i) => ({
    code: assertNonEmptyString(h.code, `penaltyHourInputs[${i}].code`),
    hours: assertFiniteNumber(h.hours, `penaltyHourInputs[${i}].hours`),
    ...(h.localDate !== undefined
      ? { localDate: assertNonEmptyString(h.localDate, `penaltyHourInputs[${i}].localDate`) }
      : {}),
    ...(h.notes !== undefined ? { notes: String(h.notes) } : {}),
  }));

  const leaveInputs = (content.leaveInputs ?? []).map((l, i) => ({
    leaveRecordId: assertNonEmptyString(l.leaveRecordId, `leaveInputs[${i}].leaveRecordId`),
    leaveTypeCode: assertNonEmptyString(l.leaveTypeCode, `leaveInputs[${i}].leaveTypeCode`),
    hours: assertFiniteNumber(l.hours, `leaveInputs[${i}].hours`),
    localStart: assertIsoTimestamp(l.localStart, `leaveInputs[${i}].localStart`),
    localEnd: assertIsoTimestamp(l.localEnd, `leaveInputs[${i}].localEnd`),
    sourceVersion: assertFiniteNumber(l.sourceVersion, `leaveInputs[${i}].sourceVersion`),
  }));

  const allowanceInputs = (content.allowanceInputs ?? []).map((a, i) => ({
    allowanceCode: assertNonEmptyString(a.allowanceCode, `allowanceInputs[${i}].allowanceCode`),
    quantity: assertFiniteNumber(a.quantity, `allowanceInputs[${i}].quantity`),
    ...(a.unit !== undefined ? { unit: String(a.unit) } : {}),
    ...(a.localDate !== undefined
      ? { localDate: assertNonEmptyString(a.localDate, `allowanceInputs[${i}].localDate`) }
      : {}),
  }));

  const payload: Record<string, unknown> = {
    allowanceInputs,
    attendanceSessionIds,
    leaveInputs,
    legalEntityId,
    ordinaryHourInputs,
    organisationId,
    overtimeHourInputs,
    penaltyHourInputs,
    periodEnd: assertNonEmptyString(content.periodEnd, "periodEnd"),
    periodStart: assertNonEmptyString(content.periodStart, "periodStart"),
    timesheetRecordId: assertNonEmptyString(content.timesheetRecordId, "timesheetRecordId"),
    workforcePersonId: assertNonEmptyString(content.workforcePersonId, "workforcePersonId"),
  };
  if (content.clinicId !== undefined && content.clinicId !== null && String(content.clinicId).trim()) {
    payload.clinicId = assertNonEmptyString(content.clinicId, "clinicId");
  }

  return canonicalizeJsonValue(payload) as Record<string, unknown>;
}

export function canonicalPayrollJson(content: PublishedTimesheetPayrollContent): string {
  const payload = buildCanonicalPayrollPayload(content);
  // Keys already sorted recursively; stringify without insignificant whitespace.
  return JSON.stringify(payload);
}

export function sha256HexUtf8(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

/** Platform calculates contentHash from validated canonical payroll payload. */
export function calculatePayrollContentHash(content: PublishedTimesheetPayrollContent): string {
  return sha256HexUtf8(canonicalPayrollJson(content));
}

/**
 * Verify caller-supplied hash matches platform calculation.
 * Returns calculated hash; throws on mismatch or canonicalization failure.
 */
export function verifyOrCalculatePayrollContentHash(
  content: PublishedTimesheetPayrollContent,
  suppliedHash?: string
): string {
  const calculated = calculatePayrollContentHash(content);
  if (suppliedHash !== undefined && suppliedHash !== calculated) {
    throw new CanonicalizationError(
      "contentHash",
      "Supplied contentHash does not match platform-canonical payroll payload"
    );
  }
  return calculated;
}
