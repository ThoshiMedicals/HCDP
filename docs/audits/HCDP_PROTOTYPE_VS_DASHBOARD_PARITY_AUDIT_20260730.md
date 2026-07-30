# HCDP Prototype vs Dashboard Parity Audit — 2026-07-30

**Lane:** Independent Prototype Parity Auditor (audit-only)  
**Repository:** ThoshiMedicals/HCDP  
**Branch:** `agent/prototype-parity-audit-20260730`  
**Base:** clean `origin/main` @ `0afe87806cdc1e3e8e90da5293183ef1b2fd9c76`  
**Status:** Evidence complete — **no production repairs**, **no merge**  
**Companion gap register:** [`HCDP_PROTOTYPE_VS_DASHBOARD_GAP_REGISTER_20260730.md`](./HCDP_PROTOTYPE_VS_DASHBOARD_GAP_REGISTER_20260730.md)  
**Evidence pack:** [`prototype-parity-20260730/`](./prototype-parity-20260730/) (initial crawl + `screenshots/live-pass-20260730/` + `parity-evidence-live-pass.json`)  
**Evidence script:** `scripts/prototype-dashboard-parity-evidence.mjs`

---

## 1. Executive verdict

The live HTML prototype remains a denser, more interactive catalogue of operational surfaces than the Next dashboard. The dashboard has correctly applied **consolidated portal navigation** for Tasks/Checklists, Approvals→Action Inbox, HR Docs→Staff, and Inventory mega-module routing. **Genuine gaps** concentrate in modules that still render **ModuleLanding “Rebuild pending”** shells (notably **M08 Doctor Pay**, **M09 BBPIP**, **M15 Inventory & Assets**, plus M10/M12–M14/M16–M24 operational depth).

Waves **M01–M07 + M11** provide real React workspaces. Architecture and wave-control **supersede** the prototype where consolidations, M07 non-payment boundaries, and PPA planning-only rules apply — those are **not** scored as missing features.

| Bucket | Count (register) | Notes |
|---|---:|---|
| Intentional / consolidated / deferred by architecture | 12 | Not defects |
| Missing (landing-only vs interactive prototype depth) | 16 | Core commercial/ops risk |
| Partial (workspace present, material depth gap) | 8 | M07 stubs, M10 seed, M12/M16 seed |
| Changed (nav/IA differs by design) | 6 | Family regrouping |
| Defect (runtime quality) | 2 | Hydration / getServerSnapshot noise; webpack `node:crypto` on non-Turbopack dev |
| Duplicate | 0 open | Approvals top-level removed correctly |

---

## 2. Method and authority

### Read first

- `.cursor/rules/hcdp-wave-control.mdc` — Waves 1A–5 frozen; M07 Batches 1–6 closed; PPA planned only; no Module 8 implementation authorisation in wave-control.
- `docs/architecture/HCDP_PROTOTYPE_PARITY_REGISTER.md` — planning register; never counts sidebar/placeholder/unwired button as implemented.
- Platform register `src/platform/module-registry/module-register.ts` — authoritative 24-module dashboard IA.
- Controlling architecture / Wave 6 plans under `docs/architecture/`.

### Authority order used in classifications

1. **Wave-control + authorised architecture** (consolidations, M07 boundaries, PPA not authorised).  
2. **Owner product consolidation direction** (Tasks+Checklists, Approvals removal, Departments off daily nav, Staff hub, Inventory & Assets, Doctor Pay/BBPIP/Inventory OCR expectations).  
3. **Live prototype experience** as UX catalogue — **not** automatically authoritative where architecture supersedes.  
4. **Live dashboard** at `http://localhost:3000` (and static prototype at `/pulse-html-prototype.html` / `/prototype-reference`).

### What was never counted as “done”

Per parity register: sidebar presence, route presence, ModuleLanding chips, static demo cards, buttons without service-backed mutation, HTML fallback alone, local simulation without permission/validation/audit.

---

## 3. Live targets and runtime evidence

| Target | Result |
|---|---|
| `http://localhost:3000/prototype` | **200** → redirects to `/prototype-reference` |
| `http://localhost:3000/prototype-reference` | **200** — QA banner + iframe to HTML prototype |
| `http://localhost:3000/pulse-html-prototype.html` | **200** — direct HTML (used for nav snapshot when iframe tooling limited) |
| `http://localhost:3000/dashboard` + all approved module routes | **26 routes crawled, 0 crashes** |
| Desktop widths 1440 / 1280 / 1024 / 768 | **0 width failures** on `/dashboard`, `/inventory-assets`, `/prototype-reference` |
| Mobile widths 430 / 390 | **0 width failures** (scrollWidth within tolerance) |
| Appearances light / dark / system | Screenshots captured (`15-appearance-*.png`) |
| Playwright pack | `parity-evidence.json` + **20+ PNGs** under evidence folder |

