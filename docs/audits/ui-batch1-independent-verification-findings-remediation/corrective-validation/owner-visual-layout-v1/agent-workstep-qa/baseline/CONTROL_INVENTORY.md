# Control inventory — Work-Step QA Phase 2 baseline

| Field | Value |
|---|---|
| Agent | Work-Step / Functional QA |
| Worktree | `/tmp/hcdp-fix/ui-batch1-vf-fixes` |
| Input SHA | `f837bdd08e1db30e68c63cfb2542e3120bc40d00` |
| App source SHA | `e6e2f90ea42f39ddab1d5ce39c1e306f214a1742` |
| Live target | `http://127.0.0.1:3000` (existing owner server; not stopped) |
| Method | Playwright Chromium via system Chrome + source cross-check |
| Evidence | `baseline/screenshots/`, `baseline/_raw-results.json` |

READ-ONLY against application source/tests. This inventory does **not** claim independent verification or merge readiness.

---

## 1. Emergency announcements (`EmergencyBanner`)

**Sources:** `src/components/workspaces/command-centre/PriorityAndAnnouncements.tsx` (`EmergencyBanner`), mounted from `CommandCentre.tsx` for `type === "Emergency" && !acknowledged`.

**Rendered DOM (1440×900 /dashboard):** banner `.cc-surface-danger` with label “Emergency announcement”; title observed: *Beachmere clinic temporary closure — utilities fault*.

| Control | Role | Disabled (observed) | Notes |
|---|---|---|---|
| Previous | `button` | **true** | `disabled={items.length < 2}` — single unacked emergency in seed |
| Next | `button` | **true** | Same as Previous |
| View All Announcements | `button` | false | Opens modal title “All Announcements” |
| Open Full Notice | `button` | false | Present on emergency banner |
| Acknowledge | `button` | false | Present |
| Withdraw notice | `button` | false | Present when `onWithdraw` provided |

**Also present:** non-emergency `AnnouncementCarousel` farther down page with its own Previous/Next/View All (separate from emergency banner).

**Screenshots:** `INV-desktop-1440x900-dashboard.png`, `WF-EMERGENCY-DESKTOP-banner.png`, `WF-EMERGENCY-MOBILE390-banner.png`, `*-view-all.png`.

---

## 2. Topbar (`Topbar.tsx` → `.pulse-top-ribbon`)

| Control | Kind | Desktop 1440 visible | Mobile 390 visible | Notes |
|---|---|---|---|---|
| Open menu (☰) | `button` aria-label=`Open menu` | false (`lg:hidden`) | **true** | Opens sidebar drawer |
| Brand “Doctors Pulse” | static | true | true | Compact brand block |
| Clinic scope | `select` aria-label=`Clinic scope` | true | true | All / groups / single |
| Search modules and sections | `input type=search` | true | true | Always-visible; Enter runs nav search — not a modal open/close |
| Dashboard | `a href=/dashboard` | true (sm+) | false in seg-mini | Ribbon center-right seg |
| Action Inbox [count] | `a href=/action-inbox` | true (sm+) | false in seg-mini | Badge count observed (e.g. 6) |
| + New Entry | `button` | true (md+) | false | Opens create form toast path |
| Export | `button` | true (md+) | false | Demo toast only |
| Enterprise Sign-In · MFA | `button` | true (lg+) | false | Demo toast only |
| Online / Offline | `button` aria-label Online\|Offline | true | true | Toggles `localStorage pulse.v31.online` |
| Appearance | — | **absent** | **absent** | Not in Topbar; see §5 |

---

## 3. Sidebar (`Sidebar.tsx` → `aside.pulse-sidebar`)

| Control | Kind | Notes |
|---|---|---|
| Find a module or section | `input type=search` | Sidebar search; Enter navigates first hit; Escape clears |
| Family group toggles | `button.v32-nav-toggle` aria-expanded | 12 groups observed; collapse persisted via nav prefs |
| Module links | `a.nav-btn` + `data-canonical-module` / `data-canonical-href` | Section nav to canonical routes |
| Favourite star | `button.v33-fav-star` | Per-module fav toggle |
| Mobile overlay | fixed backdrop | Closes drawer on click (`lg:hidden`) |
| Identity footer `.sidebar-user` | display name + role | Observed: Sarah Mitchell / Senior Administrator |
| Act as User / Role | `select` aria-label=`Act as User / Role` | Demo Act-as — not production auth |
| Sidebar width collapse | **not present** | Only family expand/collapse; no rail width toggle |

