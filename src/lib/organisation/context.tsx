"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ToastTone } from "@/components/ui/Toast";
import { usePortal } from "@/lib/portal-context";
import {
  actorOf,
  addCorrectionNote,
  addTemporaryClosure,
  advanceDemoClock,
  approveRequestItem,
  changeClinicStatus,
  changePrimaryClinic,
  changeUserStatus,
  completeCombinedMerger,
  completeMerger,
  completeReview,
  demoNow,
  escalateOverdueReviews,
  expireTemporaryAccess,
  globalSearch,
  grantEmergencyAccess,
  isOverdue,
  loadOrgState,
  overviewMetrics,
  recordExport,
  requiresDualApproval,
  resetOrgState,
  resolveAlert,
  saveOrgState,
  submitRequestApproval,
  visibleClinics,
  activateClinic,
  dangerousPermissionCombo,
  daysUntil,
} from "./store";
import type { OrgFilters, OrgSectionId, OrgState, ReviewDecision, RiskLevel, UserAccountStatus } from "./types";
import type { ClinicLifecycleStatus } from "./types";

export const DEMO_ACTORS = [
  { id: "usr_sarah", name: "Sarah Mitchell", role: "Senior Administrator" },
  { id: "usr_david", name: "David King", role: "Director" },
] as const;

interface OrganisationContextValue {
  state: OrgState;
  setState: React.Dispatch<React.SetStateAction<OrgState>>;
  section: OrgSectionId;
  setSection: (section: OrgSectionId) => void;
  filters: OrgFilters;
  setFilters: React.Dispatch<React.SetStateAction<OrgFilters>>;
  navigate: (section: OrgSectionId, filters?: OrgFilters) => void;
  pushToast: (message: string, tone?: ToastTone) => void;
  actor: ReturnType<typeof actorOf>;
  demoActors: typeof DEMO_ACTORS;
  switchActor: (userId: string) => void;
  clinics: ReturnType<typeof visibleClinics>;
  metrics: ReturnType<typeof overviewMetrics>;
  demoNow: Date;
  search: (query: string) => ReturnType<typeof globalSearch>;
  advanceClock: (days: number) => void;
  runExpiryCheck: () => void;
  resetDemo: () => void;
  changeClinicStatus: (
    clinicId: string,
    status: ClinicLifecycleStatus,
    reason: string,
    effectiveDate: string
  ) => boolean;
  activateClinic: (clinicId: string) => boolean;
  approveRequestItem: (
    requestId: string,
    itemId: string,
    decision: "Approved" | "Rejected",
    note?: string
  ) => boolean;
  submitRequestApproval: (requestId: string, decision: "Approved" | "Rejected") => boolean;
  completeReview: (reviewId: string, decision: ReviewDecision, notes: string) => boolean;
  changeUserStatus: (userId: string, status: UserAccountStatus, reason: string) => boolean;
  completeMerger: (
    method: "Keep one and archive" | "Create combined clinic",
    primaryClinicId: string,
    secondaryClinicId: string,
    reason: string
  ) => boolean;
  addTemporaryClosure: (clinicId: string, input: { date: string; name: string; reason: string }) => boolean;
  completeCombinedMerger: (combinedClinicId: string, partnerClinicIds: string[], reason: string) => boolean;
  grantEmergencyAccess: (input: {
    userId: string;
    clinicId: string;
    reason: string;
    permissions: string;
    approverId: string;
    expiresAt: string;
    verified: boolean;
  }) => boolean;
  changePrimaryClinic: (userId: string, newClinicId: string, reason: string) => boolean;
  addCorrectionNote: (auditId: string, note: string) => void;
  resolveAlert: (alertId: string, note?: string) => void;
  recordExport: (reportName: string, format: string) => void;
  requiresDualApproval: (risk: RiskLevel) => boolean;
  isOverdue: (dueAt: string) => boolean;
  daysUntil: (dateStr: string) => number;
  dangerousCombo: (labels: string[]) => boolean;
  patchState: (updater: (prev: OrgState) => OrgState) => void;
}

const OrganisationContext = createContext<OrganisationContextValue | null>(null);

