# P1 Proposed Execution Batches

**Stamp:** **P1-B1**, **P1-B2**, **P1-B3**, **P1-B4** and **P1-B5** owner accepted with qualifications and **closed**. Accepted tips: P1-B1 `fdb2beb5b0e786e42d358efa9875b6bba52666cd`; P1-B2 `66f3f8d27803f5b8d24043639d21b9069f58e77a`; P1-B3 `2515a4ffac0fb94cbd37092e26bf372cb43898f8` (`P1-B3-OWNER-ACCEPT-2026-08-13`); P1-B4 `c58f2843d47b6fa875cd155d166c1f7c916d5250` (`P1-B4-OWNER-ACCEPT-2026-08-14`); P1-B5 `4306116fdf28f9d90a989d8ec78b317ad351b0d2` (`P1-B5-OWNER-ACCEPT-2026-08-17`). **OWN-P1-006** and **OWN-P1-007** closed 2026-08-13. **P1-B6–P1-B8** remain `P1 — PLANNED, NOT AUTHORISED`. Overall Programme P1 is **not** complete.
**Rule:** No batch auto-starts. Owner must still **expressly authorise** each later batch before coding; B6–B8 never auto-start (OWN-P1-002). P1-B5 acceptance does **not** authorise automatic progression.

## Batch index

| Batch | Objective | Gap IDs (primary) | Status |
| --- | --- | --- | --- |
| P1-B1 | SHARED Decision A shell foundation | 002, 003, 004, 010, 049, 051 | **Owner accepted with qualifications — CLOSED (2026-08-13)** |
| P1-B2 | Shell truthfulness / inactive controls / demo honesty | 005, 006, 007, 018*, 030*, 032, 071, 073 | **Owner accepted with qualifications — CLOSED (2026-08-13)** |
| P1-B3 | Register / navigation hygiene | 011, 012, 013, 014*, 015, 079 | **Owner accepted with qualifications — CLOSED (2026-08-13)** |
| P1-B4 | Responsive / a11y / appearance evidence | 008, 009, 031, 052, 074 | **Owner accepted with qualifications — CLOSED (2026-08-14)** |
| P1-B5 | M01/M02 Decision A presentation (no domain services) | 020, 021, 066, 067, 068* | **Owner accepted with qualifications — CLOSED (2026-08-17)** |
| P1-B6 | Accepted-module final-design apply (preserve domain) | 022–026, 050, 081 | `P1 — PLANNED, NOT AUTHORISED` |
| P1-B7 | Permission / state / report honesty completeness | 027–030, 028, 053* | `P1 — PLANNED, NOT AUTHORISED` |
| P1-B8 | P1 closure evidence + stop checkpoint | 010, 075, 076, 082 | `P1 — PLANNED, NOT AUTHORISED` |

\*Partial — honesty/labels only; durable domain remains P2+.

---

## P1-B1 — SHARED Decision A shell foundation

| Field | Value |
| --- | --- |
| Status | **Owner accepted with qualifications — CLOSED (2026-08-13)** |
| Accepted tip | `fdb2beb5b0e786e42d358efa9875b6bba52666cd` |
| Accepted scope | P1-B1 shared Decision A shell foundation only |
| Validation basis | Verified local tests, validators, build and visual harness |
| GitHub CI | None — not passed; local validation only |
| Objective | Establish tokenised Light/Dark/System shell + shared chrome primitives per design-system-contract and Decision A |
| Included gaps | 002, 003, 004, 010 (harness start), 049, 051 |
| Gap disposition | 002, 003, 049, 051 closed for B1; 004 partial (B4 residual); 010 partial / not closed (pixel-diff / P1 exit later) |
| Modules/screens | SHARED; reference surfaces `/dashboard`, `/action-inbox` |
| Dependencies | Owner clears P1-GAP-001 / 083; Decision A PNGs remain `66e6e64…` |
| Exact authorised changes (when named) | CSS variables/tokens; Sidebar/Topbar/ModuleSectionNav/PageHeader/Drawer primitives; shell dimensions; screenshot harness smoke |
| Prohibited | Domain services; M08–M24 rebuilds; PPA; payment; patient/clinical; theme Executive Blue/Medical Emerald; PR/merge |
| Expected files/areas | `src/components/shell/*`, `src/components/ui/*`, theme CSS, design-contract consumers, new shell tests |
| Required tests | Theme token; shell dimensions 1280/768/390; harness smoke |
| Browser widths / appearance | Contract viewports; Light, Dark, System |
| Role scenarios | Authenticated user sees chrome; role gating unchanged |
| Acceptance evidence | `docs/audits/p1/P1_B1_IMPLEMENTATION_EVIDENCE.md` (+ harness artefacts) |
| Rollback | Revert batch branch tip to pre-batch SHA |
| Entry gate | P0 accepted; batch named; tip clean; validators green |
| Exit gate | Named tests green; owner decision recorded with qualifications (2026-08-13) |
| Owner decision point | Accept B1 tip before B2 — **met with qualifications; B2 remains unauthorised** |
| Qualifications | No GitHub CI; pixel-diff deferred; Sarah/Neil → B2; `OWN-P1-016` open; no PR/merge/deploy; no automatic progression; not overall P1/production acceptance |

