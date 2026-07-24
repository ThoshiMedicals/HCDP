# Platform Integration Plan

**Stage:** Platform Integration Spine and 24-Module Navigation Consolidation  
**Date:** 24 July 2026  
**Baseline:** `CURRENT_PLATFORM_INVENTORY.md`  
**App root:** `Development folder/`

This plan is written **before** code changes. Goal: one shared integration foundation, 24-module sidebar, preserve Modules 1–3 behaviour, prepare Action Inbox / Command Centre contracts, remove user-facing HTML mode without deleting the prototype.

---

## 1. Files expected to change

| Area | Path | Change |
|---|---|---|
| Module catalogue | `src/lib/modules.ts` | Thin compatibility layer over new register (labels, `getModule`, family palette) |
| Dynamic route | `src/app/(portal)/[module]/page.tsx` | Legacy alias redirects + section query; register-driven params |
| Module shell | `src/components/workspaces/ModuleWorkspace.tsx` | Remove HTML/Next toggle; force Next; landing screens for unfinished modules |
| Sidebar | `src/components/shell/Sidebar.tsx` | 20 core + collapsible Enterprise Extensions; identity-aware visibility; search aliases |
| Topbar | `src/components/shell/Topbar.tsx` | Shared clinic selector; remove Full HTML control; search via register |
| Portal layout | `src/app/(portal)/layout.tsx` | Wrap shared clinic + identity providers |
| Portal context | `src/lib/portal-context.tsx` | Adapter: sync `activeLocationId` ↔ shared clinic context (keep API for M1–3) |
| Nav prefs | `src/lib/shell/nav-prefs.ts` | Migrate favourites/recents to approved module IDs; identity coordination |
| Action Inbox app | `src/components/workspaces/action-inbox/ActionInboxApp.tsx` | Read global identity for demoRole / sensitivity; keep local permission logic |
| Organisation context | `src/lib/organisation/context.tsx` | Sync demo actor from global identity; emit inbox events on selected records |
| Organisation store | `src/lib/organisation/store.ts` | Hooks for inbox projection updates (non-destructive) |
| Command Centre | `src/components/workspaces/command-centre/*` (minimal) | Show Module 2 summary projection; keep existing M1 actions |
| CC storage | `src/lib/command-centre/storage.ts` | Compatibility adapter for shared clinic multi-select |
| Prototype page | `src/app/prototype/page.tsx` | Redirect or label as legacy; primary reference → `/prototype-reference` |
| Organisation alias | `src/app/(portal)/organisation/page.tsx` | Unchanged redirect intent |

**Do not redesign** completed Module 1–3 workspaces beyond integration adapters and summary/projection wiring.

---

## 2. New shared files expected to be created

| Path | Purpose |
|---|---|
| `src/lib/platform/module-register.ts` | Authoritative 24-module register |
| `src/lib/platform/legacy-routes.ts` | Legacy slug → main route + section map |
| `src/lib/platform/clinic-context.tsx` | Shared clinic selection store + React provider |
| `src/lib/platform/identity-context.tsx` | Global Act as User / Role demonstration identity |
| `src/lib/platform/source-record.ts` | Shared source-record reference type + helpers |
| `src/lib/platform/action-inbox-bridge.ts` | Create/update Action Inbox projections from source modules |
| `src/lib/platform/executive-summary.ts` | Module 2 → Module 1 summary projection interface |
| `src/lib/platform/notifications.ts` | Shared notification publishing interface (writes M2 store) |
| `src/lib/platform/audit.ts` | Shared audit-event structure + M1–3 adapters |
| `src/lib/platform/storage.ts` | Versioned, idempotent migration helpers |
| `src/lib/platform/nav-search.ts` | Module + section + legacy-term search index |
| `src/lib/platform/org-inbox-sync.ts` | Controlled Module 3 → Module 2 demo connection |
| `src/lib/platform/index.ts` | Barrel exports |
| `src/components/workspaces/ModuleLanding.tsx` | Rebuild-pending landing standard |
| `src/components/platform/ClinicScopeControl.tsx` | Scope label UI (All / Group / Single / Multiple) |
| `src/components/platform/ActAsIdentityControl.tsx` | Global Act as User / Role control |
| `src/components/workspaces/command-centre/InboxProjectionSummary.tsx` | M2 counts in M1 |
| `src/app/prototype-reference/page.tsx` | Dev/QA HTML prototype reference (not in sidebar) |
| `PLATFORM_STORAGE_REGISTER.md` | Document all new/migrated keys |

