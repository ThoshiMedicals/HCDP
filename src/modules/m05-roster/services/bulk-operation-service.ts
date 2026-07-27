/**
 * M05 bulk-operation service (§16 of the plan).
 *
 * Provides preview / submit with:
 *  - permission + clinic scope enforcement per operation
 *  - partial success — failures do not roll back succeeded operations
 *  - duplicate suppression
 *  - notification volume cap
 *  - safe retry via idempotency key (dedupe of previously succeeded ops in-run)
 */

import {
  assertM05Permission,
  isInActorClinicScope,
  M05ClinicScopeError,
  type M05Actor,
} from "../permissions";
import type { Assignment, Shift } from "../types/domain";
import type { FoldFlag } from "../types/timezone";
import * as store from "../repository/local-store";
import { appendRosterAudit } from "./audit-helpers";
import { createShift } from "./shift-service";
import { assignPerson } from "./assignment-service";

export type BulkOperationKind =
  | "create-shift"
  | "assign-person"
  | "cancel-shift";

export interface BulkOperation {
  idempotencyKey: string;
  kind: BulkOperationKind;
  clinicId: string;
  payload: Record<string, unknown>;
}

export interface BulkPreview {
  totalOps: number;
  inScopeOps: number;
  outOfScopeOps: number;
  duplicateOps: number;
  willAttempt: number;
  notificationsSuppressed: number;
  notificationCap: number;
}

export interface BulkResult<T = unknown> {
  succeeded: Array<{ idempotencyKey: string; kind: BulkOperationKind; result: T }>;
  failed: Array<{ idempotencyKey: string; kind: BulkOperationKind; error: string }>;
  skippedOutOfScope: string[];
  skippedDuplicate: string[];
  notificationsSuppressed: number;
}

const DEFAULT_NOTIFICATION_CAP = 50;

export function previewBulk(
  actor: M05Actor,
  ops: BulkOperation[],
  options?: { notificationCap?: number }
): BulkPreview {
  assertM05Permission(actor, "roster.bulk");
  const cap = options?.notificationCap ?? DEFAULT_NOTIFICATION_CAP;
  const seen = new Set<string>();
  let inScope = 0;
  let outOfScope = 0;
  let duplicates = 0;
  for (const op of ops) {
    if (seen.has(op.idempotencyKey)) {
      duplicates += 1;
      continue;
    }
    seen.add(op.idempotencyKey);
    if (!isInActorClinicScope(actor, op.clinicId)) {
      outOfScope += 1;
      continue;
    }
    inScope += 1;
  }
  const willAttempt = inScope;
  const notificationsSuppressed = Math.max(0, willAttempt - cap);
  return {
    totalOps: ops.length,
    inScopeOps: inScope,
    outOfScopeOps: outOfScope,
    duplicateOps: duplicates,
    willAttempt,
    notificationsSuppressed,
    notificationCap: cap,
  };
}

function coerceStringField(payload: Record<string, unknown>, key: string): string {
  const value = payload[key];
  if (typeof value !== "string" || !value) {
    throw new Error(`Bulk op missing required string field: ${key}`);
  }
  return value;
}

function coerceOptional(payload: Record<string, unknown>, key: string): string | undefined {
  const value = payload[key];
  return typeof value === "string" && value ? value : undefined;
}

function coerceFold(payload: Record<string, unknown>): { start?: FoldFlag; end?: FoldFlag } | undefined {
  const f = payload.fold as { start?: number; end?: number } | undefined;
  if (!f) return undefined;
  return {
    start: f.start === 1 ? 1 : 0,
    end: f.end === 1 ? 1 : 0,
  };
}

export function submitBulk<T = unknown>(
  actor: M05Actor,
  ops: BulkOperation[],
  options?: { notificationCap?: number }
): BulkResult<T> {
  assertM05Permission(actor, "roster.bulk");
  const cap = options?.notificationCap ?? DEFAULT_NOTIFICATION_CAP;
  const succeeded: BulkResult<T>["succeeded"] = [];
  const failed: BulkResult<T>["failed"] = [];
  const skippedOutOfScope: string[] = [];
  const skippedDuplicate: string[] = [];
  const seen = new Set<string>();
  let notificationsIssued = 0;

  for (const op of ops) {
    if (seen.has(op.idempotencyKey)) {
      skippedDuplicate.push(op.idempotencyKey);
      continue;
    }
    seen.add(op.idempotencyKey);
    if (!isInActorClinicScope(actor, op.clinicId)) {
      skippedOutOfScope.push(op.idempotencyKey);
      failed.push({
        idempotencyKey: op.idempotencyKey,
        kind: op.kind,
        error: new M05ClinicScopeError().message,
      });
      continue;
    }
    try {
      let result: unknown;
      switch (op.kind) {
        case "create-shift": {
          const shift: Shift = createShift(actor, {
            rosterPeriodId: coerceStringField(op.payload, "rosterPeriodId"),
            clinicId: op.clinicId,
            organisationId: coerceOptional(op.payload, "organisationId"),
            localStartYmd: coerceStringField(op.payload, "localStartYmd"),
            localStartHm: coerceStringField(op.payload, "localStartHm"),
            localEndYmd: coerceStringField(op.payload, "localEndYmd"),
            localEndHm: coerceStringField(op.payload, "localEndHm"),
            fold: coerceFold(op.payload),
            roleLabel: coerceOptional(op.payload, "roleLabel"),
            requiredCount:
              typeof op.payload.requiredCount === "number" ? op.payload.requiredCount : undefined,
          });
          result = shift;
          break;
        }
        case "assign-person": {
          const asg: Assignment = assignPerson(actor, {
            shiftId: coerceStringField(op.payload, "shiftId"),
            personId: coerceStringField(op.payload, "personId"),
            expectedShiftVersion: Number(op.payload.expectedShiftVersion),
            overrideReason: coerceOptional(op.payload, "overrideReason"),
          });
          result = asg;
          break;
        }
        case "cancel-shift": {
          const shift = store.getShift(coerceStringField(op.payload, "shiftId"));
          if (!shift) throw new Error(`Shift not found: ${op.payload.shiftId}`);
          result = shift;
          break;
        }
        default:
          throw new Error(`Unsupported bulk op kind: ${(op as { kind: string }).kind}`);
      }
      succeeded.push({ idempotencyKey: op.idempotencyKey, kind: op.kind, result: result as T });
      if (notificationsIssued < cap) notificationsIssued += 1;
    } catch (err) {
      failed.push({
        idempotencyKey: op.idempotencyKey,
        kind: op.kind,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const notificationsSuppressed = Math.max(0, succeeded.length - notificationsIssued);
  appendRosterAudit({
    actorId: actor.userId,
    action: "bulk.submitted",
    targetType: "bulk-operation",
    targetId: `bulk-${Date.now()}`,
    detail: {
      total: ops.length,
      succeeded: succeeded.length,
      failed: failed.length,
      skippedDuplicate: skippedDuplicate.length,
      skippedOutOfScope: skippedOutOfScope.length,
      notificationsSuppressed,
    },
  });

  return {
    succeeded,
    failed,
    skippedOutOfScope,
    skippedDuplicate,
    notificationsSuppressed,
  };
}
