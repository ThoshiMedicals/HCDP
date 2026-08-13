"use client";

/**
 * Explicit QA / demo mode gate (OWN-P1-008).
 *
 * Default OFF for ordinary portal use. This is a demonstration facility only —
 * not a production security boundary and not equivalent to authentication.
 *
 * Activation (local QA):
 * - Sidebar toggle when demo Act-as is available (AUTH_ENFORCEMENT≠production)
 * - URL search `?qaDemo=1` (sets storage; `?qaDemo=0` clears)
 * - localStorage key pulse.platform.qaDemoMode = {"enabled":true}
 *
 * Forced OFF when AUTH_ENFORCEMENT=production.
 *
 * Client enablement is read via useSyncExternalStore. SSR / first paint always
 * reports ordinary mode (off) through getServerSnapshot.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { isDemoIdentityMode } from "@/platform/auth/demo/demo-isolation";
import { PLATFORM_KEYS, readJsonSafe, writeJsonSafe } from "@/platform/storage";

const EVENT = "pulse.platform.qa-demo-mode-change";

export const QA_DEMO_MODE_NOTICE =
  "QA / Demo mode — demonstration and testing tools only. Not production authentication or a security boundary.";

type QaDemoState = { enabled: boolean };

function readStored(): boolean {
  if (!isDemoIdentityMode()) return false;
  return readJsonSafe<QaDemoState>(PLATFORM_KEYS.qaDemoMode, { enabled: false }).enabled === true;
}

function writeStored(enabled: boolean) {
  writeJsonSafe(PLATFORM_KEYS.qaDemoMode, { enabled: enabled && isDemoIdentityMode() });
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENT));
  }
}

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => onStoreChange();
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

/** Pure read for non-React callers / tests. */
export function isQaDemoModeEnabled(): boolean {
  return readStored();
}

export function setQaDemoModeEnabled(enabled: boolean) {
  if (!isDemoIdentityMode()) {
    writeStored(false);
    return;
  }
  writeStored(enabled);
}

type QaDemoContextValue = {
  qaDemoMode: boolean;
  setQaDemoMode: (enabled: boolean) => void;
  canUseQaDemoMode: boolean;
  notice: string;
};

const QaDemoContext = createContext<QaDemoContextValue | null>(null);

export function QaDemoModeProvider({ children }: { children: ReactNode }) {
  const canUseQaDemoMode = isDemoIdentityMode();
  const storedEnabled = useSyncExternalStore(subscribe, readStored, () => false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!canUseQaDemoMode) {
      if (readStored()) writeStored(false);
      return;
    }
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("qaDemo") === "1") {
        writeStored(true);
      } else if (params.get("qaDemo") === "0") {
        writeStored(false);
      }
    } catch {
      /* ignore */
    }
  }, [canUseQaDemoMode]);

  const setQaDemoMode = useCallback(
    (enabled: boolean) => {
      if (!canUseQaDemoMode) {
        writeStored(false);
        return;
      }
      writeStored(enabled);
    },
    [canUseQaDemoMode]
  );

  const value = useMemo(
    () => ({
      qaDemoMode: canUseQaDemoMode && storedEnabled,
      setQaDemoMode,
      canUseQaDemoMode,
      notice: QA_DEMO_MODE_NOTICE,
    }),
    [canUseQaDemoMode, storedEnabled, setQaDemoMode]
  );

  return <QaDemoContext.Provider value={value}>{children}</QaDemoContext.Provider>;
}

export function useQaDemoMode(): QaDemoContextValue {
  const ctx = useContext(QaDemoContext);
  if (!ctx) {
    return {
      qaDemoMode: false,
      setQaDemoMode: () => {},
      canUseQaDemoMode: false,
      notice: QA_DEMO_MODE_NOTICE,
    };
  }
  return ctx;
}
