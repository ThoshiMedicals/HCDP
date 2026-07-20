export type PriorityLevel =
  | "Emergency"
  | "Urgent"
  | "Attention Required"
  | "Routine"
  | "Overdue"
  | "Completed Today";

export type ActionCategory =
  | "Clinic Operations"
  | "Staffing"
  | "Compliance"
  | "Finance & Pay"
  | "Incidents"
  | "Tasks & Checklists"
  | "Assets & Facilities"
  | "Digital & Security";

export type ActionStage =
  | "Draft"
  | "Submitted"
  | "Assigned"
  | "In Progress"
  | "Waiting for Information"
  | "Awaiting Approval"
  | "Completed"
  | "Closed"
  | "Blocked"
  | "Overdue"
  | "Escalated"
  | "Dismissed"
  | "Reopened";

export type FindingLabel =
  | "Action Required"
  | "Watch Closely"
  | "Positive Result"
  | "Recommendation";

export type AiFeedback =
  | "Useful Finding"
  | "Not Relevant"
  | "Already Resolved"
  | "Incorrect Priority"
  | "Missing Context"
  | "Correct Information";

export type HealthBand = "Healthy" | "On Track" | "Attention Required" | "Urgent Review" | "Data incomplete";

export type ClinicOpsGroup =
  | "Operating Normally"
  | "Attention Required"
  | "Urgent"
  | "Temporarily Closed";

export type CardSize = "Small" | "Medium" | "Large";

export type LayoutPeriod =
  | "Today"
  | "Yesterday"
  | "This Week"
  | "Last 7 Days"
  | "This Month"
  | "Last Month"
  | "Current Quarter"
  | "Custom Range";

export type CcAppearance = "light" | "dark" | "system";

export type HolidayHandling =
  | "Previous Working Day"
  | "Next Working Day"
  | "Keep Original Date"
  | "Skip Occurrence";

export type RecurrenceFrequency =
  | "Daily"
  | "Weekdays"
  | "Weekly"
  | "Fortnightly"
  | "Monthly"
  | "Quarterly"
  | "Yearly"
  | "Custom";

export interface ActionTemplate {
  id: string;
  scope: "Organisation" | "Personal";
  name: string;
  priority: PriorityLevel;
  category: ActionCategory;
  details: string;
  ownerType: "person" | "role" | "team";
  owner: string;
  reminder: string;
  escalation: string;
  finalApproval: boolean;
  archived: boolean;
}

export interface RecurringSchedule {
  id: string;
  templateName: string;
  frequency: RecurrenceFrequency;
  clinicIds: string[];
  linkedPerClinic: boolean;
  ownerType: "person" | "role" | "team";
  owner: string;
  priority: PriorityLevel;
  dueTime: string;
  startDate: string;
  endDate?: string;
  noEndDate: boolean;
  reminder: string;
  escalation: string;
  finalApproval: boolean;
  createInAdvanceDays: number;
  holidayHandling: HolidayHandling;
  paused?: {
    reason: string;
    pauseStart: string;
    plannedResume: string;
    approver: string;
  };
  ended?: boolean;
  status: "Active" | "Paused" | "Ended";
}

export interface ReportSchedule {
  id: string;
  report: string;
  recipient: string;
  recipientType: "Internal" | "External" | "Role";
  deliveryFormat: "PDF" | "Spreadsheet" | "Email";
  cadence:
    | "Daily"
    | "Weekdays"
    | "Weekly"
    | "Every Monday"
    | "Monthly"
    | "Month-end"
    | "Quarterly"
    | "Custom";
  deliveryTime: string;
  startDate: string;
  endDate?: string;
  noEndDate: boolean;
  clinicIds: string[];
  includeConfidential: boolean;
  createdAt: string;
  paused?: boolean;
}

export interface HealthAreaDetail {
  area: ActionCategory;
  todayScore: number | null;
  yesterdayScore: number | null;
  change: number | null;
  status: HealthBand;
  positiveFactors: string[];
  reducedReasons: string[];
  attentionItems: string[];
  dataCompleteness: string;
  lastUpdated: string;
  contributingRecords: Array<{ id: string; label: string; actionId?: string }>;
}

