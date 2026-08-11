# P1A Existing vs Required Inventory

**Stamp:** `P1A — PLANNED, NOT AUTHORISED`
**Baseline tip:** `9142ec30b3b2efea1e959ad85ce1406562cd5faa`
**Access / planning date:** 2026-08-11

> Documentation and planning only. Does **not** authorise implementation, approve P1-B1, claim legal compliance, or claim security certification.

## Purpose

Map required master registers and pack outputs against artefacts that already exist, so P1A **extends** authoritative records instead of creating uncontrolled duplicates.

## Legend

| Status | Meaning |
| --- | --- |
| Exists (authoritative) | Reuse as SoT; P1A adds pointer/extension only |
| Partial | Exists but incomplete for delivery readiness |
| Conflict | Contradictory sources — owner-decision register |
| Absent | Must create under P1A (planning) |
| Superseded | Historical; do not treat as current SoT |

## Required master registers (20)

| # | Register | Existing artefact(s) | Inventory status | P1A action |
| ---: | --- | --- | --- | --- |
| 1 | Product scope / objectives / exclusions | `SCOPE_AND_SOURCE_OF_TRUTH_FIREWALL.md`; `P1_SCOPE_EXCLUSIONS.md`; wave-control | Partial | Extend → `P1A_03` + Reg 1 |
| 2 | Authoritative-source hierarchy | Firewall precedence; `P1_AUTHORITATIVE_SOURCE_REGISTER.md` | Partial | Formal hierarchy → `P1A_02` |
| 3 | Functional requirement register | `MASTER_BRD_PROTOTYPE_PRODUCTION_TRACEABILITY.*` (1982 rows); BRD JSON | Partial | Index + completeness → Reg 3 |
| 4 | Module and screen register | `CANONICAL_SCREEN_REGISTER.*` (194); `module-register.ts` (24); re-audit | Exists (authoritative) | Pointer + definition gaps |
| 5 | Action and control register | `WORKFLOW_AND_ACTION_REGISTER.*` (807); productionControls=28 | Exists (authoritative) | Pointer + honesty gaps |
| 6 | Workflow / state-transition register | WAR + `WAVE6_M07_WORKFLOW_CATALOGUE.md` + prototype-workflows | Partial | Specs for material workflows |
| 7 | Business-rule catalogue | BRD business rules (109); wave rule tables (qualified) | Partial | Catalogue index + DEF-GAPs |
| 8 | Role / permission / SoD | `WAVE6_M07_PERMISSIONS_MATRIX.md`; module `permissions.ts`; `role-access.json` | Partial | Platform matrix + enforcement model |
| 9 | Data dictionary / classification | field-schemas; M07 entity docs; AUTH migration plan | Partial | Dictionary + sensitivity |
| 10 | Integration / SoR catalogue | `CROSS_MODULE_OWNERSHIP_AND_CONNECTION_MAP.*`; M07 integration boundary | Partial | SoR catalogue + prohibitions |
| 11 | Privacy / consent / retention / deletion / audit | Firewall seed rules; wave audit evidence | Partial / Absent measurable | Baseline + DEF-GAPs |
| 12 | Security / threat-control | Wave authz tests; AUTH plan; no ASVS matrix | Partial / Absent | Threat-control map (unapproved) |
| 13 | Non-functional requirements | Design contract a11y/viewports; wave performance evidence | Partial | Measurable NFR set |
| 14 | Design system / components | `FINAL_DESIGN_SYSTEM_CONTRACT.md` + JSON; UI primitives | Exists (partial apply) | Catalogue + upgrade audit |
| 15 | Loading / empty / error / exceptional states | GLOBAL acceptance; UxStateDemo patterns | Partial | State catalogue |
| 16 | Reporting / KPI definitions | BRD reports; M01 KPI UI (demo); M07 reports | Partial | Definitions + honesty |
| 17 | Test / acceptance evidence | `GLOBAL_ACCEPTANCE_TEST_DESIGN.md`; wave evidence; P1B test plan | Partial | Master evidence register |
| 18 | Environment / deployment / ops | AUTH plan; Next.js stack notes; no prod deploy auth | Partial | Ops architecture (planned) |
| 19 | Migration / configuration / onboarding | `AUTH_PROVISIONING_MIGRATION_PLAN.md` | Partial | Clinic onboarding plan |
| 20 | Risks / assumptions / dependencies / decisions | P1B risk + owner registers; CONFLICT register open=0 | Partial | Extend with P1A decisions |

