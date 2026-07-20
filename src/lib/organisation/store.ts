import { CURRENT_ACTOR } from "./mock-data";
import { createInitialOrgState } from "./seed-state";
import type {
  AccessRequest,
  AccessReview,
  AuditEntry,
  ClinicLifecycleStatus,
  EmergencyAccess,
  OrgFilters,
  OrgNotification,
  OrgSectionId,
  OrgState,
  ReviewDecision,
  RiskLevel,
  SecurityAlert,
  UserAccountStatus,
} from "./types";

const STORAGE_KEY = "pulse.org.m3.state";

function nowIso(state: OrgState) {
  return new Date(Date.now() + state.demoClockOffsetMs).toISOString();
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function loadOrgState(): OrgState {
  if (typeof window === "undefined") return createInitialOrgState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialOrgState();
    return { ...createInitialOrgState(), ...JSON.parse(raw) } as OrgState;
  } catch {
    return createInitialOrgState();
  }
}

export function saveOrgState(state: OrgState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function resetOrgState(): OrgState {
  const next = createInitialOrgState();
  saveOrgState(next);
  return next;
}

export function actorOf(state: OrgState): { id: string; name: string; role: string } {
  const user = state.users.find((u) => u.id === state.currentUserId);
  if (user) return { id: user.id, name: `${user.firstName} ${user.lastName}`, role: user.role };
  return CURRENT_ACTOR;
}

export function appendAudit(
  state: OrgState,
  partial: Omit<AuditEntry, "id" | "at" | "actorId" | "actorName" | "correctionNotes"> & {
    correctionNotes?: AuditEntry["correctionNotes"];
  }
): OrgState {
  const actor = actorOf(state);
  const entry: AuditEntry = {
    id: uid("aud"),
    at: nowIso(state),
    actorId: actor.id,
    actorName: actor.name,
    correctionNotes: partial.correctionNotes || [],
    ...partial,
  };
  return { ...state, audit: [entry, ...state.audit] };
}

export function withAudit(
  state: OrgState,
  entry: Omit<AuditEntry, "id" | "at" | "actorId" | "actorName" | "correctionNotes"> & {
    correctionNotes?: AuditEntry["correctionNotes"];
  }
): OrgState {
  return appendAudit(state, entry);
}

export function assignedClinicIds(state: OrgState, userId = state.currentUserId): Set<string> {
  const user = state.users.find((u) => u.id === userId);
  if (!user) return new Set();
  if (user.role === "Director" || user.role === "Senior Administrator") {
    return new Set(state.clinics.map((c) => c.id));
  }
  return new Set(state.assignments.filter((a) => a.userId === userId).map((a) => a.clinicId));
}

export function visibleClinics(state: OrgState) {
  const ids = assignedClinicIds(state);
  return state.clinics.filter((c) => ids.has(c.id));
}

export function demoNow(state: OrgState) {
  return new Date(Date.now() + state.demoClockOffsetMs);
}

export function daysUntil(dateStr: string, state: OrgState) {
  const end = new Date(dateStr).getTime();
  const start = demoNow(state).getTime();
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
}

export function isOverdue(dueAt: string, state: OrgState) {
  return new Date(dueAt).getTime() < demoNow(state).getTime();
}

const RISK_RANK: Record<RiskLevel, number> = { Low: 1, Medium: 2, High: 3, Critical: 4 };

export function requiresDualApproval(risk: RiskLevel, threshold: RiskLevel) {
  return RISK_RANK[risk] >= RISK_RANK[threshold];
}

export function dangerousPermissionCombo(labels: string[]) {
  const joined = labels.join(" ").toLowerCase();
  return (
    (joined.includes("export") && joined.includes("delete")) ||
    (joined.includes("manage settings") && joined.includes("approve")) ||
    joined.includes("organisation-wide")
  );
}

export type OrgNavTarget = {
  section: OrgSectionId;
  filters?: OrgFilters;
  focusId?: string;
};

export function overviewMetrics(state: OrgState) {
  const clinics = visibleClinics(state);
  const clinicIds = new Set(clinics.map((c) => c.id));
  const users = state.users.filter((u) => clinicIds.has(u.primaryClinicId) || state.assignments.some((a) => a.userId === u.id && clinicIds.has(a.clinicId)));
  return {
    totalLocations: clinics.length,
    activeUsers: users.filter((u) => u.status === "Active").length,
    usersWithAccessIssues: users.filter((u) => u.accessIssues.length > 0).length,
    accessReviewsDue: state.reviews.filter((r) => clinicIds.has(r.clinicId) && (r.status === "Open" || r.status === "Overdue" || r.status === "In Progress")).length,
    clinicsWithWarnings: clinics.filter((c) => c.warnings.length > 0).length,
    recentPermissionChanges: state.audit.filter((a) => a.entityType === "Permission" || a.entityType === "Approval").length,
  };
}

export function changeClinicStatus(
  state: OrgState,
  clinicId: string,
  status: ClinicLifecycleStatus,
  reason: string,
  effectiveDate: string
): { state: OrgState; error?: string } {
  if (!reason.trim() || !effectiveDate) {
    return { state, error: "A reason and effective date are required for every status change." };
  }
  const clinic = state.clinics.find((c) => c.id === clinicId);
  if (!clinic) return { state, error: "Clinic not found." };
  const previous = clinic.status;
  let clinics = state.clinics.map((c) =>
    c.id === clinicId
      ? {
          ...c,
          status,
          statusReason: reason,
          statusEffectiveDate: effectiveDate,
          isDraft: status === "Draft" || status === "Planned" || status === "Setup in Progress",
          warnings:
            status === "Active"
              ? c.warnings.filter((w) => !w.toLowerCase().includes("draft") && !w.toLowerCase().includes("setup"))
              : c.warnings,
        }
      : c
  );
  let next = appendAudit(
    { ...state, clinics },
    {
      entityType: "Clinic",
      entityId: clinicId,
      entityLabel: clinic.name,
      field: "status",
      previousValue: previous,
      newValue: status,
      reason,
      approval: "Director / Senior Administrator",
      device: "Desktop · Demo",
      locationLabel: "Module 3",
    }
  );
  const notification: OrgNotification = {
    id: uid("nt"),
    title: "Clinic status changed",
    body: `${clinic.shortName} is now ${status}.`,
    type: "Clinic status",
    channels: state.settings.notificationChannels["Clinic status"] || ["Platform"],
    mandatory: false,
    createdAt: nowIso(next),
    read: false,
    resolved: false,
    actionLabel: "Open clinic",
    actionSection: "locations",
    actionFilter: clinicId,
  };
  next = { ...next, notifications: [notification, ...next.notifications] };
  return { state: next };
}

export function activateClinic(state: OrgState, clinicId: string): { state: OrgState; error?: string } {
  const clinic = state.clinics.find((c) => c.id === clinicId);
  if (!clinic) return { state, error: "Clinic not found." };
  const missing = clinic.readiness.filter((r) => r.required && !r.done);
  if (missing.length) {
    return {
      state,
      error: `Complete the readiness checklist before activation. Still needed: ${missing.map((m) => m.label).join(", ")}.`,
    };
  }
  return changeClinicStatus(state, clinicId, "Active", "Readiness checklist complete — activation approved", nowIso(state).slice(0, 10));
}

export function approveRequestItem(
  state: OrgState,
  requestId: string,
  itemId: string,
  decision: "Approved" | "Rejected",
  note?: string
): { state: OrgState; error?: string } {
  const req = state.requests.find((r) => r.id === requestId);
  if (!req) return { state, error: "Request not found." };
  if (req.subjectUserId === state.currentUserId || req.requesterId === state.currentUserId) {
    // Allow viewing but block self-approval of own request
    if (req.subjectUserId === state.currentUserId) {
      return { state, error: "Self-approval is blocked. Another authorised manager must decide." };
    }
  }
  const items = req.items.map((i) =>
    i.id === itemId ? { ...i, status: decision, decisionNote: note || i.decisionNote } : i
  );
  const requests = state.requests.map((r) => (r.id === requestId ? { ...r, items } : r));
  let next = appendAudit(
    { ...state, requests },
    {
      entityType: "Approval",
      entityId: requestId,
      entityLabel: req.title,
      field: `item:${itemId}`,
      previousValue: req.items.find((i) => i.id === itemId)?.status || "",
      newValue: decision,
      reason: note || "Partial item decision",
      relatedRequestId: requestId,
      device: "Desktop · Demo",
      locationLabel: "Module 3",
    }
  );
  return { state: next };
}

export function submitRequestApproval(
  state: OrgState,
  requestId: string,
  decision: "Approved" | "Rejected"
): { state: OrgState; error?: string } {
  const req = state.requests.find((r) => r.id === requestId);
  if (!req) return { state, error: "Request not found." };
  if (req.subjectUserId === state.currentUserId) {
    return { state, error: "Self-approval is blocked. Ask a different Director or Senior Administrator." };
  }
  if (dangerousPermissionCombo(req.items.map((i) => i.label)) && decision === "Approved") {
    // soft warn recorded in audit reason
  }
  const actor = actorOf(state);
  const already = req.approvals.find((a) => a.approverId === actor.id && a.decision);
  if (already) return { state, error: "You have already recorded a decision on this request." };

  const approvals = req.approvals.map((a) =>
    a.approverId === actor.id
      ? { ...a, decision, decidedAt: nowIso(state) }
      : a
  );
  // If current user wasn't in list, add them for standard requests
  const withActor = approvals.some((a) => a.approverId === actor.id)
    ? approvals
    : [...approvals, { approverId: actor.id, approverName: actor.name, decision, decidedAt: nowIso(state) }];

  const approvedCount = withActor.filter((a) => a.decision === "Approved").length;
  const rejectedCount = withActor.filter((a) => a.decision === "Rejected").length;
  let status = req.status;
  if (rejectedCount > 0 && decision === "Rejected") {
    status = "Rejected";
  } else if (req.requiresTwoApprovers && approvedCount >= 2) {
    status = "Approved";
  } else if (!req.requiresTwoApprovers && approvedCount >= 1) {
    status = "Approved";
  } else if (approvedCount >= 1) {
    status = "Partially Approved";
  }

  if (req.requiresTwoApprovers && decision === "Approved" && approvedCount < 2 && status !== "Approved") {
    // keep partially approved
  }

  const approvalsFinal = withActor;

  const history = [
    ...req.decisionHistory,
    `${decision} by ${actor.name}${req.requiresTwoApprovers && status !== "Approved" && decision === "Approved" ? " (awaiting second approver)" : ""}`,
  ];

  const requests = state.requests.map((r) =>
    r.id === requestId
      ? { ...r, approvals: approvalsFinal, status, decisionHistory: history }
      : r
  );

  let next = appendAudit(
    { ...state, requests },
    {
      entityType: "Approval",
      entityId: requestId,
      entityLabel: req.title,
      field: "status",
      previousValue: req.status,
      newValue: status,
      reason: `${decision} decision recorded`,
      approval: actor.name,
      relatedRequestId: requestId,
      device: "Desktop · Demo",
      locationLabel: "Module 3",
    }
  );

  if (req.requiresTwoApprovers && decision === "Approved" && status !== "Approved") {
    return { state: next };
  }
  return { state: next };
}

export function completeReview(
  state: OrgState,
  reviewId: string,
  decision: ReviewDecision,
  notes: string
): { state: OrgState; error?: string; createdRequestId?: string } {
  const review = state.reviews.find((r) => r.id === reviewId);
  if (!review) return { state, error: "Review not found." };
  let requests = state.requests;
  let createdRequestId: string | undefined;
  if (decision === "Request increase") {
    createdRequestId = uid("req");
    const reviewActor = actorOf(state);
    const newReq: AccessRequest = {
      id: createdRequestId,
      title: `Access increase from review — ${review.userName}`,
      requesterId: state.currentUserId,
      requesterName: reviewActor.name,
      subjectUserId: review.userId,
      subjectUserName: review.userName,
      clinicId: review.clinicId,
      priority: "Standard",
      status: "Submitted",
      submittedAt: nowIso(state),
      dueAt: new Date(demoNow(state).getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      riskSummary: "Created from access review increase decision.",
      riskLevel: "High",
      requiresTwoApprovers: true,
      approvals: [
        { approverId: "usr_sarah", approverName: "Sarah Mitchell" },
        { approverId: "usr_david", approverName: "David King" },
      ],
      items: [{ id: uid("ri"), label: "Requested access increase", risk: "High", status: "Pending" }],
      decisionHistory: [`Raised from review ${reviewId}`],
    };
    requests = [newReq, ...requests];
  }
  const reviews = state.reviews.map((r) =>
    r.id === reviewId
      ? {
          ...r,
          status: "Completed" as const,
          decision,
          notes,
          completedAt: nowIso(state).slice(0, 10),
        }
      : r
  );
  let next = appendAudit(
    { ...state, reviews, requests },
    {
      entityType: "Review",
      entityId: reviewId,
      entityLabel: `${review.userName} access review`,
      field: "decision",
      previousValue: review.status,
      newValue: decision,
      reason: notes || "Access review completed",
      relatedReviewId: reviewId,
      relatedRequestId: createdRequestId,
      device: "Desktop · Demo",
      locationLabel: "Module 3",
    }
  );
  return { state: next, createdRequestId };
}

export function expireTemporaryAccess(state: OrgState): OrgState {
  const now = demoNow(state);
  let next = state;
  const assignments = state.assignments.map((a) => {
    if (!a.endDate) return a;
    if (new Date(a.endDate).getTime() > now.getTime()) return a;
    if (a.type !== "Temporary Cover" && a.type !== "Emergency Access") return a;
    return a;
  });

  // Remove expired temporary / emergency
  const kept = assignments.filter((a) => {
    if (!a.endDate) return true;
    if (a.type !== "Temporary Cover" && a.type !== "Emergency Access") return true;
    return new Date(a.endDate).getTime() > now.getTime();
  });
  const expired = assignments.filter((a) => !kept.includes(a));

  let emergency = state.emergency.map((e) => {
    if (!e.active) return e;
    if (new Date(e.expiresAt).getTime() > now.getTime()) return e;
    return { ...e, active: false };
  });

  let reviews = [...state.reviews];
  let users = state.users.map((u) => ({ ...u }));
  let notifications = [...state.notifications];
  let audit = [...state.audit];

  for (const e of emergency.filter((x) => !x.active && !x.reviewCreated)) {
    const review: AccessReview = {
      id: uid("rev"),
      userId: e.userId,
      userName: e.userName,
      clinicId: e.clinicId,
      trigger: "Emergency access expiry",
      status: "Open",
      dueDate: nowIso(state).slice(0, 10),
      riskLevel: "Critical",
      ownerName: CURRENT_ACTOR.name,
    };
    reviews = [review, ...reviews];
    emergency = emergency.map((x) => (x.id === e.id ? { ...x, reviewCreated: true } : x));
    users = users.map((u) =>
      u.id === e.userId
        ? {
            ...u,
            emergencyAccessActive: false,
            accessIssues: u.accessIssues.filter((i) => !i.toLowerCase().includes("emergency")),
          }
        : u
    );
    notifications = [
      {
        id: uid("nt"),
        title: "Emergency access removed",
        body: `${e.userName} emergency access expired and a review was created.`,
        type: "Access removal",
        channels: ["Platform", "Email", "SMS"],
        mandatory: true,
        createdAt: nowIso(state),
        read: false,
        resolved: false,
        actionLabel: "Open review",
        actionSection: "access-reviews",
        actionFilter: review.id,
      },
      ...notifications,
    ];
    audit = [
      {
        id: uid("aud"),
        at: nowIso(state),
        actorId: "system",
        actorName: "System",
        entityType: "Assignment",
        entityId: e.id,
        entityLabel: `${e.userName} emergency access`,
        field: "active",
        previousValue: "true",
        newValue: "false",
        reason: "Automatic expiry",
        relatedReviewId: review.id,
        correctionNotes: [],
        device: "System",
        locationLabel: "Module 3",
      },
      ...audit,
    ];
  }

  for (const a of expired) {
    audit = [
      {
        id: uid("aud"),
        at: nowIso(state),
        actorId: "system",
        actorName: "System",
        entityType: "Assignment",
        entityId: a.id,
        entityLabel: `${a.userId} ${a.type}`,
        field: "assignment",
        previousValue: a.type,
        newValue: "Expired / removed",
        reason: "Temporary assignment expired automatically",
        correctionNotes: [],
        device: "System",
        locationLabel: "Module 3",
      },
      ...audit,
    ];
    notifications = [
      {
        id: uid("nt"),
        title: "Temporary access expired",
        body: `Assignment ${a.id} expired and was removed.`,
        type: "Temporary expiry",
        channels: ["Platform", "Email"],
        mandatory: true,
        createdAt: nowIso(state),
        read: false,
        resolved: false,
        actionSection: "users",
        actionLabel: "Open users",
      },
      ...notifications,
    ];
  }

  // Expiry warnings 7/3/1
  for (const a of kept) {
    if (!a.endDate) continue;
    if (a.type !== "Temporary Cover" && a.type !== "Emergency Access") continue;
    const days = daysUntil(a.endDate, { ...state, demoClockOffsetMs: state.demoClockOffsetMs });
    const sent = a.warningDaysSent || [];
    for (const w of state.settings.temporaryAccessExpiryWarnings) {
      if (days <= w && days >= 0 && !sent.includes(w)) {
        notifications = [
          {
            id: uid("nt"),
            title: `Temporary access expires in ${w} day${w === 1 ? "" : "s"}`,
            body: `Assignment at clinic ${a.clinicId} is nearing expiry.`,
            type: "Temporary expiry",
            channels: ["Platform", "Email"],
            mandatory: true,
            createdAt: nowIso(state),
            read: false,
            resolved: false,
            actionSection: "users",
            actionFilter: a.userId,
            actionLabel: "Review assignment",
          },
          ...notifications,
        ];
        a.warningDaysSent = [...sent, w];
      }
    }
  }

  next = {
    ...state,
    assignments: kept.map((a) => {
      const updated = kept.find((k) => k.id === a.id);
      return updated || a;
    }),
    emergency,
    reviews,
    users,
    notifications,
    audit,
  };
  return next;
}

export function escalateOverdueReviews(state: OrgState): OrgState {
  const now = demoNow(state);
  let changed = false;
  const newAlerts: SecurityAlert[] = [];
  const reviews = state.reviews.map((r) => {
    if (r.status === "Completed" || r.status === "Overdue") return r;
    if (new Date(r.dueDate).getTime() >= now.getTime()) return r;
    changed = true;
    const hasAlert = state.alerts.some(
      (a) => a.category === "Overdue review" && a.userId === r.userId && !a.resolved
    );
    if (!hasAlert) {
      newAlerts.push({
        id: uid("al"),
        title: `Overdue access review — ${r.userName}`,
        category: "Overdue review",
        risk: r.riskLevel,
        clinicId: r.clinicId,
        userId: r.userId,
        createdAt: nowIso(state),
        resolved: false,
      });
    }
    return { ...r, status: "Overdue" as const };
  });
  if (!changed) return state;
  let next: OrgState = { ...state, reviews, alerts: [...newAlerts, ...state.alerts] };
  for (const a of newAlerts) {
    next = appendAudit(next, {
      entityType: "Review",
      entityId: a.userId || "",
      entityLabel: a.title,
      field: "status",
      previousValue: "Open",
      newValue: "Overdue",
      reason: "Automatic escalation — review passed due date",
      device: "System",
      locationLabel: "Module 3",
    });
  }
  return next;
}

export function advanceDemoClock(state: OrgState, days: number): OrgState {
  const shifted = { ...state, demoClockOffsetMs: state.demoClockOffsetMs + days * 24 * 60 * 60 * 1000 };
  return escalateOverdueReviews(expireTemporaryAccess(shifted));
}

export function changeUserStatus(
  state: OrgState,
  userId: string,
  status: UserAccountStatus,
  reason: string
): { state: OrgState; error?: string } {
  if (!reason.trim()) return { state, error: "A reason is required for a user status change." };
  const user = state.users.find((u) => u.id === userId);
  if (!user) return { state, error: "User not found." };
  const previous = user.status;
  const users = state.users.map((u) => (u.id === userId ? { ...u, status } : u));
  const next = appendAudit(
    { ...state, users },
    {
      entityType: "User",
      entityId: userId,
      entityLabel: `${user.firstName} ${user.lastName}`,
      field: "status",
      previousValue: previous,
      newValue: status,
      reason,
      approval: "Manager / Administrator",
      device: "Desktop · Demo",
      locationLabel: "Module 3",
    }
  );
  return { state: next };
}

export function completeMerger(
  state: OrgState,
  method: "Keep one and archive" | "Create combined clinic",
  primaryClinicId: string,
  secondaryClinicId: string,
  reason: string
): { state: OrgState; error?: string } {
  if (!reason.trim()) return { state, error: "A reason is required to complete a merger." };
  const primary = state.clinics.find((c) => c.id === primaryClinicId);
  const secondary = state.clinics.find((c) => c.id === secondaryClinicId);
  if (!primary || !secondary) return { state, error: "Clinic not found." };
  const effectiveDate = nowIso(state).slice(0, 10);
  const clinics = state.clinics.map((c) => {
    if (c.id === secondaryClinicId) {
      return {
        ...c,
        status: "Merged" as const,
        statusReason: reason,
        statusEffectiveDate: effectiveDate,
        warnings: [`Merged into ${primary.shortName}`],
      };
    }
    if (c.id === primaryClinicId) {
      return {
        ...c,
        status: "Active" as const,
        isDraft: false,
        mergerPartnerId: undefined,
        mergerMethod: undefined,
        statusReason: reason,
        statusEffectiveDate: effectiveDate,
        warnings: c.warnings.filter((w) => !w.toLowerCase().includes("merger") && !w.toLowerCase().includes("draft")),
      };
    }
    return c;
  });
  let next = appendAudit(
    { ...state, clinics },
    {
      entityType: "Clinic",
      entityId: secondaryClinicId,
      entityLabel: secondary.name,
      field: "status",
      previousValue: secondary.status,
      newValue: "Merged",
      reason,
      approval: "Director / Senior Administrator",
      device: "Desktop · Demo",
      locationLabel: "Module 3",
    }
  );
  next = appendAudit(next, {
    entityType: "Clinic",
    entityId: primaryClinicId,
    entityLabel: primary.name,
    field: "status",
    previousValue: primary.status,
    newValue: method === "Create combined clinic" ? "Active (combined clinic)" : "Active",
    reason,
    approval: "Director / Senior Administrator",
    device: "Desktop · Demo",
    locationLabel: "Module 3",
  });
  return { state: next };
}

export function completeCombinedMerger(
  state: OrgState,
  combinedClinicId: string,
  partnerClinicIds: string[],
  reason: string
): { state: OrgState; error?: string } {
  if (!reason.trim()) return { state, error: "A reason is required to complete a merger." };
  const combined = state.clinics.find((c) => c.id === combinedClinicId);
  if (!combined) return { state, error: "Combined clinic not found." };
  const effectiveDate = nowIso(state).slice(0, 10);
  const clinics = state.clinics.map((c) => {
    if (partnerClinicIds.includes(c.id)) {
      return {
        ...c,
        status: "Merged" as const,
        statusReason: reason,
        statusEffectiveDate: effectiveDate,
        warnings: [`Merged into ${combined.shortName}`],
      };
    }
    if (c.id === combinedClinicId) {
      return {
        ...c,
        status: "Active" as const,
        isDraft: false,
        statusReason: reason,
        statusEffectiveDate: effectiveDate,
        warnings: c.warnings.filter((w) => !w.toLowerCase().includes("draft") && !w.toLowerCase().includes("merger")),
      };
    }
    return c;
  });
  let next = appendAudit(
    { ...state, clinics },
    {
      entityType: "Clinic",
      entityId: combinedClinicId,
      entityLabel: combined.name,
      field: "status",
      previousValue: combined.status,
      newValue: "Active",
      reason,
      approval: "Director / Senior Administrator",
      device: "Desktop · Demo",
      locationLabel: "Module 3",
    }
  );
  for (const pid of partnerClinicIds) {
    const partner = state.clinics.find((c) => c.id === pid);
    if (!partner) continue;
    next = appendAudit(next, {
      entityType: "Clinic",
      entityId: pid,
      entityLabel: partner.name,
      field: "status",
      previousValue: partner.status,
      newValue: "Merged",
      reason,
      approval: "Director / Senior Administrator",
      device: "Desktop · Demo",
      locationLabel: "Module 3",
    });
  }
  return { state: next };
}

export function addTemporaryClosure(
  state: OrgState,
  clinicId: string,
  input: { date: string; name: string; reason: string }
): { state: OrgState; error?: string } {
  if (!input.date || !input.name.trim() || !input.reason.trim()) {
    return { state, error: "Date, name and reason are all required for a temporary closure." };
  }
  const clinic = state.clinics.find((c) => c.id === clinicId);
  if (!clinic) return { state, error: "Clinic not found." };
  const closure = {
    id: uid("hol"),
    date: input.date,
    name: input.name,
    type: "Temporary Closure" as const,
    reason: input.reason,
  };
  const clinics = state.clinics.map((c) =>
    c.id === clinicId ? { ...c, holidays: [...c.holidays, closure] } : c
  );
  const next = appendAudit(
    { ...state, clinics },
    {
      entityType: "Clinic",
      entityId: clinicId,
      entityLabel: clinic.name,
      field: "holidays",
      previousValue: "—",
      newValue: `${input.date}: ${input.name}`,
      reason: input.reason,
      device: "Desktop · Demo",
      locationLabel: "Module 3",
    }
  );
  return { state: next };
}

export function grantEmergencyAccess(
  state: OrgState,
  input: {
    userId: string;
    clinicId: string;
    reason: string;
    permissions: string;
    approverId: string;
    expiresAt: string;
    verified: boolean;
  }
): { state: OrgState; error?: string } {
  if (!input.reason || !input.permissions || !input.expiresAt || !input.verified) {
    return { state, error: "Reason, permissions, expiry and strong verification are required." };
  }
  const user = state.users.find((u) => u.id === input.userId);
  if (!user) return { state, error: "User not found." };
  const approver = state.users.find((u) => u.id === input.approverId);
  const em: EmergencyAccess = {
    id: uid("em"),
    userId: input.userId,
    userName: `${user.firstName} ${user.lastName}`,
    clinicId: input.clinicId,
    reason: input.reason,
    permissions: input.permissions,
    approverId: input.approverId,
    approverName: approver ? `${approver.firstName} ${approver.lastName}` : actorOf(state).name,
    expiresAt: input.expiresAt,
    verified: input.verified,
    active: true,
    reviewCreated: false,
  };
  const fixed = em;

  let next: OrgState = {
    ...state,
    emergency: [fixed, ...state.emergency],
    assignments: [
      {
        id: uid("as"),
        userId: input.userId,
        clinicId: input.clinicId,
        type: "Emergency Access",
        startDate: nowIso(state).slice(0, 10),
        endDate: input.expiresAt,
        reason: input.reason,
      },
      ...state.assignments,
    ],
    users: state.users.map((u) =>
      u.id === input.userId
        ? {
            ...u,
            emergencyAccessActive: true,
            accessIssues: [...new Set([...u.accessIssues, "Emergency access active"])],
          }
        : u
    ),
  };
  next = appendAudit(next, {
    entityType: "Assignment",
    entityId: fixed.id,
    entityLabel: `${fixed.userName} emergency access`,
    field: "emergency",
    previousValue: "—",
    newValue: "Active",
    reason: input.reason,
    approval: fixed.approverName,
    device: "Desktop · Demo",
    locationLabel: "Module 3",
  });
  next = {
    ...next,
    notifications: [
      {
        id: uid("nt"),
        title: "Emergency access granted",
        body: `${fixed.userName} emergency access is active.`,
        type: "Emergency access",
        channels: ["Platform", "Email", "SMS"],
        mandatory: true,
        createdAt: nowIso(next),
        read: false,
        resolved: false,
        actionSection: "security",
        actionLabel: "Open monitoring",
      },
      ...next.notifications,
    ],
    alerts: [
      {
        id: uid("al"),
        title: `Emergency access active — ${fixed.userName}`,
        category: "Emergency access",
        risk: "Critical",
        clinicId: input.clinicId,
        userId: input.userId,
        createdAt: nowIso(next),
        resolved: false,
      },
      ...next.alerts,
    ],
  };
  return { state: next };
}

export function changePrimaryClinic(
  state: OrgState,
  userId: string,
  newClinicId: string,
  reason: string
): { state: OrgState; error?: string } {
  const user = state.users.find((u) => u.id === userId);
  if (!user) return { state, error: "User not found." };
  const previous = user.primaryClinicId;
  let next: OrgState = {
    ...state,
    users: state.users.map((u) =>
      u.id === userId
        ? {
            ...u,
            primaryClinicId: newClinicId,
            status: u.status === "Active" ? "Access Review Required" : u.status,
            accessIssues: [...new Set([...u.accessIssues, "Primary clinic change review required"])],
          }
        : u
    ),
    assignments: state.assignments.map((a) => {
      if (a.userId !== userId) return a;
      if (a.type === "Primary Clinic") return { ...a, clinicId: newClinicId };
      return a;
    }),
    reviews: [
      {
        id: uid("rev"),
        userId,
        userName: `${user.firstName} ${user.lastName}`,
        clinicId: newClinicId,
        trigger: "Primary Clinic change",
        status: "Open",
        dueDate: new Date(demoNow(state).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        riskLevel: "High",
        ownerName: user.managerName || actorOf(state).name,
      },
      ...state.reviews,
    ],
  };
  next = appendAudit(next, {
    entityType: "User",
    entityId: userId,
    entityLabel: `${user.firstName} ${user.lastName}`,
    field: "primaryClinicId",
    previousValue: previous,
    newValue: newClinicId,
    reason: reason || "Primary clinic changed — roles, previous access, manager and review status must be re-checked",
    device: "Desktop · Demo",
    locationLabel: "Module 3",
  });
  return { state: next };
}

export function addCorrectionNote(state: OrgState, auditId: string, note: string): OrgState {
  const actor = actorOf(state);
  return {
    ...state,
    audit: state.audit.map((a) =>
      a.id === auditId
        ? {
            ...a,
            correctionNotes: [
              ...a.correctionNotes,
              { at: nowIso(state), by: actor.name, note },
            ],
          }
        : a
    ),
  };
}

export function resolveAlert(state: OrgState, alertId: string, note?: string): OrgState {
  const alert = state.alerts.find((a) => a.id === alertId);
  const actor = actorOf(state);
  let next: OrgState = {
    ...state,
    alerts: state.alerts.map((a) =>
      a.id === alertId
        ? { ...a, resolved: true, resolvedAt: nowIso(state), resolvedBy: actor.name }
        : a
    ),
  };
  if (alert) {
    next = appendAudit(next, {
      entityType: "Security",
      entityId: alertId,
      entityLabel: alert.title,
      field: "resolved",
      previousValue: "false",
      newValue: "true",
      reason: note || "Alert resolved",
      device: "Desktop · Demo",
      locationLabel: "Module 3",
    });
  }
  return next;
}

export function recordExport(state: OrgState, reportName: string, format: string): OrgState {
  return appendAudit(state, {
    entityType: "Export",
    entityId: uid("exp"),
    entityLabel: reportName,
    field: "export",
    previousValue: "—",
    newValue: format,
    reason: "Sensitive export audited",
    device: "Desktop · Demo",
    locationLabel: "Module 3",
  });
}

export function globalSearch(state: OrgState, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return [] as { section: OrgSectionId; id: string; title: string; subtitle: string }[];
  const clinics = visibleClinics(state);
  const clinicIds = new Set(clinics.map((c) => c.id));
  const results: { section: OrgSectionId; id: string; title: string; subtitle: string }[] = [];
  for (const c of clinics) {
    if (`${c.name} ${c.tradingName} ${c.address} ${c.status}`.toLowerCase().includes(q)) {
      results.push({ section: "locations", id: c.id, title: c.name, subtitle: c.status });
    }
  }
  for (const u of state.users) {
    if (!clinicIds.has(u.primaryClinicId)) continue;
    const name = `${u.firstName} ${u.lastName}`;
    if (`${name} ${u.email} ${u.role} ${u.status}`.toLowerCase().includes(q)) {
      results.push({ section: "users", id: u.id, title: name, subtitle: `${u.role} · ${u.status}` });
    }
  }
  for (const r of state.requests) {
    if (`${r.title} ${r.subjectUserName} ${r.status}`.toLowerCase().includes(q)) {
      results.push({ section: "access-requests", id: r.id, title: r.title, subtitle: r.status });
    }
  }
  for (const a of state.audit.slice(0, 200)) {
    if (`${a.entityLabel} ${a.field} ${a.reason}`.toLowerCase().includes(q)) {
      results.push({ section: "audit", id: a.id, title: a.entityLabel, subtitle: `${a.field}: ${a.previousValue} → ${a.newValue}` });
    }
  }
  return results.slice(0, 40);
}
