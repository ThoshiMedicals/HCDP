"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { usePortal } from "@/lib/portal-context";
import {
  ASSETS,
  CATEGORY_LIST,
  CLINIC_GROUPS,
  COMMAND_ACTIONS,
  COMPLIANCE_ITEMS,
  DEFAULT_SECTIONS,
  DIGITAL,
  EXECUTIVE_ITEMS,
  INCIDENTS,
  POSITIVE_MESSAGES,
  PRIORITY_ORDER,
  RECENT_ACTIVITY,
  TASK_DELIVERY,
  TRENDS,
} from "@/lib/command-centre/mock-data";
import type {
  ActionCategory,
  ActivityItem,
  AiFeedback,
  AiFinding,
  Announcement,
  CcAppearance,
  ClinicHealthProfile,
  CommandAction,
  ComplianceItem,
  DashboardSectionLayout,
  ExecutiveItem,
  LayoutPeriod,
  HealthOverrideRecord,
  PrivateNote,
  TimelineEvent,
  ClinicGroup,
  ReportSchedule,
} from "@/lib/command-centre/types";
import {
  formatDisplayDate,
  formatMoneyExact,
  nextRefreshAt,
  timeOfDayGreeting,
} from "@/lib/command-centre/utils";
import { buildFilterSentence } from "@/lib/command-centre/filter-sentence";
import {
  applyAppearance,
  CC_STORAGE,
  getAppearanceServerSnapshot,
  getAppearanceSnapshot,
  hydrateAppearanceFromStorage,
  readCustomRange,
  readHealthOverrides,
  readLayouts,
  readNotes,
  readPeriod,
  readSelectedClinics,
  setAppearanceStore,
  subscribeAppearance,
  subscribeSystemAppearance,
  writeCustomRange,
  writeHealthOverrides,
  writeLayouts,
  writeNotes,
  writePeriod,
  writeSelectedClinics,
  type PersistedHealthOverride,
  type SavedLayout,
} from "@/lib/command-centre/storage";
import {
  appendAudit,
  loadModule1Actions,
  resetModule1ActionsToSeed,
  saveModule1Actions,
} from "@/lib/command-centre/action-repository";
import {
  advanceDemoDay,
  ensureSuggestedLayouts,
  readActiveLayoutId,
  readClinicGroups,
  readDemoDay,
  readQaCardState,
  writeActiveLayoutId,
  writeClinicGroups,
  writeQaCardState,
  type QaCardState,
} from "@/lib/command-centre/cc-extras";
import {
  getPeriodActions,
  getPeriodAssets,
  getPeriodClinicHealth,
  getPeriodCompliance,
  getPeriodDigital,
  getPeriodFinance,
  getPeriodIncidents,
  getPeriodStaffing,
  getPeriodTasks,
  getPeriodTrends,
  periodLabel,
  type CustomRange,
  type PeriodContext,
} from "@/lib/command-centre/period-engine";
import { runPlatformSearch, type SearchNavigate } from "@/lib/command-centre/search";
import { AI_FINDINGS, ANNOUNCEMENTS } from "@/lib/command-centre/mock-data";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ControlBar } from "./ControlBar";
import {
  AnnouncementCarousel,
  CategoryFilters,
  EmergencyBanner,
  PrioritySummary,
} from "./PriorityAndAnnouncements";
import { AiBriefing } from "./AiBriefing";
import { ActiveActionList } from "./ActiveActionList";
import { FullActionFile } from "./FullActionFile";
import {
  AssetsPanel,
  ClinicOperationsPanel,
  CompliancePanel,
  DigitalPanel,
  FinancePanel,
  IncidentsPanel,
  MyExecutiveActions,
  PositiveHealthSummary,
  PrivateNotesCard,
  RecentActivityPanel,
  StaffingPanel,
  TasksDeliveryPanel,
  TrendsPanel,
} from "./Sections";
import { InboxProjectionSummary } from "./InboxProjectionSummary";
import { WorkforceProjectionSummary } from "./WorkforceProjectionSummary";
import { syncFromModule1SelectedClinics } from "@/modules/m01-command-centre/adapters/platform";
import {
  CreateActionModal,
  CustomiseDashboardModal,
  CustomRangeModal,
  ExportModal,
  PasswordConfirmModal,
  PublishAnnouncementModal,
  RecurringTemplatesModal,
  ScheduleReportModal,
  SearchResultsPanel,
} from "./Modals";
import { isInactiveAction, KpiScorecardView, MyDayOwnerView, ReportsView } from "./ExtraViews";
import { CardStateFrame, FilterSentenceBar, type CardDataState } from "./CcStates";
import { HealthBreakdownDrawer } from "./HealthBreakdown";

const REFRESH_MS = 5 * 60 * 1000;
const DRAFT_STORAGE = CC_STORAGE.draftForm;

type CcView = "command" | "myday" | "kpi" | "reports";

// Prototype m1-layout: main column (~1.6fr) vs side column (~0.9fr) at desktop widths.
const MAIN_SECTION_IDS = ["priority", "categories", "ai", "actions", "positive", "completed", "clinics", "trends"];
const SIDE_SECTION_IDS = [
  "executive",
  "staffing",
  "compliance",
  "finance",
  "incidents",
  "tasks",
  "assets",
  "digital",
  "activity",
];

function clinicMatch(locationId: string, selected: string[], allCount: number) {
  if (!selected.length || selected.length === allCount) return true;
  if (locationId === "all") return true;
  return selected.includes(locationId);
}

function isLocallyProgressed(action: CommandAction): boolean {
  return Boolean(
    action.completedAt ||
      action.dismissed ||
      action.dismissMeta ||
      action.priority === "Completed Today" ||
      action.stage === "Completed" ||
      action.stage === "Closed" ||
      action.stage === "Dismissed" ||
      action.stage === "Reopened" ||
      /Reopened after completion/i.test(action.latestUpdate ?? "")
  );
}

/** Period seed may reshape display fields; locally progressed actions always win. */
function mergePersistedWithPeriod(base: CommandAction[], periodActions: CommandAction[]): CommandAction[] {
  const baseById = Object.fromEntries(base.map((a) => [a.id, a]));
  const periodIds = new Set(periodActions.map((a) => a.id));
  const merged = periodActions.map((periodA) => {
    const persisted = baseById[periodA.id];
    if (!persisted) return periodA;
    if (isLocallyProgressed(persisted)) return { ...periodA, ...persisted };
    return periodA;
  });
  return [...merged, ...base.filter((a) => !periodIds.has(a.id))];
}

function applyDemoDayFilter(actions: CommandAction[], demoDayIso: string, period: LayoutPeriod): CommandAction[] {
  const day = demoDayIso.slice(0, 10);
  return actions.map((a) => {
    if (a.priority !== "Completed Today" && a.stage !== "Completed" && a.stage !== "Closed") return a;
    const doneDay = (a.completedAt ?? "").slice(0, 10);
    if (doneDay === day) {
      return { ...a, priority: "Completed Today", stage: a.stage === "Closed" ? "Completed" : a.stage };
    }
    if (period === "Today" && a.priority === "Completed Today") {
      return { ...a, priority: "Routine", stage: "Closed" };
    }
    if (a.priority === "Completed Today" || a.stage === "Completed") {
      return { ...a, priority: "Routine", stage: a.stage === "Completed" ? "Closed" : a.stage };
    }
    return a;
  });
}

function initLayouts(): SavedLayout[] {
  return [
    {
      id: "lay-default",
      name: "Daily Operations",
      sections: DEFAULT_SECTIONS,
      isDefault: true,
      updatedAt: "2026-07-20T00:00:00.000Z",
    },
    {
      id: "lay-personal",
      name: "My Personal Layout",
      sections: DEFAULT_SECTIONS,
      isDefault: false,
      updatedAt: "2026-07-20T00:00:00.000Z",
    },
  ];
}

