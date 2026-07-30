# HCDP Prototype vs Dashboard Gap Register — 30 July 2026

**Companion audit:** `docs/audits/HCDP_PROTOTYPE_VS_DASHBOARD_PARITY_AUDIT_20260730.md`  
**Evidence folder:** `docs/audits/prototype-parity-20260730/`  
**Base commit:** `0afe878`  
**Branch:** `agent/prototype-parity-audit-20260730`  

### Field legend

| Field | Meaning |
|---|---|
| Classification | missing / partial / changed / duplicate / intentional / deferred / defect |
| Severity | critical / high / medium / low / info |
| Frozen touch? | Would remediation alter Waves 1A–5 or accepted M07 Batches 1–6 ordinary prep? |
| File collision risk | Likelihood of merge conflict with active module work |

---

## GAP-001 — Dashboard portal compile failure (`node:crypto`)

| Field | Value |
|---|---|
| ID | GAP-001 |
| Module/route | Platform shell / all `/dashboard` + approved module routes + `/prototype` via portal graph |
| Prototype behaviour | HTML SPA loads and is interactive at `/pulse-html-prototype.html` |
| Dashboard behaviour | HTTP 500; Next Build Error `UnhandledSchemeError: Reading from "node:crypto"` via `published-timesheet-hash.ts` → ModuleWorkspace |
| Classification | defect |
| Severity | critical |
| User impact | Entire Next dashboard unusable; owner cannot compare live UI; modules unreachable |
| Evidence | `parity-evidence.json` (24/24 routes status 500); `screenshots/dashboard-1440.png`; next-dev log import trace |
| Likely owning module | Platform / workforce contracts (M06–M07 import boundary) |
| Recommended future batch | Urgent defect CR before further module UI work |
| File collision risk | High — `ModuleWorkspace.tsx`, M06/M07 index barrels, `published-timesheet-hash.ts` |
| Frozen accepted behaviour touched? | **Yes if fixed carelessly** — M06 publisher / M07 intake hash path is accepted surface; needs impact analysis |

---

## GAP-002 — Approvals still top-level in prototype nav

| Field | Value |
|---|---|
| ID | GAP-002 |
| Module/route | Prototype `#approvals` vs dashboard `/approvals` → `/action-inbox` |
| Prototype behaviour | Left nav still lists Approvals; dedicated Approvals page exists |
| Dashboard behaviour | Approvals removed from approved main slugs; legacy redirect to Action Inbox category |
| Classification | duplicate (prototype) / intentional (dashboard) |
| Severity | medium (proto confusion) / info (dashboard) |
| User impact | Prototype teaches a duplicate approvals inbox; dashboard correctly consolidates |
| Evidence | `prototypeHashes[approvals]`; `legacy-routes.ts`; screenshot `proto-approvals-1440.png` |
| Likely owning module | M02 Action Inbox + prototype HTML maintenance |
| Recommended future batch | Prototype nav cleanup (docs/HTML) — not M02 behaviour change |
| File collision risk | Low for dashboard; medium for HTML prototype file |
| Frozen accepted behaviour touched? | No (if only prototype chrome cleaned) |

---

## GAP-003 — Tasks / Checklists / Opening-Closing fragmented in prototype nav

| Field | Value |
|---|---|
| ID | GAP-003 |
| Module/route | `#tasks` / `#checklists` / `#frontdesk` vs `/tasks-actions` |
| Prototype behaviour | Hub merges Tasks & Checklists with Opening tab; **nav still shows separate Tasks, Checklists, Opening/Closing** |
| Dashboard behaviour | Single `/tasks-actions` with sections; legacy redirects for old slugs |
| Classification | partial (proto) / intentional (dashboard route model) |
| Severity | medium |
| User impact | Users see conflicting IA between chrome and hub content |
| Evidence | `proto-tasks-1440.png`; navLabels include Tasks/Checklists/Opening; `legacy-routes.ts` |
| Likely owning module | M10 + prototype HTML |
| Recommended future batch | Prototype nav alignment + M10 interactive rebuild |
| File collision risk | Medium |
| Frozen accepted behaviour touched? | No |

