"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  NAV_GROUPS,
  getModule,
} from "@/lib/modules";
import { usePortal } from "@/lib/portal-context";
import {
  getInboxBadgeServerSnapshot,
  getInboxBadgeSnapshot,
  hydrateInboxBadge,
  subscribeInboxBadge,
} from "@/lib/action-inbox/badge";
import {
  pushRecent,
  readCollapsedGroups,
  readNavPrefs,
  toggleFavorite,
  writeCollapsedGroups,
} from "@/lib/shell/nav-prefs";
import { useIdentity } from "@/platform/context/identity-context";
import { migrateNavPrefsToModuleIds } from "@/platform/navigation/migrate-nav-prefs";
import { searchPlatformNav } from "@/platform/navigation/nav-search";
import { modulesVisibleForRole } from "@/platform/module-registry";
import { identitySeesEnterprise } from "@/platform/permissions/visibility";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

const NAV_PREFS_SERVER_SNAPSHOT = {
  favorites: ["executive-command-centre", "action-inbox", "roster"] as string[],
  recents: [] as string[],
};

let navPrefsListeners = new Set<() => void>();
let navPrefsCache = NAV_PREFS_SERVER_SNAPSHOT;
let navPrefsHydrated = false;

function subscribeNavPrefs(listener: () => void) {
  navPrefsListeners.add(listener);
  return () => {
    navPrefsListeners.delete(listener);
  };
}

function getNavPrefsSnapshot() {
  if (!navPrefsHydrated) return NAV_PREFS_SERVER_SNAPSHOT;
  return navPrefsCache;
}

function getNavPrefsServerSnapshot() {
  return NAV_PREFS_SERVER_SNAPSHOT;
}

function emitNavPrefs(next: { favorites: string[]; recents: string[] }) {
  navPrefsCache = next;
  navPrefsHydrated = true;
  navPrefsListeners.forEach((l) => l());
}

function hydrateNavPrefs() {
  if (typeof window === "undefined") return;
  migrateNavPrefsToModuleIds();
  navPrefsCache = readNavPrefs();
  navPrefsHydrated = true;
  navPrefsListeners.forEach((l) => l());
}

const COLLAPSE_SERVER_SNAPSHOT: Record<string, boolean> = {
  "enterprise-extensions": true,
};
let collapseListeners = new Set<() => void>();
let collapseCache: Record<string, boolean> = COLLAPSE_SERVER_SNAPSHOT;
let collapseHydrated = false;

function subscribeCollapse(listener: () => void) {
  collapseListeners.add(listener);
  return () => {
    collapseListeners.delete(listener);
  };
}

function getCollapseSnapshot() {
  if (!collapseHydrated) return COLLAPSE_SERVER_SNAPSHOT;
  return collapseCache;
}

function getCollapseServerSnapshot(): Record<string, boolean> {
  return COLLAPSE_SERVER_SNAPSHOT;
}

function emitCollapse(next: Record<string, boolean>) {
  collapseCache = next;
  collapseHydrated = true;
  writeCollapsedGroups(next);
  collapseListeners.forEach((l) => l());
}

function hydrateCollapse() {
  if (typeof window === "undefined") return;
  collapseCache = { ...COLLAPSE_SERVER_SNAPSHOT, ...readCollapsedGroups() };
  collapseHydrated = true;
  collapseListeners.forEach((l) => l());
}

