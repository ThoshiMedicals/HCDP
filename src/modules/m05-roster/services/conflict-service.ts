/**
 * M05 conflict + fatigue engine.
 *
 * Applies rules from the currently published `ConflictPolicy`:
 *  - overlap (block by default)
 *  - min_break (warn)
 *  - max_daily_hours (warn)
 *  - max_weekly_hours (warn)
 *  - consecutive_days (warn)
 *  - approved_leave_clash (block)
 *
 * Each result exposes ruleId / ruleVersion / severity / explanation / remediation.
 * Prototype rules — MUST NOT be represented as employment-law compliance.
 */

import type {
  ConflictPolicy,
  ConflictPolicyRule,
  ConflictRuleSeverity,
} from "../types/policy";
import type { Assignment, Shift } from "../types/domain";
import * as store from "../repository/local-store";
import { listApprovedLeaveForPerson } from "./availability-read-service";

const DEFAULT_ORG = "org_parent";
const MS_HOUR = 3_600_000;
const MS_DAY = 86_400_000;

export interface ConflictFinding {
  ruleId: string;
  ruleVersion: number;
  severity: ConflictRuleSeverity;
  description: string;
  remediation?: string;
  personId: string;
  clinicId: string;
  offendingShiftIds: string[];
}

export interface EvaluateConflictInput {
  personId: string;
  clinicId: string;
  candidateShift: Pick<
    Shift,
    | "id"
    | "clinicId"
    | "utcStart"
    | "utcEnd"
    | "localStart"
    | "localEnd"
    | "rosterPeriodId"
    | "organisationId"
  >;
  /** When comparing against existing assignments, exclude this assignment id. */
  excludeAssignmentId?: string;
  organisationId?: string;
  policy?: ConflictPolicy;
}

function getPolicyOrDefault(organisationId: string, override?: ConflictPolicy): ConflictPolicy | null {
  return override ?? store.getActiveConflictPolicy(organisationId);
}

function rulesById(policy: ConflictPolicy): Map<ConflictPolicyRule["id"], ConflictPolicyRule> {
  const map = new Map<ConflictPolicyRule["id"], ConflictPolicyRule>();
  for (const r of policy.rules) if (r.enabled) map.set(r.id, r);
  return map;
}

function otherShiftsForPerson(
  personId: string,
  excludeAssignmentId: string | undefined,
  candidateShiftId: string
): Shift[] {
  const activeStates: Assignment["state"][] = ["assigned"];
  const assignments = store
    .listAssignmentsForPerson(personId)
    .filter((a) => activeStates.includes(a.state))
    .filter((a) => (excludeAssignmentId ? a.id !== excludeAssignmentId : true))
    .filter((a) => a.shiftId !== candidateShiftId);
  const shifts: Shift[] = [];
  for (const a of assignments) {
    const s = store.getShift(a.shiftId);
    if (s && !["cancelled", "superseded"].includes(s.status)) shifts.push(s);
  }
  return shifts;
}

function hoursBetween(fromIso: string, toIso: string): number {
  return (new Date(toIso).getTime() - new Date(fromIso).getTime()) / MS_HOUR;
}

