"use client";

/**
 * Shared clinic context for the whole platform.
 * Migrates pulse.activeLocation + pulse.cc.selectedClinics without deleting them.
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { LOCATIONS } from "@/lib/mock/data";
import { ALL_LOCATIONS_ID } from "@/lib/types";
import { readSelectedClinics, writeSelectedClinics } from "@/lib/command-centre/storage";
import {
  PLATFORM_KEYS,
  readJsonSafe,
  runMigrationOnce,
  writeJsonSafe,
} from "@/platform/storage";

export type ClinicScopeMode = "all" | "group" | "single" | "multiple";

export interface ClinicGroupDef {
  id: string;
  name: string;
  clinicIds: string[];
}

export interface ClinicSelectionState {
  version: number;
  mode: ClinicScopeMode;
  selectedClinicIds: string[];
  groupId: string | null;
  label: string;
  updatedAt: string;
}

const LEGACY_ACTIVE = "pulse.activeLocation";
const EVENT = "pulse.platform.clinic-change";
const VERSION = 1;

const DEFAULT_GROUPS: ClinicGroupDef[] = [
  {
    id: "grp_brisbane_south",
    name: "Brisbane South",
    clinicIds: ["loc_woolloongabba", "loc_cannonhill", "loc_eightmile"],
  },
  {
    id: "grp_brisbane_west",
    name: "Brisbane West",
    clinicIds: ["loc_chapelhill", "loc_indooroopilly"],
  },
  {
    id: "grp_northside",
    name: "Northside Corridor",
    clinicIds: ["loc_baldhills", "loc_lawnton", "loc_beachmere"].filter((id) =>
      LOCATIONS.some((l) => l.id === id)
    ),
  },
];

function allClinicIds(): string[] {
  return LOCATIONS.map((l) => l.id);
}

function labelFor(mode: ClinicScopeMode, ids: string[], groupId: string | null): string {
  if (mode === "all") return "All Clinics";
  if (mode === "group") {
    const g = DEFAULT_GROUPS.find((x) => x.id === groupId);
    return g ? `Clinic Group · ${g.name}` : "Clinic Group";
  }
  if (mode === "single") {
    const loc = LOCATIONS.find((l) => l.id === ids[0]);
    return loc ? `Single Clinic · ${loc.shortName}` : "Single Clinic";
  }
  if (ids.length <= 2) {
    const names = ids
      .map((id) => LOCATIONS.find((l) => l.id === id)?.shortName ?? id)
      .join(", ");
    return `Multiple Clinics · ${names}`;
  }
  return `Multiple Clinics · ${ids.length} selected`;
}

function defaultState(): ClinicSelectionState {
  return {
    version: VERSION,
    mode: "all",
    selectedClinicIds: [],
    groupId: null,
    label: "All Clinics",
    updatedAt: new Date().toISOString(),
  };
}

function migrateFromLegacy(): ClinicSelectionState {
  const existing = readJsonSafe<ClinicSelectionState | null>(PLATFORM_KEYS.clinics, null);
  if (existing && existing.version === VERSION && existing.label) return existing;

  let mode: ClinicScopeMode = "all";
  let selectedClinicIds: string[] = [];
  let groupId: string | null = null;

  try {
    const active = window.localStorage.getItem(LEGACY_ACTIVE);
    const cc = readSelectedClinics([]);
    if (cc.length > 1) {
      mode = "multiple";
      selectedClinicIds = cc.filter((id) => id !== ALL_LOCATIONS_ID);
    } else if (cc.length === 1 && cc[0] !== ALL_LOCATIONS_ID) {
      mode = "single";
      selectedClinicIds = cc;
    } else if (active && active !== ALL_LOCATIONS_ID && LOCATIONS.some((l) => l.id === active)) {
      mode = "single";
      selectedClinicIds = [active];
    }
  } catch {
    /* keep all */
  }

  const state: ClinicSelectionState = {
    version: VERSION,
    mode,
    selectedClinicIds,
    groupId,
    label: labelFor(mode, selectedClinicIds, groupId),
    updatedAt: new Date().toISOString(),
  };
  writeJsonSafe(PLATFORM_KEYS.clinics, state);
  return state;
}

function writeLegacyCompat(state: ClinicSelectionState) {
  try {
    if (state.mode === "all") {
      window.localStorage.setItem(LEGACY_ACTIVE, ALL_LOCATIONS_ID);
      writeSelectedClinics(allClinicIds());
    } else if (state.mode === "single" && state.selectedClinicIds[0]) {
      window.localStorage.setItem(LEGACY_ACTIVE, state.selectedClinicIds[0]);
      writeSelectedClinics(state.selectedClinicIds);
    } else if (state.selectedClinicIds.length) {
      window.localStorage.setItem(LEGACY_ACTIVE, state.selectedClinicIds[0]);
      writeSelectedClinics(state.selectedClinicIds);
    }
  } catch {
    /* ignore */
  }
}

let memory = defaultState();
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT, { detail: memory }));
  }
}

function setState(next: ClinicSelectionState) {
  memory = { ...next, label: labelFor(next.mode, next.selectedClinicIds, next.groupId), updatedAt: new Date().toISOString() };
  writeJsonSafe(PLATFORM_KEYS.clinics, memory);
  writeLegacyCompat(memory);
  hydrated = true;
  emit();
}

