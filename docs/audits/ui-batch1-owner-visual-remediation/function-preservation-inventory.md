# UI Batch 1 Owner Visual Remediation — Function Preservation Inventory

Branch: `cursor/ui-batch1-owner-visual-remediation`  
Base: `e5e41a0d79c8b84d3380c4c85372dcc95b0a78b8`

Classification key:

- **retained** — remains in the same surface
- **relocated** — moved to a named surface
- **removed-duplicate** — duplicate/non-functional chrome removed with evidence

## Global sidebar

| Capability | Classification | Notes |
| --- | --- | --- |
| `.pulse-sidebar` single rail | retained | Only global left rail |
| Module search | retained | Search tools; when active replaces grouped list |
| Family jump palette | removed-duplicate | Rainbow family shortcuts removed; groups remain collapsible |
| Favourites list block | removed-duplicate | Preference data retained via `nav-prefs`; star on canonical row remains |
| Recent list block | removed-duplicate | Recent still written via `pushRecent`; list not rendered |
| Favourite star beside module | retained | Sibling control (not nested in `<Link>`) |
| Role-based visibility | retained | `modulesVisibleForRole` |
| Enterprise group visibility | retained | `identitySeesEnterprise` |
| Action Inbox badge | retained | Count + urgent text for non-colour status |
| Active route indicator | retained | Champagne left edge on active row |
| Collapsible groups | retained | Persistence via `writeCollapsedGroups` |
| Sidebar open/close mobile | retained | Overlay + translate |
| Demo Act-as identity select | retained | Footer control |
| Canonical unique module links | retained | Deduped by `platformId` |
| Route aliases as sidebar entries | removed-duplicate | Aliases never listed; redirects remain routable |

## Dashboard

| Capability | Classification | Notes |
| --- | --- | --- |
| Command Centre title | retained | Single `h1` in CommandCentre |
| ModuleContextStrip (Quick find / Workflows / Insights / View / fav) | removed-duplicate | Equivalent: sidebar search + favourite star; workflows/insights covered by CC views |
| DashboardShellStrip first-viewport stack | relocated | `DashboardShellControlsPanel` inside “More dashboard detail” |
| Emergency banner | retained | Still above header when unresolved emergencies exist |
| View tabs (Command / My Day / KPI / Reports) | retained | Header tabs |
| Control bar (period, clinics, appearance, export, notifications, create action, customise, EOD) | retained | ControlBar |
| ≤4 executive indicators | retained | Primary PrioritySummary keys |
| Full 6-key Priority Summary | relocated | Full PrioritySummary in secondary disclosure |
| Priority Actions + filters | retained | Primary area |
| Operational health (clinics + executive) | retained | Primary area |
| Announcements carousel | relocated | Secondary disclosure |
| Categories / AI / positive / completed / trends | relocated | Secondary disclosure |
| Side panels (staffing, compliance, etc.) | relocated | Secondary disclosure |
| Private notes | relocated | Secondary disclosure |
| Management / shell status cards | relocated | Secondary disclosure |
| My Day / KPI / Reports views | retained | Via view tabs |
| Saved layout / customise | retained | ControlBar |
| Appearance Light/Dark/System | retained | ControlBar |

## M04–M07 section navigation

| Capability | Classification | Notes |
| --- | --- | --- |
| `?section=` deep links | retained | Unchanged resolve/navigate behaviour |
| Browser back/forward | retained | Search-param driven |
| Default section resolution | retained | Module resolvers unchanged |
| Section components | retained | Bodies unchanged |
| M05/M06 test ids | retained | `m05-nav-*` / `m06-nav-*` (hidden mirrors on compact) |
| M07 Planned / Available labels | retained | Badge + aria-label on ModuleSectionNav |
| M07 non-certified disclaimer | retained | Header meta |
| PPA-1 Adjustments section | retained | `ConnectedAdjustmentsSection` |
| Left 220px rails | removed-duplicate | Replaced by shared horizontal/mobile section nav |
| Actor name | relocated | Compact meta beside section nav (PageHeader remains authoritative title) |

## Appearance / alerts / aliases

| Capability | Classification | Notes |
| --- | --- | --- |
| Light / Dark / System | retained | Existing store |
| Semantic status colours | retained | Badge + text labels |
| Legacy aliases `/staff-pay`, `/m07` | retained | Routes still resolve; not sidebar duplicates |

No functional capability was silently deleted.
