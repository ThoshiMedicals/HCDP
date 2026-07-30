# HCDP Prototype vs Dashboard Gap Register — 2026-07-30

**Audit:** [`HCDP_PROTOTYPE_VS_DASHBOARD_PARITY_AUDIT_20260730.md`](./HCDP_PROTOTYPE_VS_DASHBOARD_PARITY_AUDIT_20260730.md)  
**Evidence:** [`prototype-parity-20260730/parity-evidence-live-pass.json`](./prototype-parity-20260730/parity-evidence-live-pass.json) (+ `screenshots/live-pass-20260730/`)  
**Branch:** `agent/prototype-parity-audit-20260730` @ base `0afe878`  
**Lane:** Audit-only — classifications guide future batches; **do not treat this file as implementation authority**

### Severity scale

| Severity | Meaning |
|---|---|
| critical | Commercial/ops workflow unusable in dashboard vs expected product direction |
| high | Material interactive depth absent; blocks day-to-day module use |
| medium | Partial depth or quality issue with workaround |
| low | Polish, copy, register drift, or non-blocking IA difference |

### Classification legend

`missing` · `partial` · `changed` · `duplicate` · `intentional` · `deferred` · `defect`

---

## A. Intentional consolidations / architecture supersedes prototype

### GAP-INT-001 — Tasks + Checklists combined

| Field | Value |
|---|---|
| ID | GAP-INT-001 |
| Module / route | M10 `/tasks-actions` (legacy `/tasks`, `/checklists`) |
| Prototype behaviour | Separate **Tasks** and **Checklists** nav items with independent CRUD/workflows |
| Dashboard behaviour | Single **Tasks & Actions**; aliases redirect to sections |
| Classification | intentional |
| Severity | low (IA) |
| User impact | Users look for two nav items; find one consolidated module |
| Evidence | Live HTML nav screenshot `16-…`; redirects in `parity-evidence.json` aliasRedirects; register M10 |
| Likely owning module | M10 |
| Recommended future batch | M10 depth batch (not re-split nav) |
| File collision risk | Low if limited to `m10-tasks-actions` + navigation aliases |
| Touches frozen accepted behaviour? | No |

### GAP-INT-002 — Opening/Closing inside Checklists / Tasks hub

| Field | Value |
|---|---|
| ID | GAP-INT-002 |
| Module / route | M10 `?section=opening-closing` |
| Prototype behaviour | Distinct **Opening / Closing** ops nav + front-desk templates |
| Dashboard behaviour | Section under Tasks & Actions (intentional placement) |
| Classification | intentional (placement) — see also GAP-PAR-010 for depth |
| Severity | low (placement) |
| User impact | Nav mental model changes; feature expected under Tasks & Actions |
| Evidence | Product reference; module-register `opening-closing`; HTML nav |
| Likely owning module | M10 |
| Recommended future batch | M10 duty-runner batch |
| File collision risk | Low–medium (`ModuleWorkspace` PartialBody, M10) |
| Touches frozen accepted behaviour? | No |

### GAP-INT-003 — Approvals removed as Action Inbox duplicate

| Field | Value |
|---|---|
| ID | GAP-INT-003 |
| Module / route | Legacy `/approvals` → `/action-inbox?category=Approval` |
| Prototype behaviour | Top-level **Approvals** under Finance |
| Dashboard behaviour | No top-level Approvals; Action Inbox Approvals category; redirect works |
| Classification | intentional |
| Severity | low |
| User impact | Finance users go to Action Inbox / module approvals instead |
| Evidence | aliasRedirects ok; sidebar `hasApprovalsTopLevel: false` |
| Likely owning module | M02 |
| Recommended future batch | None for nav; keep redirect |
| File collision risk | None |
| Touches frozen accepted behaviour? | No (preserves M02 patterns) |

### GAP-INT-004 — Departments removed from daily navigation

| Field | Value |
|---|---|
| ID | GAP-INT-004 |
| Module / route | M03 `/settings` (departments section); M20 SaaS departments |
| Prototype behaviour | Departments not emphasised as daily primary in consolidated direction |
| Dashboard behaviour | No daily **Departments** nav item; Organisation & Access owns structure |
| Classification | intentional |
| Severity | low |
| User impact | Department admin via Organisation, not daily rail |
| Evidence | dashboard shell `hasDepartmentsDailyNav: false` |
| Likely owning module | M03 / M20 |
| Recommended future batch | None for nav |
| File collision risk | None |
| Touches frozen accepted behaviour? | No |

