import { uid } from "@/platform/storage/storage";
import type { M07Actor } from "../permissions";
import { appendAudit, newAuditId } from "../repository/local-store";
import type { M07AuditEvent } from "../types/domain";

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