---

## GAP-004 — Tasks & Actions interactive depth on dashboard

| Field | Value |
|---|---|
| ID | GAP-004 |
| Module/route | `/tasks-actions` (M10) |
| Prototype behaviour | Create Task, checklist wizard, opening/closing duties, manager review, meetings flows |
| Dashboard behaviour | `partially-implemented`: ModuleLanding + partial `TasksWorkspace` / `ChecklistsWorkspace` seeds; not full service-backed ops |
| Classification | partial / missing (depth) |
| Severity | high |
| User impact | Daily ops staff cannot run prototype-equivalent workflows in Next |
| Evidence | `TasksActionsModule.tsx`; `ModuleWorkspace` PartialBody; register condition |
| Likely owning module | M10 |
| Recommended future batch | Post-M07 authorised M10 rebuild batch |
| File collision risk | Medium |
| Frozen accepted behaviour touched? | No |

---

## GAP-005 — Inventory & Assets OCR missing on dashboard

| Field | Value |
|---|---|
| ID | GAP-005 |
| Module/route | `#inventory` vs `/inventory-assets` |
| Prototype behaviour | “Scan Document / OCR”, Inventory OCR tab, row entry, supplier invoices, stock, transfers, equipment, printers |
| Dashboard behaviour | ModuleLanding section chips only; no OCR UI; condition `legacy-html-fallback` |
| Classification | missing |
| Severity | high |
| User impact | No invoice/OCR intake path in developed app |
| Evidence | `proto-inventory-1440.png`; `hasOcr: true` on inventory hash; `InventoryAssetsModule.tsx` |
| Likely owning module | M15 |
| Recommended future batch | M15 interactive rebuild (OCR first) |
| File collision risk | Low–medium |
| Frozen accepted behaviour touched? | No |

---

## GAP-006 — Printer Management detail missing on dashboard

| Field | Value |
|---|---|
| ID | GAP-006 |
| Module/route | `#printers` vs `/inventory-assets?section=printers` |
| Prototype behaviour | Tabs: Fleet Register, Work Orders, Network Map, Toner & Counters; hostname/queue/VLAN/fallback fields |
| Dashboard behaviour | Section label “Printers” on landing only |
| Classification | missing |
| Severity | medium |
| User impact | Clinic printer fleet/network/support data not operable in Next |
| Evidence | `prototypeHashes[printers].tabs`; MODULES.printers in HTML |
| Likely owning module | M15 |
| Recommended future batch | M15 printers sub-batch |
| File collision risk | Low |
| Frozen accepted behaviour touched? | No |

---

## GAP-007 — Stock / Equipment / Rooms still separate in prototype nav

| Field | Value |
|---|---|
| ID | GAP-007 |
| Module/route | `#stock` `#equipment` `#rooms` vs consolidated `/inventory-assets` |
| Prototype behaviour | Consolidated Inventory & Assets hub **and** separate nav buttons for Stock/Equipment/Rooms |
| Dashboard behaviour | Single Inventory & Assets module + legacy redirects |
| Classification | duplicate (proto nav) / intentional (dashboard) |
| Severity | low–medium |
| User impact | Prototype overstates fragmentation; dashboard IA is the consolidation target |
| Evidence | navLabels; `legacy-routes.ts`; module register M15 |
| Likely owning module | Prototype HTML / M15 |
| Recommended future batch | Prototype nav cleanup |
| File collision risk | Low |
| Frozen accepted behaviour touched? | No |

---

## GAP-008 — Staff hub Award Rules (prototype) vs M07 Settings (architecture)

