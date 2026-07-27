/**
 * M05 versioned conflict/fatigue/coverage/publication policy shapes.
 * Rules expose ruleId / version / severity / explanation / remediation so
 * conflicts are explainable (§9 of the Wave 4 plan).
 *
 * NOTE: These are prototype policies. They MUST NOT be represented as
 * industrial award / employment-law / clinical-safety compliance certification.
 */

export type ConflictRuleSeverity = "block" | "warn" | "info";

export type ConflictRuleId =
  | "overlap"
  | "min_break"
  | "max_daily_hours"
  | "max_weekly_hours"
  | "consecutive_days"
  | "cross_midnight"
  | "travel_time"
  | "readiness_expiry"
  | "availability_conflict"
  | "approved_leave_clash";

export interface ConflictRuleBase {
  id: ConflictRuleId;
  ruleVersion: number;
  severity: ConflictRuleSeverity;
  label: string;
  enabled: boolean;
  /**
   * When true this rule is not overridable via `roster.override` and must
   * always block (e.g. missing person, unresolved TZ for authoritative calc).
   */
  neverOverridable?: boolean;
}

export interface OverlapRule extends ConflictRuleBase {
  id: "overlap";
}
export interface MinBreakRule extends ConflictRuleBase {
  id: "min_break";
  minBreakMinutes: number;
}
export interface MaxDailyHoursRule extends ConflictRuleBase {
  id: "max_daily_hours";
  maxHoursPerDay: number;
}
export interface MaxWeeklyHoursRule extends ConflictRuleBase {
  id: "max_weekly_hours";
  maxHoursPerWeek: number;
}
export interface ConsecutiveDaysRule extends ConflictRuleBase {
  id: "consecutive_days";
  maxConsecutiveDays: number;
}

export type ConflictPolicyRule =
  | OverlapRule
  | MinBreakRule
  | MaxDailyHoursRule
  | MaxWeeklyHoursRule
  | ConsecutiveDaysRule
  | (ConflictRuleBase & { id: Exclude<ConflictRuleId, OverlapRule["id"] | MinBreakRule["id"] | MaxDailyHoursRule["id"] | MaxWeeklyHoursRule["id"] | ConsecutiveDaysRule["id"]> });

export type ConflictPolicyStatus = "draft" | "published" | "archived";

export interface ConflictPolicy {
  id: string;
  policyVersion: number;
  organisationId: string;
  clinicIds: string[];
  status: ConflictPolicyStatus;
  label: string;
  rules: ConflictPolicyRule[];
  publishedAt?: string | null;
  archivedAt?: string | null;
  createdAt: string;
  createdBy: string;
}

export const DEFAULT_CONFLICT_POLICY_RULES: ConflictPolicyRule[] = [
  { id: "overlap", ruleVersion: 1, severity: "block", label: "Overlapping shifts", enabled: true },
  {
    id: "min_break",
    ruleVersion: 1,
    severity: "warn",
    label: "Minimum break between shifts",
    minBreakMinutes: 8 * 60,
    enabled: true,
  },
  {
    id: "max_daily_hours",
    ruleVersion: 1,
    severity: "warn",
    label: "Maximum scheduled hours per day",
    maxHoursPerDay: 12,
    enabled: true,
  },
  {
    id: "max_weekly_hours",
    ruleVersion: 1,
    severity: "warn",
    label: "Maximum scheduled hours per week",
    maxHoursPerWeek: 48,
    enabled: true,
  },
  {
    id: "consecutive_days",
    ruleVersion: 1,
    severity: "warn",
    label: "Maximum consecutive days worked",
    maxConsecutiveDays: 6,
    enabled: true,
  },
  {
    id: "approved_leave_clash",
    ruleVersion: 1,
    severity: "block",
    label: "Approved leave clash",
    enabled: true,
  },
];