export interface HealthOverrideRecord {
  band: HealthBand;
  automaticBand: HealthBand;
  reason: string;
  startAt: string;
  expiry: string;
  attachmentName?: string;
  approvingManager: string;
  reviewDate: string;
  affectedClinicIds: string[];
  recordedBy: string;
  recordedAt: string;
}

export interface ClinicHealthArea {
  area: ActionCategory;
  score: number | null; // null = Data incomplete
}

export interface ClinicHealthProfile {
  locationId: string;
  overallScore: number | null;
  yesterdayScore?: number | null;
  band: HealthBand;
  emergencyStatus: boolean;
  openingStatus: "Open" | "Opening" | "Closed" | "Temporarily Closed";
  openingChecklist: "Complete" | "In progress" | "Late" | "Not started";
  staffingStatus: "Covered" | "Gap" | "Critical gap";
  roomsStatus: "Ready" | "Partial" | "Blocked";
  systemsStatus: "Healthy" | "Degraded" | "Outage";
  urgentIssues: number;
  overdueWork: number;
  manager: string;
  lastUpdate: string;
  areas: ClinicHealthArea[];
  yesterdayAreas?: ClinicHealthArea[];
  trend: "Improved" | "No change" | "Declined";
  strongest: string;
  weakest: string;
  positiveFactors?: string[];
  attentionItems?: string[];
  missingInfo?: string[];
  override?: HealthOverrideRecord;
  areaDetails?: HealthAreaDetail[];
  auditTimeline?: TimelineEvent[];
}

export interface CommandAction {
  id: string;
  reference: string;
  linkedReferences: string[];
  priority: PriorityLevel;
  title: string;
  locationId: string;
  category: ActionCategory;
  sourceModule: string;
  owner: string;
  due: string;
  overdueAge?: string;
  delayReason?: string;
  stage: ActionStage;
  reminders: string;
  escalation: string;
  latestUpdate: string;
  attachments: number;
  summary: string;
  details: string;
  completedAt?: string;
  comments: ActionComment[];
  timeline: TimelineEvent[];
  relatedActions: string[];
  requiresPassword?: boolean;
  acknowledged?: boolean;
  dismissed?: boolean;
  dismissMeta?: {
    reason: string;
    by: string;
    at: string;
    approval?: string;
    evidence?: string;
    notify?: string;
  };
  monitoringStarted?: boolean;
  searchable?: boolean;
}

export interface ActionComment {
  id: string;
  author: string;
  at: string;
  body: string;
  private?: boolean;
}

export interface TimelineEvent {
  id: string;
  at: string;
  actor: string;
  event: string;
}

export interface Announcement {
  id: string;
  title: string;
  type: "Normal" | "Emergency" | "Urgent" | "Info";
  message: string;
  clinics: string[];
  roles: string[];
  publishAt: string;
  endAt?: string;
  requireAck: boolean;
  channels: Array<"Dashboard" | "Email" | "SMS">;
  attachments: number;
  relatedActionId?: string;
  acknowledged?: boolean;
  readership: { read: number; total: number };
  delivery: { delivered: number; total: number };
  acknowledgements: { acked: number; total: number };
}

export interface AiFinding {
  id: string;
  label: FindingLabel;
  text: string;
  relatedActionId?: string;
  feedback?: AiFeedback;
}

export interface ExecutiveItem {
  id: string;
  type:
    | "Approval"
    | "Assigned task"
    | "Escalation"
    | "Requested decision"
    | "Mandatory announcement"
    | "Financial approval"
    | "Staffing decision"
    | "Compliance sign-off"
    | "Incident review"
    | "Policy approval"
    | "Delegated work";
  title: string;
  decisionBy: string;
  locationId: string;
  actionId?: string;
  canDelegate: boolean;
  priority?: PriorityLevel;
  reason?: string;
  requestedBy?: string;
  responsible?: string;
  attachments?: number;
  delegationStatus?: string;
  finalApprovalRequired?: boolean;
}