| Field | Value |
|---|---|
| ID | GAP-008 |
| Module/route | `#staff` Award Rules tab vs `/staff-doctors` + `/staffpay?section=settings` |
| Prototype behaviour | Award Rules nested inside Staff Management hub |
| Dashboard behaviour | M04 has credentials & leave; no Award Rules section; parity register relocates prep rules to M07 Settings (Q23) |
| Classification | intentional / changed |
| Severity | info–medium |
| User impact | Looking for Award Rules under Staff on dashboard is expected to fail; use M07 Settings when available |
| Evidence | `hasAwardRules: true` on `#staff`; M04 section list; parity register §3.2 |
| Likely owning module | M04 (classification SoT) / M07 Settings |
| Recommended future batch | UX copy/deep-link from Staff → M07 Settings after GAP-001 |
| File collision risk | Medium (M07 settings) |
| Frozen accepted behaviour touched? | **Possibly** if M04/M07 contracts changed — prefer link-only |

---

## GAP-009 — HR Documents top-level vs Staff credentials

| Field | Value |
|---|---|
| ID | GAP-009 |
| Module/route | `#hrDocs` vs `/staff-doctors?section=credentials` |
| Prototype behaviour | Separate HR Documents nav item remains |
| Dashboard behaviour | Legacy `/hr-docs` → staff-doctors credentials; M04 Credentials section service-backed (Wave 2) |
| Classification | intentional (dashboard) / duplicate (proto nav) |
| Severity | low |
| User impact | Bookmark/HR Docs still works via redirect when shell compiles |
| Evidence | `legacy-routes.ts`; M04 CredentialsSection |
| Likely owning module | M04 |
| Recommended future batch | Prototype nav cleanup |
| File collision risk | Low |
| Frozen accepted behaviour touched? | No if redirect-only |

---

## GAP-010 — Leave / Away Days placement

| Field | Value |
|---|---|
| ID | GAP-010 |
| Module/route | Staff Leave tab vs M04 `leave-availability` (+ roster availability) |
| Prototype behaviour | Leave / Away inside Staff hub |
| Dashboard behaviour | M04 Leave & Availability (accepted Wave 2); roster also has availability/leave section |
| Classification | intentional / changed (split with roster views) |
| Severity | low |
| User impact | Leave exists in Staff; roster mirrors availability — not a single missing feature |
| Evidence | M04 workspace nav; module register sections |
| Likely owning module | M04 / M05 |
| Recommended future batch | UX clarity only |
| File collision risk | Low |
| Frozen accepted behaviour touched? | Avoid behaviour change without CR |

---

## GAP-011 — Doctor Pay interactive workflow absent on dashboard

| Field | Value |
|---|---|
| ID | GAP-011 |
| Module/route | `#doctorpay` vs `/doctorpay` |
| Prototype behaviour | BP Sync, Create Pay Run, sandbox calculation, owner approval, payslip/manual bank narrative |
| Dashboard behaviour | ModuleLanding stub; condition `legacy-html-fallback`; Module 8 **not authorised** to begin under wave control |
| Classification | deferred / missing (interactive) |
| Severity | high (product expectation) / info (governance: correctly deferred) |
| User impact | Finance cannot run doctor pay in Next; must use prototype reference only |
| Evidence | `proto-doctorpay-1440.png`; `DoctorPayModule.tsx`; wave-control “Do not begin Module 8” |
| Likely owning module | M08 |
| Recommended future batch | Explicit M08 authorisation batch |
| File collision risk | Low today |
| Frozen accepted behaviour touched? | No (new module) |

---

## GAP-012 — BBPIP interactive forecast/reconciliation absent on dashboard

| Field | Value |
|---|---|
| ID | GAP-012 |
| Module/route | `#bbpip` vs `/bbpip` |
| Prototype behaviour | Forecast, gaps, reconciliation sample flows |
| Dashboard behaviour | ModuleLanding only |
| Classification | deferred / missing |
| Severity | high |
| User impact | No Next BBPIP operational workspace |
| Evidence | `proto-bbpip-1440.png`; `BbpipModule` pattern same as M08 landing |
| Likely owning module | M09 |
| Recommended future batch | After M08 or owner-prioritised commercial batch |
| File collision risk | Low |
| Frozen accepted behaviour touched? | No |

---

## GAP-013 — Staff Pay: prototype vs M07 React (when compilable)