### GAP-INT-005 — HR Documents / Leave inside Staff Management

| Field | Value |
|---|---|
| ID | GAP-INT-005 |
| Module / route | M04 `/staff-doctors` (`credentials`, `leave-availability`); `/hr-docs` redirect |
| Prototype behaviour | Separate **HR Documents** People nav item |
| Dashboard behaviour | No separate HR Docs nav; Credentials / Leave sections; `/hr-docs` → credentials |
| Classification | intentional |
| Severity | low |
| User impact | HR docs managed inside Staff & Doctors |
| Evidence | aliasRedirects; sidebar `hasSeparateHrDocsNav: false` |
| Likely owning module | M04 |
| Recommended future batch | M04 polish only if credential UX gaps appear |
| File collision risk | **High** if editing frozen Wave 2 M04 without CR |
| Touches frozen accepted behaviour? | **Yes if M04 behaviour changed** — avoid without defect/CR |

### GAP-INT-006 — Award Rules relocated to M07 Settings

| Field | Value |
|---|---|
| ID | GAP-INT-006 |
| Module / route | M07 Settings (not M04) |
| Prototype behaviour | Award rules historically under Staff hub / awardRules records |
| Dashboard behaviour | Parity register: **RELOCATED** to M07 prep rules; M04 classification SoT only |
| Classification | intentional |
| Severity | low |
| User impact | Looking under Staff for award tables is wrong place by design |
| Evidence | `HCDP_PROTOTYPE_PARITY_REGISTER.md` Q23 |
| Likely owning module | M07 |
| Recommended future batch | M07 settings depth (non-PPA) |
| File collision risk | Medium (M07 settings) |
| Touches frozen accepted behaviour? | M07 Batch 1–6 closed — change only with CR/owner review |

### GAP-INT-007 — Inventory / Stock / Transfers / Equipment / Printers → Inventory & Assets

| Field | Value |
|---|---|
| ID | GAP-INT-007 |
| Module / route | M15 `/inventory-assets` (+ legacy `/inventory` etc.) |
| Prototype behaviour | Separate Assets nav items + printers/finance extensions |
| Dashboard behaviour | Single consolidated module with section chips |
| Classification | intentional (routing) — depth = GAP-MIS-003 |
| Severity | low (routing) |
| User impact | One Assets entry instead of many |
| Evidence | module-register M15; alias `/inventory` |
| Likely owning module | M15 |
| Recommended future batch | M15 rebuild batch |
| File collision risk | Low until M15 implementation starts |
| Touches frozen accepted behaviour? | No |

### GAP-INT-008 — M07 payment / STP / Xero / bank execution rejected

| Field | Value |
|---|---|
| ID | GAP-INT-008 |
| Module / route | M07 `/staffpay` |
| Prototype behaviour | Export-to-Xero / paid-style language in places; final pay narrative |
| Dashboard behaviour | Explicit non-certified prep; export ≠ paid; no bank/STP/super |
| Classification | intentional / deferred (architecture REJECTED items) |
| Severity | n/a (not a gap vs architecture) |
| User impact | Prototype “paid/Xero” expectations must not drive M07 defects |
| Evidence | Wave-control; M07 parity register REJECTED table; live Staff Pay disclaimer |
| Likely owning module | M07 / vendor adapter later |
| Recommended future batch | Post-canonical export vendor adapter (deferred) |
| File collision risk | High if forced into closed Batches 1–6 |
| Touches frozen accepted behaviour? | Would if altered — **do not** |

### GAP-DEF-001 — PPA (prior-period adjustment) planned only

| Field | Value |
|---|---|
| ID | GAP-DEF-001 |
| Module / route | M07 PPA (not ordinary prep) |
| Prototype behaviour | Corrections / final-pay style narratives |
| Dashboard behaviour | PPA readiness/design docs only; unlock ≠ PPA |
| Classification | deferred |
| Severity | medium (product roadmap) |
| User impact | Post-lock corrections not available as PPA cycle |
| Evidence | wave-control; `WAVE6_M07_PPA_READINESS_AND_DESIGN.md` |
| Likely owning module | M07 PPA |
| Recommended future batch | **Named PPA batch only after explicit owner authorisation** |
| File collision risk | High (M07 services/storage) |
| Touches frozen accepted behaviour? | Must not rewrite accepted Batch 1–6 history |

---

## B. Critical / high — genuine missing interactive depth

