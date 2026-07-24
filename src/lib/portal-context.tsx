"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import {
  ACTION_ITEMS,
  HTML_ACCREDITATION,
  HTML_CHECKLISTS,
  HTML_DOCTORS,
  HTML_STAFF,
  LOCATIONS,
  TASKS,
} from "@/lib/mock/data";
import type { ActionItem, Location, TaskItem } from "@/lib/types";
import { ALL_LOCATIONS_ID } from "@/lib/types";
import type { ToastItem, ToastTone } from "@/components/ui/Toast";
import { readSidebarCollapsed, writeSidebarCollapsed } from "@/lib/command-centre/cc-extras";
import { hydrateAppearanceFromStorage } from "@/lib/command-centre/storage";
import { syncFromPortalActiveLocation, hydrateClinicContext, portalActiveLocationId } from "@/platform/context/clinic-context";

const STORAGE_KEYS = {
  location: "pulse.activeLocation",
  lastModule: "pulse.lastModule",
};

let locationListeners = new Set<() => void>();
let memoryLocationId = ALL_LOCATIONS_ID;
let locationSeeded = false;
let locationHydrated = false;

function isValidLocationId(id: string, locations: Location[] = LOCATIONS) {
  return id === ALL_LOCATIONS_ID || locations.some((l) => l.id === id);
}

function seedLocationFromStorage() {
  if (locationSeeded || typeof window === "undefined") return;
  locationSeeded = true;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEYS.location);
    if (saved && isValidLocationId(saved)) {
      memoryLocationId = saved;
    }
  } catch {
    /* ignore */
  }
}

function subscribeLocation(listener: () => void) {
  locationListeners.add(listener);
  return () => {
    locationListeners.delete(listener);
  };
}

function getLocationSnapshot() {
  if (!locationHydrated) return ALL_LOCATIONS_ID;
  seedLocationFromStorage();
  return memoryLocationId;
}

function getLocationServerSnapshot() {
  return ALL_LOCATIONS_ID;
}

function writeLocation(id: string) {
  memoryLocationId = id;
  locationHydrated = true;
  locationSeeded = true;
  try {
    window.localStorage.setItem(STORAGE_KEYS.location, id);
  } catch {
    /* ignore */
  }
  locationListeners.forEach((l) => l());
}

let sidebarCollapsedListeners = new Set<() => void>();
let sidebarCollapsedValue = false;
let sidebarCollapsedHydrated = false;

function subscribeSidebarCollapsed(listener: () => void) {
  sidebarCollapsedListeners.add(listener);
  return () => {
    sidebarCollapsedListeners.delete(listener);
  };
}

function getSidebarCollapsedSnapshot() {
  if (!sidebarCollapsedHydrated) return false;
  return sidebarCollapsedValue;
}

function getSidebarCollapsedServerSnapshot() {
  return false;
}

function writeSidebarCollapsedStore(collapsed: boolean) {
  sidebarCollapsedValue = collapsed;
  sidebarCollapsedHydrated = true;
  writeSidebarCollapsed(collapsed);
  sidebarCollapsedListeners.forEach((l) => l());
}

export type RecordsBag = Record<string, Array<Record<string, unknown>>>;

interface PortalContextValue {
  locations: Location[];
  setLocations: React.Dispatch<React.SetStateAction<Location[]>>;
  activeLocationId: string;
  setActiveLocationId: (id: string) => void;
  activeLocation: Location | undefined;
  actions: ActionItem[];
  setActions: React.Dispatch<React.SetStateAction<ActionItem[]>>;
  tasks: TaskItem[];
  setTasks: React.Dispatch<React.SetStateAction<TaskItem[]>>;
  records: RecordsBag;
  setRecords: React.Dispatch<React.SetStateAction<RecordsBag>>;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toasts: ToastItem[];
  pushToast: (message: string, tone?: ToastTone) => void;
  rememberModule: (moduleId: string) => void;
}

const PortalContext = createContext<PortalContextValue | null>(null);

const INITIAL_RECORDS: RecordsBag = {
  staff: HTML_STAFF as Array<Record<string, unknown>>,
  doctors: HTML_DOCTORS as Array<Record<string, unknown>>,
  checklists: HTML_CHECKLISTS as Array<Record<string, unknown>>,
  accreditation: HTML_ACCREDITATION as Array<Record<string, unknown>>,
};

export function PortalProvider({ children }: { children: React.ReactNode }) {
  const [locations, setLocations] = useState<Location[]>(LOCATIONS);
  const activeLocationId = useSyncExternalStore(
    subscribeLocation,
    getLocationSnapshot,
    getLocationServerSnapshot
  );
  const [actions, setActions] = useState<ActionItem[]>(ACTION_ITEMS);
  const [tasks, setTasks] = useState<TaskItem[]>(TASKS);
  const [records, setRecords] = useState<RecordsBag>(INITIAL_RECORDS);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarCollapsed = useSyncExternalStore(
    subscribeSidebarCollapsed,
    getSidebarCollapsedSnapshot,
    getSidebarCollapsedServerSnapshot
  );
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useLayoutEffect(() => {
    locationHydrated = true;
    seedLocationFromStorage();
    locationListeners.forEach((l) => l());
    sidebarCollapsedHydrated = true;
    sidebarCollapsedValue = readSidebarCollapsed();
    sidebarCollapsedListeners.forEach((l) => l());
    hydrateAppearanceFromStorage();
    document.documentElement.style.setProperty("--sidebar-current", "288px");
    hydrateClinicContext();
    const shared = portalActiveLocationId();
    if (shared && shared !== memoryLocationId) {
      memoryLocationId = shared;
      locationListeners.forEach((l) => l());
    }
  }, []);

  useEffect(() => {
    function onResize() {
      if (window.innerWidth < 1024) setSidebarOpen(false);
    }
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useLayoutEffect(() => {
    document.documentElement.style.setProperty("--sidebar-current", "288px");
  }, [sidebarCollapsed]);

  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    writeSidebarCollapsedStore(collapsed);
  }, []);

  const setActiveLocationId = useCallback((id: string) => {
    writeLocation(id);
    syncFromPortalActiveLocation(id);
  }, []);

  const rememberModule = useCallback((moduleId: string) => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.lastModule, moduleId);
    } catch {
      /* ignore */
    }
  }, []);

  const pushToast = useCallback((message: string, tone: ToastTone = "default") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const activeLocation = useMemo(
    () => locations.find((l) => l.id === activeLocationId),
    [locations, activeLocationId]
  );

  const value = useMemo(
    () => ({
      locations,
      setLocations,
      activeLocationId,
      setActiveLocationId,
      activeLocation,
      actions,
      setActions,
      tasks,
      setTasks,
      records,
      setRecords,
      sidebarOpen,
      setSidebarOpen,
      sidebarCollapsed,
      setSidebarCollapsed,
      toasts,
      pushToast,
      rememberModule,
    }),
    [
      locations,
      activeLocationId,
      setActiveLocationId,
      activeLocation,
      actions,
      tasks,
      records,
      sidebarOpen,
      sidebarCollapsed,
      setSidebarCollapsed,
      toasts,
      pushToast,
      rememberModule,
    ]
  );

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}

export function usePortal() {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error("usePortal must be used within PortalProvider");
  return ctx;
}