| Field | Value |
|---|---|
| ID | GAP-013 |
| Module/route | `#staffpay` vs `/staffpay` |
| Prototype behaviour | HTML prep tower including rejected/deferred cues (final pay, Xero-ish export) |
| Dashboard behaviour | M07 Batches 1–6 React sections (overview, people, leave, exceptions, variances, approval, export, reconciliation, settings); Adjustments/History planned; non-certified; PPA not implemented |
| Classification | partial / intentional differences |
| Severity | medium (proto overclaims) / low (M07 within closed scope) |
| User impact | When shell works, Next is the authoritative prep path — not HTML simulation |
| Evidence | `StaffPayWorkspace.tsx`; section-meta; Wave 6 audits; parity register REJECTED list |
| Likely owning module | M07 |
| Recommended future batch | PPA only when expressly authorised; History/Adjustments as planned |
| File collision risk | High on M07 tree |
| Frozen accepted behaviour touched? | **Yes** if ordinary prep behaviour altered — require CR |

---

## GAP-014 — Departments removed from daily navigation

| Field | Value |
|---|---|
| ID | GAP-014 |
| Module/route | Departments |
| Prototype behaviour | `hasDepartmentsNav: false` on live sample; departments remain as task form options / SaaS concepts |
| Dashboard behaviour | Not an approved top-level slug; Organisation section “Departments & Rooms”; SaaS “Departments” |
| Classification | intentional |
| Severity | info |
| User impact | None as a gap — correctly de-emphasised |
| Evidence | prototypeHashes `hasDepartmentsNav`; module register M03/M20 |
| Likely owning module | M03 / M20 |
| Recommended future batch | None |
| File collision risk | n/a |
| Frozen accepted behaviour touched? | No |

---

## GAP-015 — Offline Reconciliation separate in prototype

| Field | Value |
|---|---|
| ID | GAP-015 |
| Module/route | `#syncCentre` / Offline Reconciliation vs `/time-attendance` settings/sync |
| Prototype behaviour | Separate nav item “Offline Reconciliation” |
| Dashboard behaviour | Consolidated into Time & Attendance (legacy `/sync-centre` → time-attendance) |
| Classification | intentional |
| Severity | low |
| User impact | Bookmark still redirects when shell works |
| Evidence | `legacy-routes.ts`; M06 sections |
| Likely owning module | M06 |
| Recommended future batch | Prototype nav cleanup |
| File collision risk | Low |
| Frozen accepted behaviour touched? | Avoid M06 behaviour change |

---

## GAP-016 — Training register condition drift

| Field | Value |
|---|---|
| ID | GAP-016 |
| Module/route | `/training` (M11) |
| Prototype behaviour | Full HTML training module |
| Dashboard behaviour | `TrainingModule` → `TrainingWorkspace` (Wave 3 accepted) but register `condition: legacy-html-fallback` |
| Classification | changed (label incorrect) |
| Severity | medium (governance accuracy) |
| User impact | Owners may under-count Training as unimplemented |
| Evidence | `TrainingModule.tsx`; module-register.ts; Wave 3 completion reports |
| Likely owning module | Platform registry / M11 |
| Recommended future batch | Documentation/register correction CR |
| File collision risk | Low |
| Frozen accepted behaviour touched? | No if label-only |

---

## GAP-017 — Compliance / Incidents partial Next vs rich HTML

| Field | Value |
|---|---|
| ID | GAP-017 |
| Module/route | `/compliance-quality`, `/incidents-risk` |
| Prototype behaviour | Multiple gov/risk routes with operational samples |
| Dashboard behaviour | `partially-implemented` landings + HTML seed workspaces for some sections |
| Classification | partial |
| Severity | high |
| User impact | Accreditation/QI/incident depth incomplete in Next |
| Evidence | module conditions; `ModuleWorkspace` PartialBody |
| Likely owning module | M12 / M16 |
| Recommended future batch | Governance rebuild waves |
| File collision risk | Medium |
| Frozen accepted behaviour touched? | No |

---

## GAP-018 — Documents, Ticketing, Communications, Digital Ops landings only

