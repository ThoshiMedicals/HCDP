/** Module 2 — Action Inbox & Notifications types */

export type ActionCategory = "Approval" | "Exception" | "Escalation" | "Reminder";

export type ActionPriority = "Urgent" | "High" | "Medium" | "Low";

export type ActionStatus =
  | "Open"
  | "In Progress"
  | "Awaiting Approval"
  | "Awaiting Verification"
  | "On Hold"
  | "Returned for Correction"
  | "Rejected"
  | "Completed"
  | "Withdrawn"
  | "Archived";

export type SensitivityLevel =
  | "Standard"
  | "Restricted"
  | "Confidential"
  | "Highly Confidential";

export type MainView =
  | "my-actions"
  | "my-team"
  | "all-clinics"
  | "delegated-by-me"
  | "watching"
  | "completed"
  | "archive";

export type CategoryFilter = "all" | "Approval" | "Exception" | "Escalation" | "Reminder";

export type DisplayDensity = "compact" | "comfortable";

export type DemoRole = "manager" | "staff";

export type EscalationLevel = 0 | 1 | 2 | 3 | 4;

export type AuditEventType =
  | "Created"
  | "Viewed"
  | "Edited"
  | "Assigned"
  | "Reassigned"
  | "Delegated"
  | "Comment added"
  | "Attachment added"
  | "Attachment downloaded"
  | "Due date changed"
  | "Priority changed"
  | "Reminder sent"
  | "Escalation started"
  | "Decision made"
  | "Acknowledged"
  | "Completed"
  | "Verified"
  | "Withdrawn"
  | "Archived"
  | "Exported"
  | "Printed"
  | "Content hidden"
  | "Snoozed"
  | "Returned for Correction"
  | "Placed on Hold"
  | "Self-Approved"
  | "Declined assignment"
  | "Watch added"
  | "Watch removed"
  | "Linked follow-up created"
  | "Draft saved"
  | "Notification read";

export interface ApprovalStep {
  id: string;
  order: number;
  approver: string;
  status: "Pending" | "Approved" | "Rejected" | "Skipped" | "Redirected";
  decidedAt?: string;
  decisionNote?: string;
  redirectedTo?: string;
  selfApproved?: boolean;
}

export interface ActionAttachment {
  id: string;
  name: string;
  sizeLabel: string;
  uploadedBy: string;
  uploadedAt: string;
  hidden?: boolean;
  hideReason?: string;
}

export interface ActionComment {
  id: string;
  author: string;
  body: string;
  at: string;
  mentions: string[];
  hidden?: boolean;
  hideReason?: string;
}

export interface RelatedRecord {
  id: string;
  label: string;
  module: string;
  ref: string;
}

export interface AuditEntry {
  id: string;
  actionId: string;
  event: AuditEventType;
  user: string;
  at: string;
  detail?: string;
  previousValue?: string;
  newValue?: string;
  reason?: string;
  fullDetail?: string;
}

export interface DelegationRecord {
  id: string;
  actionId?: string;
  fromOwner: string;
  delegate: string;
  startDate: string;
  endDate: string;
  reason: string;
  canComplete: boolean;
  canFurtherDelegate: boolean;
  sendUpdatesToOwner: boolean;
  active: boolean;
}

export interface InboxAction {
  id: string;
  number: string;
  title: string;
  explanation: string;
  fullExplanation: string;
  category: ActionCategory;
  clinicId: string;
  clinicName: string;
  team: string;
  owner: string;
  requestedBy: string;
  priority: ActionPriority;
  status: ActionStatus;
  sensitivity: SensitivityLevel;
  createdAt: string;
  dueAt: string;
  completedAt?: string;
  archivedAt?: string;
  requiredOutcome: string;
  expectedResult?: string;
  actualResult?: string;
  possibleCause?: string;
  possibleEffect?: string;
  recommendedNextAction?: string;
  sourceRecord?: string;
  sourceModule?: string;
  unread: boolean;
  isDemo: boolean;
  escalationLevel: EscalationLevel;
  overdueNotified?: boolean;
  watchers: string[];
  notes: string;
  attachments: ActionAttachment[];
  comments: ActionComment[];
  relatedRecords: RelatedRecord[];
  approvalSteps: ApprovalStep[];
  approvalPurpose?: string;
  decisionEffect?: string;
  evidenceRequired?: boolean;
  acknowledgementRequired?: boolean;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  managerVerificationRequired?: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
  completionNote?: string;
  outcome?: string;
  checklistComplete?: boolean;
  originalOwner?: string;
  delegatedTo?: string;
  delegatedByMe?: boolean;
  delegationId?: string;
  onHold?: boolean;
  holdReason?: string;
  reminderType?: string;
  reminderAt?: string;
  repeatPattern?: string;
  snoozeAllowed?: boolean;
  snoozedUntil?: string;
  mandatoryReminder?: boolean;
  teamIds?: string[];
  ownershipHistory: { at: string; from: string; to: string; reason: string; kind: "assign" | "reassign" | "delegate" }[];
  linkedFollowUpOf?: string;
  linkedFollowUps: string[];
  completionRequirements: string[];
  notificationMethods: string[];
}

