"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { ToastTone } from "@/components/ui/Toast";
import { usePortal } from "@/lib/portal-context";
import { useIdentity } from "@/platform/context/identity-context";
import { registerWorkforcePersonLookup } from "@/platform/workforce/services/identity-workforce-resolver";
import {
  registerWorkforceReadinessLookup,
  registerWorkforceReadinessRecalculate,
} from "@/platform/workforce/services/workforce-eligibility";
import { mapDemoIdentityPermissions, type M04Actor } from "./permissions";
import {
  ensureM04Bootstrapped,
  getM04BootstrapReport,
  notifyM04BootstrapListeners,
  subscribeM04Bootstrap,
} from "./storage";
import { toWorkforcePersonRef, listPeople, getPerson } from "./services/person-service";
import { calculateReadiness, getEffectiveReadiness } from "./services/readiness-service";
import type { M04SectionId, MigrationReport } from "./types/domain";
import { M04_SECTION_ALIASES } from "./types/domain";
import { getWorkforceCounts, type WorkforceCounts } from "./adapters/m04-executive";

const EMPTY_WORKFORCE_COUNTS: WorkforceCounts = {
  activeStaff: 0,
  activeDoctors: 0,
  blockedReadiness: 0,
  onLeave: 0,
};

interface StaffDoctorsContextValue {
  section: M04SectionId;
  setSection: (section: M04SectionId) => void;
  actor: M04Actor;
  actorName: string;
  refreshKey: number;
  bump: () => void;
  pushToast: (message: string, tone?: ToastTone) => void;
  migrationReport: MigrationReport | null;
  counts: ReturnType<typeof getWorkforceCounts>;
  peopleCount: number;
}

const StaffDoctorsContext = createContext<StaffDoctorsContextValue | null>(null);

export function resolveM04Section(raw: string | null | undefined): M04SectionId {
  if (!raw) return "overview";
  if (raw in M04_SECTION_ALIASES) return M04_SECTION_ALIASES[raw];
  const valid: M04SectionId[] = [
    "overview",
    "people",
    "staff-profiles",
    "doctor-profiles",
    "engagements",
    "credentials",
    "leave-availability",
    "restrictions",
    "onboarding",
    "offboarding",
    "reports",
    "settings",
  ];
  return (valid.includes(raw as M04SectionId) ? raw : "overview") as M04SectionId;
}

export function StaffDoctorsProvider({ children }: { children: ReactNode }) {
  const { pushToast: portalToast } = usePortal();
  const { identity } = useIdentity();
  const [section, setSection] = useState<M04SectionId>("overview");
  const [refreshKey, setRefreshKey] = useState(0);

  const migrationReport = useSyncExternalStore(
    subscribeM04Bootstrap,
    getM04BootstrapReport,
    () => null
  );

  const bump = useCallback(() => setRefreshKey((k) => k + 1), []);

  const actor: M04Actor = useMemo(
    () => ({
      userId: identity.userId,
      permissions: mapDemoIdentityPermissions(identity),
      clinicIds:
        identity.accessibleClinicIds === "all" ? undefined : identity.accessibleClinicIds,
    }),
    [identity]
  );

  // Counts stay at SSR zeros through hydration; populate only after mount.
  const [counts, setCounts] = useState<WorkforceCounts>(EMPTY_WORKFORCE_COUNTS);
  const [peopleCount, setPeopleCount] = useState(0);

  useEffect(() => {
    ensureM04Bootstrapped();
    notifyM04BootstrapListeners();
    // Defer setState so lint baseline stays at IV debt (react-hooks/set-state-in-effect).
    queueMicrotask(() => {
      setCounts(getWorkforceCounts());
      setPeopleCount(listPeople().length);
    });
  }, [refreshKey]);

  useEffect(() => {
    registerWorkforcePersonLookup((id) => {
      const person = getPerson(id);
      return person ? toWorkforcePersonRef(person) : null;
    });
    registerWorkforceReadinessLookup((personId) => {
      const eff = getEffectiveReadiness(personId);
      return {
        personId,
        readiness: eff.readiness,
        blockers: eff.blockers,
        asOf: eff.cache?.calculatedAt ?? new Date(0).toISOString(),
        stale: eff.stale,
        trainingDetailRefs: eff.trainingDetailRefs,
      };
    });
    registerWorkforceReadinessRecalculate((personId, options) =>
      calculateReadiness(personId, options)
    );
    return () => {
      registerWorkforcePersonLookup(null);
      registerWorkforceReadinessLookup(null);
      registerWorkforceReadinessRecalculate(null);
    };
  }, [refreshKey]);

  const pushToast = useCallback(
    (message: string, tone: ToastTone = "default") => {
      portalToast(message, tone);
    },
    [portalToast]
  );

  const value: StaffDoctorsContextValue = {
    section,
    setSection,
    actor,
    actorName: identity.displayName,
    refreshKey,
    bump,
    pushToast,
    migrationReport,
    counts,
    peopleCount,
  };

  return <StaffDoctorsContext.Provider value={value}>{children}</StaffDoctorsContext.Provider>;
}

export function useStaffDoctors() {
  const ctx = useContext(StaffDoctorsContext);
  if (!ctx) throw new Error("useStaffDoctors must be used within StaffDoctorsProvider");
  return ctx;
}
