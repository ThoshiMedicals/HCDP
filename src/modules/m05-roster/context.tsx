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
import { mapDemoIdentityPermissions, type M05Actor } from "./permissions";
import {
  ensureM05Bootstrapped,
  getM05BootstrapReport,
  subscribeM05Bootstrap,
} from "./storage";
import { runM05PortalSeed, runM05PolicySeed } from "./storage/seed-safe";
import type { M05SectionId, MigrationReport } from "./types/domain";
import { M05_SECTION_ALIASES } from "./types/domain";

interface RosterContextValue {
  section: M05SectionId;
  setSection: (section: M05SectionId) => void;
  actor: M05Actor;
  actorName: string;
  refreshKey: number;
  bump: () => void;
  pushToast: (message: string, tone?: ToastTone) => void;
  migrationReport: MigrationReport | null;
}

const RosterContext = createContext<RosterContextValue | null>(null);

const VALID_M05_SECTIONS: M05SectionId[] = [
  "roster-board",
  "coverage",
  "open-shifts",
  "availability-leave",
  "requests",
  "conflicts-warnings",
  "published-history",
  "cost-forecast",
  "reports",
  "settings",
];

export function resolveM05Section(raw: string | null | undefined): M05SectionId {
  if (!raw) return "roster-board";
  if (raw in M05_SECTION_ALIASES) return M05_SECTION_ALIASES[raw]!;
  return (VALID_M05_SECTIONS.includes(raw as M05SectionId)
    ? (raw as M05SectionId)
    : "roster-board");
}

export function RosterProvider({ children }: { children: ReactNode }) {
  const { pushToast: portalToast } = usePortal();
  const { identity } = useIdentity();
  const [section, setSection] = useState<M05SectionId>("roster-board");
  const [refreshKey, setRefreshKey] = useState(0);

  const migrationReport = useSyncExternalStore(
    subscribeM05Bootstrap,
    getM05BootstrapReport,
    () => null
  );

  const bump = useCallback(() => setRefreshKey((k) => k + 1), []);

  const actor: M05Actor = useMemo(
    () => ({
      userId: identity.userId,
      permissions: mapDemoIdentityPermissions(identity),
      clinicIds:
        identity.accessibleClinicIds === "all" ? undefined : identity.accessibleClinicIds,
    }),
    [identity]
  );

  useEffect(() => {
    ensureM05Bootstrapped();
    runM05PortalSeed();
    runM05PolicySeed();
  }, []);

  const pushToast = useCallback(
    (message: string, tone: ToastTone = "default") => {
      portalToast(message, tone);
    },
    [portalToast]
  );

  const value: RosterContextValue = {
    section,
    setSection,
    actor,
    actorName: identity.displayName,
    refreshKey,
    bump,
    pushToast,
    migrationReport,
  };

  return <RosterContext.Provider value={value}>{children}</RosterContext.Provider>;
}

export function useRoster() {
  const ctx = useContext(RosterContext);
  if (!ctx) throw new Error("useRoster must be used within RosterProvider");
  return ctx;
}