## P1-B2 — Shell truthfulness

| Field | Value |
| --- | --- |
| Status | **Owner accepted with qualifications — CLOSED (2026-08-13)** |
| Accepted tip | `66f3f8d27803f5b8d24043639d21b9069f58e77a` |
| Accepted branch | `cursor/p1-b2-shell-truthfulness` |
| Implementation sequence | `d425ada…` → `66f3f8d…` |
| Accepted scope | Shell truthfulness, inactive-control disposition, QA/demo gating and demo-identity consistency only |
| Validation basis | Verified local tests, validators, build and visual harness |
| GitHub CI | None — not passed; local validation only |
| Objective | Remove or truthfully label inactive/stub shell controls and demo surfaces |
| Included gaps | 005, 006, 007, 018 (labels), 030 (honesty), 032, 071, 073 (+ identity via OWN-P1-017) |
| Gap disposition | 005 closed (B2 truthfulness); 006 closed (accepted CC-only difference); 007 closed for honesty/non-op labels (domain P2+); 018/030 partial; 032/073 closed for B2 portions; 071 accepted for B2 demo/seed honesty with broader residuals preserved |
| Owner decisions (disposition) | **OWN-P1-004, OWN-P1-005, OWN-P1-008, OWN-P1-017 closed 2026-08-13**; batch closed by `P1-B2-OWNER-ACCEPT-2026-08-13` |
| Dependencies | P1-B1 closed; honesty dispositions recorded; express B2 authorisation met; owner acceptance **met** |
| Authorised changes (when named) | Copy, visibility, disablement, demo badges / QA gate, identity-chrome alignment — **no fake backends** |
| Prohibited | Implementing payment/export backends as silent scope; enabling emergency/auth as toast-success; MFA/IdP; SQL; PR/merge/deploy |
| Tests | Control labelling; no toast-as-success assertions; demo gate; identity chrome consistency |
| Entry gate | P1-B1 accepted; OWN-P1-004/005/008/017 closed; validators green; express owner authorisation of P1-B2 — met |
| Exit gate | Named honesty tests green; **owner accepts B2 tip** — **met (2026-08-13)** |
| Implementation evidence | [`../../audits/p1/P1_B2_IMPLEMENTATION_EVIDENCE.md`](../../audits/p1/P1_B2_IMPLEMENTATION_EVIDENCE.md) |
| Owner decision point | Accept B2 tip before B3 — **met with qualifications; B3 later closed separately by `P1-B3-OWNER-ACCEPT-2026-08-13`** |
| Qualifications | See `P1-B2-OWNER-ACCEPT-2026-08-13` (local-only validation; no CI; production-auth / export-backend / shell-wide multi-select / WCAG / pixel-parity / OWN-P1-016 / B3–B8 / PR-merge-deploy / automatic progression excluded) |

## P1-B3 — Register / navigation hygiene