### Runtime notes (environment, not repaired)

1. **`next dev --webpack` on :3000 failed** with client bundling of `node:crypto` via `published-timesheet-hash.ts` → M06/M07 import chain. **Audit used `next dev --turbopack -p 3000`**, which served all audited routes successfully.  
2. Console evidence: repeated **`getServerSnapshot should be cached`** and **hydration mismatch** (`hydrationOk: false` in evidence JSON). Classified as **defect** for quality; not fixed in this lane.  
3. Legacy alias redirects all **ok**: `/approvals`→Action Inbox Approval category; `/tasks`/`/checklists`→Tasks & Actions; `/hr-docs`→Staff credentials; `/inventory`→Inventory & Assets; `/staff`/`/doctors`→Staff & Doctors.

---

## 4. Navigation and consolidation comparison

### Prototype (live HTML)

Observed family labels (screenshot `16-live-html-prototype-nav-1440.png`):

- **Executive Command Centre:** Dashboard, Action Inbox, Risk Centre, Compliance Centre, Executive Analytics, Emergency Control  
- **Operations:** Tasks, Checklists, Opening / Closing, Incidents & Continuity, Expiry Centre, Offline Reconciliation, Ticketing Desk, Meetings & Actions  
- **People & Talent:** Staff, Doctors, Recruitment, Training, HR Documents  
- Plus Assets (Inventory/Stock/Equipment/Rooms), Governance, Finance (incl. **Approvals**), Communications, Security, Organisation/SaaS families

### Dashboard (Next sidebar)

Observed groups (evidence `02-dashboard-1440.png` / crawl):

- Executive Command · Organisation · People · Roster · Operations · Governance · Assets · Communications · Digital · Analytics · Commercial · Enterprise Extensions  
- **No** top-level Approvals, **no** daily Departments, **no** separate HR Documents, **no** split Inventory/Stock/Equipment nav items  
- Consolidated labels: **Tasks & Actions**, **Inventory & Assets**, **Staff & Doctors**, **Staff Pay / Doctor Pay / BBPIP** under Commercial

### Consolidation decisions (intentional — not missing)

| Decision | Prototype | Dashboard | Verdict |
|---|---|---|---|
| Tasks + Checklists | Separate nav items | Single **Tasks & Actions** | Intentional |
| Opening/Closing | Separate ops item | Section under Tasks & Actions (`opening-closing`) | Intentional (depth still partial) |
| Approvals | Finance top-level | Removed; `/approvals` → Action Inbox | Intentional |
| Departments | Not daily primary in consolidated portal direction | Not daily nav; Organisation / SaaS sections | Intentional |
| HR Docs / Leave / Award rules | Separate HR Docs; award rules historically nested | Staff credentials/leave; award rules → M07 Settings (relocated) | Intentional |
| Inventory mega-module | Split Inventory/Stock/Equipment/Rooms (+ printers/finance in prototype extensions) | Single **Inventory & Assets** with section chips | Intentional routing; **depth missing** |

---

## 5. Module depth matrix (live)

| Module | Route | Dashboard depth | vs Prototype |
|---|---|---|---|
| M01 Command Centre | `/dashboard` | Real workspace | Partial polish / some chrome demo verbs |
| M02 Action Inbox | `/action-inbox` | Real workspace | Approvals as category (intentional) |
| M03 Organisation | `/settings` | Real workspace | Departments inside org, not daily nav |
| M04 Staff & Doctors | `/staff-doctors` | Real workspace (Wave 2) | HR Docs consolidated |
| M05 Roster | `/roster` | Real workspace (Wave 4) | Strong |
| M06 Time & Attendance | `/time-attendance` | Real workspace (Wave 5) | Sync Centre folded into settings |
| M07 Staff Pay | `/staffpay` | Real workspace (Batches 1–6) | Adjustments/History **Planned** stubs; PPA deferred; payment/STP/Xero **out of boundary** |
| M08 Doctor Pay | `/doctorpay` | **Landing only** | BP extraction / splits / payslips / email / bank transfer **missing in React** |
| M09 BBPIP | `/bbpip` | **Landing only** | Forecast / recon / BP extraction **missing** |
| M10 Tasks & Actions | `/tasks-actions` | Landing + seed partial | Opening/Closing not duty runner; meetings/handover thin |
| M11 Training | `/training` | Real workspace (Wave 3) | Register `condition` stale (`legacy-html-fallback`) |
| M12 Compliance | `/compliance-quality` | Landing + thin seed | QI/PDSA/Audit/Expiry not rebuilt |
| M13 Documents | `/documents-policies` | Landing | Missing React doc control |
| M14 Ticketing | `/ticket-desk` | Landing | Missing React queue |
| M15 Inventory & Assets | `/inventory-assets` | Landing | OCR, stock, transfers, printers detail **missing** |
| M16 Incidents & Risk | `/incidents-risk` | Landing + RiskCentre seed | CAPA/continuity/emergency thin |
| M17–M24 | various | Landing | Prototype remains interactive surface |

