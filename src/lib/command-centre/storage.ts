import type { CcAppearance, DashboardSectionLayout, HealthOverrideRecord, LayoutPeriod, PrivateNote } from "./types";

export const CC_STORAGE = {
  appearance: "pulse.cc.appearance",
  layouts: "pulse.cc.layouts",
  activeLayout: "pulse.cc.activeLayout",
  notes: "pulse.cc.privateNotes",
  draftForm: "pulse.cc.draftForm",
  selectedClinics: "pulse.cc.selectedClinics",
  period: "pulse.cc.period",
  customRange: "pulse.cc.customRange",
  healthOverrides: "pulse.cc.healthOverrides",
} as const;

export interface SavedLayout {
  id: string;
  name: string;
  sections: DashboardSectionLayout[];
  isDefault?: boolean;
  updatedAt: string;
}

export function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T;
    if (parsed == null) return fallback;
    if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback;
    return parsed;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
}

export function readAppearance(): CcAppearance {
  return readJson<CcAppearance>(CC_STORAGE.appearance, "light");
}

let appearanceListeners = new Set<() => void>();
let appearanceMemory: CcAppearance = "light";
let appearanceHydrated = false;

export function writeAppearance(value: CcAppearance) {
  writeJson(CC_STORAGE.appearance, value);
  appearanceMemory = value;
  appearanceHydrated = true;
  appearanceListeners.forEach((l) => l());
}

export function subscribeAppearance(listener: () => void) {
  appearanceListeners.add(listener);
  return () => {
    appearanceListeners.delete(listener);
  };
}

export function getAppearanceSnapshot(): CcAppearance {
  if (!appearanceHydrated) return "light";
  return appearanceMemory;
}

export function getAppearanceServerSnapshot(): CcAppearance {
  return "light";
}

export function hydrateAppearanceFromStorage() {
  if (typeof window === "undefined") return;
  appearanceMemory = readAppearance();
  appearanceHydrated = true;
  applyAppearance(appearanceMemory);
  appearanceListeners.forEach((l) => l());
}

export function setAppearanceStore(value: CcAppearance) {
  applyAppearance(value);
  writeAppearance(value);
}

export function resolveIsDark(value: CcAppearance): boolean {
  if (typeof window === "undefined") return value === "dark";
  return (
    value === "dark" ||
    (value === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
  );
}

export function applyAppearance(value: CcAppearance) {
  if (typeof document === "undefined") return;
  const dark = resolveIsDark(value);
  // Prefer html — React layout reconciles <body className> and would wipe body.theme-dark.
  const root = document.documentElement;
  if (root?.classList) {
    root.classList.toggle("theme-dark", dark);
    root.dataset.appearance = value;
    if (root.style) root.style.colorScheme = dark ? "dark" : "light";
  }
  // Keep body in sync for residual body.theme-dark selectors / unit tests.
  document.body?.classList.toggle("theme-dark", dark);
}

/** Subscribe to OS preference changes when appearance is Device setting. */
export function subscribeSystemAppearance(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = () => onChange();
  mq.addEventListener?.("change", handler);
  return () => mq.removeEventListener?.("change", handler);
}

export function readLayouts(): SavedLayout[] {
  return readJson<SavedLayout[]>(CC_STORAGE.layouts, []);
}

export function writeLayouts(layouts: SavedLayout[]) {
  writeJson(CC_STORAGE.layouts, layouts);
}

export function readNotes(): PrivateNote[] {
  return readJson<PrivateNote[]>(CC_STORAGE.notes, []);
}

export function writeNotes(notes: PrivateNote[]) {
  writeJson(CC_STORAGE.notes, notes);
}

export function readSelectedClinics(fallback: string[]): string[] {
  const stored = readJson<string[] | null>(CC_STORAGE.selectedClinics, null);
  if (!stored || !Array.isArray(stored) || !stored.length) return fallback;
  return stored;
}

export function writeSelectedClinics(ids: string[]) {
  writeJson(CC_STORAGE.selectedClinics, ids);
}

export function readPeriod(fallback: LayoutPeriod = "Today"): LayoutPeriod {
  return readJson<LayoutPeriod>(CC_STORAGE.period, fallback);
}

export function writePeriod(period: LayoutPeriod) {
  writeJson(CC_STORAGE.period, period);
}

export function readCustomRange(fallback: { start: string; end: string } | null): { start: string; end: string } | null {
  return readJson(CC_STORAGE.customRange, fallback);
}

export function writeCustomRange(range: { start: string; end: string } | null) {
  writeJson(CC_STORAGE.customRange, range);
}

export type PersistedHealthOverride = {
  locationId: string;
  override: HealthOverrideRecord;
};

export function readHealthOverrides(): PersistedHealthOverride[] {
  return readJson<PersistedHealthOverride[]>(CC_STORAGE.healthOverrides, []);
}

export function writeHealthOverrides(rows: PersistedHealthOverride[]) {
  writeJson(CC_STORAGE.healthOverrides, rows);
}

/** Soft-parse any Module 1 key; returns fallback on corrupt data. */
export function safeReadJson<T>(key: string, fallback: T): T {
  return readJson(key, fallback);
}