| Field | Value |
| --- | --- |
| Status | **Owner accepted with qualifications — CLOSED (2026-08-13)** |
| Accepted tip | `2515a4ffac0fb94cbd37092e26bf372cb43898f8` |
| Accepted branch | `cursor/p1-b3-register-hygiene` |
| Acceptance reference | `P1-B3-OWNER-ACCEPT-2026-08-13` |
| Implementation sequence | `a80405dd…` (feat) → `2515a4ff…` (remediation; accepted tip) |
| Accepted scope | Register hygiene and payroll-history truthfulness only (OWN-P1-006 / OWN-P1-007) |
| Validation basis | Verified local tests, validators, build and visual harness |
| GitHub CI | None — not passed; local validation only |
| Objective | Align registers/badges with reality; prevent false “implemented” scoring |
| Included gaps | 011, 012, 013, 014 (SHARED subset), 015, 079 |
| Gap disposition | 011 closed (M11 register sync); 012 partial (History honesty closed; operational History Future/P2+); 013 closed (supersession banner; historic body preserved); 014 partial (SHARED honesty closed; bulk unresolved=298 → P2+); 015 partial (ModuleLanding honesty closed; placeholder builds Future); 079 partial (Adjustments honesty closed; OWN-P1-011 PPA product residual) |
| Authorised changes (accepted) | M11 `module-register` section/condition sync (`strong-existing`); M07 History planned honesty; M07 Adjustments honesty-only labels; ModuleLanding placeholder honesty; historic register supersession banner; SHARED mapping honesty note; focused tests/evidence |
| Prohibited | Domain workflow expansion; PPA product (OWN-P1-011); payment; M08; historical evidence rewrite; automatic progression to B4+; PR/merge/deploy; production approval |
| Tests | `test:p1-b3`; register validator; M11 section-list assertions; M07 honesty string tests |
| Owner decision | **OWN-P1-006** Option A and **OWN-P1-007** Option A — closed; batch closed by `P1-B3-OWNER-ACCEPT-2026-08-13` |
| Exit gate | Owner accepts B3 tip — **met with qualifications (2026-08-13)** |
| Owner decision point | Accept B3 tip before B4 — **met with qualifications; B4–B8 remain unauthorised** |
| Qualifications | See `P1-B3-OWNER-ACCEPT-2026-08-13` (local-only; no CI; no pixel/WCAG claims; `strong-existing` ≠ production; Wave 3 frozen; History planned; Adjustments preparation-only; unlock≠PPA; OWN-P1-011/016 open; bulk mapping P2+; historic MD trailing-space limitation; archived `a80405dd` retained; no production/PR/merge/deploy/automatic progression; not overall P1) |
| Evidence | `docs/audits/p1/P1_B3_IMPLEMENTATION_EVIDENCE.md`; `docs/audits/p1/P1_B3_REMEDIATION_EVIDENCE.md`; `docs/audits/p1/b3-register-hygiene/` |

## P1-B4 — Responsive / a11y / appearance evidence

| Field | Value |
| --- | --- |
| Status | **Owner accepted with qualifications — CLOSED (2026-08-14)** |
| Implementation branch | `cursor/p1-b4-responsive-a11y-appearance` |
| Accepted tip | `c58f2843d47b6fa875cd155d166c1f7c916d5250` |
| Source tip | `c5d919cc2921ab43949b37cad499e29a79cfa6b0` |
| Acceptance reference | `P1-B4-OWNER-ACCEPT-2026-08-14` |
| Objective | Harden shell a11y/keyboard/responsive/System appearance evidence |
| Included gaps | 008, 009, 031, 052, 074 |
| Gap disposition | 008/009/074 **Closed** (scoped); 031/052 **Partial** (tested P1 shell/shared surfaces closed; module-wide / platform-wide residuals retained) |
| Widths | 390, 430, 768, 1024, 1280, 1440 (+ contract list) |
| Appearance | Light / Dark / System+OS Light / System+OS Dark (four distinct states) |
| Owner-decision blocker | **None** for named B4 gaps (Owner clarification: No) |
| Authorisation briefing | [`P1_B4_OWNER_AUTHORISATION_BRIEFING.md`](./P1_B4_OWNER_AUTHORISATION_BRIEFING.md) |
| Implementation evidence | [`../../audits/p1/P1_B4_IMPLEMENTATION_EVIDENCE.md`](../../audits/p1/P1_B4_IMPLEMENTATION_EVIDENCE.md) |
| Qualifications | See `P1-B4-OWNER-ACCEPT-2026-08-14` (local-only; zero GitHub workflows/check-runs/statuses; no CI/WCAG/pixel claims; Chromium/Playwright primary; AT/cross-browser and full zoom certification outside; 24 parent-lineage lint warnings; CRLF `--check` noise; 031/052 residuals; M04/M05/M07 domain unchanged; OWN-P1-011/016 open; Aurora isolated; B5–B8 unauthorised; no PR/merge/deploy/automatic progression/production/overall P1) |
| Prohibited | Visual redesign unrelated to contract; Aurora integration; dependency upgrades; domain/PPA/payment/M08; PR/merge/deploy; automatic progression to B5 |
| Exit | **Met with qualifications** — owner acceptance recorded at accepted tip |

## P1-B5 — M01/M02 presentation parity

