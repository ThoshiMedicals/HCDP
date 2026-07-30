"use client";

/**
 * Global demonstration identity — Act as User / Role.
 * Coordinates shell, Action Inbox, and Organisation demo actors without removing module permission logic.
 *
 * DEMO ONLY: This is not production authentication. When AUTH_ENFORCEMENT=production,
 * Act-as is blocked so it cannot become a security bypass. Real sessions use platform/auth.
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { M2_STORAGE, writeJson } from "@/lib/action-inbox/storage";
import type { DemoRole } from "@/lib/action-inbox/types";
import { PLATFORM_KEYS, readJsonSafe, runMigrationOnce, writeJsonSafe } from "@/platform/storage";
import { assertDemoActAsAllowed, DEMO_ACT_AS_NOTICE } from "@/platform/auth/demo/demo-isolation";

export { DEMO_ACT_AS_NOTICE };

export type DemoIdentityRole =
  | "Director"
  | "Senior Administrator"
  | "Clinic Manager"
  | "Practice Manager"
  | "Finance Manager"
  | "HR Manager"
  | "Compliance Manager"
  | "Staff Member"
  | "Read-Only Auditor"
  | "SaaS Vendor Administrator";

export interface DemoIdentity {
  userId: string;
  displayName: string;
  role: DemoIdentityRole;
  organisation: string;
  accessibleClinicIds: string[] | "all";
  permissions: string[];
  sensitivityClearance: "full" | "restricted";
  managerControls: boolean;
  executiveControls: boolean;
  enterpriseExtensionsVisible: boolean;
  /** Dual-approval demonstration pairing */
  dualApprovalPartnerId?: string;
  orgActorId?: string;
}

export interface IdentityState {
  version: number;
  activeUserId: string;
  updatedAt: string;
}

const VERSION = 1;
const EVENT = "pulse.platform.identity-change";
const LEGACY_ROLE = "pulse.v27.executiveRole";

