# HCDP Prototype Parity Register

**Date:** 28 July 2026  
**Status:** PLANNING / DOCUMENTATION ONLY — not execution evidence  
**Reference prototype:** `Healthcare_Doctors_Pulse_Executive_Healthcare_Operations_Platform_v34_Stronger_Navigation_Palette.html`  
**Identical copy:** `Development folder/public/pulse-html-prototype.html` (byte-identical)  
**Machine-readable companion:** `docs/architecture/hcdp-prototype-parity-register.json`

```json
{
  "planningOnly": true,
  "cssRewriteAuthorised": false,
  "countsAsImplementedNever": [
    "sidebar presence",
    "route presence",
    "mounted placeholder",
    "static demonstration card",
    "button without service-backed mutation",
    "legacy HTML fallback",
    "local visual simulation without permission/validation/audit"
  ]
}
```

---

## 1. Methodology

1. Catalogue prototype nav families, module keys, BRD/BP tabs, actions, exports, cross-links.  
2. Map each item to intended module **M01–M24**.  
3. Compare to current React route/workspace/service where known.  
4. Assign status:

| Status | Meaning |
|---|---|
| `IMPLEMENTED-EVIDENCED` | Service-backed behaviour with wave acceptance evidence |
| `IMPLEMENTED-NOT-EVIDENCED` | Real behaviour exists but lacks formal wave evidence |
| `PARTIAL` | Some real behaviour; material gaps vs prototype/plan |
| `PLANNED` | Explicitly planned for an authorised/future wave |
| `DEFERRED` | Intentionally later |
| `REJECTED` | Will not implement as prototype showed (reason required) |

**Never** count sidebar/route/placeholder/static card/unwired button/legacy HTML/local simulation as implemented.

---

## 2. Totals by status (register rows)

Approximate row counts from this register edition (module summaries + M07 detail + design). Exact JSON companion mirrors these.

| Status | Count | Δ vs prior edition |
|---|---:|---|
| IMPLEMENTED-EVIDENCED | 48 | 0 |
| IMPLEMENTED-NOT-EVIDENCED | 12 | 0 |
| PARTIAL | 36 | 0 |
| PLANNED | 92 | −2 (2 items → CONSOLIDATED/RELOCATED disposition) |
| DEFERRED | 41 | 0 |
| REJECTED | 18 | 0 |
| CONSOLIDATED / RELOCATED | 2 | +2 (Approve Location; Staff-hub award rules) |
| **Total catalogued** | **249** | same universe; 2 reclassified within PLANNED→CONSOLIDATED |

### Totals by module (primary owner)

| Module | Evidenced | Not-evidenced | Partial | Planned | Deferred | Rejected |
|---|---:|---:|---:|---:|---:|---:|
| M01 | 2 | 1 | 2 | 4 | 2 | 0 |
| M02 | 3 | 1 | 2 | 5 | 1 | 0 |
| M03 | 2 | 1 | 2 | 6 | 2 | 0 |
| M04 | 8 | 1 | 3 | 6 | 2 | 1 |
| M05 | 10 | 1 | 2 | 3 | 1 | 0 |
| M06 | 12 | 1 | 2 | 2 | 1 | 0 |
| **M07** | **0** | **0** | **1** | **26** | **6** | **8** | (+2 CONSOLIDATED/RELOCATED) |
| M08 | 0 | 0 | 1 | 8 | 4 | 2 |
| M09–M24 (rollup) | 11 | 6 | 19 | 32 | 22 | 7 |

Frozen Waves 1A–5 contribute most evidenced rows (M04–M06 + platform). M07 React shell today is landing/`legacy-html-fallback` only → **PARTIAL** at module level; detailed M07 prototype features are **PLANNED / DEFERRED / REJECTED** below.

---

## 3. M07 Staff Pay — prototype → plan reconciliation

**Prototype identity:** route key `staffpay`; BRD/BP **M07 Staff Pay & Payroll Preparation**; subtitle “Prepare approved time for Xero payroll” (runtime) / prep control tower (BRD).

