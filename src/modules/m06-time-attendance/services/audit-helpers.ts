import { appendAudit, newAuditId } from "../repository/local-store";
import type { AttendanceAuditEntry } from "../types/domain";

export function writeAudit(input: {
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  detail?: string;
  clinicId?: string;
}): AttendanceAuditEntry {
  return appendAudit({
    id: newAuditId(),
    at: new Date().toISOString(),
    ...input,
  });
}