function ymdToUtc(ymd: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  return Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

function daysBetween(fromDate: string, toDate: string): number {
  return Math.round((ymdToUtc(toDate) - ymdToUtc(fromDate)) / MS_DAY);
}

export function evaluateConflicts(input: EvaluateConflictInput): ConflictFinding[] {
  const policy = getPolicyOrDefault(input.organisationId ?? DEFAULT_ORG, input.policy);
  if (!policy) return [];
  const enabled = rulesById(policy);

  const findings: ConflictFinding[] = [];
  const others = otherShiftsForPerson(input.personId, input.excludeAssignmentId, input.candidateShift.id);
  const candidateStart = new Date(input.candidateShift.utcStart).getTime();
  const candidateEnd = new Date(input.candidateShift.utcEnd).getTime();
  const candidateHours = (candidateEnd - candidateStart) / MS_HOUR;
  const candidateDayLocal = input.candidateShift.localStart.slice(0, 10);

  // ——— Overlap ———
  const overlapRule = enabled.get("overlap");
  if (overlapRule) {
    for (const other of others) {
      const os = new Date(other.utcStart).getTime();
      const oe = new Date(other.utcEnd).getTime();
      if (candidateStart < oe && os < candidateEnd) {
        findings.push({
          ruleId: overlapRule.id,
          ruleVersion: overlapRule.ruleVersion,
          severity: overlapRule.severity,
          description: `Overlapping shift for ${input.personId}: ${input.candidateShift.id} vs ${other.id}`,
          remediation: "Reassign a different worker or cancel one of the overlapping shifts",
          personId: input.personId,
          clinicId: input.clinicId,
          offendingShiftIds: [input.candidateShift.id, other.id],
        });
      }
    }
  }

  // ——— Min break ———
  const minBreakRule = enabled.get("min_break") as (ConflictPolicyRule & { minBreakMinutes?: number }) | undefined;
  if (minBreakRule) {
    const minBreakMs = ((minBreakRule as { minBreakMinutes?: number }).minBreakMinutes ?? 0) * 60_000;
    for (const other of others) {
      const os = new Date(other.utcStart).getTime();
      const oe = new Date(other.utcEnd).getTime();
      const gapAfterCandidate = os - candidateEnd;
      const gapBeforeCandidate = candidateStart - oe;
      if (gapAfterCandidate >= 0 && gapAfterCandidate < minBreakMs) {
        findings.push({
          ruleId: minBreakRule.id,
          ruleVersion: minBreakRule.ruleVersion,
          severity: minBreakRule.severity,
          description: `Break after ${input.candidateShift.id} before ${other.id} is less than the minimum`,
          remediation: "Adjust shift times to preserve minimum break",
          personId: input.personId,
          clinicId: input.clinicId,
          offendingShiftIds: [input.candidateShift.id, other.id],
        });
      }
      if (gapBeforeCandidate >= 0 && gapBeforeCandidate < minBreakMs) {
        findings.push({
          ruleId: minBreakRule.id,
          ruleVersion: minBreakRule.ruleVersion,
          severity: minBreakRule.severity,
          description: `Break before ${input.candidateShift.id} after ${other.id} is less than the minimum`,
          remediation: "Adjust shift times to preserve minimum break",
          personId: input.personId,
          clinicId: input.clinicId,
          offendingShiftIds: [other.id, input.candidateShift.id],
        });
      }
    }
  }

  // ——— Max daily hours ———
  const maxDailyRule = enabled.get("max_daily_hours") as (ConflictPolicyRule & { maxHoursPerDay?: number }) | undefined;
  if (maxDailyRule) {
    const sameDay = others.filter((o) => o.localStart.slice(0, 10) === candidateDayLocal);
    const totalHours = sameDay.reduce((sum, o) => sum + hoursBetween(o.utcStart, o.utcEnd), candidateHours);
    const cap = (maxDailyRule as { maxHoursPerDay?: number }).maxHoursPerDay ?? 24;
    if (totalHours > cap) {
      findings.push({
        ruleId: maxDailyRule.id,
        ruleVersion: maxDailyRule.ruleVersion,
        severity: maxDailyRule.severity,
        description: `Total scheduled hours ${totalHours.toFixed(1)}h on ${candidateDayLocal} exceed daily cap ${cap}h`,
        remediation: "Reduce daily hours or authorise override",
        personId: input.personId,
        clinicId: input.clinicId,
        offendingShiftIds: [input.candidateShift.id, ...sameDay.map((s) => s.id)],
      });
    }
  }

  // ——— Max weekly hours ———
  const maxWeeklyRule = enabled.get("max_weekly_hours") as (ConflictPolicyRule & { maxHoursPerWeek?: number }) | undefined;
  if (maxWeeklyRule) {
    const weekOthers = others.filter((o) => {
      const diff = Math.abs(
        new Date(o.utcStart).getTime() - new Date(input.candidateShift.utcStart).getTime()
      );
      return diff < 7 * MS_DAY;
    });
    const totalHours = weekOthers.reduce(
      (sum, o) => sum + hoursBetween(o.utcStart, o.utcEnd),
      candidateHours
    );
    const cap = (maxWeeklyRule as { maxHoursPerWeek?: number }).maxHoursPerWeek ?? 168;
    if (totalHours > cap) {
      findings.push({
        ruleId: maxWeeklyRule.id,
        ruleVersion: maxWeeklyRule.ruleVersion,
        severity: maxWeeklyRule.severity,
        description: `Weekly scheduled hours ${totalHours.toFixed(1)}h exceed cap ${cap}h`,
        remediation: "Reduce weekly hours or authorise override",
        personId: input.personId,
        clinicId: input.clinicId,
        offendingShiftIds: [input.candidateShift.id, ...weekOthers.map((s) => s.id)],
      });
    }
  }

  // ——— Consecutive days ———
  const consecutiveRule = enabled.get("consecutive_days") as
    | (ConflictPolicyRule & { maxConsecutiveDays?: number })
    | undefined;
  if (consecutiveRule) {
    const cap = (consecutiveRule as { maxConsecutiveDays?: number }).maxConsecutiveDays ?? 7;
    const allDays = new Set<string>([candidateDayLocal, ...others.map((o) => o.localStart.slice(0, 10))]);
    const sorted = [...allDays].sort();
    let streak = 1;
    for (let i = 1; i < sorted.length; i++) {
      const gap = daysBetween(sorted[i - 1]!, sorted[i]!);
      if (gap === 1) streak += 1;
      else streak = 1;
      if (streak > cap) {
        findings.push({
          ruleId: consecutiveRule.id,
          ruleVersion: consecutiveRule.ruleVersion,
          severity: consecutiveRule.severity,
          description: `Consecutive days ${streak} exceed cap ${cap}`,
          remediation: "Insert a rest day or authorise override",
          personId: input.personId,
          clinicId: input.clinicId,
          offendingShiftIds: [input.candidateShift.id],
        });
        break;
      }
    }
  }

  // ——— Approved leave clash (block; also covered by eligibility, retained for policy explainability) ———
  const leaveRule = enabled.get("approved_leave_clash");
  if (leaveRule) {
    const from = input.candidateShift.localStart.slice(0, 10);
    const to = input.candidateShift.localEnd.slice(0, 10);
    const clashes = listApprovedLeaveForPerson(input.personId, input.clinicId).filter(
      (r) => r.localFromDate <= to && r.localToDate >= from
    );
    for (const clash of clashes) {
      findings.push({
        ruleId: leaveRule.id,
        ruleVersion: leaveRule.ruleVersion,
        severity: leaveRule.severity,
        description: `Approved leave ${clash.localFromDate}..${clash.localToDate} clashes with candidate shift`,
        remediation: "Assign a different worker; approved leave clash cannot be silently overridden",
        personId: input.personId,
        clinicId: input.clinicId,
        offendingShiftIds: [input.candidateShift.id],
      });
    }
  }

  return findings;
}