export function hydrateClinicContext() {
  if (typeof window === "undefined") return memory;
  runMigrationOnce("clinic-context", 1, () => {
    memory = migrateFromLegacy();
  });
  // Always re-read; recover damaged JSON by rewriting authoritative key
  try {
    const raw = window.localStorage.getItem(PLATFORM_KEYS.clinics);
    if (raw) JSON.parse(raw);
    memory = readJsonSafe(PLATFORM_KEYS.clinics, migrateFromLegacy());
  } catch {
    memory = migrateFromLegacy();
  }
  writeJsonSafe(PLATFORM_KEYS.clinics, memory);
  writeLegacyCompat(memory);
  hydrated = true;
  emit();
  return memory;
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

function getSnapshot() {
  if (!hydrated) return defaultState();
  return memory;
}

function getServerSnapshot() {
  return defaultState();
}

export function getClinicSelection(): ClinicSelectionState {
  return getSnapshot();
}

export function clinicIdsForFilter(state: ClinicSelectionState = getSnapshot()): string[] | null {
  if (state.mode === "all") return null;
  return state.selectedClinicIds;
}

export function matchesClinicScope(clinicId: string, state: ClinicSelectionState = getSnapshot()): boolean {
  if (state.mode === "all") return true;
  return state.selectedClinicIds.includes(clinicId);
}

export function setAllClinics() {
  setState({ ...getSnapshot(), mode: "all", selectedClinicIds: [], groupId: null });
}

export function setSingleClinic(clinicId: string) {
  setState({
    ...getSnapshot(),
    mode: "single",
    selectedClinicIds: [clinicId],
    groupId: null,
  });
}

export function setClinicGroup(groupId: string) {
  const g = DEFAULT_GROUPS.find((x) => x.id === groupId);
  if (!g) return;
  setState({
    ...getSnapshot(),
    mode: "group",
    groupId,
    selectedClinicIds: [...g.clinicIds],
  });
}

export function setMultipleClinics(clinicIds: string[]) {
  const unique = [...new Set(clinicIds.filter((id) => LOCATIONS.some((l) => l.id === id)))];
  if (unique.length === 0) {
    setAllClinics();
    return;
  }
  if (unique.length === 1) {
    setSingleClinic(unique[0]);
    return;
  }
  setState({
    ...getSnapshot(),
    mode: "multiple",
    selectedClinicIds: unique,
    groupId: null,
  });
}

/** Module 1 compatibility: multi-clinic selection updates shared context. */
export function syncFromModule1SelectedClinics(ids: string[]) {
  const filtered = ids.filter((id) => id !== ALL_LOCATIONS_ID && LOCATIONS.some((l) => l.id === id));
  if (!filtered.length || filtered.length >= LOCATIONS.length) {
    setAllClinics();
    return;
  }
  if (filtered.length === 1) setSingleClinic(filtered[0]);
  else setMultipleClinics(filtered);
}

/** Portal compatibility: single active location change. */
export function syncFromPortalActiveLocation(id: string) {
  if (id === ALL_LOCATIONS_ID) setAllClinics();
  else setSingleClinic(id);
}

export function portalActiveLocationId(state: ClinicSelectionState = getSnapshot()): string {
  if (state.mode === "all") return ALL_LOCATIONS_ID;
  return state.selectedClinicIds[0] ?? ALL_LOCATIONS_ID;
}

export function getClinicGroups(): ClinicGroupDef[] {
  return DEFAULT_GROUPS;
}

interface ClinicContextValue {
  selection: ClinicSelectionState;
  groups: ClinicGroupDef[];
  locations: typeof LOCATIONS;
  setAllClinics: () => void;
  setSingleClinic: (id: string) => void;
  setClinicGroup: (groupId: string) => void;
  setMultipleClinics: (ids: string[]) => void;
  portalActiveLocationId: string;
  scopeLabel: string;
}

const ClinicCtx = createContext<ClinicContextValue | null>(null);

export function ClinicContextProvider({ children }: { children: ReactNode }) {
  const selection = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    hydrateClinicContext();
  }, []);

  const value = useMemo<ClinicContextValue>(
    () => ({
      selection,
      groups: DEFAULT_GROUPS,
      locations: LOCATIONS,
      setAllClinics,
      setSingleClinic,
      setClinicGroup,
      setMultipleClinics,
      portalActiveLocationId: portalActiveLocationId(selection),
      scopeLabel: selection.label,
    }),
    [selection]
  );

  return <ClinicCtx.Provider value={value}>{children}</ClinicCtx.Provider>;
}

export function useClinicContext(): ClinicContextValue {
  const ctx = useContext(ClinicCtx);
  if (!ctx) {
    // Safe fallback when used outside provider (tests / early render)
    return {
      selection: defaultState(),
      groups: DEFAULT_GROUPS,
      locations: LOCATIONS,
      setAllClinics,
      setSingleClinic,
      setClinicGroup,
      setMultipleClinics,
      portalActiveLocationId: ALL_LOCATIONS_ID,
      scopeLabel: "All Clinics",
    };
  }
  return ctx;
}

export function useClinicSelection() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