### GAP-MIS-001 — Doctor Pay React workspace missing

| Field | Value |
|---|---|
| ID | GAP-MIS-001 |
| Module / route | M08 `/doctorpay` |
| Prototype behaviour | Interactive doctor pay runs: BP billing, rate %, GST, adjustments, BP report flag, statuses Draft→Paid; splits/payslips surfaces |
| Dashboard behaviour | ModuleLanding **Rebuild pending**; section chips Pay Runs / Splits / Payslips only; no BP extraction / recon / approval / payslip email / bank transfer UI |
| Classification | missing |
| Severity | critical |
| User impact | Commercial doctor-pay workflow cannot be run in dashboard |
| Evidence | `09-dash-doctorpay-landing.png`, `17-dashboard-doctorpay-landing.png`; route crawl rebuildPending; browser snapshot 2026-07-30 |
| Likely owning module | M08 |
| Recommended future batch | **Authorised M08 implementation batch** (wave-control currently forbids beginning Module 8 without owner change) |
| File collision risk | Low until M08 authorised (`src/modules/m08-doctor-pay`) |
| Touches frozen accepted behaviour? | No (M08 not frozen accepted) |

### GAP-MIS-002 — BBPIP React workspace missing

| Field | Value |
|---|---|
| ID | GAP-MIS-002 |
| Module / route | M09 `/bbpip` |
| Prototype behaviour | Estimate / review / recon / split CRUD with BP-related fields |
| Dashboard behaviour | Rebuild-pending landing only |
| Classification | missing |
| Severity | critical |
| User impact | Forecast/reconciliation cannot be operated in dashboard |
| Evidence | `10-dash-bbpip-landing.png`; landingOnly crawl |
| Likely owning module | M09 |
| Recommended future batch | M09 after/with M08 commercial family planning |
| File collision risk | Low |
| Touches frozen accepted behaviour? | No |

### GAP-MIS-003 — Inventory & Assets React workspace missing (incl. OCR & printers)

| Field | Value |
|---|---|
| ID | GAP-MIS-003 |
| Module / route | M15 `/inventory-assets` |
| Prototype behaviour | Inventory/stock/equipment/rooms + OCR scan entry, finance OCR review, printers with IP/toner/service/network-style fields and fleet checks |
| Dashboard behaviour | Rebuild-pending landing; Printers listed as section chip only; **no OCR**, no fleet management |
| Classification | missing |
| Severity | critical |
| User impact | Asset/stock/OCR/printer operations stay in HTML prototype |
| Evidence | `12-dash-inventory-landing.png`; prototype STORE/`openInventoryOCR`/`printers` schema; evidence `inventory-assets.hasOcr: false` |
| Likely owning module | M15 |
| Recommended future batch | M15 rebuild (OCR + printers as explicit slices) |
| File collision risk | Low until implementation |
| Touches frozen accepted behaviour? | No |

### GAP-MIS-004 — Ticketing Desk React missing

| Field | Value |
|---|---|
| ID | GAP-MIS-004 |
| Module / route | M14 `/ticket-desk` |
| Prototype behaviour | Ticketing CRUD, SLA, printer-ticket cross-links |
| Dashboard behaviour | Landing only |
| Classification | missing |
| Severity | high |
| User impact | No operational ticket queue in React |
| Evidence | route crawl landingOnly |
| Likely owning module | M14 |
| Recommended future batch | M14 ops batch |
| File collision risk | Low |
| Touches frozen accepted behaviour? | No |

### GAP-MIS-005 — Documents & Policies React missing

| Field | Value |
|---|---|
| ID | GAP-MIS-005 |
| Module / route | M13 `/documents-policies` |
| Prototype behaviour | Policies / documents control CRUD |
| Dashboard behaviour | Landing only |
| Classification | missing |
| Severity | high |
| User impact | Document control remains prototype-only |
| Evidence | landing crawl |
| Likely owning module | M13 |
| Recommended future batch | M13 governance batch |
| File collision risk | Low |
| Touches frozen accepted behaviour? | No |

### GAP-MIS-006 — Communications React missing

| Field | Value |
|---|---|
| ID | GAP-MIS-006 |
| Module / route | M17 `/communications` |
| Prototype behaviour | Email/SMS/memos/commbook/noticeboards interactive |
| Dashboard behaviour | Landing only |
| Classification | missing |
| Severity | high |
| User impact | Campaigns/comms only in prototype |
| Evidence | landing crawl |
| Likely owning module | M17 |
| Recommended future batch | M17 |
| File collision risk | Low |
| Touches frozen accepted behaviour? | No |

