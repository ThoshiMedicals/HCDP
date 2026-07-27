/**
 * M05 Roster — module SoT domain records.
 *
 * Publication is IMMUTABLE. Acknowledgement rolls up onto the publication as
 * a derived `acknowledgementStatus` of "none" | "partial" | "full". There is
 * NO `partially_acknowledged` / `fully_acknowledged` period lifecycle state.
 * Period stays `published` until superseded / cancelled / archived.
 */

import type { FoldFlag } from "./timezone";

// ——— Roster period ———

export type PeriodLifecycleState =
  | "draft"
  | "under_review"
  | "ready_to_publish"
  | "published"
  | "superseded"
  | "cancelled"
  | "archived";

export interface RosterPeriod {
  id: string;
  organisationId: string;
  clinicId: string;
  label: string;
  /** Clinic-local YYYY-MM-DD (§4 rule — clinic IANA TZ). */
  startsOn: string;
  endsOn: string;
  timeZoneId?: string;
  lifecycleState: PeriodLifecycleState;
  seedBatchId?: string | null;
  cancelReason?: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  version: number;
}

// ——— Shifts ———

export type ShiftLifecycleStatus =
  | "draft"
  | "unassigned"
  | "assigned"
  | "open"
  | "offered"
  | "accepted"
  | "declined"
  | "cancelled"
  | "completed-reference"
  | "superseded";

export interface Shift {
  id: string;
  rosterPeriodId: string;
  clinicId: string;
  organisationId: string;
  status: ShiftLifecycleStatus;
  /** IANA timezone id at write time (clinic authoritative TZ). */
  timeZoneId: string;
  localStart: string;
  localEnd: string;
  utcStart: string;
  utcEnd: string;
  startOffsetMinutes: number;
  endOffsetMinutes: number;
  startFold: FoldFlag;
  endFold: FoldFlag;
  crossesLocalMidnight: boolean;
  roleLabel?: string;
  requiredCapability?: string | null;
  requiredCount: number;
  breakPlannedMinutes?: number | null;
  splitGroupId?: string | null;
  supersedesId?: string | null;
  supersededById?: string | null;
  cancelReason?: string | null;
  currentAssignmentId?: string | null;
  seedBatchId?: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  version: number;
}

// ——— Assignments (append-only history) ———

export type AssignmentState =
  | "assigned"
  | "replaced"
  | "cancelled"
  | "invalidated"
  | "superseded";

export interface Assignment {
  id: string;
  shiftId: string;
  rosterPeriodId: string;
  clinicId: string;
  organisationId: string;
  personId: string;
  state: AssignmentState;
  assignedAt: string;
  assignedBy: string;
  replacedById?: string | null;
  replacesId?: string | null;
  overrideReason?: string | null;
  overrideBy?: string | null;
  invalidationReason?: string | null;
  publicationId?: string | null;
  seedBatchId?: string | null;
  createdAt: string;
  updatedAt: string;
  /** Immutable once created — corrections create new rows via replacesId. */
  version: 1;
}

// ——— Open shifts ———

export type OpenShiftLifecycleStatus =
  | "open"
  | "offered"
  | "eoi_received"
  | "selected"
  | "closed"
  | "withdrawn"
  | "expired"
  | "escalated";

export interface OpenShiftApplicant {
  personId: string;
  appliedAt: string;
  status: "applied" | "withdrawn" | "selected" | "declined";
}

export interface OpenShift {
  id: string;
  shiftId: string;
  rosterPeriodId: string;
  clinicId: string;
  organisationId: string;
  status: OpenShiftLifecycleStatus;
  audiencePersonIds: string[];
  applicants: OpenShiftApplicant[];
  selectedPersonId?: string | null;
  closedAt?: string | null;
  escalatedLevel?: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  version: number;
}

// ——— Swap requests ———

export type SwapLifecycleStatus =
  | "requested"
  | "proposed"
  | "recipient_accepted"
  | "approved"
  | "rejected"
  | "withdrawn"
  | "expired";

