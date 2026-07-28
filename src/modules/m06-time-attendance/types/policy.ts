/** Versioned attendance policy rules (prototype — not law/award/payroll certification). */

export interface AttendancePolicy {
  id: string;
  clinicId: string;
  version: number;
  state: "draft" | "published" | "archived";
  earlyInMinutes: number;
  lateInGraceMinutes: number;
  earlyOutMinutes: number;
  missedInAfterMinutes: number;
  missedOutAfterMinutes: number;
  maxSessionHours: number;
  allowUnrostered: boolean;
  requireBreakMinutes: number;
  deviceSkewWarnMinutes: number;
  roundingMinutes: number;
  seedBatchId?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export const DEFAULT_POLICY: Omit<AttendancePolicy, "id" | "clinicId" | "createdAt" | "updatedAt"> = {
  version: 1,
  state: "published",
  earlyInMinutes: 15,
  lateInGraceMinutes: 5,
  earlyOutMinutes: 15,
  missedInAfterMinutes: 30,
  missedOutAfterMinutes: 30,
  maxSessionHours: 16,
  allowUnrostered: true,
  requireBreakMinutes: 30,
  deviceSkewWarnMinutes: 10,
  roundingMinutes: 0,
};
