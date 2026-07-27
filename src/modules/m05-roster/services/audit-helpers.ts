/**
 * Thin M05 audit helper — normalises common audit entry construction.
 * All service mutations append here before returning.
 */

import type { RosterAuditEntry } from "../types/domain";
import * as store from "../repository/local-store";

export type AppendRosterAuditInput = Omit<
  RosterAuditEntry,
  "id" | "occurredAt"
> & {
  occurredAt?: string;
};

export function appendRosterAudit(input: AppendRosterAuditInput): RosterAuditEntry {
  const entry: RosterAuditEntry = {
    id: store.newAuditId(),
    occurredAt: input.occurredAt ?? new Date().toISOString(),
    actorId: input.actorId,
    organisationId: input.organisationId,
    clinicId: input.clinicId,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    detail: input.detail,
  };
  return store.appendAuditEntry(entry);
}