export interface InboxNotification {
  id: string;
  title: string;
  reason: string;
  actionId: string;
  actionNumber: string;
  clinicName: string;
  at: string;
  priority: ActionPriority;
  read: boolean;
  groupKey?: string;
  kind: "routine" | "urgent" | "escalation" | "emergency" | "mandatory-approval";
  silenced?: boolean;
}

export interface NotificationSettings {
  platform: boolean;
  email: boolean;
  sms: boolean;
  dailySummary: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  reminderFrequency: "Immediate" | "Hourly digest" | "Daily digest";
  delegationUpdates: boolean;
  watchedActionUpdates: boolean;
  escalationAlerts: boolean;
  leavePeriodBehaviour: "Pause routine" | "Keep all" | "Delegate only";
  groupRoutine: boolean;
  silenceRoutine: boolean;
}

export interface SavedView {
  id: string;
  name: string;
  scope: "private" | "shared";
  pinned: boolean;
  createdBy: string;
  filters: InboxFilters;
  mainView: MainView;
  category: CategoryFilter;
}

export interface InboxFilters {
  clinicId: string;
  category: CategoryFilter | "";
  status: ActionStatus | "";
  priority: ActionPriority | "";
  owner: string;
  requester: string;
  dueFrom: string;
  dueTo: string;
  overdueOnly: boolean;
  escalationLevel: EscalationLevel | "";
  delegatedOnly: boolean;
  watchedOnly: boolean;
  hasAttachments: boolean;
  awaitingVerification: boolean;
  search: string;
}

export interface ActionDraft {
  id: string;
  title: string;
  description: string;
  actionType: string;
  category: ActionCategory;
  clinicId: string;
  owner: string;
  priority: ActionPriority;
  dueAt: string;
  team: string;
  requester: string;
  sensitivity: SensitivityLevel;
  sharedWith: string[];
  isPrivate: boolean;
  updatedAt: string;
  payload: Record<string, unknown>;
}

export interface ActionTemplate {
  id: string;
  name: string;
  scope: "system" | "manager" | "personal";
  category: ActionCategory;
  description: string;
  defaults: Partial<ActionDraft>;
}

export interface InboxUiState {
  mainView: MainView;
  category: CategoryFilter;
  density: DisplayDensity;
  demoMode: boolean;
  demoRole: DemoRole;
  loadState: "ready" | "loading" | "error" | "empty";
  selectedIds: string[];
  expandedId: string | null;
  reviewId: string | null;
  activeSavedViewId: string | null;
}

export const DEFAULT_FILTERS: InboxFilters = {
  clinicId: "",
  category: "",
  status: "",
  priority: "",
  owner: "",
  requester: "",
  dueFrom: "",
  dueTo: "",
  overdueOnly: false,
  escalationLevel: "",
  delegatedOnly: false,
  watchedOnly: false,
  hasAttachments: false,
  awaitingVerification: false,
  search: "",
};

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  platform: true,
  email: true,
  sms: false,
  dailySummary: true,
  quietHoursStart: "20:00",
  quietHoursEnd: "07:00",
  reminderFrequency: "Immediate",
  delegationUpdates: true,
  watchedActionUpdates: true,
  escalationAlerts: true,
  leavePeriodBehaviour: "Pause routine",
  groupRoutine: true,
  silenceRoutine: false,
};

/** Current demonstration user */
export const DEMO_USER = {
  name: "Alex Chen",
  role: "Practice Manager" as const,
  team: "Clinic Operations",
  clinicIds: [
    "loc_indooroopilly",
    "loc_chapelhill",
    "loc_baldhills",
    "loc_woolloongabba",
  ],
  isManager: true,
  canSeeSensitive: true,
};