### GAP-MIS-007 — Digital Operations React missing

| Field | Value |
|---|---|
| ID | GAP-MIS-007 |
| Module / route | M18 `/digital-ops` |
| Prototype behaviour | Website monitoring, remote, vault, cameras |
| Dashboard behaviour | Landing only |
| Classification | missing |
| Severity | high |
| User impact | Security/digital ops prototype-only |
| Evidence | landing crawl |
| Likely owning module | M18 |
| Recommended future batch | M18 |
| File collision risk | Low |
| Touches frozen accepted behaviour? | No |

### GAP-MIS-008 — Analytics React missing

| Field | Value |
|---|---|
| ID | GAP-MIS-008 |
| Module / route | M19 `/analytics` |
| Prototype behaviour | Executive analytics module |
| Dashboard behaviour | Landing only |
| Classification | missing |
| Severity | high |
| User impact | Analytics workspace not rebuilt |
| Evidence | landing crawl |
| Likely owning module | M19 |
| Recommended future batch | M19 |
| File collision risk | Low |
| Touches frozen accepted behaviour? | No |

### GAP-MIS-009 — SaaS / Vendor / Recruitment / Website Studio / Financial Forecast landings

| Field | Value |
|---|---|
| ID | GAP-MIS-009 |
| Module / route | M20–M24 `/saas`, `/vendor-console`, `/recruitment`, `/website-studio`, `/financial-forecast` |
| Prototype behaviour | Interactive (or Phase-2 flagged) surfaces in HTML catalogue |
| Dashboard behaviour | Rebuild-pending landings (enterprise role gates on some) |
| Classification | missing / deferred (enterprise timing) |
| Severity | high (core SaaS/recruitment) · medium (enterprise extensions by tier) |
| User impact | Tenant/vendor/talent/SEO/forecast not operable in React |
| Evidence | landing crawl set |
| Likely owning module | M20–M24 respectively |
| Recommended future batch | Per-module enterprise/core backlog |
| File collision risk | Low |
| Touches frozen accepted behaviour? | No |

---

## C. Partial — present but incomplete

### GAP-PAR-001 — M07 Adjustments section stub

| Field | Value |
|---|---|
| ID | GAP-PAR-001 |
| Module / route | M07 `/staffpay?section=adjustments` |
| Prototype behaviour | Corrections / over-underpayment style records in staffpay/corrections narrative |
| Dashboard behaviour | Section labelled **Planned**; PlannedSection non-mutating stub |
| Classification | partial / deferred |
| Severity | medium |
| User impact | Cannot record adjustment lines in UI (ordinary prep); PPA separate |
| Evidence | Staff Pay browser snapshot: AdjustmentsPlanned; `hasPlannedStub: true` |
| Likely owning module | M07 |
| Recommended future batch | Non-PPA adjustments slice **or** authorised PPA batch (do not conflate) |
| File collision risk | High (closed M07) |
| Touches frozen accepted behaviour? | **Yes risk** — requires CR/owner review |

### GAP-PAR-002 — M07 History / Reports stub

| Field | Value |
|---|---|
| ID | GAP-PAR-002 |
| Module / route | M07 History / Reports |
| Prototype behaviour | History of pay periods / exports |
| Dashboard behaviour | **Planned** stub |
| Classification | partial |
| Severity | medium |
| User impact | Limited historical review UI |
| Evidence | Staff Pay nav listitem History / ReportsPlanned |
| Likely owning module | M07 |
| Recommended future batch | M07 history UI batch |
| File collision risk | High |
| Touches frozen accepted behaviour? | **Yes risk** |

### GAP-PAR-003 — M07 Overview copy vs Available Export/Recon sections

| Field | Value |
|---|---|
| ID | GAP-PAR-003 |
| Module / route | M07 Pay Run Overview |
| Prototype behaviour | N/A |
| Dashboard behaviour | Overview text still says export/recon/lock “remain unavailable” while Export/Reconciliation sections show **Available** (Batch 6) |
| Classification | defect (copy inconsistency) / partial UX |
| Severity | low–medium |
| User impact | Confusing readiness messaging |
| Evidence | `/staffpay` snapshot 2026-07-30 |
| Likely owning module | M07 |
| Recommended future batch | Copy-only CR (avoid logic change) |
| File collision risk | Medium |
| Touches frozen accepted behaviour? | Copy-only preferably; avoid behavioural rewrite |

