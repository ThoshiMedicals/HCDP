import { uid } from "@/platform/storage/storage";
import type { M07Actor } from "../permissions";
import { appendAudit, newAuditId } from "../repository/local-store";
import type { M07AuditEvent } from "../types/domain";

/**
 * Internal audit fail flag. Production builds (NODE_ENV=production) ignore setters.
 */
let __m07AuditFailForTests = false;

function allowTestHooks(): boolean {
  return typeof process === "undefined" || process.env.NODE_ENV !== "production";
}

/**
 * Test-only. No-ops when NODE_ENV === "production".
 * Prefer importing via tests/_helpers rather than production UI.
 */
export function __setM07AuditFailForTests(fail: boolean): void {
  if (!allowTestHooks()) return;
  __m07AuditFailForTests = fail;
}

/** @deprecated Use __setM07AuditFailForTests — retained for older remediation tests. */
export function setM07AuditFailForTests(fail: boolean): void {
  __setM07AuditFailForTests(fail);
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
  if (__m07AuditFailForTests && allowTestHooks()) {
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
