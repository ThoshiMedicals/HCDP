/** M11 Training — domain records (module SoT). */

// ——— Catalogue ———

export type CourseVersionStatus = "draft" | "published" | "archived";

export interface CourseVersion {
  versionId: string;
  courseId: string;
  versionNumber: number;
  title: string;
  description?: string;
  durationMinutes?: number;
  format: "online" | "in-person" | "blended" | "self-directed";
  status: CourseVersionStatus;
  publishedAt?: string | null;
  archivedAt?: string | null;
  createdAt: string;
  createdBy: string;
}

export interface CatalogueCourse {
  id: string;
  organisationId: string;
  courseCode: string;
  title: string;
  category?: string;
  activeVersionId?: string | null;
  versions: CourseVersion[];
  createdAt: string;
  updatedAt: string;
  version: number;
}

// ——— Assignment rules ———

export interface AssignmentRule {
  id: string;
  organisationId: string;
  courseId: string;
  /** Role labels or "*" for all. */
  targetRoleLabels: string[];
  clinicIds: string[];
  dueDays: number;
  recurrenceMonths?: number | null;
  createdAt: string;
  updatedAt: string;
  version: number;
  active: boolean;
}

// ——— Assignments ———

export type AssignmentStatus =
  | "assigned"
  | "in_progress"
  | "completed"
  | "due"
  | "grace"
  | "overdue"
  | "expired"
  | "superseded"
  | "revoked"
  | "exempt";

export interface Assignment {
  id: string;
  personId: string;
  courseId: string;
  organisationId: string;
  clinicId?: string;
  assignedBy: string;
  assignedAt: string;
  dueDate: string;
  status: AssignmentStatus;
  ruleId?: string | null;
  completionRecordId?: string | null;
  exemptionId?: string | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

// ——— Sessions ———

export type SessionStatus = "scheduled" | "cancelled" | "completed";

export interface Session {
  id: string;
  courseId: string;
  organisationId: string;
  clinicId?: string;
  facilitator?: string;
  locationLabel?: string;
  scheduledStart: string;
  scheduledEnd: string;
  capacityMax?: number | null;
  enrolledPersonIds: string[];
  attendedPersonIds: string[];
  status: SessionStatus;
  cancelledReason?: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

// ——— Assessments ———

export type AssessmentOutcome = "pass" | "fail" | "borderline";

export interface Assessment {
  id: string;
  personId: string;
  courseId: string;
  assignmentId?: string | null;
  organisationId: string;
  clinicId?: string;
  assessorId: string;
  outcome: AssessmentOutcome;
  score?: number | null;
  maxScore?: number | null;
  notes?: string;
  /** Non-null when this record supersedes a prior one. */
  supersedesId?: string | null;
  supersededById?: string | null;
  createdAt: string;
  version: number;
}

// ——— Competency records ———

export interface CompetencyRecord {
  id: string;
  personId: string;
  courseId: string;
  requirementId: string;
  organisationId: string;
  clinicId?: string;
  attestedBy: string;
  attestedAt: string;
  competencyMet: boolean;
  expiresOn?: string | null;
  notes?: string;
  supersedesId?: string | null;
  supersededById?: string | null;
  createdAt: string;
  version: number;
}

// ——— Training certificates (M11 qualification outcome, NOT M04 credential) ———

export type CertificateStatus = "issued" | "expired" | "revoked";

export interface TrainingCertificate {
  id: string;
  personId: string;
  courseId: string;
  requirementId?: string | null;
  organisationId: string;
  clinicId?: string;
  issuedAt: string;
  expiresOn?: string | null;
  status: CertificateStatus;
  issuedBy: string;
  verifiedAt?: string | null;
  verifiedBy?: string | null;
  revokedAt?: string | null;
  revokedReason?: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

// ——— Exemptions ———

export type ExemptionStatus = "request" | "approved" | "rejected" | "expired" | "revoked";

export interface Exemption {
  id: string;
  personId: string;
  courseId: string;
  requirementId?: string | null;
  organisationId: string;
  clinicId?: string;
  requestedBy: string;
  requestedAt: string;
  reason: string;
  status: ExemptionStatus;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewNotes?: string | null;
  expiresOn?: string | null;
  revokedAt?: string | null;
  revokedReason?: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

// ——— Completion records (immutable — supersede via supersedesId) ———

export interface CompletionRecord {
  id: string;
  personId: string;
  courseId: string;
  assignmentId?: string | null;
  sessionId?: string | null;
  organisationId: string;
  clinicId?: string;
  completedOn: string;
  completedBy: string;
  /** For corrections: points to the ID this record supersedes. */
  supersedesId?: string | null;
  supersededById?: string | null;
  notes?: string;
  createdAt: string;
  /** Immutable — version fixed at 1; corrections create new records. */
  version: 1;
}

// ——— Evidence records ———

export type EvidenceSource = "external" | "upload";
export type EvidenceStatus = "pending" | "verified" | "rejected";

export interface EvidenceRecord {
  id: string;
  personId: string;
  courseId?: string | null;
  requirementId?: string | null;
  assignmentId?: string | null;
  organisationId: string;
  clinicId?: string;
  source: EvidenceSource;
  label: string;
  url?: string | null;
  mimeType?: string | null;
  status: EvidenceStatus;
  uploadedBy: string;
  uploadedAt: string;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
  rejectedReason?: string | null;
  sensitive: boolean;
  createdAt: string;
  updatedAt: string;
  version: number;
}

// ——— Policy rules ———

export type PolicyRuleStatus = "draft" | "published" | "archived";

export interface PolicyRule {
  id: string;
  policyVersionId: string;
  requirementId: string;
  courseId: string;
  requirementLabel: string;
  requireCompletion: boolean;
  requireCompetency: boolean;
  /** Completion counts as competency when true; default false. */
  allowCompletionAsCompetency: boolean;
  recurrenceMonths?: number | null;
  graceDays?: number | null;
  organisationId: string;
  clinicIds: string[];
  createdAt: string;
  version: number;
}

export interface PolicyVersion {
  id: string;
  policyVersionId: string;
  organisationId: string;
  label: string;
  status: PolicyRuleStatus;
  publishedAt?: string | null;
  archivedAt?: string | null;
  rules: PolicyRule[];
  createdAt: string;
  createdBy: string;
  version: number;
}

// ——— Readiness / explanations ———

export type ReadinessExplanationStatus =
  | "met"
  | "not_met"
  | "exempt"
  | "overdue"
  | "pending"
  | "unknown";

export interface ReadinessExplanation {
  requirementId: string;
  requirementLabel: string;
  courseId: string;
  status: ReadinessExplanationStatus;
  completedOn?: string | null;
  expiresOn?: string | null;
  competencyMet: boolean;
  overrideReason?: string | null;
  sourceRecordIds: string[];
  asOf: string;
}

// ——— Audit ———

export interface AuditEntry {
  id: string;
  organisationId: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  detail?: Record<string, unknown>;
  occurredAt: string;
}

// ——— Section IDs ———

export type M11SectionId =
  | "overview"
  | "catalogue"
  | "assignments"
  | "sessions"
  | "assessments"
  | "competencies"
  | "certificates"
  | "exemptions"
  | "evidence"
  | "reports"
  | "settings";

export const M11_SECTION_ALIASES: Record<string, M11SectionId> = {
  policy: "settings",
  policies: "settings",
  records: "assignments",
  courses: "catalogue",
};

// ——— Migration ———

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
