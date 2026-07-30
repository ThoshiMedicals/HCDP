# HCDP Prototype vs Dashboard Parity Audit — 30 July 2026

**Lane:** Audit only — no production repairs, no accepted-evidence rewrites  
**Repository:** ThoshiMedicals/HCDP  
**Branch:** `agent/prototype-parity-audit-20260730`  
**Base:** clean `origin/main` @ `0afe878` (`docs(m07): add PPA prior-period adjustment implementation plan`)  
**Auditor role:** Independent Prototype Parity Auditor  

## Verdict

Live **HTML prototype** (`/pulse-html-prototype.html`, also framed at `/prototype` → `/prototype-reference`) is reachable and interactive. Live **Next dashboard** (`/dashboard` and all approved module routes) is **not usable** on the audited runtime: every portal route returns **HTTP 500** because webpack cannot resolve `node:crypto` pulled into the client graph via `ModuleWorkspace` → M06/M07.  

Parity comparison therefore combines:

1. **Live browser/Playwright evidence** for the prototype experience  
2. **Code-derived intended dashboard catalogue** from `PLATFORM_MODULES` / navigation / module entries (what the dashboard is designed to show when the shell compiles)  
3. Explicit separation of **intentional architecture consolidations** vs **genuine gaps**

The prototype is **not automatically authoritative** where Wave control, legacy redirects, and the module register intentionally consolidate or reject behaviours.

## Evidence locations

| Artefact | Path |
|---|---|
| Full Playwright evidence | `docs/audits/prototype-parity-20260730/parity-evidence.json` |
| Summary | `docs/audits/prototype-parity-20260730/parity-evidence-summary.json` |
| Intended dashboard catalogue | `docs/audits/prototype-parity-20260730/dashboard-intended-catalogue.json` |
| Screenshots | `docs/audits/prototype-parity-20260730/screenshots/` (28 PNGs) |
| Evidence script | `scripts/prototype-dashboard-parity-evidence.mjs` |
| Gap register | `docs/audits/HCDP_PROTOTYPE_VS_DASHBOARD_GAP_REGISTER_20260730.md` |
| Planning register (prior) | `docs/architecture/HCDP_PROTOTYPE_PARITY_REGISTER.md` |

### Exact test / browser evidence

| Check | Result |
|---|---|
| Base URL | `http://127.0.0.1:3000` (`npm run dev -- -p 3000 -H 127.0.0.1`) |
| `/dashboard` | HTTP **500**; screenshot `dashboard-1440.png` shows Next **Build Error** `UnhandledSchemeError: Reading from "node:crypto"` |
| `/prototype` | HTTP **500** (portal compile still fails before redirect UI can be used) |
| `/pulse-html-prototype.html#…` | **200** — primary live prototype surface for this audit |
| Prototype hashes probed | **50** (`parity-evidence.json` → `prototypeHashes`) |
| Approved dashboard routes probed | **24** — all status **500** |
| Widths | 1440, 1280, 1024, 768, 430, 390 (dashboard frames capture 500 overlay; prototype width sweeps captured) |
| Appearances | light / dark / system toggles applied via `theme-dark` / localStorage probe (dashboard body empty due to 500) |
| Browser MCP | Could not reach localhost (`chrome-error://`); Playwright Chromium used instead |
| Cursor browser IDE | Not used for localhost parity after MCP failure |

**Root cause of dashboard non-function (runtime defect, not repaired):**

```text
node:crypto
→ src/platform/workforce/contracts/published-timesheet-hash.ts
→ m06/m07 adapters
→ src/components/workspaces/ModuleWorkspace.tsx
→ UnhandledSchemeError under next dev --webpack
```

## Methodology

1. Read wave control, prototype parity register, module register, legacy redirects, ModuleWorkspace/ModuleLanding, M04–M07/M11 workspaces.  
2. Sync `origin/main`, reset/create `agent/prototype-parity-audit-20260730`.  
3. Run Playwright evidence script against localhost.  
4. Visually inspect prototype screenshots for consolidation hubs (Inventory OCR, Doctor Pay BP Sync, Staff Award Rules, Approvals, Tasks).  
5. Classify each gap: missing / partial / changed / duplicate / intentional / deferred / defect.  
6. Never count sidebar presence, route presence, ModuleLanding placeholder, or unwired button as “implemented”.

## Navigation & grouping

### Prototype (live)

Observed nav families at `#dashboard`:

- Executive Command Centre  
- Operations  
- People & Talent  
- Rostering & Attendance  
- Assets & Facilities  
- Website & Digital Experience  
- Governance  
- Finance & Forecasting  
- Communications  
- Security & Access  
- Organisation & Tenant  
- SaaS Vendor Administration  