function loadClientLayouts(): SavedLayout[] {
  const raw = readLayouts();
  const seed = initLayouts();
  let base = raw.length ? raw : seed;
  // Migrate older seeds that used “My Personal Layout” as the role default.
  base = base.map((l) =>
    l.id === "lay-default" && l.name === "My Personal Layout"
      ? { ...l, name: "Daily Operations", isDefault: true }
      : l
  );
  if (!base.some((l) => l.name === "My Personal Layout")) {
    base = [
      ...base,
      {
        id: "lay-personal",
        name: "My Personal Layout",
        sections: DEFAULT_SECTIONS,
        isDefault: false,
        updatedAt: "2026-07-20T00:00:00.000Z",
      },
    ];
  }
  const merged = ensureSuggestedLayouts(base, DEFAULT_SECTIONS);
  if (JSON.stringify(merged) !== JSON.stringify(raw)) writeLayouts(merged);
  return merged;
}

export function CommandCentre() {
  const { locations, pushToast } = usePortal();
  const [selectedClinicIds, setSelectedClinicIds] = useState<string[]>(() => locations.map((l) => l.id));
  const [clinicGroups, setClinicGroups] = useState<ClinicGroup[]>(() => CLINIC_GROUPS);
  const [period, setPeriod] = useState<LayoutPeriod>("Today");
  const [customRange, setCustomRange] = useState<CustomRange | null>({
    start: "2026-07-14",
    end: "2026-07-20",
  });
  const [demoDay, setDemoDay] = useState("2026-07-20");
  const [layouts, setLayouts] = useState<SavedLayout[]>(() => initLayouts());
  const [activeLayoutId, setActiveLayoutId] = useState<string | null>("lay-default");
  const [layoutName, setLayoutName] = useState("Daily Operations");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [categoryFilters, setCategoryFilters] = useState<ActionCategory[]>([]);
  const [actions, setActions] = useState<CommandAction[]>(() => COMMAND_ACTIONS);
  const [clinicHealth, setClinicHealth] = useState<ClinicHealthProfile[]>(() =>
    getPeriodClinicHealth({ period: "Today", demoDayIso: "2026-07-20" })
  );
  const [financeData, setFinanceData] = useState(() =>
    getPeriodFinance({ period: "Today", demoDayIso: "2026-07-20" })
  );
  const [staffingData, setStaffingData] = useState(() =>
    getPeriodStaffing({ period: "Today", demoDayIso: "2026-07-20" })
  );
  const [complianceData, setComplianceData] = useState<ComplianceItem[]>(COMPLIANCE_ITEMS);
  const [incidentsData, setIncidentsData] = useState(INCIDENTS);
  const [tasksData, setTasksData] = useState(TASK_DELIVERY);
  const [assetsData, setAssetsData] = useState(ASSETS);
  const [digitalData, setDigitalData] = useState(DIGITAL);
  const [trendsData, setTrendsData] = useState(TRENDS);
  const [announcements, setAnnouncements] = useState<Announcement[]>(ANNOUNCEMENTS);
  const [annIndex, setAnnIndex] = useState(0);
  const [findings, setFindings] = useState<AiFinding[]>(AI_FINDINGS);
  const [executive, setExecutive] = useState<ExecutiveItem[]>(EXECUTIVE_ITEMS);
  const [activity, setActivity] = useState<ActivityItem[]>(RECENT_ACTIVITY);
  const [compliance, setCompliance] = useState<ComplianceItem[]>(COMPLIANCE_ITEMS);
  const [sections, setSections] = useState<DashboardSectionLayout[]>(DEFAULT_SECTIONS);
  const [savedSections, setSavedSections] = useState<DashboardSectionLayout[]>(DEFAULT_SECTIONS);
  const [privateNotes, setPrivateNotes] = useState<PrivateNote[]>([]);
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [customiseOpen, setCustomiseOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleReportName, setScheduleReportName] = useState("");
  const [scheduleEdit, setScheduleEdit] = useState<ReportSchedule | null>(null);
  const [scheduleListKey, setScheduleListKey] = useState(0);
  const [recurringOpen, setRecurringOpen] = useState(false);
  const [customRangeOpen, setCustomRangeOpen] = useState(false);
  const [scrollPanel, setScrollPanel] = useState<string | null>(null);
  const [qaCardState, setQaCardState] = useState<QaCardState | null>(null);
  const [announcementsAllOpen, setAnnouncementsAllOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [eodOpen, setEodOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordTitle, setPasswordTitle] = useState("");
  const passwordActionRef = useRef<(() => void) | null>(null);
  /** Demo day morning in Australia/Brisbane — keeps greeting aligned with prototype presentation. */
  const [lastUpdated, setLastUpdated] = useState(() => new Date("2026-07-19T22:52:00.000Z"));
  const [paused, setPaused] = useState(false);
  const [dataStale, setDataStale] = useState(false);
  const [mobileUrgent, setMobileUrgent] = useState(false);
  const [viewTab, setViewTab] = useState<CcView>("command");
  const [packOpen, setPackOpen] = useState(false);
  const formDirtyRef = useRef(false);
  const appearance = useSyncExternalStore(subscribeAppearance, getAppearanceSnapshot, getAppearanceServerSnapshot);
  const [clientReady, setClientReady] = useState(false);
  const resolvedAppearance: CcAppearance = appearance;
  const [emergencyIndex, setEmergencyIndex] = useState(0);
  const [healthOpenId, setHealthOpenId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);

  const setAppearance = useCallback((value: CcAppearance) => {
    setAppearanceStore(value);
  }, []);

  useLayoutEffect(() => {
    hydrateAppearanceFromStorage();
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      const day = readDemoDay();
      setDemoDay(day);
      setActions(loadModule1Actions());
      setPrivateNotes(readNotes());
      setClinicGroups(readClinicGroups(CLINIC_GROUPS));
      setQaCardState(readQaCardState());
      const savedClinics = readSelectedClinics(locations.map((l) => l.id)).filter(
        (id) => locations.some((l) => l.id === id)
      );
      if (savedClinics.length) setSelectedClinicIds(savedClinics);
      setPeriod(readPeriod("Today"));
      const savedRange = readCustomRange({ start: "2026-07-14", end: "2026-07-20" });
      if (savedRange) setCustomRange(savedRange);
      setClientReady(true);
      const ls = loadClientLayouts();
      setLayouts(ls);
      const preferred =
        ls.find((l) => l.name === "Daily Operations")?.id ??
        ls.find((l) => l.isDefault)?.id ??
        ls[0]?.id ??
        "lay-default";
      const stored = readActiveLayoutId();
      const active =
        stored && ls.some((l) => l.id === stored) ? stored : preferred;
      if (!stored || !ls.some((l) => l.id === stored)) writeActiveLayoutId(active);
      setActiveLayoutId(active);
      const current = ls.find((l) => l.id === active) ?? ls[0];
      if (current) {
        setLayoutName(current.name);
        setSections(current.sections);
        setSavedSections(current.sections);
      }
    });
  }, [locations]);

  useEffect(() => {
    if (!clientReady) return;
    writeSelectedClinics(selectedClinicIds);
    syncFromModule1SelectedClinics(selectedClinicIds);
  }, [selectedClinicIds, clientReady]);

  useEffect(() => {
    if (!clientReady) return;
    writePeriod(period);
  }, [period, clientReady]);

  useEffect(() => {
    if (!clientReady) return;
    writeCustomRange(customRange);
  }, [customRange, clientReady]);

  useEffect(() => {
    if (resolvedAppearance !== "system") return;
    return subscribeSystemAppearance(() => applyAppearance("system"));
  }, [resolvedAppearance]);

  const periodCtx = useMemo<PeriodContext>(
    () => ({ period, customRange, demoDayIso: demoDay }),
    [period, customRange, demoDay]
  );

  useEffect(() => {
    const ctx = periodCtx;
    queueMicrotask(() => {
      const overrides = readHealthOverrides();
      const health = getPeriodClinicHealth(ctx).map((h) => {
        const row = overrides.find((o) => o.locationId === h.locationId);
        return row ? { ...h, override: row.override } : h;
      });
      setClinicHealth(health);
      setFinanceData(getPeriodFinance(ctx));
      setStaffingData(getPeriodStaffing(ctx));
      setComplianceData(getPeriodCompliance(ctx));
      setIncidentsData(getPeriodIncidents(ctx));
      setTasksData(getPeriodTasks(ctx));
      setAssetsData(getPeriodAssets(ctx));
      setDigitalData(getPeriodDigital(ctx));
      setTrendsData(getPeriodTrends(ctx));
      setActions((prev) => {
        const periodActs = getPeriodActions(ctx);
        const merged = mergePersistedWithPeriod(prev, periodActs);
        return applyDemoDayFilter(merged, demoDay, period);
      });
    });
  }, [periodCtx, demoDay, period]);

  useEffect(() => {
    if (typeof window === "undefined" || !clientReady) return;
    saveModule1Actions(actions);
  }, [actions, clientReady]);

  useEffect(() => {
    if (!clientReady) return;
    writeNotes(privateNotes);
  }, [privateNotes, clientReady]);

  const cardState: CardDataState = (dataStale ? "stale" : qaCardState ?? "ready") as CardDataState;

  function wrapSection(id: string, node: ReactNode) {
    if (!node) return null;
    return (
      <CardStateFrame
        key={id}
        state={cardState}
        lastUpdated={lastUpdated.toLocaleString("en-AU", { timeZone: "Australia/Brisbane" })}
        source={`Module 1 · ${id}`}
        onRetry={() => refresh(true)}
        onCreateFollowUp={() => setCreateOpen(true)}
      >
        <div id={`cc-panel-${id}`}>{node}</div>
      </CardStateFrame>
    );
  }

  const unsavedLayout = useMemo(
    () => JSON.stringify(sections) !== JSON.stringify(savedSections),
    [sections, savedSections]
  );

  const nextRefresh = nextRefreshAt(lastUpdated, REFRESH_MS);
  const greeting = timeOfDayGreeting(lastUpdated);
  const todayLabel = formatDisplayDate(new Date(`${demoDay}T12:00:00`));

  const filteredHealth = useMemo(
    () => clinicHealth.filter((h) => clinicMatch(h.locationId, selectedClinicIds, locations.length)),
    [selectedClinicIds, locations.length, clinicHealth]
  );

  const filteredActions = useMemo(() => {
    return actions.filter((a) => {
      if (!clinicMatch(a.locationId, selectedClinicIds, locations.length)) return false;
      // Active attention queues exclude completed/closed/dismissed/archived
      // (Completed Today filter and completed section still show them)
      if (priorityFilter === "Completed Today") {
        return a.priority === "Completed Today" || a.stage === "Completed" || a.stage === "Closed";
      }
      if (priorityFilter) {
        if (priorityFilter === "Overdue") {
          if (!(a.stage === "Overdue" || a.overdueAge) || isInactiveAction(a)) return false;
        } else if (a.priority !== priorityFilter) {
          return false;
        }
      } else if (isInactiveAction(a)) {
        return false;
      }
      if (categoryFilters.length && !categoryFilters.includes(a.category)) return false;
      if (statusFilter && a.stage !== statusFilter) return false;
      if (assigneeFilter && !a.owner.toLowerCase().includes(assigneeFilter.toLowerCase())) return false;
      return true;
    });
  }, [actions, selectedClinicIds, locations.length, priorityFilter, categoryFilters, statusFilter, assigneeFilter]);

  const priorityCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const key of PRIORITY_ORDER) counts[key] = 0;
    for (const a of actions.filter((x) => clinicMatch(x.locationId, selectedClinicIds, locations.length))) {
      if (a.priority === "Completed Today" || a.stage === "Completed" || a.stage === "Closed") {
        counts["Completed Today"] = (counts["Completed Today"] ?? 0) + 1;
        continue;
      }
      if (isInactiveAction(a)) continue;
      counts[a.priority] = (counts[a.priority] ?? 0) + 1;
      if (a.stage === "Overdue" || a.overdueAge) counts.Overdue = (counts.Overdue ?? 0) + 1;
    }
    return counts;
  }, [actions, selectedClinicIds, locations.length]);

  const emergencyAnnouncements = announcements.filter((a) => a.type === "Emergency" && !a.acknowledged);
  const normalAnnouncements = announcements.filter((a) => a.type !== "Emergency");
  const notificationCounts = {
    emergency: emergencyAnnouncements.length,
    unread: announcements.filter((a) => !a.acknowledged).length,
    approvals: actions.filter((a) => a.stage === "Awaiting Approval").length,
  };

  const refresh = useCallback(
    (forceEmergency = false) => {
      if (!forceEmergency && formDirtyRef.current) {
        setDataStale(true);
        pushToast("Demo: refresh skipped — unfinished form or comment in progress. Data may be outdated.", "warn");
        return;
      }
      setLastUpdated(new Date());
      setDataStale(false);
      pushToast(
        forceEmergency ? "Demo: emergency view refreshed immediately." : "Demo: dashboard figures refreshed locally.",
        "success"
      );
    },
    [pushToast]
  );

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => refresh(false), REFRESH_MS);
    return () => window.clearInterval(id);
  }, [paused, refresh]);

  // Emergency changes appear immediately even when paused / dirty
  useEffect(() => {
    if (!emergencyAnnouncements.length) return;
    const id = window.setInterval(() => {
      setLastUpdated(new Date());
    }, 15000);
    return () => window.clearInterval(id);
  }, [emergencyAnnouncements.length]);

  useEffect(() => {
    try {
      const draft = window.sessionStorage.getItem(DRAFT_STORAGE);
      formDirtyRef.current = Boolean(draft);
    } catch {
      /* ignore */
    }
  }, []);

  const openAction = actions.find((a) => a.id === openActionId) ?? null;

  function updateAction(next: CommandAction) {
    setActions((prev) => {
      const updated = prev.map((a) => (a.id === next.id ? next : a));
      saveModule1Actions(updated);
      return updated;
    });
  }

  function passwordGate(_action: CommandAction, verb: string, apply: () => void) {
    setPasswordTitle(`Confirm: ${verb}`);
    passwordActionRef.current = apply;
    setPasswordOpen(true);
  }

  function onBulk(ids: string[], verb: string) {
    setActions((prev) =>
      prev.map((a) => {
        if (!ids.includes(a.id)) return a;
        if (verb === "Mark Complete") {
          return {
            ...a,
            stage: "Completed",
            priority: "Completed Today",
            completedAt: new Date().toISOString(),
            latestUpdate: `Marked complete by Neil`,
          };
        }
        if (verb === "Escalate") return { ...a, stage: "Escalated", escalation: "Owner/Director", latestUpdate: "Escalated" };
        if (verb === "Acknowledge") return { ...a, acknowledged: true, latestUpdate: "Acknowledged" };
        if (verb === "Dismiss") return { ...a, stage: "Dismissed", latestUpdate: "Dismissed" };
        return { ...a, latestUpdate: `${verb} by Neil`, stage: verb === "Assign" || verb === "Reassign" ? "Assigned" : a.stage };
      })
    );
    pushToast(`${verb} applied to ${ids.length} action(s).`, "success");
    setOpenActionId(null);
  }

  function onComment(id: string, body: string) {
    formDirtyRef.current = false;
    try {
      window.sessionStorage.removeItem(DRAFT_STORAGE);
    } catch {
      /* ignore */
    }
    setActions((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              comments: [...a.comments, { id: `c-${Date.now()}`, author: "Neil", at: new Date().toISOString(), body }],
              latestUpdate: `Comment: ${body}`,
            }
          : a
      )
    );
  }

  const searchResults = useMemo(() => {
    return runPlatformSearch({
      query: searchQuery,
      actions,
      announcements,
      compliance: complianceData,
      finance: financeData,
      incidents: incidentsData,
      staffing: staffingData,
      assets: assetsData,
      health: clinicHealth,
      activity,
      locations,
    });
  }, [
    searchQuery,
    actions,
    announcements,
    complianceData,
    financeData,
    incidentsData,
    staffingData,
    assetsData,
    clinicHealth,
    activity,
    locations,
  ]);

  function handleSearchNavigate(nav?: SearchNavigate) {
    if (!nav) return;
    if (nav.kind === "action") {
      setOpenActionId(nav.actionId);
      setViewTab("command");
      return;
    }
    if (nav.kind === "health") {
      setHealthOpenId(nav.locationId);
      setViewTab("command");
      return;
    }
    if (nav.kind === "announcement") {
      setAnnouncementsAllOpen(true);
      return;
    }
    if (nav.kind === "eod") {
      setEodOpen(true);
      return;
    }
    if (nav.kind === "reports") {
      setViewTab("reports");
      return;
    }
    if (nav.kind === "panel") {
      setViewTab("command");
      setScrollPanel(nav.panel);
      window.setTimeout(() => {
        document.getElementById(`cc-panel-${nav.panel}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }

  function switchViewTab(tab: CcView) {
    if (unsavedLayout && tab !== viewTab) {
      const leave = window.confirm("You have unsaved layout changes. Leave without saving?");
      if (!leave) return;
    }
    setViewTab(tab);
  }

  function selectLayout(id: string) {
    if (unsavedLayout) {
      const leave = window.confirm("You have unsaved layout changes. Switch layout without saving?");
      if (!leave) return;
    }
    const layout = layouts.find((l) => l.id === id);
    if (!layout) return;
    setActiveLayoutId(id);
    writeActiveLayoutId(id);
    setLayoutName(layout.name);
    setSections(layout.sections.map((s) => ({ ...s })));
    setSavedSections(layout.sections.map((s) => ({ ...s })));
  }

  function persistLayout(name: string, sectionsToSave: DashboardSectionLayout[], id?: string) {
    const layoutId = id ?? activeLayoutId ?? `lay-${Date.now()}`;
    const nextLayout: SavedLayout = {
      id: layoutId,
      name,
      sections: sectionsToSave,
      updatedAt: new Date().toISOString(),
      isDefault: layouts.find((l) => l.id === layoutId)?.isDefault,
    };
    const next = [nextLayout, ...layouts.filter((l) => l.id !== layoutId)];
    setLayouts(next);
    writeLayouts(next);
    setActiveLayoutId(layoutId);
    writeActiveLayoutId(layoutId);
    setLayoutName(name);
    setSavedSections(sectionsToSave.map((s) => ({ ...s })));
  }

  function simulateNextDay() {
    const next = advanceDemoDay(1);
    setDemoDay(next);
    setActions((prev) => applyDemoDayFilter(prev, next, period));
    pushToast(`Demo day advanced to ${next}. Completed Today refreshed.`, "success");
    refresh(true);
  }

  const sectionVisible = (id: string) => {
    const s = sections.find((x) => x.id === id);
    return s?.visible !== false;
  };
  const sectionCollapsed = (id: string) => sections.find((x) => x.id === id)?.collapsed;

  const orderedSectionIds = [...sections].sort((a, b) => a.order - b.order).map((s) => s.id);

  const staffingFiltered = staffingData.filter((s) => clinicMatch(s.locationId, selectedClinicIds, locations.length));
  const financeFiltered = financeData.filter(
    (f) => f.locationId === "all" || clinicMatch(f.locationId, selectedClinicIds, locations.length)
  );
  const incidentsFiltered = incidentsData.filter((i) => clinicMatch(i.locationId, selectedClinicIds, locations.length));
  const tasksFiltered = tasksData.filter(
    (t) => t.locationId === "all" || clinicMatch(t.locationId, selectedClinicIds, locations.length)
  );
  const assetsFiltered = assetsData.filter(
    (a) => a.locationId === "all" || clinicMatch(a.locationId, selectedClinicIds, locations.length)
  );
  const digitalFiltered = digitalData.filter(
    (d) => d.locationId === "all" || clinicMatch(d.locationId, selectedClinicIds, locations.length)
  );
  const complianceMerged = useMemo(() => {
    const byId = Object.fromEntries(compliance.map((c) => [c.id, c]));
    return complianceData.map((c) => byId[c.id] ?? c);
  }, [compliance, complianceData]);
  const activityFiltered = activity.filter((a) => clinicMatch(a.locationId, selectedClinicIds, locations.length));
  const completedActions = useMemo(
    () =>
      actions.filter(
        (a) =>
          clinicMatch(a.locationId, selectedClinicIds, locations.length) &&
          (a.priority === "Completed Today" || a.stage === "Completed" || a.stage === "Closed")
      ),
    [actions, selectedClinicIds, locations.length]
  );

  function saveClinicGroup(name: string, ids: string[]) {
    const group: ClinicGroup = { id: `grp-${Date.now()}`, name, locationIds: ids };
    setClinicGroups((prev) => {
      const next = [...prev, group];
      writeClinicGroups(next);
      return next;
    });
    pushToast(`Clinic group “${name}” saved locally (${ids.length} clinics).`, "success");
  }

  function handleFinanceAction(
    target: string,
    verb: "Review" | "Approve" | "Reject" | "Request Information"
  ) {
    const sensitive = verb === "Approve" || verb === "Reject";
    const apply = () => {
      appendAudit({
        actionId: target,
        event: `Finance ${verb}`,
        user: "Neil",
        at: new Date().toISOString(),
        reason: `Demonstration ${verb.toLowerCase()} on ${target}`,
        previousValue: "Pending review",
        newValue: verb,
        approval: "Neil (demonstration)",
        evidence: "Evidence placeholder (local demonstration)",
      });
      pushToast(`${verb} recorded for finance item (local demo — no live backend).`, "success");
    };
    if (sensitive) {
      passwordGate({ requiresPassword: true } as CommandAction, `Finance ${verb}`, apply);
      return;
    }
    apply();
  }

  function handleIncidentAction(id: string, verb: "Review RCA" | "Review CAPA" | "Close serious") {
    const apply = () => {
      if (verb === "Close serious") {
        setIncidentsData((prev) => prev.filter((i) => i.id !== id));
        appendAudit({
          actionId: id,
          event: "Close serious incident",
          user: "Neil",
          at: new Date().toISOString(),
          previousValue: "Open investigation",
          newValue: "Closed",
          reason: "Serious incident formally closed (demonstration)",
          approval: "Neil (demonstration)",
          evidence: "Evidence placeholder (local demonstration)",
        });
      }
      pushToast(`${verb} recorded (local demo — no live backend).`, "success");
    };
    if (verb === "Close serious") {
      passwordGate({ requiresPassword: true } as CommandAction, verb, apply);
      return;
    }
    apply();
  }

  function handlePanelAction(locationId: string, verb: "Create action" | "Assign" | "Escalate") {
    if (verb === "Create action") {
      setCreateOpen(true);
      pushToast(`Create Action opened for ${locationId.replace("loc_", "")} (local demo).`, "default");
      return;
    }
    pushToast(`${verb} recorded for ${locationId.replace("loc_", "")} (local demo — no assignment backend).`, "success");
  }

  function handleStaffingFollowUp(
    locationId: string,
    cover: { role: string; person: string; reason: string }
  ) {
    setCreateOpen(true);
    pushToast(
      `Create Action opened for ${cover.role} cover at ${locationId.replace("loc_", "")} — ${cover.person} (local demo).`,
      "default"
    );
  }

  function withdrawEmergency(id: string, reason?: string) {
    setAnnouncements((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              type: "Info" as const,
              acknowledged: true,
              message: reason ? `${a.message} [Withdrawn: ${reason}]` : `${a.message} [Withdrawn]`,
            }
          : a
      )
    );
    appendAudit({
      actionId: id,
      event: "Withdraw emergency notice",
      user: "Neil",
      at: new Date().toISOString(),
      reason: reason || "Emergency notice withdrawn",
      previousValue: "Emergency published",
      newValue: "Withdrawn",
      approval: "Neil (demonstration)",
      evidence: "Evidence placeholder (local demonstration)",
    });
    pushToast("Emergency notice withdrawn locally (dashboard only — no live email).", "success");
  }

  function renderSection(id: string) {
    if (!sectionVisible(id)) return null;
    const collapsed = sectionCollapsed(id);
    if (collapsed) {
      return (
        <div key={id} className="rounded-xl border border-dashed border-[var(--cc-card-line)] bg-[var(--cc-soft)] px-4 py-2 text-sm font-bold text-[var(--cc-muted)]">
          {sections.find((s) => s.id === id)?.label} (collapsed)
          <Button small variant="line" className="ml-2" onClick={() => setSections((prev) => prev.map((s) => (s.id === id ? { ...s, collapsed: false } : s)))}>
            Expand
          </Button>
        </div>
      );
    }
    switch (id) {
      case "priority":
        return wrapSection(
          id,
          <>
            <PrioritySummary
              counts={priorityCounts}
              selected={priorityFilter}
              onSelect={(k) => setPriorityFilter(k)}
              onClear={() => setPriorityFilter(null)}
              lastUpdated={lastUpdated}
              clinicScopeLabel={
                selectedClinicIds.length === locations.length
                  ? "All clinics"
                  : `${selectedClinicIds.length} clinic(s) selected`
              }
            />
            <div className="mt-3 space-y-3">
              <InboxProjectionSummary />
              <WorkforceProjectionSummary />
            </div>
          </>
        );
      case "categories":
        return wrapSection(
          id,
          <CategoryFilters
            categories={CATEGORY_LIST}
            selected={categoryFilters}
            onToggle={(c) =>
              setCategoryFilters((prev) =>
                prev.includes(c as ActionCategory)
                  ? prev.filter((x) => x !== c)
                  : [...prev, c as ActionCategory]
              )
            }
          />
        );
      case "ai":
        return wrapSection(
          id,
          <AiBriefing
            findings={findings}
            onFeedback={(fid, feedback: AiFeedback) => {
              setFindings((prev) => prev.map((f) => (f.id === fid ? { ...f, feedback } : f)));
              pushToast("AI feedback recorded separately — source records unchanged.", "success");
            }}
            onOpenAction={(aid) => setOpenActionId(aid)}
            onCreateAction={() => setCreateOpen(true)}
            generatedAt={lastUpdated}
            clinicLabel={
              selectedClinicIds.length === locations.length
                ? "All clinics"
                : `${selectedClinicIds.length} selected clinics`
            }
            period={period}
          />
        );
      case "actions":
        return wrapSection(
          id,
          <ActiveActionList
            actions={filteredActions}
            locations={locations}
            onOpen={setOpenActionId}
            onBulk={onBulk}
            onComment={onComment}
          />
        );
      case "positive":
        return wrapSection(id, <PositiveHealthSummary messages={POSITIVE_MESSAGES} />);
      case "completed":
        return wrapSection(
          id,
          <ActiveActionList
            actions={completedActions}
            locations={locations}
            onOpen={setOpenActionId}
            onBulk={onBulk}
            onComment={onComment}
            showCompleted
          />
        );
      case "executive":
        return wrapSection(
          id,
          <MyExecutiveActions
            items={executive}
            locations={locations}
            onOpen={(aid) => aid && setOpenActionId(aid)}
            onDelegate={(eid) => {
              setExecutive((prev) =>
                prev.map((e) =>
                  e.id === eid
                    ? { ...e, delegationStatus: "Delegated — final approval retained", canDelegate: false }
                    : e
                )
              );
              pushToast("Delegated for review — final executive approval retained.", "success");
            }}
            onAction={(eid, verb) => {
              if (verb === "Approve" || verb === "Mark Complete" || verb === "Acknowledge") {
                setExecutive((prev) => prev.filter((e) => e.id !== eid));
              }
              pushToast(`${verb} recorded for executive item (local demonstration).`, "success");
            }}
          />
        );
      case "clinics":
        return wrapSection(
          id,
          <ClinicOperationsPanel
            health={filteredHealth}
            locations={locations}
            onOpenHealth={(lid) => setHealthOpenId(lid)}
          />
        );
      case "staffing":
        return wrapSection(
          id,
          <StaffingPanel
            key={id}
            staffing={staffingFiltered}
            locations={locations}
            onCreateFollowUp={handleStaffingFollowUp}
          />
        );
      case "compliance":
        return wrapSection(
          id,
          <CompliancePanel
            key={id}
            items={complianceMerged.filter((c) => clinicMatch(c.locationId, selectedClinicIds, locations.length))}
            orgPercent={94}
            onTemporaryUse={(cid) => {
              passwordGate({ requiresPassword: true } as CommandAction, "Temporary continued use", () => {
                setCompliance((prev) =>
                  prev.map((c) =>
                    c.id === cid
                      ? {
                          ...c,
                          temporaryContinuedUse: {
                            reason: "Owner-approved temporary continued use",
                            controls: "Supervised use + daily review",
                            recordedBy: "Neil",
                            at: new Date().toISOString(),
                          },
                        }
                      : c
                  )
                );
                pushToast("Temporary continued use recorded with reason and controls.", "success");
              });
            }}
          />
        );
      case "finance":
        return wrapSection(
          id,
          <FinancePanel
            key={id}
            finance={financeFiltered}
            locations={locations}
            onAction={handleFinanceAction}
          />
        );
      case "incidents":
        return wrapSection(
          id,
          <IncidentsPanel
            key={id}
            incidents={incidentsFiltered}
            onOpen={(aid) => aid && setOpenActionId(aid)}
            onAction={handleIncidentAction}
          />
        );
      case "tasks":
        return wrapSection(
          id,
          <TasksDeliveryPanel key={id} tasks={tasksFiltered} onPanelAction={handlePanelAction} />
        );
      case "assets":
        return wrapSection(
          id,
          <AssetsPanel key={id} assets={assetsFiltered} onPanelAction={handlePanelAction} />
        );
      case "digital":
        return wrapSection(
          id,
          <DigitalPanel key={id} digital={digitalFiltered} onPanelAction={handlePanelAction} />
        );
      case "trends":
        return wrapSection(id, <TrendsPanel key={id} trends={trendsData} period={period} />);
      case "activity":
        return wrapSection(
          id,
          <RecentActivityPanel
            items={activityFiltered}
            onOpen={(aid) => aid && setOpenActionId(aid)}
            onPinRead={(actId) => setActivity((prev) => prev.map((a) => (a.id === actId ? { ...a, read: true, pinned: false } : a)))}
          />
        );
      default:
        return null;
    }
  }

  const healthProfile = clinicHealth.find((h) => h.locationId === healthOpenId) ?? null;

  const filterSentence = buildFilterSentence({
    count: filteredActions.filter((a) => !isInactiveAction(a) || priorityFilter === "Completed Today").length,
    priority: priorityFilter,
    categories: categoryFilters,
    selectedClinicIds,
    locations,
    period,
    status: statusFilter,
    assignee: assigneeFilter,
  });

  const clinicNameFn = (ids: string[]) => {
    if (ids.includes("all")) return "All clinics";
    return ids.map((id) => locations.find((l) => l.id === id)?.shortName ?? id).join(", ");
  };

  return (
    <div className="cc-root">
      <div className="mx-auto w-full max-w-[1480px] px-3 pt-2.5 lg:px-5">
        <EmergencyBanner
          items={emergencyAnnouncements}
          index={emergencyIndex}
          onPrev={() => setEmergencyIndex((i) => i - 1)}
          onNext={() => setEmergencyIndex((i) => i + 1)}
          onViewAll={() => setAnnouncementsAllOpen(true)}
          onOpenFull={(id) => {
            const related = announcements.find((a) => a.id === id)?.relatedActionId;
            if (related) setOpenActionId(related);
            else pushToast("Full notice opened in demonstration mode.", "success");
          }}
          locationNames={clinicNameFn}
          onAcknowledge={(id) => {
            setAnnouncements((prev) => prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)));
            pushToast("Emergency announcement acknowledged.", "success");
          }}
          onWithdraw={withdrawEmergency}
        />
      </div>

      <header className="mx-auto w-full max-w-[1480px] px-3 pb-2 pt-1.5 lg:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="cc-text-info text-[10px] font-extrabold uppercase tracking-[0.08em]">
              Module 1 · Owner / Director
            </div>
            <h1 className="m-0 mt-1 text-[22px] font-black tracking-tight text-[var(--cc-ink)] sm:text-[26px]">
              Owner/Director Command Centre
            </h1>
            <p className="m-0 mt-1 text-[13px] font-semibold text-[var(--cc-ink)]">
              {greeting}, Neil. Here is today’s organisation overview.
            </p>
            <p className="m-0 mt-1 text-[12px] text-[var(--cc-muted)]">
              {todayLabel} · Layout: {layoutName} · Period: {periodLabel(period, customRange)}
            </p>
            {dataStale ? (
              <p className="cc-text-warn m-0 mt-1 text-[12px] font-bold">Data may be outdated</p>
            ) : null}
          </div>
        </div>

        <div className="cc-view-tabs mt-3" role="tablist" aria-label="Command Centre views">
          {(
            [
              ["command", "Command Centre"],
              ["myday", "My Day"],
              ["kpi", "KPI Scorecard"],
              ["reports", "Reports"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={viewTab === id}
              className={viewTab === id ? "active" : ""}
              onClick={() => switchViewTab(id)}
            >
              {label}
            </button>
          ))}
          <div className="ml-auto flex flex-wrap gap-2">
            <Button small variant={mobileUrgent ? "teal" : "line"} onClick={() => setMobileUrgent((v) => !v)}>
              {mobileUrgent ? "Full desktop view" : "Mobile urgent view"}
            </Button>
            <Button small variant="line" onClick={() => setEodOpen(true)}>
              End-of-Day Summary
            </Button>
          </div>
        </div>
      </header>

      <ControlBar
        locations={locations}
        health={clinicHealth}
        clinicGroups={clinicGroups}
        onSaveClinicGroup={saveClinicGroup}
        selectedClinicIds={selectedClinicIds}
        onChangeClinics={setSelectedClinicIds}
        period={period}
        onPeriod={setPeriod}
        customRange={customRange}
        onCustomRange={setCustomRange}
        onOpenCustomRange={() => setCustomRangeOpen(true)}
        layoutName={layoutName}
        layouts={layouts}
        onSelectLayout={selectLayout}
        onLayout={() => setCustomiseOpen(true)}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        lastUpdated={lastUpdated}
        nextRefresh={nextRefresh}
        paused={paused}
        onRefreshNow={() => refresh(false)}
        onTogglePause={() => setPaused((p) => !p)}
        onPublish={() => setPublishOpen(true)}
        onCreateAction={() => setCreateOpen(true)}
        onCustomise={() => setCustomiseOpen(true)}
        onExport={() => setExportOpen(true)}
        onNotifications={() => {
          setNotificationsOpen(true);
        }}
        unsavedLayout={unsavedLayout}
        appearance={resolvedAppearance}
        onAppearance={setAppearance}
        notificationCounts={notificationCounts}
        onQaSimulateNextDay={simulateNextDay}
        onQaSetCardState={(s) => {
          setQaCardState(s);
          writeQaCardState(s);
          pushToast(s ? `QA card state: ${s}` : "QA card state cleared.", "default");
        }}
        onQaResetActions={() => {
          const seed = resetModule1ActionsToSeed();
          setActions(applyDemoDayFilter(seed, demoDay, period));
          pushToast("Module 1 actions reset to seed.", "warn");
        }}
        onTemplatesRecurring={() => setRecurringOpen(true)}
        onAppearanceReminder={() =>
          pushToast("Use the Appearance selector in the control bar (Light / Dark / Device setting).", "default")
        }
        onSignOut={() =>
          pushToast("Sign out is demonstration-only — no authentication backend connected.", "default")
        }
      />

      <div className="mx-auto grid w-full max-w-[1480px] gap-2.5 px-3 py-2.5 lg:px-5">
        <SearchResultsPanel
          query={searchQuery}
          results={searchResults}
          onNavigate={handleSearchNavigate}
          onClose={() => setSearchQuery("")}
        />

        {viewTab === "myday" ? (
          <MyDayOwnerView
            onOpenAction={setOpenActionId}
            onOpenReports={() => setViewTab("reports")}
            onEndOfDay={() => setEodOpen(true)}
            onViewNotice={() => setAnnouncementsAllOpen(true)}
          />
        ) : null}

        {viewTab === "kpi" ? (
          <KpiScorecardView
            period={period}
            periodCtx={periodCtx}
            overdueCount={priorityCounts.Overdue ?? 0}
            onOpenAction={setOpenActionId}
          />
        ) : null}

        {viewTab === "reports" ? (
          <ReportsView
            onOpenPack={() => setPackOpen(true)}
            onExport={({ format, sensitive, report }) => {
              if (sensitive) {
                passwordGate({ requiresPassword: true } as CommandAction, `Export ${report}`, () => {
                  appendAudit({
                    actionId: `export-${report}`,
                    event: "Sensitive report export",
                    user: "Neil",
                    at: new Date().toISOString(),
                    previousValue: "Not exported",
                    newValue: `${format} prepared`,
                    reason: `Sensitive export of ${report}`,
                    approval: "Neil (demonstration)",
                    evidence: "Evidence placeholder (local demonstration)",
                  });
                  pushToast(`${format} export for “${report}” prepared (local demo).`, "success");
                });
                return;
              }
              pushToast(`${format} export for “${report}” prepared (local demo — no live email).`, "success");
            }}
            onGoCommand={() => switchViewTab("command")}
            onEod={() => setEodOpen(true)}
            onSchedule={(name) => {
              setScheduleEdit(null);
              setScheduleReportName(name);
              setScheduleOpen(true);
            }}
            onEditSchedule={(schedule) => {
              setScheduleEdit(schedule);
              setScheduleReportName(schedule.report);
              setScheduleOpen(true);
            }}
            scheduleListKey={scheduleListKey}
            period={period}
            locations={locations}
            selectedClinicIds={selectedClinicIds}
            pushToast={pushToast}
          />
        ) : null}

        {viewTab === "command" ? (
          <>
            {!mobileUrgent ? (
              <AnnouncementCarousel
                items={normalAnnouncements}
                index={annIndex % Math.max(normalAnnouncements.length, 1)}
                onPrev={() => setAnnIndex((i) => (i - 1 + normalAnnouncements.length) % normalAnnouncements.length)}
                onNext={() => setAnnIndex((i) => (i + 1) % normalAnnouncements.length)}
                onViewAll={() => setAnnouncementsAllOpen(true)}
              />
            ) : null}

            {mobileUrgent ? (
              <div className="grid gap-3">
                <p className="cc-layer-label">Urgent review</p>
                {renderSection("priority")}
                {renderSection("executive")}
                <FilterSentenceBar
                  sentence={filterSentence}
                  onClear={() => {
                    setPriorityFilter(null);
                    setCategoryFilters([]);
                    setStatusFilter(null);
                    setAssigneeFilter(null);
                  }}
                />
                {renderSection("actions")}
              </div>
            ) : (
              <div className="grid items-start gap-3 min-[1100px]:grid-cols-[1.6fr_0.9fr]">
                <div className="grid min-w-0 gap-3">
                  {orderedSectionIds
                    .filter((id) => MAIN_SECTION_IDS.slice(0, 3).includes(id))
                    .map((id) => renderSection(id))}

                  <FilterSentenceBar
                    sentence={filterSentence}
                    onClear={() => {
                      setPriorityFilter(null);
                      setCategoryFilters([]);
                      setStatusFilter(null);
                      setAssigneeFilter(null);
                    }}
                  />

                  <div className="flex flex-wrap gap-2">
                    <select
                      className="cc-ctrl"
                      value={statusFilter ?? ""}
                      onChange={(e) => setStatusFilter(e.target.value || null)}
                      aria-label="Status filter"
                    >
                      <option value="">All statuses</option>
                      {["Assigned", "In Progress", "Awaiting Approval", "Overdue", "Escalated", "Blocked"].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <input
                      className="cc-ctrl"
                      placeholder="Assigned person…"
                      value={assigneeFilter ?? ""}
                      onChange={(e) => setAssigneeFilter(e.target.value || null)}
                      aria-label="Assigned person filter"
                    />
                  </div>

                  {orderedSectionIds
                    .filter((id) => MAIN_SECTION_IDS.slice(3).includes(id))
                    .map((id) => renderSection(id))}
                </div>
                <div className="grid min-w-0 gap-3 min-[1100px]:sticky min-[1100px]:top-[64px]">
                  {orderedSectionIds
                    .filter((id) => SIDE_SECTION_IDS.includes(id))
                    .map((id) => renderSection(id))}
                  <PrivateNotesCard
                    notes={privateNotes}
                    onSave={(n) => setPrivateNotes((prev) => [...prev, n])}
                    onDelete={(nid) => {
                      setPrivateNotes((prev) => prev.filter((n) => n.id !== nid));
                      pushToast("Private note deleted locally.", "success");
                    }}
                    onUpdate={(n) => {
                      setPrivateNotes((prev) => prev.map((x) => (x.id === n.id ? n : x)));
                      pushToast("Reminder saved on private note (local demo).", "success");
                    }}
                  />
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>

      <FullActionFile
        action={openAction}
        locations={locations}
        open={Boolean(openAction)}
        onClose={() => setOpenActionId(null)}
        onUpdate={updateAction}
        onPasswordGate={passwordGate}
      />

      <HealthBreakdownDrawer
        open={Boolean(healthOpenId)}
        profile={healthProfile}
        locations={locations}
        onClose={() => setHealthOpenId(null)}
        onRequestUpdate={() => pushToast("Update requested (demo — requires backend).", "warn")}
        onCreateAction={() => {
          setHealthOpenId(null);
          setCreateOpen(true);
        }}
        onAssignFollowUp={() => pushToast("Follow-up assignment recorded (demo).", "success")}
        onMarkNotRequired={() => pushToast("Marked not required for this clinic (demo).", "success")}
        onAddExecutiveNote={(note) => {
          if (!healthOpenId) return;
          const ev: TimelineEvent = {
            id: `t-${Date.now()}`,
            at: new Date().toISOString(),
            actor: "Neil",
            event: `Executive note: ${note}`,
          };
          setClinicHealth((prev) =>
            prev.map((h) =>
              h.locationId === healthOpenId
                ? { ...h, auditTimeline: [ev, ...(h.auditTimeline ?? [])] }
                : h
            )
          );
          appendAudit({
            actionId: healthOpenId,
            event: "Executive health note",
            user: "Neil",
            at: ev.at,
            reason: note,
          });
          pushToast("Executive note saved to clinic audit timeline.", "success");
        }}
        onOpenRecords={() => pushToast("Contributing records opened (demo).", "default")}
        onOverride={(payload: HealthOverrideRecord) => {
          passwordGate({ requiresPassword: true } as CommandAction, "Clinic-status override", () => {
            const auditEv: TimelineEvent = {
              id: `t-${Date.now()}`,
              at: new Date().toISOString(),
              actor: "Neil",
              event: `Override applied: ${payload.band} until ${payload.expiry}`,
            };
            setClinicHealth((prev) => {
              const next = prev.map((h) =>
                payload.affectedClinicIds.includes(h.locationId)
                  ? {
                      ...h,
                      override: payload,
                      auditTimeline: [auditEv, ...(h.auditTimeline ?? [])],
                    }
                  : h
              );
              writeHealthOverrides(
                next.filter((h) => h.override).map((h) => ({ locationId: h.locationId, override: h.override! }))
              );
              return next;
            });
            appendAudit({
              actionId: healthOpenId ?? payload.affectedClinicIds[0] ?? "health",
              event: "Clinic health override",
              user: "Neil",
              at: payload.recordedAt,
              reason: payload.reason,
              approval: payload.approvingManager,
              newValue: payload.band,
              previousValue: payload.automaticBand,
              evidence: payload.attachmentName || "Evidence placeholder (local demonstration)",
            });
            pushToast("Manager override applied with audit trail (demonstration).", "success");
          });
        }}
        onWithdrawOverride={() => {
          passwordGate({ requiresPassword: true } as CommandAction, "Withdraw override", () => {
            if (!healthOpenId) return;
            const prevBand = clinicHealth.find((h) => h.locationId === healthOpenId)?.override?.band;
            const auditEv: TimelineEvent = {
              id: `t-${Date.now()}`,
              at: new Date().toISOString(),
              actor: "Neil",
              event: "Override withdrawn",
            };
            setClinicHealth((prev) => {
              const next = prev.map((h) =>
                h.locationId === healthOpenId
                  ? { ...h, override: undefined, auditTimeline: [auditEv, ...(h.auditTimeline ?? [])] }
                  : h
              );
              writeHealthOverrides(
                next.filter((h) => h.override).map((h) => ({ locationId: h.locationId, override: h.override! }))
              );
              return next;
            });
            appendAudit({
              actionId: healthOpenId,
              event: "Override withdrawn",
              user: "Neil",
              at: auditEv.at,
              previousValue: prevBand,
              newValue: "Automatic calculated status",
              reason: "Manager withdrew clinic-status override",
              approval: "Neil (demonstration)",
              evidence: "Evidence placeholder (local demonstration)",
            });
            pushToast("Override withdrawn.", "success");
          });
        }}
      />

      <CreateActionModal
        open={createOpen}
        locations={locations}
        onClose={() => setCreateOpen(false)}
        pushToast={pushToast}
        onCreate={(created) => {
          setActions((prev) => {
            const next = [...created, ...prev];
            saveModule1Actions(next);
            return next;
          });
          pushToast(`Created ${created.length} action(s).`, "success");
        }}
      />

      <PublishAnnouncementModal
        open={publishOpen}
        locations={locations}
        onClose={() => setPublishOpen(false)}
        onPreview={(draft) =>
          pushToast(`Preview: ${draft.type} — ${draft.title || "(untitled)"}`, "success")
        }
        pushLocalDraft={(title, message) => {
          try {
            window.sessionStorage.setItem(DRAFT_STORAGE, JSON.stringify({ title, message }));
            formDirtyRef.current = true;
          } catch {
            /* ignore */
          }
          pushToast("Announcement draft saved locally.", "success");
        }}
        onPublish={(a) => {
          setAnnouncements((prev) => [a, ...prev]);
          if (a.type === "Emergency") refresh(true);
          const emailSms = a.channels.filter((c) => c !== "Dashboard");
          pushToast(
            emailSms.length
              ? `Announcement published to Dashboard. ${emailSms.join(" + ")} recorded as chosen channels only — not sent live.`
              : "Announcement published to Dashboard (local demo).",
            "success"
          );
        }}
      />

      <CustomiseDashboardModal
        open={customiseOpen}
        sections={sections}
        layouts={layouts}
        activeLayoutId={activeLayoutId}
        unsaved={unsavedLayout}
        onClose={() => {
          if (unsavedLayout) {
            const leave = window.confirm("You have unsaved layout changes. Leave without saving?");
            if (!leave) return;
          }
          setCustomiseOpen(false);
        }}
        onChange={setSections}
        onSelectLayout={selectLayout}
        onRenameLayout={(id, name) => {
          const next = layouts.map((l) => (l.id === id ? { ...l, name, updatedAt: new Date().toISOString() } : l));
          setLayouts(next);
          writeLayouts(next);
          if (activeLayoutId === id) setLayoutName(name);
        }}
        onDuplicateLayout={(id) => {
          const src = layouts.find((l) => l.id === id);
          if (!src) return;
          const copy: SavedLayout = {
            ...src,
            id: `lay-${Date.now()}`,
            name: `${src.name} (copy)`,
            isDefault: false,
            updatedAt: new Date().toISOString(),
          };
          const next = [copy, ...layouts];
          setLayouts(next);
          writeLayouts(next);
          pushToast(`Duplicated “${src.name}”.`, "success");
        }}
        onDeleteLayout={(id) => {
          if (layouts.length <= 1) {
            pushToast("At least one layout must remain.", "warn");
            return;
          }
          const next = layouts.filter((l) => l.id !== id);
          setLayouts(next);
          writeLayouts(next);
          if (activeLayoutId === id) selectLayout(next[0].id);
        }}
        onSetDefaultLayout={(id) => {
          const next = layouts.map((l) => ({ ...l, isDefault: l.id === id }));
          setLayouts(next);
          writeLayouts(next);
          pushToast("Default layout updated.", "success");
        }}
        onSave={() => {
          persistLayout(layoutName, sections, activeLayoutId ?? undefined);
          pushToast("Layout saved locally.", "success");
          setCustomiseOpen(false);
        }}
        onSaveAsNew={() => {
          const name = window.prompt("New layout name", `Layout ${new Date().toLocaleDateString("en-AU")}`);
          if (!name?.trim()) return;
          const id = `lay-${Date.now()}`;
          persistLayout(name.trim(), sections, id);
          pushToast(`Saved as “${name.trim()}”.`, "success");
          setCustomiseOpen(false);
        }}
        onRestoreSaved={() => {
          setSections(savedSections.map((s) => ({ ...s })));
          pushToast("Restored last saved layout.", "success");
        }}
        onRestoreDefault={() => {
          setSections(DEFAULT_SECTIONS);
          setSavedSections(DEFAULT_SECTIONS);
          setLayoutName("Daily Operations");
          const daily = layouts.find((l) => l.name === "Daily Operations");
          if (daily) {
            setActiveLayoutId(daily.id);
            writeActiveLayoutId(daily.id);
          }
          pushToast("Restored Daily Operations default.", "success");
        }}
      />

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        onSchedule={() => {
          setExportOpen(false);
          setScheduleEdit(null);
          setScheduleOpen(true);
        }}
        onExport={({ format, sensitive, recipients, schedule }) => {
          if (sensitive) {
            passwordGate({ requiresPassword: true } as CommandAction, `Export ${format}`, () => {
              pushToast(
                `${format} export prepared locally${recipients ? ` · recipients noted` : ""}${schedule ? ` · schedule ${schedule} noted` : ""}. Email delivery requires a future backend.`,
                "default"
              );
              setExportOpen(false);
            });
            return;
          }
          pushToast(
            `${format} export prepared locally${recipients ? ` · recipients noted` : ""}${schedule ? ` · schedule ${schedule} noted` : ""}. Live email requires a future backend.`,
            "default"
          );
          setExportOpen(false);
        }}
      />

      <ScheduleReportModal
        open={scheduleOpen}
        onClose={() => {
          setScheduleOpen(false);
          setScheduleEdit(null);
        }}
        reportName={scheduleReportName}
        editSchedule={scheduleEdit}
        locations={locations}
        pushToast={pushToast}
        onSaved={() => setScheduleListKey((k) => k + 1)}
      />

      <RecurringTemplatesModal
        open={recurringOpen}
        onClose={() => setRecurringOpen(false)}
        locations={locations}
        pushToast={pushToast}
      />

      <CustomRangeModal
        open={customRangeOpen}
        onClose={() => setCustomRangeOpen(false)}
        start={customRange?.start ?? ""}
        end={customRange?.end ?? ""}
        onApply={(start, end) => {
          setCustomRange({ start, end });
          setPeriod("Custom Range");
        }}
      />

      <PasswordConfirmModal
        open={passwordOpen}
        title={passwordTitle}
        onClose={() => setPasswordOpen(false)}
        onConfirm={() => {
          passwordActionRef.current?.();
          passwordActionRef.current = null;
          setPasswordOpen(false);
        }}
      />

      <Modal
        open={notificationsOpen}
        title="Notifications"
        onClose={() => setNotificationsOpen(false)}
        footer={
          <Button variant="line" onClick={() => setNotificationsOpen(false)}>
            Close
          </Button>
        }
      >
        <div className="grid gap-2 text-sm">
          <div className="rounded-xl border border-[var(--cc-card-line)] bg-[var(--cc-soft)] p-3">
            <div className="text-[10px] font-extrabold uppercase tracking-wide text-[var(--cc-muted)]">Emergency</div>
            <div className="text-[22px] font-black text-[var(--cc-ink)]">{notificationCounts.emergency}</div>
            <p className="m-0 text-[11px] text-[var(--cc-muted)]">Require immediate Owner acknowledgement</p>
          </div>
          <div className="rounded-xl border border-[var(--cc-card-line)] bg-[var(--cc-soft)] p-3">
            <div className="text-[10px] font-extrabold uppercase tracking-wide text-[var(--cc-muted)]">Unread</div>
            <div className="text-[22px] font-black text-[var(--cc-ink)]">{notificationCounts.unread}</div>
            <p className="m-0 text-[11px] text-[var(--cc-muted)]">Announcements and activity not yet marked read</p>
          </div>
          <div className="rounded-xl border border-[var(--cc-card-line)] bg-[var(--cc-soft)] p-3">
            <div className="text-[10px] font-extrabold uppercase tracking-wide text-[var(--cc-muted)]">Approvals</div>
            <div className="text-[22px] font-black text-[var(--cc-ink)]">{notificationCounts.approvals}</div>
            <p className="m-0 text-[11px] text-[var(--cc-muted)]">Executive decisions waiting</p>
          </div>
        </div>
      </Modal>

      <Modal open={announcementsAllOpen} title="All Announcements" onClose={() => setAnnouncementsAllOpen(false)}>
        <div className="grid gap-3">
          {announcements.map((a) => (
            <div key={a.id} className="rounded-xl border border-[var(--cc-card-line)] p-3">
              <div className="cc-text-info text-[10px] font-extrabold uppercase">{a.type}</div>
              <strong>{a.title}</strong>
              <p className="m-0 mt-1 text-sm">{a.message}</p>
              <p className="m-0 mt-1 text-[11px] text-[var(--cc-muted)]">
                Clinics: {clinicNameFn(a.clinics)} · Read {a.readership.read}/{a.readership.total} · Delivered{" "}
                {a.delivery.delivered}/{a.delivery.total} · Ack {a.acknowledgements.acked}/{a.acknowledgements.total}
              </p>
            </div>
          ))}
        </div>
      </Modal>

      <Modal
        open={eodOpen}
        title="End-of-Day Summary"
        onClose={() => setEodOpen(false)}
        footer={
          <Button variant="teal" onClick={() => setEodOpen(false)}>
            Done
          </Button>
        }
      >
        <ul className="m-0 list-disc pl-5 text-sm leading-relaxed">
          <li>
            Unresolved emergencies: {priorityCounts.Emergency ?? 0} · Urgent: {priorityCounts.Urgent ?? 0}
          </li>
          <li>Overdue executive actions: {executive.filter((e) => e.priority === "Urgent" || e.priority === "Emergency").length}</li>
          <li>
            Completed today: {actions.filter((a) => a.priority === "Completed Today").length} (leave active dashboard
            overnight)
          </li>
          <li>Decisions still required: {executive.length}</li>
          <li>
            Organisation P/L{" "}
            {(financeData.find((f) => f.locationId === "all") ?? financeData[0])?.profitLoss.toLocaleString("en-AU", {
              style: "currency",
              currency: "AUD",
            })}
          </li>
          <li>Unread mandatory announcements: {announcements.filter((a) => a.requireAck && !a.acknowledged).length}</li>
          <li>Active queue excludes completed, closed, dismissed and archived records</li>
          <li>Positive: systems healthy across majority of clinics; Woolloongabba leading health score</li>
          <li>Private reminders: {privateNotes.length}</li>
          <li>Early review tomorrow: Beachmere utilities ETA and Indooroopilly doctor pay variance</li>
        </ul>
      </Modal>
      <Modal
        open={packOpen}
        title="Monthly Management Pack — June 2026"
        onClose={() => setPackOpen(false)}
        footer={
          <>
            <Button variant="line" onClick={() => setPackOpen(false)}>
              Close
            </Button>
            <Button
              variant="teal"
              onClick={() => {
                pushToast("Monthly Management Pack PDF prepared locally.", "success");
                setPackOpen(false);
              }}
            >
              Export PDF
            </Button>
          </>
        }
      >
        <div className="grid gap-2 text-sm leading-relaxed">
          <p>
            <strong>Organisation health:</strong> 84% average (normalised). Highest Woolloongabba 94%. Lowest Beachmere
            61% with separate emergency status.
          </p>
          <p>
            <strong>Finance:</strong> Income {formatMoneyExact(1682450.2)} · Expenses {formatMoneyExact(1248800.1)} ·
            P/L {formatMoneyExact(433650.1)}
          </p>
          <p>
            <strong>Staffing fill:</strong> 93% month average · Overtime cost {formatMoneyExact(18440)}
          </p>
          <p>
            <strong>Compliance:</strong> 95% · 1 serious expiry managed with temporary continued use controls
          </p>
          <p>
            <strong>Incidents:</strong> 2 serious records · 1 RCA overdue carried into July
          </p>
          <p>
            <strong>Digital:</strong> 99.1% availability excluding Beachmere outage day
          </p>
          <p>
            <strong>Completed work retained for period comparison:</strong> 186 closed/completed actions (excluded from
            active queues)
          </p>
          <p>
            <strong>AI briefing themes:</strong> Stabilise Beachmere restoration plan; clear Indooroopilly staffing and
            pay variance; sustain Forest Lake / Woolloongabba performance.
          </p>
          <p className="text-[11px] text-[var(--cc-muted)]">
            Scheduled email delivery of this pack requires a future reporting backend.
          </p>
        </div>
      </Modal>
    </div>
  );
}