export interface SwapRequest {
  id: string;
  shiftId: string;
  rosterPeriodId: string;
  clinicId: string;
  organisationId: string;
  requesterPersonId: string;
  recipientPersonId?: string | null;
  status: SwapLifecycleStatus;
  requestedAt: string;
  respondedAt?: string | null;
  approvedAt?: string | null;
  approvedBy?: string | null;
  rejectedReason?: string | null;
  resultingAssignmentId?: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

// ——— Publications (immutable snapshot) ———

export type PublicationAcknowledgementStatus = "none" | "partial" | "full";

export interface PublicationShiftSnapshot {
  shiftId: string;
  personId?: string | null;
  timeZoneId: string;
  localStart: string;
  localEnd: string;
  utcStart: string;
  utcEnd: string;
  roleLabel?: string;
}

export interface PublicationWarningSummary {
  ruleId: string;
  ruleVersion: number;
  severity: "block" | "warn";
  description: string;
  overrideReason?: string | null;
}

export interface RosterPublication {
  id: string;
  rosterPeriodId: string;
  clinicId: string;
  organisationId: string;
  publicationVersion: number;
  publishedAt: string;
  publishedBy: string;
  asOf: string;
  timeZoneId: string;
  /** Immutable copy of assignments at publish time. */
  assignments: PublicationShiftSnapshot[];
  warnings: PublicationWarningSummary[];
  supersedesId?: string | null;
  supersededById?: string | null;
  /** DERIVED — computed from acknowledgement rows on lookup / update. */
  acknowledgementStatus: PublicationAcknowledgementStatus;
  requiredAcknowledgerPersonIds: string[];
  cancelReason?: string | null;
  seedBatchId?: string | null;
  createdAt: string;
  /** Publication body is immutable — version fixed at 1; supersede via supersedesId. */
  version: 1;
}

// ——— Acknowledgements ———

export type AcknowledgementOutcome = "acknowledged" | "declined";

export interface Acknowledgement {
  id: string;
  publicationId: string;
  publicationVersion: number;
  personId: string;
  outcome: AcknowledgementOutcome;
  respondedAt: string;
  note?: string | null;
  createdAt: string;
  version: 1;
}

// ——— Availability declarations (roster-side preferences ONLY — NOT M04 leave SoT) ———

export type AvailabilityDeclarationKind = "preferred" | "unavailable";

export interface RosterAvailabilityDeclaration {
  id: string;
  rosterPeriodId: string;
  personId: string;
  clinicId: string;
  organisationId: string;
  kind: AvailabilityDeclarationKind;
  localFromDate: string;
  localToDate: string;
  note?: string | null;
  createdAt: string;
  createdBy: string;
  version: number;
}

// ——— M04-approved leave cache (read-through contract stub — populated ONLY via contract) ———

export interface ApprovedLeaveCacheRow {
  id: string;
  personId: string;
  clinicId?: string;
  organisationId: string;
  /** Clinic-local YYYY-MM-DD range. */
  localFromDate: string;
  localToDate: string;
  reasonCategory?: string;
  source: "m04-contract";
  loadedAt: string;
}

// ——— Coverage calculation ———

export type CoverageGapSeverity = "hard" | "soft";

export interface CoverageRequirement {
  id: string;
  rosterPeriodId: string;
  clinicId: string;
  organisationId: string;
  roleLabel: string;
  requiredCount: number;
  /** Clinic-local day the requirement applies to. */
  localDate: string;
  /** Clinic-local time window HH:mm-HH:mm (optional). */
  localStartTime?: string | null;
  localEndTime?: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface CoverageGap {
  requirementId: string;
  rosterPeriodId: string;
  clinicId: string;
  roleLabel: string;
  localDate: string;
  severity: CoverageGapSeverity;
  missingCount: number;
  filledCount: number;
  requiredCount: number;
  reason: string;
  asOf: string;
}

// ——— Cost forecasts (planning-only; NOT payroll truth) ———

export interface CostForecastLineItem {
  personId?: string | null;
  roleLabel?: string | null;
  hoursOrdinary: number;
  hoursOvertime: number;
  ratePerHour?: number | null;
  allowancesTotal?: number | null;
  onCostsTotal?: number | null;
  subtotal?: number | null;
  missingRate?: boolean;
  clinicId: string;
}

export interface CostForecast {
  id: string;
  rosterPeriodId: string;
  clinicId: string;
  organisationId: string;
  asOf: string;
  planningOnly: true;
  currency: string;
  ordinaryTotal: number;
  overtimeTotal: number;
  allowancesTotal: number;
  onCostsTotal: number;
  grandTotal: number;
  lineItems: CostForecastLineItem[];
  warnings: string[];
  createdAt: string;
  createdBy: string;
  version: number;
}

// ——— Audit trail ———

export interface RosterAuditEntry {
  id: string;
  organisationId?: string;
  clinicId?: string;
  actorId: string;
  action: string;
  targetType:
    | "period"
    | "shift"
    | "assignment"
    | "open-shift"
    | "swap"
    | "publication"
    | "acknowledgement"
    | "cost-forecast"
    | "policy"
    | "bulk-operation"
    | "availability"
    | "system";
  targetId: string;
  detail?: Record<string, unknown>;
  occurredAt: string;
}

// ——— Migration report ———

export interface MigrationReport {
  migrationId: string;
  sourceCount: number;
  migratedCount: number;
  duplicates: number;
  rejected: number;
  warnings: string[];
  unresolved: string[];
  ranAt: string;
}

// ——— Section ids ———

export type M05SectionId =
  | "roster-board"
  | "coverage"
  | "open-shifts"
  | "availability-leave"
  | "requests"
  | "conflicts-warnings"
  | "published-history"
  | "cost-forecast"
  | "reports"
  | "settings";

export const M05_SECTION_ALIASES: Record<string, M05SectionId> = {
  "roster-grid": "roster-board",
  "shift-swaps": "requests",
  publish: "published-history",
  swaps: "requests",
  history: "published-history",
  policy: "settings",
  policies: "settings",
  leave: "availability-leave",
};