---

## 3. Storage migration strategy

| Concern | Approach |
|---|---|
| Prefixes | `pulse.platform.*` (shared); keep `pulse.cc.*`, `pulse.m2.inbox.*`, `pulse.org.m3.*` |
| Clinic | New key `pulse.platform.context.clinics` (versioned JSON). Read `pulse.activeLocation` and `pulse.cc.selectedClinics` once; migrate into shared shape. **Do not delete** old keys in this stage. |
| Identity | New key `pulse.platform.context.identity`. Seed from `pulse.v27.executiveRole`, M2 `demoRole` / `canSeeSensitive`, Org demo actor when present. Write-through adapters update module-local keys so existing readers keep working. |
| Favourites / recents | Migrate `pulse.v33.navPrefs` htmlIds → approved module IDs via mapping table; idempotent version flag `pulse.platform.migrations.navPrefs.v1`. |
| Safety | All migrations: version stamped, idempotent, try/catch invalid JSON, fall back to seeds. Never wipe M1/M2/M3 business records. |
| Reset | Existing M1/M2/M3 reset controls unchanged; platform keys reset only via documented helpers if demo reset is extended later. |

---

## 4. Route compatibility strategy

1. **One main route per approved module** (see register).
2. **Legacy aliases** handled in `[module]/page.tsx` (and/or middleware-free redirect):
   - Redirect to main route
   - Append `?section=<id>` (and preserve other query params / record id when present)
   - Clinic context is global (localStorage) — not lost on redirect
3. Keep `/approvals` → `/action-inbox?category=Approval`
4. Keep `/organisation` → `/settings`
5. Keep `/dashboard`, `/action-inbox`, `/settings` as M1–M3 main routes (no rename risk)
6. Incomplete modules: Next `ModuleLanding` (not iframe); `/prototype-reference` for HTML QA

---

## 5. Navigation consolidation map

### Core sidebar (20)

| # | Display name | Main route |
|---|---|---|
| 1 | Executive Command Centre | `/dashboard` |
| 2 | Action Inbox & Notifications | `/action-inbox` |
| 3 | Organisation, Locations, Users & Permissions | `/settings` |
| 4 | Staff & Doctor Management | `/staff-doctors` |
| 5 | Roster & Shift Management | `/roster` |
| 6 | Time & Attendance | `/time-attendance` |
| 7 | Staff Pay & Payroll Preparation | `/staffpay` |
| 8 | Doctor Pay Command Centre | `/doctorpay` |
| 9 | BBPIP Forecast & Reconciliation | `/bbpip` |
| 10 | Tasks, Checklists, Meetings & Actions | `/tasks-actions` |
| 11 | Training & Learning Management | `/training` |
| 12 | Accreditation, Quality & Regulatory Compliance | `/compliance-quality` |
| 13 | Documents, Policies, SOPs & Intake | `/documents-policies` |
| 14 | Ticketing Desk & Work Orders | `/ticket-desk` |
| 15 | Inventory, Suppliers, Finance & Assets | `/inventory-assets` |
| 16 | Incidents, Complaints, Risk & Continuity | `/incidents-risk` |
| 17 | Email & SMS Communications | `/communications` |
| 18 | Digital Operations & Security | `/digital-ops` |
| 19 | Clinic Analytics, Data Quality & Change | `/analytics` |
| 20 | Commercial SaaS & Organisation Workspaces | `/saas` |

### Enterprise Extensions (collapsible, authorised only)

