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
import { registerTrainingContributionProvider } from "@/platform/workforce/services/training-contribution-registry";
import { mapDemoIdentityPermissions, type M11Actor } from "./permissions";
import {
  ensureM11Bootstrapped,
  getM11BootstrapReport,
  subscribeM11Bootstrap,
} from "./storage";
import { getTrainingCounts } from "./adapters/m11-executive";
import { buildContributions } from "./services/readiness-bridge";
import { runM11CatalogueSeed, runM11PolicySeed } from "./storage/seed-safe";
import type { M11SectionId, MigrationReport } from "./types/domain";
import { M11_SECTION_ALIASES } from "./types/domain";

interface TrainingContextValue {
  section: M11SectionId;
  setSection: (section: M11SectionId) => void;
  actor: M11Actor;
  actorName: string;
  refreshKey: number;
  bump: () => void;
  pushToast: (message: string, tone?: ToastTone) => void;
  migrationReport: MigrationReport | null;
  counts: ReturnType<typeof getTrainingCounts>;
}

const TrainingContext = createContext<TrainingContextValue | null>(null);

export function resolveM11Section(raw: string | null | undefined): M11SectionId {
  if (!raw) return "overview";
  if (raw in M11_SECTION_ALIASES) return M11_SECTION_ALIASES[raw];
  const valid: M11SectionId[] = [
    "overview",
    "catalogue",
    "assignments",
    "sessions",
    "assessments",
    "competencies",
    "certificates",
    "exemptions",
    "evidence",
    "reports",
    "settings",
  ];
  return (valid.includes(raw as M11SectionId) ? raw : "overview") as M11SectionId;
}

export function TrainingProvider({ children }: { children: ReactNode }) {
  const { pushToast: portalToast } = usePortal();
  const { identity } = useIdentity();
  const [section, setSection] = useState<M11SectionId>("overview");
  const [refreshKey, setRefreshKey] = useState(0);

  const migrationReport = useSyncExternalStore(
    subscribeM11Bootstrap,
    getM11BootstrapReport,
    () => null
  );

  const bump = useCallback(() => setRefreshKey((k) => k + 1), []);

  const actor: M11Actor = useMemo(
    () => ({
      userId: identity.userId,
      permissions: mapDemoIdentityPermissions(identity),
      clinicIds:
        identity.accessibleClinicIds === "all" ? undefined : identity.accessibleClinicIds,
    }),
    [identity]
  );

  useEffect(() => {
    ensureM11Bootstrapped();
    runM11CatalogueSeed();
    runM11PolicySeed();
  }, []);

  useEffect(() => {
    registerTrainingContributionProvider((personId, asOf) =>
      buildContributions(personId, asOf)
    );
    return () => {
      registerTrainingContributionProvider(null);
    };
  }, []);

  const pushToast = useCallback(
    (message: string, tone: ToastTone = "default") => {
      portalToast(message, tone);
    },
    [portalToast]
  );

  const counts = useMemo(() => {
    void refreshKey;
    ensureM11Bootstrapped();
    return getTrainingCounts();
  }, [refreshKey]);

  const value: TrainingContextValue = {
    section,
    setSection,
    actor,
    actorName: identity.displayName,
    refreshKey,
    bump,
    pushToast,
    migrationReport,
    counts,
  };

  return <TrainingContext.Provider value={value}>{children}</TrainingContext.Provider>;
}

export function useTraining() {
  const ctx = useContext(TrainingContext);
  if (!ctx) throw new Error("useTraining must be used within TrainingProvider");
  return ctx;
}
