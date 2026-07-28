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
import { mapDemoIdentityPermissions, type M06Actor } from "./permissions";
import {
  ensureM06Bootstrapped,
  getM06BootstrapReport,
  subscribeM06Bootstrap,
} from "./storage";
import type { MigrationReport } from "./types/domain";

export type M06SectionId =
  | "live"
  | "clock"
  | "timesheets"
  | "exceptions"
  | "corrections"
  | "approvals"
  | "breaks"
  | "history"
  | "reports"
  | "settings";

export const M06_SECTION_ALIASES: Record<string, M06SectionId> = {
  attendance: "live",
  "clock-events": "clock",
  "offline-reconciliation": "clock",
  timeclock: "clock",
  "sync-centre": "clock",
};

const VALID: M06SectionId[] = [
  "live",
  "clock",
  "timesheets",
  "exceptions",
  "corrections",
  "approvals",
  "breaks",
  "history",
  "reports",
  "settings",
];

const EVIDENCE_FORCE_RESTRICTED_KEY = "pulse.m06.evidence.forceRestricted";

function readForceRestricted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(EVIDENCE_FORCE_RESTRICTED_KEY) === "1";
  } catch {
    return false;
  }
}

function subscribeForceRestricted(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e: StorageEvent) => {
    if (!e.key || e.key === EVIDENCE_FORCE_RESTRICTED_KEY) cb();
  };
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}

interface AttendanceContextValue {
  section: M06SectionId;
  setSection: (section: M06SectionId) => void;
  actor: M06Actor;
  actorName: string;
  refreshKey: number;
  bump: () => void;
  pushToast: (message: string, tone?: ToastTone) => void;
  migrationReport: MigrationReport | null;
  clinicId: string;
}

const AttendanceContext = createContext<AttendanceContextValue | null>(null);

export function resolveM06Section(raw: string | null | undefined): M06SectionId {
  if (!raw) return "live";
  if (raw in M06_SECTION_ALIASES) return M06_SECTION_ALIASES[raw]!;
  return VALID.includes(raw as M06SectionId) ? (raw as M06SectionId) : "live";
}

export function AttendanceProvider({ children }: { children: ReactNode }) {
  const { pushToast: portalToast } = usePortal();
  const { identity } = useIdentity();
  const [section, setSection] = useState<M06SectionId>("live");
  const [refreshKey, setRefreshKey] = useState(0);

  const migrationReport = useSyncExternalStore(
    subscribeM06Bootstrap,
    getM06BootstrapReport,
    () => null
  );

  const forceRestricted = useSyncExternalStore(
    subscribeForceRestricted,
    readForceRestricted,
    () => false
  );

  const bump = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    ensureM06Bootstrapped();
  }, []);

  const actor = useMemo<M06Actor>(() => {
    const clinicIds =
      identity.accessibleClinicIds === "all" ? undefined : identity.accessibleClinicIds;
    if (forceRestricted) {
      return { userId: identity.userId, personId: identity.userId, permissions: [], clinicIds };
    }
    return {
      userId: identity.userId,
      personId: identity.userId,
      permissions: mapDemoIdentityPermissions(identity),
      clinicIds,
    };
  }, [identity, forceRestricted]);

  const clinicId =
    (identity.accessibleClinicIds === "all"
      ? "loc_baldhills"
      : identity.accessibleClinicIds[0]) ?? "loc_baldhills";

  const pushToast = useCallback(
    (message: string, tone: ToastTone = "default") => {
      portalToast(message, tone);
    },
    [portalToast]
  );

  const value: AttendanceContextValue = {
    section,
    setSection,
    actor,
    actorName: identity.displayName,
    refreshKey,
    bump,
    pushToast,
    migrationReport,
    clinicId,
  };

  return <AttendanceContext.Provider value={value}>{children}</AttendanceContext.Provider>;
}

export function useAttendance(): AttendanceContextValue {
  const ctx = useContext(AttendanceContext);
  if (!ctx) throw new Error("useAttendance requires AttendanceProvider");
  return ctx;
}