| # | Display name | Main route |
|---|---|---|
| 21 | SaaS Vendor Operations & Tenant Provisioning | `/vendor-console` |
| 22 | Recruitment & Talent Acquisition | `/recruitment` |
| 23 | Tenant Website Infrastructure & SEO Engine | `/website-studio` |
| 24 | Practice Financial Forecast & Ledger Control | `/financial-forecast` |

### Internal sections (examples — full list in register)

- M10: tasks, checklists, opening-closing, handovers, meetings, meeting-actions  
- M4: staff, doctors, staff-profiles, doctor-profiles, employment, credentials, hr-documents, availability, offboarding  
- M6: attendance, clock-events, timesheets, exceptions, offline-reconciliation  
- … (see register / Part 3 of stage brief)

**Removed as top-level nav:** Approvals, Opening/Closing, HR Documents, Offline Reconciliation, Expiry Centre, Audit Log, Risk Centre, Emergency Control, Inventory/Stock/Equipment/Rooms/Printers, Email/SMS/CommBook/Noticeboards, Website Monitoring — all become sections or legacy aliases.

---

## 6. Risk of breaking Modules 1–3

| Risk | Mitigation |
|---|---|
| Clinic selector rewrite breaks CC multi-select | Compatibility adapter: shared context updates `pulse.cc.selectedClinics` and `pulse.activeLocation`; CC continues reading its key |
| Identity rewrite breaks Inbox / Org permissions | Modules keep local permission functions; they **read** global identity via adapters that also write legacy keys |
| Route rename of M1–3 | **Do not rename** `/dashboard`, `/action-inbox`, `/settings` |
| Sidebar favourites pointing at old htmlIds | Migration maps to module IDs; unknown entries dropped safely |
| M3→M2 bridge duplicates records | Bridge creates **inbox projections** only; source remains in `pulse.org.m3.state`; deep link back via source-record |
| M2 counts appear as editable M1 duplicates | Projection UI is read-only summary + link to M2; M1 executive-only store untouched |
| Static params / notFound on new routes | Register drives `generateStaticParams` + legacy redirect table |
| HTML toggle removal confuses QA | `/prototype-reference` clearly labelled Development / QA Reference |

---

## 7. Rollback approach

1. Revert git commit(s) for this stage (single cohesive commit recommended when user requests).  
2. Old storage keys remain intact — no destructive deletes.  
3. If shared clinic/identity keys are corrupt: delete `pulse.platform.context.*` only; adapters re-migrate from legacy keys.  
4. Prototype file and `/prototype` remain until explicitly removed; reference route is additive.  
5. Feature flags are not required: behaviour is register-driven; emergency rollback = restore previous `modules.ts` + Sidebar + ModuleWorkspace.

---

## 8. Testing plan

| Suite | Checks |
|---|---|
| Navigation | All 24 modules by role; enterprise hidden for staff/auditor; no duplicate top-level; legacy routes + Approvals |
| Clinic | All / single / group / multi; persistence across modules; M1–M3 still filter |
| Identity | Director, Senior Admin, Clinic Manager, Staff, Auditor, Vendor Admin; sensitivity, bulk actions, enterprise visibility |
| M3→M2 | Access request, review, security alert → inbox item → open source → update projection → audit + notification; no duplicate business record |
| M2→M1 | Open/overdue/urgent counts; click to M2; no duplicate editable operational action in M1 |
| HTML | No user-facing HTML mode; incomplete modules show landing; `/prototype-reference` works; prototype file present |
| Responsive | 1440, 1280, 1024, 768, 430, 390 |
| Build | `npm run build` — fix stage-caused errors |

---

## 9. Implementation order (this stage)

1. Create this plan (done).  
2. Platform storage helpers + module register + legacy routes.  
3. Clinic + identity contexts + providers.  
4. Contracts: source-record, inbox events, notifications, audit, executive summary.  
5. Consolidate Sidebar / Topbar / search / favourites migration.  
6. ModuleWorkspace + ModuleLanding + route redirects; prototype-reference.  
7. Wire M3→M2 demo connection; M2→M1 projection UI.  
8. Storage register doc; build + manual test checklist; completion report.

**Out of scope:** detailed reconstruction of Modules 4–24 internals.
