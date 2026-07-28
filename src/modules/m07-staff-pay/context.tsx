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
import { useIdentity } from "@/platform/context/identity-context";
import { mapDemoIdentityPermissions, type M07Actor } from "./permissions";
import {
  ensureM07Bootstrapped,
  getM07BootstrapReport,
  subscribeM07Bootstrap,
} from "./storage";
import type { MigrationReport } from "./types/domain";
import {
  M07_SECTION_META,
  resolveM07Section,
  type M07SectionId,
} from "./section-meta";

export type { M07SectionId };
export { M07_SECTION_META, resolveM07Section };

interface StaffPayContextValue {
  section: M07SectionId;
  setSection: (section: M07SectionId) => void;
  actor: M07Actor;
  legalEntityId: string;
  setLegalEntityId: (id: string) => void;
  bootstrap: MigrationReport | null;
  refresh: () => void;
  tick: number;
}

const StaffPayContext = createContext<StaffPayContextValue | null>(null);

export function StaffPayProvider({
  children,
  initialSection = "overview",
}: {
  children: ReactNode;
  initialSection?: M07SectionId;
}) {
  const { identity } = useIdentity();
  const [section, setSection] = useState<M07SectionId>(initialSection);
  const [legalEntityId, setLegalEntityId] = useState("org_demo_a");
  const [tick, setTick] = useState(0);
  const [bootstrap, setBootstrap] = useState<MigrationReport | null>(null);

  useEffect(() => {
    ensureM07Bootstrapped();
    setBootstrap(getM07BootstrapReport());
    return subscribeM07Bootstrap(() => setBootstrap(getM07BootstrapReport()));
  }, []);

  const actor: M07Actor = useMemo(() => {
    const clinicIds =
      identity.accessibleClinicIds === "all" ? undefined : identity.accessibleClinicIds;
    return {
      userId: identity.userId,
      personId: identity.userId,
      permissions: mapDemoIdentityPermissions(identity),
      legalEntityIds: identity.permissions.includes("*") ? undefined : [legalEntityId],
      clinicIds,
    };
  }, [identity, legalEntityId]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  const value: StaffPayContextValue = {
    section,
    setSection,
    actor,
    legalEntityId,
    setLegalEntityId,
    bootstrap,
    refresh,
    tick,
  };

  return <StaffPayContext.Provider value={value}>{children}</StaffPayContext.Provider>;
}

export function useStaffPay(): StaffPayContextValue {
  const ctx = useContext(StaffPayContext);
  if (!ctx) throw new Error("useStaffPay requires StaffPayProvider");
  return ctx;
}