| Field | Value |
|---|---|
| ID | GAP-018 |
| Module/route | `/documents-policies`, `/ticket-desk`, `/communications`, `/digital-ops` |
| Prototype behaviour | Interactive HTML modules/campaigns/vault/cameras |
| Dashboard behaviour | ModuleLanding stubs (`legacy-html-fallback`) |
| Classification | missing / deferred |
| Severity | high |
| User impact | Core ops surfaces unavailable in developed app |
| Evidence | respective `*Module.tsx` landing pattern; catalogue counts |
| Likely owning module | M13 / M14 / M17 / M18 |
| Recommended future batch | Prioritised ops rebuild roadmap |
| File collision risk | Low–medium each |
| Frozen accepted behaviour touched? | No |

---

## GAP-019 — Analytics / SaaS / Enterprise extensions landings only

| Field | Value |
|---|---|
| ID | GAP-019 |
| Module/route | `/analytics`, `/saas`, `/vendor-console`, `/recruitment`, `/website-studio`, `/financial-forecast` |
| Prototype behaviour | Present with sample flows (incl. financial forecast labour ticker) |
| Dashboard behaviour | Landings; enterprise role gates on several |
| Classification | deferred / missing |
| Severity | medium–high |
| User impact | Executive/commercial extensions not operable in Next |
| Evidence | module register; ModuleLanding entries |
| Likely owning module | M19–M24 |
| Recommended future batch | Enterprise backlog |
| File collision risk | Low |
| Frozen accepted behaviour touched? | No |

---

## GAP-020 — Appearance / theme parity unverified on dashboard

| Field | Value |
|---|---|
| ID | GAP-020 |
| Module/route | Global shell |
| Prototype behaviour | Multiple visual themes (v27/v33/v34) |
| Dashboard behaviour | `theme-dark` / Command Centre appearance store exists; live light/dark/system not verifiable under 500 |
| Classification | defect (blocked) / partial (code present) |
| Severity | medium |
| User impact | Cannot confirm appearance modes for owner review |
| Evidence | appearance screenshots (error chrome); `setAppearanceStore` |
| Likely owning module | Platform shell / M01 |
| Recommended future batch | Re-test after GAP-001 |
| File collision risk | Low |
| Frozen accepted behaviour touched? | No |

---

## GAP-021 — Responsive / mobile dashboard unverified

| Field | Value |
|---|---|
| ID | GAP-021 |
| Module/route | Shell at 1440–390 |
| Prototype behaviour | Width sweeps captured on HTML; sidebar collapses in CSS |
| Dashboard behaviour | Width screenshots only show build error; sidebar/mobile drawer unverified |
| Classification | defect (blocked) |
| Severity | medium |
| User impact | No assurance of mobile operability for Next shell |
| Evidence | `responsive` block in `parity-evidence.json` |
| Likely owning module | Platform shell |
| Recommended future batch | Re-run evidence script after GAP-001 |
| File collision risk | Low |
| Frozen accepted behaviour touched? | No |

---

## GAP-022 — Keyboard / a11y dashboard unverified

| Field | Value |
|---|---|
| ID | GAP-022 |
| Module/route | Global |
| Prototype behaviour | Basic focusable nav/controls |
| Dashboard behaviour | Tab smoke hit empty error document |
| Classification | defect (blocked) / deferred (full a11y) |
| Severity | medium |
| User impact | No live keyboard access confirmation |
| Evidence | `parity-evidence.json` → `keyboard` |
| Likely owning module | Platform shell |
| Recommended future batch | A11y pass after GAP-001 |
| File collision risk | Low |
| Frozen accepted behaviour touched? | No |

---

## GAP-023 — Permission-denied / empty / loading states on dashboard unverified

| Field | Value |
|---|---|
| ID | GAP-023 |
| Module/route | Cross-cutting |
| Prototype behaviour | Empty states observed (Doctor Pay, Inventory) |
| Dashboard behaviour | Only compile error state observed live |
| Classification | defect (blocked) |
| Severity | medium |
| User impact | Cannot validate role denial or empty UX |
| Evidence | route probes bodySnippet empty; status 500 |
| Likely owning module | Platform + each module |
| Recommended future batch | Re-audit after GAP-001 |
| File collision risk | n/a |
| Frozen accepted behaviour touched? | No |