| Field | Value |
| --- | --- |
| Status | **Owner accepted with qualifications — CLOSED (2026-08-17)** |
| Implementation branch | `cursor/p1-b5-m01-m02-presentation` |
| Accepted tip | `4306116fdf28f9d90a989d8ec78b317ad351b0d2` |
| Source tip | `ef66e3fa9aadaa3507ccf16d07aac3cbc7b5c577` |
| Acceptance reference | `P1-B5-OWNER-ACCEPT-2026-08-17` |
| Objective | Apply Decision A chrome to M01/M02 **without** durable domain services |
| Included gaps | 020, 021, 066, 067, 068 (chrome) |
| Gap disposition | 020/021 **Closed** (accepted presentation scope); 066/067/068 **Partial** (M01/M02 presentation accepted; broader/cross-module and durable-notification residuals retained) |
| Domain status | M01/M02 remain **NOT-STARTED** |
| Authorisation briefing | [`P1_B5_OWNER_AUTHORISATION_BRIEFING.md`](./P1_B5_OWNER_AUTHORISATION_BRIEFING.md) |
| Implementation evidence | [`../../audits/p1/P1_B5_IMPLEMENTATION_EVIDENCE.md`](../../audits/p1/P1_B5_IMPLEMENTATION_EVIDENCE.md) |
| Owner-decision blocker | **None** for presentation-only B5 (OWN-P1-009 durable domain remains P2; OWN-P1-011/016 open but out of B5 product scope) |
| Qualifications | See `P1-B5-OWNER-ACCEPT-2026-08-17` (local-only; zero GitHub workflows/check-runs/statuses; no CI/WCAG/pixel claims; Chromium/Playwright primary; M01/M02 NOT-STARTED; unsupported route access-denied and true-empty residuals; Email/SMS planned/not live; OWN-P1-009/011/016 open; Aurora isolated; B6–B8 unauthorised; no PR/merge/deploy/automatic progression/production/overall P1) |
| Prohibited | Claiming domain complete; workflow dossier completion (P2); patient mock → real patient data; Aurora adoption; durable services; automatic progression to B6 |
| Exit | **Met with qualifications** — owner acceptance recorded at accepted tip; domain status remains NOT-STARTED |

## P1-B6 — Accepted modules design apply

| Field | Value |
| --- | --- |
| Status | `P1 — PLANNED, NOT AUTHORISED` |
| Objective | Apply shared final design to M04–M07/M11 presentation only |
| Included gaps | 022–026, 050, 081 |
| Authorisation briefing | [`P1_B6_OWNER_AUTHORISATION_BRIEFING.md`](./P1_B6_OWNER_AUTHORISATION_BRIEFING.md) — prepared only; **not** authorisation |
| Prohibited | Changing frozen domain SoT/permissions/events; PPA; payment; M08; Aurora adoption |
| Required tests | Focused regression per module wave suite; full suite must not regress; domain-equivalence report; restore any evidence JSON rewritten by tests |
| Exit | Owner accepts “presentation-only” tip; domain behaviour unchanged; GAP-081 equivalence evidence required |

## P1-B7 — States / permissions / report honesty

| Field | Value |
| --- | --- |
| Status | `P1 — PLANNED, NOT AUTHORISED` |
| Objective | Complete empty/loading/error/denied and permission UX on P1 surfaces; keep reports/export honest |
| Included gaps | 027–030, 028, 053 (honesty) |
| Role scenarios | Executive, operational, manager, restricted, auditor |
| Prohibited | New payment/PPA/patient capabilities |
| Exit | State matrix evidence + role matrix evidence |

## P1-B8 — Closure evidence pack

| Field | Value |
| --- | --- |
| Status | `P1 — PLANNED, NOT AUTHORISED` |
| Objective | Immutable SHA evidence, localhost handoff checklist, stop checkpoint for Programme P1 |
| Included gaps | 010 (close), 075, 076, 082 |
| Prohibited | Starting P2 automatically; rewriting P0 historical evidence |
| Exit | Owner acceptance of Programme P1 tip; explicit stop |

---

## Explicitly not batched under P1 implementation

| Work | Disposition |
| --- | --- |
| M01–M03 durable services/workflows | Programme P2 |
| M10 unblock/rebuild | Programme P3 |
| M08/M09/M12–M24 rebuilds | P4–P8 |
| PPA | Separate authorisation |
| M25 | Parked branch only |
| Payment execution | Excluded |

See also: [recommended first batch](./P1_RECOMMENDED_FIRST_BATCH.md) · [sequencing](./P1_DEPENDENCY_AND_SEQUENCING_PLAN.md)