export interface StaffingSnapshot {
  locationId: string;
  rostered: number;
  present: number;
  absent: number;
  late: number;
  unfilled: number;
  overtimeRisk: number;
  onLeave: number;
  agencyLocum: number;
  doctorCoverage: number;
  gapsByRole: Array<{ role: string; gaps: number }>;
  nextSevenDayRisks: string[];
  estimatedOvertimeCost: number;
  coverRecommendations: Array<{ role: string; person: string; reason: string }>;
}

export interface ComplianceItem {
  id: string;
  title: string;
  locationId: string;
  group: "Expired" | "Due within 7 days" | "Due within 30 days" | "Due within 60 days";
  subject: string;
  due: string;
  serious: boolean;
  temporaryContinuedUse?: { reason: string; controls: string; recordedBy: string; at: string };
}

export interface FinanceSnapshot {
  locationId: string;
  income: number;
  expenses: number;
  profitLoss: number;
  staffPay: number;
  doctorPay: number;
  supplierPayments: number;
  pendingApprovals: number;
  forecast: number;
  actual: number;
  pendingAmounts: number;
  varianceDollar: number;
  variancePercent: number;
  alerts: Array<{ title: string; expected: number; actual: number; dollarDiff: number; percentDiff: number }>;
}

export interface IncidentRecord {
  id: string;
  title: string;
  type: "Incident" | "Complaint";
  locationId: string;
  stage: string;
  investigator: string;
  due: string;
  rca: string;
  correctiveActions: string;
  latestUpdate: string;
  executiveDecision?: string;
  serious: boolean;
  actionId?: string;
}

export interface TaskDeliverySummary {
  locationId: string;
  completionPercent: number;
  openTasks: number;
  checklistsDue: number;
  meetingActions: number;
  openingMissed: number;
  closingMissed: number;
  roomReadinessGaps: number;
  managerFollowUps: number;
  repeatedMissPattern?: string;
}

export interface AssetFacilitiesSnapshot {
  locationId: string;
  assetValue: number;
  unavailableEquipment: number;
  lowStock: number;
  serviceCalibrationDue: number;
  openWorkOrders: number;
  supplierIssues: number;
  expectedCosts: number;
  impactNotes: string[];
}

export interface DigitalSecuritySnapshot {
  locationId: string;
  availabilityPercent: number;
  activeOutages: number;
  businessImpact: string;
  restorationEstimate?: string;
  websites: "Up" | "Degraded" | "Down";
  internet: "Up" | "Degraded" | "Down";
  phones: "Up" | "Degraded" | "Down";
  practiceSystems: "Up" | "Degraded" | "Down";
  backupStatus: "Current" | "Delayed" | "Failed";
}

export interface TrendCard {
  id: string;
  title: string;
  area: ActionCategory | "Overall";
  result: string;
  change: string;
  direction: "up" | "down" | "flat";
  size: CardSize;
  series: number[];
  explanation: string;
  recommendations: string[];
  clinicComparison: Array<{ clinic: string; value: number }>;
  tableRows: Array<{ label: string; value: string }>;
}

export interface ActivityItem {
  id: string;
  title: string;
  at: string;
  importance: "Critical" | "High" | "Medium";
  summary: string;
  locationId: string;
  pinned?: boolean;
  read?: boolean;
  actionId?: string;
}

export interface PositiveMessage {
  id: string;
  message: string;
  kind: "status" | "achievement";
  period?: "Weekly" | "Monthly";
}

export interface PrivateNote {
  id?: string;
  cardId: string;
  note: string;
  reminderAt?: string;
}

export interface DashboardSectionLayout {
  id: string;
  label: string;
  visible: boolean;
  size: CardSize;
  collapsed: boolean;
  order: number;
}

export interface ClinicGroup {
  id: string;
  name: string;
  locationIds: string[];
}

export interface SearchResult {
  id: string;
  type: string;
  title: string;
  snippet: string;
  actionId?: string;
  locationId?: string;
}
