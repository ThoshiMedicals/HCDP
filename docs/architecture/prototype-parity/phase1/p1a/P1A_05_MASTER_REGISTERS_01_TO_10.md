# P1A Master Registers 1–10

**Stamp:** `P1A — PLANNED, NOT AUTHORISED`
**Baseline tip:** `9142ec30b3b2efea1e959ad85ce1406562cd5faa`
**Access / planning date:** 2026-08-11

> Documentation and planning only. Does **not** authorise implementation, approve P1-B1, claim legal compliance, or claim security certification.

## How to use

These registers **reuse** existing authoritative artefacts. New IDs are only for P1A definition gaps / extensions. Do not treat this markdown as a second conflicting SoT for screens/actions already in JSON registers.

---

## Register 1 — Product scope / objectives / exclusions

**Authoritative detail:** [P1A_03_PRODUCT_SCOPE_AND_EXCLUSIONS.md](./P1A_03_PRODUCT_SCOPE_AND_EXCLUSIONS.md) · [`../P1_SCOPE_EXCLUSIONS.md`](../P1_SCOPE_EXCLUSIONS.md) · firewall  
**Completeness:** Complete but unapproved (planning consolidation)  
**Stamp:** `P1A — PLANNED, NOT AUTHORISED`

---

## Register 2 — Authoritative-source hierarchy

**Authoritative detail:** [P1A_02_AUTHORITATIVE_SOURCE_HIERARCHY.md](./P1A_02_AUTHORITATIVE_SOURCE_HIERARCHY.md)  
**Completeness:** Complete but unapproved  
**Stamp:** `P1A — PLANNED, NOT AUTHORISED`

---

## Register 3 — Functional requirement register

| Field | Value |
| --- | --- |
| Authoritative bulk SoT | `MASTER_BRD_PROTOTYPE_PRODUCTION_TRACEABILITY.md/.json/.csv` (1982 rows) |
| Supporting | `brd-modules.json`, `module-blueprints.json`, `field-schemas.json` |
| Disposition vocabulary | ADOPTED-AS-IS · ADOPTED-WITH-CONTROL-HARDENING · DEFERRED-BY-DEPENDENCY · EXCLUDED-BY-PRODUCT-BOUNDARY · … |
| Completeness | Partially defined (bulk exists; many deferred/not implemented) |
| P1A extension | Definition gaps DEF-GAP-001+; no rewrite of historical rows |

### Functional themes (index — not a new duplicate inventory)

| Theme | Modules | Definition status |
| --- | --- | --- |
| Command centre / inbox / org access | M01–M03 | UI accepted; domain NOT-STARTED |
| Workforce core | M04–M06 | Domain FC (frozen, not prod) |
| Staff pay prep | M07 | Ordinary prep closed w/ quals; PPA separate |
| Training | M11 | Domain FC (frozen); register stale |
| Placeholder rebuilds | M08–M10, M12–M24 | Future waves |
| SHARED shell | SHARED | Programme P1 candidate |

---

## Register 4 — Module and screen register

| Field | Value |
| --- | --- |
| Modules SoT | `src/platform/module-registry/module-register.ts` — **24** modules (M01–M24); M25 absent |
| Screens SoT | `CANONICAL_SCREEN_REGISTER.*` — **194** |
| Status SoT | `CURRENT_IMPLEMENTATION_REAUDIT.*` |
| Parity matrix | [`../P1_MODULE_PARITY_MATRIX.md`](../P1_MODULE_PARITY_MATRIX.md) |
| Completeness | Exists (authoritative) with stale M11 metadata (P1-GAP-011) |

### Runtime modules (24)

M01 executive-command-centre · M02 action-inbox · M03 organisation-access · M04 staff-doctors · M05 roster · M06 time-attendance · M07 staff-pay · M08 doctor-pay · M09 bbpip · M10 tasks-actions · M11 training · M12 compliance-quality · M13 documents-policies · M14 ticketing · M15 inventory-assets · M16 incidents-risk · M17 communications · M18 digital-ops · M19 analytics · M20 saas · M21 vendor-console · M22 recruitment · M23 website-studio · M24 financial-forecast  