export function OrganisationProvider({ children }: { children: ReactNode }) {
  const { pushToast: portalToast } = usePortal();

  const createInitialState = () => {
    const loaded = loadOrgState();
    return escalateOverdueReviews(expireTemporaryAccess(loaded));
  };

  const [state, setStateInternal] = useState<OrgState>(() => createInitialState());
  const [section, setSection] = useState<OrgSectionId>("overview");
  const [filters, setFilters] = useState<OrgFilters>({});

  const setState = useCallback((next: OrgState | ((prev: OrgState) => OrgState)) => {
    setStateInternal((prev) => {
      const resolved = typeof next === "function" ? next(prev) : next;
      saveOrgState(resolved);
      return resolved;
    });
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      const initial = escalateOverdueReviews(expireTemporaryAccess(loadOrgState()));
      setStateInternal(initial);
      saveOrgState(initial);
    });
  }, []);

  const pushToast = useCallback(
    (message: string, tone: ToastTone = "default") => {
      portalToast(message, tone);
    },
    [portalToast]
  );

  const navigate = useCallback((nextSection: OrgSectionId, nextFilters?: OrgFilters) => {
    setSection(nextSection);
    if (nextFilters) setFilters(nextFilters);
  }, []);

  const patchState = useCallback(
    (updater: (prev: OrgState) => OrgState) => {
      setState((prev) => updater(prev));
    },
    [setState]
  );

  const applyResult = useCallback(
    (result: { state: OrgState; error?: string }, successMsg?: string) => {
      if (result.error) {
        pushToast(result.error, "danger");
        return false;
      }
      setState(result.state);
      if (successMsg) pushToast(successMsg, "success");
      return true;
    },
    [pushToast, setState]
  );

  const value = useMemo<OrganisationContextValue>(() => {
    const clinics = visibleClinics(state);
    const metrics = overviewMetrics(state);
    const now = demoNow(state);

    return {
      state,
      setState,
      section,
      setSection,
      filters,
      setFilters,
      navigate,
      pushToast,
      actor: actorOf(state),
      demoActors: DEMO_ACTORS,
      switchActor: (userId: string) => {
        const next = state.users.find((u) => u.id === userId);
        setState((prev) => ({ ...prev, currentUserId: userId }));
        pushToast(`Now acting as ${next ? `${next.firstName} ${next.lastName}` : userId}.`, "default");
      },
      clinics,
      metrics,
      demoNow: now,
      search: (query: string) => globalSearch(state, query),
      advanceClock: (days: number) => {
        const next = advanceDemoClock(state, days);
        setState(next);
        pushToast(`Demo clock advanced ${days} day${days === 1 ? "" : "s"}.`, "default");
      },
      runExpiryCheck: () => {
        const next = escalateOverdueReviews(expireTemporaryAccess(state));
        setState(next);
        pushToast("Temporary access expiry check complete.", "success");
      },
      resetDemo: () => {
        const next = resetOrgState();
        setState(next);
        pushToast("Organisation demo data reset.", "default");
      },
      changeClinicStatus: (clinicId, status, reason, effectiveDate) =>
        applyResult(changeClinicStatus(state, clinicId, status, reason, effectiveDate), "Clinic status updated."),
      activateClinic: (clinicId) =>
        applyResult(activateClinic(state, clinicId), "Clinic activated."),
      approveRequestItem: (requestId, itemId, decision, note) =>
        applyResult(approveRequestItem(state, requestId, itemId, decision, note), `Item ${decision.toLowerCase()}.`),
      submitRequestApproval: (requestId, decision) => {
        const result = submitRequestApproval(state, requestId, decision);
        if (result.error) {
          pushToast(result.error, "danger");
          return false;
        }
        setState(result.state);
        const req = result.state.requests.find((r) => r.id === requestId);
        if (req?.requiresTwoApprovers && req.status === "Partially Approved") {
          pushToast("First approval recorded — awaiting second approver.", "default");
        } else {
          pushToast(`Request ${decision.toLowerCase()}.`, decision === "Approved" ? "success" : "warn");
        }
        return true;
      },
      completeReview: (reviewId, decision, notes) => {
        const result = completeReview(state, reviewId, decision, notes);
        if (result.error) {
          pushToast(result.error, "danger");
          return false;
        }
        setState(result.state);
        if (result.createdRequestId) {
          pushToast("Review completed — access increase request created.", "default");
        } else {
          pushToast("Access review completed.", "success");
        }
        return true;
      },
      grantEmergencyAccess: (input) =>
        applyResult(grantEmergencyAccess(state, input), "Emergency access granted."),
      changePrimaryClinic: (userId, newClinicId, reason) =>
        applyResult(changePrimaryClinic(state, userId, newClinicId, reason), "Primary clinic changed — review created."),
      changeUserStatus: (userId, status, reason) =>
        applyResult(changeUserStatus(state, userId, status, reason), "User status updated."),
      completeMerger: (method, primaryClinicId, secondaryClinicId, reason) =>
        applyResult(completeMerger(state, method, primaryClinicId, secondaryClinicId, reason), "Merger completed."),
      addTemporaryClosure: (clinicId, input) =>
        applyResult(addTemporaryClosure(state, clinicId, input), "Temporary closure added."),
      completeCombinedMerger: (combinedClinicId, partnerClinicIds, reason) =>
        applyResult(completeCombinedMerger(state, combinedClinicId, partnerClinicIds, reason), "Merger completed — combined clinic activated."),
      addCorrectionNote: (auditId, note) => {
        setState(addCorrectionNote(state, auditId, note));
        pushToast("Correction note added to audit record.", "success");
      },
      resolveAlert: (alertId, note) => {
        setState(resolveAlert(state, alertId, note));
        pushToast("Alert resolved.", "success");
      },
      recordExport: (reportName, format) => {
        setState(recordExport(state, reportName, format));
        pushToast(`${reportName} exported as ${format}.`, "default");
      },
      requiresDualApproval: (risk) => requiresDualApproval(risk, state.settings.dualApprovalThreshold),
      isOverdue: (dueAt) => isOverdue(dueAt, state),
      daysUntil: (dateStr) => daysUntil(dateStr, state),
      dangerousCombo: dangerousPermissionCombo,
      patchState,
    };
  }, [state, section, filters, navigate, pushToast, setState, applyResult, patchState]);

  return <OrganisationContext.Provider value={value}>{children}</OrganisationContext.Provider>;
}

export function useOrganisation() {
  const ctx = useContext(OrganisationContext);
  if (!ctx) throw new Error("useOrganisation must be used within OrganisationProvider");
  return ctx;
}