**Still present as separate left-nav entries** (despite hub consolidations in content): Tasks, Checklists, Opening / Closing, Approvals, HR Documents, Inventory, Stock, Equipment, Rooms, Offline Reconciliation, etc. (`hasApprovalsNav: true`; `hasDepartmentsNav: false`).

### Dashboard (intended / code)

`NAV_GROUPS` / `PLATFORM_MODULES` use **24 approved main routes** grouped as:

Executive → Organisation → People → Roster → Operations → Governance → Assets → Communications → Digital → Analytics → Commercial → Enterprise Extensions  

Consolidations encoded in `legacy-routes.ts` and module sections:

| Product reference | Dashboard disposition | Classification |
|---|---|---|
| Tasks + Checklists combined | `/tasks-actions` (+ legacy `/tasks`,`/checklists`) | intentional |
| Opening/Closing inside Checklists | section `opening-closing` on `/tasks-actions` | intentional |
| Approvals removed as duplicate | `/approvals` → `/action-inbox?category=Approval` | intentional |
| Departments removed from daily nav | not a top-level approved slug; lives under Organisation & SaaS sections | intentional |
| HR Docs / Leave / Award inside Staff | `/staff-doctors` sections credentials, leave-availability; award rules relocated toward M07 Settings (parity register Q23) | intentional / changed |
| Finance Admin/Inventory/Stock/Transfers/Equipment/Printers → Inventory & Assets | `/inventory-assets` with sections including printers | intentional |
| Doctor Pay BP → calc → reconcile → approve → payslip email → manual bank | M08 `legacy-html-fallback` / ModuleLanding only; prototype has interactive sample | deferred + missing (interactive) |
| BBPIP BP extract + forecast/reconcile | M09 ModuleLanding only | deferred + missing (interactive) |
| Inventory OCR | Prototype hub has OCR; dashboard landing has no OCR UI | missing |
| Printer Management detailed fields | Prototype `#printers` tabs Fleet/Work Orders/Network/Toner; dashboard section label only | missing |

## Module condition rollup (dashboard register)

From `dashboard-intended-catalogue.json`:

| Condition | Count | Notes |
|---|---:|---|
| complete-interactive-rebuild | 6 | M01–M06 marked complete in register |
| partially-implemented | 4 | M07, M10, M12, M16 |
| legacy-html-fallback | 14 | Includes M08/M09/M11/M13–M15/M17–M24 — **note M11 Training actually mounts `TrainingWorkspace` despite this label** |

**Live blocker:** none of the above are browsable while ModuleWorkspace fails to compile.

## Screen / control comparison (high level)

| Area | Prototype behaviour (live) | Dashboard behaviour (intended + evidence) | Gap class |
|---|---|---|---|
| Executive Command Centre | Dense HTML “Good morning” / health / actions | M01 React Command Centre (complete) — **unreachable (500)** | defect (runtime) + deferred visual parity |
| Action Inbox | Interactive queue | M02 React — unreachable | defect |
| Approvals top-level | Still in left nav + `#approvals` page | Removed; redirect to Action Inbox | intentional (proto still duplicate) |
| Staff hub | Directory + HR Docs + Leave + Award Rules tabs | M04 workspace with credentials & leave; **no Award Rules tab** (relocated to M07 settings per register) | changed / intentional |
| Roster / Time | Interactive HTML | M05/M06 complete workspaces — unreachable | defect |
| Staff Pay | HTML control tower | M07 Batch 1–6 React sections (overview…export/recon/lock) — unreachable | defect + known non-certification |
| Doctor Pay | BP Sync, Create Pay Run, sandbox calc, approval, payslip/manual bank narrative | ModuleLanding stub only | missing / deferred (M08 not authorised) |
| BBPIP | Forecast/reconcile flows in HTML | ModuleLanding stub | missing / deferred |
| Tasks & Checklists | Merged workspace + opening tab; nav still fragmented | `/tasks-actions` + partial Next panels / HTML seeds | partial |
| Inventory & Assets | OCR + invoices + stock + transfers + equipment + printers | ModuleLanding section chips only; no OCR | missing / partial |
| Printers | Full fleet/network/support fields | Section id only under inventory-assets | missing |
| Training | HTML + BRD flows | Real `TrainingWorkspace` (Wave 3) but register still `legacy-html-fallback` | changed (register drift) |
| Enterprise modules | Present in proto nav | Role-gated Enterprise Extensions | intentional / deferred depth |

## Working vs decorative

