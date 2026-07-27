/** M04 Staff & Doctor Management — domain records (module SoT). */

export type PersonKind = "staff" | "doctor";

export type WorkforcePersonStatus =
  | "Active"
  | "Suspended"
  | "Archived"
  | "Onboarding"
  | "Offboarding";

export type RestrictionSensitivity =
  | "Standard"
  | "Restricted"
  | "Confidential"
  | "Highly Confidential";

export type EmploymentType =
  | "Full-time"
  | "Part-time"
  | "Casual"
  | "Contract"
  | "Locum"
  | "Other";

export type LeaveRequestStatus = "Pending" | "Approved" | "Rejected" | "Cancelled";

export type CredentialStatus = "valid" | "expired" | "invalid" | "pending";

export type OnboardingStatus = "Not Started" | "In Progress" | "Complete" | "Cancelled";

export type OffboardingStatus = "Not Started" | "In Progress" | "Complete" | "Incomplete";

export type ReadinessLevel = "ready" | "blocked" | "advisory" | "unknown";

export interface WorkforcePerson {
  id: string;
  legacyId?: string;
  personKind: PersonKind;
  preferredName: string;
  email: string;
  status: WorkforcePersonStatus;
  clinicIds: string[];
  organisationId: string;
  createdAt: string;
  updatedAt: string;
  /** Monotonic version for event envelopes. */
  version: number;
  phone?: string;
  roleLabel?: string;
}

export interface Engagement {
  id: string;
  personId: string;
  clinicId: string;
  organisationId: string;
  roleLabel: string;
  employmentType: EmploymentType | string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  status: "Active" | "Ended" | "Draft";
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface Credential {
  id: string;
  personId: string;
  clinicId?: string;
  organisationId: string;
  credentialType: string;
  status: CredentialStatus;
  expiresOn?: string | null;
  verified: boolean;
  verifiedAt?: string | null;
  verifiedBy?: string | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface LeaveRequest {
  id: string;
  personId: string;
  clinicId?: string;
  organisationId: string;
  startDate: string;
  endDate: string;
  leaveType: string;
  status: LeaveRequestStatus;
  requestedBy: string;
  approvedBy?: string | null;
  decidedAt?: string | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface AvailabilityWindow {
  id: string;
  personId: string;
  clinicId?: string;
  organisationId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface Restriction {
  id: string;
  personId: string;
  clinicId?: string;
  organisationId: string;
  sensitivity: RestrictionSensitivity;
  title: string;
  /** May be masked in service output when actor lacks restriction.view_sensitive. */
  detail: string;
  reason: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  status: "Active" | "Expired" | "Lifted";
  createdAt: string;
  updatedAt: string;
  version: number;
  /** True when sensitive fields were redacted for the caller. */
  masked?: boolean;
}

export interface OnboardingRecord {
  id: string;
  personId: string;
  organisationId: string;
  clinicId?: string;
  status: OnboardingStatus;
  checklist: string[];
  completedItems: string[];
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface OffboardingRecord {
  id: string;
  personId: string;
  organisationId: string;
  clinicId?: string;
  status: OffboardingStatus;
  openResponsibilities: string[];
  transferredToPersonId?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface ReadinessCache {
  personId: string;
  readiness: ReadinessLevel;
  blockers: Array<{
    code: string;
    label: string;
    owningModuleId: string;
    sourceRecordId?: string;
    severity: "blocking" | "advisory";
  }>;
  calculatedAt: string;
  /** Fingerprints of credential/leave/restriction/engagement sources used. */
  sourceVersions: Record<string, number | string>;
}

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

export type M04SectionId =
  | "overview"
  | "people"
  | "staff-profiles"
  | "doctor-profiles"
  | "engagements"
  | "credentials"
  | "leave-availability"
  | "restrictions"
  | "onboarding"
  | "offboarding"
  | "reports"
  | "settings";

/** Legacy section aliases accepted via ?section= */
export const M04_SECTION_ALIASES: Record<string, M04SectionId> = {
  staff: "people",
  doctors: "doctor-profiles",
  employment: "engagements",
  "hr-documents": "credentials",
  availability: "leave-availability",
};