### GAP-PAR-004 — M10 Opening/Closing not a duty runner

| Field | Value |
|---|---|
| ID | GAP-PAR-004 |
| Module / route | M10 opening-closing |
| Prototype behaviour | Roster-linked opening/closing checklists with templates |
| Dashboard behaviour | Consolidated section + ChecklistsWorkspace seed — not full duty runner |
| Classification | partial |
| Severity | high |
| User impact | Front-desk open/close process incomplete in React |
| Evidence | Explore inventory; ModuleWorkspace PartialBody |
| Likely owning module | M10 |
| Recommended future batch | M10 opening/closing batch |
| File collision risk | Medium |
| Touches frozen accepted behaviour? | No |

### GAP-PAR-005 — M10 Meetings / Handovers thin

| Field | Value |
|---|---|
| ID | GAP-PAR-005 |
| Module / route | M10 meetings / handovers |
| Prototype behaviour | Meetings & Actions nav + workflows |
| Dashboard behaviour | Title/seed panels; incomplete |
| Classification | partial |
| Severity | medium |
| User impact | Meeting actions not operationally complete |
| Evidence | ModuleWorkspace PartialBody; TasksWorkspace |
| Likely owning module | M10 |
| Recommended future batch | M10 meetings batch |
| File collision risk | Medium |
| Touches frozen accepted behaviour? | No |

### GAP-PAR-006 — M12 Compliance / QI / PDSA / Audit / Expiry incomplete

| Field | Value |
|---|---|
| ID | GAP-PAR-006 |
| Module / route | M12 `/compliance-quality` |
| Prototype behaviour | Separate accreditation, QI, audit, expiry, compliance centre surfaces |
| Dashboard behaviour | Landing + accreditation/risk seed reuse |
| Classification | partial / missing subsections |
| Severity | high |
| User impact | Governance pack incomplete in React |
| Evidence | landing + PartialBody |
| Likely owning module | M12 |
| Recommended future batch | M12 rebuild slices |
| File collision risk | Medium |
| Touches frozen accepted behaviour? | No |

### GAP-PAR-007 — M16 Incidents / CAPA / Continuity / Emergency incomplete

| Field | Value |
|---|---|
| ID | GAP-PAR-007 |
| Module / route | M16 `/incidents-risk` |
| Prototype behaviour | Incidents + risk + emergency control |
| Dashboard behaviour | Landing + RiskCentre seed; CAPA/continuity/emergency not rebuilt |
| Classification | partial |
| Severity | high |
| User impact | Incident lifecycle incomplete |
| Evidence | landing crawl; PartialBody |
| Likely owning module | M16 |
| Recommended future batch | M16 |
| File collision risk | Medium |
| Touches frozen accepted behaviour? | No |

### GAP-PAR-008 — M01 chrome verbs partially decorative

| Field | Value |
|---|---|
| ID | GAP-PAR-008 |
| Module / route | M01 `/dashboard` |
| Prototype behaviour | Rich command-centre actions |
| Dashboard behaviour | Real workspace; some ribbon/actions toast/demo-only (parity register pattern) |
| Classification | partial |
| Severity | medium |
| User impact | Some executive actions feel live but do not mutate SoT |
| Evidence | Prior M1 audits; live CC present |
| Likely owning module | M01 |
| Recommended future batch | M01 wiring polish |
| File collision risk | Medium |
| Touches frozen accepted behaviour? | Careful — M01 not wave-frozen like M04–M06 but treat as accepted UX |

### GAP-PAR-009 — Register condition drift for M11 Training

| Field | Value |
|---|---|
| ID | GAP-PAR-009 |
| Module / route | M11 `/training` |
| Prototype behaviour | Training HTML |
| Dashboard behaviour | **Live TrainingWorkspace** (Wave 3) but register `condition: legacy-html-fallback` |
| Classification | defect (metadata) / changed |
| Severity | low |
| User impact | Misleading rebuild-pending labelling if any UI reads condition |
| Evidence | module-register vs live `/training` interactiveSignals |
| Likely owning module | Platform registry / M11 |
| Recommended future batch | Registry correction CR |
| File collision risk | Low (register metadata) |
| Touches frozen accepted behaviour? | Metadata only preferred; do not regress Wave 3 |

---

## D. Changed IA (architecture vs prototype grouping)

### GAP-CHG-001 — Navigation family regrouping