---

## GAP-024 — Prototype `/prototype` route not usable under portal compile failure

| Field | Value |
|---|---|
| ID | GAP-024 |
| Module/route | `/prototype` → `/prototype-reference` |
| Prototype behaviour | Static HTML works; framed reference page fails with same ModuleWorkspace graph error |
| Dashboard behaviour | n/a |
| Classification | defect |
| Severity | high |
| User impact | Documented QA entry `/prototype` does not load; auditors must open `/pulse-html-prototype.html` directly |
| Evidence | `prototypeRedirect` / `prototypeReference` status 500; static HTML 200 |
| Likely owning module | App layout / ModuleWorkspace import graph |
| Recommended future batch | Same as GAP-001; optionally isolate prototype-reference layout from module barrels |
| File collision risk | Medium |
| Frozen accepted behaviour touched? | Unlikely if layout isolation only |

---

## GAP-025 — Legacy redirects unverified live (expected intentional)

| Field | Value |
|---|---|
| ID | GAP-025 |
| Module/route | `/approvals`,`/tasks`,`/checklists`,`/hr-docs`,`/inventory`,… |
| Prototype behaviour | Hash routes still addressable |
| Dashboard behaviour | Code defines redirects; live probes stayed on source URL with 500 (redirect not observable) |
| Classification | defect (blocked verification) / intentional (design) |
| Severity | medium |
| User impact | Bookmarks may appear broken until compile fixed |
| Evidence | `legacyRedirects` all `ok: false` under 500 |
| Likely owning module | Platform navigation |
| Recommended future batch | Re-verify after GAP-001 |
| File collision risk | Low |
| Frozen accepted behaviour touched? | No |

---

## GAP-026 — Cross-module Action Inbox projections unverified live

| Field | Value |
|---|---|
| ID | GAP-026 |
| Module/route | M04/M05/M06/M07 → `/action-inbox` |
| Prototype behaviour | Module chrome shows Action Inbox panels |
| Dashboard behaviour | Adapters exist in code with wave evidence historically; live projection UI blocked |
| Classification | defect (blocked re-verification) |
| Severity | high |
| User impact | Cannot freshly prove inbox projections in this audit window |
| Evidence | adapter source files; prior wave audits; live 500 |
| Likely owning module | M02 + workforce family |
| Recommended future batch | Focused regression after GAP-001 |
| File collision risk | High on adapter files |
| Frozen accepted behaviour touched? | **Yes** if adapters changed — regression required |

---

## GAP-027 — M01–M06 “complete” modules unreachable

| Field | Value |
|---|---|
| ID | GAP-027 |
| Module/route | `/dashboard`,`/action-inbox`,`/settings`,`/staff-doctors`,`/roster`,`/time-attendance` |
| Prototype behaviour | Corresponding HTML modules interactive |
| Dashboard behaviour | Register marks complete-interactive-rebuild; runtime 500 prevents use |
| Classification | defect |
| Severity | critical |
| User impact | Accepted rebuilds cannot be demonstrated to owner in browser |
| Evidence | catalogue `byCondition`; route statuses |
| Likely owning module | Platform (GAP-001) |
| Recommended future batch | GAP-001 then smoke re-acceptance |
| File collision risk | High |
| Frozen accepted behaviour touched? | Fix should not change behaviour — only bundling boundary |

---

## Summary counts

| Classification | Count (this register) |
|---|---:|
| defect | 8 |
| missing | 4 |
| partial | 3 |
| intentional | 5 |
| deferred | 3 |
| changed | 2 |
| duplicate | 2 |

*(Some rows carry dual labels; counts above use primary class.)*

| Severity | Count |
|---|---:|
| critical | 2 |
| high | 9 |
| medium | 11 |
| low / info | 5 |

## Stop / non-actions

- No production repairs performed  
- No accepted evidence files modified  
- PPA not implemented  
- Module 8 not started  
- Branch not merged
