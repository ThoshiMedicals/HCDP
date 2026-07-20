"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV_GROUPS, getModule } from "@/lib/modules";
import { usePortal } from "@/lib/portal-context";
import { ALL_LOCATIONS_ID } from "@/lib/types";
import {
  getInboxBadgeSnapshot,
  subscribeInboxBadge,
  type InboxBadgeSnapshot,
} from "@/lib/action-inbox/badge";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

export function Sidebar() {
  const pathname = usePathname();
  const {
    locations,
    activeLocationId,
    setActiveLocationId,
    sidebarOpen,
    setSidebarOpen,
    sidebarCollapsed,
    setSidebarCollapsed,
  } = usePortal();
  const selectValue = activeLocationId;

  /** Module 2 badge — SSR-safe empty, then hydrate from pulse.m2.inbox.* */
  const [inboxBadge, setInboxBadge] = useState<InboxBadgeSnapshot>({ count: 0, urgent: false });

  useEffect(() => {
    const refresh = () => setInboxBadge(getInboxBadgeSnapshot());
    refresh();
    return subscribeInboxBadge(refresh);
  }, []);

  return (
    <>
      <div
        className={cn("fixed inset-0 z-[5] bg-black/30 lg:hidden", sidebarOpen ? "block" : "hidden")}
        onClick={() => setSidebarOpen(false)}
      />
      <aside
        className={cn(
          "fixed bottom-0 left-0 top-0 z-[6] flex flex-col border-r border-[var(--v34-card-line)] bg-[var(--card)] text-[var(--ink)] transition-[width,transform] duration-200",
          sidebarCollapsed ? "lg:w-[72px]" : "lg:w-[var(--sidebar)]",
          "w-[var(--sidebar)]",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        data-collapsed={sidebarCollapsed ? "true" : "false"}
      >
        <div
          className={cn(
            "flex items-center border-b border-[var(--v34-card-line)] py-4",
            sidebarCollapsed ? "justify-center px-2" : "gap-2.5 px-[18px]"
          )}
        >
          <div className="relative grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[10px] border-[3px] border-[var(--teal)] font-black text-[var(--teal)]">
            P
            <span className="pointer-events-none absolute inset-[6px] translate-x-1.5 -translate-y-1.5 rounded-[7px] border-2 border-[var(--teal)]" />
          </div>
          {!sidebarCollapsed ? (
            <div className="min-w-0">
              <div className="text-[20px] font-extrabold tracking-tight text-[var(--teal)]">Pulse</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--muted)]">
                Healthcare Doctors
              </div>
            </div>
          ) : null}
        </div>

        <div className={cn("mt-3", sidebarCollapsed ? "mx-2" : "mx-3")}>
          <button
            type="button"
            className="mb-2 hidden w-full items-center justify-center gap-2 rounded-xl border border-[var(--v34-card-line)] bg-[var(--soft)] px-2 py-2 text-[11px] font-bold lg:flex"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-pressed={sidebarCollapsed}
            aria-label={sidebarCollapsed ? "Expand navigation" : "Collapse navigation to icons"}
            title={sidebarCollapsed ? "Expand navigation" : "Icon-only navigation"}
          >
            <Icon name="task" className="h-3.5 w-3.5" />
            {!sidebarCollapsed ? <span>Collapse</span> : null}
          </button>

          {!sidebarCollapsed ? (
            <div className="flex items-center gap-2.5 rounded-xl border border-[var(--v34-card-line)] bg-[var(--soft)] px-2.5 py-2.5 shadow-[0_2px_7px_rgba(15,23,42,0.035)]">
              <div className="grid h-[34px] w-[34px] place-items-center rounded-[10px] bg-[var(--teal-3)] text-[var(--teal)]">
                <Icon name="building" />
              </div>
              <select
                className="w-full border-0 bg-transparent text-[13px] font-semibold text-[var(--ink)] outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-accent)]"
                value={selectValue}
                onChange={(e) => setActiveLocationId(e.target.value)}
                aria-label="Select clinic"
              >
                <option value={ALL_LOCATIONS_ID}>All locations</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.shortName}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div
              className="grid h-10 place-items-center rounded-xl border border-[var(--v34-card-line)] bg-[var(--soft)] text-[var(--teal)]"
              title="Clinic selector available when navigation is expanded"
            >
              <Icon name="building" className="h-4 w-4" />
            </div>
          )}
        </div>

        <nav className={cn("mt-3 flex-1 space-y-2.5 overflow-auto pb-4", sidebarCollapsed ? "px-2" : "px-3")}>
          {NAV_GROUPS.map((group) => (
            <div
              key={group.id}
              className="overflow-hidden rounded-[14px] border border-[var(--v34-card-line)] shadow-[0_2px_7px_rgba(15,23,42,0.035)]"
              style={{
                borderLeft: sidebarCollapsed ? undefined : `4px solid ${group.accent}`,
                background: `color-mix(in srgb, ${group.accent} 8%, var(--card))`,
              }}
            >
              {!sidebarCollapsed ? (
                <div
                  className="flex items-center gap-2 border-b px-2.5 py-2 text-[11px] font-black uppercase tracking-[0.08em]"
                  style={{
                    color: group.accent,
                    background: `color-mix(in srgb, ${group.accent} 17%, var(--card))`,
                    borderColor: `color-mix(in srgb, ${group.accent} 18%, var(--line))`,
                  }}
                >
                  <span
                    className="grid h-6 w-6 place-items-center rounded-lg border"
                    style={{
                      background: `color-mix(in srgb, ${group.accent} 25%, var(--card))`,
                      borderColor: `color-mix(in srgb, ${group.accent} 28%, var(--card))`,
                    }}
                  >
                    <Icon name={group.icon} className="h-3 w-3" />
                  </span>
                  <span className="truncate">{group.title}</span>
                </div>
              ) : null}
              <div
                className="space-y-0.5 p-1.5"
                style={{ background: sidebarCollapsed ? undefined : group.soft }}
              >
                {group.items.map((slug) => {
                  const mod = getModule(slug);
                  if (!mod) return null;
                  const active =
                    pathname === `/${mod.id}` ||
                    (mod.id === "action-inbox" && pathname.startsWith("/action-inbox"));
                  const showBadge = mod.htmlId === "actionInbox" && inboxBadge.count > 0;
                  return (
                    <Link
                      key={mod.id}
                      href={`/${mod.id}`}
                      onClick={() => setSidebarOpen(false)}
                      title={sidebarCollapsed ? mod.label : undefined}
                      aria-label={
                        showBadge
                          ? `${mod.label}, ${inboxBadge.count} open${inboxBadge.urgent ? ", includes overdue or urgent" : ""}`
                          : mod.label
                      }
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative flex min-h-[34px] w-full items-center gap-2 rounded-[10px] px-2 py-1.5 text-left text-[12px] font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-accent)]",
                        sidebarCollapsed && "justify-center px-0",
                        active
                          ? "font-extrabold text-white"
                          : "text-[var(--text)] hover:bg-[var(--soft)]"
                      )}
                      style={
                        active
                          ? {
                              background: `linear-gradient(90deg, ${group.accent}, color-mix(in srgb, ${group.accent} 84%, var(--card)))`,
                              boxShadow: `0 7px 16px color-mix(in srgb, ${group.accent} 30%, transparent)`,
                            }
                          : undefined
                      }
                    >
                      <span
                        className={cn(
                          "grid h-7 w-7 shrink-0 place-items-center rounded-lg border",
                          active ? "border-white/30 bg-white/20 text-white" : "bg-[var(--card)]"
                        )}
                        style={
                          active
                            ? undefined
                            : {
                                color: group.accent,
                                borderColor: `color-mix(in srgb, ${group.accent} 16%, var(--card))`,
                                background: `color-mix(in srgb, ${group.accent} 14%, var(--card))`,
                              }
                        }
                      >
                        <Icon name={mod.icon} className="h-3.5 w-3.5" />
                      </span>
                      {!sidebarCollapsed ? (
                        <>
                          <span className="flex-1 leading-tight">{mod.label}</span>
                          {showBadge ? (
                            <span
                              className={cn(
                                "rounded-full px-1.5 text-[10px] font-extrabold",
                                active
                                  ? "bg-white/20 text-white"
                                  : inboxBadge.urgent
                                    ? "border border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]"
                                    : "border border-[var(--line)] bg-[var(--card)] text-[var(--theme-primary)]"
                              )}
                              title={
                                inboxBadge.urgent
                                  ? `${inboxBadge.count} open · includes overdue or urgent`
                                  : `${inboxBadge.count} open actions`
                              }
                            >
                              {inboxBadge.count}
                              <span className="sr-only">
                                {inboxBadge.urgent ? " overdue or urgent" : " open"}
                              </span>
                            </span>
                          ) : null}
                        </>
                      ) : showBadge ? (
                        <span
                          className={cn(
                            "absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full",
                            inboxBadge.urgent ? "bg-[#dc2626]" : "bg-[var(--theme-primary)]"
                          )}
                          aria-hidden
                        />
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {!sidebarCollapsed ? (
          <div className="flex items-center gap-2.5 border-t border-[var(--v34-card-line)] bg-[var(--card)] px-4 py-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-[#dbeafe] to-[#bfdbfe] font-extrabold text-[var(--teal)]">
              HD
            </div>
            <div>
              <div className="text-[13px] font-bold">Practice Owner</div>
              <div className="text-xs text-[var(--muted)]">Healthcare Doctors Pulse</div>
            </div>
          </div>
        ) : (
          <div className="border-t border-[var(--v34-card-line)] py-3 text-center text-[10px] font-extrabold text-[var(--teal)]">
            HD
          </div>
        )}
      </aside>
    </>
  );
}