- Prototype: many buttons mutate localStorage seed state (simulation). Per parity register, this **never** counts as IMPLEMENTED-EVIDENCED.  
- Dashboard ModuleLanding: section chips are navigational only; “Rebuild pending” banner points to `/prototype-reference`.  
- M07 React (when compilable): service-backed prep actions exist with wave evidence — **not** payment execution.  
- Doctor Pay / BBPIP / Inventory OCR on dashboard: decorative/absent relative to prototype.

## State persistence & reset

| Surface | Observation |
|---|---|
| Prototype | `localStorage` store key includes consolidated inventory OCR (`hdp_operations_portal_v17_consolidated_inventory_ocr`); favourites/recents persist |
| Dashboard | Nav prefs / collapse / identity stores exist in shell code; **not verified live** due to 500 |
| Reset | Prototype reset/sim controls present in HTML; dashboard has module-local stores for M04–M07 — unverified live |

## Permissions & role visibility

- Prototype: role select / restricted routes (`routeAllowedV33`) for productAssurance, documents, ticketDesk, meetings.  
- Dashboard: `modulesVisibleForRole`, enterprise role gates on M21–M24.  
- Live role sweep: no usable sidebar under 500; script recorded inability to exercise role `<select>` on dashboard.

## Cross-module links / projections

- Architecture: M04/M05/M06/M07 → M02 inbox adapters (frozen/accepted for Waves 2–6 within qualifications).  
- Prototype: Action Inbox panels and “Open source” style links in module chrome.  
- Live dashboard projections: **not exercised** (compile failure).

## Responsive & appearance

| Width | Prototype HTML | Dashboard |
|---|---|---|
| 1440 / 1280 | Usable dense shell | 500 overlay |
| 1024 / 768 | Sidebar collapse patterns in CSS | 500 overlay |
| 430 / 390 | Mobile sidebar off-canvas | 500 overlay |

Light/dark/system: Command Centre appearance store exists (`theme-dark`); prototype has its own executive themes. Live dashboard appearance screenshots only show error chrome.

## Empty / loading / error / permission-denied

- Prototype empty states observed (e.g. Doctor Pay “No doctor pay command centre found”, Inventory “No expiring items yet”).  
- Dashboard: **error state dominates** — Build Error overlay; permission-denied and empty states not reachable.  
- ModuleLanding (code): rebuild-pending callout for non-complete modules.

## Keyboard / basic a11y

- Prototype: nav buttons, family jumps, search; not WCAG-certified.  
- Dashboard keyboard Tab smoke: ran against 500 page — no meaningful focus targets in app chrome.  
- Code a11y: M07 shell has prior a11y evidence artefacts; not re-validated live.

## Architecture superseding prototype (do not call “missing”)

1. Approvals as standalone daily nav → Action Inbox category  
2. Separate Tasks / Checklists / Front Desk routes → `/tasks-actions` sections  
3. Separate Inventory / Stock / Equipment / Rooms → `/inventory-assets`  
4. HR Documents top-level → Staff credentials  
5. Departments as daily nav → Organisation / SaaS sections only  
6. Award rules nested under Staff hub in prototype → M07 Settings ownership (Q23) while M04 remains classification SoT  
7. Process Final Pay / bank execution / STP / mark-as-paid → rejected under M07 boundary  
8. Doctor pay inside M07 → M08 (not authorised to begin)  
9. Ordinary unlock as PPA → rejected; PPA planning-only  

## Critical findings (owner attention)

1. **DEFECT-RUNTIME-001 (Critical):** Dashboard and portal module routes non-functional under `next dev --webpack` due to `node:crypto` client bundling. Blocks all interactive dashboard parity verification.  
2. **Prototype nav inconsistency:** Consolidated hubs exist, but left nav still lists Approvals and fragmented asset/ops items — product direction is only partially reflected in the prototype chrome.  
3. **Large interactive depth gap** for M08–M10, M12–M24 vs prototype (mostly ModuleLanding / HTML-fallback).  
4. **M11 register drift:** Training is a real workspace but still labelled `legacy-html-fallback`.  
5. **M07** is the deepest finance rebuild vs prototype; still non-certified; Adjustments/History planned; PPA not authorised.

## What was not claimed

- Production approval  
- Monetary/statutory certification  
- That prototype simulation equals implemented behaviour  
- That unlock/reopen equals PPA  
- That fixing the webpack defect was in scope (explicitly out of scope)

## Recommended next owner actions (outside this lane)

1. Authorise a **focused defect CR** for `node:crypto` / ModuleWorkspace client boundary (touches frozen M06/M07 import surface — requires impact analysis).  
2. Re-run this evidence script once dashboard compiles.  
3. Prioritise parity batches by gap register severities (see companion register).  

## Stop

Audit outputs committed on `agent/prototype-parity-audit-20260730` only. **Do not merge** from this lane. No production source repaired.