---

## 6. Cross-cutting checks

| Check | Finding |
|---|---|
| Working vs decorative controls | Landing modules: section chips navigate query only; Create drawers often FIELD_SCHEMAS copies without module SoT services. M01–M07/M11: mixed — service-wired cores + some toast/demo chrome. |
| State persistence / reset | Prototype uses localStorage store (`hdp_operations_portal_v17_consolidated_inventory_ocr`). Dashboard modules use module local stores / portal prefs — not parity-synced. |
| Permissions / role visibility | Dashboard: Act-as user/role combobox (demo). Prototype: role access matrix. Enterprise modules role-gated in register. |
| Cross-module links | Landing “Related modules” links present; deep workflow projections incomplete outside Waves 2–6. |
| Empty / loading / error / denied | Stronger on M05/M06/M11; weak on landings. M07 shows empty periods (“No periods for this legal entity”). |
| Keyboard / a11y | Tab moves focus; nav/main landmarks present; some unnamed buttons counted in evidence a11y probe. Hydration errors harm reliability. |
| Light/dark/device | Appearance selects exercised; screenshots captured. |

---

## 7. Product-reference features (owner direction)

| Feature | Classification |
|---|---|
| Doctor Pay: BP extraction → contract/rate → recon → manager approval → payslip email → manual bank transfer | **Missing** in dashboard React (prototype has interactive doctorpay schema/workflow simulation). Manual bank transfer / payment execution also **out of M07**; M08 not authorised by wave-control — recommend future **M08 batch**, not silent M07 work. |
| BBPIP: BP extraction + forecast/recon | **Missing** in React landing |
| Inventory OCR | **Missing** in React; present in prototype (`simulateInvoiceOCR` / inventory OCR entry) |
| Printer Management detailed asset/network/support fields | **Missing** in React; prototype `printers` field schema + fleet checks |
| Tasks+Checklists / Opening-Closing / Approvals / Departments / Staff hub / Inventory consolidate | **Intentional** (routing done; some depth still partial) |

---

## 8. Highest-priority owner view (before further module development)

1. **M08 / M09 / M15** landing shells vs commercial-critical prototype workflows.  
2. **M10** consolidation complete in nav but Opening/Closing + meetings depth incomplete.  
3. **M12–M14 / M16–M18** governance/ops still prototype-dependent.  
4. **M07** ordinary prep closed with qualifications — do not treat Adjustments/History Planned stubs or PPA as Batch 1–6 defects; do not implement PPA until authorised.  
5. **Platform quality defects:** hydration / getServerSnapshot; webpack `node:crypto` client import (Turbopack workaround only).  
6. **Register drift:** M11 `legacy-html-fallback` contradicts live Training workspace.

---

## 9. Exact test / browser evidence

| Item | Detail |
|---|---|
| Git base | `origin/main` = `0afe878` |
| Branch | `agent/prototype-parity-audit-20260730` |
| Server | `npx next dev --turbopack -p 3000 -H 127.0.0.1` |
| Script | `node scripts/prototype-dashboard-parity-evidence.mjs` |
| Script summary | routesCrawled 26 · crashed 0 · landingOnly 16 · widthFailures 0 · gapsObserved 16 · screenshots 19+ · hydrationOk false |
| Key screenshots | `prototype-parity-20260730/screenshots/` (initial) + `screenshots/live-pass-20260730/` (`01`–`17`, appearance, widths, live HTML nav, doctorpay landing) |
| Browser MCP | Live snapshots of `/dashboard`, `/pulse-html-prototype.html`, `/doctorpay`, `/staffpay` on 2026-07-30 |

---

## 10. Outputs and non-goals

**Created (new files only):**

- This audit  
- Gap register  
- Evidence script + JSON/PNG pack  

**Not done (per charter):** defect repairs, production source changes, accepted evidence rewrites, PPA implementation, Module 8 build, merge to main.
