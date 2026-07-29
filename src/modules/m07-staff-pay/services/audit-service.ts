import { uid } from "@/platform/storage/storage";
import type { M07Actor } from "../permissions";
import { appendAudit, newAuditId } from "../repository/local-store";
import type { M07AuditEvent } from "../types/domain";

/**
 * Test-only fail-closed hook. When set, `recordM07Audit` throws so callers
 * must refuse success (download / unlock / locked-source controls).
 * Never enable in production UI paths.
 */
let __m07AuditFailForTests = false;

export function setM07AuditFailForTests(fail: boolean): void {
  __m07AuditFailForTests = fail;
}

export function recordM07Audit(input: {
  actor: M07Actor;
  action: string;
  entityType: string;
  entityId: string;
  legalEntityId: string;
  clinicId?: string;
  before?: unknown;
  after?: unknown;
  reason?: string;
  meta?: Record<string, unknown>;
}): M07AuditEvent {
  if (__m07AuditFailForTests) {
    throw new Error("m07-audit-fail-for-tests");
  }
  const event: M07AuditEvent = {
    id: newAuditId() || uid("paud"),
    at: new Date().toISOString(),
    actorUserId: input.actor.userId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    legalEntityId: input.legalEntityId,
    clinicId: input.clinicId,
    before: input.before,
    after: input.after,
    reason: input.reason,
    meta: input.meta,
  };
  return appendAudit(event);
}
