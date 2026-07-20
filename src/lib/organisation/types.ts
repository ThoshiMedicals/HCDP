export type OrgSectionId =
  | "overview"
  | "structure"
  | "locations"
  | "departments"
  | "users"
  | "roles"
  | "access-requests"
  | "access-reviews"
  | "security"
  | "audit"
  | "reports"
  | "settings";

export type ClinicLifecycleStatus =
  | "Planned"
  | "Setup in Progress"
  | "Draft"
  | "Active"
  | "Temporarily Closed"
  | "Under Renovation"
  | "Merging"
  | "Merged"
  | "Permanently Closed"
  | "Sold or Transferred";

export type UserAccountStatus =
  | "Invited"
  | "Pending Approval"
  | "Active"
  | "Temporarily Suspended"
  | "Locked"
  | "On Leave"
  | "Access Review Required"
  | "Employment Ended"
  | "Archived";

export type RoomStatus =
  | "Active"
  | "Temporarily Unavailable"
  | "Under Maintenance"
  | "Restricted Access"
  | "Decommissioned";

export type AssignmentType =
  | "Primary Clinic"
  | "Permanent Additional Clinic"
  | "Temporary Cover"
  | "Regional Support"
  | "Organisation-Wide Access"
  | "Emergency Access"
  | "Read-Only Access";

export type PermissionLevel =
  | "No Access"
  | "View Only"
  | "Standard Access"
  | "Manager Access"
  | "Full Administration";

export type PermissionAction =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "approve"
  | "export"
  | "assign"
  | "manageSettings"
  | "viewSensitive";

export type RiskLevel = "Low" | "Medium" | "High" | "Critical";

export type RequestPriority = "Emergency" | "Urgent" | "Standard" | "Complex Administration";

export type AccessRequestStatus =
  | "Draft"
  | "Submitted"
  | "In Review"
  | "Partially Approved"
  | "Approved"
  | "Rejected"
  | "Cancelled";

export type ReviewDecision =
  | "Confirm"
  | "Remove"
  | "Reduce"
  | "Request increase"
  | "Change role"
  | "Change clinic"
  | "Suspend"
  | "Request information";

export type StructureLevel =
  | "Parent Company"
  | "Business Group"
  | "Region"
  | "Clinic"
  | "Department or Area";

export type OrgRoleName =
  | "Receptionist"
  | "Senior Receptionist"
  | "Nurse"
  | "Doctor"
  | "Practice Manager"
  | "Regional Manager"
  | "Finance Officer"
  | "Senior Administrator"
  | "Director"
  | "External Contractor"
  | "Read-Only Auditor";

export interface OrgNode {
  id: string;
  name: string;
  level: StructureLevel;
  parentId: string | null;
  clinicId?: string;
  managers?: string[];
  notes?: string;
}

export interface ReportingRelationship {
  id: string;
  clinicId: string;
  reportsToNodeId: string;
  isPrimary: boolean;
}

export interface ServiceHours {
  service:
    | "General Practice"
    | "After-Hours"
    | "Pathology"
    | "Treatment Room"
    | "Telehealth"
    | "Additional Services";
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

export interface HolidayClosure {
  id: string;
  date: string;
  name: string;
  type: "Public Holiday" | "Temporary Closure";
  reason: string;
}

export interface ReadinessItem {
  id: string;
  label: string;
  done: boolean;
  required: boolean;
}

export interface OrgClinic {
  id: string;
  name: string;
  tradingName: string;
  shortName: string;
  address: string;
  suburb: string;
  state: string;
  postcode: string;
  phone: string;
  email: string;
  status: ClinicLifecycleStatus;
  practiceManager: string;
  practiceManagerId?: string;
  regionId: string;
  businessGroupId: string;
  openingHoursSummary: string;
  serviceHours: ServiceHours[];
  holidays: HolidayClosure[];
  activeUsers: number;
  warnings: string[];
  lat: number;
  lng: number;
  isDraft: boolean;
  readiness: ReadinessItem[];
  statusReason?: string;
  statusEffectiveDate?: string;
  mergerPartnerId?: string;
  mergerMethod?: "Keep one and archive" | "Create combined clinic";
  createdAt: string;
}

export interface OrgDepartment {
  id: string;
  clinicId: string;
  name: string;
  building: string;
  floor: string;
  zone: string;
  primaryPersonId: string;
  primaryPersonName: string;
  backupPersonId: string;
  backupPersonName: string;
  status: RoomStatus;
  restricted: boolean;
  archived: boolean;
  notes?: string;
}

export interface ClinicAssignment {
  id: string;
  userId: string;
  clinicId: string;
  type: AssignmentType;
  startDate: string;
  endDate?: string;
  warningDaysSent?: number[];
  reason?: string;
}

export interface PermissionException {
  id: string;
  userId: string;
  permissionKey: string;
  level: PermissionLevel;
  reason: string;
  approvingManagerId: string;
  approvingManagerName: string;
  startDate: string;
  reviewDate: string;
  expiryDate: string;
  auditId: string;
}

export interface OrgUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: UserAccountStatus;
  primaryClinicId: string;
  role: OrgRoleName;
  secondaryRoles: OrgRoleName[];
  jobTitle: string;
  employmentType: string;
  managerId?: string;
  managerName?: string;
  startDate: string;
  trainingComplete: boolean;
  verificationComplete: boolean;
  lastLogin?: string;
  failedSignIns: number;
  emergencyAccessActive: boolean;
  accessIssues: string[];
  createdVia: "Manual entry" | "Manager request" | "Existing staff record" | "Bulk import";
}

