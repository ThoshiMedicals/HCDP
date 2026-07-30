import { uid } from "@/platform/storage/storage";
import type { M07Actor } from "../permissions";
import { appendAudit, newAuditId } from "../repository/local-store";
import type { M07AuditEvent } from "../types/domain";
import { areM07TestHooksAllowed } from "../testing/m07-test-hooks-gate";

/**
 * Internal audit fail flag. Production / browser / unknown runtimes ignore setters (fail-closed).
 */
let __m07AuditFailForTests = false;
/** Test-only: fail only when action is in this list (takes precedence when non-null). */
let __m07AuditFailActionsForTests: string[] | null = null;

/**
 * Test-only. No-ops unless `areM07TestHooksAllowed()`.
 * Prefer importing via tests/_helpers rather than production UI.
 */
export function __setM07AuditFailForTests(fail: boolean): void {
  if (!areM07TestHooksAllowed()) return;
  __m07AuditFailForTests = fail;
  if (!fail) __m07AuditFailActionsForTests = null;
}

/**
 * Test-only. Fail recordM07Audit only for the listed action names (e.g. `["ppa.create"]`).
 * No-ops unless `areM07TestHooksAllowed()`.
 */
export function __setM07AuditFailActionsForTests(actions: string[] | null): void {
  if (!areM07TestHooksAllowed()) return;
  __m07AuditFailActionsForTests = actions ? [...actions] : null;
  __m07AuditFailForTests = false;
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
  if (areM07TestHooksAllowed()) {
    if (__m07AuditFailActionsForTests && __m07AuditFailActionsForTests.includes(input.action)) {
      throw new Error("m07-audit-fail-for-tests");
    }
    if (__m07AuditFailForTests) {
      throw new Error("m07-audit-fail-for-tests");
    }
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
