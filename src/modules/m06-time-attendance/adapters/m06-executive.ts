/** M01 aggregate projections only — no raw location/biometric/evidence. */

import { listApprovals, listExceptions, listOfflineQueue, listSessions } from "../repository/local-store";

export type AttendanceExecutiveCounts = {
  openSessions: number;
  openExceptions: number;
  pendingApprovals: number;
  offlineConflicts: number;
};

export function getAttendanceCounts(clinicId?: string): AttendanceExecutiveCounts {
  const sessions = listSessions(clinicId).filter((s) => s.state === "open" || s.state === "on_break");
  const exceptions = listExceptions(clinicId).filter(
    (e) => e.state === "open" || e.state === "explained" || e.state === "escalated"
  );
  const approvals = listApprovals(clinicId).filter((a) => a.state === "pending");
  const offlineConflicts = listOfflineQueue().filter(
    (o) => o.state === "conflict" && (!clinicId || o.clinicId === clinicId)
  );
  return {
    openSessions: sessions.length,
    openExceptions: exceptions.length,
    pendingApprovals: approvals.length,
    offlineConflicts: offlineConflicts.length,
  };
}