export interface RoleDefinition {
  id: string;
  name: OrgRoleName;
  description: string;
  level: PermissionLevel;
  permissions: Record<PermissionAction, boolean>;
  sensitive: boolean;
}

export interface AccessRequestItem {
  id: string;
  label: string;
  risk: RiskLevel;
  status: "Pending" | "Approved" | "Rejected";
  decisionNote?: string;
}

export interface AccessRequest {
  id: string;
  title: string;
  requesterId: string;
  requesterName: string;
  subjectUserId: string;
  subjectUserName: string;
  clinicId: string;
  priority: RequestPriority;
  status: AccessRequestStatus;
  submittedAt: string;
  dueAt: string;
  riskSummary: string;
  riskLevel: RiskLevel;
  requiresTwoApprovers: boolean;
  approvals: { approverId: string; approverName: string; decidedAt?: string; decision?: "Approved" | "Rejected" }[];
  items: AccessRequestItem[];
  decisionHistory: string[];
}

export interface AccessReview {
  id: string;
  userId: string;
  userName: string;
  clinicId: string;
  trigger:
    | "Scheduled"
    | "Role change"
    | "Primary Clinic change"
    | "Business group change"
    | "Return from leave"
    | "Sensitive access"
    | "Inactivity"
    | "Security concern"
    | "Emergency access expiry";
  status: "Open" | "In Progress" | "Overdue" | "Completed";
  dueDate: string;
  riskLevel: RiskLevel;
  ownerName: string;
  decision?: ReviewDecision;
  notes?: string;
  completedAt?: string;
}

export interface EmergencyAccess {
  id: string;
  userId: string;
  userName: string;
  clinicId: string;
  reason: string;
  permissions: string;
  approverId: string;
  approverName: string;
  expiresAt: string;
  verified: boolean;
  active: boolean;
  reviewCreated: boolean;
}

export interface SecurityAlert {
  id: string;
  title: string;
  category:
    | "Locked account"
    | "Failed sign-in"
    | "Emergency access"
    | "Overdue review"
    | "Permission increase"
    | "Unusual export"
    | "Unassigned clinic access"
    | "High-risk administrator";
  risk: RiskLevel;
  clinicId?: string;
  userId?: string;
  createdAt: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface AuditEntry {
  id: string;
  at: string;
  actorId: string;
  actorName: string;
  entityType:
    | "User"
    | "Clinic"
    | "Assignment"
    | "Permission"
    | "Approval"
    | "Security"
    | "Export"
    | "Review"
    | "Room"
    | "Setting"
    | "Structure";
  entityId: string;
  entityLabel: string;
  field: string;
  previousValue: string;
  newValue: string;
  reason: string;
  approval?: string;
  device?: string;
  locationLabel?: string;
  relatedRequestId?: string;
  relatedReviewId?: string;
  correctionNotes: { at: string; by: string; note: string }[];
}

export interface OrgNotification {
  id: string;
  title: string;
  body: string;
  type:
    | "Access request"
    | "Permission change"
    | "Emergency access"
    | "Account lock"
    | "Critical alert"
    | "Clinic status"
    | "Access removal"
    | "Temporary expiry";
  channels: ("Platform" | "Email" | "SMS")[];
  mandatory: boolean;
  createdAt: string;
  read: boolean;
  resolved: boolean;
  actionLabel?: string;
  actionSection?: OrgSectionId;
  actionFilter?: string;
}

export interface OrgReportDef {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface SavedView {
  id: string;
  name: string;
  section: OrgSectionId;
  shared: boolean;
  filters: Record<string, string>;
  createdBy: string;
}

export interface OrgSettings {
  defaultReviewFrequencyDays: number;
  temporaryAccessExpiryWarnings: number[];
  dualApprovalThreshold: RiskLevel;
  allowClinicSettingExceptions: boolean;
  notificationChannels: Record<string, ("Platform" | "Email" | "SMS")[]>;
  mandatoryNotificationTypes: string[];
}

export interface OrgFilters {
  clinicId?: string;
  status?: string;
  role?: string;
  risk?: string;
  query?: string;
  view?: string;
  card?: string;
}

export interface OrgState {
  currentUserId: string;
  nodes: OrgNode[];
  relationships: ReportingRelationship[];
  clinics: OrgClinic[];
  departments: OrgDepartment[];
  users: OrgUser[];
  roles: RoleDefinition[];
  assignments: ClinicAssignment[];
  exceptions: PermissionException[];
  requests: AccessRequest[];
  reviews: AccessReview[];
  emergency: EmergencyAccess[];
  alerts: SecurityAlert[];
  audit: AuditEntry[];
  notifications: OrgNotification[];
  reports: OrgReportDef[];
  savedViews: SavedView[];
  settings: OrgSettings;
  demoClockOffsetMs: number;
}