/** Dual-approval demo users preserved from Module 3. */
export const DEMO_IDENTITIES: DemoIdentity[] = [
  {
    userId: "usr_david",
    displayName: "David King",
    role: "Director",
    organisation: "Healthcare Doctors Group",
    accessibleClinicIds: "all",
    permissions: ["*"],
    sensitivityClearance: "full",
    managerControls: true,
    executiveControls: true,
    enterpriseExtensionsVisible: true,
    dualApprovalPartnerId: "usr_sarah",
    orgActorId: "usr_david",
  },
  {
    userId: "usr_sarah",
    displayName: "Sarah Mitchell",
    role: "Senior Administrator",
    organisation: "Healthcare Doctors Group",
    accessibleClinicIds: "all",
    permissions: ["*"],
    sensitivityClearance: "full",
    managerControls: true,
    executiveControls: true,
    enterpriseExtensionsVisible: true,
    dualApprovalPartnerId: "usr_david",
    orgActorId: "usr_sarah",
  },
  {
    userId: "usr_james",
    displayName: "James Okafor",
    role: "Clinic Manager",
    organisation: "Healthcare Doctors Group",
    accessibleClinicIds: ["loc_baldhills", "loc_eightmile"],
    permissions: ["view", "create", "edit", "approve", "assign"],
    sensitivityClearance: "full",
    managerControls: true,
    executiveControls: false,
    enterpriseExtensionsVisible: false,
    orgActorId: "usr_james",
  },
  {
    userId: "usr_elena",
    displayName: "Elena Brooks",
    role: "Practice Manager",
    organisation: "Healthcare Doctors Group",
    accessibleClinicIds: ["loc_cannonhill", "loc_woolloongabba"],
    permissions: ["view", "create", "edit", "approve", "assign"],
    sensitivityClearance: "full",
    managerControls: true,
    executiveControls: false,
    enterpriseExtensionsVisible: false,
    orgActorId: "usr_elena",
  },
  {
    userId: "usr_owen",
    displayName: "Owen Fraser",
    role: "Finance Manager",
    organisation: "Healthcare Doctors Group",
    accessibleClinicIds: "all",
    permissions: ["view", "create", "edit", "export", "approve"],
    sensitivityClearance: "full",
    managerControls: true,
    executiveControls: false,
    enterpriseExtensionsVisible: true,
    orgActorId: "usr_owen",
  },
  {
    userId: "usr_amelia",
    displayName: "Amelia Grant",
    role: "HR Manager",
    organisation: "Healthcare Doctors Group",
    accessibleClinicIds: "all",
    permissions: ["view", "create", "edit", "assign", "viewSensitive"],
    sensitivityClearance: "full",
    managerControls: true,
    executiveControls: false,
    enterpriseExtensionsVisible: true,
    orgActorId: "usr_amelia",
  },
  {
    userId: "demo_compliance",
    displayName: "Priya Nair",
    role: "Compliance Manager",
    organisation: "Healthcare Doctors Group",
    accessibleClinicIds: "all",
    permissions: ["view", "create", "edit", "approve", "export", "viewSensitive"],
    sensitivityClearance: "full",
    managerControls: true,
    executiveControls: false,
    enterpriseExtensionsVisible: false,
  },
  {
    userId: "usr_lucy",
    displayName: "Lucy Wright",
    role: "Staff Member",
    organisation: "Healthcare Doctors Group",
    accessibleClinicIds: ["loc_eightmile"],
    permissions: ["view", "create"],
    sensitivityClearance: "restricted",
    managerControls: false,
    executiveControls: false,
    enterpriseExtensionsVisible: false,
    orgActorId: "usr_lucy",
  },
  {
    userId: "demo_auditor",
    displayName: "Read-Only Auditor",
    role: "Read-Only Auditor",
    organisation: "Healthcare Doctors Group",
    accessibleClinicIds: "all",
    permissions: ["view", "export"],
    sensitivityClearance: "restricted",
    managerControls: false,
    executiveControls: false,
    enterpriseExtensionsVisible: false,
  },
  {
    userId: "demo_vendor",
    displayName: "Vendor Admin",
    role: "SaaS Vendor Administrator",
    organisation: "Doctors Pulse SaaS",
    accessibleClinicIds: "all",
    permissions: ["*"],
    sensitivityClearance: "full",
    managerControls: true,
    executiveControls: true,
    enterpriseExtensionsVisible: true,
  },
];

const BY_ID = Object.fromEntries(DEMO_IDENTITIES.map((u) => [u.userId, u]));

function defaultIdentity(): DemoIdentity {
  return DEMO_IDENTITIES[1]; // Sarah — Senior Administrator (primary dual approver)
}

/** Stable referential snapshot for useSyncExternalStore SSR/hydration. */
const IDENTITY_SERVER_SNAPSHOT: DemoIdentity = DEMO_IDENTITIES[1];

function mapLegacyExecRole(saved: string | null): string | null {
  if (!saved) return null;
  const map: Record<string, string> = {
    "Owner / Director": "usr_david",
    "Practice Manager": "usr_elena",
    Reception: "usr_lucy",
    Nurse: "usr_lucy",
    Finance: "usr_owen",
    Doctor: "usr_lucy",
    "IT / Facilities": "demo_vendor",
  };
  return map[saved] ?? null;
}

function writeLegacyCompat(identity: DemoIdentity) {
  try {
    const execMap: Record<DemoIdentityRole, string> = {
      Director: "Owner / Director",
      "Senior Administrator": "Owner / Director",
      "Clinic Manager": "Practice Manager",
      "Practice Manager": "Practice Manager",
      "Finance Manager": "Finance",
      "HR Manager": "Practice Manager",
      "Compliance Manager": "Practice Manager",
      "Staff Member": "Reception",
      "Read-Only Auditor": "Reception",
      "SaaS Vendor Administrator": "IT / Facilities",
    };
    window.localStorage.setItem(LEGACY_ROLE, execMap[identity.role] ?? "Owner / Director");

    const demoRole: DemoRole = identity.managerControls ? "manager" : "staff";
    writeJson(M2_STORAGE.role, demoRole);
    writeJson(M2_STORAGE.sensitivity, identity.sensitivityClearance === "full");
  } catch {
    /* ignore */
  }
}