## Required additional content

| Content | Existing | P1A location |
| --- | --- | --- |
| Workflow specs (material) | WAR dossiers; M07 catalogue | `P1A_08` |
| Data architecture | AUTH plan; module repos; firewall | `P1A_08` |
| Permissions enforcement model | module authz tests (M05/M06/M07); PermissionGuard | `P1A_09` |
| Measurable NFRs | Partial contract | `P1A_09` |
| Privacy/security baseline (APP/NDB/E8/ASVS/WCAG) | Absent as consolidated | `P1A_09` |
| Design/UX upgrade audit (20 dims) | P1B heat map | `P1A_10` |
| Build-ready design spec system | Design contract | `P1A_10` |
| Commercial/tenancy readiness | M20 SaaS placeholder; AUTH tenancy notes | `P1A_11` |
| AI governance | No authorised AI product features found | `P1A_11` |
| Test-data governance | Firewall seed prohibition | `P1A_11` |
| Delivery control (DoR/DoD/gates) | P1B batch gates; GLOBAL design | `P1A_11` |
| P1B reconciliation (83/8) | P1B pack | `P1A_12` |
| Master roadmap (14 phases) | Dependency-led P0–P9 roadmap | `P1A_13` |

## Existing P1B files (must preserve — all 14)

1. `../README.md`  
2. `../P1_EXECUTIVE_SUMMARY.md`  
3. `../P1_AUTHORITATIVE_SOURCE_REGISTER.md`  
4. `../P1_PROTOTYPE_PARITY_GAP_REGISTER.md`  
5. `../P1_MODULE_PARITY_MATRIX.md`  
6. `../P1_EXECUTION_BATCHES.md`  
7. `../P1_DEPENDENCY_AND_SEQUENCING_PLAN.md`  
8. `../P1_RISK_AND_ASSUMPTION_REGISTER.md`  
9. `../P1_OWNER_DECISION_REGISTER.md`  
10. `../P1_TEST_AND_ACCEPTANCE_EVIDENCE_PLAN.md`  
11. `../P1_SCOPE_EXCLUSIONS.md`  
12. `../P1_RECOMMENDED_FIRST_BATCH.md`  
13. `../P1_GAP_TRACEABILITY.md`  
14. `../P1_BASELINE_GATE_EVIDENCE.md`  

## Conflicts detected (do not silently resolve)

| Conflict ID | Sources | Owner decision |
| --- | --- | --- |
| CONF-P1A-001 | `prompts/p1.md` SHARED-only vs P1B B1–B8 breadth | OWN-P1-002 / P1-GAP-083 |
| CONF-P1A-002 | Nested P0 pins (`b1152d3`/`e659dfc`) vs programme-reset tip `b0c4c4d20de1cce7adac5d691c506122e30610a2` | Document layered pins; owner accepts pack |
| CONF-P1A-003 | Historic `HCDP_PROTOTYPE_PARITY_REGISTER.md` stub claims vs `CURRENT_IMPLEMENTATION_REAUDIT.*` | Prefer re-audit (P1-GAP-013) |
| CONF-P1A-004 | Path alias `Development folder/docs/plans/…` vs worktree `docs/plans/…` | Prefer worktree path |
| CONF-P1A-005 | UI Batch1 residual tsc/lint debt claims vs tip `9142ec30b3b2efea1e959ad85ce1406562cd5faa` clean tsc | Prefer re-verified tip |