### Family groups / canonical module hrefs (DOM)

| Group | Expanded (default session) | Modules (label → href) |
|---|---|---|
| executive | true | Command Centre → `/dashboard`; Action Inbox → `/action-inbox` |
| organisation | true | Organisation & Access → `/settings` |
| people | true | Staff & Doctors → `/staff-doctors`; Training → `/training` |
| roster | true | Roster & Shifts → `/roster`; Time & Attendance → `/time-attendance` |
| operations | true | Tasks & Actions → `/tasks-actions`; Ticketing Desk → `/ticket-desk` |
| governance | true | Compliance & Quality; Documents & Policies; Incidents & Risk |
| assets | true | Inventory & Assets → `/inventory-assets` |
| communications | true | Communications → `/communications` |
| digital | true | Digital Operations → `/digital-ops` |
| analytics | true | Clinic Analytics → `/analytics` |
| commercial | true | Staff Pay → `/staffpay`; Doctor Pay → `/doctorpay`; BBPIP; Commercial SaaS |
| enterprise-extensions | **false** | Vendor Console; Recruitment; Website Studio; Financial Forecast |

### Act-as footer visibility

| Viewport | Fully in viewport (getBoundingClientRect) | Screenshot |
|---|---|---|
| 1440×900 | yes (top≈797, bottom=900, h≈103) | `WF-SIDEBAR-actas-1440x900.png` |
| 1440×720 | yes (top≈617, bottom=720, h≈103) | `WF-SIDEBAR-actas-1440x720.png` |
| 390×844 (drawer open) | drawer opens/closes; footer inside drawer | `WF-SIDEBAR-mobile-drawer-open.png` |

---

## 4. Canonical routes / headings (`PageHeader` + module registry)

| Route | HTTP | h1 observed |
|---|---|---|
| `/dashboard` | 200 | Owner/Director Command Centre |
| `/action-inbox` | 200 | Action Inbox & Notifications |
| `/settings` | 200 | Organisation, Locations, Users & Permissions |
| `/staffpay?section=overview` | 200 | Staff Pay & Payroll Preparation |
| `/staffpay?section=adjustments` | 200 | Staff Pay & Payroll Preparation |

M07 deep links use query `?section=` (not `/staff-pay`). Reload retains `section=adjustments`. Back/Forward between Dashboard ↔ Action Inbox works.

`PageHeader.tsx` renders `module.title` as `h1.hcdp-type-display` plus Action Inbox bell link.

---

## 5. Appearance controls

| Location | Control | Options |
|---|---|---|
| Command Centre control bar | `select[aria-label="Appearance"]` | Light / Dark / Device setting (`system`) |
| Topbar | **none** | — |
| Theme init | `theme-init-script.ts` + `pulse.cc.appearance` | Applies `html.theme-dark` / `data-appearance` before paint |

**Clean-storage default:** `data-appearance=light`, no `theme-dark`, select=Light.  
**Persistence:** Light/Dark/System survive reload (see WF-APPEARANCE).

---

## 6. Out of scope (inventory note)

External payments, payment providers, bank files, STP, superannuation, mark-as-paid, and live email/SMS communications are **OUT OF SCOPE** for this agent and must never be marked PASS (see WQA-007).

---

## Source cross-check summary

| Area | Primary files |
|---|---|
| Topbar | `src/components/shell/Topbar.tsx` |
| Sidebar | `src/components/shell/Sidebar.tsx` |
| Page header | `src/components/shell/PageHeader.tsx` |
| Theme init | `src/components/shell/theme-init-script.ts` |
| Emergency banner | `src/components/workspaces/command-centre/PriorityAndAnnouncements.tsx` |
| Appearance select | `src/components/workspaces/command-centre/ControlBar.tsx` |
| M07 sections | `src/modules/m07-staff-pay/StaffPayWorkspace.tsx` (`?section=`) |
| Module routes | `src/platform/module-registry/module-register.ts` (`mainRoute: /staffpay`) |