### 3.1 Prototype tabs (BRD) vs Wave 6 plan sections

| Prototype tab | Wave 6 plan section(s) | Status | Notes |
|---|---|---|---|
| Pay Run | Pay Run Overview + People Review | PLANNED | Org-scoped; one open period (Q14) |
| Exceptions | Exceptions | PLANNED | Waive rules Q15; non-waivable set |
| Variances | Variances | PLANNED | M05 read; no source rewrite |
| Leave & Allowances | People Review + Adjustments + code list | PLANNED | Leave lines Q11; codes Q18 |
| Export & Reconciliation | Export + Reconciliation | PLANNED | CSV+JSON not Xero-only; export≠paid |
| History | History | PLANNED | Immutable versions |
| Corrections & Final Pay | Adjustments (+ partial) | PARTIAL→PLANNED / DEFERRED | Prior-period adjustments **PLANNED**; “Process Final Pay” / bank-style final pay **REJECTED/DEFERRED** (no banking; M08 boundary) |

Architecture Wave 6 also lists Approval, Reports, Settings — **PLANNED** (prototype folds some into drawer/approvals/award rules).

### 3.2 Prototype actions → plan

| Prototype action | Plan disposition | Status | Notes |
|---|---|---|---|
| Create Pay Period / Create Pay Run | `createPayPeriod` | PLANNED | One open ordinary period / entity (Q14) |
| Refresh Approved Time | `refreshMissedApprovedTimesheets` | PLANNED | Event + refresh (Q2) |
| Recalculate | `recalculatePerson` / period | PLANNED | Non-certified; retain rule version |
| Open / Resolve Exception | exception services | PLANNED | Non-waivable set (Q15) |
| Assign exception | M02 projection + resolve | PLANNED | Projection only |
| Submit Final Review | `submitPayPeriodReview` | PLANNED | Clerk submit; SoD |
| Export to Xero / Export Xero File | Generic CSV+JSON + export profiles | PLANNED + DEFERRED vendor | Q4 / Q22; Xero adapter later |
| Mark Reconciled | `recordExternalPayrollResult` | PLANNED | Export ≠ paid |
| Lock Pay Period | explicit Lock | PLANNED | Pay approver/admin only (Q20) |
| Reopen with Approval | ordinary unlock | REJECTED | Q6; prior-period adjustment instead |
| Process Final Pay | payment execution | REJECTED | Out of boundary |
| Record Over/Underpayment | prior-period adjustment lines | PLANNED | Prep only; non-payment |
| Generate Replacement Export | new export version | PLANNED | Retain prior package + profile version |
| Payroll advisor validation checkbox | Pay approver + audit | PLANNED (relabel) / REJECTED as certification | Not award certification |
| **Approve Location** | final approval + clinic readiness | **CONSOLIDATED** | Q21 — no location-approved state; control preserved |
| **Award Rules nested in Staff hub** | M07 Settings rule/code tables | **RELOCATED/CONSOLIDATED** | Q23 — not a missing M04 feature |
| Runtime list + Create + Export CSV only | current React = ModuleLanding stub | PARTIAL (prototype) / React **PLANNED** | Shell only today |

### 3.3 Explicit M07 REJECTED (Wave 6)

| Item | Reason |
|---|---|
| Store TFN / BSB / bank / super member / payment instructions | Q13 |
| Auto-lock after reconcile | Q17 |
| Ordinary unlock / reopen-as-unlock | Q6 |
| Multiple concurrent ordinary open periods | Q14 |
| Clerk waiver of blockers | Q15 |
| Waive cross-entity / doctor-M08 / stale approval / duplicate intake | Q15 |
| Xero-only domain model | Q4 — vendor adapter later |
| Count legacy HTML `staffpay` CRUD as IMPLEMENTED-EVIDENCED | Mount/simulation without Wave 6 services/evidence |
| Doctor pay inside M07 | M08 |
| Award/tax/super certification claims | Non-certified labels only |