let memoryUserId = defaultIdentity().userId;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT, { detail: getActiveIdentity() }));
  }
}

function persist(userId: string) {
  memoryUserId = userId;
  const identity = BY_ID[userId] ?? defaultIdentity();
  writeJsonSafe(PLATFORM_KEYS.identity, {
    version: VERSION,
    activeUserId: identity.userId,
    updatedAt: new Date().toISOString(),
  } satisfies IdentityState);
  writeLegacyCompat(identity);
  hydrated = true;
  emit();
}

export function getActiveIdentity(): DemoIdentity {
  return BY_ID[memoryUserId] ?? defaultIdentity();
}

export function setActiveIdentity(userId: string) {
  assertDemoActAsAllowed();
  if (!BY_ID[userId]) return;
  persist(userId);
}

export function hydrateIdentityContext() {
  if (typeof window === "undefined") return getActiveIdentity();
  runMigrationOnce("identity-context", 1, () => {
    const existing = readJsonSafe<IdentityState | null>(PLATFORM_KEYS.identity, null);
    if (existing?.activeUserId && BY_ID[existing.activeUserId]) {
      memoryUserId = existing.activeUserId;
      return;
    }
    let mapped: string | null = null;
    try {
      mapped = mapLegacyExecRole(window.localStorage.getItem(LEGACY_ROLE));
    } catch {
      mapped = null;
    }
    memoryUserId = mapped && BY_ID[mapped] ? mapped : defaultIdentity().userId;
    writeJsonSafe(PLATFORM_KEYS.identity, {
      version: VERSION,
      activeUserId: memoryUserId,
      updatedAt: new Date().toISOString(),
    });
  });
  const stored = readJsonSafe<IdentityState | null>(PLATFORM_KEYS.identity, null);
  if (stored?.activeUserId && BY_ID[stored.activeUserId]) {
    memoryUserId = stored.activeUserId;
  }
  writeLegacyCompat(getActiveIdentity());
  hydrated = true;
  emit();
  return getActiveIdentity();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (typeof window !== "undefined") {
    const onEvt = () => listener();
    window.addEventListener(EVENT, onEvt);
    window.addEventListener("storage", onEvt);
    return () => {
      listeners.delete(listener);
      window.removeEventListener(EVENT, onEvt);
      window.removeEventListener("storage", onEvt);
    };
  }
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): DemoIdentity {
  if (!hydrated) return IDENTITY_SERVER_SNAPSHOT;
  return getActiveIdentity();
}

function getServerSnapshot(): DemoIdentity {
  return IDENTITY_SERVER_SNAPSHOT;
}

export function identityToInboxDemoRole(identity: DemoIdentity): DemoRole {
  return identity.managerControls ? "manager" : "staff";
}

export function identityCanSeeSensitive(identity: DemoIdentity): boolean {
  return identity.sensitivityClearance === "full";
}

interface IdentityContextValue {
  identity: DemoIdentity;
  identities: DemoIdentity[];
  setActiveIdentity: (userId: string) => void;
  inboxDemoRole: DemoRole;
  canSeeSensitive: boolean;
}

const IdentityCtx = createContext<IdentityContextValue | null>(null);

export function IdentityProvider({ children }: { children: ReactNode }) {
  const identity = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    hydrateIdentityContext();
  }, []);

  const value = useMemo<IdentityContextValue>(
    () => ({
      identity,
      identities: DEMO_IDENTITIES,
      setActiveIdentity,
      inboxDemoRole: identityToInboxDemoRole(identity),
      canSeeSensitive: identityCanSeeSensitive(identity),
    }),
    [identity]
  );

  return <IdentityCtx.Provider value={value}>{children}</IdentityCtx.Provider>;
}

export function useIdentity(): IdentityContextValue {
  const ctx = useContext(IdentityCtx);
  if (!ctx) {
    const identity = defaultIdentity();
    return {
      identity,
      identities: DEMO_IDENTITIES,
      setActiveIdentity,
      inboxDemoRole: identityToInboxDemoRole(identity),
      canSeeSensitive: identityCanSeeSensitive(identity),
    };
  }
  return ctx;
}

export function useActiveIdentity(): DemoIdentity {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