function isModuleActive(pathname: string, modId: string): boolean {
  return (
    pathname === `/${modId}` ||
    (modId === "action-inbox" && pathname.startsWith("/action-inbox")) ||
    (modId === "dashboard" && (pathname === "/" || pathname === "/dashboard"))
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarOpen, setSidebarOpen, pushToast } = usePortal();
  const { identity, identities, setActiveIdentity } = useIdentity();
  const navRef = useRef<HTMLElement | null>(null);

  const [navQuery, setNavQuery] = useState("");

  useEffect(() => {
    hydrateNavPrefs();
    hydrateCollapse();
    hydrateInboxBadge();
  }, []);

  const navPrefs = useSyncExternalStore(subscribeNavPrefs, getNavPrefsSnapshot, getNavPrefsServerSnapshot);
  const collapsedGroups = useSyncExternalStore(subscribeCollapse, getCollapseSnapshot, getCollapseServerSnapshot);
  const inboxBadge = useSyncExternalStore(
    subscribeInboxBadge,
    getInboxBadgeSnapshot,
    getInboxBadgeServerSnapshot
  );
  const favorites = navPrefs.favorites;

  const visiblePlatform = useMemo(
    () => modulesVisibleForRole(identity.role),
    [identity.role]
  );
  const visibleIds = useMemo(() => new Set(visiblePlatform.map((m) => m.id)), [visiblePlatform]);
  const showEnterprise = identitySeesEnterprise(identity);

  const trackRecent = useCallback((platformId: string) => {
    emitNavPrefs({ favorites: readNavPrefs().favorites, recents: pushRecent(platformId) });
  }, []);

  const q = navQuery.trim();
  const searchHits = useMemo(
    () => (q ? searchPlatformNav(q, visiblePlatform) : []),
    [q, visiblePlatform]
  );

  const toggleGroup = useCallback((groupId: string) => {
    const cur = getCollapseSnapshot();
    emitCollapse({ ...cur, [groupId]: !cur[groupId] });
  }, []);

  const onToggleFavorite = useCallback(
    (platformId: string) => {
      const { favorites: next, added } = toggleFavorite(platformId);
      emitNavPrefs({ favorites: next, recents: readNavPrefs().recents });
      pushToast(added ? "Added to favourites" : "Removed from favourites");
    },
    [pushToast]
  );

  return (
    <>
      <div
        className={cn("fixed inset-0 z-[5] bg-black/30 lg:hidden", sidebarOpen ? "block" : "hidden")}
        onClick={() => setSidebarOpen(false)}
      />
      <aside
        className={cn(
          "pulse-sidebar fixed bottom-0 left-0 top-0 z-[6] flex w-[var(--sidebar)] flex-col transition-transform duration-200",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        data-premium-clinical-nav="true"
      >
        <div className="v33-nav-tools">
          <label className="v33-nav-search">
            <Icon name="search" className="h-[15px] w-[15px] shrink-0" />
            <input
              type="search"
              autoComplete="off"
              placeholder="Find a module or section"
              aria-label="Find a module or section"
              value={navQuery}
              onChange={(e) => setNavQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setNavQuery("");
                  (e.target as HTMLInputElement).blur();
                }
                if (e.key === "Enter" && searchHits[0]) {
                  router.push(searchHits[0].href);
                  setSidebarOpen(false);
                }
              }}
            />
          </label>
        </div>

        <nav ref={navRef} className="mt-1 flex-1 overflow-auto px-0 pb-4" aria-label="Platform modules">
          {q ? (
            <div className="v33-aux-nav px-2" data-nav-mode="search">
              <div className="v33-aux-head">
                <span>Search results</span>
                <span>{searchHits.length}</span>
              </div>
              <div className="v33-aux-list">
                {searchHits.length === 0 ? (
                  <div className="px-2 py-2 text-[length:var(--type-control)] text-[var(--sidebar-muted)]">
                    No modules or sections matched.
                  </div>
                ) : (
                  searchHits.map((hit) => (
                    <Link
                      key={`${hit.moduleId}-${hit.sectionId ?? "mod"}-${hit.href}`}
                      href={hit.href}
                      className="v33-aux-btn"
                      title={hit.matchLabel}
                      onClick={() => {
                        trackRecent(hit.moduleId);
                        setSidebarOpen(false);
                        setNavQuery("");
                      }}
                    >
                      <span className="v33-aux-label">{hit.matchLabel}</span>
                    </Link>
                  ))
                )}
              </div>
            </div>
          ) : (
            (() => {
              const renderedIds = new Set<string>();
              return NAV_GROUPS.map((group) => {
                if (group.tier === "enterprise" && !showEnterprise) return null;

                const items = group.items
                  .map((slug) => getModule(slug))
                  .filter((mod): mod is NonNullable<typeof mod> => {
                    if (!mod) return false;
                    if (!visibleIds.has(mod.platformId)) return false;
                    if (renderedIds.has(mod.platformId)) return false;
                    renderedIds.add(mod.platformId);
                    return true;
                  });
                if (!items.length) return null;

                const hasActive = items.some((mod) => isModuleActive(pathname, mod.id));
                const isCollapsed = Boolean(collapsedGroups[group.id]) && !hasActive;

                return (
                  <div
                    key={group.id}
                    data-nav-group={group.id}
                    className={cn("v32-nav-group", isCollapsed && "collapsed")}
                  >
                    <button
                      type="button"
                      className="v32-nav-toggle"
                      aria-expanded={!isCollapsed}
                      onClick={() => toggleGroup(group.id)}
                    >
                      <span className="ico">
                        <Icon name={group.icon} className="h-[15px] w-[15px]" />
                      </span>
                      <span className="truncate">{group.title}</span>
                      <span className="chev" aria-hidden>
                        ⌄
                      </span>
                    </button>
                    <div className="v32-nav-children">
                      {items.map((mod) => {
                        const active = isModuleActive(pathname, mod.id);
                        const showBadge = mod.platformId === "action-inbox" && inboxBadge.count > 0;
                        const isFav = favorites.includes(mod.platformId);
                        return (
                          <div
                            key={mod.platformId}
                            className={cn("nav-row", active && "active")}
                            data-canonical-module={mod.platformId}
                            data-canonical-href={`/${mod.id}`}
                          >
                            <Link
                              href={`/${mod.id}`}
                              onClick={() => {
                                trackRecent(mod.platformId);
                                setSidebarOpen(false);
                              }}
                              aria-label={
                                showBadge
                                  ? `${mod.label}, ${inboxBadge.count} open${inboxBadge.urgent ? ", includes overdue or urgent" : ""}`
                                  : mod.label
                              }
                              aria-current={active ? "page" : undefined}
                              className={cn("nav-btn", active && "active")}
                            >
                              <span className="nav-icon">
                                <Icon name={mod.icon} className="h-[14px] w-[14px]" />
                              </span>
                              <span className="nav-label">{mod.label}</span>
                              {showBadge ? (
                                <span
                                  className={cn("v32-count", inboxBadge.urgent && "urgent")}
                                  title={
                                    inboxBadge.urgent
                                      ? `${inboxBadge.count} open · includes overdue or urgent`
                                      : `${inboxBadge.count} open actions`
                                  }
                                >
                                  {inboxBadge.count}
                                  <span className="sr-only">
                                    {inboxBadge.urgent
                                      ? " open actions, includes overdue or urgent"
                                      : " open actions"}
                                  </span>
                                </span>
                              ) : null}
                            </Link>
                            <button
                              type="button"
                              className={cn("v33-fav-star", isFav && "is-fav")}
                              title={isFav ? "Remove favourite" : "Add favourite"}
                              aria-label={isFav ? "Remove favourite" : "Add favourite"}
                              aria-pressed={isFav}
                              onClick={() => onToggleFavorite(mod.platformId)}
                            >
                              {isFav ? "★" : "☆"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })()
          )}
        </nav>

        <div className="sidebar-user">
          <div className="avatar" aria-hidden>
            {identity.displayName
              .split(" ")
              .map((p) => p[0])
              .join("")
              .slice(0, 2)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="user-name">{identity.displayName}</div>
            <div className="user-role">{identity.role}</div>
          </div>
          <div className="v27-sidebar-role">
            <select
              aria-label="Act as User / Role"
              title="Demonstration identity only — not production authentication"
              value={identity.userId}
              onChange={(e) => {
                try {
                  setActiveIdentity(e.target.value);
                  pushToast(
                    `Acting as ${identities.find((i) => i.userId === e.target.value)?.displayName ?? e.target.value} (demo)`
                  );
                } catch (err) {
                  pushToast(err instanceof Error ? err.message : "Demo Act-as disabled");
                }
              }}
            >
              {identities.map((u) => (
                <option key={u.userId} value={u.userId}>
                  {u.displayName} · {u.role}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[length:var(--type-control)] leading-snug text-[var(--sidebar-muted)]">
              Demo Act-as — not production auth
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