### 3.4 M07 DEFERRED

| Item | Reason |
|---|---|
| Named Xero/vendor adapter | After canonical export |
| Doctor-pay override | Post–Wave 6 |
| Break-glass unlock | Separate owner approval |
| Broad real-world allowance catalogue | Q18 — small generic list only |
| Production persistence / SLA | Platform deferred |
| “Process Final Pay” as payroll execution | Out of product boundary |

### 3.5 Cross-module prototype links (M07-related)

| Link | Module | Status |
|---|---|---|
| Time exceptions block export | M06→M07 | PLANNED (via TimesheetRef / exceptions) |
| Offline reconciliation before clean timesheets | M06 | IMPLEMENTED-EVIDENCED (Wave 5) / M07 consume approved only |
| Approvals / Action Inbox payroll exception | M02 | PLANNED projections |
| Award rules under Staff | M04/M07 split | **RELOCATED** — M07 Settings owns prep rules; M04 classification SoT only (Q23) |
| Financial forecast labour line | M24 | DEFERRED |
| Doctor Pay adjacent | M08 | Out of M07 |

---

## 4. Module rollup (non-M07) — catalogue snapshot

| Module | Prototype routes (examples) | React / wave status summary |
|---|---|---|
| M01 | dashboard, analytics slices | PARTIAL / PLANNED polish |
| M02 | actionInbox, approvals | PARTIAL–EVIDENCED patterns in Waves 2–5 |
| M03 | settings, saas slices | PARTIAL |
| M04 | staff, doctors, hrDocs | IMPLEMENTED-EVIDENCED (Wave 2) + PARTIAL extras |
| M05 | roster | IMPLEMENTED-EVIDENCED (Wave 4) |
| M06 | timeclock, syncCentre | IMPLEMENTED-EVIDENCED (Wave 5) |
| M08 | doctorpay | PLANNED/DEFERRED (later wave) |
| M09–M24 | bbpip, training, tickets, inventory, incidents, comms, vendor, recruitment, websiteStudio, financialForecast, … | Mix of PARTIAL shells, DEFERRED, PLANNED per controlling architecture |

Detailed row expansion continues in the JSON companion for automation; markdown holds executive + M07-critical detail for the Wave 6 gate.

---

## 5. Premium Clinical Enterprise — design direction (planning only)

**Do not rewrite CSS in this checkpoint.**

### Principles

| Topic | Direction |
|---|---|
| Canvas | Light `#FBFBFA` |
| Primary text | Deep Slate with accessible contrast |
| Typography | Inter or existing approved minimalist sans |
| Chrome | Subtle borders; restrained ambient shadows |
| Decorative accent | Champagne/Gold `#C5A880` for executive emphasis only — **never** sole status cue |
| Positive accent | Deep Emerald where appropriate |
| Semantic status | Retain red / amber / green / blue / neutral |
| Density | Spacious for executive dashboards & landings; compact/comfortable controls for operational screens; dense tables for roster, attendance, payroll, staff, action inbox |
| Tokens | Future shared tokens for colour, type, space, radius, shadow — not per-module CSS forks |
| Responsive / a11y | Preserve; no information starvation via excessive whitespace |

### Prototype token note

v34 currently uses Inter and family accents (Finance `#b45309` / Staff Pay BP `#a16207`); `#C5A880` is **proposed** for the React design system, not yet present in the HTML file.

### Non-goals this checkpoint

- Global CSS rewrite  
- Module-specific visual forks  
- Reducing throughput of dense operational tables  

---

## 6. Wave 6 pre-execution gate checklist

- [x] Batch 1–3 owner decisions recorded in M07 plans  
- [x] Prototype parity register created  
- [x] M07 include / defer / reject mapped  
- [x] Design direction recorded without CSS rewrite  
- [ ] Owner review of parity + Batch 3  
- [ ] Explicit Wave 6 **execution** authorisation (separate)

**BLOCKED-M07 remains unresolved until M07 intake is implemented and evidenced.**
