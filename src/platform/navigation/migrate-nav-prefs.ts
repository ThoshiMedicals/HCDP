/**
 * Migrate favourites / recents from legacy htmlIds to approved module IDs.
 */

import { HTML_ID_TO_MODULE_ID, SLUG_TO_MODULE_ID } from "@/platform/module-registry";
import { runMigrationOnce } from "@/platform/storage";

const V33_STORE = "pulse.v33.navPrefs";

function mapToken(token: string): string | null {
  if (HTML_ID_TO_MODULE_ID[token]) return HTML_ID_TO_MODULE_ID[token];
  if (SLUG_TO_MODULE_ID[token]) return SLUG_TO_MODULE_ID[token];
  // already module id
  if (token.includes("-") && Object.values(HTML_ID_TO_MODULE_ID).includes(token)) return token;
  const values = new Set(Object.values(HTML_ID_TO_MODULE_ID));
  if (values.has(token)) return token;
  return null;
}

export function migrateNavPrefsToModuleIds() {
  if (typeof window === "undefined") return;
  runMigrationOnce("nav-prefs-module-ids", 1, () => {
    try {
      const raw = window.localStorage.getItem(V33_STORE);
      if (!raw) {
        window.localStorage.setItem(
          V33_STORE,
          JSON.stringify({
            favorites: ["executive-command-centre", "action-inbox", "roster"],
            recents: [],
          })
        );
        return;
      }
      const parsed = JSON.parse(raw) as { favorites?: string[]; recents?: string[] };
      const mapList = (list: string[] | undefined) => {
        const out: string[] = [];
        for (const item of list ?? []) {
          const mapped = mapToken(item);
          if (mapped && !out.includes(mapped)) out.push(mapped);
        }
        return out;
      };
      const favorites = mapList(parsed.favorites);
      const recents = mapList(parsed.recents);
      window.localStorage.setItem(
        V33_STORE,
        JSON.stringify({
          favorites: favorites.length
            ? favorites
            : ["executive-command-centre", "action-inbox", "roster"],
          recents,
        })
      );
    } catch {
      /* ignore */
    }
  });
}