Placeholder shell modules (16): M08–M10, M12–M24.

---

## Register 5 — Action and control register

| Field | Value |
| --- | --- |
| SoT | `WORKFLOW_AND_ACTION_REGISTER.*` — **807** items with source locations |
| Genuine production controls | **28** (after false-positive removal) |
| Completeness | Exists; honesty gaps on inactive/toast controls |

P1A does **not** duplicate the 807-row JSON. Extensions are honesty/definition gaps only (P1-GAP-005/018/030/032).

---

## Register 6 — Workflow and state-transition register

| Field | Value |
| --- | --- |
| Cross-module SoT | WAR workflow dossiers + `prototype-workflows.json` |
| M07 specialised | `docs/architecture/WAVE6_M07_WORKFLOW_CATALOGUE.md` |
| Material workflow specs | [P1A_08_WORKFLOW_SPECS_AND_DATA_ARCHITECTURE.md](./P1A_08_WORKFLOW_SPECS_AND_DATA_ARCHITECTURE.md) |
| Completeness | Partial — many workflows NONE/P2 |

---

## Register 7 — Business-rule catalogue

| Field | Value |
| --- | --- |
| Extracted BRD rules | 109 (`ACCOUNTING_SUMMARY.extractionTotals.brdBusinessRules`) |
| Frozen wave rules | M04–M07/M11 qualified rule tables / services |
| Completeness | Partial; non-accepted modules Future (P1-GAP-070) |
| Certification | **No** award/tax/super/employment-law certification claimed |

Catalogue rule: every implemented mutate path must cite rule ID or `UNRESOLVED-PROPOSAL`.

---

## Register 8 — Role / permission / SoD matrix

| Field | Value |
| --- | --- |
| Classification model | `accessClassification` (executive / operational / manager / …) on module register |
| M07 SoD | `WAVE6_M07_PERMISSIONS_MATRIX.md` (planning + implemented codes in module) |
| Module enforcement | `permissions.ts` + `m05/m06/m07-authz.test.ts` (and M11 permissions) |
| UI guard | `PermissionGuard.tsx` — **insufficient alone** |
| Platform-wide SoD | Partially defined — DEF-GAP-008 |
| Detail | [P1A_09_PERMISSIONS_NFR_PRIVACY_SECURITY.md](./P1A_09_PERMISSIONS_NFR_PRIVACY_SECURITY.md) |

---

## Register 9 — Data dictionary / classification / ownership

| Field | Value |
| --- | --- |
| Field schemas | `src/lib/extracted/field-schemas.json` (+ related) |
| Auth/tenancy entities | `AUTH_PROVISIONING_MIGRATION_PLAN.md` |
| Sensitivity classes (P1A proposed) | PUBLIC · INTERNAL · STAFF-PII · SENSITIVE-HR · FINANCIAL-PREP · PROHIBITED-CLINICAL |
| Completeness | Partial — DEF-GAP-009 |
| Detail | [P1A_08_WORKFLOW_SPECS_AND_DATA_ARCHITECTURE.md](./P1A_08_WORKFLOW_SPECS_AND_DATA_ARCHITECTURE.md) |

**Prohibited clinical duplication** is a first-class classification: entities that would store patient clinical SoR are out of product boundary.

---

## Register 10 — Integration and SoR catalogue

| System / SoR | Boundary | Notes |
| --- | --- | --- |
| Doctors Pulse (this app) | Operational workforce SoT for in-scope modules | Not clinical SoT |
| Best Practice / clinical PAS | External clinical SoR | Integration refs only; no patient-record duplication |
| External payroll / bank / STP / Xero | External pay execution SoR | M07 prepares/export packages only; no mark-as-paid |
| Identity provider (future) | External auth subject | AUTH plan: `auth_identity_id`; demo Act-as today |
| Cross-module Pulse contracts | Event/adapter contracts | No cross-module repository imports |

Authoritative maps: `CROSS_MODULE_OWNERSHIP_AND_CONNECTION_MAP.*`; `WAVE6_M07_INTEGRATION_BOUNDARY_MAP.md`.