| Field | Value |
|---|---|
| ID | GAP-CHG-001 |
| Module / route | Platform sidebar |
| Prototype behaviour | Executive / Operations / People / Rostering / Assets / Governance / Finance / Security… |
| Dashboard behaviour | Executive / Organisation / People / Roster / Operations / Governance / Assets / Communications / Digital / Analytics / Commercial / Enterprise |
| Classification | changed / intentional |
| Severity | low |
| User impact | Different grouping; modules redistributed (e.g. Risk/Compliance not under Executive rail) |
| Evidence | screenshots `02` vs `16` |
| Likely owning module | Platform navigation |
| Recommended future batch | None required |
| File collision risk | High if wholesale nav rewrite |
| Touches frozen accepted behaviour? | Possible — avoid casual IA churn |

### GAP-CHG-002 — Offline Reconciliation / Sync Centre placement

| Field | Value |
|---|---|
| ID | GAP-CHG-002 |
| Module / route | M06 settings / prototype Offline Reconciliation |
| Prototype behaviour | Distinct ops nav **Offline Reconciliation** |
| Dashboard behaviour | Folded into Time & Attendance Settings (Wave 5) |
| Classification | changed / intentional |
| Severity | low |
| User impact | Users seek separate Sync Centre item |
| Evidence | module-register M06 settings legacyTerms |
| Likely owning module | M06 |
| Recommended future batch | None (document only) |
| File collision risk | **High** — Wave 5 frozen |
| Touches frozen accepted behaviour? | **Yes** if behaviour altered |

### GAP-CHG-003 — Expiry Centre consolidation

| Field | Value |
|---|---|
| ID | GAP-CHG-003 |
| Module / route | Prototype Expiry Centre vs M04/M12/M15 expiry concerns |
| Prototype behaviour | Cross-cutting Expiry Centre special module |
| Dashboard behaviour | No single Expiry Centre nav; spread across modules |
| Classification | changed / intentional |
| Severity | medium |
| User impact | No single expiry cockpit in dashboard |
| Evidence | HTML MODULES.expiry; dashboard nav absence |
| Likely owning module | Platform / M12 |
| Recommended future batch | Optional expiry cockpit later |
| File collision risk | Medium |
| Touches frozen accepted behaviour? | Depends on design |

---

## E. Defects (runtime quality — not repaired)

### GAP-DEF-002 — Hydration / getServerSnapshot console failures

| Field | Value |
|---|---|
| ID | GAP-DEF-002 |
| Module / route | Cross-cutting portal shell |
| Prototype behaviour | N/A |
| Dashboard behaviour | Repeated console errors; `hydrationOk: false` in evidence |
| Classification | defect |
| Severity | medium |
| User impact | Unstable SSR/client sync; possible flicker/perf issues |
| Evidence | `parity-evidence.json` console[] |
| Likely owning module | Platform / portal-context |
| Recommended future batch | Platform stability batch |
| File collision risk | Medium–high (shared shell) |
| Touches frozen accepted behaviour? | Possible collateral — needs careful CR |

### GAP-DEF-003 — Webpack `node:crypto` client import breaks `next dev --webpack`

| Field | Value |
|---|---|
| ID | GAP-DEF-003 |
| Module / route | M06/M07 published-timesheet hash import chain |
| Prototype behaviour | N/A |
| Dashboard behaviour | `next dev --webpack` fails UnhandledSchemeError `node:crypto`; Turbopack works |
| Classification | defect |
| Severity | medium (dev ergonomics) |
| User impact | Default webpack dev server unusable for module routes |
| Evidence | terminal `741892.txt` compile errors; Turbopack audit success |
| Likely owning module | Platform workforce contracts / bundler boundary |
| Recommended future batch | Platform bundler fix (server-only boundary) |
| File collision risk | Medium (shared contracts used by frozen M06/M07) |
| Touches frozen accepted behaviour? | Should be build-boundary only — avoid logic change |

---

## F. Summary counts

| Classification | IDs |
|---|---|
| intentional | GAP-INT-001 … 008 |
| deferred | GAP-DEF-001 |
| missing | GAP-MIS-001 … 009 |
| partial | GAP-PAR-001 … 009 |
| changed | GAP-CHG-001 … 003 |
| defect | GAP-DEF-002, GAP-DEF-003, GAP-PAR-003 (copy) |

**Do not schedule M08 work or PPA implementation from this register alone** — await explicit owner authorisation per wave-control.
