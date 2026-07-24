/** Sidebar nav preferences — mirrors prototype mcop_v33 / v32 collapse behaviour. */

export const EXEC_ROLES = [
  "Owner / Director",
  "Practice Manager",
  "Reception",
  "Nurse",
  "Finance",
  "Doctor",
  "IT / Facilities",
] as const;

export type ExecRole = (typeof EXEC_ROLES)[number];

const V33_STORE = "pulse.v33.navPrefs";
const V32_COLLAPSE_STORE = "pulse.v32.navCollapsed";
const ROLE_STORE = "pulse.v27.executiveRole";

type V33Prefs = {
  favorites: string[];
  recents: string[];
};

const DEFAULT_V33: V33Prefs = {
  favorites: ["executive-command-centre", "action-inbox", "roster"],
  recents: [],
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...(JSON.parse(raw) as object) } as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function readNavPrefs(): V33Prefs {
  const raw = readJson<Partial<V33Prefs>>(V33_STORE, DEFAULT_V33);
  return {
    favorites: Array.isArray(raw.favorites) ? raw.favorites : DEFAULT_V33.favorites,
    recents: Array.isArray(raw.recents) ? raw.recents : [],
  };
}

export function writeNavPrefs(prefs: V33Prefs) {
  writeJson(V33_STORE, prefs);
}

/** Favourites / recents use approved platform module IDs. */
export function toggleFavorite(moduleId: string): { favorites: string[]; added: boolean } {
  const prefs = readNavPrefs();
  const i = prefs.favorites.indexOf(moduleId);
  if (i >= 0) {
    prefs.favorites.splice(i, 1);
    writeNavPrefs(prefs);
    return { favorites: prefs.favorites, added: false };
  }
  prefs.favorites = [moduleId, ...prefs.favorites.filter((x) => x !== moduleId)];
  writeNavPrefs(prefs);
  return { favorites: prefs.favorites, added: true };
}

export function pushRecent(moduleId: string): string[] {
  const prefs = readNavPrefs();
  prefs.recents = [moduleId, ...prefs.recents.filter((x) => x !== moduleId)].slice(0, 8);
  writeNavPrefs(prefs);
  return prefs.recents;
}

export function readCollapsedGroups(): Record<string, boolean> {
  return readJson<Record<string, boolean>>(V32_COLLAPSE_STORE, {});
}

export function writeCollapsedGroups(map: Record<string, boolean>) {
  writeJson(V32_COLLAPSE_STORE, map);
}

export function readExecRole(): ExecRole {
  if (typeof window === "undefined") return "Owner / Director";
  try {
    const saved = window.localStorage.getItem(ROLE_STORE);
    if (saved && (EXEC_ROLES as readonly string[]).includes(saved)) {
      return saved as ExecRole;
    }
  } catch {
    /* ignore */
  }
  return "Owner / Director";
}

export function writeExecRole(role: ExecRole) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ROLE_STORE, role);
  } catch {
    /* ignore */
  }
}

export function roleDisplayName(role: ExecRole): string {
  /* Prototype footer shows the selected role string (e.g. Owner / Director). */
  return role;
}
